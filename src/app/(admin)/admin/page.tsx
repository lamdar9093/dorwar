import type { Metadata } from "next";
import Link from "next/link";
import { sql } from "drizzle-orm";
import { db } from "@/db/client";
import { Icon, type IconName } from "@/components/icons";
import { requireSpace } from "@/lib/auth/guards";
import { formatNumber } from "@/lib/format";

export const metadata: Metadata = { title: "Administration" };

export default async function AdminHomePage() {
  await requireSpace("admin", "/admin");
  const [counts] = (
    await db.execute<Record<string, number>>(sql`
      select
        (select count(*)::int from worker_services where status in ('en_attente', 'en_cours')) as dossiers_ouverts,
        (select count(*)::int from worker_services where status = 'verifie') as verifies,
        (select count(*)::int from placements where status in ('rencontre_demandee', 'rencontre_prevue')) as rencontres,
        (select count(*)::int from placements where status in ('essai', 'confirme')) as en_poste,
        (select count(*)::int from incidents where status <> 'resolu') as signalements,
        (select count(*)::int from waitlist where notified_at is null) as attente,
        (select count(*)::int from users where role = 'famille') as familles,
        (select count(*)::int from requests where status = 'ouverte') as demandes
    `)
  ).rows;

  const tiles: { label: string; value: number; href: string; icon: IconName; alert?: boolean }[] = [
    {
      label: "Dossiers à vérifier",
      value: counts.dossiers_ouverts,
      href: "/admin/dossiers",
      icon: "bouclier",
    },
    {
      label: "Profils vérifiés",
      value: counts.verifies,
      href: "/admin/dossiers?filtre=verifies",
      icon: "checkCircle",
    },
    {
      label: "Rencontres en cours",
      value: counts.rencontres,
      href: "/admin/placements",
      icon: "calendrier",
    },
    {
      label: "Personnes en poste",
      value: counts.en_poste,
      href: "/admin/placements",
      icon: "maison",
    },
    {
      label: "Signalements à traiter",
      value: counts.signalements,
      href: "/admin/signalements",
      icon: "signaler",
      alert: counts.signalements > 0,
    },
    {
      label: "Numéros en liste d’attente",
      value: counts.attente,
      href: "/admin/attente",
      icon: "horloge",
    },
    {
      label: "Familles inscrites",
      value: counts.familles,
      href: "/admin/utilisateurs?role=famille",
      icon: "personne",
    },
    {
      label: "Demandes ouvertes",
      value: counts.demandes,
      href: "/admin/placements",
      icon: "liste",
    },
  ];

  return (
    <div>
      <h1 className="text-4xl">Tableau de bord</h1>
      <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {tiles.map((tile) => (
          <li key={tile.label}>
            <Link
              href={tile.href}
              className={`flex h-full flex-col justify-between gap-4 rounded-md border bg-white p-5 hover:border-indigo-900 ${tile.alert ? "border-rouge-700/50" : "border-ligne"}`}
            >
              <span className="flex items-center justify-between">
                <span className="font-bold">{tile.label}</span>
                <Icon
                  name={tile.icon}
                  size={24}
                  className={tile.alert ? "text-rouge-700" : "text-terre-700"}
                />
              </span>
              <span className="font-display text-5xl">{formatNumber(tile.value)}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
