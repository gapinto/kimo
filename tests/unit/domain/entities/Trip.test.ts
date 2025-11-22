import { Trip } from '../../../../src/domain/entities/Trip';
import { Money } from '../../../../src/domain/value-objects/Money';
import { Distance } from '../../../../src/domain/value-objects/Distance';

describe('Trip Entity', () => {
  const userId = '123e4567-e89b-12d3-a456-426614174000';
  const date = new Date('2024-01-15');

  describe('create', () => {
    it('should create a trip with valid data', () => {
      const earnings = Money.create(150);
      const km = Distance.create(120);

      const trip = Trip.create({
        userId,
        date,
        earnings,
        km,
        timeOnlineMinutes: 480,
        note: 'Bom dia de trabalho',
      });

      expect(trip.id).toBeDefined();
      expect(trip.userId).toBe(userId);
      expect(trip.date).toBe(date);
      expect(trip.earnings).toBe(earnings);
      expect(trip.km).toBe(km);
      expect(trip.timeOnlineMinutes).toBe(480);
      expect(trip.note).toBe('Bom dia de trabalho');
    });

    it('should create a trip without optional note', () => {
      const earnings = Money.create(150);
      const km = Distance.create(120);

      const trip = Trip.create({
        userId,
        date,
        earnings,
        km,
        timeOnlineMinutes: 480,
      });

      expect(trip.note).toBeUndefined();
    });

    it('should throw error for missing userId', () => {
      expect(() =>
        Trip.create({
          userId: '',
          date,
          earnings: Money.create(150),
          km: Distance.create(120),
          timeOnlineMinutes: 480,
        })
      ).toThrow('User ID is required');
    });

    it('should throw error for negative time online', () => {
      expect(() =>
        Trip.create({
          userId,
          date,
          earnings: Money.create(150),
          km: Distance.create(120),
          timeOnlineMinutes: -10,
        })
      ).toThrow('Time online cannot be negative');
    });
  });

  describe('calculateEarningsPerHour', () => {
    it('should calculate earnings per hour', () => {
      const earnings = Money.create(240); // R$ 240
      const km = Distance.create(200);
      const timeOnlineMinutes = 480; // 8 horas

      const trip = Trip.create({
        userId,
        date,
        earnings,
        km,
        timeOnlineMinutes,
      });

      const perHour = trip.calculateEarningsPerHour();
      expect(perHour?.value).toBe(30); // R$ 30 por hora
    });

    it('should return null if time online is zero', () => {
      const earnings = Money.create(0);
      const km = Distance.create(0);

      const trip = Trip.create({
        userId,
        date,
        earnings,
        km,
        timeOnlineMinutes: 0,
      });

      const perHour = trip.calculateEarningsPerHour();
      expect(perHour).toBeNull();
    });
  });

  describe('toJSON', () => {
    it('should serialize to JSON', () => {
      const earnings = Money.create(150);
      const km = Distance.create(120);

      const trip = Trip.create({
        userId,
        date,
        earnings,
        km,
        timeOnlineMinutes: 480,
        note: 'Bom dia',
      });

      const json = trip.toJSON();

      expect(json).toHaveProperty('id');
      expect(json).toHaveProperty('userId', userId);
      expect(json).toHaveProperty('date', '2024-01-15');
      expect(json).toHaveProperty('earnings', 150);
      expect(json).toHaveProperty('km', 120);
      expect(json).toHaveProperty('timeOnlineMinutes', 480);
      expect(json).toHaveProperty('note', 'Bom dia');
      expect(json).toHaveProperty('createdAt');
    });
  });
});

