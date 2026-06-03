import { PrismaClient } from "@prisma/client";

// Singleton Prisma client for the API process.
// Do not import this in tests that do not need a real DB connection.
export const prisma = new PrismaClient();
