// Ouvrir ou modifier un service par configuration, sans toucher au code des pages.
//   npm run service -- export intendance-de-maison > mon-service.json
//   npm run service -- import mon-service.json
// Dans Docker : docker compose exec app node dist-scripts/service.mjs import /tmp/mon-service.json
import { readFile } from "node:fs/promises";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { z } from "zod";
import * as schema from "../src/db/schema";
import { checkServiceConfig, serviceConfigSchema } from "../src/lib/services/config";

const fileSchema = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/, "slug en minuscules, chiffres et tirets"),
  name: z.string().min(2),
  icon: z.string().min(1),
  hue: z.enum(["terre", "baobab", "indigo", "ocre"]),
  sortOrder: z.number().int().default(10),
  active: z.boolean().default(false),
  config: serviceConfigSchema,
});

async function main() {
  const [command, arg] = process.argv.slice(2);
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL est manquant.");
  const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 1 });
  const db = drizzle(pool, { schema, casing: "snake_case" });
  try {
    if (command === "export" && arg) {
      const [row] = await db
        .select()
        .from(schema.services)
        .where(eq(schema.services.slug, arg))
        .limit(1);
      if (!row) throw new Error(`Service introuvable : ${arg}`);
      const { slug, name, icon, hue, sortOrder, active, config } = row;
      process.stdout.write(
        JSON.stringify({ slug, name, icon, hue, sortOrder, active, config }, null, 2) + "\n",
      );
      return;
    }
    if (command === "import" && arg) {
      const parsed = fileSchema.safeParse(JSON.parse(await readFile(arg, "utf8")));
      if (!parsed.success) {
        console.error("Configuration invalide :");
        for (const issue of parsed.error.issues)
          console.error(`  - ${issue.path.join(".")} : ${issue.message}`);
        process.exitCode = 1;
        return;
      }
      const problems = checkServiceConfig(parsed.data.config);
      if (problems.length) {
        console.error("Configuration incohérente :");
        for (const p of problems) console.error(`  - ${p}`);
        process.exitCode = 1;
        return;
      }
      const values = parsed.data;
      await db
        .insert(schema.services)
        .values(values)
        .onConflictDoUpdate({
          target: schema.services.slug,
          set: {
            name: values.name,
            icon: values.icon,
            hue: values.hue,
            sortOrder: values.sortOrder,
            active: values.active,
            config: values.config,
          },
        });
      console.log(
        `Service « ${values.name} » enregistré (${values.active ? "ouvert" : "fermé"}). Ouvrez-le ensuite dans l’admin si besoin.`,
      );
      return;
    }
    console.log("Usage : service export <slug> | service import <fichier.json>");
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
