/**
 * JSON Generator - generates VM-compatible JSON from validated DSL
 */

import type { InstructionCall } from '@/types/vm';
import { transformInstructions } from '../transformers';
import type { DSLDocument } from '../types/ast';

/**
 * Options for JSON generation
 */
export interface GeneratorOptions {
  /**
   * Whether to minify the output JSON
   */
  minify?: boolean;

  /**
   * Whether to output as base64 (for direct use in ChainCast)
   */
  base64?: boolean;
}

/**
 * Result of JSON generation
 */
export interface GeneratorResult {
  /**
   * The generated instructions array
   */
  instructions: InstructionCall[];

  /**
   * JSON string representation
   */
  json: string;

  /**
   * Base64-encoded representation (if requested)
   */
  base64?: string;
}

/**
 * Generate VM-compatible JSON from a validated DSL document
 */
export function generateJSON(
  document: DSLDocument,
  options: GeneratorOptions = {}
): GeneratorResult {
  const { minify = false, base64: encodeBase64 = false } = options;

  // Transform all instructions
  const instructions = transformInstructions(document.program);

  // Generate JSON string
  const json = minify ? JSON.stringify(instructions) : JSON.stringify(instructions, null, 2);

  // Generate base64 if requested
  const base64 = encodeBase64 ? Buffer.from(json).toString('base64') : undefined;

  return {
    instructions,
    json,
    base64,
  };
}

/**
 * Decode base64-encoded program back to JSON
 */
export function decodeBase64Program(encoded: string): InstructionCall[] {
  const json = Buffer.from(encoded, 'base64').toString('utf-8');
  return JSON.parse(json) as InstructionCall[];
}
