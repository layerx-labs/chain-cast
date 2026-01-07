import crypto from 'node:crypto';
import { ErrorsEnum } from '@/constants/index';
import type { Resolver } from '@/graphql/types';
import { UserInputError } from '@/middleware/errors';
import { encryptSecret } from '@/util/crypto';
import type { Secret } from '@prisma/client';

export type ArgsType = {
  where: {
    id: string;
  };
  data: {
    name: string;
    value: string;
    contractCastId: string;
  };
};

const updateSecret: Resolver<Secret, ArgsType> = async (_1, args, ctx) => {
  const secret = await ctx.db.secret.findUnique({
    where: {
      id: args.where.id,
    },
  });
  if (!secret) {
    throw new UserInputError('Secret not found to update', ErrorsEnum.invalidUserInput);
  }
  const initVector = crypto.randomBytes(16);
  const encSecret = encryptSecret(args.data.value, initVector, 'base64');
  const res = await ctx.db.secret.update({
    where: {
      id: args.where.id,
    },
    data: {
      value: encSecret,
      salt: Buffer.from(initVector).toString('base64'),
    },
  });
  ctx.manager
    .getCast(args.data.contractCastId)
    .getSecretsManager()
    .addSecret(args.data.name, args.data.value);
  ctx.log.d(`Updated secret ${args.data.name}`);
  return res;
};

export default updateSecret;
