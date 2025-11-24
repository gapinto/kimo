import { SupabaseClient } from '@supabase/supabase-js';
import { IPendingTripRepository } from '../../../domain/repositories/IPendingTripRepository';
import { PendingTrip, PendingTripStatus } from '../../../domain/entities/PendingTrip';
import { Money } from '../../../domain/value-objects/Money';

export class SupabasePendingTripRepository implements IPendingTripRepository {
  constructor(private readonly supabase: SupabaseClient) {}

  async save(pendingTrip: PendingTrip): Promise<void> {
    const { error } = await this.supabase.from('pending_trips').insert({
      id: pendingTrip.id,
      user_id: pendingTrip.userId,
      earnings: pendingTrip.earnings.value,
      km: pendingTrip.km,
      fuel: pendingTrip.fuel?.value,
      estimated_duration: pendingTrip.estimatedDuration,
      status: pendingTrip.status,
      evaluated_at: pendingTrip.evaluatedAt.toISOString(),
      completed_at: pendingTrip.completedAt?.toISOString(),
      reminder_sent_at: pendingTrip.reminderSentAt?.toISOString(),
      created_at: pendingTrip.createdAt.toISOString(),
      updated_at: pendingTrip.updatedAt.toISOString(),
    });

    if (error) {
      throw new Error(`Failed to save pending trip: ${error.message}`);
    }
  }

  async update(pendingTrip: PendingTrip): Promise<void> {
    const { error } = await this.supabase
      .from('pending_trips')
      .update({
        earnings: pendingTrip.earnings.value,
        km: pendingTrip.km,
        fuel: pendingTrip.fuel?.value,
        estimated_duration: pendingTrip.estimatedDuration,
        status: pendingTrip.status,
        completed_at: pendingTrip.completedAt?.toISOString(),
        reminder_sent_at: pendingTrip.reminderSentAt?.toISOString(),
        updated_at: pendingTrip.updatedAt.toISOString(),
      })
      .eq('id', pendingTrip.id);

    if (error) {
      throw new Error(`Failed to update pending trip: ${error.message}`);
    }
  }

  async findById(id: string): Promise<PendingTrip | null> {
    const { data, error } = await this.supabase
      .from('pending_trips')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      return null;
    }

    return this.toDomain(data);
  }

  async findLatestPendingByUserId(userId: string): Promise<PendingTrip | null> {
    const { data, error } = await this.supabase
      .from('pending_trips')
      .select('*')
      .eq('user_id', userId)
      .in('status', [PendingTripStatus.PENDING, PendingTripStatus.IN_PROGRESS])
      .order('evaluated_at', { ascending: false })
      .limit(1)
      .single();

    if (error || !data) {
      return null;
    }

    return this.toDomain(data);
  }

  async findPendingByUserId(userId: string): Promise<PendingTrip[]> {
    const { data, error } = await this.supabase
      .from('pending_trips')
      .select('*')
      .eq('user_id', userId)
      .in('status', [PendingTripStatus.PENDING, PendingTripStatus.IN_PROGRESS])
      .order('evaluated_at', { ascending: false });

    if (error || !data) {
      return [];
    }

    return data.map((item) => this.toDomain(item));
  }

  async findPendingForReminders(): Promise<PendingTrip[]> {
    const { data, error } = await this.supabase
      .from('pending_trips')
      .select('*')
      .in('status', [PendingTripStatus.PENDING, PendingTripStatus.IN_PROGRESS])
      .is('reminder_sent_at', null);

    if (error || !data) {
      return [];
    }

    // Filtrar no código quais passaram do tempo estimado
    const trips = data.map((item) => this.toDomain(item));
    return trips.filter((trip) => trip.shouldSendReminder());
  }

  async deleteById(id: string): Promise<void> {
    const { error } = await this.supabase.from('pending_trips').delete().eq('id', id);

    if (error) {
      throw new Error(`Failed to delete pending trip: ${error.message}`);
    }
  }

  async deleteOldCompleted(daysOld: number): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const { data, error } = await this.supabase
      .from('pending_trips')
      .delete()
      .eq('status', PendingTripStatus.COMPLETED)
      .lt('completed_at', cutoffDate.toISOString())
      .select(); // Precisa do .select() para retornar os deletados

    if (error) {
      throw new Error(`Failed to delete old completed trips: ${error.message}`);
    }

    return data?.length ?? 0;
  }

  private toDomain(data: any): PendingTrip {
    return PendingTrip.restore({
      id: data.id,
      userId: data.user_id,
      earnings: Money.create(Number(data.earnings)),
      km: data.km,
      fuel: data.fuel ? Money.create(Number(data.fuel)) : undefined,
      estimatedDuration: data.estimated_duration,
      status: data.status as PendingTripStatus,
      evaluatedAt: new Date(data.evaluated_at),
      completedAt: data.completed_at ? new Date(data.completed_at) : undefined,
      reminderSentAt: data.reminder_sent_at ? new Date(data.reminder_sent_at) : undefined,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    });
  }
}

