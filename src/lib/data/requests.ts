import "server-only";
import { desc, eq, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { requests } from "@/db/schema";
import { describeArea } from "@/lib/areas";
import { formulaOf, getServiceById, type LoadedService } from "@/lib/services/repository";

export type RequestDetail = {
  id: string;
  familyUserId: string;
  service: LoadedService;
  formula: LoadedService["config"]["formulas"][number];
  answers: Record<string, unknown>;
  searchMode: "autour" | "zone";
  areaId: string;
  areaLabel: string;
  radiusKm: number | null;
  location: { lat: number; lng: number };
  status: "ouverte" | "pourvue" | "fermee";
  createdAt: Date;
};

export async function getRequest(id: string): Promise<RequestDetail | null> {
  const [row] = await db.select().from(requests).where(eq(requests.id, id)).limit(1);
  if (!row) return null;
  const service = await getServiceById(row.serviceId);
  if (!service) return null;
  const formula = formulaOf(service, row.formulaKey);
  if (!formula) return null;
  return {
    id: row.id,
    familyUserId: row.familyUserId,
    service,
    formula,
    answers: row.answers,
    searchMode: row.searchMode,
    areaId: row.areaId,
    areaLabel: await describeArea(row.areaId),
    radiusKm: row.radiusKm,
    location: row.location,
    status: row.status,
    createdAt: row.createdAt,
  };
}

export type RequestListItem = {
  id: string;
  serviceId: string;
  formulaKey: string;
  areaId: string;
  status: "ouverte" | "pourvue" | "fermee";
  createdAt: Date;
  placementCount: number;
};

export async function listFamilyRequests(userId: string): Promise<RequestListItem[]> {
  return db
    .select({
      id: requests.id,
      serviceId: requests.serviceId,
      formulaKey: requests.formulaKey,
      areaId: requests.areaId,
      status: requests.status,
      createdAt: requests.createdAt,
      placementCount: sql<number>`(select count(*)::int from placements p where p.request_id = "requests"."id" and p.status <> 'annule')`,
    })
    .from(requests)
    .where(eq(requests.familyUserId, userId))
    .orderBy(desc(requests.createdAt));
}
