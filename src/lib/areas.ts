import "server-only";
import { eq, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { areas, type AreaLevel } from "@/db/schema";

export type AreaNode = {
  id: string;
  name: string;
  level: AreaLevel;
  parentId: string | null;
  /** Ouverte elle-même ou par l'une de ses zones parentes. */
  isOpen: boolean;
  /** Ouverte par une zone parente (non modifiable à ce niveau). */
  openedByParent: boolean;
  childCount: number;
};

const collator = new Intl.Collator("fr", { sensitivity: "base", numeric: true });
export const byFrenchName = <T extends { name: string }>(a: T, b: T) =>
  collator.compare(a.name, b.name);

// Colonnes qualifiées à la main : dans une requête sur une seule table, Drizzle ne préfixe pas les colonnes,
// et la sous-requête les attribuerait à sa propre table.
const effectiveOpen = sql<boolean>`exists (select 1 from areas o where o.id = any("areas"."path_ids") and o.is_open)`;
const openedByParent = sql<boolean>`exists (select 1 from areas o where o.id = any("areas"."path_ids") and o.id <> "areas"."id" and o.is_open)`;
const childCount = sql<number>`(select count(*)::int from areas c where c.parent_id = "areas"."id")`;

function selection() {
  return {
    id: areas.id,
    name: areas.name,
    level: areas.level,
    parentId: areas.parentId,
    isOpen: effectiveOpen,
    openedByParent,
    childCount,
  };
}

export async function getAreaChildren(parentId: string | null): Promise<AreaNode[]> {
  const rows = await db
    .select(selection())
    .from(areas)
    .where(parentId ? eq(areas.parentId, parentId) : sql`${areas.parentId} is null`);
  return rows.sort(byFrenchName);
}

export async function getArea(id: string): Promise<AreaNode | null> {
  const [row] = await db.select(selection()).from(areas).where(eq(areas.id, id)).limit(1);
  return row ?? null;
}

/** Zone et ses ancêtres, de la région à la zone. */
export async function getAreaPath(
  id: string,
): Promise<{ id: string; name: string; level: AreaLevel }[]> {
  const result = await db.execute<{ id: string; name: string; level: AreaLevel }>(sql`
    select p.id, p.name, p.level
    from areas a
    join areas p on p.id = any(a.path_ids)
    where a.id = ${id}
    order by array_position(a.path_ids, p.id)
  `);
  return result.rows;
}

/** « Mermoz, Dakar » : la zone et sa commune ou son département pour situer. */
export async function describeArea(id: string): Promise<string> {
  const path = await getAreaPath(id);
  if (!path.length) return "";
  const self = path[path.length - 1];
  const context = path.length >= 3 ? path[path.length - 2] : path.length === 2 ? path[0] : null;
  return context && context.name !== self.name ? `${self.name}, ${context.name}` : self.name;
}

export type NearestArea = { id: string; name: string; level: AreaLevel; distanceM: number };

/** Quartier ou commune le plus proche d'un point (pour la recherche « autour de moi »). */
export async function nearestArea(lng: number, lat: number): Promise<NearestArea | null> {
  const point = sql`ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography`;
  const result = await db.execute<NearestArea>(sql`
    select id, name, level, ST_Distance(centroid, ${point})::float as "distanceM"
    from areas
    where level in ('commune', 'quartier')
    order by centroid <-> ${point}
    limit 1
  `);
  return result.rows[0] ?? null;
}

export type AreaOption = { id: string; label: string; level: AreaLevel; groupLabel: string };

/** Communes et quartiers des zones ouvertes, groupés par département, pour un sélecteur natif. */
export async function getOpenAreaOptions(): Promise<{ group: string; options: AreaOption[] }[]> {
  const result = await db.execute<{
    id: string;
    name: string;
    level: AreaLevel;
    departement: string;
    commune: string | null;
  }>(sql`
    select a.id, a.name, a.level, d.name as departement,
      case when a.level = 'quartier' then c.name else null end as commune
    from areas a
    join areas d on d.id = a.path_ids[2]
    left join areas c on c.id = a.path_ids[3]
    where a.level in ('commune', 'quartier')
      and exists (select 1 from areas o where o.id = any(a.path_ids) and o.is_open)
  `);
  const groups = new Map<string, AreaOption[]>();
  for (const row of result.rows) {
    const label =
      row.commune && row.commune !== row.name ? `${row.name} (${row.commune})` : row.name;
    const list = groups.get(row.departement) ?? [];
    list.push({ id: row.id, label, level: row.level, groupLabel: row.departement });
    groups.set(row.departement, list);
  }
  return [...groups.entries()]
    .map(([group, options]) => ({
      group,
      options: options.sort((a, b) => collator.compare(a.label, b.label)),
    }))
    .sort((a, b) => collator.compare(a.group, b.group));
}

/** Noms des zones ouvertes au plus haut niveau (« Région de Dakar », « Dagana »…). */
export async function getOpenZoneNames(): Promise<string[]> {
  const result = await db.execute<{ name: string; level: AreaLevel }>(sql`
    select a.name, a.level from areas a
    where a.is_open
      and not exists (select 1 from areas o where o.id = any(a.path_ids) and o.id <> a.id and o.is_open)
    order by a.level, a.name
  `);
  return result.rows.map((r) => (r.level === "region" ? `Région de ${r.name}` : r.name));
}

export async function isAreaOpen(id: string): Promise<boolean> {
  const area = await getArea(id);
  return area?.isOpen ?? false;
}

export async function getAreaCentroid(id: string): Promise<{ lat: number; lng: number } | null> {
  const [row] = await db
    .select({ centroid: areas.centroid })
    .from(areas)
    .where(eq(areas.id, id))
    .limit(1);
  return row?.centroid ?? null;
}
