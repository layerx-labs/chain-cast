import log from '@/services/log';
import { ContractCastType, PrismaClient } from '@prisma/client';
import { ContractCast } from './contract-cast';
import { ContractCastEventProcessor, PlugInConstructor, SupportPlugInsMap } from '@/types/events';

/**
 * Main Event Indexer Service that
 */
export class EventWhisperer {
  _casts: { [key: string]: ContractCast };
  _db: PrismaClient;
  _supportedProcessors: SupportPlugInsMap = {};

  constructor(db: PrismaClient) {
    this._casts = {};
    this._db = db;
  }

  async start() {
    const casts = await this._getCasts();
    for (const cast of casts) {
      this.setupCast(cast);
    }
  }
  async stop() {
    const casts = await this._getCasts();
    for (const cast of casts) {
      if (this._casts[cast.id]) {
        this._casts[cast.id].stop();
      }
    }
  }

  async addCast(cast: {
    id: string;
    type: ContractCastType;
    address: string;
    chainId: number;
    blockNumber: number;
  }) {
    try {
      this.setupCast(cast);
    } catch (e: any) {
      log.e(`Failed to add chain cast ${cast.id} ${e.message} ${e.stack}`);
    }
  }

  private setupCast(cast: {
    id: string;
    type: ContractCastType;
    address: string;
    chainId: number;
    blockNumber: number;
  }) {
    const contractCast: ContractCast = new ContractCast(
      cast.id,
      cast.type,
      cast.address,
      cast.chainId,
      cast.blockNumber,
      this._supportedProcessors,
    );
    this._casts[cast.id] = contractCast;
    contractCast.loadProgram([{
      name: 'logger',
    },{
      name: 'webhook',
      configuration: {
        url: {
          type: 'string',
          required: true,
          value: 'https://webhook.site/06218e87-7b2e-48c8-a467-746c1b031d17'
        }
      },
    }])
    contractCast.start();
  }

  async deleteCast(id: string) {
    if (this._casts[id]) {
      this._casts[id].stop();
      delete this._casts[id];
    }
  }

  async _getCasts() {
    return await this._db.contractCast.findMany({
      select: {
        id: true,
        type: true,
        address: true,
        chainId: true,
        blockNumber: true,
      },
    });
  }

  registerProcessor<M extends ContractCastEventProcessor>(
    name: string,
    pConstructor: PlugInConstructor<M>
  ) {
    this._supportedProcessors[name] = pConstructor;
  }
}
