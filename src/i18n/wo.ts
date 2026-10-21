import type { Dictionary } from "./fr";

// Wolof. Seuls des mots courants et des salutations, aucune phrase inventée.
// Chaque entrée doit être relue par un locuteur avant d'être mise en avant.

type DeepPartial<T> = { [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K] };

/** Mots wolof affichés en accompagnement du français (accueil, boutons, confirmations). */
export const motsWolof = {
  bienvenue: "Dalal ak jàmm", // À FAIRE VALIDER PAR UN LOCUTEUR
  merci: "Jërëjëf", // À FAIRE VALIDER PAR UN LOCUTEUR
  commentVasTu: "Na nga def", // À FAIRE VALIDER PAR UN LOCUTEUR
  oui: "Waaw", // À FAIRE VALIDER PAR UN LOCUTEUR
  non: "Déedéet", // À FAIRE VALIDER PAR UN LOCUTEUR
  aBientot: "Ba beneen yoon", // À FAIRE VALIDER PAR UN LOCUTEUR
} as const;

/** Dictionnaire wolof : vide pour l'instant, il complétera le français clé par clé. */
export const wo: DeepPartial<Dictionary> = {
  common: {
    yes: "Waaw", // À FAIRE VALIDER PAR UN LOCUTEUR
    no: "Déedéet", // À FAIRE VALIDER PAR UN LOCUTEUR
  },
};
