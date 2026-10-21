import type { Metadata } from "next";
import Link from "next/link";
import { Pill } from "@/components/ui/pill";
import { requireSpace } from "@/lib/auth/guards";
import { listPlacementsByStatus } from "@/lib/data/placements";
import { formatDate } from "@/lib/format";
import { placementStatusLabel } from "@/lib/placements";
import { formulaOf, getServicesById } from "@/lib/services/repository";

export const metadata: Metadata = { title: "Placements" };

export default async function AdminPlacementsPage() {
  await requireSpace("admin", "/admin/placements");
  const [rows, services] = await Promise.all([
    listPlacementsByStatus([
      "rencontre_demandee",
      "rencontre_prevue",
      "essai",
      "confirme",
      "termine",
      "annule",
    ]),
    getServicesById(),
  ]);
  return (
    <div>
      <h1 className="text-4xl">Placements</h1>
      <div className="mt-6 overflow-x-auto rounded-md border border-ligne bg-white">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="border-b border-ligne bg-sable-100">
            <tr>
              <th className="px-4 py-3">Famille</th>
              <th className="px-4 py-3">Personne</th>
              <th className="px-4 py-3">Formule</th>
              <th className="px-4 py-3">Statut</th>
              <th className="px-4 py-3">Garantie</th>
              <th className="px-4 py-3">Suivi</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((p) => {
              const service = services.get(p.serviceId);
              const formula = service ? formulaOf(service, p.formulaKey) : null;
              return (
                <tr key={p.id} className="border-b border-ligne last:border-0">
                  <td className="px-4 py-3 font-bold">
                    <Link href={`/agent/placements/${p.id}`} className="underline">
                      {p.familyName}
                    </Link>
                    <span className="block font-normal text-gris-700">{p.familyAreaName}</span>
                  </td>
                  <td className="px-4 py-3">
                    {p.workerFirstName} {p.workerLastName}
                  </td>
                  <td className="px-4 py-3">{formula?.label}</td>
                  <td className="px-4 py-3">
                    <Pill
                      tone={
                        p.status === "annule"
                          ? "danger"
                          : p.status === "confirme" || p.status === "termine"
                            ? "succes"
                            : "attente"
                      }
                    >
                      {placementStatusLabel(p.status, formula?.kind ?? "longue")}
                    </Pill>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {p.guaranteeEndsAt ? formatDate(p.guaranteeEndsAt) : "—"}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {p.followUpDoneAt
                      ? `Fait le ${formatDate(p.followUpDoneAt)}`
                      : p.followUpDueAt
                        ? `Prévu le ${formatDate(p.followUpDueAt)}`
                        : "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
