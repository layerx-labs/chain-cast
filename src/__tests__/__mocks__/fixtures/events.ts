import type { Log } from 'viem';

/**
 * Sample ERC20 Transfer event ABI
 */
export const transferEventAbi = {
  type: 'event' as const,
  name: 'Transfer',
  inputs: [
    { type: 'address', name: 'from', indexed: true },
    { type: 'address', name: 'to', indexed: true },
    { type: 'uint256', name: 'value', indexed: false },
  ],
};

/**
 * Sample ERC721 Transfer event ABI
 */
export const erc721TransferEventAbi = {
  type: 'event' as const,
  name: 'Transfer',
  inputs: [
    { type: 'address', name: 'from', indexed: true },
    { type: 'address', name: 'to', indexed: true },
    { type: 'uint256', name: 'tokenId', indexed: true },
  ],
};

/**
 * Sample Approval event ABI
 */
export const approvalEventAbi = {
  type: 'event' as const,
  name: 'Approval',
  inputs: [
    { type: 'address', name: 'owner', indexed: true },
    { type: 'address', name: 'spender', indexed: true },
    { type: 'uint256', name: 'value', indexed: false },
  ],
};

/**
 * Complete ERC20 ABI with Transfer and Approval events
 */
export const erc20Abi = [transferEventAbi, approvalEventAbi];

/**
 * Sample Web3Event for Transfer
 */
export const sampleTransferWeb3Event = {
  event: 'Transfer',
  address: '0x1234567890abcdef1234567890abcdef12345678',
  blockHash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
  blockNumber: 1000000,
  transactionHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
  transactionIndex: 5,
  logIndex: 0,
  removed: false,
  returnValues: {
    from: '0x1234567890abcdef1234567890abcdef12345678',
    to: '0xabcdef1234567890abcdef1234567890abcdef12',
    value: BigInt('1000000000000000000'),
  },
};

/**
 * Sample Web3Event for Approval
 */
export const sampleApprovalWeb3Event = {
  event: 'Approval',
  address: '0x1234567890abcdef1234567890abcdef12345678',
  blockHash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
  blockNumber: 1000001,
  transactionHash: '0x2345678901abcdef2345678901abcdef2345678901abcdef2345678901abcdef',
  transactionIndex: 2,
  logIndex: 0,
  removed: false,
  returnValues: {
    owner: '0x1234567890abcdef1234567890abcdef12345678',
    spender: '0xabcdef1234567890abcdef1234567890abcdef12',
    value: BigInt('1000000000000000000000'),
  },
};

/**
 * Sample viem Log (raw format)
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
    '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef',
    '0x0000000000000000000000001234567890abcdef1234567890abcdef12345678',
    '0x000000000000000000000000abcdef1234567890abcdef1234567890abcdef12',
  ],
};

/**
 * Creates a sample Web3Event with custom values
 */
export function createWeb3Event(overrides: Partial<typeof sampleTransferWeb3Event> = {}) {
  return {
    ...sampleTransferWeb3Event,
    ...overrides,
  };
}

/**
 * Creates multiple Web3Events for batch testing
 */
export function createMultipleWeb3Events(
  count: number,
  startBlock = 1000000
): Array<typeof sampleTransferWeb3Event> {
  return Array.from({ length: count }, (_, i) => ({
    ...sampleTransferWeb3Event,
    blockNumber: startBlock + i,
    transactionIndex: i,
    logIndex: i,
  }));
}

/**
 * Sample trigger payload for VM execution
 */
export const sampleEventTrigger = {
  name: 'event' as const,
  payload: sampleTransferWeb3Event,
};

/**
 * Sample contract addresses for testing
 */
export const testAddresses = {
  erc20: '0x1234567890abcdef1234567890abcdef12345678',
  erc721: '0xabcdef1234567890abcdef1234567890abcdef12',
  sender: '0x1111111111111111111111111111111111111111',
  receiver: '0x2222222222222222222222222222222222222222',
};
