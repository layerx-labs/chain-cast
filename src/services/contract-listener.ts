import { EventListener, EventListenerHandler } from '@/types/events';
import { Model, Web3Connection } from '@taikai/dappkit';
import log from '@/services/log';
import { EventEmitter } from 'node:events';

/**
 * This Class listen for events on a contract of type M and
 * forward the event to the EventListenerhandler
 */
export class ContractListener<M extends Model, H extends EventListenerHandler>
  implements EventListener
{
  private _web3Con: Web3Connection;
  private _contract: Model;
  private _isListening = false;
  private _handler: H;
  private _listener: EventEmitter | null = null;

  /**
   *
   * @param TCreator
   * @param wsUrl
   * @param address
   * @param events
   * @param handler
   */
  constructor(
    TCreator: new (web3Con: Web3Connection, address: string) => M,
    wsUrl: string,
    address: string,
    handler: H
  ) {
    this._web3Con = new Web3Connection({
      debug: false,
      web3Host: wsUrl,
    });
    this._handler = handler;
    this._contract = new TCreator(this._web3Con, address);
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

  /**
   * Start Listening for the events specified on the contract
   */
  async startListening(): Promise<void> {
    if (!this.isListening()) {
      await this._contract.start();
      await this.enablehandler(this._handler);
      this._isListening = true;
    }
  }

  /**
   * Toggle between the handler passed and a skip handler
   * Always to start the listener on the Block Number
   * @param handler
   */
  private async enablehandler<handler extends EventListenerHandler>(handler: handler) {
    const currentBlock = await this._web3Con.eth.getBlockNumber();
    const startBlock = currentBlock + 1;
    const options = {
      filter: {
        value: [],
      },
      fromBlock: startBlock,
    };
    log.d(`Listening for events on ${this._contract.contractAddress} from ${startBlock} `);
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
      const currentBlock = await this._web3Con.eth.getBlockNumber();
      log.d(`Stop Listening for ${this._contract.contractAddress} on ${currentBlock} 👋`);
      this._listener.removeAllListeners();
      this._isListening = false;
    }
  }
}

export default ContractListener;
