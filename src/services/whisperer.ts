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
import { AppContext, ChainParams } from '@/types/index';
import log from '@/services/log';
import { BeproChainCastType } from '@prisma/client';



export class DebugListenerProcessor implements EventListenerProcessor {
    onEvent<N extends string, T>(event: Web3Event<N, T>): void {
        console.log(`Event Received from ${event.event}`);
    }
    onError(eventName: string, error: Error): void {
        console.log(`Error on Listener ${eventName}`,error);
    }
    onEventChanged(eventName: string, changed: any): void {}
    onConnected(eventName: string, message: string): void {}
  }


/**
 * Main Event Indexer Service that
 */
export class EventWhisperer {
  
  _listeners: { [key: string]: EventListener };
  _ctx: AppContext;

  constructor(ctx: AppContext) {
    this._listeners = {};
    this._ctx = ctx;
  }

  async start() {
    const streams = await this._getStreams();
    for (const stream of streams) {
      const [chain] = Object.values(chainsSupported).filter((chain) => chain.id == stream.chainId);
      await this.recoverEvents(chain, stream);
      await this.startRTWhispering(chain, stream);
    }
  }

  async recoverEvents(
    chain: ChainParams,
    stream: {
      id: string;
      type: BeproChainCastType;
      address: string;
      chainId: number;
      blockNumber: number;
    }
  ) {
    const web3Con = new Web3Connection({
      debug: false,
      web3Host: chain.rpcUrl,
    });
    const currentBlock = await web3Con.eth.getBlockNumber();
    if (stream.blockNumber <= currentBlock) {
      const fromBlock = stream.blockNumber + 1;
      switch (stream.type) {
        case BeproChainCastType.BEPRO_FACTORY:
          // Not Supported Yet
          break;
        case BeproChainCastType.BEPRO_NETWORK_V2:
          await this.recoverContractEvents(web3Con, Network_v2, stream, fromBlock, currentBlock);
          break;
        case BeproChainCastType.BEPRO_REGISTRY:
          await this.recoverContractEvents(
            web3Con,
            NetworkRegistry,
            stream,
            fromBlock,
            currentBlock
          );
          break;
        case BeproChainCastType.BEPRO_POP:
          await this.recoverContractEvents(web3Con, BountyToken, stream, fromBlock, currentBlock);
          break;
      }
    }
  }

  async recoverContractEvents<M extends Model>(
    web3Con: Web3Connection,
    TCreator: new (web3Con: Web3Connection, address: string) => M,
    stream: {
      type: BeproChainCastType;
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

  async startRTWhispering(
    chain: ChainParams,
    stream: {
      id: string;
      type: BeproChainCastType;
      address: string;
      chainId: number;
    }
  ) {
    log.i(
      `Starting Consuming Events for stream ${chain.id} ${stream.id} ${stream.type} ` +
        `on ${stream.address}`
    );
    switch (stream.type) {
      case BeproChainCastType.BEPRO_FACTORY:
        // Not Supported Yet
        break;
      case BeproChainCastType.BEPRO_NETWORK_V2:
        await this._setupListener(
          Network_v2,
          stream.id,
          chain.wsUrl,
          stream.address,
          Object.values(NetworkEventsEnum)
        );
        break;
      case BeproChainCastType.BEPRO_REGISTRY:
        await this._setupListener(
          NetworkRegistry,
          stream.id,
          chain.wsUrl,
          stream.address,
          Object.values(RegistryEventsEnum)
        );
        break;
      case BeproChainCastType.BEPRO_POP:
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
    return await this._ctx.db.beproChainCast.findMany({
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
