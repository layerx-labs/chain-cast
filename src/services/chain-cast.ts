import { BountyToken, Model, NetworkRegistry, Network_v2, Web3Connection } from '@taikai/dappkit';
import { EventListener, Web3Event, EventListenerProcessor } from '@/types/events';
import log from '@/services/log';
import { ChainCastType } from '@prisma/client';
import ContractListener from './contract-listener';
import { chainsSupported } from '@/constants/chains';

export class DebugListenerProcessor implements EventListenerProcessor {
  onEvent<N extends string, T>(event: Web3Event<N, T>): void {
    console.log(`Event Received from ${event.event}`);
  }
  onError(error: Error): void {
    console.log(`Error on Listener`, error);
  }
  onEventChanged(changed: any): void {}
  onConnected(message: string): void {}
}

export class ChainCast {
  _id: string;
  _type: ChainCastType;
  _address: string;
  _chainId: number;
  _blockNumber: number;
  _listener: EventListener | null = null;

  constructor(
    id: string,
    type: ChainCastType,
    address: string,
    chainId: number,
    blockNumber: number
  ) {
    this._id = id;
    this._type = type;
    this._address = address;
    this._chainId = chainId;
    this._blockNumber = blockNumber;
  }

  async start() {
    await this._recoverEvents();
    await this._startRTWhispering();
  }

  async stop() {
    if (this._listener) {
      this._listener.stopListening();
    }
  }

  async _setupListener<M extends Model>(
    TCreator: new (web3Con: Web3Connection, address: string) => M
  ) {
    const [chain] = Object.values(chainsSupported).filter((chain) => chain.id == this._chainId);
    try {
      const listener: EventListener = new ContractListener(
        TCreator,
        chain.wsUrl,
        this._address,
        new DebugListenerProcessor()
      );
      this._listener = listener;
      await listener.startListening();
    } catch (e: any) {
      log.e(
        `Failed to setup ${this._id} ${this._chainId} ${this._type} ` +
          `on ${this._address} - ${e.message}`
      );
    }
  }

  async _startRTWhispering() {
    log.i(
      `Starting Consuming Events for stream ${this._id} ${this._chainId} ${this._type} ` +
        `on ${this._address}`
    );
    switch (this._type) {
      case ChainCastType.BEPRO_FACTORY:
        // Not Supported Yet
        break;
      case ChainCastType.BEPRO_NETWORK_V2:
        await this._setupListener(Network_v2);
        break;
      case ChainCastType.BEPRO_REGISTRY:
        await this._setupListener(NetworkRegistry);
        break;
      case ChainCastType.BEPRO_POP:
        await this._setupListener(BountyToken);
        break;
    }
  }

  async _recoverEvents() {
    const [chain] = Object.values(chainsSupported).filter((chain) => chain.id == this._chainId);
    const web3Con = new Web3Connection({
      debug: false,
      web3Host: chain.rpcUrl,
    });
    const currentBlock = await web3Con.eth.getBlockNumber();

    if (this._blockNumber <= currentBlock) {
      const fromBlock = this._blockNumber === 0 ? this._blockNumber : this._blockNumber + 1;
      log.i(
        `Starting  Recovering events stream ${this._id} ` +
          `from=[${fromBlock}] to=[${currentBlock}]`
      );
      switch (this._type) {
        case ChainCastType.BEPRO_FACTORY:
          // Not Supported Yet
          break;
        case ChainCastType.BEPRO_NETWORK_V2:
          await this._recoverContractEvents(web3Con, Network_v2, fromBlock, currentBlock);
          break;
        case ChainCastType.BEPRO_REGISTRY:
          await this._recoverContractEvents(web3Con, NetworkRegistry, fromBlock, currentBlock);
          break;
        case ChainCastType.BEPRO_POP:
          await this._recoverContractEvents(web3Con, BountyToken, fromBlock, currentBlock);
          break;
      }
    }
  }
  async _recoverContractEvents<M extends Model>(
    web3Con: Web3Connection,
    TCreator: new (web3Con: Web3Connection, address: string) => M,
    fromBlock: number,
    toBlock: number
  ) {
    const processor = new DebugListenerProcessor();
    let startBlock = fromBlock;
    do {
      const endBlock = Math.min(startBlock + 100, toBlock);
      log.d(`Finding Events stream=${this._id} ` + `from=[${startBlock}] to=[${endBlock}]`);
      const options = {
        fromBlock: startBlock,
        toBlock: endBlock,
      };
      const network = new TCreator(web3Con, this._address);
      const events = await network.contract.self.getPastEvents('allEvents', options);
      for (const event of events) {
        processor.onEvent(event);
      }
      startBlock = endBlock + 1;
    } while (startBlock <= toBlock);
  }
}
