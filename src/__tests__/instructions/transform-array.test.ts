import { describe, expect, it, beforeEach, mock } from 'bun:test';
import { TransformArray } from '@/processors/transform-array';
import type { VirtualMachine, InstructionCall } from '@/types/vm';

// Mock the log service
mock.module('@/services/log', () => ({
  default: {
    d: mock(() => {}),
    i: mock(() => {}),
    w: mock(() => {}),
    e: mock(() => {}),
  },
}));

describe('TransformArray Instruction', () => {
  let instruction: TransformArray;
  let mockVm: VirtualMachine;
  let currentStackItem: InstructionCall | undefined;
  let globalVariables: Record<string, unknown>;

  beforeEach(() => {
    instruction = new TransformArray();
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
    it('should return "transform-array"', () => {
      expect(instruction.name()).toBe('transform-array');
    });
  });

  describe('validateArgs', () => {
    it('should accept valid args', () => {
      expect(
        instruction.validateArgs({
          variable: 'items',
          transform: 'length',
          output: 'result',
        })
      ).toBe(true);
    });

    it('should accept all valid transform types', () => {
      const transforms = ['length', 'at', 'pop', 'shift'];

      for (const transform of transforms) {
        expect(
          instruction.validateArgs({
            variable: 'items',
            transform,
            output: 'result',
          })
        ).toBe(true);
      }
    });

    it('should accept optional position parameter', () => {
      expect(
        instruction.validateArgs({
          variable: 'items',
          transform: 'at',
          position: 2,
          output: 'result',
        })
      ).toBe(true);
    });

    it('should reject invalid transform type', () => {
      expect(
        instruction.validateArgs({
          variable: 'items',
          transform: 'invalid',
          output: 'result',
        })
      ).toBe(false);
    });

    it('should reject short variable name', () => {
      expect(
        instruction.validateArgs({
          variable: 'x',
          transform: 'length',
          output: 'result',
        })
      ).toBe(false);
    });

    it('should reject undefined args', () => {
      expect(instruction.validateArgs(undefined)).toBe(false);
    });
  });

  describe('onAction', () => {
    describe('length', () => {
      it('should return array length', async () => {
        globalVariables = { items: [1, 2, 3, 4, 5] };
        currentStackItem = {
          name: 'transform-array',
          args: { variable: 'items', transform: 'length', output: 'result' },
        };

        await instruction.onAction(mockVm);

        expect(globalVariables['result']).toBe(5);
      });

      it('should return 0 for empty array', async () => {
        globalVariables = { items: [] };
        currentStackItem = {
          name: 'transform-array',
          args: { variable: 'items', transform: 'length', output: 'result' },
        };

        await instruction.onAction(mockVm);

        expect(globalVariables['result']).toBe(0);
      });
    });

    describe('at', () => {
      it('should return element at position', async () => {
        globalVariables = { items: ['a', 'b', 'c', 'd'] };
        currentStackItem = {
          name: 'transform-array',
          args: { variable: 'items', transform: 'at', position: 1, output: 'result' },
        };

        await instruction.onAction(mockVm);

        expect(globalVariables['result']).toBe('b');
      });

      it('should return first element when position is 0', async () => {
        globalVariables = { items: ['first', 'second'] };
        currentStackItem = {
          name: 'transform-array',
          args: { variable: 'items', transform: 'at', position: 0, output: 'result' },
        };

        await instruction.onAction(mockVm);

        expect(globalVariables['result']).toBe('first');
      });

      it('should return undefined for out of bounds position', async () => {
        globalVariables = { items: ['a', 'b'] };
        currentStackItem = {
          name: 'transform-array',
          args: { variable: 'items', transform: 'at', position: 10, output: 'result' },
        };

        await instruction.onAction(mockVm);

        expect(globalVariables['result']).toBeUndefined();
      });
    });

    describe('pop', () => {
      it('should return and remove last element', async () => {
        globalVariables = { items: [1, 2, 3] };
        currentStackItem = {
          name: 'transform-array',
          args: { variable: 'items', transform: 'pop', output: 'result' },
        };

        await instruction.onAction(mockVm);

        expect(globalVariables['result']).toBe(3);
        expect(globalVariables['items']).toEqual([1, 2]);
      });

      it('should return undefined for empty array', async () => {
        globalVariables = { items: [] };
        currentStackItem = {
          name: 'transform-array',
          args: { variable: 'items', transform: 'pop', output: 'result' },
        };

        await instruction.onAction(mockVm);

        expect(globalVariables['result']).toBeUndefined();
      });
    });

    describe('shift', () => {
      it('should return and remove first element', async () => {
        globalVariables = { items: [1, 2, 3] };
        currentStackItem = {
          name: 'transform-array',
          args: { variable: 'items', transform: 'shift', output: 'result' },
        };

        await instruction.onAction(mockVm);

        expect(globalVariables['result']).toBe(1);
        expect(globalVariables['items']).toEqual([2, 3]);
      });

      it('should return undefined for empty array', async () => {
        globalVariables = { items: [] };
        currentStackItem = {
          name: 'transform-array',
          args: { variable: 'items', transform: 'shift', output: 'result' },
        };

        await instruction.onAction(mockVm);

        expect(globalVariables['result']).toBeUndefined();
      });
    });

    describe('edge cases', () => {
      it('should skip when variable does not exist', async () => {
        globalVariables = {};
        currentStackItem = {
          name: 'transform-array',
          args: { variable: 'nonexistent', transform: 'length', output: 'result' },
        };

        await instruction.onAction(mockVm);

        expect(globalVariables['result']).toBeUndefined();
      });

      it('should return early when args are missing', async () => {
        currentStackItem = {
          name: 'transform-array',
          args: undefined,
        };

        await instruction.onAction(mockVm);

        expect(Object.keys(globalVariables)).toHaveLength(0);
      });
    });
  });
});
