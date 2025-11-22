import { DailySummary } from '../../../../src/domain/entities/DailySummary';
import { Money } from '../../../../src/domain/value-objects/Money';
import { Distance } from '../../../../src/domain/value-objects/Distance';

describe('DailySummary Entity', () => {
  const userId = '123e4567-e89b-12d3-a456-426614174000';
  const date = new Date('2024-01-15');

  describe('create', () => {
    it('should create a daily summary with valid data', () => {
      const earnings = Money.create(200);
      const expenses = Money.create(60);
      const km = Distance.create(150);

      const summary = DailySummary.create({
        userId,
        date,
        earnings,
        expenses,
        km,
      });

      expect(summary.id).toBeDefined();
      expect(summary.userId).toBe(userId);
      expect(summary.date).toBe(date);
      expect(summary.earnings).toBe(earnings);
      expect(summary.expenses).toBe(expenses);
      expect(summary.km).toBe(km);
      expect(summary.profit.value).toBe(140); // 200 - 60
      expect(summary.costPerKm?.value).toBeCloseTo(0.4, 2); // 60 / 150
    });

    it('should calculate profit correctly', () => {
      const earnings = Money.create(300);
      const expenses = Money.create(100);
      const km = Distance.create(200);

      const summary = DailySummary.create({
        userId,
        date,
        earnings,
        expenses,
        km,
      });

      expect(summary.profit.value).toBe(200); // 300 - 100
    });

    it('should set costPerKm to null when km is zero', () => {
      const earnings = Money.create(0);
      const expenses = Money.create(0);
      const km = Distance.create(0);

      const summary = DailySummary.create({
        userId,
        date,
        earnings,
        expenses,
        km,
      });

      expect(summary.costPerKm).toBeNull();
    });
  });

  describe('isProfitable', () => {
    it('should return true when profit is positive', () => {
      const earnings = Money.create(200);
      const expenses = Money.create(60);
      const km = Distance.create(150);

      const summary = DailySummary.create({
        userId,
        date,
        earnings,
        expenses,
        km,
      });

      expect(summary.isProfitable()).toBe(true);
    });

    it('should return false when expenses equal earnings', () => {
      const earnings = Money.create(100);
      const expenses = Money.create(100);
      const km = Distance.create(150);

      const summary = DailySummary.create({
        userId,
        date,
        earnings,
        expenses,
        km,
      });

      expect(summary.isProfitable()).toBe(false);
    });
  });

  describe('hasWorked', () => {
    it('should return true when has km', () => {
      const earnings = Money.create(0);
      const expenses = Money.create(0);
      const km = Distance.create(10);

      const summary = DailySummary.create({
        userId,
        date,
        earnings,
        expenses,
        km,
      });

      expect(summary.hasWorked()).toBe(true);
    });

    it('should return true when has earnings', () => {
      const earnings = Money.create(50);
      const expenses = Money.create(0);
      const km = Distance.create(0);

      const summary = DailySummary.create({
        userId,
        date,
        earnings,
        expenses,
        km,
      });

      expect(summary.hasWorked()).toBe(true);
    });

    it('should return false when no km and no earnings', () => {
      const earnings = Money.create(0);
      const expenses = Money.create(0);
      const km = Distance.create(0);

      const summary = DailySummary.create({
        userId,
        date,
        earnings,
        expenses,
        km,
      });

      expect(summary.hasWorked()).toBe(false);
    });
  });

  describe('toJSON', () => {
    it('should serialize to JSON', () => {
      const earnings = Money.create(200);
      const expenses = Money.create(60);
      const km = Distance.create(150);

      const summary = DailySummary.create({
        userId,
        date,
        earnings,
        expenses,
        km,
      });

      const json = summary.toJSON();

      expect(json).toHaveProperty('id');
      expect(json).toHaveProperty('userId', userId);
      expect(json).toHaveProperty('date', '2024-01-15');
      expect(json).toHaveProperty('earnings', 200);
      expect(json).toHaveProperty('expenses', 60);
      expect(json).toHaveProperty('km', 150);
      expect(json).toHaveProperty('profit', 140);
      expect(json).toHaveProperty('costPerKm');
      expect(json).toHaveProperty('createdAt');
    });
  });
});

