import type { ReactNode } from "react";
import { Icon, type IconName } from "@/components/icons";
import { cn } from "@/lib/cn";

export type Tone = "neutre" | "succes" | "attente" | "danger" | "info" | "terre";

const TONES: Record<Tone, string> = {
  neutre: "bg-sable-100 text-indigo-900 border-ligne",
  succes: "bg-baobab-100 text-baobab-700 border-baobab-100",
  attente: "bg-ocre-100 text-indigo-900 border-ocre-100",
  danger: "bg-rouge-100 text-rouge-700 border-rouge-100",
  info: "bg-indigo-100 text-indigo-900 border-indigo-100",
  terre: "bg-terre-100 text-terre-700 border-terre-100",
};

export function Pill({
  tone = "neutre",
  icon,
  children,
  className,
}: {
  tone?: Tone;
  icon?: IconName;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm leading-tight font-bold whitespace-nowrap",
        TONES[tone],
        className,
      )}
    >
      {icon && <Icon name={icon} size={16} strokeWidth={2.2} />}
      {children}
    </span>
  );
}

/** Étiquette de valeur discrète (langues, compétences). */
export function Tag({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-xs border border-ligne bg-white px-2.5 py-1 text-sm text-indigo-900">
      {children}
    </span>
  );
}
