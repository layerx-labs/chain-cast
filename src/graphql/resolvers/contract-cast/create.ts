import { ErrorsEnum } from '@/constants/index';
import { Resolver } from '@/graphql/types';
import { ChainCastProgram } from '@/lib/program';
import { UserInputError } from '@/middleware/errors';
import { encryptSecret } from '@/util/crypto';
import { ContractCast, ContractCastType } from '@prisma/client';
import crypto from 'crypto';

export type CreateContractCastArgType = {
  data: {
    address: string;
    type: ContractCastType;
    name?: string;
    chainId: number;
    abi: string;
    startFrom?: number;
    program: string;
    secrets?: {
      name: string;
      value: string;
    }[];
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
  const stringCode = args.data.program;
  const program = new ChainCastProgram(ctx.manager.getSupportedInstructions());

  if (!program.compile(stringCode)) {
    throw new UserInputError('Invalid Code for Chain Cast', ErrorsEnum.invalidUserInput);
  }
  const secrets: {
    name: string;
    value: string;
    salt: string;
  }[] = args.data.secrets
    ? args.data.secrets.map((s) => {
        const initVector = crypto.randomBytes(16);
        const encSecret = encryptSecret(s.value, initVector, 'base64');
        return {
          name: s.name,
          value: encSecret,
          salt: Buffer.from(initVector).toString('base64'),
        };
      })
    : [];

  if (args.data.type === 'CUSTOM' && !args.data.abi) {
    throw new UserInputError('ABI was not provided', ErrorsEnum.invalidUserInput);
  }

  const contractCast = await ctx.db.contractCast.create({
    data: {
      address: args.data.address,
      name: args.data.name,
      abi: args.data.abi,
      type: args.data.type,
      chainId: args.data.chainId,
      blockNumber: args.data.startFrom ?? 0,
      transactionIndex: 0,
      program: args.data.program ?? {},
      secrets: {
        createMany: {
          data: secrets,
        },
      },
    },
    select: {
      id: true,
      address: true,
      name: true,
      abi: true,
      program: true,
      status: true,
      blockNumber: true,
      transactionIndex: true,
      chainId: true,
      createdAt: true,
      type: true,
    },
  });
  ctx.log.i(
    `Created a new Chain Cast id ${contractCast.id} ${contractCast.chainId} ` +
      `${contractCast.address}`
  );
  ctx.manager.addCast(contractCast);
  return contractCast;
};

export default createContractCast;
