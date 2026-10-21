import "server-only";
import { redirect } from "next/navigation";
import { canAccessSpace, homeFor, type Space } from "./rbac";
import { getCurrentUser, type SessionUser } from "./session";

/** Exige une connexion ; sinon renvoie vers /connexion puis ramène à `returnTo`. */
export async function requireUser(returnTo = "/"): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect(`/connexion?suite=${encodeURIComponent(returnTo)}`);
  return user;
}

/** Exige l'accès à un espace (famille, prestataire, agent, admin). Un autre rôle retourne à son propre espace. */
export async function requireSpace(space: Space, returnTo?: string): Promise<SessionUser> {
  const user = await requireUser(returnTo ?? homeFor(space));
  if (!canAccessSpace(user.role, space)) redirect(homeFor(user.role));
  return user;
}
