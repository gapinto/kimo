import { IUserRepository } from '../../../domain/repositories/IUserRepository';
import { User } from '../../../domain/entities/User';
import { Phone } from '../../../domain/value-objects/Phone';
import { SubscriptionPlan } from '../../../domain/enums';
import { PrismaClient } from '@prisma/client';
import { DatabaseError } from '../../../shared/errors/AppError';

/**
 * PrismaUserRepository
 * Implementa IUserRepository usando Prisma ORM
 */
export class PrismaUserRepository implements IUserRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async save(user: User): Promise<void> {
    try {
      await this.prisma.user.create({
        data: {
          id: user.id,
          phone: user.phone.value,
          name: user.name,
          isActive: user.isActive,
          lastActivityAt: user.lastActivityAt,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
      });
    } catch (error) {
      throw new DatabaseError('Failed to save user', error);
    }
  }

  async findById(id: string): Promise<User | null> {
    try {
      const row = await this.prisma.user.findUnique({
        where: { id },
      });

      if (!row) return null;

      return User.restore({
        id: row.id,
        phone: Phone.create(row.phone),
        name: row.name ?? undefined,
        subscriptionPlan: SubscriptionPlan.FREE,
        isActive: row.isActive,
        lastActivityAt: row.lastActivityAt ?? undefined,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      });
    } catch (error) {
      throw new DatabaseError('Failed to find user by ID', error);
    }
  }

  async findByPhone(phone: Phone): Promise<User | null> {
    try {
      const row = await this.prisma.user.findUnique({
        where: { phone: phone.value },
      });

      if (!row) return null;

      return User.restore({
        id: row.id,
        phone: Phone.create(row.phone),
        name: row.name ?? undefined,
        subscriptionPlan: SubscriptionPlan.FREE,
        isActive: row.isActive,
        lastActivityAt: row.lastActivityAt ?? undefined,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      });
    } catch (error) {
      console.error('PrismaUserRepository.findByPhone error details:', {
        phone: phone.value,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw new DatabaseError('Failed to find user by phone', error);
    }
  }

  async findAll(): Promise<User[]> {
    try {
      const rows = await this.prisma.user.findMany();

      return rows.map(row => User.restore({
        id: row.id,
        phone: Phone.create(row.phone),
        name: row.name ?? undefined,
        subscriptionPlan: SubscriptionPlan.FREE,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      }));
    } catch (error) {
      throw new DatabaseError('Failed to find all users', error);
    }
  }

  async update(user: User): Promise<void> {
    try {
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          phone: user.phone.value,
          name: user.name,
          isActive: user.isActive,
          lastActivityAt: user.lastActivityAt,
          updatedAt: user.updatedAt,
        },
      });
    } catch (error) {
      throw new DatabaseError('Failed to update user', error);
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await this.prisma.user.delete({
        where: { id },
      });
    } catch (error) {
      throw new DatabaseError('Failed to delete user', error);
    }
  }

  async existsByPhone(phone: Phone): Promise<boolean> {
    try {
      const count = await this.prisma.user.count({
        where: { phone: phone.value },
      });

      return count > 0;
    } catch (error) {
      throw new DatabaseError('Failed to check if user exists', error);
    }
  }
}
