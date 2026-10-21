// Constantes et types partagés par le serveur et les composants client (sans dépendance à zod).

export const WEEK_DAYS = [
  "lundi",
  "mardi",
  "mercredi",
  "jeudi",
  "vendredi",
  "samedi",
  "dimanche",
] as const;
export type WeekDay = (typeof WEEK_DAYS)[number];

export const SEARCH_RADII_KM = [2, 5, 10, 20] as const;
export type SearchRadius = (typeof SEARCH_RADII_KM)[number];

/** Valeur du champ `location` : autour d'un point (position partagée ou quartier choisi) ou dans une zone. */
export type LocationAnswer =
  | { mode: "autour"; radiusKm: number; areaId?: string; lat?: number; lng?: number }
  | { mode: "zone"; areaId: string };

export type TimeRangeAnswer = { start: string; end: string };

export type Answers = Record<string, unknown>;
