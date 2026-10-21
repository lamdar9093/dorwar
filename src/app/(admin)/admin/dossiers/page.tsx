import type { Metadata } from "next";
import Link from "next/link";
import { Pill } from "@/components/ui/pill";
import { fr } from "@/i18n/fr";
import { requireSpace } from "@/lib/auth/guards";
import { cn } from "@/lib/cn";
import { DOSSIER_FILTERS, listDossiers, type DossierFilter } from "@/lib/data/dossiers";
import { formatDate, formatPhone } from "@/lib/format";

export const metadata: Metadata = { title: "Dossiers" };

export default async function AdminDossiersPage({ searchParams }: PageProps<"/admin/dossiers">) {
  await requireSpace("admin", "/admin/dossiers");
  const query = await searchParams;
  const filter = (
    DOSSIER_FILTERS.some((f) => f.key === query.filtre) ? query.filtre : "tous"
  ) as DossierFilter;
  const dossiers = await listDossiers(filter);
  return (
    <div>
      <h1 className="text-4xl">Dossiers</h1>
      <nav aria-label="Filtrer" className="mt-6 flex flex-wrap gap-2">
        {DOSSIER_FILTERS.map((f) => (
          <Link
            key={f.key}
            href={`/admin/dossiers?filtre=${f.key}`}
            aria-current={f.key === filter ? "true" : undefined}
            className={cn(
              "inline-flex min-h-11 items-center rounded-full px-4 font-bold",
              f.key === filter ? "bg-indigo-900 text-sable-50" : "border border-trait bg-white",
            )}
          >
            {f.label}
          </Link>
        ))}
      </nav>
      <div className="mt-6 overflow-x-auto rounded-md border border-ligne bg-white">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-ligne bg-sable-100">
            <tr>
              <th className="px-4 py-3">Personne</th>
              <th className="px-4 py-3">Quartier</th>
              <th className="px-4 py-3">Téléphone</th>
              <th className="px-4 py-3">Étapes</th>
              <th className="px-4 py-3">Statut</th>
              <th className="px-4 py-3">Inscription</th>
            </tr>
          </thead>
          <tbody>
            {dossiers.map((d) => (
              <tr key={d.id} className="border-b border-ligne last:border-0">
                <td className="px-4 py-3 font-bold">
                  <Link href={`/agent/dossiers/${d.id}`} className="underline">
                    {d.firstName} {d.lastName}
                  </Link>
                </td>
                <td className="px-4 py-3">{d.areaName}</td>
                <td className="px-4 py-3 whitespace-nowrap">{formatPhone(d.phone)}</td>
                <td className="px-4 py-3">
                  {d.stepsDone}/{d.stepsTotal}
                </td>
                <td className="px-4 py-3">
                  <Pill
                    tone={
                      d.status === "verifie"
                        ? "succes"
                        : d.status === "refuse" || d.status === "suspendu"
                          ? "danger"
                          : "attente"
                    }
                  >
                    {fr.dossier[d.status]}
                  </Pill>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">{formatDate(d.submittedAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
