"use client";

import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import { Icon } from "@/components/icons";
import { Notice } from "@/components/ui/notice";
import { SubmitButton } from "@/components/ui/submit-button";
import { cn } from "@/lib/cn";
import { checkStep } from "@/lib/form-engine/client-check";
import type { Answers } from "@/lib/form-engine/constants";
import type { FormStep, NeedForm } from "@/lib/form-engine/schema";
import { summarizeAnswers } from "@/lib/form-engine/summary";
import { findField, pruneAnswers, visibleFields, visibleSteps } from "@/lib/form-engine/visibility";
import { formatFcfa } from "@/lib/format";
import { useHydrated } from "@/lib/use-hydrated";
import { submitNeed, type NeedState } from "../actions";
import { FieldRenderer, type FieldContext } from "./fields";
import type { LocationValue } from "./location-field";

type Props = {
  slug: string;
  /** Personne repérée dans la vitrine, proposée juste après l'envoi si elle correspond. */
  profileId?: string;
  form: NeedForm;
  ctx: FieldContext;
  fees: Record<string, { amountFcfa: number; label: string }>;
};

const RECAP: FormStep = {
  key: "recapitulatif",
  title: "Votre demande, en un coup d’œil",
  fields: [{ type: "info", key: "_", label: "", body: "" }],
};

function draftKey(slug: string) {
  return `dorwar-demande-${slug}`;
}

/** Libellé du lieu pour le récapitulatif (le champ ne contient que des identifiants). */
function locationLabel(value: LocationValue | undefined, ctx: FieldContext): string {
  if (!value) return "";
  if (value.mode === "zone") return value.label ?? "Zone choisie";
  const radius = `dans un rayon de ${value.radiusKm} km`;
  if (value.lat !== undefined) return `Autour de votre position, ${radius}`;
  const option = ctx.areaGroups.flatMap((g) => g.options).find((o) => o.id === value.areaId);
  return option ? `${option.label}, ${radius}` : "";
}

