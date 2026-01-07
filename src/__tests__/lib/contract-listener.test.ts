import { describe, expect, it, beforeEach, mock } from 'bun:test';
import type { EventListenerHandler } from '@/types/events';

// Mock dependencies
mock.module('@/services/log', () => ({
  default: {
    d: mock(() => {}),
    i: mock(() => {}),
    w: mock(() => {}),
    e: mock(() => {}),
  },
}));

const mockUnwatch = mock(() => {});
const mockWatchContractEvent = mock(() => mockUnwatch);

const mockHttpClient = {
  getBlockNumber: mock(() => Promise.resolve(BigInt(1000000))),
  watchContractEvent: mockWatchContractEvent,
  chain: { id: 1, name: 'Ethereum' },
};

const mockWsClient = {
  getBlockNumber: mock(() => Promise.resolve(BigInt(1000000))),
  watchContractEvent: mockWatchContractEvent,
  chain: { id: 1, name: 'Ethereum' },
};

mock.module('@/lib/viem-client', () => ({
  createHttpClient: mock(() => mockHttpClient),
  createWebSocketClient: mock(() => mockWsClient),
}));

// Import after mocking
import { EVMContractListener, type ContractListenerConfig } from '@/lib/contract-listener';

describe('EVMContractListener', () => {
  let listener: EVMContractListener;
  let mockHandler: EventListenerHandler;
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
    {
      type: 'event',
      name: 'Approval',
      inputs: [
        { name: 'owner', type: 'address', indexed: true },
        { name: 'spender', type: 'address', indexed: true },
        { name: 'value', type: 'uint256', indexed: false },
      ],
    },
  ];

  const config: ContractListenerConfig = {
    chainId: 1,
    address: '0x1234567890abcdef1234567890abcdef12345678' as `0x${string}`,
    abi: testAbi,
    name: 'Test Listener',
  };

  beforeEach(() => {
    mockWatchContractEvent.mockClear();
    mockUnwatch.mockClear();

    listener = new EVMContractListener(config);

    mockHandler = {
      onEvent: mock(() => {}),
      onError: mock(() => {}),
      onEventChanged: mock(() => {}),
      onConnected: mock(() => {}),
    };
  });

  describe('constructor', () => {
    it('should initialize with provided config', () => {
      expect(listener.getName()).toBe('Test Listener');
      expect(listener.isListening()).toBe(false);
    });

    it('should extract event names from ABI', () => {
      const events = listener.getEvents();
      expect(events).toContain('Transfer');
      expect(events).toContain('Approval');
      expect(events.length).toBe(2);
    });

    it('should handle config without name', () => {
      const listenerWithoutName = new EVMContractListener({
        ...config,
        name: undefined,
      });
      expect(listenerWithoutName.getName()).toBeNull();
    });

    it('should handle null name', () => {
      const listenerWithNullName = new EVMContractListener({
        ...config,
        name: null,
      });
      expect(listenerWithNullName.getName()).toBeNull();
    });
  });

  describe('getEvents', () => {
    it('should return event names from ABI', () => {
      const events = listener.getEvents();
      expect(events).toEqual(['Transfer', 'Approval']);
    });

    it('should return empty array for ABI without events', () => {
      const listenerWithNoEvents = new EVMContractListener({
        ...config,
        abi: [{ type: 'function', name: 'transfer' }],
      });
      expect(listenerWithNoEvents.getEvents()).toEqual([]);
    });
  });

  describe('isListening', () => {
    it('should return false initially', () => {
      expect(listener.isListening()).toBe(false);
    });

    it('should return true after startListening', async () => {
      listener.setHandler(mockHandler);
      await listener.startListening(100);
      expect(listener.isListening()).toBe(true);
    });

    it('should return false after stopListening', async () => {
      listener.setHandler(mockHandler);
      await listener.startListening(100);
      await listener.stopListening();
      expect(listener.isListening()).toBe(false);
    });
  });

  describe('setHandler', () => {
    it('should set the event handler', () => {
      listener.setHandler(mockHandler);
      // No error means success - handler is private but affects startListening behavior
    });
  });

  describe('getName', () => {
    it('should return the listener name', () => {
      expect(listener.getName()).toBe('Test Listener');
    });
  });

  describe('startListening', () => {
    it('should start watching for events', async () => {
      listener.setHandler(mockHandler);
      await listener.startListening(100);

      expect(mockWatchContractEvent).toHaveBeenCalled();
      expect(listener.isListening()).toBe(true);
    });

    it('should call onConnected when starting', async () => {
      listener.setHandler(mockHandler);
      await listener.startListening(100);

      expect(mockHandler.onConnected).toHaveBeenCalled();
    });

    it('should not start if handler is not set', async () => {
      await listener.startListening(100);

      expect(mockWatchContractEvent).not.toHaveBeenCalled();
      expect(listener.isListening()).toBe(false);
    });

    it('should not start if already listening', async () => {
      listener.setHandler(mockHandler);
      await listener.startListening(100);

      mockWatchContractEvent.mockClear();
      await listener.startListening(200);

      // Should not call watchContractEvent again
      expect(mockWatchContractEvent).not.toHaveBeenCalled();
    });
  });

  describe('stopListening', () => {
    it('should stop watching for events', async () => {
      listener.setHandler(mockHandler);
      await listener.startListening(100);
      await listener.stopListening();

      expect(mockUnwatch).toHaveBeenCalled();
      expect(listener.isListening()).toBe(false);
    });

    it('should do nothing if not listening', async () => {
      await listener.stopListening();

      expect(mockUnwatch).not.toHaveBeenCalled();
    });
  });
});
