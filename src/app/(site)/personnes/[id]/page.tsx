import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Icon } from "@/components/icons";
import { ProfileRow } from "@/components/profile/profile-row";
import { WorkerProfileView } from "@/components/profile/worker-profile-view";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { LinkButton } from "@/components/ui/button";
import { Notice } from "@/components/ui/notice";
import { getDictionary } from "@/i18n";
import { cn } from "@/lib/cn";
import { getPublicProfile, getVitrine } from "@/lib/data/vitrine";
import { peoplePath, publicProfilePath } from "@/lib/public-profile";
import { providerNoun } from "@/lib/services/repository";

function serviceParam(value: string | string[] | undefined): string | undefined {
  return typeof value === "string" ? value : undefined;
}

// Jamais indexée, même hors démonstration : le prénom et le quartier d'une personne
// n'ont pas à ressortir dans un moteur de recherche.
export async function generateMetadata({
  params,
  searchParams,
}: PageProps<"/personnes/[id]">): Promise<Metadata> {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const page = await getPublicProfile(id, serviceParam(query.service));
  return {
    title: page
      ? `${page.profile.firstName} ${page.profile.lastInitial}., ${providerNoun(page.service, page.profile.gender)}`
      : "Profil vérifié",
    robots: { index: false, follow: false },
  };
}

/**
 * Fiche publique : une par personne. Si elle est vérifiée pour plusieurs services,
 * `?service=` choisit celui qu'on regarde (savoir-faire, formules, badge, rencontre).
 */
export default async function PersonPage({ params, searchParams }: PageProps<"/personnes/[id]">) {
  await connection();
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const [page, t] = await Promise.all([
    getPublicProfile(id, serviceParam(query.service)),
    getDictionary(),
  ]);
  if (!page) notFound();
  const { service, profile } = page;
  const near = await getVitrine({
    serviceId: service.id,
    nearAreaId: page.areaId,
    excludeProfileId: profile.profileId,
    limit: 8,
  });
  const sectorHref = peoplePath({ service: service.slug, quartier: page.areaId });
  const meetHref = `/demande/${service.slug}?profil=${profile.profileId}`;
  const meetLabel = `Rencontrer ${profile.firstName}`;
  const pronoun = profile.gender === "femme" ? "elle" : "il";

  return (
    <>
      <div className="container-page py-8 sm:py-12">
        <Breadcrumb
          items={[
            { label: "Accueil", href: "/" },
            { label: t.home.people.title, href: peoplePath() },
            { label: `${profile.firstName} ${profile.lastInitial}.` },
          ]}
        />
        {page.services.length > 1 && (
          <nav aria-label="Services" className="mt-6 flex flex-wrap items-center gap-2">
            <span className="mr-1 font-bold text-indigo-900">
              {profile.gender === "femme"
                ? t.home.people.verifiedFor
                : t.home.people.verifiedForMale}
            </span>
            {page.services.map((s) => (
              <Link
                key={s.id}
                href={publicProfilePath(profile.profileId, s.slug)}
                aria-current={s.id === service.id ? "page" : undefined}
                className={cn(
                  "inline-flex min-h-12 items-center rounded-full border-[1.5px] px-4 font-bold",
                  s.id === service.id
                    ? "border-indigo-900 bg-indigo-900 text-sable-50"
                    : "border-trait bg-white text-indigo-900 hover:border-indigo-900",
                )}
              >
                {s.name}
              </Link>
            ))}
          </nav>
        )}
        <div className="mt-6">
          <WorkerProfileView
            profile={profile}
            service={service}
            badge={page.badge}
            reviews={page.reviews}
            aside={
              page.available ? (
                <div className="rounded-md border border-ligne bg-white p-5">
                  <LinkButton href={meetHref} size="lg" full icon="calendrier">
                    {meetLabel}
                  </LinkButton>
                  <p className="mt-3 text-sm text-gris-700">
                    Dites-nous ce qu’il vous faut : si {pronoun} y correspond, l’équipe organise la
                    rencontre. {t.home.ctaHint}
                  </p>
                </div>
              ) : (
                <Notice tone="attention" title="Pas disponible en ce moment">
                  {profile.firstName} ne peut pas accepter de nouvelle rencontre pour l’instant.
                  D’autres personnes vérifiées vivent dans le même secteur.
                </Notice>
              )
            }
          />
        </div>
      </div>

      {near.entries.length > 0 && (
        <section className="border-t border-ligne bg-sable-100" aria-labelledby="alentours">
          <div className="container-page py-12 md:py-16">
            <p className="eyebrow text-terre-700">{profile.areaName} et alentours</p>
            <h2 id="alentours" className="mt-2 text-3xl sm:text-4xl">
              D’autres personnes vérifiées
            </h2>
            <div className="mt-8">
              <ProfileRow
                entries={near.entries}
                services={new Map([[service.id, service]])}
                label={`Personnes vérifiées, ${profile.areaName} et alentours`}
                more={{ href: sectorHref, label: "Voir tout le secteur" }}
              />
            </div>
            <Link
              href={sectorHref}
              className="mt-6 hidden min-h-12 items-center gap-2 font-bold text-indigo-900 underline decoration-ligne decoration-2 underline-offset-4 hover:decoration-indigo-900 md:inline-flex"
            >
              Voir tous les profils du secteur
              <Icon name="arrowRight" size={20} />
            </Link>
          </div>
        </section>
      )}

      {page.available && (
        <div className="sticky bottom-0 border-t border-ligne bg-sable-50/95 px-4 py-3 shadow-sheet lg:hidden print:hidden">
          <LinkButton href={meetHref} size="lg" full icon="calendrier">
            {meetLabel}
          </LinkButton>
        </div>
      )}
    </>
  );
}
