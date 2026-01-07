import { beforeEach, describe, expect, it } from 'bun:test';
import { Stack } from '@/lib/stack';

describe('Stack', () => {
  let stack: Stack<number>;

  beforeEach(() => {
    stack = new Stack<number>();
  });

  describe('constructor', () => {
    it('should create an empty stack', () => {
      expect(stack.isEmpty()).toBe(true);
      expect(stack.size()).toBe(0);
    });
  });

  describe('push', () => {
    it('should add a single item to the stack', () => {
      stack.push(1);
      expect(stack.isEmpty()).toBe(false);
      expect(stack.size()).toBe(1);
      expect(stack.peek()).toBe(1);
    });

    it('should add multiple items in order', () => {
      stack.push(1);
      stack.push(2);
      stack.push(3);
      expect(stack.size()).toBe(3);
      expect(stack.peek()).toBe(3);
    });
  });

  describe('pop', () => {
    it('should return undefined for empty stack', () => {
      expect(stack.pop()).toBeUndefined();
    });

    it('should remove and return the last item (LIFO)', () => {
      stack.push(1);
      stack.push(2);
      stack.push(3);

      expect(stack.pop()).toBe(3);
      expect(stack.pop()).toBe(2);
      expect(stack.pop()).toBe(1);
      expect(stack.isEmpty()).toBe(true);
    });

    it('should update size after pop', () => {
      stack.push(1);
      stack.push(2);
      expect(stack.size()).toBe(2);

      stack.pop();
      expect(stack.size()).toBe(1);
    });
  });

  describe('isEmpty', () => {
    it('should return true for new stack', () => {
      expect(stack.isEmpty()).toBe(true);
    });

    it('should return false after pushing an item', () => {
      stack.push(1);
      expect(stack.isEmpty()).toBe(false);
    });

    it('should return true after popping all items', () => {
      stack.push(1);
      stack.push(2);
      stack.pop();
      stack.pop();
      expect(stack.isEmpty()).toBe(true);
    });
  });

  describe('size', () => {
    it('should return 0 for new stack', () => {
      expect(stack.size()).toBe(0);
    });

    it('should return correct count after pushes', () => {
      stack.push(1);
      expect(stack.size()).toBe(1);

      stack.push(2);
      stack.push(3);
      expect(stack.size()).toBe(3);
    });

    it('should return correct count after pops', () => {
      stack.push(1);
      stack.push(2);
      stack.push(3);
      stack.pop();
      expect(stack.size()).toBe(2);
    });
  });

  describe('peek', () => {
    it('should return undefined for empty stack', () => {
      expect(stack.peek()).toBeUndefined();
    });

    it('should return top item without removing it', () => {
      stack.push(1);
      stack.push(2);

      expect(stack.peek()).toBe(2);
      expect(stack.peek()).toBe(2); // Should still be there
      expect(stack.size()).toBe(2); // Size unchanged
    });
  });

  describe('clear', () => {
    it('should remove all items from stack', () => {
      stack.push(1);
      stack.push(2);
      stack.push(3);

      stack.clear();

      expect(stack.isEmpty()).toBe(true);
      expect(stack.size()).toBe(0);
      expect(stack.peek()).toBeUndefined();
    });

    it('should work on already empty stack', () => {
      stack.clear();
      expect(stack.isEmpty()).toBe(true);
    });
  });

  describe('getAll', () => {
    it('should return empty array for empty stack', () => {
      expect(stack.getAll()).toEqual([]);
    });

    it('should return all items in order (bottom to top)', () => {
      stack.push(1);
      stack.push(2);
      stack.push(3);

      expect(stack.getAll()).toEqual([1, 2, 3]);
    });

    it('should not modify the stack when called', () => {
      stack.push(1);
      stack.push(2);

      const items = stack.getAll();
      expect(items).toEqual([1, 2]);
      expect(stack.size()).toBe(2);
    });
  });

  describe('with complex types', () => {
    it('should work with objects', () => {
      const objectStack = new Stack<{ name: string; value: number }>();
      objectStack.push({ name: 'first', value: 1 });
      objectStack.push({ name: 'second', value: 2 });

      expect(objectStack.peek()).toEqual({ name: 'second', value: 2 });
      expect(objectStack.pop()).toEqual({ name: 'second', value: 2 });
    });

    it('should work with InstructionCall-like objects', () => {
      type InstructionCall = { name: string; args?: Record<string, unknown> };
      const callStack = new Stack<InstructionCall>();

      callStack.push({ name: 'debug', args: { variablesToDebug: ['event'] } });
      callStack.push({ name: 'set', args: { variable: 'x', value: 1 } });

      expect(callStack.peek()?.name).toBe('set');
      expect(callStack.getAll()).toHaveLength(2);
    });
  });
});
