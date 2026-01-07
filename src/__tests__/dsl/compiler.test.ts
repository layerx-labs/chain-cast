import { describe, expect, it } from 'bun:test';
import { ChainCastDSLCompiler, compile, createCompiler, validate } from '@/dsl/compiler';
import { ErrorCode } from '@/dsl/types/errors';

describe('DSL Compiler', () => {
  describe('compile', () => {
    it('should compile a simple pipeline', () => {
      const source = `
version: "1.0"
name: "Test Pipeline"
program:
  - filter-events:
      events: ["Transfer"]
  - debug:
      variables: [event]
`;

      const result = compile(source);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.instructions).toHaveLength(2);
      expect(result.data?.json).toBeDefined();
    });

    it('should compile with all instruction types', () => {
      const source = `
version: "1.0"
name: "Full Pipeline"
program:
  - filter-events:
      events: ["Transfer"]

  - set:
      variable: threshold
      value: 1000

  - debug:
      variables: [event]

  - transform-string:
      from: event.name
      transform: uppercase
      to: formattedName

  - transform-number:
      left: amount
      right: divisor
      transform: divide
      to: result

  - transform-object:
      from: event.returnValues
      transform: keys
      to: eventKeys

  - transform-array:
      from: myArray
      transform: length
      to: arrayLength

  - transform-template:
      context: [event.from, event.to]
      template: "{{var0}} -> {{var1}}"
      to: message

  - webhook:
      url: "https://api.example.com"
      body: event

  - bullmq:
      queue: "events"
      body: event
`;

      const result = compile(source);

      expect(result.success).toBe(true);
      expect(result.data?.instructions).toHaveLength(10);
    });

    it('should compile with conditions', () => {
      const source = `
version: "1.0"
program:
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
              url: "https://api.example.com/high"
              body: event
        branch_1:
          - debug:
              variables: [amount]
`;

      const result = compile(source);

      expect(result.success).toBe(true);
      expect(result.data?.instructions).toHaveLength(1);

      const condition = result.data?.instructions[0];
      expect(condition?.name).toBe('condition');
      expect(condition?.args.branch_0).toHaveLength(1);
      expect(condition?.args.branch_1).toHaveLength(1);
    });

    it('should output minified JSON when requested', () => {
      const source = `
version: "1.0"
program:
  - set:
      variable: test
      value: 123
`;

      const result = compile(source, { minify: true });

      expect(result.success).toBe(true);
      expect(result.data?.json).not.toContain('\n');
      expect(result.data?.json).not.toContain('  ');
    });

    it('should output base64 when requested', () => {
      const source = `
version: "1.0"
program:
  - set:
      variable: test
      value: 123
`;

      const result = compile(source, { base64: true });

      expect(result.success).toBe(true);
      expect(result.data?.base64).toBeDefined();

      // Verify base64 is valid
      const base64 = result.data?.base64 ?? '';
      const decoded = Buffer.from(base64, 'base64').toString('utf-8');
      const parsed = JSON.parse(decoded);
      expect(parsed).toHaveLength(1);
      expect(parsed[0].name).toBe('set');
    });

    it('should return document in result', () => {
      const source = `
version: "1.0"
name: "My Pipeline"
description: "A test"
program:
  - debug:
      variables: [event]
`;

      const result = compile(source);

      expect(result.success).toBe(true);
      expect(result.document).toBeDefined();
      expect(result.document?.name).toBe('My Pipeline');
      expect(result.document?.description).toBe('A test');
    });
  });

  describe('validate', () => {
    it('should validate a correct document', () => {
      const source = `
version: "1.0"
program:
  - set:
      variable: test
      value: 123
`;

      const result = validate(source);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });

    it('should return errors for invalid document', () => {
      const source = `
version: "1.0"
program:
  - unknown-instruction:
      foo: bar
`;

      const result = validate(source);

      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('ChainCastDSLCompiler class', () => {
    it('should create compiler with options', () => {
      const compiler = createCompiler({
        minify: true,
        base64: true,
      });

      const source = `
version: "1.0"
program:
  - debug:
      variables: [event]
`;

      const result = compiler.compile(source);

      expect(result.success).toBe(true);
      expect(result.data?.base64).toBeDefined();
      expect(result.data?.json).not.toContain('\n');
    });

    it('should throw on error when throwOnError is true', () => {
      const compiler = new ChainCastDSLCompiler({ throwOnError: true });

      const source = `
version: "1.0"
program:
  - unknown:
      foo: bar
`;

      expect(() => compiler.compile(source)).toThrow();
    });
  });

  describe('error handling', () => {
    it('should provide helpful error for typos', () => {
      const source = `
version: "1.0"
program:
  - webhok:
      url: "https://example.com"
      body: event
`;

      const result = compile(source);

      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);

      const error = result.errors[0];
      expect(error.code).toBe(ErrorCode.UNKNOWN_INSTRUCTION);
      expect(error.message).toContain('webhok');
      expect(error.suggestion).toContain('webhook');
    });

    it('should provide helpful error for missing required field', () => {
      const source = `
version: "1.0"
program:
  - webhook:
      url: "https://example.com"
`;

      const result = compile(source);

      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should handle multiple errors', () => {
      const source = `
program:
  - set:
      variable: x
`;

      const result = compile(source);

      expect(result.success).toBe(false);
      // Missing version + variable too short
      expect(result.errors.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('complex pipelines', () => {
    it('should compile a real-world monitoring pipeline', () => {
      const source = `
version: "1.0"
name: "ERC20 Transfer Monitor"
description: "Monitor high-value transfers and alert via webhook"

program:
  - filter-events:
      events: ["Transfer"]

  - set:
      variable: threshold
      value: 1000000000000000000000000

  - transform-string:
      from: event.returnValues.value
      transform: bigint
      to: amount

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
          - transform-template:
              context:
                - event.returnValues.from
                - event.returnValues.to
                - event.returnValues.value
              template: "ALERT: Transfer from {{var0}} to {{var1}}: {{var2}}"
              to: alertMessage
          - webhook:
              url: "https://api.example.com/alerts"
              body: event
        branch_1:
          - debug:
              variables: [amount]
`;

      const result = compile(source);

      expect(result.success).toBe(true);
      expect(result.data?.instructions).toHaveLength(4);

      // Verify structure
      const instructions = result.data?.instructions;
      expect(instructions[0].name).toBe('filter-events');
      expect(instructions[1].name).toBe('set');
      expect(instructions[2].name).toBe('transform-string');
      expect(instructions[3].name).toBe('condition');

      // Verify nested condition
      const condition = instructions[3];
      expect(condition.args.branch_0).toHaveLength(2);
      expect(condition.args.branch_0[0].name).toBe('transform-template');
      expect(condition.args.branch_0[1].name).toBe('webhook');
      expect(condition.args.branch_1).toHaveLength(1);
      expect(condition.args.branch_1[0].name).toBe('debug');
    });

    it('should compile pipeline with all integration types', () => {
      const source = `
version: "1.0"
name: "Multi-Integration Pipeline"
program:
  - filter-events:
      events: ["Transfer"]

  - webhook:
      url: "https://api.example.com/events"
      body: event
      auth: apiKey

  - bullmq:
      queue: "event-processor"
      body: event

  - elasticsearch:
      url: esUrl
      username: esUser
      password: esPassword
      index: "events-v1"
      body: event

  - spreadsheet:
      auth: googleAuth
      spreadsheetId: "abc123"
      range: "Sheet1!A:Z"
      body: event
`;

      const result = compile(source);

      expect(result.success).toBe(true);
      expect(result.data?.instructions).toHaveLength(5);
    });
  });
});
