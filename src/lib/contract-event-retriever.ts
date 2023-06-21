import { Model } from '@taikai/dappkit';
import log from '@/services/log';
import { ContractEventRetriever, EventRecoverHandler } from '@/types/events';

export class EVMContractEventRetriever<M extends Model> implements ContractEventRetriever {
  private _contract: Model;
  private _isRecovering = false;
  private _handler: EventRecoverHandler | null = null;

  constructor(model: M) {
    this._contract = model;
  }

  setHandler(handler: EventRecoverHandler) {
    this._handler = handler;
  }

  isRecovering() {
    return this._isRecovering;
  }

  async recover(fromBlock: number, fromTxIndex: number, toBlock: number): Promise<void> {
    let startBlock = fromBlock;
    this._isRecovering = true;
    try {
      do {
        const endBlock = Math.min(startBlock + 100, toBlock);
        const options = {
          fromBlock: startBlock,
          toBlock: endBlock,
        };

        const events = await this._contract.contract.self.getPastEvents('allEvents', options);
        for (const event of events) {
          if (!(event.blockNumber == fromBlock && event.transactionIndex < fromTxIndex)) {
            this._handler && this._handler.onEvent(event);
          } else {
            log.d(
              `Skipping event ${event.blockNumber} and ${event.transactionIndex} ` + 
              `on ${this._contract.contractAddress}`
            );
          }
        }
        startBlock = endBlock + 1;
        await  this._handler?.onEventRecoverProgress(startBlock, 0);
      } while (startBlock <= toBlock);
    } finally {
      this._isRecovering = false;
    }
  }
}
