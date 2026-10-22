import "server-only";
import { and, desc, eq, inArray } from "drizzle-orm";
import { db } from "@/db/client";
import { areas, familyProfiles, placements, reviews, verificationSteps, workerProfiles, workerServices } from "@/db/schema";
import { ageFromBirthYear } from "@/lib/format";
import { getServicesById, type LoadedService } from "@/lib/services/repository";
import { buildBadge, type BadgeItem, type StepState } from "@/lib/verification";

export type WorkerDossier = {
  id: string;
  service: LoadedService;
  status: "en_attente" | "en_cours" | "verifie" | "refuse" | "suspendu";
  formulaKeys: string[];
  skills: string[];
  verifiedAt: Date | null;
  decisionReason: string | null;
  badge: BadgeItem[];
  steps: StepState[];
};

export type WorkerSummary = {
  profileId: string;
  userId: string;
  firstName: string;
  lastName: string;
  lastInitial: string;
  gender: "femme" | "homme";
  age: number;
  birthYear: number;
  areaId: string;
  areaName: string;
  presentation: string | null;
  languages: string[];
  experienceYears: number;
  interventionRadiusKm: number;
  willingToRelocate: boolean;
  availableFrom: string | null;
  monthlyRateFcfa: number | null;
  dailyRateFcfa: number | null;
  ratingAvg: number | null;
  ratingCount: number;
  cardId: string;
  location: { lat: number; lng: number };
  dossiers: WorkerDossier[];
};

/** Badges publics de plusieurs dossiers en une seule requête. */
export async function getBadges(dossiers: { id: string; serviceId: string }[]): Promise<Map<string, BadgeItem[]>> {
  const states = await getVerificationStates(dossiers);
  return new Map([...states.entries()].map(([id, state]) => [id, state.badge]));
}

/** États des étapes (et badge public) de plusieurs dossiers. */
export async function getVerificationStates(
  dossiers: { id: string; serviceId: string }[],
): Promise<Map<string, { badge: BadgeItem[]; steps: StepState[] }>> {
  const result = new Map<string, { badge: BadgeItem[]; steps: StepState[] }>();
  if (!dossiers.length) return result;
  const services = await getServicesById();
  const steps = await db
    .select({
      workerServiceId: verificationSteps.workerServiceId,
      type: verificationSteps.type,
      status: verificationSteps.status,
      completedAt: verificationSteps.completedAt,
    })
    .from(verificationSteps)
    .where(inArray(verificationSteps.workerServiceId, dossiers.map((d) => d.id)));
  for (const d of dossiers) {
    const service = services.get(d.serviceId);
    if (!service) continue;
    const own = steps.filter((s) => s.workerServiceId === d.id);
    result.set(d.id, { badge: buildBadge(service.config.verification, own), steps: own });
  }
  return result;
}

async function loadWorker(where: ReturnType<typeof eq>): Promise<WorkerSummary | null> {
  const [row] = await db
    .select({ p: workerProfiles, areaName: areas.name })
    .from(workerProfiles)
    .innerJoin(areas, eq(areas.id, workerProfiles.areaId))
    .where(where)
    .limit(1);
  if (!row) return null;
  const p = row.p;
  const dossierRows = await db.select().from(workerServices).where(eq(workerServices.workerProfileId, p.id));
  const services = await getServicesById();
  const states = await getVerificationStates(dossierRows);
  const dossiers: WorkerDossier[] = [];
  for (const d of dossierRows) {
    const service = services.get(d.serviceId);
    if (!service) continue;
    dossiers.push({
      id: d.id,
      service,
      status: d.status,
      formulaKeys: d.formulaKeys,
      skills: d.skills,
      verifiedAt: d.verifiedAt,
      decisionReason: d.decisionReason,
      badge: states.get(d.id)?.badge ?? [],
      steps: states.get(d.id)?.steps ?? [],
    });
  }
  return {
    profileId: p.id,
    userId: p.userId,
    firstName: p.firstName,
    lastName: p.lastName,
    lastInitial: p.lastName.charAt(0),
    gender: p.gender,
    age: ageFromBirthYear(p.birthYear),
    birthYear: p.birthYear,
    areaId: p.areaId,
    areaName: row.areaName,
    presentation: p.presentation,
    languages: p.languages,
    experienceYears: p.experienceYears,
    interventionRadiusKm: p.interventionRadiusKm,
    willingToRelocate: p.willingToRelocate,
    availableFrom: p.availableFrom,
    monthlyRateFcfa: p.monthlyRateFcfa,
    dailyRateFcfa: p.dailyRateFcfa,
    ratingAvg: p.ratingAvg,
    ratingCount: p.ratingCount,
    cardId: p.cardId,
    location: p.location,
    dossiers,
  };
}

export function getWorkerByProfileId(profileId: string) {
  return loadWorker(eq(workerProfiles.id, profileId));
}

export function getWorkerByUserId(userId: string) {
  return loadWorker(eq(workerProfiles.userId, userId));
}

export function getWorkerByCardId(cardId: string) {
  return loadWorker(eq(workerProfiles.cardId, cardId));
}

export type PublicReview = {
  id: string;
  rating: number;
  comment: string;
  createdAt: Date;
  authorName: string;
  formulaKey: string;
};

/** Avis laissés par les familles sur une personne, signés : pour son propre espace seulement. */
export async function getReviewsAbout(userId: string): Promise<PublicReview[]> {
  const rows = await db
    .select({
      id: reviews.id,
      rating: reviews.rating,
      comment: reviews.comment,
      createdAt: reviews.createdAt,
      authorName: familyProfiles.displayName,
      formulaKey: placements.formulaKey,
    })
    .from(reviews)
    .innerJoin(placements, eq(placements.id, reviews.placementId))
    .innerJoin(familyProfiles, eq(familyProfiles.userId, reviews.authorId))
    .where(and(eq(reviews.targetUserId, userId), eq(reviews.authorRole, "famille")))
    .orderBy(desc(reviews.createdAt));
  return rows;
}

/** Avis tels qu'ils paraissent sur une fiche : jamais le nom de la famille, seulement son quartier. */
export type ProfileReview = {
  id: string;
  rating: number;
  comment: string;
  createdAt: Date;
  authorArea: string | null;
  formulaKey: string;
};

export async function getProfileReviews(userId: string): Promise<ProfileReview[]> {
  return db
    .select({
      id: reviews.id,
      rating: reviews.rating,
      comment: reviews.comment,
      createdAt: reviews.createdAt,
      authorArea: areas.name,
      formulaKey: placements.formulaKey,
    })
    .from(reviews)
    .innerJoin(placements, eq(placements.id, reviews.placementId))
    .innerJoin(familyProfiles, eq(familyProfiles.userId, reviews.authorId))
    .leftJoin(areas, eq(areas.id, familyProfiles.areaId))
    .where(and(eq(reviews.targetUserId, userId), eq(reviews.authorRole, "famille")))
    .orderBy(desc(reviews.createdAt));
}

/** Avis laissés par les personnes accueillies sur une famille (visibles par l'équipe et la personne sollicitée). */
export async function getReviewsAboutFamily(userId: string) {
  return db
    .select({ rating: reviews.rating, comment: reviews.comment, createdAt: reviews.createdAt })
    .from(reviews)
    .where(and(eq(reviews.targetUserId, userId), eq(reviews.authorRole, "prestataire")))
    .orderBy(desc(reviews.createdAt));
}

export function skillLabels(service: LoadedService, keys: string[]): string[] {
  return keys.map((k) => service.config.skills.find((s) => s.key === k)?.label ?? k);
}

export function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}
