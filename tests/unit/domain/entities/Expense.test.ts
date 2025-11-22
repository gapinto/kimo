import { Expense, ExpenseType } from '../../../../src/domain/entities/Expense';
import { Money } from '../../../../src/domain/value-objects/Money';

describe('Expense Entity', () => {
  const userId = '123e4567-e89b-12d3-a456-426614174000';
  const date = new Date('2024-01-15');

  describe('create', () => {
    it('should create an expense with valid data', () => {
      const amount = Money.create(60);

      const expense = Expense.create({
        userId,
        date,
        type: ExpenseType.FUEL,
        amount,
        note: 'Posto Shell',
      });

      expect(expense.id).toBeDefined();
      expect(expense.userId).toBe(userId);
      expect(expense.date).toBe(date);
      expect(expense.type).toBe(ExpenseType.FUEL);
      expect(expense.amount).toBe(amount);
      expect(expense.note).toBe('Posto Shell');
    });

    it('should create expense without optional note', () => {
      const amount = Money.create(60);

      const expense = Expense.create({
        userId,
        date,
        type: ExpenseType.FUEL,
        amount,
      });

      expect(expense.note).toBeUndefined();
    });

    it('should throw error for missing userId', () => {
      expect(() =>
        Expense.create({
          userId: '',
          date,
          type: ExpenseType.FUEL,
          amount: Money.create(60),
        })
      ).toThrow('User ID is required');
    });
  });

  describe('isFuelExpense', () => {
    it('should return true for fuel expense', () => {
      const expense = Expense.create({
        userId,
        date,
        type: ExpenseType.FUEL,
        amount: Money.create(60),
      });

      expect(expense.isFuelExpense()).toBe(true);
    });

    it('should return false for non-fuel expense', () => {
      const expense = Expense.create({
        userId,
        date,
        type: ExpenseType.MAINTENANCE,
        amount: Money.create(200),
      });

      expect(expense.isFuelExpense()).toBe(false);
    });
  });

  describe('ExpenseType enum', () => {
    it('should have all expense types', () => {
      expect(ExpenseType.FUEL).toBe('fuel');
      expect(ExpenseType.MAINTENANCE).toBe('maintenance');
      expect(ExpenseType.TOLL).toBe('toll');
      expect(ExpenseType.OTHER).toBe('other');
    });
  });

  describe('toJSON', () => {
    it('should serialize to JSON', () => {
      const amount = Money.create(60);

      const expense = Expense.create({
        userId,
        date,
        type: ExpenseType.FUEL,
        amount,
        note: 'Posto Shell',
      });

      const json = expense.toJSON();

      expect(json).toHaveProperty('id');
      expect(json).toHaveProperty('userId', userId);
      expect(json).toHaveProperty('date', '2024-01-15');
      expect(json).toHaveProperty('type', 'fuel');
      expect(json).toHaveProperty('amount', 60);
      expect(json).toHaveProperty('note', 'Posto Shell');
      expect(json).toHaveProperty('createdAt');
    });
  });
});

