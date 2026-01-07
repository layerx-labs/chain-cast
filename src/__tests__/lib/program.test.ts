import { describe, expect, it, beforeEach } from 'bun:test';
import { ChainCastProgram } from '@/lib/program';
import type { Instruction, InstructionArgs, InstructionMap, VirtualMachine } from '@/types/vm';
import { z } from 'zod';

// Define schemas outside classes to ensure they're initialized before class instantiation
const mockSchema = z.object({
  value: z.string(),
});

const debugSchema = z.object({
  variablesToDebug: z.array(z.string()),
});

const setSchema = z.object({
  variable: z.string().min(2),
  value: z.any(),
});

// Mock instruction for testing
class MockInstruction implements Instruction {
  INSTRUCTION_NAME: string;

  constructor() {
    this.INSTRUCTION_NAME = 'mock';
  }

  name(): string {
    return this.INSTRUCTION_NAME;
  }

  getArgsSchema() {
    return mockSchema;
  }

  validateArgs(args: InstructionArgs | undefined): boolean {
    return mockSchema.safeParse(args).success;
  }

  onAction(_vm: VirtualMachine): void {
    // No-op for testing
  }
}

// Mock debug instruction
class MockDebugInstruction implements Instruction {
  INSTRUCTION_NAME: string;

  constructor() {
    this.INSTRUCTION_NAME = 'debug';
  }

  name(): string {
    return this.INSTRUCTION_NAME;
  }

  getArgsSchema() {
    return debugSchema;
  }

  validateArgs(args: InstructionArgs | undefined): boolean {
    return debugSchema.safeParse(args).success;
  }

  onAction(_vm: VirtualMachine): void {
    // No-op for testing
  }
}

// Mock set instruction
class MockSetInstruction implements Instruction {
  INSTRUCTION_NAME: string;

  constructor() {
    this.INSTRUCTION_NAME = 'set';
  }

  name(): string {
    return this.INSTRUCTION_NAME;
  }

  getArgsSchema() {
    return setSchema;
  }

  validateArgs(args: InstructionArgs | undefined): boolean {
    return setSchema.safeParse(args).success;
  }

  onAction(_vm: VirtualMachine): void {
    // No-op for testing
  }
}

