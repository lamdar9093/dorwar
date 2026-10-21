import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Notice } from "@/components/ui/notice";
import { ServiceMark } from "@/components/ui/service-mark";
import { getAreaChildren, getOpenAreaOptions } from "@/lib/areas";
import { requireSpace } from "@/lib/auth/guards";
import { getPublicProfile } from "@/lib/data/vitrine";
import { todayIso } from "@/lib/format";
import { getServiceBySlug } from "@/lib/services/repository";
import { NeedWizard } from "./need-wizard";

export async function generateMetadata({
  params,
}: PageProps<"/demande/[slug]">): Promise<Metadata> {
  const service = await getServiceBySlug((await params).slug);
  return { title: service ? `Demande · ${service.name}` : "Demande" };
}

export default async function NeedPage({ params, searchParams }: PageProps<"/demande/[slug]">) {
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  // La personne repérée dans la vitrine suit la famille à travers la connexion.
  const profil = typeof query.profil === "string" ? query.profil : null;
  await requireSpace(
    "famille",
    `/demande/${slug}${profil ? `?profil=${encodeURIComponent(profil)}` : ""}`,
  );
  const service = await getServiceBySlug(slug);
  if (!service || !service.active) notFound();

  const [areaGroups, regions, chosen] = await Promise.all([
    getOpenAreaOptions(),
    getAreaChildren(null),
    profil ? getPublicProfile(profil, service.slug) : null,
  ]);
  // La personne doit être vérifiée pour ce service-ci, et disponible.
  const carried = chosen?.available && chosen.service.id === service.id ? chosen.profile : null;
  const { config } = service;

  return (
    <>
      <div className="mx-auto mb-2 flex max-w-2xl items-center gap-3">
        <ServiceMark icon={service.icon} name={service.name} hue={service.hue} size="sm" />
        <p className="font-bold">{service.name}</p>
      </div>
      {carried && (
        <Notice
          tone="info"
          className="mx-auto mt-4 mb-6 max-w-2xl"
          title={`Vous avez remarqué ${carried.firstName} ${carried.lastInitial}.`}
        >
          Décrivez votre besoin : si {carried.gender === "femme" ? "elle" : "il"} y correspond, vous
          pourrez lui demander une rencontre juste après.
        </Notice>
      )}
      <NeedWizard
        slug={service.slug}
        profileId={carried?.profileId}
        form={config.needForm}
        fees={config.fees}
        ctx={{
          formulas: config.formulas.map((f) => ({
            key: f.key,
            label: f.label,
            shortLabel: f.shortLabel,
            summary: f.summary,
            icon: f.icon,
          })),
          areaGroups: areaGroups.map((g) => ({
            group: g.group,
            options: g.options.map((o) => ({ id: o.id, label: o.label })),
          })),
          regions: regions.map((r) => ({
            id: r.id,
            name: r.name,
            isOpen: r.isOpen,
            childCount: r.childCount,
          })),
          today: todayIso(),
        }}
      />
    </>
  );
}
