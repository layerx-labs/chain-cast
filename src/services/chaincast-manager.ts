import log from '@/services/log';
import { ContractCastType, PrismaClient } from '@prisma/client';

import { InstructionMap, Instruction, InstructionConstructor, VirtualMachine } from '@/types/vm';
import { CastInfo, ContractCast, ContractCastConstructor, SecretManager } from '../types';
import { ChainCastProgram } from '@/lib/program';
import { loadSecresFromDb } from '@/util/secrets';

/**
 * The Service that manage all the contract casts lifecycles
 */
export class ChainCastManager<
  C extends ContractCast,
  VM extends VirtualMachine,
  S extends SecretManager
> {
  private _casts: { [key: string]: C };
  private _db: PrismaClient;
  private _supportedProcessors: InstructionMap = {};
  private _creator: ContractCastConstructor<C, S, VM>;
  private _seretManagerCreator: new () => S;
  private _vmCreator: new (info: CastInfo, supportedInstructions: InstructionMap) => VM;

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

  getCasts(): ContractCast[] {
    return Object.values(this._casts);
  }

  /**
   * Start all the casts asynchronously
   */
  async start() {
    const casts = await this._loadCastsFromDb();
    for (const cast of casts) {
      // Start the cast asynchronously without waiting for the cast to start
      this._setupCast(cast);
    }
  }
  /**
   * Stop all the cast ssynchronously
   */
  async stop() {
    for (const cast of Object.values(this._casts)) {
      // Stop Sequencially the casts
      await cast.stop();
    }
  }

  /**
   * Add a new cast to process events
   * @param cast
   */
  async addCast(cast: {
    id: string;
    type: ContractCastType;
    name: string;
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

  getCast(id: string) {
    return this._casts[id];
  }

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

  async deleteCast(id: string) {
    if (this._casts[id]) {
      await this._casts[id].stop();
      delete this._casts[id];
    }
  }

  registerInstruction<M extends Instruction>(
    name: string,
    pConstructor: InstructionConstructor<M>
  ) {
    this._supportedProcessors[name] = pConstructor;
  }

  getSupportedInstructions() {
    return this._supportedProcessors;
  }

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

  private async _setupCast(cast: {
    id: string;
    type: ContractCastType;
    name: string | null,
    address: string;
    chainId: number;
    blockNumber: number;
    transactionIndex: number;
    abi?: string;
    program: string;
  }) {
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
    this._casts[cast.id] = contractCast;
    const program = new ChainCastProgram(this._supportedProcessors);
    program.load(cast.program);
    await contractCast.loadProgram(program);
    await contractCast.loadSecrets(await loadSecresFromDb(this._db, cast.id));
    await contractCast.start();
  }
}
