import { mock } from 'bun:test';
import type { Log, PublicClient, WatchContractEventReturnType } from 'viem';

/**
 * Creates a mock viem PublicClient for testing blockchain interactions.
 */
export function createMockViemClient() {
  const mockClient = {
    getBlockNumber: mock(() => Promise.resolve(BigInt(1000000))),
    getBlock: mock(() =>
      Promise.resolve({
        number: BigInt(1000000),
        hash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
        parentHash: '0x0000000000000000000000000000000000000000000000000000000000000000',
        timestamp: BigInt(Date.now() / 1000),
        transactions: [],
      })
    ),
    getContractEvents: mock(() => Promise.resolve([] as Log[])),
    watchContractEvent: mock((_args: unknown): WatchContractEventReturnType => {
      // Return an unwatch function
      return () => {};
    }),
    getLogs: mock(() => Promise.resolve([] as Log[])),
    getTransaction: mock(() =>
      Promise.resolve({
        hash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        blockNumber: BigInt(1000000),
        from: '0x1234567890abcdef1234567890abcdef12345678',
        to: '0xabcdef1234567890abcdef1234567890abcdef12',
        value: BigInt(0),
      })
    ),
    getTransactionReceipt: mock(() =>
      Promise.resolve({
        status: 'success' as const,
        blockNumber: BigInt(1000000),
        transactionHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        logs: [],
      })
    ),
    chain: {
      id: 1,
      name: 'Ethereum',
    },
  };

  return mockClient as unknown as PublicClient & typeof mockClient;
}

/**
 * Mock for createHttpClient function
 */
export const mockCreateHttpClient = mock(() => createMockViemClient());

/**
 * Mock for createWebSocketClient function
 */
export const mockCreateWebSocketClient = mock(() => createMockViemClient());

/**
 * Sample viem Log for testing
 */
export const sampleViemLog: Log = {
  address: '0x1234567890abcdef1234567890abcdef12345678',
  blockHash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
  blockNumber: BigInt(1000000),
  data: '0x0000000000000000000000000000000000000000000000000de0b6b3a7640000',
  logIndex: 0,
  transactionHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
  transactionIndex: 5,
  removed: false,
  topics: [
    '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef', // Transfer event signature
    '0x0000000000000000000000001234567890abcdef1234567890abcdef12345678', // from
    '0x000000000000000000000000abcdef1234567890abcdef1234567890abcdef12', // to
  ],
};

/**
 * Sample decoded viem Log with args for Transfer event
 */
export const sampleDecodedViemLog = {
  ...sampleViemLog,
  eventName: 'Transfer',
  args: {
    from: '0x1234567890abcdef1234567890abcdef12345678',
    to: '0xabcdef1234567890abcdef1234567890abcdef12',
    value: BigInt('1000000000000000000'),
  },
};

/**
 * Creates multiple sample logs for batch testing
 */
export function createSampleLogs(count: number, startBlock: bigint = BigInt(1000000)): Log[] {
  return Array.from({ length: count }, (_, i) => ({
    ...sampleViemLog,
    blockNumber: startBlock + BigInt(i),
    logIndex: i,
    transactionIndex: i,
  }));
}
