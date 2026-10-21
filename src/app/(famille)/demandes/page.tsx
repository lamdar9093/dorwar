import type { Metadata } from "next";
import Link from "next/link";
import { Icon } from "@/components/icons";
import { LinkButton } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Medallion } from "@/components/ui/medallion";
import { Pill } from "@/components/ui/pill";
import { describeArea } from "@/lib/areas";
import { requireSpace } from "@/lib/auth/guards";
import { listFamilyPlacements } from "@/lib/data/placements";
import { listFamilyRequests } from "@/lib/data/requests";
import { formatDate, formatDateTime } from "@/lib/format";
import { isActive, placementStatusLabel } from "@/lib/placements";
import { formulaOf, getAllServices } from "@/lib/services/repository";

export const metadata: Metadata = { title: "Mes demandes" };

export default async function MyRequestsPage() {
  const user = await requireSpace("famille", "/demandes");
  const [requestRows, placementRows, services] = await Promise.all([
    listFamilyRequests(user.id),
    listFamilyPlacements(user.id),
    getAllServices(),
  ]);
  const serviceById = new Map(services.map((s) => [s.id, s]));
  const areaLabels = new Map(
    await Promise.all(
      [...new Set(requestRows.map((r) => r.areaId))].map(
        async (id) => [id, await describeArea(id)] as const,
      ),
    ),
  );
  const current = placementRows.filter((p) => isActive(p.status));
  const past = placementRows.filter((p) => !isActive(p.status));

  if (!requestRows.length) {
    return (
      <div className="mx-auto max-w-2xl">
        <h1 className="text-4xl">Mes demandes</h1>
        <div className="mt-8">
          <EmptyState
            title="Vous n’avez pas encore fait de demande."
            action={
              <LinkButton href="/demande" iconAfter="arrowRight">
                Décrire mon besoin
              </LinkButton>
            }
          >
            Dites-nous ce qu’il vous faut : nous vous présentons des personnes vérifiées près de
            chez vous.
          </EmptyState>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-12 lg:grid-cols-12">
      <div className="lg:col-span-7">
        <h1 className="text-4xl">Mes demandes</h1>
        {current.length > 0 && (
          <section className="mt-8" aria-labelledby="suivi">
            <h2 id="suivi" className="text-2xl">
              En cours de suivi
            </h2>
            <ul className="mt-4 space-y-3">
              {current.map((p) => {
                const service = serviceById.get(p.serviceId);
                const formula = service ? formulaOf(service, p.formulaKey) : null;
                return (
                  <li key={p.id}>
                    <Link
                      href={`/placements/${p.id}`}
                      className="flex items-center gap-4 rounded-md border border-ligne bg-white p-4 hover:border-indigo-900"
                    >
                      <Medallion
                        firstName={p.workerFirstName}
                        lastInitial={p.workerLastName.charAt(0)}
                        seed={p.workerProfileId}
                        size="sm"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block font-bold">
                          {p.workerFirstName} {p.workerLastName.charAt(0)}. · {formula?.label}
                        </span>
                        <span className="block text-sm text-gris-700">
                          {p.status === "rencontre_prevue" && p.meetingAt
                            ? `Rencontre ${formatDateTime(p.meetingAt)}`
                            : p.status === "rencontre_demandee"
                              ? "L’équipe vous appelle pour organiser la rencontre."
                              : p.guaranteeEndsAt
                                ? `Garantie jusqu’au ${formatDate(p.guaranteeEndsAt)}`
                                : ""}
                        </span>
                      </span>
                      <Pill tone={p.status === "confirme" ? "succes" : "attente"}>
                        {placementStatusLabel(p.status, formula?.kind ?? "longue")}
                      </Pill>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        <section className="mt-10" aria-labelledby="demandes">
          <h2 id="demandes" className="text-2xl">
            Toutes mes demandes
          </h2>
          <ul className="mt-4 border-t border-indigo-900">
            {requestRows.map((r) => {
              const service = serviceById.get(r.serviceId);
              const formula = service ? formulaOf(service, r.formulaKey) : null;
              return (
                <li key={r.id} className="border-b border-ligne">
                  <Link
                    href={`/demandes/${r.id}`}
                    className="group flex min-h-18 items-center gap-4 py-4"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block font-bold group-hover:underline">
                        {formula?.label ?? r.formulaKey} · {areaLabels.get(r.areaId)}
                      </span>
                      <span className="block text-sm text-gris-700">
                        {service?.name} · envoyée le {formatDate(r.createdAt)}
                        {r.placementCount
                          ? ` · ${r.placementCount} rencontre${r.placementCount > 1 ? "s" : ""}`
                          : ""}
                      </span>
                    </span>
                    {r.status === "pourvue" ? (
                      <Pill tone="succes">Pourvue</Pill>
                    ) : r.status === "fermee" ? (
                      <Pill>Fermée</Pill>
                    ) : (
                      <Pill tone="info">Ouverte</Pill>
                    )}
                    <Icon name="chevronRight" size={20} className="shrink-0" />
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      </div>

      <aside className="lg:col-span-5">
        <div className="rounded-md bg-sable-100 p-6">
          <h2 className="text-2xl">Une nouvelle demande ?</h2>
          <p className="mt-2 text-gris-700">
            Décrivez votre besoin : nous vous présentons des profils vérifiés, les plus proches de
            chez vous d’abord.
          </p>
          <LinkButton href="/demande" className="mt-5" iconAfter="arrowRight">
            Décrire mon besoin
          </LinkButton>
        </div>
        {past.length > 0 && (
          <section className="mt-8" aria-labelledby="historique">
            <h2 id="historique" className="font-sans text-lg font-bold">
              Historique
            </h2>
            <ul className="mt-3 space-y-2 text-sm">
              {past.map((p) => {
                const service = serviceById.get(p.serviceId);
                const formula = service ? formulaOf(service, p.formulaKey) : null;
                return (
                  <li key={p.id}>
                    <Link
                      href={`/placements/${p.id}`}
                      className="flex min-h-12 items-center justify-between gap-3 border-b border-ligne py-2 hover:underline"
                    >
                      <span>
                        {p.workerFirstName} {p.workerLastName.charAt(0)}. · {formula?.shortLabel}
                      </span>
                      <span className="text-gris-700">
                        {placementStatusLabel(p.status, formula?.kind ?? "longue")}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        )}
      </aside>
    </div>
  );
}
