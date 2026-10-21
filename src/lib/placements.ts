import { addDaysIso } from "@/lib/format";

export type PlacementStatus =
  "rencontre_demandee" | "rencontre_prevue" | "essai" | "confirme" | "termine" | "annule";

export type FormulaKind = "longue" | "ponctuelle";

/** Jours entre le début de l'essai et l'appel de suivi de l'équipe. */
export const FOLLOW_UP_AFTER_DAYS = 7;

export const ACTIVE_STATUSES: readonly PlacementStatus[] = [
  "rencontre_demandee",
  "rencontre_prevue",
  "essai",
  "confirme",
];

/**
 * Longue durée : rencontre demandée → rencontre prévue → essai → confirmé → terminé.
 * Mission ponctuelle : pas d'essai ; la mission peut être confirmée sans rencontre préalable.
 */
export function allowedTransitions(status: PlacementStatus, kind: FormulaKind): PlacementStatus[] {
  switch (status) {
    case "rencontre_demandee":
      return kind === "longue"
        ? ["rencontre_prevue", "annule"]
        : ["rencontre_prevue", "confirme", "annule"];
    case "rencontre_prevue":
      return kind === "longue" ? ["essai", "annule"] : ["confirme", "annule"];
    case "essai":
      return ["confirme", "termine", "annule"];
    case "confirme":
      return ["termine"];
    case "termine":
    case "annule":
      return [];
  }
}

export function canTransition(
  from: PlacementStatus,
  to: PlacementStatus,
  kind: FormulaKind,
): boolean {
  return allowedTransitions(from, kind).includes(to);
}

export function isActive(status: PlacementStatus): boolean {
  return ACTIVE_STATUSES.includes(status);
}

/** Un avis se laisse une fois la personne au travail : essai, confirmé ou terminé. */
export function isReviewable(status: PlacementStatus): boolean {
  return status === "essai" || status === "confirme" || status === "termine";
}

export function guaranteeEndDate(startDate: string, days: number): string {
  return addDaysIso(startDate, days);
}

export function followUpDate(startDate: string): string {
  return addDaysIso(startDate, FOLLOW_UP_AFTER_DAYS);
}

/** Étapes affichées dans le suivi, selon la formule. */
export function timelineStages(kind: FormulaKind): PlacementStatus[] {
  return kind === "longue"
    ? ["rencontre_demandee", "rencontre_prevue", "essai", "confirme"]
    : ["rencontre_demandee", "rencontre_prevue", "confirme", "termine"];
}

const LABELS: Record<FormulaKind, Record<PlacementStatus, string>> = {
  longue: {
    rencontre_demandee: "Rencontre demandée",
    rencontre_prevue: "Rencontre prévue",
    essai: "En essai",
    confirme: "Confirmé",
    termine: "Terminé",
    annule: "Annulé",
  },
  ponctuelle: {
    rencontre_demandee: "Demande envoyée",
    rencontre_prevue: "Rencontre prévue",
    essai: "En cours",
    confirme: "Mission confirmée",
    termine: "Mission terminée",
    annule: "Annulée",
  },
};

export function placementStatusLabel(status: PlacementStatus, kind: FormulaKind): string {
  return LABELS[kind][status];
}
