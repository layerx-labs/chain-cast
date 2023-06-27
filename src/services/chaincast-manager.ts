import log from '@/services/log';
import { ContractCastType, PrismaClient } from '@prisma/client';

import { InstructionMap, Instruction, InstructionConstructor } from '@/types/vm';
import { ContractCast, ContractCastConstructor, SecretManager } from '../types';
import { ChainCastProgram } from '@/lib/program';

/**
 * The Service that manage all the contract casts lifecycles
 */
export class ChainCastManager<C extends ContractCast> {
  private _casts: { [key: string]: C };
  private _db: PrismaClient;
  private _supportedProcessors: InstructionMap = {};
  private _creator: ContractCastConstructor<C>;



  constructor(creator: ContractCastConstructor<C>, db: PrismaClient) {
    this._casts = {};
    this._db = db;
    this._creator = creator;
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
    address: string;
    chainId: number;
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

  async updateCast(id: string, stringCode: string) {
    if (this._casts[id]) {
      const program = new ChainCastProgram(this._supportedProcessors);
      program.load(stringCode);
      await this._casts[id].loadProgram(program);
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
        address: true,
        chainId: true,
        blockNumber: true,
        transactionIndex: true,
        program: true,
      },
    });
  }

  private async _setupCast(cast: {
    id: string;
    type: ContractCastType;
    address: string;
    chainId: number;
    blockNumber: number;
    transactionIndex: number;
    program: string;
  }) {
    const contractCast: C = new this._creator(
      cast.id,
      cast.type,
      cast.address,
      cast.chainId,
      cast.blockNumber,
      cast.transactionIndex,
      this._supportedProcessors
    );
    this._casts[cast.id] = contractCast;
    const program = new ChainCastProgram(this._supportedProcessors);
    program.load(cast.program);
    await contractCast.loadProgram(program);
    await contractCast.start();
  }
}
