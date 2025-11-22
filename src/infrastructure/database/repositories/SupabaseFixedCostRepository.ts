import { IFixedCostRepository } from '../../../domain/repositories/IFixedCostRepository';
import { FixedCost } from '../../../domain/entities/FixedCost';
import { Money } from '../../../domain/value-objects/Money';
import { FixedCostType, CostFrequency } from '../../../domain/enums';
import { SupabaseClient } from '@supabase/supabase-js';
import { DatabaseError } from '../../../shared/errors/AppError';

interface FixedCostRow {
  id: string;
  user_id: string;
  type: string;
  amount: number;
  frequency: string;
  description: string | null;
  start_date: string;
  end_date: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * SupabaseFixedCostRepository
 * Implementa IFixedCostRepository usando Supabase
 */
export class SupabaseFixedCostRepository implements IFixedCostRepository {
  private readonly tableName = 'fixed_costs';

  constructor(private readonly client: SupabaseClient) {}

  async save(fixedCost: FixedCost): Promise<void> {
    try {
      const row = this.toRow(fixedCost);

      const { error } = await this.client.from(this.tableName).insert(row);

      if (error) {
        throw new DatabaseError('Failed to save fixed cost', error);
      }
    } catch (error) {
      if (error instanceof DatabaseError) {
        throw error;
      }
      throw new DatabaseError('Unexpected error saving fixed cost', error);
    }
  }

  async findById(id: string): Promise<FixedCost | null> {
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
        throw new DatabaseError('Failed to find fixed cost', error);
      }

      return data ? this.toDomain(data as FixedCostRow) : null;
    } catch (error) {
      if (error instanceof DatabaseError) {
        throw error;
      }
      throw new DatabaseError('Unexpected error finding fixed cost', error);
    }
  }

  async findActiveByUserId(userId: string): Promise<FixedCost[]> {
    try {
      const { data, error } = await this.client
        .from(this.tableName)
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        throw new DatabaseError('Failed to find active fixed costs', error);
      }

      return (data as FixedCostRow[]).map((row) => this.toDomain(row));
    } catch (error) {
      if (error instanceof DatabaseError) {
        throw error;
      }
      throw new DatabaseError('Unexpected error finding active fixed costs', error);
    }
  }

  async findAllByUserId(userId: string): Promise<FixedCost[]> {
    try {
      const { data, error } = await this.client
        .from(this.tableName)
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        throw new DatabaseError('Failed to find all fixed costs', error);
      }

      return (data as FixedCostRow[]).map((row) => this.toDomain(row));
    } catch (error) {
      if (error instanceof DatabaseError) {
        throw error;
      }
      throw new DatabaseError('Unexpected error finding all fixed costs', error);
    }
  }

  async update(fixedCost: FixedCost): Promise<void> {
    try {
      const row = this.toRow(fixedCost);

      const { error } = await this.client
        .from(this.tableName)
        .update(row)
        .eq('id', fixedCost.id);

      if (error) {
        throw new DatabaseError('Failed to update fixed cost', error);
      }
    } catch (error) {
      if (error instanceof DatabaseError) {
        throw error;
      }
      throw new DatabaseError('Unexpected error updating fixed cost', error);
    }
  }

  async getTotalMonthlyFixedCosts(userId: string): Promise<number> {
    try {
      const fixedCosts = await this.findActiveByUserId(userId);
      
      let total = 0;
      for (const cost of fixedCosts) {
        total += cost.toMonthlyAmount().value;
      }

      return total;
    } catch (error) {
      if (error instanceof DatabaseError) {
        throw error;
      }
      throw new DatabaseError('Unexpected error calculating monthly fixed costs', error);
    }
  }

  async getTotalWeeklyFixedCosts(userId: string): Promise<number> {
    try {
      const fixedCosts = await this.findActiveByUserId(userId);
      
      let total = 0;
      for (const cost of fixedCosts) {
        total += cost.toWeeklyAmount().value;
      }

      return total;
    } catch (error) {
      if (error instanceof DatabaseError) {
        throw error;
      }
      throw new DatabaseError('Unexpected error calculating weekly fixed costs', error);
    }
  }

  async getTotalDailyFixedCosts(userId: string): Promise<number> {
    try {
      const fixedCosts = await this.findActiveByUserId(userId);
      
      let total = 0;
      for (const cost of fixedCosts) {
        total += cost.toDailyAmount().value;
      }

      return total;
    } catch (error) {
      if (error instanceof DatabaseError) {
        throw error;
      }
      throw new DatabaseError('Unexpected error calculating daily fixed costs', error);
    }
  }

  // Conversores privados
  private toDomain(row: FixedCostRow): FixedCost {
    return FixedCost.restore({
      id: row.id,
      userId: row.user_id,
      type: row.type as FixedCostType,
      amount: Money.create(row.amount),
      frequency: row.frequency as CostFrequency,
      description: row.description ?? undefined,
      startDate: new Date(row.start_date),
      endDate: row.end_date ? new Date(row.end_date) : undefined,
      isActive: row.is_active,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    });
  }

  private toRow(fixedCost: FixedCost): Partial<FixedCostRow> {
    return {
      id: fixedCost.id,
      user_id: fixedCost.userId,
      type: fixedCost.type,
      amount: fixedCost.amount.value,
      frequency: fixedCost.frequency,
      description: fixedCost.description ?? null,
      start_date: this.formatDate(fixedCost.startDate),
      end_date: fixedCost.endDate ? this.formatDate(fixedCost.endDate) : null,
      is_active: fixedCost.isActive,
      created_at: fixedCost.createdAt.toISOString(),
      updated_at: fixedCost.updatedAt.toISOString(),
    };
  }

  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0]; // YYYY-MM-DD
  }
}

