// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type VariableDict = { [key: string]: any };
import { z } from 'zod';
export type InstructionCall = {
  name: string;
  args?: InstructionArgs;
  branches?: Program[];
};

export type InstructionArgs = {
  [key: string]: unknown;
};

export type Variable = { [key: string]: number | string | boolean | number[] | string[] };

export type ArgFieldType = {
  type: 'number' | 'string' | 'boolean' | 'number[]' | 'string[]' | 'date' | 'any';
  required: boolean;
};

export type ArgsSchema<T extends z.ZodRawShape> = z.ZodObject<T>;

export type Instruction = {
  name(): string;
  getArgsSchema(): ArgsSchema<any>;
  validateArgs(conf: InstructionArgs | undefined): boolean;
  onAction(vm: VirtualMachine): void;
};

export type InstructionConstructor<M> = new () => M;

export type InstructionMap = {
  [key: string]: InstructionConstructor<Instruction>;
};

/**
 * Stack Virtual Machine
 */
export type VirtualMachine = {
  getGlobalVariables(): VariableDict;
  getGlobalVariable(name: string): any;
  getGlobalVariableFromPath(path: string): any;
  setGlobalVariable(name: string, value: any): void;
  executeInstructions(instructionCalls: InstructionCall[]): Promise<void>;
  execute<N extends string, T>(trigger: Trigger<N, T>): Promise<void>;
  executeInstruction(instructionCall: InstructionCall): Promise<void> | void;
  getCurrentStackItem(): InstructionCall | undefined;
  getStack(): InstructionCall[];
  isHalted(): boolean;
  halt(halt: boolean): void;
  getError(): string | null;
  setError(message: string, stack: any): void;
  loadProgram<P extends Program>(program: P): void;
};

export type Trigger<N extends string, T> = {
  name: N;
  payload: T;
};


export type Program = {
  load(stringCode: string): void | Promise<void>; 
  compile(stringCode: string) : boolean | Promise<boolean>; 
  getInstructionCalls():  InstructionCall[];
  getInstructionCall(index: number): InstructionCall;
  getInstructionsCallLen(): number 
}