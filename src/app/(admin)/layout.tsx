import { AppHeader } from "@/components/site/app-header";
import { getCurrentUser } from "@/lib/auth/session";

// Chaque page vérifie elle-même l'accès (requireSpace("admin")).
export default async function AdminLayout({ children }: LayoutProps<"/">) {
  const user = await getCurrentUser();
  const admin = user?.role === "admin";
  return (
    <>
      <AppHeader
        label={user?.name ?? ""}
        badge={
          admin ? (
            <span className="rounded-full bg-indigo-900 px-3 py-1 text-xs font-bold text-sable-50">
              Admin
            </span>
          ) : null
        }
        nav={
          admin
            ? [
                { href: "/admin", label: "Tableau de bord", icon: "liste", exact: true },
                { href: "/admin/utilisateurs", label: "Utilisateurs", icon: "personne" },
                { href: "/admin/dossiers", label: "Dossiers", icon: "bouclier" },
                { href: "/admin/placements", label: "Placements", icon: "calendrier" },
                { href: "/admin/signalements", label: "Signalements", icon: "signaler" },
                { href: "/admin/zones", label: "Zones", icon: "carte_zone" },
                { href: "/admin/attente", label: "Liste d’attente", icon: "horloge" },
                { href: "/admin/parametres", label: "Paramètres", icon: "modifier" },
                { href: "/admin/journal", label: "Journal", icon: "cadenas" },
                { href: "/agent", label: "Terrain", icon: "phone" },
              ]
            : []
        }
      />
      <main id="contenu" className="container-page flex-1 py-8 sm:py-10">
        {children}
      </main>
    </>
  );
}
