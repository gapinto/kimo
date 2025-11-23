import { IDailySummaryRepository } from '../../../domain/repositories/IDailySummaryRepository';
import { DailySummary } from '../../../domain/entities/DailySummary';
import { Money } from '../../../domain/value-objects/Money';
import { Distance } from '../../../domain/value-objects/Distance';
import { PrismaClient } from '@prisma/client';
import { DatabaseError } from '../../../shared/errors/AppError';

/**
 * PrismaDailySummaryRepository
 * Implementa IDailySummaryRepository usando Prisma ORM
 * COMPLETO - Todos os métodos implementados
 */
export class PrismaDailySummaryRepository implements IDailySummaryRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async upsert(summary: DailySummary): Promise<void> {
    try {
      const normalizedDate = new Date(summary.date);
      normalizedDate.setHours(0, 0, 0, 0);

      await this.prisma.dailySummary.upsert({
        where: {
          userId_date: {
            userId: summary.userId,
            date: normalizedDate,
          },
        },
        create: {
          id: summary.id,
          userId: summary.userId,
          date: normalizedDate,
          totalEarnings: summary.totalEarnings.value,
          totalExpenses: summary.totalExpenses.value,
          profit: summary.profit.value,
          km: summary.km.value,
          fuelExpenses: summary.fuelExpenses.value,
          otherExpenses: summary.otherExpenses.value,
          costPerKm: summary.costPerKm?.value ?? null,
          tripsCount: summary.tripsCount,
          weeklyGoal: summary.weeklyGoal?.value ?? null,
          weeklyGoalStatus: summary.weeklyGoalStatus,
          createdAt: summary.createdAt,
          updatedAt: summary.updatedAt,
        },
        update: {
          totalEarnings: summary.totalEarnings.value,
          totalExpenses: summary.totalExpenses.value,
          profit: summary.profit.value,
          km: summary.km.value,
          fuelExpenses: summary.fuelExpenses.value,
          otherExpenses: summary.otherExpenses.value,
          costPerKm: summary.costPerKm?.value ?? null,
          tripsCount: summary.tripsCount,
          weeklyGoal: summary.weeklyGoal?.value ?? null,
          weeklyGoalStatus: summary.weeklyGoalStatus,
          updatedAt: summary.updatedAt,
        },
      });
    } catch (error) {
      throw new DatabaseError('Failed to upsert daily summary', error);
    }
  }

  async findById(id: string): Promise<DailySummary | null> {
    try {
      const row = await this.prisma.dailySummary.findUnique({
        where: { id },
      });

      if (!row) return null;

      return this.toDomain(row);
    } catch (error) {
      throw new DatabaseError('Failed to find daily summary by ID', error);
    }
  }

  async findByUserAndDate(userId: string, date: Date): Promise<DailySummary | null> {
    try {
      const normalizedDate = new Date(date);
      normalizedDate.setHours(0, 0, 0, 0);

      const row = await this.prisma.dailySummary.findUnique({
        where: {
          userId_date: {
            userId,
            date: normalizedDate,
          },
        },
      });

      if (!row) return null;

      return this.toDomain(row);
    } catch (error) {
      throw new DatabaseError('Failed to find daily summary by user and date', error);
    }
  }

  async findByUserAndDateRange(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<DailySummary[]> {
    try {
      const rows = await this.prisma.dailySummary.findMany({
        where: {
          userId,
          date: {
            gte: startDate,
            lte: endDate,
          },
        },
        orderBy: { date: 'asc' },
      });

      return rows.map((row) => this.toDomain(row));
    } catch (error) {
      throw new DatabaseError('Failed to find daily summaries by date range', error);
    }
  }

  async getTotalProfitByUserAndDateRange(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<number> {
    try {
      const result = await this.prisma.dailySummary.aggregate({
        where: {
          userId,
          date: {
            gte: startDate,
            lte: endDate,
          },
        },
        _sum: {
          profit: true,
        },
      });

      return Number(result._sum.profit) || 0;
    } catch (error) {
      throw new DatabaseError('Failed to calculate total profit', error);
    }
  }

  async existsByUserAndDate(userId: string, date: Date): Promise<boolean> {
    try {
      const normalizedDate = new Date(date);
      normalizedDate.setHours(0, 0, 0, 0);

      const count = await this.prisma.dailySummary.count({
        where: {
          userId,
          date: normalizedDate,
        },
      });

      return count > 0;
    } catch (error) {
      throw new DatabaseError('Failed to check if daily summary exists', error);
    }
  }

  // Converter Prisma model para Domain entity
  private toDomain(row: any): DailySummary {
    return DailySummary.restore({
      id: row.id,
      userId: row.userId,
      date: row.date,
      totalEarnings: Money.create(Number(row.totalEarnings)),
      totalExpenses: Money.create(Number(row.totalExpenses)),
      profit: Money.create(Number(row.profit)),
      km: Distance.create(row.km),
      fuelExpenses: Money.create(Number(row.fuelExpenses)),
      otherExpenses: Money.create(Number(row.otherExpenses)),
      costPerKm: row.costPerKm ? Money.create(Number(row.costPerKm)) : undefined,
      tripsCount: row.tripsCount,
      weeklyGoal: row.weeklyGoal ? Money.create(Number(row.weeklyGoal)) : undefined,
      weeklyGoalStatus: row.weeklyGoalStatus ?? undefined,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }
}

