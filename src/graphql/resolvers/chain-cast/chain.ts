import { UserInputError } from '@/middleware/errors';
import { AppContext } from '@/types/index';
import { ChainCast } from '@prisma/client';
import { ErrorsEnum } from '@/constants/index';

export type ChainCastArgType = {
    id: string;
}

/**
 * Finds a Chain Cast by their Id 
 * @param _1 
 * @param _2 
 * @param args 
 * @param ctx 
 * @returns 
 */
export async function chainCast(
  _1: unknown,
  _2: unknown,
  args: ChainCastArgType,
  ctx: AppContext
): Promise<ChainCast> {
  const cast = await ctx.db.chainCast.findUnique({
    where: {
      id: args.id,
    },
    select: {
      id: true,
      address: true,
      blockNumber: true,
      chainId: true,
      createdAt: true,
      type: true,
    },
  });

  if (!cast) {
    throw new UserInputError(
        'Chain Cast not found', 
        ErrorsEnum.objectNotFound
    );
  }
  return cast;
}
