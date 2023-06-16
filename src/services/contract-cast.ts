import {
  BountyToken,
  ERC1155Standard,
  ERC20,
  Erc721Standard,
  Model,
  NetworkRegistry,
  Network_v2,
  Web3Connection,
} from '@taikai/dappkit';
import { ContractEventListener, EventListenerHandler, Web3Event } from '@/types/events';
import log from '@/services/log';
import { ContractCastType } from '@prisma/client';
import EVMContractListener from './contract-listener';
import { chainsSupported } from '@/constants/chains';
import { ContractCastProgram } from './program';
import { SupportPlugInsMap, ProcessorRuntime } from '@/types/processor';
import { ContractCast } from '../types';
import db from '@/services/prisma';
/**
 *
 */
export class EVMContractCast implements ContractCast, EventListenerHandler {
  private _id: string;
  private _type: ContractCastType;
  private _address: string;
  private _chainId: number;
  private _blockNumber: number;
  private _transactionIndex: number;
  private _listener: ContractEventListener | null = null;
  private _program: ContractCastProgram<typeof this>;
  private _web3Con: Web3Connection;
  private _lastEventBlockNumber = -1;
  private _lastEventTransactionIndex = -1;

  constructor(
    id: string,
    type: ContractCastType,
    address: string,
    chainId: number,
    blockNumber: number,
    transactionIndex: number,
    supportedProcessors: SupportPlugInsMap
  ) {
    this._id = id;
    this._type = type;
    this._address = address;
    this._chainId = chainId;
    this._blockNumber = blockNumber;
    this._transactionIndex = transactionIndex;
    this._program = new ContractCastProgram(this, supportedProcessors);
    const [chain] = Object.values(chainsSupported).filter((chain) => chain.id == this._chainId);
    const web3Con = new Web3Connection({
      debug: false,
      web3Host: chain.rpcUrl,
    });
    this._web3Con = web3Con;
  }

  getId() {
    return this._id;
  }

  getAddress() {
    return this._address;
  }

  getChainId() {
    return this._chainId;
  }

  getBlockNumber() {
    return this._blockNumber;
  }

  getTxIndex() {
    return this._transactionIndex;
  }

  async loadProgram(program: ProcessorRuntime[]) {
    this._program.loadProgram(program);
  }

  async start() {
    log.d(`St the Contract Cast ${this._id}`);
    await this._recoverEvents();
    await this._startRTWhispering();
  }

  async stop() {
    if (this._listener?.isListening()) {
      await this._listener.stopListening();
      const currentBlock = await this._web3Con.eth.getBlockNumber();
      const txCount = await this._web3Con.eth.getBlockTransactionCount(currentBlock);
      log.d(`Stopping the Contract Cast ${this._id}`);
      if (
        currentBlock == this._lastEventBlockNumber &&
        this._lastEventTransactionIndex &&
        (txCount) >= this._lastEventTransactionIndex + 1
      ) {        
        await this._updateCastIndex(currentBlock, this._lastEventTransactionIndex + 1);
      } else {
        await this._updateCastIndex(currentBlock + 1);
      }
    }
  }

  async _updateCastIndex(blockNumber: number, transactionIndex?: number) {
    log.d(`Saving Chain Cast index on ${this.getId()} at ${blockNumber}:${transactionIndex ?? 0}` );
    await db.contractCast.update({
      where: {
        id: this._id,
      },
      data: {
        blockNumber: blockNumber,
        transactionIndex: transactionIndex ?? 0,
      },
    });
  }

  /**
   *
   * @param event
   */
  async onEvent<N extends string, T>(event: Web3Event<N, T>) {
    log.d(`New Event ${event.event} goint to be executed by the program ` + 
          `${event.blockNumber}:${event.transactionIndex}`);
    await this._program.execute(event);
    this._lastEventBlockNumber = event.blockNumber;
    this._lastEventTransactionIndex = event.transactionIndex;
  }

  onEventChanged(changed: any): void {
    log.d(`Event Changed on cast ${this._id} ${changed}`);
  }
  onConnected(message: string): void {
    log.d(`Event Emmiter Connected cast ${this._id} ${message}`);
  }

  onError(error: Error) {
    log.e(`Error listening on cast ${this._id} ${error.message} ${this._type} `, error.stack);
  }

