"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/db/client";
import { waitlist } from "@/db/schema";
import { done, fail, type ActionResult } from "@/lib/action-result";
import { requireSpace } from "@/lib/auth/guards";
import { canViewRequest } from "@/lib/auth/rbac";
import { getRequest } from "@/lib/data/requests";

/** « Prévenez-moi » : la famille laisse son numéro pour une zone pas encore couverte. */
export async function joinWaitlist(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const requestId = String(formData.get("demande") ?? "");
  const user = await requireSpace("famille", `/demandes/${requestId}`);
  const request = await getRequest(requestId);
  if (!request || !canViewRequest(user, request)) return fail("Cette demande est introuvable.");
  await db
    .insert(waitlist)
    .values({
      phone: user.phone,
      userId: user.id,
      areaId: request.areaId,
      serviceId: request.service.id,
      formulaKey: request.formula.key,
    })
    .onConflictDoNothing();
  revalidatePath(`/demandes/${requestId}`);
  return done(
    "C’est noté : l’équipe vous appelle dès qu’une personne vérifiée est disponible près de chez vous.",
  );
}
