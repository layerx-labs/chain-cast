import { mock } from 'bun:test';
import type { ContractCast, Prisma, PrismaClient, Secret } from '@prisma/client';

/**
 * Creates a mock Prisma client for testing.
 * All database operations are mocked to return default values.
 */
export function createMockPrismaClient() {
  const mockContractCast = {
    findUnique: mock(() => Promise.resolve(null as ContractCast | null)),
    findFirst: mock(() => Promise.resolve(null as ContractCast | null)),
    findMany: mock(() => Promise.resolve([] as ContractCast[])),
    create: mock((args: { data: Prisma.ContractCastCreateInput }) =>
      Promise.resolve({
        id: 'mock-id',
        name: args.data.name ?? null,
        type: args.data.type,
        status: args.data.status ?? 'IDLE',
        abi: args.data.abi,
        address: args.data.address,
        chainId: args.data.chainId,
        blockNumber: args.data.blockNumber ?? 0,
        transactionIndex: args.data.transactionIndex ?? 0,
        program: args.data.program,
        createdAt: new Date(),
      } as ContractCast)
    ),
    update: mock((args: { where: { id: string }; data: Prisma.ContractCastUpdateInput }) =>
      Promise.resolve({
        id: args.where.id,
        name: null,
        type: 'CUSTOM',
        status: 'IDLE',
        abi: '[]',
        address: '0x0',
        chainId: 1,
        blockNumber: 0,
        transactionIndex: 0,
        program: '',
        createdAt: new Date(),
        ...args.data,
      } as ContractCast)
    ),
    delete: mock(() => Promise.resolve({} as ContractCast)),
    count: mock(() => Promise.resolve(0)),
  };

  const mockSecret = {
    findUnique: mock(() => Promise.resolve(null as Secret | null)),
    findFirst: mock(() => Promise.resolve(null as Secret | null)),
    findMany: mock(() => Promise.resolve([] as Secret[])),
    create: mock((args: { data: Prisma.SecretCreateInput }) =>
      Promise.resolve({
        id: 'mock-secret-id',
        name: args.data.name,
        value: args.data.value,
        salt: args.data.salt,
        contractCastId:
          typeof args.data.contractCast === 'object'
            ? (args.data.contractCast as { connect: { id: string } }).connect.id
            : '',
        createdAt: new Date(),
        updatedAt: new Date(),
      } as Secret)
    ),
    update: mock(() => Promise.resolve({} as Secret)),
    delete: mock(() => Promise.resolve({} as Secret)),
    upsert: mock(() => Promise.resolve({} as Secret)),
  };

  return {
    contractCast: mockContractCast,
    secret: mockSecret,
    $connect: mock(() => Promise.resolve()),
    $disconnect: mock(() => Promise.resolve()),
    $transaction: mock((operations: Promise<unknown>[]) => Promise.all(operations)),
  } as unknown as PrismaClient & {
    contractCast: typeof mockContractCast;
    secret: typeof mockSecret;
  };
}

/**
 * Sample ContractCast record for testing
 */
export const sampleContractCast: ContractCast = {
  id: 'test-cast-id',
  name: 'Test Cast',
  type: 'CUSTOM',
  status: 'IDLE',
  abi: JSON.stringify([
    {
      type: 'event',
      name: 'Transfer',
      inputs: [
        { type: 'address', name: 'from', indexed: true },
        { type: 'address', name: 'to', indexed: true },
        { type: 'uint256', name: 'value', indexed: false },
      ],
    },
  ]),
  address: '0x1234567890abcdef1234567890abcdef12345678',
  chainId: 1,
  blockNumber: 1000000,
  transactionIndex: 0,
  program: btoa(JSON.stringify([{ name: 'debug', args: { variablesToDebug: ['event'] } }])),
  createdAt: new Date('2024-01-01'),
};

/**
 * Sample Secret record for testing
 */
export const sampleSecret: Secret = {
  id: 'test-secret-id',
  name: 'API_KEY',
  value: 'encrypted-value',
  salt: 'base64-salt',
  contractCastId: 'test-cast-id',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
};
