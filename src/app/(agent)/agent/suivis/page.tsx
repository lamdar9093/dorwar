import type { Metadata } from "next";
import Link from "next/link";
import { Icon } from "@/components/icons";
import { EmptyState } from "@/components/ui/empty-state";
import { Pill } from "@/components/ui/pill";
import { requireSpace } from "@/lib/auth/guards";
import { cn } from "@/lib/cn";
import { listPlacementsByStatus, type PlacementListItem } from "@/lib/data/placements";
import { addDaysIso, formatDate, formatDateTime, formatRelativeDays, todayIso } from "@/lib/format";
import { placementStatusLabel } from "@/lib/placements";
import { formulaOf, getAllServices, type LoadedService } from "@/lib/services/repository";

export const metadata: Metadata = { title: "Suivis" };

export default async function FollowUpsPage() {
  await requireSpace("agent", "/agent/suivis");
  const [items, services] = await Promise.all([
    listPlacementsByStatus(["rencontre_demandee", "rencontre_prevue", "essai", "confirme"]),
    getAllServices(),
  ]);
  const today = todayIso();

  const calls = items
    .filter((p) => p.followUpDueAt && !p.followUpDoneAt && p.followUpDueAt <= addDaysIso(today, 2))
    .sort((a, b) => (a.followUpDueAt! < b.followUpDueAt! ? -1 : 1));
  const toSchedule = items
    .filter((p) => p.status === "rencontre_demandee")
    .sort((a, b) => +a.createdAt - +b.createdAt);
  const meetings = items
    .filter((p) => p.status === "rencontre_prevue")
    .sort((a, b) => +(a.meetingAt ?? 0) - +(b.meetingAt ?? 0));
  const trials = items.filter((p) => p.status === "essai");

  return (
    <div className="mx-auto max-w-3xl space-y-10">
      <h1 className="text-3xl sm:text-4xl">Suivis</h1>

      <section aria-labelledby="appels">
        <h2 id="appels" className="flex items-center gap-2 text-2xl">
          <Icon name="phone" size={24} className="text-terre-700" /> Appels de suivi
        </h2>
        <p className="mt-1 text-gris-700">
          Une semaine après le début de l’essai, on appelle la famille et la personne.
        </p>
        {calls.length ? (
          <ul className="mt-4 space-y-3">
            {calls.map((p) => (
              <Row
                key={p.id}
                p={p}
                services={services}
                tone={p.followUpDueAt! < today ? "danger" : undefined}
                detail={`Appel ${p.followUpDueAt! < today ? "en retard, prévu" : "prévu"} ${formatRelativeDays(p.followUpDueAt!)} (${formatDate(p.followUpDueAt!)})`}
              />
            ))}
          </ul>
        ) : (
          <p className="mt-4 rounded-md bg-sable-100 p-4 text-gris-700">
            Aucun appel à passer dans les deux prochains jours.
          </p>
        )}
      </section>

      <section aria-labelledby="organiser">
        <h2 id="organiser" className="flex items-center gap-2 text-2xl">
          <Icon name="calendrier" size={24} className="text-terre-700" /> Rencontres à organiser
        </h2>
        {toSchedule.length ? (
          <ul className="mt-4 space-y-3">
            {toSchedule.map((p) => (
              <Row
                key={p.id}
                p={p}
                services={services}
                detail={`Demandée ${formatRelativeDays(p.createdAt)} : appeler les deux côtés`}
              />
            ))}
          </ul>
        ) : (
          <p className="mt-4 rounded-md bg-sable-100 p-4 text-gris-700">
            Aucune rencontre en attente.
          </p>
        )}
      </section>

      <section aria-labelledby="prevues">
        <h2 id="prevues" className="text-2xl">
          Rencontres prévues
        </h2>
        {meetings.length ? (
          <ul className="mt-4 space-y-3">
            {meetings.map((p) => (
              <Row
                key={p.id}
                p={p}
                services={services}
                detail={p.meetingAt ? formatDateTime(p.meetingAt) : "Date à confirmer"}
              />
            ))}
          </ul>
        ) : (
          <p className="mt-4 text-gris-700">Aucune rencontre prévue.</p>
        )}
      </section>

      <section aria-labelledby="essais">
        <h2 id="essais" className="text-2xl">
          Essais en cours
        </h2>
        {trials.length ? (
          <ul className="mt-4 space-y-3">
            {trials.map((p) => (
              <Row
                key={p.id}
                p={p}
                services={services}
                detail={
                  p.guaranteeEndsAt
                    ? `Garantie jusqu’au ${formatDate(p.guaranteeEndsAt)}`
                    : placementStatusLabel(p.status, "longue")
                }
              />
            ))}
          </ul>
        ) : (
          <EmptyState icon="horloge" title="Aucun essai en cours." />
        )}
      </section>
      <p className="text-sm text-gris-700">
        <Pill tone="danger">En retard</Pill> signale un appel dont la date est passée.
      </p>
    </div>
  );
}

function Row({
  p,
  services,
  detail,
  tone,
}: {
  p: PlacementListItem;
  services: LoadedService[];
  detail: React.ReactNode;
  tone?: "danger";
}) {
  const service = services.find((s) => s.id === p.serviceId);
  const formula = service ? formulaOf(service, p.formulaKey) : null;
  return (
    <li>
      <Link
        href={`/agent/placements/${p.id}`}
        className={cn(
          "flex min-h-18 items-center gap-3 rounded-md border bg-white p-4 hover:border-indigo-900",
          tone === "danger" ? "border-rouge-700/50" : "border-ligne",
        )}
      >
        <span className="min-w-0 flex-1">
          <span className="block font-bold">
            {p.familyName ?? "Famille"} · {p.workerFirstName} {p.workerLastName.charAt(0)}.
          </span>
          <span className="block text-sm text-gris-700">
            {formula?.label} · {p.familyAreaName}
          </span>
          <span
            className={cn(
              "mt-1 block text-sm font-bold",
              tone === "danger" ? "text-rouge-700" : "text-indigo-900",
            )}
          >
            {detail}
          </span>
        </span>
        <Icon name="chevronRight" size={22} className="shrink-0" />
      </Link>
    </li>
  );
}
