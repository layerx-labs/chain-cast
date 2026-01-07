import { describe, expect, it, beforeEach, mock } from 'bun:test';
import { TransformString } from '@/processors/transform-string';
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

describe('TransformString Instruction', () => {
  let instruction: TransformString;
  let mockVm: VirtualMachine;
  let currentStackItem: InstructionCall | undefined;
  let globalVariables: Record<string, unknown>;

  beforeEach(() => {
    instruction = new TransformString();
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
    it('should return "transform-string"', () => {
      expect(instruction.name()).toBe('transform-string');
    });
  });

  describe('validateArgs', () => {
    it('should accept valid args', () => {
      expect(
        instruction.validateArgs({
          variable: 'input',
          transform: 'uppercase',
          output: 'result',
        })
      ).toBe(true);
    });

    it('should accept all valid transform types', () => {
      const transforms = [
        'capitalize',
        'lowercase',
        'trim',
        'uppercase',
        'camelize',
        'underscore',
        'dasherize',
        'bigint',
        'int',
        'number',
        'split',
      ];

      for (const transform of transforms) {
        expect(
          instruction.validateArgs({
            variable: 'input',
            transform,
            output: 'result',
          })
        ).toBe(true);
      }
    });

    it('should accept split with split parameter', () => {
      expect(
        instruction.validateArgs({
          variable: 'input',
          transform: 'split',
          split: ',',
          output: 'result',
        })
      ).toBe(true);
    });

    it('should reject invalid transform type', () => {
      expect(
        instruction.validateArgs({
          variable: 'input',
          transform: 'invalid',
          output: 'result',
        })
      ).toBe(false);
    });

    it('should reject short variable name', () => {
      expect(
        instruction.validateArgs({
          variable: 'x',
          transform: 'uppercase',
          output: 'result',
        })
      ).toBe(false);
    });

    it('should reject short output name', () => {
      expect(
        instruction.validateArgs({
          variable: 'input',
          transform: 'uppercase',
          output: 'r',
        })
      ).toBe(false);
    });

    it('should reject undefined args', () => {
      expect(instruction.validateArgs(undefined)).toBe(false);
    });
  });

  describe('onAction', () => {
    describe('capitalize', () => {
      it('should capitalize first letter', async () => {
        globalVariables = { input: 'hello world' };
        currentStackItem = {
          name: 'transform-string',
          args: { variable: 'input', transform: 'capitalize', output: 'result' },
        };

        await instruction.onAction(mockVm);

        expect(globalVariables['result']).toBe('Hello world');
      });
    });

    describe('lowercase', () => {
      it('should convert to lowercase', async () => {
        globalVariables = { input: 'HELLO WORLD' };
        currentStackItem = {
          name: 'transform-string',
          args: { variable: 'input', transform: 'lowercase', output: 'result' },
        };

        await instruction.onAction(mockVm);

        expect(globalVariables['result']).toBe('hello world');
      });
    });

    describe('uppercase', () => {
      it('should convert to uppercase', async () => {
        globalVariables = { input: 'hello world' };
        currentStackItem = {
          name: 'transform-string',
          args: { variable: 'input', transform: 'uppercase', output: 'result' },
        };

        await instruction.onAction(mockVm);

        expect(globalVariables['result']).toBe('HELLO WORLD');
      });
    });

    describe('trim', () => {
      it('should trim whitespace', async () => {
        globalVariables = { input: '  hello world  ' };
        currentStackItem = {
          name: 'transform-string',
          args: { variable: 'input', transform: 'trim', output: 'result' },
        };

        await instruction.onAction(mockVm);

        expect(globalVariables['result']).toBe('hello world');
      });
    });

    describe('camelize', () => {
      it('should convert to camelCase', async () => {
        globalVariables = { input: 'hello_world' };
        currentStackItem = {
          name: 'transform-string',
          args: { variable: 'input', transform: 'camelize', output: 'result' },
        };

        await instruction.onAction(mockVm);

        expect(globalVariables['result']).toBe('HelloWorld');
      });
    });

    describe('underscore', () => {
      it('should convert to snake_case', async () => {
        globalVariables = { input: 'HelloWorld' };
        currentStackItem = {
          name: 'transform-string',
          args: { variable: 'input', transform: 'underscore', output: 'result' },
        };

        await instruction.onAction(mockVm);

        expect(globalVariables['result']).toBe('hello_world');
      });
    });

    describe('dasherize', () => {
      it('should convert underscores to dashes', async () => {
        globalVariables = { input: 'hello_world' };
        currentStackItem = {
          name: 'transform-string',
          args: { variable: 'input', transform: 'dasherize', output: 'result' },
        };

        await instruction.onAction(mockVm);

        expect(globalVariables['result']).toBe('hello-world');
      });
    });

    describe('bigint', () => {
      it('should convert to BigInt', async () => {
        globalVariables = { input: '1000000000000000000' };
        currentStackItem = {
          name: 'transform-string',
          args: { variable: 'input', transform: 'bigint', output: 'result' },
        };

        await instruction.onAction(mockVm);

        expect(globalVariables['result']).toBe(BigInt('1000000000000000000'));
      });
    });

    describe('int', () => {
      it('should convert to integer', async () => {
        globalVariables = { input: '42' };
        currentStackItem = {
          name: 'transform-string',
          args: { variable: 'input', transform: 'int', output: 'result' },
        };

        await instruction.onAction(mockVm);

        expect(globalVariables['result']).toBe(42);
      });

      it('should parse integer from decimal string', async () => {
        globalVariables = { input: '42.99' };
        currentStackItem = {
          name: 'transform-string',
          args: { variable: 'input', transform: 'int', output: 'result' },
        };

        await instruction.onAction(mockVm);

        expect(globalVariables['result']).toBe(42);
      });
    });

    describe('number', () => {
      it('should convert to number', async () => {
        globalVariables = { input: '3.14' };
        currentStackItem = {
          name: 'transform-string',
          args: { variable: 'input', transform: 'number', output: 'result' },
        };

        await instruction.onAction(mockVm);

        expect(globalVariables['result']).toBe(3.14);
      });
    });

    describe('split', () => {
      it('should split string by comma when split param is comma', async () => {
        globalVariables = { input: 'a,b,c' };
        currentStackItem = {
          name: 'transform-string',
          args: { variable: 'input', transform: 'split', split: ',', output: 'result' },
        };

        await instruction.onAction(mockVm);

        expect(globalVariables['result']).toEqual(['a', 'b', 'c']);
      });

      it('should split string by custom separator', async () => {
        globalVariables = { input: 'a|b|c' };
        currentStackItem = {
          name: 'transform-string',
          args: { variable: 'input', transform: 'split', split: '|', output: 'result' },
        };

        await instruction.onAction(mockVm);

        expect(globalVariables['result']).toEqual(['a', 'b', 'c']);
      });
    });

    describe('nested variable access', () => {
      it('should access nested variable paths', async () => {
        globalVariables = {
          event: {
            data: {
              name: 'hello world',
            },
          },
        };
        currentStackItem = {
          name: 'transform-string',
          args: { variable: 'event.data.name', transform: 'uppercase', output: 'result' },
        };

        await instruction.onAction(mockVm);

        expect(globalVariables['result']).toBe('HELLO WORLD');
      });
    });

    describe('edge cases', () => {
      it('should skip non-string input', async () => {
        globalVariables = { input: 123 };
        currentStackItem = {
          name: 'transform-string',
          args: { variable: 'input', transform: 'uppercase', output: 'result' },
        };

        await instruction.onAction(mockVm);

        expect(globalVariables['result']).toBeUndefined();
      });

      it('should skip when variable does not exist', async () => {
        globalVariables = {};
        currentStackItem = {
          name: 'transform-string',
          args: { variable: 'nonexistent', transform: 'uppercase', output: 'result' },
        };

        await instruction.onAction(mockVm);

        expect(globalVariables['result']).toBeUndefined();
      });

      it('should return early when args are missing', async () => {
        currentStackItem = {
          name: 'transform-string',
          args: undefined,
        };

        await instruction.onAction(mockVm);

        expect(Object.keys(globalVariables)).toHaveLength(0);
      });
    });
  });
});
