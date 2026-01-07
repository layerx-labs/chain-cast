/**
 * YAML Parser wrapper with source location tracking
 */

import { type YAMLParseError, parse, parseDocument } from 'yaml';
import type { DSLDocument } from '../types/ast';
import {
  type CompilationResult,
  type CompilerError,
  ErrorCode,
  type SourceLocation,
  createError,
} from '../types/errors';

/**
 * Result of parsing YAML source
 */
export interface ParseResult {
  document: DSLDocument | null;
  errors: CompilerError[];
}

/**
 * Extract source location from YAML node
 */
function getLocationFromOffset(source: string, offset: number): SourceLocation {
  let line = 1;
  let column = 1;
  let currentOffset = 0;

  for (const char of source) {
    if (currentOffset >= offset) break;
    if (char === '\n') {
      line++;
      column = 1;
    } else {
      column++;
    }
    currentOffset++;
  }

  return { line, column, offset };
}

/**
 * Get the source line at a given line number
 */
function getSourceLine(source: string, lineNumber: number): string {
  const lines = source.split('\n');
  return lines[lineNumber - 1] || '';
}

/**
 * Convert YAML parse error to compiler error
 */
function yamlErrorToCompilerError(error: YAMLParseError, source: string): CompilerError {
  const location = error.pos ? getLocationFromOffset(source, error.pos[0]) : undefined;

  return createError(ErrorCode.INVALID_YAML, error.message, {
    location,
    source: location ? getSourceLine(source, location.line) : undefined,
    suggestion:
      'Check your YAML syntax. Common issues: incorrect indentation, missing colons, or unquoted special characters.',
  });
}

/**
 * Parse YAML source string to DSL document
 */
export function parseYAML(source: string): CompilationResult<DSLDocument> {
  const errors: CompilerError[] = [];
  const warnings: CompilerError[] = [];

  try {
    // First, try to parse the document to check for syntax errors
    const doc = parseDocument(source, {
      strict: true,
      prettyErrors: true,
    });

    // Collect any YAML parsing errors
    if (doc.errors && doc.errors.length > 0) {
      for (const error of doc.errors) {
        errors.push(yamlErrorToCompilerError(error, source));
      }
      return { success: false, errors, warnings };
    }

    // Parse the document to get the JavaScript object
    const parsed = parse(source, {
      strict: true,
    }) as unknown;

    // Basic structure validation
    if (typeof parsed !== 'object' || parsed === null) {
      errors.push(
        createError(ErrorCode.INVALID_SYNTAX, 'DSL document must be an object', {
          suggestion: 'Ensure your YAML starts with version, name, and program fields.',
        })
      );
      return { success: false, errors, warnings };
    }

    const document = parsed as DSLDocument;

    // Check for required fields
    if (!document.version) {
      errors.push(
        createError(ErrorCode.MISSING_REQUIRED_FIELD, 'Missing required field: version', {
          suggestion: 'Add "version: \'1.0\'" at the top of your DSL file.',
        })
      );
    }

    if (!document.program) {
      errors.push(
        createError(ErrorCode.MISSING_REQUIRED_FIELD, 'Missing required field: program', {
          suggestion: 'Add a "program:" section with your instruction list.',
        })
      );
    } else if (!Array.isArray(document.program)) {
      errors.push(
        createError(ErrorCode.INVALID_FIELD_TYPE, 'Field "program" must be an array', {
          suggestion: 'The program field should contain a list of instructions.',
        })
      );
    } else if (document.program.length === 0) {
      errors.push(
        createError(ErrorCode.EMPTY_PROGRAM, 'Program cannot be empty', {
          suggestion: 'Add at least one instruction to your program.',
        })
      );
    }

    if (errors.length > 0) {
      return { success: false, errors, warnings };
    }

    return { success: true, data: document, errors: [], warnings };
  } catch (error) {
    if (error instanceof Error) {
      errors.push(
        createError(ErrorCode.INVALID_YAML, error.message, {
          suggestion: 'Check your YAML syntax for errors.',
        })
      );
    } else {
      errors.push(createError(ErrorCode.INVALID_YAML, 'Unknown parsing error occurred'));
    }
    return { success: false, errors, warnings };
  }
}

/**
 * Validate version string
 */
export function isValidVersion(version: string): boolean {
  return /^\d+\.\d+(\.\d+)?$/.test(version);
}
