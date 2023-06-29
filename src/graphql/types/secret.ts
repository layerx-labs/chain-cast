import { builder } from '../builder';

builder.prismaObject('Secret', {
  fields: (t) => ({
    id: t.exposeID('id'),
    name: t.exposeString('name'),
    value: t.exposeString('value'),
    salt: t.exposeString('salt'),   
    createdAt: t.expose('createdAt', {
      type: 'Date',
    }),
    updatedAt: t.expose('updatedAt', {
        type: 'Date',
      }),
  }),
});
