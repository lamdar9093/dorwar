import type { ReactNode } from "react";
import { Icon, type IconName } from "@/components/icons";

/** État vide dessiné et rédigé : jamais une page blanche. */
export function EmptyState({
  icon = "porte_ouverte",
  title,
  children,
  action,
}: {
  icon?: IconName;
  title: ReactNode;
  children?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="motif-tisse rounded-md border border-ligne px-5 py-10 sm:px-10">
      <div className="mx-auto max-w-md">
        <span className="flex size-16 items-center justify-center rounded-full bg-sable-50 text-terre-700 ring-1 ring-ligne">
          <Icon name={icon} size={34} />
        </span>
        <h3 className="mt-5 text-2xl">{title}</h3>
        {children && <div className="mt-3 text-gris-700">{children}</div>}
        {action && <div className="mt-6">{action}</div>}
      </div>
    </div>
  );
}
