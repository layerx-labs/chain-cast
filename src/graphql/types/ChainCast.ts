import { builder } from '../builder';
import {ChainCastType} from '@prisma/client';

export const ChainCastTypeEnum = builder.enumType('ChainCastType', {
  values: Object.values(ChainCastType),
});

builder.prismaObject('ChainCast', {
    fields: (t) => ({
      id: t.exposeID('id'),
      address: t.exposeString('address'),
      chainId: t.exposeInt('chainId'),     
      blockNumber: t.exposeInt('chainId'),     
      type: t.expose('type', {
        type: ChainCastTypeEnum,
      }),    
      createdAt: t.expose('createdAt', {
        type: 'Date',
      }),    
    })
  })

