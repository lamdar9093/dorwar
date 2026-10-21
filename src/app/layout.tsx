import type { Metadata, Viewport } from "next";
import { SealDefs } from "@/components/brand/seal";
import { fr } from "@/i18n/fr";
import { atkinson, fraunces } from "./fonts";
import "./globals.css";

const demo = process.env.DEMO_MODE !== "false";

export const metadata: Metadata = {
  title: { default: "Dorwar — la confiance se vérifie", template: "%s · Dorwar" },
  description:
    "Dorwar présente aux familles des personnes rencontrées, vérifiées et suivies sur le terrain, pour la maison et le quotidien.",
  applicationName: "Dorwar",
  robots: demo ? { index: false, follow: false } : undefined,
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#faf6ee",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="fr"
      data-scroll-behavior="smooth"
      className={`${fraunces.variable} ${atkinson.variable}`}
    >
      <body className="flex min-h-dvh flex-col">
        <a
          href="#contenu"
          className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:rounded-sm focus:bg-indigo-900 focus:px-4 focus:py-3 focus:text-sable-50"
        >
          {fr.site.skipToContent}
        </a>
        {demo && (
          <p className="bg-indigo-950 px-4 py-1.5 text-center text-xs text-sable-100 print:hidden">
            {fr.site.demoBanner}
          </p>
        )}
        <SealDefs />
        {children}
      </body>
    </html>
  );
}
