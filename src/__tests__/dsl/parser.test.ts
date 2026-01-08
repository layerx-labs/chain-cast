import { describe, expect, it } from 'bun:test';
import { parseYAML } from '@/dsl/parser';
import { ErrorCode } from '@/dsl/types/errors';

describe('YAML Parser', () => {
  describe('valid documents', () => {
    it('should parse a minimal valid document', () => {
      const source = `
version: "1.0"
program:
  - set:
      variable: test
      value: 123
`;
      const result = parseYAML(source);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.version).toBe('1.0');
      expect(result.data?.program).toHaveLength(1);
    });

    it('should parse document with name and description', () => {
      const source = `
version: "1.0"
name: "Test Pipeline"
description: "A test pipeline"
program:
  - debug:
      variables: [event]
`;
      const result = parseYAML(source);

      expect(result.success).toBe(true);
      expect(result.data?.name).toBe('Test Pipeline');
      expect(result.data?.description).toBe('A test pipeline');
    });

    it('should parse document with multiple instructions', () => {
      const source = `
version: "1.0"
program:
  - filter-events:
      events: ["Transfer"]
  - set:
      variable: threshold
      value: 1000
  - debug:
      variables: [event, threshold]
`;
      const result = parseYAML(source);

      expect(result.success).toBe(true);
      expect(result.data?.program).toHaveLength(3);
    });
  });

  describe('invalid documents', () => {
    it('should fail on missing version', () => {
      const source = `
program:
  - set:
      variable: test
      value: 123
`;
      const result = parseYAML(source);

      expect(result.success).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].code).toBe(ErrorCode.MISSING_REQUIRED_FIELD);
      expect(result.errors[0].message).toContain('version');
    });

    it('should fail on missing program', () => {
      const source = `
version: "1.0"
name: "Test"
`;
      const result = parseYAML(source);

      expect(result.success).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].code).toBe(ErrorCode.MISSING_REQUIRED_FIELD);
      expect(result.errors[0].message).toContain('program');
    });

    it('should fail on empty program', () => {
      const source = `
version: "1.0"
program: []
`;
      const result = parseYAML(source);

      expect(result.success).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].code).toBe(ErrorCode.EMPTY_PROGRAM);
    });

    it('should fail on program not being an array', () => {
      const source = `
version: "1.0"
program:
  instruction: set
  variable: test
`;
      const result = parseYAML(source);

      expect(result.success).toBe(false);
      expect(result.errors[0].code).toBe(ErrorCode.INVALID_FIELD_TYPE);
    });

    it('should fail on invalid YAML syntax', () => {
      // Use a tab character which is not valid in YAML indentation after spaces
      const source = `
version: "1.0"
program:
  - set:
\t    variable: test
`;
      const result = parseYAML(source);

      expect(result.success).toBe(false);
      expect(result.errors[0].code).toBe(ErrorCode.INVALID_YAML);
    });
  });
});
