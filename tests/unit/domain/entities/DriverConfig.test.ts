import { DriverConfig } from '../../../../src/domain/entities/DriverConfig';
import { Money } from '../../../../src/domain/value-objects/Money';
import { DriverProfile } from '../../../../src/domain/enums';

describe('DriverConfig Entity', () => {
  const userId = '123e4567-e89b-12d3-a456-426614174000';

  describe('create', () => {
    it('should create driver config with all data', () => {
      // Given
      const profile = DriverProfile.OWN_PAID;
      const carValue = Money.create(50000);
      const fuelConsumption = 12; // km/litro
      const avgFuelPrice = Money.create(5.50);
      const avgKmPerDay = 150;

      // When
      const config = DriverConfig.create({
        userId,
        profile,
        carValue,
        fuelConsumption,
        avgFuelPrice,
        avgKmPerDay,
        workDaysPerWeek: 6,
      });

      // Then
      expect(config.id).toBeDefined();
      expect(config.userId).toBe(userId);
      expect(config.profile).toBe(profile);
      expect(config.carValue).toBe(carValue);
      expect(config.fuelConsumption).toBe(12);
      expect(config.avgFuelPrice).toBe(avgFuelPrice);
      expect(config.avgKmPerDay).toBe(150);
      expect(config.workDaysPerWeek).toBe(6);
    });

    it('should create driver config for rented car without car value', () => {
      // Given
      const profile = DriverProfile.RENTED;

      // When
      const config = DriverConfig.create({
        userId,
        profile,
        fuelConsumption: 12,
        avgFuelPrice: Money.create(5.50),
        avgKmPerDay: 150,
      });

      // Then
      expect(config.profile).toBe(DriverProfile.RENTED);
      expect(config.carValue).toBeUndefined();
    });

    it('should throw error for invalid fuel consumption', () => {
      // Given
      const invalidData = {
        userId,
        profile: DriverProfile.OWN_PAID,
        fuelConsumption: 0,
        avgFuelPrice: Money.create(5.50),
        avgKmPerDay: 150,
      };

      // When/Then
      expect(() => DriverConfig.create(invalidData)).toThrow(
        'Fuel consumption must be positive'
      );
    });

    it('should throw error for invalid work days per week', () => {
      // Given
      const invalidData = {
        userId,
        profile: DriverProfile.OWN_PAID,
        fuelConsumption: 12,
        avgFuelPrice: Money.create(5.50),
        avgKmPerDay: 150,
        workDaysPerWeek: 8,
      };

      // When/Then
      expect(() => DriverConfig.create(invalidData)).toThrow(
        'Work days per week must be between 1 and 7'
      );
    });
  });

  describe('calculateFuelCostPerKm', () => {
    it('should calculate fuel cost per km correctly', () => {
      // Given
      const config = DriverConfig.create({
        userId,
        profile: DriverProfile.OWN_PAID,
        fuelConsumption: 10, // 10 km/litro
        avgFuelPrice: Money.create(5), // R$ 5/litro
        avgKmPerDay: 150,
      });

      // When
      const costPerKm = config.calculateFuelCostPerKm();

      // Then
      expect(costPerKm.value).toBe(0.5); // R$ 5 / 10 km = R$ 0.50/km
    });

    it('should calculate fuel cost for different consumption', () => {
      // Given
      const config = DriverConfig.create({
        userId,
        profile: DriverProfile.RENTED,
        fuelConsumption: 12, // 12 km/litro
        avgFuelPrice: Money.create(6), // R$ 6/litro
        avgKmPerDay: 200,
      });

      // When
      const costPerKm = config.calculateFuelCostPerKm();

      // Then
      expect(costPerKm.value).toBe(0.5); // R$ 6 / 12 km = R$ 0.50/km
    });
  });

  describe('calculateMonthlyDepreciation', () => {
    it('should calculate monthly depreciation for owned car', () => {
      // Given - Carro de R$ 50.000
      const config = DriverConfig.create({
        userId,
        profile: DriverProfile.OWN_PAID,
        carValue: Money.create(50000),
        fuelConsumption: 12,
        avgFuelPrice: Money.create(5.50),
        avgKmPerDay: 150,
      });

      // When
      const monthlyDepreciation = config.calculateMonthlyDepreciation();

      // Then
      // 18% ao ano de R$ 50.000 = R$ 9.000 / 12 meses = R$ 750/mês
      expect(monthlyDepreciation).not.toBeNull();
      expect(monthlyDepreciation?.value).toBe(750);
    });

    it('should return null for rented car', () => {
      // Given
      const config = DriverConfig.create({
        userId,
        profile: DriverProfile.RENTED,
        fuelConsumption: 12,
        avgFuelPrice: Money.create(5.50),
        avgKmPerDay: 150,
      });

      // When
      const monthlyDepreciation = config.calculateMonthlyDepreciation();

      // Then
      expect(monthlyDepreciation).toBeNull();
    });
  });

  describe('calculateWeeklyDepreciation', () => {
    it('should calculate weekly depreciation', () => {
      // Given
      const config = DriverConfig.create({
        userId,
        profile: DriverProfile.OWN_FINANCED,
        carValue: Money.create(43300), // Valor calculado para fechar conta
        fuelConsumption: 12,
        avgFuelPrice: Money.create(5.50),
        avgKmPerDay: 150,
      });

      // When
      const weeklyDepreciation = config.calculateWeeklyDepreciation();

      // Then
      // R$ 43.300 * 18% = R$ 7.794 / ano
      // R$ 7.794 / 12 = R$ 649,50 / mês
      // R$ 649,50 / 4.33 = ~R$ 150 / semana
      expect(weeklyDepreciation).not.toBeNull();
      expect(weeklyDepreciation?.value).toBeCloseTo(150, 0);
    });
  });

  describe('estimateWeeklyKm', () => {
    it('should estimate weekly km', () => {
      // Given
      const config = DriverConfig.create({
        userId,
        profile: DriverProfile.OWN_PAID,
        fuelConsumption: 12,
        avgFuelPrice: Money.create(5.50),
        avgKmPerDay: 150,
        workDaysPerWeek: 6,
      });

      // When
      const weeklyKm = config.estimateWeeklyKm();

      // Then
      expect(weeklyKm).toBe(900); // 150 km/dia * 6 dias
    });
  });

  describe('estimateMonthlyKm', () => {
    it('should estimate monthly km', () => {
      // Given
      const config = DriverConfig.create({
        userId,
        profile: DriverProfile.HYBRID,
        fuelConsumption: 12,
        avgFuelPrice: Money.create(5.50),
        avgKmPerDay: 150,
        workDaysPerWeek: 6,
      });

      // When
      const monthlyKm = config.estimateMonthlyKm();

      // Then
      expect(monthlyKm).toBeCloseTo(3897, 0); // 150 * 6 * 4.33
    });
  });

  describe('update methods', () => {
    it('should update profile', () => {
      // Given
      const config = DriverConfig.create({
        userId,
        profile: DriverProfile.OWN_FINANCED,
        fuelConsumption: 12,
        avgFuelPrice: Money.create(5.50),
        avgKmPerDay: 150,
      });

      // When
      config.updateProfile(DriverProfile.OWN_PAID);

      // Then
      expect(config.profile).toBe(DriverProfile.OWN_PAID);
    });

    it('should update car value', () => {
      // Given
      const config = DriverConfig.create({
        userId,
        profile: DriverProfile.OWN_PAID,
        carValue: Money.create(50000),
        fuelConsumption: 12,
        avgFuelPrice: Money.create(5.50),
        avgKmPerDay: 150,
      });

      // When
      config.updateCarValue(Money.create(45000));

      // Then
      expect(config.carValue?.value).toBe(45000);
    });

    it('should update fuel consumption', () => {
      // Given
      const config = DriverConfig.create({
        userId,
        profile: DriverProfile.RENTED,
        fuelConsumption: 12,
        avgFuelPrice: Money.create(5.50),
        avgKmPerDay: 150,
      });

      // When
      config.updateFuelConsumption(14);

      // Then
      expect(config.fuelConsumption).toBe(14);
    });

    it('should throw error for invalid fuel consumption update', () => {
      // Given
      const config = DriverConfig.create({
        userId,
        profile: DriverProfile.RENTED,
        fuelConsumption: 12,
        avgFuelPrice: Money.create(5.50),
        avgKmPerDay: 150,
      });

      // When/Then
      expect(() => config.updateFuelConsumption(0)).toThrow(
        'Fuel consumption must be positive'
      );
    });
  });

  describe('toJSON', () => {
    it('should serialize to JSON', () => {
      // Given
      const config = DriverConfig.create({
        userId,
        profile: DriverProfile.RENTED,
        fuelConsumption: 12,
        avgFuelPrice: Money.create(5.50),
        avgKmPerDay: 150,
        workDaysPerWeek: 6,
      });

      // When
      const json = config.toJSON();

      // Then
      expect(json).toHaveProperty('id');
      expect(json).toHaveProperty('userId', userId);
      expect(json).toHaveProperty('profile', 'rented');
      expect(json).toHaveProperty('fuelConsumption', 12);
      expect(json).toHaveProperty('avgFuelPrice', 5.50);
      expect(json).toHaveProperty('avgKmPerDay', 150);
      expect(json).toHaveProperty('workDaysPerWeek', 6);
    });
  });
});

