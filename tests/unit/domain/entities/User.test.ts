import { User } from '../../../../src/domain/entities/User';
import { Phone } from '../../../../src/domain/value-objects/Phone';

describe('User Entity', () => {
  describe('create', () => {
    it('should create a user with valid data', () => {
      const phone = Phone.create('11999999999');
      const user = User.create({
        phone,
        name: 'João Silva',
        weeklyGoal: 700,
      });

      expect(user.id).toBeDefined();
      expect(user.phone).toBe(phone);
      expect(user.name).toBe('João Silva');
      expect(user.weeklyGoal).toBe(700);
      expect(user.createdAt).toBeInstanceOf(Date);
      expect(user.updatedAt).toBeInstanceOf(Date);
    });

    it('should create a user without optional fields', () => {
      const phone = Phone.create('11999999999');
      const user = User.create({ phone });

      expect(user.id).toBeDefined();
      expect(user.phone).toBe(phone);
      expect(user.name).toBeUndefined();
      expect(user.weeklyGoal).toBeUndefined();
    });

    it('should throw error for negative weekly goal', () => {
      const phone = Phone.create('11999999999');
      expect(() =>
        User.create({
          phone,
          weeklyGoal: -100,
        })
      ).toThrow('Weekly goal cannot be negative');
    });
  });

  describe('restore', () => {
    it('should restore a user from persisted data', () => {
      const phone = Phone.create('11999999999');
      const now = new Date();

      const user = User.restore({
        id: '123e4567-e89b-12d3-a456-426614174000',
        phone,
        name: 'João Silva',
        weeklyGoal: 700,
        createdAt: now,
        updatedAt: now,
      });

      expect(user.id).toBe('123e4567-e89b-12d3-a456-426614174000');
      expect(user.phone).toBe(phone);
      expect(user.name).toBe('João Silva');
    });
  });

  describe('updateName', () => {
    it('should update user name', () => {
      const phone = Phone.create('11999999999');
      const user = User.create({ phone, name: 'João' });

      const oldUpdatedAt = user.updatedAt;
      
      // Pequeno delay para garantir que updatedAt muda
      setTimeout(() => {
        user.updateName('João Silva Santos');
        expect(user.name).toBe('João Silva Santos');
        expect(user.updatedAt.getTime()).toBeGreaterThanOrEqual(oldUpdatedAt.getTime());
      }, 10);
    });
  });

  describe('updateWeeklyGoal', () => {
    it('should update weekly goal', () => {
      const phone = Phone.create('11999999999');
      const user = User.create({ phone, weeklyGoal: 700 });

      user.updateWeeklyGoal(800);
      expect(user.weeklyGoal).toBe(800);
    });

    it('should throw error for negative weekly goal', () => {
      const phone = Phone.create('11999999999');
      const user = User.create({ phone, weeklyGoal: 700 });

      expect(() => user.updateWeeklyGoal(-100)).toThrow('Weekly goal cannot be negative');
    });
  });

  describe('toJSON', () => {
    it('should serialize to JSON', () => {
      const phone = Phone.create('11999999999');
      const user = User.create({
        phone,
        name: 'João Silva',
        weeklyGoal: 700,
      });

      const json = user.toJSON();

      expect(json).toHaveProperty('id');
      expect(json).toHaveProperty('phone', '5511999999999');
      expect(json).toHaveProperty('name', 'João Silva');
      expect(json).toHaveProperty('weeklyGoal', 700);
      expect(json).toHaveProperty('createdAt');
      expect(json).toHaveProperty('updatedAt');
    });
  });
});

