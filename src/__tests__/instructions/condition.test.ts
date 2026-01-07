import { describe, expect, it, beforeEach, mock } from 'bun:test';
import { Condition } from '@/processors/condition';
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

describe('Condition Instruction', () => {
  let instruction: Condition;
  let mockVm: VirtualMachine;
  let currentStackItem: InstructionCall | undefined;
  let globalVariables: Record<string, unknown>;
  let executedInstructions: InstructionCall[][];

  beforeEach(() => {
    instruction = new Condition();
    globalVariables = {};
    currentStackItem = undefined;
    executedInstructions = [];

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
      executeInstructions: mock(async (calls: InstructionCall[]) => {
        executedInstructions.push(calls);
      }),
    };
  });

  describe('name', () => {
    it('should return "condition"', () => {
      expect(instruction.name()).toBe('condition');
    });
  });

  describe('validateArgs', () => {
    const validArgs = {
      AND: [{ variable: 'value', condition: '>' as const, compareTo: 'threshold' }],
      onTrue: 'goto_0' as const,
      onFalse: 'goto_1' as const,
      branch_0: [{ name: 'debug', args: {} }],
      branch_1: [{ name: 'debug', args: {} }],
    };

    it('should accept valid args with AND', () => {
      expect(instruction.validateArgs(validArgs)).toBe(true);
    });

    it('should accept valid args with OR', () => {
      expect(
        instruction.validateArgs({
          OR: [{ variable: 'value', condition: '=', compareTo: 'expected' }],
          onTrue: 'goto_0',
          onFalse: 'goto_1',
          branch_0: [],
          branch_1: [],
        })
      ).toBe(true);
    });

    it('should accept all valid condition operators', () => {
      const operators = ['>', '>=', '<=', '<', '=', '!='] as const;

      for (const condition of operators) {
        expect(
          instruction.validateArgs({
            AND: [{ variable: 'value', condition, compareTo: 'other' }],
            onTrue: 'goto_0',
            onFalse: 'goto_1',
            branch_0: [],
            branch_1: [],
          })
        ).toBe(true);
      }
    });

    it('should reject invalid condition operator', () => {
      expect(
        instruction.validateArgs({
          AND: [{ variable: 'value', condition: '==', compareTo: 'other' }],
          onTrue: 'goto_0',
          onFalse: 'goto_1',
          branch_0: [],
          branch_1: [],
        })
      ).toBe(false);
    });

    it('should reject invalid action', () => {
      expect(
        instruction.validateArgs({
          AND: [{ variable: 'value', condition: '>', compareTo: 'other' }],
          onTrue: 'goto_2',
          onFalse: 'goto_1',
          branch_0: [],
          branch_1: [],
        })
      ).toBe(false);
    });

    it('should reject short variable names', () => {
      expect(
        instruction.validateArgs({
          AND: [{ variable: 'x', condition: '>', compareTo: 'other' }],
          onTrue: 'goto_0',
          onFalse: 'goto_1',
          branch_0: [],
          branch_1: [],
        })
      ).toBe(false);
    });

    it('should reject undefined args', () => {
      expect(instruction.validateArgs(undefined)).toBe(false);
    });
  });

  describe('onAction', () => {
    describe('AND expressions', () => {
      it('should execute branch_0 when all AND conditions are true', async () => {
        globalVariables = { value: 100, threshold: 50 };
        currentStackItem = {
          name: 'condition',
          args: {
            AND: [{ variable: 'value', condition: '>', compareTo: 'threshold' }],
            onTrue: 'goto_0',
            onFalse: 'goto_1',
            branch_0: [{ name: 'set', args: { variable: 'result', value: 'true' } }],
            branch_1: [{ name: 'set', args: { variable: 'result', value: 'false' } }],
          },
        };

        await instruction.onAction(mockVm);

        expect(executedInstructions).toHaveLength(1);
        expect(executedInstructions[0]).toEqual([
          { name: 'set', args: { variable: 'result', value: 'true' } },
        ]);
      });

      it('should execute branch_1 when AND condition is false', async () => {
        globalVariables = { value: 30, threshold: 50 };
        currentStackItem = {
          name: 'condition',
          args: {
            AND: [{ variable: 'value', condition: '>', compareTo: 'threshold' }],
            onTrue: 'goto_0',
            onFalse: 'goto_1',
            branch_0: [{ name: 'set', args: { variable: 'result', value: 'true' } }],
            branch_1: [{ name: 'set', args: { variable: 'result', value: 'false' } }],
          },
        };

        await instruction.onAction(mockVm);

        expect(executedInstructions).toHaveLength(1);
        expect(executedInstructions[0]).toEqual([
          { name: 'set', args: { variable: 'result', value: 'false' } },
        ]);
      });

      it('should evaluate multiple AND conditions', async () => {
        globalVariables = { value: 100, min: 50, max: 150 };
        currentStackItem = {
          name: 'condition',
          args: {
            AND: [
              { variable: 'value', condition: '>', compareTo: 'min' },
              { variable: 'value', condition: '<', compareTo: 'max' },
            ],
            onTrue: 'goto_0',
            onFalse: 'goto_1',
            branch_0: [{ name: 'debug', args: {} }],
            branch_1: [],
          },
        };

        await instruction.onAction(mockVm);

        expect(executedInstructions).toHaveLength(1);
      });

      it('should fail if any AND condition is false', async () => {
        globalVariables = { value: 200, min: 50, max: 150 };
        currentStackItem = {
          name: 'condition',
          args: {
            AND: [
              { variable: 'value', condition: '>', compareTo: 'min' },
              { variable: 'value', condition: '<', compareTo: 'max' },
            ],
            onTrue: 'goto_0',
            onFalse: 'goto_1',
            branch_0: [],
            branch_1: [{ name: 'debug', args: {} }],
          },
        };

        await instruction.onAction(mockVm);

        // branch_1 should be executed
        expect(executedInstructions).toHaveLength(1);
      });
    });

    describe('comparison operators', () => {
      it('should evaluate > correctly', async () => {
        globalVariables = { left: 10, right: 5 };
        currentStackItem = {
          name: 'condition',
          args: {
            AND: [{ variable: 'left', condition: '>', compareTo: 'right' }],
            onTrue: 'goto_0',
            onFalse: 'goto_1',
            branch_0: [{ name: 'pass', args: {} }],
            branch_1: [{ name: 'fail', args: {} }],
          },
        };

        await instruction.onAction(mockVm);

        expect(executedInstructions[0][0].name).toBe('pass');
      });

      it('should evaluate >= correctly', async () => {
        globalVariables = { left: 5, right: 5 };
        currentStackItem = {
          name: 'condition',
          args: {
            AND: [{ variable: 'left', condition: '>=', compareTo: 'right' }],
            onTrue: 'goto_0',
            onFalse: 'goto_1',
            branch_0: [{ name: 'pass', args: {} }],
            branch_1: [{ name: 'fail', args: {} }],
          },
        };

        await instruction.onAction(mockVm);

        expect(executedInstructions[0][0].name).toBe('pass');
      });

      it('should evaluate < correctly', async () => {
        globalVariables = { left: 3, right: 5 };
        currentStackItem = {
          name: 'condition',
          args: {
            AND: [{ variable: 'left', condition: '<', compareTo: 'right' }],
            onTrue: 'goto_0',
            onFalse: 'goto_1',
            branch_0: [{ name: 'pass', args: {} }],
            branch_1: [{ name: 'fail', args: {} }],
          },
        };

        await instruction.onAction(mockVm);

        expect(executedInstructions[0][0].name).toBe('pass');
      });

      it('should evaluate <= correctly', async () => {
        globalVariables = { left: 5, right: 5 };
        currentStackItem = {
          name: 'condition',
          args: {
            AND: [{ variable: 'left', condition: '<=', compareTo: 'right' }],
            onTrue: 'goto_0',
            onFalse: 'goto_1',
            branch_0: [{ name: 'pass', args: {} }],
            branch_1: [{ name: 'fail', args: {} }],
          },
        };

        await instruction.onAction(mockVm);

        expect(executedInstructions[0][0].name).toBe('pass');
      });

      it('should evaluate = correctly', async () => {
        globalVariables = { left: 'hello', right: 'hello' };
        currentStackItem = {
          name: 'condition',
          args: {
            AND: [{ variable: 'left', condition: '=', compareTo: 'right' }],
            onTrue: 'goto_0',
            onFalse: 'goto_1',
            branch_0: [{ name: 'pass', args: {} }],
            branch_1: [{ name: 'fail', args: {} }],
          },
        };

        await instruction.onAction(mockVm);

        expect(executedInstructions[0][0].name).toBe('pass');
      });

      it('should evaluate != correctly', async () => {
        globalVariables = { left: 'hello', right: 'world' };
        currentStackItem = {
          name: 'condition',
          args: {
            AND: [{ variable: 'left', condition: '!=', compareTo: 'right' }],
            onTrue: 'goto_0',
            onFalse: 'goto_1',
            branch_0: [{ name: 'pass', args: {} }],
            branch_1: [{ name: 'fail', args: {} }],
          },
        };

        await instruction.onAction(mockVm);

        expect(executedInstructions[0][0].name).toBe('pass');
      });
    });

    describe('nested variable paths', () => {
      it('should access nested variables in conditions', async () => {
        globalVariables = {
          event: { returnValues: { amount: 1000 } },
          config: { minAmount: 500 },
        };
        currentStackItem = {
          name: 'condition',
          args: {
            AND: [
              {
                variable: 'event.returnValues.amount',
                condition: '>',
                compareTo: 'config.minAmount',
              },
            ],
            onTrue: 'goto_0',
            onFalse: 'goto_1',
            branch_0: [{ name: 'pass', args: {} }],
            branch_1: [{ name: 'fail', args: {} }],
          },
        };

        await instruction.onAction(mockVm);

        expect(executedInstructions[0][0].name).toBe('pass');
      });
    });
  });
});
