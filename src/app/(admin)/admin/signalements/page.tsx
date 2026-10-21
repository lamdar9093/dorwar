import type { Metadata } from "next";
import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { db } from "@/db/client";
import { familyProfiles, incidents, placements, users, workerProfiles } from "@/db/schema";
import { ActionForm } from "@/components/ui/action-form";
import { EmptyState } from "@/components/ui/empty-state";
import { Label, Select, TextArea } from "@/components/ui/field";
import { Pill } from "@/components/ui/pill";
import { SubmitButton } from "@/components/ui/submit-button";
import { requireSpace } from "@/lib/auth/guards";
import { formatDateTime, formatPhone } from "@/lib/format";
import { incidentCategoryLabel, INCIDENT_STATUS_LABELS } from "@/lib/incidents";
import { updateIncident } from "../actions";

export const metadata: Metadata = { title: "Signalements" };

const reporters = alias(users, "reporters");

export default async function IncidentsPage() {
  await requireSpace("admin", "/admin/signalements");
  const rows = await db
    .select({
      i: incidents,
      reporterPhone: reporters.phone,
      reporterRole: reporters.role,
      familyName: familyProfiles.displayName,
      workerFirstName: workerProfiles.firstName,
      workerLastName: workerProfiles.lastName,
    })
    .from(incidents)
    .innerJoin(reporters, eq(reporters.id, incidents.reporterId))
    .leftJoin(placements, eq(placements.id, incidents.placementId))
    .leftJoin(familyProfiles, eq(familyProfiles.userId, placements.familyUserId))
    .leftJoin(workerProfiles, eq(workerProfiles.id, placements.workerProfileId))
    .orderBy(incidents.status, desc(incidents.createdAt));

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-4xl">Signalements</h1>
      <p className="mt-2 text-gris-700">
        Chaque signalement reçoit une réponse : on appelle la personne qui l’a fait, puis l’autre
        partie.
      </p>
      {rows.length === 0 ? (
        <div className="mt-8">
          <EmptyState icon="checkCircle" title="Aucun signalement." />
        </div>
      ) : (
        <ul className="mt-8 space-y-4">
          {rows.map(({ i, ...r }) => (
            <li
              key={i.id}
              className={`rounded-md border bg-white p-5 ${i.status === "resolu" ? "border-ligne" : "border-rouge-700/40"}`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-lg font-bold">{incidentCategoryLabel(i.category)}</p>
                  <p className="text-sm text-gris-700">
                    {formatDateTime(i.createdAt)} · signalé par{" "}
                    {r.reporterRole === "famille" ? "la famille" : "la personne accueillie"} (
                    {formatPhone(r.reporterPhone)})
                  </p>
                  {i.placementId && (
                    <Link
                      href={`/agent/placements/${i.placementId}`}
                      className="text-sm font-bold underline"
                    >
                      {r.familyName} · {r.workerFirstName} {r.workerLastName}
                    </Link>
                  )}
                </div>
                <Pill
                  tone={
                    i.status === "resolu"
                      ? "succes"
                      : i.status === "en_cours"
                        ? "attente"
                        : "danger"
                  }
                >
                  {INCIDENT_STATUS_LABELS[i.status]}
                </Pill>
              </div>
              <p className="mt-3 rounded-sm bg-sable-100 p-3">{i.description}</p>
              <ActionForm
                action={updateIncident}
                className="mt-4 grid gap-3 sm:grid-cols-[12rem_1fr]"
              >
                <input type="hidden" name="signalement" value={i.id} />
                <div>
                  <Label htmlFor={`statut-${i.id}`}>Statut</Label>
                  <Select id={`statut-${i.id}`} name="statut" defaultValue={i.status}>
                    <option value="ouvert">Reçu</option>
                    <option value="en_cours">En cours</option>
                    <option value="resolu">Résolu</option>
                  </Select>
                </div>
                <div>
                  <Label htmlFor={`notes-${i.id}`}>Suivi de l’équipe</Label>
                  <TextArea
                    id={`notes-${i.id}`}
                    name="notes"
                    defaultValue={i.adminNotes ?? ""}
                    rows={2}
                  />
                </div>
                <div className="sm:col-span-2">
                  <SubmitButton variant="secondary" pendingLabel="…">
                    Enregistrer
                  </SubmitButton>
                </div>
              </ActionForm>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
