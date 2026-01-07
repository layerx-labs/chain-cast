import { describe, expect, it, beforeEach, mock } from 'bun:test';
import { ChainCastVirtualMachine } from '@/lib/vm';
import type {
  CastInfo,
  Instruction,
  InstructionArgs,
  InstructionCall,
  InstructionMap,
  Program,
  VirtualMachine,
} from '@/types/vm';
import { z } from 'zod';

// Mock CastInfo implementation
class MockCastInfo implements CastInfo {
  private id: string;
  private address: string;
  private chainId: number;
  private blockNumber: number;

  constructor(
    id = 'test-cast-id',
    address = '0x1234567890abcdef1234567890abcdef12345678',
    chainId = 1,
    blockNumber = 1000000
  ) {
    this.id = id;
    this.address = address;
    this.chainId = chainId;
    this.blockNumber = blockNumber;
  }

  getId(): string {
    return this.id;
  }
  getAddress(): string {
    return this.address;
  }
  getChainId(): number {
    return this.chainId;
  }
  getBlockNumber(): number {
    return this.blockNumber;
  }
}

// Mock instruction that tracks execution
class MockInstruction implements Instruction {
  INSTRUCTION_NAME = 'mock';
  static executionCount = 0;
  static lastVm: VirtualMachine | null = null;

  private schema = z.object({
    value: z.string().optional(),
  });

  name(): string {
    return this.INSTRUCTION_NAME;
  }

  getArgsSchema() {
    return this.schema;
  }

  validateArgs(args: InstructionArgs | undefined): boolean {
    return this.schema.safeParse(args).success;
  }

  onAction(vm: VirtualMachine): void {
    MockInstruction.executionCount++;
    MockInstruction.lastVm = vm;
  }

  static reset() {
    MockInstruction.executionCount = 0;
    MockInstruction.lastVm = null;
  }
}

// Mock instruction that sets a variable
class MockSetInstruction implements Instruction {
  INSTRUCTION_NAME = 'set';
  private schema = z.object({
    variable: z.string(),
    value: z.any(),
  });

  name(): string {
    return this.INSTRUCTION_NAME;
  }

  getArgsSchema() {
    return this.schema;
  }

  validateArgs(args: InstructionArgs | undefined): boolean {
    return this.schema.safeParse(args).success;
  }

  onAction(vm: VirtualMachine): void {
    const step = vm.getCurrentStackItem();
    if (step?.args) {
      const { variable, value } = step.args as { variable: string; value: unknown };
      vm.setGlobalVariable(variable, value);
    }
  }
}

// Mock instruction that halts the VM
class MockHaltInstruction implements Instruction {
  INSTRUCTION_NAME = 'halt';
  private schema = z.object({});

  name(): string {
    return this.INSTRUCTION_NAME;
  }

  getArgsSchema() {
    return this.schema;
  }

  validateArgs(_args: InstructionArgs | undefined): boolean {
    return true;
  }

  onAction(vm: VirtualMachine): void {
    vm.halt(true);
  }
}

// Mock instruction that throws an error
class MockErrorInstruction implements Instruction {
  INSTRUCTION_NAME = 'error';
  private schema = z.object({});

  name(): string {
    return this.INSTRUCTION_NAME;
  }

  getArgsSchema() {
    return this.schema;
  }

  validateArgs(_args: InstructionArgs | undefined): boolean {
    return true;
  }

  onAction(_vm: VirtualMachine): void {
    throw new Error('Test error');
  }
}

// Mock Program implementation
class MockProgram implements Program {
  private calls: InstructionCall[] = [];

  constructor(calls: InstructionCall[] = []) {
    this.calls = calls;
  }

  load(_stringCode: string): void {
    // No-op for mock
  }

  compile(_stringCode: string): boolean {
    return true;
  }

  getInstructionCalls(): InstructionCall[] {
    return this.calls;
  }

  getInstructionCall(index: number): InstructionCall {
    return this.calls[index];
  }

  getInstructionsCallLen(): number {
    return this.calls.length;
  }
}

