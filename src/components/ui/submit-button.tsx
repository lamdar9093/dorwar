"use client";

import { useFormStatus } from "react-dom";
import { Icon, type IconName } from "@/components/icons";
import { buttonClasses, type ButtonSize, type ButtonVariant } from "./button";

/** Bouton d'envoi qui montre l'attente : sur une connexion lente, on sait que ça avance. */
export function SubmitButton({
  children,
  pendingLabel = "Envoi en cours…",
  variant = "primary",
  size = "md",
  full = false,
  icon,
  iconAfter,
  name,
  value,
  disabled,
  className,
}: {
  children: React.ReactNode;
  pendingLabel?: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  full?: boolean;
  icon?: IconName;
  iconAfter?: IconName;
  name?: string;
  value?: string;
  disabled?: boolean;
  className?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      name={name}
      value={value}
      disabled={pending || disabled}
      aria-disabled={pending || disabled}
      className={buttonClasses({ variant, size, full, className })}
    >
      {pending ? (
        <>
          <span
            className="size-5 animate-spin rounded-full border-2 border-current border-t-transparent"
            aria-hidden="true"
          />
          <span>{pendingLabel}</span>
        </>
      ) : (
        <>
          {icon && <Icon name={icon} size={22} />}
          <span>{children}</span>
          {iconAfter && <Icon name={iconAfter} size={20} />}
        </>
      )}
    </button>
  );
}
