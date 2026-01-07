import type { Abi, PublicClient, Transport, Chain, WatchContractEventReturnType } from 'viem';
import {
  type ContractEventListener,
  type EventListenerHandler,
  viemLogToWeb3Event,
  type ViemDecodedLog,
} from '@/types/events';
import log from '@/services/log';
import { createWebSocketClient, createHttpClient } from './viem-client';

/**
 * Configuration for creating an EVMContractListener instance.
 */
export type ContractListenerConfig = {
  /** The blockchain network ID */
  chainId: number;
  /** The contract address to listen to */
  address: `0x${string}`;
  /** The contract ABI */
  abi: Abi;
  /** Optional name identifier for this listener */
  name?: string | null;
};

/**
 * EVMContractListener listens for events on an EVM-compatible contract using viem
 * and forwards them to an EventListenerHandler.
 *
 * This class provides event listening mechanism for blockchain contracts using
 * viem's watchContractEvent. It supports both WebSocket and HTTP polling modes,
 * falling back to polling if WebSocket is unavailable.
 *
 * The listener supports:
 * - WebSocket connection with automatic reconnection
 * - HTTP polling fallback
 * - Event filtering and forwarding
 * - Connection status monitoring
 * - Error handling and logging
 */
export class EVMContractListener implements ContractEventListener {
  /** The viem public client for blockchain interactions */
  private _client: PublicClient<Transport, Chain>;
  /** The contract address to listen to */
  private _address: `0x${string}`;
  /** The contract ABI for decoding events */
  private _abi: Abi;
  /** The chain ID */
  private _chainId: number;
  /** Flag indicating if the listener is currently active */
  private _isListening = false;
  /** Handler that receives forwarded events */
  private _handler: EventListenerHandler | null = null;
  /** Function to stop watching events (cleanup) */
  private _unwatch: WatchContractEventReturnType | null = null;
  /** Optional name identifier for this listener */
  private _name: string | null;
  /** List of event names being watched */
  private _eventNames: string[] = [];

  /**
   * Creates a new EVMContractListener instance.
   *
   * @param config - Configuration for the listener
   */
  constructor(config: ContractListenerConfig) {
    this._chainId = config.chainId;
    this._address = config.address;
    this._abi = config.abi;
    this._name = config.name ?? null;

    // Try to create a WebSocket client for real-time events
    // Falls back to HTTP client if WebSocket is not available
    try {
      this._client = createWebSocketClient(config.chainId);
    } catch (_error) {
      log.d(`WebSocket not available for chain ${config.chainId}, using HTTP polling`);
      this._client = createHttpClient(config.chainId);
    }

    // Extract event names from ABI for tracking
    this._eventNames = this._abi
      .filter((item) => 'type' in item && item.type === 'event' && 'name' in item)
      .map((item) => (item as { name: string }).name);
  }

  /**
   * Gets the list of events this listener is currently monitoring.
   *
   * @returns Array of event names being listened to
   */
  getEvents(): string[] {
    return this._eventNames;
  }

  /**
   * Checks if the listener is currently active and listening for events.
   *
   * @returns True if the listener is active, false otherwise
   */
  isListening(): boolean {
    return this._isListening;
  }

  /**
   * Sets the event handler that will receive forwarded events.
   *
   * @param handler - The handler that implements EventListenerHandler interface
   */
  setHandler(handler: EventListenerHandler): void {
    this._handler = handler;
  }

  /**
   * Gets the name identifier for this listener.
   *
   * @returns The listener name, or null if not set
   */
  getName(): string | null {
    return this._name;
  }

  /**
   * Starts listening for contract events from a specified block number.
   *
   * This method sets up the viem watchContractEvent to listen for all
   * events defined in the contract ABI. Events are forwarded to the
   * registered handler after conversion to the Web3Event format.
   *
   * @param blockNumber - The block number to start listening from
   */
  async startListening(blockNumber: number): Promise<void> {
    if (!this.isListening() && this._handler) {
      log.d(`Listening for events on Cast=[${this.getName()}] from Block=[${blockNumber}]`);

      // Notify handler of connection
      this._handler.onConnected(`Connected to ${this._chainId} for ${this._address}`);

      // Set up the event watcher using viem
      this._unwatch = this._client.watchContractEvent({
        address: this._address,
        abi: this._abi,
        fromBlock: BigInt(blockNumber),
        onLogs: (logs: ViemDecodedLog[]) => {
          // Process each log and forward to handler
          for (const logItem of logs) {
            try {
              const web3Event = viemLogToWeb3Event(logItem);
              this._handler?.onEvent(web3Event);
            } catch (error) {
              log.e(`Error processing event: ${error}`);
              this._handler?.onError(error as Error);
            }
          }
        },
        onError: (error: Error) => {
          log.e(`Error in event watcher for Cast=[${this.getName()}]: ${error.message}`);
          this._handler?.onError(error);
        },
        // Poll every 2 seconds if using HTTP transport
        pollingInterval: 2000,
        // Process logs in strict order
        strict: true,
      });

      this._isListening = true;
      log.d(`Listener started for Cast=[${this.getName()}]`);
    }
  }

  /**
   * Stops listening for contract events.
   *
   * This method cleans up the event watcher and marks the listener as inactive.
   * It should be called when the listener is no longer needed to clean up
   * resources and stop consuming blockchain events.
   */
  async stopListening(): Promise<void> {
    if (this.isListening() && this._unwatch) {
      log.d(`Contract Cast Listener stopping for Cast=[${this.getName()}]`);

      // Call the unwatch function to stop listening
      this._unwatch();
      this._unwatch = null;
      this._isListening = false;

      log.d(`Listener stopped for Cast=[${this.getName()}]`);
    }
  }
}

export default EVMContractListener;
