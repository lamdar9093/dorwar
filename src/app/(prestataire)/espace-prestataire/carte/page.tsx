import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LogoMark } from "@/components/brand/logo";
import { Seal } from "@/components/brand/seal";
import { Icon } from "@/components/icons";
import { EmptyState } from "@/components/ui/empty-state";
import { Medallion } from "@/components/ui/medallion";
import { requireSpace } from "@/lib/auth/guards";
import { capitalize, getWorkerByUserId } from "@/lib/data/workers";
import { env } from "@/lib/env";
import { formatDate, joinFr } from "@/lib/format";
import { qrSvg } from "@/lib/qr";
import { providerNoun } from "@/lib/services/repository";
import { PrintButton } from "./print-button";

export const metadata: Metadata = { title: "Ma carte Dorwar" };

export default async function CardPage() {
  const user = await requireSpace("prestataire", "/espace-prestataire/carte");
  const worker = await getWorkerByUserId(user.id);
  if (!worker) redirect("/espace-prestataire/inscription");
  const verified = worker.dossiers.filter((d) => d.status === "verifie");

  if (!verified.length) {
    return (
      <div className="mx-auto max-w-xl">
        <h1 className="text-4xl">Ma carte Dorwar</h1>
        <div className="mt-8">
          <EmptyState icon="carte" title="Votre carte arrive avec votre vérification.">
            Dès que l’agent Dorwar aura terminé les étapes de votre dossier, votre carte avec son QR
            code apparaîtra ici.
          </EmptyState>
        </div>
      </div>
    );
  }

  const url = `${env().siteUrl}/v/${worker.cardId}`;
  const qr = await qrSvg(url);
  const since = verified
    .map((d) => d.verifiedAt)
    .filter(Boolean)
    .sort((a, b) => +a! - +b!)[0];
  const e = worker.gender === "femme" ? "e" : "";

  return (
    <div className="mx-auto max-w-md">
      <h1 className="text-3xl print:hidden">Ma carte Dorwar</h1>
      <p className="mt-2 text-gris-700 print:hidden">
        Montrez-la à la famille lors de la rencontre : en scannant le code, elle voit sur notre site
        que vous êtes vérifié{e} et que votre carte est active.
      </p>

      <article
        className="relative mt-6 overflow-hidden rounded-lg border border-indigo-900/20 bg-white shadow-raise"
        aria-label="Carte Dorwar"
      >
        <header className="on-dark flex items-center justify-between bg-indigo-950 px-5 py-4 text-sable-50">
          <span className="flex items-center gap-2.5 font-display text-xl font-semibold">
            <LogoMark tone="light" size={22} /> Dorwar
          </span>
          <span className="eyebrow text-ocre-500">Carte de confiance</span>
        </header>
        <div className="motif-tisse px-5 pt-6 pb-5">
          <div className="flex gap-4">
            <Medallion
              firstName={worker.firstName}
              lastInitial={worker.lastInitial}
              seed={worker.profileId}
              size="lg"
            />
            <div className="min-w-0">
              <p className="font-display text-3xl leading-tight">
                {worker.firstName} {worker.lastInitial}.
              </p>
              <p className="mt-1 text-gris-700">
                {joinFr(verified.map((d) => capitalize(providerNoun(d.service, worker.gender))))}
              </p>
              <p className="mt-2 inline-flex items-center gap-1.5 text-sm font-bold text-baobab-700">
                <Icon name="checkCircle" size={18} /> Vérifié{e} par Dorwar
              </p>
              {since && <p className="text-sm text-gris-700">depuis le {formatDate(since)}</p>}
            </div>
          </div>
          <div className="mt-6 flex items-end justify-between gap-4">
            <div
              className="w-44 shrink-0 rounded-sm border border-ligne bg-white p-2"
              aria-label={`QR code menant à ${url}`}
              role="img"
            >
              <div
                className="[&_svg]:h-auto [&_svg]:w-full"
                dangerouslySetInnerHTML={{ __html: qr }}
              />
            </div>
            <Seal size={92} className="-mb-1 -rotate-[8deg]" label="" />
          </div>
          <p className="mt-4 text-sm text-gris-700">N° de carte</p>
          <p className="font-display text-2xl tracking-[0.12em]">{worker.cardId}</p>
          <p className="mt-3 text-xs text-gris-700">
            Scannez le code pour vérifier que cette carte est active :{" "}
            {url.replace(/^https?:\/\//, "")}
          </p>
        </div>
      </article>

      <div className="mt-6 flex flex-wrap gap-3 print:hidden">
        <PrintButton />
      </div>
    </div>
  );
}
