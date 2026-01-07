/**
 * Instruction transformers - convert DSL instructions to VM JSON format
 */

import type { InstructionCall } from '@/types/vm';
import type { DSLInstruction } from '../types/ast';
import type { InstructionType } from '../validator/schemas';
import { getInstructionType } from '../validator/schemas';

/**
 * Transformer function type
 */
type Transformer = (instruction: DSLInstruction) => InstructionCall;

/**
 * Transform filter-events instruction
 */
function transformFilterEvents(instruction: DSLInstruction): InstructionCall {
  const data = (instruction as { 'filter-events': { events: string[] } })['filter-events'];
  return {
    name: 'filter-events',
    args: {
      eventNames: data.events,
    },
  };
}

/**
 * Transform set instruction
 */
function transformSet(instruction: DSLInstruction): InstructionCall {
  const data = (instruction as { set: { variable: string; value: unknown } }).set;
  return {
    name: 'set',
    args: {
      variable: data.variable,
      value: data.value,
    },
  };
}

/**
 * Transform debug instruction
 */
function transformDebug(instruction: DSLInstruction): InstructionCall {
  const data = (instruction as { debug: { variables: string[] } }).debug;
  return {
    name: 'debug',
    args: {
      variablesToDebug: data.variables,
    },
  };
}

/**
 * Transform condition instruction (recursive for nested branches)
 */
function transformCondition(instruction: DSLInstruction): InstructionCall {
  interface ConditionData {
    when: {
      all?: { variable: string; operator: string; compareTo: string | number }[];
      any?: { variable: string; operator: string; compareTo: string | number }[];
    };
    then: string;
    else: string;
    branches: Record<string, DSLInstruction[]>;
  }

  const data = (instruction as { condition: ConditionData }).condition;

  // Transform condition expressions
  const transformExpressions = (
    expressions: { variable: string; operator: string; compareTo: string | number }[] | undefined
  ) => {
    if (!expressions) return undefined;
    return expressions.map((expr) => ({
      variable: expr.variable,
      condition: expr.operator,
      compareTo: String(expr.compareTo),
    }));
  };

  // Transform branches recursively
  const transformedBranches: Record<string, InstructionCall[]> = {};
  for (const [branchName, instructions] of Object.entries(data.branches)) {
    transformedBranches[branchName] = instructions.map(transformInstruction);
  }

  return {
    name: 'condition',
    args: {
      AND: transformExpressions(data.when.all),
      OR: transformExpressions(data.when.any),
      onTrue: `goto_${data.then.replace('branch_', '')}`,
      onFalse: `goto_${data.else.replace('branch_', '')}`,
      ...transformedBranches,
    },
  };
}

/**
 * Transform transform-string instruction
 */
function transformTransformString(instruction: DSLInstruction): InstructionCall {
  interface TransformStringData {
    from: string;
    transform: string;
    to: string;
    delimiter?: string;
  }
  const data = (instruction as { 'transform-string': TransformStringData })['transform-string'];
  return {
    name: 'transform-string',
    args: {
      variable: data.from,
      transform: data.transform,
      output: data.to,
      ...(data.delimiter && { split: data.delimiter }),
    },
  };
}

/**
 * Transform transform-number instruction
 */
function transformTransformNumber(instruction: DSLInstruction): InstructionCall {
  interface TransformNumberData {
    left: string;
    right?: string;
    transform: string;
    to: string;
  }
  const data = (instruction as { 'transform-number': TransformNumberData })['transform-number'];
  return {
    name: 'transform-number',
    args: {
      variableLeft: data.left,
      variableRight: data.right,
      transform: data.transform,
      output: data.to,
    },
  };
}

/**
 * Transform transform-object instruction
 */
function transformTransformObject(instruction: DSLInstruction): InstructionCall {
  interface TransformObjectData {
    from: string;
    transform: string;
    key?: string;
    to: string;
  }
  const data = (instruction as { 'transform-object': TransformObjectData })['transform-object'];
  return {
    name: 'transform-object',
    args: {
      variable: data.from,
      transform: data.transform,
      ...(data.key && { key: data.key }),
      output: data.to,
    },
  };
}

