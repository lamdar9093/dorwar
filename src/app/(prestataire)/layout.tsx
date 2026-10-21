import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { workerProfiles } from "@/db/schema";
import { AppFooter, AppHeader } from "@/components/site/app-header";
import { WhatsAppButton } from "@/components/site/whatsapp-button";
import { getCurrentUser } from "@/lib/auth/session";
import { formatPhone } from "@/lib/format";

// Chaque page vérifie elle-même l'accès : ce layout n'affiche que l'en-tête.
export default async function PrestataireLayout({ children }: LayoutProps<"/">) {
  const user = await getCurrentUser();
  let hasProfile = false;
  if (user?.role === "prestataire") {
    const [profile] = await db
      .select({ id: workerProfiles.id })
      .from(workerProfiles)
      .where(eq(workerProfiles.userId, user.id))
      .limit(1);
    hasProfile = Boolean(profile);
  }
  return (
    <>
      <AppHeader
        label={user ? formatPhone(user.phone) : ""}
        nav={
          hasProfile
            ? [
                {
                  href: "/espace-prestataire",
                  label: "Mon dossier",
                  icon: "bouclier",
                  exact: true,
                },
                { href: "/espace-prestataire/carte", label: "Ma carte", icon: "carte" },
                { href: "/espace-prestataire/missions", label: "Mes missions", icon: "calendrier" },
              ]
            : []
        }
      />
      <main id="contenu" className="container-page flex-1 py-8 sm:py-12">
        {children}
      </main>
      <AppFooter>
        <WhatsAppButton variant="quiet" />
      </AppFooter>
    </>
  );
}
