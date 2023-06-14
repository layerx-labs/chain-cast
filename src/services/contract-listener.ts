import { EventListener, EventListenerProcessor, Web3Event } from '@/types/events';
import { Model, Web3Connection } from '@taikai/dappkit';
import log from '@/services/log';

class SkipListenerProcessor implements EventListenerProcessor {
  onEvent<N extends string, T>(_event: Web3Event<N, T>): void {}
  onError(_eventName: string, _error: Error): void {}
  onEventChanged(_eventName: string, _changed: any): void {}
  onConnected(_eventName: string, _message: string): void {}
}
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
  _events: string[] = [];

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
    events: string[],
    processor: P
  ) {
    this._web3Con = new Web3Connection({
      debug: false,
      web3Host: wsUrl,
    });
    this._processor = processor;
    this._contract = new TCreator(this._web3Con, address);
    this._events = events;
  }

  /**
   * Gets the list of events this listener is waiting for ...
   * @returns
   */
  getEvents(): string[] {
    return this._events;
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
      this._isListening = true;
      await this.changeProcessor(this._processor); 
    }
  }

  /**
   * Toggle between the processor passed and a skip processor
   * Always to start the listener on the Block Number
   * @param processor
   */
  private async changeProcessor<Processor extends EventListenerProcessor>(processor: Processor) {
    const currentBlock = await this._web3Con.eth.getBlockNumber();
    const options = {
      filter: {
        value: [],
      },
      fromBlock: currentBlock + 1,
    };
    for (const event of Object.values(this.getEvents())) {
      if(this.isListening()) {
        log.d(`Listening for ${event} on ${this._contract.contractAddress} 👂`);
      } else {
        log.d(`Stop Listening for ${event} on ${this._contract.contractAddress} 👋`);
      }      
      this._contract.contract.events[event](options)
        .on('changed', (changed: any) => processor.onEventChanged(event, changed))
        .on('data', (event: any) => {
          processor.onEvent(event);
        })
        .on('error', (err: Error) => processor.onError(event, err))
        .on('connected', (str: string) => processor.onConnected(event, str));
    }
  }

  /***
   * Stop Listening for events
   */
  async stopListening(): Promise<void> {
    if (this.isListening()) {     
      this._isListening = false;
      await this.changeProcessor(new SkipListenerProcessor());
     
    }
  }
}

export default ContractListener;
