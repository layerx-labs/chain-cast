import { PrismaClient } from '@prisma/client';

/**
 * Prisma database client instance.
 * Provides type-safe database access and query operations.
 * Automatically connects to the database using connection string from environment.
 */
const prisma = new PrismaClient();

export default prisma;
