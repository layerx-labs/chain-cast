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

// Mock Elasticsearch client
const mockEsIndex = mock(() => Promise.resolve({ _id: 'doc-id' }));
mock.module('@elastic/elasticsearch', () => ({
  Client: class MockClient {
    constructor(_options?: unknown) {}
    index = mockEsIndex;
  },
}));

// Import after mocking
import { ElasticSearch } from '@/processors/elastic-search';

describe('ElasticSearch Instruction', () => {
  let instruction: ElasticSearch;
  let mockVm: VirtualMachine;
  let currentStackItem: InstructionCall | undefined;
  let globalVariables: Record<string, unknown>;

  beforeEach(() => {
    instruction = new ElasticSearch();
    globalVariables = {};
    currentStackItem = undefined;
    mockEsIndex.mockClear();

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
    it('should return "elasticsearch"', () => {
      expect(instruction.name()).toBe('elasticsearch');
    });
  });

  describe('validateArgs', () => {
    const validArgs = {
      bodyInput: 'event',
      indexName: 'blockchainevent',
      url: 'http://localhost:9200',
      username: 'elastic',
      password: 'changeme',
    };

    it('should accept valid args', () => {
      expect(instruction.validateArgs(validArgs)).toBe(true);
    });

    it('should reject invalid index name with special characters', () => {
      expect(
        instruction.validateArgs({
          ...validArgs,
          indexName: 'invalid-index!',
        })
      ).toBe(false);
    });

    it('should accept index name with lowercase letters and allowed numbers', () => {
      // Regex is /^[a-z1-9-_]+$/ which allows a-z, 1-9 (not 0), dash, and underscore
      expect(
        instruction.validateArgs({
          ...validArgs,
          indexName: 'events-1',
        })
      ).toBe(true);
    });

    it('should reject short bodyInput', () => {
      expect(
        instruction.validateArgs({
          ...validArgs,
          bodyInput: 'x',
        })
      ).toBe(false);
    });

    it('should reject missing required fields', () => {
      expect(instruction.validateArgs({ bodyInput: 'event' })).toBe(false);
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
    it('should index document to Elasticsearch', async () => {
      globalVariables = {
        event: { type: 'Transfer', value: 100 },
        cast: { id: 'cast-123' },
      };
      currentStackItem = {
        name: 'elasticsearch',
        args: {
          bodyInput: 'event',
          indexName: 'events',
          url: 'http://localhost:9200',
          username: 'elastic',
          password: 'changeme',
        },
      };

      await instruction.onAction(mockVm);

      expect(mockEsIndex).toHaveBeenCalledTimes(1);
    });

    it('should still index when body is missing (indexes empty body)', async () => {
      globalVariables = {
        cast: { id: 'cast-123' },
      };
      currentStackItem = {
        name: 'elasticsearch',
        args: {
          bodyInput: 'nonexistent',
          indexName: 'events',
          url: 'http://localhost:9200',
          username: 'elastic',
          password: 'changeme',
        },
      };

      await instruction.onAction(mockVm);

      // The instruction creates client and indexes even with null body
      expect(mockEsIndex).toHaveBeenCalledTimes(1);
    });
  });
});
