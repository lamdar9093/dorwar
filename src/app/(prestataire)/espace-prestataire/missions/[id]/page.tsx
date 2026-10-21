import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Icon } from "@/components/icons";
import {
  ConditionsBlock,
  GuaranteeBlock,
  IncidentBlock,
  MeetingBlock,
  PlacementTimeline,
  ReviewBlock,
} from "@/components/placement/placement-blocks";
import { FlashNotice } from "@/components/ui/flash-notice";
import { Stars } from "@/components/ui/rating";
import { WhatsAppButton } from "@/components/site/whatsapp-button";
import { requireSpace } from "@/lib/auth/guards";
import { getPlacementDetail } from "@/lib/data/placements";
import { getReviewsAboutFamily } from "@/lib/data/workers";
import { formatDate } from "@/lib/format";
import { placementStatusLabel } from "@/lib/placements";

export const metadata: Metadata = { title: "Mission" };

export default async function WorkerMissionPage({
  params,
  searchParams,
}: PageProps<"/espace-prestataire/missions/[id]">) {
  const { id } = await params;
  const query = await searchParams;
  const user = await requireSpace("prestataire", `/espace-prestataire/missions/${id}`);
  const detail = await getPlacementDetail(id);
  if (!detail || detail.worker.userId !== user.id) notFound();
  // Confiance dans les deux sens : la personne sollicitée voit ce que d'autres ont dit de cette famille.
  const familyReviews = await getReviewsAboutFamily(detail.family.userId);

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <FlashNotice value={query.ok} />
      <header>
        <p className="eyebrow text-terre-700">
          {detail.service.name} · {detail.formula.label}
        </p>
        <h1 className="mt-2 text-4xl">{detail.family.displayName}</h1>
        <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-gris-700">
          <span className="inline-flex items-center gap-1.5">
            <Icon name="adresse" size={18} /> {detail.family.areaName}
          </span>
          <span className="inline-flex items-center gap-1.5 font-bold text-baobab-700">
            <Icon name="checkCircle" size={18} /> Numéro vérifié
          </span>
          <span>· {placementStatusLabel(detail.status, detail.formula.kind)}</span>
        </p>
      </header>

      <PlacementTimeline detail={detail} />
      <MeetingBlock detail={detail} viewer="prestataire" />
      {detail.familyMessage && (
        <p className="rounded-md bg-sable-100 p-4">
          <span className="font-bold">Message de la famille :</span> {detail.familyMessage}
        </p>
      )}
      <ConditionsBlock detail={detail} viewer="prestataire" />
      <GuaranteeBlock detail={detail} />

      {familyReviews.length > 0 && (
        <section
          aria-labelledby="avis-famille"
          className="rounded-md border border-ligne bg-white p-5"
        >
          <h2 id="avis-famille" className="text-2xl">
            Ce que d’autres disent de cette famille
          </h2>
          <ul className="mt-3 space-y-3">
            {familyReviews.map((r, i) => (
              <li key={i}>
                <div className="flex items-center gap-3">
                  <Stars value={r.rating} />
                  <span className="text-sm text-gris-700">{formatDate(r.createdAt)}</span>
                </div>
                <p className="mt-1">{r.comment}</p>
              </li>
            ))}
          </ul>
        </section>
      )}

      <ReviewBlock detail={detail} viewerId={user.id} viewer="prestataire" />
      <IncidentBlock detail={detail} viewerId={user.id} />
      <div className="rounded-md bg-sable-100 p-5">
        <p className="font-bold">Un souci, une question ?</p>
        <p className="mt-1 text-gris-700">
          L’équipe Dorwar est là pour vous aussi. Vous pouvez envoyer un message vocal.
        </p>
        <div className="mt-4">
          <WhatsAppButton
            full
            message={`Bonjour l’équipe Dorwar, au sujet de ma mission chez ${detail.family.displayName} : `}
          />
        </div>
      </div>
    </div>
  );
}
