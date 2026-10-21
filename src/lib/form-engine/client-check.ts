import { formatFcfa, formatNumber } from "@/lib/format";
import type { Answers, LocationAnswer, TimeRangeAnswer } from "./constants";
import type { FieldSpec, FormStep } from "./schema";
import { visibleFields } from "./visibility";

// Contrôle immédiat d'une étape dans le navigateur, pour guider sans attendre le serveur.
// Le serveur revalide tout (compile.ts) : ce contrôle n'est qu'un confort.

function empty(value: unknown): boolean {
  if (value == null) return true;
  if (typeof value === "string") return value.trim() === "";
  if (Array.isArray(value)) return value.length === 0;
  return false;
}

export function checkField(field: FieldSpec, value: unknown): string | null {
  switch (field.type) {
    case "formula":
      return empty(value) ? "Choisissez une formule." : null;
    case "choice":
      return field.required && empty(value) ? "Choisissez une option." : null;
    case "multi_choice":
      return field.required && empty(value) ? "Choisissez au moins une option." : null;
    case "text":
    case "textarea":
      if (field.required && empty(value)) return "Ce champ est obligatoire.";
      if (typeof value === "string" && value.length > field.maxLength)
        return `${formatNumber(field.maxLength)} caractères au maximum.`;
      return null;
    case "number":
    case "money": {
      if (empty(value)) return field.required ? "Ce champ est obligatoire." : null;
      const n = Number(value);
      if (!Number.isFinite(n)) return "Indiquez un nombre.";
      const fmt = field.type === "money" ? formatFcfa : formatNumber;
      if (n < field.min) return `Au moins ${fmt(field.min)}.`;
      if (n > field.max) return `Au plus ${fmt(field.max)}.`;
      return null;
    }
    case "date":
      return field.required && empty(value) ? "Choisissez une date." : null;
    case "time_range": {
      const range = value as TimeRangeAnswer | undefined;
      if (!range?.start || !range?.end)
        return field.required ? "Indiquez l’heure de début et l’heure de fin." : null;
      return range.end > range.start ? null : "L’heure de fin doit venir après l’heure de début.";
    }
    case "days_of_week": {
      const days = Array.isArray(value) ? value : [];
      if (field.required && days.length < Math.max(1, field.min))
        return "Choisissez au moins un jour.";
      if (days.length > field.max) return `${field.max} jour(s) au maximum.`;
      return null;
    }
    case "location": {
      const loc = value as LocationAnswer | undefined;
      if (!loc) return "Indiquez où se trouve la maison.";
      if (loc.mode === "zone") return loc.areaId ? null : "Choisissez au moins une région.";
      return loc.areaId || (loc.lat !== undefined && loc.lng !== undefined)
        ? null
        : "Partagez votre position ou choisissez votre quartier.";
    }
    case "consent": {
      const accepted = Array.isArray(value) ? value : [];
      return field.items.every((_, i) => accepted.includes(i))
        ? null
        : "Chaque engagement doit être accepté.";
    }
    case "info":
    case "voice_note":
      return null;
  }
}

export function checkStep(step: FormStep, answers: Answers): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const field of visibleFields(step, answers)) {
    const error = checkField(field, answers[field.key]);
    if (error) errors[field.key] = error;
  }
  return errors;
}
