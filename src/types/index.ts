import { ChainCastManager } from '@/services/chaincast-manager';
import { ContractCastType, PrismaClient } from '@prisma/client';
import LogService, { LogLevel } from '@taikai/scribal';
import { ProcessorRuntime, SupportPlugInsMap } from './processor';
import { Web3Event } from './events';
import { EVMContractCast } from '@/services/contract-cast';

export type AppContext = {
  db: PrismaClient;
  log: LogService;
  manager: ChainCastManager<EVMContractCast>;
};

export type Environment = 'development' | 'staging' | 'production';

export type __Config = {
  appName: string;
  environment: Environment;
  version: string;
  port: number;
  cors: {
    enabled: boolean;
    origins: string[];
  };
  logs: {
    console: {
      silent: boolean;
      logLevel: LogLevel;
      prettify: boolean;
    };
    file?: {
      silent: boolean;
      logLevel: LogLevel;
      logFileDir: string;
      logDailyRotation: boolean;
      logDailyRotationOptions: {
        maxSize: string;
        datePattern: string;
      };
    };
  };
};

export type ChainNames = 'ethereum' | 'mumbai' | 'local' | 'polygon';

export enum ChainIds {
  ETHEREUM = 1,
  MUMBAI = 80001,
  POLYGON = 137,
  LOCAL = 1337,
}

export type ChainParams = {
  id: number;
  rpcUrl: string;
  wsUrl: string;
  blockExplorer?: string;
  currency: string;
  currencyDecimals: number;
  name: string;
  shortName: string;
  primaryColor: string;
};

export type ChainSupported = {
  [key in ChainNames]: ChainParams;
};


export type CastInfo = { 
  getId(): string ;
  getAddress(): string;
  getChainId(): number;
  getBlockNumber() : number;
}

export type ContractCast = {
  loadProgram(program: ProcessorRuntime[]): Promise<void>;
  start(): Promise<void>;
  stop(): Promise<void> ;
  onEvent<N extends string, T>(event: Web3Event<N, T>): Promise<void>; 
  onError(error: Error): void;
}

export type ContractCastConstructor<T> = new (
  id: string,
  type: ContractCastType,
  adress: string,
  chainId: number,
  blockNumber: number,
  processors: SupportPlugInsMap) => T;