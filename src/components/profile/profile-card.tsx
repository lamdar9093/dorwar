import Link from "next/link";
import { SealMini } from "@/components/brand/seal";
import { Icon } from "@/components/icons";
import { Medallion } from "@/components/ui/medallion";
import { Rating } from "@/components/ui/rating";
import { experienceLabel } from "@/components/worker-card";
import { capitalize } from "@/lib/data/workers";
import type { VitrineEntry } from "@/lib/data/vitrine";
import { formatDate, formatDistance } from "@/lib/format";
import { publicProfilePath } from "@/lib/public-profile";
import { providerNoun, type LoadedService } from "@/lib/services/repository";

/**
 * Carte d'une personne vérifiée dans la vitrine publique : rien que des informations publiques.
 * Toute la carte est cliquable, mais le lien ne porte que le prénom (lecteurs d'écran).
 */
export function ProfileCard({
  entry,
  service,
  showDistance = false,
}: {
  entry: VitrineEntry;
  service: LoadedService;
  /** Seulement quand le visiteur a choisi un quartier : la distance est mesurée depuis celui-ci. */
  showDistance?: boolean;
}) {
  const verified = entry.gender === "femme" ? "Vérifiée" : "Vérifié";
  return (
    <article className="relative flex h-full flex-col rounded-md border border-ligne bg-white p-4 transition-colors has-[a:hover]:border-indigo-900 sm:p-5">
      <div className="flex items-start gap-4">
        <Medallion
          firstName={entry.firstName}
          lastInitial={entry.lastInitial}
          seed={entry.profileId}
          size="md"
        />
        <div className="min-w-0">
          <h3 className="text-2xl leading-tight lg:text-xl">
            <Link
              href={publicProfilePath(entry.profileId, service.slug)}
              className="after:absolute after:inset-0 after:rounded-md hover:underline focus-visible:outline-none focus-visible:after:outline-3 focus-visible:after:outline-offset-2 focus-visible:after:outline-indigo-900"
            >
              {entry.firstName} {entry.lastInitial}.
            </Link>
          </h3>
          <p className="mt-1 text-gris-700">{capitalize(providerNoun(service, entry.gender))}</p>
          <p className="mt-1 flex items-center gap-1.5 font-bold">
            <Icon name="adresse" size={18} className="shrink-0 text-terre-700" />
            {entry.areaName}
          </p>
          {showDistance && entry.distanceM !== null && (
            <p className="text-sm text-gris-700">
              {formatDistance(entry.distanceM)} du quartier choisi
            </p>
          )}
        </div>
      </div>
      <p className="mt-4 text-sm text-gris-700">{experienceLabel(entry.experienceYears)}</p>
      <div className="mt-1">
        <Rating avg={entry.ratingAvg} count={entry.ratingCount} />
      </div>
      {entry.verifiedAt && (
        <p className="mt-auto flex items-center gap-2 pt-4 text-sm font-bold text-baobab-700">
          <SealMini size={20} className="shrink-0 text-baobab-600" />
          {verified} par Dorwar le {formatDate(entry.verifiedAt)}
        </p>
      )}
    </article>
  );
}
