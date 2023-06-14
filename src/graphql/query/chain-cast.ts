import { builder } from '../builder';
import { DateTimeFilter, PageInfo, SortOrderEnum, StringFilter } from '@/graphql/types';
import { ChainCastTypeEnum } from '@/graphql/types/ChainCast';
import { chainCasts, chainCastsPageInfo } from '../resolvers/chain-cast/chains';
import { chainCast } from '../resolvers/chain-cast/chain';

const ChainCastsWhereInput = builder.inputType('ChainCastsWhereInput', {
  fields: (t) => ({
    address: t.field({
      type: StringFilter,
      required: false,
    }),
    type: t.field({
      type: ChainCastTypeEnum,
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
  chainCast: t.prismaField({
    type: 'ChainCast',
    args: {
      id: t.arg.id(),
    },
    resolve: chainCast,
  }),
  // Define a field that issues an optimized prisma query
  chainCasts: t.prismaField({
    type: ['ChainCast'],
    args: {
      where: t.arg({
        type: ChainCastsWhereInput,
        required: false,
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
    resolve: chainCasts,
  }),
  chainsPageInfo: t.field({
    type: PageInfo,
    args: {
      where: t.arg({
        type: ChainCastsWhereInput,
        required: true,
      }),     
    },
    resolve: chainCastsPageInfo,
  }),
}));
