import { IDriverConfigRepository } from '../repositories/IDriverConfigRepository';
import { IFixedCostRepository } from '../repositories/IFixedCostRepository';
import { IDailySummaryRepository } from '../repositories/IDailySummaryRepository';

export interface EvaluateTripInput {
  userId: string;
  earnings: number; // Valor da corrida em reais
  km: number; // Distância em km
}

export interface EvaluateTripOutput {
  earnings: number;
  km: number;
  fuelCost: number;
  depreciationCost: number;
  maintenanceCost: number;
  totalCost: number;
  profit: number;
  profitPerKm: number;
  recommendation: 'accept' | 'reject' | 'neutral';
  message: string;
  comparisonWithAverage?: {
    userAverageProfitPerKm: number;
    difference: number;
  };
}

/**
 * Use Case: EvaluateTrip
 * Calcula se uma corrida vale a pena baseado nos custos do motorista
 * Princípio: Single Responsibility
 */
export class EvaluateTrip {
  constructor(
    private readonly driverConfigRepository: IDriverConfigRepository,
    private readonly fixedCostRepository: IFixedCostRepository,
    private readonly dailySummaryRepository: IDailySummaryRepository
  ) {}

  async execute(input: EvaluateTripInput): Promise<EvaluateTripOutput> {
    // Validações
    if (!input.userId) {
      throw new Error('User ID is required');
    }

    if (input.earnings <= 0) {
      throw new Error('Earnings must be greater than zero');
    }

    if (input.km <= 0) {
      throw new Error('Distance must be greater than zero');
    }

    // Buscar configuração do motorista
    const driverConfig = await this.driverConfigRepository.findByUserId(input.userId);

    if (!driverConfig) {
      throw new Error('Driver configuration not found. Complete onboarding first.');
    }

    // Calcular custo de combustível
    const fuelCost = this.calculateFuelCost(input.km, driverConfig);

    // Calcular depreciação por km
    const depreciationCost = this.calculateDepreciationCost(input.km, driverConfig);

    // Calcular manutenção estimada (R$ 0.30/km em média)
    const maintenanceCost = input.km * 0.3;

    // Custo total
    const totalCost = fuelCost + depreciationCost + maintenanceCost;

    // Lucro
    const profit = input.earnings - totalCost;
    const profitPerKm = profit / input.km;

    // Buscar média do motorista (últimos 7 dias)
    const userAverage = await this.getUserAverageProfitPerKm(input.userId);

    // Gerar recomendação
    const { recommendation, message } = this.generateRecommendation(
      profitPerKm,
      userAverage,
      profit
    );

    return {
      earnings: input.earnings,
      km: input.km,
      fuelCost,
      depreciationCost,
      maintenanceCost,
      totalCost,
      profit,
      profitPerKm,
      recommendation,
      message,
      comparisonWithAverage: userAverage
        ? {
            userAverageProfitPerKm: userAverage,
            difference: profitPerKm - userAverage,
          }
        : undefined,
    };
  }

  private calculateFuelCost(km: number, driverConfig: any): number {
    // consumo em km/l, preço em R$/l
    const litersNeeded = km / driverConfig.fuelConsumption;
    return litersNeeded * driverConfig.avgFuelPrice.value;
  }

  private calculateDepreciationCost(km: number, driverConfig: any): number {
    if (!driverConfig.carValue) {
      return 0;
    }

    // Depreciação: 15% ao ano ou 50.000 km/ano
    // Aproximadamente R$ 0.30 a R$ 0.50 por km dependendo do valor do carro
    const carValueAmount = driverConfig.carValue.value;
    const annualDepreciation = carValueAmount * 0.15;
    const depreciationPerKm = annualDepreciation / 50000;
    return km * depreciationPerKm;
  }

  private async getUserAverageProfitPerKm(userId: string): Promise<number | null> {
    try {
      const today = new Date();
      const sevenDaysAgo = new Date(today);
      sevenDaysAgo.setDate(today.getDate() - 7);

      const summaries = await this.dailySummaryRepository.findByUserAndDateRange(
        userId,
        sevenDaysAgo,
        today
      );

      if (summaries.length === 0) {
        return null;
      }

      // Calcular média de lucro por km
      let totalProfit = 0;
      let totalKm = 0;

      summaries.forEach((summary) => {
        totalProfit += summary.profit.value;
        totalKm += summary.km.value;
      });

      if (totalKm === 0) {
        return null;
      }

      return totalProfit / totalKm;
    } catch (error) {
      return null;
    }
  }

  private generateRecommendation(
    profitPerKm: number,
    userAverage: number | null,
    totalProfit: number
  ): { recommendation: 'accept' | 'reject' | 'neutral'; message: string } {
    // Critério 1: Lucro negativo = REJEITAR
    if (totalProfit <= 0) {
      return {
        recommendation: 'reject',
        message: '⛔ *NÃO ACEITE!* Você vai ter prejuízo nessa corrida!',
      };
    }

    // Se tem histórico, usa a média do motorista como referência
    if (userAverage && userAverage > 0) {
      // Critério 2: Se for 20% abaixo da SUA média = REJEITAR
      if (profitPerKm < userAverage * 0.8) {
        return {
          recommendation: 'reject',
          message: `⚠️ *ABAIXO DA SUA MÉDIA!* Você costuma lucrar R$ ${userAverage.toFixed(2)}/km.`,
        };
      }

      // Critério 3: Se for igual ou acima da SUA média = ACEITAR
      if (profitPerKm >= userAverage) {
        return {
          recommendation: 'accept',
          message: `✅ *ACIMA DA SUA MÉDIA!* Você lucra em média R$ ${userAverage.toFixed(2)}/km.`,
        };
      }

      // Critério 4: Entre 80% e 100% da média = NEUTRO (aceitável)
      return {
        recommendation: 'neutral',
        message: `🤔 *RAZOÁVEL.* Perto da sua média de R$ ${userAverage.toFixed(2)}/km.`,
      };
    }

    // SEM HISTÓRICO - usar valores genéricos temporários
    // Critério 5: Lucro muito baixo (< R$ 1,50/km) = REJEITAR
    if (profitPerKm < 1.5) {
      return {
        recommendation: 'reject',
        message:
          '⚠️ *LUCRO BAIXO!* Menos de R$ 1,50/km.',
      };
    }

    // Critério 6: Lucro bom (R$ 2,50/km ou mais) = ACEITAR
    if (profitPerKm >= 2.5) {
      return {
        recommendation: 'accept',
        message: '✅ *BOM LUCRO!* R$ 2,50/km ou mais.',
      };
    }

    // Critério 7: Lucro aceitável (R$ 1,50 a R$ 2,50/km) = NEUTRO
    return {
      recommendation: 'neutral',
      message: '🤔 *RAZOÁVEL.* Entre R$ 1,50 e R$ 2,50/km.',
    };
  }
}

