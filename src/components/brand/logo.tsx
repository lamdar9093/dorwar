type LogoProps = {
  tone?: "dark" | "light";
  className?: string;
  withWordmark?: boolean;
};

/**
 * Marque Dorwar : le D entrouvert. La barre du D est le cadre, la panse est le battant,
 * et la lumière passe entre les deux. Le nom ne porte aucune signification inventée.
 */
export function LogoMark({ tone = "dark", size = 30 }: { tone?: "dark" | "light"; size?: number }) {
  const ink = tone === "dark" ? "#273150" : "#faf6ee";
  return (
    <svg
      width={size}
      height={(size * 46) / 42}
      viewBox="12 9 42 46"
      aria-hidden="true"
      focusable="false"
    >
      <rect x="12" y="9" width="10" height="46" fill={ink} />
      <path d="M22 9H24.5L30 55H22z" fill="#e8a33d" />
      <path d="M24.5 9H31a23 23 0 0 1 0 46H30z" fill="#b4532e" />
    </svg>
  );
}

export function Logo({ tone = "dark", className = "", withWordmark = true }: LogoProps) {
  return (
    <span className={`inline-flex items-end gap-2.5 ${className}`}>
      <LogoMark tone={tone} />
      {withWordmark && (
        <span
          className={`font-display text-[1.7rem] leading-[0.9] font-semibold tracking-[-0.025em] ${
            tone === "dark" ? "text-indigo-900" : "text-sable-50"
          }`}
        >
          Dorwar
        </span>
      )}
    </span>
  );
}
