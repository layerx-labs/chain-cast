import { ContractEventListener, EventListenerHandler } from '@/types/events';
import { Model } from '@taikai/dappkit';
import log from '@/services/log';
import { EventEmitter } from 'node:events';
import { WebsocketProviderBase } from 'web3-core-helpers';
/**
 * This Class listen for events on a contract of type M and
 * forward the event to the EventListenerhandler
 */
export class EVMContractListener<M extends Model> implements ContractEventListener {
  private _contract: Model;
  private _isListening = false;
  private _handler: EventListenerHandler | null = null;
  private _listener: EventEmitter | null = null;

  /**
   *
   * @param TCreator
   * @param wsUrl
   * @param address
   * @param events
   * @param handler
   */
  constructor(model: M) {
    this._contract = model;
  }

  /**
   * Gets the list of events this listener is waiting for ...
   * @returns
   */
  getEvents(): string[] {
    return (
      (this._listener && this._listener.eventNames().map((eventName) => eventName.toString())) || []
    );
  }

  /**
   * Is the listener started and ready to forward events
   * @returns
   */
  isListening(): boolean {
    return this._isListening;
  }

  setHandler(handler: EventListenerHandler): void {
    this._handler = handler;
  }

  /**
   * Start Listening for the events specified on the contract
   */
  async startListening(blockNumber: number): Promise<void> {
    if (!this.isListening() && this._handler) {
      await this._contract.start();
      await this.enablehandler(this._handler, blockNumber);
      this._isListening = true;
    }
  }

  /**
   * Toggle between the handler passed and a skip handler
   * Always to start the listener on the Block Number
   * @param handler
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
    
    log.d(`Listening for events on ${this._contract.contractAddress} from ${blockNumber} `);
    
    provider.on('connect', () => {
      log.d(`Listener connection for ${this._contract.contractAddress}`);
    })
    
    provider.on('end', () => {
      log.d(`Listener disconnected for ${this._contract.contractAddress} `);
    });

    provider.on('reconnect', () => {
      log.d(`Listener reconnected for ${this._contract.contractAddress}`);
    });
   
    this._listener = this._contract.contract.events
      .allEvents(options)
      .on('changed', (changed: any) => handler.onEventChanged(changed))
      .on('data', (event: any) => {
        handler.onEvent(event);
      })
      .on('error', (err: Error) => handler.onError(err))
      .on('connected', (str: string) => handler.onConnected(str));
  }

  /***
   * Stop Listening for events
   */
  async stopListening(): Promise<void> {
    if (this.isListening() && this._listener) {
      log.d(`Contract Cast Listener stopping for ${this._contract.contractAddress}`);
      this._listener.removeAllListeners();
      this._isListening = false;
    }
  }
}

export default EVMContractListener;
