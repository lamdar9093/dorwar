"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db/client";
import { placements, requests } from "@/db/schema";
import { done, fail, type ActionResult } from "@/lib/action-result";
import { requireSpace } from "@/lib/auth/guards";
import { getPlacementDetail, type PlacementDetail } from "@/lib/data/placements";
import { redirectWithFlash } from "@/lib/flash";
import { todayIso } from "@/lib/format";
import {
  canTransition,
  followUpDate,
  guaranteeEndDate,
  type PlacementStatus,
} from "@/lib/placements";

async function load(formData: FormData) {
  const agent = await requireSpace("agent");
  const detail = await getPlacementDetail(String(formData.get("placement") ?? ""));
  return { agent, detail };
}

function refresh(detail: PlacementDetail) {
  for (const path of [
    `/agent/placements/${detail.id}`,
    "/agent/suivis",
    "/agent",
    `/placements/${detail.id}`,
    `/espace-prestataire/missions/${detail.id}`,
  ]) {
    revalidatePath(path);
  }
}

function guard(detail: PlacementDetail, to: PlacementStatus): string | null {
  return canTransition(detail.status, to, detail.formula.kind)
    ? null
    : "Cette étape n’est pas possible depuis le statut actuel.";
}

const isoDate = (value: FormDataEntryValue | null) => {
  const v = String(value ?? "");
  return /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : null;
};

const amount = (value: FormDataEntryValue | null) => {
  const n = Number(String(value ?? "").replace(/\D/g, ""));
  return Number.isFinite(n) && n > 0 ? n : null;
};

/** Rencontre fixée : date, lieu, et brouillon des conditions écrites. */
export async function scheduleMeeting(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const { detail } = await load(formData);
  if (!detail) return fail("Placement introuvable.");
  const error = guard(detail, "rencontre_prevue");
  if (error) return fail(error);
  const when = String(formData.get("rencontre") ?? "");
  const meetingAt = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(when) ? new Date(`${when}:00Z`) : null;
  if (!meetingAt) return fail("Indiquez la date et l’heure de la rencontre.");
  const place = String(formData.get("lieu") ?? "")
    .trim()
    .slice(0, 160);
  const conditions = String(formData.get("conditions") ?? "")
    .trim()
    .slice(0, 3000);
  const pay = amount(formData.get("remuneration"));
  await db
    .update(placements)
    .set({
      status: "rencontre_prevue",
      meetingAt,
      meetingPlace: place || null,
      conditions: conditions || null,
      agreedMonthlyFcfa: detail.formula.pay === "mensuel" ? pay : null,
      agreedDailyFcfa: detail.formula.pay === "journalier" ? pay : null,
      scheduledAt: new Date(),
      startDate: isoDate(formData.get("debut")),
      endDate: isoDate(formData.get("fin")),
      // Les conditions changent : chacun doit les accepter de nouveau.
      familyAcceptedAt: null,
      workerAcceptedAt: null,
    })
    .where(eq(placements.id, detail.id));
  refresh(detail);
  redirectWithFlash(`/agent/placements/${detail.id}`, "rencontre");
}

export async function updateConditions(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const { detail } = await load(formData);
  if (!detail) return fail("Placement introuvable.");
  const conditions = String(formData.get("conditions") ?? "")
    .trim()
    .slice(0, 3000);
  const pay = amount(formData.get("remuneration"));
  await db
    .update(placements)
    .set({
      conditions: conditions || null,
      agreedMonthlyFcfa: detail.formula.pay === "mensuel" ? pay : detail.agreedMonthlyFcfa,
      agreedDailyFcfa: detail.formula.pay === "journalier" ? pay : detail.agreedDailyFcfa,
      familyAcceptedAt: conditions === detail.conditions ? detail.familyAcceptedAt : null,
      workerAcceptedAt: conditions === detail.conditions ? detail.workerAcceptedAt : null,
    })
    .where(eq(placements.id, detail.id));
  refresh(detail);
  return done("Conditions mises à jour. Si elles ont changé, chacun doit les accepter de nouveau.");
}

