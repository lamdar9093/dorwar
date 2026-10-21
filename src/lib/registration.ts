// Données de l'inscription d'une personne qui propose ses services (partagées client/serveur, sans zod).

export const LANGUAGES = [
  "wolof",
  "français",
  "pulaar",
  "sérère",
  "diola",
  "mandingue",
  "soninké",
  "anglais",
  "arabe",
] as const;
export type Language = (typeof LANGUAGES)[number];

export const EXPERIENCE_OPTIONS = [
  { years: 0, label: "Moins d’un an" },
  { years: 2, label: "1 à 3 ans" },
  { years: 4, label: "3 à 5 ans" },
  { years: 7, label: "5 à 10 ans" },
  { years: 12, label: "Plus de 10 ans" },
] as const;

export const MIN_AGE = 18;

export type RegistrationPayload = {
  firstName: string;
  lastName: string;
  gender: "femme" | "homme" | "";
  birthYear: number | null;
  languages: string[];
  services: { serviceId: string; formulaKeys: string[]; skills: string[] }[];
  experienceYears: number | null;
  areaId: string;
  radiusKm: number;
  relocate: boolean;
  monthly: number | null;
  daily: number | null;
  consent: boolean;
};
