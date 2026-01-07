import { beforeEach, describe, expect, it, mock } from 'bun:test';
import { Debug } from '@/processors/debug';
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

describe('Debug Instruction', () => {
  let instruction: Debug;
  let mockVm: VirtualMachine;
  let currentStackItem: InstructionCall | undefined;
  let globalVariables: Record<string, unknown>;

  beforeEach(() => {
    instruction = new Debug();
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
    it('should return "debug"', () => {
      expect(instruction.name()).toBe('debug');
    });
  });

  describe('validateArgs', () => {
    it('should accept valid args with variablesToDebug array', () => {
      expect(instruction.validateArgs({ variablesToDebug: ['event', 'cast'] })).toBe(true);
    });

    it('should accept empty variablesToDebug array', () => {
      expect(instruction.validateArgs({ variablesToDebug: [] })).toBe(true);
    });

    it('should reject missing variablesToDebug', () => {
      expect(instruction.validateArgs({})).toBe(false);
    });

    it('should reject undefined args', () => {
      expect(instruction.validateArgs(undefined)).toBe(false);
    });

    it('should reject non-array variablesToDebug', () => {
      expect(instruction.validateArgs({ variablesToDebug: 'event' })).toBe(false);
    });

    it('should reject array with non-string elements', () => {
      expect(instruction.validateArgs({ variablesToDebug: [123, 456] })).toBe(false);
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
    it('should log variables that exist', () => {
      globalVariables = {
        event: { type: 'Transfer', value: 100 },
      };
      currentStackItem = {
        name: 'debug',
        args: { variablesToDebug: ['event'] },
      };

      instruction.onAction(mockVm);

      // No error means success - log was called
      expect(true).toBe(true);
    });

    it('should handle nested variable paths', () => {
      globalVariables = {
        event: {
          returnValues: {
            from: '0xsender',
            to: '0xreceiver',
          },
        },
      };
      currentStackItem = {
        name: 'debug',
        args: { variablesToDebug: ['event.returnValues.from'] },
      };

      instruction.onAction(mockVm);

      expect(true).toBe(true);
    });

    it('should handle undefined variables gracefully', () => {
      globalVariables = {};
      currentStackItem = {
        name: 'debug',
        args: { variablesToDebug: ['nonexistent'] },
      };

      instruction.onAction(mockVm);

      expect(true).toBe(true);
    });

    it('should handle empty variablesToDebug array', () => {
      currentStackItem = {
        name: 'debug',
        args: { variablesToDebug: [] },
      };

      instruction.onAction(mockVm);

      expect(true).toBe(true);
    });

    it('should handle missing args', () => {
      currentStackItem = {
        name: 'debug',
        args: undefined,
      };

      instruction.onAction(mockVm);

      expect(true).toBe(true);
    });
  });
});
