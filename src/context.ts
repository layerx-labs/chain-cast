import prisma from '@/services/prisma';
import { AppContext } from './types';
import log from '@/services/log';
import { ChainCastManager } from '@/services/chaincast-manager';
import { EVMContractCast } from './lib/contract-cast';

const manager = new ChainCastManager(
  EVMContractCast,
  prisma,
);

export function createContext(): AppContext {
  return {
    db: prisma,
    log,
    manager,
  };
}
