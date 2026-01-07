import { describe, expect, it, beforeEach, mock } from 'bun:test';
import { FilterEvents } from '@/processors/filter-events';
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

describe('FilterEvents Instruction', () => {
  let instruction: FilterEvents;
  let mockVm: VirtualMachine;
  let currentStackItem: InstructionCall | undefined;
  let globalVariables: Record<string, unknown>;
  let isHalted: boolean;
  let haltMock: ReturnType<typeof mock>;

  beforeEach(() => {
    instruction = new FilterEvents();
    globalVariables = {};
    currentStackItem = undefined;
    isHalted = false;
    haltMock = mock((halt: boolean) => {
      isHalted = halt;
    });

    mockVm = {
      getGlobalVariables: () => globalVariables,
      getGlobalVariable: (name: string) => globalVariables[name],
      getGlobalVariableFromPath: mock(() => null),
      setGlobalVariable: (name: string, value: unknown) => {
        globalVariables[name] = value;
      },
      getCurrentStackItem: () => currentStackItem,
      getStack: () => (currentStackItem ? [currentStackItem] : []),
      isHalted: () => isHalted,
      halt: haltMock,
      getError: () => null,
      setError: mock(() => {}),
      loadProgram: mock(() => {}),
      execute: mock(async () => {}),
      executeInstruction: mock(async () => {}),
      executeInstructions: mock(async () => {}),
    };
  });

  describe('name', () => {
    it('should return "filter-events"', () => {
      expect(instruction.name()).toBe('filter-events');
    });
  });

  describe('validateArgs', () => {
    it('should accept valid args with non-empty eventNames array', () => {
      expect(instruction.validateArgs({ eventNames: ['Transfer'] })).toBe(true);
    });

    it('should accept multiple event names', () => {
      expect(instruction.validateArgs({ eventNames: ['Transfer', 'Approval', 'Mint'] })).toBe(true);
    });

    it('should reject empty eventNames array', () => {
      expect(instruction.validateArgs({ eventNames: [] })).toBe(false);
    });

    it('should reject missing eventNames', () => {
      expect(instruction.validateArgs({})).toBe(false);
    });

    it('should reject undefined args', () => {
      expect(instruction.validateArgs(undefined)).toBe(false);
    });

    it('should reject non-array eventNames', () => {
      expect(instruction.validateArgs({ eventNames: 'Transfer' })).toBe(false);
    });

    it('should reject array with non-string elements', () => {
      expect(instruction.validateArgs({ eventNames: [123, 456] })).toBe(false);
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
    it('should not halt when event matches allowed events', () => {
      globalVariables = {
        event: { event: 'Transfer' },
        cast: { id: 'test-cast', address: '0x123' },
      };
      currentStackItem = {
        name: 'filter-events',
        args: { eventNames: ['Transfer', 'Approval'] },
      };

      instruction.onAction(mockVm);

      expect(isHalted).toBe(false);
      expect(haltMock).not.toHaveBeenCalled();
    });

    it('should halt when event does not match allowed events', () => {
      globalVariables = {
        event: { event: 'Mint' },
        cast: { id: 'test-cast', address: '0x123' },
      };
      currentStackItem = {
        name: 'filter-events',
        args: { eventNames: ['Transfer', 'Approval'] },
      };

      instruction.onAction(mockVm);

      expect(haltMock).toHaveBeenCalledWith(true);
    });

    it('should halt when event name is undefined', () => {
      globalVariables = {
        event: {},
        cast: { id: 'test-cast', address: '0x123' },
      };
      currentStackItem = {
        name: 'filter-events',
        args: { eventNames: ['Transfer'] },
      };

      instruction.onAction(mockVm);

      expect(haltMock).toHaveBeenCalledWith(true);
    });

    it('should halt when event variable is missing', () => {
      globalVariables = {
        cast: { id: 'test-cast', address: '0x123' },
      };
      currentStackItem = {
        name: 'filter-events',
        args: { eventNames: ['Transfer'] },
      };

      instruction.onAction(mockVm);

      expect(haltMock).toHaveBeenCalledWith(true);
    });

    it('should match exact event name', () => {
      globalVariables = {
        event: { event: 'Transfer' },
        cast: { id: 'test-cast', address: '0x123' },
      };
      currentStackItem = {
        name: 'filter-events',
        args: { eventNames: ['TransferFrom'] }, // Different event
      };

      instruction.onAction(mockVm);

      expect(haltMock).toHaveBeenCalledWith(true);
    });

    it('should work with single event name in array', () => {
      globalVariables = {
        event: { event: 'Approval' },
        cast: { id: 'test-cast', address: '0x123' },
      };
      currentStackItem = {
        name: 'filter-events',
        args: { eventNames: ['Approval'] },
      };

      instruction.onAction(mockVm);

      expect(haltMock).not.toHaveBeenCalled();
    });

    it('should handle missing args gracefully', () => {
      globalVariables = {
        event: { event: 'Transfer' },
        cast: { id: 'test-cast', address: '0x123' },
      };
      currentStackItem = {
        name: 'filter-events',
        args: undefined,
      };

      instruction.onAction(mockVm);

      // With empty eventNames array, event won't be included
      expect(haltMock).toHaveBeenCalledWith(true);
    });
  });
});
