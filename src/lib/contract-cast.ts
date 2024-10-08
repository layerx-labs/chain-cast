import { Web3Connection } from '@taikai/dappkit';
import { ContractEventListener, EventListenerHandler, Web3Event } from '@/types/events';
import log from '@/services/log';
import { ContractCastType } from '@prisma/client';
import { chainsSupported } from '@/constants/chains';
import { InstructionMap, Program, VirtualMachine } from '@/types/vm';
import { CastInfo, ContractCast, ContractCastStatusEnum, SecretManager, SecretMap } from '../types';
import db from '@/services/prisma';
import { ContractListenerFactory } from './contract-listener-factory';
import EVMContractListener from './contract-listener';
import { ModelFactory } from './model-factory';
import { EVMContractEventRetriever } from './contract-event-retriever';
import { AbiItem } from 'web3-utils';
/**
 * An implementation that creates a stream of events for an Ethereum Smart Contract
 */
export class EVMContractCast<VM extends VirtualMachine, T extends SecretManager>
  implements ContractCast, EventListenerHandler
{
  private _id: string;
  private _type: ContractCastType;
  private _name: string | null;
  private _address: string;
  private _chainId: number;
  private _abi: AbiItem[] = [];
  private _blockNumber: number;
  private _transactionIndex: number;
  private _listener: ContractEventListener | null = null;
  private _vm: VM;
  private _web3Con: Web3Connection;
  private _status: ContractCastStatusEnum = ContractCastStatusEnum.IDLE;
  private _secretManager: T;

  constructor(
    creator: new () => T,
    vmConstructor: new (info: CastInfo, supportedInstructions: InstructionMap) => VM,
    id: string,
    type: ContractCastType,
    name: string | null,
    address: string,
    chainId: number,
    abi: string,
    blockNumber: number,
    transactionIndex: number,
    supportedProcessors: InstructionMap
  ) {
    this._id = id;
    this._type = type;
    this._name = name;
    this._address = address;
    this._chainId = chainId;

    if (this._type === 'CUSTOM') {
      const decodedABI = Buffer.from(abi, 'base64').toString('ascii');
      this._abi = JSON.parse(decodedABI) as AbiItem[];
    }
    this._blockNumber = blockNumber;
    this._transactionIndex = transactionIndex;
    this._vm = new vmConstructor(this, supportedProcessors);
    const [chain] = Object.values(chainsSupported).filter((chain) => chain.id == this._chainId);
    const web3Con = new Web3Connection({
      debug: false,
      web3Host: chain.rpcUrl,
    });
    this._web3Con = web3Con;
    this._secretManager = new creator();
  }

  async loadSecrets(secrets: SecretMap): Promise<void> {
    this._secretManager.addSecrets(secrets);
  }

  getSecretsManager(): SecretManager {
    return this._secretManager;
  }

  getStatus(): ContractCastStatusEnum {
    return this._status;
  }

  getId() {
    return this._id;
  }

  getName() {
    return this._name;
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
    log.d(`Starting the Contract Cast=[${this.getName()}]`);
    try {
      this._status = ContractCastStatusEnum.RECOVERING;
      log.d(`Starting Recovering Cast=[${this.getName()}]`);

      await this._recoverEvents();
      log.d(`Stopping Recovering Cast=[${this.getName()}]`);
      if ((this._status as number) !== ContractCastStatusEnum.TERMINATED) {
        await this._startContractListening();
        this._status = ContractCastStatusEnum.LISTENING;
      }
    } catch (e: Error | any) {
      log.e(`Failed to start Contract Cast=[${this.getName()}] ${e.message}  ${e.stack}`);
    }
  }
  /**
   *  Stops the cast and saves the next blocknumber to be processd on the
   *  next startup
   */
  async stop() {
    if (this._listener?.isListening()) {
      try {
        await this._listener.stopListening();
        log.d(`Stopping the Contract Cast=[${this.getName()}]`);
        /**
         * If the Cast is in recovery state the recover process will save the
         * latest block position and transaction Index;
         * */
        if (this._status !== ContractCastStatusEnum.RECOVERING) {
          const currentBlock = await this._web3Con.eth.getBlockNumber();
          const txCount = await this._web3Con.eth.getBlockTransactionCount(currentBlock);
          if (
            currentBlock == this.getBlockNumber() &&
            this._transactionIndex &&
            txCount >= this._transactionIndex + 1
          ) {
            await this._updateCastIndex(currentBlock, this._transactionIndex + 1);
          } else {
            await this._updateCastIndex(currentBlock + 1);
          }
        }
        this._status = ContractCastStatusEnum.TERMINATED;
      } catch (e: Error | any) {
        log.e(`Failed to stop Contract Cast=[${this.getName()}]${e.message}  ${e.stack}`);
      }
    }
  }

  async _updateCastIndex(blockNumber: number, transactionIndex?: number) {
    this._blockNumber = blockNumber;
    this._transactionIndex = transactionIndex ?? 0;
    log.d(`Cast Name=[${this.getName()}] at Block=[${this.getBlockNumber()}:${transactionIndex ?? 0}]`);
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

  shouldStop(): boolean {
    return this._status === ContractCastStatusEnum.TERMINATED;
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
    this._vm.setGlobalVariable('cast', {
      id: this.getId(),
      chainId: this.getChainId(),
      address: this.getAddress(),
    });
    this._setSecretsOnVM();
    await this._vm.execute({ name: 'event', payload: event });
    this._blockNumber = event.blockNumber;
    this._transactionIndex = event.transactionIndex;
  }

  onEventChanged(changed: any): void {
    log.d(`Event Changed on Cast=[${this.getName()}] ${changed}`);
  }
  onConnected(message: string): void {
    log.d(`Event Emitter Connected Cast=[${this.getName()}] ${message}`);
  }

  onError(error: Error) {
    log.e(`Error listening on Cast=[${this.getName()}] ${error.message} ${this._type} `, error.stack);
  }

  private async _setupListener(type: ContractCastType) {
    const factory = new ContractListenerFactory();
    try {
      this._listener = factory.create(
        EVMContractListener,
        type,
        this._chainId,
        this._address,
        this._abi,
        this._name
      );
      this._listener.setHandler(this);
      await this._listener.startListening(this.getBlockNumber());
    } catch (e: any) {
      log.e(
        `Failed to setup Cast=[${this.getName()}] ${this._type} ` +
          `on ${this._address} - ${e.message}`
      );
    }
  }

  /**
   * Setup a contract listening for the different casts types supported
   */
  private async _startContractListening() {
    log.i(
      `Starting Consuming Events for Cast=[${this.getName()}] ${this._type} ` +
        `on ${this._address}`
    );
    await this._setupListener(this._type);
  }

  async onEventRecoverProgress(blockNumber: number, txIndex: number): Promise<void> {
    await this._updateCastIndex(blockNumber, txIndex);
  }

  private async _recoverEvents() {
    const currentBlock = await this._web3Con.eth.getBlockNumber();
    if (this.getBlockNumber() <= currentBlock) {
      const fromBlock = this.getBlockNumber();
      const fromTxIndex = this._transactionIndex;
      log.i(
        `Starting Recovering events Cast=[${this.getName()}] ` +
          `from=[${fromBlock}] txIndex=[${fromTxIndex}] to=[${currentBlock}]`
      );
      const model = new ModelFactory().create(this._type, this._chainId, this._address, this._abi);
      await model.loadAbi();
      const retriever = new EVMContractEventRetriever(model);
      retriever.setHandler(this);
      await retriever.recover(fromBlock, fromTxIndex, currentBlock);
    }
  }
  private _setSecretsOnVM() {
    const secrets = this._secretManager.getSecrets();
    Object.keys(secrets).forEach((key) => {
      this._vm.setGlobalVariable(key, secrets[key]);
    });
  }
}
