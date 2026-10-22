import "server-only";
import { sql, type SQL } from "drizzle-orm";
import { cache } from "react";
import { z } from "zod";
import { db } from "@/db/client";
import { getProfileReviews, getWorkerByProfileId, type ProfileReview } from "@/lib/data/workers";
import { longFormulaKeys, pgTextArray } from "@/lib/matching";
import { toPublicProfile, type PublicProfile } from "@/lib/public-profile";
import { getActiveServices, getAllServices, type LoadedService } from "@/lib/services/repository";
import type { BadgeItem } from "@/lib/verification";

/**
 * La vitrine publique : ce qu'un visiteur voit sans compte.
 * N'y paraissent que les dossiers vérifiés d'un service actif, d'un compte actif, dans une zone
 * ouverte, et pas les personnes déjà en poste (même règle que le matching).
 * Les requêtes ne lisent que des colonnes publiques.
 */

export type VitrineEntry = {
  profileId: string;
  serviceId: string;
  firstName: string;
  lastInitial: string;
  gender: "femme" | "homme";
  areaName: string;
  experienceYears: number;
  ratingAvg: number | null;
  ratingCount: number;
  verifiedAt: Date | null;
  /** Distance au centre du quartier choisi par le visiteur (jamais à sa position à elle). */
  distanceM: number | null;
};

type ListOptions = {
  serviceId?: string;
  formulaKey?: string;
  excludeProfileId?: string;
};

const notBusy = (longKeys: string[]) => sql`not exists (
  select 1 from placements busy
  where busy.worker_profile_id = wp.id and busy.status in ('essai', 'confirme')
    and busy.formula_key = any(${pgTextArray(longKeys)}::text[])
)`;

const inOpenZone = sql`exists (select 1 from areas o where o.id = any(wa.path_ids) and o.is_open)`;

/** `from … where …` commun : les dossiers qu'on a le droit de montrer. */
async function listable(options: ListOptions): Promise<SQL> {
  const [active, all] = await Promise.all([getActiveServices(), getAllServices()]);
  const serviceIds = options.serviceId
    ? active.filter((s) => s.id === options.serviceId).map((s) => s.id)
    : active.map((s) => s.id);
  return sql`
    from worker_services ws
    join worker_profiles wp on wp.id = ws.worker_profile_id
    join users u on u.id = wp.user_id and u.status = 'actif'
    join areas wa on wa.id = wp.area_id
    where ws.status = 'verifie'
      and ws.service_id = any(${pgTextArray(serviceIds)}::uuid[])
      and ${inOpenZone}
      and ${notBusy(longFormulaKeys(all))}
      ${options.formulaKey ? sql`and ${options.formulaKey}::text = any(ws.formula_keys)` : sql``}
      ${options.excludeProfileId ? sql`and wp.id <> ${options.excludeProfileId}` : sql``}
  `;
}

/**
 * Profils à montrer, les plus récemment vérifiés d'abord ; autour d'un quartier, du plus proche
 * au plus éloigné. Une personne n'apparaît qu'une fois, même si elle propose plusieurs services.
 */
export async function getVitrine(
  options: ListOptions & { nearAreaId?: string; limit: number },
): Promise<{ entries: VitrineEntry[]; total: number }> {
  const distance = options.nearAreaId
    ? sql`ST_Distance(wp.location, (select centroid from areas where id = ${options.nearAreaId}))::float`
    : sql`null::float`;
  const order = options.nearAreaId
    ? sql`distance_m asc nulls last, profile_id`
    : sql`verified_at desc nulls last, profile_id`;
  const result = await db.execute<Record<string, unknown>>(sql`
    with listed as (
      select distinct on (wp.id)
        wp.id as profile_id, ws.service_id, wp.first_name, left(wp.last_name, 1) as last_initial,
        wp.gender, wa.name as area_name, wp.experience_years, wp.rating_avg, wp.rating_count,
        ws.verified_at, ${distance} as distance_m
      ${await listable(options)}
      order by wp.id, ws.verified_at desc nulls last
    )
    select *, count(*) over()::int as total from listed
    order by ${order}
    limit ${options.limit}
  `);
  const entries = result.rows.map((r) => ({
    profileId: String(r.profile_id),
    serviceId: String(r.service_id),
    firstName: String(r.first_name),
    lastInitial: String(r.last_initial),
    gender: r.gender as VitrineEntry["gender"],
    areaName: String(r.area_name),
    experienceYears: Number(r.experience_years),
    ratingAvg: r.rating_avg == null ? null : Number(r.rating_avg),
    ratingCount: Number(r.rating_count),
    verifiedAt: r.verified_at ? new Date(String(r.verified_at)) : null,
    distanceM: r.distance_m == null ? null : Number(r.distance_m),
  }));
  return { entries, total: result.rows.length ? Number(result.rows[0].total) : 0 };
}

