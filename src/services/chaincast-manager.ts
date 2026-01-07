import log from '@/services/log';
import type { ContractCastType, PrismaClient } from '@prisma/client';

import { ChainCastProgram } from '@/lib/program';
import type {
  Instruction,
  InstructionConstructor,
  InstructionMap,
  VirtualMachine,
} from '@/types/vm';
import { loadSecresFromDb } from '@/util/secrets';
import type { CastInfo, ContractCast, ContractCastConstructor, SecretManager } from '../types';

/**
 * Central service that manages the lifecycle of all contract casts in the ChainCast system.
 * Handles loading, starting, stopping, and managing contract monitoring instances.
 * Acts as a factory and registry for contract casts with their associated virtual machines
 * and secret managers.
 *
 * @template C - Contract cast implementation type
 * @template VM - Virtual machine implementation type
 * @template S - Secret manager implementation type
 */
export class ChainCastManager<
  C extends ContractCast,
  VM extends VirtualMachine,
  S extends SecretManager,
> {
  /** Map of active contract casts indexed by their unique IDs */
  private _casts: { [key: string]: C };

  /** Prisma database client for persistence operations */
  private _db: PrismaClient;

  /** Registry of supported instruction types that can be executed by virtual machines */
  private _supportedProcessors: InstructionMap = {};

  /** Constructor function for creating contract cast instances */
  private _creator: ContractCastConstructor<C, S, VM>;

  /** Constructor function for creating secret manager instances */
  private _seretManagerCreator: new () => S;

  /** Constructor function for creating virtual machine instances */
  private _vmCreator: new (
    info: CastInfo,
    supportedInstructions: InstructionMap
  ) => VM;

  /**
   * Creates a new ChainCastManager instance with the specified implementations.
   * @param creator - Constructor for contract cast instances
   * @param vmCreator - Constructor for virtual machine instances
   * @param seretManagerCretor - Constructor for secret manager instances
   * @param db - Prisma database client
   */
  constructor(
    creator: ContractCastConstructor<C, S, VM>,
    vmCreator: new (info: CastInfo, supportedInstructions: InstructionMap) => VM,
    seretManagerCretor: new () => S,
    db: PrismaClient
  ) {
    this._seretManagerCreator = seretManagerCretor;
    this._casts = {};
    this._db = db;
    this._creator = creator;
    this._vmCreator = vmCreator;
  }

  /**
   * Retrieves all active contract cast instances.
   * @returns Array of all currently running contract casts
   */
  getCasts(): ContractCast[] {
    return Object.values(this._casts);
  }

  /**
   * Starts all contract casts loaded from the database.
   * Loads persisted contract cast configurations and initializes them asynchronously.
   * Each cast is started in the background without waiting for completion.
   */
  async start() {
    const casts = await this._loadCastsFromDb();
    for (const cast of casts) {
      // Start the cast asynchronously without waiting for the cast to start
      this._setupCast(cast);
    }
  }
  /**
   * Stops all active contract casts synchronously.
   * Iterates through all running casts and stops them sequentially,
   * ensuring each cast is fully stopped before moving to the next.
   */
  async stop() {
    for (const cast of Object.values(this._casts)) {
      // Stop sequentially to ensure clean shutdown
      await cast.stop();
    }
  }

  /**
   * Adds a new contract cast to the system and starts monitoring.
   * Creates a new contract cast instance with the provided configuration
   * and begins processing blockchain events.
   *
   * @param cast - Configuration object for the new contract cast
   */
  async addCast(cast: {
    id: string;
    type: ContractCastType;
    name: string | null;
    address: string;
    chainId: number;
    abi: string;
    blockNumber: number;
    transactionIndex: number;
    program: string;
  }) {
    try {
      this._setupCast(cast);
    } catch (e: any) {
      log.e(`Failed to add chain cast ${cast.id} ${e.message} ${e.stack}`);
    }
  }

  /**
   * Retrieves a specific contract cast by its ID.
   * @param id - Unique identifier of the contract cast
   * @returns The contract cast instance or undefined if not found
   */
  getCast(id: string) {
    return this._casts[id];
  }

  /**
   * Restarts a contract cast by stopping the current instance and creating a new one.
   * Reloads the configuration from the database and reinitializes the cast.
   * @param id - Unique identifier of the contract cast to restart
   */
  async restartCast(id: string) {
    if (this._casts[id]) {
      await this._casts[id].stop();
      delete this._casts[id];
      const cast = await this._db.contractCast.findUnique({
        where: {
          id,
        },
        select: {
          id: true,
          name: true,
          type: true,
          address: true,
          chainId: true,
          blockNumber: true,
          transactionIndex: true,
          abi: true,
          program: true,
        },
      });
      if (cast) {
        this._setupCast(cast);
      }
    }
  }

  /**
   * Removes a contract cast from the system and stops its monitoring.
   * Gracefully stops the cast before removing it from the active casts registry.
   * @param id - Unique identifier of the contract cast to delete
   */
  async deleteCast(id: string) {
    if (this._casts[id]) {
      await this._casts[id].stop();
      delete this._casts[id];
    }
  }

  /**
   * Registers a new instruction type that can be executed by virtual machines.
   * Instructions define the actions that can be performed when contract events occur.
   *
   * @template M - The instruction type being registered
   * @param name - Unique name identifier for the instruction
   * @param pConstructor - Constructor function for creating instruction instances
   */
  registerInstruction<M extends Instruction>(
    name: string,
    pConstructor: InstructionConstructor<M>
  ) {
    this._supportedProcessors[name] = pConstructor;
  }

  /**
   * Retrieves the registry of all supported instruction types.
   * @returns Map of instruction names to their constructor functions
   */
  getSupportedInstructions() {
    return this._supportedProcessors;
  }

  /**
   * Loads all contract cast configurations from the database.
   * Retrieves essential configuration data needed to initialize contract monitoring.
   *
   * @returns Array of contract cast configurations from the database
   */
  private async _loadCastsFromDb() {
    return await this._db.contractCast.findMany({
      select: {
        id: true,
        type: true,
        name: true,
        address: true,
        chainId: true,
        blockNumber: true,
        transactionIndex: true,
        abi: true,
        program: true,
      },
    });
  }

  /**
   * Sets up and initializes a contract cast instance.
   * Creates the contract cast with all necessary dependencies, loads its program
   * and secrets, then starts monitoring for blockchain events.
   *
   * @param cast - Configuration data for the contract cast
   */
  private async _setupCast(cast: {
    id: string;
    type: ContractCastType;
    name: string | null;
    address: string;
    chainId: number;
    blockNumber: number;
    transactionIndex: number;
    abi?: string;
    program: string;
  }) {
    // Create contract cast instance with all dependencies
    const contractCast: C = new this._creator(
      this._seretManagerCreator,
      this._vmCreator,
      cast.id,
      cast.type,
      cast.name,
      cast.address,
      cast.chainId,
      cast.abi ?? '',
      cast.blockNumber,
      cast.transactionIndex,
      this._supportedProcessors
    );

    // Register the cast in the active casts map
    this._casts[cast.id] = contractCast;

    // Load and parse the instruction program
    const program = new ChainCastProgram(this._supportedProcessors);
    program.load(cast.program);

    // Initialize the contract cast with program and secrets, then start monitoring
    await contractCast.loadProgram(program);
    await contractCast.loadSecrets(await loadSecresFromDb(this._db, cast.id));
    await contractCast.start();
  }
}
