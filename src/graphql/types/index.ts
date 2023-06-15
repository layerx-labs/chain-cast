import { builder } from '../builder';
import { Prisma } from '@prisma/client';

export class Result {
  message: string;
  code: number;

  constructor(message: string, code: number) {
    this.message = message;
    this.code = code;
  }
}

export class PageInfo {
  perPage: number;
  pageCount: number;
  recordCount: number;

  constructor(perPage: number, pageCount: number, recordCount: number) {
    this.perPage = perPage;
    this.pageCount = pageCount;
    this.recordCount = recordCount;
  }
}

type IsObject<T, K extends keyof T> = T[K] extends object ? true : false;

export type MakeDeepNullable<T> = {
  [K in keyof T]: undefined extends T[K]
    ? MakeDeepNullable<T[K]> | null
    : IsObject<T, K> extends true
    ? MakeDeepNullable<T[K]>
    : T[K];
};

export const SortOrderEnum = builder.enumType('SortOrder', {
  values: Object.values(Prisma.SortOrder),
});

export const PothosPageInfo = builder.objectType(PageInfo, {
  name: 'PageInfo',
  fields: (t) => ({
    perPage: t.exposeInt('perPage'),
    pageCount: t.exposeInt('pageCount'),
    recordCount: t.exposeInt('recordCount'),
  }),
});

export const StringFilter = builder.inputType('StringFilter', {
  fields: (t) => ({
    equals: t.string({ required: false }),
    not: t.string({ required: false }),
    contains: t.string({ required: false }),
  }),
});

export const IntFilter = builder.inputType('IntFilter', {
  fields: (t) => ({
    equals: t.int({ required: false }),
    in: t.intList({ required: false }),
    notIn: t.intList({ required: false }),
    lt: t.int({ required: false }),
    lte: t.int({ required: false }),
    gt: t.int({ required: false }),
    gte: t.int({ required: false }),
    not: t.int({ required: false }),
  }),
});

export const DateTimeFilter = builder.inputType('DateTimeFilter', {
  fields: (t) => ({
    equals: t.string({ required: false }),
    in: t.stringList({ required: false }),
    notIn: t.stringList({ required: false }),
    lt: t.string({ required: false }),
    lte: t.string({ required: false }),
    gt: t.string({ required: false }),
    gte: t.string({ required: false }),
    not: t.string({ required: false }),
  }),
});
