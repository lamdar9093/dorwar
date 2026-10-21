import type { NextRequest } from "next/server";
import { getServiceBySlug } from "@/lib/services/repository";

/** Cible du sélecteur « De quoi avez-vous besoin ? » de l'accueil (formulaire GET, sans JavaScript). */
export async function GET(request: NextRequest) {
  const slug = request.nextUrl.searchParams.get("service") ?? "";
  const service = slug ? await getServiceBySlug(slug) : null;
  // Redirection relative : derrière le proxy, l'hôte vu par le serveur n'est pas celui du navigateur.
  return new Response(null, {
    status: 303,
    headers: { Location: service?.active ? `/demande/${service.slug}` : "/" },
  });
}
