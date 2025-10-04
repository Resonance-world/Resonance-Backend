import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  // @ts-ignore
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
