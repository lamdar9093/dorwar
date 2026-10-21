import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { Icon, type IconName } from "@/components/icons";
import { cn } from "@/lib/cn";

export type ButtonVariant = "primary" | "secondary" | "quiet" | "success" | "danger" | "light";
export type ButtonSize = "md" | "lg";

const VARIANTS: Record<ButtonVariant, string> = {
  primary: "bg-terre-600 text-white hover:bg-terre-700 active:bg-terre-700",
  secondary:
    "border-[1.5px] border-indigo-900 text-indigo-900 hover:bg-indigo-900 hover:text-sable-50",
  quiet:
    "text-indigo-900 underline decoration-ligne decoration-2 underline-offset-4 hover:decoration-indigo-900 px-1",
  success: "bg-baobab-600 text-white hover:bg-baobab-700",
  danger: "border-[1.5px] border-rouge-700 text-rouge-700 hover:bg-rouge-100",
  light: "bg-sable-50 text-indigo-950 hover:bg-white",
};

const SIZES: Record<ButtonSize, string> = {
  md: "min-h-12 px-5 text-base",
  lg: "min-h-14 px-6 text-lg",
};

export function buttonClasses({
  variant = "primary",
  size = "md",
  full = false,
  className,
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  full?: boolean;
  className?: string;
}) {
  return cn(
    "inline-flex items-center justify-center gap-2.5 rounded-sm font-bold leading-tight transition-colors",
    "disabled:cursor-not-allowed disabled:opacity-55 aria-disabled:pointer-events-none aria-disabled:opacity-55",
    variant !== "quiet" && SIZES[size],
    variant === "quiet" && "min-h-12 text-base",
    VARIANTS[variant],
    full && "w-full",
    className,
  );
}

type Common = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  full?: boolean;
  icon?: IconName;
  iconAfter?: IconName;
  children: ReactNode;
};

export function Button({
  variant,
  size,
  full,
  icon,
  iconAfter,
  className,
  children,
  type = "button",
  ...rest
}: Common & ComponentProps<"button">) {
  return (
    <button type={type} className={buttonClasses({ variant, size, full, className })} {...rest}>
      {icon && <Icon name={icon} size={22} />}
      <span>{children}</span>
      {iconAfter && <Icon name={iconAfter} size={20} />}
    </button>
  );
}

export function LinkButton({
  variant,
  size,
  full,
  icon,
  iconAfter,
  className,
  children,
  href,
  ...rest
}: Common & Omit<ComponentProps<typeof Link>, "href"> & { href: string }) {
  return (
    <Link href={href} className={buttonClasses({ variant, size, full, className })} {...rest}>
      {icon && <Icon name={icon} size={22} />}
      <span>{children}</span>
      {iconAfter && <Icon name={iconAfter} size={20} />}
    </Link>
  );
}

/** Lien externe (WhatsApp, téléphone) avec le même style. */
export function ExternalButton({
  variant,
  size,
  full,
  icon,
  iconAfter,
  className,
  children,
  href,
  ...rest
}: Common & ComponentProps<"a">) {
  const external = href?.startsWith("http");
  return (
    <a
      href={href}
      className={buttonClasses({ variant, size, full, className })}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      {...rest}
    >
      {icon && <Icon name={icon} size={22} />}
      <span>{children}</span>
      {iconAfter && <Icon name={iconAfter} size={20} />}
    </a>
  );
}
