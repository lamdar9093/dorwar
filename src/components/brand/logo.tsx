type LogoProps = {
  tone?: "dark" | "light";
  className?: string;
  withWordmark?: boolean;
};

/** Marque Dorwar : une porte entrouverte, la lumière qui passe. Le nom ne porte aucune signification inventée. */
export function LogoMark({ tone = "dark", size = 30 }: { tone?: "dark" | "light"; size?: number }) {
  const ink = tone === "dark" ? "#273150" : "#faf6ee";
  return (
    <svg
      width={size}
      height={(size * 34) / 30}
      viewBox="0 0 30 34"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M3 32V14a12 12 0 0 1 24 0v18z" fill="#b4532e" />
      <path d="M18.4 4.6 21.4 5.9 24 32h-5.6z" fill={tone === "dark" ? "#fbebd0" : "#e8a33d"} />
      <path d="M1 32.4h28" stroke={ink} strokeWidth="2.4" strokeLinecap="round" />
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
