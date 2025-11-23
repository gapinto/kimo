import { IExpenseRepository } from '../../../domain/repositories/IExpenseRepository';
import { Expense, ExpenseType } from '../../../domain/entities/Expense';
import { Money } from '../../../domain/value-objects/Money';
import { PrismaClient } from '@prisma/client';
import { DatabaseError } from '../../../shared/errors/AppError';

/**
 * PrismaExpenseRepository
 * Implementa IExpenseRepository usando Prisma ORM
 * COMPLETO - Todos os métodos implementados
 */
export class PrismaExpenseRepository implements IExpenseRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async save(expense: Expense): Promise<void> {
    try {
      await this.prisma.expense.create({
        data: {
          id: expense.id,
          userId: expense.userId,
          type: expense.type,
          amount: expense.amount.value,
          date: expense.date,
          description: expense.note, // note → description
          createdAt: expense.createdAt,
        },
      });
    } catch (error) {
      throw new DatabaseError('Failed to save expense', error);
    }
  }

  async findById(id: string): Promise<Expense | null> {
    try {
      const row = await this.prisma.expense.findUnique({
        where: { id },
      });

      if (!row) return null;

      return this.toDomain(row);
    } catch (error) {
      throw new DatabaseError('Failed to find expense by ID', error);
    }
  }

  async findByUserAndDate(userId: string, date: Date): Promise<Expense[]> {
    try {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      const rows = await this.prisma.expense.findMany({
        where: {
          userId,
          date: {
            gte: startOfDay,
            lte: endOfDay,
          },
        },
        orderBy: { date: 'desc' },
      });

      return rows.map((row) => this.toDomain(row));
    } catch (error) {
      throw new DatabaseError('Failed to find expenses by user and date', error);
    }
  }

  async findByUserAndDateRange(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<Expense[]> {
    try {
      const rows = await this.prisma.expense.findMany({
        where: {
          userId,
          date: {
            gte: startDate,
            lte: endDate,
          },
        },
        orderBy: { date: 'desc' },
      });

      return rows.map((row) => this.toDomain(row));
    } catch (error) {
      throw new DatabaseError('Failed to find expenses by date range', error);
    }
  }

  async findByUserDateAndType(
    userId: string,
    date: Date,
    type: ExpenseType
  ): Promise<Expense[]> {
    try {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      const rows = await this.prisma.expense.findMany({
        where: {
          userId,
          type,
          date: {
            gte: startOfDay,
            lte: endOfDay,
          },
        },
        orderBy: { date: 'desc' },
      });

      return rows.map((row) => this.toDomain(row));
    } catch (error) {
      throw new DatabaseError('Failed to find expenses by type', error);
    }
  }

  async getTotalExpensesByUserAndDate(userId: string, date: Date): Promise<number> {
    try {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      const result = await this.prisma.expense.aggregate({
        where: {
          userId,
          date: {
            gte: startOfDay,
            lte: endOfDay,
          },
        },
        _sum: {
          amount: true,
        },
      });

      return Number(result._sum.amount) || 0;
    } catch (error) {
      throw new DatabaseError('Failed to calculate total expenses', error);
    }
  }

  async getTotalFuelExpensesByUserAndDate(userId: string, date: Date): Promise<number> {
    try {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      const result = await this.prisma.expense.aggregate({
        where: {
          userId,
          type: ExpenseType.FUEL,
          date: {
            gte: startOfDay,
            lte: endOfDay,
          },
        },
        _sum: {
          amount: true,
        },
      });

      return Number(result._sum.amount) || 0;
    } catch (error) {
      throw new DatabaseError('Failed to calculate total fuel expenses', error);
    }
  }

  // Converter Prisma model para Domain entity
  private toDomain(row: any): Expense {
    return Expense.restore({
      id: row.id,
      userId: row.userId,
      type: row.type as ExpenseType,
      amount: Money.create(Number(row.amount)),
      date: row.date,
      note: row.description ?? undefined, // description → note
      createdAt: row.createdAt,
    });
  }
}

