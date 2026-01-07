import type { Log, } from 'viem';

/**
 * Represents a blockchain event in a normalized format.
 * This format is used internally throughout ChainCast and is
 * compatible with the previous web3.js event format.
 *
 * @template N - The event name type
 * @template T - The type of the event's return values/args
 */
export type Web3Event<N, T> = {
  event: N;
  address: string;
  blockHash: string;
  blockNumber: number;
  transactionHash: string;
  transactionIndex: number;
  returnValues: T;
};

/**
 * Raw viem log type with decoded event information.
 * Used as the source type when converting from viem format.
 */
export type ViemDecodedLog = Log & {
  eventName?: string;
  args?: Record<string, unknown>;
};

/**
 * Converts a viem Log to the normalized Web3Event format.
 * This adapter function ensures backward compatibility with
 * existing event handlers throughout the codebase.
 *
 * @param log - The viem log to convert
 * @returns A Web3Event with normalized format
 */
export function viemLogToWeb3Event<N extends string, T>(log: ViemDecodedLog): Web3Event<N, T> {
  return {
    event: (log.eventName ?? 'Unknown') as N,
    address: log.address,
    blockHash: log.blockHash ?? '',
    blockNumber: Number(log.blockNumber ?? 0),
    transactionHash: log.transactionHash ?? '',
    transactionIndex: Number(log.transactionIndex ?? 0),
    returnValues: (log.args ?? {}) as T,
  };
}

/**
 * Converts an array of viem Logs to Web3Event format.
 *
 * @param logs - Array of viem logs to convert
 * @returns Array of Web3Events
 */
export function viemLogsToWeb3Events<N extends string, T>(
  logs: ViemDecodedLog[]
): Web3Event<N, T>[] {
  return logs.map((log) => viemLogToWeb3Event<N, T>(log));
}

/**
 * Type helper to map event types for reactive handlers.
 */
export type EventReactor<Events extends { event: string }> = {
  [T in Events as `on${Capitalize<T['event'] & string>}`]: (event: T) => void;
};

/**
 * Handler interface for real-time event listening.
 * Implementations receive events as they occur on the blockchain.
 */
export type EventListenerHandler = {
  /** Called when a new event is received */
  onEvent<N extends string, T>(event: Web3Event<N, T>): void;
  /** Called when an error occurs during listening */
  onError(error: Error): void;
  /** Called when an event is reorganized (blockchain reorg) */
  onEventChanged(changed: Web3Event<string, unknown>): void;
  /** Called when the listener connection is established */
  onConnected(message: string): void;
};

/**
 * Handler interface for historical event recovery.
 * Implementations receive past events and progress updates during backfilling.
 */
export type EventRecoverHandler = {
  /** Returns true if the recovery process should stop */
  shouldStop(): boolean;
  /** Called for each recovered historical event */
  onEvent<N extends string, T>(event: Web3Event<N, T>): void;
  /** Called to report recovery progress */
  onEventRecoverProgress(blockNumber: number, txIndex: number): void | Promise<void>;
};

/**
 * Interface for contract event listeners.
 * Implementations listen for real-time events from smart contracts.
 */
export type ContractEventListener = {
  /** Returns the list of event names being listened to */
  getEvents(): string[];
  /** Sets the handler for event callbacks */
  setHandler(handler: EventListenerHandler): void;
  /** Returns true if currently listening */
  isListening(): boolean;
  /** Starts listening from a specific block number */
  startListening(blockNumber: number): Promise<void>;
  /** Stops listening and cleans up resources */
  stopListening(): Promise<void>;
};

/**
 * Interface for contract event retrievers.
 * Implementations fetch historical events from smart contracts.
 */
export type ContractEventRetriever = {
  /** Sets the handler for recovery callbacks */
  setHandler(handler: EventRecoverHandler): void;
  /** Recovers events from a block range */
  recover(fromBlock: number, fromTxIndex: number, toBlock: number): Promise<void>;
  /** Returns true if currently recovering */
  isRecovering(): boolean;
};
