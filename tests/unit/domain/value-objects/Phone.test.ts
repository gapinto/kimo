import { Phone } from '../../../src/domain/value-objects/Phone';

describe('Phone Value Object', () => {
  describe('create', () => {
    it('should create phone with 11 digits (with DDD)', () => {
      const phone = Phone.create('11999999999');
      expect(phone.value).toBe('5511999999999');
    });

    it('should create phone with 10 digits (fixed line)', () => {
      const phone = Phone.create('1133334444');
      expect(phone.value).toBe('551133334444');
    });

    it('should add country code 55 if not present', () => {
      const phone = Phone.create('11999999999');
      expect(phone.value).toContain('55');
    });

    it('should not duplicate country code if already present', () => {
      const phone = Phone.create('5511999999999');
      expect(phone.value).toBe('5511999999999');
      expect(phone.value.match(/55/g)?.length).toBe(1);
    });

    it('should remove formatting characters', () => {
      const phone = Phone.create('(11) 99999-9999');
      expect(phone.value).toBe('5511999999999');
    });

    it('should throw error for invalid length', () => {
      expect(() => Phone.create('123')).toThrow('Invalid phone number format');
      expect(() => Phone.create('123456789012345')).toThrow('Invalid phone number format');
    });
  });

  describe('formatting', () => {
    it('should format mobile phone correctly', () => {
      const phone = Phone.create('11999999999');
      expect(phone.formatted()).toBe('+55 11 99999-9999');
    });

    it('should format fixed line correctly', () => {
      const phone = Phone.create('1133334444');
      expect(phone.formatted()).toBe('+55 11 3333-4444');
    });

    it('should toString use formatted version', () => {
      const phone = Phone.create('11999999999');
      expect(phone.toString()).toBe('+55 11 99999-9999');
    });
  });

  describe('comparison', () => {
    it('should compare two equal phones', () => {
      const p1 = Phone.create('11999999999');
      const p2 = Phone.create('5511999999999');
      expect(p1.equals(p2)).toBe(true);
    });

    it('should compare two different phones', () => {
      const p1 = Phone.create('11999999999');
      const p2 = Phone.create('11888888888');
      expect(p1.equals(p2)).toBe(false);
    });
  });

  describe('serialization', () => {
    it('should serialize to JSON as string', () => {
      const phone = Phone.create('11999999999');
      expect(phone.toJSON()).toBe('5511999999999');
    });
  });
});

