import type { WorkerDossier, WorkerSummary } from "@/lib/data/workers";

/**
 * Ce qu'un visiteur sans compte voit d'une personne vérifiée, et rien d'autre.
 * Restent réservés aux familles connectées : l'âge, la rémunération souhaitée, la disponibilité,
 * la distance depuis chez soi et le numéro de carte (public, il servirait à fabriquer une fausse carte).
 */
export type PublicProfile = {
  profileId: string;
  firstName: string;
  lastInitial: string;
  gender: "femme" | "homme";
  areaName: string;
  languages: string[];
  experienceYears: number;
  presentation: string | null;
  ratingAvg: number | null;
  ratingCount: number;
  willingToRelocate: boolean;
  skills: string[];
  formulaKeys: string[];
  verifiedAt: Date | null;
};

export function toPublicProfile(worker: WorkerSummary, dossier: WorkerDossier): PublicProfile {
  return {
    profileId: worker.profileId,
    firstName: worker.firstName,
    lastInitial: worker.lastInitial,
    gender: worker.gender,
    areaName: worker.areaName,
    languages: worker.languages,
    experienceYears: worker.experienceYears,
    presentation: worker.presentation,
    ratingAvg: worker.ratingAvg,
    ratingCount: worker.ratingCount,
    willingToRelocate: worker.willingToRelocate,
    skills: dossier.skills,
    formulaKeys: dossier.formulaKeys,
    verifiedAt: dossier.verifiedAt,
  };
}

/**
 * L'annuaire public : un seul pour tous les services. Le service y est un filtre, comme le quartier
 * ou la formule ; aucun service n'a sa propre liste.
 */
export const PEOPLE_PATH = "/personnes";

export function peoplePath(filters: { service?: string; quartier?: string } = {}): string {
  const params = new URLSearchParams();
  if (filters.service) params.set("service", filters.service);
  if (filters.quartier) params.set("quartier", filters.quartier);
  const query = params.toString();
  return query ? `${PEOPLE_PATH}?${query}` : PEOPLE_PATH;
}

/** Fiche publique d'une personne ; `serviceSlug` choisit la catégorie affichée. */
export function publicProfilePath(profileId: string, serviceSlug?: string): string {
  const path = `${PEOPLE_PATH}/${profileId}`;
  return serviceSlug ? `${path}?service=${encodeURIComponent(serviceSlug)}` : path;
}
