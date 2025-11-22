import { IDriverConfigRepository } from '../repositories/IDriverConfigRepository';
import { IFixedCostRepository } from '../repositories/IFixedCostRepository';
import { ITripRepository } from '../repositories/ITripRepository';
import { IExpenseRepository } from '../repositories/IExpenseRepository';
import { DriverProfile } from '../enums';

export interface GetInsightsInput {
  userId: string;
  date: Date;
}

export interface GetInsightsOutput {
  profile: DriverProfile;
  insights: string[];
  warnings: string[];
  tips: string[];
  metrics: {
    fuelCostPerKm: number;
    averageEarningsPerHour: number;
    profitMargin: number;
    weeklyDepreciation?: number;
  };
}

/**
 * Use Case: GetInsights
 * Gera insights inteligentes baseados no perfil do motorista
 * 
 * Exemplos:
 * - "Essa semana sua depreciação estimada foi de R$ 112."
 * - "Hoje você economizou R$ 41 otimizando combustível."
 * - "Se você rodasse assim todo dia, economizaria R$ 820 no mês."
 */
export class GetInsights {
  constructor(
    private readonly driverConfigRepo: IDriverConfigRepository,
    private readonly fixedCostRepo: IFixedCostRepository,
    private readonly tripRepo: ITripRepository,
    private readonly expenseRepo: IExpenseRepository
  ) {}

  async execute(input: GetInsightsInput): Promise<GetInsightsOutput> {
    // Buscar config
    const config = await this.driverConfigRepo.findByUserId(input.userId);
    if (!config) {
      throw new Error('Driver config not found');
    }

    const insights: string[] = [];
    const warnings: string[] = [];
    const tips: string[] = [];

    // Buscar dados do dia
    const totalEarnings = await this.tripRepo.getTotalEarningsByUserAndDate(
      input.userId,
      input.date
    );

    const totalKm = await this.tripRepo.getTotalKmByUserAndDate(input.userId, input.date);

    const totalExpenses = await this.expenseRepo.getTotalExpensesByUserAndDate(
      input.userId,
      input.date
    );

    const fuelExpenses = await this.expenseRepo.getTotalFuelExpensesByUserAndDate(
      input.userId,
      input.date
    );

    // Calcular métricas
    const fuelCostPerKm = config.calculateFuelCostPerKm().value;
    const actualFuelCostPerKm = totalKm > 0 ? fuelExpenses / totalKm : 0;

    // Insight 1: Comparar custo real vs esperado de combustível
    if (actualFuelCostPerKm > 0) {
      const diff = (actualFuelCostPerKm - fuelCostPerKm) * totalKm;
      if (diff < -5) {
        insights.push(
          `💰 Hoje você economizou R$ ${Math.abs(diff).toFixed(2)} otimizando onde abastecer!`
        );
        tips.push(
          `Se você economizasse assim todo dia, guardaria R$ ${(Math.abs(diff) * 30).toFixed(2)} no mês.`
        );
      } else if (diff > 5) {
        warnings.push(
          `⚠️ Você gastou R$ ${diff.toFixed(2)} a mais do que o esperado com combustível hoje.`
        );
        tips.push(`Dica: Procure postos mais baratos na região.`);
      }
    }

    // Insight 2: Depreciação (carro próprio)
    if (
      config.profile === DriverProfile.OWN_PAID ||
      config.profile === DriverProfile.OWN_FINANCED
    ) {
      const weeklyDepreciation = config.calculateWeeklyDepreciation();
      if (weeklyDepreciation) {
        insights.push(
          `📉 Essa semana sua depreciação estimada é de ${weeklyDepreciation.toString()}.`
        );
      }
    }

    // Insight 3: Custo por KM para carro próprio
    if (config.profile !== DriverProfile.RENTED && totalKm > 0) {
      const costPerKm = totalExpenses / totalKm;
      insights.push(`💸 Seu custo por KM hoje foi de R$ ${costPerKm.toFixed(2)}.`);
    }

    // Insight 4: Aluguel x ganho (carro alugado)
    if (config.profile === DriverProfile.RENTED) {
      const rentalCosts = await this.fixedCostRepo.findActiveByUserId(input.userId);
      const weeklyRental = rentalCosts
        .filter((c) => c.type === 'rental')
        .reduce((sum, c) => sum + c.toWeeklyAmount().value, 0);

      if (weeklyRental > 0) {
        const dailyRental = weeklyRental / 7;
        const dailyProfit = totalEarnings - totalExpenses - dailyRental;

        if (dailyProfit > 0) {
          insights.push(
            `✅ Hoje você cobriu o aluguel (R$ ${dailyRental.toFixed(2)}) e lucrou R$ ${dailyProfit.toFixed(2)}!`
          );
        } else {
          warnings.push(
            `⚠️ Você ainda não cobriu o aluguel de hoje (faltam R$ ${Math.abs(dailyProfit).toFixed(2)}).`
          );
        }
      }
    }

    // Métricas gerais
    const profit = totalEarnings - totalExpenses;
    const profitMargin = totalEarnings > 0 ? (profit / totalEarnings) * 100 : 0;

    // Calcular ganho por hora (médio)
    const trips = await this.tripRepo.findByUserAndDate(input.userId, input.date);
    const totalMinutes = trips.reduce((sum, t) => sum + t.timeOnlineMinutes, 0);
    const averageEarningsPerHour = totalMinutes > 0 ? (totalEarnings / totalMinutes) * 60 : 0;

    return {
      profile: config.profile,
      insights,
      warnings,
      tips,
      metrics: {
        fuelCostPerKm: actualFuelCostPerKm,
        averageEarningsPerHour,
        profitMargin,
        weeklyDepreciation: config.calculateWeeklyDepreciation()?.value,
      },
    };
  }
}

