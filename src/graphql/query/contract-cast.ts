import { builder } from '../builder';
import { DateTimeFilter, PothosPageInfo, SortOrderEnum, StringFilter } from '@/graphql/types';
import { ContractCastTypeEnum } from '@/graphql/types/contract-cast';
import { contractCasts, contractCastsPageInfo } from '../resolvers/contract-cast/contract-casts';
import { contractCast } from '../resolvers/contract-cast/contract-cast';

const ContractCastsWhereInput = builder.inputType('ContractCastsWhereInput', {
  fields: (t) => ({
    address: t.field({
      type: StringFilter,
      required: false,
    }),
    type: t.field({
      type: ContractCastTypeEnum,
      required: false,
    }),
    chainId: t.int({
      required: false,
    }),
    createdAt: t.field({
      type: DateTimeFilter,
      required: false,
    }),
  }),
});

export const ContractCastsOrderByEnum = builder.enumType('ContractCastsOrderByEnum', {
  values: ['id', 'type', 'address', 'chainId', 'blockNumber', 'createdAt'] as const,
});

builder.queryFields((t) => ({
  contractCast: t.prismaField({
    type: 'ContractCast',
    args: {
      id: t.arg.string({
        required: true,
      }),
    },
    resolve: contractCast,
  }),

  // Define a field that issues an optimized prisma query
  contractCasts: t.prismaField({
    type: ['ContractCast'],
    args: {
      where: t.arg({
        type: ContractCastsWhereInput,
        required: false,
      }),
      sortBy: t.arg({
        type: ContractCastsOrderByEnum,
        required: false,
      }),
      order: t.arg({
        type: SortOrderEnum,
        required: false,
      }),
      page: t.arg({
        type: 'Int',
        required: false,
      }),
    },
    resolve: contractCasts,
  }),
  contractCastsPageInfo: t.field({
    type: PothosPageInfo,
    args: {
      where: t.arg({
        type: ContractCastsWhereInput,
        required: false,
      }),
    },
    resolve: contractCastsPageInfo,
  }),
}));
