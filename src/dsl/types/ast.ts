/**
 * AST type definitions for the ChainCast DSL
 */

import type { SourceLocation } from './errors';

/**
 * Root DSL document structure
 */
export interface DSLDocument {
  version: string;
  name?: string;
  description?: string;
  program: DSLInstruction[];
}

/**
 * Base instruction with common fields
 */
export interface DSLInstructionBase {
  _location?: SourceLocation;
}

/**
 * Filter events instruction
 */
export interface DSLFilterEvents extends DSLInstructionBase {
  'filter-events': {
    events: string[];
  };
}

/**
 * Set variable instruction
 */
export interface DSLSet extends DSLInstructionBase {
  set: {
    variable: string;
    value: unknown;
  };
}

/**
 * Debug instruction
 */
export interface DSLDebug extends DSLInstructionBase {
  debug: {
    variables: string[];
  };
}

/**
 * Condition comparison operators
 */
export type ConditionOperator = '>' | '>=' | '<' | '<=' | '=' | '!=';

/**
 * Single condition expression
 */
export interface DSLConditionExpression {
  variable: string;
  operator: ConditionOperator;
  compareTo: string | number;
}

/**
 * Condition instruction
 */
export interface DSLCondition extends DSLInstructionBase {
  condition: {
    when: {
      all?: DSLConditionExpression[];
      any?: DSLConditionExpression[];
    };
    then: string;
    else: string;
    branches: {
      [key: string]: DSLInstruction[];
    };
  };
}

/**
 * String transform operations
 */
export type StringTransform =
  | 'capitalize'
  | 'lowercase'
  | 'trim'
  | 'uppercase'
  | 'camelize'
  | 'underscore'
  | 'dasherize'
  | 'bigint'
  | 'int'
  | 'number'
  | 'split';

/**
 * Transform string instruction
 */
export interface DSLTransformString extends DSLInstructionBase {
  'transform-string': {
    from: string;
    transform: StringTransform;
    to: string;
    delimiter?: string;
  };
}

/**
 * Number transform operations
 */
export type NumberTransform = 'add' | 'subtract' | 'multiply' | 'divide' | 'pow' | 'bigint';

/**
 * Transform number instruction
 */
export interface DSLTransformNumber extends DSLInstructionBase {
  'transform-number': {
    left: string;
    right?: string;
    transform: NumberTransform;
    to: string;
  };
}

/**
 * Object transform operations
 */
export type ObjectTransform = 'keys' | 'values' | 'delete' | 'value';

/**
 * Transform object instruction
 */
export interface DSLTransformObject extends DSLInstructionBase {
  'transform-object': {
    from: string;
    transform: ObjectTransform;
    key?: string;
    to: string;
  };
}

/**
 * Array transform operations
 */
export type ArrayTransform = 'length' | 'at' | 'pop' | 'shift';

/**
 * Transform array instruction
 */
export interface DSLTransformArray extends DSLInstructionBase {
  'transform-array': {
    from: string;
    transform: ArrayTransform;
    position?: number;
    to: string;
  };
}

/**
 * Transform template instruction
 */
export interface DSLTransformTemplate extends DSLInstructionBase {
  'transform-template': {
    context: string[];
    template: string;
    to: string;
  };
}

/**
 * Webhook instruction
 */
export interface DSLWebhook extends DSLInstructionBase {
  webhook: {
    url: string;
    body: string;
    auth?: string;
  };
}

/**
 * BullMQ producer instruction
 */
export interface DSLBullMQ extends DSLInstructionBase {
  bullmq: {
    queue: string;
    body: string;
  };
}

/**
 * Elasticsearch instruction
 */
export interface DSLElasticsearch extends DSLInstructionBase {
  elasticsearch: {
    url: string;
    username: string;
    password: string;
    index: string;
    body: string;
  };
}

/**
 * Spreadsheet instruction
 */
export interface DSLSpreadsheet extends DSLInstructionBase {
  spreadsheet: {
    auth: string;
    spreadsheetId: string;
    range: string;
    body: string;
  };
}

/**
 * Union type for all DSL instructions
 */
export type DSLInstruction =
  | DSLFilterEvents
  | DSLSet
  | DSLDebug
  | DSLCondition
  | DSLTransformString
  | DSLTransformNumber
  | DSLTransformObject
  | DSLTransformArray
  | DSLTransformTemplate
  | DSLWebhook
  | DSLBullMQ
  | DSLElasticsearch
  | DSLSpreadsheet;

/**
 * Get the instruction type name from a DSL instruction
 */
export function getInstructionType(instruction: DSLInstruction): string {
  const keys = Object.keys(instruction).filter((k) => !k.startsWith('_'));
  return keys[0] || 'unknown';
}

/**
 * Check if an object is a valid DSL instruction
 */
export function isDSLInstruction(obj: unknown): obj is DSLInstruction {
  if (typeof obj !== 'object' || obj === null) return false;

  const keys = Object.keys(obj).filter((k) => !k.startsWith('_'));
  if (keys.length !== 1) return false;

  const validInstructions = [
    'filter-events',
    'set',
    'debug',
    'condition',
    'transform-string',
    'transform-number',
    'transform-object',
    'transform-array',
    'transform-template',
    'webhook',
    'bullmq',
    'elasticsearch',
    'spreadsheet',
  ];

  return validInstructions.includes(keys[0]);
}
