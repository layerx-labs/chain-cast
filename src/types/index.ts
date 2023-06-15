import { EventWhisperer } from '@/services/whisperer';
import { PrismaClient } from '@prisma/client';
import LogService, { LogLevel } from '@taikai/scribal';

export type AppContext = {
  db: PrismaClient;
  log: LogService;
  whisperer: EventWhisperer;
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
