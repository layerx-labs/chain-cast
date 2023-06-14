import { BountyToken, Model, NetworkRegistry, Network_v2, Web3Connection } from '@taikai/dappkit';
import {
  NetworkEventsEnum,
  RegistryEventsEnum,
  EventListener,
  POPEventsEnum,
  Web3Event,
  EventListenerProcessor,
} from '@/types/events';

import { chainsSupported } from '@/constants/chains';
import ContractListener from '@/services/contract-listener';
import log from '@/services/log';
import { ChainCastType, PrismaClient } from '@prisma/client';
import { set } from 'zod';

export class DebugListenerProcessor implements EventListenerProcessor {
  onEvent<N extends string, T>(event: Web3Event<N, T>): void {
    console.log(`Event Received from ${event.event}`);
  }
  onError(eventName: string, error: Error): void {
    console.log(`Error on Listener ${eventName}`, error);
  }
  onEventChanged(eventName: string, changed: any): void {}
  onConnected(eventName: string, message: string): void {}
}

/**
 * Main Event Indexer Service that
 */
export class EventWhisperer {
  _listeners: { [key: string]: EventListener };
  _db: PrismaClient;

  constructor(db: PrismaClient) {
    this._listeners = {};
    this._db = db;
  }

  async start() {
    const streams = await this._getStreams();
    for (const stream of streams) {
      await this._recoverEvents(stream);
      await this._startRTWhispering(stream);
    }
  }
  async stop() {
    const streams = await this._getStreams();
    for (const stream of streams) {
      if(this._listeners[stream.id]) {
        this._listeners[stream.id].stopListening();
      }
    }
  }

  async addStream(stream: {
    id: string;
    type: ChainCastType;
    address: string;
    chainId: number;
    blockNumber: number;
  }) {
    try {
      await this._recoverEvents(stream);
      await this._startRTWhispering(stream);
    } catch(e: any) {
      log.e(`Failed to add stream ${stream.id} ${e.message} ${e.stack}`);
    }
  }

  async deleteStream(id: string) {
    if(this._listeners[id]) {
      this._listeners[id].stopListening();
      delete this._listeners[id];
    }
  }

  async _recoverEvents(
    stream: {
      id: string;
      type: ChainCastType;
      address: string;
      chainId: number;
      blockNumber: number;
    }
  ) {
    const [chain] = Object.values(chainsSupported).filter((chain) => chain.id == stream.chainId);
    log.i(`Starting Recovering events for stream ${stream.id} ` + 
          `chainId=${stream.chainId} address=${stream.address} ${chain.rpcUrl}`);
    const web3Con = new Web3Connection({
      debug: false,
      web3Host: chain.rpcUrl,
    });
    const currentBlock = await web3Con.eth.getBlockNumber();
    log.i(`Starting Recovering events current block ${currentBlock}`);
    if (stream.blockNumber <= currentBlock) {
      const fromBlock = stream.blockNumber + 1;
      switch (stream.type) {
        case ChainCastType.BEPRO_FACTORY:
          // Not Supported Yet
          break;
        case ChainCastType.BEPRO_NETWORK_V2:
          await this._recoverContractEvents(web3Con, Network_v2, stream, fromBlock, currentBlock);
          break;
        case ChainCastType.BEPRO_REGISTRY:
          await this._recoverContractEvents(
            web3Con,
            NetworkRegistry,
            stream,
            fromBlock,
            currentBlock
          );
          break;
        case ChainCastType.BEPRO_POP:
          await this._recoverContractEvents(web3Con, BountyToken, stream, fromBlock, currentBlock);
          break;
      }
    }
  }

  async _recoverContractEvents<M extends Model>(
    web3Con: Web3Connection,
    TCreator: new (web3Con: Web3Connection, address: string) => M,
    stream: {
      type: ChainCastType;
      address: string;
      chainId: number;
    },
    fromBlock: number,
    toBlock: number
  ) {
    const processor = new DebugListenerProcessor();
    let startBlock = fromBlock;
    do {
      const endBlock = Math.min(startBlock + 100, toBlock);
      log.d(
        `Recovering Events ${stream.type}=[${stream.address}] ` +
          `from=[${startBlock}] to=[${endBlock}]`
      );
      const options = {
        fromBlock: startBlock,
        toBlock: endBlock,
      };
      const network = new TCreator(web3Con, stream.address);
      const events = await network.contract.self.getPastEvents('allEvents', options);
      for (const event of events) {
        processor.onEvent(event);
      }
      startBlock = endBlock + 1;
    } while (startBlock <= toBlock);
  }

  async _startRTWhispering(
    stream: {
      id: string;
      type: ChainCastType;
      address: string;
      chainId: number;
    }
  ) {
    const [chain] = Object.values(chainsSupported).filter((chain) => chain.id == stream.chainId);
    log.i(
      `Starting Consuming Events for stream ${chain.id} ${stream.id} ${stream.type} ` +
        `on ${stream.address}`
    );
    switch (stream.type) {
      case ChainCastType.BEPRO_FACTORY:
        // Not Supported Yet
        break;
      case ChainCastType.BEPRO_NETWORK_V2:
        await this._setupListener(
          Network_v2,
          stream.id,
          chain.wsUrl,
          stream.address,
          Object.values(NetworkEventsEnum)
        );
        break;
      case ChainCastType.BEPRO_REGISTRY:
        await this._setupListener(
          NetworkRegistry,
          stream.id,
          chain.wsUrl,
          stream.address,
          Object.values(RegistryEventsEnum)
        );
        break;
      case ChainCastType.BEPRO_POP:
        await this._setupListener(
          BountyToken,
          stream.id,
          chain.wsUrl,
          stream.address,
          Object.values(POPEventsEnum)
        );
        break;
    }
  }

  async _getStreams() {
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

  async _setupListener<M extends Model>(
    TCreator: new (web3Con: Web3Connection, address: string) => M,
    streamId: string,
    wsUrl: string,
    contractAddress: string,
    subscribeTo: string[]
  ) {
    const listener: EventListener = new ContractListener(
      TCreator,
      wsUrl,
      contractAddress,
      subscribeTo,
      new DebugListenerProcessor()
    );
    await listener.startListening();
    this._listeners[streamId] = listener;
  }
}
