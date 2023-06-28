import prisma from '@/services/prisma';
import { AppContext } from './types';
import log from '@/services/log';
import { ChainCastManager } from '@/services/chaincast-manager';
import { EVMContractCast } from './lib/contract-cast';
import { ChainCastSecretManager } from './services/secret-manager';
import { ChainCastVirtualMachine } from './lib/vm';

const manager = new ChainCastManager(
  EVMContractCast,
  ChainCastVirtualMachine,
  ChainCastSecretManager,
  prisma,
);

export function createContext(): AppContext {
  return {
    db: prisma,
    log,
    manager,
  };
}