/** Début de l'essai (longue durée) : la garantie démarre, l'appel de suivi est planifié à J+7. */
export async function startTrial(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const { detail } = await load(formData);
  if (!detail) return fail("Placement introuvable.");
  const error = guard(detail, "essai");
  if (error) return fail(error);
  const start = isoDate(formData.get("debut")) ?? todayIso();
  const guarantee = detail.service.config.guarantees[detail.formula.key];
  await db
    .update(placements)
    .set({
      status: "essai",
      startDate: start,
      trialStartedAt: new Date(`${start}T09:00:00Z`),
      guaranteeEndsAt: guarantee ? guaranteeEndDate(start, guarantee.days) : null,
      followUpDueAt: followUpDate(start),
    })
    .where(eq(placements.id, detail.id));
  await db.update(requests).set({ status: "pourvue" }).where(eq(requests.id, detail.requestId));
  refresh(detail);
  redirectWithFlash(`/agent/placements/${detail.id}`, "essai");
}

/** Confirmation : fin de l'essai réussi (longue durée) ou mission confirmée (ponctuelle). */
export async function confirmPlacement(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const { detail } = await load(formData);
  if (!detail) return fail("Placement introuvable.");
  const error = guard(detail, "confirme");
  if (error) return fail(error);
  const values: Partial<typeof placements.$inferInsert> = {
    status: "confirme",
    confirmedAt: new Date(),
  };
  if (detail.formula.kind === "ponctuelle") {
    const start = isoDate(formData.get("debut")) ?? detail.startDate ?? todayIso();
    const guarantee = detail.service.config.guarantees[detail.formula.key];
    values.startDate = start;
    values.endDate = isoDate(formData.get("fin")) ?? detail.endDate ?? start;
    values.guaranteeEndsAt = guarantee ? guaranteeEndDate(values.endDate, guarantee.days) : null;
  }
  await db.update(placements).set(values).where(eq(placements.id, detail.id));
  await db.update(requests).set({ status: "pourvue" }).where(eq(requests.id, detail.requestId));
  refresh(detail);
  redirectWithFlash(`/agent/placements/${detail.id}`, "confirme");
}

/** Fin, annulation, ou remplacement au titre de la garantie (la demande de la famille est rouverte). */
export async function endPlacement(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const { detail } = await load(formData);
  if (!detail) return fail("Placement introuvable.");
  const mode = String(formData.get("mode") ?? "terminer");
  const reason = String(formData.get("motif") ?? "")
    .trim()
    .slice(0, 500);
  if (reason.length < 5) return fail("Indiquez le motif en quelques mots.");
  const to: PlacementStatus = mode === "annuler" ? "annule" : "termine";
  const error = guard(detail, to);
  if (error) return fail(error);
  const replacing = mode === "garantie";
  await db
    .update(placements)
    .set({
      status: to,
      endedAt: new Date(),
      endDate: detail.endDate ?? todayIso(),
      endReason: replacing ? `Remplacement au titre de la garantie : ${reason}` : reason,
    })
    .where(eq(placements.id, detail.id));
  if (replacing || to === "annule") {
    await db.update(requests).set({ status: "ouverte" }).where(eq(requests.id, detail.requestId));
  }
  refresh(detail);
  redirectWithFlash(
    `/agent/placements/${detail.id}`,
    replacing ? "garantie" : to === "annule" ? "annule" : "fin",
  );
}

/** Appel de suivi de la première semaine, aux deux côtés. */
export async function recordFollowUp(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const { agent, detail } = await load(formData);
  if (!detail) return fail("Placement introuvable.");
  const notes = String(formData.get("notes") ?? "")
    .trim()
    .slice(0, 1000);
  if (notes.length < 5) return fail("Résumez l’appel en quelques mots.");
  await db
    .update(placements)
    .set({ followUpDoneAt: new Date(), followUpNotes: notes, followUpById: agent.id })
    .where(eq(placements.id, detail.id));
  refresh(detail);
  redirectWithFlash(`/agent/placements/${detail.id}`, "suivi");
}
