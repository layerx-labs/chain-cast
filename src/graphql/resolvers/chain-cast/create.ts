import { ErrorsEnum } from "@/constants/index";
import { UserInputError } from "@/middleware/errors";
import { AppContext } from "@/types/index";
import { ChainCast, ChainCastType } from "@prisma/client";
import { create } from "domain";
import web3 from "web3";

export type CreateChainCastArgType = {
    data: {
        address: string,
        type: ChainCastType,
        chainId: number,
        startFrom?: number,
    },    
}


export default async function createChainCast(
    _1: unknown,
    _2: unknown,
    args: CreateChainCastArgType,
    ctx: AppContext
  ): Promise<ChainCast> {

    const oldChainCast = await ctx.db.chainCast.findUnique({
        where: {
            chainId_address: {
                address: args.data.address,
                chainId: args.data.chainId,
            }
        }
    });
    if (oldChainCast) {
        throw new UserInputError(
            'Chain Cast already found', 
            ErrorsEnum.alreadyExists
        );
    }

    const chainCast = await ctx.db.chainCast.create({    
        data: {
            address: args.data.address,
            type: args.data.type,
            chainId: args.data.chainId,
            blockNumber: args.data.startFrom,
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
    ctx.log.i(`Created a new Chain Cast id ${chainCast.id} ${chainCast.chainId} ${chainCast.address}`)
    ctx.whisperer.addStream(chainCast);
    return chainCast;
}