import { Web3Event } from './events';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type VariableDict = { [key: string]: any };

export type ProcessorStep = {
  name: string;
  args: ProcessorArgs;
  branches?: ProcessorStep[];
};

export type ProcessorArgs = {
  [key: string]: {
    type: 'number' | 'string' | 'boolean' | 'number[]' | 'string[]' | 'date';
    required: boolean | false;
    value: number | string | boolean | number[] | string[] | undefined;
  };
};

export type Variable = { [key: string]: number | string | boolean | number[] | string[] };

export type ArgFieldType = {
  type: 'number' | 'string' | 'boolean' | 'number[]' | 'string[]' | 'date';
  required: boolean;
};

export type ArgumentsSchema = {
  [key: string]: ArgFieldType;
};

export type ContractCastEventProcessor = {
  name(): string;
  getArgsSchema(): ArgumentsSchema;
  validatConf(conf: ProcessorArgs | undefined): boolean;
  onEvent<N, T>(vm: VirtualMachine, event: Web3Event<N, T>): void;
};

export type PlugInConstructor<M> = new (id: string, address: string, chainId: number) => M;

export type SupportPlugInsMap = {
  [key: string]: PlugInConstructor<ContractCastEventProcessor>;
};

export type Program = ProcessorStep[]; 

/**
 * Stack Virtual Machine
 */
export type VirtualMachine = {
  getCast(): {
    id: string;
    chainId: number;
    address: string;
  };
  getVariables(): VariableDict;
  getVariable(name: string): any;
  execute<N extends string, T>(event: Web3Event<N, T>): Promise<void>;
  executeStep<N extends string, T>(
    step: ProcessorStep,
    event: Web3Event<N, T>
  ): Promise<void> | void;
  getCurrentStackItem(): ProcessorStep | undefined;
  getStack(): ProcessorStep[];
  isHalted(): boolean;
  halt(halt: boolean): void;
  getError(): string | null;
  setError(message: string, stack: any): void
  loadProgram(program: ProcessorStep[]): void;

};
