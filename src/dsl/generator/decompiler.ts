/**
 * Decompiler - converts VM JSON instructions back to DSL format
 */

import type { InstructionCall } from '@/types/vm';
import { stringify } from 'yaml';
import type { DSLDocument, DSLInstruction } from '../types/ast';

/**
 * Options for decompilation
 */
export interface DecompileOptions {
  /**
   * Name for the generated DSL document
   */
  name?: string;

  /**
   * Description for the generated DSL document
   */
  description?: string;

  /**
   * Version string (default: "1.0")
   */
  version?: string;
}

/**
 * Decompile a single VM instruction to DSL format
 */
function decompileInstruction(instruction: InstructionCall): DSLInstruction {
  const { name, args } = instruction;

  switch (name) {
    case 'filter-events':
      return {
        'filter-events': {
          events: args.eventNames as string[],
        },
      };

    case 'set':
      return {
        set: {
          variable: args.variable as string,
          value: args.value,
        },
      };

    case 'debug':
      return {
        debug: {
          variables: args.variablesToDebug as string[],
        },
      };

    case 'condition': {
      // Extract condition expressions
      const andConditions = args.AND as
        | { variable: string; condition: string; compareTo: string }[]
        | undefined;
      const orConditions = args.OR as
        | { variable: string; condition: string; compareTo: string }[]
        | undefined;

      // Parse goto references
      const parseGoto = (goto: string): string => {
        const match = goto.match(/goto_(\d+)/);
        return match ? `branch_${match[1]}` : goto;
      };

      // Extract branches
      const branches: Record<string, DSLInstruction[]> = {};
      for (const [key, value] of Object.entries(args)) {
        if (key.startsWith('branch_') && Array.isArray(value)) {
          branches[key] = (value as InstructionCall[]).map(decompileInstruction);
        }
      }

      return {
        condition: {
          when: {
            ...(andConditions && {
              all: andConditions.map((c) => ({
                variable: c.variable,
                operator: c.condition as '>' | '>=' | '<' | '<=' | '=' | '!=',
                compareTo: c.compareTo,
              })),
            }),
            ...(orConditions && {
              any: orConditions.map((c) => ({
                variable: c.variable,
                operator: c.condition as '>' | '>=' | '<' | '<=' | '=' | '!=',
                compareTo: c.compareTo,
              })),
            }),
          },
          // biome-ignore lint/suspicious/noThenProperty: DSL condition branch, not Promise
          then: parseGoto(args.onTrue as string),
          else: parseGoto(args.onFalse as string),
          branches,
        },
      };
    }

    case 'transform-string':
      return {
        'transform-string': {
          from: args.variable as string,
          transform: args.transform as
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
            | 'split',
          to: args.output as string,
          ...(args.split && { delimiter: args.split as string }),
        },
      };

    case 'transform-number':
      return {
        'transform-number': {
          left: args.variableLeft as string,
          ...(args.variableRight && { right: args.variableRight as string }),
          transform: args.transform as
            | 'add'
            | 'subtract'
            | 'multiply'
            | 'divide'
            | 'pow'
            | 'bigint',
          to: args.output as string,
        },
      };

    case 'transform-object':
      return {
        'transform-object': {
          from: args.variable as string,
          transform: args.transform as 'keys' | 'values' | 'delete' | 'value',
          ...(args.key && { key: args.key as string }),
          to: args.output as string,
        },
      };

    case 'transform-array':
      return {
        'transform-array': {
          from: args.variable as string,
          transform: args.transform as 'length' | 'at' | 'pop' | 'shift',
          ...(args.position !== undefined && { position: args.position as number }),
          to: args.output as string,
        },
      };

    case 'transform-template':
      return {
        'transform-template': {
          context: args.context as string[],
          template: args.template as string,
          to: args.output as string,
        },
      };

    case 'webhook':
      return {
        webhook: {
          url: args.url as string,
          body: args.bodyInput as string,
          ...(args.authorizationKey && { auth: args.authorizationKey as string }),
        },
      };

    case 'bullmq-producer':
      return {
        bullmq: {
          queue: args.queueName as string,
          body: args.bodyInput as string,
        },
      };

    case 'elasticsearch':
      return {
        elasticsearch: {
          url: args.url as string,
          username: args.username as string,
          password: args.password as string,
          index: args.indexName as string,
          body: args.bodyInput as string,
        },
      };

    case 'spreadsheet':
      return {
        spreadsheet: {
          auth: args.auth as string,
          spreadsheetId: args.spreadsheetId as string,
          range: args.range as string,
          body: args.inputBody as string,
        },
      };

    default:
      throw new Error(`Unknown instruction: ${name}`);
  }
}

/**
 * Decompile an array of VM instructions to a DSL document
 */
export function decompile(
  instructions: InstructionCall[],
  options: DecompileOptions = {}
): DSLDocument {
  const { name, description, version = '1.0' } = options;

  return {
    version,
    ...(name && { name }),
    ...(description && { description }),
    program: instructions.map(decompileInstruction),
  };
}

/**
 * Decompile instructions and return as YAML string
 */
export function decompileToYAML(
  instructions: InstructionCall[],
  options: DecompileOptions = {}
): string {
  const document = decompile(instructions, options);
  return stringify(document, {
    indent: 2,
    lineWidth: 120,
    defaultStringType: 'QUOTE_DOUBLE',
    defaultKeyType: 'PLAIN',
  });
}

/**
 * Decompile from base64-encoded JSON to YAML
 */
export function decompileFromBase64(encoded: string, options: DecompileOptions = {}): string {
  const json = Buffer.from(encoded, 'base64').toString('utf-8');
  const instructions = JSON.parse(json) as InstructionCall[];
  return decompileToYAML(instructions, options);
}
