import { IDriverConfigRepository } from '../repositories/IDriverConfigRepository';
import { IFixedCostRepository } from '../repositories/IFixedCostRepository';
import { IDailySummaryRepository } from '../repositories/IDailySummaryRepository';
import { Money } from '../value-objects/Money';
import { DriverProfile } from '../enums';

export interface CalculateBreakevenInput {
  userId: string;
  referenceDate: Date;
}

export interface CalculateBreakevenOutput {
  profile: DriverProfile;
  weeklyFixedCosts: number;
  weeklyVariableCosts: number;
  weeklyTotalCosts: number;
  weeklyEarnings: number;
  weeklyProfit: number;
  remainingToBreakeven: number;
  daysLeft: number;
  dailyTargetToBreakeven: number;
  message: string;
}

/**
 * Use Case: CalculateBreakeven
 * Calcula quanto falta para "fechar a semana no zero"
 * Considera perfil do motorista e custos fixos/variáveis
 * 
 * "Para fechar a semana no zero a zero, você precisa rodar R$ 178 por dia daqui até domingo."
 */
export class CalculateBreakeven {
  constructor(
    private readonly driverConfigRepo: IDriverConfigRepository,
    private readonly fixedCostRepo: IFixedCostRepository,
    private readonly dailySummaryRepo: IDailySummaryRepository
  ) {}

  async execute(input: CalculateBreakevenInput): Promise<CalculateBreakevenOutput> {
    // Validações
    if (!input.userId) {
      throw new Error('User ID is required');
    }

    if (!input.date) {
      throw new Error('Reference date is required');
    }

    // Buscar config do motorista
    const config = await this.driverConfigRepo.findByUserId(input.userId);
    if (!config) {
      throw new Error('Driver config not found');
    }

    // Calcular início da semana (domingo)
    const startOfWeek = this.getStartOfWeek(input.referenceDate);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(endOfWeek.getDate() + 6);

    // Buscar custos fixos ativos
    const fixedCosts = await this.fixedCostRepo.findActiveByUserId(input.userId);
    
    // Somar custos fixos semanais
    let weeklyFixedCosts = 0;
    for (const cost of fixedCosts) {
      weeklyFixedCosts += cost.toWeeklyAmount().value;
    }

    // Adicionar depreciação se tiver carro próprio
    if (
      config.profile === DriverProfile.OWN_PAID ||
      config.profile === DriverProfile.OWN_FINANCED ||
      config.profile === DriverProfile.HYBRID
    ) {
      const depreciation = config.calculateWeeklyDepreciation();
      if (depreciation) {
        weeklyFixedCosts += depreciation.value;
      }
    }

    // Buscar ganhos e gastos da semana até agora
    const totalProfit = await this.dailySummaryRepo.getTotalProfitByUserAndDateRange(
      input.userId,
      startOfWeek,
      input.referenceDate
    );

    const summaries = await this.dailySummaryRepo.findByUserAndDateRange(
      input.userId,
      startOfWeek,
      input.referenceDate
    );

    const weeklyEarnings = summaries.reduce((sum, s) => sum + s.earnings.value, 0);
    const weeklyVariableCosts = summaries.reduce((sum, s) => sum + s.expenses.value, 0);

    // Calcular quanto falta
    const weeklyTotalCosts = weeklyFixedCosts + weeklyVariableCosts;
    const weeklyProfit = weeklyEarnings - weeklyTotalCosts;
    const remainingToBreakeven = weeklyTotalCosts - weeklyEarnings;

    // Calcular dias restantes até domingo
    const today = input.referenceDate.getDay();
    const daysLeft = today === 0 ? 0 : 7 - today;

    // Calcular quanto precisa fazer por dia
    const dailyTargetToBreakeven = daysLeft > 0 ? remainingToBreakeven / daysLeft : 0;

    // Gerar mensagem personalizada
    let message = '';
    if (remainingToBreakeven <= 0) {
      message = `🎉 Parabéns! Você já fechou a semana no positivo com R$ ${Math.abs(weeklyProfit).toFixed(2)}!`;
    } else if (daysLeft === 0) {
      message = `Hoje é domingo! Você fechou a semana com ${weeklyProfit >= 0 ? 'lucro' : 'prejuízo'} de R$ ${Math.abs(weeklyProfit).toFixed(2)}.`;
    } else {
      const dailyFormatted = Money.create(dailyTargetToBreakeven).toString();
      message = `Para fechar a semana no zero a zero, você precisa rodar ${dailyFormatted} por dia daqui até domingo (${daysLeft} dias).`;
    }

    return {
      profile: config.profile,
      weeklyFixedCosts,
      weeklyVariableCosts,
      weeklyTotalCosts,
      weeklyEarnings,
      weeklyProfit,
      remainingToBreakeven: Math.max(0, remainingToBreakeven),
      daysLeft,
      dailyTargetToBreakeven: Math.max(0, dailyTargetToBreakeven),
      message,
    };
  }

  private getStartOfWeek(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day; // domingo = 0
    return new Date(d.setDate(diff));
  }
}

