import Link from "next/link";
import { connection } from "next/server";
import { DoorIllustration } from "@/components/brand/door-illustration";
import { Icon } from "@/components/icons";
import { ProfileRow } from "@/components/profile/profile-row";
import { LinkButton } from "@/components/ui/button";
import { Stars } from "@/components/ui/rating";
import { SectionHeading } from "@/components/ui/section-heading";
import { hueOf, ServiceMark } from "@/components/ui/service-mark";
import { VerifiedBadge } from "@/components/verified-badge";
import { WhatsAppButton } from "@/components/site/whatsapp-button";
import { fill, getDictionary, motsWolof } from "@/i18n";
import { getOpenZoneNames } from "@/lib/areas";
import { cn } from "@/lib/cn";
import {
  getFeaturedReviews,
  getVitrine,
  getVitrineQuartiers,
  type FeaturedReview,
  type VitrineEntry,
} from "@/lib/data/vitrine";
import { formatDate, joinFr } from "@/lib/format";
import { peoplePath, publicProfilePath } from "@/lib/public-profile";
import { guaranteeText } from "@/lib/services/config";
import { getActiveServices, providerNoun, type LoadedService } from "@/lib/services/repository";

export default async function HomePage() {
  await connection();
  const [t, services, vitrine, reviews, zones, quartiers] = await Promise.all([
    getDictionary(),
    getActiveServices(),
    getVitrine({ limit: 8 }),
    getFeaturedReviews(3),
    getOpenZoneNames(),
    getVitrineQuartiers({ limit: 8 }),
  ]);

  return (
    <>
      <Hero services={services} t={t} />
      <VitrineSection
        services={services}
        entries={vitrine.entries}
        total={vitrine.total}
        quartiers={quartiers}
        zones={zones}
        t={t}
      />
      <ServicesSection services={services} t={t} />
      <VerifySection t={t} />
      <HowSection t={t} />
      <ReviewsSection services={services} reviews={reviews} t={t} />
      <GuaranteeSection services={services} t={t} />
      <ProvidersSection t={t} />
      <section className="container-page py-16">
        <div className="flex flex-col gap-6 border-t border-ligne pt-10 md:flex-row md:items-end md:justify-between">
          <div className="max-w-xl">
            <h2 className="text-3xl">{t.home.contact.title}</h2>
            <p className="mt-3 text-lg text-gris-700">{t.home.contact.body}</p>
          </div>
          <WhatsAppButton />
        </div>
      </section>
    </>
  );
}

type T = Awaited<ReturnType<typeof getDictionary>>;

/** « Chez Dorwar, la confiance se vérifie. » : retour à la ligne après la virgule. */
function TitleLines({ text }: { text: string }) {
  const cut = text.indexOf(", ");
  if (cut < 0) return <>{text}</>;
  return (
    <>
      <span className="block">{text.slice(0, cut + 1)}</span>
      {text.slice(cut + 2)}
    </>
  );
}

