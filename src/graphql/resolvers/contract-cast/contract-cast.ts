import { UserInputError } from '@/middleware/errors';
import { AppContext } from '@/types/index';
import { ContractCast } from '@prisma/client';
import { ErrorsEnum } from '@/constants/index';

export type ContractCastArgType = {
    id: string | null | undefined;
}

/**
 * Finds a Chain Cast by their Id 
 * @param _1 
 * @param _2 
 * @param args 
 * @param ctx 
 * @returns 
 */
export async function contractCast(
  _1: unknown,
  _2: unknown,
  args: ContractCastArgType,
  ctx: AppContext
): Promise<ContractCast> {
  const cast = await ctx.db.contractCast.findUnique({
    where: {
      id: args?.id ?? '',
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
