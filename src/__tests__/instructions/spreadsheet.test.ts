import { describe, expect, it, beforeEach, mock } from 'bun:test';
import type { VirtualMachine, InstructionCall } from '@/types/vm';

// Mock dependencies
mock.module('@/services/log', () => ({
  default: {
    d: mock(() => {}),
    i: mock(() => {}),
    w: mock(() => {}),
    e: mock(() => {}),
  },
}));

// Mock Google APIs
const mockSheetsAppend = mock(() =>
  Promise.resolve({
    data: { updates: { updatedRows: 1 } },
  })
);

mock.module('googleapis', () => ({
  google: {
    auth: {
      GoogleAuth: class MockGoogleAuth {
        constructor(_options?: unknown) {}
      },
    },
    sheets: () => ({
      spreadsheets: {
        values: {
          append: mockSheetsAppend,
        },
      },
    }),
  },
}));

// Import after mocking
import { SpreadSheet } from '@/processors/spreadsheet';

describe('SpreadSheet Instruction', () => {
  let instruction: SpreadSheet;
  let mockVm: VirtualMachine;
  let currentStackItem: InstructionCall | undefined;
  let globalVariables: Record<string, unknown>;

  beforeEach(() => {
    instruction = new SpreadSheet();
    globalVariables = {};
    currentStackItem = undefined;
    mockSheetsAppend.mockClear();

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
    it('should return "spreadsheet"', () => {
      expect(instruction.name()).toBe('spreadsheet');
    });
  });

  describe('validateArgs', () => {
    const validArgs = {
      inputBody: 'event',
      auth: btoa(JSON.stringify({ client_email: 'test@test.com', private_key: 'key' })),
      spreadsheetId: 'spreadsheet-123',
      range: 'Sheet1!A:D',
    };

    it('should accept valid args', () => {
      expect(instruction.validateArgs(validArgs)).toBe(true);
    });

    it('should reject short inputBody', () => {
      expect(
        instruction.validateArgs({
          ...validArgs,
          inputBody: 'x',
        })
      ).toBe(false);
    });

    it('should reject short spreadsheetId', () => {
      expect(
        instruction.validateArgs({
          ...validArgs,
          spreadsheetId: 'x',
        })
      ).toBe(false);
    });

    it('should reject missing required fields', () => {
      expect(instruction.validateArgs({ inputBody: 'event' })).toBe(false);
    });

    it('should reject undefined args', () => {
      expect(instruction.validateArgs(undefined)).toBe(false);
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
    it('should append data to spreadsheet', async () => {
      globalVariables = {
        event: ['value1', 'value2', 'value3'],
        cast: { id: 'cast-123' },
      };
      currentStackItem = {
        name: 'spreadsheet',
        args: {
          inputBody: 'event',
          auth: btoa(JSON.stringify({ client_email: 'test@test.com', private_key: 'key' })),
          spreadsheetId: 'spreadsheet-123',
          range: 'Sheet1!A:D',
        },
      };

      await instruction.onAction(mockVm);

      expect(mockSheetsAppend).toHaveBeenCalledTimes(1);
    });

    it('should still append when body is missing (appends null)', async () => {
      globalVariables = {
        cast: { id: 'cast-123' },
      };
      currentStackItem = {
        name: 'spreadsheet',
        args: {
          inputBody: 'nonexistent',
          auth: btoa(JSON.stringify({ client_email: 'test@test.com', private_key: 'key' })),
          spreadsheetId: 'spreadsheet-123',
          range: 'Sheet1!A:D',
        },
      };

      await instruction.onAction(mockVm);

      // The instruction calls append even with null body
      expect(mockSheetsAppend).toHaveBeenCalledTimes(1);
    });
  });
});
