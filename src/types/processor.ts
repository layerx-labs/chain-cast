import { Web3Event } from './events';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type VariableDict = { [key: string]: any };

export type ProcessorRuntime = {
  name: string;
  configuration?: ProcessorConfiguration;
};

export type ProcessorConfiguration = {
  [key: string]: {
    type: 'number' | 'string' | 'boolean' | 'number[]' | 'string[]' | 'date';
    required: boolean | false;
    value: number | string | boolean | number[] | string[] | undefined;
  };
};

export type EventProcessorCtx = {
  cast: {
    id: string;
    chainId: number;
    address: string;
  };
  variables?: VariableDict;
  steps: ProcessorRuntime[];
  processors: ContractCastEventProcessor[];
  curProcessor: ContractCastEventProcessor;
  curStepIndex: number;
  curStep: ProcessorRuntime;
};

export type Variable = { [key: string]: number | string | boolean | number[] | string[] };

export type ConfigurationFieldType = {
  type: 'number' | 'string' | 'boolean' | 'number[]' | 'string[]' | 'date';
  required: boolean;
};

export type ConfigurationTemplate = {
  [key: string]: ConfigurationFieldType;
};

export type ContractCastEventProcessor = {
  name(): string;
  getConfTemplate(): ConfigurationTemplate;
  onEvent<N, T>(ctx: EventProcessorCtx, event: Web3Event<N, T>): void;
};

export type PlugInConstructor<M> = new (id: string, address: string, chainId: number) => M;

export type SupportPlugInsMap = {
  [key: string]: PlugInConstructor<ContractCastEventProcessor>;
};


export type Program = {
  loadProgram(program: ProcessorRuntime[]): void;
  execute<N extends string, T>(event: Web3Event<N, T>): Promise<void>
}
