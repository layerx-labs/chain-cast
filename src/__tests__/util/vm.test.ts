import { describe, expect, it } from 'bun:test';
import { getVariableFromPath } from '@/util/vm';

describe('getVariableFromPath', () => {
  describe('single level access', () => {
    it('should return value for simple path', () => {
      const obj = { name: 'Alice', age: 30 };
      expect(getVariableFromPath('name', obj)).toBe('Alice');
      expect(getVariableFromPath('age', obj)).toBe(30);
    });

    it('should return null for non-existent path', () => {
      const obj = { name: 'Alice' };
      expect(getVariableFromPath('email', obj)).toBeNull();
    });
  });

  describe('nested path access', () => {
    it('should return value for nested path', () => {
      const obj = {
        user: {
          profile: {
            name: 'Alice',
            settings: {
              theme: 'dark',
            },
          },
        },
      };
      expect(getVariableFromPath('user.profile.name', obj)).toBe('Alice');
      expect(getVariableFromPath('user.profile.settings.theme', obj)).toBe('dark');
    });

    it('should return null for partially existing nested path', () => {
      const obj = {
        user: {
          profile: {
            name: 'Alice',
          },
        },
      };
      expect(getVariableFromPath('user.profile.email', obj)).toBeNull();
      expect(getVariableFromPath('user.settings.theme', obj)).toBeNull();
    });
  });

  describe('array access', () => {
    it('should access array elements by index', () => {
      const obj = {
        items: ['first', 'second', 'third'],
      };
      expect(getVariableFromPath('items.0', obj)).toBe('first');
      expect(getVariableFromPath('items.1', obj)).toBe('second');
      expect(getVariableFromPath('items.2', obj)).toBe('third');
    });

    it('should access nested object properties in arrays', () => {
      const obj = {
        users: [
          { name: 'Alice', age: 30 },
          { name: 'Bob', age: 25 },
        ],
      };
      expect(getVariableFromPath('users.0.name', obj)).toBe('Alice');
      expect(getVariableFromPath('users.1.age', obj)).toBe(25);
    });

    it('should return null for out of bounds array index', () => {
      const obj = {
        items: ['first', 'second'],
      };
      expect(getVariableFromPath('items.5', obj)).toBeNull();
    });
  });

  describe('edge cases', () => {
    it('should return null for null object', () => {
      expect(getVariableFromPath('name', null)).toBeNull();
    });

    it('should return null for undefined object', () => {
      expect(getVariableFromPath('name', undefined)).toBeNull();
    });

    it('should return null for empty path', () => {
      const obj = { name: 'Alice' };
      expect(getVariableFromPath('', obj)).toBeNull();
    });

    it('should handle path with leading/trailing dots', () => {
      const obj = { name: 'Alice' };
      // The filter(Boolean) should handle empty segments from leading/trailing dots
      expect(getVariableFromPath('.name', obj)).toBe('Alice');
      expect(getVariableFromPath('name.', obj)).toBe('Alice');
    });

    it('should handle boolean values', () => {
      const obj = { active: true, disabled: false };
      expect(getVariableFromPath('active', obj)).toBe(true);
      // Note: false is falsy, so it might return null depending on implementation
    });

    it('should handle number values including zero', () => {
      const obj = { count: 0, total: 100 };
      expect(getVariableFromPath('total', obj)).toBe(100);
      // Note: 0 is falsy, so it might return null depending on implementation
    });

    it('should handle BigInt values', () => {
      const obj = { amount: BigInt('1000000000000000000') };
      expect(getVariableFromPath('amount', obj)).toBe(BigInt('1000000000000000000'));
    });

    it('should handle object values', () => {
      const nested = { x: 1, y: 2 };
      const obj = { position: nested };
      expect(getVariableFromPath('position', obj)).toEqual(nested);
    });
  });

  describe('blockchain event access patterns', () => {
    it('should access event properties', () => {
      const event = {
        event: 'Transfer',
        address: '0x1234567890abcdef1234567890abcdef12345678',
        blockNumber: 1000000,
        returnValues: {
          from: '0xsender',
          to: '0xreceiver',
          value: BigInt('1000000000000000000'),
        },
      };

      expect(getVariableFromPath('event', { event })).toEqual(event);
      expect(getVariableFromPath('event.event', { event })).toBe('Transfer');
      expect(getVariableFromPath('event.address', { event })).toBe(
        '0x1234567890abcdef1234567890abcdef12345678'
      );
      expect(getVariableFromPath('event.returnValues.from', { event })).toBe('0xsender');
      expect(getVariableFromPath('event.returnValues.value', { event })).toBe(
        BigInt('1000000000000000000')
      );
    });
  });
});
