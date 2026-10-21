import type { Metadata } from "next";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/db/client";
import { workerProfiles } from "@/db/schema";
import { motsWolof } from "@/i18n";
import { getAreaChildren, getOpenAreaOptions } from "@/lib/areas";
import { requireSpace } from "@/lib/auth/guards";
import { getActiveServices } from "@/lib/services/repository";
import { RegisterWizard } from "./register-wizard";

export const metadata: Metadata = { title: "Inscription" };

export default async function RegistrationPage() {
  const user = await requireSpace("prestataire", "/espace-prestataire/inscription");
  const [existing] = await db
    .select({ id: workerProfiles.id })
    .from(workerProfiles)
    .where(eq(workerProfiles.userId, user.id))
    .limit(1);
  if (existing) redirect("/espace-prestataire");

  const [services, areaGroups, regions] = await Promise.all([
    getActiveServices(),
    getOpenAreaOptions(),
    getAreaChildren(null),
  ]);
  return (
    <RegisterWizard
      currentYear={new Date().getUTCFullYear()}
      wolof={{ oui: motsWolof.oui, non: motsWolof.non }}
      services={services.map((s) => ({
        id: s.id,
        name: s.name,
        icon: s.icon,
        female: s.config.vocabulary.female,
        male: s.config.vocabulary.male,
        formulas: s.config.formulas.map((f) => ({
          key: f.key,
          label: f.label,
          shortLabel: f.shortLabel,
          icon: f.icon,
          housing: f.housing,
          kind: f.kind,
        })),
        skills: s.config.skills,
      }))}
      areaGroups={areaGroups.map((g) => ({
        group: g.group,
        options: g.options.map((o) => ({ id: o.id, label: o.label })),
      }))}
      regions={regions.map((r) => ({
        id: r.id,
        name: r.name,
        isOpen: r.isOpen,
        childCount: r.childCount,
      }))}
    />
  );
}
