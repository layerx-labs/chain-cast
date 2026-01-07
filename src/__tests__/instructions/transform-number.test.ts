import { describe, expect, it, beforeEach, mock } from 'bun:test';
import { TransformNumber } from '@/processors/transform-number';
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

describe('TransformNumber Instruction', () => {
  let instruction: TransformNumber;
  let mockVm: VirtualMachine;
  let currentStackItem: InstructionCall | undefined;
  let globalVariables: Record<string, unknown>;

  beforeEach(() => {
    instruction = new TransformNumber();
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
    it('should return "transform-number"', () => {
      expect(instruction.name()).toBe('transform-number');
    });
  });

  describe('validateArgs', () => {
    it('should accept valid args', () => {
      expect(
        instruction.validateArgs({
          variableLeft: 'num1',
          variableRight: 'num2',
          transform: 'add',
          output: 'result',
        })
      ).toBe(true);
    });

    it('should accept args without variableRight', () => {
      expect(
        instruction.validateArgs({
          variableLeft: 'num1',
          transform: 'bigint',
          output: 'result',
        })
      ).toBe(true);
    });

    it('should accept all valid transform types', () => {
      const transforms = ['add', 'subtract', 'multiply', 'divide', 'pow', 'bigint'];

      for (const transform of transforms) {
        expect(
          instruction.validateArgs({
            variableLeft: 'num1',
            variableRight: 'num2',
            transform,
            output: 'result',
          })
        ).toBe(true);
      }
    });

    it('should reject invalid transform type', () => {
      expect(
        instruction.validateArgs({
          variableLeft: 'num1',
          variableRight: 'num2',
          transform: 'modulo',
          output: 'result',
        })
      ).toBe(false);
    });

    it('should reject short variable names', () => {
      expect(
        instruction.validateArgs({
          variableLeft: 'x',
          transform: 'add',
          output: 'result',
        })
      ).toBe(false);
    });

    it('should reject undefined args', () => {
      expect(instruction.validateArgs(undefined)).toBe(false);
    });
  });

  describe('onAction', () => {
    describe('add', () => {
      it('should add two numbers', async () => {
        globalVariables = { num1: 10, num2: 5 };
        currentStackItem = {
          name: 'transform-number',
          args: {
            variable: 'num1',
            variableRight: 'num2',
            transform: 'add',
            output: 'result',
          },
        };

        await instruction.onAction(mockVm);

        expect(globalVariables.result).toBe(15);
      });
    });

    describe('subtract', () => {
      it('should subtract two numbers', async () => {
        globalVariables = { num1: 10, num2: 3 };
        currentStackItem = {
          name: 'transform-number',
          args: {
            variable: 'num1',
            variableRight: 'num2',
            transform: 'subtract',
            output: 'result',
          },
        };

        await instruction.onAction(mockVm);

        expect(globalVariables.result).toBe(7);
      });
    });

    describe('multiply', () => {
      it('should multiply two numbers', async () => {
        globalVariables = { num1: 4, num2: 5 };
        currentStackItem = {
          name: 'transform-number',
          args: {
            variable: 'num1',
            variableRight: 'num2',
            transform: 'multiply',
            output: 'result',
          },
        };

        await instruction.onAction(mockVm);

        expect(globalVariables.result).toBe(20);
      });
    });

    describe('divide', () => {
      it('should divide two numbers', async () => {
        globalVariables = { num1: 20, num2: 4 };
        currentStackItem = {
          name: 'transform-number',
          args: {
            variable: 'num1',
            variableRight: 'num2',
            transform: 'divide',
            output: 'result',
          },
        };

        await instruction.onAction(mockVm);

        expect(globalVariables.result).toBe(5);
      });

      it('should handle division by zero', async () => {
        globalVariables = { num1: 10, num2: 0 };
        currentStackItem = {
          name: 'transform-number',
          args: {
            variable: 'num1',
            variableRight: 'num2',
            transform: 'divide',
            output: 'result',
          },
        };

        await instruction.onAction(mockVm);

        expect(globalVariables.result).toBe(Number.POSITIVE_INFINITY);
      });
    });

    describe('pow', () => {
      it('should raise to power', async () => {
        globalVariables = { num1: 2, num2: 8 };
        currentStackItem = {
          name: 'transform-number',
          args: {
            variable: 'num1',
            variableRight: 'num2',
            transform: 'pow',
            output: 'result',
          },
        };

        await instruction.onAction(mockVm);

        expect(globalVariables.result).toBe(256);
      });
    });

    describe('bigint', () => {
      it('should convert to BigInt', async () => {
        globalVariables = { num1: 1000000 };
        currentStackItem = {
          name: 'transform-number',
          args: {
            variable: 'num1',
            transform: 'bigint',
            output: 'result',
          },
        };

        await instruction.onAction(mockVm);

        expect(globalVariables.result).toBe(BigInt(1000000));
      });
    });

    describe('edge cases', () => {
      it('should skip non-number input', async () => {
        globalVariables = { num1: 'not a number' };
        currentStackItem = {
          name: 'transform-number',
          args: {
            variable: 'num1',
            transform: 'bigint',
            output: 'result',
          },
        };

        await instruction.onAction(mockVm);

        expect(globalVariables.result).toBeUndefined();
      });

      it('should skip when variable does not exist', async () => {
        globalVariables = {};
        currentStackItem = {
          name: 'transform-number',
          args: {
            variable: 'nonexistent',
            transform: 'bigint',
            output: 'result',
          },
        };

        await instruction.onAction(mockVm);

        expect(globalVariables.result).toBeUndefined();
      });

      it('should use 0 when variableRight is missing', async () => {
        globalVariables = { num1: 10 };
        currentStackItem = {
          name: 'transform-number',
          args: {
            variable: 'num1',
            transform: 'add',
            output: 'result',
          },
        };

        await instruction.onAction(mockVm);

        expect(globalVariables.result).toBe(10);
      });

      it('should return early when args are missing', async () => {
        currentStackItem = {
          name: 'transform-number',
          args: undefined,
        };

        await instruction.onAction(mockVm);

        expect(Object.keys(globalVariables)).toHaveLength(0);
      });
    });
  });
});
