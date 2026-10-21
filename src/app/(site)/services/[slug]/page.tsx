import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Icon } from "@/components/icons";
import { ProfileRow } from "@/components/profile/profile-row";
import { LinkButton } from "@/components/ui/button";
import { SectionHeading } from "@/components/ui/section-heading";
import { hueOf, ServiceMark } from "@/components/ui/service-mark";
import { WhatsAppButton } from "@/components/site/whatsapp-button";
import { fill, getDictionary } from "@/i18n";
import { getVitrine } from "@/lib/data/vitrine";
import { capitalize } from "@/lib/data/workers";
import { formatFcfa } from "@/lib/format";
import { peoplePath } from "@/lib/public-profile";
import { guaranteeText } from "@/lib/services/config";
import { getServiceBySlug } from "@/lib/services/repository";

async function load(slug: string) {
  const service = await getServiceBySlug(slug);
  if (!service || !service.active) notFound();
  return service;
}

export async function generateMetadata({
  params,
}: PageProps<"/services/[slug]">): Promise<Metadata> {
  const service = await getServiceBySlug((await params).slug);
  return service ? { title: service.name, description: service.config.page.subtitle } : {};
}

export default async function ServicePage({ params }: PageProps<"/services/[slug]">) {
  await connection();
  const service = await load((await params).slug);
  const [t, vitrine] = await Promise.all([
    getDictionary(),
    getVitrine({ serviceId: service.id, limit: 8 }),
  ]);
  const { config } = service;
  const hue = hueOf(service.hue);
  // La page du service est la page de la catégorie ; sa liste est l'annuaire filtré sur ce service.
  const listHref = peoplePath({ service: service.slug });
  const seeAll = fill(t.home.vitrine.seeAll, { n: vitrine.total });

  // Étapes publiques : les étapes d'un même groupe (les deux références) n'en font qu'une.
  const steps = config.verification.filter(
    (step, i, all) => !step.group || all.findIndex((s) => s.group === step.group) === i,
  );

  return (
    <>
      <section className="motif-tisse border-b border-ligne/70">
        <div className="container-page pt-8 pb-14 md:pt-12 md:pb-20">
          <nav aria-label="Fil d’Ariane" className="text-sm text-gris-700">
            <Link
              href="/"
              className="underline decoration-ligne underline-offset-4 hover:decoration-indigo-900"
            >
              Accueil
            </Link>
            <span aria-hidden="true"> / </span>
            <span aria-current="page">{service.name}</span>
          </nav>
          <div className="mt-8 grid gap-8 md:grid-cols-12 md:items-end">
            <div className="md:col-span-8">
              <ServiceMark icon={service.icon} name={service.name} hue={service.hue} size="lg" />
              <h1 className="mt-6 text-4xl sm:text-5xl lg:text-6xl">{config.page.title}</h1>
              <p className="mt-5 max-w-2xl text-lg text-gris-700 sm:text-xl">
                {config.page.subtitle}
              </p>
            </div>
            <div className="md:col-span-4 md:pb-2">
              <LinkButton href={`/demande/${service.slug}`} size="lg" full iconAfter="arrowRight">
                {config.vocabulary.findAction}
              </LinkButton>
              <p className="mt-3 flex items-center gap-2 text-sm text-gris-700">
                <Icon name="cadenas" size={18} />
                {t.home.ctaHint}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="container-page py-16 md:py-24">
        <SectionHeading title={config.page.formulasTitle} intro={config.page.formulasIntro} />
        <ul className="mt-12 grid border-t border-indigo-900 md:grid-cols-3">
          {config.formulas.map((f, i) => (
            <li
              key={f.key}
              className={`flex flex-col border-b border-ligne py-8 md:border-b-0 md:px-8 md:py-10 ${
                i > 0 ? "md:border-l md:border-ligne" : "md:pl-0"
              } ${i === config.formulas.length - 1 ? "md:pr-0" : ""}`}
            >
              <span className={`flex size-14 items-center justify-center rounded-sm ${hue.tile}`}>
                <Icon name={f.icon} size={32} strokeWidth={1.6} />
              </span>
              <p className={`eyebrow mt-6 ${hue.ink}`}>{f.shortLabel}</p>
              <h3 className="mt-2 text-3xl">{f.label}</h3>
              <p className="mt-3 text-lg text-gris-700">{f.summary}</p>
              <ul className="mt-6 space-y-3">
                {f.facts.map((fact) => (
                  <li key={fact} className="flex gap-3">
                    <Icon
                      name="check"
                      size={22}
                      strokeWidth={2.4}
                      className="mt-0.5 shrink-0 text-baobab-600"
                    />
                    <span>{fact}</span>
                  </li>
                ))}
              </ul>
              <dl className="mt-auto space-y-3 border-t border-ligne pt-5 text-sm md:mt-8">
                <div>
                  <dt className="font-bold">Garantie</dt>
                  <dd className="mt-0.5 text-gris-700">
                    {guaranteeText(config.guarantees[f.key])}
                  </dd>
                </div>
                <div className="flex items-baseline justify-between gap-4">
                  <dt className="font-bold">{config.fees[f.key].label}</dt>
                  <dd className="font-display text-xl text-indigo-900">
                    {formatFcfa(config.fees[f.key].amountFcfa)}
                  </dd>
                </div>
              </dl>
            </li>
          ))}
        </ul>
        <p className="mt-8 flex max-w-3xl gap-3 text-gris-700">
          <Icon name="argent" size={24} className="mt-0.5 shrink-0 text-indigo-900" />
          <span>
            Les frais de dossier se règlent par Wave ou Orange Money, une fois la personne choisie.
            La rémunération est versée directement à la personne.{" "}
            <strong className="text-indigo-900">
              En démonstration, aucun paiement n’est demandé.
            </strong>
          </span>
        </p>
      </section>

      {vitrine.entries.length > 0 && (
        <section className="border-y border-ligne bg-white">
          <div className="container-page py-14 md:py-20">
            <SectionHeading
              title={`Quelques ${config.vocabulary.plural} vérifiés`}
              intro="Chaque profil a été vérifié sur le terrain. Parcourez-les sans créer de compte."
            />
            <div className="mt-8">
              <ProfileRow
                entries={vitrine.entries}
                services={new Map([[service.id, service]])}
                label={`${capitalize(config.vocabulary.plural)} vérifiés`}
                more={{ href: listHref, label: seeAll }}
              />
            </div>
            <Link
              href={listHref}
              className="mt-6 inline-flex min-h-12 items-center gap-2 font-bold text-indigo-900 underline decoration-ligne decoration-2 underline-offset-4 hover:decoration-indigo-900"
            >
              {seeAll}
              <Icon name="arrowRight" size={20} />
            </Link>
          </div>
        </section>
      )}

      <section className="bg-sable-100">
        <div className="container-page grid gap-10 py-16 md:grid-cols-12 md:py-24">
          <div className="md:col-span-5">
            <SectionHeading
              eyebrow={t.home.verify.eyebrow}
              title={t.home.verify.title}
              intro={t.home.verify.privacy}
            />
          </div>
          <ol className="md:col-span-7">
            {steps.map((step) => (
              <li
                key={step.key}
                className="flex gap-4 border-t border-indigo-900/20 py-5 first:border-indigo-900"
              >
                <Icon name={step.icon} size={28} className="mt-1 shrink-0 text-terre-700" />
                <div>
                  <h3 className="font-sans text-lg font-bold">{step.publicLabel}</h3>
                  <p className="mt-1 text-gris-700">{step.description}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="container-page grid gap-10 py-16 md:grid-cols-12 md:py-24">
        <div className="md:col-span-5">
          <SectionHeading
            title="Vos questions"
            intro="Et si la vôtre n’y est pas, l’équipe vous répond sur WhatsApp."
          />
          <div className="mt-6">
            <WhatsAppButton />
          </div>
        </div>
        <div className="md:col-span-7">
          {config.page.faq.map((item) => (
            <details key={item.q} className="group border-t border-ligne last:border-b">
              <summary className="flex min-h-16 items-center justify-between gap-4 py-4 text-lg font-bold">
                {item.q}
                <Icon
                  name="plus"
                  size={22}
                  className="shrink-0 transition-transform group-open:rotate-45"
                />
              </summary>
              <p className="pb-6 text-gris-700">{item.a}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="on-dark bg-indigo-900">
        <div className="container-page flex flex-col gap-6 py-14 md:flex-row md:items-center md:justify-between">
          <h2 className="max-w-xl text-3xl text-sable-50">{t.home.guarantee.title}</h2>
          <LinkButton
            href={`/demande/${service.slug}`}
            variant="light"
            size="lg"
            iconAfter="arrowRight"
          >
            {config.vocabulary.findAction}
          </LinkButton>
        </div>
      </section>
    </>
  );
}
