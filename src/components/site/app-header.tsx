import Link from "next/link";
import type { ReactNode } from "react";
import { logout } from "@/app/actions/session";
import { Logo } from "@/components/brand/logo";
import { Icon } from "@/components/icons";
import { NavLinks, type NavItem } from "./nav-links";

/** En-tête des espaces connectés (famille, prestataire, équipe). */
export function AppHeader({
  nav,
  label,
  badge,
}: {
  nav: NavItem[];
  label: ReactNode;
  badge?: ReactNode;
}) {
  return (
    <header className="border-b border-ligne bg-sable-50 print:hidden">
      <div className="container-page flex min-h-16 items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link href="/" className="-ml-1 rounded-sm p-1" aria-label="Dorwar, retour à l’accueil">
            <Logo />
          </Link>
          {badge}
        </div>
        <div className="flex items-center gap-2">
          <span className="hidden max-w-56 truncate text-sm text-gris-700 sm:inline">{label}</span>
          <form action={logout}>
            <button
              type="submit"
              className="inline-flex min-h-12 items-center gap-2 rounded-sm px-3 font-bold text-indigo-900 hover:bg-sable-100"
            >
              <Icon name="deconnexion" size={22} />
              <span className="sr-only sm:not-sr-only">Se déconnecter</span>
            </button>
          </form>
        </div>
      </div>
      {nav.length > 0 && (
        <nav aria-label="Navigation de l’espace" className="container-page">
          <NavLinks items={nav} />
        </nav>
      )}
    </header>
  );
}

/** Pied de page sobre des espaces connectés. */
export function AppFooter({ children }: { children?: ReactNode }) {
  return (
    <footer className="mt-16 border-t border-ligne print:hidden">
      <div className="container-page flex flex-col gap-4 py-8 text-sm text-gris-700 sm:flex-row sm:items-center sm:justify-between">
        <div>{children}</div>
        <Link href="/vos-donnees" className="inline-flex min-h-12 items-center underline">
          Vos données
        </Link>
      </div>
    </footer>
  );
}
