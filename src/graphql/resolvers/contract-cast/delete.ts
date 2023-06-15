import { ErrorsEnum } from '@/constants/index';
import { UserInputError } from '@/middleware/errors';
import { AppContext } from '@/types/index';
import { ContractCast } from '@prisma/client';

export async function deleteContractCast(
    _1: unknown,
    _2: unknown,
    args: {
        id: string,
    },
     ctx: AppContext
  ): Promise<ContractCast> {

    const contractCast = await ctx.db.contractCast.delete({    
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
    if (!contractCast) {
        throw new UserInputError(
            'Chain Cast not found', 
            ErrorsEnum.objectNotFound
        );
    }
    ctx.log.i(`Deleted Chain Cast id ${contractCast.id} ${contractCast.chainId} `+ 
             `${contractCast.address}`)
    ctx.whisperer.deleteCast(contractCast.id);
    return contractCast;
}