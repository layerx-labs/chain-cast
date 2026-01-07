import { describe, expect, it, beforeEach, mock } from 'bun:test';
import { TransformTemplate } from '@/processors/transform-template';
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

describe('TransformTemplate Instruction', () => {
  let instruction: TransformTemplate;
  let mockVm: VirtualMachine;
  let currentStackItem: InstructionCall | undefined;
  let globalVariables: Record<string, unknown>;

  beforeEach(() => {
    instruction = new TransformTemplate();
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
    it('should return "transform-template"', () => {
      expect(instruction.name()).toBe('transform-template');
    });
  });

  describe('validateArgs', () => {
    it('should accept valid args', () => {
      expect(
        instruction.validateArgs({
          context: ['event'],
          template: 'Hello {{var0}}',
          output: 'result',
        })
      ).toBe(true);
    });

    it('should accept multiple context variables', () => {
      expect(
        instruction.validateArgs({
          context: ['firstName', 'lastName'],
          template: '{{var0}} {{var1}}',
          output: 'fullName',
        })
      ).toBe(true);
    });

    it('should accept empty context array', () => {
      // The schema allows empty context arrays
      expect(
        instruction.validateArgs({
          context: [],
          template: 'Hello',
          output: 'result',
        })
      ).toBe(true);
    });

    it('should reject short template', () => {
      expect(
        instruction.validateArgs({
          context: ['event'],
          template: 'x',
          output: 'result',
        })
      ).toBe(false);
    });

    it('should reject short output name', () => {
      expect(
        instruction.validateArgs({
          context: ['event'],
          template: 'Hello',
          output: 'r',
        })
      ).toBe(false);
    });

    it('should reject undefined args', () => {
      expect(instruction.validateArgs(undefined)).toBe(false);
    });
  });

  describe('onAction', () => {
    it('should render template with single context variable', async () => {
      globalVariables = { name: 'Alice' };
      currentStackItem = {
        name: 'transform-template',
        args: {
          context: ['name'],
          template: 'Hello, {{var0}}!',
          output: 'message',
        },
      };

      await instruction.onAction(mockVm);

      expect(globalVariables['message']).toBe('Hello, Alice!');
    });

    it('should render template with multiple context variables', async () => {
      globalVariables = {
        firstName: 'John',
        lastName: 'Doe',
      };
      currentStackItem = {
        name: 'transform-template',
        args: {
          context: ['firstName', 'lastName'],
          template: '{{var0}} {{var1}}',
          output: 'fullName',
        },
      };

      await instruction.onAction(mockVm);

      expect(globalVariables['fullName']).toBe('John Doe');
    });

    it('should handle nested variable paths', async () => {
      globalVariables = {
        event: {
          returnValues: {
            from: '0x1234',
            to: '0x5678',
          },
        },
      };
      currentStackItem = {
        name: 'transform-template',
        args: {
          context: ['event.returnValues.from', 'event.returnValues.to'],
          template: 'Transfer from {{var0}} to {{var1}}',
          output: 'message',
        },
      };

      await instruction.onAction(mockVm);

      expect(globalVariables['message']).toBe('Transfer from 0x1234 to 0x5678');
    });

    it('should handle object context variables', async () => {
      globalVariables = {
        user: { name: 'Bob', role: 'Admin' },
      };
      currentStackItem = {
        name: 'transform-template',
        args: {
          context: ['user'],
          template: 'User: {{var0.name}} ({{var0.role}})',
          output: 'message',
        },
      };

      await instruction.onAction(mockVm);

      expect(globalVariables['message']).toBe('User: Bob (Admin)');
    });

    it('should handle missing context variables gracefully', async () => {
      globalVariables = {};
      currentStackItem = {
        name: 'transform-template',
        args: {
          context: ['nonexistent'],
          template: 'Value: {{var0}}',
          output: 'message',
        },
      };

      await instruction.onAction(mockVm);

      // Handlebars renders missing variables as empty string
      expect(globalVariables['message']).toBe('Value: ');
    });

    it('should return early when args are missing', async () => {
      currentStackItem = {
        name: 'transform-template',
        args: undefined,
      };

      await instruction.onAction(mockVm);

      expect(Object.keys(globalVariables)).toHaveLength(0);
    });

    it('should handle numeric values in template', async () => {
      globalVariables = {
        amount: 1000,
        fee: 50,
      };
      currentStackItem = {
        name: 'transform-template',
        args: {
          context: ['amount', 'fee'],
          template: 'Amount: {{var0}}, Fee: {{var1}}',
          output: 'summary',
        },
      };

      await instruction.onAction(mockVm);

      expect(globalVariables['summary']).toBe('Amount: 1000, Fee: 50');
    });
  });
});
