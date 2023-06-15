import { PageInfo } from '@/graphql/types';
import { AppContext } from '@/types/index';
import { ContractCast, ContractCastType, Prisma } from '@prisma/client';

export type ContractCastsArgType = {
  where?:
     {
        address?: string | Prisma.StringFilter ;
        type?: ContractCastType ;
        chainId?: number | Prisma.IntFilter ;
        createdAt?: string | Prisma.DateTimeFilter;
      };
  sortBy?: 'id' | 'type' | 'address' | 'chainId' | 'blockNumber' | 'createdAt';
  order?: Prisma.SortOrder;
  page?: number;
};


export type ContractCastsArgPageInfoType = {
  where?:
     {
        address?: string | Prisma.StringFilter ;
        type?: ContractCastType ;
        chainId?: number | Prisma.IntFilter ;
        createdAt?: string | Prisma.DateTimeFilter;
      };
};
/**
 * 
 * @param _1
 * @param _2
 * @param args
 * @param ctx
 * @returns
 */
export async function contractCasts(
  _1: unknown,
  _2: unknown,
  args: ContractCastsArgType,
  ctx: AppContext
): Promise<ContractCast[]> {
  const { where, sortBy, order } = args;
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
}

export async function contractCastsPageInfo(
  _1: unknown,
  args: ContractCastsArgPageInfoType,
  ctx: AppContext
): Promise<PageInfo> {
  const { where } = args;
  const perPage = 20;
  const count = await ctx.db.contractCast.count({
    where,
  });
  const pageCount = count % perPage == 0 ? count / perPage : Math.floor(count / perPage) + 1;
  return new PageInfo(
    perPage,   
    pageCount,
    count,
  );
}
