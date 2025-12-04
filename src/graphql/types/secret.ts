import { builder } from '../builder';

/**
 * GraphQL object type for Secret entities.
 * Represents encrypted sensitive information used by contract casts.
 * Automatically generated from Prisma schema with field mappings.
 */
builder.prismaObject('Secret', {
  fields: (t) => ({
    id: t.exposeID('id'), // Unique identifier for the secret
    name: t.exposeString('name'), // Secret name/key identifier
    value: t.exposeString('value'), // Encrypted secret value
    salt: t.exposeString('salt'), // Salt used for encryption
    createdAt: t.expose('createdAt', {
      // Timestamp when secret was created
      type: 'Date',
    }),
    updatedAt: t.expose('updatedAt', {
      // Timestamp when secret was last updated
      type: 'Date',
    }),
  }),
});
