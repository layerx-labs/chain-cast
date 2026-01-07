import { describe, expect, it, beforeEach, mock } from 'bun:test';
import type { VirtualMachine, InstructionCall } from '@/types/vm';

// Mock axios before importing WebHook
const mockAxiosPost = mock(() => Promise.resolve({ status: 200, statusText: 'OK' }));
mock.module('axios', () => ({
  default: {
    post: mockAxiosPost,
  },
}));

// Mock the log service
mock.module('@/services/log', () => ({
  default: {
    d: mock(() => {}),
    i: mock(() => {}),
    w: mock(() => {}),
    e: mock(() => {}),
  },
}));

// Import after mocking
import { WebHook } from '@/processors/webhook';

describe('WebHook Instruction', () => {
  let instruction: WebHook;
  let mockVm: VirtualMachine;
  let currentStackItem: InstructionCall | undefined;
  let globalVariables: Record<string, unknown>;

  beforeEach(() => {
    instruction = new WebHook();
    globalVariables = {};
    currentStackItem = undefined;
    mockAxiosPost.mockClear();

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
    it('should return "webhook"', () => {
      expect(instruction.name()).toBe('webhook');
    });
  });

  describe('validateArgs', () => {
    it('should accept valid args with url and bodyInput', () => {
      expect(
        instruction.validateArgs({
          url: 'https://example.com/webhook',
          bodyInput: 'event',
        })
      ).toBe(true);
    });

    it('should accept args with optional authorizationKey', () => {
      expect(
        instruction.validateArgs({
          url: 'https://example.com/webhook',
          bodyInput: 'event',
          authorizationKey: 'Bearer token123',
        })
      ).toBe(true);
    });

    it('should reject invalid URL', () => {
      expect(
        instruction.validateArgs({
          url: 'not-a-valid-url',
          bodyInput: 'event',
        })
      ).toBe(false);
    });

    it('should reject short bodyInput', () => {
      expect(
        instruction.validateArgs({
          url: 'https://example.com/webhook',
          bodyInput: 'x',
        })
      ).toBe(false);
    });

    it('should reject missing url', () => {
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
    it('should make POST request with event body', async () => {
      globalVariables = {
        event: { type: 'Transfer', value: 100 },
        cast: { id: 'cast-123', address: '0x123', chainId: 1 },
      };
      currentStackItem = {
        name: 'webhook',
        args: {
          url: 'https://example.com/webhook',
          bodyInput: 'event',
        },
      };

      await instruction.onAction(mockVm);

      expect(mockAxiosPost).toHaveBeenCalledTimes(1);
      expect(mockAxiosPost.mock.calls[0][0]).toBe('https://example.com/webhook');
    });

    it('should include metadata in request body', async () => {
      globalVariables = {
        event: { type: 'Transfer' },
        cast: { id: 'cast-456', address: '0xabc', chainId: 137 },
      };
      currentStackItem = {
        name: 'webhook',
        args: {
          url: 'https://example.com/webhook',
          bodyInput: 'event',
        },
      };

      await instruction.onAction(mockVm);

      const callArgs = mockAxiosPost.mock.calls[0][1] as {
        metadata: { id: string; address: string; chainId: number };
      };
      expect(callArgs.metadata.id).toBe('cast-456');
      expect(callArgs.metadata.address).toBe('0xabc');
      expect(callArgs.metadata.chainId).toBe(137);
    });

    it('should handle nested variable path for body', async () => {
      globalVariables = {
        data: { nested: { value: 'test' } },
        cast: { id: 'cast-123', address: '0x123', chainId: 1 },
      };
      currentStackItem = {
        name: 'webhook',
        args: {
          url: 'https://example.com/webhook',
          bodyInput: 'data.nested',
        },
      };

      await instruction.onAction(mockVm);

      expect(mockAxiosPost).toHaveBeenCalledTimes(1);
      const callArgs = mockAxiosPost.mock.calls[0][1] as { body: { value: string } };
      expect(callArgs.body).toEqual({ value: 'test' });
    });

    it('should not make request when URL is empty', async () => {
      globalVariables = {
        event: { type: 'Transfer' },
        cast: { id: 'cast-123', address: '0x123', chainId: 1 },
      };
      currentStackItem = {
        name: 'webhook',
        args: {
          url: '',
          bodyInput: 'event',
        },
      };

      await instruction.onAction(mockVm);

      expect(mockAxiosPost).not.toHaveBeenCalled();
    });

    it('should handle missing cast gracefully', async () => {
      globalVariables = {
        event: { type: 'Transfer' },
      };
      currentStackItem = {
        name: 'webhook',
        args: {
          url: 'https://example.com/webhook',
          bodyInput: 'event',
        },
      };

      await instruction.onAction(mockVm);

      expect(mockAxiosPost).toHaveBeenCalledTimes(1);
    });
  });
});
