// 1.
import SchemaBuilder from '@pothos/core';
import PrismaPlugin from '@pothos/plugin-prisma';
import type PrismaTypes from '@pothos/plugin-prisma/generated';
import prisma from '@/services/prisma';
import { DateResolver, BigIntResolver, URLResolver, JSONResolver } from 'graphql-scalars';
import { AppContext } from '@/types/index';
import ValidationPlugin from '@pothos/plugin-validation';
import { UserInputError } from '@/middleware/errors';
import { error } from 'console';
// 2.
export const builder = new SchemaBuilder<{
  // 3.
  Scalars: {
    Date: { Input: Date; Output: Date };
    JSON: { Input: unknown; Output: unknown };
    BigInt: { Input: bigint; Output: bigint };
    URL: { Input: string; Output: string };
  };
  PrismaTypes: PrismaTypes;
  Context: AppContext;
}>({
  // 4.

  plugins: [PrismaPlugin, ValidationPlugin],
  prisma: {
    client: prisma,
  },
  validationOptions: {
    validationError: (zodError, args, context, info) => {
      const errors: {[key: string]: any} = {};
      zodError.errors.forEach(error=> { 
        const key = error.path.join(".");
        errors[key] = error.message; 
      })
      return new UserInputError(
        "Invalid Input",
        401,
        errors
      );
    },
  },
});
builder.queryType({});
builder.mutationType({});
builder.addScalarType('Date', DateResolver, {});
builder.addScalarType('BigInt', BigIntResolver, {});
builder.addScalarType('URL', URLResolver, {});
builder.addScalarType('JSON', JSONResolver, {});
