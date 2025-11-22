import { IDailySummaryRepository } from '../../../domain/repositories/IDailySummaryRepository';
import { DailySummary } from '../../../domain/entities/DailySummary';
import { Money } from '../../../domain/value-objects/Money';
import { Distance } from '../../../domain/value-objects/Distance';
import { SupabaseClient } from '@supabase/supabase-js';
import { DatabaseError } from '../../../shared/errors/AppError';

interface DailySummaryRow {
  id: string;
  user_id: string;
  date: string;
  earnings: number;
  expenses: number;
  km: number;
  profit: number;
  cost_per_km: number | null;
  created_at: string;
}

/**
 * SupabaseDailySummaryRepository
 * Implementa IDailySummaryRepository usando Supabase
 */
export class SupabaseDailySummaryRepository implements IDailySummaryRepository {
  private readonly tableName = 'daily_summaries';

  constructor(private readonly client: SupabaseClient) {}

  async upsert(summary: DailySummary): Promise<void> {
    try {
      const row = this.toRow(summary);

      const { error } = await this.client
        .from(this.tableName)
        .upsert(row, {
          onConflict: 'user_id,date',
        });

      if (error) {
        throw new DatabaseError('Failed to upsert daily summary', error);
      }
    } catch (error) {
      if (error instanceof DatabaseError) {
        throw error;
      }
      throw new DatabaseError('Unexpected error upserting daily summary', error);
    }
  }

  async findById(id: string): Promise<DailySummary | null> {
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
        throw new DatabaseError('Failed to find daily summary', error);
      }

      return data ? this.toDomain(data as DailySummaryRow) : null;
    } catch (error) {
      if (error instanceof DatabaseError) {
        throw error;
      }
      throw new DatabaseError('Unexpected error finding daily summary', error);
    }
  }

  async findByUserAndDate(userId: string, date: Date): Promise<DailySummary | null> {
    try {
      const dateStr = this.formatDate(date);

      const { data, error } = await this.client
        .from(this.tableName)
        .select('*')
        .eq('user_id', userId)
        .eq('date', dateStr)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        throw new DatabaseError('Failed to find daily summary by date', error);
      }

      return data ? this.toDomain(data as DailySummaryRow) : null;
    } catch (error) {
      if (error instanceof DatabaseError) {
        throw error;
      }
      throw new DatabaseError('Unexpected error finding daily summary by date', error);
    }
  }

  async findByUserAndDateRange(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<DailySummary[]> {
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
        throw new DatabaseError('Failed to find daily summaries by range', error);
      }

      return (data as DailySummaryRow[]).map((row) => this.toDomain(row));
    } catch (error) {
      if (error instanceof DatabaseError) {
        throw error;
      }
      throw new DatabaseError('Unexpected error finding summaries by range', error);
    }
  }

  async getTotalProfitByUserAndDateRange(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<number> {
    try {
      const startDateStr = this.formatDate(startDate);
      const endDateStr = this.formatDate(endDate);

      const { data, error } = await this.client
        .from(this.tableName)
        .select('profit')
        .eq('user_id', userId)
        .gte('date', startDateStr)
        .lte('date', endDateStr);

      if (error) {
        throw new DatabaseError('Failed to get total profit', error);
      }

      const total = (data as { profit: number }[]).reduce((sum, row) => sum + row.profit, 0);

      return total;
    } catch (error) {
      if (error instanceof DatabaseError) {
        throw error;
      }
      throw new DatabaseError('Unexpected error calculating total profit', error);
    }
  }

  async existsByUserAndDate(userId: string, date: Date): Promise<boolean> {
    try {
      const dateStr = this.formatDate(date);

      const { count, error } = await this.client
        .from(this.tableName)
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('date', dateStr);

      if (error) {
        throw new DatabaseError('Failed to check if summary exists', error);
      }

      return (count ?? 0) > 0;
    } catch (error) {
      if (error instanceof DatabaseError) {
        throw error;
      }
      throw new DatabaseError('Unexpected error checking summary existence', error);
    }
  }

  // Helpers privados
  private toDomain(row: DailySummaryRow): DailySummary {
    return DailySummary.restore({
      id: row.id,
      userId: row.user_id,
      date: new Date(row.date),
      earnings: Money.create(row.earnings),
      expenses: Money.create(row.expenses),
      km: Distance.create(row.km),
      profit: Money.create(row.profit),
      costPerKm: row.cost_per_km ? Money.create(row.cost_per_km) : null,
      createdAt: new Date(row.created_at),
    });
  }

  private toRow(summary: DailySummary): Partial<DailySummaryRow> {
    return {
      id: summary.id,
      user_id: summary.userId,
      date: this.formatDate(summary.date),
      earnings: summary.earnings.value,
      expenses: summary.expenses.value,
      km: summary.km.value,
      profit: summary.profit.value,
      cost_per_km: summary.costPerKm?.value ?? null,
      created_at: summary.createdAt.toISOString(),
    };
  }

  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0]; // YYYY-MM-DD
  }
}

