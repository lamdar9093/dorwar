import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { Icon } from "@/components/icons";
import { ActionForm } from "@/components/ui/action-form";
import { ExternalButton } from "@/components/ui/button";
import { FlashNotice } from "@/components/ui/flash-notice";
import { Label, TextArea } from "@/components/ui/field";
import { Medallion } from "@/components/ui/medallion";
import { Notice } from "@/components/ui/notice";
import { Pill, Tag } from "@/components/ui/pill";
import { SubmitButton } from "@/components/ui/submit-button";
import { fr } from "@/i18n/fr";
import { requireSpace } from "@/lib/auth/guards";
import { cn } from "@/lib/cn";
import { getDossier, logDossierOpening, type DossierDetail } from "@/lib/data/dossiers";
import { capitalize, skillLabels } from "@/lib/data/workers";
import {
  ageFromBirthYear,
  formatDate,
  formatDateTime,
  formatFcfa,
  formatPhone,
  joinFr,
} from "@/lib/format";
import { whatsappLink } from "@/lib/phone";
import { providerNoun } from "@/lib/services/repository";
import { canValidateDossier, dossierProgress } from "@/lib/verification";
import {
  deleteDocument,
  rejectDossier,
  reopenDossier,
  savePresentation,
  suspendDossier,
  updateStep,
  validateDossier,
} from "../../actions";
import { DocumentUploader } from "./document-uploader";

export const metadata: Metadata = { title: "Dossier" };

const ACCESS_LABELS: Record<string, string> = {
  consultation: "a consulté",
  televersement: "a ajouté",
  suppression: "a supprimé",
  ouverture_dossier: "a ouvert le dossier",
};

