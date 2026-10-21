import Link from "next/link";
import { logout } from "@/app/actions/session";
import { LogoMark } from "@/components/brand/logo";
import { Icon } from "@/components/icons";
import { NavLinks, type NavItem } from "@/components/site/nav-links";
import { getCurrentUser } from "@/lib/auth/session";

// Outil de terrain : pensé pour un téléphone tenu d'une main, navigation en bas de l'écran.
export default async function AgentLayout({ children }: LayoutProps<"/">) {
  const user = await getCurrentUser();
  const staff = user?.role === "agent" || user?.role === "admin";
  const nav: NavItem[] = [
    {
      href: "/agent",
      label: "Dossiers",
      icon: "liste",
      match: ["/agent", "/agent/dossiers"],
      exact: true,
    },
    {
      href: "/agent/suivis",
      label: "Suivis",
      icon: "phone",
      match: ["/agent/suivis", "/agent/placements"],
    },
    ...(user?.role === "admin"
      ? [{ href: "/admin", label: "Admin", icon: "bouclier" } as NavItem]
      : []),
  ];
  return (
    <>
      <header className="on-dark sticky top-0 z-20 bg-indigo-950 text-sable-50">
        <div className="container-page flex min-h-14 items-center justify-between gap-3">
          <Link href="/agent" className="flex items-center gap-2.5 rounded-sm py-1 font-bold">
            <LogoMark tone="light" size={22} />
            <span>
              Dorwar <span className="font-normal text-sable-200">· Terrain</span>
            </span>
          </Link>
          {user && (
            <div className="flex items-center gap-1">
              <span className="hidden text-sm text-sable-200 sm:inline">{user.name}</span>
              <form action={logout}>
                <button
                  type="submit"
                  className="inline-flex min-h-12 items-center gap-2 rounded-sm px-3 hover:bg-indigo-900"
                  aria-label="Se déconnecter"
                >
                  <Icon name="deconnexion" size={22} />
                </button>
              </form>
            </div>
          )}
        </div>
      </header>
      <main id="contenu" className="container-page flex-1 pt-5 pb-28 sm:pt-8">
        {children}
      </main>
      {staff && (
        <nav
          aria-label="Navigation terrain"
          className="fixed inset-x-0 bottom-0 z-30 border-t border-ligne bg-white pb-[env(safe-area-inset-bottom)] shadow-sheet"
        >
          <div className="mx-auto max-w-lg">
            <NavLinks items={nav} variant="bottom" />
          </div>
        </nav>
      )}
    </>
  );
}
