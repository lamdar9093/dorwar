import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { Icon } from "@/components/icons";
import { getDictionary } from "@/i18n";
import { getOpenZoneNames } from "@/lib/areas";
import { WhatsAppButton } from "./whatsapp-button";

export async function SiteFooter() {
  const [t, zones] = await Promise.all([getDictionary(), getOpenZoneNames()]);
  return (
    <footer className="on-dark motif-tisse-sombre bg-indigo-950 text-sable-100">
      <div className="container-page grid gap-10 py-14 md:grid-cols-12">
        <div className="md:col-span-4">
          <Logo tone="light" />
          <p className="mt-4 max-w-xs text-lg text-sable-100">{t.footer.tagline}</p>
        </div>
        <div className="md:col-span-3">
          <h2 className="eyebrow font-sans text-ocre-500">{t.footer.zones}</h2>
          <ul className="mt-3 space-y-1.5">
            {zones.map((z) => (
              <li key={z} className="flex items-center gap-2">
                <Icon name="adresse" size={18} className="text-ocre-500" />
                {z}
              </li>
            ))}
          </ul>
          <h2 className="eyebrow mt-8 font-sans text-ocre-500">{t.footer.contact}</h2>
          <div className="mt-3">
            <WhatsAppButton variant="light" label={t.whatsapp.short} />
          </div>
        </div>
        <div className="md:col-span-5">
          <h2 className="eyebrow font-sans text-ocre-500">{t.footer.data}</h2>
          <p className="mt-3 max-w-md">{t.footer.dataText}</p>
          <Link
            href="/vos-donnees"
            className="mt-3 inline-flex min-h-12 items-center gap-2 font-bold text-sable-50 underline"
          >
            {t.footer.dataLink}
            <Icon name="arrowRight" size={18} />
          </Link>
          <ul className="mt-6 flex flex-wrap gap-x-6 gap-y-1">
            <li>
              <Link
                href="/devenir-prestataire"
                className="inline-flex min-h-12 items-center hover:underline"
              >
                {t.home.secondary}
              </Link>
            </li>
            <li>
              <Link href="/connexion" className="inline-flex min-h-12 items-center hover:underline">
                {t.site.login}
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-sable-50/15">
        <p className="container-page py-5 text-sm text-sable-200">
          © {new Date().getFullYear()} {t.footer.legal}
        </p>
      </div>
    </footer>
  );
}
