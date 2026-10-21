import { cn } from "@/lib/cn";

// Emplacement photo en démonstration : initiales sur une teinte de la palette, motif tissé.
// Prêt à recevoir une vraie photo (prise par l'agent, avec l'accord de la personne) via `photoUrl`.

const SWATCHES = [
  { bg: "bg-terre-100", fg: "text-terre-700", motif: "#b4532e" },
  { bg: "bg-baobab-100", fg: "text-baobab-700", motif: "#3f6b4a" },
  { bg: "bg-ocre-100", fg: "text-indigo-900", motif: "#9c4526" },
  { bg: "bg-indigo-100", fg: "text-indigo-900", motif: "#273150" },
  { bg: "bg-sable-200", fg: "text-indigo-900", motif: "#5a554b" },
];

const SIZES = {
  sm: "w-12 h-15 text-lg",
  md: "w-18 h-22 text-2xl",
  lg: "w-28 h-35 text-4xl",
  xl: "w-40 h-50 text-5xl",
};

function hash(text: string): number {
  let h = 0;
  for (let i = 0; i < text.length; i++) h = (h * 31 + text.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export function Medallion({
  firstName,
  lastInitial,
  seed,
  size = "md",
  photoUrl,
  className,
}: {
  firstName: string;
  lastInitial?: string;
  seed: string;
  size?: keyof typeof SIZES;
  photoUrl?: string | null;
  className?: string;
}) {
  const swatch = SWATCHES[hash(seed) % SWATCHES.length];
  const initials = `${firstName.charAt(0)}${lastInitial ?? ""}`.toUpperCase();
  const motif = encodeURIComponent(swatch.motif);
  return (
    <span
      aria-hidden="true"
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-sm font-display font-medium",
        SIZES[size],
        swatch.bg,
        swatch.fg,
        className,
      )}
      style={
        photoUrl
          ? undefined
          : {
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='8' viewBox='0 0 14 8'%3E%3Cpath d='M0 4 3.5.5 7 4l3.5-3.5L14 4' fill='none' stroke='${motif}' stroke-opacity='.16' stroke-width='1'/%3E%3C/svg%3E")`,
              backgroundSize: "14px 8px",
            }
      }
    >
      {photoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- photo privée servie par une route authentifiée
        <img src={photoUrl} alt="" className="size-full object-cover" />
      ) : (
        <span className="relative">{initials}</span>
      )}
    </span>
  );
}
