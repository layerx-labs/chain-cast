import { builder } from '../builder';
import { ContractCastType } from '@prisma/client';

export const ContractCastTypeEnum = builder.enumType('ContractCastType', {
  values: Object.values(ContractCastType),
});

builder.prismaObject('ContractCast', {
  fields: (t) => ({
    id: t.exposeID('id'),
    address: t.exposeString('address'),
    chainId: t.exposeInt('chainId'),
    blockNumber: t.exposeInt('chainId'),
    transactionIndex: t.exposeInt('transactionIndex'),
    type: t.expose('type', {
      type: ContractCastTypeEnum,
    }),
    program: t.exposeString('program'),
    createdAt: t.expose('createdAt', {
      type: 'Date',
    }),
  }),
});
