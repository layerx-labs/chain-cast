import { EventListener, EventListenerProcessor } from '@/types/events';
import { Model, Web3Connection } from '@taikai/dappkit';
import log from '@/services/log';
import { EventEmitter } from 'node:events';

/**
 * This Class listen for events on a contract of type M and
 * forward the event to the EventListenerProcessor
 */
export class ContractListener<M extends Model, P extends EventListenerProcessor>
  implements EventListener
{
  _web3Con: Web3Connection;
  _contract: Model;
  _isListening = false;
  _processor: P;
  _listener: EventEmitter | null = null;

  /**
   *
   * @param TCreator
   * @param wsUrl
   * @param address
   * @param events
   * @param processor
   */
  constructor(
    TCreator: new (web3Con: Web3Connection, address: string) => M,
    wsUrl: string,
    address: string,
    processor: P
  ) {
    this._web3Con = new Web3Connection({
      debug: false,
      web3Host: wsUrl,
    });
    this._processor = processor;
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
      await this.enableProcessor(this._processor);
      this._isListening = true;
    }
  }

  /**
   * Toggle between the processor passed and a skip processor
   * Always to start the listener on the Block Number
   * @param processor
   */
  private async enableProcessor<Processor extends EventListenerProcessor>(processor: Processor) {
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
      .on('changed', (changed: any) => processor.onEventChanged(changed))
      .on('data', (event: any) => {
        processor.onEvent(event);
      })
      .on('error', (err: Error) => processor.onError(err))
      .on('connected', (str: string) => processor.onConnected(str));
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
