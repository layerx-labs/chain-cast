import { describe, expect, it } from 'bun:test';
import { transformInstruction, transformInstructions } from '@/dsl/transformers';
import type { DSLInstruction } from '@/dsl/types/ast';

describe('DSL Transformers', () => {
  describe('transformInstruction', () => {
    describe('filter-events', () => {
      it('should transform filter-events instruction', () => {
        const dsl: DSLInstruction = {
          'filter-events': { events: ['Transfer', 'Approval'] },
        };

        const result = transformInstruction(dsl);

        expect(result).toEqual({
          name: 'filter-events',
          args: {
            eventNames: ['Transfer', 'Approval'],
          },
        });
      });
    });

    describe('set', () => {
      it('should transform set instruction with number', () => {
        const dsl: DSLInstruction = {
          set: { variable: 'threshold', value: 1000 },
        };

        const result = transformInstruction(dsl);

        expect(result).toEqual({
          name: 'set',
          args: {
            variable: 'threshold',
            value: 1000,
          },
        });
      });

      it('should transform set instruction with object', () => {
        const dsl: DSLInstruction = {
          set: { variable: 'config', value: { enabled: true } },
        };

        const result = transformInstruction(dsl);

        expect(result).toEqual({
          name: 'set',
          args: {
            variable: 'config',
            value: { enabled: true },
          },
        });
      });
    });

    describe('debug', () => {
      it('should transform debug instruction', () => {
        const dsl: DSLInstruction = {
          debug: { variables: ['event', 'cast', 'myVar'] },
        };

        const result = transformInstruction(dsl);

        expect(result).toEqual({
          name: 'debug',
          args: {
            variablesToDebug: ['event', 'cast', 'myVar'],
          },
        });
      });
    });

    describe('transform-string', () => {
      it('should transform basic string transformation', () => {
        const dsl: DSLInstruction = {
          'transform-string': {
            from: 'event.name',
            transform: 'uppercase',
            to: 'formattedName',
          },
        };

        const result = transformInstruction(dsl);

        expect(result).toEqual({
          name: 'transform-string',
          args: {
            variable: 'event.name',
            transform: 'uppercase',
            output: 'formattedName',
          },
        });
      });

      it('should transform split with delimiter', () => {
        const dsl: DSLInstruction = {
          'transform-string': {
            from: 'csvData',
            transform: 'split',
            delimiter: ',',
            to: 'dataArray',
          },
        };

        const result = transformInstruction(dsl);

        expect(result).toEqual({
          name: 'transform-string',
          args: {
            variable: 'csvData',
            transform: 'split',
            split: ',',
            output: 'dataArray',
          },
        });
      });
    });

    describe('transform-number', () => {
      it('should transform with both operands', () => {
        const dsl: DSLInstruction = {
          'transform-number': {
            left: 'amount',
            right: 'divisor',
            transform: 'divide',
            to: 'result',
          },
        };

        const result = transformInstruction(dsl);

        expect(result).toEqual({
          name: 'transform-number',
          args: {
            variableLeft: 'amount',
            variableRight: 'divisor',
            transform: 'divide',
            output: 'result',
          },
        });
      });

      it('should transform without right operand', () => {
        const dsl: DSLInstruction = {
          'transform-number': {
            left: 'amount',
            transform: 'bigint',
            to: 'result',
          },
        };

        const result = transformInstruction(dsl);

        expect(result).toEqual({
          name: 'transform-number',
          args: {
            variableLeft: 'amount',
            variableRight: undefined,
            transform: 'bigint',
            output: 'result',
          },
        });
      });
    });

    describe('transform-object', () => {
      it('should transform keys operation', () => {
        const dsl: DSLInstruction = {
          'transform-object': {
            from: 'event.returnValues',
            transform: 'keys',
            to: 'eventKeys',
          },
        };

        const result = transformInstruction(dsl);

        expect(result).toEqual({
          name: 'transform-object',
          args: {
            variable: 'event.returnValues',
            transform: 'keys',
            output: 'eventKeys',
          },
        });
      });

      it('should transform value operation with key', () => {
        const dsl: DSLInstruction = {
          'transform-object': {
            from: 'event.returnValues',
            transform: 'value',
            key: 'amount',
            to: 'eventAmount',
          },
        };

        const result = transformInstruction(dsl);

        expect(result).toEqual({
          name: 'transform-object',
          args: {
            variable: 'event.returnValues',
            transform: 'value',
            key: 'amount',
            output: 'eventAmount',
          },
        });
      });
    });

    describe('transform-array', () => {
      it('should transform length operation', () => {
        const dsl: DSLInstruction = {
          'transform-array': {
            from: 'myArray',
            transform: 'length',
            to: 'arrayLength',
          },
        };

        const result = transformInstruction(dsl);

        expect(result).toEqual({
          name: 'transform-array',
          args: {
            variable: 'myArray',
            transform: 'length',
            output: 'arrayLength',
          },
        });
      });

      it('should transform at operation with position', () => {
        const dsl: DSLInstruction = {
          'transform-array': {
            from: 'myArray',
            transform: 'at',
            position: 0,
            to: 'firstElement',
          },
        };

        const result = transformInstruction(dsl);

        expect(result).toEqual({
          name: 'transform-array',
          args: {
            variable: 'myArray',
            transform: 'at',
            position: 0,
            output: 'firstElement',
          },
        });
      });
    });

    describe('transform-template', () => {
      it('should transform template instruction', () => {
        const dsl: DSLInstruction = {
          'transform-template': {
            context: ['event.from', 'event.to', 'event.amount'],
            template: 'Transfer: {{var0}} -> {{var1}}: {{var2}}',
            to: 'message',
          },
        };

        const result = transformInstruction(dsl);

        expect(result).toEqual({
          name: 'transform-template',
          args: {
            context: ['event.from', 'event.to', 'event.amount'],
            template: 'Transfer: {{var0}} -> {{var1}}: {{var2}}',
            output: 'message',
          },
        });
      });
    });

    describe('webhook', () => {
      it('should transform basic webhook', () => {
        const dsl: DSLInstruction = {
          webhook: {
            url: 'https://api.example.com/events',
            body: 'event',
          },
        };

        const result = transformInstruction(dsl);

        expect(result).toEqual({
          name: 'webhook',
          args: {
            url: 'https://api.example.com/events',
            bodyInput: 'event',
          },
        });
      });

      it('should transform webhook with auth', () => {
        const dsl: DSLInstruction = {
          webhook: {
            url: 'https://api.example.com/events',
            body: 'event',
            auth: 'apiKey',
          },
        };

        const result = transformInstruction(dsl);

        expect(result).toEqual({
          name: 'webhook',
          args: {
            url: 'https://api.example.com/events',
            bodyInput: 'event',
            authorizationKey: 'apiKey',
          },
        });
      });
    });

    describe('bullmq', () => {
      it('should transform bullmq instruction', () => {
        const dsl: DSLInstruction = {
          bullmq: {
            queue: 'event-processor',
            body: 'event',
          },
        };

        const result = transformInstruction(dsl);

        expect(result).toEqual({
          name: 'bullmq-producer',
          args: {
            queueName: 'event-processor',
            bodyInput: 'event',
          },
        });
      });
    });

    describe('elasticsearch', () => {
      it('should transform elasticsearch instruction', () => {
        const dsl: DSLInstruction = {
          elasticsearch: {
            url: 'esUrl',
            username: 'esUser',
            password: 'esPassword',
            index: 'events-v1',
            body: 'event',
          },
        };

        const result = transformInstruction(dsl);

        expect(result).toEqual({
          name: 'elasticsearch',
          args: {
            url: 'esUrl',
            username: 'esUser',
            password: 'esPassword',
            indexName: 'events-v1',
            bodyInput: 'event',
          },
        });
      });
    });

    describe('spreadsheet', () => {
      it('should transform spreadsheet instruction', () => {
        const dsl: DSLInstruction = {
          spreadsheet: {
            auth: 'googleAuth',
            spreadsheetId: 'abc123',
            range: 'Sheet1!A:Z',
            body: 'rowData',
          },
        };

        const result = transformInstruction(dsl);

        expect(result).toEqual({
          name: 'spreadsheet',
          args: {
            auth: 'googleAuth',
            spreadsheetId: 'abc123',
            range: 'Sheet1!A:Z',
            inputBody: 'rowData',
          },
        });
      });
    });

    describe('condition', () => {
      it('should transform condition with AND', () => {
        const dsl: DSLInstruction = {
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

        const result = transformInstruction(dsl);

        expect(result.name).toBe('condition');
        expect(result.args.AND).toEqual([
          { variable: 'amount', condition: '>', compareTo: 'threshold' },
        ]);
        expect(result.args.onTrue).toBe('goto_0');
        expect(result.args.onFalse).toBe('goto_1');
        expect(result.args.branch_0).toHaveLength(1);
        expect(result.args.branch_0[0]).toEqual({
          name: 'debug',
          args: { variablesToDebug: ['event'] },
        });
      });

      it('should transform condition with OR', () => {
        const dsl: DSLInstruction = {
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
              branch_0: [],
              branch_1: [],
            },
          },
        };

        const result = transformInstruction(dsl);

        expect(result.args.OR).toEqual([
          { variable: 'event.event', condition: '=', compareTo: 'Transfer' },
          { variable: 'event.event', condition: '=', compareTo: 'Approval' },
        ]);
      });

      it('should transform nested conditions', () => {
        const dsl: DSLInstruction = {
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

        const result = transformInstruction(dsl);

        // Check nested condition
        const nestedCondition = result.args.branch_0[0];
        expect(nestedCondition.name).toBe('condition');
        expect(nestedCondition.args.AND).toEqual([
          { variable: 'amount', condition: '<', compareTo: '1000' },
        ]);
      });
    });
  });

  describe('transformInstructions', () => {
    it('should transform multiple instructions', () => {
      const dsls: DSLInstruction[] = [
        { 'filter-events': { events: ['Transfer'] } },
        { set: { variable: 'threshold', value: 1000 } },
        { debug: { variables: ['event'] } },
      ];

      const results = transformInstructions(dsls);

      expect(results).toHaveLength(3);
      expect(results[0].name).toBe('filter-events');
      expect(results[1].name).toBe('set');
      expect(results[2].name).toBe('debug');
    });

    it('should throw on unknown instruction', () => {
      const dsls = [{ unknown: { foo: 'bar' } }] as unknown as DSLInstruction[];

      expect(() => transformInstructions(dsls)).toThrow('Unknown instruction type');
    });
  });
});
