import { ChainIds } from '@/types/index';
import { builder } from '../builder';
import { ContractCastTypeEnum } from '@/graphql/types/contract-cast';
import createContractCast from '../resolvers/contract-cast/create';
import updateContractCast from '../resolvers/contract-cast/update';
import { deleteContractCast } from '../resolvers/contract-cast/delete';
import web3 from 'web3';


export const EmbedSecretDataInput = builder.inputType('EmbedSecretDataInput', {
  fields: (t) => ({
    name: t.string({
      required: true,
      validate: {
        maxLength: 0,
      },
    }),
    value: t.string({
      required: true,
      validate: {
        maxLength: 0,
      },
    }),
  }),
});

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
    program: t.string({
      required: true,
      validate: {
        maxLength: 0,
      },
    }),
    name: t.string({
      required: true,
      validate: {
        minLength: 2,
      },
    }),
    abi: t.string({
      required: true,
      validate: {
        minLength: 0,
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
    secrets: t.field({
      required: false,
      type: [EmbedSecretDataInput],
    }),
  }),
});

export const UpdateContractCastDataInput = builder.inputType('UpdateContractCastDataInput', {
  fields: (t) => ({
    program: t.string({
      required: false,
    }),
    abi: t.string({
      required: false,
    }),
  }),
});

export const UpdateWhereContractCastDataInput = builder.inputType(
  'UpdateWhereContractCastDataInput',
  {
    fields: (t) => ({
      id: t.string({
        required: false,
      }),
      name: t.string({
        required: false,
      }),
    }),
  }
);

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

builder.mutationField('updateContractCast', (t) =>
  t.prismaField({
    type: 'ContractCast',
    args: {
      where: t.arg({
        type: UpdateWhereContractCastDataInput,
        required: true,
      }),
      data: t.arg({
        type: UpdateContractCastDataInput,
        required: true,
      }),
    },
    resolve: async (_q, root, args, ctx, info) => updateContractCast(root, args, ctx, info),
  })
);

builder.mutationField('deleteContractCast', (t) =>
  t.prismaField({
    type: 'ContractCast',
    args: {
      id: t.arg.string({
        required: false,
      }),
      name: t.arg.string({
        required: false,
      }),
    },
    resolve: async (_q, root, args, ctx, info) => deleteContractCast(root, args, ctx, info),
  })
);
