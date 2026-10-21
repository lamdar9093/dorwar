// Sceau « Vérifié par Dorwar ». Le tracé circulaire du texte est défini une seule fois (SealDefs, dans le layout).

export const SEAL_PATH_ID = "dorwar-sceau-cercle";

export function SealDefs() {
  return (
    <svg width="0" height="0" aria-hidden="true" focusable="false" style={{ position: "absolute" }}>
      <defs>
        <path id={SEAL_PATH_ID} d="M60,60 m-43,0 a43,43 0 1,1 86,0 a43,43 0 1,1 -86,0" />
      </defs>
    </svg>
  );
}

type SealProps = {
  size?: number;
  className?: string;
  tone?: "baobab" | "indigo";
  /** Libellé lu par les lecteurs d'écran ; vide si le sceau accompagne un texte qui le dit déjà. */
  label?: string;
};

export function Seal({
  size = 112,
  className,
  tone = "baobab",
  label = "Vérifié par Dorwar",
}: SealProps) {
  const fill = tone === "baobab" ? "#3f6b4a" : "#273150";
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      className={className}
      role={label ? "img" : undefined}
      aria-label={label || undefined}
      aria-hidden={label ? undefined : true}
      focusable="false"
    >
      <circle cx="60" cy="60" r="58" fill={fill} />
      <circle
        cx="60"
        cy="60"
        r="53"
        fill="none"
        stroke="#faf6ee"
        strokeOpacity="0.55"
        strokeWidth="1"
      />
      <circle
        cx="60"
        cy="60"
        r="31"
        fill="none"
        stroke="#faf6ee"
        strokeOpacity="0.55"
        strokeWidth="1"
      />
      <text
        fill="#faf6ee"
        fontSize="10.4"
        fontWeight="700"
        letterSpacing="1.6"
        fontFamily="var(--font-sans)"
      >
        <textPath href={`#${SEAL_PATH_ID}`} textLength="266" lengthAdjust="spacing">
          VÉRIFIÉ PAR DORWAR · VÉRIFIÉ PAR DORWAR ·
        </textPath>
      </text>
      <path
        d="M47 61.5l8.5 8.5L74 51"
        fill="none"
        stroke="#faf6ee"
        strokeWidth="5.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Petit sceau pour les lignes de texte et les badges. */
export function SealMini({ size = 20, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      <path
        d="M12 1.8l2.3 1.7 2.9-.2.9 2.7 2.4 1.6-.9 2.8.9 2.7-2.4 1.7-.9 2.7-2.9-.2L12 22.2l-2.3-1.7-2.9.2-.9-2.7-2.4-1.7.9-2.7-.9-2.8 2.4-1.6.9-2.7 2.9.2z"
        fill="currentColor"
      />
      <path
        d="m8.2 12.2 2.6 2.6 5-5.2"
        fill="none"
        stroke="#faf6ee"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
