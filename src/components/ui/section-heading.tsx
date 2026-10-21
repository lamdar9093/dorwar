import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export function SectionHeading({
  eyebrow,
  title,
  intro,
  as: Tag = "h2",
  className,
  tone = "dark",
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  intro?: ReactNode;
  as?: "h1" | "h2" | "h3";
  className?: string;
  tone?: "dark" | "light";
}) {
  return (
    <div className={cn("max-w-2xl", className)}>
      {eyebrow && (
        <p className={cn("eyebrow mb-3", tone === "dark" ? "text-terre-700" : "text-ocre-500")}>
          {eyebrow}
        </p>
      )}
      <Tag
        className={cn(
          Tag === "h1" ? "text-4xl sm:text-5xl" : "text-3xl sm:text-4xl",
          tone === "dark" ? "text-indigo-900" : "text-sable-50",
        )}
      >
        {title}
      </Tag>
      {intro && (
        <div className={cn("mt-4 text-lg", tone === "dark" ? "text-gris-700" : "text-sable-100")}>
          {intro}
        </div>
      )}
    </div>
  );
}
