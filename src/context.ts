import { ChainCastManager } from '@/services/chaincast-manager';
import log from '@/services/log';
import prisma from '@/services/prisma';
import { EVMContractCast } from './lib/contract-cast';
import { ChainCastVirtualMachine } from './lib/vm';
import { ChainCastSecretManager } from './services/secret-manager';
import type { AppContext } from './types';

/**
 * Singleton instance of ChainCastManager that handles contract monitoring,
 * instruction execution, and virtual machine operations.
 * Initialized with EVM contract cast implementation, virtual machine, and services.
 */
const manager = new ChainCastManager(
  EVMContractCast,
  ChainCastVirtualMachine,
  ChainCastSecretManager,
  prisma
);

/**
 * Creates the application context that provides access to core services
 * throughout the application. This context is used by GraphQL resolvers
 * and other parts of the application.
 *
 * @returns Application context containing database, logger, and manager services
 */
export function createContext(): AppContext {
  return {
    db: prisma, // Prisma database client
    log, // Application logger
    manager, // ChainCast manager for contract operations
  };
}
