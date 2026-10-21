import { randomUUID } from "node:crypto";
import { areas } from "../schema";
import type { SeedDb } from "./db";
import referentiel from "./data/areas.json";

type Point = { name: string; lat: number; lng: number; wikidata?: string };
type Commune = Point & { quartiers?: Point[] };
type Departement = Point & { communes: Commune[] };
type Region = Point & { departements: Departement[] };

export type SeededArea = {
  id: string;
  name: string;
  level: "region" | "departement" | "commune" | "quartier";
  key: string;
  lat: number;
  lng: number;
};

export function slugify(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/œ/g, "oe")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/** Insère le référentiel (tout le pays) et ouvre les zones demandées. Renvoie les zones par clé. */
export async function seedAreas(db: SeedDb, openKeys: string[]) {
  const rows: (typeof areas.$inferInsert)[] = [];
  const byKey = new Map<string, SeededArea>();

  const add = (
    point: Point,
    level: SeededArea["level"],
    parent: { id: string; key: string; path: string[] } | null,
  ) => {
    const id = randomUUID();
    const key = parent ? `${parent.key}/${slugify(point.name)}` : slugify(point.name);
    const path = [...(parent?.path ?? []), id];
    rows.push({
      id,
      parentId: parent?.id ?? null,
      level,
      name: point.name,
      key,
      pathIds: path,
      centroid: { lng: point.lng, lat: point.lat },
      isOpen: openKeys.includes(key),
      wikidataId: point.wikidata ?? null,
    });
    byKey.set(key, { id, name: point.name, level, key, lat: point.lat, lng: point.lng });
    return { id, key, path };
  };

  for (const region of (referentiel as { regions: Region[] }).regions) {
    const r = add(region, "region", null);
    for (const dep of region.departements) {
      const d = add(dep, "departement", r);
      for (const commune of dep.communes) {
        const c = add(commune, "commune", d);
        for (const quartier of commune.quartiers ?? []) add(quartier, "quartier", c);
      }
    }
  }

  for (let i = 0; i < rows.length; i += 200) {
    await db.insert(areas).values(rows.slice(i, i + 200));
  }
  return byKey;
}
