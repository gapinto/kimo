import { PrismaClient } from '@prisma/client';
import { IPendingTripRepository } from '../../../domain/repositories/IPendingTripRepository';
import { PendingTrip, PendingTripStatus } from '../../../domain/entities/PendingTrip';
import { Money } from '../../../domain/value-objects/Money';

export class PrismaPendingTripRepository implements IPendingTripRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async save(pendingTrip: PendingTrip): Promise<void> {
    await this.prisma.pendingTrip.create({
      data: {
        id: pendingTrip.id,
        userId: pendingTrip.userId,
        earnings: pendingTrip.earnings.value,
        km: pendingTrip.km,
        fuel: pendingTrip.fuel?.value,
        estimatedDuration: pendingTrip.estimatedDuration,
        status: pendingTrip.status,
        evaluatedAt: pendingTrip.evaluatedAt,
        completedAt: pendingTrip.completedAt,
        reminderSentAt: pendingTrip.reminderSentAt,
        createdAt: pendingTrip.createdAt,
        updatedAt: pendingTrip.updatedAt,
      },
    });
  }

  async update(pendingTrip: PendingTrip): Promise<void> {
    await this.prisma.pendingTrip.update({
      where: { id: pendingTrip.id },
      data: {
        earnings: pendingTrip.earnings.value,
        km: pendingTrip.km,
        fuel: pendingTrip.fuel?.value,
        estimatedDuration: pendingTrip.estimatedDuration,
        status: pendingTrip.status,
        completedAt: pendingTrip.completedAt,
        reminderSentAt: pendingTrip.reminderSentAt,
        updatedAt: pendingTrip.updatedAt,
      },
    });
  }

  async findById(id: string): Promise<PendingTrip | null> {
    const data = await this.prisma.pendingTrip.findUnique({
      where: { id },
    });

    if (!data) return null;

    return this.toDomain(data);
  }

  async findLatestPendingByUserId(userId: string): Promise<PendingTrip | null> {
    const data = await this.prisma.pendingTrip.findFirst({
      where: {
        userId,
        status: {
          in: [PendingTripStatus.PENDING, PendingTripStatus.IN_PROGRESS],
        },
      },
      orderBy: { evaluatedAt: 'desc' },
    });

    if (!data) return null;

    return this.toDomain(data);
  }

  async findPendingByUserId(userId: string): Promise<PendingTrip[]> {
    const data = await this.prisma.pendingTrip.findMany({
      where: {
        userId,
        status: {
          in: [PendingTripStatus.PENDING, PendingTripStatus.IN_PROGRESS],
        },
      },
      orderBy: { evaluatedAt: 'desc' },
    });

    return data.map((item) => this.toDomain(item));
  }

  async findPendingForReminders(): Promise<PendingTrip[]> {
    // Busca corridas que:
    // 1. Status é pending ou in_progress
    // 2. Ainda não enviou lembrete
    // 3. Passou o tempo estimado
    const now = new Date();

    const data = await this.prisma.pendingTrip.findMany({
      where: {
        status: {
          in: [PendingTripStatus.PENDING, PendingTripStatus.IN_PROGRESS],
        },
        reminderSentAt: null,
      },
    });

    // Filtrar no código quais passaram do tempo estimado
    const trips = data.map((item) => this.toDomain(item));
    return trips.filter((trip) => trip.shouldSendReminder());
  }

  async deleteById(id: string): Promise<void> {
    await this.prisma.pendingTrip.delete({
      where: { id },
    });
  }

  async deleteOldCompleted(daysOld: number): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const result = await this.prisma.pendingTrip.deleteMany({
      where: {
        status: PendingTripStatus.COMPLETED,
        completedAt: {
          lt: cutoffDate,
        },
      },
    });

    return result.count;
  }

  private toDomain(data: any): PendingTrip {
    return PendingTrip.restore({
      id: data.id,
      userId: data.userId,
      earnings: Money.create(Number(data.earnings)),
      km: data.km,
      fuel: data.fuel ? Money.create(Number(data.fuel)) : undefined,
      estimatedDuration: data.estimatedDuration,
      status: data.status as PendingTripStatus,
      evaluatedAt: data.evaluatedAt,
      completedAt: data.completedAt ?? undefined,
      reminderSentAt: data.reminderSentAt ?? undefined,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    });
  }
}

