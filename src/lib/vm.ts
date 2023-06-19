import log from '@/services/log';
import {
  InstructionMap,
  InstructionCall,
  Instruction,
  VirtualMachine,
  Program,
  VariableDict,
  Trigger,
} from '@/types/vm';
import { CastInfo } from '../types';
import { UserInputError } from '@/middleware/errors';
import { ErrorsEnum } from '../constants';
import { Stack } from '@/lib/stack';
import { getVariableFromPath } from '@/util/vm';

/**
 *  Class to excute a program, a set of instructions in sequence
 */
export class ChainCastVirtualMachine<CI extends CastInfo> implements VirtualMachine {
  private _supportedInstructions: InstructionMap;
  private _program: Program = [];
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

  loadProgram(program: Program) {
    this._instructions = [];
    this._program = program;
    for (const step of this._program) {
      const constructorZ = this._supportedInstructions[step.name];
      const instruction: Instruction = new constructorZ(
        this._info.getId(),
        this._info.getAddress(),
        this._info.getChainId()
      );
      if (!instruction.validateArgs(step.args)) {
        throw new UserInputError(
          'Failed to load program, configuration is wrong',
          ErrorsEnum.invalidUserInput
        );
      }
      this._instructions.push(instruction);
    }
  }

  async executeStep(step: InstructionCall): Promise<void> {
    if (!this._halt && !this._error) {
      const constructorZ = this._supportedInstructions[step.name];
      const instruction = new constructorZ(
        this._info.getId(),
        this._info.getAddress(),
        this._info.getChainId()
      );
      this._stack.push(step);
      await instruction.onAction(this);
      this._stack.pop();
    }
  }
  
  async execute<N extends string, T>(trigger: Trigger<N, T>) {
    log.d(`Executing Program for ${this._info.getId()}  `);
    //1. Initialize Virtual Machine State
    this._initVM();
    this.setGlobalVariable(trigger.name, trigger.payload);
    this.setGlobalVariable('cast', this.getCast());
    try {
      await this.executeProgram(this._program);
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

  async executeProgram(program: Program): Promise<void> {
    for (const step of program) {
      await this.executeStep(step);
    }
  }
}
