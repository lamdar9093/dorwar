// Règles d'accès, en fonctions pures : appelées par chaque page, action et route côté serveur.

export type Role = "famille" | "prestataire" | "agent" | "admin";
export type Space = "famille" | "prestataire" | "agent" | "admin";
export type Actor = { id: string; role: Role };

const SPACE_ROLES: Record<Space, readonly Role[]> = {
  famille: ["famille"],
  prestataire: ["prestataire"],
  agent: ["agent", "admin"],
  admin: ["admin"],
};

export function canAccessSpace(role: Role, space: Space): boolean {
  return SPACE_ROLES[space].includes(role);
}

export function isStaff(actor: Actor): boolean {
  return actor.role === "agent" || actor.role === "admin";
}

export function homeFor(role: Role): string {
  switch (role) {
    case "famille":
      return "/demandes";
    case "prestataire":
      return "/espace-prestataire";
    case "agent":
      return "/agent";
    case "admin":
      return "/admin";
  }
}

/** Pièces d'identité, photos, justificatifs : l'équipe seulement. Jamais la famille, jamais la personne elle-même. */
export function canViewDocuments(actor: Actor): boolean {
  return isStaff(actor);
}

export function canManageDossiers(actor: Actor): boolean {
  return isStaff(actor);
}

export function canAdminister(actor: Actor): boolean {
  return actor.role === "admin";
}

/** Le dossier de vérification : l'équipe, ou la personne concernée (statuts seulement, sans les notes). */
export function canViewDossier(actor: Actor, dossier: { workerUserId: string }): boolean {
  return isStaff(actor) || actor.id === dossier.workerUserId;
}

export function canSeeAgentNotes(actor: Actor): boolean {
  return isStaff(actor);
}

export function canViewRequest(actor: Actor, request: { familyUserId: string }): boolean {
  return isStaff(actor) || actor.id === request.familyUserId;
}

/** Les profils vérifiés se consultent par une famille connectée ou par l'équipe, jamais par un autre prestataire. */
export function canViewWorkerProfile(actor: Actor): boolean {
  return actor.role === "famille" || isStaff(actor);
}

type PlacementParties = { familyUserId: string; workerUserId: string };

export function isPlacementParty(actor: Actor, placement: PlacementParties): boolean {
  return actor.id === placement.familyUserId || actor.id === placement.workerUserId;
}

export function canViewPlacement(actor: Actor, placement: PlacementParties): boolean {
  return isStaff(actor) || isPlacementParty(actor, placement);
}

export function canReportIncident(actor: Actor, placement: PlacementParties | null): boolean {
  if (!placement) return actor.role === "famille" || actor.role === "prestataire";
  return isPlacementParty(actor, placement);
}

const PATH_SPACES: [prefix: string, space: Space][] = [
  ["/admin", "admin"],
  ["/agent", "agent"],
  ["/espace-prestataire", "prestataire"],
  ["/espace-prestataire/inscription", "prestataire"],
  ["/demande", "famille"],
  ["/placements", "famille"],
  ["/profils", "famille"],
];

export function spaceOfPath(path: string): Space | null {
  const match = PATH_SPACES.find(
    ([prefix]) =>
      path === prefix ||
      path.startsWith(`${prefix}/`) ||
      path.startsWith(`${prefix}?`) ||
      (prefix === "/demande" && path.startsWith("/demandes")),
  );
  return match ? match[1] : null;
}

/** Après connexion : ne renvoyer vers la page demandée que si ce rôle peut l'ouvrir. */
export function canOpenPath(role: Role, path: string): boolean {
  const space = spaceOfPath(path);
  if (!space) return true;
  if (path.startsWith("/profils") && (role === "agent" || role === "admin")) return true;
  return canAccessSpace(role, space);
}
