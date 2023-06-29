import { Resolver } from '@/graphql/types';
import { encryptSecret } from '@/util/crypto';
import { Secret } from '@prisma/client';
import crypto from 'crypto';

export type ArgsType = {
  data: {
    name: string;
    value: string;
    contractCastId: string;
  };
};

const createSecret: Resolver<Secret, ArgsType> = async (
  _1,
  args,
  ctx
) => {
  const initVector = crypto.randomBytes(16);
  const encSecret = encryptSecret(args.data.value, initVector, 'base64');
  const secret = await ctx.db.secret.upsert({
    where: {
      name_contractCastId: {
        contractCastId: args.data.contractCastId,
        name: args.data.name,
      }
    },
    create: {
      name: args.data.name,
      value: encSecret,
      salt: Buffer.from(initVector).toString('base64'),
      contractCast: {
        connect: {
          id: args.data.contractCastId,
        }
      }
    },
    update: {
      value: encSecret,
      salt: Buffer.from(initVector).toString('base64'),
    }
  });
  ctx.manager.getCast(args.data.contractCastId)
             .getSecretsManager()
             .addSecret(args.data.name, args.data.value);
  ctx.log.d(`Created a new secret ${args.data.name}`);
  return secret;
};

export default createSecret;
