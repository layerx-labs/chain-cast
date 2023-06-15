import { ChainIds } from '@/types/index';
import { builder } from '../builder';
import { ContractCastTypeEnum } from '@/graphql/types/contract-cast';
import createContractCast from '../resolvers/contract-cast/create';
import { deleteContractCast } from '../resolvers/contract-cast/delete';
import web3 from 'web3';

export const CreateContractCastDataInput = builder.inputType('CreateContractCastDataInput', {
  fields: (t) => ({
    type: t.field({
      required: true,
      type: ContractCastTypeEnum,
    }),
    address: t.string({
      required: true,
      validate: {
        refine: [(val) => web3.utils.isAddress(val), { message: 'Not a valid address' }],
      },
    }),
    chainId: t.int({
      required: true,
      validate: {
        refine: [
          (val: number) => Object.values(ChainIds).includes(val),
          { message: 'Not a supported chain' },
        ],
      },
    }),
    startFrom: t.int({
      required: false,
      defaultValue: 0,
      validate: {
        min: 0,
        int: true,
      },
    }),
  }),
});

builder.mutationField('createContractCast', (t) =>
  t.prismaField({
    type: 'ContractCast',
    args: {
      data: t.arg({
        type: CreateContractCastDataInput,
        required: true,
      }),
    },
    resolve: async (_q, root, args, ctx, info) => createContractCast(root, args, ctx, info),
  })
);

builder.mutationField('deleteContractCast', (t) =>
  t.prismaField({
    type: 'ContractCast',
    args: {
      id: t.arg.string({
        required: true,
      }),
    },
    resolve: async (_q, root, args, ctx, info) => deleteContractCast(root, args, ctx, info),
  })
);