export function NeedWizard({ slug, profileId, form, ctx, fees }: Props) {
  const [answers, setAnswers] = useState<Answers>({});
  const [index, setIndex] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [restored, setRestored] = useState(false);
  const [state, formAction] = useActionState<NeedState, FormData>(submitNeed, null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const hydrated = useHydrated();

  const steps = useMemo(() => [...visibleSteps(form, answers), RECAP], [form, answers]);
  const current = steps[Math.min(index, steps.length - 1)];
  const isRecap = current.key === RECAP.key;

  // Brouillon : les réponses survivent à un rechargement ou à une coupure de connexion.
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(draftKey(slug));
      if (saved) {
        const parsed = JSON.parse(saved) as { answers?: Answers };
        if (parsed.answers && Object.keys(parsed.answers).length) {
          // eslint-disable-next-line react-hooks/set-state-in-effect -- restauration unique au montage
          setAnswers(parsed.answers);
          setRestored(true);
        }
      }
    } catch {
      // Stockage indisponible (navigation privée) : le formulaire fonctionne sans brouillon.
    }
  }, [slug]);

  useEffect(() => {
    try {
      if (Object.keys(answers).length)
        window.localStorage.setItem(draftKey(slug), JSON.stringify({ answers }));
    } catch {
      // Sans stockage local, rien à faire.
    }
  }, [answers, slug]);

  // Erreurs renvoyées par le serveur : on revient à la première étape concernée.
  useEffect(() => {
    if (!state?.fieldErrors) return;
    const keys = Object.keys(state.fieldErrors);
    if (!keys.length) return;
    const target = steps.findIndex((s) => s.fields.some((f) => keys.includes(f.key)));
    // eslint-disable-next-line react-hooks/set-state-in-effect -- synchronisation avec la réponse du serveur
    setErrors(state.fieldErrors);
    if (target >= 0) setIndex(target);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  useEffect(() => {
    titleRef.current?.focus();
  }, [index]);

  const setValue = (key: string, value: unknown) => {
    setAnswers((prev) => pruneAnswers(form, { ...prev, [key]: value }));
    setErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const next = () => {
    const stepErrors = checkStep(current, answers);
    setErrors(stepErrors);
    if (Object.keys(stepErrors).length) return;
    setIndex((i) => Math.min(i + 1, steps.length - 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const back = () => {
    setErrors({});
    setIndex((i) => Math.max(i - 1, 0));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const restart = () => {
    setAnswers({});
    setIndex(0);
    setRestored(false);
    try {
      window.localStorage.removeItem(draftKey(slug));
    } catch {
      // ignoré
    }
  };

  const formulaFieldKey = findField(form, "formula")?.key ?? "formule";
  const locationFieldKey = findField(form, "location")?.key ?? "lieu";
  const fee =
    typeof answers[formulaFieldKey] === "string"
      ? fees[answers[formulaFieldKey] as string]
      : undefined;
  const progress = Math.round(((index + 1) / steps.length) * 100);

  const summary = isRecap
    ? summarizeAnswers(form, answers, {
        formulas: ctx.formulas,
        locationLabel: locationLabel(answers[locationFieldKey] as LocationValue | undefined, ctx),
      })
    : [];

  return (
    <div className="mx-auto max-w-2xl">
      <div className="sticky top-0 z-10 -mx-4 bg-sable-50/95 px-4 pt-3 pb-4 backdrop-blur-[2px] sm:mx-0 sm:px-0">
        <div className="flex items-center justify-between text-sm text-gris-700">
          <span>
            Étape {index + 1} sur {steps.length}
          </span>
          {restored && index === 0 && (
            <button
              type="button"
              onClick={restart}
              className="min-h-10 font-bold text-indigo-900 underline"
            >
              Recommencer
            </button>
          )}
        </div>
        <div
          className="mt-2 h-1.5 overflow-hidden rounded-full bg-sable-200"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={progress}
          aria-label="Progression"
        >
          <div
            className="h-full rounded-full bg-terre-600 transition-[width] duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {restored && index === 0 && (
        <Notice tone="info" className="mt-2" title="Nous avons gardé vos réponses précédentes.">
          Vous pouvez continuer là où vous en étiez, ou recommencer.
        </Notice>
      )}

      <h2 ref={titleRef} tabIndex={-1} className="mt-6 text-3xl outline-none sm:text-4xl">
        {current.title}
      </h2>
      {current.intro && <p className="mt-3 text-lg text-gris-700">{current.intro}</p>}

      {!isRecap ? (
        <fieldset
          disabled={!hydrated}
          // min-w-0 : un fieldset refuse sinon d'être plus étroit que son contenu (débordement mobile).
          className="mt-8 min-w-0 space-y-8 disabled:opacity-60"
          key={current.key}
        >
          {visibleFields(current, answers).map((field) => (
            <div key={field.key} className="animate-appear">
              <FieldRenderer
                field={field}
                value={answers[field.key]}
                onChange={(v) => setValue(field.key, v)}
                error={errors[field.key]}
                ctx={ctx}
              />
            </div>
          ))}
        </fieldset>
      ) : (
        <div className="mt-8">
          <dl className="divide-y divide-ligne border-y border-ligne">
            {summary.map((line) => {
              const stepIndex = steps.findIndex((s) => s.key === line.stepKey);
              return (
                <div
                  key={line.key}
                  className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-1 py-4 sm:grid-cols-[14rem_1fr_auto]"
                >
                  <dt className="text-sm font-bold text-gris-700 sm:text-base">{line.label}</dt>
                  <dd className="col-start-1 sm:col-start-2">{line.value}</dd>
                  <dd className="col-start-2 row-span-2 row-start-1 self-center sm:col-start-3 sm:row-span-1">
                    <button
                      type="button"
                      onClick={() => setIndex(stepIndex)}
                      className="inline-flex min-h-11 items-center gap-1.5 px-1 font-bold text-indigo-900 underline"
                    >
                      <Icon name="modifier" size={18} />
                      Modifier
                    </button>
                  </dd>
                </div>
              );
            })}
          </dl>
          {fee && (
            <div className="mt-6 flex gap-3 rounded-md bg-sable-100 p-4">
              <Icon name="argent" size={24} className="mt-0.5 shrink-0" />
              <p>
                <strong>
                  {fee.label} : {formatFcfa(fee.amountFcfa)}
                </strong>
                , à régler par Wave ou Orange Money seulement une fois la personne choisie. Le
                salaire ou le tarif est versé directement à la personne.{" "}
                <span className="text-gris-700">
                  En démonstration, aucun paiement n’est demandé.
                </span>
              </p>
            </div>
          )}
          {state?.error && !Object.keys(state.fieldErrors ?? {}).length && (
            <Notice tone="erreur" className="mt-6" title={state.error} />
          )}
        </div>
      )}

      <div className="sticky bottom-0 -mx-4 mt-10 flex items-center gap-3 border-t border-ligne bg-sable-50/95 px-4 py-3 sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:px-0">
        {index > 0 && (
          <button
            type="button"
            onClick={back}
            className="inline-flex min-h-13 items-center gap-2 rounded-sm px-3 font-bold text-indigo-900 hover:bg-sable-100"
          >
            <Icon name="arrowLeft" size={20} />
            Retour
          </button>
        )}
        <div className="ml-auto w-full sm:w-auto">
          {isRecap ? (
            <form
              action={formAction}
              onSubmit={() => {
                try {
                  window.localStorage.removeItem(draftKey(slug));
                } catch {
                  // ignoré
                }
              }}
            >
              <input type="hidden" name="service" value={slug} />
              {profileId && <input type="hidden" name="profil" value={profileId} />}
              <input
                type="hidden"
                name="answers"
                value={JSON.stringify(pruneAnswers(form, answers))}
              />
              <SubmitButton
                size="lg"
                full
                pendingLabel="Recherche des profils…"
                iconAfter="arrowRight"
              >
                Voir les profils vérifiés
              </SubmitButton>
            </form>
          ) : (
            <button
              type="button"
              onClick={next}
              disabled={!hydrated}
              className={cn(
                "inline-flex min-h-14 w-full items-center justify-center gap-2.5 rounded-sm bg-terre-600 px-6 text-lg font-bold text-white hover:bg-terre-700 disabled:opacity-60 sm:w-auto",
              )}
            >
              {hydrated ? "Continuer" : "Chargement…"}
              {hydrated && <Icon name="arrowRight" size={20} />}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
