import { IDriverConfigRepository } from '../../../domain/repositories/IDriverConfigRepository';
import { DriverConfig } from '../../../domain/entities/DriverConfig';
import { Money } from '../../../domain/value-objects/Money';
import { DriverProfile } from '../../../domain/enums';
import { SupabaseClient } from '@supabase/supabase-js';
import { DatabaseError } from '../../../shared/errors/AppError';

interface DriverConfigRow {
  id: string;
  user_id: string;
  profile: string;
  car_value: number | null;
  fuel_consumption: number;
  avg_fuel_price: number;
  avg_km_per_day: number;
  work_days_per_week: number;
  created_at: string;
  updated_at: string;
}

/**
 * SupabaseDriverConfigRepository
 * Implementa IDriverConfigRepository usando Supabase
 */
export class SupabaseDriverConfigRepository implements IDriverConfigRepository {
  private readonly tableName = 'driver_configs';

  constructor(private readonly client: SupabaseClient) {}

  async save(config: DriverConfig): Promise<void> {
    try {
      const row = this.toRow(config);

      const { error } = await this.client.from(this.tableName).insert(row);

      if (error) {
        throw new DatabaseError('Failed to save driver config', error);
      }
    } catch (error) {
      if (error instanceof DatabaseError) {
        throw error;
      }
      throw new DatabaseError('Unexpected error saving driver config', error);
    }
  }

  async findById(id: string): Promise<DriverConfig | null> {
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
        throw new DatabaseError('Failed to find driver config', error);
      }

      return data ? this.toDomain(data as DriverConfigRow) : null;
    } catch (error) {
      if (error instanceof DatabaseError) {
        throw error;
      }
      throw new DatabaseError('Unexpected error finding driver config', error);
    }
  }

  async findByUserId(userId: string): Promise<DriverConfig | null> {
    try {
      const { data, error } = await this.client
        .from(this.tableName)
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        throw new DatabaseError('Failed to find driver config by user', error);
      }

      return data ? this.toDomain(data as DriverConfigRow) : null;
    } catch (error) {
      if (error instanceof DatabaseError) {
        throw error;
      }
      throw new DatabaseError('Unexpected error finding driver config by user', error);
    }
  }

  async update(config: DriverConfig): Promise<void> {
    try {
      const row = this.toRow(config);

      const { error } = await this.client
        .from(this.tableName)
        .update(row)
        .eq('id', config.id);

      if (error) {
        throw new DatabaseError('Failed to update driver config', error);
      }
    } catch (error) {
      if (error instanceof DatabaseError) {
        throw error;
      }
      throw new DatabaseError('Unexpected error updating driver config', error);
    }
  }

  async existsByUserId(userId: string): Promise<boolean> {
    try {
      const { count, error } = await this.client
        .from(this.tableName)
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId);

      if (error) {
        throw new DatabaseError('Failed to check if driver config exists', error);
      }

      return (count ?? 0) > 0;
    } catch (error) {
      if (error instanceof DatabaseError) {
        throw error;
      }
      throw new DatabaseError('Unexpected error checking driver config existence', error);
    }
  }

  // Conversores privados
  private toDomain(row: DriverConfigRow): DriverConfig {
    return DriverConfig.restore({
      id: row.id,
      userId: row.user_id,
      profile: row.profile as DriverProfile,
      carValue: row.car_value ? Money.create(row.car_value) : undefined,
      fuelConsumption: row.fuel_consumption,
      avgFuelPrice: Money.create(row.avg_fuel_price),
      avgKmPerDay: row.avg_km_per_day,
      workDaysPerWeek: row.work_days_per_week,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    });
  }

  private toRow(config: DriverConfig): Partial<DriverConfigRow> {
    return {
      id: config.id,
      user_id: config.userId,
      profile: config.profile,
      car_value: config.carValue?.value ?? null,
      fuel_consumption: config.fuelConsumption,
      avg_fuel_price: config.avgFuelPrice.value,
      avg_km_per_day: config.avgKmPerDay,
      work_days_per_week: config.workDaysPerWeek,
      created_at: config.createdAt.toISOString(),
      updated_at: config.updatedAt.toISOString(),
    };
  }
}

