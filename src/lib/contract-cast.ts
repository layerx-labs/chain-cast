/**
 * This file implements the EVMContractCast class which is responsible for managing
 * the lifecycle of Ethereum Virtual Machine (EVM) contract event streams.
 * It handles event recovery, listening, and processing for smart contracts.
 */

import { Web3Connection } from '@taikai/dappkit';
import { ContractEventListener, EventListenerHandler, Web3Event } from '@/types/events';
import log from '@/services/log';
import { ContractCastType, ContractCastStatus } from '@prisma/client';
import { chainsSupported } from '@/constants/chains';
import { InstructionMap, Program, VirtualMachine } from '@/types/vm';
import { CastInfo, ContractCast, SecretManager, SecretMap } from '../types';
import db from '@/services/prisma';
import { ContractListenerFactory } from './contract-listener-factory';
import EVMContractListener from './contract-listener';
import { ModelFactory } from './model-factory';
import { EVMContractEventRetriever } from './contract-event-retriever';
import { AbiItem } from 'web3-utils';

/**
 * EVMContractCast class implements the ContractCast interface and EventListenerHandler
 * to create a stream of events for an Ethereum Smart Contract.
 *
 * It manages:
 * - Contract event listening and recovery
 * - Event processing through a virtual machine
 * - State persistence across restarts
 * - Secret management for secure operations
 *
 * @template VM - Type of Virtual Machine used to execute event-triggered programs
 * @template T - Type of Secret Manager used to handle sensitive information
 */
