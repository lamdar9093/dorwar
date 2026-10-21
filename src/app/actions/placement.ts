"use server";

import { eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/db/client";
import { incidents, placements, reviews, workerProfiles } from "@/db/schema";
import { done, fail, type ActionResult } from "@/lib/action-result";
import { requireUser } from "@/lib/auth/guards";
import { isPlacementParty } from "@/lib/auth/rbac";
import { getPlacementDetail } from "@/lib/data/placements";
import { INCIDENT_CATEGORIES } from "@/lib/incidents";
import { redirectWithFlash, safePath } from "@/lib/flash";
import { isReviewable } from "@/lib/placements";

async function loadForParty(formData: FormData) {
  const id = String(formData.get("placement") ?? "");
  const user = await requireUser();
  const detail = await getPlacementDetail(id);
  if (
    !detail ||
    !isPlacementParty(user, {
      familyUserId: detail.family.userId,
      workerUserId: detail.worker.userId,
    })
  ) {
    return { user, detail: null };
  }
  return { user, detail };
}

function refresh(id: string) {
  revalidatePath(`/placements/${id}`);
  revalidatePath(`/espace-prestataire/missions/${id}`);
  revalidatePath(`/agent/placements/${id}`);
}

/** Chacun accepte les conditions écrites : la confiance va dans les deux sens. */
export async function acceptConditions(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const { user, detail } = await loadForParty(formData);
  if (!detail) return fail("Ce placement est introuvable.");
  if (!detail.conditions) return fail("Les conditions ne sont pas encore écrites par l’équipe.");
  const isFamily = user.id === detail.family.userId;
  await db
    .update(placements)
    .set(isFamily ? { familyAcceptedAt: new Date() } : { workerAcceptedAt: new Date() })
    .where(eq(placements.id, detail.id));
  refresh(detail.id);
  redirectWithFlash(safePath(formData.get("retour"), `/placements/${detail.id}`), "accord");
}

const reviewSchema = z.object({
  rating: z.coerce.number().int().min(1, "Choisissez une note.").max(5),
  comment: z
    .string()
    .trim()
    .min(10, "Quelques mots de plus, s’il vous plaît (10 caractères au moins).")
    .max(800, "800 caractères au maximum."),
});

export async function submitReview(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const { user, detail } = await loadForParty(formData);
  if (!detail) return fail("Ce placement est introuvable.");
  if (!isReviewable(detail.status))
    return fail("Vous pourrez laisser un avis une fois la personne au travail.");
  if (detail.reviews.some((r) => r.authorId === user.id))
    return fail("Vous avez déjà laissé un avis pour ce placement.");
  const parsed = reviewSchema.safeParse({
    rating: formData.get("note"),
    comment: formData.get("commentaire") ?? "",
  });
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Avis incomplet.");

  const isFamily = user.id === detail.family.userId;
  await db.insert(reviews).values({
    placementId: detail.id,
    authorId: user.id,
    targetUserId: isFamily ? detail.worker.userId : detail.family.userId,
    authorRole: isFamily ? "famille" : "prestataire",
    rating: parsed.data.rating,
    comment: parsed.data.comment,
  });
  if (isFamily) {
    await db
      .update(workerProfiles)
      .set({
        ratingAvg: sql`(select avg(rating)::real from reviews where target_user_id = ${detail.worker.userId} and author_role = 'famille')`,
        ratingCount: sql`(select count(*)::int from reviews where target_user_id = ${detail.worker.userId} and author_role = 'famille')`,
      })
      .where(eq(workerProfiles.id, detail.worker.profileId));
  }
  refresh(detail.id);
  redirectWithFlash(safePath(formData.get("retour"), `/placements/${detail.id}`), "avis");
}

const incidentSchema = z.object({
  category: z.enum(INCIDENT_CATEGORIES.map((c) => c.key) as [string, ...string[]], {
    error: "Choisissez le type de problème.",
  }),
  description: z
    .string()
    .trim()
    .min(10, "Décrivez le problème en quelques mots (10 caractères au moins).")
    .max(1500, "1 500 caractères au maximum."),
});

/** « Signaler un problème » : enregistré, visible par l'admin, suivi par l'équipe. */
export async function reportIncident(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const { user, detail } = await loadForParty(formData);
  if (!detail) return fail("Ce placement est introuvable.");
  const parsed = incidentSchema.safeParse({
    category: formData.get("categorie"),
    description: formData.get("description") ?? "",
  });
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Signalement incomplet.");
  await db.insert(incidents).values({
    reporterId: user.id,
    placementId: detail.id,
    category: parsed.data.category,
    description: parsed.data.description,
  });
  refresh(detail.id);
  revalidatePath("/admin/signalements");
  return done("Merci de nous avoir prévenus. L’équipe Dorwar vous rappelle au plus vite.");
}
