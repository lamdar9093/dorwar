import { redirect } from "next/navigation";

// Confirmations « après redirection » : une action qui change la structure de la page
// (formulaire remplacé par un statut) renvoie vers la page avec ?ok=…, affiché en haut.

export const FLASH_MESSAGES = {
  rencontre:
    "Rencontre fixée. La famille et la personne voient la date et les conditions dans leur espace.",
  essai: "Essai commencé. La garantie démarre et l’appel de suivi est planifié une semaine après.",
  confirme: "C’est confirmé.",
  fin: "Placement terminé.",
  garantie:
    "Placement clos au titre de la garantie. La demande de la famille est rouverte : elle peut rencontrer une autre personne, sans nouveaux frais.",
  annule: "Placement annulé.",
  suivi: "Appel de suivi enregistré.",
  valide: "Profil validé : il est proposé aux familles et sa carte Dorwar est active.",
  refuse: "Dossier refusé. Le motif est visible par la personne dans son espace.",
  suspendu:
    "Carte suspendue : le profil n’est plus proposé et le QR code affiche « carte inactive ».",
  rouvert: "Dossier rouvert.",
  accord: "Votre accord est enregistré. Merci.",
  avis: "Merci pour votre avis : il aide les prochaines familles et les personnes que nous suivons.",
  inscription:
    "Votre inscription est envoyée. Un agent Dorwar vous appelle pour fixer un rendez-vous.",
} as const;

export type FlashKey = keyof typeof FLASH_MESSAGES;

export function flashMessage(value: unknown): string | null {
  return typeof value === "string" && value in FLASH_MESSAGES
    ? FLASH_MESSAGES[value as FlashKey]
    : null;
}

/** Chemin interne uniquement : jamais de redirection vers un autre site. */
export function safePath(value: FormDataEntryValue | null | undefined, fallback: string): string {
  const path = typeof value === "string" ? value : "";
  return path.startsWith("/") && !path.startsWith("//") && !path.startsWith("/\\")
    ? path.split("?")[0]
    : fallback;
}

export function redirectWithFlash(path: string, key: FlashKey): never {
  redirect(`${path}?ok=${key}`);
}
