import { PageInfo, Resolver } from '@/graphql/types';
import { ContractCast, ContractCastType, Prisma } from '@prisma/client';

export type ContractCastsArgType = {
  where?: {
    address?: string | Prisma.StringFilter;
    type?: ContractCastType;
    chainId?: number | Prisma.IntFilter;
    createdAt?: string | Prisma.DateTimeFilter;
  };
  sortBy?: 'id' | 'type' | 'address' | 'chainId' | 'blockNumber' | 'createdAt';
  order?: Prisma.SortOrder;
  page?: number;
};

export type ContractCastsArgPageInfoType = {
  where?: {
    address?: string | Prisma.StringFilter;
    type?: ContractCastType;
    chainId?: number | Prisma.IntFilter;
    createdAt?: string | Prisma.DateTimeFilter;
  };
};

/**
 *
 * @param _1
 * @param args
 * @param ctx
 * @returns
 */
export const contractCasts: Resolver<ContractCast[], ContractCastsArgType> = async (
  _1,
  args,
  ctx
) => {
  const { where, sortBy, order } = args as ContractCastsArgType;
  const perPage = 20;
  const page = args.page || 0;
  const skip = page * perPage;
  const take = perPage;
  const casts = await ctx.db.contractCast.findMany({
    where,
    skip,
    take,
    orderBy: sortBy
      ? {
          [sortBy]: order || 'asc',
        }
      : {},
    select: {
      id: true,
      address: true,
      blockNumber: true,
      chainId: true,
      createdAt: true,
      type: true,
    },
  });
  return casts;
};

export const contractCastsPageInfo: Resolver<PageInfo, ContractCastsArgPageInfoType> = async (
  _1,
  args,
  ctx
) => {
  const { where } = args as ContractCastsArgPageInfoType;
  const perPage = 20;
  const count = await ctx.db.contractCast.count({
    where,
  });
  const pageCount = count % perPage == 0 ? count / perPage : Math.floor(count / perPage) + 1;
  return new PageInfo(perPage, pageCount, count);
};
