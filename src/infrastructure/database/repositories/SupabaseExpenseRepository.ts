import { IExpenseRepository } from '../../../domain/repositories/IExpenseRepository';
import { Expense } from '../../../domain/entities/Expense';
import { ExpenseType } from '../../../domain/enums';
import { Money } from '../../../domain/value-objects/Money';
import { SupabaseClient } from '@supabase/supabase-js';
import { DatabaseError } from '../../../shared/errors/AppError';

interface ExpenseRow {
  id: string;
  user_id: string;
  date: string;
  type: string;
  amount: number;
  note: string | null;
  created_at: string;
}

/**
 * SupabaseExpenseRepository
 * Implementa IExpenseRepository usando Supabase
 */
export class SupabaseExpenseRepository implements IExpenseRepository {
  private readonly tableName = 'expenses';

  constructor(private readonly client: SupabaseClient) {}

  async save(expense: Expense): Promise<void> {
    try {
      const row = this.toRow(expense);

      const { error } = await this.client.from(this.tableName).insert(row);

      if (error) {
        throw new DatabaseError('Failed to save expense', error);
      }
    } catch (error) {
      if (error instanceof DatabaseError) {
        throw error;
      }
      throw new DatabaseError('Unexpected error saving expense', error);
    }
  }

  async findById(id: string): Promise<Expense | null> {
    try {
      const { data, error } = await this.client
        .from(this.tableName)
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        throw new DatabaseError('Failed to find expense', error);
      }

      return data ? this.toDomain(data as ExpenseRow) : null;
    } catch (error) {
      if (error instanceof DatabaseError) {
        throw error;
      }
      throw new DatabaseError('Unexpected error finding expense', error);
    }
  }

  async findByUserAndDate(userId: string, date: Date): Promise<Expense[]> {
    try {
      const dateStr = this.formatDate(date);

      const { data, error } = await this.client
        .from(this.tableName)
        .select('*')
        .eq('user_id', userId)
        .eq('date', dateStr)
        .order('created_at', { ascending: false });

      if (error) {
        throw new DatabaseError('Failed to find expenses', error);
      }

      return (data as ExpenseRow[]).map((row) => this.toDomain(row));
    } catch (error) {
      if (error instanceof DatabaseError) {
        throw error;
      }
      throw new DatabaseError('Unexpected error finding expenses', error);
    }
  }

  async findByUserAndDateRange(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<Expense[]> {
    try {
      const startDateStr = this.formatDate(startDate);
      const endDateStr = this.formatDate(endDate);

      const { data, error } = await this.client
        .from(this.tableName)
        .select('*')
        .eq('user_id', userId)
        .gte('date', startDateStr)
        .lte('date', endDateStr)
        .order('date', { ascending: true });

      if (error) {
        throw new DatabaseError('Failed to find expenses by range', error);
      }

      return (data as ExpenseRow[]).map((row) => this.toDomain(row));
    } catch (error) {
      if (error instanceof DatabaseError) {
        throw error;
      }
      throw new DatabaseError('Unexpected error finding expenses by range', error);
    }
  }

  async findByUserDateAndType(
    userId: string,
    date: Date,
    type: ExpenseType
  ): Promise<Expense[]> {
    try {
      const dateStr = this.formatDate(date);

      const { data, error } = await this.client
        .from(this.tableName)
        .select('*')
        .eq('user_id', userId)
        .eq('date', dateStr)
        .eq('type', type)
        .order('created_at', { ascending: false });

      if (error) {
        throw new DatabaseError('Failed to find expenses by type', error);
      }

      return (data as ExpenseRow[]).map((row) => this.toDomain(row));
    } catch (error) {
      if (error instanceof DatabaseError) {
        throw error;
      }
      throw new DatabaseError('Unexpected error finding expenses by type', error);
    }
  }

  async getTotalExpensesByUserAndDate(userId: string, date: Date): Promise<number> {
    try {
      const dateStr = this.formatDate(date);

      const { data, error } = await this.client
        .from(this.tableName)
        .select('amount')
        .eq('user_id', userId)
        .eq('date', dateStr);

      if (error) {
        throw new DatabaseError('Failed to get total expenses', error);
      }

      const total = (data as { amount: number }[]).reduce((sum, row) => sum + row.amount, 0);

      return total;
    } catch (error) {
      if (error instanceof DatabaseError) {
        throw error;
      }
      throw new DatabaseError('Unexpected error calculating total expenses', error);
    }
  }

  async getTotalFuelExpensesByUserAndDate(userId: string, date: Date): Promise<number> {
    try {
      const dateStr = this.formatDate(date);

      const { data, error } = await this.client
        .from(this.tableName)
        .select('amount')
        .eq('user_id', userId)
        .eq('date', dateStr)
        .eq('type', ExpenseType.FUEL);

      if (error) {
        throw new DatabaseError('Failed to get fuel expenses', error);
      }

      const total = (data as { amount: number }[]).reduce((sum, row) => sum + row.amount, 0);

      return total;
    } catch (error) {
      if (error instanceof DatabaseError) {
        throw error;
      }
      throw new DatabaseError('Unexpected error calculating fuel expenses', error);
    }
  }

  // Helpers privados
  private toDomain(row: ExpenseRow): Expense {
    return Expense.restore({
      id: row.id ?? crypto.randomUUID(),
      userId: row.user_id,
      date: new Date(row.date),
      type: row.type as ExpenseType,
      amount: Money.create(row.amount),
      note: row.note ?? undefined,
      createdAt: new Date(row.created_at),
    });
  }

  private toRow(expense: Expense): Partial<ExpenseRow> {
    return {
      id: expense.id,
      user_id: expense.userId,
      date: this.formatDate(expense.date),
      type: expense.type,
      amount: expense.amount.value,
      note: expense.note ?? null,
      created_at: expense.createdAt.toISOString(),
    };
  }

  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0]; // YYYY-MM-DD
  }
}

