import type { ComponentProps, ReactNode } from "react";
import { Icon, type IconName } from "@/components/icons";
import { cn } from "@/lib/cn";

type ChoiceCardProps = Omit<ComponentProps<"input">, "type" | "size"> & {
  type?: "radio" | "checkbox";
  label: ReactNode;
  description?: ReactNode;
  icon?: IconName | string;
  /** Mot secondaire affiché sous le libellé (ex. traduction wolof). */
  aside?: ReactNode;
  scale?: "md" | "lg";
};

/**
 * Grande carte de choix (radio ou case à cocher native) : toute la surface est cliquable,
 * l'état coché est visible sans couleur seule (bordure épaisse + coche).
 */
export function ChoiceCard({
  type = "radio",
  label,
  description,
  icon,
  aside,
  scale = "md",
  className,
  ...input
}: ChoiceCardProps) {
  return (
    <label
      className={cn(
        "group relative flex cursor-pointer items-start gap-4 rounded-md border-[1.5px] border-trait bg-white p-4 transition-colors",
        "hover:border-indigo-900 has-checked:border-[2.5px] has-checked:border-indigo-900 has-checked:bg-sable-50 has-checked:p-[calc(1rem-1px)]",
        "has-focus-visible:outline-3 has-focus-visible:outline-offset-2 has-focus-visible:outline-indigo-900",
        "has-disabled:cursor-not-allowed has-disabled:opacity-60",
        scale === "lg" ? "min-h-20" : "min-h-14",
        className,
      )}
    >
      <input type={type} className="peer sr-only" {...input} />
      {icon && (
        <span
          className={cn(
            "flex shrink-0 items-center justify-center rounded-sm bg-sable-100 text-indigo-900 group-has-checked:bg-terre-100 group-has-checked:text-terre-700",
            scale === "lg" ? "size-14" : "size-11",
          )}
        >
          <Icon name={icon} size={scale === "lg" ? 32 : 26} />
        </span>
      )}
      <span className="min-w-0 flex-1 self-center">
        <span
          className={cn(
            "block font-bold text-indigo-900",
            scale === "lg" ? "text-lg" : "text-base",
          )}
        >
          {label}
        </span>
        {aside && <span className="block text-sm text-gris-700">{aside}</span>}
        {description && (
          <span className="mt-1 block text-sm leading-snug text-gris-700">{description}</span>
        )}
      </span>
      <span
        aria-hidden="true"
        className={cn(
          "mt-1 flex size-6 shrink-0 items-center justify-center border-[1.5px] border-trait text-white",
          type === "radio" ? "rounded-full" : "rounded-xs",
          "group-has-checked:border-indigo-900 group-has-checked:bg-indigo-900",
        )}
      >
        <Icon
          name="check"
          size={16}
          strokeWidth={3}
          className="opacity-0 group-has-checked:opacity-100"
        />
      </span>
    </label>
  );
}

/** Petite pastille cochable (jours de la semaine, langues, rayons). */
export function ChoiceChip({
  type = "checkbox",
  label,
  className,
  ...input
}: Omit<ComponentProps<"input">, "type"> & { type?: "radio" | "checkbox"; label: ReactNode }) {
  return (
    <label
      className={cn(
        "relative inline-flex min-h-12 cursor-pointer items-center gap-2 rounded-full border-[1.5px] border-trait bg-white px-4 font-bold text-indigo-900",
        "hover:border-indigo-900 has-checked:border-indigo-900 has-checked:bg-indigo-900 has-checked:text-sable-50",
        "has-focus-visible:outline-3 has-focus-visible:outline-offset-2 has-focus-visible:outline-indigo-900",
        className,
      )}
    >
      <input type={type} className="sr-only" {...input} />
      <Icon
        name="check"
        size={16}
        strokeWidth={3}
        className="hidden [label:has(:checked)_&]:block"
      />
      <span>{label}</span>
    </label>
  );
}
