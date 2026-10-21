import Link from "next/link";
import { Icon } from "@/components/icons";
import { Medallion } from "@/components/ui/medallion";
import { Pill, Tag } from "@/components/ui/pill";
import { Rating } from "@/components/ui/rating";
import { VerifiedBadge } from "@/components/verified-badge";
import { capitalize, skillLabels } from "@/lib/data/workers";
import { ageFromBirthYear, formatDistance, formatFcfa } from "@/lib/format";
import type { Match } from "@/lib/matching";
import { placementStatusLabel, type PlacementStatus } from "@/lib/placements";
import { providerNoun, type LoadedService } from "@/lib/services/repository";
import type { BadgeItem } from "@/lib/verification";

export function experienceLabel(years: number): string {
  if (years < 1) return "Moins d’un an d’expérience";
  return years === 1 ? "1 an d’expérience" : `${years} ans d’expérience`;
}

/** Une ligne de résultat : jamais d'adresse, seulement le quartier et une distance arrondie. */
export function WorkerCard({
  match,
  service,
  formula,
  badge,
  href,
}: {
  match: Match;
  service: LoadedService;
  formula: LoadedService["config"]["formulas"][number];
  badge: BadgeItem[];
  href: string;
}) {
  const noun = capitalize(providerNoun(service, match.gender));
  const rate = formula.pay === "mensuel" ? match.monthlyRateFcfa : match.dailyRateFcfa;
  const ready = match.gender === "femme" ? "prête" : "prêt";
  return (
    <article className="grid gap-5 border-b border-ligne py-7 sm:grid-cols-[auto_1fr] sm:gap-6">
      <Medallion
        firstName={match.firstName}
        lastInitial={match.lastInitial}
        seed={match.workerProfileId}
        size="lg"
      />
      <div className="min-w-0">
        <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
          <div>
            <h3 className="text-2xl">
              <Link href={href} className="hover:underline">
                {match.firstName} {match.lastInitial}.
              </Link>
            </h3>
            <p className="mt-1 text-gris-700">
              {noun} · {ageFromBirthYear(match.birthYear)} ans ·{" "}
              {experienceLabel(match.experienceYears)}
            </p>
          </div>
          {match.placementStatus && (
            <Pill tone="info" icon="calendrier">
              {placementStatusLabel(match.placementStatus as PlacementStatus, formula.kind)}
            </Pill>
          )}
        </div>

        <p className="mt-3 flex items-center gap-2 font-bold">
          <Icon name="adresse" size={20} className="shrink-0 text-terre-700" />
          {match.reason === "installation" ? (
            <span>
              Habite à {match.areaName} · {ready} à s’installer chez vous
            </span>
          ) : (
            <span>
              {match.areaName} · {formatDistance(match.distanceM)}
            </span>
          )}
        </p>

        <div className="mt-3 flex flex-wrap gap-2">
          {skillLabels(service, match.skills).map((s) => (
            <Tag key={s}>{s}</Tag>
          ))}
        </div>
        <p className="mt-3 text-sm text-gris-700">
          Parle {match.languages.join(", ")}
          {rate
            ? ` · souhaite environ ${formatFcfa(rate)} ${formula.pay === "mensuel" ? "par mois" : "par jour"}`
            : ""}
        </p>
        <div className="mt-3">
          <Rating avg={match.ratingAvg} count={match.ratingCount} />
        </div>

        <div className="mt-5 grid gap-3 lg:grid-cols-[1fr_auto] lg:items-start">
          <VerifiedBadge items={badge} verifiedAt={match.verifiedAt} />
          <Link
            href={href}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-sm border-[1.5px] border-indigo-900 px-5 font-bold text-indigo-900 hover:bg-indigo-900 hover:text-sable-50"
          >
            Voir le profil
            <Icon name="arrowRight" size={20} />
          </Link>
        </div>
      </div>
    </article>
  );
}
