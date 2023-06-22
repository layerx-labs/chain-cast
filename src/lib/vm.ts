import log from '@/services/log';
import {
  InstructionMap,
  InstructionCall,
  Instruction,
  VirtualMachine,
  VariableDict,
  Trigger,
  Program,
} from '@/types/vm';
import { CastInfo } from '../types';
import { Stack } from '@/lib/stack';
import { getVariableFromPath } from '@/util/vm';

/**
 *  Class to excute a program, a set of instructions in sequence
 */
export class ChainCastVirtualMachine<CI extends CastInfo> implements VirtualMachine {
  private _supportedInstructions: InstructionMap;
  private _program: Program | null = null;
  private _instructions: Instruction[] = [];
  private _info: CI;

  //Virtual Machine Temporary Context

  private _error: string | null = null;
  private _errorStack: any = null;
  private _halt = false;
  private _globalVariables: VariableDict = {};
  private _stack: Stack<InstructionCall>;

  constructor(info: CI, supportedInstructions: InstructionMap) {
    this._supportedInstructions = supportedInstructions;
    this._info = info;
    this._stack = new Stack<InstructionCall>();
  }

  getCast(): { id: string; chainId: number; address: string } {
    return {
      id: this._info.getId(),
      chainId: this._info.getChainId(),
      address: this._info.getAddress(),
    };
  }
  getGlobalVariables(): VariableDict {
    return this._globalVariables;
  }
  getGlobalVariable(name: string) {
    return this._globalVariables[name];
  }

  getGlobalVariableFromPath(path: string) {
    return getVariableFromPath(path, this._globalVariables);
  }

  setGlobalVariable(name: string, value: any) {
    this._globalVariables[name] = value;
  }

  getCurrentStackItem(): InstructionCall | undefined {
    return this._stack.peek();
  }

  getStack(): InstructionCall[] {
    return this._stack.getAll();
  }
  isHalted(): boolean {
    return this._halt;
  }
  halt(halt: boolean): void {
    this._halt = halt;
  }
  getError(): string | null {
    return this._error;
  }

  setError(message: string, stack: any): void {
    this._error = message;
    this._errorStack = stack;
  }

  loadProgram<P extends Program>(program: P): void {
    this._program = program;
  }

  async executeInstruction(step: InstructionCall): Promise<void> {
    if (!this._halt && !this._error) {
      const constructorZ = this._supportedInstructions[step.name];
      const instruction = new constructorZ();
      this._stack.push(step);
      await instruction.onAction(this);
      this._stack.pop();
    }
  }

  async execute<N extends string, T>(trigger: Trigger<N, T>) {
    if (!this._program) {
      log.w(`No program loaded to execute on ${this._info.getId()}`);
      return;
    }
    log.d(`Executing Program for ${this._info.getId()}  `);
    //1. Initialize Virtual Machine State
    this._initVM();
    this.setGlobalVariable(trigger.name, trigger.payload);
    this.setGlobalVariable('cast', this.getCast());
    try {
      await this.executeInstructions(this._program.getInstructionCalls());
    } catch (e: Error | any) {
      log.e(
        `Failed to execute Program ${this._info.getId()} ` +
          `on Step ${this.getCurrentStackItem()?.name} ${e.message} ${e.stack}`
      );
    }
  }

  private _initVM() {
    this._error = null;
    this._errorStack = null;
    this._halt = false;
    this._globalVariables = {};
    this._stack.clear();
  }

  async executeInstructions(instructionCalls: InstructionCall[]): Promise<void> {
    for (const call of instructionCalls) {
      await this.executeInstruction(call);
    }
  }
}
