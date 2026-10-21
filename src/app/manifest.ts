import type { MetadataRoute } from "next";

/** Installable sur l'écran d'accueil d'un téléphone Android (PWA, sans service worker pour l'instant). */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Dorwar",
    short_name: "Dorwar",
    description: "Des personnes de confiance, rencontrées et vérifiées sur le terrain.",
    lang: "fr",
    start_url: "/",
    display: "standalone",
    background_color: "#faf6ee",
    theme_color: "#faf6ee",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
