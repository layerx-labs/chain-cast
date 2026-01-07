/**
 * ChainCast DSL Compiler
 *
 * Compiles YAML-based DSL to VM-compatible JSON instruction arrays.
 */

import { ZodError } from 'zod';
import { type GeneratorOptions, type GeneratorResult, generateJSON } from './generator';
import { parseYAML } from './parser';
import type { DSLDocument } from './types/ast';
import {
  type CompilationResult,
  type CompilerError,
  type CompilerWarning,
  ErrorCode,
  createError,
  formatError,
} from './types/errors';
import { dslDocumentSchema, getInstructionType, instructionTypes } from './validator/schemas';

/**
 * Options for the compiler
 */
export interface CompilerOptions extends GeneratorOptions {
  /**
   * Whether to throw on first error (default: false)
   */
  throwOnError?: boolean;

  /**
   * Whether to include warnings in output (default: true)
   */
  includeWarnings?: boolean;
}

/**
 * Full compilation result
 */
export interface FullCompilationResult extends CompilationResult<GeneratorResult> {
  /**
   * The parsed DSL document (available if parsing succeeded)
   */
  document?: DSLDocument;
}

/**
 * Find the closest matching instruction name for typos
 */
function findClosestInstruction(name: string): string | null {
  const distances: [string, number][] = instructionTypes.map((type) => [
    type,
    levenshteinDistance(name.toLowerCase(), type.toLowerCase()),
  ]);
  distances.sort((a, b) => a[1] - b[1]);

  // Only suggest if distance is small enough
  if (distances[0][1] <= 3) {
    return distances[0][0];
  }
  return null;
}

/**
 * Simple Levenshtein distance for typo detection
 */
function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

/**
 * Convert Zod error to compiler errors
 */
function zodErrorToCompilerErrors(error: ZodError): CompilerError[] {
  return error.errors.map((issue) => {
    const path = issue.path.join('.');
    let suggestion: string | undefined;

    // Try to provide helpful suggestions for common errors
    if (issue.code === 'invalid_union' && path.includes('program')) {
      // Check if it's an unknown instruction
      const instructionMatch = path.match(/program\.(\d+)/);
      if (instructionMatch) {
        suggestion = `Check that the instruction at index ${instructionMatch[1]} is valid. Valid instructions: ${instructionTypes.join(', ')}`;
      }
    }

    return createError(ErrorCode.INVALID_FIELD_TYPE, `${path}: ${issue.message}`, { suggestion });
  });
}

/**
 * Validate instruction names and provide helpful errors for typos
 */
function validateInstructionNames(document: DSLDocument): CompilerError[] {
  const errors: CompilerError[] = [];

  function validateInstruction(instruction: unknown, index: number): void {
    if (typeof instruction !== 'object' || instruction === null) {
      errors.push(
        createError(ErrorCode.INVALID_SYNTAX, `Instruction at index ${index} is not a valid object`)
      );
      return;
    }

    const keys = Object.keys(instruction);
    const instructionKey = keys.find((k) => !k.startsWith('_'));

    if (!instructionKey) {
      errors.push(
        createError(
          ErrorCode.INVALID_SYNTAX,
          `Instruction at index ${index} has no instruction type`
        )
      );
      return;
    }

    if (!getInstructionType(instruction)) {
      const closest = findClosestInstruction(instructionKey);
      errors.push(
        createError(ErrorCode.UNKNOWN_INSTRUCTION, `Unknown instruction: '${instructionKey}'`, {
          suggestion: closest
            ? `Did you mean '${closest}'?`
            : `Valid instructions: ${instructionTypes.join(', ')}`,
        })
      );
    }
  }

  for (let i = 0; i < document.program.length; i++) {
    validateInstruction(document.program[i], i);
  }

  return errors;
}

/**
 * ChainCast DSL Compiler class
 */
export class ChainCastDSLCompiler {
  private options: CompilerOptions;

  constructor(options: CompilerOptions = {}) {
    this.options = {
      throwOnError: false,
      includeWarnings: true,
      ...options,
    };
  }

  /**
   * Compile DSL source string to VM JSON
   */
  compile(source: string): FullCompilationResult {
    const errors: CompilerError[] = [];
    const warnings: CompilerWarning[] = [];

    // Phase 1: Parse YAML
    const parseResult = parseYAML(source);
    if (!parseResult.success || !parseResult.data) {
      return {
        success: false,
        errors: parseResult.errors,
        warnings: parseResult.warnings,
      };
    }

    const document = parseResult.data;

    // Phase 2: Validate instruction names (helpful errors for typos)
    const nameErrors = validateInstructionNames(document);
    if (nameErrors.length > 0) {
      errors.push(...nameErrors);
      if (this.options.throwOnError) {
        throw new Error(nameErrors.map(formatError).join('\n'));
      }
      return { success: false, errors, warnings, document };
    }

    // Phase 3: Schema validation
    try {
      dslDocumentSchema.parse(document);
    } catch (error) {
      if (error instanceof ZodError) {
        const zodErrors = zodErrorToCompilerErrors(error);
        errors.push(...zodErrors);
        if (this.options.throwOnError) {
          throw new Error(zodErrors.map(formatError).join('\n'));
        }
        return { success: false, errors, warnings, document };
      }
      throw error;
    }

    // Phase 4: Generate JSON
    try {
      const result = generateJSON(document, {
        minify: this.options.minify,
        base64: this.options.base64,
      });

      return {
        success: true,
        data: result,
        errors: [],
        warnings,
        document,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown generation error';
      errors.push(createError(ErrorCode.INVALID_SYNTAX, message));

      if (this.options.throwOnError) {
        throw error;
      }

      return { success: false, errors, warnings, document };
    }
  }

  /**
   * Validate DSL source without generating output
   */
  validate(source: string): CompilationResult<DSLDocument> {
    const parseResult = parseYAML(source);
    if (!parseResult.success || !parseResult.data) {
      return {
        success: false,
        errors: parseResult.errors,
        warnings: parseResult.warnings,
      };
    }

    const document = parseResult.data;

    // Validate instruction names
    const nameErrors = validateInstructionNames(document);
    if (nameErrors.length > 0) {
      return { success: false, errors: nameErrors, warnings: [] };
    }

    // Schema validation
    try {
      dslDocumentSchema.parse(document);
      return { success: true, data: document, errors: [], warnings: [] };
    } catch (error) {
      if (error instanceof ZodError) {
        return {
          success: false,
          errors: zodErrorToCompilerErrors(error),
          warnings: [],
        };
      }
      throw error;
    }
  }
}

/**
 * Create a new compiler instance
 */
export function createCompiler(options?: CompilerOptions): ChainCastDSLCompiler {
  return new ChainCastDSLCompiler(options);
}

/**
 * Convenience function to compile DSL source
 */
export function compile(source: string, options?: CompilerOptions): FullCompilationResult {
  return createCompiler(options).compile(source);
}

/**
 * Convenience function to validate DSL source
 */
export function validate(source: string): CompilationResult<DSLDocument> {
  return createCompiler().validate(source);
}
