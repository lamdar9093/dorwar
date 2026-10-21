"use client";

import { useActionState, type ReactNode } from "react";
import type { ActionResult } from "@/lib/action-result";
import { Notice } from "./notice";

type Action = (state: ActionResult, formData: FormData) => Promise<ActionResult>;

/**
 * Formulaire relié à une Server Action : affiche la confirmation ou l'erreur rédigée renvoyée par le serveur.
 * Fonctionne aussi sans JavaScript (envoi classique), l'affichage du résultat en plus quand il est chargé.
 */
export function ActionForm({
  action,
  children,
  className,
  successTitle,
  resetOnSuccess = false,
}: {
  action: Action;
  children: ReactNode;
  className?: string;
  successTitle?: string;
  resetOnSuccess?: boolean;
}) {
  const [state, formAction] = useActionState(action, null);
  return (
    <form
      action={formAction}
      className={className}
      key={resetOnSuccess && state?.ok ? "envoye" : undefined}
    >
      {state && !state.ok && <Notice tone="erreur" className="mb-4" title={state.error} />}
      {state?.ok && (
        <Notice
          tone="succes"
          className="mb-4"
          title={successTitle ?? state.message ?? "C’est enregistré."}
        >
          {successTitle && state.message ? state.message : null}
        </Notice>
      )}
      {children}
    </form>
  );
}
