import { acceptConditions, reportIncident, submitReview } from "@/app/actions/placement";
import { Icon } from "@/components/icons";
import { ActionForm } from "@/components/ui/action-form";
import { Label, Select, TextArea } from "@/components/ui/field";
import { Notice } from "@/components/ui/notice";
import { Pill } from "@/components/ui/pill";
import { Stars } from "@/components/ui/rating";
import { SubmitButton } from "@/components/ui/submit-button";
import { cn } from "@/lib/cn";
import type { PlacementDetail } from "@/lib/data/placements";
import { formatDate, formatDateTime, formatFcfa, formatRelativeDays, joinFr } from "@/lib/format";
import {
  INCIDENT_CATEGORIES,
  INCIDENT_STATUS_LABELS,
  incidentCategoryLabel,
} from "@/lib/incidents";
import { isReviewable, placementStatusLabel, timelineStages } from "@/lib/placements";
import { guaranteeText } from "@/lib/services/config";

type Viewer = "famille" | "prestataire" | "equipe";

/** Étapes du placement, avec la date de chacune quand elle est connue. */
export function PlacementTimeline({ detail }: { detail: PlacementDetail }) {
  const kind = detail.formula.kind;
  const stages = timelineStages(kind);
  const reached = (stage: string) => {
    const order = [...stages];
    if (detail.status === "annule") return false;
    if (detail.status === "termine") return true;
    return order.indexOf(stage as never) <= order.indexOf(detail.status as never);
  };
  const dateOf: Record<string, Date | string | null> = {
    rencontre_demandee: detail.createdAt,
    rencontre_prevue: detail.meetingAt,
    essai: detail.trialStartedAt,
    confirme: detail.confirmedAt ?? (kind === "ponctuelle" ? detail.startDate : null),
    termine: detail.endedAt,
  };
  if (detail.status === "annule") {
    return (
      <Notice tone="attention" title="Ce placement a été annulé.">
        {detail.endReason}
      </Notice>
    );
  }
  return (
    <ol className="grid gap-0 sm:grid-cols-4">
      {stages.map((stage, i) => {
        const done = reached(stage);
        const current = detail.status === stage;
        const date = dateOf[stage];
        return (
          <li key={stage} className="relative flex gap-3 pb-6 sm:flex-col sm:pr-4 sm:pb-0">
            <span
              className={cn(
                "relative z-10 flex size-9 shrink-0 items-center justify-center rounded-full border-2 font-bold",
                done
                  ? "border-baobab-600 bg-baobab-600 text-white"
                  : "border-trait bg-sable-50 text-gris-700",
                current && "ring-4 ring-baobab-100",
              )}
            >
              {done ? <Icon name="check" size={18} strokeWidth={3} /> : i + 1}
            </span>
            {i < stages.length - 1 && (
              <span
                aria-hidden="true"
                className={cn(
                  "absolute top-9 left-[17px] h-[calc(100%-2.25rem)] w-0.5 sm:top-[17px] sm:left-9 sm:h-0.5 sm:w-[calc(100%-2.25rem)]",
                  reached(stages[i + 1]) ? "bg-baobab-600" : "bg-ligne",
                )}
              />
            )}
            <div>
              <p className={cn("font-bold", !done && "text-gris-700")}>
                {placementStatusLabel(stage, kind)}
              </p>
              {date && done && <p className="text-sm text-gris-700">{formatDate(date)}</p>}
              {current && <span className="sr-only">(étape actuelle)</span>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

export function MeetingBlock({ detail, viewer }: { detail: PlacementDetail; viewer: Viewer }) {
  if (detail.status === "rencontre_demandee") {
    return (
      <Notice
        tone="info"
        title={
          viewer === "prestataire"
            ? "Une famille souhaite vous rencontrer."
            : "Demande de rencontre envoyée."
        }
      >
        {viewer === "prestataire"
          ? "L’équipe Dorwar vous appelle pour fixer le rendez-vous avec vous."
          : "L’équipe Dorwar vous appelle, ainsi que la personne, pour fixer un rendez-vous."}
      </Notice>
    );
  }
  if (detail.status === "rencontre_prevue" && detail.meetingAt) {
    return (
      <div className="flex gap-4 rounded-md border border-ligne bg-white p-5">
        <Icon name="calendrier" size={28} className="shrink-0 text-terre-700" />
        <div>
          <p className="font-bold">Rencontre {formatDateTime(detail.meetingAt)}</p>
          {detail.meetingPlace && <p className="text-gris-700">{detail.meetingPlace}</p>}
          <p className="mt-2 text-sm text-gris-700">
            {viewer === "famille"
              ? "Au moment de la rencontre, scannez la carte Dorwar de la personne pour vérifier qu’elle est active."
              : "Pensez à prendre votre carte Dorwar : la famille peut la scanner."}
          </p>
        </div>
      </div>
    );
  }
  return null;
}

function returnPath(detail: PlacementDetail, viewer: Viewer): string {
  return viewer === "prestataire"
    ? `/espace-prestataire/missions/${detail.id}`
    : `/placements/${detail.id}`;
}

export function ConditionsBlock({ detail, viewer }: { detail: PlacementDetail; viewer: Viewer }) {
  const amount = detail.agreedMonthlyFcfa
    ? `${formatFcfa(detail.agreedMonthlyFcfa)} par mois`
    : detail.agreedDailyFcfa
      ? `${formatFcfa(detail.agreedDailyFcfa)} par jour`
      : null;
  const mine =
    viewer === "famille"
      ? detail.familyAcceptedAt
      : viewer === "prestataire"
        ? detail.workerAcceptedAt
        : null;
  return (
    <section
      aria-labelledby="conditions"
      className="rounded-md border border-ligne bg-white p-5 sm:p-6"
    >
      <h2 id="conditions" className="text-2xl">
        Les conditions convenues
      </h2>
      {!detail.conditions ? (
        <p className="mt-3 text-gris-700">
          L’équipe les écrit avec vous lors de la rencontre : salaire, horaires, repos et congés.
        </p>
      ) : (
        <>
          {amount && (
            <p className="mt-4 flex items-baseline justify-between gap-4 border-b border-ligne pb-4">
              <span className="font-bold">Rémunération</span>
              <span className="font-display text-2xl">{amount}</span>
            </p>
          )}
          {detail.restDays && detail.restDays.length > 0 && (
            <p className="mt-3">
              <span className="font-bold">Repos :</span> {joinFr(detail.restDays)}
            </p>
          )}
          <div className="mt-3 whitespace-pre-line text-gris-700">{detail.conditions}</div>
          <ul className="mt-5 space-y-2 border-t border-ligne pt-4 text-sm">
            <li className="flex items-center gap-2">
              <Icon
                name={detail.familyAcceptedAt ? "checkCircle" : "horloge"}
                size={20}
                className={detail.familyAcceptedAt ? "text-baobab-700" : "text-gris-700"}
              />
              {detail.family.displayName} :{" "}
              {detail.familyAcceptedAt
                ? `accepté le ${formatDate(detail.familyAcceptedAt)}`
                : "pas encore accepté"}
            </li>
            <li className="flex items-center gap-2">
              <Icon
                name={detail.workerAcceptedAt ? "checkCircle" : "horloge"}
                size={20}
                className={detail.workerAcceptedAt ? "text-baobab-700" : "text-gris-700"}
              />
              {detail.worker.firstName} {detail.worker.lastInitial}. :{" "}
              {detail.workerAcceptedAt
                ? `accepté le ${formatDate(detail.workerAcceptedAt)}`
                : "pas encore accepté"}
            </li>
          </ul>
          {viewer !== "equipe" && !mine && (
            <ActionForm action={acceptConditions} className="mt-5">
              <input type="hidden" name="placement" value={detail.id} />
              <input type="hidden" name="retour" value={returnPath(detail, viewer)} />
              <SubmitButton variant="success" full pendingLabel="Enregistrement…" icon="check">
                J’accepte ces conditions
              </SubmitButton>
            </ActionForm>
          )}
        </>
      )}
    </section>
  );
}

export function GuaranteeBlock({ detail }: { detail: PlacementDetail }) {
  const guarantee = detail.service.config.guarantees[detail.formula.key];
  return (
    <section aria-labelledby="garantie" className="rounded-md bg-sable-100 p-5 sm:p-6">
      <h2 id="garantie" className="flex items-center gap-2 text-2xl">
        <Icon name="bouclier" size={26} className="text-baobab-700" />
        Garantie et suivi
      </h2>
      {detail.guaranteeEndsAt ? (
        <p className="mt-3 font-bold">Garantie jusqu’au {formatDate(detail.guaranteeEndsAt)}</p>
      ) : (
        <p className="mt-3 font-bold">
          La garantie commence avec {detail.formula.kind === "longue" ? "l’essai" : "la mission"}.
        </p>
      )}
      {guarantee && <p className="mt-1 text-gris-700">{guaranteeText(guarantee)}</p>}
      {detail.formula.kind === "longue" && (
        <p className="mt-4 flex items-start gap-2">
          <Icon
            name={detail.followUpDoneAt ? "checkCircle" : "phone"}
            size={22}
            className={cn(
              "mt-0.5 shrink-0",
              detail.followUpDoneAt ? "text-baobab-700" : "text-indigo-900",
            )}
          />
          <span>
            {detail.followUpDoneAt
              ? `Appel de suivi fait le ${formatDate(detail.followUpDoneAt)}.`
              : detail.followUpDueAt
                ? `Appel de suivi de l’équipe prévu ${formatRelativeDays(detail.followUpDueAt)} (${formatDate(detail.followUpDueAt)}).`
                : "L’équipe appelle après la première semaine, des deux côtés."}
          </span>
        </p>
      )}
    </section>
  );
}

export function ReviewBlock({
  detail,
  viewerId,
  viewer,
}: {
  detail: PlacementDetail;
  viewerId: string;
  viewer: Viewer;
}) {
  const mine = detail.reviews.find((r) => r.authorId === viewerId);
  const target =
    viewer === "famille"
      ? `${detail.worker.firstName} ${detail.worker.lastInitial}.`
      : detail.family.displayName;
  if (mine) {
    return (
      <section
        aria-labelledby="avis"
        className="rounded-md border border-ligne bg-white p-5 sm:p-6"
      >
        <h2 id="avis" className="text-2xl">
          Votre avis
        </h2>
        <div className="mt-3 flex items-center gap-3">
          <Stars value={mine.rating} />
          <span className="text-sm text-gris-700">le {formatDate(mine.createdAt)}</span>
        </div>
        <p className="mt-2">{mine.comment}</p>
      </section>
    );
  }
  if (!isReviewable(detail.status) || viewer === "equipe") return null;
  return (
    <section aria-labelledby="avis" className="rounded-md border border-ligne bg-white p-5 sm:p-6">
      <h2 id="avis" className="text-2xl">
        Votre avis sur {target}
      </h2>
      <p className="mt-2 text-gris-700">
        {viewer === "famille"
          ? "Il sera visible par tous sur son profil, signé « Une famille » et votre quartier, sans votre nom. Il aidera les prochaines familles."
          : "Il reste entre vous et l’équipe Dorwar : il nous aide à protéger celles et ceux que nous suivons."}
      </p>
      <ActionForm action={submitReview} className="mt-5 space-y-5" resetOnSuccess>
        <input type="hidden" name="placement" value={detail.id} />
        <input type="hidden" name="retour" value={returnPath(detail, viewer)} />
        <fieldset>
          <legend className="mb-2 font-bold">Votre note</legend>
          <div className="flex flex-wrap gap-2">
            {[1, 2, 3, 4, 5].map((n) => (
              <label
                key={n}
                className="inline-flex min-h-12 min-w-14 cursor-pointer items-center justify-center gap-1 rounded-sm border-[1.5px] border-trait bg-white px-3 font-bold has-checked:border-indigo-900 has-checked:bg-indigo-900 has-checked:text-sable-50 has-focus-visible:outline-3 has-focus-visible:outline-offset-2 has-focus-visible:outline-indigo-900"
              >
                <input type="radio" name="note" value={n} required className="sr-only" />
                {n}
                <Icon name="etoile" size={18} strokeWidth={1.6} />
              </label>
            ))}
          </div>
        </fieldset>
        <div>
          <Label htmlFor={`commentaire-${detail.id}`}>En quelques mots</Label>
          <TextArea
            id={`commentaire-${detail.id}`}
            name="commentaire"
            required
            minLength={10}
            maxLength={800}
            rows={4}
          />
        </div>
        <SubmitButton pendingLabel="Envoi…">Publier mon avis</SubmitButton>
      </ActionForm>
    </section>
  );
}

export function IncidentBlock({ detail, viewerId }: { detail: PlacementDetail; viewerId: string }) {
  const mine = detail.incidents.filter((i) => i.reporterId === viewerId);
  return (
    <section
      aria-labelledby="signaler"
      className="rounded-md border-[1.5px] border-rouge-700/40 bg-white p-5 sm:p-6"
    >
      <h2 id="signaler" className="flex items-center gap-2 text-2xl">
        <Icon name="signaler" size={26} className="text-rouge-700" />
        Signaler un problème
      </h2>
      <p className="mt-2 text-gris-700">
        Retard, manque de respect, salaire, sécurité : dites-le nous. Chaque signalement est lu et
        suivi par l’équipe.
      </p>
      {mine.length > 0 && (
        <ul className="mt-4 space-y-2">
          {mine.map((i) => (
            <li
              key={i.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-sm bg-sable-100 px-3 py-2 text-sm"
            >
              <span>
                {incidentCategoryLabel(i.category)} · {formatDate(i.createdAt)}
              </span>
              <Pill tone={i.status === "resolu" ? "succes" : "attente"}>
                {INCIDENT_STATUS_LABELS[i.status]}
              </Pill>
            </li>
          ))}
        </ul>
      )}
      <details className="group mt-4">
        <summary className="inline-flex min-h-12 items-center gap-2 rounded-sm border-[1.5px] border-rouge-700 px-4 font-bold text-rouge-700 hover:bg-rouge-100">
          <Icon name="signaler" size={20} />
          Signaler un problème
          <Icon
            name="chevronDown"
            size={18}
            className="transition-transform group-open:rotate-180"
          />
        </summary>
        <ActionForm
          action={reportIncident}
          className="mt-5 space-y-5"
          successTitle="Signalement envoyé."
          resetOnSuccess
        >
          <input type="hidden" name="placement" value={detail.id} />
          <div>
            <Label htmlFor={`categorie-${detail.id}`}>De quoi s’agit-il ?</Label>
            <Select id={`categorie-${detail.id}`} name="categorie" required defaultValue="">
              <option value="" disabled>
                Choisir…
              </option>
              {INCIDENT_CATEGORIES.map((c) => (
                <option key={c.key} value={c.key}>
                  {c.label}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor={`description-${detail.id}`}>Que s’est-il passé ?</Label>
            <TextArea
              id={`description-${detail.id}`}
              name="description"
              required
              minLength={10}
              maxLength={1500}
              rows={4}
            />
          </div>
          <SubmitButton variant="danger" pendingLabel="Envoi…">
            Envoyer le signalement
          </SubmitButton>
        </ActionForm>
      </details>
    </section>
  );
}
