import { IDriverConfigRepository } from '../repositories/IDriverConfigRepository';
import { IFixedCostRepository } from '../repositories/IFixedCostRepository';

export interface CalculateSuggestedGoalInput {
  userId: string;
}

export interface CalculateSuggestedGoalOutput {
  // Custos por dia
  dailyFuelCost: number;
  dailyMaintenanceCost: number;
  dailyDepreciationCost: number;
  dailyFixedCosts: number; // Parcela, seguro, IPVA proporcionais
  totalDailyCost: number;

  // Meta sugerida
  suggestedDailyGoal: number;
  suggestedWeeklyGoal: number;
  
  // Lucro esperado
  dailyProfit: number;
  weeklyProfit: number;
  monthlyProfit: number;

  // Detalhes
  workDaysPerWeek: number;
  avgKmPerDay: number;
  profitMargin: number; // Porcentagem de margem de lucro aplicada
}

/**
 * Use Case: CalculateSuggestedGoal
 * Calcula meta diária e semanal baseada nos custos reais do motorista
 * Princípio: Single Responsibility
 */
export class CalculateSuggestedGoal {
  // Custos estimados padrão
  private readonly DAILY_MAINTENANCE_COST = 10; // R$ 10/dia
  private readonly MONTHLY_INSURANCE_ESTIMATE = 200; // R$ 200/mês
  private readonly MONTHLY_IPVA_ESTIMATE = 100; // R$ 100/mês (proporcional)
  private readonly PROFIT_MARGIN = 0.25; // 25% de margem de lucro sobre custos

  constructor(
    private readonly driverConfigRepository: IDriverConfigRepository,
    private readonly fixedCostRepository: IFixedCostRepository
  ) {}

  async execute(input: CalculateSuggestedGoalInput): Promise<CalculateSuggestedGoalOutput> {
    // Validações
    if (!input.userId) {
      throw new Error('User ID is required');
    }

    // Buscar configuração do motorista
    const driverConfig = await this.driverConfigRepository.findByUserId(input.userId);

    if (!driverConfig) {
      throw new Error('Driver configuration not found');
    }

    // 1. CUSTOS VARIÁVEIS POR DIA
    
    // Combustível
    const dailyFuelCost = this.calculateDailyFuelCost(
      driverConfig.avgKmPerDay,
      driverConfig.fuelConsumption,
      driverConfig.avgFuelPrice.value
    );

    // Manutenção (estimativa)
    const dailyMaintenanceCost = this.DAILY_MAINTENANCE_COST;

    // Depreciação
    const dailyDepreciationCost = this.calculateDailyDepreciation(
      driverConfig.carValue?.value,
      driverConfig.avgKmPerDay
    );

    // 2. CUSTOS FIXOS POR DIA
    
    // Parcela do financiamento (se houver)
    let monthlyFinancingPayment = 0;
    if (driverConfig.financingMonthlyPayment) {
      monthlyFinancingPayment = driverConfig.financingMonthlyPayment.value;
    }

    // Buscar outros custos fixos do banco
    const fixedCosts = await this.fixedCostRepository.findByUserId(input.userId);
    let monthlyOtherFixedCosts = 0;
    
    fixedCosts.forEach(cost => {
      if (cost.isActive) {
        monthlyOtherFixedCosts += cost.toMonthlyAmount().value;
      }
    });

    // Total mensal de custos fixos
    const totalMonthlyFixedCosts = 
      monthlyFinancingPayment +
      monthlyOtherFixedCosts +
      this.MONTHLY_INSURANCE_ESTIMATE +
      this.MONTHLY_IPVA_ESTIMATE;

    // Converter para custo diário (considerando dias trabalhados)
    const workDaysPerMonth = driverConfig.workDaysPerWeek * 4.33; // ~26 dias/mês
    const dailyFixedCosts = totalMonthlyFixedCosts / workDaysPerMonth;

    // 3. CUSTO TOTAL POR DIA
    const totalDailyCost = 
      dailyFuelCost +
      dailyMaintenanceCost +
      dailyDepreciationCost +
      dailyFixedCosts;

    // 4. META SUGERIDA (com margem de lucro)
    const suggestedDailyGoal = totalDailyCost * (1 + this.PROFIT_MARGIN);
    const suggestedWeeklyGoal = suggestedDailyGoal * driverConfig.workDaysPerWeek;

    // 5. LUCRO ESPERADO
    const dailyProfit = suggestedDailyGoal - totalDailyCost;
    const weeklyProfit = dailyProfit * driverConfig.workDaysPerWeek;
    const monthlyProfit = dailyProfit * workDaysPerMonth;

    return {
      dailyFuelCost,
      dailyMaintenanceCost,
      dailyDepreciationCost,
      dailyFixedCosts,
      totalDailyCost,
      suggestedDailyGoal: Math.ceil(suggestedDailyGoal), // Arredonda para cima
      suggestedWeeklyGoal: Math.ceil(suggestedWeeklyGoal),
      dailyProfit,
      weeklyProfit,
      monthlyProfit,
      workDaysPerWeek: driverConfig.workDaysPerWeek,
      avgKmPerDay: driverConfig.avgKmPerDay,
      profitMargin: this.PROFIT_MARGIN * 100, // Em porcentagem
    };
  }

  private calculateDailyFuelCost(
    avgKmPerDay: number,
    fuelConsumption: number,
    fuelPrice: number
  ): number {
    const litersPerDay = avgKmPerDay / fuelConsumption;
    return litersPerDay * fuelPrice;
  }

  private calculateDailyDepreciation(
    carValue: number | undefined,
    avgKmPerDay: number
  ): number {
    if (!carValue || carValue === 0) {
      return 0;
    }

    // Depreciação: ~15% ao ano do valor do carro
    // Ajustado por KM rodado
    const annualDepreciation = carValue * 0.15;
    
    // Considerando ~50.000 km/ano como base
    const annualKm = avgKmPerDay * 300; // ~300 dias trabalhados/ano
    const depreciationPerKm = annualDepreciation / annualKm;
    
    return depreciationPerKm * avgKmPerDay;
  }
}

