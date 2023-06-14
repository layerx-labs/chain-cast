import { ChainIds } from '@/types/index';
import { builder } from '../builder';
import { ChainCastTypeEnum } from '@/graphql/types/ChainCast';
import { chainCast } from '../resolvers/chain-cast/chain';
import createChainCast from '../resolvers/chain-cast/create';
import { deleteChainCast } from '../resolvers/chain-cast/delete';


export const ChainIdsEnum = builder.enumType('ChainIds', {
    values: Object.values(typeof ChainIds),
});


export const CreateChainCastDataInput = builder.inputType('CreateChainCastDataInput', {
    fields: (t) => ({
        type: t.field({
            type: ChainCastTypeEnum,
        }),
        address: t.string({ required: true }),
        chainId: t.field({
            type: ChainIdsEnum
        }),
        startFrom: t.int({ required: false, defaultValue: 0 }),
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
