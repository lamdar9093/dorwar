import type { ReactNode } from "react";
import { Icon, type IconName } from "@/components/icons";
import { cn } from "@/lib/cn";

type NoticeTone = "info" | "succes" | "attention" | "erreur";

const STYLES: Record<NoticeTone, { box: string; icon: IconName; iconClass: string }> = {
  info: {
    box: "border-indigo-900/15 bg-indigo-100/60",
    icon: "info",
    iconClass: "text-indigo-900",
  },
  succes: {
    box: "border-baobab-600/25 bg-baobab-100",
    icon: "checkCircle",
    iconClass: "text-baobab-700",
  },
  attention: { box: "border-ocre-500/40 bg-ocre-100", icon: "alerte", iconClass: "text-terre-700" },
  erreur: { box: "border-rouge-700/30 bg-rouge-100", icon: "alerte", iconClass: "text-rouge-700" },
};

/** Message d'état rédigé : confirmation, information, attention, erreur. */
export function Notice({
  tone = "info",
  title,
  children,
  action,
  className,
  role,
}: {
  tone?: NoticeTone;
  title?: ReactNode;
  children?: ReactNode;
  action?: ReactNode;
  className?: string;
  role?: "status" | "alert";
}) {
  const style = STYLES[tone];
  return (
    <div
      role={role ?? (tone === "erreur" ? "alert" : "status")}
      className={cn("flex animate-appear gap-3 rounded-md border p-4", style.box, className)}
    >
      <Icon name={style.icon} size={24} className={cn("mt-0.5 shrink-0", style.iconClass)} />
      <div className="min-w-0 flex-1">
        {title && <p className="font-bold text-indigo-900">{title}</p>}
        {children && (
          <div className={cn("text-indigo-900", title ? "mt-1" : undefined)}>{children}</div>
        )}
        {action && <div className="mt-3">{action}</div>}
      </div>
    </div>
  );
}
