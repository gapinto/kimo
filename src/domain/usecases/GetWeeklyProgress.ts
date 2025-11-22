import { IDailySummaryRepository } from '../repositories/IDailySummaryRepository';
import { IUserRepository } from '../repositories/IUserRepository';

export interface GetWeeklyProgressInput {
  userId: string;
  referenceDate: Date;
}

export interface GetWeeklyProgressOutput {
  weeklyGoal: number | null;
  totalProfit: number;
  remainingToGoal: number;
  percentageComplete: number;
  daysWithData: number;
  dailySummaries: Array<{
    date: string;
    earnings: number;
    expenses: number;
    profit: number;
    km: number;
  }>;
}

/**
 * Use Case: GetWeeklyProgress
 * Princípio: Single Responsibility - calcula progresso semanal
 * Retorna dados dos últimos 7 dias
 */
export class GetWeeklyProgress {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly dailySummaryRepository: IDailySummaryRepository
  ) {}

  async execute(input: GetWeeklyProgressInput): Promise<GetWeeklyProgressOutput> {
    // Validações
    if (!input.userId) {
      throw new Error('User ID is required');
    }

    if (!input.referenceDate) {
      throw new Error('Reference date is required');
    }

    // Buscar usuário
    const user = await this.userRepository.findById(input.userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Calcular intervalo de 7 dias (incluindo o dia de referência)
    const endDate = new Date(input.referenceDate);
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - 6); // 6 dias atrás + hoje = 7 dias

    // Buscar resumos diários
    const summaries = await this.dailySummaryRepository.findByUserAndDateRange(
      input.userId,
      startDate,
      endDate
    );

    // Calcular total de lucro
    const totalProfit = await this.dailySummaryRepository.getTotalProfitByUserAndDateRange(
      input.userId,
      startDate,
      endDate
    );

    // Calcular progresso em relação à meta
    const weeklyGoal = user.weeklyGoal ?? null;
    const remainingToGoal = weeklyGoal ? weeklyGoal - totalProfit : 0;
    const percentageComplete = weeklyGoal && weeklyGoal > 0 ? (totalProfit / weeklyGoal) * 100 : 0;

    return {
      weeklyGoal,
      totalProfit,
      remainingToGoal,
      percentageComplete: Math.round(percentageComplete * 100) / 100, // Arredonda 2 casas
      daysWithData: summaries.length,
      dailySummaries: summaries.map((summary) => ({
        date: summary.date.toISOString().split('T')[0],
        earnings: summary.earnings.value,
        expenses: summary.expenses.value,
        profit: summary.profit.value,
        km: summary.km.value,
      })),
    };
  }
}

