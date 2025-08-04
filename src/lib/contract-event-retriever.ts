import { Model } from '@taikai/dappkit';
import log from '@/services/log';
import { ContractEventRetriever, EventRecoverHandler } from '@/types/events';
import { retry } from '@/util/promise';
import { appConfig } from '@/config/index';
import { sleep } from './time';

/**
 * EVMContractEventRetriever is responsible for recovering (fetching) past events
 * from an EVM-compatible contract, in a batched and resumable way.
 *
 * This class implements the ContractEventRetriever interface to provide a robust
 * mechanism for retrieving historical blockchain events. It processes events in
 * configurable batches to avoid overwhelming the blockchain node and provides
 * progress reporting through a handler interface.
 *
 * Key features:
 * - Batch processing with configurable batch sizes
 * - Automatic retry logic for failed requests
 * - Progress reporting for long-running operations
 * - Transaction index filtering to avoid duplicate processing
 * - Rate limiting between batches to respect node limits
 *
 * @template M - The type of the contract model, extending Model from dappkit
 */
export class EVMContractEventRetriever<M extends Model> implements ContractEventRetriever {
  /** The contract model instance used to fetch events */
  private _contract: Model;
  /** Flag indicating if a recovery operation is currently in progress */
  private _isRecovering = false;
  /** The handler for event recovery callbacks and progress reporting */
  private _handler: EventRecoverHandler | null = null;

  /**
   * Creates a new EVMContractEventRetriever instance.
   *
   * @param model - The contract model instance to use for event fetching
   */
  constructor(model: M) {
    this._contract = model;
  }

  /**
   * Sets the handler for event recovery callbacks and progress reporting.
   *
   * The handler will be called for:
   * - Each recovered event (onEvent)
   * - Progress updates during recovery (onEventRecoverProgress)
   * - Stop condition checks (shouldStop)
   *
   * @param handler - The handler implementing EventRecoverHandler interface
   */
  setHandler(handler: EventRecoverHandler) {
    this._handler = handler;
  }

  /**
   * Checks if a recovery operation is currently in progress.
   *
   * @returns True if currently recovering events, false otherwise
   */
  isRecovering() {
    return this._isRecovering;
  }

  /**
   * Recovers (fetches) past events from the contract, from a starting
   * block/tx index to an ending block.
   *
   * This method implements the main event recovery logic:
   * 1. Processes events in configurable batches to avoid overwhelming the node
   * 2. Uses retry logic for failed requests to handle transient network issues
   * 3. Filters events based on transaction index to avoid processing
 *    duplicates
   * 4. Reports progress to the handler for monitoring long-running operations
   * 5. Respects rate limits by sleeping between batches
   * 6. Checks for stop conditions between batches
   *
   * The recovery process:
   * - Starts from the specified block and transaction index
   * - Processes blocks in batches of configurable size
   * - For each batch, fetches all events in the block range
   * - Filters events based on transaction index to avoid
 *   duplicates
   * - Calls the handler for each valid event
   * - Reports progress after each batch
   * - Continues until reaching the end block or stop condition
   *
   * @param fromBlock - The starting block number (inclusive)
   * @param fromTxIndex - The starting transaction index within the starting block
   * @param toBlock - The ending block number (inclusive)
   */
  async recover(fromBlock: number, fromTxIndex: number, toBlock: number): Promise<void> {
    let startBlock = fromBlock;
    this._isRecovering = true;
    try {
      do {
        // Determine the end block for this batch, respecting the configured batch size and
        // the toBlock limit
        const endBlock = Math.min(startBlock + appConfig.recover.blocksPerCall, toBlock);
        const options = {
          fromBlock: startBlock,
          toBlock: endBlock,
        };

        // Function to fetch all events in the current block range
        const func = async () => {
          return this._contract.contract.self.getPastEvents('allEvents', options);
        };

        // Retry fetching events in case of transient errors, as per configuration
        const events = await retry(func, [], appConfig.recover.retries, 10);

        // Sleep between batches to avoid overloading the node
        await sleep(appConfig.recover.sleepMs);

        // Process each event in the batch
        for (const event of events) {
          // Skip events in the starting block that have a transaction index less than fromTxIndex
          if (!(event.blockNumber == fromBlock && event.transactionIndex < fromTxIndex)) {
            this._handler && (await this._handler.onEvent(event));
          } else {
            log.d(
              `Skipping event ${event.blockNumber} and ${event.transactionIndex} ` +
                `on ${this._contract.contractAddress}`
            );
          }
        }

        // Move to the next batch
        startBlock = endBlock + 1;

        // Notify handler of recovery progress
        await this._handler?.onEventRecoverProgress(startBlock, 0);
      } while (startBlock <= toBlock && !this._handler?.shouldStop());
    } finally {
      this._isRecovering = false;
    }
  }
}
