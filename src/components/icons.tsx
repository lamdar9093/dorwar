import type { ReactNode } from "react";

// Icônes au trait (grille 24, trait 1,75). Toujours accompagnées d'un mot : elles sont décoratives.

const ICONS = {
  porte: (
    <>
      <path d="M6 21V10a6 6 0 0 1 12 0v11" />
      <path d="M3.5 21h17" />
      <path d="M14.5 13.5v1.5" />
    </>
  ),
  maison: (
    <>
      <path d="M3.5 11 12 4l8.5 7" />
      <path d="M5.5 9.5V20h13V9.5" />
      <path d="M10 20v-5.5h4V20" />
    </>
  ),
  logee: (
    <>
      <path d="M3.5 11 12 4l8.5 7" />
      <path d="M5.5 9.5V20h13V9.5" />
      <path d="M14.3 11.6a3 3 0 1 1-3.6 4.1 3.6 3.6 0 0 0 3.6-4.1z" />
    </>
  ),
  non_logee: (
    <>
      <path d="M2.5 11 9 5.5l6.5 5.5" />
      <path d="M4.5 9.5V19.5h9V9.5" />
      <path d="M16 15.5h5.5" />
      <path d="m19 13 2.5 2.5L19 18" />
    </>
  ),
  ponctuelle: (
    <>
      <rect x="3.5" y="5" width="17" height="15.5" rx="2" />
      <path d="M3.5 9.5h17M8 3v4M16 3v4" />
      <path d="m9 14.8 2 2 4-4" />
    </>
  ),
  identite: (
    <>
      <rect x="2.5" y="5" width="19" height="14" rx="2" />
      <circle cx="8.5" cy="10.8" r="2.2" />
      <path d="M5.5 16.2c.6-1.4 1.7-2.1 3-2.1s2.4.7 3 2.1" />
      <path d="M14.5 10h4M14.5 13.5h3" />
    </>
  ),
  photo: (
    <>
      <path d="M3.5 8.5A1.5 1.5 0 0 1 5 7h2.2l1.6-2.2h6.4L16.8 7H19a1.5 1.5 0 0 1 1.5 1.5v9A1.5 1.5 0 0 1 19 19H5a1.5 1.5 0 0 1-1.5-1.5z" />
      <circle cx="12" cy="12.8" r="3.4" />
    </>
  ),
  adresse: (
    <>
      <path d="M12 21s-6.5-5.7-6.5-11a6.5 6.5 0 0 1 13 0c0 5.3-6.5 11-6.5 11z" />
      <circle cx="12" cy="10" r="2.4" />
    </>
  ),
  references: (
    <>
      <circle cx="9" cy="8" r="3" />
      <path d="M3.5 19.5c.7-3.1 2.8-4.9 5.5-4.9s4.8 1.8 5.5 4.9" />
      <path d="M15.5 5.3a3 3 0 0 1 0 5.4" />
      <path d="M17.5 14.9c1.6.6 2.6 2.1 3 4.6" />
    </>
  ),
  entretien: (
    <>
      <path d="M4.5 5h9A1.5 1.5 0 0 1 15 6.5V12a1.5 1.5 0 0 1-1.5 1.5H9l-3.5 3v-3h-1A1.5 1.5 0 0 1 3 12V6.5A1.5 1.5 0 0 1 4.5 5z" />
      <path d="M18 9h1.5A1.5 1.5 0 0 1 21 10.5V16a1.5 1.5 0 0 1-1.5 1.5h-1v3l-3.5-3H12a1.5 1.5 0 0 1-1.5-1.5v-.5" />
    </>
  ),
  balai: (
    <>
      <path d="M19.5 3.5 13 10.8" />
      <path d="m11.2 9.4 3.4 3-1.3 1.5-3.4-3z" />
      <path d="M9.9 10.9 4 17.5c1.6 1.9 3.8 3 6.3 3.2l3-6.8" />
      <path d="m7.4 18.8 1.9-3.2M10.6 19.9l1.3-3.3" />
    </>
  ),
  marmite: (
    <>
      <path d="M4.5 11h15v4a5.5 5.5 0 0 1-5.5 5.5h-4A5.5 5.5 0 0 1 4.5 15z" />
      <path d="M2.5 11h19" />
      <path d="M10 8.5a2 2 0 0 1 4 0" />
      <path d="M9 5.5c0-.9.7-1.1.7-2M14.3 5.5c0-.9.7-1.1.7-2" />
    </>
  ),
  linge: (
    <>
      <path d="M12 7.5a2 2 0 1 1 2-2" />
      <path d="M12 7.5v1.3L3.6 14.9a1.2 1.2 0 0 0 .7 2.1h15.4a1.2 1.2 0 0 0 .7-2.1L12 8.8" />
    </>
  ),
  panier: (
    <>
      <path d="M3.5 10h17l-1.8 9.2a1.5 1.5 0 0 1-1.5 1.3H6.8a1.5 1.5 0 0 1-1.5-1.3z" />
      <path d="M8 10l3-6M16 10l-3-6" />
      <path d="M9 14v3M12 14v3M15 14v3" />
    </>
  ),
  fete: (
    <>
      <path d="M5 17.5a7 7 0 0 1 14 0" />
      <path d="M3 17.5h18" />
      <path d="M12 10.5V8.3M10.4 8.3h3.2" />
      <path d="M4.5 20.5h15" />
    </>
  ),
  check: <path d="m5 12.5 4.5 4.5L19 7.5" />,
  checkCircle: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="m8 12.3 2.8 2.8 5.4-5.6" />
    </>
  ),
  x: <path d="M6 6l12 12M18 6 6 18" />,
  arrowRight: (
    <>
      <path d="M4 12h15" />
      <path d="m13 6 6 6-6 6" />
    </>
  ),
  arrowLeft: (
    <>
      <path d="M20 12H5" />
      <path d="m11 6-6 6 6 6" />
    </>
  ),
  chevronDown: <path d="m6 9 6 6 6-6" />,
  chevronRight: <path d="m9 6 6 6-6 6" />,
  phone: (
    <path d="M5 4.5h3.2l1.6 4-2 1.3a10.5 10.5 0 0 0 6.4 6.4l1.3-2 4 1.6v3.2a1.5 1.5 0 0 1-1.5 1.5A15.5 15.5 0 0 1 3.5 6 1.5 1.5 0 0 1 5 4.5z" />
  ),
  discussion: (
    <>
      <path d="M4 20l1.2-3.8A8.2 8.2 0 1 1 8.3 19z" />
      <path d="M9.2 9.2c.4 2.4 2.3 4.4 4.7 4.9l.9-1.3 1.8.8-.3 1.6c-3.6.3-7.8-3.9-7.5-7.5l1.6-.3.8 1.8z" />
    </>
  ),
  position: (
    <>
      <circle cx="12" cy="12" r="7.5" />
      <circle cx="12" cy="12" r="2.8" />
      <path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22" />
    </>
  ),
  carte_zone: (
    <>
      <path d="M9 4.5 3.5 6.5v13L9 17.5l6 2 5.5-2v-13L15 6.5z" />
      <path d="M9 4.5v13M15 6.5v13" />
    </>
  ),
  recherche: (
    <>
      <circle cx="10.5" cy="10.5" r="6" />
      <path d="m15 15 5.5 5.5" />
    </>
  ),
  etoile: <path d="m12 3.8 2.5 5.2 5.7.8-4.1 4 1 5.7L12 16.8l-5.1 2.7 1-5.7-4.1-4 5.7-.8z" />,
  bouclier: (
    <>
      <path d="M12 3 4.5 6v5.5c0 4.5 3.2 8.2 7.5 9.5 4.3-1.3 7.5-5 7.5-9.5V6z" />
      <path d="m8.8 12 2.2 2.2 4.3-4.4" />
    </>
  ),
  horloge: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </>
  ),
  calendrier: (
    <>
      <rect x="3.5" y="5" width="17" height="15.5" rx="2" />
      <path d="M3.5 9.5h17M8 3v4M16 3v4" />
    </>
  ),
  alerte: (
    <>
      <path d="M12 4 2.8 19.5h18.4z" />
      <path d="M12 10v4.5M12 17.2v.3" />
    </>
  ),
  signaler: (
    <>
      <path d="M5 21V4" />
      <path d="M5 4.5h11l-2 4 2 4H5" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 11v5.5M12 7.8v.3" />
    </>
  ),
  cadenas: (
    <>
      <rect x="5" y="10.5" width="14" height="10" rx="2" />
      <path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" />
    </>
  ),
  televerser: (
    <>
      <path d="M12 15.5V4.5" />
      <path d="m7.5 9 4.5-4.5L16.5 9" />
      <path d="M4.5 15v3.5a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2V15" />
    </>
  ),
  document: (
    <>
      <path d="M6.5 3.5h7l4 4v13h-11z" />
      <path d="M13.5 3.5v4h4" />
      <path d="M9 12.5h6M9 16h4" />
    </>
  ),
  personne: (
    <>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20c.9-3.6 3.6-5.6 7-5.6s6.1 2 7 5.6" />
    </>
  ),
  liste: <path d="M8.5 6.5H20M8.5 12H20M8.5 17.5H20M4 6.5h.5M4 12h.5M4 17.5h.5" />,
  deconnexion: (
    <>
      <path d="M14 4.5h4.5A1.5 1.5 0 0 1 20 6v12a1.5 1.5 0 0 1-1.5 1.5H14" />
      <path d="M10.5 16.5 6 12l4.5-4.5M6 12h9.5" />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  modifier: (
    <>
      <path d="m14.5 5.5 4 4L8.5 19.5h-4v-4z" />
      <path d="m12.5 7.5 4 4" />
    </>
  ),
  supprimer: <path d="M4.5 7h15M10 4h4M6.5 7l1 13h9l1-13" />,
  ecouter: (
    <>
      <path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" />
      <path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11" />
    </>
  ),
  qr: (
    <>
      <rect x="4" y="4" width="6" height="6" rx="1" />
      <rect x="14" y="4" width="6" height="6" rx="1" />
      <rect x="4" y="14" width="6" height="6" rx="1" />
      <path d="M14 14h2.5v2.5H14zM17.5 17.5H20V20h-2.5zM14 20h.01M20 14h.01" />
    </>
  ),
  carte: (
    <>
      <rect x="3" y="4.5" width="18" height="15" rx="2" />
      <circle cx="12" cy="10" r="2.5" />
      <path d="M8 16c.7-1.5 2.2-2.3 4-2.3s3.3.8 4 2.3" />
    </>
  ),
  argent: (
    <>
      <ellipse cx="12" cy="6.5" rx="7" ry="2.8" />
      <path d="M5 6.5v5c0 1.5 3.1 2.8 7 2.8s7-1.3 7-2.8v-5" />
      <path d="M5 11.5v5c0 1.5 3.1 2.8 7 2.8s7-1.3 7-2.8v-5" />
    </>
  ),
  porte_ouverte: (
    <>
      <path d="M3.5 21h17" />
      <path d="M6 21V5.5A1.5 1.5 0 0 1 7.5 4h9A1.5 1.5 0 0 1 18 5.5V21" />
      <path d="M6 4.6 13 6v15l-7-1.2" />
      <path d="M11 13v.5" />
    </>
  ),
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  ampoule: (
    <>
      <path d="M9 17.5h6M10 20.5h4" />
      <path d="M12 3.5a6 6 0 0 0-3.5 10.9c.5.4.8 1 .8 1.6v.5h5.4V16c0-.6.3-1.2.8-1.6A6 6 0 0 0 12 3.5z" />
    </>
  ),
} satisfies Record<string, ReactNode>;

export type IconName = keyof typeof ICONS;

export function hasIcon(name: string): name is IconName {
  return name in ICONS;
}

type IconProps = {
  name: IconName | (string & {});
  size?: number;
  className?: string;
  strokeWidth?: number;
};

export function Icon({ name, size = 24, className, strokeWidth = 1.75 }: IconProps) {
  if (!hasIcon(name)) return null;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      {ICONS[name]}
    </svg>
  );
}
