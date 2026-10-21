"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Icon } from "@/components/icons";
import { ListenButton } from "@/components/listen-button";
import { ChoiceCard, ChoiceChip } from "@/components/ui/choice";
import { FieldError, Hint, inputClasses, Label, Select } from "@/components/ui/field";
import { Notice } from "@/components/ui/notice";
import { SubmitButton } from "@/components/ui/submit-button";
import { ZonePicker, type ZoneOption } from "@/components/zone-picker";
import { cn } from "@/lib/cn";
import { SEARCH_RADII_KM } from "@/lib/form-engine/constants";
import { formatFcfa, formatNumber, joinFr } from "@/lib/format";
import {
  EXPERIENCE_OPTIONS,
  LANGUAGES,
  MIN_AGE,
  type RegistrationPayload,
} from "@/lib/registration";
import { useHydrated } from "@/lib/use-hydrated";
import { registerWorker, type RegisterState } from "./actions";

export type WizardService = {
  id: string;
  name: string;
  icon: string;
  female: string;
  male: string;
  formulas: {
    key: string;
    label: string;
    shortLabel: string;
    icon: string;
    housing: boolean;
    kind: "longue" | "ponctuelle";
  }[];
  skills: { key: string; label: string; icon: string }[];
};

type Props = {
  services: WizardService[];
  areaGroups: { group: string; options: { id: string; label: string }[] }[];
  regions: ZoneOption[];
  wolof: { oui: string; non: string };
  currentYear: number;
};

type State = {
  firstName: string;
  lastName: string;
  gender: "femme" | "homme" | "";
  birthYear: string;
  languages: string[];
  serviceIds: string[];
  formulas: Record<string, string[]>;
  skills: Record<string, string[]>;
  experience: number | null;
  areaId: string;
  areaLabel: string;
  elsewhere: boolean;
  chain: string[];
  radiusKm: number;
  relocate: boolean | null;
  monthly: string;
  daily: string;
  consent: boolean;
};

type Step = { key: string; title: string; listen: string; serviceId?: string };

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const digits = (s: string) => s.replace(/\D/g, "");

