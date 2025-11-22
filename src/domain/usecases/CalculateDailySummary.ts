import { IDailySummaryRepository } from '../repositories/IDailySummaryRepository';
import { ITripRepository } from '../repositories/ITripRepository';
import { IExpenseRepository } from '../repositories/IExpenseRepository';
import { DailySummary } from '../entities/DailySummary';
import { Money } from '../value-objects/Money';
import { Distance } from '../value-objects/Distance';

export interface CalculateDailySummaryInput {
  userId: string;
  date: Date;
}

export interface CalculateDailySummaryOutput {
  earnings: number;
  expenses: number;
  km: number;
  profit: number;
  costPerKm: number | null;
}

/**
 * Use Case: CalculateDailySummary
 * Princípio: Single Responsibility - calcula e salva resumo diário
 * Princípio: Dependency Inversion - depende de interfaces
 */
export class CalculateDailySummary {
  constructor(
    private readonly tripRepository: ITripRepository,
    private readonly expenseRepository: IExpenseRepository,
    private readonly dailySummaryRepository: IDailySummaryRepository
  ) {}

  async execute(input: CalculateDailySummaryInput): Promise<CalculateDailySummaryOutput> {
    // Validações
    if (!input.userId) {
      throw new Error('User ID is required');
    }

    if (!input.date) {
      throw new Error('Date is required');
    }

    // Buscar dados do dia
    const totalEarnings = await this.tripRepository.getTotalEarningsByUserAndDate(
      input.userId,
      input.date
    );

    const totalKm = await this.tripRepository.getTotalKmByUserAndDate(
      input.userId,
      input.date
    );

    const totalExpenses = await this.expenseRepository.getTotalExpensesByUserAndDate(
      input.userId,
      input.date
    );

    // Criar resumo
    const earnings = Money.create(totalEarnings);
    const expenses = Money.create(totalExpenses);
    const km = Distance.create(totalKm);

    const summary = DailySummary.create({
      userId: input.userId,
      date: input.date,
      earnings,
      expenses,
      km,
    });

    // Persistir (upsert)
    await this.dailySummaryRepository.upsert(summary);

    return {
      earnings: summary.earnings.value,
      expenses: summary.expenses.value,
      km: summary.km.value,
      profit: summary.profit.value,
      costPerKm: summary.costPerKm?.value ?? null,
    };
  }
}

