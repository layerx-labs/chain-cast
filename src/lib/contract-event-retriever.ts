import { Model } from '@taikai/dappkit';
import log from '@/services/log';
import { ContractEventRetriever, EventRecoverHandler } from '@/types/events';
import { retry } from '@/util/promise';
import {appConfig} from '@/config/index'
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
        const endBlock = Math.min(startBlock + appConfig.recover.blocksPerCall, toBlock);
        const options = {
          fromBlock: startBlock,
          toBlock: endBlock,
        };

        const func = async () => {
          return this._contract.contract.self.getPastEvents('allEvents', options);
        };

        const events = await retry(func, [], appConfig.recover.retries, 10);

        for (const event of events) {
          if (!(event.blockNumber == fromBlock && event.transactionIndex < fromTxIndex)) {
            this._handler && (await this._handler.onEvent(event));
          } else {
            log.d(
              `Skipping event ${event.blockNumber} and ${event.transactionIndex} ` +
                `on ${this._contract.contractAddress}`
            );
          }
        }
        startBlock = endBlock + 1;
        await this._handler?.onEventRecoverProgress(startBlock, 0);
      } while (startBlock <= toBlock && !this._handler?.shouldStop());
    } finally {
      this._isRecovering = false;
    }
  }
}
