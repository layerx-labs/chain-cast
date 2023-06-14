import { ErrorsEnum } from "@/constants/index";
import { UserInputError } from "@/middleware/errors";
import { AppContext } from "@/types/index";
import { ChainCast } from "@prisma/client";

export async function deleteChainCast(
    _1: unknown,
    _2: unknown,
    args: {
        id: string,
    },
     ctx: AppContext
  ): Promise<ChainCast> {

    const chainCast = await ctx.db.chainCast.findUnique({    
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
    })
    if (!chainCast) {
        throw new UserInputError(
            'Chain Cast not found', 
            ErrorsEnum.objectNotFound
        );
    }
    ctx.log.i(`Deleted Chain Cast id ${chainCast.id} ${chainCast.chainId} ${chainCast.address}`)
    return chainCast;
}