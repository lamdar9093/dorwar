import { sql } from "drizzle-orm";
import { db } from "@/db/client";

export const dynamic = "force-dynamic";

/**
 * Santé de l'application, pour le healthcheck Docker. Par défaut, ne touche pas la base :
 * un appel toutes les 30 secondes empêcherait Neon de mettre la base en veille.
 * `/api/health?base=1` vérifie aussi la connexion à la base.
 */
export async function GET(request: Request) {
  const checkDatabase = new URL(request.url).searchParams.get("base") === "1";
  if (!checkDatabase) return Response.json({ ok: true });
  try {
    await db.execute(sql`select 1`);
    return Response.json({ ok: true, base: "ok" });
  } catch {
    return Response.json({ ok: false, base: "injoignable" }, { status: 503 });
  }
}
