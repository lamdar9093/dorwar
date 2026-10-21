import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { waitlist } from "@/db/schema";
import { Icon } from "@/components/icons";
import { ActionForm } from "@/components/ui/action-form";
import { EmptyState } from "@/components/ui/empty-state";
import { Notice } from "@/components/ui/notice";
import { SubmitButton } from "@/components/ui/submit-button";
import { WorkerCard } from "@/components/worker-card";
import { motsWolof } from "@/i18n";
import { isAreaOpen } from "@/lib/areas";
import { requireSpace } from "@/lib/auth/guards";
import { canViewRequest } from "@/lib/auth/rbac";
import { getRequest } from "@/lib/data/requests";
import { getBadges } from "@/lib/data/workers";
import { SEARCH_RADII_KM } from "@/lib/form-engine/constants";
import { summarizeAnswers } from "@/lib/form-engine/summary";
import { formatDate, formatPhone } from "@/lib/format";
import { findMatches } from "@/lib/matching";
import { joinWaitlist } from "../actions";

export const metadata: Metadata = { title: "Profils vérifiés" };

export default async function RequestResultsPage({
  params,
  searchParams,
}: PageProps<"/demandes/[id]">) {
  const { id } = await params;
  const query = await searchParams;
  const user = await requireSpace("famille", `/demandes/${id}`);
  const request = await getRequest(id);
  if (!request || !canViewRequest(user, request)) notFound();

  const { service, formula } = request;
  const vocabulary = service.config.vocabulary;
  const rayonParam = Number(query.rayon);
  const radius =
    request.searchMode === "autour"
      ? (SEARCH_RADII_KM as readonly number[]).includes(rayonParam)
        ? rayonParam
        : (request.radiusKm ?? 5)
      : null;

  const open = await isAreaOpen(request.areaId);
  const matches = open ? await findMatches(request.id, formula.housing, radius ?? undefined) : [];
  const badges = await getBadges(
    matches.map((m) => ({ id: m.workerServiceId, serviceId: service.id })),
  );
  const near = matches.filter((m) => m.reason !== "installation");
  const relocating = matches.filter((m) => m.reason === "installation");
  const [onWaitlist] = await db
    .select({ id: waitlist.id })
    .from(waitlist)
    .where(and(eq(waitlist.phone, user.phone), eq(waitlist.areaId, request.areaId)))
    .limit(1);

  const summary = summarizeAnswers(service.config.needForm, request.answers, {
    formulas: service.config.formulas.map((f) => ({ key: f.key, label: f.label })),
    locationLabel: request.areaLabel,
  });
  const profileHref = (workerProfileId: string) =>
    `/profils/${workerProfileId}?demande=${request.id}`;

  return (
    <div className="grid gap-10 lg:grid-cols-12">
      <div className="lg:col-span-8">
        {query.nouvelle === "1" && (
          <Notice
            tone="succes"
            className="mb-8"
            title={
              <>
                <span lang="wo">{motsWolof.merci}</span> ! Votre demande est enregistrée.
              </>
            }
          >
            {query.profil === "hors"
              ? "La personne que vous aviez remarquée ne correspond pas à cette demande (formule, secteur ou disponibilité)."
              : null}{" "}
            {matches.length
              ? "Voici les profils vérifiés qui y correspondent. Ouvrez un profil pour demander une rencontre."
              : null}
          </Notice>
        )}
        <p className="eyebrow text-terre-700">{service.name}</p>
        <h1 className="mt-2 text-4xl">
          {open && matches.length ? "Des profils vérifiés pour vous" : "Votre demande"}
        </h1>
        <p className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-lg text-gris-700">
          <span className="font-bold text-indigo-900">{formula.label}</span>
          <span aria-hidden="true">·</span>
          <span className="inline-flex items-center gap-1.5">
            <Icon name="adresse" size={18} /> {request.areaLabel}
          </span>
        </p>

        {request.searchMode === "autour" && open && (
          <nav
            aria-label="Distance de recherche"
            className="mt-6 flex flex-wrap items-center gap-2"
          >
            <span className="w-full font-bold sm:mr-1 sm:w-auto">Jusqu’à</span>
            {SEARCH_RADII_KM.map((r) => (
              <Link
                key={r}
                href={`/demandes/${request.id}?rayon=${r}`}
                aria-current={r === radius ? "true" : undefined}
                className={
                  r === radius
                    ? "inline-flex min-h-12 min-w-18 items-center justify-center rounded-full bg-indigo-900 px-4 font-bold text-sable-50"
                    : "inline-flex min-h-12 min-w-18 items-center justify-center rounded-full border-[1.5px] border-trait bg-white px-4 font-bold hover:border-indigo-900"
                }
                scroll={false}
              >
                {r} km
              </Link>
            ))}
          </nav>
        )}

        {!open || matches.length === 0 ? (
          <div className="mt-8">
            <EmptyState icon="porte_ouverte" title={vocabulary.noneNearby}>
              <p>
                {open
                  ? "Nous préférons vous le dire plutôt que de vous présenter quelqu’un que nous n’avons pas vérifié."
                  : "Dorwar n’est pas encore présent dans cette zone. Nous n’y présentons personne tant que notre équipe n’a pas pu vérifier sur place."}
              </p>
              {open && request.searchMode === "autour" && radius !== null && radius < 20 && (
                <p className="mt-3">
                  <Link
                    href={`/demandes/${request.id}?rayon=20`}
                    className="font-bold text-indigo-900 underline"
                  >
                    Chercher jusqu’à 20 km
                  </Link>
                </p>
              )}
              <div className="mt-6">
                {onWaitlist ? (
                  <Notice tone="succes" title="Vous êtes sur la liste d’attente.">
                    L’équipe vous appelle au {formatPhone(user.phone)} dès qu’une personne vérifiée
                    est disponible près de chez vous.
                  </Notice>
                ) : (
                  <ActionForm action={joinWaitlist} successTitle="C’est noté.">
                    <input type="hidden" name="demande" value={request.id} />
                    <p className="mb-3">
                      Laissez votre numéro : nous vous prévenons dès que c’est le cas. Nous
                      utiliserons le <strong>{formatPhone(user.phone)}</strong>.
                    </p>
                    <SubmitButton icon="phone" pendingLabel="Enregistrement…">
                      Me prévenir
                    </SubmitButton>
                  </ActionForm>
                )}
              </div>
            </EmptyState>
          </div>
        ) : (
          <>
            <section className="mt-6" aria-labelledby="proches">
              <h2 id="proches" className="sr-only">
                Près de chez vous
              </h2>
              <p className="border-b border-indigo-900 pb-3 text-sm text-gris-700">
                {near.length} profil{near.length > 1 ? "s" : ""}, du plus proche au plus éloigné.
                Les distances sont arrondies : aucune adresse n’est affichée.
              </p>
              {near.map((m) => (
                <WorkerCard
                  key={m.workerServiceId}
                  match={m}
                  service={service}
                  formula={formula}
                  badge={badges.get(m.workerServiceId) ?? []}
                  href={profileHref(m.workerProfileId)}
                />
              ))}
            </section>
            {relocating.length > 0 && (
              <section className="mt-12" aria-labelledby="installation">
                <h2 id="installation" className="text-2xl">
                  Prêtes et prêts à s’installer chez vous
                </h2>
                <p className="mt-2 border-b border-indigo-900 pb-3 text-gris-700">
                  Pour une formule logée, la distance compte moins : ces personnes acceptent de
                  venir vivre près de leur travail.
                </p>
                {relocating.map((m) => (
                  <WorkerCard
                    key={m.workerServiceId}
                    match={m}
                    service={service}
                    formula={formula}
                    badge={badges.get(m.workerServiceId) ?? []}
                    href={profileHref(m.workerProfileId)}
                  />
                ))}
              </section>
            )}
          </>
        )}
      </div>

      <aside className="lg:col-span-4">
        <div className="rounded-md border border-ligne bg-white p-5 lg:sticky lg:top-6">
          <h2 className="font-sans text-lg font-bold">Ce que vous avez demandé</h2>
          <p className="text-sm text-gris-700">Envoyée le {formatDate(request.createdAt)}</p>
          <dl className="mt-4 space-y-3 text-sm">
            {summary.map((line) => (
              <div key={line.key}>
                <dt className="font-bold">{line.label}</dt>
                <dd className="text-gris-700">{line.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </aside>
    </div>
  );
}
