import { FixedCost } from '../../../../src/domain/entities/FixedCost';
import { Money } from '../../../../src/domain/value-objects/Money';
import { FixedCostType, CostFrequency } from '../../../../src/domain/enums';

describe('FixedCost Entity', () => {
  const userId = '123e4567-e89b-12d3-a456-426614174000';

  describe('create', () => {
    it('should create a fixed cost with valid data', () => {
      // Given
      const amount = Money.create(900);
      const type = FixedCostType.RENTAL;
      const frequency = CostFrequency.WEEKLY;

      // When
      const fixedCost = FixedCost.create({
        userId,
        type,
        amount,
        frequency,
        description: 'Aluguel Movida',
      });

      // Then
      expect(fixedCost.id).toBeDefined();
      expect(fixedCost.userId).toBe(userId);
      expect(fixedCost.type).toBe(type);
      expect(fixedCost.amount).toBe(amount);
      expect(fixedCost.frequency).toBe(frequency);
      expect(fixedCost.description).toBe('Aluguel Movida');
      expect(fixedCost.isActive).toBe(true);
    });

    it('should create fixed cost without optional description', () => {
      // Given
      const amount = Money.create(150);

      // When
      const fixedCost = FixedCost.create({
        userId,
        type: FixedCostType.INSURANCE,
        amount,
        frequency: CostFrequency.MONTHLY,
      });

      // Then
      expect(fixedCost.description).toBeUndefined();
    });

    it('should throw error when userId is missing', () => {
      // Given
      const invalidData = {
        userId: '',
        type: FixedCostType.RENTAL,
        amount: Money.create(900),
        frequency: CostFrequency.WEEKLY,
      };

      // When/Then
      expect(() => FixedCost.create(invalidData)).toThrow('User ID is required');
    });
  });

  describe('frequency conversions', () => {
    describe('toDailyAmount', () => {
      it('should convert daily cost to daily', () => {
        // Given
        const dailyCost = FixedCost.create({
          userId,
          type: FixedCostType.PHONE_PLAN,
          amount: Money.create(5),
          frequency: CostFrequency.DAILY,
        });

        // When
        const result = dailyCost.toDailyAmount();

        // Then
        expect(result.value).toBe(5);
      });

      it('should convert weekly cost to daily', () => {
        // Given
        const weeklyCost = FixedCost.create({
          userId,
          type: FixedCostType.RENTAL,
          amount: Money.create(700),
          frequency: CostFrequency.WEEKLY,
        });

        // When
        const result = weeklyCost.toDailyAmount();

        // Then
        expect(result.value).toBe(100); // 700 / 7
      });

      it('should convert monthly cost to daily', () => {
        // Given
        const monthlyCost = FixedCost.create({
          userId,
          type: FixedCostType.FINANCING,
          amount: Money.create(900),
          frequency: CostFrequency.MONTHLY,
        });

        // When
        const result = monthlyCost.toDailyAmount();

        // Then
        expect(result.value).toBe(30); // 900 / 30
      });

      it('should convert yearly cost to daily', () => {
        // Given
        const yearlyCost = FixedCost.create({
          userId,
          type: FixedCostType.IPVA,
          amount: Money.create(3650),
          frequency: CostFrequency.YEARLY,
        });

        // When
        const result = yearlyCost.toDailyAmount();

        // Then
        expect(result.value).toBe(10); // 3650 / 365
      });
    });

    describe('toWeeklyAmount', () => {
      it('should convert daily cost to weekly', () => {
        // Given
        const dailyCost = FixedCost.create({
          userId,
          type: FixedCostType.PHONE_PLAN,
          amount: Money.create(10),
          frequency: CostFrequency.DAILY,
        });

        // When
        const result = dailyCost.toWeeklyAmount();

        // Then
        expect(result.value).toBe(70); // 10 * 7
      });

      it('should convert monthly cost to weekly', () => {
        // Given
        const monthlyCost = FixedCost.create({
          userId,
          type: FixedCostType.INSURANCE,
          amount: Money.create(433),
          frequency: CostFrequency.MONTHLY,
        });

        // When
        const result = monthlyCost.toWeeklyAmount();

        // Then
        expect(result.value).toBeCloseTo(100, 0); // 433 / 4.33
      });
    });

    describe('toMonthlyAmount', () => {
      it('should convert weekly cost to monthly', () => {
        // Given
        const weeklyCost = FixedCost.create({
          userId,
          type: FixedCostType.RENTAL,
          amount: Money.create(900),
          frequency: CostFrequency.WEEKLY,
        });

        // When
        const result = weeklyCost.toMonthlyAmount();

        // Then
        expect(result.value).toBeCloseTo(3897, 0); // 900 * 4.33
      });

      it('should convert yearly cost to monthly', () => {
        // Given
        const yearlyCost = FixedCost.create({
          userId,
          type: FixedCostType.IPVA,
          amount: Money.create(1200),
          frequency: CostFrequency.YEARLY,
        });

        // When
        const result = yearlyCost.toMonthlyAmount();

        // Then
        expect(result.value).toBe(100); // 1200 / 12
      });
    });
  });

  describe('activate and deactivate', () => {
    it('should deactivate a fixed cost', () => {
      // Given
      const fixedCost = FixedCost.create({
        userId,
        type: FixedCostType.RENTAL,
        amount: Money.create(900),
        frequency: CostFrequency.WEEKLY,
      });

      // When
      fixedCost.deactivate();

      // Then
      expect(fixedCost.isActive).toBe(false);
      expect(fixedCost.endDate).toBeDefined();
    });

    it('should activate a deactivated fixed cost', () => {
      // Given
      const fixedCost = FixedCost.create({
        userId,
        type: FixedCostType.RENTAL,
        amount: Money.create(900),
        frequency: CostFrequency.WEEKLY,
      });
      fixedCost.deactivate();

      // When
      fixedCost.activate();

      // Then
      expect(fixedCost.isActive).toBe(true);
      expect(fixedCost.endDate).toBeUndefined();
    });
  });

  describe('updateAmount', () => {
    it('should update the amount of a fixed cost', () => {
      // Given
      const fixedCost = FixedCost.create({
        userId,
        type: FixedCostType.RENTAL,
        amount: Money.create(900),
        frequency: CostFrequency.WEEKLY,
      });
      const newAmount = Money.create(950);

      // When
      fixedCost.updateAmount(newAmount);

      // Then
      expect(fixedCost.amount.value).toBe(950);
    });
  });

  describe('toJSON', () => {
    it('should serialize to JSON', () => {
      // Given
      const fixedCost = FixedCost.create({
        userId,
        type: FixedCostType.RENTAL,
        amount: Money.create(900),
        frequency: CostFrequency.WEEKLY,
        description: 'Aluguel Movida',
      });

      // When
      const json = fixedCost.toJSON();

      // Then
      expect(json).toHaveProperty('id');
      expect(json).toHaveProperty('userId', userId);
      expect(json).toHaveProperty('type', 'rental');
      expect(json).toHaveProperty('amount', 900);
      expect(json).toHaveProperty('frequency', 'weekly');
      expect(json).toHaveProperty('description', 'Aluguel Movida');
      expect(json).toHaveProperty('isActive', true);
    });
  });
});

