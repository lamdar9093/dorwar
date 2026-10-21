import type { Metadata } from "next";
import { Seal } from "@/components/brand/seal";
import { Icon } from "@/components/icons";
import { Medallion } from "@/components/ui/medallion";
import { WhatsAppButton } from "@/components/site/whatsapp-button";
import { CARD_ID_PATTERN } from "@/lib/card";
import { capitalize, getWorkerByCardId } from "@/lib/data/workers";
import { formatDate, joinFr } from "@/lib/format";
import { providerNoun } from "@/lib/services/repository";

export const metadata: Metadata = {
  title: "Vérification d’une carte Dorwar",
  robots: { index: false },
};

/**
 * Page ouverte en scannant le QR code d'une carte Dorwar. Elle ne montre que le strict nécessaire :
 * prénom, initiale, service, et si la carte est active aujourd'hui.
 */
export default async function CardCheckPage({ params }: PageProps<"/v/[cardId]">) {
  const { cardId } = await params;
  const id = decodeURIComponent(cardId).toUpperCase();
  const worker = CARD_ID_PATTERN.test(id) ? await getWorkerByCardId(id) : null;
  const verified = worker?.dossiers.filter((d) => d.status === "verifie") ?? [];
  const active = verified.length > 0;
  const now = new Date();

  return (
    <div className="container-page py-10 sm:py-16">
      <div className="mx-auto max-w-lg">
        <p className="eyebrow text-terre-700">Vérification d’une carte Dorwar</p>
        {!worker ? (
          <div className="mt-6 rounded-md border-[1.5px] border-rouge-700 bg-rouge-100 p-6">
            <Icon name="alerte" size={36} className="text-rouge-700" />
            <h1 className="mt-3 text-3xl">Cette carte n’existe pas.</h1>
            <p className="mt-3 text-lg">
              Le numéro <strong>{id}</strong> ne correspond à aucune carte Dorwar. Attention : la
              carte présentée pourrait être fausse. Ne laissez pas entrer la personne avant d’avoir
              parlé à notre équipe.
            </p>
          </div>
        ) : active ? (
          <div className="mt-6 overflow-hidden rounded-md border-[1.5px] border-baobab-600 bg-white">
            <div className="flex items-center gap-4 bg-baobab-600 p-5 text-white">
              <Seal size={64} tone="indigo" label="" />
              <div>
                <p className="text-sm font-bold tracking-wider uppercase">Carte active</p>
                <h1 className="text-2xl text-white sm:text-3xl">
                  {worker.firstName} {worker.lastInitial}. est{" "}
                  {worker.gender === "femme" ? "vérifiée" : "vérifié"} par Dorwar
                </h1>
              </div>
            </div>
            <div className="flex gap-4 p-5">
              <Medallion
                firstName={worker.firstName}
                lastInitial={worker.lastInitial}
                seed={worker.profileId}
                size="md"
              />
              <dl className="space-y-2">
                <div>
                  <dt className="text-sm text-gris-700">Service</dt>
                  <dd className="font-bold">
                    {joinFr(
                      verified.map(
                        (d) => `${d.service.name} (${providerNoun(d.service, worker.gender)})`,
                      ),
                    )}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-gris-700">Vérification complète depuis le</dt>
                  <dd className="font-bold">
                    {verified[0].verifiedAt ? formatDate(verified[0].verifiedAt) : "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-gris-700">Carte n°</dt>
                  <dd className="font-bold tracking-wider">{worker.cardId}</dd>
                </div>
              </dl>
            </div>
            <p className="border-t border-ligne px-5 py-3 text-sm text-gris-700">
              Vérifié à l’instant, le {formatDate(now)}. Comparez le prénom et le visage avec la
              personne devant vous.
            </p>
          </div>
        ) : (
          <div className="mt-6 rounded-md border-[1.5px] border-rouge-700 bg-rouge-100 p-6">
            <Icon name="cadenas" size={36} className="text-rouge-700" />
            <h1 className="mt-3 text-3xl">Cette carte n’est pas active.</h1>
            <p className="mt-3 text-lg">
              La carte de {capitalize(worker.firstName)} {worker.lastInitial}. n’est pas valide
              aujourd’hui. Avant toute chose, parlez à notre équipe.
            </p>
          </div>
        )}
        <div className="mt-8">
          <WhatsAppButton full message={`Bonjour l’équipe Dorwar, je vérifie la carte ${id} : `} />
        </div>
      </div>
    </div>
  );
}
