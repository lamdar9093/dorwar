import type { Metadata } from "next";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { areas, services, waitlist } from "@/db/schema";
import { ActionForm } from "@/components/ui/action-form";
import { EmptyState } from "@/components/ui/empty-state";
import { Pill } from "@/components/ui/pill";
import { SubmitButton } from "@/components/ui/submit-button";
import { describeArea } from "@/lib/areas";
import { requireSpace } from "@/lib/auth/guards";
import { formatDate, formatPhone } from "@/lib/format";
import { markNotified } from "../actions";

export const metadata: Metadata = { title: "Liste d’attente" };

export default async function WaitlistPage() {
  await requireSpace("admin", "/admin/attente");
  const rows = await db
    .select({ w: waitlist, areaName: areas.name, serviceName: services.name })
    .from(waitlist)
    .innerJoin(areas, eq(areas.id, waitlist.areaId))
    .leftJoin(services, eq(services.id, waitlist.serviceId))
    .orderBy(desc(waitlist.createdAt));
  const labels = new Map(
    await Promise.all(
      [...new Set(rows.map((r) => r.w.areaId))].map(
        async (id) => [id, await describeArea(id)] as const,
      ),
    ),
  );

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-4xl">Liste d’attente</h1>
      <p className="mt-2 text-gris-700">
        Des familles qui cherchent dans une zone sans profil vérifié. Utile pour décider quelle zone
        ouvrir ensuite.
      </p>
      {rows.length === 0 ? (
        <div className="mt-8">
          <EmptyState icon="horloge" title="Personne en attente." />
        </div>
      ) : (
        <ul className="mt-8 space-y-3">
          {rows.map(({ w, serviceName }) => (
            <li
              key={w.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-ligne bg-white p-4"
            >
              <div>
                <p className="font-bold">{labels.get(w.areaId)}</p>
                <p className="text-sm text-gris-700">
                  {formatPhone(w.phone)} · {serviceName ?? "—"} · le {formatDate(w.createdAt)}
                </p>
              </div>
              {w.notifiedAt ? (
                <Pill tone="succes">Prévenu le {formatDate(w.notifiedAt)}</Pill>
              ) : (
                <ActionForm action={markNotified}>
                  <input type="hidden" name="inscrit" value={w.id} />
                  <SubmitButton variant="secondary" pendingLabel="…">
                    Marquer comme prévenu
                  </SubmitButton>
                </ActionForm>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
