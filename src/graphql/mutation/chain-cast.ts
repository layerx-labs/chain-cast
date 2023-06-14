import { ChainIds, ChainNames } from '@/types/index';
import { builder } from '../builder';
import { ChainCastTypeEnum } from '@/graphql/types/ChainCast';
import createChainCast from '../resolvers/chain-cast/create';
import { deleteChainCast } from '../resolvers/chain-cast/delete';
import { validate } from 'graphql';
import web3 from "web3";

export const CreateChainCastDataInput = builder.inputType('CreateChainCastDataInput', {
    fields: (t) => ({
        type: t.field({
            type: ChainCastTypeEnum,
        }),
        address: t.string({ 
            required: true ,
            validate: {
                refine: [(val) => web3.utils.isAddress(val), {message: "Not a valid address"}],
            }
        }),
        chainId: t.int({ 
            required: true, 
            validate: {
                refine: [(val: number) => Object.values(ChainIds).includes(val), {message: "Not a supported chain"}],
            }
        }),
        startFrom: t.int({ 
            required: false, 
            defaultValue: 0,
            validate: {
                min: 0,
                int: true,
            }
        }),
    }),
});

builder.mutationField('createChainCast', (t) =>
  t.prismaField({
    type: 'ChainCast',
    args: {
        data: t.arg({
            type: CreateChainCastDataInput,
            required: true,
        }),
    },
    resolve: createChainCast,
  })
)

builder.mutationField('deleteChainCast', (t) =>
  t.prismaField({
    type: 'ChainCast',
    args: {
        id: t.arg.id({
            required: true,
        }),   
    },
    resolve: deleteChainCast,
  })
)