describe('ChainCastProgram', () => {
  let program: ChainCastProgram;
  let supportedInstructions: InstructionMap;

  beforeEach(() => {
    supportedInstructions = {
      mock: MockInstruction,
      debug: MockDebugInstruction,
      set: MockSetInstruction,
    };
    program = new ChainCastProgram(supportedInstructions);
  });

  describe('constructor', () => {
    it('should create program with supported instructions', () => {
      expect(program.getInstructionsCallLen()).toBe(0);
      expect(program.getInstructionCalls()).toEqual([]);
    });
  });

  describe('load', () => {
    it('should load a valid program', () => {
      const instructions = [{ name: 'debug', args: { variablesToDebug: ['event'] } }];
      const encoded = btoa(JSON.stringify(instructions));

      program.load(encoded);

      expect(program.getInstructionsCallLen()).toBe(1);
      expect(program.getInstructionCall(0).name).toBe('debug');
    });

    it('should load a program with multiple instructions', () => {
      const instructions = [
        { name: 'debug', args: { variablesToDebug: ['event'] } },
        { name: 'set', args: { variable: 'processed', value: true } },
      ];
      const encoded = btoa(JSON.stringify(instructions));

      program.load(encoded);

      expect(program.getInstructionsCallLen()).toBe(2);
      expect(program.getInstructionCall(0).name).toBe('debug');
      expect(program.getInstructionCall(1).name).toBe('set');
    });

    it('should throw error for invalid base64', () => {
      expect(() => {
        program.load('not-valid-base64!!!');
      }).toThrow();
    });

    it('should throw error for invalid JSON', () => {
      const invalidJson = btoa('{invalid json}');
      expect(() => {
        program.load(invalidJson);
      }).toThrow();
    });

    it('should throw error for unknown instruction', () => {
      const instructions = [{ name: 'unknown-instruction', args: {} }];
      const encoded = btoa(JSON.stringify(instructions));

      expect(() => {
        program.load(encoded);
      }).toThrow();
    });

    it('should throw UserInputError for invalid args', () => {
      const instructions = [{ name: 'debug', args: { invalidArg: true } }];
      const encoded = btoa(JSON.stringify(instructions));

      expect(() => {
        program.load(encoded);
      }).toThrow('Failed to load program');
    });

    it('should throw error for set instruction with short variable name', () => {
      const instructions = [{ name: 'set', args: { variable: 'x', value: 1 } }];
      const encoded = btoa(JSON.stringify(instructions));

      expect(() => {
        program.load(encoded);
      }).toThrow('Failed to load program');
    });
  });

  describe('compile', () => {
    it('should return true for valid program', () => {
      const instructions = [{ name: 'debug', args: { variablesToDebug: ['event'] } }];
      const encoded = btoa(JSON.stringify(instructions));

      expect(program.compile(encoded)).toBe(true);
    });

    it('should return false for invalid args', () => {
      const instructions = [{ name: 'debug', args: { invalidArg: true } }];
      const encoded = btoa(JSON.stringify(instructions));

      expect(program.compile(encoded)).toBe(false);
    });

    it('should not modify program state when compiling', () => {
      const instructions = [{ name: 'debug', args: { variablesToDebug: ['event'] } }];
      const encoded = btoa(JSON.stringify(instructions));

      program.compile(encoded);

      expect(program.getInstructionsCallLen()).toBe(0);
    });

    it('should throw error for unknown instruction during compile', () => {
      const instructions = [{ name: 'unknown', args: {} }];
      const encoded = btoa(JSON.stringify(instructions));

      expect(() => {
        program.compile(encoded);
      }).toThrow();
    });
  });

  describe('getInstructionCalls', () => {
    it('should return empty array for new program', () => {
      expect(program.getInstructionCalls()).toEqual([]);
    });

    it('should return all loaded instruction calls', () => {
      const instructions = [
        { name: 'debug', args: { variablesToDebug: ['event'] } },
        { name: 'set', args: { variable: 'test', value: 123 } },
      ];
      const encoded = btoa(JSON.stringify(instructions));

      program.load(encoded);

      const calls = program.getInstructionCalls();
      expect(calls).toHaveLength(2);
      expect(calls[0].name).toBe('debug');
      expect(calls[1].name).toBe('set');
    });
  });

  describe('getInstructionCall', () => {
    it('should return instruction at specific index', () => {
      const instructions = [
        { name: 'debug', args: { variablesToDebug: ['event'] } },
        { name: 'set', args: { variable: 'test', value: 123 } },
      ];
      const encoded = btoa(JSON.stringify(instructions));

      program.load(encoded);

      expect(program.getInstructionCall(0).name).toBe('debug');
      expect(program.getInstructionCall(1).name).toBe('set');
    });

    it('should return undefined for out of bounds index', () => {
      const instructions = [{ name: 'debug', args: { variablesToDebug: ['event'] } }];
      const encoded = btoa(JSON.stringify(instructions));

      program.load(encoded);

      expect(program.getInstructionCall(5)).toBeUndefined();
    });
  });

  describe('getInstructionsCallLen', () => {
    it('should return 0 for new program', () => {
      expect(program.getInstructionsCallLen()).toBe(0);
    });

    it('should return correct count after loading', () => {
      const instructions = [
        { name: 'debug', args: { variablesToDebug: ['event'] } },
        { name: 'set', args: { variable: 'test', value: 123 } },
        { name: 'debug', args: { variablesToDebug: ['test'] } },
      ];
      const encoded = btoa(JSON.stringify(instructions));

      program.load(encoded);

      expect(program.getInstructionsCallLen()).toBe(3);
    });
  });

  describe('empty program', () => {
    it('should load empty program array', () => {
      const encoded = btoa(JSON.stringify([]));

      program.load(encoded);

      expect(program.getInstructionsCallLen()).toBe(0);
    });

    it('should compile empty program as valid', () => {
      const encoded = btoa(JSON.stringify([]));

      expect(program.compile(encoded)).toBe(true);
    });
  });
});
