import type { Metadata } from "next";
import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { accessLogs, documents, users, workerProfiles, workerServices } from "@/db/schema";
import { requireSpace } from "@/lib/auth/guards";
import { formatDateTime } from "@/lib/format";

export const metadata: Metadata = { title: "Journal des accès" };

const ACTIONS: Record<string, string> = {
  consultation: "Consultation d’un document",
  televersement: "Ajout d’un document",
  suppression: "Suppression d’un document",
  ouverture_dossier: "Ouverture du dossier",
};

export default async function AccessLogPage() {
  await requireSpace("admin", "/admin/journal");
  const rows = await db
    .select({
      id: accessLogs.id,
      at: accessLogs.at,
      action: accessLogs.action,
      ip: accessLogs.ip,
      userName: users.name,
      userPhone: users.phone,
      documentLabel: documents.label,
      firstName: workerProfiles.firstName,
      lastName: workerProfiles.lastName,
      dossierId: workerServices.id,
    })
    .from(accessLogs)
    .innerJoin(users, eq(users.id, accessLogs.userId))
    .leftJoin(documents, eq(documents.id, accessLogs.documentId))
    .leftJoin(workerProfiles, eq(workerProfiles.id, accessLogs.workerProfileId))
    .leftJoin(workerServices, eq(workerServices.workerProfileId, workerProfiles.id))
    .orderBy(desc(accessLogs.at))
    .limit(300);

  return (
    <div>
      <h1 className="text-4xl">Journal des accès</h1>
      <p className="mt-2 text-gris-700">
        Qui a ouvert quel dossier ou consulté quel document, et quand. Les entrées ne peuvent pas
        être modifiées depuis l’application.
      </p>
      <div className="mt-6 overflow-x-auto rounded-md border border-ligne bg-white">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-ligne bg-sable-100">
            <tr>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Membre de l’équipe</th>
              <th className="px-4 py-3">Action</th>
              <th className="px-4 py-3">Dossier</th>
              <th className="px-4 py-3">Document</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b border-ligne last:border-0">
                <td className="px-4 py-3 whitespace-nowrap">{formatDateTime(r.at)}</td>
                <td className="px-4 py-3">{r.userName ?? r.userPhone}</td>
                <td className="px-4 py-3">{ACTIONS[r.action] ?? r.action}</td>
                <td className="px-4 py-3">
                  {r.dossierId ? (
                    <Link href={`/agent/dossiers/${r.dossierId}`} className="underline">
                      {r.firstName} {r.lastName}
                    </Link>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="px-4 py-3">{r.documentLabel ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
