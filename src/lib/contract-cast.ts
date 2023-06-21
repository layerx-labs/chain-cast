import { Web3Connection } from '@taikai/dappkit';
import { ContractEventListener, EventListenerHandler, Web3Event } from '@/types/events';
import log from '@/services/log';
import { ContractCastType } from '@prisma/client';
import { chainsSupported } from '@/constants/chains';
import { InstructionMap, Program } from '@/types/vm';
import { ContractCast } from '../types';
import db from '@/services/prisma';
import { ChainCastVirtualMachine } from '@/lib/vm';
import { ContractListenerFactory } from './contract-listener-factory';
import EVMContractListener from './contract-listener';
import { ModelFactory } from './model-factory';
import { EVMContractEventRetriever } from './contract-event-retriever';

/**
 * An implementation that creates a stream of events for an Ethereum Smart Contract
 */
export class EVMContractCast implements ContractCast, EventListenerHandler {
  private _id: string;
  private _type: ContractCastType;
  private _address: string;
  private _chainId: number;
  private _blockNumber: number;
  private _transactionIndex: number;
  private _listener: ContractEventListener | null = null;
  private _vm: ChainCastVirtualMachine<typeof this>;
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
    supportedProcessors: InstructionMap
  ) {
    this._id = id;
    this._type = type;
    this._address = address;
    this._chainId = chainId;
    this._blockNumber = blockNumber;
    this._transactionIndex = transactionIndex;
    this._vm = new ChainCastVirtualMachine(this, supportedProcessors);
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

  async loadProgram(program: Program) {
    this._vm.loadProgram(program);
  }

  /**
   * The start() function is an asynchronous function that initiates the Contract Cast.
   * It performs the following steps:
   *
   * Attempts to recover events by calling the _recoverEvents() function,
   * which presumably retrieves events related to the contract.
   * Waits for the event recovery process to complete before proceeding to the next step.
   * Starts listening to the contract and establishes a ubscription to contract events.
   * */
  async start() {
    log.d(`Starting the Contract Cast ${this._id}`);
    try {
      await this._recoverEvents();
      await this._startContractListening();
    } catch (e: Error | any) {
      log.e(`Failed to start Contract Cast ${this._id} ${e.message}  ${e.stack}`);
    }
  }
  /**
   *  Stops the cast and saves the next blocknumber to be processd on the
   *  next startup
   */
  async stop() {
    if (this._listener?.isListening()) {
      await this._listener.stopListening();
      const currentBlock = await this._web3Con.eth.getBlockNumber();
      const txCount = await this._web3Con.eth.getBlockTransactionCount(currentBlock);
      log.d(`Stopping the Contract Cast ${this._id}`);
      if (
        currentBlock == this._lastEventBlockNumber &&
        this._lastEventTransactionIndex &&
        txCount >= this._lastEventTransactionIndex + 1
      ) {
        await this._updateCastIndex(currentBlock, this._lastEventTransactionIndex + 1);
      } else {
        await this._updateCastIndex(currentBlock + 1);
      }
    }
  }

  async _updateCastIndex(blockNumber: number, transactionIndex?: number) {
    log.d(`Saving Chain Cast index on ${this.getId()} at ${blockNumber}:${transactionIndex ?? 0}`);
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
    log.d(
      `New Event ${event.event} goint to be executed by the program ` +
        `${event.blockNumber}:${event.transactionIndex}`
    );
    await this._vm.execute({ name: 'event', payload: event });
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

  private async _setupListener(type: ContractCastType) {
    const factory = new ContractListenerFactory();
    try {
      this._listener = factory.create(EVMContractListener, type, this._chainId, this._address);
      this._listener.setHandler(this);
      await this._listener.startListening();
    } catch (e: any) {
      log.e(
        `Failed to setup ${this._id} ${this._chainId} ${this._type} ` +
          `on ${this._address} - ${e.message}`
      );
    }
  }

  /**
   * Setup a contract listening for the different casts types supported
   */
  private async _startContractListening() {
    log.i(
      `Starting Consuming Events for stream ${this._id} ${this._chainId} ${this._type} ` +
        `on ${this._address}`
    );
    await this._setupListener(this._type);
  }

  async onEventRecoverProgress(blockNumber: number, txIndex: number): Promise<void> {
    await this._updateCastIndex(blockNumber, txIndex);
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
      const model = new ModelFactory().create(this._type, this._chainId, this._address);

      const retriever = new EVMContractEventRetriever(model);
      retriever.setHandler(this);
      await retriever.recover(fromBlock, fromTxIndex, currentBlock);
    }
  }
}
