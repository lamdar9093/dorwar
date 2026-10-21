import { z } from "zod";

/**
 * Le formulaire de besoin d'un service est une donnée (table `services`, colonne `config`).
 * Ce module décrit sa forme ; le rendu, la validation et le récapitulatif s'en déduisent.
 */

const fieldKey = z.string().regex(/^[a-z][a-z0-9_]*$/, "clé en minuscules, chiffres et _");

export const conditionSchema = z.object({
  field: fieldKey,
  /** Visible si la valeur (ou l'une des valeurs d'un choix multiple) figure dans la liste. */
  in: z.array(z.string()).optional(),
  /** Visible si le champ a une valeur non vide. */
  filled: z.boolean().optional(),
});

export const showIfSchema = z.union([
  conditionSchema,
  z.object({ any: z.array(conditionSchema).min(1) }),
  z.object({ all: z.array(conditionSchema).min(1) }),
]);

export const optionSchema = z.object({
  value: z.string(),
  label: z.string(),
  description: z.string().optional(),
  icon: z.string().optional(),
});

const base = {
  key: fieldKey,
  label: z.string(),
  hint: z.string().optional(),
  showIf: showIfSchema.optional(),
};

export const fieldSchema = z.discriminatedUnion("type", [
  z.object({ ...base, type: z.literal("formula") }),
  z.object({
    ...base,
    type: z.literal("choice"),
    options: z.array(optionSchema).min(2),
    required: z.boolean().default(false),
  }),
  z.object({
    ...base,
    type: z.literal("multi_choice"),
    options: z.array(optionSchema).min(1),
    required: z.boolean().default(false),
    max: z.number().int().positive().optional(),
  }),
  z.object({
    ...base,
    type: z.literal("text"),
    placeholder: z.string().optional(),
    maxLength: z.number().int().positive().default(160),
    required: z.boolean().default(false),
  }),
  z.object({
    ...base,
    type: z.literal("textarea"),
    placeholder: z.string().optional(),
    maxLength: z.number().int().positive().default(800),
    required: z.boolean().default(false),
  }),
  z.object({
    ...base,
    type: z.literal("number"),
    min: z.number().int(),
    max: z.number().int(),
    unit: z.string().optional(),
    required: z.boolean().default(false),
  }),
  z.object({
    ...base,
    type: z.literal("money"),
    min: z.number().int().nonnegative(),
    max: z.number().int().positive(),
    step: z.number().int().positive().default(500),
    unit: z.string(),
    required: z.boolean().default(false),
  }),
  z.object({
    ...base,
    type: z.literal("date"),
    /** Écart minimal en jours par rapport à aujourd'hui (0 = aujourd'hui possible). */
    minDaysFromToday: z.number().int().default(0),
    maxDaysFromToday: z.number().int().default(365),
    required: z.boolean().default(false),
  }),
  z.object({ ...base, type: z.literal("time_range"), required: z.boolean().default(false) }),
  z.object({
    ...base,
    type: z.literal("days_of_week"),
    min: z.number().int().nonnegative().default(0),
    max: z.number().int().positive().default(7),
    required: z.boolean().default(false),
  }),
  z.object({ ...base, type: z.literal("location") }),
  z.object({ ...base, type: z.literal("consent"), items: z.array(z.string()).min(1) }),
  z.object({ ...base, type: z.literal("info"), body: z.string() }),
  /** Réservé : note vocale dans les remarques. Ignoré au rendu tant qu'il n'est pas implémenté. */
  z.object({ ...base, type: z.literal("voice_note") }),
]);

export const stepSchema = z.object({
  key: fieldKey,
  title: z.string(),
  intro: z.string().optional(),
  showIf: showIfSchema.optional(),
  fields: z.array(fieldSchema).min(1),
});

export const needFormSchema = z.object({
  steps: z.array(stepSchema).min(1),
});

export type Condition = z.infer<typeof conditionSchema>;
export type ShowIf = z.infer<typeof showIfSchema>;
export type FieldOption = z.infer<typeof optionSchema>;
export type FieldSpec = z.infer<typeof fieldSchema>;
export type FieldType = FieldSpec["type"];
export type FormStep = z.infer<typeof stepSchema>;
export type NeedForm = z.infer<typeof needFormSchema>;
