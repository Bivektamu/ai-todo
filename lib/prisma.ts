import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "@/app/generated/prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

function createPrismaClient(): PrismaClient {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL environment variable is required");
  }
  const adapter = new PrismaNeon({
    connectionString: process.env.DATABASE_URL,
  });
  return new PrismaClient({ adapter } as never);
}

function getPrismaClient(): PrismaClient {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = createPrismaClient();
  }
  return globalForPrisma.prisma;
}

// Lazy initialization via Proxy: the database connection is established on first use,
// not at import time. This lets the module load even if Neon is temporarily unreachable
// and keeps static routes available during brief connection blips.
//
// Pooling: the connection string uses the Neon pooled endpoint (-pooler) which is the
// correct choice for serverless. The Prisma adapter does not expose pool tuning knobs
// (connectionLimit, idleTimeoutMillis, maxUses); under concurrent serverless invocations
// Neon's pooler is the only throttle. For a single user app this is fine. If the app
// scales beyond a handful of concurrent users, configure pooler settings in the Neon
// dashboard or switch to @neondatabase/serverless directly for fine grained pool control.
export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop: string | symbol) {
    const client = getPrismaClient();
    const value = (client as unknown as Record<string | symbol, unknown>)[prop];
    if (typeof value === "function") {
      return value.bind(client);
    }
    return value;
  },
});
