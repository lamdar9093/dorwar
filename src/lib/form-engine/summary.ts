import { formatDate, formatFcfa, formatNumber, formatTime, joinFr } from "@/lib/format";
import type { Answers, TimeRangeAnswer } from "./constants";
import type { FieldSpec, NeedForm } from "./schema";
import { pruneAnswers, visibleFields, visibleSteps } from "./visibility";

export type SummaryLine = { stepKey: string; key: string; label: string; value: string };

type Options = {
  formulas: { key: string; label: string }[];
  /** Libellé du lieu (le champ `location` ne contient que des identifiants). */
  locationLabel?: string;
};

function moneyUnit(unit: string): string {
  return unit.replace(/^FCFA\s*/i, "").trim();
}

export function formatAnswer(field: FieldSpec, value: unknown, options: Options): string {
  if (value == null || value === "") return "";
  switch (field.type) {
    case "formula":
      return options.formulas.find((f) => f.key === value)?.label ?? String(value);
    case "choice":
      return field.options.find((o) => o.value === value)?.label ?? String(value);
    case "multi_choice":
      return Array.isArray(value)
        ? joinFr(value.map((v) => field.options.find((o) => o.value === v)?.label ?? String(v)))
        : "";
    case "text":
    case "textarea":
      return String(value);
    case "number":
      return `${formatNumber(Number(value))}${field.unit ? ` ${field.unit}` : ""}`;
    case "money": {
      const unit = moneyUnit(field.unit);
      return `${formatFcfa(Number(value))}${unit ? ` ${unit}` : ""}`;
    }
    case "date":
      return formatDate(String(value));
    case "time_range": {
      const range = value as TimeRangeAnswer;
      return range?.start && range?.end
        ? `de ${formatTime(range.start)} à ${formatTime(range.end)}`
        : "";
    }
    case "days_of_week":
      return Array.isArray(value) ? joinFr(value.map(String)) : "";
    case "location":
      return options.locationLabel ?? "";
    case "consent":
    case "info":
    case "voice_note":
      return "";
  }
}

/** Récapitulatif lisible des réponses, dans l'ordre du formulaire, sans les branches abandonnées. */
export function summarizeAnswers(
  form: NeedForm,
  answers: Answers,
  options: Options,
): SummaryLine[] {
  const pruned = pruneAnswers(form, answers);
  const lines: SummaryLine[] = [];
  for (const step of visibleSteps(form, pruned)) {
    for (const field of visibleFields(step, pruned)) {
      const value = formatAnswer(field, pruned[field.key], options);
      if (value) lines.push({ stepKey: step.key, key: field.key, label: field.label, value });
    }
  }
  return lines;
}

/** Brouillon des conditions écrites du placement, à relire et ajuster par l'agent. */
export function draftConditions(form: NeedForm, answers: Answers, options: Options): string {
  const skip = new Set(["location", "consent", "info", "voice_note", "textarea"]);
  const fields = new Map(form.steps.flatMap((s) => s.fields.map((f) => [f.key, f] as const)));
  return summarizeAnswers(form, answers, options)
    .filter((line) => !skip.has(fields.get(line.key)?.type ?? ""))
    .map((line) => `${line.label} : ${line.value}.`)
    .join("\n");
}
