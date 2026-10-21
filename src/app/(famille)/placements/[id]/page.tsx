import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
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
import { Medallion } from "@/components/ui/medallion";
import { Notice } from "@/components/ui/notice";
import { WhatsAppButton } from "@/components/site/whatsapp-button";
import { motsWolof } from "@/i18n";
import { requireUser } from "@/lib/auth/guards";
import { isStaff } from "@/lib/auth/rbac";
import { getPlacementDetail } from "@/lib/data/placements";
import { capitalize } from "@/lib/data/workers";
import { formatFcfa } from "@/lib/format";
import { placementStatusLabel } from "@/lib/placements";
import { providerNoun } from "@/lib/services/repository";

export const metadata: Metadata = { title: "Suivi du placement" };

export default async function FamilyPlacementPage({
  params,
  searchParams,
}: PageProps<"/placements/[id]">) {
  const { id } = await params;
  const query = await searchParams;
  const user = await requireUser(`/placements/${id}`);
  const detail = await getPlacementDetail(id);
  if (!detail) notFound();
  if (isStaff(user)) redirect(`/agent/placements/${id}`);
  if (user.id === detail.worker.userId) redirect(`/espace-prestataire/missions/${id}`);
  if (user.id !== detail.family.userId) notFound();

  const noun = capitalize(providerNoun(detail.service, detail.worker.gender));
  const fee = detail.service.config.fees[detail.formula.key];

  return (
    <div className="grid gap-10 lg:grid-cols-12">
      <div className="space-y-8 lg:col-span-8">
        <FlashNotice value={query.ok} />
        {query.envoye === "1" && (
          <Notice
            tone="succes"
            title={
              <>
                <span lang="wo">{motsWolof.merci}</span> ! Votre demande de rencontre est envoyée.
              </>
            }
          >
            L’équipe Dorwar vous appelle pour fixer le rendez-vous. Vous pouvez suivre chaque étape
            ici.
          </Notice>
        )}
        <div>
          <p className="eyebrow text-terre-700">
            {detail.service.name} · {detail.formula.label}
          </p>
          <div className="mt-3 flex items-center gap-4">
            <Medallion
              firstName={detail.worker.firstName}
              lastInitial={detail.worker.lastInitial}
              seed={detail.worker.profileId}
              size="md"
            />
            <div>
              <h1 className="text-3xl sm:text-4xl">
                {detail.worker.firstName} {detail.worker.lastInitial}.
              </h1>
              <p className="text-gris-700">
                {noun} · {placementStatusLabel(detail.status, detail.formula.kind)}
              </p>
              <Link
                href={`/profils/${detail.worker.profileId}?demande=${detail.requestId}`}
                className="mt-1 inline-flex min-h-11 items-center gap-1.5 font-bold text-indigo-900 underline"
              >
                Voir le profil et sa vérification
                <Icon name="arrowRight" size={18} />
              </Link>
            </div>
          </div>
        </div>

        <PlacementTimeline detail={detail} />
        <MeetingBlock detail={detail} viewer="famille" />
        <ConditionsBlock detail={detail} viewer="famille" />
        <ReviewBlock detail={detail} viewerId={user.id} viewer="famille" />
        <IncidentBlock detail={detail} viewerId={user.id} />
      </div>

      <aside className="space-y-6 lg:col-span-4">
        <GuaranteeBlock detail={detail} />
        {fee && (
          <div className="rounded-md border border-ligne bg-white p-5">
            <h2 className="flex items-center gap-2 font-sans text-lg font-bold">
              <Icon name="argent" size={22} /> {fee.label}
            </h2>
            <p className="mt-1 font-display text-2xl">{formatFcfa(fee.amountFcfa)}</p>
            <p className="mt-2 text-sm text-gris-700">
              À régler par Wave ou Orange Money une fois la personne choisie. En démonstration,
              aucun paiement n’est demandé.
            </p>
          </div>
        )}
        <div className="rounded-md border border-ligne bg-white p-5">
          <h2 className="font-sans text-lg font-bold">Une question ?</h2>
          <p className="mt-1 text-sm text-gris-700">L’équipe suit ce placement avec vous.</p>
          <div className="mt-4">
            <WhatsAppButton
              full
              message={`Bonjour l’équipe Dorwar, au sujet de mon placement avec ${detail.worker.firstName} : `}
            />
          </div>
        </div>
      </aside>
    </div>
  );
}
