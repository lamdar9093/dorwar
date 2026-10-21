import "server-only";
import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

export type Db = NodePgDatabase<typeof schema>;

const globalForDb = globalThis as unknown as { dorwarPool?: Pool };

// Le pool ne se connecte qu'à la première requête : l'importer pendant `next build` est sans effet.
const pool =
  globalForDb.dorwarPool ??
  new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 10,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
  });

if (process.env.NODE_ENV !== "production") globalForDb.dorwarPool = pool;

export const db: Db = drizzle(pool, { schema, casing: "snake_case" });

export { schema };