  private async _setupListener<M extends Model>(
    TCreator: new (web3Con: Web3Connection, address: string) => M
  ) {
    const [chain] = Object.values(chainsSupported).filter((chain) => chain.id == this._chainId);
    try {
      const listener: ContractEventListener = new EVMContractListener(
        TCreator,
        chain.wsUrl,
        this._address,
        this
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

  private async _startRTWhispering() {
    log.i(
      `Starting Consuming Events for stream ${this._id} ${this._chainId} ${this._type} ` +
        `on ${this._address}`
    );
    switch (this._type) {
      case ContractCastType.BEPRO_FACTORY:
        // Not Supported Yet
        break;
      case ContractCastType.BEPRO_NETWORK_V2:
        await this._setupListener(Network_v2);
        break;
      case ContractCastType.BEPRO_REGISTRY:
        await this._setupListener(NetworkRegistry);
        break;
      case ContractCastType.BEPRO_POP:
        await this._setupListener(BountyToken);
        break;
      case ContractCastType.ERC20:
        await this._setupListener(ERC20);
        break;
      case ContractCastType.ERC721:
        await this._setupListener(Erc721Standard);
        break;
      case ContractCastType.ERC1155:
        await this._setupListener(ERC1155Standard);
        break;
    }
  }

  private async _recoverEvents() {
    const currentBlock = await this._web3Con.eth.getBlockNumber();

    if (this._blockNumber < currentBlock) {
      const fromBlock = this._blockNumber;
      const fromTxIndex = this._transactionIndex;
      log.i(
        `Starting Recovering events stream ${this._id} ` +
          `from=[${fromBlock}] txIndex=[${fromTxIndex}] to=[${currentBlock}]`
      );
      switch (this._type) {
        case ContractCastType.BEPRO_FACTORY:
          // Not Supported Yet
          break;
        case ContractCastType.BEPRO_NETWORK_V2:
          await this._recoverContractEvents(
            this._web3Con,
            Network_v2,
            fromBlock,
            fromTxIndex,
            currentBlock
          );
          break;
        case ContractCastType.BEPRO_REGISTRY:
          await this._recoverContractEvents(
            this._web3Con,
            NetworkRegistry,
            fromBlock,
            fromTxIndex,
            currentBlock
          );
          break;
        case ContractCastType.BEPRO_POP:
          await this._recoverContractEvents(
            this._web3Con,
            BountyToken,
            fromBlock,
            fromTxIndex,
            currentBlock
          );
          break;
        case ContractCastType.ERC20:
          await this._recoverContractEvents(
            this._web3Con,
            ERC20,
            fromBlock,
            fromTxIndex,
            currentBlock
          );
          break;
        case ContractCastType.ERC721:
          await this._recoverContractEvents(
            this._web3Con,
            Erc721Standard,
            fromBlock,
            fromTxIndex,
            currentBlock
          );
          break;
        case ContractCastType.ERC1155:
          await this._recoverContractEvents(
            this._web3Con,
            ERC1155Standard,
            fromBlock,
            fromTxIndex,
            currentBlock
          );
          break;
      }
    }
  }

  private async _recoverContractEvents<M extends Model>(
    web3Con: Web3Connection,
    TCreator: new (web3Con: Web3Connection, address: string) => M,
    fromBlock: number,
    fromTxIndex: number,
    toBlock: number
  ) {
    let startBlock = fromBlock;
    do {
      const endBlock = Math.min(startBlock + 100, toBlock);
      log.d(`Finding Events stream=${this._id} ` + `from=[${startBlock}] ` + 
            `fromIndex=[${fromTxIndex}] to=[${endBlock}]`);
      const options = {
        fromBlock: startBlock,
        toBlock: endBlock,
      };
      const network = new TCreator(web3Con, this._address);
      const events = await network.contract.self.getPastEvents('allEvents', options);
      for (const event of events) {
        if (!(event.blockNumber == fromBlock && event.transactionIndex < fromTxIndex)) {
          this.onEvent(event);
        } else {
          log.d(`Skipping event ${event.blockNumber} and ${event.transactionIndex} on ${this._id}`);
        }
      }
      startBlock = endBlock + 1;
      await this._updateCastIndex(startBlock, 0);
    } while (startBlock <= toBlock);
  }
}
