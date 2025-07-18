import { ErrorsEnum } from '@/constants/index';
import { Resolver } from '@/graphql/types';
import { ChainCastProgram } from '@/lib/program';
import { UserInputError } from '@/middleware/errors';
import { ContractCast } from '@prisma/client';

export type UpdateContractCastArgType = {
  where: {
    id?: string;
    name?: string;
  };
  data: {
    program?: string;
    abi?: string;
  };
};

const updateContractCast: Resolver<ContractCast, UpdateContractCastArgType> = async (
  _1,
  args,
  ctx
) => {
  const program = new ChainCastProgram(ctx.manager.getSupportedInstructions());

  if (args.data?.program && !program.compile(args.data.program)) {
    throw new UserInputError('Invalid Code for Chain Cast', ErrorsEnum.invalidUserInput);
  }

  if (!args.where.id && !args.where.name) {
    throw new UserInputError('No id or name provided', ErrorsEnum.invalidUserInput);
  }
  const contractCast = await ctx.db.contractCast.update({
    where: {
      ...(args.where.id ? { id: args.where.id } : {}),
      ...(args.where.name ? { name: args.where.name } : {}),
    },
    data: {
      ...(args.data.program ? { program: args.data.program } : {}),
      ...(args.data.abi ? { abi: args.data.abi } : {}),
    },
    select: {
      id: true,
      name: true,
      address: true,
      program: true,
      blockNumber: true,
      transactionIndex: true,
      status: true,
      abi: true,
      chainId: true,
      createdAt: true,
      type: true,
    },
  });
  if (!contractCast) {
    throw new UserInputError('Chain Cast not found', ErrorsEnum.objectNotFound);
  }
  ctx.log.i(`Updatred Chain Cast id ${contractCast.id} program`);
  ctx.manager.restartCast(contractCast.id);
  return contractCast;
};

export default updateContractCast;
