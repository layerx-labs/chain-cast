import { UserInputError } from '@/middleware/errors';
import { ContractCast } from '@prisma/client';
import { ErrorsEnum } from '@/constants/index';
import { Resolver } from '@/graphql/types';

export type ContractCastArgType = {
  id?: string;
  chainId_address?: {
    chainId: number;
    address: string;
  };
};

/**
 * Finds a Chain Cast by their Id
 * @param _1
 * @param args
 * @param ctx
 * @returns
 */
export const contractCast: Resolver<ContractCast, ContractCastArgType> = async (_1, args, ctx) => {
  const cast = await ctx.db.contractCast.findUnique({
    where: {
      ...(args?.id && { id: args.id }),
      ...(args?.chainId_address && {
        chainId_address: {
          chainId: args.chainId_address.chainId,
          address: args.chainId_address.address,
        },
      }),
    },
    select: {
      id: true,
      name: true,
      address: true,
      blockNumber: true,
      status: true,
      transactionIndex: true,
      abi: true,
      chainId: true,
      createdAt: true,
      program: true,
      type: true,
    },
  });

  if (!cast) {
    throw new UserInputError('Chain Cast not found', ErrorsEnum.objectNotFound);
  }
  return cast;
};
