/**
 * ChainCast DSL - Domain-Specific Language for event processing pipelines
 *
 * @example
 * ```typescript
 * import { compile, validate } from '@/dsl';
 *
 * const source = `
 * version: "1.0"
 * name: "My Pipeline"
 * program:
 *   - filter-events:
 *       events: ["Transfer"]
 *   - webhook:
 *       url: "https://api.example.com"
 *       body: event
 * `;
 *
 * const result = compile(source);
 * if (result.success) {
 *   console.log(result.data.json);
 * } else {
 *   console.error(result.errors);
 * }
 * ```
 */

// Main compiler
export {
  ChainCastDSLCompiler,
  compile,
  createCompiler,
  validate,
  type CompilerOptions,
  type FullCompilationResult,
} from './compiler';

// Parser
export { parseYAML } from './parser';

// Validator
export {
  dslDocumentSchema,
  getInstructionType,
  instructionSchemaMap,
  instructionTypes,
  type InstructionType,
} from './validator';

// Generator
export {
  decodeBase64Program,
  decompile,
  decompileFromBase64,
  decompileToYAML,
  generateJSON,
  type DecompileOptions,
  type GeneratorOptions,
  type GeneratorResult,
} from './generator';

// Transformers
export { transformInstruction, transformInstructions } from './transformers';

// Types
export type {
  ArrayTransform,
  ConditionOperator,
  DSLBullMQ,
  DSLCondition,
  DSLConditionExpression,
  DSLDebug,
  DSLDocument,
  DSLElasticsearch,
  DSLFilterEvents,
  DSLInstruction,
  DSLSet,
  DSLSpreadsheet,
  DSLTransformArray,
  DSLTransformNumber,
  DSLTransformObject,
  DSLTransformString,
  DSLTransformTemplate,
  DSLWebhook,
  NumberTransform,
  ObjectTransform,
  StringTransform,
} from './types/ast';

export {
  createError,
  createWarning,
  ErrorCode,
  formatError,
  type CompilationResult,
  type CompilerError,
  type CompilerWarning,
  type SourceLocation,
} from './types/errors';
