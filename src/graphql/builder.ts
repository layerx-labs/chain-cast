// 1.
import SchemaBuilder from '@pothos/core';
import PrismaPlugin from '@pothos/plugin-prisma';
import type PrismaTypes from '@pothos/plugin-prisma/generated';
import prisma from '@/services/prisma';
import { DateResolver, BigIntResolver, URLResolver, JSONResolver } from 'graphql-scalars';

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
}>({
  // 4.

  plugins: [PrismaPlugin],
  prisma: {
    client: prisma,
  },
});
builder.queryType({});
builder.mutationType({});
builder.addScalarType('Date', DateResolver, {});
builder.addScalarType('BigInt', BigIntResolver, {});
builder.addScalarType('URL', URLResolver, {});
builder.addScalarType('JSON', JSONResolver, {});
