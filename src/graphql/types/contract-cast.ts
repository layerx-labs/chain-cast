import { builder } from '../builder';
import { ContractCastType, ContractCastStatus } from '@prisma/client';

export const ContractCastTypeEnum = builder.enumType('ContractCastType', {
  values: Object.values(ContractCastType),
});

export const ContractCastStatusEnum = builder.enumType('ContractCastStatusEnum', {
  values: Object.values(ContractCastStatus),
});

builder.prismaObject('ContractCast', {
  fields: (t) => ({
    id: t.exposeID('id'),
    name: t.exposeString('name', {
      nullable: true,
    }),
    address: t.exposeString('address'),
    chainId: t.exposeInt('chainId'),
    blockNumber: t.exposeInt('chainId'),
    transactionIndex: t.exposeInt('transactionIndex'),
    type: t.expose('type', {
      type: ContractCastTypeEnum,
    }),
    status: t.expose('status', {
      type: ContractCastStatusEnum,
    }),
    program: t.exposeString('program'),
    createdAt: t.expose('createdAt', {
      type: 'Date',
    }),
  }),
});
