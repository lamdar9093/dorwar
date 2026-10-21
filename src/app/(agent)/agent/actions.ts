"use server";

import { randomUUID } from "node:crypto";
import { and, eq, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db/client";
import {
  accessLogs,
  documents,
  verificationSteps,
  workerProfiles,
  workerServices,
} from "@/db/schema";
import { done, fail, type ActionResult } from "@/lib/action-result";
import { requireSpace } from "@/lib/auth/guards";
import { getDossier } from "@/lib/data/dossiers";
import { ACCEPTED_UPLOADS, MAX_UPLOAD_BYTES, sniffMime } from "@/lib/documents/filetype";
import { getStorage } from "@/lib/storage";
import { redirectWithFlash } from "@/lib/flash";
import { canValidateDossier, openDossierStatus } from "@/lib/verification";

function refresh(dossierId: string) {
  revalidatePath(`/agent/dossiers/${dossierId}`);
  revalidatePath("/agent");
}

const STATUSES = ["fait", "echec", "a_faire"] as const;

/** Cocher une étape : l'agent et la date sont enregistrés automatiquement. */
export async function updateStep(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const agent = await requireSpace("agent");
  const stepId = String(formData.get("etape") ?? "");
  const status = String(formData.get("statut") ?? "");
  const notes = String(formData.get("notes") ?? "")
    .trim()
    .slice(0, 2000);
  const [step] = await db
    .select()
    .from(verificationSteps)
    .where(eq(verificationSteps.id, stepId))
    .limit(1);
  if (!step) return fail("Étape introuvable.");
  const [dossier] = await db
    .select()
    .from(workerServices)
    .where(eq(workerServices.id, step.workerServiceId))
    .limit(1);
  if (!dossier) return fail("Dossier introuvable.");

  const newStatus = (STATUSES as readonly string[]).includes(status)
    ? (status as (typeof STATUSES)[number])
    : step.status;
  if (newStatus === "echec" && !notes)
    return fail("Notez ce qui n’a pas pu être vérifié : c’est utile pour la suite.");
  await db
    .update(verificationSteps)
    .set({
      status: newStatus,
      notes: notes || null,
      agentId: newStatus === "a_faire" ? null : agent.id,
      completedAt:
        newStatus === "a_faire"
          ? null
          : newStatus === step.status && step.completedAt
            ? step.completedAt
            : new Date(),
    })
    .where(eq(verificationSteps.id, stepId));

  if (dossier.status === "en_attente" || dossier.status === "en_cours") {
    const steps = await db
      .select()
      .from(verificationSteps)
      .where(eq(verificationSteps.workerServiceId, dossier.id));
    await db
      .update(workerServices)
      .set({ status: openDossierStatus(steps) })
      .where(eq(workerServices.id, dossier.id));
  }
  refresh(dossier.id);
  return done(
    newStatus === "fait"
      ? "Étape validée."
      : newStatus === "echec"
        ? "Étape notée en échec."
        : "Note enregistrée.",
  );
}

const KIND_BY_STEP: Record<string, "piece_identite" | "photo" | "justificatif" | "autre"> = {
  identite: "piece_identite",
  photo: "photo",
  adresse: "justificatif",
};

/** Photo ou document pris sur le terrain : stockage privé, journalisé. */
export async function uploadDocument(formData: FormData): Promise<ActionResult> {
  const agent = await requireSpace("agent");
  const stepId = String(formData.get("etape") ?? "");
  const file = formData.get("fichier");
  const label = String(formData.get("libelle") ?? "")
    .trim()
    .slice(0, 80);
  if (!(file instanceof File) || file.size === 0) return fail("Aucun fichier reçu.");
  if (file.size > MAX_UPLOAD_BYTES) return fail("Fichier trop lourd (8 Mo au maximum).");

  const [step] = await db
    .select({
      step: verificationSteps,
      profileId: workerServices.workerProfileId,
      dossierId: workerServices.id,
    })
    .from(verificationSteps)
    .innerJoin(workerServices, eq(workerServices.id, verificationSteps.workerServiceId))
    .where(eq(verificationSteps.id, stepId))
    .limit(1);
  if (!step) return fail("Étape introuvable.");

  const bytes = new Uint8Array(await file.arrayBuffer());
  const mime = sniffMime(bytes);
  if (!mime) return fail("Format non accepté : photo (JPEG, PNG, WebP) ou PDF.");

  const storageKey = `documents/${step.profileId}/${randomUUID()}.${ACCEPTED_UPLOADS[mime]}`;
  await getStorage().put(storageKey, bytes);
  const [doc] = await db
    .insert(documents)
    .values({
      workerProfileId: step.profileId,
      verificationStepId: step.step.id,
      kind: KIND_BY_STEP[step.step.type] ?? "autre",
      storageKey,
      mimeType: mime,
      sizeBytes: bytes.byteLength,
      label: label || null,
      uploadedById: agent.id,
    })
    .returning({ id: documents.id });
  await db.insert(accessLogs).values({
    userId: agent.id,
    documentId: doc.id,
    workerProfileId: step.profileId,
    action: "televersement",
  });
  refresh(step.dossierId);
  return done("Document enregistré dans le dossier privé.");
}

export async function deleteDocument(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const agent = await requireSpace("agent");
  const id = String(formData.get("document") ?? "");
  const dossierId = String(formData.get("dossier") ?? "");
  const [doc] = await db
    .select()
    .from(documents)
    .where(and(eq(documents.id, id), isNull(documents.deletedAt)))
    .limit(1);
  if (!doc) return fail("Document introuvable.");
  await getStorage().delete(doc.storageKey);
  await db.update(documents).set({ deletedAt: new Date() }).where(eq(documents.id, id));
  await db.insert(accessLogs).values({
    userId: agent.id,
    documentId: id,
    workerProfileId: doc.workerProfileId,
    action: "suppression",
  });
  refresh(dossierId);
  return done("Document supprimé.");
}

export async function savePresentation(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  await requireSpace("agent");
  const dossierId = String(formData.get("dossier") ?? "");
  const text = String(formData.get("presentation") ?? "")
    .trim()
    .slice(0, 600);
  const dossier = await getDossier(dossierId);
  if (!dossier) return fail("Dossier introuvable.");
  await db
    .update(workerProfiles)
    .set({ presentation: text || null })
    .where(eq(workerProfiles.id, dossier.profile.id));
  refresh(dossierId);
  return done("Présentation enregistrée.");
}

/** Valider le profil : impossible tant qu'une étape exigée par le service n'est pas faite. */
export async function validateDossier(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const agent = await requireSpace("agent");
  const dossier = await getDossier(String(formData.get("dossier") ?? ""));
  if (!dossier) return fail("Dossier introuvable.");
  if (!canValidateDossier(dossier.service.config.verification, dossier.steps)) {
    return fail("Toutes les étapes doivent être faites avant de valider le profil.");
  }
  const now = new Date();
  await db
    .update(workerServices)
    .set({
      status: "verifie",
      verifiedAt: now,
      decidedAt: now,
      decidedById: agent.id,
      decisionReason: null,
    })
    .where(eq(workerServices.id, dossier.id));
  refresh(dossier.id);
  redirectWithFlash(`/agent/dossiers/${dossier.id}`, "valide");
}

export async function rejectDossier(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const agent = await requireSpace("agent");
  const reason = String(formData.get("motif") ?? "")
    .trim()
    .slice(0, 500);
  if (reason.length < 10) return fail("Le motif est obligatoire : il sera expliqué à la personne.");
  const dossier = await getDossier(String(formData.get("dossier") ?? ""));
  if (!dossier) return fail("Dossier introuvable.");
  await db
    .update(workerServices)
    .set({ status: "refuse", decisionReason: reason, decidedAt: new Date(), decidedById: agent.id })
    .where(eq(workerServices.id, dossier.id));
  refresh(dossier.id);
  redirectWithFlash(`/agent/dossiers/${dossier.id}`, "refuse");
}

export async function suspendDossier(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const agent = await requireSpace("agent");
  const reason = String(formData.get("motif") ?? "")
    .trim()
    .slice(0, 500);
  if (reason.length < 10) return fail("Le motif est obligatoire.");
  const dossier = await getDossier(String(formData.get("dossier") ?? ""));
  if (!dossier) return fail("Dossier introuvable.");
  await db
    .update(workerServices)
    .set({
      status: "suspendu",
      decisionReason: reason,
      decidedAt: new Date(),
      decidedById: agent.id,
    })
    .where(eq(workerServices.id, dossier.id));
  refresh(dossier.id);
  redirectWithFlash(`/agent/dossiers/${dossier.id}`, "suspendu");
}

export async function reopenDossier(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const agent = await requireSpace("agent");
  const dossier = await getDossier(String(formData.get("dossier") ?? ""));
  if (!dossier) return fail("Dossier introuvable.");
  const reverify =
    dossier.status === "suspendu" &&
    canValidateDossier(dossier.service.config.verification, dossier.steps);
  await db
    .update(workerServices)
    .set({
      status: reverify ? "verifie" : openDossierStatus(dossier.steps),
      decisionReason: null,
      decidedAt: new Date(),
      decidedById: agent.id,
    })
    .where(eq(workerServices.id, dossier.id));
  refresh(dossier.id);
  redirectWithFlash(`/agent/dossiers/${dossier.id}`, reverify ? "valide" : "rouvert");
}
