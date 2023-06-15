import { ErrorsEnum } from '@/constants/index';
import { Resolver } from '@/graphql/types';
import { UserInputError } from '@/middleware/errors';
import { ContractCast, ContractCastType } from '@prisma/client';

export type CreateContractCastArgType = {
  data: {
    address: string;
    type: ContractCastType;
    chainId: number;
    startFrom?: number;
    program:  unknown,
  };
};

const createContractCast: Resolver<ContractCast, CreateContractCastArgType> = async (
  _1,
  args,
  ctx
) => {
  const oldContractCast = await ctx.db.contractCast.findUnique({
    where: {
      chainId_address: {
        address: args.data.address,
        chainId: args.data.chainId,
      },
    },
  });
  if (oldContractCast) {
    throw new UserInputError('Chain Cast already found', ErrorsEnum.alreadyExists);
  }

  const contractCast = await ctx.db.contractCast.create({
    data: {
      address: args.data.address,
      type: args.data.type,
      chainId: args.data.chainId,
      blockNumber: args.data.startFrom ?? 0,
      program: args.data.program ?? {},
    },
    select: {
      id: true,
      address: true,
      program: true,
      blockNumber: true,
      chainId: true,
      createdAt: true,
      type: true,
    },
  });
  ctx.log.i(
    `Created a new Chain Cast id ${contractCast.id} ${contractCast.chainId} ` +
      `${contractCast.address}`
  );
  ctx.whisperer.addCast(contractCast);
  return contractCast;
};

export default createContractCast;
