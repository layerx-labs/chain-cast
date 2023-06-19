// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type VariableDict = { [key: string]: any };

export type InstructionCall = {
  name: string;
  args: InstructionArgs;
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

export type ArgsSchema = {
  [key: string]: ArgFieldType;
};

export type Instruction = {
  name(): string;
  getArgsSchema(): ArgsSchema;
  validateArgs(conf: InstructionArgs | undefined): boolean;
  onAction(vm: VirtualMachine): void;
};

export type InstructionConstructor<M> = new (id: string, address: string, chainId: number) => M;

export type InstructionMap = {
  [key: string]: InstructionConstructor<Instruction>;
};

export type Program = InstructionCall[];

/**
 * Stack Virtual Machine
 */
export type VirtualMachine = {
  getGlobalVariables(): VariableDict;
  getGlobalVariable(name: string): any;
  getGlobalVariableFromPath(path: string): any;
  setGlobalVariable(name: string, value: any): void;
  executeProgram(program: Program): Promise<void>;
  execute<N extends string, T>(trigger: Trigger<N, T>): Promise<void>;
  executeStep(step: InstructionCall): Promise<void> | void;
  getCurrentStackItem(): InstructionCall | undefined;
  getStack(): InstructionCall[];
  isHalted(): boolean;
  halt(halt: boolean): void;
  getError(): string | null;
  setError(message: string, stack: any): void;
  loadProgram(program: InstructionCall[]): void;
};

export type Trigger<N extends string,T> = {
  name: N,
  payload: T,
} 