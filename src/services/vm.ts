import { Web3Event } from '@/types/events';
import log from '@/services/log';
import {
  InstructionMap,
  InstructionCall,
  Instruction,
  VirtualMachine,
  Program,
  VariableDict,
} from '@/types/vm';
import { CastInfo } from '../types';
import { UserInputError } from '@/middleware/errors';
import { ErrorsEnum } from '../constants';
import { Stack } from '@/lib/stack';

/**
 *  Class to excute a program, a set of processors in sequence
 */
export class ChainCastVirtualMachine<CI extends CastInfo> implements VirtualMachine {
  private _supportedProcessors: InstructionMap;
  private _program: Program = [];
  private _processors: Instruction[] = [];
  private _info: CI;

  //Virtual Machine Temporary Context

  private _error: string | null = null;
  private _errorStack: any = null;
  private _halt = false;
  private _globalVariables: VariableDict = {};
  private _stack: Stack<InstructionCall>;

  constructor(info: CI, supportedProcessors: InstructionMap) {
    this._supportedProcessors = supportedProcessors;
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
    this._processors = [];
    this._program = program;
    for (const step of this._program) {
      const constructorZ = this._supportedProcessors[step.name];
      const processor: Instruction = new constructorZ(
        this._info.getId(),
        this._info.getAddress(),
        this._info.getChainId()
      );
      if (!processor.validateArgs(step.args)) {
        throw new UserInputError(
          'Failed to load program, configuration is wrong',
          ErrorsEnum.invalidUserInput
        );
      }
      this._processors.push(processor);
    }
  }

  async executeStep<N extends string, T>(
    step: InstructionCall,
    event: Web3Event<N, T>
  ): Promise<void> {
    if (!this._halt && !this._error) {
      const constructorZ = this._supportedProcessors[step.name];
      const processor = new constructorZ(
        this._info.getId(),
        this._info.getAddress(),
        this._info.getChainId()
      );
      this._stack.push(step);
      await processor.onEvent(this, event);
      this._stack.pop();
    }
  }

  private _initGlobalVariables(rootName: string, obj: any) {
    Object.keys(obj).forEach((key) => {
      const valueType = typeof obj[key];
      switch (valueType) {
        case 'string':
        case 'number':
        case 'undefined':
        case 'boolean':
        case 'symbol':
        case 'bigint':
          this._globalVariables[`${rootName}.${key}`] = obj[key];
          break;
        case 'object':
          this._initGlobalVariables(`${rootName}.${key}`, obj[key]);
          break;
        default:
          break;
      }
    });
  }

  async execute<N extends string, T>(event: Web3Event<N, T>) {
    log.d(`Executing Program for ${this._info.getId()}  `);
    //1. Initialize Virtual Machine State
    this._initVM();
    this._initGlobalVariables('event', event);
    this._initGlobalVariables('cast', this.getCast());
    try {
      await this.executeProgram(this._program, event);
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

  async executeProgram<N extends string, T>(
    program: Program,
    event: Web3Event<N, T>
  ): Promise<void> {
    for (const step of this._program) {
      await this.executeStep(step, event);
    }
  }
}