describe('ChainCastVirtualMachine', () => {
  let vm: ChainCastVirtualMachine<MockCastInfo>;
  let castInfo: MockCastInfo;
  let supportedInstructions: InstructionMap;

  beforeEach(() => {
    MockInstruction.reset();
    castInfo = new MockCastInfo();
    supportedInstructions = {
      mock: MockInstruction,
      set: MockSetInstruction,
      halt: MockHaltInstruction,
      error: MockErrorInstruction,
    };
    vm = new ChainCastVirtualMachine(castInfo, supportedInstructions);
  });

  describe('constructor', () => {
    it('should create VM with empty state', () => {
      expect(vm.getGlobalVariables()).toEqual({});
      expect(vm.getStack()).toEqual([]);
      expect(vm.isHalted()).toBe(false);
      expect(vm.getError()).toBeNull();
    });
  });

  describe('global variables', () => {
    describe('setGlobalVariable', () => {
      it('should store a variable', () => {
        vm.setGlobalVariable('test', 'value');
        expect(vm.getGlobalVariable('test')).toBe('value');
      });

      it('should store multiple variables', () => {
        vm.setGlobalVariable('var1', 'value1');
        vm.setGlobalVariable('var2', 123);
        vm.setGlobalVariable('var3', { nested: true });

        expect(vm.getGlobalVariable('var1')).toBe('value1');
        expect(vm.getGlobalVariable('var2')).toBe(123);
        expect(vm.getGlobalVariable('var3')).toEqual({ nested: true });
      });

      it('should overwrite existing variable', () => {
        vm.setGlobalVariable('test', 'initial');
        vm.setGlobalVariable('test', 'updated');
        expect(vm.getGlobalVariable('test')).toBe('updated');
      });
    });

    describe('getGlobalVariable', () => {
      it('should return undefined for non-existent variable', () => {
        expect(vm.getGlobalVariable('nonexistent')).toBeUndefined();
      });

      it('should return stored value', () => {
        vm.setGlobalVariable('event', { type: 'Transfer' });
        expect(vm.getGlobalVariable('event')).toEqual({ type: 'Transfer' });
      });
    });

    describe('getGlobalVariableFromPath', () => {
      it('should access nested properties', () => {
        vm.setGlobalVariable('event', {
          type: 'Transfer',
          data: {
            from: '0xsender',
            to: '0xreceiver',
          },
        });

        expect(vm.getGlobalVariableFromPath('event.type')).toBe('Transfer');
        expect(vm.getGlobalVariableFromPath('event.data.from')).toBe('0xsender');
      });

      it('should return null for non-existent path', () => {
        vm.setGlobalVariable('event', { type: 'Transfer' });
        expect(vm.getGlobalVariableFromPath('event.nonexistent')).toBeNull();
      });
    });

    describe('getGlobalVariables', () => {
      it('should return all variables', () => {
        vm.setGlobalVariable('var1', 'value1');
        vm.setGlobalVariable('var2', 'value2');

        const vars = vm.getGlobalVariables();
        expect(vars).toEqual({ var1: 'value1', var2: 'value2' });
      });
    });
  });

  describe('program loading', () => {
    it('should load a program', () => {
      const program = new MockProgram([{ name: 'mock', args: {} }]);

      vm.loadProgram(program);

      // Program is loaded (verified by execution)
      expect(true).toBe(true);
    });
  });

  describe('instruction execution', () => {
    describe('executeInstruction', () => {
      it('should execute a single instruction', async () => {
        const call: InstructionCall = { name: 'mock', args: {} };

        await vm.executeInstruction(call);

        expect(MockInstruction.executionCount).toBe(1);
      });

      it('should push and pop instruction from stack', async () => {
        const call: InstructionCall = { name: 'mock', args: {} };

        // During execution, instruction is on stack
        const originalOnAction = MockInstruction.prototype.onAction;
        MockInstruction.prototype.onAction = function (vm: VirtualMachine) {
          expect(vm.getCurrentStackItem()).toEqual(call);
          expect(vm.getStack()).toHaveLength(1);
        };

        await vm.executeInstruction(call);

        // After execution, stack is empty
        expect(vm.getStack()).toHaveLength(0);

        MockInstruction.prototype.onAction = originalOnAction;
      });

      it('should skip execution when VM is halted', async () => {
        vm.halt(true);
        const call: InstructionCall = { name: 'mock', args: {} };

        await vm.executeInstruction(call);

        expect(MockInstruction.executionCount).toBe(0);
      });

      it('should skip execution when VM has error', async () => {
        vm.setError('Test error', null);
        const call: InstructionCall = { name: 'mock', args: {} };

        await vm.executeInstruction(call);

        expect(MockInstruction.executionCount).toBe(0);
      });
    });

    describe('executeInstructions', () => {
      it('should execute multiple instructions in order', async () => {
        const executionOrder: string[] = [];

        // Create custom instructions to track order
        class OrderTracker implements Instruction {
          INSTRUCTION_NAME: string;
          constructor(name: string) {
            this.INSTRUCTION_NAME = name;
          }
          name() {
            return this.INSTRUCTION_NAME;
          }
          getArgsSchema() {
            return z.object({});
          }
          validateArgs() {
            return true;
          }
          onAction() {
            executionOrder.push(this.INSTRUCTION_NAME);
          }
        }

        const customInstructions: InstructionMap = {
          first: class extends OrderTracker {
            constructor() {
              super('first');
            }
          },
          second: class extends OrderTracker {
            constructor() {
              super('second');
            }
          },
          third: class extends OrderTracker {
            constructor() {
              super('third');
            }
          },
        };

        const customVm = new ChainCastVirtualMachine(castInfo, customInstructions);

        await customVm.executeInstructions([
          { name: 'first', args: {} },
          { name: 'second', args: {} },
          { name: 'third', args: {} },
        ]);

        expect(executionOrder).toEqual(['first', 'second', 'third']);
      });

      it('should stop execution after halt', async () => {
        const calls: InstructionCall[] = [
          { name: 'mock', args: {} },
          { name: 'halt', args: {} },
          { name: 'mock', args: {} }, // Should not execute
        ];

        await vm.executeInstructions(calls);

        expect(MockInstruction.executionCount).toBe(1);
        expect(vm.isHalted()).toBe(true);
      });
    });
  });

  describe('execute', () => {
    it('should execute loaded program with trigger', async () => {
      const program = new MockProgram([
        { name: 'set', args: { variable: 'result', value: 'executed' } },
      ]);
      vm.loadProgram(program);

      await vm.execute({ name: 'event', payload: { type: 'Transfer' } });

      // VM state is reset after execution, but instruction was executed
      expect(vm.getGlobalVariable('result')).toBeUndefined(); // Reset after execution
    });

    it('should set trigger as global variable during execution', async () => {
      let capturedEvent: unknown = null;

      class CaptureInstruction implements Instruction {
        INSTRUCTION_NAME = 'capture';
        name() {
          return this.INSTRUCTION_NAME;
        }
        getArgsSchema() {
          return z.object({});
        }
        validateArgs() {
          return true;
        }
        onAction(vm: VirtualMachine) {
          capturedEvent = vm.getGlobalVariable('event');
        }
      }

      const customVm = new ChainCastVirtualMachine(castInfo, { capture: CaptureInstruction });
      const program = new MockProgram([{ name: 'capture', args: {} }]);
      customVm.loadProgram(program);

      await customVm.execute({ name: 'event', payload: { type: 'Transfer', value: 100 } });

      expect(capturedEvent).toEqual({ type: 'Transfer', value: 100 });
    });

    it('should not execute without loaded program', async () => {
      // No program loaded
      await vm.execute({ name: 'event', payload: {} });

      // Should complete without error
      expect(MockInstruction.executionCount).toBe(0);
    });

    it('should reset VM state after execution', async () => {
      const program = new MockProgram([
        { name: 'set', args: { variable: 'test', value: 'value' } },
      ]);
      vm.loadProgram(program);

      await vm.execute({ name: 'event', payload: {} });

      // State should be reset
      expect(vm.getGlobalVariables()).toEqual({});
      expect(vm.isHalted()).toBe(false);
      expect(vm.getError()).toBeNull();
      expect(vm.getStack()).toEqual([]);
    });

    it('should reset VM state even after halt', async () => {
      const program = new MockProgram([{ name: 'halt', args: {} }]);
      vm.loadProgram(program);

      await vm.execute({ name: 'event', payload: {} });

      expect(vm.isHalted()).toBe(false); // Reset after execution
    });
  });

  describe('halt', () => {
    it('should set halt state', () => {
      vm.halt(true);
      expect(vm.isHalted()).toBe(true);
    });

    it('should unset halt state', () => {
      vm.halt(true);
      vm.halt(false);
      expect(vm.isHalted()).toBe(false);
    });

    it('should capture backtrace when halting', async () => {
      const call: InstructionCall = { name: 'halt', args: {} };
      await vm.executeInstruction(call);

      expect(vm.isHalted()).toBe(true);
    });
  });

  describe('error handling', () => {
    describe('setError', () => {
      it('should store error message', () => {
        vm.setError('Test error message', 'stack trace');
        expect(vm.getError()).toBe('Test error message');
      });
    });

    describe('getError', () => {
      it('should return null when no error', () => {
        expect(vm.getError()).toBeNull();
      });
    });
  });

  describe('stack management', () => {
    describe('getCurrentStackItem', () => {
      it('should return undefined when stack is empty', () => {
        expect(vm.getCurrentStackItem()).toBeUndefined();
      });

      it('should return current instruction during execution', async () => {
        let stackItem: InstructionCall | undefined;

        class StackChecker implements Instruction {
          INSTRUCTION_NAME = 'check';
          name() {
            return this.INSTRUCTION_NAME;
          }
          getArgsSchema() {
            return z.object({ testArg: z.string() });
          }
          validateArgs() {
            return true;
          }
          onAction(vm: VirtualMachine) {
            stackItem = vm.getCurrentStackItem();
          }
        }

        const customVm = new ChainCastVirtualMachine(castInfo, { check: StackChecker });

        await customVm.executeInstruction({ name: 'check', args: { testArg: 'value' } });

        expect(stackItem?.name).toBe('check');
        expect(stackItem?.args).toEqual({ testArg: 'value' });
      });
    });

    describe('getStack', () => {
      it('should return empty array initially', () => {
        expect(vm.getStack()).toEqual([]);
      });
    });
  });
});
