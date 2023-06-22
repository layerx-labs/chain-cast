import { ChainCastManager } from '@/services/chaincast-manager';
import { ContractCastType, PrismaClient } from '@prisma/client';
import LogService, { LogLevel } from '@taikai/scribal';
import { InstructionMap, Program } from './vm';
import { EventListenerHandler, Web3Event } from './events';
import { EVMContractCast } from '@/lib/contract-cast';
import { Model, Web3Connection } from '@taikai/dappkit';

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
  getId(): string;
  getAddress(): string;
  getChainId(): number;
  getBlockNumber(): number;
};

export enum ContractCastStatusEnum  {
  IDLE,
  RECOVERING,
  LISTENING, 
  TERMINATED
}

export type ContractCast = {
  getStatus(): ContractCastStatusEnum;
  loadProgram(program: Program): Promise<void>;
  start(): Promise<void>;
  stop(): Promise<void>;
  onEvent<N extends string, T>(event: Web3Event<N, T>): Promise<void>;
  onError(error: Error): void;
};

export type ContractCastConstructor<T> = new (
  id: string,
  type: ContractCastType,
  adress: string,
  chainId: number,
  blockNumber: number,
  transactionIndex: number,
  processors: InstructionMap
) => T;


export type ModelConstructor<M> = new (web3Con: Web3Connection, address: string) => M;

export type ContractEventListenerConstructor<M, H extends EventListenerHandler> = new (
  modelConstructor: ModelConstructor<M>,
  wsUrl: string,
  address: string,
  handler: H
) => M;

export type ContractListenerConstructor<M extends Model> = new (
  web3Con: Web3Connection,
  address: string
) => M;
