import { ErrorsEnum } from '@/constants/index';
import { Resolver } from '@/graphql/types';
import { UserInputError } from '@/middleware/errors';
import { ContractCast } from '@prisma/client';

type DeleteContractCastArgType = {
  id?: string;
  name?: string;
};

export const deleteContractCast: Resolver<ContractCast, DeleteContractCastArgType> = async (
  _1,
  args,
  ctx
) => {
  const contractCastToDelete = await ctx.db.contractCast.findUnique({
    where: {
      ...(args.id ? { id: args.id } : {}),
      ...(args.name ? { name: args.name } : {}),
    },
  });
  if (!contractCastToDelete) {
    throw new UserInputError('Chain Cast not found', ErrorsEnum.objectNotFound);
  }
  await ctx.manager.deleteCast(contractCastToDelete.id);
  const contractCast = await ctx.db.contractCast.delete({
    where: {
      id: contractCastToDelete.id,
    },
    select: {
      id: true,
      address: true,
      name: true,
      blockNumber: true,
      chainId: true,
      status: true,
      createdAt: true,
      program: true,
      type: true,
      transactionIndex: true,
      abi: true,
    },
  });
  ctx.log.i(
    `Deleted Chain Cast id ${contractCast.id} ${contractCast.chainId} ` + `${contractCast.address}`
  );
  return contractCast;
};
