// Données de démonstration (toutes fictives). Usage :
//   npm run db:seed    → remplit une base vide
//   npm run db:reset   → vide toutes les tables puis remplit à nouveau
import { rm } from "node:fs/promises";
import path from "node:path";
import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "../src/db/schema";
import { seedAreas } from "../src/db/seed/areas";
import { seedDemo } from "../src/db/seed/demo";

const TABLES = [
  "access_logs",
  "documents",
  "reviews",
  "incidents",
  "placements",
  "waitlist",
  "requests",
  "verification_steps",
  "worker_services",
  "worker_profiles",
  "family_profiles",
  "sessions",
  "otp_codes",
  "settings",
  "users",
  "services",
  "areas",
];

function intFromEnv(name: string, fallback: number): number {
  const raw = process.env[name];
  const n = raw ? Number.parseInt(raw, 10) : NaN;
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("DATABASE_URL est manquant.");
    process.exit(1);
  }
  const reset = process.argv.includes("--reset");
  const uploadsDir = path.resolve(process.env.UPLOADS_DIR ?? "./data/uploads");
  const pool = new Pool({ connectionString: url, max: 2 });
  const db = drizzle(pool, { schema, casing: "snake_case" });

  try {
    const existing = await db.execute<{ n: number }>(sql`select count(*)::int as n from users`);
    if (existing.rows[0].n > 0 && !reset) {
      console.error(
        "La base contient déjà des données. Lancez « npm run db:reset » pour tout effacer et recommencer.",
      );
      process.exit(1);
    }
    if (reset) {
      await db.execute(sql.raw(`truncate table ${TABLES.join(", ")} restart identity cascade`));
      await rm(path.join(uploadsDir, "documents"), { recursive: true, force: true });
      console.log("Base vidée.");
    }

    const now = Date.now();
    const areas = await seedAreas(db, ["dakar"]);
    const summary = await seedDemo(
      { db, areas, uploadsDir, now },
      {
        guaranteeDays: intFromEnv("DEFAULT_GUARANTEE_DAYS", 30),
        feeFcfa: intFromEnv("DEFAULT_PLACEMENT_FEE_FCFA", 15000),
        missionFeeFcfa: intFromEnv("DEFAULT_MISSION_FEE_FCFA", 2500),
        whatsappNumber: process.env.WHATSAPP_NUMBER || null,
      },
    );
    console.log("Données de démonstration créées :", summary);
    console.log(
      "Comptes : famille +221 77 000 00 01 · prestataire +221 77 000 00 02 · agent +221 77 000 00 03 · admin +221 77 000 00 04",
    );
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error("Échec du seed :", err);
  process.exit(1);
});
