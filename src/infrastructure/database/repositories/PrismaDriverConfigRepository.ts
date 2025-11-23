import { IDriverConfigRepository } from '../../../domain/repositories/IDriverConfigRepository';
import { DriverConfig } from '../../../domain/entities/DriverConfig';
import { Money } from '../../../domain/value-objects/Money';
import { DriverProfile } from '../../../domain/enums';
import { PrismaClient } from '@prisma/client';
import { DatabaseError } from '../../../shared/errors/AppError';

/**
 * PrismaDriverConfigRepository
 * Implementa IDriverConfigRepository usando Prisma ORM
 * COMPLETO - Todos os métodos implementados
 */
export class PrismaDriverConfigRepository implements IDriverConfigRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async save(config: DriverConfig): Promise<void> {
    try {
      await this.prisma.driverConfig.create({
        data: {
          id: config.id,
          userId: config.userId,
          profile: config.profile,
          carValue: config.carValue?.value ?? null,
          fuelConsumption: config.fuelConsumption,
          avgFuelPrice: config.avgFuelPrice.value,
          avgKmPerDay: config.avgKmPerDay,
          workDaysPerWeek: config.workDaysPerWeek,
          financingBalance: config.financingBalance?.value ?? null,
          financingMonthlyPayment: config.financingMonthlyPayment?.value ?? null,
          financingRemainingMonths: config.financingRemainingMonths ?? null,
          createdAt: config.createdAt,
          updatedAt: config.updatedAt,
        },
      });
    } catch (error) {
      throw new DatabaseError('Failed to save driver config', error);
    }
  }

  async findById(id: string): Promise<DriverConfig | null> {
    try {
      const row = await this.prisma.driverConfig.findUnique({
        where: { id },
      });

      if (!row) return null;

      return this.toDomain(row);
    } catch (error) {
      throw new DatabaseError('Failed to find driver config by ID', error);
    }
  }

  async findByUserId(userId: string): Promise<DriverConfig | null> {
    try {
      const row = await this.prisma.driverConfig.findUnique({
        where: { userId },
      });

      if (!row) return null;

      return this.toDomain(row);
    } catch (error) {
      throw new DatabaseError('Failed to find driver config by user ID', error);
    }
  }

  async update(config: DriverConfig): Promise<void> {
    try {
      await this.prisma.driverConfig.update({
        where: { id: config.id },
        data: {
          profile: config.profile,
          carValue: config.carValue?.value ?? null,
          fuelConsumption: config.fuelConsumption,
          avgFuelPrice: config.avgFuelPrice.value,
          avgKmPerDay: config.avgKmPerDay,
          workDaysPerWeek: config.workDaysPerWeek,
          financingBalance: config.financingBalance?.value ?? null,
          financingMonthlyPayment: config.financingMonthlyPayment?.value ?? null,
          financingRemainingMonths: config.financingRemainingMonths ?? null,
          updatedAt: config.updatedAt,
        },
      });
    } catch (error) {
      throw new DatabaseError('Failed to update driver config', error);
    }
  }

  async existsByUserId(userId: string): Promise<boolean> {
    try {
      const count = await this.prisma.driverConfig.count({
        where: { userId },
      });

      return count > 0;
    } catch (error) {
      throw new DatabaseError('Failed to check if driver config exists', error);
    }
  }

  // Converter Prisma model para Domain entity
  private toDomain(row: any): DriverConfig {
    return DriverConfig.restore({
      id: row.id,
      userId: row.userId,
      profile: row.profile as DriverProfile,
      carValue: row.carValue ? Money.create(Number(row.carValue)) : undefined,
      fuelConsumption: row.fuelConsumption,
      avgFuelPrice: Money.create(Number(row.avgFuelPrice)),
      avgKmPerDay: row.avgKmPerDay,
      workDaysPerWeek: row.workDaysPerWeek,
      financingBalance: row.financingBalance
        ? Money.create(Number(row.financingBalance))
        : undefined,
      financingMonthlyPayment: row.financingMonthlyPayment
        ? Money.create(Number(row.financingMonthlyPayment))
        : undefined,
      financingRemainingMonths: row.financingRemainingMonths ?? undefined,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }
}

