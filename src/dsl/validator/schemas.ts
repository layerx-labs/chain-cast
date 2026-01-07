/**
 * Zod schemas for DSL validation
 */

import { z } from 'zod';

// Condition operators
const conditionOperatorSchema = z.enum(['>', '>=', '<', '<=', '=', '!=']);

// Condition expression
const conditionExpressionSchema = z.object({
  variable: z.string().min(1, 'Variable name is required'),
  operator: conditionOperatorSchema,
  compareTo: z.union([z.string(), z.number()]),
});

// ============================================
// Instruction Schemas
// ============================================

/**
 * filter-events instruction
 */
export const filterEventsSchema = z.object({
  'filter-events': z.object({
    events: z.array(z.string().min(1)).min(1, 'At least one event name is required'),
  }),
});

/**
 * set instruction
 */
export const setSchema = z.object({
  set: z.object({
    variable: z.string().min(2, 'Variable name must be at least 2 characters'),
    value: z.unknown(),
  }),
});

/**
 * debug instruction
 */
export const debugSchema = z.object({
  debug: z.object({
    variables: z.array(z.string().min(1)).min(1, 'At least one variable is required'),
  }),
});

/**
 * transform-string instruction
 */
export const transformStringSchema = z.object({
  'transform-string': z.object({
    from: z.string().min(2, 'Source variable must be at least 2 characters'),
    transform: z.enum([
      'capitalize',
      'lowercase',
      'trim',
      'uppercase',
      'camelize',
      'underscore',
      'dasherize',
      'bigint',
      'int',
      'number',
      'split',
    ]),
    to: z.string().min(2, 'Output variable must be at least 2 characters'),
    delimiter: z.string().optional(),
  }),
});

/**
 * transform-number instruction
 */
export const transformNumberSchema = z.object({
  'transform-number': z.object({
    left: z.string().min(2, 'Left operand variable must be at least 2 characters'),
    right: z.string().min(2).optional(),
    transform: z.enum(['add', 'subtract', 'multiply', 'divide', 'pow', 'bigint']),
    to: z.string().min(2, 'Output variable must be at least 2 characters'),
  }),
});

/**
 * transform-object instruction
 */
export const transformObjectSchema = z.object({
  'transform-object': z.object({
    from: z.string().min(2, 'Source variable must be at least 2 characters'),
    transform: z.enum(['keys', 'values', 'delete', 'value']),
    key: z.string().min(2).optional(),
    to: z.string().min(2, 'Output variable must be at least 2 characters'),
  }),
});

/**
 * transform-array instruction
 */
export const transformArraySchema = z.object({
  'transform-array': z.object({
    from: z.string().min(2, 'Source variable must be at least 2 characters'),
    transform: z.enum(['length', 'at', 'pop', 'shift']),
    position: z.number().int().optional(),
    to: z.string().min(2, 'Output variable must be at least 2 characters'),
  }),
});

/**
 * transform-template instruction
 */
export const transformTemplateSchema = z.object({
  'transform-template': z.object({
    context: z.array(z.string().min(2)).min(1, 'At least one context variable is required'),
    template: z.string().min(2, 'Template must be at least 2 characters'),
    to: z.string().min(2, 'Output variable must be at least 2 characters'),
  }),
});

/**
 * webhook instruction
 */
export const webhookSchema = z.object({
  webhook: z.object({
    url: z.string().min(1, 'URL is required'),
    body: z.string().min(2, 'Body variable must be at least 2 characters'),
    auth: z.string().optional(),
  }),
});

/**
 * bullmq instruction
 */
export const bullmqSchema = z.object({
  bullmq: z.object({
    queue: z.string().min(2, 'Queue name must be at least 2 characters'),
    body: z.string().min(2, 'Body variable must be at least 2 characters'),
  }),
});

/**
 * elasticsearch instruction
 */
export const elasticsearchSchema = z.object({
  elasticsearch: z.object({
    url: z.string().min(2, 'URL variable must be at least 2 characters'),
    username: z.string().min(2, 'Username variable must be at least 2 characters'),
    password: z.string().min(2, 'Password variable must be at least 2 characters'),
    index: z
      .string()
      .min(1, 'Index name is required')
      .regex(
        /^[a-z0-9_-]+$/,
        'Index name must be lowercase alphanumeric with hyphens or underscores'
      ),
    body: z.string().min(3, 'Body variable must be at least 3 characters'),
  }),
});

/**
 * spreadsheet instruction
 */
export const spreadsheetSchema = z.object({
  spreadsheet: z.object({
    auth: z.string().min(2, 'Auth variable must be at least 2 characters'),
    spreadsheetId: z.string().min(2, 'Spreadsheet ID must be at least 2 characters'),
    range: z.string().min(2, 'Range must be at least 2 characters'),
    body: z.string().min(2, 'Body variable must be at least 2 characters'),
  }),
});

// Forward declaration for recursive type
// biome-ignore lint/suspicious/noExplicitAny: Recursive schema requires lazy evaluation
type LazyConditionSchema = z.ZodLazy<z.ZodObject<any>>;

/**
 * Condition instruction (with recursive nested instructions)
 */
export const conditionSchema: LazyConditionSchema = z.lazy(() =>
  z.object({
    condition: z.object({
      when: z
        .object({
          all: z.array(conditionExpressionSchema).optional(),
          any: z.array(conditionExpressionSchema).optional(),
        })
        .refine(
          (data) => data.all !== undefined || data.any !== undefined,
          'Either "all" or "any" conditions must be specified'
        ),
      then: z.string().min(1, 'Then branch reference is required'),
      else: z.string().min(1, 'Else branch reference is required'),
      branches: z.record(z.string(), z.array(instructionSchema)),
    }),
  })
);

/**
 * Union of all instruction schemas
 */
export const instructionSchema = z.union([
  filterEventsSchema,
  setSchema,
  debugSchema,
  conditionSchema,
  transformStringSchema,
  transformNumberSchema,
  transformObjectSchema,
  transformArraySchema,
  transformTemplateSchema,
  webhookSchema,
  bullmqSchema,
  elasticsearchSchema,
  spreadsheetSchema,
]);

/**
 * Complete DSL document schema
 */
export const dslDocumentSchema = z.object({
  version: z.string().regex(/^\d+\.\d+(\.\d+)?$/, 'Version must be in format X.Y or X.Y.Z'),
  name: z.string().optional(),
  description: z.string().optional(),
  program: z.array(instructionSchema).min(1, 'Program must have at least one instruction'),
});

/**
 * Instruction type enum for lookup
 */
export const instructionTypes = [
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
] as const;

export type InstructionType = (typeof instructionTypes)[number];

/**
 * Map of instruction names to their schemas
 */
export const instructionSchemaMap: Record<InstructionType, z.ZodSchema> = {
  'filter-events': filterEventsSchema,
  set: setSchema,
  debug: debugSchema,
  condition: conditionSchema,
  'transform-string': transformStringSchema,
  'transform-number': transformNumberSchema,
  'transform-object': transformObjectSchema,
  'transform-array': transformArraySchema,
  'transform-template': transformTemplateSchema,
  webhook: webhookSchema,
  bullmq: bullmqSchema,
  elasticsearch: elasticsearchSchema,
  spreadsheet: spreadsheetSchema,
};

/**
 * Get the instruction type from an object
 */
export function getInstructionType(obj: unknown): InstructionType | null {
  if (typeof obj !== 'object' || obj === null) return null;
  const keys = Object.keys(obj);
  for (const key of keys) {
    if (instructionTypes.includes(key as InstructionType)) {
      return key as InstructionType;
    }
  }
  return null;
}
