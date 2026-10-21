import type { ComponentProps, ReactNode } from "react";
import { Icon } from "@/components/icons";
import { cn } from "@/lib/cn";

export const inputClasses = cn(
  "block w-full min-h-13 rounded-sm border-[1.5px] border-trait bg-white px-4 text-base text-indigo-900",
  "placeholder:text-gris-700/80 hover:border-indigo-900 focus:border-indigo-900",
  "aria-invalid:border-rouge-700 aria-invalid:bg-rouge-100/40",
  "disabled:bg-sable-100 disabled:text-gris-700",
);

export function Label({
  htmlFor,
  children,
  optional,
}: {
  htmlFor?: string;
  children: ReactNode;
  optional?: boolean;
}) {
  return (
    <label htmlFor={htmlFor} className="mb-2 block text-base font-bold text-indigo-900">
      {children}
      {optional && <span className="ml-2 text-sm font-normal text-gris-700">facultatif</span>}
    </label>
  );
}

export function Hint({ id, children }: { id?: string; children: ReactNode }) {
  return (
    <p id={id} className="mt-2 text-sm text-gris-700">
      {children}
    </p>
  );
}

export function FieldError({ id, children }: { id?: string; children?: ReactNode }) {
  if (!children) return null;
  return (
    <p
      id={id}
      className="mt-2 flex items-start gap-2 text-sm font-bold text-rouge-700"
      role="alert"
    >
      <Icon name="alerte" size={18} className="mt-0.5 shrink-0" />
      <span>{children}</span>
    </p>
  );
}

type FieldProps = {
  id: string;
  label: ReactNode;
  hint?: ReactNode;
  error?: string;
  optional?: boolean;
  children: ReactNode;
  className?: string;
};

/** Champ complet : libellé, aide, erreur. L'élément de saisie reçoit `id` et `aria-describedby`. */
export function Field({ id, label, hint, error, optional, children, className }: FieldProps) {
  return (
    <div className={className}>
      <Label htmlFor={id} optional={optional}>
        {label}
      </Label>
      {children}
      {hint && <Hint id={`${id}-aide`}>{hint}</Hint>}
      <FieldError id={`${id}-erreur`}>{error}</FieldError>
    </div>
  );
}

export function describedBy(id: string, { hint, error }: { hint?: unknown; error?: unknown }) {
  return (
    [hint ? `${id}-aide` : null, error ? `${id}-erreur` : null].filter(Boolean).join(" ") ||
    undefined
  );
}

export function TextInput({ className, ...props }: ComponentProps<"input">) {
  return <input className={cn(inputClasses, className)} {...props} />;
}

export function TextArea({ className, ...props }: ComponentProps<"textarea">) {
  return (
    <textarea className={cn(inputClasses, "min-h-32 py-3 leading-relaxed", className)} {...props} />
  );
}

export function Select({ className, children, ...props }: ComponentProps<"select">) {
  return (
    <div className="relative">
      <select className={cn(inputClasses, "appearance-none pr-12", className)} {...props}>
        {children}
      </select>
      <Icon
        name="chevronDown"
        size={22}
        className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-indigo-900"
      />
    </div>
  );
}
