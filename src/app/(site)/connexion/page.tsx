import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getDictionary } from "@/i18n";
import { homeFor } from "@/lib/auth/rbac";
import { getCurrentUser } from "@/lib/auth/session";
import { env } from "@/lib/env";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Connexion" };

const DEMO_ACCOUNTS = [
  { phone: "+221770000001", label: "Famille Diallo" },
  { phone: "+221770000002", label: "Aminata, profil vérifié" },
  { phone: "+221770000005", label: "Mariama, dossier en cours" },
  { phone: "+221770000003", label: "Agent de terrain" },
  { phone: "+221770000004", label: "Administration" },
];

export default async function LoginPage({ searchParams }: PageProps<"/connexion">) {
  const params = await searchParams;
  const suite =
    typeof params.suite === "string" &&
    params.suite.startsWith("/") &&
    !params.suite.startsWith("//")
      ? params.suite
      : null;
  const intention = params.role === "prestataire" ? "prestataire" : "famille";

  const user = await getCurrentUser();
  if (user) redirect(suite ?? homeFor(user.role));

  const t = await getDictionary();
  return (
    <div className="motif-tisse">
      <div className="container-page grid gap-10 py-12 md:grid-cols-12 md:py-20">
        <div className="md:col-span-5">
          <h1 className="text-4xl sm:text-5xl">{t.auth.title}</h1>
          <p className="mt-4 max-w-md text-lg text-gris-700">
            {intention === "prestataire" ? t.auth.providerIntro : t.auth.intro}
          </p>
        </div>
        <div className="md:col-span-6 md:col-start-7">
          <div className="rounded-md border border-ligne bg-white p-5 shadow-raise sm:p-8">
            <LoginForm
              texts={{
                phoneLabel: t.auth.phoneLabel,
                phoneHint: t.auth.phoneHint,
                sendCode: t.auth.sendCode,
                sending: t.auth.sending,
                codeTitle: t.auth.codeTitle,
                codeIntro: t.auth.codeIntro,
                demoCode: t.auth.demoCode,
                codeLabel: t.auth.codeLabel,
                verify: t.auth.verify,
                verifying: t.auth.verifying,
                changeNumber: t.auth.changeNumber,
                consent: t.auth.consent,
                consentLink: t.auth.consentLink,
              }}
              suite={suite}
              intention={intention}
              demoAccounts={env().demoMode ? DEMO_ACCOUNTS : null}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
