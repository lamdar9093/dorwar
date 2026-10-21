import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { familyProfiles } from "@/db/schema";
import { AppFooter, AppHeader } from "@/components/site/app-header";
import { WhatsAppButton } from "@/components/site/whatsapp-button";
import { getCurrentUser } from "@/lib/auth/session";
import { formatPhone } from "@/lib/format";

// Chaque page de cet espace vérifie elle-même l'accès (requireSpace) : le layout ne fait qu'afficher.
export default async function FamilleLayout({ children }: LayoutProps<"/">) {
  const user = await getCurrentUser();
  let label = "";
  if (user?.role === "famille") {
    const [profile] = await db
      .select({ name: familyProfiles.displayName })
      .from(familyProfiles)
      .where(eq(familyProfiles.userId, user.id))
      .limit(1);
    label = `${profile?.name ?? "Famille"} · ${formatPhone(user.phone)}`;
  }
  return (
    <>
      <AppHeader
        label={label}
        nav={
          user?.role === "famille"
            ? [
                { href: "/demandes", label: "Mes demandes", icon: "liste" },
                { href: "/demande", label: "Nouvelle demande", icon: "plus" },
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
