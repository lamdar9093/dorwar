import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Icon } from "@/components/icons";
import { ListenButton } from "@/components/listen-button";
import { LinkButton } from "@/components/ui/button";
import { FlashNotice } from "@/components/ui/flash-notice";
import { Medallion } from "@/components/ui/medallion";
import { Notice } from "@/components/ui/notice";
import { Tag } from "@/components/ui/pill";
import { WhatsAppButton } from "@/components/site/whatsapp-button";
import { motsWolof } from "@/i18n";
import { requireSpace } from "@/lib/auth/guards";
import { cn } from "@/lib/cn";
import { capitalize, getWorkerByUserId, skillLabels, type WorkerDossier } from "@/lib/data/workers";
import { formatDate } from "@/lib/format";
import { publicProfilePath } from "@/lib/public-profile";
import { providerNoun } from "@/lib/services/repository";
import { dossierProgress } from "@/lib/verification";

export const metadata: Metadata = { title: "Mon dossier" };

export default async function WorkerHomePage({ searchParams }: PageProps<"/espace-prestataire">) {
  const user = await requireSpace("prestataire", "/espace-prestataire");
  const query = await searchParams;
  const worker = await getWorkerByUserId(user.id);
  if (!worker) redirect("/espace-prestataire/inscription");

  return (
    <div className="mx-auto max-w-2xl space-y-10">
      <FlashNotice value={query.ok} />
      <header className="flex items-center gap-4">
        <Medallion
          firstName={worker.firstName}
          lastInitial={worker.lastInitial}
          seed={worker.profileId}
          size="md"
        />
        <div>
          <p className="text-lg text-gris-700">
            <span lang="wo">{motsWolof.commentVasTu}</span>, {worker.firstName} ?
          </p>
          <h1 className="text-3xl sm:text-4xl">Mon dossier</h1>
        </div>
      </header>

      {worker.dossiers.map((dossier) => (
        <DossierStatus key={dossier.id} dossier={dossier} gender={worker.gender} />
      ))}

      <section
        aria-labelledby="visible"
        className="rounded-md border border-ligne bg-white p-5 sm:p-6"
      >
        <h2 id="visible" className="text-2xl">
          Ce que l’on voit de vous
        </h2>
        <p className="mt-1 text-gris-700">
          Une fois votre profil vérifié, et seulement ces informations.
        </p>
        <dl className="mt-4 space-y-3">
          <div>
            <dt className="font-bold">Nom affiché, visible par tout le monde</dt>
            <dd>
              {worker.firstName} {worker.lastInitial}. · {worker.areaName}
            </dd>
          </div>
          <div>
            <dt className="font-bold">Langues</dt>
            <dd>{worker.languages.map(capitalize).join(", ")}</dd>
          </div>
          {worker.dossiers.map((d) => (
            <div key={d.id}>
              <dt className="font-bold">{d.service.name}</dt>
              <dd className="mt-1 flex flex-wrap gap-2">
                {skillLabels(d.service, d.skills).map((s) => (
                  <Tag key={s}>{s}</Tag>
                ))}
              </dd>
            </div>
          ))}
          <div>
            <dt className="font-bold">Seulement pour les familles inscrites</dt>
            <dd>{worker.age} ans · le tarif que vous souhaitez</dd>
          </div>
        </dl>
        {worker.dossiers.some((d) => d.status === "verifie" && d.service.active) && (
          <LinkButton
            href={publicProfilePath(worker.profileId)}
            variant="secondary"
            className="mt-5"
            iconAfter="arrowRight"
          >
            Voir mon profil comme un visiteur
          </LinkButton>
        )}
        <p className="mt-4 flex gap-2 text-sm text-gris-700">
          <Icon name="cadenas" size={20} className="shrink-0" />
          Jamais votre nom complet, votre adresse, votre numéro ni votre carte d’identité.
        </p>
      </section>

      <section className="rounded-md bg-sable-100 p-5 sm:p-6">
        <h2 className="text-2xl">Une question ?</h2>
        <p className="mt-1 text-gris-700">
          L’équipe Dorwar vous répond, en français ou en wolof. Vous pouvez aussi envoyer un message
          vocal.
        </p>
        <div className="mt-4">
          <WhatsAppButton full message={`Bonjour l’équipe Dorwar, c’est ${worker.firstName} : `} />
        </div>
      </section>
    </div>
  );
}

