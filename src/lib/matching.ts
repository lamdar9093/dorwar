import "server-only";
import { sql } from "drizzle-orm";
import { db } from "@/db/client";
import { getAllServices, type LoadedService } from "@/lib/services/repository";

export type MatchReason = "proche" | "zone" | "installation";

export type Match = {
  workerProfileId: string;
  workerServiceId: string;
  firstName: string;
  lastInitial: string;
  gender: "femme" | "homme";
  birthYear: number;
  languages: string[];
  experienceYears: number;
  skills: string[];
  ratingAvg: number | null;
  ratingCount: number;
  monthlyRateFcfa: number | null;
  dailyRateFcfa: number | null;
  verifiedAt: Date | null;
  areaName: string;
  distanceM: number;
  reason: MatchReason;
  /** Statut d'une rencontre déjà demandée pour cette demande, s'il y en a une. */
  placementId: string | null;
  placementStatus: string | null;
};

export function pgTextArray(values: string[]): string {
  return `{${values.map((v) => `"${v.replaceAll('"', "")}"`).join(",")}}`;
}

/** Clés des formules longue durée de tous les services : une personne en poste n'est plus proposée. */
export function longFormulaKeys(services: LoadedService[]): string[] {
  return services.flatMap((s) =>
    s.config.formulas.filter((f) => f.kind === "longue").map((f) => f.key),
  );
}

/**
 * Profils vérifiés correspondant à une demande, du plus proche au plus éloigné.
 * - autour de moi : à moins du rayon choisi ET du rayon d'intervention de la personne ;
 * - par zone : la personne habite la zone choisie ;
 * - dans les deux cas : la zone fait partie des zones qu'elle accepte ;
 * - formule logée : les personnes prêtes à s'installer sont proposées ensuite.
 */
export async function findMatches(
  requestId: string,
  housing: boolean,
  radiusOverrideKm?: number,
): Promise<Match[]> {
  const longKeys = longFormulaKeys(await getAllServices());
  const result = await db.execute<Record<string, unknown>>(sql`
    with req as (
      select r.id, r.service_id, r.formula_key, r.search_mode, r.location,
        coalesce(${radiusOverrideKm ?? null}::int, r.radius_km) as radius_km, r.area_id,
        a.path_ids as area_path
      from requests r join areas a on a.id = r.area_id
      where r.id = ${requestId}
    ),
    cand as (
      select wp.id as worker_profile_id, ws.id as worker_service_id, wp.first_name,
        left(wp.last_name, 1) as last_initial, wp.gender, wp.birth_year, wp.languages,
        wp.experience_years, ws.skills, wp.rating_avg, wp.rating_count, wp.monthly_rate_fcfa,
        wp.daily_rate_fcfa, wp.willing_to_relocate, ws.verified_at, wa.name as area_name,
        ST_Distance(wp.location, req.location)::float as distance_m,
        (req.search_mode = 'autour' and ST_DWithin(wp.location, req.location,
          least(coalesce(req.radius_km, 5), wp.intervention_radius_km) * 1000)) as within_radius,
        (req.search_mode = 'zone' and req.area_id = any(wa.path_ids)) as in_zone,
        (wp.accepted_area_ids && req.area_path) as accepts_zone,
        p.id as placement_id, p.status::text as placement_status
      from req
      join worker_services ws on ws.service_id = req.service_id and ws.status = 'verifie'
        and req.formula_key = any(ws.formula_keys)
      join worker_profiles wp on wp.id = ws.worker_profile_id
      join users u on u.id = wp.user_id and u.status = 'actif'
      join areas wa on wa.id = wp.area_id
      left join lateral (
        select id, status from placements
        where request_id = req.id and worker_service_id = ws.id and status <> 'annule'
        order by created_at desc limit 1
      ) p on true
      where not exists (
        select 1 from placements busy
        where busy.worker_profile_id = wp.id and busy.status in ('essai', 'confirme')
          and busy.request_id <> req.id
          and busy.formula_key = any(${pgTextArray(longKeys)}::text[])
      )
    )
    select *,
      case when within_radius or in_zone then 'proche' when accepts_zone then 'zone' else 'installation' end as reason
    from cand
    where within_radius or in_zone or accepts_zone or (${housing} and willing_to_relocate)
    order by case when within_radius or in_zone then 0 when accepts_zone then 1 else 2 end, distance_m
    limit 60
  `);
  return result.rows.map((r) => ({
    workerProfileId: String(r.worker_profile_id),
    workerServiceId: String(r.worker_service_id),
    firstName: String(r.first_name),
    lastInitial: String(r.last_initial),
    gender: r.gender as Match["gender"],
    birthYear: Number(r.birth_year),
    languages: (r.languages as string[]) ?? [],
    experienceYears: Number(r.experience_years),
    skills: (r.skills as string[]) ?? [],
    ratingAvg: r.rating_avg == null ? null : Number(r.rating_avg),
    ratingCount: Number(r.rating_count),
    monthlyRateFcfa: r.monthly_rate_fcfa == null ? null : Number(r.monthly_rate_fcfa),
    dailyRateFcfa: r.daily_rate_fcfa == null ? null : Number(r.daily_rate_fcfa),
    verifiedAt: r.verified_at ? new Date(String(r.verified_at)) : null,
    areaName: String(r.area_name),
    distanceM: Number(r.distance_m),
    reason: r.reason as MatchReason,
    placementId: r.placement_id ? String(r.placement_id) : null,
    placementStatus: r.placement_status ? String(r.placement_status) : null,
  }));
}
