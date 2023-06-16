import { UserInputError } from '@/middleware/errors';
import { ContractCast } from '@prisma/client';
import { ErrorsEnum } from '@/constants/index';
import { Resolver } from '@/graphql/types';
import { EVMContractCast } from '@/services/contract-cast';

export type ContractCastArgType = {
  id: string;
};

/**
 * Finds a Chain Cast by their Id
 * @param _1
 * @param args
 * @param ctx
 * @returns
 */
export const contractCast: Resolver<ContractCast, EVMContractCast, ContractCastArgType> = async (
  _1,
  args,
  ctx
) => {
  const cast = await ctx.db.contractCast.findUnique({
    where: {
      id: args?.id ?? '',
    },
    select: {
      id: true,
      address: true,
      blockNumber: true,
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
