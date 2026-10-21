import type { Metadata } from "next";
import { Icon } from "@/components/icons";
import { SectionHeading } from "@/components/ui/section-heading";
import { WhatsAppButton } from "@/components/site/whatsapp-button";

export const metadata: Metadata = {
  title: "Vos données",
  description:
    "Ce que Dorwar conserve, pourquoi, qui y a accès, et comment demander à tout supprimer.",
};

const ROWS = [
  {
    who: "Familles",
    what: "Numéro de téléphone (vérifié par code), nom présenté, quartier, demandes, avis.",
    why: "Vous connecter, vous présenter des profils proches, organiser les rencontres, protéger les personnes accueillies.",
    seen: "Les personnes que vous rencontrez voient votre nom présenté et votre quartier, jamais votre numéro ni votre adresse. Vos avis sont publics, signés « Une famille » et votre quartier, sans votre nom.",
  },
  {
    who: "Celles et ceux qui proposent leurs services",
    what: "Nom, année de naissance, numéro, quartier, langues, savoir-faire, et pour la vérification : pièce d’identité, photo, adresse, références, notes d’entretien.",
    why: "Vérifier sur le terrain, présenter un profil fiable aux familles, délivrer la carte Dorwar.",
    seen: "Une fois le profil vérifié, tout visiteur du site voit le prénom, l’initiale, le quartier, les langues, le savoir-faire, la date de chaque vérification et les avis des familles. Seules les familles inscrites voient aussi l’âge et la rémunération souhaitée. Les documents ne sont vus que par l’équipe. Les profils ne sont pas proposés aux moteurs de recherche.",
  },
];

export default function DataPage() {
  return (
    <div className="container-page py-12 md:py-20">
      <SectionHeading
        as="h1"
        eyebrow="Vos données"
        title="Le minimum, bien gardé."
        intro="Dorwar vend la confiance : elle commence par la façon dont nous traitons vos informations."
      />

      <ul className="mt-12 grid gap-6 md:grid-cols-3">
        {[
          {
            icon: "cadenas",
            title: "Les pièces d’identité ne sont jamais publiées",
            text: "Elles sont stockées à part, en privé. Seul le résultat de la vérification est visible, avec sa date.",
          },
          {
            icon: "liste",
            title: "Chaque consultation est enregistrée",
            text: "Quand un membre de l’équipe ouvre un document, son nom, la date et l’heure sont inscrits dans un journal.",
          },
          {
            icon: "adresse",
            title: "Jamais d’adresse ni de position précise",
            text: "Seuls le quartier et une distance arrondie sont affichés. Votre position partagée est arrondie à environ 100 m.",
          },
        ].map((item) => (
          <li key={item.title} className="rounded-md border border-ligne bg-white p-5">
            <Icon name={item.icon} size={30} className="text-terre-700" />
            <h2 className="mt-3 font-sans text-lg font-bold">{item.title}</h2>
            <p className="mt-2 text-gris-700">{item.text}</p>
          </li>
        ))}
      </ul>

      <section className="mt-16" aria-labelledby="quoi">
        <h2 id="quoi" className="text-3xl">
          Ce que nous gardons, et pourquoi
        </h2>
        <div className="mt-6 space-y-6">
          {ROWS.map((row) => (
            <dl key={row.who} className="grid gap-4 border-t border-indigo-900 pt-5 md:grid-cols-4">
              <dt className="font-display text-2xl md:col-span-1">{row.who}</dt>
              <dd className="md:col-span-1">
                <p className="eyebrow text-terre-700">Quoi</p>
                <p className="mt-1">{row.what}</p>
              </dd>
              <dd className="md:col-span-1">
                <p className="eyebrow text-terre-700">Pourquoi</p>
                <p className="mt-1">{row.why}</p>
              </dd>
              <dd className="md:col-span-1">
                <p className="eyebrow text-terre-700">Qui le voit</p>
                <p className="mt-1">{row.seen}</p>
              </dd>
            </dl>
          ))}
        </div>
      </section>

      <section className="mt-16 grid gap-8 md:grid-cols-2" aria-labelledby="droits">
        <div>
          <h2 id="droits" className="text-3xl">
            Vos droits
          </h2>
          <p className="mt-4 text-lg text-gris-700">
            Vous pouvez demander à voir, corriger ou supprimer vos données, et retirer votre accord
            à tout moment. Écrivez-nous : nous répondons et agissons rapidement. Au Sénégal, la
            protection des données personnelles est encadrée par la loi et par la Commission de
            protection des données personnelles (CDP), que vous pouvez saisir.
          </p>
          <div className="mt-6">
            <WhatsAppButton message="Bonjour l’équipe Dorwar, je voudrais exercer mes droits sur mes données : " />
          </div>
        </div>
        <div className="rounded-md bg-sable-100 p-6">
          <h2 className="text-2xl">Version de démonstration</h2>
          <p className="mt-3 text-gris-700">
            Ce site est une démonstration : toutes les personnes, familles et documents présentés
            sont fictifs. Aucun paiement n’est traité et aucun SMS n’est envoyé. Les durées de
            conservation et les mentions légales définitives seront fixées avant tout lancement.
          </p>
        </div>
      </section>
    </div>
  );
}
