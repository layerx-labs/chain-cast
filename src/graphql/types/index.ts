import type { AppContext } from '@/types/index';
import { Prisma } from '@prisma/client';
import { builder } from '../builder';

/**
 * Result class for GraphQL operation responses.
 * Provides a standardized way to return operation results with messages and status codes.
 */
export class Result {
  message: string;
  code: number;

  constructor(message: string, code: number) {
    this.message = message;
    this.code = code;
  }
}

/**
 * Pagination information for GraphQL queries.
 * Contains metadata about paginated results including page size and total counts.
 */
export class PageInfo {
  perPage: number; // Number of items per page
  pageCount: number; // Total number of pages
  recordCount: number; // Total number of records

  constructor(perPage: number, pageCount: number, recordCount: number) {
    this.perPage = perPage;
    this.pageCount = pageCount;
    this.recordCount = recordCount;
  }
}

/**
 * Utility type to check if a property of an object is itself an object type.
 * Used in recursive type transformations.
 */
type IsObject<T, K extends keyof T> = T[K] extends object ? true : false;

/**
 * Recursively makes all properties of a type nullable, including nested objects.
 * Useful for GraphQL input types where fields may be optional.
 */
export type MakeDeepNullable<T> = {
  [K in keyof T]: undefined extends T[K]
    ? MakeDeepNullable<T[K]> | null // Make undefined properties nullable
    : IsObject<T, K> extends true
      ? MakeDeepNullable<T[K]> // Recursively apply to nested objects
      : T[K]; // Keep primitive types as-is
};

/**
 * Basic primitive and complex types allowed in the system.
 * Used for type constraints in various parts of the GraphQL schema.
 */
export type BasicTypes = number | string | boolean | object | Array<BasicTypes> | NestedObject;

/**
 * Recursive type for nested objects with arbitrary depth.
 * Allows for complex object structures with nested properties.
 */
export type NestedObject = { [key: string | number]: NestedObject | BasicTypes };

/**
 * Type for boolean flags in nested object structures.
 * Used for GraphQL selection sets and query builders.
 */
export type NestedObjectBoolean = { [key: string]: NestedObjectBoolean | boolean };

/**
 * Generic resolver function type for GraphQL resolvers.
 * Provides type safety for resolver functions with proper argument and context types.
 *
 * @template T - The return type of the resolver
 * @template Args - The arguments type for the resolver
 */
export type Resolver<T, Args = NestedObject> = (
  parent: unknown, // Parent object in GraphQL resolution chain
  args: Args | MakeDeepNullable<Args>, // Resolver arguments, potentially nullable
  ctx: AppContext, // Application context with services
  info: unknown, // GraphQL execution info
  query?: {
    select?: NestedObjectBoolean; // Field selection specification
    include?: NestedObjectBoolean; // Relation inclusion specification
  }
) => Promise<T> | T;

/**
 * GraphQL enum type for sort ordering (ascending/descending).
 * Maps to Prisma's SortOrder enum values for database query ordering.
 */
export const SortOrderEnum = builder.enumType('SortOrder', {
  values: Object.values(Prisma.SortOrder), // ['asc', 'desc']
});

/**
 * GraphQL object type for pagination information.
 * Provides metadata about paginated query results.
 */
export const PothosPageInfo = builder.objectType(PageInfo, {
  name: 'PageInfo',
  fields: (t) => ({
    perPage: t.exposeInt('perPage'), // Items per page
    pageCount: t.exposeInt('pageCount'), // Total pages available
    recordCount: t.exposeInt('recordCount'), // Total records in dataset
  }),
});

/**
 * GraphQL input type for string field filtering.
 * Allows filtering string fields with equality and substring matching.
 */
export const StringFilter = builder.inputType('StringFilter', {
  fields: (t) => ({
    equals: t.string({ required: false }), // Exact string match
    not: t.string({ required: false }), // Negation of exact match
    contains: t.string({ required: false }), // Substring search
  }),
});

/**
 * GraphQL input type for integer field filtering.
 * Provides comprehensive filtering options for numeric fields.
 */
export const IntFilter = builder.inputType('IntFilter', {
  fields: (t) => ({
    equals: t.int({ required: false }), // Exact value match
    in: t.intList({ required: false }), // Value must be in the provided list
    notIn: t.intList({ required: false }), // Value must not be in the provided list
    lt: t.int({ required: false }), // Less than
    lte: t.int({ required: false }), // Less than or equal
    gt: t.int({ required: false }), // Greater than
    gte: t.int({ required: false }), // Greater than or equal
    not: t.int({ required: false }), // Negation of exact match
  }),
});

/**
 * GraphQL input type for date/time field filtering.
 * Uses string representation for date/time values with comparison operators.
 */
export const DateTimeFilter = builder.inputType('DateTimeFilter', {
  fields: (t) => ({
    equals: t.string({ required: false }), // Exact date/time match
    in: t.stringList({ required: false }), // Date/time must be in the provided list
    notIn: t.stringList({ required: false }), // Date/time must not be in the provided list
    lt: t.string({ required: false }), // Before date/time
    lte: t.string({ required: false }), // At or before date/time
    gt: t.string({ required: false }), // After date/time
    gte: t.string({ required: false }), // At or after date/time
    not: t.string({ required: false }), // Negation of exact match
  }),
});
