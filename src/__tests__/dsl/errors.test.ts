import { describe, expect, it } from 'bun:test';
import { compile, validate } from '@/dsl/compiler';
import { ErrorCode, createError, createWarning, formatError } from '@/dsl/types/errors';

describe('DSL Error Handling', () => {
  describe('Error Types', () => {
    it('should create error with all fields', () => {
      const error = createError(ErrorCode.UNKNOWN_INSTRUCTION, 'Unknown instruction', {
        location: { line: 10, column: 5 },
        source: '- webhok:',
        suggestion: 'Did you mean webhook?',
      });

      expect(error.code).toBe(ErrorCode.UNKNOWN_INSTRUCTION);
      expect(error.message).toBe('Unknown instruction');
      expect(error.location?.line).toBe(10);
      expect(error.source).toBe('- webhok:');
      expect(error.suggestion).toBe('Did you mean webhook?');
    });

    it('should create warning', () => {
      const warning = createWarning(ErrorCode.UNDEFINED_VARIABLE, 'Variable may be undefined', {
        line: 5,
        column: 10,
      });

      expect(warning.code).toBe(ErrorCode.UNDEFINED_VARIABLE);
      expect(warning.message).toBe('Variable may be undefined');
    });
  });

  describe('formatError', () => {
    it('should format error with location', () => {
      const error = createError(ErrorCode.INVALID_SYNTAX, 'Syntax error', {
        location: { line: 10, column: 5 },
      });

      const formatted = formatError(error);

      expect(formatted).toContain('Line 10');
      expect(formatted).toContain('Column 5');
      expect(formatted).toContain('Syntax error');
    });

    it('should format error with source', () => {
      const error = createError(ErrorCode.UNKNOWN_INSTRUCTION, 'Unknown instruction', {
        source: '- webhok:',
      });

      const formatted = formatError(error);

      expect(formatted).toContain('- webhok:');
    });

    it('should format error with suggestion', () => {
      const error = createError(ErrorCode.UNKNOWN_INSTRUCTION, 'Unknown instruction', {
        suggestion: 'Did you mean webhook?',
      });

      const formatted = formatError(error);

      expect(formatted).toContain('Suggestion:');
      expect(formatted).toContain('Did you mean webhook?');
    });
  });

  describe('Compilation Errors', () => {
    describe('YAML syntax errors', () => {
      it('should report invalid YAML syntax', () => {
        // Use tab character which is invalid in YAML indentation
        const source = `
version: "1.0"
program:
  - set:
\t    variable: test
`;

        const result = compile(source);

        expect(result.success).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
        expect(result.errors[0].code).toBe(ErrorCode.INVALID_YAML);
      });

      it('should report unclosed quotes', () => {
        const source = `
version: "1.0
program:
  - debug:
      variables: [event]
`;

        const result = compile(source);

        expect(result.success).toBe(false);
        expect(result.errors[0].code).toBe(ErrorCode.INVALID_YAML);
      });
    });

    describe('Missing required fields', () => {
      it('should report missing version', () => {
        const source = `
program:
  - debug:
      variables: [event]
`;

        const result = compile(source);

        expect(result.success).toBe(false);
        expect(result.errors.some((e) => e.code === ErrorCode.MISSING_REQUIRED_FIELD)).toBe(true);
        expect(result.errors.some((e) => e.message.includes('version'))).toBe(true);
      });

      it('should report missing program', () => {
        const source = `
version: "1.0"
name: "Test"
`;

        const result = compile(source);

        expect(result.success).toBe(false);
        expect(result.errors.some((e) => e.code === ErrorCode.MISSING_REQUIRED_FIELD)).toBe(true);
        expect(result.errors.some((e) => e.message.includes('program'))).toBe(true);
      });
    });

    describe('Invalid field types', () => {
      it('should report program not being an array', () => {
        const source = `
version: "1.0"
program:
  name: set
  variable: test
`;

        const result = compile(source);

        expect(result.success).toBe(false);
        expect(result.errors.some((e) => e.code === ErrorCode.INVALID_FIELD_TYPE)).toBe(true);
      });

      it('should report empty program', () => {
        const source = `
version: "1.0"
program: []
`;

        const result = compile(source);

        expect(result.success).toBe(false);
        expect(result.errors[0].code).toBe(ErrorCode.EMPTY_PROGRAM);
      });
    });

    describe('Unknown instructions', () => {
      it('should report unknown instruction with suggestion', () => {
        const source = `
version: "1.0"
program:
  - webhok:
      url: "https://example.com"
      body: event
`;

        const result = compile(source);

        expect(result.success).toBe(false);
        expect(result.errors[0].code).toBe(ErrorCode.UNKNOWN_INSTRUCTION);
        expect(result.errors[0].message).toContain('webhok');
        expect(result.errors[0].suggestion).toContain('webhook');
      });

      it('should suggest filter-events for filterevent', () => {
        const source = `
version: "1.0"
program:
  - filterevents:
      events: ["Transfer"]
`;

        const result = compile(source);

        expect(result.success).toBe(false);
        expect(result.errors[0].suggestion).toContain('filter-events');
      });

      it('should suggest debug for dbug', () => {
        const source = `
version: "1.0"
program:
  - dbug:
      variables: [event]
`;

        const result = compile(source);

        expect(result.success).toBe(false);
        expect(result.errors[0].suggestion).toContain('debug');
      });
    });

    describe('Instruction validation errors', () => {
      it('should report missing required instruction fields', () => {
        const source = `
version: "1.0"
program:
  - webhook:
      url: "https://example.com"
`;

        const result = compile(source);

        expect(result.success).toBe(false);
        // Missing body field
        expect(result.errors.length).toBeGreaterThan(0);
      });

      it('should report invalid transform type', () => {
        const source = `
version: "1.0"
program:
  - transform-string:
      from: event.name
      transform: invalidtransform
      to: output
`;

        const result = compile(source);

        expect(result.success).toBe(false);
      });

      it('should report invalid condition operator', () => {
        const source = `
version: "1.0"
program:
  - condition:
      when:
        all:
          - variable: amount
            operator: "=="
            compareTo: threshold
      then: branch_0
      else: branch_1
      branches:
        branch_0: []
        branch_1: []
`;

        const result = compile(source);

        expect(result.success).toBe(false);
      });

      it('should report empty events array', () => {
        const source = `
version: "1.0"
program:
  - filter-events:
      events: []
`;

        const result = compile(source);

        expect(result.success).toBe(false);
      });

      it('should report variable name too short', () => {
        const source = `
version: "1.0"
program:
  - set:
      variable: x
      value: 123
`;

        const result = compile(source);

        expect(result.success).toBe(false);
      });
    });

    describe('Version validation', () => {
      it('should reject invalid version format', () => {
        const source = `
version: "v1.0"
program:
  - debug:
      variables: [event]
`;

        const result = compile(source);

        expect(result.success).toBe(false);
      });

      it('should accept X.Y version format', () => {
        const source = `
version: "2.0"
program:
  - debug:
      variables: [event]
`;

        const result = compile(source);

        expect(result.success).toBe(true);
      });

      it('should accept X.Y.Z version format', () => {
        const source = `
version: "1.2.3"
program:
  - debug:
      variables: [event]
`;

        const result = compile(source);

        expect(result.success).toBe(true);
      });
    });

    describe('Condition validation', () => {
      it('should require all or any in condition', () => {
        const source = `
version: "1.0"
program:
  - condition:
      when: {}
      then: branch_0
      else: branch_1
      branches:
        branch_0: []
        branch_1: []
`;

        const result = compile(source);

        expect(result.success).toBe(false);
      });

      it('should validate nested instruction in branches', () => {
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
          - unknowninstruction:
              foo: bar
        branch_1: []
`;

        const result = compile(source);

        expect(result.success).toBe(false);
      });
    });
  });

  describe('Validation vs Compilation', () => {
    it('should validate without generating output', () => {
      const source = `
version: "1.0"
name: "Test"
program:
  - debug:
      variables: [event]
`;

      const result = validate(source);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.name).toBe('Test');
    });

    it('should return same errors as compile', () => {
      const source = `
version: "1.0"
program:
  - unknown:
      foo: bar
`;

      const validateResult = validate(source);
      const compileResult = compile(source);

      expect(validateResult.success).toBe(false);
      expect(compileResult.success).toBe(false);
      expect(validateResult.errors[0].code).toBe(compileResult.errors[0].code);
    });
  });

  describe('Multiple errors', () => {
    it('should collect multiple validation errors', () => {
      const source = `
version: "1.0"
program:
  - unknown1:
      foo: bar
  - unknown2:
      baz: qux
`;

      const result = compile(source);

      expect(result.success).toBe(false);
      expect(result.errors.length).toBe(2);
    });
  });
});
