"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/db/client";
import { users, verificationSteps, workerProfiles, workerServices } from "@/db/schema";
import { getAreaCentroid } from "@/lib/areas";
import { requireSpace } from "@/lib/auth/guards";
import { generateCardId } from "@/lib/card";
import { SEARCH_RADII_KM } from "@/lib/form-engine/constants";
import { LANGUAGES, MIN_AGE } from "@/lib/registration";
import { getServicesById } from "@/lib/services/repository";

export type RegisterState = { error: string; field?: string } | null;

const currentYear = new Date().getUTCFullYear();

const schema = z.object({
  firstName: z.string().trim().min(1, "Indiquez votre prénom.").max(40),
  lastName: z.string().trim().min(1, "Indiquez votre nom.").max(40),
  gender: z.enum(["femme", "homme"], { error: "Choisissez « une femme » ou « un homme »." }),
  birthYear: z.coerce
    .number({ error: "Indiquez votre année de naissance." })
    .int()
    .min(1940, "Vérifiez l’année de naissance.")
    .max(currentYear - MIN_AGE, `Il faut avoir au moins ${MIN_AGE} ans pour s’inscrire.`),
  languages: z.array(z.enum(LANGUAGES)).min(1, "Choisissez au moins une langue."),
  services: z
    .array(
      z.object({
        serviceId: z.uuid(),
        formulaKeys: z.array(z.string()).min(1, "Choisissez au moins une façon de travailler."),
        skills: z.array(z.string()).min(1, "Choisissez au moins un savoir-faire."),
      }),
    )
    .min(1, "Choisissez au moins un service."),
  experienceYears: z.coerce.number({ error: "Indiquez votre expérience." }).int().min(0).max(50),
  areaId: z.uuid({ error: "Choisissez votre quartier." }),
  radiusKm: z
    .number()
    .refine((r) => (SEARCH_RADII_KM as readonly number[]).includes(r), "Choisissez une distance."),
  relocate: z.boolean(),
  monthly: z.number().int().min(0).max(2_000_000).nullable(),
  daily: z.number().int().min(0).max(200_000).nullable(),
  consent: z.literal(true, { error: "Votre accord est nécessaire pour vous inscrire." }),
});

/** Petit décalage stable : la position enregistrée est celle du quartier, jamais celle du domicile. */
function blurAround(seed: string, point: { lat: number; lng: number }) {
  let h = 0;
  for (const c of seed) h = (h * 31 + c.charCodeAt(0)) | 0;
  const a = ((h & 0xff) / 255) * 2 - 1;
  const b = (((h >> 8) & 0xff) / 255) * 2 - 1;
  return { lat: point.lat + a * 0.003, lng: point.lng + b * 0.003 };
}

export async function registerWorker(
  _prev: RegisterState,
  formData: FormData,
): Promise<RegisterState> {
  const user = await requireSpace("prestataire", "/espace-prestataire/inscription");
  const [existing] = await db
    .select({ id: workerProfiles.id })
    .from(workerProfiles)
    .where(eq(workerProfiles.userId, user.id))
    .limit(1);
  if (existing) redirect("/espace-prestataire");

  let raw: unknown;
  try {
    raw = JSON.parse(String(formData.get("inscription") ?? "{}"));
  } catch {
    return { error: "Vos réponses n’ont pas pu être lues. Réessayez." };
  }
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return {
      error: issue?.message ?? "Inscription incomplète.",
      field: String(issue?.path[0] ?? ""),
    };
  }
  const data = parsed.data;

  const services = await getServicesById();
  for (const choice of data.services) {
    const service = services.get(choice.serviceId);
    if (!service || !service.active)
      return { error: "Ce service n’est pas disponible.", field: "services" };
    const formulas = new Set(service.config.formulas.map((f) => f.key));
    const skills = new Set(service.config.skills.map((s) => s.key));
    if (
      !choice.formulaKeys.every((k) => formulas.has(k)) ||
      !choice.skills.every((k) => skills.has(k))
    ) {
      return { error: "Une réponse ne correspond pas au service choisi.", field: "services" };
    }
  }

  const centroid = await getAreaCentroid(data.areaId);
  if (!centroid) return { error: "Ce quartier est introuvable.", field: "areaId" };
  const housing = data.services.some((choice) =>
    choice.formulaKeys.some(
      (k) => services.get(choice.serviceId)?.config.formulas.find((f) => f.key === k)?.housing,
    ),
  );

  const now = new Date();
  await db.transaction(async (tx) => {
    let profileId: string | null = null;
    for (let attempt = 0; attempt < 5 && !profileId; attempt++) {
      const [row] = await tx
        .insert(workerProfiles)
        .values({
          userId: user.id,
          firstName: data.firstName,
          lastName: data.lastName,
          gender: data.gender,
          birthYear: data.birthYear,
          languages: data.languages,
          experienceYears: data.experienceYears,
          areaId: data.areaId,
          location: blurAround(user.id, centroid),
          interventionRadiusKm: data.radiusKm,
          willingToRelocate: housing && data.relocate,
          monthlyRateFcfa: data.monthly || null,
          dailyRateFcfa: data.daily || null,
          cardId: generateCardId(),
          consentAt: now,
        })
        .onConflictDoNothing({ target: workerProfiles.cardId })
        .returning({ id: workerProfiles.id });
      profileId = row?.id ?? null;
    }
    if (!profileId) throw new Error("Impossible d’attribuer un numéro de carte unique.");

    for (const choice of data.services) {
      const service = services.get(choice.serviceId)!;
      const [dossier] = await tx
        .insert(workerServices)
        .values({
          workerProfileId: profileId,
          serviceId: service.id,
          formulaKeys: choice.formulaKeys,
          skills: choice.skills,
        })
        .returning({ id: workerServices.id });
      await tx.insert(verificationSteps).values(
        service.config.verification.map((step, index) => ({
          workerServiceId: dossier.id,
          type: step.key,
          sortOrder: index,
        })),
      );
    }
    await tx.update(users).set({ consentAt: now }).where(eq(users.id, user.id));
  });

  // Le layout de l'espace affiche la navigation dès que le profil existe.
  revalidatePath("/espace-prestataire", "layout");
  redirect("/espace-prestataire?ok=inscription");
}
