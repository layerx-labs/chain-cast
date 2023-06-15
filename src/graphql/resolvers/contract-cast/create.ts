import { ErrorsEnum } from "@/constants/index";
import { UserInputError } from "@/middleware/errors";
import { AppContext } from "@/types/index";
import { ContractCast, ContractCastType } from "@prisma/client";

export type CreateContractCastArgType = {
    data: {
        address: string,
        type: ContractCastType,
        chainId: number,
        startFrom?: number | null | undefined,
    },    
}


export default async function createContractCast(
    _1: unknown,
    _2: unknown,
    args: CreateContractCastArgType,
    ctx: AppContext
  ): Promise<ContractCast> {

    const oldContractCast = await ctx.db.contractCast.findUnique({
        where: {
            chainId_address: {
                address: args.data.address,
                chainId: args.data.chainId,
            }
        }
    });
    if (oldContractCast) {
        throw new UserInputError(
            'Chain Cast already found', 
            ErrorsEnum.alreadyExists
        );
    }

    const contractCast = await ctx.db.contractCast.create({    
        data: {
            address: args.data.address,
            type: args.data.type,
            chainId: args.data.chainId,
            blockNumber: args.data.startFrom ?? 0,
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
    ctx.log.i(`Created a new Chain Cast id ${contractCast.id} ${contractCast.chainId} ` + 
              `${contractCast.address}`)
    ctx.whisperer.addCast(contractCast);
    return contractCast;
}