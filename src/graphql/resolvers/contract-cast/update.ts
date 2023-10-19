import { ErrorsEnum } from '@/constants/index';
import { Resolver } from '@/graphql/types';
import { ChainCastProgram } from '@/lib/program';
import { UserInputError } from '@/middleware/errors';
import { ContractCast } from '@prisma/client';


export type UpdateContractCastArgType = {
  where: {
    id: string;
  },
  data: {
    program: string;
  };
};

const updateContractCast: Resolver<ContractCast, UpdateContractCastArgType> = async (
  _1,
  args,
  ctx
) => {
  const stringCode = args.data.program;
  const program = new ChainCastProgram(ctx.manager.getSupportedInstructions());
  
  if (!program.compile(stringCode)) {
    throw new UserInputError('Invalid Code for Chain Cast', ErrorsEnum.invalidUserInput);
  }
  const contractCast = await ctx.db.contractCast.update({
    where: {
        id: args.where.id    
    },
    data: {
      program: stringCode,
    },
    select: {
      id: true,
      address: true,
      program: true,
      blockNumber: true,
      transactionIndex: true,
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
  ctx.manager.updateCast(args.where.id, stringCode);
  return contractCast;
};

export default updateContractCast;
