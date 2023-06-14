

import { PageInfo } from "@/graphql/types";
import { AppContext } from "@/types/index";
import { ChainCast,ChainCastType, Prisma } from "@prisma/client";

export type ChainCastsArgType = {
    where?: {
        address: Prisma.StringFilter,
        type: ChainCastType,
        chainId: number,
        createdAt: Prisma.DateTimeFilter,
    },
    sortBy?: 'id'| 'type'| 'address'| 'chainId'| 'blockNumber'|'createdAt',
    order?: Prisma.SortOrder,
    page?: number,
}
/**
 * 
 * @param _1 
 * @param _2 
 * @param args 
 * @param ctx 
 * @returns 
 */
export async function chainCasts(
    _1: unknown,
    _2: unknown,
    args: ChainCastsArgType,
    ctx: AppContext
  ): Promise<ChainCast[]> {
    const { where, sortBy, order }  = args;
    const perPage = 20;
    const page = args.page || 0;
    const skip = page * perPage;
    const take = perPage;
    const casts = await ctx.db.chainCast.findMany({
        where: {
            ...where,
        },
        skip,
        take,
        orderBy: sortBy ? {
            [sortBy]: order || "asc",            
        }: {},
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

export async function chainCastsPageInfo(
    _1: unknown,
    _2: unknown,
    args: ChainCastsArgType,
    ctx: AppContext
  ): Promise<PageInfo> {
    const { where, sortBy, order }  = args;
    const perPage = 20;
    const count = await ctx.db.chainCast.count({
        where: {
            ...where,
        },        
      });
    const pageCount = count % perPage == 0 ? count / perPage : Math.floor(count / perPage) + 1;
    return {
        perPage: perPage,
        recordCount: count,
        pageCount: pageCount,
    };
}