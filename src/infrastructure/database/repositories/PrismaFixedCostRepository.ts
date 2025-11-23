import { IFixedCostRepository } from '../../../domain/repositories/IFixedCostRepository';
import { FixedCost } from '../../../domain/entities/FixedCost';
import { Money } from '../../../domain/value-objects/Money';
import { FixedCostType, CostFrequency } from '../../../domain/enums';
import { PrismaClient } from '@prisma/client';
import { DatabaseError } from '../../../shared/errors/AppError';

/**
 * PrismaFixedCostRepository
 * Implementa IFixedCostRepository usando Prisma ORM
 * COMPLETO - Todos os métodos implementados
 */
export class PrismaFixedCostRepository implements IFixedCostRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async save(fixedCost: FixedCost): Promise<void> {
    try {
      await this.prisma.fixedCost.create({
        data: {
          id: fixedCost.id,
          userId: fixedCost.userId,
          type: fixedCost.type,
          amount: fixedCost.amount.value,
          frequency: fixedCost.frequency,
          description: fixedCost.description,
          startDate: fixedCost.startDate,
          endDate: fixedCost.endDate,
          isActive: fixedCost.isActive,
          createdAt: fixedCost.createdAt,
          updatedAt: fixedCost.updatedAt,
        },
      });
    } catch (error) {
      throw new DatabaseError('Failed to save fixed cost', error);
    }
  }

  async findById(id: string): Promise<FixedCost | null> {
    try {
      const row = await this.prisma.fixedCost.findUnique({
        where: { id },
      });

      if (!row) return null;

      return this.toDomain(row);
    } catch (error) {
      throw new DatabaseError('Failed to find fixed cost by ID', error);
    }
  }

  async findActiveByUserId(userId: string): Promise<FixedCost[]> {
    try {
      const rows = await this.prisma.fixedCost.findMany({
        where: { userId, isActive: true },
        orderBy: { createdAt: 'desc' },
      });

      return rows.map((row) => this.toDomain(row));
    } catch (error) {
      throw new DatabaseError('Failed to find active fixed costs', error);
    }
  }

  async findAllByUserId(userId: string): Promise<FixedCost[]> {
    try {
      const rows = await this.prisma.fixedCost.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      });

      return rows.map((row) => this.toDomain(row));
    } catch (error) {
      throw new DatabaseError('Failed to find all fixed costs', error);
    }
  }

  async update(fixedCost: FixedCost): Promise<void> {
    try {
      await this.prisma.fixedCost.update({
        where: { id: fixedCost.id },
        data: {
          type: fixedCost.type,
          amount: fixedCost.amount.value,
          frequency: fixedCost.frequency,
          description: fixedCost.description,
          startDate: fixedCost.startDate,
          endDate: fixedCost.endDate,
          isActive: fixedCost.isActive,
          updatedAt: fixedCost.updatedAt,
        },
      });
    } catch (error) {
      throw new DatabaseError('Failed to update fixed cost', error);
    }
  }

  async getTotalMonthlyFixedCosts(userId: string): Promise<number> {
    try {
      const fixedCosts = await this.findActiveByUserId(userId);

      const total = fixedCosts.reduce((sum, cost) => {
        return sum + cost.toMonthlyAmount().value;
      }, 0);

      return total;
    } catch (error) {
      throw new DatabaseError('Failed to calculate monthly fixed costs', error);
    }
  }

  async getTotalWeeklyFixedCosts(userId: string): Promise<number> {
    try {
      const fixedCosts = await this.findActiveByUserId(userId);

      const total = fixedCosts.reduce((sum, cost) => {
        return sum + cost.toWeeklyAmount().value;
      }, 0);

      return total;
    } catch (error) {
      throw new DatabaseError('Failed to calculate weekly fixed costs', error);
    }
  }

  async getTotalDailyFixedCosts(userId: string): Promise<number> {
    try {
      const fixedCosts = await this.findActiveByUserId(userId);

      const total = fixedCosts.reduce((sum, cost) => {
        return sum + cost.toDailyAmount().value;
      }, 0);

      return total;
    } catch (error) {
      throw new DatabaseError('Failed to calculate daily fixed costs', error);
    }
  }

  // Converter Prisma model para Domain entity
  private toDomain(row: any): FixedCost {
    return FixedCost.restore({
      id: row.id,
      userId: row.userId,
      type: row.type as FixedCostType,
      amount: Money.create(Number(row.amount)),
      frequency: row.frequency as CostFrequency,
      description: row.description ?? undefined,
      startDate: row.startDate,
      endDate: row.endDate ?? undefined,
      isActive: row.isActive,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }
}

