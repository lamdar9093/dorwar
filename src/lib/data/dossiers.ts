import "server-only";
import { and, asc, desc, eq, ilike, inArray, isNull, or, sql, type SQL } from "drizzle-orm";
import { db } from "@/db/client";
import {
  accessLogs,
  areas,
  documents,
  users,
  verificationSteps,
  workerProfiles,
  workerServices,
  type DossierStatus,
} from "@/db/schema";
import { getServiceById, type LoadedService } from "@/lib/services/repository";

export type DossierFilter = "a_traiter" | "verifies" | "clos" | "tous";

export const DOSSIER_FILTERS: { key: DossierFilter; label: string; statuses: DossierStatus[] }[] = [
  { key: "a_traiter", label: "À traiter", statuses: ["en_attente", "en_cours"] },
  { key: "verifies", label: "Vérifiés", statuses: ["verifie"] },
  { key: "clos", label: "Refusés ou suspendus", statuses: ["refuse", "suspendu"] },
  { key: "tous", label: "Tous", statuses: ["en_attente", "en_cours", "verifie", "refuse", "suspendu"] },
];

export type DossierListItem = {
  id: string;
  status: DossierStatus;
  submittedAt: Date;
  verifiedAt: Date | null;
  serviceId: string;
  profileId: string;
  firstName: string;
  lastName: string;
  phone: string;
  areaName: string;
  stepsDone: number;
  stepsFailed: number;
  stepsTotal: number;
};

/**
 * Dossiers triés par priorité : les plus avancés d'abord (une visite peut les terminer),
 * puis les plus anciens. Un dossier ouvert depuis longtemps ne doit pas être oublié.
 */
export async function listDossiers(filter: DossierFilter, query?: string): Promise<DossierListItem[]> {
  const statuses = DOSSIER_FILTERS.find((f) => f.key === filter)?.statuses ?? DOSSIER_FILTERS[0].statuses;
  const conditions: SQL[] = [inArray(workerServices.status, statuses)];
  const q = query?.trim();
  if (q) {
    const like = `%${q.replace(/[%_]/g, "")}%`;
    conditions.push(
      or(
        ilike(workerProfiles.firstName, like),
        ilike(workerProfiles.lastName, like),
        ilike(users.phone, `%${q.replace(/\D/g, "") || "x"}%`),
        ilike(areas.name, like),
      )!,
    );
  }
  // Colonnes de la requête principale qualifiées à la main dans les sous-requêtes corrélées.
  const stepsDone = sql<number>`(select count(*)::int from verification_steps s where s.worker_service_id = "worker_services"."id" and s.status = 'fait')`;
  const stepsFailed = sql<number>`(select count(*)::int from verification_steps s where s.worker_service_id = "worker_services"."id" and s.status = 'echec')`;
  const stepsTotal = sql<number>`(select count(*)::int from verification_steps s where s.worker_service_id = "worker_services"."id")`;
  return db
    .select({
      id: workerServices.id,
      status: workerServices.status,
      submittedAt: workerServices.submittedAt,
      verifiedAt: workerServices.verifiedAt,
      serviceId: workerServices.serviceId,
      profileId: workerProfiles.id,
      firstName: workerProfiles.firstName,
      lastName: workerProfiles.lastName,
      phone: users.phone,
      areaName: areas.name,
      stepsDone,
      stepsFailed,
      stepsTotal,
    })
    .from(workerServices)
    .innerJoin(workerProfiles, eq(workerProfiles.id, workerServices.workerProfileId))
    .innerJoin(users, eq(users.id, workerProfiles.userId))
    .innerJoin(areas, eq(areas.id, workerProfiles.areaId))
    .where(and(...conditions))
    .orderBy(
      sql`case when ${workerServices.status} in ('en_attente', 'en_cours') then 0 else 1 end`,
      desc(sql`${stepsDone}::float / greatest(${stepsTotal}, 1)`),
      asc(workerServices.submittedAt),
    )
    .limit(200);
}

export async function countOpenDossiers(): Promise<number> {
  const [row] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(workerServices)
    .where(inArray(workerServices.status, ["en_attente", "en_cours"]));
  return row?.n ?? 0;
}

export type DossierDetail = {
  id: string;
  status: DossierStatus;
  service: LoadedService;
  formulaKeys: string[];
  skills: string[];
  submittedAt: Date;
  verifiedAt: Date | null;
  decisionReason: string | null;
  decidedAt: Date | null;
  profile: typeof workerProfiles.$inferSelect & { phone: string; areaName: string; acceptedAreaNames: string[] };
  steps: (typeof verificationSteps.$inferSelect & { agentName: string | null })[];
  documents: (typeof documents.$inferSelect)[];
  accessLog: { action: string; at: Date; userName: string | null; documentLabel: string | null }[];
};

export async function getDossier(id: string): Promise<DossierDetail | null> {
  const [row] = await db
    .select({ ws: workerServices, profile: workerProfiles, phone: users.phone, areaName: areas.name })
    .from(workerServices)
    .innerJoin(workerProfiles, eq(workerProfiles.id, workerServices.workerProfileId))
    .innerJoin(users, eq(users.id, workerProfiles.userId))
    .innerJoin(areas, eq(areas.id, workerProfiles.areaId))
    .where(eq(workerServices.id, id))
    .limit(1);
  if (!row) return null;
  const service = await getServiceById(row.ws.serviceId);
  if (!service) return null;

  const [steps, docs, log, accepted] = await Promise.all([
    db
      .select({ step: verificationSteps, agentName: users.name })
      .from(verificationSteps)
      .leftJoin(users, eq(users.id, verificationSteps.agentId))
      .where(eq(verificationSteps.workerServiceId, id))
      .orderBy(asc(verificationSteps.sortOrder)),
    db
      .select()
      .from(documents)
      .where(and(eq(documents.workerProfileId, row.profile.id), isNull(documents.deletedAt)))
      .orderBy(asc(documents.createdAt)),
    db
      .select({ action: accessLogs.action, at: accessLogs.at, userName: users.name, documentLabel: documents.label })
      .from(accessLogs)
      .leftJoin(users, eq(users.id, accessLogs.userId))
      .leftJoin(documents, eq(documents.id, accessLogs.documentId))
      .where(eq(accessLogs.workerProfileId, row.profile.id))
      .orderBy(desc(accessLogs.at))
      .limit(8),
    row.profile.acceptedAreaIds.length
      ? db.select({ name: areas.name }).from(areas).where(inArray(areas.id, row.profile.acceptedAreaIds))
      : Promise.resolve([] as { name: string }[]),
  ]);

  return {
    id: row.ws.id,
    status: row.ws.status,
    service,
    formulaKeys: row.ws.formulaKeys,
    skills: row.ws.skills,
    submittedAt: row.ws.submittedAt,
    verifiedAt: row.ws.verifiedAt,
    decisionReason: row.ws.decisionReason,
    decidedAt: row.ws.decidedAt,
    profile: { ...row.profile, phone: row.phone, areaName: row.areaName, acceptedAreaNames: accepted.map((a) => a.name) },
    steps: steps.map((s) => ({ ...s.step, agentName: s.agentName })),
    documents: docs,
    accessLog: log,
  };
}

export async function logDossierOpening(userId: string, workerProfileId: string, ip: string | null) {
  await db.insert(accessLogs).values({ userId, workerProfileId, action: "ouverture_dossier", ip });
}
