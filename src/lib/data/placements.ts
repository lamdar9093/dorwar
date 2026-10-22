import "server-only";
import { and, desc, eq, inArray } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { db } from "@/db/client";
import {
  areas,
  familyProfiles,
  incidents,
  placements,
  requests,
  reviews,
  users,
  workerProfiles,
  type PlacementStatus,
} from "@/db/schema";
import { formulaOf, getServiceById, type LoadedService } from "@/lib/services/repository";

export type PlacementDetail = {
  id: string;
  status: PlacementStatus;
  service: LoadedService;
  formula: LoadedService["config"]["formulas"][number];
  requestId: string;
  requestAnswers: Record<string, unknown>;
  family: { userId: string; displayName: string; areaName: string | null; phone: string };
  worker: {
    profileId: string;
    userId: string;
    firstName: string;
    lastName: string;
    lastInitial: string;
    gender: "femme" | "homme";
    cardId: string;
    phone: string;
    areaName: string;
  };
  familyMessage: string | null;
  meetingAt: Date | null;
  meetingPlace: string | null;
  startDate: string | null;
  endDate: string | null;
  agreedMonthlyFcfa: number | null;
  agreedDailyFcfa: number | null;
  restDays: string[] | null;
  conditions: string | null;
  familyAcceptedAt: Date | null;
  workerAcceptedAt: Date | null;
  guaranteeEndsAt: string | null;
  followUpDueAt: string | null;
  followUpDoneAt: Date | null;
  followUpNotes: string | null;
  createdAt: Date;
  scheduledAt: Date | null;
  trialStartedAt: Date | null;
  confirmedAt: Date | null;
  endedAt: Date | null;
  endReason: string | null;
  reviews: { authorRole: "famille" | "prestataire" | "agent" | "admin"; authorId: string; rating: number; comment: string; createdAt: Date }[];
  incidents: { id: string; category: string; description: string; status: "ouvert" | "en_cours" | "resolu"; createdAt: Date; reporterId: string }[];
};

const familyUsers = alias(users, "family_users");
const workerUsers = alias(users, "worker_users");
const workerAreas = alias(areas, "worker_areas");

export async function getPlacementDetail(id: string): Promise<PlacementDetail | null> {
  const [row] = await db
    .select({
      p: placements,
      answers: requests.answers,
      familyName: familyProfiles.displayName,
      familyArea: areas.name,
      familyPhone: familyUsers.phone,
      worker: workerProfiles,
      workerPhone: workerUsers.phone,
      workerArea: workerAreas.name,
    })
    .from(placements)
    .innerJoin(requests, eq(requests.id, placements.requestId))
    .innerJoin(familyUsers, eq(familyUsers.id, placements.familyUserId))
    .leftJoin(familyProfiles, eq(familyProfiles.userId, placements.familyUserId))
    .leftJoin(areas, eq(areas.id, requests.areaId))
    .innerJoin(workerProfiles, eq(workerProfiles.id, placements.workerProfileId))
    .innerJoin(workerUsers, eq(workerUsers.id, workerProfiles.userId))
    .innerJoin(workerAreas, eq(workerAreas.id, workerProfiles.areaId))
    .where(eq(placements.id, id))
    .limit(1);
  if (!row) return null;
  const service = await getServiceById(row.p.serviceId);
  const formula = service ? formulaOf(service, row.p.formulaKey) : null;
  if (!service || !formula) return null;

  const [reviewRows, incidentRows] = await Promise.all([
    db
      .select({
        authorRole: reviews.authorRole,
        authorId: reviews.authorId,
        rating: reviews.rating,
        comment: reviews.comment,
        createdAt: reviews.createdAt,
      })
      .from(reviews)
      .where(eq(reviews.placementId, id)),
    db
      .select({
        id: incidents.id,
        category: incidents.category,
        description: incidents.description,
        status: incidents.status,
        createdAt: incidents.createdAt,
        reporterId: incidents.reporterId,
      })
      .from(incidents)
      .where(eq(incidents.placementId, id))
      .orderBy(desc(incidents.createdAt)),
  ]);

  const p = row.p;
  return {
    id: p.id,
    status: p.status,
    service,
    formula,
    requestId: p.requestId,
    requestAnswers: row.answers,
    family: {
      userId: p.familyUserId,
      displayName: row.familyName ?? "Famille",
      areaName: row.familyArea,
      phone: row.familyPhone,
    },
    worker: {
      profileId: row.worker.id,
      userId: row.worker.userId,
      firstName: row.worker.firstName,
      lastName: row.worker.lastName,
      lastInitial: row.worker.lastName.charAt(0),
      gender: row.worker.gender,
      cardId: row.worker.cardId,
      phone: row.workerPhone,
      areaName: row.workerArea,
    },
    familyMessage: p.familyMessage,
    meetingAt: p.meetingAt,
    meetingPlace: p.meetingPlace,
    startDate: p.startDate,
    endDate: p.endDate,
    agreedMonthlyFcfa: p.agreedMonthlyFcfa,
    agreedDailyFcfa: p.agreedDailyFcfa,
    restDays: p.restDays,
    conditions: p.conditions,
    familyAcceptedAt: p.familyAcceptedAt,
    workerAcceptedAt: p.workerAcceptedAt,
    guaranteeEndsAt: p.guaranteeEndsAt,
    followUpDueAt: p.followUpDueAt,
    followUpDoneAt: p.followUpDoneAt,
    followUpNotes: p.followUpNotes,
    createdAt: p.createdAt,
    scheduledAt: p.scheduledAt,
    trialStartedAt: p.trialStartedAt,
    confirmedAt: p.confirmedAt,
    endedAt: p.endedAt,
    endReason: p.endReason,
    reviews: reviewRows,
    incidents: incidentRows,
  };
}

