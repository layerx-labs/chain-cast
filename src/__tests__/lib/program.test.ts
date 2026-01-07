import { describe, expect, it, beforeEach } from 'bun:test';
import { ChainCastProgram } from '@/lib/program';
import type { InstructionMap } from '@/types/vm';

// Import actual instruction classes to avoid cross-platform constructor issues
import { Debug } from '@/processors/debug';
import { Set } from '@/processors/set';

// Helper function to encode instructions consistently across platforms
// Using Buffer ensures consistent encoding on both macOS and Linux
function encodeInstructions(instructions: unknown[]): string {
  return Buffer.from(JSON.stringify(instructions)).toString('base64');
}

describe.skip('ChainCastProgram', () => {
  let program: ChainCastProgram;
  let supportedInstructions: InstructionMap;

  beforeEach(() => {
    // Use actual instruction classes
    supportedInstructions = {
      debug: Debug,
      set: Set,
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
      const encoded = encodeInstructions(instructions);

      program.load(encoded);

      expect(program.getInstructionsCallLen()).toBe(1);
      expect(program.getInstructionCall(0).name).toBe('debug');
    });

    it('should load a program with multiple instructions', () => {
      const instructions = [
        { name: 'debug', args: { variablesToDebug: ['event'] } },
        { name: 'set', args: { variable: 'processed', value: true } },
      ];
      const encoded = encodeInstructions(instructions);

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
      const invalidJson = Buffer.from('{invalid json}').toString('base64');
      expect(() => {
        program.load(invalidJson);
      }).toThrow();
    });

    it('should throw error for unknown instruction', () => {
      const instructions = [{ name: 'unknown-instruction', args: {} }];
      const encoded = encodeInstructions(instructions);

      expect(() => {
        program.load(encoded);
      }).toThrow();
    });

    it('should throw UserInputError for invalid args', () => {
      const instructions = [{ name: 'debug', args: { invalidArg: true } }];
      const encoded = encodeInstructions(instructions);

      expect(() => {
        program.load(encoded);
      }).toThrow('Failed to load program');
    });

    it('should throw error for set instruction with short variable name', () => {
      const instructions = [{ name: 'set', args: { variable: 'x', value: 1 } }];
      const encoded = encodeInstructions(instructions);

      expect(() => {
        program.load(encoded);
      }).toThrow('Failed to load program');
    });
  });

  describe('compile', () => {
    it('should return true for valid program', () => {
      const instructions = [{ name: 'debug', args: { variablesToDebug: ['event'] } }];
      const encoded = encodeInstructions(instructions);

      expect(program.compile(encoded)).toBe(true);
    });

    it('should return false for invalid args', () => {
      const instructions = [{ name: 'debug', args: { invalidArg: true } }];
      const encoded = encodeInstructions(instructions);

      expect(program.compile(encoded)).toBe(false);
    });

    it('should not modify program state when compiling', () => {
      const instructions = [{ name: 'debug', args: { variablesToDebug: ['event'] } }];
      const encoded = encodeInstructions(instructions);

      program.compile(encoded);

      expect(program.getInstructionsCallLen()).toBe(0);
    });

    it('should throw error for unknown instruction during compile', () => {
      const instructions = [{ name: 'unknown', args: {} }];
      const encoded = encodeInstructions(instructions);

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
      const encoded = encodeInstructions(instructions);

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
      const encoded = encodeInstructions(instructions);

      program.load(encoded);

      expect(program.getInstructionCall(0).name).toBe('debug');
      expect(program.getInstructionCall(1).name).toBe('set');
    });

    it('should return undefined for out of bounds index', () => {
      const instructions = [{ name: 'debug', args: { variablesToDebug: ['event'] } }];
      const encoded = encodeInstructions(instructions);

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
      const encoded = encodeInstructions(instructions);

      program.load(encoded);

      expect(program.getInstructionsCallLen()).toBe(3);
    });
  });

  describe('empty program', () => {
    it('should load empty program array', () => {
      const encoded = encodeInstructions([]);

      program.load(encoded);

      expect(program.getInstructionsCallLen()).toBe(0);
    });

    it('should compile empty program as valid', () => {
      const encoded = encodeInstructions([]);

      expect(program.compile(encoded)).toBe(true);
    });
  });
});
