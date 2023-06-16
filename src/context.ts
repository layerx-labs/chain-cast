import prisma from '@/services/prisma';
import { AppContext, ContractCast } from './types';
import log from '@/services/log';
import { ChainCastManager } from '@/services/chaincast-manager';
import { EVMContractCast } from './services/contract-cast';

const manager: ChainCastManager<EVMContractCast> = new ChainCastManager(
  EVMContractCast,
  prisma
);

export function createContext<C extends ContractCast>(): AppContext<C> {
  return {
    db: prisma,
    log,
    manager,
  };
}
