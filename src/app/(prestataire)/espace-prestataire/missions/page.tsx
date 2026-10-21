import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Icon } from "@/components/icons";
import { EmptyState } from "@/components/ui/empty-state";
import { Pill } from "@/components/ui/pill";
import { Stars } from "@/components/ui/rating";
import { requireSpace } from "@/lib/auth/guards";
import { listWorkerPlacements } from "@/lib/data/placements";
import { getReviewsAbout, getWorkerByUserId } from "@/lib/data/workers";
import { formatDate, formatDateTime } from "@/lib/format";
import { isActive, placementStatusLabel } from "@/lib/placements";
import { formulaOf, getServicesById } from "@/lib/services/repository";

export const metadata: Metadata = { title: "Mes missions" };

export default async function WorkerMissionsPage() {
  const user = await requireSpace("prestataire", "/espace-prestataire/missions");
  const worker = await getWorkerByUserId(user.id);
  if (!worker) redirect("/espace-prestataire/inscription");
  const [placementRows, reviews] = await Promise.all([
    listWorkerPlacements(worker.profileId),
    getReviewsAbout(user.id),
  ]);
  const services = await getServicesById();
  const current = placementRows.filter((p) => isActive(p.status));
  const past = placementRows.filter((p) => !isActive(p.status));

  return (
    <div className="mx-auto max-w-2xl space-y-10">
      <h1 className="text-4xl">Mes missions</h1>

      <section aria-labelledby="en-cours">
        <h2 id="en-cours" className="text-2xl">
          Demandes de rencontre et missions en cours
        </h2>
        {current.length === 0 ? (
          <div className="mt-4">
            <EmptyState icon="calendrier" title="Rien pour le moment.">
              Quand une famille demande à vous rencontrer, l’équipe Dorwar vous appelle et la
              demande apparaît ici.
            </EmptyState>
          </div>
        ) : (
          <ul className="mt-4 space-y-3">
            {current.map((p) => {
              const service = services.get(p.serviceId);
              const formula = service ? formulaOf(service, p.formulaKey) : null;
              const toAccept = p.conditions && !p.workerAcceptedAt;
              return (
                <li key={p.id}>
                  <Link
                    href={`/espace-prestataire/missions/${p.id}`}
                    className="block rounded-md border border-ligne bg-white p-4 hover:border-indigo-900"
                  >
                    <span className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-lg font-bold">{p.familyName ?? "Famille"}</span>
                      <Pill tone={p.status === "confirme" ? "succes" : "attente"}>
                        {placementStatusLabel(p.status, formula?.kind ?? "longue")}
                      </Pill>
                    </span>
                    <span className="mt-1 block text-gris-700">
                      {formula?.label} · {p.familyAreaName}
                    </span>
                    {p.meetingAt && p.status === "rencontre_prevue" && (
                      <span className="mt-2 flex items-center gap-2 font-bold">
                        <Icon name="calendrier" size={20} /> Rencontre {formatDateTime(p.meetingAt)}
                      </span>
                    )}
                    {toAccept && (
                      <span className="mt-2 flex items-center gap-2 font-bold text-terre-700">
                        <Icon name="document" size={20} /> Conditions à lire et à accepter
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section aria-labelledby="avis">
        <h2 id="avis" className="text-2xl">
          Ce que les familles disent de vous
        </h2>
        {reviews.length === 0 ? (
          <p className="mt-3 text-gris-700">
            Pas encore d’avis. Ils apparaîtront après vos premières missions.
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-ligne border-y border-ligne">
            {reviews.map((r) => (
              <li key={r.id} className="py-4">
                <div className="flex flex-wrap items-center gap-3">
                  <Stars value={r.rating} />
                  <span className="font-bold">{r.authorName}</span>
                  <span className="text-sm text-gris-700">{formatDate(r.createdAt)}</span>
                </div>
                <p className="mt-2">{r.comment}</p>
              </li>
            ))}
          </ul>
        )}
      </section>

      {past.length > 0 && (
        <section aria-labelledby="historique">
          <h2 id="historique" className="text-2xl">
            Missions passées
          </h2>
          <ul className="mt-3">
            {past.map((p) => {
              const service = services.get(p.serviceId);
              const formula = service ? formulaOf(service, p.formulaKey) : null;
              return (
                <li key={p.id}>
                  <Link
                    href={`/espace-prestataire/missions/${p.id}`}
                    className="flex min-h-14 items-center justify-between gap-3 border-b border-ligne py-2 hover:underline"
                  >
                    <span>
                      {p.familyName} · {formula?.shortLabel}
                    </span>
                    <span className="text-sm text-gris-700">
                      {placementStatusLabel(p.status, formula?.kind ?? "longue")}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}
