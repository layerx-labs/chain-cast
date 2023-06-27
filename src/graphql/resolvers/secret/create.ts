import { Resolver } from '@/graphql/types';
import { encryptSecret } from '@/util/crypto';
import { Secret } from '@prisma/client';
import crypto from 'crypto';

export type ArgsType = {
  data: {
    name: string;
    value: string;
  };
};

const createSecret: Resolver<Secret, ArgsType> = async (
  _1,
  args,
  ctx
) => {
  const initVector = crypto.randomBytes(16);
  const encSecret = encryptSecret(args.data.name, initVector, 'base64');
  const secret = await ctx.db.secret.upsert({
    where: {
      name: args.data.name,
    },
    create: {
      name: args.data.name,
      value: encSecret,
      salt: Buffer.from(initVector).toString('base64'),
    },
    update: {
      value: encSecret,
      salt: Buffer.from(initVector).toString('base64'),
    }
  });
  ctx.secrets.addSecret(args.data.name, args.data.value);
  ctx.log.d(`Created a new secret ${args.data.name}`);
  return secret;
};

export default createSecret;
