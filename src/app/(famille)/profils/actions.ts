"use server";

import { and, eq, inArray } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/db/client";
import { placements, workerServices } from "@/db/schema";
import { fail, type ActionResult } from "@/lib/action-result";
import { requireSpace } from "@/lib/auth/guards";
import { canViewRequest } from "@/lib/auth/rbac";
import { getRequest } from "@/lib/data/requests";
import { ACTIVE_STATUSES } from "@/lib/placements";

/** Demande de rencontre : crée le placement, l'équipe appelle ensuite pour organiser. */
export async function requestMeeting(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const requestId = String(formData.get("demande") ?? "");
  const workerServiceId = String(formData.get("dossier") ?? "");
  const message = String(formData.get("message") ?? "")
    .trim()
    .slice(0, 500);
  const user = await requireSpace("famille", `/demandes/${requestId}`);

  const request = await getRequest(requestId);
  if (!request || !canViewRequest(user, request)) return fail("Cette demande est introuvable.");
  if (request.status !== "ouverte") return fail("Cette demande est déjà pourvue ou fermée.");

  const [dossier] = await db
    .select()
    .from(workerServices)
    .where(and(eq(workerServices.id, workerServiceId), eq(workerServices.status, "verifie")))
    .limit(1);
  if (
    !dossier ||
    dossier.serviceId !== request.service.id ||
    !dossier.formulaKeys.includes(request.formula.key)
  ) {
    return fail("Ce profil ne correspond pas à cette demande.");
  }

  const [existing] = await db
    .select({ id: placements.id })
    .from(placements)
    .where(
      and(
        eq(placements.requestId, request.id),
        eq(placements.workerServiceId, dossier.id),
        inArray(placements.status, [...ACTIVE_STATUSES]),
      ),
    )
    .limit(1);
  if (existing) redirect(`/placements/${existing.id}`);

  const [created] = await db
    .insert(placements)
    .values({
      requestId: request.id,
      workerServiceId: dossier.id,
      familyUserId: user.id,
      workerProfileId: dossier.workerProfileId,
      serviceId: request.service.id,
      formulaKey: request.formula.key,
      familyMessage: message || null,
    })
    .returning({ id: placements.id });
  redirect(`/placements/${created.id}?envoye=1`);
}
