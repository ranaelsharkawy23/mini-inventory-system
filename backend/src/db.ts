import { PrismaClient } from "@prisma/client";

// A single shared Prisma client for the whole process (avoids exhausting
// Postgres connections by creating a new client per request).
export const prisma = new PrismaClient();