import { beforeEach, describe, expect, it, mock } from 'bun:test';
import { BullMQProducer } from '@/processors/bullmq';
import type { InstructionCall, VirtualMachine } from '@/types/vm';

// Mock dependencies
mock.module('@/services/log', () => ({
  default: {
    d: mock(() => {}),
    i: mock(() => {}),
    w: mock(() => {}),
    e: mock(() => {}),
  },
}));

mock.module('@/config/index', () => ({
  appConfig: {
    redis: {
      hostname: 'localhost',
      port: 6379,
    },
  },
}));

// Mock Queue class
const mockQueueAdd = mock(() => Promise.resolve({ id: 'job-id' }));
mock.module('bullmq', () => ({
  Queue: class MockQueue {
    add = mockQueueAdd;
  },
}));

describe('BullMQProducer Instruction', () => {
  let instruction: BullMQProducer;
  let mockVm: VirtualMachine;
  let currentStackItem: InstructionCall | undefined;
  let globalVariables: Record<string, unknown>;

  beforeEach(() => {
    instruction = new BullMQProducer();
    globalVariables = {};
    currentStackItem = undefined;
    mockQueueAdd.mockClear();

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
    it('should return "bullmq-producer"', () => {
      expect(instruction.name()).toBe('bullmq-producer');
    });
  });

  describe('validateArgs', () => {
    it('should accept valid args', () => {
      expect(
        instruction.validateArgs({
          bodyInput: 'event',
          queueName: 'events-queue',
        })
      ).toBe(true);
    });

    it('should reject short bodyInput', () => {
      expect(
        instruction.validateArgs({
          bodyInput: 'x',
          queueName: 'events-queue',
        })
      ).toBe(false);
    });

    it('should reject short queueName', () => {
      expect(
        instruction.validateArgs({
          bodyInput: 'event',
          queueName: 'q',
        })
      ).toBe(false);
    });

    it('should reject missing bodyInput', () => {
      expect(
        instruction.validateArgs({
          queueName: 'events-queue',
        })
      ).toBe(false);
    });

    it('should reject missing queueName', () => {
      expect(
        instruction.validateArgs({
          bodyInput: 'event',
        })
      ).toBe(false);
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
    it('should add event to queue', async () => {
      globalVariables = {
        event: { type: 'Transfer', value: 100 },
        cast: { id: 'cast-123' },
      };
      currentStackItem = {
        name: 'bullmq-producer',
        args: {
          bodyInput: 'event',
          queueName: 'events-queue',
        },
      };

      await instruction.onAction(mockVm);

      expect(mockQueueAdd).toHaveBeenCalledTimes(1);
    });

    it('should skip when body is missing', async () => {
      globalVariables = {
        cast: { id: 'cast-123' },
      };
      currentStackItem = {
        name: 'bullmq-producer',
        args: {
          bodyInput: 'nonexistent',
          queueName: 'events-queue',
        },
      };

      await instruction.onAction(mockVm);

      expect(mockQueueAdd).not.toHaveBeenCalled();
    });

    it('should skip when queueName is empty', async () => {
      globalVariables = {
        event: { type: 'Transfer' },
        cast: { id: 'cast-123' },
      };
      currentStackItem = {
        name: 'bullmq-producer',
        args: {
          bodyInput: 'event',
          queueName: '',
        },
      };

      await instruction.onAction(mockVm);

      expect(mockQueueAdd).not.toHaveBeenCalled();
    });
  });
});
