import log from '@/services/log';
import { ContractCastType, PrismaClient, Prisma } from '@prisma/client';

import {
  SupportPlugInsMap,
  ContractCastEventProcessor,
  PlugInConstructor,
  ProcessorRuntime,
} from '@/types/processor';
import { ContractCast, ContractCastConstructor } from '../types';

/**
 * Main Event Indexer Service that
 */
export class ChainCastManager<C extends ContractCast> {
  private _casts: { [key: string]: C };
  private _db: PrismaClient;
  private _supportedProcessors: SupportPlugInsMap = {};
  private _creator: ContractCastConstructor<C>;

  constructor(creator: ContractCastConstructor<C>, db: PrismaClient) {
    this._casts = {};
    this._db = db;
    this._creator = creator;
  }

  getCasts(): ContractCast[] {
    return Object.values(this._casts);
  }

  async start() {
    const casts = await this._loadCastsFromDb();
    for (const cast of casts) {
      await this._setupCast(cast);
    }
  }
  async stop() {
    for (const cast of Object.values(this._casts)) {
      await cast.stop();
    }
  }

  async addCast(cast: {
    id: string;
    type: ContractCastType;
    address: string;
    chainId: number;
    blockNumber: number;
    transactionIndex: number;
    program: object | Prisma.JsonValue;
  }) {
    try {
      this._setupCast(cast);
    } catch (e: any) {
      log.e(`Failed to add chain cast ${cast.id} ${e.message} ${e.stack}`);
    }
  }

  async deleteCast(id: string) {
    if (this._casts[id]) {
      this._casts[id].stop();
      delete this._casts[id];
    }
  }

  registerProcessor<M extends ContractCastEventProcessor>(
    name: string,
    pConstructor: PlugInConstructor<M>
  ) {
    this._supportedProcessors[name] = pConstructor;
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

  private async  _setupCast(cast: {
    id: string;
    type: ContractCastType;
    address: string;
    chainId: number;
    blockNumber: number;
    transactionIndex: number;
    program: Prisma.JsonValue;
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
    const obj: ProcessorRuntime[] = JSON.parse(cast?.program?.toString() ?? '{}');
    await contractCast.loadProgram(obj);
    await contractCast.start();
  }
}
