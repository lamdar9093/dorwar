import type { ReactNode } from "react";
import { Icon } from "@/components/icons";
import { Medallion } from "@/components/ui/medallion";
import { Tag } from "@/components/ui/pill";
import { Rating, Stars } from "@/components/ui/rating";
import { VerifiedBadge } from "@/components/verified-badge";
import { experienceLabel } from "@/components/worker-card";
import { capitalize, skillLabels, type ProfileReview } from "@/lib/data/workers";
import { formatDate, formatDistance, formatFcfa } from "@/lib/format";
import type { PublicProfile } from "@/lib/public-profile";
import { providerNoun, type LoadedService } from "@/lib/services/repository";
import type { BadgeItem } from "@/lib/verification";

/** Ce que seule une famille connectée voit en plus de la fiche publique. */
export type PrivateFacts = {
  age: number;
  monthlyRateFcfa: number | null;
  dailyRateFcfa: number | null;
  availableFrom: string | null;
  cardId: string;
  /** Distance depuis le lieu de la demande, arrondie à l'affichage. */
  distanceM: number | null;
};

/**
 * Le corps d'une fiche : identique pour le visiteur et pour la famille connectée,
 * à la seule différence des `privateFacts`, que seule la page famille transmet.
 */
export function WorkerProfileView({
  profile,
  service,
  badge,
  reviews,
  privateFacts,
  aside,
  children,
}: {
  profile: PublicProfile;
  service: LoadedService;
  badge: BadgeItem[];
  reviews: ProfileReview[];
  privateFacts?: PrivateFacts;
  /** Sous le badge, dans la colonne qui reste visible sur ordinateur. */
  aside?: ReactNode;
  /** Après les avis (demande de rencontre, par exemple). */
  children?: ReactNode;
}) {
  const noun = capitalize(providerNoun(service, profile.gender));
  const ready = profile.gender === "femme" ? "Prête" : "Prêt";

  return (
    <div className="grid gap-10 lg:grid-cols-12">
      <div className="lg:col-span-4">
        <div className="lg:sticky lg:top-6">
          <Medallion
            firstName={profile.firstName}
            lastInitial={profile.lastInitial}
            seed={profile.profileId}
            size="xl"
          />
          <div className="mt-5 max-w-sm">
            <VerifiedBadge items={badge} verifiedAt={profile.verifiedAt} defaultOpen />
          </div>
          {privateFacts && (
            <p className="mt-4 flex max-w-sm gap-2 text-sm text-gris-700">
              <Icon name="qr" size={20} className="shrink-0 text-indigo-900" />
              <span>
                Lors de la rencontre, scannez sa carte Dorwar (n° {privateFacts.cardId}) : vous
                verrez sur notre site qu’elle est bien active.
              </span>
            </p>
          )}
          {aside && <div className="mt-6 max-w-sm">{aside}</div>}
        </div>
      </div>

      <div className="lg:col-span-8">
        <h1 className="text-4xl sm:text-5xl">
          {profile.firstName} {profile.lastInitial}.
        </h1>
        <p className="mt-2 text-lg text-gris-700">
          {noun}
          {privateFacts && ` · ${privateFacts.age} ans`} ·{" "}
          {experienceLabel(profile.experienceYears)}
        </p>
        <p className="mt-3 flex items-center gap-2 font-bold">
          <Icon name="adresse" size={20} className="text-terre-700" />
          {profile.areaName}
          {privateFacts?.distanceM != null && (
            <span className="font-normal text-gris-700">
              · {formatDistance(privateFacts.distanceM)} de chez vous
            </span>
          )}
        </p>
        <div className="mt-3">
          <Rating avg={profile.ratingAvg} count={profile.ratingCount} />
        </div>

        {profile.presentation && (
          <>
            <blockquote className="mt-8 border-l-[3px] border-terre-600 pl-5 font-display text-xl leading-relaxed text-indigo-900 sm:text-2xl">
              {profile.presentation}
            </blockquote>
            <p className="mt-2 pl-6 text-sm text-gris-700">
              Présentation rédigée par l’équipe Dorwar après l’entretien.
            </p>
          </>
        )}

        <dl className="mt-10 grid gap-x-8 gap-y-6 border-t border-indigo-900 pt-6 sm:grid-cols-2">
          <div>
            <dt className="eyebrow text-terre-700">Savoir-faire</dt>
            <dd className="mt-2 flex flex-wrap gap-2">
              {skillLabels(service, profile.skills).map((s) => (
                <Tag key={s}>{s}</Tag>
              ))}
            </dd>
          </div>
          <div>
            <dt className="eyebrow text-terre-700">Langues</dt>
            <dd className="mt-2">{profile.languages.map(capitalize).join(", ")}</dd>
          </div>
          <div>
            <dt className="eyebrow text-terre-700">Formules acceptées</dt>
            <dd className="mt-2 space-y-1">
              {service.config.formulas
                .filter((f) => profile.formulaKeys.includes(f.key))
                .map((f) => (
                  <p key={f.key} className="flex items-center gap-2">
                    <Icon name={f.icon} size={20} className="text-indigo-900" />
                    {f.label}
                  </p>
                ))}
              {profile.willingToRelocate && (
                <p className="text-sm text-gris-700">
                  {ready} à s’installer dans une autre ville pour un poste logé.
                </p>
              )}
            </dd>
          </div>
          {privateFacts && (
            <div>
              <dt className="eyebrow text-terre-700">Rémunération souhaitée</dt>
              <dd className="mt-2 space-y-1">
                {privateFacts.monthlyRateFcfa && (
                  <p>Environ {formatFcfa(privateFacts.monthlyRateFcfa)} par mois</p>
                )}
                {privateFacts.dailyRateFcfa && (
                  <p>Environ {formatFcfa(privateFacts.dailyRateFcfa)} par jour</p>
                )}
                <p className="text-sm text-gris-700">À convenir ensemble lors de la rencontre.</p>
              </dd>
            </div>
          )}
          {privateFacts?.availableFrom && (
            <div>
              <dt className="eyebrow text-terre-700">Disponibilité</dt>
              <dd className="mt-2">À partir du {formatDate(privateFacts.availableFrom)}</dd>
            </div>
          )}
        </dl>

        <section className="mt-12" aria-labelledby="avis">
          <h2 id="avis" className="text-3xl">
            Avis des familles
          </h2>
          {reviews.length === 0 ? (
            <p className="mt-3 text-gris-700">
              Pas encore d’avis : ce profil est récent. Sa vérification, elle, est complète.
            </p>
          ) : (
            <ul className="mt-4 divide-y divide-ligne border-y border-ligne">
              {reviews.map((r) => (
                <li key={r.id} className="py-5">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <Stars value={r.rating} />
                    <span className="font-bold">
                      Une famille{r.authorArea ? ` · ${r.authorArea}` : ""}
                    </span>
                    <span className="text-sm text-gris-700">
                      · {service.config.formulas.find((f) => f.key === r.formulaKey)?.shortLabel} ·{" "}
                      {formatDate(r.createdAt)}
                    </span>
                  </div>
                  <p className="mt-2">{r.comment}</p>
                </li>
              ))}
            </ul>
          )}
        </section>

        {children}
      </div>
    </div>
  );
}
