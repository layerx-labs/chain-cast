import type { InstructionCall } from '@/types/vm';

/**
 * Simple debug program - logs event data
 */
export const debugProgram: InstructionCall[] = [
  {
    name: 'debug',
    args: { variablesToDebug: ['event'] },
  },
];

/**
 * Set variable program
 */
export const setProgram: InstructionCall[] = [
  {
    name: 'set',
    args: { variable: 'processed', value: true },
  },
];

/**
 * Filter and debug program
 */
export const filterDebugProgram: InstructionCall[] = [
  {
    name: 'filter-events',
    args: { eventNames: ['Transfer'] },
  },
  {
    name: 'debug',
    args: { variablesToDebug: ['event'] },
  },
];

/**
 * Webhook notification program
 */
export const webhookProgram: InstructionCall[] = [
  {
    name: 'webhook',
    args: {
      url: 'https://example.com/webhook',
      bodyInput: 'event',
    },
  },
];

/**
 * Transform string program
 */
export const transformStringProgram: InstructionCall[] = [
  {
    name: 'transform-string',
    args: {
      variable: 'event.event',
      transform: 'lowercase',
      output: 'eventName',
    },
  },
];

/**
 * Transform number program
 */
export const transformNumberProgram: InstructionCall[] = [
  {
    name: 'set',
    args: { variable: 'amount', value: 100 },
  },
  {
    name: 'set',
    args: { variable: 'fee', value: 5 },
  },
  {
    name: 'transform-number',
    args: {
      variableLeft: 'amount',
      variableRight: 'fee',
      transform: 'subtract',
      output: 'netAmount',
    },
  },
];

/**
 * Condition program with branches
 */
export const conditionProgram: InstructionCall[] = [
  {
    name: 'set',
    args: { variable: 'value', value: 100 },
  },
  {
    name: 'condition',
    args: {
      AND: [{ variable: 'value', condition: '>', compareTo: 50 }],
      onTrue: 'goto_0',
      onFalse: 'goto_1',
      branch_0: [{ name: 'set', args: { variable: 'result', value: 'high' } }],
      branch_1: [{ name: 'set', args: { variable: 'result', value: 'low' } }],
    },
  },
];

/**
 * BullMQ producer program
 */
export const bullmqProgram: InstructionCall[] = [
  {
    name: 'bullmq-producer',
    args: {
      bodyInput: 'event',
      queueName: 'events-queue',
    },
  },
];

/**
 * Elasticsearch indexing program
 */
export const elasticsearchProgram: InstructionCall[] = [
  {
    name: 'elasticsearch',
    args: {
      bodyInput: 'event',
      indexName: 'blockchain-events',
      url: 'http://localhost:9200',
      username: 'elastic',
      password: 'changeme',
    },
  },
];

/**
 * Template transform program
 */
export const templateProgram: InstructionCall[] = [
  {
    name: 'transform-template',
    args: {
      context: ['event'],
      template: 'Transfer from {{event.returnValues.from}} to {{event.returnValues.to}}',
      output: 'message',
    },
  },
];

/**
 * Complex multi-step program
 */
export const complexProgram: InstructionCall[] = [
  {
    name: 'filter-events',
    args: { eventNames: ['Transfer', 'Approval'] },
  },
  {
    name: 'set',
    args: { variable: 'timestamp', value: Date.now() },
  },
  {
    name: 'transform-string',
    args: {
      variable: 'event.address',
      transform: 'lowercase',
      output: 'normalizedAddress',
    },
  },
  {
    name: 'debug',
    args: { variablesToDebug: ['event', 'normalizedAddress', 'timestamp'] },
  },
  {
    name: 'webhook',
    args: {
      url: 'https://example.com/events',
      bodyInput: 'event',
    },
  },
];

/**
 * Program that will cause a halt (filter non-matching event)
 */
export const haltingProgram: InstructionCall[] = [
  {
    name: 'filter-events',
    args: { eventNames: ['NonExistentEvent'] },
  },
  {
    name: 'debug',
    args: { variablesToDebug: ['event'] },
  },
];

/**
 * Encodes a program to base64 string
 */
export function encodeProgram(instructions: InstructionCall[]): string {
  return btoa(JSON.stringify(instructions));
}

/**
 * Decodes a base64 program string
 */
export function decodeProgram(encoded: string): InstructionCall[] {
  return JSON.parse(atob(encoded));
}

/**
 * Pre-encoded program strings for testing
 */
export const encodedPrograms = {
  debug: encodeProgram(debugProgram),
  set: encodeProgram(setProgram),
  filterDebug: encodeProgram(filterDebugProgram),
  webhook: encodeProgram(webhookProgram),
  transformString: encodeProgram(transformStringProgram),
  transformNumber: encodeProgram(transformNumberProgram),
  condition: encodeProgram(conditionProgram),
  bullmq: encodeProgram(bullmqProgram),
  elasticsearch: encodeProgram(elasticsearchProgram),
  template: encodeProgram(templateProgram),
  complex: encodeProgram(complexProgram),
  halting: encodeProgram(haltingProgram),
};

/**
 * Invalid program for error testing
 */
export const invalidPrograms = {
  invalidJson: 'not-valid-base64!!!',
  unknownInstruction: encodeProgram([{ name: 'unknown-instruction', args: {} }]),
  invalidArgs: encodeProgram([{ name: 'debug', args: { invalidArg: true } }]),
  emptyProgram: encodeProgram([]),
};
