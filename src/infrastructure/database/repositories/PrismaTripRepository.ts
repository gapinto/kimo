import { ITripRepository } from '../../../domain/repositories/ITripRepository';
import { Trip } from '../../../domain/entities/Trip';
import { Money } from '../../../domain/value-objects/Money';
import { Distance } from '../../../domain/value-objects/Distance';
import { PrismaClient } from '@prisma/client';
import { DatabaseError } from '../../../shared/errors/AppError';

/**
 * PrismaTripRepository
 * Implementa ITripRepository usando Prisma ORM
 * COMPLETO - Todos os métodos implementados
 */
export class PrismaTripRepository implements ITripRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async save(trip: Trip): Promise<void> {
    try {
      await this.prisma.trip.create({
        data: {
          id: trip.id,
          userId: trip.userId,
          date: trip.date,
          earnings: trip.earnings.value,
          km: trip.km.value,
          timeOnlineMinutes: trip.timeOnlineMinutes,
          isPersonalUse: trip.isPersonalUse,
          note: trip.note,
          createdAt: trip.createdAt,
        },
      });
    } catch (error) {
      throw new DatabaseError('Failed to save trip', error);
    }
  }

  async findById(id: string): Promise<Trip | null> {
    try {
      const row = await this.prisma.trip.findUnique({
        where: { id },
      });

      if (!row) return null;

      return this.toDomain(row);
    } catch (error) {
      throw new DatabaseError('Failed to find trip by ID', error);
    }
  }

  async findByUserAndDate(userId: string, date: Date): Promise<Trip[]> {
    try {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      const rows = await this.prisma.trip.findMany({
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
      throw new DatabaseError('Failed to find trips by user and date', error);
    }
  }

  async findByUserAndDateRange(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<Trip[]> {
    try {
      const rows = await this.prisma.trip.findMany({
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
      throw new DatabaseError('Failed to find trips by date range', error);
    }
  }

  async getTotalEarningsByUserAndDate(userId: string, date: Date): Promise<number> {
    try {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      const result = await this.prisma.trip.aggregate({
        where: {
          userId,
          date: {
            gte: startOfDay,
            lte: endOfDay,
          },
        },
        _sum: {
          earnings: true,
        },
      });

      return Number(result._sum.earnings) || 0;
    } catch (error) {
      throw new DatabaseError('Failed to calculate total earnings', error);
    }
  }

  async getTotalKmByUserAndDate(userId: string, date: Date): Promise<number> {
    try {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      const result = await this.prisma.trip.aggregate({
        where: {
          userId,
          date: {
            gte: startOfDay,
            lte: endOfDay,
          },
        },
        _sum: {
          km: true,
        },
      });

      return result._sum.km || 0;
    } catch (error) {
      throw new DatabaseError('Failed to calculate total km', error);
    }
  }

  // Converter Prisma model para Domain entity
  private toDomain(row: any): Trip {
    return Trip.restore({
      id: row.id,
      userId: row.userId,
      date: row.date,
      earnings: Money.create(Number(row.earnings)),
      km: Distance.create(row.km),
      timeOnlineMinutes: row.timeOnlineMinutes,
      isPersonalUse: row.isPersonalUse,
      note: row.note ?? undefined,
      createdAt: row.createdAt,
    });
  }
}

