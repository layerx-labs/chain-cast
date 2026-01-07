import { describe, expect, it } from 'bun:test';
import {
  bullmqSchema,
  conditionSchema,
  debugSchema,
  dslDocumentSchema,
  elasticsearchSchema,
  filterEventsSchema,
  getInstructionType,
  setSchema,
  spreadsheetSchema,
  transformArraySchema,
  transformNumberSchema,
  transformObjectSchema,
  transformStringSchema,
  transformTemplateSchema,
  webhookSchema,
} from '@/dsl/validator/schemas';

describe('DSL Validator Schemas', () => {
  describe('dslDocumentSchema', () => {
    it('should validate a minimal document', () => {
      const doc = {
        version: '1.0',
        program: [{ set: { variable: 'test', value: 123 } }],
      };

      const result = dslDocumentSchema.safeParse(doc);
      expect(result.success).toBe(true);
    });

    it('should validate version format X.Y', () => {
      const doc = {
        version: '2.1',
        program: [{ debug: { variables: ['event'] } }],
      };

      const result = dslDocumentSchema.safeParse(doc);
      expect(result.success).toBe(true);
    });

    it('should validate version format X.Y.Z', () => {
      const doc = {
        version: '1.2.3',
        program: [{ debug: { variables: ['event'] } }],
      };

      const result = dslDocumentSchema.safeParse(doc);
      expect(result.success).toBe(true);
    });

    it('should reject invalid version format', () => {
      const doc = {
        version: 'v1.0',
        program: [{ debug: { variables: ['event'] } }],
      };

      const result = dslDocumentSchema.safeParse(doc);
      expect(result.success).toBe(false);
    });

    it('should reject empty program', () => {
      const doc = {
        version: '1.0',
        program: [],
      };

      const result = dslDocumentSchema.safeParse(doc);
      expect(result.success).toBe(false);
    });
  });

  describe('filter-events schema', () => {
    it('should validate with single event', () => {
      const instruction = {
        'filter-events': { events: ['Transfer'] },
      };

      const result = filterEventsSchema.safeParse(instruction);
      expect(result.success).toBe(true);
    });

    it('should validate with multiple events', () => {
      const instruction = {
        'filter-events': { events: ['Transfer', 'Approval', 'Mint'] },
      };

      const result = filterEventsSchema.safeParse(instruction);
      expect(result.success).toBe(true);
    });

    it('should reject empty events array', () => {
      const instruction = {
        'filter-events': { events: [] },
      };

      const result = filterEventsSchema.safeParse(instruction);
      expect(result.success).toBe(false);
    });
  });

  describe('set schema', () => {
    it('should validate with string value', () => {
      const instruction = {
        set: { variable: 'myVar', value: 'hello' },
      };

      const result = setSchema.safeParse(instruction);
      expect(result.success).toBe(true);
    });

    it('should validate with number value', () => {
      const instruction = {
        set: { variable: 'myVar', value: 42 },
      };

      const result = setSchema.safeParse(instruction);
      expect(result.success).toBe(true);
    });

    it('should validate with object value', () => {
      const instruction = {
        set: { variable: 'config', value: { enabled: true, limit: 100 } },
      };

      const result = setSchema.safeParse(instruction);
      expect(result.success).toBe(true);
    });

    it('should reject short variable name', () => {
      const instruction = {
        set: { variable: 'x', value: 123 },
      };

      const result = setSchema.safeParse(instruction);
      expect(result.success).toBe(false);
    });
  });

  describe('debug schema', () => {
    it('should validate with single variable', () => {
      const instruction = {
        debug: { variables: ['event'] },
      };

      const result = debugSchema.safeParse(instruction);
      expect(result.success).toBe(true);
    });

    it('should validate with multiple variables', () => {
      const instruction = {
        debug: { variables: ['event', 'cast', 'myVar'] },
      };

      const result = debugSchema.safeParse(instruction);
      expect(result.success).toBe(true);
    });

    it('should reject empty variables array', () => {
      const instruction = {
        debug: { variables: [] },
      };

      const result = debugSchema.safeParse(instruction);
      expect(result.success).toBe(false);
    });
  });

  describe('transform-string schema', () => {
    it('should validate basic transformation', () => {
      const instruction = {
        'transform-string': {
          from: 'event.name',
          transform: 'uppercase',
          to: 'formattedName',
        },
      };

      const result = transformStringSchema.safeParse(instruction);
      expect(result.success).toBe(true);
    });

    it('should validate split with delimiter', () => {
      const instruction = {
        'transform-string': {
          from: 'csvData',
          transform: 'split',
          delimiter: ',',
          to: 'dataArray',
        },
      };

      const result = transformStringSchema.safeParse(instruction);
      expect(result.success).toBe(true);
    });

    it('should validate all transform types', () => {
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
        const instruction = {
          'transform-string': {
            from: 'source',
            transform,
            to: 'output',
          },
        };

        const result = transformStringSchema.safeParse(instruction);
        expect(result.success).toBe(true);
      }
    });

    it('should reject invalid transform type', () => {
      const instruction = {
        'transform-string': {
          from: 'source',
          transform: 'invalid',
          to: 'output',
        },
      };

      const result = transformStringSchema.safeParse(instruction);
      expect(result.success).toBe(false);
    });
  });

  describe('transform-number schema', () => {
    it('should validate with both operands', () => {
      const instruction = {
        'transform-number': {
          left: 'amount',
          right: 'divisor',
          transform: 'divide',
          to: 'result',
        },
      };

      const result = transformNumberSchema.safeParse(instruction);
      expect(result.success).toBe(true);
    });

    it('should validate without right operand', () => {
      const instruction = {
        'transform-number': {
          left: 'amount',
          transform: 'bigint',
          to: 'result',
        },
      };

      const result = transformNumberSchema.safeParse(instruction);
      expect(result.success).toBe(true);
    });

    it('should validate all transform types', () => {
      const transforms = ['add', 'subtract', 'multiply', 'divide', 'pow', 'bigint'];

      for (const transform of transforms) {
        const instruction = {
          'transform-number': {
            left: 'left',
            transform,
            to: 'output',
          },
        };

        const result = transformNumberSchema.safeParse(instruction);
        expect(result.success).toBe(true);
      }
    });
  });

  describe('transform-object schema', () => {
    it('should validate keys transform', () => {
      const instruction = {
        'transform-object': {
          from: 'event.returnValues',
          transform: 'keys',
          to: 'eventKeys',
        },
      };

      const result = transformObjectSchema.safeParse(instruction);
      expect(result.success).toBe(true);
    });

    it('should validate value transform with key', () => {
      const instruction = {
        'transform-object': {
          from: 'event.returnValues',
          transform: 'value',
          key: 'amount',
          to: 'eventAmount',
        },
      };

      const result = transformObjectSchema.safeParse(instruction);
      expect(result.success).toBe(true);
    });
  });

  describe('transform-array schema', () => {
    it('should validate length transform', () => {
      const instruction = {
        'transform-array': {
          from: 'myArray',
          transform: 'length',
          to: 'arrayLength',
        },
      };

      const result = transformArraySchema.safeParse(instruction);
      expect(result.success).toBe(true);
    });

    it('should validate at transform with position', () => {
      const instruction = {
        'transform-array': {
          from: 'myArray',
          transform: 'at',
          position: 0,
          to: 'firstElement',
        },
      };

      const result = transformArraySchema.safeParse(instruction);
      expect(result.success).toBe(true);
    });
  });

  describe('transform-template schema', () => {
    it('should validate with context and template', () => {
      const instruction = {
        'transform-template': {
          context: ['event.from', 'event.to', 'event.amount'],
          template: 'Transfer: {{var0}} -> {{var1}}: {{var2}}',
          to: 'message',
        },
      };

      const result = transformTemplateSchema.safeParse(instruction);
      expect(result.success).toBe(true);
    });

    it('should reject empty context', () => {
      const instruction = {
        'transform-template': {
          context: [],
          template: 'Hello',
          to: 'message',
        },
      };

      const result = transformTemplateSchema.safeParse(instruction);
      expect(result.success).toBe(false);
    });
  });

  describe('webhook schema', () => {
    it('should validate basic webhook', () => {
      const instruction = {
        webhook: {
          url: 'https://api.example.com/events',
          body: 'event',
        },
      };

      const result = webhookSchema.safeParse(instruction);
      expect(result.success).toBe(true);
    });

    it('should validate webhook with auth', () => {
      const instruction = {
        webhook: {
          url: 'https://api.example.com/events',
          body: 'event',
          auth: 'apiKey',
        },
      };

      const result = webhookSchema.safeParse(instruction);
      expect(result.success).toBe(true);
    });
  });

  describe('bullmq schema', () => {
    it('should validate bullmq instruction', () => {
      const instruction = {
        bullmq: {
          queue: 'event-processor',
          body: 'event',
        },
      };

      const result = bullmqSchema.safeParse(instruction);
      expect(result.success).toBe(true);
    });
  });

  describe('elasticsearch schema', () => {
    it('should validate elasticsearch instruction', () => {
      const instruction = {
        elasticsearch: {
          url: 'esUrl',
          username: 'esUser',
          password: 'esPassword',
          index: 'events-v1',
          body: 'event',
        },
      };

      const result = elasticsearchSchema.safeParse(instruction);
      expect(result.success).toBe(true);
    });

    it('should reject invalid index name', () => {
      const instruction = {
        elasticsearch: {
          url: 'esUrl',
          username: 'esUser',
          password: 'esPassword',
          index: 'Events V1', // Invalid: contains uppercase and space
          body: 'event',
        },
      };

      const result = elasticsearchSchema.safeParse(instruction);
      expect(result.success).toBe(false);
    });
  });

  describe('spreadsheet schema', () => {
    it('should validate spreadsheet instruction', () => {
      const instruction = {
        spreadsheet: {
          auth: 'googleAuth',
          spreadsheetId: 'abc123',
          range: 'Sheet1!A:Z',
          body: 'rowData',
        },
      };

      const result = spreadsheetSchema.safeParse(instruction);
      expect(result.success).toBe(true);
    });
  });

  describe('condition schema', () => {
    it('should validate condition with AND', () => {
      const instruction = {
        condition: {
          when: {
            all: [{ variable: 'amount', operator: '>', compareTo: 'threshold' }],
          },
          // biome-ignore lint/suspicious/noThenProperty: DSL condition branch
          then: 'branch_0',
          else: 'branch_1',
          branches: {
            branch_0: [{ debug: { variables: ['event'] } }],
            branch_1: [],
          },
        },
      };

      const result = conditionSchema.safeParse(instruction);
      expect(result.success).toBe(true);
    });

    it('should validate condition with OR', () => {
      const instruction = {
        condition: {
          when: {
            any: [
              { variable: 'event.event', operator: '=', compareTo: 'Transfer' },
              { variable: 'event.event', operator: '=', compareTo: 'Approval' },
            ],
          },
          // biome-ignore lint/suspicious/noThenProperty: DSL condition branch
          then: 'branch_0',
          else: 'branch_1',
          branches: {
            branch_0: [{ debug: { variables: ['event'] } }],
            branch_1: [],
          },
        },
      };

      const result = conditionSchema.safeParse(instruction);
      expect(result.success).toBe(true);
    });

    it('should validate nested conditions', () => {
      const instruction = {
        condition: {
          when: {
            all: [{ variable: 'amount', operator: '>', compareTo: '100' }],
          },
          // biome-ignore lint/suspicious/noThenProperty: DSL condition branch
          then: 'branch_0',
          else: 'branch_1',
          branches: {
            branch_0: [
              {
                condition: {
                  when: {
                    all: [{ variable: 'amount', operator: '<', compareTo: '1000' }],
                  },
                  // biome-ignore lint/suspicious/noThenProperty: DSL condition branch
                  then: 'branch_0',
                  else: 'branch_1',
                  branches: {
                    branch_0: [{ debug: { variables: ['amount'] } }],
                    branch_1: [],
                  },
                },
              },
            ],
            branch_1: [],
          },
        },
      };

      const result = conditionSchema.safeParse(instruction);
      expect(result.success).toBe(true);
    });

    it('should reject condition without all or any', () => {
      const instruction = {
        condition: {
          when: {},
          // biome-ignore lint/suspicious/noThenProperty: DSL condition branch
          then: 'branch_0',
          else: 'branch_1',
          branches: {
            branch_0: [],
            branch_1: [],
          },
        },
      };

      const result = conditionSchema.safeParse(instruction);
      expect(result.success).toBe(false);
    });
  });

  describe('getInstructionType', () => {
    it('should identify filter-events', () => {
      expect(getInstructionType({ 'filter-events': { events: ['Transfer'] } })).toBe(
        'filter-events'
      );
    });

    it('should identify set', () => {
      expect(getInstructionType({ set: { variable: 'x', value: 1 } })).toBe('set');
    });

    it('should identify webhook', () => {
      expect(getInstructionType({ webhook: { url: 'http://...', body: 'event' } })).toBe('webhook');
    });

    it('should return null for unknown instruction', () => {
      expect(getInstructionType({ unknown: {} })).toBe(null);
    });

    it('should return null for non-object', () => {
      expect(getInstructionType('string')).toBe(null);
      expect(getInstructionType(null)).toBe(null);
      expect(getInstructionType(123)).toBe(null);
    });
  });
});
