import { builder } from '../builder';
import createSecret from '@/resolvers/secret/create';
import updateSecret from '@/resolvers/secret/update';
import deleteSecret from '@/resolvers/secret/delete';

export const CreateSecretDataInput = builder.inputType('CreateSecretDataInput', {
  fields: (t) => ({
    name: t.string({
      required: true,
      validate: {
        minLength: 4,
      },
    }),
    value: t.string({
      required: true,
      validate: {
        minLength: 4,
      },
    }),
    contractCastId: t.string({
      required: true,
      validate: {
        minLength: 4,
      },
    }),
  }),
});

builder.mutationField('createSecret', (t) =>
  t.prismaField({
    type: 'Secret',
    args: {
      data: t.arg({
        type: CreateSecretDataInput,
        required: true,
      }),
    },
    resolve: async (_q, root, args, ctx, info) => createSecret(root, args, ctx, info),
  })
);

export const UpdateSecretDataInput = builder.inputType('UpdateSecretDataInput', {
  fields: (t) => ({
    name: t.string({
      required: true,
      validate: {
        minLength: 4,
      },
    }),
    value: t.string({
      required: true,
      validate: {
        minLength: 4,
      },
    }),
    contractCastId: t.string({
      required: true,
      validate: {
        minLength: 4,
      },
    }),
  }),
});

export const UpdateWhereSecretDataInput = builder.inputType('UpdateWhereSecretDataInput', {
  fields: (t) => ({
    id: t.string({
      required: true,
      validate: {
        minLength: 4,
      },
    }),
  }),
});

builder.mutationField('updateSecret', (t) =>
  t.prismaField({
    type: 'Secret',
    args: {
      data: t.arg({
        type: UpdateSecretDataInput,
        required: true,
      }),
      where: t.arg({
        type: UpdateWhereSecretDataInput,
        required: true,
      }),
    },
    resolve: async (_q, root, args, ctx, info) => updateSecret(root, args, ctx, info),
  })
);

builder.mutationField('deleteSecret', (t) =>
  t.prismaField({
    type: 'Secret',
    args: {
      where: t.arg({
        type: UpdateWhereSecretDataInput,
        required: true,
      }),
    },
    resolve: async (_q, root, args, ctx, info) => deleteSecret(root, args, ctx, info),
  })
);
