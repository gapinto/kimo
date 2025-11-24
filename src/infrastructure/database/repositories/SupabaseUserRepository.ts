import { IUserRepository } from '../../../domain/repositories/IUserRepository';
import { User } from '../../../domain/entities/User';
import { Phone } from '../../../domain/value-objects/Phone';
import { DriverProfile, SubscriptionPlan } from '../../../domain/enums';
import { SupabaseClient } from '@supabase/supabase-js';
import { DatabaseError } from '../../../shared/errors/AppError';

interface UserRow {
  id: string;
  phone: string;
  name: string | null;
  weekly_goal: number | null;
  profile: string | null;
  subscription_plan: string;
  subscription_expires_at: string | null;
  is_active: boolean;
  last_activity_at: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * SupabaseUserRepository
 * Princípio: Dependency Inversion - implementa interface do domínio
 * Princípio: Single Responsibility - apenas persistência de User
 */
export class SupabaseUserRepository implements IUserRepository {
  private readonly tableName = 'users';

  constructor(private readonly client: SupabaseClient) {}

  async findByPhone(phone: Phone): Promise<User | null> {
    try {
      const { data, error } = await this.client
        .from(this.tableName)
        .select('*')
        .eq('phone', phone.value)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // Não encontrado
          return null;
        }
        throw new DatabaseError('Failed to find user by phone', error);
      }

      return data ? this.toDomain(data as UserRow) : null;
    } catch (error) {
      if (error instanceof DatabaseError) {
        throw error;
      }
      throw new DatabaseError('Unexpected error finding user by phone', error);
    }
  }

  async findById(id: string): Promise<User | null> {
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
        throw new DatabaseError('Failed to find user by id', error);
      }

      return data ? this.toDomain(data as UserRow) : null;
    } catch (error) {
      if (error instanceof DatabaseError) {
        throw error;
      }
      throw new DatabaseError('Unexpected error finding user by id', error);
    }
  }

  async findAll(): Promise<User[]> {
    try {
      const { data, error } = await this.client
        .from(this.tableName)
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw new DatabaseError('Failed to find all users', error);
      }

      return data ? data.map((row) => this.toDomain(row as UserRow)) : [];
    } catch (error) {
      if (error instanceof DatabaseError) {
        throw error;
      }
      throw new DatabaseError('Unexpected error finding all users', error);
    }
  }

  async save(user: User): Promise<void> {
    try {
      const row = this.toRow(user);

      const { error } = await this.client.from(this.tableName).insert(row);

      if (error) {
        throw new DatabaseError('Failed to save user', error);
      }
    } catch (error) {
      if (error instanceof DatabaseError) {
        throw error;
      }
      throw new DatabaseError('Unexpected error saving user', error);
    }
  }

  async update(user: User): Promise<void> {
    try {
      const row = this.toRow(user);

      const { error } = await this.client
        .from(this.tableName)
        .update(row)
        .eq('id', user.id);

      if (error) {
        throw new DatabaseError('Failed to update user', error);
      }
    } catch (error) {
      if (error instanceof DatabaseError) {
        throw error;
      }
      throw new DatabaseError('Unexpected error updating user', error);
    }
  }

  async existsByPhone(phone: Phone): Promise<boolean> {
    try {
      const { count, error } = await this.client
        .from(this.tableName)
        .select('id', { count: 'exact', head: true })
        .eq('phone', phone.value);

      if (error) {
        throw new DatabaseError('Failed to check if user exists', error);
      }

      return (count ?? 0) > 0;
    } catch (error) {
      if (error instanceof DatabaseError) {
        throw error;
      }
      throw new DatabaseError('Unexpected error checking user existence', error);
    }
  }

  // Conversores privados
  private toDomain(row: UserRow): User {
    return User.restore({
      id: row.id,
      phone: Phone.create(row.phone),
      name: row.name ?? undefined,
      weeklyGoal: row.weekly_goal ?? undefined,
      profile: row.profile ? (row.profile as DriverProfile) : undefined,
      subscriptionPlan: (row.subscription_plan as SubscriptionPlan) ?? SubscriptionPlan.FREE,
      subscriptionExpiresAt: row.subscription_expires_at
        ? new Date(row.subscription_expires_at)
        : undefined,
      isActive: row.is_active,
      lastActivityAt: row.last_activity_at ? new Date(row.last_activity_at) : undefined,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    });
  }

  private toRow(user: User): Partial<UserRow> {
    return {
      id: user.id,
      phone: user.phone.value,
      name: user.name ?? null,
      weekly_goal: user.weeklyGoal ?? null,
      profile: user.profile ?? null,
      subscription_plan: user.subscriptionPlan,
      subscription_expires_at: user.subscriptionExpiresAt?.toISOString() ?? null,
      is_active: user.isActive,
      last_activity_at: user.lastActivityAt?.toISOString() ?? null,
      created_at: user.createdAt.toISOString(),
      updated_at: user.updatedAt.toISOString(),
    };
  }
}