/** Quartiers où vivent des personnes vérifiées (tous services confondus), les plus fournis d'abord. */
export async function getVitrineQuartiers(options: {
  serviceId?: string;
  limit: number;
}): Promise<{ id: string; name: string }[]> {
  const result = await db.execute<{ id: string; name: string }>(sql`
    select wa.id, wa.name
    ${await listable({ serviceId: options.serviceId })}
    group by wa.id, wa.name
    order by count(distinct wp.id) desc, wa.name
    limit ${options.limit}
  `);
  return result.rows.map((r) => ({ id: r.id, name: r.name }));
}

export type FeaturedReview = {
  id: string;
  rating: number;
  comment: string;
  createdAt: Date;
  authorArea: string | null;
  formulaKey: string;
  serviceId: string;
  profileId: string;
  firstName: string;
  lastInitial: string;
  gender: "femme" | "homme";
};

/**
 * Avis de familles à mettre en avant : les plus récents, un par personne, sur des personnes
 * encore vérifiées. Chaque avis renvoie vers la fiche, où tous les avis restent visibles.
 */
export async function getFeaturedReviews(limit: number): Promise<FeaturedReview[]> {
  const active = await getActiveServices();
  const result = await db.execute<Record<string, unknown>>(sql`
    with latest as (
      select distinct on (wp.id)
        r.id, r.rating, r.comment, r.created_at, fa.name as author_area, p.formula_key,
        ws.service_id, wp.id as profile_id, wp.first_name, left(wp.last_name, 1) as last_initial,
        wp.gender
      from reviews r
      join placements p on p.id = r.placement_id
      join worker_services ws on ws.id = p.worker_service_id
      join worker_profiles wp on wp.id = ws.worker_profile_id
      join users u on u.id = wp.user_id and u.status = 'actif'
      join areas wa on wa.id = wp.area_id
      join family_profiles fp on fp.user_id = r.author_id
      left join areas fa on fa.id = fp.area_id
      where r.author_role = 'famille' and r.rating >= 4 and char_length(r.comment) >= 20
        and ws.status = 'verifie'
        and ws.service_id = any(${pgTextArray(active.map((s) => s.id))}::uuid[])
        and ${inOpenZone}
      order by wp.id, r.created_at desc
    )
    select * from latest order by created_at desc limit ${limit}
  `);
  return result.rows.map((r) => ({
    id: String(r.id),
    rating: Number(r.rating),
    comment: String(r.comment),
    createdAt: new Date(String(r.created_at)),
    authorArea: r.author_area == null ? null : String(r.author_area),
    formulaKey: String(r.formula_key),
    serviceId: String(r.service_id),
    profileId: String(r.profile_id),
    firstName: String(r.first_name),
    lastInitial: String(r.last_initial),
    gender: r.gender as FeaturedReview["gender"],
  }));
}

export type PublicProfilePage = {
  /** Les services pour lesquels la personne est vérifiée : au moins un. */
  services: LoadedService[];
  /** Le service affiché : celui demandé s'il en fait partie, sinon le premier. */
  service: LoadedService;
  profile: PublicProfile;
  badge: BadgeItem[];
  reviews: ProfileReview[];
  /** Faux si la personne est en poste : sa fiche reste visible, sans proposition de rencontre. */
  available: boolean;
  areaId: string;
};

/**
 * Fiche publique d'une personne, ou null si elle ne doit pas être montrée.
 * Une seule fiche par personne : `serviceSlug` choisit la catégorie affichée.
 */
export const getPublicProfile = cache(async function getPublicProfile(
  profileId: string,
  serviceSlug?: string,
): Promise<PublicProfilePage | null> {
  if (!z.uuid().safeParse(profileId).success) return null;
  const worker = await getWorkerByProfileId(profileId);
  if (!worker) return null;
  const verified = worker.dossiers
    .filter((d) => d.status === "verifie" && d.service.active)
    .sort((a, b) => a.service.sortOrder - b.service.sortOrder);
  const dossier = verified.find((d) => d.service.slug === serviceSlug) ?? verified[0];
  if (!dossier) return null;

  const all = await getAllServices();
  const result = await db.execute<{ shown: boolean; busy: boolean }>(sql`
    select (u.status = 'actif' and ${inOpenZone}) as shown, not ${notBusy(longFormulaKeys(all))} as busy
    from worker_profiles wp
    join users u on u.id = wp.user_id
    join areas wa on wa.id = wp.area_id
    where wp.id = ${profileId}
  `);
  const state = result.rows[0];
  if (!state?.shown) return null;

  return {
    services: verified.map((d) => d.service),
    service: dossier.service,
    profile: toPublicProfile(worker, dossier),
    badge: dossier.badge,
    reviews: await getProfileReviews(worker.userId),
    available: !state.busy,
    areaId: worker.areaId,
  };
});
