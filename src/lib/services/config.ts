import { z } from "zod";
import { needFormSchema } from "@/lib/form-engine/schema";

/**
 * Configuration complète d'un service (colonne `services.config`).
 * Ouvrir un service = insérer une ligne `services` dont la config respecte ce schéma :
 * pages, formulaire, recherche, vérification, garantie et frais en découlent sans toucher au code.
 */

const formulaSchema = z.object({
  key: z.string().regex(/^[a-z][a-z0-9_]*$/),
  label: z.string(),
  shortLabel: z.string(),
  summary: z.string(),
  facts: z.array(z.string()).min(1),
  icon: z.string(),
  /** Formule logée : la distance compte moins, les profils prêts à s'installer sont proposés. */
  housing: z.boolean(),
  kind: z.enum(["longue", "ponctuelle"]),
  pay: z.enum(["mensuel", "journalier"]),
});

const verificationStepSchema = z.object({
  key: z.string().regex(/^[a-z][a-z0-9_]*$/),
  /** Libellé pour l'agent de terrain. */
  label: z.string(),
  /** Libellé public du badge (« Identité vérifiée »). */
  publicLabel: z.string(),
  /** Phrase pour les familles (pages publiques). */
  description: z.string(),
  /** Phrase simple pour la personne vérifiée (suivi de son dossier). */
  plainLabel: z.string(),
  /** Consigne pour l'agent. */
  agentHint: z.string(),
  icon: z.string(),
  /** Étapes regroupées dans le badge public (ex. les deux références). */
  group: z.string().optional(),
  acceptsDocuments: z.boolean().default(false),
});

const guaranteeSchema = z.object({
  kind: z.enum(["remplacement", "remplacement_ou_remboursement"]),
  days: z.number().int().nonnegative(),
  /** Texte affiché ; `{jours}` est remplacé par la durée. */
  text: z.string(),
});

const feeSchema = z.object({
  amountFcfa: z.number().int().nonnegative(),
  label: z.string(),
});

export const serviceConfigSchema = z.object({
  vocabulary: z.object({
    female: z.string(),
    male: z.string(),
    neutral: z.string(),
    plural: z.string(),
    /** Message honnête quand aucun profil vérifié n'est disponible. */
    noneNearby: z.string(),
    /** Action principale de la page du service. */
    findAction: z.string(),
  }),
  /** Une ligne pour la liste des services de l'accueil. */
  tagline: z.string(),
  page: z.object({
    title: z.string(),
    subtitle: z.string(),
    formulasTitle: z.string(),
    formulasIntro: z.string().optional(),
    faq: z.array(z.object({ q: z.string(), a: z.string() })),
  }),
  formulas: z.array(formulaSchema).min(1),
  skills: z.array(z.object({ key: z.string(), label: z.string(), icon: z.string() })).min(1),
  verification: z.array(verificationStepSchema).min(1),
  guarantees: z.record(z.string(), guaranteeSchema),
  fees: z.record(z.string(), feeSchema),
  needForm: needFormSchema,
});

export type ServiceConfig = z.infer<typeof serviceConfigSchema>;
/** Forme écrite à la main (les valeurs par défaut du schéma peuvent être omises). */
export type ServiceConfigInput = z.input<typeof serviceConfigSchema>;
export type ServiceFormula = ServiceConfig["formulas"][number];
export type VerificationStepConfig = ServiceConfig["verification"][number];
export type GuaranteeConfig = z.infer<typeof guaranteeSchema>;
export type FeeConfig = z.infer<typeof feeSchema>;

/** Contrôles de cohérence que le schéma seul ne peut pas exprimer. */
export function checkServiceConfig(config: ServiceConfig): string[] {
  const problems: string[] = [];
  const formulaKeys = new Set(config.formulas.map((f) => f.key));
  for (const key of formulaKeys) {
    if (!config.guarantees[key]) problems.push(`garantie manquante pour la formule « ${key} »`);
    if (!config.fees[key]) problems.push(`frais manquants pour la formule « ${key} »`);
  }
  const fieldTypes = config.needForm.steps.flatMap((s) => s.fields.map((f) => f.type));
  if (fieldTypes.filter((t) => t === "formula").length !== 1)
    problems.push("le formulaire doit avoir un seul champ « formula »");
  if (fieldTypes.filter((t) => t === "location").length !== 1)
    problems.push("le formulaire doit avoir un seul champ « location »");
  const keys = config.needForm.steps.flatMap((s) => s.fields.map((f) => f.key));
  if (new Set(keys).size !== keys.length)
    problems.push("deux champs du formulaire ont la même clé");
  const stepKeys = config.verification.map((v) => v.key);
  if (new Set(stepKeys).size !== stepKeys.length)
    problems.push("deux étapes de vérification ont la même clé");
  return problems;
}

export function guaranteeText(g: GuaranteeConfig): string {
  return g.text.replaceAll("{jours}", String(g.days));
}
