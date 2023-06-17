import { Web3Event } from '@/types/events';
import log from '@/services/log';
import {
  SupportPlugInsMap,
  ProcessorStep,
  ContractCastEventProcessor,
  VirtualMachine,
  Program,
  VariableDict,
} from '@/types/processor';
import { CastInfo } from '../types';
import { UserInputError } from '@/middleware/errors';
import { ErrorsEnum } from '../constants';



class Stack<T> {

  private stack: T[];

  constructor() {
    this.stack = [];
  }

  push(item: T) {
    this.stack.push(item);
  }

  pop(): T | undefined {
    return this.stack.pop();
  }

  isEmpty(): boolean {
    return this.stack.length === 0;
  }

  size(): number {
    return this.stack.length;
  }

  peek(): T | undefined {
    return this.stack[this.stack.length - 1];
  }

  clear() {
    this.stack = [];
  }

  getAll(){
    return this.stack; 
  }
}
/**
 *  Class to excute a program, a set of processors in sequence
 */
export class ChainCastVirtualMachine<CI extends CastInfo> implements VirtualMachine {
  private _supportedProcessors: SupportPlugInsMap;
  private _program: Program = [];
  private _processors: ContractCastEventProcessor[] = [];
  private _info: CI;

  //Virtual Machine Temporary Context

  private _error: string | null = null;
  private _errorStack: any = null;
  private _halt = false;
  private _variables: VariableDict = {};
  private _stack: Stack<ProcessorStep>;


  constructor(info: CI, supportedProcessors: SupportPlugInsMap) {
    this._supportedProcessors = supportedProcessors;
    this._info = info;
    this._stack = new Stack<ProcessorStep>();
  }
  getCast(): { id: string; chainId: number; address: string; } {
   return {
    id: this._info.getId(),
    chainId: this._info.getChainId(),
    address: this._info.getAddress()
   };
  }
  getVariables(): VariableDict {
    return this._variables;
  }
  getVariable(name: string) {
    return this._variables[name];
  }
  getCurrentStackItem(): ProcessorStep| undefined {
    return this._stack.peek();
  }

  getStack(): ProcessorStep[] {
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
      const processor: ContractCastEventProcessor = new constructorZ(
        this._info.getId(),
        this._info.getAddress(),
        this._info.getChainId()
      );
      if (!processor.validatConf(step.args)) {
        throw new UserInputError(
          'Failed to load program, configuration is wrong',
          ErrorsEnum.invalidUserInput
        );
      }
      this._processors.push(processor);
    }
  }

  async executeStep<N extends string, T>(
    step: ProcessorStep,
    event: Web3Event<N, T>
  ): Promise<void> {
    if (!this._halt && !this._error) {
      log.d(`Executing Step for ${this._info.getId()}  - ${step.name}`);
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

  async execute<N extends string, T>(event: Web3Event<N, T>) {
    let stepIndex = 0;
    log.d(`Executing Program for ${this._info.getId()}  `);
    //1. Initialize Virtual Machine State
    this._error = null;
    this._errorStack = null;
    this._halt = false;
    this._variables = {};
    this._stack.clear();
    try {
      for (const step of this._program) {
        await this.executeStep(
          step,
          event,
        )
        stepIndex++;
      }
    } catch (e: Error | any) {
      log.e(
        `Failed to execute Program ${this._info.getId()} ` +
          `on Step ${stepIndex} ${e.message} ${e.stack}`
      );
    }
  }
}
