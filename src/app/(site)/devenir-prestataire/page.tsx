import type { Metadata } from "next";
import { connection } from "next/server";
import { Seal } from "@/components/brand/seal";
import { Icon } from "@/components/icons";
import { LinkButton } from "@/components/ui/button";
import { SectionHeading } from "@/components/ui/section-heading";
import { WhatsAppButton } from "@/components/site/whatsapp-button";
import { getDictionary } from "@/i18n";
import { getCurrentUser } from "@/lib/auth/session";
import { getActiveServices } from "@/lib/services/repository";

export const metadata: Metadata = {
  title: "Je propose mes services",
  description:
    "Être vérifié par Dorwar, c’est être pris au sérieux : des familles identifiées, des conditions écrites, une équipe à qui parler.",
};

const STEPS = [
  {
    icon: "phone",
    title: "Vous vous inscrivez",
    text: "Avec votre numéro de téléphone. Quelques questions simples, on peut vous les lire à voix haute.",
  },
  {
    icon: "entretien",
    title: "Notre agent vous rencontre",
    text: "Carte d’identité, photo, visite de votre adresse, deux personnes qui vous connaissent, un entretien.",
  },
  {
    icon: "carte",
    title: "Vous recevez votre carte Dorwar",
    text: "Votre profil est présenté aux familles près de chez vous. Elles scannent votre carte pour vérifier.",
  },
] as const;

export default async function BecomeProviderPage() {
  await connection();
  const [t, user, services] = await Promise.all([
    getDictionary(),
    getCurrentUser(),
    getActiveServices(),
  ]);
  const start =
    user?.role === "prestataire"
      ? { href: "/espace-prestataire", label: "Voir mon dossier" }
      : {
          href: "/connexion?role=prestataire&suite=%2Fespace-prestataire%2Finscription",
          label: "Commencer mon inscription",
        };

  return (
    <>
      <section className="motif-tisse border-b border-ligne/70">
        <div className="container-page grid items-center gap-10 py-12 md:grid-cols-12 md:py-20">
          <div className="md:col-span-8">
            <p className="eyebrow text-terre-700">{t.home.providers.eyebrow}</p>
            <h1 className="mt-3 text-4xl sm:text-5xl lg:text-6xl">{t.home.providers.title}</h1>
            <p className="mt-5 max-w-2xl text-xl text-gris-700">{t.home.providers.quote}</p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <LinkButton href={start.href} size="lg" iconAfter="arrowRight">
                {start.label}
              </LinkButton>
            </div>
            <p className="mt-4 text-gris-700">
              Services ouverts : {services.map((s) => s.name).join(", ")}. L’inscription est
              gratuite.
            </p>
          </div>
          <div className="hidden justify-center md:col-span-4 md:flex">
            <Seal size={220} className="-rotate-[8deg]" />
          </div>
        </div>
      </section>

      <section className="container-page py-16 md:py-20">
        <SectionHeading title="Comment ça se passe" />
        <ol className="mt-10 grid gap-8 md:grid-cols-3">
          {STEPS.map((step, i) => (
            <li key={step.title} className="border-t-2 border-terre-600 pt-6">
              <span className="flex items-center gap-3">
                <span className="font-display text-4xl text-terre-600">{i + 1}</span>
                <Icon name={step.icon} size={30} className="text-indigo-900" />
              </span>
              <h2 className="mt-3 text-2xl">{step.title}</h2>
              <p className="mt-2 text-gris-700">{step.text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="bg-sable-100">
        <div className="container-page grid gap-8 py-16 md:grid-cols-3 md:py-20">
          {t.home.providers.points.map((p) => (
            <div key={p.title}>
              <Icon name={p.icon} size={32} className="text-terre-700" />
              <h2 className="mt-3 text-2xl">{p.title}</h2>
              <p className="mt-2 text-gris-700">{p.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="container-page py-16">
        <div className="grid gap-6 md:grid-cols-12 md:items-center">
          <div className="md:col-span-7">
            <h2 className="text-3xl">{t.home.providers.missions}</h2>
            <p className="mt-3 text-lg text-gris-700">
              Vous ne lisez pas facilement ? Ce n’est pas un problème : appelez-nous ou envoyez un
              message vocal, on vous inscrit au téléphone.
            </p>
          </div>
          <div className="flex flex-col gap-3 md:col-span-5 md:items-end">
            <WhatsAppButton
              label="Envoyer un message vocal sur WhatsApp"
              message="Bonjour l’équipe Dorwar, je voudrais m’inscrire."
            />
          </div>
        </div>
      </section>
    </>
  );
}
