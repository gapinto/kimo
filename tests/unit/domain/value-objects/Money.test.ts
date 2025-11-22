import { Money } from '../../../src/domain/value-objects/Money';

describe('Money Value Object', () => {
  describe('create', () => {
    it('should create money with valid amount', () => {
      const money = Money.create(100.50);
      expect(money.value).toBe(100.50);
    });

    it('should round to 2 decimal places', () => {
      const money = Money.create(100.126);
      expect(money.value).toBe(100.13);
    });

    it('should throw error for negative amount', () => {
      expect(() => Money.create(-10)).toThrow('Amount cannot be negative');
    });

    it('should throw error for NaN', () => {
      expect(() => Money.create(NaN)).toThrow('Amount must be a valid number');
    });

    it('should throw error for non-number', () => {
      expect(() => Money.create('100' as unknown as number)).toThrow(
        'Amount must be a valid number'
      );
    });

    it('should accept zero', () => {
      const money = Money.create(0);
      expect(money.value).toBe(0);
    });
  });

  describe('operations', () => {
    it('should add two money values', () => {
      const m1 = Money.create(100);
      const m2 = Money.create(50);
      const result = m1.add(m2);
      expect(result.value).toBe(150);
    });

    it('should subtract two money values', () => {
      const m1 = Money.create(100);
      const m2 = Money.create(30);
      const result = m1.subtract(m2);
      expect(result.value).toBe(70);
    });

    it('should throw error when subtracting results in negative', () => {
      const m1 = Money.create(50);
      const m2 = Money.create(100);
      expect(() => m1.subtract(m2)).toThrow('Amount cannot be negative');
    });

    it('should multiply money by factor', () => {
      const m1 = Money.create(100);
      const result = m1.multiply(1.5);
      expect(result.value).toBe(150);
    });

    it('should divide money by divisor', () => {
      const m1 = Money.create(100);
      const result = m1.divide(2);
      expect(result.value).toBe(50);
    });

    it('should throw error when dividing by zero', () => {
      const m1 = Money.create(100);
      expect(() => m1.divide(0)).toThrow('Cannot divide by zero');
    });
  });

  describe('comparisons', () => {
    it('should compare if greater than', () => {
      const m1 = Money.create(100);
      const m2 = Money.create(50);
      expect(m1.isGreaterThan(m2)).toBe(true);
      expect(m2.isGreaterThan(m1)).toBe(false);
    });

    it('should compare if less than', () => {
      const m1 = Money.create(50);
      const m2 = Money.create(100);
      expect(m1.isLessThan(m2)).toBe(true);
      expect(m2.isLessThan(m1)).toBe(false);
    });

    it('should compare if equals', () => {
      const m1 = Money.create(100);
      const m2 = Money.create(100);
      const m3 = Money.create(50);
      expect(m1.equals(m2)).toBe(true);
      expect(m1.equals(m3)).toBe(false);
    });
  });

  describe('formatting', () => {
    it('should format as string with R$', () => {
      const money = Money.create(100.50);
      expect(money.toString()).toBe('R$ 100.50');
    });

    it('should serialize to JSON as number', () => {
      const money = Money.create(100.50);
      expect(money.toJSON()).toBe(100.50);
    });
  });

  describe('immutability', () => {
    it('should not mutate original when adding', () => {
      const m1 = Money.create(100);
      const m2 = Money.create(50);
      m1.add(m2);
      expect(m1.value).toBe(100); // Original não muda
    });

    it('should not mutate original when subtracting', () => {
      const m1 = Money.create(100);
      const m2 = Money.create(30);
      m1.subtract(m2);
      expect(m1.value).toBe(100);
    });
  });
});