function DossierStatus({ dossier, gender }: { dossier: WorkerDossier; gender: "femme" | "homme" }) {
  const { service } = dossier;
  const steps = service.config.verification;
  const progress = dossierProgress(steps, dossier.steps);
  const e = gender === "femme" ? "e" : "";
  const headline =
    dossier.status === "verifie"
      ? `Vous êtes vérifié${e} par Dorwar.`
      : dossier.status === "refuse"
        ? "Votre dossier n’a pas été retenu."
        : dossier.status === "suspendu"
          ? "Votre carte est suspendue."
          : dossier.status === "en_cours"
            ? `Votre vérification avance : ${progress.done} étapes sur ${progress.total}.`
            : "Votre inscription est bien reçue.";
  const next =
    dossier.status === "en_attente"
      ? "Prochaine étape : un agent Dorwar vous appelle pour fixer un rendez-vous. Préparez votre carte d’identité."
      : dossier.status === "en_cours"
        ? "L’agent vous appelle pour la suite. Rien à faire de votre côté en attendant."
        : dossier.status === "verifie"
          ? "Votre profil est proposé aux familles près de chez vous. Gardez votre carte Dorwar sur votre téléphone."
          : (dossier.decisionReason ?? "");

  return (
    <section aria-labelledby={`dossier-${dossier.id}`} className="space-y-5">
      <div
        className={cn(
          "rounded-md p-5 sm:p-6",
          dossier.status === "verifie"
            ? "bg-baobab-600 text-white"
            : dossier.status === "refuse" || dossier.status === "suspendu"
              ? "bg-rouge-100"
              : "bg-ocre-100",
        )}
      >
        <p
          className={cn(
            "eyebrow",
            dossier.status === "verifie" ? "text-baobab-100" : "text-terre-700",
          )}
        >
          {service.name} · {providerNoun(service, gender)}
        </p>
        <h2
          id={`dossier-${dossier.id}`}
          className={cn(
            "mt-2 text-3xl",
            dossier.status === "verifie" ? "text-white" : "text-indigo-900",
          )}
        >
          {headline}
        </h2>
        <p
          className={cn(
            "mt-2 text-lg",
            dossier.status === "verifie" ? "text-white" : "text-indigo-900",
          )}
        >
          {next}
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <ListenButton text={`${headline} ${next}`} />
          {dossier.status === "verifie" && (
            <LinkButton href="/espace-prestataire/carte" variant="light" icon="carte">
              Voir ma carte Dorwar
            </LinkButton>
          )}
        </div>
      </div>

      <ol className="space-y-2">
        {steps.map((step) => {
          const state = dossier.steps.find((s) => s.type === step.key);
          const own = state?.status === "fait";
          const failed = state?.status === "echec";
          return (
            <li
              key={step.key}
              className="flex items-center gap-4 rounded-md border border-ligne bg-white p-4"
            >
              <span
                className={cn(
                  "flex size-12 shrink-0 items-center justify-center rounded-full",
                  own ? "bg-baobab-600 text-white" : "bg-sable-100 text-indigo-900",
                )}
              >
                {own ? (
                  <Icon name="check" size={24} strokeWidth={3} />
                ) : (
                  <Icon name={step.icon} size={26} />
                )}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-lg">{step.plainLabel}</span>
                <span
                  className={cn(
                    "block text-sm font-bold",
                    own ? "text-baobab-700" : failed ? "text-rouge-700" : "text-gris-700",
                  )}
                >
                  {own
                    ? `Fait${state?.completedAt ? ` le ${formatDate(state.completedAt)}` : ""}`
                    : failed
                      ? "À reprendre avec l’agent"
                      : "À venir"}
                </span>
              </span>
            </li>
          );
        })}
      </ol>
      {(dossier.status === "refuse" || dossier.status === "suspendu") && (
        <Notice tone="info" title="Vous pouvez en parler avec l’équipe.">
          Écrivez-nous sur WhatsApp : nous vous expliquons et, si c’est possible, nous reprenons le
          dossier avec vous.
        </Notice>
      )}
    </section>
  );
}