/**
 * Transform transform-array instruction
 */
function transformTransformArray(instruction: DSLInstruction): InstructionCall {
  interface TransformArrayData {
    from: string;
    transform: string;
    position?: number;
    to: string;
  }
  const data = (instruction as { 'transform-array': TransformArrayData })['transform-array'];
  return {
    name: 'transform-array',
    args: {
      variable: data.from,
      transform: data.transform,
      ...(data.position !== undefined && { position: data.position }),
      output: data.to,
    },
  };
}

/**
 * Transform transform-template instruction
 */
function transformTransformTemplate(instruction: DSLInstruction): InstructionCall {
  interface TransformTemplateData {
    context: string[];
    template: string;
    to: string;
  }
  const data = (instruction as { 'transform-template': TransformTemplateData })[
    'transform-template'
  ];
  return {
    name: 'transform-template',
    args: {
      context: data.context,
      template: data.template,
      output: data.to,
    },
  };
}

/**
 * Transform webhook instruction
 */
function transformWebhook(instruction: DSLInstruction): InstructionCall {
  interface WebhookData {
    url: string;
    body: string;
    auth?: string;
  }
  const data = (instruction as { webhook: WebhookData }).webhook;
  return {
    name: 'webhook',
    args: {
      url: data.url,
      bodyInput: data.body,
      ...(data.auth && { authorizationKey: data.auth }),
    },
  };
}

/**
 * Transform bullmq instruction
 */
function transformBullMQ(instruction: DSLInstruction): InstructionCall {
  interface BullMQData {
    queue: string;
    body: string;
  }
  const data = (instruction as { bullmq: BullMQData }).bullmq;
  return {
    name: 'bullmq-producer',
    args: {
      bodyInput: data.body,
      queueName: data.queue,
    },
  };
}

/**
 * Transform elasticsearch instruction
 */
function transformElasticsearch(instruction: DSLInstruction): InstructionCall {
  interface ElasticsearchData {
    url: string;
    username: string;
    password: string;
    index: string;
    body: string;
  }
  const data = (instruction as { elasticsearch: ElasticsearchData }).elasticsearch;
  return {
    name: 'elasticsearch',
    args: {
      url: data.url,
      username: data.username,
      password: data.password,
      indexName: data.index,
      bodyInput: data.body,
    },
  };
}

/**
 * Transform spreadsheet instruction
 */
function transformSpreadsheet(instruction: DSLInstruction): InstructionCall {
  interface SpreadsheetData {
    auth: string;
    spreadsheetId: string;
    range: string;
    body: string;
  }
  const data = (instruction as { spreadsheet: SpreadsheetData }).spreadsheet;
  return {
    name: 'spreadsheet',
    args: {
      auth: data.auth,
      spreadsheetId: data.spreadsheetId,
      range: data.range,
      inputBody: data.body,
    },
  };
}

/**
 * Transformer registry mapping instruction types to transform functions
 */
const transformerRegistry: Record<InstructionType, Transformer> = {
  'filter-events': transformFilterEvents,
  set: transformSet,
  debug: transformDebug,
  condition: transformCondition,
  'transform-string': transformTransformString,
  'transform-number': transformTransformNumber,
  'transform-object': transformTransformObject,
  'transform-array': transformTransformArray,
  'transform-template': transformTransformTemplate,
  webhook: transformWebhook,
  bullmq: transformBullMQ,
  elasticsearch: transformElasticsearch,
  spreadsheet: transformSpreadsheet,
};

/**
 * Transform a single DSL instruction to VM JSON format
 */
export function transformInstruction(instruction: DSLInstruction): InstructionCall {
  const instructionType = getInstructionType(instruction);
  if (!instructionType) {
    throw new Error(`Unknown instruction type: ${JSON.stringify(instruction)}`);
  }

  const transformer = transformerRegistry[instructionType];
  if (!transformer) {
    throw new Error(`No transformer found for instruction type: ${instructionType}`);
  }

  return transformer(instruction);
}

/**
 * Transform an array of DSL instructions to VM JSON format
 */
export function transformInstructions(instructions: DSLInstruction[]): InstructionCall[] {
  return instructions.map(transformInstruction);
}