export function RegisterWizard({ services, areaGroups, regions, wolof, currentYear }: Props) {
  const [state, setState] = useState<State>({
    firstName: "",
    lastName: "",
    gender: "",
    birthYear: "",
    languages: [],
    serviceIds: services.length === 1 ? [services[0].id] : [],
    formulas: {},
    skills: {},
    experience: null,
    areaId: "",
    areaLabel: "",
    elsewhere: false,
    chain: [],
    radiusKm: 5,
    relocate: null,
    monthly: "",
    daily: "",
    consent: false,
  });
  const [index, setIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [serverState, formAction] = useActionState<RegisterState, FormData>(registerWorker, null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const hydrated = useHydrated();

  const chosen = services.filter((s) => state.serviceIds.includes(s.id));
  const chosenFormulas = chosen.flatMap((s) =>
    s.formulas.filter((f) => (state.formulas[s.id] ?? []).includes(f.key)),
  );
  const wantsHousing = chosenFormulas.some((f) => f.housing);
  const wantsMonthly = chosenFormulas.some((f) => f.kind === "longue");
  const wantsDaily = chosenFormulas.some((f) => f.kind === "ponctuelle");
  const noun = (s: WizardService) =>
    state.gender === "homme"
      ? s.male
      : state.gender === "femme"
        ? s.female
        : `${s.female} ou ${s.male}`;

  const steps: Step[] = (() => {
    const list: Step[] = [
      {
        key: "nom",
        title: "Comment vous appelez-vous ?",
        listen: "Comment vous appelez-vous ? Écrivez votre prénom, puis votre nom.",
      },
      { key: "genre", title: "Vous êtes…", listen: "Vous êtes une femme, ou un homme ?" },
      {
        key: "naissance",
        title: "En quelle année êtes-vous né ou née ?",
        listen: "En quelle année êtes-vous né ou née ? Il faut avoir au moins 18 ans.",
      },
      {
        key: "langues",
        title: "Quelles langues parlez-vous ?",
        listen: "Quelles langues parlez-vous ? Touchez chaque langue que vous parlez.",
      },
    ];
    if (services.length > 1)
      list.push({
        key: "services",
        title: "Que proposez-vous ?",
        listen: "Que proposez-vous ? Choisissez un ou plusieurs services.",
      });
    for (const s of chosen) {
      list.push({
        key: `formules:${s.id}`,
        serviceId: s.id,
        title: "Comment voulez-vous travailler ?",
        listen: `Comment voulez-vous travailler ? ${s.formulas.map((f) => f.label).join(". ")}. Vous pouvez en choisir plusieurs.`,
      });
      list.push({
        key: `savoirs:${s.id}`,
        serviceId: s.id,
        title: "Que savez-vous faire ?",
        listen: `Que savez-vous faire ? ${s.skills.map((k) => k.label).join(". ")}.`,
      });
    }
    list.push(
      {
        key: "experience",
        title: "Depuis combien de temps faites-vous ce travail ?",
        listen: "Depuis combien de temps faites-vous ce travail ?",
      },
      {
        key: "lieu",
        title: "Où habitez-vous ?",
        listen: "Où habitez-vous ? Choisissez votre quartier. Votre adresse exacte reste privée.",
      },
      {
        key: "remuneration",
        title: "Combien souhaitez-vous gagner ?",
        listen: "Combien souhaitez-vous gagner ? Vous pourrez en parler avec l’agent.",
      },
      {
        key: "donnees",
        title: "Vos informations",
        listen:
          "Une fois vérifié, votre profil est visible sur le site, par tout le monde : votre prénom, votre quartier, vos langues, ce que vous savez faire et les avis des familles. Seules les familles inscrites voient votre âge et le tarif que vous souhaitez. Votre carte d’identité, votre adresse et vos références restent privées. Seule l’équipe les voit. Vous pouvez demander à tout supprimer.",
      },
      {
        key: "recap",
        title: "On vérifie ensemble",
        listen: "On vérifie ensemble avant d’envoyer votre inscription.",
      },
    );
    return list;
  })();

  const step = steps[Math.min(index, steps.length - 1)];
  const progress = Math.round(((index + 1) / steps.length) * 100);

  useEffect(() => {
    titleRef.current?.focus();
  }, [index]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- message renvoyé par le serveur
    if (serverState?.error) setError(serverState.error);
  }, [serverState]);

  const set = <K extends keyof State>(key: K, value: State[K]) => {
    setState((prev) => ({ ...prev, [key]: value }));
    setError(null);
  };
  const toggle = (list: string[], value: string) =>
    list.includes(value) ? list.filter((v) => v !== value) : [...list, value];

  const check = (): string | null => {
    switch (step.key) {
      case "nom":
        return state.firstName.trim() && state.lastName.trim()
          ? null
          : "Écrivez votre prénom et votre nom.";
      case "genre":
        return state.gender ? null : "Choisissez une réponse.";
      case "naissance": {
        const y = Number(state.birthYear);
        if (!/^\d{4}$/.test(state.birthYear) || y < 1940)
          return "Écrivez l’année avec 4 chiffres, par exemple 1990.";
        return currentYear - y >= MIN_AGE
          ? null
          : `Il faut avoir au moins ${MIN_AGE} ans pour s’inscrire.`;
      }
      case "langues":
        return state.languages.length ? null : "Choisissez au moins une langue.";
      case "services":
        return state.serviceIds.length ? null : "Choisissez au moins un service.";
      case "experience":
        return state.experience !== null ? null : "Choisissez une réponse.";
      case "lieu":
        if (!state.areaId) return "Choisissez votre quartier.";
        return wantsHousing && state.relocate === null ? "Répondez oui ou non." : null;
      case "donnees":
        return state.consent ? null : "Votre accord est nécessaire pour vous inscrire.";
      default:
        if (step.key.startsWith("formules:"))
          return (state.formulas[step.serviceId!] ?? []).length
            ? null
            : "Choisissez au moins une façon de travailler.";
        if (step.key.startsWith("savoirs:"))
          return (state.skills[step.serviceId!] ?? []).length
            ? null
            : "Choisissez au moins une chose.";
        return null;
    }
  };

  const next = () => {
    const problem = check();
    if (problem) {
      setError(problem);
      return;
    }
    setError(null);
    setIndex((i) => Math.min(i + 1, steps.length - 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const back = () => {
    setError(null);
    setIndex((i) => Math.max(i - 1, 0));
  };

  const payload: RegistrationPayload = {
    firstName: state.firstName.trim(),
    lastName: state.lastName.trim(),
    gender: state.gender,
    birthYear: state.birthYear ? Number(state.birthYear) : null,
    languages: state.languages,
    services: chosen.map((s) => ({
      serviceId: s.id,
      formulaKeys: state.formulas[s.id] ?? [],
      skills: state.skills[s.id] ?? [],
    })),
    experienceYears: state.experience,
    areaId: state.areaId,
    radiusKm: state.radiusKm,
    relocate: Boolean(state.relocate),
    monthly: wantsMonthly && state.monthly ? Number(state.monthly) : null,
    daily: wantsDaily && state.daily ? Number(state.daily) : null,
    consent: state.consent,
  };

  const service = step.serviceId ? services.find((s) => s.id === step.serviceId) : undefined;
  const yesNo = (value: boolean | null, onChange: (v: boolean) => void, name: string) => (
    <div className="grid grid-cols-2 gap-3">
      <ChoiceCard
        name={name}
        checked={value === true}
        onChange={() => onChange(true)}
        label="Oui"
        aside={<span lang="wo">{wolof.oui}</span>}
        icon="check"
        scale="lg"
      />
      <ChoiceCard
        name={name}
        checked={value === false}
        onChange={() => onChange(false)}
        label="Non"
        aside={<span lang="wo">{wolof.non}</span>}
        icon="x"
        scale="lg"
      />
    </div>
  );

  return (
    <div className="mx-auto max-w-xl">
      <div className="flex items-center justify-between text-sm text-gris-700">
        <span>
          Étape {index + 1} sur {steps.length}
        </span>
      </div>
      <div
        className="mt-2 h-2 overflow-hidden rounded-full bg-sable-200"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={progress}
        aria-label="Progression"
      >
        <div
          className="h-full rounded-full bg-terre-600 transition-[width] duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="mt-8 flex flex-wrap items-start justify-between gap-4">
        <h1 ref={titleRef} tabIndex={-1} className="text-3xl outline-none sm:text-4xl">
          {step.title}
        </h1>
        <ListenButton text={step.listen} />
      </div>

      <fieldset
        disabled={!hydrated}
        className="mt-8 min-w-0 space-y-6 disabled:opacity-60"
        key={step.key}
      >
        {step.key === "nom" && (
          <>
            <div>
              <Label htmlFor="prenom">Prénom</Label>
              <input
                id="prenom"
                className={cn(inputClasses, "text-lg")}
                autoComplete="given-name"
                value={state.firstName}
                onChange={(e) => set("firstName", e.target.value)}
                maxLength={40}
              />
            </div>
            <div>
              <Label htmlFor="nom">Nom</Label>
              <input
                id="nom"
                className={cn(inputClasses, "text-lg")}
                autoComplete="family-name"
                value={state.lastName}
                onChange={(e) => set("lastName", e.target.value)}
                maxLength={40}
              />
              <Hint>
                Sur le site, on voit seulement votre prénom et la première lettre de votre nom.
              </Hint>
            </div>
          </>
        )}

        {step.key === "genre" && (
          <div className="grid gap-3">
            <ChoiceCard
              name="genre"
              checked={state.gender === "femme"}
              onChange={() => set("gender", "femme")}
              label="Une femme"
              description={services.map((s) => capitalize(s.female)).join(", ")}
              icon="personne"
              scale="lg"
            />
            <ChoiceCard
              name="genre"
              checked={state.gender === "homme"}
              onChange={() => set("gender", "homme")}
              label="Un homme"
              description={services.map((s) => capitalize(s.male)).join(", ")}
              icon="personne"
              scale="lg"
            />
          </div>
        )}

        {step.key === "naissance" && (
          <div>
            <Label htmlFor="annee">Année de naissance</Label>
            <input
              id="annee"
              inputMode="numeric"
              maxLength={4}
              placeholder="1990"
              value={state.birthYear}
              onChange={(e) => set("birthYear", digits(e.target.value).slice(0, 4))}
              className={cn(
                inputClasses,
                "w-40! text-center font-display text-3xl tracking-widest",
              )}
            />
          </div>
        )}

        {step.key === "langues" && (
          <div className="flex flex-wrap gap-2">
            {LANGUAGES.map((l) => (
              <ChoiceChip
                key={l}
                checked={state.languages.includes(l)}
                onChange={() => set("languages", toggle(state.languages, l))}
                label={capitalize(l)}
                className="min-h-14 px-5 text-lg"
              />
            ))}
          </div>
        )}

        {step.key === "services" && (
          <div className="grid gap-3">
            {services.map((s) => (
              <ChoiceCard
                key={s.id}
                type="checkbox"
                checked={state.serviceIds.includes(s.id)}
                onChange={() => set("serviceIds", toggle(state.serviceIds, s.id))}
                label={s.name}
                icon={s.icon}
                scale="lg"
              />
            ))}
          </div>
        )}

        {step.key.startsWith("formules:") && service && (
          <div className="grid gap-3">
            <p className="text-gris-700">{service.name} · vous pouvez en choisir plusieurs.</p>
            {service.formulas.map((f) => (
              <ChoiceCard
                key={f.key}
                type="checkbox"
                checked={(state.formulas[service.id] ?? []).includes(f.key)}
                onChange={() =>
                  set("formulas", {
                    ...state.formulas,
                    [service.id]: toggle(state.formulas[service.id] ?? [], f.key),
                  })
                }
                label={f.label}
                description={
                  f.kind === "ponctuelle"
                    ? "Mission courte, pour un revenu d’appoint"
                    : f.housing
                      ? "Vous vivez chez la famille"
                      : "Vous rentrez chez vous le soir"
                }
                icon={f.icon}
                scale="lg"
              />
            ))}
          </div>
        )}

        {step.key.startsWith("savoirs:") && service && (
          <div className="grid gap-3 sm:grid-cols-2">
            {service.skills.map((k) => (
              <ChoiceCard
                key={k.key}
                type="checkbox"
                checked={(state.skills[service.id] ?? []).includes(k.key)}
                onChange={() =>
                  set("skills", {
                    ...state.skills,
                    [service.id]: toggle(state.skills[service.id] ?? [], k.key),
                  })
                }
                label={k.label}
                icon={k.icon}
                scale="lg"
              />
            ))}
          </div>
        )}

        {step.key === "experience" && (
          <div className="grid gap-3">
            {EXPERIENCE_OPTIONS.map((o) => (
              <ChoiceCard
                key={o.years}
                name="experience"
                checked={state.experience === o.years}
                onChange={() => set("experience", o.years)}
                label={o.label}
                icon="horloge"
              />
            ))}
          </div>
        )}

        {step.key === "lieu" && (
          <>
            {!state.elsewhere ? (
              <div>
                <Label htmlFor="quartier">Votre quartier</Label>
                <Select
                  id="quartier"
                  value={state.areaId}
                  onChange={(e) => {
                    const option = areaGroups
                      .flatMap((g) => g.options)
                      .find((o) => o.id === e.target.value);
                    setState((prev) => ({
                      ...prev,
                      areaId: e.target.value,
                      areaLabel: option?.label ?? "",
                    }));
                    setError(null);
                  }}
                >
                  <option value="">Choisir…</option>
                  {areaGroups.map((g) => (
                    <optgroup key={g.group} label={g.group}>
                      {g.options.map((o) => (
                        <option key={o.id} value={o.id}>
                          {o.label}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </Select>
                <button
                  type="button"
                  className="mt-3 inline-flex min-h-12 items-center gap-2 font-bold text-indigo-900 underline"
                  onClick={() =>
                    setState((p) => ({ ...p, elsewhere: true, areaId: "", areaLabel: "" }))
                  }
                >
                  J’habite ailleurs au Sénégal
                </button>
              </div>
            ) : (
              <div>
                <ZonePicker
                  chain={state.chain}
                  regions={regions}
                  markClosed={false}
                  onSelect={(areaId, chain, label) =>
                    setState((p) => ({ ...p, areaId, chain, areaLabel: label }))
                  }
                />
                <button
                  type="button"
                  className="mt-3 inline-flex min-h-12 items-center gap-2 font-bold text-indigo-900 underline"
                  onClick={() =>
                    setState((p) => ({
                      ...p,
                      elsewhere: false,
                      chain: [],
                      areaId: "",
                      areaLabel: "",
                    }))
                  }
                >
                  Revenir à la liste des quartiers
                </button>
              </div>
            )}
            <fieldset>
              <legend className="mb-2 text-lg font-bold">
                Jusqu’où pouvez-vous aller travailler ?
              </legend>
              <div className="flex flex-wrap gap-2">
                {SEARCH_RADII_KM.map((r) => (
                  <ChoiceChip
                    key={r}
                    type="radio"
                    name="rayon"
                    checked={state.radiusKm === r}
                    onChange={() => set("radiusKm", r)}
                    label={`${r} km`}
                    className="min-h-14 px-5 text-lg"
                  />
                ))}
              </div>
            </fieldset>
            {wantsHousing && (
              <fieldset>
                <legend className="mb-2 text-lg font-bold">
                  Pour un poste logé, êtes-vous prêt ou prête à vous installer dans une autre ville
                  ?
                </legend>
                {yesNo(state.relocate, (v) => set("relocate", v), "installation")}
              </fieldset>
            )}
          </>
        )}

        {step.key === "remuneration" && (
          <>
            {wantsMonthly && (
              <MoneyField
                id="mensuel"
                label="Par mois (longue durée)"
                unit="FCFA par mois"
                value={state.monthly}
                onChange={(v) => set("monthly", v)}
              />
            )}
            {wantsDaily && (
              <MoneyField
                id="journalier"
                label="Par jour (missions courtes)"
                unit="FCFA par jour"
                value={state.daily}
                onChange={(v) => set("daily", v)}
              />
            )}
            <p className="text-gris-700">
              Vous ne savez pas encore ? Laissez vide : l’agent en parlera avec vous.
            </p>
          </>
        )}

        {step.key === "donnees" && (
          <>
            <ul className="space-y-4 text-lg">
              <li className="flex gap-3">
                <Icon name="personne" size={28} className="shrink-0 text-terre-700" />
                <span>
                  Une fois vérifié, votre profil est visible par tout le monde sur le site : votre
                  prénom, votre quartier, vos langues, ce que vous savez faire et les avis des
                  familles.
                </span>
              </li>
              <li className="flex gap-3">
                <Icon name="maison" size={28} className="shrink-0 text-terre-700" />
                <span>
                  Seules les familles inscrites voient votre âge et le tarif que vous souhaitez.
                </span>
              </li>
              <li className="flex gap-3">
                <Icon name="cadenas" size={28} className="shrink-0 text-terre-700" />
                <span>
                  Votre carte d’identité, votre adresse et vos références restent privées : seule
                  l’équipe Dorwar les voit.
                </span>
              </li>
              <li className="flex gap-3">
                <Icon name="supprimer" size={28} className="shrink-0 text-terre-700" />
                <span>Vous pouvez demander à tout supprimer, à tout moment.</span>
              </li>
            </ul>
            <ChoiceCard
              type="checkbox"
              checked={state.consent}
              onChange={() => set("consent", !state.consent)}
              label="J’accepte"
              aside={<span lang="wo">{wolof.oui}</span>}
              icon="check"
              scale="lg"
            />
          </>
        )}

        {step.key === "recap" && (
          <dl className="divide-y divide-ligne border-y border-ligne">
            {[
              ["Nom", `${payload.firstName} ${payload.lastName}`],
              ["Vous êtes", chosen.map((s) => capitalize(noun(s))).join(", ")],
              ["Année de naissance", state.birthYear],
              ["Langues", joinFr(state.languages.map(capitalize))],
              ["Façons de travailler", joinFr(chosenFormulas.map((f) => f.label))],
              [
                "Savoir-faire",
                joinFr(
                  chosen.flatMap((s) =>
                    s.skills
                      .filter((k) => (state.skills[s.id] ?? []).includes(k.key))
                      .map((k) => k.label),
                  ),
                ),
              ],
              [
                "Expérience",
                EXPERIENCE_OPTIONS.find((o) => o.years === state.experience)?.label ?? "",
              ],
              ["Quartier", `${state.areaLabel}, jusqu’à ${state.radiusKm} km`],
              [
                "Rémunération souhaitée",
                [
                  payload.monthly ? `${formatFcfa(payload.monthly)} par mois` : null,
                  payload.daily ? `${formatFcfa(payload.daily)} par jour` : null,
                ]
                  .filter(Boolean)
                  .join(" · ") || "À discuter",
              ],
            ].map(([label, value]) => (
              <div key={label} className="py-3">
                <dt className="text-sm font-bold text-gris-700">{label}</dt>
                <dd className="text-lg">{value}</dd>
              </div>
            ))}
          </dl>
        )}

        {error && <FieldError>{error}</FieldError>}
      </fieldset>

      <div className="sticky bottom-0 -mx-4 mt-10 flex items-center gap-3 border-t border-ligne bg-sable-50/95 px-4 py-3 sm:static sm:mx-0 sm:border-0 sm:px-0">
        {index > 0 && (
          <button
            type="button"
            onClick={back}
            className="inline-flex min-h-14 items-center gap-2 rounded-sm px-3 text-lg font-bold text-indigo-900 hover:bg-sable-100"
          >
            <Icon name="arrowLeft" size={22} />
            Retour
          </button>
        )}
        <div className="ml-auto w-full sm:w-auto">
          {step.key === "recap" ? (
            <form action={formAction}>
              <input type="hidden" name="inscription" value={JSON.stringify(payload)} />
              <SubmitButton size="lg" full icon="check" pendingLabel="Envoi de votre inscription…">
                Envoyer mon inscription
              </SubmitButton>
            </form>
          ) : (
            <button
              type="button"
              onClick={next}
              disabled={!hydrated}
              className="inline-flex min-h-14 w-full items-center justify-center gap-2.5 rounded-sm bg-terre-600 px-6 text-lg font-bold text-white hover:bg-terre-700 disabled:opacity-60 sm:w-auto"
            >
              {hydrated ? "Continuer" : "Chargement…"}
              {hydrated && <Icon name="arrowRight" size={22} />}
            </button>
          )}
        </div>
      </div>
      {serverState?.error && step.key === "recap" && (
        <Notice tone="erreur" className="mt-4" title={serverState.error} />
      )}
    </div>
  );
}

function MoneyField({
  id,
  label,
  unit,
  value,
  onChange,
}: {
  id: string;
  label: string;
  unit: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <Label htmlFor={id} optional>
        {label}
      </Label>
      <div className="flex min-h-14 items-stretch overflow-hidden rounded-sm border-[1.5px] border-trait bg-white focus-within:border-indigo-900">
        <input
          id={id}
          inputMode="numeric"
          value={value ? formatNumber(Number(value)) : ""}
          onChange={(e) => onChange(digits(e.target.value).slice(0, 7))}
          className="min-w-0 flex-1 px-4 text-2xl font-bold text-indigo-900 outline-none"
        />
        <span className="flex items-center border-l border-ligne bg-sable-100 px-4 text-sm font-bold text-indigo-900">
          {unit}
        </span>
      </div>
    </div>
  );
}
