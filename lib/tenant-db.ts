/**
 * Tenant DB Connection Manager
 *
 * Returns a PrismaClient connected to a specific tenant database.
 *
 * PHASE 1 NOTE: This uses the main Prisma schema. In Phase 2, generate the
 * tenant-specific client via:
 *   npx prisma generate --schema=prisma/schema-tenant.prisma
 * Then import from "@prisma/tenant-client" instead.
 */
import { PrismaClient } from "@prisma/client";
import { parseDatabaseUrl, buildTenantUrl } from "@/lib/parse-db-url";
import { db } from "@/lib/db";

const clients = new Map<string, PrismaClient>();

export function getTenantDb(dbName: string): PrismaClient {
  const existing = clients.get(dbName);
  if (existing) return existing;

  const base = parseDatabaseUrl(process.env.DATABASE_URL!);
  const url = buildTenantUrl(base, dbName);

  const client = new PrismaClient({
    datasources: { db: { url } },
    log: process.env.NODE_ENV === "development" ? ["error"] : [],
  });

  clients.set(dbName, client);
  return client;
}

export async function getTenantDbBySlug(slug: string): Promise<PrismaClient> {
  const school = await db.school.findUnique({
    where: { slug },
    select: { dbName: true, status: true },
  });

  if (!school) throw new Error(`School not found: ${slug}`);
  if (school.status === "SUSPENDED") throw new Error("School account is suspended");
  if (!school.dbName) throw new Error("School database not yet provisioned");

  return getTenantDb(school.dbName);
}

export async function disconnectAllTenants(): Promise<void> {
  for (const [key, client] of clients.entries()) {
    await client.$disconnect();
    clients.delete(key);
  }
}
