import { builder } from '../builder';
import { ContractCastType, ContractCastStatus } from '@prisma/client';

/**
 * GraphQL enum type for contract cast types.
 * Maps to Prisma ContractCastType enum values (ERC20, ERC721, ERC1155, CUSTOM).
 */
export const ContractCastTypeEnum = builder.enumType('ContractCastType', {
  values: Object.values(ContractCastType),
});

/**
 * GraphQL enum type for contract cast statuses.
 * Maps to Prisma ContractCastStatus enum values indicating the operational state.
 */
export const ContractCastStatusEnum = builder.enumType('ContractCastStatusEnum', {
  values: Object.values(ContractCastStatus),
});

/**
 * GraphQL object type for ContractCast entities.
 * Automatically generated from Prisma schema with custom field mappings.
 * Represents a blockchain contract monitoring configuration in the GraphQL API.
 */
builder.prismaObject('ContractCast', {
  fields: (t) => ({
    id: t.exposeID('id'), // Unique identifier for the contract cast
    name: t.exposeString('name', {
      // Optional human-readable name
      nullable: true,
    }),
    address: t.exposeString('address'), // Ethereum contract address being monitored
    chainId: t.exposeInt('chainId'), // Blockchain network ID
    blockNumber: t.exposeInt('blockNumber'), // Starting block number for event monitoring
    transactionIndex: t.exposeInt('transactionIndex'), // Starting transaction index
    type: t.expose('type', {
      // Type of contract (ERC20, ERC721, etc.)
      type: ContractCastTypeEnum,
    }),
    status: t.expose('status', {
      // Current operational status
      type: ContractCastStatusEnum,
    }),
    program: t.exposeString('program'), // Base64-encoded instruction program
    createdAt: t.expose('createdAt', {
      // Timestamp when the cast was created
      type: 'Date',
    }),
  }),
});
