import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/db/client";
import { placements } from "@/db/schema";
import { Icon } from "@/components/icons";
import { WorkerProfileView } from "@/components/profile/worker-profile-view";
import { ActionForm } from "@/components/ui/action-form";
import { LinkButton } from "@/components/ui/button";
import { Label, TextArea } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import { requireUser } from "@/lib/auth/guards";
import { canViewWorkerProfile, homeFor, isStaff } from "@/lib/auth/rbac";
import { getRequest, type RequestDetail } from "@/lib/data/requests";
import { getProfileReviews, getWorkerByProfileId } from "@/lib/data/workers";
import { distanceMeters } from "@/lib/geo";
import { ACTIVE_STATUSES, placementStatusLabel } from "@/lib/placements";
import { toPublicProfile } from "@/lib/public-profile";
import { requestMeeting } from "../actions";

export const metadata: Metadata = { title: "Profil vérifié" };

export default async function ProfilePage({ params, searchParams }: PageProps<"/profils/[id]">) {
  const { id } = await params;
  const query = await searchParams;
  const demande = typeof query.demande === "string" ? query.demande : null;
  const user = await requireUser(`/profils/${id}${demande ? `?demande=${demande}` : ""}`);
  if (!canViewWorkerProfile(user)) redirect(homeFor(user.role));

  const worker = await getWorkerByProfileId(id);
  if (!worker) notFound();
  const verified = worker.dossiers.filter((d) => d.status === "verifie");
  if (!verified.length && !isStaff(user)) notFound();

  let request: RequestDetail | null = null;
  if (demande && user.role === "famille") {
    const candidate = await getRequest(demande);
    if (candidate && candidate.familyUserId === user.id) request = candidate;
  }
  const dossier =
    (request && verified.find((d) => d.service.id === request.service.id)) ??
    verified[0] ??
    worker.dossiers[0];
  if (!dossier) notFound();
  const service = dossier.service;
  const formula = request?.formula ?? null;
  const reviews = await getProfileReviews(worker.userId);

  const [existing] =
    request && dossier
      ? await db
          .select({ id: placements.id, status: placements.status })
          .from(placements)
          .where(
            and(
              eq(placements.requestId, request.id),
              eq(placements.workerServiceId, dossier.id),
              inArray(placements.status, [...ACTIVE_STATUSES]),
            ),
          )
          .limit(1)
      : [];

  const canAsk = Boolean(
    request &&
    request.status === "ouverte" &&
    formula &&
    dossier.formulaKeys.includes(formula.key) &&
    dossier.status === "verifie",
  );

  return (
    <div>
      {request && (
        <Link
          href={`/demandes/${request.id}`}
          className="inline-flex min-h-12 items-center gap-2 font-bold text-indigo-900 underline"
        >
          <Icon name="arrowLeft" size={20} />
          Retour aux profils
        </Link>
      )}
      <div className="mt-4">
        <WorkerProfileView
          profile={toPublicProfile(worker, dossier)}
          service={service}
          badge={dossier.badge}
          reviews={reviews}
          privateFacts={{
            age: worker.age,
            monthlyRateFcfa: worker.monthlyRateFcfa,
            dailyRateFcfa: worker.dailyRateFcfa,
            availableFrom: worker.availableFrom,
            cardId: worker.cardId,
            distanceM: request ? distanceMeters(request.location, worker.location) : null,
          }}
        >
          {request && (
            <section
              id="rencontre"
              className="mt-12 scroll-mt-6 rounded-md border border-ligne bg-white p-5 sm:p-8"
              aria-labelledby="titre-rencontre"
            >
              <h2 id="titre-rencontre" className="text-3xl">
                Rencontrer {worker.firstName}
              </h2>
              {existing ? (
                <div className="mt-4">
                  <p className="text-gris-700">
                    Vous avez déjà demandé une rencontre :{" "}
                    {placementStatusLabel(existing.status, request.formula.kind).toLowerCase()}.
                  </p>
                  <LinkButton
                    href={`/placements/${existing.id}`}
                    className="mt-4"
                    iconAfter="arrowRight"
                  >
                    Voir le suivi
                  </LinkButton>
                </div>
              ) : canAsk ? (
                <ActionForm action={requestMeeting} className="mt-4 space-y-5">
                  <p className="text-gris-700">
                    L’équipe Dorwar vous appelle pour fixer un rendez-vous, chez vous ou dans un
                    lieu neutre. Rien n’est engagé tant que vous n’avez pas choisi.
                  </p>
                  <input type="hidden" name="demande" value={request.id} />
                  <input type="hidden" name="dossier" value={dossier.id} />
                  <div>
                    <Label htmlFor="message" optional>
                      Un mot pour l’équipe
                    </Label>
                    <TextArea
                      id="message"
                      name="message"
                      maxLength={500}
                      rows={3}
                      placeholder="Vos disponibilités pour la rencontre, une question…"
                    />
                  </div>
                  <SubmitButton
                    size="lg"
                    full
                    pendingLabel="Envoi de la demande…"
                    icon="calendrier"
                  >
                    Demander une rencontre
                  </SubmitButton>
                </ActionForm>
              ) : (
                <p className="mt-4 text-gris-700">
                  Cette personne ne propose pas la formule demandée, ou votre demande est déjà
                  pourvue.
                </p>
              )}
            </section>
          )}
        </WorkerProfileView>
      </div>

      {request && canAsk && !existing && (
        <div className="sticky bottom-0 -mx-4 mt-8 border-t border-ligne bg-sable-50/95 px-4 py-3 shadow-sheet lg:hidden">
          <a
            href="#rencontre"
            className="flex min-h-14 items-center justify-center gap-2.5 rounded-sm bg-terre-600 text-lg font-bold text-white"
          >
            <Icon name="calendrier" size={22} />
            Demander une rencontre
          </a>
        </div>
      )}
    </div>
  );
}
