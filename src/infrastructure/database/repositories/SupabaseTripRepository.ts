import { ITripRepository } from '../../../domain/repositories/ITripRepository';
import { Trip } from '../../../domain/entities/Trip';
import { Money } from '../../../domain/value-objects/Money';
import { Distance } from '../../../domain/value-objects/Distance';
import { SupabaseClient } from '@supabase/supabase-js';
import { DatabaseError } from '../../../shared/errors/AppError';

interface TripRow {
  id: string;
  user_id: string;
  date: string;
  earnings: number;
  km: number;
  time_online_minutes: number;
  is_personal_use: boolean;
  note: string | null;
  created_at: string;
}

/**
 * SupabaseTripRepository
 * Implementa ITripRepository usando Supabase
 */
export class SupabaseTripRepository implements ITripRepository {
  private readonly tableName = 'trips';

  constructor(private readonly client: SupabaseClient) {}

  async save(trip: Trip): Promise<void> {
    try {
      const row = this.toRow(trip);

      const { error } = await this.client.from(this.tableName).insert(row);

      if (error) {
        throw new DatabaseError('Failed to save trip', error);
      }
    } catch (error) {
      if (error instanceof DatabaseError) {
        throw error;
      }
      throw new DatabaseError('Unexpected error saving trip', error);
    }
  }

  async findById(id: string): Promise<Trip | null> {
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
        throw new DatabaseError('Failed to find trip', error);
      }

      return data ? this.toDomain(data as TripRow) : null;
    } catch (error) {
      if (error instanceof DatabaseError) {
        throw error;
      }
      throw new DatabaseError('Unexpected error finding trip', error);
    }
  }

  async findByUserAndDate(userId: string, date: Date): Promise<Trip[]> {
    try {
      const dateStr = this.formatDate(date);

      const { data, error } = await this.client
        .from(this.tableName)
        .select('*')
        .eq('user_id', userId)
        .eq('date', dateStr)
        .order('created_at', { ascending: false });

      if (error) {
        throw new DatabaseError('Failed to find trips by user and date', error);
      }

      return (data as TripRow[]).map((row) => this.toDomain(row));
    } catch (error) {
      if (error instanceof DatabaseError) {
        throw error;
      }
      throw new DatabaseError('Unexpected error finding trips', error);
    }
  }

  async findByUserAndDateRange(userId: string, startDate: Date, endDate: Date): Promise<Trip[]> {
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
        throw new DatabaseError('Failed to find trips by date range', error);
      }

      return (data as TripRow[]).map((row) => this.toDomain(row));
    } catch (error) {
      if (error instanceof DatabaseError) {
        throw error;
      }
      throw new DatabaseError('Unexpected error finding trips by range', error);
    }
  }

  async getTotalEarningsByUserAndDate(userId: string, date: Date): Promise<number> {
    try {
      const dateStr = this.formatDate(date);

      const { data, error } = await this.client
        .from(this.tableName)
        .select('earnings')
        .eq('user_id', userId)
        .eq('date', dateStr);

      if (error) {
        throw new DatabaseError('Failed to get total earnings', error);
      }

      const total = (data as { earnings: number }[]).reduce(
        (sum, row) => sum + row.earnings,
        0
      );

      return total;
    } catch (error) {
      if (error instanceof DatabaseError) {
        throw error;
      }
      throw new DatabaseError('Unexpected error calculating total earnings', error);
    }
  }

  async getTotalKmByUserAndDate(userId: string, date: Date): Promise<number> {
    try {
      const dateStr = this.formatDate(date);

      const { data, error } = await this.client
        .from(this.tableName)
        .select('km')
        .eq('user_id', userId)
        .eq('date', dateStr);

      if (error) {
        throw new DatabaseError('Failed to get total km', error);
      }

      const total = (data as { km: number }[]).reduce((sum, row) => sum + row.km, 0);

      return total;
    } catch (error) {
      if (error instanceof DatabaseError) {
        throw error;
      }
      throw new DatabaseError('Unexpected error calculating total km', error);
    }
  }

  // Helpers privados
  private toDomain(row: TripRow): Trip {
    return Trip.restore({
      id: row.id || '',
      userId: row.user_id,
      date: new Date(row.date),
      earnings: Money.create(row.earnings),
      km: Distance.create(row.km),
      timeOnlineMinutes: row.time_online_minutes,
      isPersonalUse: row.is_personal_use ?? false,
      note: row.note ?? undefined,
      createdAt: new Date(row.created_at),
    });
  }

  private toRow(trip: Trip): Partial<TripRow> {
    return {
      id: trip.id,
      user_id: trip.userId,
      date: this.formatDate(trip.date),
      earnings: trip.earnings.value,
      km: trip.km.value,
      time_online_minutes: trip.timeOnlineMinutes,
      is_personal_use: trip.isPersonalUse,
      note: trip.note ?? null,
      created_at: trip.createdAt.toISOString(),
    };
  }

  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0]; // YYYY-MM-DD
  }
}

