import "server-only";
import { cache } from "react";
import { db } from "@/db/client";
import { settings } from "@/db/schema";
import { env } from "@/lib/env";

export type AppSettings = {
  /** Numéro WhatsApp de l'équipe, sans « + » (ex. 221770000000). */
  whatsappNumber: string | null;
};

/** Lus une fois par requête : une modification dans l'admin s'applique immédiatement. */
export const getSettings = cache(async (): Promise<AppSettings> => {
  const rows = await db.select().from(settings);
  const map = new Map(rows.map((r) => [r.key, r.value]));
  const stored = map.get("whatsapp_number");
  return {
    whatsappNumber: typeof stored === "string" && stored ? stored : env().whatsappNumber,
  };
});

export async function setSetting(key: string, value: unknown, userId: string): Promise<void> {
  await db
    .insert(settings)
    .values({ key, value, updatedById: userId })
    .onConflictDoUpdate({
      target: settings.key,
      set: { value, updatedById: userId, updatedAt: new Date() },
    });
}