export class EVMContractCast<VM extends VirtualMachine, T extends SecretManager>
  implements ContractCast, EventListenerHandler
{
  /** Unique identifier for this contract cast */
  private _id: string;
  /** Type of contract (e.g., CUSTOM, ERC20, etc.) */
  private _type: ContractCastType;
  /** Optional name for the contract cast */
  private _name: string | null;
  /** Ethereum contract address being monitored */
  private _address: string;
  /** Chain ID where the contract is deployed */
  private _chainId: number;
  /** Contract ABI (Application Binary Interface) */
  private _abi: AbiItem[] = [];
  /** Last processed block number */
  private _blockNumber: number;
  /** Last processed transaction index within the block */
  private _transactionIndex: number;
  /** Event listener for the contract */
  private _listener: ContractEventListener | null = null;
  /** Virtual machine to execute programs in response to events */
  private _vm: VM;
  /** Web3 connection to interact with the blockchain */
  private _web3Con: Web3Connection;
  /** Current status of the contract cast */
  private _status: ContractCastStatus = ContractCastStatus.IDLE;
  /** Manager for handling secrets needed by the contract cast */
  private _secretManager: T;

  /**
   * Creates a new EVMContractCast instance.
   *
   * @param creator - Constructor function for the secret manager
   * @param vmConstructor - Constructor function for the virtual machine
   * @param id - Unique identifier for this contract cast
   * @param type - Type of contract (CUSTOM, ERC20, etc.)
   * @param name - Optional name for the contract cast
   * @param address - Ethereum contract address to monitor
   * @param chainId - Chain ID where the contract is deployed
   * @param abi - Contract ABI encoded as a base64 string (for CUSTOM type)
   * @param blockNumber - Initial block number to start processing from
   * @param transactionIndex - Initial transaction index to start processing from
   * @param supportedProcessors - Map of supported instruction processors for the VM
   */
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

    // For CUSTOM contract types, decode the ABI from base64
    if (this._type === 'CUSTOM') {
      const decodedABI = Buffer.from(abi, 'base64').toString('ascii');
      this._abi = JSON.parse(decodedABI) as AbiItem[];
    }

    this._blockNumber = blockNumber;
    this._transactionIndex = transactionIndex;

    // Initialize the virtual machine with this cast as context
    this._vm = new vmConstructor(this, supportedProcessors);

    // Set up Web3 connection using the appropriate chain RPC URL
    const [chain] = Object.values(chainsSupported).filter((chain) => chain.id == this.getChainId());
    const web3Con = new Web3Connection({
      debug: false,
      web3Host: chain.rpcUrl,
    });
    this._web3Con = web3Con;

    // Initialize the secret manager
    this._secretManager = new creator();
  }

  /**
   * Loads secrets into the secret manager.
   *
   * @param secrets - Map of secret key-value pairs
   */
  async loadSecrets(secrets: SecretMap): Promise<void> {
    this._secretManager.addSecrets(secrets);
  }

  /**
   * Gets the secret manager instance.
   *
   * @returns The secret manager
   */
  getSecretsManager(): SecretManager {
    return this._secretManager;
  }

  /**
   * Gets the current status of the contract cast.
   *
   * @returns The current status enum value
   */
  getStatus(): ContractCastStatus {
    return this._status;
  }

  /**
   * Gets the unique identifier of this contract cast.
   *
   * @returns The ID string
   */
  getId() {
    return this._id;
  }

  /**
   * Gets the name of this contract cast.
   *
   * @returns The name or null if not set
   */
  getName() {
    return this._name;
  }

  /**
   * Gets the contract address being monitored.
   *
   * @returns The Ethereum address
   */
  getAddress() {
    return this._address;
  }

  /**
   * Gets the chain ID where the contract is deployed.
   *
   * @returns The chain ID number
   */
  getChainId() {
    return this._chainId;
  }

  /**
   * Gets the last processed block number.
   *
   * @returns The block number
   */
  getBlockNumber() {
    return this._blockNumber;
  }

  /**
   * Gets the last processed transaction index.
   *
   * @returns The transaction index
   */
  getTxIndex() {
    return this._transactionIndex;
  }

  /**
   * Loads a program into the virtual machine.
   *
   * @param program - The program to load
   */
  async loadProgram(program: Program) {
    this._vm.loadProgram(program);
  }

  async setStatus(status: ContractCastStatus) {
    this._status = status;
    await db.contractCast.update({
      where: {
        id: this._id,
      },
      data: {
        status: status,
      },
    });
  }



  /**
   * Starts the Contract Cast by recovering past events and setting up event listening.
   *
   * The process involves:
   * 1. Setting status to RECOVERING
   * 2. Recovering past events from the last processed block
   * 3. If not terminated, starting contract event listening
   * 4. Setting status to LISTENING when complete
   */
  async start() {
    log.d(`Starting the Contract Cast=[${this.getName()}]`);
    try {
      await this.setStatus(ContractCastStatus.RECOVERING);
      log.d(`Starting Recovering Cast=[${this.getName()}]`);

      await this._recoverEvents();
      log.d(`Stopping Recovering Cast=[${this.getName()}]`);
      if ((this.getStatus()) !== ContractCastStatus.TERMINATED) {
        await this._startContractListening();
        await this.setStatus(ContractCastStatus.LISTENING);
      }
    } catch (e: Error | any) {
      log.e(`Failed to start Contract Cast=[${this.getName()}] ${e.message}  ${e.stack}`);
    }
  }

  /**
   * Stops the contract cast and updates the block/transaction indices for the next startup.
   *
   * If the cast is in RECOVERING state, the recovery process will have already saved
   * the latest block position and transaction index.
   *
   * For other states, it calculates the appropriate next block/transaction to process
   * when the cast is restarted.
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
        if (this.getStatus() !== ContractCastStatus.RECOVERING) {
          const currentBlock = await this._web3Con.eth.getBlockNumber();
          const txCount = await this._web3Con.eth.getBlockTransactionCount(currentBlock);
          if (
            currentBlock == this.getBlockNumber() &&
            this.getTxIndex() &&
            txCount >= this.getTxIndex() + 1
          ) {
            await this._updateCastIndex(currentBlock, this.getTxIndex() + 1);
          } else {
            await this._updateCastIndex(currentBlock + 1);
          }
        }

      } catch (e: Error | any) {
        log.e(`Failed to stop Contract Cast=[${this.getName()}]${e.message}  ${e.stack}`);
      }
    } else {
      await this.setStatus(ContractCastStatus.TERMINATED);
    }
  }

  /**
   * Updates the block number and transaction index in both memory and database.
   *
   * First verifies if the cast still exists in the database before updating.
   *
   * @param blockNumber - The new block number to set
   * @param transactionIndex - The new transaction index to set (defaults to 0)
   */
  async _updateCastIndex(blockNumber: number, transactionIndex?: number) {
    // Verify if the cast was deleted
    const cast = await db.contractCast.findUnique({
      where: {
        id: this._id,
      },
    });
    if (!cast) {
      log.i(`Cast=[${this.getName()}] not found`);
      return;
    }
    this._blockNumber = blockNumber;
    this._transactionIndex = transactionIndex ?? 0;
    log.d(
      `Cast Name=[${this.getName()}] at Block=[${this.getBlockNumber()}:${transactionIndex ?? 0}]`
    );
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
   * Checks if the contract cast should stop processing.
   *
   * @returns True if the status is TERMINATED, false otherwise
   */
  shouldStop(): boolean {
    return this.getStatus() === ContractCastStatus.TERMINATED;
  }

  /**
   * Handles a new contract event by executing the associated program in the VM.
   *
   * Sets up the VM context with cast information and secrets before execution.
   * Updates the block number and transaction index after processing.
   *
   * @param event - The blockchain event to process
   */
  async onEvent<N extends string, T>(event: Web3Event<N, T>) {
    log.d(
      `New Event ${event.event} goint to be executed by the program ` +
        `${event.blockNumber}:${event.transactionIndex}`
    );
    // Set cast information as a global variable in the VM
    this._vm.setGlobalVariable('cast', {
      id: this.getId(),
      chainId: this.getChainId(),
      address: this.getAddress(),
    });
    // Make secrets available to the VM
    this._setSecretsOnVM();
    // Execute the program with the event
    await this._vm.execute({ name: 'event', payload: event });
    // Update tracking information
    this._blockNumber = event.blockNumber;
    this._transactionIndex = event.transactionIndex;
  }

  /**
   * Handles event change notifications from the blockchain.
   *
   * @param changed - Information about the changed event
   */
  onEventChanged(changed: any): void {
    log.d(`Event Changed on Cast=[${this.getName()}] ${changed}`);
  }

  /**
   * Handles connection notifications from the event emitter.
   *
   * @param message - Connection message
   */
  onConnected(message: string): void {
    log.d(`Event Emitter Connected Cast=[${this.getName()}] ${message}`);
  }

  /**
   * Handles errors from the event listener.
   *
   * @param error - The error that occurred
   */
  onError(error: Error) {
    log.e(
      `Error listening on Cast=[${this.getName()}] ${error.message} ${this._type} `,
      error.stack
    );
  }

  /**
   * Sets up the contract event listener for the specified contract type.
   *
   * @param type - The contract type to set up the listener for
   */
  private async _setupListener(type: ContractCastType) {
    const factory = new ContractListenerFactory();
    try {
      // Create the appropriate listener for this contract type
      this._listener = factory.create(
        EVMContractListener,
        type,
        this._chainId,
        this._address,
        this._abi,
        this._name
      );
      // Set this cast as the event handler
      this._listener.setHandler(this);
      // Start listening from the minimum of current block and last processed block
      const fromBlock = Math.min(this.getBlockNumber(), await this._web3Con.eth.getBlockNumber());
      await this._listener.startListening(fromBlock);
    } catch (e: any) {
      log.e(
        `Failed to setup Cast=[${this.getName()}] ${this._type} ` +
          `on ${this.getAddress()} - ${e.message}`
      );
    }
  }

  /**
   * Starts listening for contract events.
   * Sets up the appropriate listener based on contract type.
   */
  private async _startContractListening() {
    log.i(
      `Starting Consuming Events for Cast=[${this.getName()}] ${this._type} ` +
        `on ${this._address}`
    );
    await this._setupListener(this._type);
  }

  /**
   * Callback for event recovery progress updates.
   * Updates the cast index in the database to track recovery progress.
   *
   * @param blockNumber - Current block being processed
   * @param txIndex - Current transaction index being processed
   */
  async onEventRecoverProgress(blockNumber: number, txIndex: number): Promise<void> {
    await this._updateCastIndex(blockNumber, txIndex);
  }

  /**
   * Recovers past events from the blockchain that occurred since the last processed block.
   *
   * Creates a model for the contract, sets up an event retriever, and processes
   * all events from the last known position to the current block.
   */
  private async _recoverEvents() {
    const currentBlock = await this._web3Con.eth.getBlockNumber();
    if (this.getBlockNumber() <= currentBlock) {
      const fromBlock = this.getBlockNumber();
      const fromTxIndex = this._transactionIndex;
      log.i(
        `Starting Recovering events Cast=[${this.getName()}] ` +
          `from=[${fromBlock}] txIndex=[${fromTxIndex}] to=[${currentBlock}]`
      );
      // Create a model for this contract type
      const model = new ModelFactory().create(
        this._type,
        this.getChainId(),
        this.getAddress(),
        this._abi
      );
      await model.loadAbi();
      // Set up the event retriever
      const retriever = new EVMContractEventRetriever(model);
      retriever.setHandler(this);
      // Recover events from the last known position to the current block
      await retriever.recover(fromBlock, fromTxIndex, currentBlock);
    }
  }

  /**
   * Sets all secrets from the secret manager as global variables in the VM.
   * This makes them available to programs executing in response to events.
   */
  private _setSecretsOnVM() {
    const secrets = this._secretManager.getSecrets();
    Object.keys(secrets).forEach((key) => {
      this._vm.setGlobalVariable(key, secrets[key]);
    });
  }
}
