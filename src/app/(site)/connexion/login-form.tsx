"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Icon } from "@/components/icons";
import { FieldError, Hint, inputClasses, Label } from "@/components/ui/field";
import { Notice } from "@/components/ui/notice";
import { SubmitButton } from "@/components/ui/submit-button";
import { cn } from "@/lib/cn";
import { formatPhone } from "@/lib/format";
import { localPart } from "@/lib/phone";
import { loginAction, type LoginState } from "./actions";

export type LoginTexts = {
  phoneLabel: string;
  phoneHint: string;
  sendCode: string;
  sending: string;
  codeTitle: string;
  codeIntro: string;
  demoCode: string;
  codeLabel: string;
  verify: string;
  verifying: string;
  changeNumber: string;
  consent: string;
  consentLink: string;
};

export function LoginForm({
  texts,
  suite,
  intention,
  demoAccounts,
}: {
  texts: LoginTexts;
  suite: string | null;
  intention: "famille" | "prestataire";
  demoAccounts: { phone: string; label: string }[] | null;
}) {
  const [state, action] = useActionState<LoginState, FormData>(loginAction, { step: "telephone" });
  const hidden = (
    <>
      {suite && <input type="hidden" name="suite" value={suite} />}
      <input type="hidden" name="intention" value={intention} />
    </>
  );

  if (state.step === "code" && state.phone) {
    return (
      <div className="animate-appear">
        <h2 className="text-2xl">{texts.codeTitle}</h2>
        <p className="mt-2 text-gris-700">
          {texts.codeIntro.replace("{phone}", formatPhone(state.phone)).replace("{minutes}", "5")}
        </p>
        {state.demoCode && (
          <div className="mt-5 rounded-md border border-ocre-500/50 bg-ocre-100 p-4">
            <p className="text-sm text-indigo-900">{texts.demoCode}</p>
            <p className="mt-1 font-display text-4xl tracking-[0.2em] text-indigo-900">
              {state.demoCode}
            </p>
          </div>
        )}
        <form action={action} className="mt-6 space-y-5">
          {hidden}
          <input type="hidden" name="etape" value="code" />
          <input type="hidden" name="telephone" value={state.phone} />
          <div>
            <Label htmlFor="code">{texts.codeLabel}</Label>
            <input
              id="code"
              name="code"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9 ]{6,7}"
              maxLength={7}
              required
              autoFocus
              aria-invalid={state.fieldError === "code" || undefined}
              aria-describedby={state.fieldError === "code" ? "code-erreur" : undefined}
              className={cn(
                inputClasses,
                "max-w-56 text-center font-display text-3xl tracking-[0.35em]",
              )}
            />
            <FieldError id="code-erreur">
              {state.fieldError === "code" ? state.error : undefined}
            </FieldError>
          </div>
          {state.isNew && intention === "famille" && (
            <div>
              <Label htmlFor="nom">Comment vous présenter aux personnes rencontrées ?</Label>
              <input
                id="nom"
                name="nom"
                required
                minLength={2}
                maxLength={60}
                placeholder="Famille Ndiaye"
                autoComplete="family-name"
                aria-invalid={state.fieldError === "nom" || undefined}
                aria-describedby="nom-aide"
                className={inputClasses}
              />
              <Hint id="nom-aide">
                Votre nom de famille, tel qu’il sera présenté. Votre adresse n’est jamais affichée.
              </Hint>
              <FieldError>{state.fieldError === "nom" ? state.error : undefined}</FieldError>
            </div>
          )}
          {state.isNew && (
            <div>
              <label className="flex cursor-pointer items-start gap-3 rounded-md border-[1.5px] border-trait bg-white p-4 has-checked:border-indigo-900">
                <input
                  type="checkbox"
                  name="accord"
                  value="oui"
                  required
                  className="mt-1 size-5 shrink-0 accent-indigo-900"
                />
                <span>
                  {texts.consent}{" "}
                  <Link href="/vos-donnees" className="font-bold underline" target="_blank">
                    {texts.consentLink}
                  </Link>
                </span>
              </label>
              <FieldError>{state.fieldError === "accord" ? state.error : undefined}</FieldError>
            </div>
          )}
          {state.error && !state.fieldError && <Notice tone="erreur" title={state.error} />}
          <SubmitButton full size="lg" pendingLabel={texts.verifying} iconAfter="arrowRight">
            {texts.verify}
          </SubmitButton>
        </form>
        <form action={action} className="mt-3">
          <input type="hidden" name="etape" value="changer" />
          <button
            type="submit"
            className="inline-flex min-h-12 items-center gap-2 font-bold text-indigo-900 underline"
          >
            <Icon name="arrowLeft" size={20} />
            {texts.changeNumber}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div>
      <form action={action} className="space-y-5">
        {hidden}
        <input type="hidden" name="etape" value="telephone" />
        <div>
          <Label htmlFor="telephone">{texts.phoneLabel}</Label>
          <div
            className={cn(
              "flex min-h-13 items-stretch overflow-hidden rounded-sm border-[1.5px] bg-white focus-within:border-indigo-900",
              state.fieldError === "telephone" ? "border-rouge-700" : "border-trait",
            )}
          >
            <span className="flex items-center border-r border-ligne bg-sable-100 px-4 font-bold text-indigo-900">
              +221
            </span>
            <input
              id="telephone"
              name="telephone"
              type="tel"
              inputMode="tel"
              autoComplete="tel-national"
              required
              placeholder="77 123 45 67"
              defaultValue={state.phone ? localPart(state.phone) : undefined}
              aria-invalid={state.fieldError === "telephone" || undefined}
              aria-describedby="telephone-aide telephone-erreur"
              className="min-w-0 flex-1 px-4 text-lg tracking-wide text-indigo-900 outline-none"
            />
          </div>
          <Hint id="telephone-aide">{texts.phoneHint}</Hint>
          <FieldError id="telephone-erreur">
            {state.fieldError === "telephone" ? state.error : undefined}
          </FieldError>
        </div>
        {state.error && !state.fieldError && <Notice tone="erreur" title={state.error} />}
        <SubmitButton full size="lg" pendingLabel={texts.sending} iconAfter="arrowRight">
          {texts.sendCode}
        </SubmitButton>
      </form>

      {demoAccounts && (
        <details className="mt-8 rounded-md border border-dashed border-trait">
          <summary className="flex min-h-12 items-center justify-between gap-3 px-4 font-bold text-indigo-900">
            Comptes de démonstration
            <Icon name="chevronDown" size={20} />
          </summary>
          <ul className="space-y-2 px-4 pb-4">
            {demoAccounts.map((account) => (
              <li key={account.phone}>
                <form action={action}>
                  {suite && <input type="hidden" name="suite" value={suite} />}
                  <input type="hidden" name="intention" value={intention} />
                  <input type="hidden" name="etape" value="telephone" />
                  <input type="hidden" name="telephone" value={account.phone} />
                  <button
                    type="submit"
                    className="flex min-h-12 w-full items-center justify-between gap-3 rounded-sm bg-sable-100 px-4 text-left hover:bg-sable-200"
                  >
                    <span className="font-bold">{account.label}</span>
                    <span className="text-sm text-gris-700">{formatPhone(account.phone)}</span>
                  </button>
                </form>
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