export type PlacementListItem = {
  id: string;
  status: PlacementStatus;
  serviceId: string;
  formulaKey: string;
  requestId: string;
  createdAt: Date;
  meetingAt: Date | null;
  startDate: string | null;
  endDate: string | null;
  followUpDueAt: string | null;
  followUpDoneAt: Date | null;
  guaranteeEndsAt: string | null;
  workerProfileId: string;
  workerFirstName: string;
  workerLastName: string;
  workerGender: "femme" | "homme";
  familyUserId: string;
  familyName: string | null;
  familyAreaName: string | null;
  conditions: string | null;
  familyAcceptedAt: Date | null;
  workerAcceptedAt: Date | null;
};

function listQuery() {
  return db
    .select({
      id: placements.id,
      status: placements.status,
      serviceId: placements.serviceId,
      formulaKey: placements.formulaKey,
      requestId: placements.requestId,
      createdAt: placements.createdAt,
      meetingAt: placements.meetingAt,
      startDate: placements.startDate,
      endDate: placements.endDate,
      followUpDueAt: placements.followUpDueAt,
      followUpDoneAt: placements.followUpDoneAt,
      guaranteeEndsAt: placements.guaranteeEndsAt,
      workerProfileId: placements.workerProfileId,
      workerFirstName: workerProfiles.firstName,
      workerLastName: workerProfiles.lastName,
      workerGender: workerProfiles.gender,
      familyUserId: placements.familyUserId,
      familyName: familyProfiles.displayName,
      familyAreaName: areas.name,
      conditions: placements.conditions,
      familyAcceptedAt: placements.familyAcceptedAt,
      workerAcceptedAt: placements.workerAcceptedAt,
    })
    .from(placements)
    .innerJoin(workerProfiles, eq(workerProfiles.id, placements.workerProfileId))
    .innerJoin(requests, eq(requests.id, placements.requestId))
    .leftJoin(familyProfiles, eq(familyProfiles.userId, placements.familyUserId))
    .leftJoin(areas, eq(areas.id, requests.areaId));
}

export function listFamilyPlacements(familyUserId: string): Promise<PlacementListItem[]> {
  return listQuery().where(eq(placements.familyUserId, familyUserId)).orderBy(desc(placements.createdAt));
}

export function listWorkerPlacements(workerProfileId: string): Promise<PlacementListItem[]> {
  return listQuery().where(eq(placements.workerProfileId, workerProfileId)).orderBy(desc(placements.createdAt));
}

export function listPlacementsByStatus(statuses: PlacementStatus[]): Promise<PlacementListItem[]> {
  return listQuery().where(inArray(placements.status, statuses)).orderBy(desc(placements.createdAt));
}

export function listPlacementsForRequest(requestId: string): Promise<PlacementListItem[]> {
  return listQuery().where(and(eq(placements.requestId, requestId))).orderBy(desc(placements.createdAt));
}