export default async function DossierPage({
  params,
  searchParams,
}: PageProps<"/agent/dossiers/[id]">) {
  const { id } = await params;
  const query = await searchParams;
  const agent = await requireSpace("agent", `/agent/dossiers/${id}`);
  const dossier = await getDossier(id);
  if (!dossier) notFound();
  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
  await logDossierOpening(agent.id, dossier.profile.id, ip);

  const { profile, service } = dossier;
  const config = service.config.verification;
  const progress = dossierProgress(config, dossier.steps);
  const ready = canValidateDossier(config, dossier.steps);
  const nextStep = config.find(
    (c) => dossier.steps.find((s) => s.type === c.key)?.status !== "fait",
  );
  const open = dossier.status === "en_attente" || dossier.status === "en_cours";

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href="/agent"
        className="inline-flex min-h-12 items-center gap-2 font-bold text-indigo-900"
      >
        <Icon name="arrowLeft" size={20} />
        Dossiers
      </Link>

      <FlashNotice value={query.ok} className="mt-2" />
      <header className="mt-2 rounded-md border border-ligne bg-white p-4 sm:p-6">
        <div className="flex gap-4">
          <Medallion
            firstName={profile.firstName}
            lastInitial={profile.lastName.charAt(0)}
            seed={profile.id}
            size="md"
          />
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-3xl">
              {profile.firstName} {profile.lastName}
            </h1>
            <p className="text-gris-700">
              {capitalize(providerNoun(service, profile.gender))} ·{" "}
              {ageFromBirthYear(profile.birthYear)} ans · {profile.areaName}
            </p>
            <p className="mt-1 font-bold">{formatPhone(profile.phone)}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <StatusPill status={dossier.status} />
              <span className="text-sm text-gris-700">
                Inscription le {formatDate(dossier.submittedAt)}
              </span>
            </div>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <ExternalButton href={`tel:${profile.phone}`} variant="success" icon="phone" full>
            Appeler
          </ExternalButton>
          <ExternalButton
            href={whatsappLink(profile.phone.replace("+", ""))}
            variant="secondary"
            icon="discussion"
            full
          >
            WhatsApp
          </ExternalButton>
        </div>
        {dossier.decisionReason &&
          (dossier.status === "refuse" || dossier.status === "suspendu") && (
            <Notice
              tone="attention"
              className="mt-4"
              title={dossier.status === "refuse" ? "Motif du refus" : "Motif de la suspension"}
            >
              {dossier.decisionReason}
            </Notice>
          )}
      </header>

      <details className="group mt-4 rounded-md border border-ligne bg-white">
        <summary className="flex min-h-14 items-center justify-between gap-3 px-4 font-bold">
          Ce que la personne a déclaré
          <Icon
            name="chevronDown"
            size={20}
            className="transition-transform group-open:rotate-180"
          />
        </summary>
        <ProfileFacts dossier={dossier} />
      </details>

      <section className="mt-8" aria-labelledby="etapes">
        <div className="flex items-baseline justify-between gap-3">
          <h2 id="etapes" className="text-2xl">
            Vérification
          </h2>
          <p className="font-bold">
            {progress.done} sur {progress.total}
          </p>
        </div>
        <ol className="mt-4 space-y-3">
          {config.map((stepConfig, index) => {
            const step = dossier.steps.find((s) => s.type === stepConfig.key);
            if (!step) return null;
            const docs = dossier.documents.filter((d) => d.verificationStepId === step.id);
            return (
              <li key={step.id}>
                <details
                  open={nextStep?.key === stepConfig.key && open}
                  className={cn(
                    "group rounded-md border bg-white",
                    step.status === "fait"
                      ? "border-baobab-600/40"
                      : step.status === "echec"
                        ? "border-rouge-700/40"
                        : "border-ligne",
                  )}
                >
                  <summary className="flex min-h-16 items-center gap-3 px-4 py-3">
                    <span
                      className={cn(
                        "flex size-10 shrink-0 items-center justify-center rounded-full",
                        step.status === "fait"
                          ? "bg-baobab-600 text-white"
                          : step.status === "echec"
                            ? "bg-rouge-100 text-rouge-700"
                            : "bg-sable-100 text-indigo-900",
                      )}
                    >
                      {step.status === "fait" ? (
                        <Icon name="check" size={20} strokeWidth={3} />
                      ) : step.status === "echec" ? (
                        <Icon name="x" size={20} strokeWidth={2.6} />
                      ) : (
                        <Icon name={stepConfig.icon} size={22} />
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-bold">
                        {index + 1}. {stepConfig.label}
                      </span>
                      <span className="block text-sm text-gris-700">
                        {step.status === "fait" && step.completedAt
                          ? `Fait le ${formatDate(step.completedAt)}${step.agentName ? ` par ${step.agentName}` : ""}`
                          : step.status === "echec"
                            ? "Échec — voir la note"
                            : "À faire"}
                        {docs.length > 0 &&
                          ` · ${docs.length} document${docs.length > 1 ? "s" : ""}`}
                      </span>
                    </span>
                    <Icon
                      name="chevronDown"
                      size={20}
                      className="shrink-0 transition-transform group-open:rotate-180"
                    />
                  </summary>
                  <div className="space-y-5 border-t border-ligne px-4 pt-4 pb-5">
                    <p className="flex gap-2 rounded-sm bg-sable-100 p-3 text-sm">
                      <Icon name="info" size={20} className="shrink-0" />
                      <span>{stepConfig.agentHint}</span>
                    </p>

                    {docs.length > 0 && (
                      <ul className="space-y-2">
                        {docs.map((doc) => (
                          <li
                            key={doc.id}
                            className="flex items-center gap-2 rounded-sm border border-ligne p-2 pl-3"
                          >
                            <Icon name="cadenas" size={18} className="shrink-0 text-gris-700" />
                            <span className="min-w-0 flex-1 truncate text-sm">
                              {doc.label ?? "Document"} · {formatDate(doc.createdAt)}
                            </span>
                            <a
                              href={`/api/documents/${doc.id}`}
                              target="_blank"
                              rel="noopener"
                              className="inline-flex min-h-11 items-center rounded-sm px-3 font-bold text-indigo-900 underline"
                            >
                              Voir
                            </a>
                            <ActionForm action={deleteDocument}>
                              <input type="hidden" name="document" value={doc.id} />
                              <input type="hidden" name="dossier" value={dossier.id} />
                              <button
                                type="submit"
                                className="inline-flex min-h-11 items-center rounded-sm px-2 text-rouge-700"
                                aria-label={`Supprimer ${doc.label ?? "le document"}`}
                              >
                                <Icon name="supprimer" size={20} />
                              </button>
                            </ActionForm>
                          </li>
                        ))}
                        <li className="text-xs text-gris-700">
                          Chaque consultation est inscrite au journal du dossier.
                        </li>
                      </ul>
                    )}

                    {stepConfig.acceptsDocuments && (
                      <DocumentUploader stepId={step.id} stepLabel={stepConfig.label} />
                    )}

                    <ActionForm action={updateStep} className="space-y-3">
                      <input type="hidden" name="etape" value={step.id} />
                      <div>
                        <Label htmlFor={`notes-${step.id}`} optional>
                          Notes privées
                        </Label>
                        <TextArea
                          id={`notes-${step.id}`}
                          name="notes"
                          defaultValue={step.notes ?? ""}
                          rows={3}
                          maxLength={2000}
                        />
                      </div>
                      <div className="grid gap-2 sm:grid-cols-3">
                        <SubmitButton
                          name="statut"
                          value="fait"
                          variant="success"
                          icon="check"
                          pendingLabel="…"
                          full
                        >
                          C’est fait
                        </SubmitButton>
                        <SubmitButton
                          name="statut"
                          value="note"
                          variant="secondary"
                          pendingLabel="…"
                          full
                        >
                          Enregistrer la note
                        </SubmitButton>
                        {step.status === "a_faire" ? (
                          <SubmitButton
                            name="statut"
                            value="echec"
                            variant="danger"
                            pendingLabel="…"
                            full
                          >
                            Échec
                          </SubmitButton>
                        ) : (
                          <SubmitButton
                            name="statut"
                            value="a_faire"
                            variant="quiet"
                            pendingLabel="…"
                            full
                          >
                            Remettre à faire
                          </SubmitButton>
                        )}
                      </div>
                    </ActionForm>
                  </div>
                </details>
              </li>
            );
          })}
        </ol>
      </section>

      <section
        className="mt-8 rounded-md border border-ligne bg-white p-4 sm:p-6"
        aria-labelledby="presentation"
      >
        <h2 id="presentation" className="text-2xl">
          Présentation pour les familles
        </h2>
        <p className="mt-1 text-sm text-gris-700">
          Rédigée après l’entretien, avec respect : expérience, savoir-faire, ce que la personne
          cherche.
        </p>
        <ActionForm action={savePresentation} className="mt-4 space-y-3">
          <input type="hidden" name="dossier" value={dossier.id} />
          <label htmlFor="presentation-texte" className="sr-only">
            Présentation
          </label>
          <TextArea
            id="presentation-texte"
            name="presentation"
            defaultValue={profile.presentation ?? ""}
            rows={5}
            maxLength={600}
          />
          <SubmitButton variant="secondary" pendingLabel="Enregistrement…">
            Enregistrer la présentation
          </SubmitButton>
        </ActionForm>
      </section>

      <section
        className="mt-8 rounded-md border border-ligne bg-white p-4 sm:p-6"
        aria-labelledby="decision"
      >
        <h2 id="decision" className="text-2xl">
          Décision
        </h2>
        {open ? (
          <div className="mt-4 space-y-4">
            {ready ? (
              <p className="text-gris-700">
                Toutes les étapes sont faites. Le profil peut être validé : il sera proposé aux
                familles et sa carte Dorwar sera active.
              </p>
            ) : (
              <p className="text-gris-700">
                Encore {progress.total - progress.done} étape
                {progress.total - progress.done > 1 ? "s" : ""} avant de pouvoir valider ce profil.
              </p>
            )}
            <ActionForm action={validateDossier}>
              <input type="hidden" name="dossier" value={dossier.id} />
              <SubmitButton
                variant="success"
                size="lg"
                full
                icon="bouclier"
                disabled={!ready}
                pendingLabel="Validation…"
              >
                Valider le profil
              </SubmitButton>
            </ActionForm>
            <details className="group">
              <summary className="inline-flex min-h-12 items-center gap-2 font-bold text-rouge-700 underline">
                Refuser le dossier…
              </summary>
              <ActionForm action={rejectDossier} className="mt-3 space-y-3">
                <input type="hidden" name="dossier" value={dossier.id} />
                <Label htmlFor="motif-refus">Motif, expliqué à la personne</Label>
                <TextArea
                  id="motif-refus"
                  name="motif"
                  required
                  minLength={10}
                  maxLength={500}
                  rows={3}
                />
                <SubmitButton variant="danger" pendingLabel="Enregistrement…">
                  Confirmer le refus
                </SubmitButton>
              </ActionForm>
            </details>
          </div>
        ) : dossier.status === "verifie" ? (
          <div className="mt-4 space-y-4">
            <p className="text-gris-700">
              Vérifié le {dossier.verifiedAt ? formatDate(dossier.verifiedAt) : "—"}. Carte Dorwar
              n° <strong>{profile.cardId}</strong>.
            </p>
            <details className="group">
              <summary className="inline-flex min-h-12 items-center gap-2 font-bold text-rouge-700 underline">
                Suspendre la carte…
              </summary>
              <ActionForm action={suspendDossier} className="mt-3 space-y-3">
                <input type="hidden" name="dossier" value={dossier.id} />
                <Label htmlFor="motif-suspension">Motif de la suspension</Label>
                <TextArea
                  id="motif-suspension"
                  name="motif"
                  required
                  minLength={10}
                  maxLength={500}
                  rows={3}
                />
                <SubmitButton variant="danger" pendingLabel="Enregistrement…">
                  Suspendre
                </SubmitButton>
              </ActionForm>
            </details>
          </div>
        ) : (
          <ActionForm action={reopenDossier} className="mt-4">
            <input type="hidden" name="dossier" value={dossier.id} />
            <SubmitButton variant="secondary" pendingLabel="…">
              {dossier.status === "suspendu" ? "Réactiver la carte" : "Rouvrir le dossier"}
            </SubmitButton>
          </ActionForm>
        )}
      </section>

      <section className="mt-8" aria-labelledby="journal">
        <h2 id="journal" className="font-sans text-lg font-bold">
          Journal des accès
        </h2>
        <ul className="mt-2 space-y-1 text-sm text-gris-700">
          {dossier.accessLog.map((entry, i) => (
            <li key={i}>
              {formatDateTime(entry.at)} — {entry.userName ?? "Équipe"}{" "}
              {ACCESS_LABELS[entry.action] ?? entry.action}
              {entry.documentLabel ? ` : ${entry.documentLabel}` : ""}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function StatusPill({ status }: { status: DossierDetail["status"] }) {
  const tone =
    status === "verifie"
      ? "succes"
      : status === "refuse" || status === "suspendu"
        ? "danger"
        : status === "en_cours"
          ? "attente"
          : "info";
  return <Pill tone={tone}>{fr.dossier[status]}</Pill>;
}

function ProfileFacts({ dossier }: { dossier: DossierDetail }) {
  const { profile, service } = dossier;
  const formulas = service.config.formulas
    .filter((f) => dossier.formulaKeys.includes(f.key))
    .map((f) => f.label);
  return (
    <dl className="grid gap-4 border-t border-ligne px-4 py-4 text-sm sm:grid-cols-2">
      <div>
        <dt className="font-bold">Formules</dt>
        <dd>{joinFr(formulas)}</dd>
      </div>
      <div>
        <dt className="font-bold">Savoir-faire</dt>
        <dd className="mt-1 flex flex-wrap gap-1.5">
          {skillLabels(service, dossier.skills).map((s) => (
            <Tag key={s}>{s}</Tag>
          ))}
        </dd>
      </div>
      <div>
        <dt className="font-bold">Langues</dt>
        <dd>{profile.languages.map(capitalize).join(", ")}</dd>
      </div>
      <div>
        <dt className="font-bold">Expérience</dt>
        <dd>{profile.experienceYears} an(s)</dd>
      </div>
      <div>
        <dt className="font-bold">Rémunération souhaitée</dt>
        <dd>
          {[
            profile.monthlyRateFcfa ? `${formatFcfa(profile.monthlyRateFcfa)} par mois` : null,
            profile.dailyRateFcfa ? `${formatFcfa(profile.dailyRateFcfa)} par jour` : null,
          ]
            .filter(Boolean)
            .join(" · ") || "À discuter"}
        </dd>
      </div>
      <div>
        <dt className="font-bold">Zone</dt>
        <dd>
          {profile.areaName}, rayon de {profile.interventionRadiusKm} km
          {profile.acceptedAreaNames.length
            ? ` · accepte aussi : ${joinFr(profile.acceptedAreaNames)}`
            : ""}
          {profile.willingToRelocate ? " · prêt(e) à s’installer ailleurs" : ""}
        </dd>
      </div>
      <div>
        <dt className="font-bold">Consentement</dt>
        <dd>Donné le {formatDate(profile.consentAt)}</dd>
      </div>
    </dl>
  );
}
