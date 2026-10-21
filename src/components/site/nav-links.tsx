"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon, type IconName } from "@/components/icons";
import { cn } from "@/lib/cn";

export type NavItem = {
  href: string;
  label: string;
  icon: IconName;
  exact?: boolean;
  match?: string[];
};

export function NavLinks({
  items,
  variant = "top",
}: {
  items: NavItem[];
  variant?: "top" | "bottom";
}) {
  const pathname = usePathname();
  const isActive = (item: NavItem) => {
    if (item.match) return item.match.some((p) => pathname === p || pathname.startsWith(`${p}/`));
    return item.exact
      ? pathname === item.href
      : pathname === item.href || pathname.startsWith(`${item.href}/`);
  };

  if (variant === "bottom") {
    return (
      <ul
        className="grid"
        style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}
      >
        {items.map((item) => {
          const active = isActive(item);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-h-16 flex-col items-center justify-center gap-1 text-xs font-bold",
                  active ? "text-terre-700" : "text-gris-700 hover:text-indigo-900",
                )}
              >
                <Icon name={item.icon} size={24} strokeWidth={active ? 2.1 : 1.75} />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    );
  }

  return (
    <ul className="flex gap-1 overflow-x-auto">
      {items.map((item) => {
        const active = isActive(item);
        return (
          <li key={item.href} className="shrink-0">
            <Link
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "inline-flex min-h-12 items-center gap-2 border-b-[3px] px-3 font-bold whitespace-nowrap",
                active
                  ? "border-terre-600 text-indigo-900"
                  : "border-transparent text-gris-700 hover:text-indigo-900",
              )}
            >
              <Icon name={item.icon} size={20} className="hidden sm:block" />
              {item.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
