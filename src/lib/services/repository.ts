import "server-only";
import { asc, eq } from "drizzle-orm";
import { cache } from "react";
import { db } from "@/db/client";
import { services } from "@/db/schema";
import { typoDeep } from "@/lib/typo";
import { serviceConfigSchema, type ServiceConfig } from "./config";

export type LoadedService = {
  id: string;
  slug: string;
  name: string;
  icon: string;
  hue: string;
  active: boolean;
  sortOrder: number;
  config: ServiceConfig;
};

/**
 * Tous les services (actifs ou non), configuration validée.
 * Lus une fois par requête (la table est minuscule) : jamais de configuration périmée après une modification.
 */
export const getAllServices = cache(async (): Promise<LoadedService[]> => {
  const rows = await db
    .select()
    .from(services)
    .orderBy(asc(services.sortOrder), asc(services.name));
  const list: LoadedService[] = [];
  for (const row of rows) {
    const parsed = serviceConfigSchema.safeParse(row.config);
    if (!parsed.success) {
      console.error(
        `Configuration invalide pour le service « ${row.slug} » : il est ignoré.`,
        parsed.error.issues,
      );
      continue;
    }
    list.push({ ...row, config: typoDeep(parsed.data) });
  }
  return list;
});

export async function getActiveServices(): Promise<LoadedService[]> {
  return (await getAllServices()).filter((s) => s.active);
}

export async function getServiceBySlug(slug: string): Promise<LoadedService | null> {
  return (await getAllServices()).find((s) => s.slug === slug) ?? null;
}

/** Services indexés par identifiant. */
export async function getServicesById(): Promise<Map<string, LoadedService>> {
  return new Map((await getAllServices()).map((s) => [s.id, s]));
}

export async function getServiceById(id: string): Promise<LoadedService | null> {
  return (await getServicesById()).get(id) ?? null;
}

export async function updateServiceConfig(
  id: string,
  config: ServiceConfig,
  active: boolean,
): Promise<void> {
  await db
    .update(services)
    .set({ config: serviceConfigSchema.parse(config), active })
    .where(eq(services.id, id));
}

export function formulaOf(service: LoadedService, key: string) {
  return service.config.formulas.find((f) => f.key === key) ?? null;
}

/** « intendante » ou « intendant » selon la personne. */
export function providerNoun(service: LoadedService, gender: "femme" | "homme"): string {
  return gender === "femme" ? service.config.vocabulary.female : service.config.vocabulary.male;
}
