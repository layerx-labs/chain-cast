

import log from '@/services/log';
import { ChainCastType, PrismaClient } from '@prisma/client';
import { ChainCast } from './chain-cast';

/**
 * Main Event Indexer Service that
 */
export class EventWhisperer {
  
  _casts: { [key: string]: ChainCast };
  _db: PrismaClient;

  constructor(db: PrismaClient) {
    this._casts = {};
    this._db = db;
  }

  async start() {
    const casts = await this._getCasts();
    for (const cast of casts) {
      const chainCast: ChainCast = new ChainCast(
        cast.id,
        cast.type,
        cast.address,
        cast.chainId,
        cast.blockNumber,
      );
      this._casts[cast.id] = chainCast;
      chainCast.start();
    }
  }
  async stop() {
    const casts = await this._getCasts();
    for (const cast of casts) {
      if(this._casts[cast.id]) {
        this._casts[cast.id].stop();
      }
    }
  }

  async addCast(cast: {
    id: string;
    type: ChainCastType;
    address: string;
    chainId: number;
    blockNumber: number;
  }) {
    try {
      const chainCast: ChainCast = new ChainCast(
        cast.id,
        cast.type,
        cast.address,
        cast.chainId,
        cast.blockNumber,
      );
      this._casts[cast.id] = chainCast;
      chainCast.start();
    } catch(e: any) {
      log.e(`Failed to add chain cast ${cast.id} ${e.message} ${e.stack}`);
    }
  }

  async deleteCast(id: string) {
    if(this._casts[id]) {
      this._casts[id].stop();
      delete this._casts[id];
    }
  }

  async _getCasts() {
    return await this._db.chainCast.findMany({
      select: {
        id: true,
        type: true,
        address: true,
        chainId: true,
        blockNumber: true,
      },
    });
  }
}
