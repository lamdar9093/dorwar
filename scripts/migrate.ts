// Applique les migrations versionnées (dossier drizzle/). Idempotent : sans effet si tout est à jour.
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("DATABASE_URL est manquant : impossible d'appliquer les migrations.");
    process.exit(1);
  }
  const pool = new Pool({ connectionString: url, max: 1 });
  try {
    await migrate(drizzle(pool), { migrationsFolder: process.env.MIGRATIONS_DIR ?? "drizzle" });
    console.log("Migrations appliquées.");
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error("Échec des migrations :", err);
  process.exit(1);
});
