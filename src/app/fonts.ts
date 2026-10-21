import localFont from "next/font/local";

// Polices auto-hébergées (licence SIL OFL, voir src/app/fonts/LICENSE-*). Sous-ensemble latin, variables.

/** Titres : Fraunces, serif à fort caractère, avec axe de taille optique. */
export const fraunces = localFont({
  src: "./fonts/fraunces-latin-variable.woff2",
  weight: "300 800",
  style: "normal",
  display: "swap",
  variable: "--font-fraunces",
  adjustFontFallback: "Times New Roman",
});

/** Texte : Atkinson Hyperlegible Next, dessinée pour différencier chaque lettre (lecteurs en difficulté). */
export const atkinson = localFont({
  src: "./fonts/atkinson-hyperlegible-next-latin-variable.woff2",
  weight: "200 800",
  style: "normal",
  display: "swap",
  variable: "--font-atkinson",
  adjustFontFallback: "Arial",
});
