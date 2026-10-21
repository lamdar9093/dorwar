import { z } from "zod";
import { addDaysIso, formatFcfa, formatNumber } from "@/lib/format";
import { SEARCH_RADII_KM, WEEK_DAYS, type Answers } from "./constants";
import type { FieldSpec, NeedForm } from "./schema";
import { pruneAnswers, visibleFields, visibleSteps } from "./visibility";

export type CompileContext = {
  /** Clés des formules du service (le champ `formula` doit en désigner une). */
  formulaKeys: string[];
  /** Date du jour (AAAA-MM-JJ) pour les bornes des champs date. */
  today: string;
};

const REQUIRED = "Ce champ est obligatoire.";

function emptyToUndefined(value: unknown) {
  if (typeof value === "string" && value.trim() === "") return undefined;
  if (value === null) return undefined;
  return value;
}

/** Une saisie vide vaut absence : obligatoire → message clair, facultatif → ignorée. */
function requiredOr<T extends z.ZodType>(schema: T, required: boolean) {
  const inner = required
    ? z
        .unknown()
        .refine((v): boolean => v !== undefined, { error: REQUIRED })
        .pipe(schema)
    : schema.optional();
  return z.preprocess(emptyToUndefined, inner);
}

const hhmm = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Heure invalide.");
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date invalide.");
const uuid = z.uuid("Zone invalide.");

const locationSchema = z.discriminatedUnion(
  "mode",
  [
    z
      .object({
        mode: z.literal("autour"),
        radiusKm: z
          .number()
          .refine((r) => (SEARCH_RADII_KM as readonly number[]).includes(r), "Rayon invalide."),
        areaId: uuid.optional(),
        lat: z.number().min(-90).max(90).optional(),
        lng: z.number().min(-180).max(180).optional(),
      })
      .refine((v) => v.areaId || (v.lat !== undefined && v.lng !== undefined), {
        error: "Partagez votre position ou choisissez votre quartier.",
      }),
    z.object({ mode: z.literal("zone"), areaId: uuid }),
  ],
  { error: "Indiquez où se trouve la maison." },
);

function valueSchema(field: FieldSpec, ctx: CompileContext): z.ZodType | null {
  switch (field.type) {
    case "formula":
      return z.enum(ctx.formulaKeys as [string, ...string[]], { error: "Choisissez une formule." });
    case "choice": {
      const values = field.options.map((o) => o.value) as [string, ...string[]];
      return requiredOr(z.enum(values, { error: "Choisissez une option." }), field.required);
    }
    case "multi_choice": {
      const values = field.options.map((o) => o.value) as [string, ...string[]];
      let schema = z.array(z.enum(values, { error: "Option invalide." }));
      if (field.max) schema = schema.max(field.max, `${field.max} choix au maximum.`);
      if (field.required) schema = schema.min(1, "Choisissez au moins une option.");
      return requiredOr(schema, field.required);
    }
    case "text":
    case "textarea":
      return requiredOr(
        z
          .string()
          .trim()
          .max(field.maxLength, `${formatNumber(field.maxLength)} caractères au maximum.`),
        field.required,
      );
    case "number":
      return requiredOr(
        z.coerce
          .number({ error: "Indiquez un nombre." })
          .int("Indiquez un nombre entier.")
          .min(field.min, `Au moins ${formatNumber(field.min)}.`)
          .max(field.max, `Au plus ${formatNumber(field.max)}.`),
        field.required,
      );
    case "money":
      return requiredOr(
        z.coerce
          .number({ error: "Indiquez un montant." })
          .int("Indiquez un montant sans centimes.")
          .min(field.min, `Au moins ${formatFcfa(field.min)}.`)
          .max(field.max, `Au plus ${formatFcfa(field.max)}.`),
        field.required,
      );
    case "date": {
      const min = addDaysIso(ctx.today, field.minDaysFromToday);
      const max = addDaysIso(ctx.today, field.maxDaysFromToday);
      return requiredOr(
        isoDate
          .refine((d) => d >= min, "Cette date est déjà passée.")
          .refine((d) => d <= max, "Choisissez une date plus proche."),
        field.required,
      );
    }
    case "time_range":
      return requiredOr(
        z
          .object({ start: hhmm, end: hhmm })
          .refine((v) => v.end > v.start, "L’heure de fin doit venir après l’heure de début."),
        field.required,
      );
    case "days_of_week": {
      let schema = z
        .array(z.enum(WEEK_DAYS))
        .refine((days) => new Set(days).size === days.length, "Un jour est choisi deux fois.")
        .refine((days) => days.length <= field.max, `${field.max} jour(s) au maximum.`);
      if (field.min > 0) {
        schema = schema.refine(
          (days) => days.length >= field.min,
          field.min === 1
            ? "Choisissez au moins un jour."
            : `Choisissez au moins ${field.min} jours.`,
        );
      }
      return requiredOr(schema, field.required);
    }
    case "location":
      return requiredOr(locationSchema, true);
    case "consent":
      return z.preprocess(
        (v) => v ?? [],
        z
          .array(z.number().int())
          .refine(
            (accepted) => field.items.every((_, i) => accepted.includes(i)),
            "Chaque engagement doit être accepté.",
          ),
      );
    case "info":
    case "voice_note":
      return null;
  }
}

export type ValidationResult =
  { ok: true; answers: Answers } | { ok: false; errors: Record<string, string> };

/**
 * Valide les réponses d'un formulaire de besoin.
 * Les champs masqués par les conditions sont ignorés : seule la branche choisie est validée et conservée.
 */
export function validateAnswers(
  form: NeedForm,
  ctx: CompileContext,
  raw: Answers,
): ValidationResult {
  const pruned = pruneAnswers(form, raw);
  const shape: Record<string, z.ZodType> = {};
  for (const step of visibleSteps(form, pruned)) {
    for (const field of visibleFields(step, pruned)) {
      const schema = valueSchema(field, ctx);
      if (schema) shape[field.key] = schema;
    }
  }
  const result = z.object(shape).safeParse(pruned);
  if (result.success) {
    const answers: Answers = {};
    for (const [k, v] of Object.entries(result.data)) if (v !== undefined) answers[k] = v;
    return { ok: true, answers };
  }
  const errors: Record<string, string> = {};
  for (const issue of result.error.issues) {
    const key = String(issue.path[0] ?? "_");
    errors[key] ??= issue.message;
  }
  return { ok: false, errors };
}
