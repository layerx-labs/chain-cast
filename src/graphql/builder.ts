/**
 * GraphQL schema builder configuration using Pothos (formerly GiraphQL).
 *
 * This module sets up the GraphQL schema builder with:
 * - Prisma integration for database operations
 * - Custom scalar types for Date, BigInt, URL, and JSON
 * - Input validation using Zod schemas
 * - Application context with database and service access
 */

// Import core Pothos GraphQL schema builder
import SchemaBuilder from '@pothos/core';
// Import Prisma plugin for automatic GraphQL types from database schema
import PrismaPlugin from '@pothos/plugin-prisma';
import type PrismaTypes from '@pothos/plugin-prisma/generated';
// Import Prisma database client
import prisma from '@/services/prisma';
// Import GraphQL scalar resolvers for extended types
import { DateResolver, BigIntResolver, URLResolver, JSONResolver } from 'graphql-scalars';
// Import application context type
import type { AppContext } from '@/types/index';
// Import validation plugin for input validation
import ValidationPlugin from '@pothos/plugin-validation';
// Import custom error class
import { UserInputError } from '@/middleware/errors';

/**
 * Configured GraphQL schema builder instance.
 *
 * This builder is configured with:
 * - Custom scalar types for enhanced type safety
 * - Prisma integration for automatic CRUD operations
 * - Input validation with detailed error messages
 * - Application context providing access to services
 */
export const builder = new SchemaBuilder<{
  // Custom scalar type definitions
  Scalars: {
    Date: { Input: Date; Output: Date }; // Date/time values
    JSON: { Input: unknown; Output: unknown }; // Arbitrary JSON objects
    BigInt: { Input: bigint; Output: bigint }; // Large integer values
    URL: { Input: string; Output: string }; // URL strings with validation
  };
  // Auto-generated Prisma types for database operations
  PrismaTypes: PrismaTypes;
  // Application context available in all resolvers
  Context: AppContext;
}>({
  // Enabled plugins
  plugins: [PrismaPlugin, ValidationPlugin],

  // Prisma configuration
  prisma: {
    client: prisma, // Database client instance
  },

  // Validation error handling configuration
  validationOptions: {
    validationError: (zodError) => {
      // Transform Zod validation errors into a structured error format
      const errors: { [key: string]: any } = {};
      zodError.errors.forEach((error) => {
        const key = error.path.join('.'); // Create dot-notation path for nested errors
        errors[key] = error.message;
      });
      return new UserInputError('Invalid Input', 401, errors);
    },
  },
});

// Initialize empty query and mutation types (fields will be added by imported modules)
builder.queryType({});
builder.mutationType({});

// Register custom scalar types for use in the schema
builder.addScalarType('Date', DateResolver, {});
builder.addScalarType('BigInt', BigIntResolver, {});
builder.addScalarType('URL', URLResolver, {});
builder.addScalarType('JSON', JSONResolver, {});
