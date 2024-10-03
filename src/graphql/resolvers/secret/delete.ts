import { Resolver } from '@/graphql/types';
import { Secret } from '@prisma/client';
import { ErrorsEnum } from '@/constants/index';
import { UserInputError } from '@/middleware/errors';

export type ArgsType = {
  where: {
    id: string;
  };
};

const deleteSecret: Resolver<Secret, ArgsType> = async (_1, args, ctx) => {
  const secret = await ctx.db.secret.findUnique({
    where: {
      id: args.where.id,
    },
  });
  if (!secret) {
    throw new UserInputError('Secret not found to update', ErrorsEnum.invalidUserInput);
  }
  const res = await ctx.db.secret.delete({
    where: {
      id: args.where.id,
    },
  });
  ctx.manager.getCast(secret.contractCastId).getSecretsManager().deleteSecret(secret.name);
  ctx.log.d(`Deleted secret ${res.id}`);
  return res;
};

export default deleteSecret;
