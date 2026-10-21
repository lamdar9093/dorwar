import type { VerificationStepConfig } from "@/lib/services/config";

export type StepState = {
  type: string;
  status: "a_faire" | "fait" | "echec";
  completedAt: Date | null;
};

export type BadgeItem = {
  key: string;
  label: string;
  icon: string;
  done: boolean;
  /** Date de la dernière étape du groupe (ex. la seconde référence). */
  date: Date | null;
};

export function latestDate(dates: (Date | null)[]): Date | null {
  return dates.reduce<Date | null>((acc, d) => (d && (!acc || d > acc) ? d : acc), null);
}

/**
 * Lignes publiques du badge « Vérifié par Dorwar » : une ligne par étape, les étapes d'un même groupe
 * (les deux références) fusionnées. Ne contient jamais de note ni de document.
 */
export function buildBadge(config: VerificationStepConfig[], steps: StepState[]): BadgeItem[] {
  const byType = new Map(steps.map((s) => [s.type, s]));
  const order: string[] = [];
  const buckets = new Map<
    string,
    { label: string; icon: string; states: (StepState | undefined)[] }
  >();
  for (const step of config) {
    const id = step.group ?? step.key;
    let bucket = buckets.get(id);
    if (!bucket) {
      bucket = { label: step.publicLabel, icon: step.icon, states: [] };
      buckets.set(id, bucket);
      order.push(id);
    }
    bucket.states.push(byType.get(step.key));
  }
  return order.map((id) => {
    const bucket = buckets.get(id)!;
    const done = bucket.states.every((s) => s?.status === "fait");
    const date = done ? latestDate(bucket.states.map((s) => s?.completedAt ?? null)) : null;
    return { key: id, label: bucket.label, icon: bucket.icon, done, date };
  });
}

export function dossierProgress(config: VerificationStepConfig[], steps: StepState[]) {
  const done = config.filter((c) =>
    steps.some((s) => s.type === c.key && s.status === "fait"),
  ).length;
  return { done, total: config.length };
}

/** Un profil ne peut être validé que si chaque étape exigée par le service est faite. */
export function canValidateDossier(config: VerificationStepConfig[], steps: StepState[]): boolean {
  const { done, total } = dossierProgress(config, steps);
  return total > 0 && done === total;
}

/** Statut d'un dossier encore ouvert après la mise à jour d'une étape. */
export function openDossierStatus(steps: StepState[]): "en_attente" | "en_cours" {
  return steps.some((s) => s.status !== "a_faire") ? "en_cours" : "en_attente";
}
