import { CalculateBreakeven } from '../../../../src/domain/usecases/CalculateBreakeven';
import { IDriverConfigRepository } from '../../../../src/domain/repositories/IDriverConfigRepository';
import { IFixedCostRepository } from '../../../../src/domain/repositories/IFixedCostRepository';
import { IDailySummaryRepository } from '../../../../src/domain/repositories/IDailySummaryRepository';
import { DriverConfig } from '../../../../src/domain/entities/DriverConfig';
import { FixedCost } from '../../../../src/domain/entities/FixedCost';
import { DailySummary } from '../../../../src/domain/entities/DailySummary';
import { Money } from '../../../../src/domain/value-objects/Money';
import { Distance } from '../../../../src/domain/value-objects/Distance';
import { DriverProfile, FixedCostType, CostFrequency } from '../../../../src/domain/enums';

describe('CalculateBreakeven Use Case', () => {
  let calculateBreakeven: CalculateBreakeven;
  let mockDriverConfigRepo: jest.Mocked<IDriverConfigRepository>;
  let mockFixedCostRepo: jest.Mocked<IFixedCostRepository>;
  let mockDailySummaryRepo: jest.Mocked<IDailySummaryRepository>;

  const userId = '123e4567-e89b-12d3-a456-426614174000';

  beforeEach(() => {
    mockDriverConfigRepo = {
      findByUserId: jest.fn(),
      findById: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      existsByUserId: jest.fn(),
    };

    mockFixedCostRepo = {
      findActiveByUserId: jest.fn(),
      findById: jest.fn(),
      findAllByUserId: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      getTotalMonthlyFixedCosts: jest.fn(),
      getTotalWeeklyFixedCosts: jest.fn(),
      getTotalDailyFixedCosts: jest.fn(),
    };

    mockDailySummaryRepo = {
      upsert: jest.fn(),
      findById: jest.fn(),
      findByUserAndDate: jest.fn(),
      findByUserAndDateRange: jest.fn(),
      getTotalProfitByUserAndDateRange: jest.fn(),
      existsByUserAndDate: jest.fn(),
    };

    calculateBreakeven = new CalculateBreakeven(
      mockDriverConfigRepo,
      mockFixedCostRepo,
      mockDailySummaryRepo
    );
  });

  describe('when driver has rented car', () => {
    it('should calculate breakeven considering weekly rental', async () => {
      // Given - Motorista com carro alugado
      const config = DriverConfig.create({
        userId,
        profile: DriverProfile.RENTED,
        fuelConsumption: 12,
        avgFuelPrice: Money.create(5.50),
        avgKmPerDay: 150,
        workDaysPerWeek: 6,
      });

      const rental = FixedCost.create({
        userId,
        type: FixedCostType.RENTAL,
        amount: Money.create(900), // R$ 900/semana
        frequency: CostFrequency.WEEKLY,
      });

      // Resumos da semana até quarta-feira (3 dias)
      const summaries = [
        DailySummary.create({
          userId,
          date: new Date('2024-01-14'), // Domingo
          earnings: Money.create(200),
          expenses: Money.create(70),
          km: Distance.create(150),
        }),
        DailySummary.create({
          userId,
          date: new Date('2024-01-15'), // Segunda
          earnings: Money.create(250),
          expenses: Money.create(75),
          km: Distance.create(180),
        }),
        DailySummary.create({
          userId,
          date: new Date('2024-01-16'), // Terça
          earnings: Money.create(220),
          expenses: Money.create(65),
          km: Distance.create(160),
        }),
      ];

      mockDriverConfigRepo.findByUserId.mockResolvedValue(config);
      mockFixedCostRepo.findActiveByUserId.mockResolvedValue([rental]);
      mockDailySummaryRepo.findByUserAndDateRange.mockResolvedValue(summaries);
      mockDailySummaryRepo.getTotalProfitByUserAndDateRange.mockResolvedValue(460);

      const referenceDate = new Date('2024-01-17'); // Quarta-feira

      // When
      const result = await calculateBreakeven.execute({
        userId,
        referenceDate,
      });

      // Then
      expect(result.profile).toBe(DriverProfile.RENTED);
      expect(result.weeklyFixedCosts).toBe(900); // Aluguel semanal
      expect(result.weeklyEarnings).toBe(670); // 200 + 250 + 220
      expect(result.weeklyVariableCosts).toBe(210); // 70 + 75 + 65
      expect(result.remainingToBreakeven).toBeGreaterThan(0);
      expect(result.daysLeft).toBe(3); // Até domingo
      expect(result.message).toContain('Para fechar a semana no zero a zero');
    });
  });

  describe('when driver has own car', () => {
    it('should calculate breakeven including depreciation', async () => {
      // Given - Motorista com carro próprio
      const config = DriverConfig.create({
        userId,
        profile: DriverProfile.OWN_PAID,
        carValue: Money.create(50000),
        fuelConsumption: 12,
        avgFuelPrice: Money.create(5.50),
        avgKmPerDay: 150,
        workDaysPerWeek: 6,
      });

      const insurance = FixedCost.create({
        userId,
        type: FixedCostType.INSURANCE,
        amount: Money.create(150),
        frequency: CostFrequency.MONTHLY,
      });

      const summaries = [
        DailySummary.create({
          userId,
          date: new Date('2024-01-14'),
          earnings: Money.create(300),
          expenses: Money.create(80),
          km: Distance.create(200),
        }),
      ];

      mockDriverConfigRepo.findByUserId.mockResolvedValue(config);
      mockFixedCostRepo.findActiveByUserId.mockResolvedValue([insurance]);
      mockDailySummaryRepo.findByUserAndDateRange.mockResolvedValue(summaries);
      mockDailySummaryRepo.getTotalProfitByUserAndDateRange.mockResolvedValue(220);

      const referenceDate = new Date('2024-01-14'); // Domingo

      // When
      const result = await calculateBreakeven.execute({
        userId,
        referenceDate,
      });

      // Then
      expect(result.profile).toBe(DriverProfile.OWN_PAID);
      // Deve incluir depreciação nos custos fixos
      expect(result.weeklyFixedCosts).toBeGreaterThan(34.67); // Seguro semanal (150/4.33)
      expect(result.message).toBeDefined();
    });
  });

  describe('when week is already profitable', () => {
    it('should show congratulations message', async () => {
      // Given - Motorista que já fechou a semana no positivo
      const config = DriverConfig.create({
        userId,
        profile: DriverProfile.RENTED,
        fuelConsumption: 12,
        avgFuelPrice: Money.create(5.50),
        avgKmPerDay: 150,
      });

      const rental = FixedCost.create({
        userId,
        type: FixedCostType.RENTAL,
        amount: Money.create(700),
        frequency: CostFrequency.WEEKLY,
      });

      // Ganhou muito mais que os custos
      const summaries = [
        DailySummary.create({
          userId,
          date: new Date('2024-01-14'),
          earnings: Money.create(1500), // Ganhou muito!
          expenses: Money.create(200),
          km: Distance.create(300),
        }),
      ];

      mockDriverConfigRepo.findByUserId.mockResolvedValue(config);
      mockFixedCostRepo.findActiveByUserId.mockResolvedValue([rental]);
      mockDailySummaryRepo.findByUserAndDateRange.mockResolvedValue(summaries);
      mockDailySummaryRepo.getTotalProfitByUserAndDateRange.mockResolvedValue(600);

      const referenceDate = new Date('2024-01-14');

      // When
      const result = await calculateBreakeven.execute({
        userId,
        referenceDate,
      });

      // Then
      expect(result.remainingToBreakeven).toBe(0);
      expect(result.message).toContain('Parabéns');
      expect(result.message).toContain('fechou a semana no positivo');
    });
  });

  describe('when it is Sunday', () => {
    it('should show week closing message', async () => {
      // Given
      const config = DriverConfig.create({
        userId,
        profile: DriverProfile.RENTED,
        fuelConsumption: 12,
        avgFuelPrice: Money.create(5.50),
        avgKmPerDay: 150,
      });

      mockDriverConfigRepo.findByUserId.mockResolvedValue(config);
      mockFixedCostRepo.findActiveByUserId.mockResolvedValue([]);
      mockDailySummaryRepo.findByUserAndDateRange.mockResolvedValue([]);
      mockDailySummaryRepo.getTotalProfitByUserAndDateRange.mockResolvedValue(-50);

      const referenceDate = new Date('2024-01-14'); // Domingo (day = 0)

      // When
      const result = await calculateBreakeven.execute({
        userId,
        referenceDate,
      });

      // Then
      expect(result.daysLeft).toBe(0);
      expect(result.message).toContain('Hoje é domingo');
      expect(result.message).toContain('fechou a semana');
    });
  });

  describe('error handling', () => {
    it('should throw error when driver config not found', async () => {
      // Given
      mockDriverConfigRepo.findByUserId.mockResolvedValue(null);

      // When/Then
      await expect(
        calculateBreakeven.execute({
          userId,
          referenceDate: new Date(),
        })
      ).rejects.toThrow('Driver config not found');
    });

    it('should throw error when userId is missing', async () => {
      // Given
      const invalidInput = {
        userId: '',
        referenceDate: new Date(),
      };

      // When/Then
      await expect(calculateBreakeven.execute(invalidInput)).rejects.toThrow(
        'User ID is required'
      );
    });
  });
});

