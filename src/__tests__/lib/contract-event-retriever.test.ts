import { describe, expect, it, beforeEach, mock } from 'bun:test';
import type { EventRecoverHandler, Web3Event, ViemDecodedLog } from '@/types/events';

// Mock dependencies
mock.module('@/services/log', () => ({
  default: {
    d: mock(() => {}),
    i: mock(() => {}),
    w: mock(() => {}),
    e: mock(() => {}),
  },
}));

mock.module('@/config/index', () => ({
  appConfig: {
    recover: {
      blocksPerCall: 100,
      retries: 3,
      sleepMs: 10,
    },
  },
}));

mock.module('@/lib/time', () => ({
  sleep: mock(() => Promise.resolve()),
}));

const mockGetContractEvents = mock(() => Promise.resolve([]));

mock.module('@/lib/viem-client', () => ({
  createHttpClient: mock(() => ({
    getContractEvents: mockGetContractEvents,
    chain: { id: 1, name: 'Ethereum' },
  })),
}));

// Import after mocking
import { EVMContractEventRetriever, type EventRetrieverConfig } from '@/lib/contract-event-retriever';

describe('EVMContractEventRetriever', () => {
  let retriever: EVMContractEventRetriever;
  let mockHandler: EventRecoverHandler;
  const testAbi = [
    {
      type: 'event',
      name: 'Transfer',
      inputs: [
        { name: 'from', type: 'address', indexed: true },
        { name: 'to', type: 'address', indexed: true },
        { name: 'value', type: 'uint256', indexed: false },
      ],
    },
  ];

  const config: EventRetrieverConfig = {
    chainId: 1,
    address: '0x1234567890abcdef1234567890abcdef12345678' as `0x${string}`,
    abi: testAbi,
  };

  const createMockLogs = (count: number, startBlock: number, startTxIndex: number = 0): ViemDecodedLog[] => {
    return Array.from({ length: count }, (_, i) => ({
      address: '0x1234567890abcdef1234567890abcdef12345678',
      blockHash: `0x${'a'.repeat(64)}`,
      blockNumber: BigInt(startBlock + Math.floor(i / 3)),
      data: '0x',
      logIndex: i,
      transactionHash: `0x${'b'.repeat(64)}`,
      transactionIndex: startTxIndex + (i % 3),
      removed: false,
      topics: [],
      eventName: 'Transfer',
      args: {
        from: '0xfrom',
        to: '0xto',
        value: BigInt(1000 * (i + 1)),
      },
    }));
  };

  beforeEach(() => {
    mockGetContractEvents.mockClear();
    mockGetContractEvents.mockImplementation(() => Promise.resolve([]));

    retriever = new EVMContractEventRetriever(config);

    mockHandler = {
      shouldStop: mock(() => false),
      onEvent: mock(() => {}),
      onEventRecoverProgress: mock(() => Promise.resolve()),
    };
  });

  describe('constructor', () => {
    it('should initialize with provided config', () => {
      expect(retriever.isRecovering()).toBe(false);
    });
  });

  describe('setHandler', () => {
    it('should set the event handler', () => {
      retriever.setHandler(mockHandler);
      // No error means success - handler is private
    });
  });

  describe('isRecovering', () => {
    it('should return false initially', () => {
      expect(retriever.isRecovering()).toBe(false);
    });

    it('should return true during recovery', async () => {
      retriever.setHandler(mockHandler);

      // Create a slow mock that we can check during execution
      let isRecoveringDuring = false;
      mockGetContractEvents.mockImplementation(async () => {
        isRecoveringDuring = retriever.isRecovering();
        return [];
      });

      await retriever.recover(100, 0, 150);

      expect(isRecoveringDuring).toBe(true);
    });

    it('should return false after recovery completes', async () => {
      retriever.setHandler(mockHandler);
      await retriever.recover(100, 0, 150);

      expect(retriever.isRecovering()).toBe(false);
    });
  });

  describe('recover', () => {
    it('should fetch events in batches', async () => {
      retriever.setHandler(mockHandler);
      await retriever.recover(100, 0, 350);

      // With blocksPerCall=100, should make 3 calls: 100-200, 201-300, 301-350
      expect(mockGetContractEvents).toHaveBeenCalledTimes(3);
    });

    it('should call onEvent for each recovered event', async () => {
      const logs = createMockLogs(3, 100);
      mockGetContractEvents.mockImplementation(() => Promise.resolve(logs));

      retriever.setHandler(mockHandler);
      await retriever.recover(100, 0, 150);

      expect(mockHandler.onEvent).toHaveBeenCalledTimes(3);
    });

    it('should skip events with txIndex less than fromTxIndex in start block', async () => {
      const logs = createMockLogs(3, 100, 0);
      mockGetContractEvents.mockImplementation(() => Promise.resolve(logs));

      retriever.setHandler(mockHandler);
      // Start from block 100, txIndex 2 - should skip first 2 events
      await retriever.recover(100, 2, 150);

      // Only 1 event should be processed (the one with txIndex >= 2)
      expect(mockHandler.onEvent).toHaveBeenCalledTimes(1);
    });

    it('should report progress after each batch', async () => {
      retriever.setHandler(mockHandler);
      await retriever.recover(100, 0, 350);

      // Should call onEventRecoverProgress 3 times (once per batch)
      expect(mockHandler.onEventRecoverProgress).toHaveBeenCalledTimes(3);
    });

    it('should stop if handler.shouldStop returns true', async () => {
      let callCount = 0;
      (mockHandler.shouldStop as ReturnType<typeof mock>).mockImplementation(() => {
        callCount++;
        return callCount > 1; // Stop after first batch
      });

      retriever.setHandler(mockHandler);
      await retriever.recover(100, 0, 350);

      // shouldStop is checked at end of loop, so it processes 2 batches before stopping
      expect(mockGetContractEvents).toHaveBeenCalledTimes(2);
    });

    it('should handle empty event list', async () => {
      mockGetContractEvents.mockImplementation(() => Promise.resolve([]));

      retriever.setHandler(mockHandler);
      await retriever.recover(100, 0, 150);

      expect(mockHandler.onEvent).not.toHaveBeenCalled();
      expect(mockHandler.onEventRecoverProgress).toHaveBeenCalled();
    });

    it('should handle single block range', async () => {
      retriever.setHandler(mockHandler);
      await retriever.recover(100, 0, 100);

      expect(mockGetContractEvents).toHaveBeenCalledTimes(1);
    });

    it('should convert viem logs to Web3Event format', async () => {
      const logs = createMockLogs(1, 100);
      mockGetContractEvents.mockImplementation(() => Promise.resolve(logs));

      let receivedEvent: Web3Event<string, unknown> | null = null;
      (mockHandler.onEvent as ReturnType<typeof mock>).mockImplementation((event) => {
        receivedEvent = event as Web3Event<string, unknown>;
      });

      retriever.setHandler(mockHandler);
      await retriever.recover(100, 0, 150);

      expect(receivedEvent).not.toBeNull();
      expect(receivedEvent!.event).toBe('Transfer');
      expect(receivedEvent!.blockNumber).toBe(100);
      expect(typeof receivedEvent!.returnValues).toBe('object');
    });

    it('should reset isRecovering after completion', async () => {
      mockGetContractEvents.mockImplementation(() => Promise.resolve([]));

      retriever.setHandler(mockHandler);
      await retriever.recover(100, 0, 150);

      expect(retriever.isRecovering()).toBe(false);
    });
  });
});
