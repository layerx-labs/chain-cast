import { beforeEach, describe, expect, it, mock } from 'bun:test';
import { TransformObject } from '@/processors/transform-object';
import type { InstructionCall, VirtualMachine } from '@/types/vm';

// Mock the log service
mock.module('@/services/log', () => ({
  default: {
    d: mock(() => {}),
    i: mock(() => {}),
    w: mock(() => {}),
    e: mock(() => {}),
  },
}));

describe('TransformObject Instruction', () => {
  let instruction: TransformObject;
  let mockVm: VirtualMachine;
  let currentStackItem: InstructionCall | undefined;
  let globalVariables: Record<string, unknown>;

  beforeEach(() => {
    instruction = new TransformObject();
    globalVariables = {};
    currentStackItem = undefined;

    mockVm = {
      getGlobalVariables: () => globalVariables,
      getGlobalVariable: (name: string) => globalVariables[name],
      getGlobalVariableFromPath: (path: string) => {
        const parts = path.split('.');
        let value: unknown = globalVariables;
        for (const part of parts) {
          if (value && typeof value === 'object') {
            value = (value as Record<string, unknown>)[part];
          } else {
            return null;
          }
        }
        return value;
      },
      setGlobalVariable: (name: string, value: unknown) => {
        globalVariables[name] = value;
      },
      getCurrentStackItem: () => currentStackItem,
      getStack: () => (currentStackItem ? [currentStackItem] : []),
      isHalted: () => false,
      halt: mock(() => {}),
      getError: () => null,
      setError: mock(() => {}),
      loadProgram: mock(() => {}),
      execute: mock(async () => {}),
      executeInstruction: mock(async () => {}),
      executeInstructions: mock(async () => {}),
    };
  });

  describe('name', () => {
    it('should return "transform-object"', () => {
      expect(instruction.name()).toBe('transform-object');
    });
  });

  describe('validateArgs', () => {
    it('should accept valid args', () => {
      expect(
        instruction.validateArgs({
          variable: 'data',
          transform: 'keys',
          output: 'result',
        })
      ).toBe(true);
    });

    it('should accept all valid transform types', () => {
      const transforms = ['keys', 'values', 'delete', 'value'];

      for (const transform of transforms) {
        expect(
          instruction.validateArgs({
            variable: 'data',
            transform,
            output: 'result',
          })
        ).toBe(true);
      }
    });

    it('should accept optional key parameter', () => {
      expect(
        instruction.validateArgs({
          variable: 'data',
          transform: 'value',
          key: 'myKey',
          output: 'result',
        })
      ).toBe(true);
    });

    it('should reject invalid transform type', () => {
      expect(
        instruction.validateArgs({
          variable: 'data',
          transform: 'invalid',
          output: 'result',
        })
      ).toBe(false);
    });

    it('should reject short variable name', () => {
      expect(
        instruction.validateArgs({
          variable: 'x',
          transform: 'keys',
          output: 'result',
        })
      ).toBe(false);
    });

    it('should reject undefined args', () => {
      expect(instruction.validateArgs(undefined)).toBe(false);
    });
  });

  describe('onAction', () => {
    describe('keys', () => {
      it('should return object keys', async () => {
        globalVariables = { data: { name: 'John', age: 30, city: 'NYC' } };
        currentStackItem = {
          name: 'transform-object',
          args: { variable: 'data', transform: 'keys', output: 'result' },
        };

        await instruction.onAction(mockVm);

        expect(globalVariables.result).toEqual(['name', 'age', 'city']);
      });

      it('should return empty array for empty object', async () => {
        globalVariables = { data: {} };
        currentStackItem = {
          name: 'transform-object',
          args: { variable: 'data', transform: 'keys', output: 'result' },
        };

        await instruction.onAction(mockVm);

        expect(globalVariables.result).toEqual([]);
      });
    });

    describe('values', () => {
      it('should return object values', async () => {
        globalVariables = { data: { a: 1, b: 2, c: 3 } };
        currentStackItem = {
          name: 'transform-object',
          args: { variable: 'data', transform: 'values', output: 'result' },
        };

        await instruction.onAction(mockVm);

        expect(globalVariables.result).toEqual([1, 2, 3]);
      });
    });

    describe('value', () => {
      it('should return value at key', async () => {
        globalVariables = {
          data: { name: 'Alice', age: 25 },
          keyName: 'name',
        };
        currentStackItem = {
          name: 'transform-object',
          args: { variable: 'data', transform: 'value', key: 'keyName', output: 'result' },
        };

        await instruction.onAction(mockVm);

        expect(globalVariables.result).toBe('Alice');
      });

      it('should return undefined for non-existent key', async () => {
        globalVariables = {
          data: { name: 'Alice' },
          keyName: 'nonexistent',
        };
        currentStackItem = {
          name: 'transform-object',
          args: { variable: 'data', transform: 'value', key: 'keyName', output: 'result' },
        };

        await instruction.onAction(mockVm);

        expect(globalVariables.result).toBeUndefined();
      });
    });

    describe('delete', () => {
      it('should delete key from object', async () => {
        globalVariables = {
          data: { name: 'Alice', age: 25, city: 'NYC' },
          keyName: 'age',
        };
        currentStackItem = {
          name: 'transform-object',
          args: { variable: 'data', transform: 'delete', key: 'keyName', output: 'result' },
        };

        await instruction.onAction(mockVm);

        // delete returns true on success
        expect(globalVariables.result).toBe(true);
        expect((globalVariables.data as Record<string, unknown>).age).toBeUndefined();
      });
    });

    describe('nested variable paths', () => {
      it('should access nested objects', async () => {
        globalVariables = {
          event: {
            returnValues: { from: '0x123', to: '0x456', value: 1000 },
          },
        };
        currentStackItem = {
          name: 'transform-object',
          args: { variable: 'event.returnValues', transform: 'keys', output: 'result' },
        };

        await instruction.onAction(mockVm);

        expect(globalVariables.result).toEqual(['from', 'to', 'value']);
      });
    });

    describe('edge cases', () => {
      it('should use empty object when variable does not exist', async () => {
        globalVariables = {};
        currentStackItem = {
          name: 'transform-object',
          args: { variable: 'nonexistent', transform: 'keys', output: 'result' },
        };

        await instruction.onAction(mockVm);

        // With fallback to empty object, keys returns []
        expect(globalVariables.result).toEqual([]);
      });

      it('should return early when args are missing', async () => {
        currentStackItem = {
          name: 'transform-object',
          args: undefined,
        };

        await instruction.onAction(mockVm);

        expect(Object.keys(globalVariables)).toHaveLength(0);
      });
    });
  });
});
