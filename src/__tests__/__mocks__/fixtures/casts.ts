import type { ContractCast, ContractCastStatus, ContractCastType, Secret } from '@prisma/client';
import { erc20Abi } from './events';

/**
 * Sample ERC20 ContractCast configuration
 */
export const sampleErc20Cast: ContractCast = {
  id: 'cast-erc20-001',
  name: 'USDC Transfer Monitor',
  type: 'ERC20' as ContractCastType,
  status: 'IDLE' as ContractCastStatus,
  abi: JSON.stringify(erc20Abi),
  address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', // USDC on Ethereum
  chainId: 1,
  blockNumber: 18000000,
  transactionIndex: 0,
  program: btoa(
    JSON.stringify([
      { name: 'debug', args: { variablesToDebug: ['event'] } },
      {
        name: 'webhook',
        args: {
          url: 'https://example.com/webhook',
          bodyInput: 'event',
        },
      },
    ])
  ),
  createdAt: new Date('2024-01-01T00:00:00Z'),
};

/**
 * Sample custom ContractCast configuration
 */
export const sampleCustomCast: ContractCast = {
  id: 'cast-custom-001',
  name: 'Custom Event Processor',
  type: 'CUSTOM' as ContractCastType,
  status: 'IDLE' as ContractCastStatus,
  abi: JSON.stringify([
    {
      type: 'event',
      name: 'CustomEvent',
      inputs: [
        { type: 'uint256', name: 'id', indexed: true },
        { type: 'string', name: 'data', indexed: false },
      ],
    },
  ]),
  address: '0x1234567890abcdef1234567890abcdef12345678',
  chainId: 137, // Polygon
  blockNumber: 50000000,
  transactionIndex: 0,
  program: btoa(
    JSON.stringify([
      { name: 'set', args: { variable: 'processed', value: true } },
      { name: 'debug', args: { variablesToDebug: ['event', 'processed'] } },
    ])
  ),
  createdAt: new Date('2024-01-15T00:00:00Z'),
};

/**
 * Sample ContractCast in LISTENING status
 */
export const sampleListeningCast: ContractCast = {
  ...sampleErc20Cast,
  id: 'cast-listening-001',
  name: 'Active Listener',
  status: 'LISTENING' as ContractCastStatus,
  blockNumber: 18500000,
  transactionIndex: 10,
};

/**
 * Sample ContractCast in RECOVERING status
 */
export const sampleRecoveringCast: ContractCast = {
  ...sampleErc20Cast,
  id: 'cast-recovering-001',
  name: 'Recovering Cast',
  status: 'RECOVERING' as ContractCastStatus,
};

/**
 * Sample ContractCast in TERMINATED status
 */
export const sampleTerminatedCast: ContractCast = {
  ...sampleErc20Cast,
  id: 'cast-terminated-001',
  name: 'Terminated Cast',
  status: 'TERMINATED' as ContractCastStatus,
};

/**
 * Sample Secret for API key
 */
export const sampleApiKeySecret: Secret = {
  id: 'secret-api-001',
  name: 'API_KEY',
  value: 'encrypted-api-key-value',
  salt: Buffer.from('random-salt-16bytes').toString('base64'),
  contractCastId: 'cast-erc20-001',
  createdAt: new Date('2024-01-01T00:00:00Z'),
  updatedAt: new Date('2024-01-01T00:00:00Z'),
};

/**
 * Sample Secret for webhook authorization
 */
export const sampleWebhookSecret: Secret = {
  id: 'secret-webhook-001',
  name: 'WEBHOOK_AUTH',
  value: 'encrypted-webhook-token',
  salt: Buffer.from('another-salt-16b').toString('base64'),
  contractCastId: 'cast-erc20-001',
  createdAt: new Date('2024-01-01T00:00:00Z'),
  updatedAt: new Date('2024-01-01T00:00:00Z'),
};

/**
 * Creates a sample ContractCast with custom values
 */
export function createContractCast(overrides: Partial<ContractCast> = {}): ContractCast {
  return {
    ...sampleErc20Cast,
    id: `cast-${Date.now()}`,
    ...overrides,
  };
}

/**
 * Creates a sample Secret with custom values
 */
export function createSecret(overrides: Partial<Secret> = {}): Secret {
  return {
    ...sampleApiKeySecret,
    id: `secret-${Date.now()}`,
    ...overrides,
  };
}

/**
 * Creates multiple ContractCasts for batch testing
 */
export function createMultipleCasts(count: number): ContractCast[] {
  return Array.from({ length: count }, (_, i) =>
    createContractCast({
      id: `cast-batch-${i}`,
      name: `Batch Cast ${i}`,
      address: `0x${'0'.repeat(39)}${i}`,
    })
  );
}

/**
 * Sample cast configuration for GraphQL input
 */
export const sampleCastInput = {
  name: 'New Test Cast',
  type: 'CUSTOM',
  abi: JSON.stringify(erc20Abi),
  address: '0x1234567890abcdef1234567890abcdef12345678',
  chainId: 1,
  program: btoa(JSON.stringify([{ name: 'debug', args: { variablesToDebug: ['event'] } }])),
};
