import { Distance } from '../../../src/domain/value-objects/Distance';

describe('Distance Value Object', () => {
  describe('create', () => {
    it('should create distance with valid kilometers', () => {
      const distance = Distance.create(150.50);
      expect(distance.value).toBe(150.50);
    });

    it('should round to 2 decimal places', () => {
      const distance = Distance.create(150.126);
      expect(distance.value).toBe(150.13);
    });

    it('should throw error for negative distance', () => {
      expect(() => Distance.create(-10)).toThrow('Distance cannot be negative');
    });

    it('should throw error for NaN', () => {
      expect(() => Distance.create(NaN)).toThrow('Distance must be a valid number');
    });

    it('should accept zero', () => {
      const distance = Distance.create(0);
      expect(distance.value).toBe(0);
    });
  });

  describe('operations', () => {
    it('should add two distances', () => {
      const d1 = Distance.create(100);
      const d2 = Distance.create(50);
      const result = d1.add(d2);
      expect(result.value).toBe(150);
    });
  });

  describe('formatting', () => {
    it('should format as string with km', () => {
      const distance = Distance.create(150.50);
      expect(distance.toString()).toBe('150.50 km');
    });

    it('should serialize to JSON as number', () => {
      const distance = Distance.create(150.50);
      expect(distance.toJSON()).toBe(150.50);
    });
  });
});

