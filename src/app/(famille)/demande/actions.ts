"use server";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/db/client";
import { familyProfiles, requests } from "@/db/schema";
import { getArea, getAreaCentroid, nearestArea } from "@/lib/areas";
import { requireSpace } from "@/lib/auth/guards";
import { validateAnswers } from "@/lib/form-engine/compile";
import type { LocationAnswer } from "@/lib/form-engine/constants";
import { findField } from "@/lib/form-engine/visibility";
import { todayIso } from "@/lib/format";
import { findMatches } from "@/lib/matching";
import { formulaOf, getServiceBySlug } from "@/lib/services/repository";

export type NeedState = { error: string; fieldErrors: Record<string, string> } | null;

/** Au-delà, la position partagée est trop loin de toute zone connue (appareil hors du Sénégal, par exemple). */
const MAX_DISTANCE_TO_KNOWN_AREA_M = 50_000;

export async function submitNeed(_prev: NeedState, formData: FormData): Promise<NeedState> {
  const slug = String(formData.get("service") ?? "");
  const user = await requireSpace("famille", `/demande/${slug}`);
  const service = await getServiceBySlug(slug);
  if (!service || !service.active)
    return { error: "Ce service n’est pas disponible.", fieldErrors: {} };

  let raw: Record<string, unknown>;
  try {
    raw = JSON.parse(String(formData.get("answers") ?? "{}"));
  } catch {
    return { error: "Vos réponses n’ont pas pu être lues. Réessayez.", fieldErrors: {} };
  }

  const form = service.config.needForm;
  const result = validateAnswers(
    form,
    { formulaKeys: service.config.formulas.map((f) => f.key), today: todayIso() },
    raw,
  );
  if (!result.ok)
    return { error: "Quelques réponses sont à compléter.", fieldErrors: result.errors };

  const formulaField = findField(form, "formula")!;
  const locationField = findField(form, "location")!;
  const formulaKey = String(result.answers[formulaField.key]);
  const lieu = result.answers[locationField.key] as LocationAnswer;

  let areaId: string;
  let location: { lat: number; lng: number };
  if (lieu.mode === "autour" && lieu.lat !== undefined && lieu.lng !== undefined) {
    const nearest = await nearestArea(lieu.lng, lieu.lat);
    if (!nearest || nearest.distanceM > MAX_DISTANCE_TO_KNOWN_AREA_M) {
      return {
        error: "Votre position semble loin des zones que nous connaissons.",
        fieldErrors: {
          [locationField.key]:
            "Votre position semble hors du Sénégal. Choisissez plutôt votre quartier.",
        },
      };
    }
    areaId = nearest.id;
    location = { lat: Math.round(lieu.lat * 1000) / 1000, lng: Math.round(lieu.lng * 1000) / 1000 };
  } else {
    const area = lieu.areaId ? await getArea(lieu.areaId) : null;
    const centroid = area ? await getAreaCentroid(area.id) : null;
    if (!area || !centroid) {
      return {
        error: "Cette zone est introuvable.",
        fieldErrors: { [locationField.key]: "Choisissez une zone dans la liste." },
      };
    }
    areaId = area.id;
    location = centroid;
  }

  const [created] = await db
    .insert(requests)
    .values({
      familyUserId: user.id,
      serviceId: service.id,
      formulaKey,
      answers: result.answers,
      searchMode: lieu.mode,
      areaId,
      location,
      radiusKm: lieu.mode === "autour" ? lieu.radiusKm : null,
    })
    .returning({ id: requests.id });

  await db
    .update(familyProfiles)
    .set({ commitmentsAcceptedAt: new Date(), areaId })
    .where(eq(familyProfiles.userId, user.id));

  // Personne repérée dans la vitrine : si elle correspond à la demande, on l'ouvre directement,
  // prête pour la demande de rencontre. Sinon, la famille voit celles qui correspondent.
  const profil = z.uuid().safeParse(formData.get("profil"));
  if (profil.success) {
    const formula = formulaOf(service, formulaKey);
    const matches = formula ? await findMatches(created.id, formula.housing) : [];
    if (matches.some((m) => m.workerProfileId === profil.data)) {
      redirect(`/profils/${profil.data}?demande=${created.id}#rencontre`);
    }
    redirect(`/demandes/${created.id}?nouvelle=1&profil=hors`);
  }

  redirect(`/demandes/${created.id}?nouvelle=1`);
}
