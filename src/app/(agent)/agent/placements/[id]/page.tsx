import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Icon } from "@/components/icons";
import {
  ConditionsBlock,
  GuaranteeBlock,
  PlacementTimeline,
} from "@/components/placement/placement-blocks";
import { ActionForm } from "@/components/ui/action-form";
import { ExternalButton } from "@/components/ui/button";
import { FlashNotice } from "@/components/ui/flash-notice";
import { Hint, Label, Select, TextArea, TextInput } from "@/components/ui/field";
import { Notice } from "@/components/ui/notice";
import { Pill } from "@/components/ui/pill";
import { SubmitButton } from "@/components/ui/submit-button";
import { requireSpace } from "@/lib/auth/guards";
import { getPlacementDetail } from "@/lib/data/placements";
import { draftConditions, summarizeAnswers } from "@/lib/form-engine/summary";
import { formatDate, formatPhone, todayIso } from "@/lib/format";
import { incidentCategoryLabel, INCIDENT_STATUS_LABELS } from "@/lib/incidents";
import { allowedTransitions, placementStatusLabel } from "@/lib/placements";
import { guaranteeText } from "@/lib/services/config";
import {
  confirmPlacement,
  endPlacement,
  recordFollowUp,
  scheduleMeeting,
  startTrial,
  updateConditions,
} from "../actions";

export const metadata: Metadata = { title: "Placement" };

