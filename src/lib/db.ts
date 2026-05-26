import { Pool, neonConfig } from "@neondatabase/serverless";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "@prisma/client";
import ws from "ws";

// Required for Neon's WebSocket driver in Node.js runtimes (and harmless in edge).
if (typeof WebSocket === "undefined") {
  neonConfig.webSocketConstructor = ws;
}

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function makeClient() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    // Allow `prisma generate` and similar to load the module without crashing.
    return new PrismaClient();
  }
  const pool = new Pool({ connectionString });
  const adapter = new PrismaNeon(pool);
  return new PrismaClient({ adapter, log: ["error", "warn"] });
}

export const prisma = globalForPrisma.prisma ?? makeClient();
export const db = prisma;

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
