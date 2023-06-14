import { builder } from '../builder';
import { DateTimeFilter, PageInfo, SortOrderEnum, StringFilter } from '@/graphql/types';
import { BeproChainCastTypeEnum } from '@/graphql/types/ChainCast';

const ChainCastsWhereInput = builder.inputType('ChainCastsWhereInput', {
  fields: (t) => ({
    id: t.int({ required: false }),
    address: t.field({
      type: StringFilter,
      required: false,
    }),
    type: t.field({
      type: BeproChainCastTypeEnum,
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

const ChainCastsOrderByEnum = builder.enumType('ChainCastsOrderByEnum', {
  values: ['id', 'type', 'address', 'chainId', 'blockNumber', 'createdAt'] as const,
});

builder.queryFields((t) => ({
  chain: t.prismaField({
    type: 'ChainCast',
    args: {
      id: t.arg.id(),
    },
    resolve: async () => {
      throw Error('TODO');
    },
  }),
  // Define a field that issues an optimized prisma query
  chains: t.prismaField({
    type: ['ChainCast'],
    args: {
      where: t.arg({
        type: ChainCastsWhereInput,
        required: true,
      }),
      sortBy: t.arg({
        type: ChainCastsOrderByEnum,
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
    resolve: async () => {
      throw Error('TODO');
    },
  }),
  chainsPageInfo: t.field({
    type: PageInfo,
    args: {
      where: t.arg({
        type: ChainCastsWhereInput,
        required: true,
      }),
      sortBy: t.arg({
        type: ChainCastsOrderByEnum,
        required: false,
      }),
      order: t.arg({
        type: SortOrderEnum,
        required: true,
      }),
    },
    resolve: async () => {
      throw Error('TODO');
    },
  }),
}));
