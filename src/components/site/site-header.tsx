import Link from "next/link";
import { logout } from "@/app/actions/session";
import { Logo } from "@/components/brand/logo";
import { Icon } from "@/components/icons";
import { getDictionary } from "@/i18n";
import { homeFor } from "@/lib/auth/rbac";
import { getCurrentUser } from "@/lib/auth/session";

export async function SiteHeader() {
  const [user, t] = await Promise.all([getCurrentUser(), getDictionary()]);
  return (
    <header className="border-b border-ligne/70">
      <div className="container-page flex min-h-18 items-center justify-between gap-4">
        <Link href="/" className="-ml-1 rounded-sm p-1" aria-label={t.site.homeLink}>
          <Logo />
        </Link>
        <nav aria-label="Navigation principale" className="flex items-center gap-1 sm:gap-3">
          {!user && (
            <Link
              href="/devenir-prestataire"
              className="hidden min-h-12 items-center px-3 font-bold text-indigo-900 hover:underline md:inline-flex"
            >
              {t.home.secondary}
            </Link>
          )}
          {user ? (
            <>
              <Link
                href={homeFor(user.role)}
                className="inline-flex min-h-12 items-center gap-2 rounded-sm px-3 font-bold text-indigo-900 hover:bg-sable-100"
              >
                <Icon name="personne" size={22} />
                {t.site.mySpace}
              </Link>
              <form action={logout}>
                <button
                  type="submit"
                  className="inline-flex min-h-12 items-center gap-2 rounded-sm px-3 text-indigo-900 hover:bg-sable-100"
                >
                  <Icon name="deconnexion" size={22} />
                  <span className="sr-only sm:not-sr-only">{t.site.logout}</span>
                </button>
              </form>
            </>
          ) : (
            <Link
              href="/connexion"
              className="inline-flex min-h-12 items-center gap-2 rounded-sm border-[1.5px] border-indigo-900 px-4 font-bold text-indigo-900 hover:bg-indigo-900 hover:text-sable-50"
            >
              <Icon name="personne" size={22} />
              {t.site.login}
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
