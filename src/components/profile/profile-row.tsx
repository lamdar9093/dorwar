import Link from "next/link";
import { Icon } from "@/components/icons";
import { cn } from "@/lib/cn";
import type { VitrineEntry } from "@/lib/data/vitrine";
import type { LoadedService } from "@/lib/services/repository";
import { ProfileCard } from "./profile-card";

/** Cartes affichées sur ordinateur ; sur téléphone, toutes défilent au doigt. */
const DESKTOP_COUNT = 4;

/**
 * Rangée de profils : sur téléphone, on la fait glisser au doigt (la carte suivante dépasse pour
 * le montrer) ; sur ordinateur, quatre cartes posées. Rien ne défile tout seul, aucun JavaScript.
 */
export function ProfileRow({
  entries,
  services,
  label,
  more,
}: {
  entries: VitrineEntry[];
  services: Map<string, LoadedService>;
  label: string;
  more?: { href: string; label: string };
}) {
  const shown = entries.filter((e) => services.has(e.serviceId));
  return (
    <div className="-mx-4 snap-x snap-mandatory scroll-px-4 overflow-x-auto px-4 pb-3 sm:-mx-6 sm:scroll-px-6 sm:px-6 md:mx-0 md:overflow-visible md:px-0 md:pb-0">
      <ul aria-label={label} className="flex gap-4 md:grid md:grid-cols-2 md:gap-5 lg:grid-cols-4">
        {shown.map((entry, i) => (
          <li
            key={entry.profileId}
            className={cn(
              "w-[78%] max-w-80 shrink-0 snap-start sm:w-[45%] md:w-auto md:max-w-none",
              i >= DESKTOP_COUNT && "md:hidden",
            )}
          >
            <ProfileCard entry={entry} service={services.get(entry.serviceId)!} />
          </li>
        ))}
        {more && (
          <li className="w-[55%] max-w-64 shrink-0 snap-start md:hidden">
            <Link
              href={more.href}
              className="flex h-full min-h-40 flex-col justify-between rounded-md border-[1.5px] border-dashed border-indigo-900/40 p-5 font-bold text-indigo-900 hover:border-indigo-900"
            >
              {more.label}
              <Icon name="arrowRight" size={26} />
            </Link>
          </li>
        )}
      </ul>
    </div>
  );
}
