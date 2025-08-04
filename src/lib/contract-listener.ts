import { ContractEventListener, EventListenerHandler } from '@/types/events';
import { Model } from '@taikai/dappkit';
import log from '@/services/log';
import { EventEmitter } from 'node:events';
import { WebsocketProviderBase } from 'web3-core-helpers';

/**
 * EVMContractListener listens for events on an EVM-compatible contract and
 * forwards them to an EventListenerHandler.
 *
 * This class provides a WebSocket-based event listening mechanism for blockchain
 * contracts. It establishes a connection to the blockchain node and listens for
 * contract events, then forwards them to a configured handler for processing.
 *
 * The listener supports:
 * - WebSocket connection management with automatic reconnection
 * - Event filtering and forwarding
 * - Connection status monitoring
 * - Error handling and logging
 *
 * @template M - The type of the contract model, extending Model from dappkit
 */
export class EVMContractListener<M extends Model> implements ContractEventListener {
  /** The contract model instance used for event listening */
  private _contract: Model;
  /** Flag indicating if the listener is currently active */
  private _isListening = false;
  /** Handler that receives forwarded events */
  private _handler: EventListenerHandler | null = null;
  /** Web3 event listener instance */
  private _listener: EventEmitter | null = null;
  /** Optional name identifier for this listener */
  private _name: string | null;

  /**
   * Creates a new EVMContractListener instance.
   *
   * @param model - The contract model instance to listen for events on
   * @param name - Optional name identifier for this listener
   */
  constructor(model: M, name: string | null) {
    this._contract = model;
    this._name = name;
  }

  /**
   * Gets the list of events this listener is currently monitoring.
   *
   * @returns Array of event names being listened to, or empty array if not listening
   */
  getEvents(): string[] {
    return (
      (this._listener && this._listener.eventNames().map((eventName) => eventName.toString())) || []
    );
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
  getName() {
    return this._name;
  }

  /**
   * Starts listening for contract events from a specified block number.
   *
   * This method:
   * 1. Starts the contract model
   * 2. Enables the event handler with the specified block number
   * 3. Sets up WebSocket connection and event listeners
   * 4. Marks the listener as active
   *
   * @param blockNumber - The block number to start listening from
   */
  async startListening(blockNumber: number): Promise<void> {
    if (!this.isListening() && this._handler) {
      await this._contract.start();
      await this.enablehandler(this._handler, blockNumber);
      this._isListening = true;
    }
  }

  /**
   * Enables event handling by setting up WebSocket connection and event listeners.
   *
   * This method configures the WebSocket provider with connection event handlers
   * and sets up the contract event listener to forward events to the handler.
   * It also configures the event filtering to start from the specified block number.
   *
   * @param handler - The event handler to forward events to
   * @param blockNumber - The block number to start listening from
   */
  private async enablehandler<handler extends EventListenerHandler>(
    handler: handler,
    blockNumber: number
  ) {
    const options = {
      fromBlock: blockNumber,
    };

    const provider: WebsocketProviderBase = this._contract.connection.Web3
      .currentProvider as WebsocketProviderBase;

    log.d(`Listening for events on Cast=[${this.getName()}] from Block=[${blockNumber}]`);

    // Set up WebSocket connection event handlers
    provider.on('connect', () => {
      log.d(`Listener connection for Cast=[${this.getName()}]`);
    });

    provider.on('end', () => {
      log.d(`Listener disconnected for Cast=[${this.getName()}] `);
    });

    provider.on('reconnect', () => {
      log.d(`Listener reconnected for Cast=[${this.getName()}]`);
    });

    // Set up contract event listener with all event types
    this._listener = this._contract.contract.events
      .allEvents(options)
      .on('changed', (changed: any) => handler.onEventChanged(changed))
      .on('data', (event: any) => {
        handler.onEvent(event);
      })
      .on('error', (err: Error) => handler.onError(err))
      .on('connected', (str: string) => handler.onConnected(str));
  }

  /**
   * Stops listening for contract events.
   *
   * This method removes all event listeners and marks the listener as inactive.
   * It should be called when the listener is no longer needed to clean up
   * resources and stop consuming blockchain events.
   */
  async stopListening(): Promise<void> {
    if (this.isListening() && this._listener) {
      log.d(`Contract Cast Listener stopping for Cast=[${this.getName()}]`);
      this._listener.removeAllListeners();
      this._isListening = false;
    }
  }
}

export default EVMContractListener;