export default async function AgentPlacementPage({
  params,
  searchParams,
}: PageProps<"/agent/placements/[id]">) {
  const { id } = await params;
  const query = await searchParams;
  await requireSpace("agent", `/agent/placements/${id}`);
  const detail = await getPlacementDetail(id);
  if (!detail) notFound();

  const { formula, service } = detail;
  const formulas = service.config.formulas.map((f) => ({ key: f.key, label: f.label }));
  const summary = summarizeAnswers(service.config.needForm, detail.requestAnswers, { formulas });
  const guarantee = service.config.guarantees[formula.key];
  const draft =
    detail.conditions ??
    [
      draftConditions(service.config.needForm, detail.requestAnswers, { formulas }),
      guarantee ? `Garantie Dorwar : ${guaranteeText(guarantee)}` : null,
    ]
      .filter(Boolean)
      .join("\n");
  const answers = detail.requestAnswers;
  const proposedPay =
    Number(formula.pay === "mensuel" ? answers.salaire : answers.tarif_journalier) || "";
  const next = allowedTransitions(detail.status, formula.kind);
  const missionStart =
    typeof answers.mission_debut === "string" ? answers.mission_debut : todayIso();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link
        href="/agent/suivis"
        className="inline-flex min-h-12 items-center gap-2 font-bold text-indigo-900"
      >
        <Icon name="arrowLeft" size={20} />
        Suivis
      </Link>
      <FlashNotice value={query.ok} />
      <header>
        <p className="eyebrow text-terre-700">
          {service.name} · {formula.label}
        </p>
        <h1 className="mt-2 text-3xl">
          {detail.family.displayName} · {detail.worker.firstName} {detail.worker.lastName}
        </h1>
        <div className="mt-2">
          <Pill
            tone={
              detail.status === "annule"
                ? "danger"
                : detail.status === "confirme"
                  ? "succes"
                  : "attente"
            }
          >
            {placementStatusLabel(detail.status, formula.kind)}
          </Pill>
        </div>
      </header>

      <div className="grid gap-3 sm:grid-cols-2">
        {[
          {
            who: detail.family.displayName,
            sub: detail.family.areaName ?? "",
            phone: detail.family.phone,
          },
          {
            who: `${detail.worker.firstName} ${detail.worker.lastName}`,
            sub: `${detail.worker.areaName} · carte ${detail.worker.cardId}`,
            phone: detail.worker.phone,
          },
        ].map((party) => (
          <div key={party.phone} className="rounded-md border border-ligne bg-white p-4">
            <p className="font-bold">{party.who}</p>
            <p className="text-sm text-gris-700">{party.sub}</p>
            <ExternalButton
              href={`tel:${party.phone}`}
              variant="success"
              icon="phone"
              full
              className="mt-3"
            >
              {formatPhone(party.phone)}
            </ExternalButton>
          </div>
        ))}
      </div>

      <PlacementTimeline detail={detail} />

      {detail.familyMessage && (
        <Notice tone="info" title="Message de la famille">
          {detail.familyMessage}
        </Notice>
      )}

      {detail.status === "rencontre_demandee" && (
        <section
          className="rounded-md border-[1.5px] border-indigo-900 bg-white p-4 sm:p-6"
          aria-labelledby="fixer"
        >
          <h2 id="fixer" className="text-2xl">
            Fixer la rencontre
          </h2>
          <p className="mt-1 text-gris-700">
            Après avoir appelé les deux côtés. Les conditions sont préremplies d’après la demande :
            relisez-les.
          </p>
          <ActionForm action={scheduleMeeting} className="mt-5 space-y-5">
            <input type="hidden" name="placement" value={detail.id} />
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="rencontre">Date et heure</Label>
                <TextInput id="rencontre" name="rencontre" type="datetime-local" required />
              </div>
              <div>
                <Label htmlFor="lieu">Lieu</Label>
                <TextInput
                  id="lieu"
                  name="lieu"
                  placeholder={`Chez la famille, à ${detail.family.areaName ?? "…"}`}
                  maxLength={160}
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="remuneration">
                  {formula.pay === "mensuel"
                    ? "Salaire convenu (FCFA par mois)"
                    : "Tarif convenu (FCFA par jour)"}
                </Label>
                <TextInput
                  id="remuneration"
                  name="remuneration"
                  inputMode="numeric"
                  defaultValue={proposedPay}
                />
              </div>
              <div>
                <Label htmlFor="debut">
                  {formula.kind === "ponctuelle" ? "Premier jour de mission" : "Début prévu"}
                </Label>
                <TextInput
                  id="debut"
                  name="debut"
                  type="date"
                  defaultValue={
                    formula.kind === "ponctuelle"
                      ? missionStart
                      : typeof answers.debut === "string"
                        ? answers.debut
                        : ""
                  }
                />
              </div>
            </div>
            <div>
              <Label htmlFor="conditions">Conditions écrites</Label>
              <TextArea
                id="conditions"
                name="conditions"
                defaultValue={draft}
                rows={9}
                maxLength={3000}
              />
              <Hint>
                La famille et la personne les liront et les accepteront chacune dans leur espace.
              </Hint>
            </div>
            <SubmitButton size="lg" full icon="calendrier" pendingLabel="Enregistrement…">
              Fixer la rencontre
            </SubmitButton>
          </ActionForm>
        </section>
      )}

      {detail.status !== "rencontre_demandee" && (
        <ConditionsBlock detail={detail} viewer="equipe" />
      )}

      {(detail.status === "rencontre_prevue" || detail.status === "essai") && (
        <details className="group rounded-md border border-ligne bg-white">
          <summary className="flex min-h-14 items-center justify-between px-4 font-bold">
            Modifier les conditions
            <Icon
              name="chevronDown"
              size={20}
              className="transition-transform group-open:rotate-180"
            />
          </summary>
          <ActionForm action={updateConditions} className="space-y-4 border-t border-ligne p-4">
            <input type="hidden" name="placement" value={detail.id} />
            <div>
              <Label htmlFor="remuneration-maj">
                {formula.pay === "mensuel"
                  ? "Salaire convenu (FCFA par mois)"
                  : "Tarif convenu (FCFA par jour)"}
              </Label>
              <TextInput
                id="remuneration-maj"
                name="remuneration"
                inputMode="numeric"
                defaultValue={
                  (formula.pay === "mensuel" ? detail.agreedMonthlyFcfa : detail.agreedDailyFcfa) ??
                  ""
                }
              />
            </div>
            <div>
              <Label htmlFor="conditions-maj">Conditions écrites</Label>
              <TextArea
                id="conditions-maj"
                name="conditions"
                defaultValue={detail.conditions ?? draft}
                rows={8}
                maxLength={3000}
              />
            </div>
            <SubmitButton variant="secondary" pendingLabel="Enregistrement…">
              Enregistrer
            </SubmitButton>
          </ActionForm>
        </details>
      )}

      {next.includes("essai") && (
        <section className="rounded-md border-[1.5px] border-indigo-900 bg-white p-4 sm:p-6">
          <h2 className="text-2xl">Démarrer l’essai</h2>
          <p className="mt-1 text-gris-700">
            La garantie commence ce jour-là ; l’appel de suivi est planifié une semaine après.
          </p>
          {(!detail.familyAcceptedAt || !detail.workerAcceptedAt) && (
            <Notice
              tone="attention"
              className="mt-4"
              title="Conditions pas encore acceptées des deux côtés."
            >
              Vous pouvez démarrer l’essai, mais demandez à chacun de les accepter dans son espace.
            </Notice>
          )}
          <ActionForm action={startTrial} className="mt-4 space-y-4">
            <input type="hidden" name="placement" value={detail.id} />
            <div className="max-w-xs">
              <Label htmlFor="debut-essai">Premier jour</Label>
              <TextInput
                id="debut-essai"
                name="debut"
                type="date"
                defaultValue={detail.startDate ?? todayIso()}
                required
              />
            </div>
            <SubmitButton variant="success" size="lg" full pendingLabel="…">
              Démarrer l’essai
            </SubmitButton>
          </ActionForm>
        </section>
      )}

      {next.includes("confirme") && (
        <section className="rounded-md border-[1.5px] border-indigo-900 bg-white p-4 sm:p-6">
          <h2 className="text-2xl">
            {formula.kind === "longue" ? "Confirmer le placement" : "Confirmer la mission"}
          </h2>
          <ActionForm action={confirmPlacement} className="mt-4 space-y-4">
            <input type="hidden" name="placement" value={detail.id} />
            {formula.kind === "ponctuelle" && (
              <div className="grid max-w-md gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="debut-mission">Premier jour</Label>
                  <TextInput
                    id="debut-mission"
                    name="debut"
                    type="date"
                    defaultValue={detail.startDate ?? missionStart}
                  />
                </div>
                <div>
                  <Label htmlFor="fin-mission">Dernier jour</Label>
                  <TextInput
                    id="fin-mission"
                    name="fin"
                    type="date"
                    defaultValue={detail.endDate ?? detail.startDate ?? missionStart}
                  />
                </div>
              </div>
            )}
            <SubmitButton variant="success" size="lg" full icon="check" pendingLabel="…">
              {formula.kind === "longue" ? "Confirmer le placement" : "Confirmer la mission"}
            </SubmitButton>
          </ActionForm>
        </section>
      )}

      {(detail.status === "essai" || detail.status === "confirme") && formula.kind === "longue" && (
        <section className="rounded-md border border-ligne bg-white p-4 sm:p-6">
          <h2 className="flex items-center gap-2 text-2xl">
            <Icon name="phone" size={24} className="text-terre-700" /> Appel de suivi
          </h2>
          {detail.followUpDoneAt ? (
            <p className="mt-3">
              Fait le {formatDate(detail.followUpDoneAt)} :{" "}
              <span className="text-gris-700">{detail.followUpNotes}</span>
            </p>
          ) : (
            <ActionForm action={recordFollowUp} className="mt-3 space-y-3">
              <input type="hidden" name="placement" value={detail.id} />
              <p className="text-gris-700">
                Prévu le {detail.followUpDueAt ? formatDate(detail.followUpDueAt) : "—"}. Appelez la
                famille puis la personne : salaire versé, repos respectés, entente.
              </p>
              <Label htmlFor="notes-suivi">Ce qui ressort de l’appel</Label>
              <TextArea id="notes-suivi" name="notes" required minLength={5} rows={3} />
              <SubmitButton variant="success" icon="check" pendingLabel="…">
                Appel fait
              </SubmitButton>
            </ActionForm>
          )}
        </section>
      )}

      <GuaranteeBlock detail={detail} />

      {(next.includes("termine") || next.includes("annule")) && (
        <details className="group rounded-md border border-rouge-700/40 bg-white">
          <summary className="flex min-h-14 items-center justify-between px-4 font-bold text-rouge-700">
            Mettre fin, remplacer ou annuler
            <Icon
              name="chevronDown"
              size={20}
              className="transition-transform group-open:rotate-180"
            />
          </summary>
          <ActionForm action={endPlacement} className="space-y-4 border-t border-ligne p-4">
            <input type="hidden" name="placement" value={detail.id} />
            <div>
              <Label htmlFor="mode">Que se passe-t-il ?</Label>
              <Select
                id="mode"
                name="mode"
                defaultValue={next.includes("termine") ? "terminer" : "annuler"}
              >
                {next.includes("termine") && (
                  <option value="terminer">Le placement se termine</option>
                )}
                {next.includes("termine") && detail.status === "essai" && (
                  <option value="garantie">Ça ne colle pas : remplacement (garantie)</option>
                )}
                {next.includes("annule") && <option value="annuler">Annuler</option>}
              </Select>
            </div>
            <div>
              <Label htmlFor="motif-fin">Motif</Label>
              <TextArea id="motif-fin" name="motif" required minLength={5} rows={3} />
            </div>
            <SubmitButton variant="danger" pendingLabel="…">
              Confirmer
            </SubmitButton>
          </ActionForm>
        </details>
      )}

      {detail.incidents.length > 0 && (
        <section className="rounded-md border border-ligne bg-white p-4 sm:p-6">
          <h2 className="text-2xl">Signalements</h2>
          <ul className="mt-3 space-y-3">
            {detail.incidents.map((i) => (
              <li key={i.id} className="rounded-sm bg-sable-100 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-bold">{incidentCategoryLabel(i.category)}</span>
                  <Pill tone={i.status === "resolu" ? "succes" : "attente"}>
                    {INCIDENT_STATUS_LABELS[i.status]}
                  </Pill>
                </div>
                <p className="mt-1 text-sm">{i.description}</p>
                <p className="mt-1 text-xs text-gris-700">{formatDate(i.createdAt)}</p>
              </li>
            ))}
          </ul>
        </section>
      )}

      <details className="group rounded-md border border-ligne bg-white">
        <summary className="flex min-h-14 items-center justify-between px-4 font-bold">
          La demande de la famille
          <Icon
            name="chevronDown"
            size={20}
            className="transition-transform group-open:rotate-180"
          />
        </summary>
        <dl className="space-y-2 border-t border-ligne p-4 text-sm">
          {summary.map((line) => (
            <div key={line.key}>
              <dt className="font-bold">{line.label}</dt>
              <dd className="text-gris-700">{line.value}</dd>
            </div>
          ))}
        </dl>
      </details>
    </div>
  );
}
