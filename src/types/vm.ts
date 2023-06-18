import { Web3Event } from './events';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type VariableDict = { [key: string]: any };

export type InstructionCall = {
  name: string;
  args: InstructionArgs;
  branches?: Program[];
};

export type InstructionArgs = {
  [key: string]: {
    type: 'number' | 'string' | 'boolean' | 'number[]' | 'string[]' | 'date'| 'any';
    required: boolean | false;
    value: number | string | boolean | number[] | string[] | undefined;
  };
};

export type Variable = { [key: string]: number | string | boolean | number[] | string[] };

export type ArgFieldType = {
  type: 'number' | 'string' | 'boolean' | 'number[]' | 'string[]' | 'date'| 'any';
  required: boolean;
};

export type ArgsSchema = {
  [key: string]: ArgFieldType;
};

export type Instruction = {
  name(): string;
  getArgsSchema(): ArgsSchema;
  validateArgs(conf: InstructionArgs | undefined): boolean;
  onEvent<N, T>(vm: VirtualMachine, event: Web3Event<N, T>): void;
};

export type PlugInConstructor<M> = new (id: string, address: string, chainId: number) => M;

export type InstructionMap = {
  [key: string]: PlugInConstructor<Instruction>;
};

export type Program = InstructionCall[]; 

/**
 * Stack Virtual Machine
 */
export type VirtualMachine = {
  getGlobalVariables(): VariableDict;
  getGlobalVariable(path: string): any;
  executeProgram<N extends string, T>(
    program: Program,
    event: Web3Event<N, T>): Promise<void>;
  execute<N extends string, T>(event: Web3Event<N, T>): Promise<void>;
  executeStep<N extends string, T>(
    step: InstructionCall,
    event: Web3Event<N, T>
  ): Promise<void> | void;
  getCurrentStackItem(): InstructionCall | undefined;
  getStack(): InstructionCall[];
  isHalted(): boolean;
  halt(halt: boolean): void;
  getError(): string | null;
  setError(message: string, stack: any): void
  loadProgram(program: InstructionCall[]): void;

};
