"use server";

import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/db/client";
import { areas, incidents, users, waitlist } from "@/db/schema";
import { done, fail, type ActionResult } from "@/lib/action-result";
import { getArea, getAreaPath } from "@/lib/areas";
import { requireSpace } from "@/lib/auth/guards";
import { normalizeSenegalMobile } from "@/lib/phone";
import { getServiceById, updateServiceConfig } from "@/lib/services/repository";
import { setSetting } from "@/lib/settings";

export async function setUserStatus(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const admin = await requireSpace("admin");
  const id = String(formData.get("utilisateur") ?? "");
  const status = formData.get("statut") === "suspendu" ? "suspendu" : "actif";
  if (id === admin.id) return fail("Vous ne pouvez pas suspendre votre propre compte.");
  await db.update(users).set({ status }).where(eq(users.id, id));
  revalidatePath("/admin/utilisateurs");
  return done(
    status === "suspendu"
      ? "Compte suspendu : la personne ne peut plus se connecter."
      : "Compte réactivé.",
  );
}

/** Ajouter un membre de l'équipe (agent de terrain ou admin) par son numéro. */
export async function createStaff(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  await requireSpace("admin");
  const phone = normalizeSenegalMobile(String(formData.get("telephone") ?? ""));
  const name = String(formData.get("nom") ?? "")
    .trim()
    .slice(0, 60);
  const role = formData.get("role") === "admin" ? "admin" : "agent";
  if (!phone) return fail("Numéro mobile sénégalais invalide.");
  if (name.length < 2) return fail("Indiquez le nom de la personne.");
  const [existing] = await db
    .select({ id: users.id, role: users.role })
    .from(users)
    .where(eq(users.phone, phone))
    .limit(1);
  if (existing && existing.role !== "agent" && existing.role !== "admin") {
    return fail("Ce numéro est déjà utilisé par une famille ou un prestataire.");
  }
  if (existing)
    await db.update(users).set({ role, name, status: "actif" }).where(eq(users.id, existing.id));
  else await db.insert(users).values({ phone, role, name, consentAt: new Date() });
  revalidatePath("/admin/utilisateurs");
  return done(`${name} peut se connecter avec ce numéro.`);
}

export async function updateIncident(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const admin = await requireSpace("admin");
  const id = String(formData.get("signalement") ?? "");
  const status = String(formData.get("statut") ?? "");
  if (!["ouvert", "en_cours", "resolu"].includes(status)) return fail("Statut invalide.");
  const notes = String(formData.get("notes") ?? "")
    .trim()
    .slice(0, 2000);
  await db
    .update(incidents)
    .set({
      status: status as "ouvert" | "en_cours" | "resolu",
      adminNotes: notes || null,
      handledById: admin.id,
      resolvedAt: status === "resolu" ? new Date() : null,
    })
    .where(eq(incidents.id, id));
  revalidatePath("/admin/signalements");
  revalidatePath("/admin");
  return done("Signalement mis à jour.");
}

/** Ouvrir ou fermer une zone : sans code, effet immédiat sur la recherche. */
export async function toggleArea(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  await requireSpace("admin");
  const id = String(formData.get("zone") ?? "");
  const open = formData.get("ouvrir") === "oui";
  const area = await getArea(id);
  if (!area) return fail("Zone introuvable.");
  if (!open && area.openedByParent)
    return fail("Cette zone est ouverte par une zone plus large : fermez plutôt celle-ci.");
  await db.update(areas).set({ isOpen: open }).where(eq(areas.id, id));
  revalidatePath("/admin/zones");
  return done(
    open
      ? `${area.name} est ouverte : les familles y voient les profils vérifiés.`
      : `${area.name} est fermée.`,
  );
}

const quartierSchema = z.object({
  name: z.string().trim().min(2, "Nom du quartier trop court.").max(60),
  lat: z.coerce.number().min(12, "Latitude hors du Sénégal.").max(17, "Latitude hors du Sénégal."),
  lng: z.coerce
    .number()
    .min(-18, "Longitude hors du Sénégal.")
    .max(-11, "Longitude hors du Sénégal."),
});

export async function addQuartier(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  await requireSpace("admin");
  const communeId = String(formData.get("commune") ?? "");
  const commune = await getArea(communeId);
  if (!commune || commune.level !== "commune") return fail("Choisissez d’abord une commune.");
  const parsed = quartierSchema.safeParse({
    name: formData.get("nom"),
    lat: formData.get("lat"),
    lng: formData.get("lng"),
  });
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Informations invalides.");
  const path = await getAreaPath(communeId);
  const [parent] = await db
    .select({ key: areas.key })
    .from(areas)
    .where(eq(areas.id, communeId))
    .limit(1);
  const id = randomUUID();
  const slug = parsed.data.name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  await db.insert(areas).values({
    id,
    parentId: communeId,
    level: "quartier",
    name: parsed.data.name,
    key: `${parent.key}/${slug}`,
    pathIds: [...path.map((p) => p.id), id],
    centroid: { lat: parsed.data.lat, lng: parsed.data.lng },
  });
  revalidatePath("/admin/zones");
  return done(`Quartier « ${parsed.data.name} » ajouté à ${commune.name}.`);
}

export async function markNotified(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  await requireSpace("admin");
  await db
    .update(waitlist)
    .set({ notifiedAt: new Date() })
    .where(eq(waitlist.id, String(formData.get("inscrit") ?? "")));
  revalidatePath("/admin/attente");
  return done("Marqué comme prévenu.");
}

export async function updateWhatsapp(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const admin = await requireSpace("admin");
  const raw = String(formData.get("whatsapp") ?? "").replace(/\D/g, "");
  if (raw && !/^\d{8,15}$/.test(raw))
    return fail("Numéro invalide : indicatif compris, sans « + », par exemple 221771234567.");
  await setSetting("whatsapp_number", raw, admin.id);
  revalidatePath("/", "layout");
  return done(raw ? "Numéro WhatsApp enregistré." : "Numéro WhatsApp retiré.");
}

/** Paramètres d'un service : ouvert ou non, durée de garantie et frais par formule. */
export async function updateServiceParams(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  await requireSpace("admin");
  const service = await getServiceById(String(formData.get("service") ?? ""));
  if (!service) return fail("Service introuvable.");
  const config = structuredClone(service.config);
  for (const f of config.formulas) {
    const days = Number(formData.get(`garantie_${f.key}`));
    const fee = Number(String(formData.get(`frais_${f.key}`) ?? "").replace(/\D/g, ""));
    if (!Number.isInteger(days) || days < 0 || days > 365)
      return fail(`Durée de garantie invalide pour « ${f.label} ».`);
    if (!Number.isInteger(fee) || fee < 0 || fee > 1_000_000)
      return fail(`Frais invalides pour « ${f.label} ».`);
    config.guarantees[f.key] = { ...config.guarantees[f.key], days };
    config.fees[f.key] = { ...config.fees[f.key], amountFcfa: fee };
  }
  await updateServiceConfig(service.id, config, formData.get("actif") === "oui");
  revalidatePath("/", "layout");
  return done(`Paramètres de « ${service.name} » enregistrés.`);
}
