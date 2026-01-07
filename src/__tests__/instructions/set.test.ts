import { describe, expect, it, beforeEach, mock } from 'bun:test';
import { Set as SetInstruction } from '@/processors/set';
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

describe('Set Instruction', () => {
  let instruction: SetInstruction;
  let mockVm: VirtualMachine;
  let currentStackItem: InstructionCall | undefined;
  let globalVariables: Record<string, unknown>;

  beforeEach(() => {
    instruction = new SetInstruction();
    globalVariables = {};
    currentStackItem = undefined;

    mockVm = {
      getGlobalVariables: () => globalVariables,
      getGlobalVariable: (name: string) => globalVariables[name],
      getGlobalVariableFromPath: mock(() => null),
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
    it('should return "set"', () => {
      expect(instruction.name()).toBe('set');
    });
  });

  describe('validateArgs', () => {
    it('should accept valid args with variable and value', () => {
      expect(instruction.validateArgs({ variable: 'myVar', value: 'test' })).toBe(true);
    });

    it('should accept variable with numeric value', () => {
      expect(instruction.validateArgs({ variable: 'count', value: 123 })).toBe(true);
    });

    it('should accept variable with boolean value', () => {
      expect(instruction.validateArgs({ variable: 'active', value: true })).toBe(true);
    });

    it('should accept variable with object value', () => {
      expect(instruction.validateArgs({ variable: 'data', value: { key: 'value' } })).toBe(true);
    });

    it('should accept variable with null value', () => {
      expect(instruction.validateArgs({ variable: 'empty', value: null })).toBe(true);
    });

    it('should reject variable name shorter than 2 characters', () => {
      expect(instruction.validateArgs({ variable: 'x', value: 'test' })).toBe(false);
    });

    it('should reject missing variable', () => {
      expect(instruction.validateArgs({ value: 'test' })).toBe(false);
    });

    it('should reject undefined args', () => {
      expect(instruction.validateArgs(undefined)).toBe(false);
    });

    it('should reject empty args object', () => {
      expect(instruction.validateArgs({})).toBe(false);
    });
  });

  describe('getArgsSchema', () => {
    it('should return a zod schema', () => {
      const schema = instruction.getArgsSchema();
      expect(schema).toBeDefined();
      expect(typeof schema.parse).toBe('function');
    });
  });

  describe('onAction', () => {
    it('should set a string variable', () => {
      currentStackItem = {
        name: 'set',
        args: { variable: 'myVar', value: 'test-value' },
      };

      instruction.onAction(mockVm);

      expect(globalVariables.myVar).toBe('test-value');
    });

    it('should set a numeric variable', () => {
      currentStackItem = {
        name: 'set',
        args: { variable: 'count', value: 42 },
      };

      instruction.onAction(mockVm);

      expect(globalVariables.count).toBe(42);
    });

    it('should set a boolean variable', () => {
      currentStackItem = {
        name: 'set',
        args: { variable: 'active', value: true },
      };

      instruction.onAction(mockVm);

      expect(globalVariables.active).toBe(true);
    });

    it('should set an object variable', () => {
      const objValue = { key: 'value', nested: { data: 123 } };
      currentStackItem = {
        name: 'set',
        args: { variable: 'data', value: objValue },
      };

      instruction.onAction(mockVm);

      expect(globalVariables.data).toEqual(objValue);
    });

    it('should overwrite existing variable', () => {
      globalVariables.myVar = 'initial';
      currentStackItem = {
        name: 'set',
        args: { variable: 'myVar', value: 'updated' },
      };

      instruction.onAction(mockVm);

      expect(globalVariables.myVar).toBe('updated');
    });

    it('should not set variable when args are missing', () => {
      currentStackItem = {
        name: 'set',
        args: undefined,
      };

      instruction.onAction(mockVm);

      expect(Object.keys(globalVariables)).toHaveLength(0);
    });

    it('should not set variable when variable name is empty', () => {
      currentStackItem = {
        name: 'set',
        args: { variable: '', value: 'test' },
      };

      instruction.onAction(mockVm);

      expect(globalVariables['']).toBeUndefined();
    });
  });
});
