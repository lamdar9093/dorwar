import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Icon } from "@/components/icons";
import { ProfileCard } from "@/components/profile/profile-card";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { LinkButton } from "@/components/ui/button";
import { ChoiceChip } from "@/components/ui/choice";
import { EmptyState } from "@/components/ui/empty-state";
import { Label, Select } from "@/components/ui/field";
import { getDictionary } from "@/i18n";
import { getOpenAreaOptions, getOpenZoneNames } from "@/lib/areas";
import { getVitrine } from "@/lib/data/vitrine";
import { joinFr } from "@/lib/format";
import { PEOPLE_PATH, peoplePath } from "@/lib/public-profile";
import { formulaOf, getActiveServices } from "@/lib/services/repository";

export const metadata: Metadata = {
  title: "Personnes vérifiées",
  // Une liste de prénoms et de quartiers n'a pas à être indexée.
  robots: { index: false, follow: false },
};

/**
 * L'annuaire public : toutes les personnes vérifiées, quel que soit leur service.
 * Le service est un filtre comme les autres ; avec un seul service ouvert, il est choisi d'office.
 */
export default async function PeoplePage({ searchParams }: PageProps<"/personnes">) {
  await connection();
  const query = await searchParams;
  const [t, services, areaGroups, zones] = await Promise.all([
    getDictionary(),
    getActiveServices(),
    getOpenAreaOptions(),
    getOpenZoneNames(),
  ]);
  const p = t.home.people;

  const byService = services.length > 1;
  const service =
    services.length === 1 ? services[0] : (services.find((s) => s.slug === query.service) ?? null);
  const formula =
    service && typeof query.formule === "string" ? formulaOf(service, query.formule) : null;
  const quartier =
    areaGroups.flatMap((g) => g.options).find((o) => o.id === query.quartier) ?? null;
  const filtered = Boolean((byService && service) || quartier || formula);

  const { entries, total } = await getVitrine({
    serviceId: service?.id,
    formulaKey: formula?.key,
    nearAreaId: quartier?.id,
    limit: 60,
  });
  const servicesById = new Map(services.map((s) => [s.id, s]));
  // Sans service choisi, /demande propose d'abord le choix du service.
  const needHref = service ? `/demande/${service.slug}` : "/demande";

  return (
    <>
      <div className="container-page py-8 sm:py-12">
        <Breadcrumb items={[{ label: "Accueil", href: "/" }, { label: p.title }]} />
        <div className="mt-8 max-w-3xl">
          <p className="eyebrow text-terre-700">{service ? service.name : joinFr(zones)}</p>
          <h1 className="mt-2 text-4xl sm:text-5xl">{p.title}</h1>
          <p className="mt-4 text-lg text-gris-700">{p.intro}</p>
        </div>

        {/* Filtres : un formulaire GET, sans JavaScript. */}
        <form
          method="get"
          action={PEOPLE_PATH}
          className="mt-8 rounded-md border border-ligne bg-white p-4 sm:p-5"
        >
          <div className="grid gap-5 lg:grid-cols-[minmax(0,20rem)_1fr]">
            <div>
              <Label htmlFor="quartier">{p.area}</Label>
              <Select id="quartier" name="quartier" defaultValue={quartier?.id ?? ""}>
                <option value="">{p.allAreas}</option>
                {areaGroups.map((g) => (
                  <optgroup key={g.group} label={g.group}>
                    {g.options.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.label}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </Select>
            </div>
            <div className="space-y-5">
              {byService && (
                <fieldset>
                  <legend className="mb-2 font-bold text-indigo-900">{p.service}</legend>
                  <div className="flex flex-wrap gap-2">
                    <ChoiceChip
                      type="radio"
                      name="service"
                      value=""
                      label={p.allServices}
                      defaultChecked={!service}
                    />
                    {services.map((s) => (
                      <ChoiceChip
                        key={s.id}
                        type="radio"
                        name="service"
                        value={s.slug}
                        label={s.name}
                        defaultChecked={service?.id === s.id}
                      />
                    ))}
                  </div>
                </fieldset>
              )}
              {service && (
                <fieldset>
                  <legend className="mb-2 font-bold text-indigo-900">{p.formula}</legend>
                  <div className="flex flex-wrap gap-2">
                    <ChoiceChip
                      type="radio"
                      name="formule"
                      value=""
                      label={p.allFormulas}
                      defaultChecked={!formula}
                    />
                    {service.config.formulas.map((f) => (
                      <ChoiceChip
                        key={f.key}
                        type="radio"
                        name="formule"
                        value={f.key}
                        label={f.shortLabel}
                        defaultChecked={formula?.key === f.key}
                      />
                    ))}
                  </div>
                </fieldset>
              )}
            </div>
          </div>
          <button
            type="submit"
            className="mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-sm bg-indigo-900 px-6 font-bold text-sable-50 hover:bg-indigo-950 sm:w-auto"
          >
            <Icon name="recherche" size={20} />
            {p.submit}
          </button>
        </form>

        <section aria-labelledby="resultats" className="mt-8">
          <h2 id="resultats" className="sr-only">
            Résultats
          </h2>
          {entries.length === 0 ? (
            <EmptyState
              icon="porte_ouverte"
              title={service ? service.config.vocabulary.noneNearby : p.none}
              action={
                <div className="flex flex-wrap items-center gap-4">
                  <LinkButton href={needHref} iconAfter="arrowRight">
                    {p.describe}
                  </LinkButton>
                  {filtered && (
                    <Link href={peoplePath()} className="font-bold text-indigo-900 underline">
                      {p.seeEveryone}
                    </Link>
                  )}
                </div>
              }
            >
              <p>{p.noneText}</p>
            </EmptyState>
          ) : (
            <>
              <p className="border-b border-indigo-900 pb-3 text-sm text-gris-700">
                {total} profil{total > 1 ? "s" : ""}
                {quartier ? p.nearest : p.recent}
              </p>
              <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {entries.map((entry) => {
                  const entryService = servicesById.get(entry.serviceId);
                  if (!entryService) return null;
                  return (
                    <li key={entry.profileId}>
                      <ProfileCard
                        entry={entry}
                        service={entryService}
                        showDistance={Boolean(quartier)}
                      />
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </section>
      </div>

      <section className="on-dark bg-indigo-900">
        <div className="container-page flex flex-col gap-6 py-14 md:flex-row md:items-center md:justify-between">
          <div className="max-w-xl">
            <h2 className="text-3xl text-sable-50">{p.ctaTitle}</h2>
            <p className="mt-3 text-sable-100">{p.ctaText}</p>
          </div>
          <LinkButton href={needHref} variant="light" size="lg" iconAfter="arrowRight">
            {service ? service.config.vocabulary.findAction : p.ctaAction}
          </LinkButton>
        </div>
      </section>
    </>
  );
}