function Hero({ services, t }: { services: LoadedService[]; t: T }) {
  return (
    <section className="motif-tisse relative overflow-hidden border-b border-ligne/70">
      <div className="container-page grid items-end gap-10 pt-10 pb-12 md:grid-cols-12 md:pt-16 md:pb-20">
        <div className="md:col-span-7 lg:col-span-7">
          <p className="eyebrow text-terre-700">
            <span lang="wo">{motsWolof.bienvenue}</span>
            <span aria-hidden="true"> · </span>
            {t.home.welcome}
          </p>
          <h1 className="mt-4 text-[2.65rem] leading-[1.02] sm:text-5xl lg:text-6xl">
            <TitleLines text={t.home.title} />
          </h1>
          <p className="mt-5 max-w-xl text-lg text-gris-700 sm:text-xl">{t.home.subtitle}</p>

          {/* Sélecteur de service : un formulaire GET, sans JavaScript. */}
          <form
            action="/trouver"
            method="get"
            className="mt-8 max-w-xl rounded-md border border-ligne bg-white p-4 shadow-raise sm:p-5"
          >
            <fieldset>
              <legend className="mb-3 text-lg font-bold text-indigo-900">
                {t.home.selectorLegend}
              </legend>
              <div className="space-y-2">
                {services.map((s, i) => (
                  <label
                    key={s.id}
                    className="group flex min-h-16 cursor-pointer items-center gap-4 rounded-sm border-[1.5px] border-ligne p-3 hover:border-indigo-900 has-checked:border-indigo-900 has-checked:bg-sable-50 has-focus-visible:outline-3 has-focus-visible:outline-offset-2 has-focus-visible:outline-indigo-900"
                  >
                    <input
                      type="radio"
                      name="service"
                      value={s.slug}
                      defaultChecked={i === 0}
                      className="sr-only"
                      required
                    />
                    <ServiceMark icon={s.icon} name={s.name} hue={s.hue} size="sm" />
                    <span className="flex-1">
                      <span className="block font-bold">{s.name}</span>
                      <span className="block text-sm text-gris-700">
                        {s.config.formulas.map((f) => f.shortLabel).join(" · ")}
                      </span>
                    </span>
                    <span
                      aria-hidden="true"
                      className="flex size-6 items-center justify-center rounded-full border-[1.5px] border-trait text-white group-has-checked:border-indigo-900 group-has-checked:bg-indigo-900"
                    >
                      <Icon
                        name="check"
                        size={15}
                        strokeWidth={3}
                        className="opacity-0 group-has-checked:opacity-100"
                      />
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>
            <button
              type="submit"
              className="mt-4 inline-flex min-h-14 w-full items-center justify-center gap-2.5 rounded-sm bg-terre-600 px-5 text-base font-bold text-white hover:bg-terre-700 sm:text-lg"
            >
              {t.home.cta}
              <Icon name="arrowRight" size={22} />
            </button>
            <p className="mt-3 flex items-center gap-2 text-sm text-gris-700">
              <Icon name="cadenas" size={18} />
              {t.home.ctaHint}
            </p>
          </form>
          <Link
            href="/devenir-prestataire"
            className="mt-5 inline-flex min-h-12 items-center gap-2 font-bold text-indigo-900 underline decoration-ligne decoration-2 underline-offset-4 hover:decoration-indigo-900"
          >
            {t.home.secondary}
            <Icon name="arrowRight" size={20} />
          </Link>
        </div>
        <div className="mx-auto w-full max-w-[17rem] md:col-span-5 md:max-w-none lg:pl-6">
          <DoorIllustration />
        </div>
      </div>
    </section>
  );
}

/**
 * La preuve juste après la promesse : des personnes vérifiées, visibles sans compte.
 * Absente tant qu'aucun profil n'est vérifié : jamais de vitrine vide.
 */
function VitrineSection({
  services,
  entries,
  total,
  quartiers,
  zones,
  t,
}: {
  services: LoadedService[];
  entries: VitrineEntry[];
  total: number;
  quartiers: { id: string; name: string }[];
  zones: string[];
  t: T;
}) {
  if (!entries.length) return null;
  const seeAll = fill(t.home.vitrine.seeAll, { n: total });
  const chip =
    "inline-flex min-h-12 items-center gap-2 rounded-full border-[1.5px] border-trait bg-white px-4 font-bold text-indigo-900 hover:border-indigo-900";
  // Le service n'est qu'un filtre de l'annuaire : ses pastilles n'apparaissent qu'à partir de deux.
  const byService = services.length > 1;

  return (
    <section id="profils" className="scroll-mt-6 border-b border-ligne/70">
      <div className="container-page py-14 md:py-20">
        <SectionHeading
          eyebrow={
            zones.length ? `${t.home.vitrine.eyebrow} · ${joinFr(zones)}` : t.home.vitrine.eyebrow
          }
          title={t.home.vitrine.title}
          intro={t.home.vitrine.intro}
        />
        <div className="mt-8">
          <ProfileRow
            entries={entries}
            services={new Map(services.map((s) => [s.id, s]))}
            label={t.home.vitrine.rowLabel}
            more={{ href: peoplePath(), label: seeAll }}
          />
        </div>
        <Link
          href={peoplePath()}
          className="mt-6 inline-flex min-h-12 items-center gap-2 font-bold text-indigo-900 underline decoration-ligne decoration-2 underline-offset-4 hover:decoration-indigo-900"
        >
          {seeAll}
          <Icon name="arrowRight" size={20} />
        </Link>
        {(byService || quartiers.length > 0) && (
          <div className="mt-8 space-y-6 border-t border-ligne pt-6">
            {byService && (
              <div>
                <p className="font-bold text-indigo-900">{t.home.vitrine.byService}</p>
                <ul className="mt-3 flex flex-wrap gap-2">
                  {services.map((s) => (
                    <li key={s.id}>
                      <Link href={peoplePath({ service: s.slug })} className={chip}>
                        {s.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {quartiers.length > 0 && (
              <div>
                <p className="font-bold text-indigo-900">{t.home.vitrine.byArea}</p>
                <ul className="mt-3 flex flex-wrap gap-2">
                  {quartiers.map((q) => (
                    <li key={q.id}>
                      <Link href={peoplePath({ quartier: q.id })} className={chip}>
                        {q.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

/** Quelques avis récents ; chacun mène à la fiche, où tous les avis restent visibles. */
function ReviewsSection({
  services,
  reviews,
  t,
}: {
  services: LoadedService[];
  reviews: FeaturedReview[];
  t: T;
}) {
  const byId = new Map(services.map((s) => [s.id, s]));
  const shown = reviews.filter((r) => byId.has(r.serviceId));
  if (!shown.length) return null;
  return (
    <section className="bg-sable-100">
      <div className="container-page py-16 md:py-24">
        <SectionHeading eyebrow={t.home.reviews.eyebrow} title={t.home.reviews.title} />
        <ul className="mt-10 grid gap-10 md:grid-cols-3 md:gap-8">
          {shown.map((r) => {
            const service = byId.get(r.serviceId)!;
            const formula = service.config.formulas.find((f) => f.key === r.formulaKey);
            return (
              <li key={r.id} className="flex flex-col border-t-2 border-terre-600 pt-6">
                <Stars value={r.rating} />
                <blockquote className="mt-4 line-clamp-6 font-display text-xl leading-relaxed text-indigo-900">
                  «&#8239;{r.comment}&#8239;»
                </blockquote>
                <p className="mt-4 text-sm text-gris-700">
                  {t.home.reviews.family}
                  {r.authorArea ? ` · ${r.authorArea}` : ""}
                  {formula ? ` · ${formula.shortLabel}` : ""} · {formatDate(r.createdAt)}
                </p>
                <Link
                  href={publicProfilePath(r.profileId, service.slug)}
                  className="mt-auto inline-flex min-h-12 items-center gap-2 pt-4 font-bold text-indigo-900 underline decoration-ligne decoration-2 underline-offset-4 hover:decoration-indigo-900"
                >
                  {fill(t.home.reviews.about, {
                    name: `${r.firstName} ${r.lastInitial}.`,
                    noun: providerNoun(service, r.gender),
                  })}
                  <Icon name="arrowRight" size={20} className="shrink-0" />
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

function ServicesSection({ services, t }: { services: LoadedService[]; t: T }) {
  return (
    <section className="container-page grid gap-8 py-16 md:grid-cols-12 md:py-24">
      <div className="md:col-span-4">
        <SectionHeading title={t.home.services.title} intro={t.home.services.intro} />
      </div>
      <ul className="border-t border-indigo-900 md:col-span-8">
        {services.map((s) => (
          <li key={s.id} className="border-b border-ligne">
            <Link
              href={`/services/${s.slug}`}
              className="group grid gap-4 py-7 sm:grid-cols-[auto_1fr_auto] sm:items-center sm:gap-6"
            >
              <ServiceMark icon={s.icon} name={s.name} hue={s.hue} size="lg" />
              <span>
                <span className="block font-display text-3xl group-hover:underline group-hover:decoration-2 group-hover:underline-offset-4">
                  {s.name}
                </span>
                <span className="mt-2 block text-gris-700">{s.config.tagline}</span>
                <span className="mt-3 flex flex-wrap gap-2">
                  {s.config.formulas.map((f) => (
                    <span
                      key={f.key}
                      className={cn(
                        "rounded-full border px-3 py-1 text-sm font-bold",
                        hueOf(s.hue).ink,
                        "border-current/30",
                      )}
                    >
                      {f.shortLabel}
                    </span>
                  ))}
                </span>
              </span>
              <span className="inline-flex items-center gap-2 font-bold text-indigo-900">
                {t.home.services.discover}
                <Icon
                  name="arrowRight"
                  size={22}
                  className="transition-transform group-hover:translate-x-1"
                />
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

function VerifySection({ t }: { t: T }) {
  // Exemple illustratif du badge, avec des dates fictives.
  const example = t.home.verify.steps.map((s, i) => ({
    key: s.icon,
    label: s.badge,
    icon: s.icon,
    done: true,
    date: new Date(Date.UTC(2026, 2, 3 + i * 2)),
  }));
  return (
    <section className="bg-sable-100">
      <div className="container-page grid gap-10 py-16 md:grid-cols-12 md:py-24">
        <div className="md:col-span-5">
          <div className="md:sticky md:top-10">
            <SectionHeading
              eyebrow={t.home.verify.eyebrow}
              title={t.home.verify.title}
              intro={t.home.verify.intro}
            />
            <div className="mt-8 max-w-sm">
              <VerifiedBadge items={example} verifiedAt={new Date(Date.UTC(2026, 2, 12))} />
              <p className="mt-3 text-sm text-gris-700">{t.home.verify.badgeCaption}</p>
            </div>
          </div>
        </div>
        <ol className="md:col-span-7 md:col-start-6">
          {t.home.verify.steps.map((step, i) => (
            <li
              key={step.title}
              className="grid grid-cols-[3.25rem_1fr] gap-x-4 border-t border-indigo-900/20 py-6 first:border-indigo-900 sm:grid-cols-[4rem_1fr]"
            >
              <span
                className="font-display text-4xl leading-none text-terre-600 tabular-nums"
                aria-hidden="true"
              >
                {String(i + 1).padStart(2, "0")}
              </span>
              <div>
                <h3 className="flex items-center gap-3 text-2xl">
                  <Icon name={step.icon} size={28} className="text-indigo-900" />
                  {step.title}
                </h3>
                <p className="mt-2 text-lg text-gris-700">{step.text}</p>
              </div>
            </li>
          ))}
          <li className="flex items-start gap-3 border-t border-indigo-900/20 pt-6 text-gris-700">
            <Icon name="cadenas" size={24} className="mt-0.5 shrink-0 text-indigo-900" />
            <p>{t.home.verify.privacy}</p>
          </li>
        </ol>
      </div>
    </section>
  );
}

function HowSection({ t }: { t: T }) {
  return (
    <section className="container-page py-16 md:py-24">
      <SectionHeading eyebrow={t.home.how.eyebrow} title={t.home.how.title} />
      <ol className="mt-10 grid gap-8 md:grid-cols-3 md:gap-0">
        {t.home.how.steps.map((step, i) => (
          <li
            key={step.title}
            className="relative border-l-2 border-terre-600 pl-6 md:border-t-2 md:border-l-0 md:pt-8 md:pr-8 md:pl-0"
          >
            <span
              className="font-display text-6xl leading-none text-indigo-900/15"
              aria-hidden="true"
            >
              {i + 1}
            </span>
            <h3 className="mt-2 text-2xl">{step.title}</h3>
            <p className="mt-3 text-gris-700">{step.text}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}

function GuaranteeSection({ services, t }: { services: LoadedService[]; t: T }) {
  return (
    <section className="border-y border-ligne bg-white">
      <div className="container-page grid gap-10 py-16 md:grid-cols-12 md:py-24">
        <div className="md:col-span-6">
          <p className="eyebrow text-terre-700">{t.home.guarantee.eyebrow}</p>
          <h2 className="mt-3 text-4xl sm:text-5xl">{t.home.guarantee.title}</h2>
        </div>
        <div className="md:col-span-6 md:pt-10">
          <p className="text-lg">{t.home.guarantee.body}</p>
          <ul className="mt-6 space-y-3">
            {t.home.guarantee.points.map((p) => (
              <li key={p} className="flex gap-3">
                <Icon
                  name="check"
                  size={22}
                  strokeWidth={2.4}
                  className="mt-0.5 shrink-0 text-baobab-600"
                />
                <span>{p}</span>
              </li>
            ))}
          </ul>
          <div className="mt-8 space-y-6 border-t border-ligne pt-6">
            {services.map((s) => (
              <div key={s.id}>
                <h3 className="font-sans text-base font-bold">{s.name}</h3>
                <dl className="mt-2 space-y-3">
                  {guaranteeGroups(s).map((g) => (
                    <div key={g.text}>
                      <dt className="text-sm font-bold text-terre-700">{g.labels.join(" · ")}</dt>
                      <dd className="mt-0.5 text-gris-700">{g.text}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/** Les formules qui partagent la même garantie sont présentées ensemble. */
function guaranteeGroups(service: LoadedService) {
  const groups = new Map<string, string[]>();
  for (const f of service.config.formulas) {
    const text = guaranteeText(service.config.guarantees[f.key]);
    groups.set(text, [...(groups.get(text) ?? []), f.shortLabel]);
  }
  return [...groups.entries()].map(([text, labels]) => ({ text, labels }));
}

function ProvidersSection({ t }: { t: T }) {
  return (
    <section className="on-dark bg-indigo-900 text-sable-50">
      <div className="container-page py-16 md:py-24">
        <SectionHeading
          tone="light"
          eyebrow={t.home.providers.eyebrow}
          title={t.home.providers.title}
          className="max-w-3xl"
        />
        <ul className="mt-12 grid gap-8 md:grid-cols-3">
          {t.home.providers.points.map((p) => (
            <li key={p.title} className="border-t border-sable-50/25 pt-6">
              <Icon name={p.icon} size={30} className="text-ocre-500" />
              <h3 className="mt-4 text-2xl text-sable-50">{p.title}</h3>
              <p className="mt-2 text-sable-100">{p.text}</p>
            </li>
          ))}
        </ul>
        <div className="mt-14 grid gap-8 md:grid-cols-12 md:items-end">
          <blockquote className="font-display text-3xl leading-tight text-ocre-500 sm:text-4xl md:col-span-8">
            « {t.home.providers.quote} »
          </blockquote>
          <div className="md:col-span-4">
            <p className="text-sable-100">{t.home.providers.missions}</p>
            <LinkButton
              href="/devenir-prestataire"
              variant="light"
              className="mt-5"
              iconAfter="arrowRight"
            >
              {t.home.providers.cta}
            </LinkButton>
          </div>
        </div>
      </div>
    </section>
  );
}
