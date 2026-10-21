import type { Metadata } from "next";
import Link from "next/link";
import { Icon } from "@/components/icons";
import { EmptyState } from "@/components/ui/empty-state";
import { Medallion } from "@/components/ui/medallion";
import { Pill } from "@/components/ui/pill";
import { requireSpace } from "@/lib/auth/guards";
import { cn } from "@/lib/cn";
import {
  DOSSIER_FILTERS,
  listDossiers,
  type DossierFilter,
  type DossierListItem,
} from "@/lib/data/dossiers";
import { listPlacementsByStatus } from "@/lib/data/placements";
import { formatPhone, formatRelativeDays, todayIso } from "@/lib/format";

export const metadata: Metadata = { title: "Dossiers à traiter" };

function priorityLabel(d: DossierListItem): {
  label: string;
  tone: "succes" | "attente" | "info" | "danger" | "neutre";
} {
  if (d.status === "verifie") return { label: "Vérifié", tone: "succes" };
  if (d.status === "refuse") return { label: "Refusé", tone: "danger" };
  if (d.status === "suspendu") return { label: "Suspendu", tone: "danger" };
  if (d.stepsDone === 0) return { label: "Nouveau dossier", tone: "info" };
  if (d.stepsTotal - d.stepsDone <= 1) return { label: "Presque terminé", tone: "succes" };
  return { label: "En cours", tone: "attente" };
}

export default async function AgentHomePage({ searchParams }: PageProps<"/agent">) {
  const user = await requireSpace("agent", "/agent");
  const query = await searchParams;
  const filter = (
    DOSSIER_FILTERS.some((f) => f.key === query.filtre) ? query.filtre : "a_traiter"
  ) as DossierFilter;
  const q = typeof query.q === "string" ? query.q : "";
  const [dossiers, followUps] = await Promise.all([
    listDossiers(filter, q),
    listPlacementsByStatus(["essai", "confirme", "rencontre_demandee"]),
  ]);
  const today = todayIso();
  const callsDue = followUps.filter(
    (p) => p.followUpDueAt && !p.followUpDoneAt && p.followUpDueAt <= today,
  ).length;
  const toSchedule = followUps.filter((p) => p.status === "rencontre_demandee").length;

  return (
    <div className="mx-auto max-w-3xl">
      <p className="text-gris-700">Bonjour {user.name?.split(" ")[0] ?? ""}</p>
      <h1 className="mt-1 text-3xl sm:text-4xl">Dossiers à traiter</h1>

      {(callsDue > 0 || toSchedule > 0) && (
        <Link
          href="/agent/suivis"
          className="mt-5 flex min-h-16 items-center gap-3 rounded-md border border-ocre-500/50 bg-ocre-100 p-4 font-bold"
        >
          <Icon name="phone" size={24} className="shrink-0 text-terre-700" />
          <span className="flex-1">
            {callsDue > 0 && `${callsDue} appel${callsDue > 1 ? "s" : ""} de suivi à passer`}
            {callsDue > 0 && toSchedule > 0 && " · "}
            {toSchedule > 0 && `${toSchedule} rencontre${toSchedule > 1 ? "s" : ""} à organiser`}
          </span>
          <Icon name="chevronRight" size={22} />
        </Link>
      )}

      <form action="/agent" method="get" className="mt-5 flex gap-2" role="search">
        <input type="hidden" name="filtre" value={filter} />
        <label htmlFor="q" className="sr-only">
          Rechercher un dossier
        </label>
        <input
          id="q"
          name="q"
          defaultValue={q}
          placeholder="Nom, téléphone ou quartier"
          className="min-h-13 min-w-0 flex-1 rounded-sm border-[1.5px] border-trait bg-white px-4 focus:border-indigo-900"
        />
        <button
          type="submit"
          className="inline-flex min-h-13 items-center gap-2 rounded-sm bg-indigo-900 px-4 font-bold text-sable-50"
        >
          <Icon name="recherche" size={20} />
          <span className="sr-only sm:not-sr-only">Chercher</span>
        </button>
      </form>

      <nav aria-label="Filtrer les dossiers" className="-mx-4 mt-4 overflow-x-auto px-4">
        <ul className="flex gap-2">
          {DOSSIER_FILTERS.map((f) => (
            <li key={f.key} className="shrink-0">
              <Link
                href={`/agent?filtre=${f.key}${q ? `&q=${encodeURIComponent(q)}` : ""}`}
                aria-current={f.key === filter ? "true" : undefined}
                className={cn(
                  "inline-flex min-h-12 items-center rounded-full px-4 font-bold whitespace-nowrap",
                  f.key === filter
                    ? "bg-indigo-900 text-sable-50"
                    : "border-[1.5px] border-trait bg-white text-indigo-900",
                )}
              >
                {f.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {dossiers.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            icon="checkCircle"
            title={q ? "Aucun dossier ne correspond." : "Rien à traiter pour l’instant."}
          >
            {q
              ? "Vérifiez l’orthographe du nom ou les chiffres du numéro."
              : "Les nouvelles inscriptions apparaîtront ici, les plus avancées en premier."}
          </EmptyState>
        </div>
      ) : (
        <ul className="mt-5 space-y-3">
          {dossiers.map((d) => {
            const priority = priorityLabel(d);
            return (
              <li
                key={d.id}
                className="flex items-stretch overflow-hidden rounded-md border border-ligne bg-white"
              >
                <Link
                  href={`/agent/dossiers/${d.id}`}
                  className="flex min-w-0 flex-1 items-center gap-3 p-3 hover:bg-sable-50 sm:gap-4 sm:p-4"
                >
                  <Medallion
                    firstName={d.firstName}
                    lastInitial={d.lastName.charAt(0)}
                    seed={d.profileId}
                    size="sm"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-lg font-bold">
                      {d.firstName} {d.lastName}
                    </span>
                    <span className="block truncate text-sm text-gris-700">
                      {d.areaName} · inscrit {formatRelativeDays(d.submittedAt)}
                    </span>
                    <span className="mt-2 flex items-center gap-2">
                      <span className="flex gap-1" aria-hidden="true">
                        {Array.from({ length: d.stepsTotal }, (_, i) => (
                          <span
                            key={i}
                            className={cn(
                              "h-2 w-4 rounded-full",
                              i < d.stepsDone
                                ? "bg-baobab-600"
                                : i < d.stepsDone + d.stepsFailed
                                  ? "bg-rouge-700"
                                  : "bg-sable-200",
                            )}
                          />
                        ))}
                      </span>
                      <span className="text-sm font-bold">
                        {d.stepsDone}/{d.stepsTotal}
                      </span>
                      <Pill tone={priority.tone} className="ml-auto max-sm:hidden">
                        {priority.label}
                      </Pill>
                    </span>
                  </span>
                </Link>
                <a
                  href={`tel:${d.phone}`}
                  className="flex w-16 shrink-0 flex-col items-center justify-center gap-1 border-l border-ligne text-xs font-bold text-baobab-700 hover:bg-baobab-100"
                  aria-label={`Appeler ${d.firstName} au ${formatPhone(d.phone)}`}
                >
                  <Icon name="phone" size={24} />
                  Appeler
                </a>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
