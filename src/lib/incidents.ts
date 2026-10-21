export const INCIDENT_CATEGORIES = [
  { key: "retard_absence", label: "Retard ou absence" },
  { key: "comportement", label: "Comportement ou manque de respect" },
  { key: "salaire_conditions", label: "Salaire ou conditions non respectés" },
  { key: "securite", label: "Sécurité, vol ou objet disparu" },
  { key: "autre", label: "Autre chose" },
] as const;

export type IncidentCategory = (typeof INCIDENT_CATEGORIES)[number]["key"];

export function incidentCategoryLabel(key: string): string {
  return INCIDENT_CATEGORIES.find((c) => c.key === key)?.label ?? key;
}

export const INCIDENT_STATUS_LABELS = {
  ouvert: "Reçu par l’équipe",
  en_cours: "En cours de traitement",
  resolu: "Résolu",
} as const;
