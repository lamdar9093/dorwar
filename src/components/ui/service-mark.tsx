import { hasIcon, Icon } from "@/components/icons";
import { cn } from "@/lib/cn";

// Système couleur + icône par service. Une teinte ou une icône inconnue retombe sur des valeurs sûres :
// un nouveau service s'affiche correctement sans toucher au code.

const HUES: Record<string, { tile: string; ink: string; rule: string }> = {
  terre: { tile: "bg-terre-100 text-terre-700", ink: "text-terre-700", rule: "border-terre-600" },
  baobab: {
    tile: "bg-baobab-100 text-baobab-700",
    ink: "text-baobab-700",
    rule: "border-baobab-600",
  },
  indigo: {
    tile: "bg-indigo-100 text-indigo-900",
    ink: "text-indigo-700",
    rule: "border-indigo-900",
  },
  ocre: { tile: "bg-ocre-100 text-terre-700", ink: "text-terre-700", rule: "border-ocre-500" },
};

export function hueOf(hue: string) {
  return HUES[hue] ?? HUES.indigo;
}

export function ServiceMark({
  icon,
  name,
  hue,
  size = "md",
}: {
  icon: string;
  name: string;
  hue: string;
  size?: "sm" | "md" | "lg";
}) {
  const box = size === "lg" ? "size-20" : size === "md" ? "size-14" : "size-10";
  const iconSize = size === "lg" ? 44 : size === "md" ? 32 : 24;
  return (
    <span
      aria-hidden="true"
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-sm",
        box,
        hueOf(hue).tile,
      )}
    >
      {hasIcon(icon) ? (
        <Icon name={icon} size={iconSize} strokeWidth={1.6} />
      ) : (
        <span className="font-display text-2xl">{name.charAt(0)}</span>
      )}
    </span>
  );
}
