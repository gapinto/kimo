import { Router, Request, Response } from 'express';
import { supabase } from '../../database/supabase.client';
import { SupabaseUserRepository } from '../../database/repositories/SupabaseUserRepository';
import { SupabaseDriverConfigRepository } from '../../database/repositories/SupabaseDriverConfigRepository';
import { SupabaseTripRepository } from '../../database/repositories/SupabaseTripRepository';
import { SupabaseExpenseRepository } from '../../database/repositories/SupabaseExpenseRepository';
import { SupabaseDailySummaryRepository } from '../../database/repositories/SupabaseDailySummaryRepository';
import { AppError } from '../../../shared/errors/AppError';
import { logger } from '../../../shared/utils/logger';
import { Phone } from '../../../domain/value-objects/Phone';
import { Money } from '../../../domain/value-objects/Money';

/**
 * Rotas da API Mobile (Flutter App)
 * Endpoints para o app de overlay consumir
 */

export function createMobileRoutes(): Router {
  const router = Router();

  const userRepository = new SupabaseUserRepository(supabase);
  const driverConfigRepository = new SupabaseDriverConfigRepository(supabase);
  const tripRepository = new SupabaseTripRepository(supabase);
  const expenseRepository = new SupabaseExpenseRepository(supabase);
  const dailySummaryRepository = new SupabaseDailySummaryRepository(supabase);

  /**
   * POST /api/mobile/auth
   * Autentica usuário pelo telefone
   * Body: { phone: string }
   * Response: { userId: string, name: string, hasConfig: boolean }
   */
  router.post('/auth', async (req: Request, res: Response) => {
    try {
      const { phone } = req.body;

      if (!phone) {
        throw new AppError('Phone is required', 400, 'MISSING_PHONE');
      }

      const phoneObj = Phone.create(phone);
      const user = await userRepository.findByPhone(phoneObj);

      if (!user) {
        throw new AppError('User not found. Please complete onboarding on WhatsApp first.', 404, 'USER_NOT_FOUND');
      }

      const config = await driverConfigRepository.findByUserId(user.id);

      res.json({
        userId: user.id,
        name: user.name || 'Motorista',
        phone: user.phone.value,
        hasConfig: !!config,
        isActive: user.isActive,
      });
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Error authenticating user', error);
      throw new AppError('Failed to authenticate', 500, 'AUTH_ERROR');
    }
  });

  /**
   * GET /api/mobile/criteria/:userId
   * Retorna critérios de aceitação do motorista
   * Response: { minValue, minValuePerKm, maxKm, dailyGoal, todayEarnings }
   */
  router.get('/criteria/:userId', async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;

      const config = await driverConfigRepository.findByUserId(userId);
      if (!config) {
        throw new AppError('Driver config not found', 404, 'CONFIG_NOT_FOUND');
      }

      // Buscar resumo de hoje
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const summary = await dailySummaryRepository.findByUserAndDate(userId, today);

      // Calcular meta diária baseada na configuração
      const avgDailyEarnings = config.avgKmPerDay * 3.5; // estimativa: R$ 3.50/km
      const dailyGoal = Math.round(avgDailyEarnings);

      res.json({
        // Critérios configurados (ou defaults)
        minValue: config.acceptanceCriteria?.minValue || 15,
        minValuePerKm: config.acceptanceCriteria?.minValuePerKm || 1.5,
        maxKm: config.acceptanceCriteria?.maxKm || 20,
        peakHourMinValuePerKm: config.acceptanceCriteria?.peakHourMinValuePerKm || 1.2,
        
        // Meta e progresso
        dailyGoal,
        todayEarnings: summary?.totalEarnings.value || 0,
        todayTrips: summary?.tripsCount || 0,
        todayKm: summary?.km || 0,
        
        // Config do motorista
        fuelConsumption: config.fuelConsumption,
        avgFuelPrice: config.avgFuelPrice.value,
      });
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Error fetching criteria', error);
      throw new AppError('Failed to fetch criteria', 500, 'FETCH_ERROR');
    }
  });

  /**
   * POST /api/mobile/analyze
   * Analisa uma corrida e retorna recomendação
   * Body: { userId: string, value: number, km: number }
   * Response: { decision: 'accept'|'reject'|'neutral', valuePerKm, reason, details }
   */
  router.post('/analyze', async (req: Request, res: Response) => {
    try {
      const { userId, value, km } = req.body;

      if (!userId || !value || !km) {
        throw new AppError('userId, value and km are required', 400, 'MISSING_FIELDS');
      }

      const config = await driverConfigRepository.findByUserId(userId);
      if (!config) {
        throw new AppError('Driver config not found', 404, 'CONFIG_NOT_FOUND');
      }

      const criteria = {
        minValue: config.acceptanceCriteria?.minValue || 15,
        minValuePerKm: config.acceptanceCriteria?.minValuePerKm || 1.5,
        maxKm: config.acceptanceCriteria?.maxKm || 20,
      };

      const valuePerKm = value / km;

      // Calcular custos estimados
      const fuelCostPerKm = config.avgFuelPrice.value / config.fuelConsumption;
      const maintenanceCostPerKm = 0.15; // R$ 0.15/km
      const totalCostPerKm = fuelCostPerKm + maintenanceCostPerKm;
      const estimatedCost = totalCostPerKm * km;
      const estimatedProfit = value - estimatedCost;
      const profitPerKm = estimatedProfit / km;

      // Decidir
      let decision: 'accept' | 'reject' | 'neutral';
      let reason: string;

      if (value < criteria.minValue) {
        decision = 'reject';
        reason = `Valor muito baixo (mínimo R$ ${criteria.minValue})`;
      } else if (km > criteria.maxKm) {
        decision = 'reject';
        reason = `Distância muito longa (máximo ${criteria.maxKm} km)`;
      } else if (valuePerKm < criteria.minValuePerKm) {
        decision = 'reject';
        reason = `R$/km abaixo do mínimo (R$ ${criteria.minValuePerKm}/km)`;
      } else if (profitPerKm < 1.0) {
        decision = 'neutral';
        reason = `Lucro baixo (R$ ${profitPerKm.toFixed(2)}/km)`;
      } else {
        decision = 'accept';
        reason = `Ótima corrida! Lucro de R$ ${profitPerKm.toFixed(2)}/km`;
      }

      res.json({
        decision,
        valuePerKm: parseFloat(valuePerKm.toFixed(2)),
        profitPerKm: parseFloat(profitPerKm.toFixed(2)),
        reason,
        details: {
          value,
          km,
          estimatedCost: parseFloat(estimatedCost.toFixed(2)),
          estimatedProfit: parseFloat(estimatedProfit.toFixed(2)),
          fuelCost: parseFloat((fuelCostPerKm * km).toFixed(2)),
          maintenanceCost: parseFloat((maintenanceCostPerKm * km).toFixed(2)),
        },
      });
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Error analyzing ride', error);
      throw new AppError('Failed to analyze ride', 500, 'ANALYZE_ERROR');
    }
  });

  /**
   * POST /api/mobile/decision
   * Registra decisão do motorista (aceitar/rejeitar corrida)
   * Body: { userId: string, value: number, km: number, accepted: boolean, fuel?: number }
   * Response: { success: boolean }
   */
  router.post('/decision', async (req: Request, res: Response) => {
    try {
      const { userId, value, km, accepted, fuel } = req.body;

      if (!userId || value === undefined || km === undefined || accepted === undefined) {
        throw new AppError('userId, value, km and accepted are required', 400, 'MISSING_FIELDS');
      }

      const user = await userRepository.findById(userId);
      if (!user) {
        throw new AppError('User not found', 404, 'USER_NOT_FOUND');
      }

      if (accepted) {
        // Criar PendingTrip (será finalizado quando o motorista enviar "ok" no WhatsApp)
        const PendingTrip = (await import('../../../domain/entities/PendingTrip')).PendingTrip;
        const SupabasePendingTripRepository = (await import('../../database/repositories/SupabasePendingTripRepository')).SupabasePendingTripRepository;
        
        const pendingTripRepository = new SupabasePendingTripRepository(supabase);
        
        const pendingTrip = PendingTrip.create({
          userId,
          earnings: Money.create(value),
          km,
          fuel: fuel ? Money.create(fuel) : undefined,
          estimatedDuration: Math.round(km * 3), // ~3 min por km
        });

        await pendingTripRepository.save(pendingTrip);

        logger.info('Ride accepted via mobile app', { userId, value, km, fuel });
      } else {
        // Registrar rejeição para análise de padrões (futuro)
        logger.info('Ride rejected via mobile app', { userId, value, km });
      }

      res.json({ success: true });
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Error registering decision', error);
      throw new AppError('Failed to register decision', 500, 'DECISION_ERROR');
    }
  });

  /**
   * GET /api/mobile/stats/:userId
   * Retorna estatísticas do dia/semana
   * Response: { today, week, patterns }
   */
  router.get('/stats/:userId', async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;

      // Stats de hoje
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todaySummary = await dailySummaryRepository.findByUserAndDate(userId, today);

      // Stats da semana (últimos 7 dias)
      const weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 7);
      const trips = await tripRepository.findByUserAndDateRange(userId, weekAgo, today);

      const weekEarnings = trips.reduce((sum, trip) => sum + trip.earnings.value, 0);
      const weekKm = trips.reduce((sum, trip) => sum + trip.km, 0);
      const weekTrips = trips.length;

      res.json({
        today: {
          earnings: todaySummary?.totalEarnings.value || 0,
          expenses: todaySummary?.totalExpenses.value || 0,
          profit: todaySummary?.profit.value || 0,
          km: todaySummary?.km || 0,
          trips: todaySummary?.tripsCount || 0,
        },
        week: {
          earnings: weekEarnings,
          km: weekKm,
          trips: weekTrips,
          avgPerTrip: weekTrips > 0 ? weekEarnings / weekTrips : 0,
          avgPerKm: weekKm > 0 ? weekEarnings / weekKm : 0,
        },
      });
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Error fetching stats', error);
      throw new AppError('Failed to fetch stats', 500, 'STATS_ERROR');
    }
  });

  return router;
}

