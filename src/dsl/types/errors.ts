/**
 * Error types for the ChainCast DSL compiler
 */

export enum ErrorCode {
  // Parse Errors (1xxx)
  INVALID_YAML = 1001,
  INVALID_SYNTAX = 1002,

  // Schema Errors (2xxx)
  MISSING_REQUIRED_FIELD = 2001,
  INVALID_FIELD_TYPE = 2002,
  UNKNOWN_INSTRUCTION = 2003,
  INVALID_TRANSFORM_TYPE = 2004,
  INVALID_OPERATOR = 2005,
  INVALID_VERSION = 2006,
  EMPTY_PROGRAM = 2007,

  // Semantic Errors (3xxx)
  INVALID_BRANCH_REFERENCE = 3001,
  UNDEFINED_VARIABLE = 3002,
  CIRCULAR_REFERENCE = 3003,
}

export interface SourceLocation {
  line: number;
  column: number;
  offset?: number;
}

export interface CompilerError {
  code: ErrorCode;
  message: string;
  location?: SourceLocation;
  source?: string;
  suggestion?: string;
}

export interface CompilerWarning {
  code: ErrorCode;
  message: string;
  location?: SourceLocation;
}

export interface CompilationResult<T = unknown> {
  success: boolean;
  data?: T;
  errors: CompilerError[];
  warnings: CompilerWarning[];
}

/**
 * Create a compiler error with optional suggestion
 */
export function createError(
  code: ErrorCode,
  message: string,
  options?: {
    location?: SourceLocation;
    source?: string;
    suggestion?: string;
  }
): CompilerError {
  return {
    code,
    message,
    ...options,
  };
}

/**
 * Create a compiler warning
 */
export function createWarning(
  code: ErrorCode,
  message: string,
  location?: SourceLocation
): CompilerWarning {
  return {
    code,
    message,
    location,
  };
}

/**
 * Format an error for display
 */
export function formatError(error: CompilerError): string {
  let result = '';

  if (error.location) {
    result += `Line ${error.location.line}, Column ${error.location.column}: `;
  }

  result += `[${ErrorCode[error.code]}] ${error.message}`;

  if (error.source) {
    result += `\n  > ${error.source}`;
  }

  if (error.suggestion) {
    result += `\n  Suggestion: ${error.suggestion}`;
  }

  return result;
}
