import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaNeon } from '@prisma/adapter-neon';
import { neonConfig } from '@neondatabase/serverless';
import ws from 'ws';

neonConfig.webSocketConstructor = ws;

const connectionString = `${process.env.DATABASE_URL}`;

// Prisma Client ko reuse karne ke liye logic (for Serverless environment)
const adapter = new PrismaNeon({ connectionString });

// globalThis use karna better hai ESM (type: module) ke liye
const prisma = globalThis.prisma || new PrismaClient({ adapter });

if (process.env.NODE_ENV !== 'production') {
  globalThis.prisma = prisma;
}

export default prisma;