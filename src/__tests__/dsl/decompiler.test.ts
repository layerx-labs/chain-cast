import { describe, expect, it } from 'bun:test';
import { compile } from '@/dsl/compiler';
import { decompile, decompileFromBase64, decompileToYAML } from '@/dsl/generator/decompiler';
import type { InstructionCall } from '@/types/vm';

describe('DSL Decompiler', () => {
  describe('decompile', () => {
    it('should decompile filter-events instruction', () => {
      const instructions: InstructionCall[] = [
        { name: 'filter-events', args: { eventNames: ['Transfer', 'Approval'] } },
      ];

      const result = decompile(instructions);

      expect(result.version).toBe('1.0');
      expect(result.program).toHaveLength(1);
      expect(result.program[0]).toEqual({
        'filter-events': { events: ['Transfer', 'Approval'] },
      });
    });

    it('should decompile set instruction', () => {
      const instructions: InstructionCall[] = [
        { name: 'set', args: { variable: 'threshold', value: 1000 } },
      ];

      const result = decompile(instructions);

      expect(result.program[0]).toEqual({
        set: { variable: 'threshold', value: 1000 },
      });
    });

    it('should decompile debug instruction', () => {
      const instructions: InstructionCall[] = [
        { name: 'debug', args: { variablesToDebug: ['event', 'cast'] } },
      ];

      const result = decompile(instructions);

      expect(result.program[0]).toEqual({
        debug: { variables: ['event', 'cast'] },
      });
    });

    it('should decompile transform-string instruction', () => {
      const instructions: InstructionCall[] = [
        {
          name: 'transform-string',
          args: { variable: 'event.name', transform: 'uppercase', output: 'formatted' },
        },
      ];

      const result = decompile(instructions);

      expect(result.program[0]).toEqual({
        'transform-string': { from: 'event.name', transform: 'uppercase', to: 'formatted' },
      });
    });

    it('should decompile transform-string with split', () => {
      const instructions: InstructionCall[] = [
        {
          name: 'transform-string',
          args: { variable: 'csv', transform: 'split', split: ',', output: 'array' },
        },
      ];

      const result = decompile(instructions);

      expect(result.program[0]).toEqual({
        'transform-string': { from: 'csv', transform: 'split', delimiter: ',', to: 'array' },
      });
    });

    it('should decompile transform-number instruction', () => {
      const instructions: InstructionCall[] = [
        {
          name: 'transform-number',
          args: {
            variableLeft: 'amount',
            variableRight: 'divisor',
            transform: 'divide',
            output: 'result',
          },
        },
      ];

      const result = decompile(instructions);

      expect(result.program[0]).toEqual({
        'transform-number': { left: 'amount', right: 'divisor', transform: 'divide', to: 'result' },
      });
    });

    it('should decompile transform-object instruction', () => {
      const instructions: InstructionCall[] = [
        {
          name: 'transform-object',
          args: { variable: 'event', transform: 'keys', output: 'keys' },
        },
      ];

      const result = decompile(instructions);

      expect(result.program[0]).toEqual({
        'transform-object': { from: 'event', transform: 'keys', to: 'keys' },
      });
    });

    it('should decompile transform-array instruction', () => {
      const instructions: InstructionCall[] = [
        {
          name: 'transform-array',
          args: { variable: 'arr', transform: 'at', position: 0, output: 'first' },
        },
      ];

      const result = decompile(instructions);

      expect(result.program[0]).toEqual({
        'transform-array': { from: 'arr', transform: 'at', position: 0, to: 'first' },
      });
    });

    it('should decompile transform-template instruction', () => {
      const instructions: InstructionCall[] = [
        {
          name: 'transform-template',
          args: { context: ['a', 'b'], template: '{{var0}} -> {{var1}}', output: 'msg' },
        },
      ];

      const result = decompile(instructions);

      expect(result.program[0]).toEqual({
        'transform-template': { context: ['a', 'b'], template: '{{var0}} -> {{var1}}', to: 'msg' },
      });
    });

    it('should decompile webhook instruction', () => {
      const instructions: InstructionCall[] = [
        {
          name: 'webhook',
          args: { url: 'https://example.com', bodyInput: 'event', authorizationKey: 'key' },
        },
      ];

      const result = decompile(instructions);

      expect(result.program[0]).toEqual({
        webhook: { url: 'https://example.com', body: 'event', auth: 'key' },
      });
    });

    it('should decompile bullmq-producer instruction', () => {
      const instructions: InstructionCall[] = [
        { name: 'bullmq-producer', args: { queueName: 'events', bodyInput: 'event' } },
      ];

      const result = decompile(instructions);

      expect(result.program[0]).toEqual({
        bullmq: { queue: 'events', body: 'event' },
      });
    });

    it('should decompile elasticsearch instruction', () => {
      const instructions: InstructionCall[] = [
        {
          name: 'elasticsearch',
          args: {
            url: 'esUrl',
            username: 'user',
            password: 'pass',
            indexName: 'idx',
            bodyInput: 'event',
          },
        },
      ];

      const result = decompile(instructions);

      expect(result.program[0]).toEqual({
        elasticsearch: {
          url: 'esUrl',
          username: 'user',
          password: 'pass',
          index: 'idx',
          body: 'event',
        },
      });
    });

    it('should decompile spreadsheet instruction', () => {
      const instructions: InstructionCall[] = [
        {
          name: 'spreadsheet',
          args: { auth: 'auth', spreadsheetId: 'id', range: 'A:Z', inputBody: 'data' },
        },
      ];

      const result = decompile(instructions);

      expect(result.program[0]).toEqual({
        spreadsheet: { auth: 'auth', spreadsheetId: 'id', range: 'A:Z', body: 'data' },
      });
    });

    it('should decompile condition instruction', () => {
      const instructions: InstructionCall[] = [
        {
          name: 'condition',
          args: {
            AND: [{ variable: 'amount', condition: '>', compareTo: 'threshold' }],
            onTrue: 'goto_0',
            onFalse: 'goto_1',
            branch_0: [{ name: 'debug', args: { variablesToDebug: ['event'] } }],
            branch_1: [],
          },
        },
      ];

      const result = decompile(instructions);
      const condition = result.program[0] as { condition: { when: { all?: unknown[] } } };

      expect(condition.condition.when.all).toEqual([
        { variable: 'amount', operator: '>', compareTo: 'threshold' },
      ]);
    });

    it('should include name and description when provided', () => {
      const instructions: InstructionCall[] = [
        { name: 'debug', args: { variablesToDebug: ['event'] } },
      ];

      const result = decompile(instructions, {
        name: 'My Pipeline',
        description: 'A test pipeline',
      });

      expect(result.name).toBe('My Pipeline');
      expect(result.description).toBe('A test pipeline');
    });
  });

  describe('decompileToYAML', () => {
    it('should produce valid YAML', () => {
      const instructions: InstructionCall[] = [
        { name: 'filter-events', args: { eventNames: ['Transfer'] } },
        { name: 'debug', args: { variablesToDebug: ['event'] } },
      ];

      const yaml = decompileToYAML(instructions);

      expect(yaml).toContain('version:');
      expect(yaml).toContain('program:');
      expect(yaml).toContain('filter-events:');
      expect(yaml).toContain('debug:');
    });
  });

  describe('decompileFromBase64', () => {
    it('should decompile from base64', () => {
      const instructions: InstructionCall[] = [
        { name: 'debug', args: { variablesToDebug: ['event'] } },
      ];
      const json = JSON.stringify(instructions);
      const base64 = Buffer.from(json).toString('base64');

      const yaml = decompileFromBase64(base64);

      expect(yaml).toContain('version:');
      expect(yaml).toContain('debug:');
    });
  });

  describe('round-trip compilation', () => {
    it('should round-trip a simple pipeline', () => {
      const originalSource = `
version: "1.0"
name: "Test Pipeline"
program:
  - filter-events:
      events: ["Transfer"]
  - debug:
      variables: [event]
`;

      // Compile to JSON
      const compiled = compile(originalSource);
      expect(compiled.success).toBe(true);

      // Decompile back to DSL
      const decompiled = decompile(compiled.data!.instructions, {
        name: 'Test Pipeline',
      });

      // Compile again
      const recompiled = compile(
        decompileToYAML(compiled.data!.instructions, { name: 'Test Pipeline' })
      );
      expect(recompiled.success).toBe(true);

      // Should have same instructions
      expect(recompiled.data?.instructions).toEqual(compiled.data?.instructions);
    });

    it('should round-trip a pipeline with conditions', () => {
      const originalSource = `
version: "1.0"
program:
  - condition:
      when:
        all:
          - variable: amount
            operator: ">"
            compareTo: "100"
      then: branch_0
      else: branch_1
      branches:
        branch_0:
          - webhook:
              url: "https://example.com"
              body: event
        branch_1:
          - debug:
              variables: [amount]
`;

      const compiled = compile(originalSource);
      expect(compiled.success).toBe(true);

      const yaml = decompileToYAML(compiled.data!.instructions);
      const recompiled = compile(yaml);
      expect(recompiled.success).toBe(true);

      // Check structure is preserved
      expect(recompiled.data?.instructions).toHaveLength(1);
      expect(recompiled.data?.instructions[0].name).toBe('condition');
    });

    it('should round-trip a complex pipeline', () => {
      const originalSource = `
version: "1.0"
name: "Complex Pipeline"
program:
  - filter-events:
      events: ["Transfer"]

  - set:
      variable: threshold
      value: 1000

  - transform-string:
      from: event.value
      transform: number
      to: amount

  - transform-template:
      context:
        - event.from
        - event.to
      template: "{{var0}} -> {{var1}}"
      to: message

  - condition:
      when:
        all:
          - variable: amount
            operator: ">"
            compareTo: threshold
      then: branch_0
      else: branch_1
      branches:
        branch_0:
          - webhook:
              url: "https://api.example.com"
              body: event
          - bullmq:
              queue: "high-value"
              body: event
        branch_1:
          - debug:
              variables: [amount, message]
`;

      const compiled = compile(originalSource);
      expect(compiled.success).toBe(true);

      const yaml = decompileToYAML(compiled.data!.instructions, { name: 'Complex Pipeline' });
      const recompiled = compile(yaml);
      expect(recompiled.success).toBe(true);

      // Verify instruction count matches
      expect(recompiled.data?.instructions).toHaveLength(5);
    });

    it('should round-trip base64 encoding', () => {
      const originalSource = `
version: "1.0"
program:
  - set:
      variable: test
      value: 123
  - debug:
      variables: [test]
`;

      // Compile with base64
      const compiled = compile(originalSource, { base64: true });
      expect(compiled.success).toBe(true);
      expect(compiled.data?.base64).toBeDefined();

      // Decompile from base64
      const yaml = decompileFromBase64(compiled.data!.base64!);

      // Compile again
      const recompiled = compile(yaml);
      expect(recompiled.success).toBe(true);

      // Instructions should match
      expect(recompiled.data?.instructions).toEqual(compiled.data?.instructions);
    });
  });
});
