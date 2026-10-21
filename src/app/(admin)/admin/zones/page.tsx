import type { Metadata } from "next";
import Link from "next/link";
import { Icon } from "@/components/icons";
import { ActionForm } from "@/components/ui/action-form";
import { Label, TextInput } from "@/components/ui/field";
import { Notice } from "@/components/ui/notice";
import { Pill } from "@/components/ui/pill";
import { SubmitButton } from "@/components/ui/submit-button";
import { getArea, getAreaChildren, getAreaPath, getOpenZoneNames } from "@/lib/areas";
import { requireSpace } from "@/lib/auth/guards";
import { addQuartier, toggleArea } from "../actions";

export const metadata: Metadata = { title: "Zones" };

const LEVEL_LABELS = {
  region: "Régions",
  departement: "Départements",
  commune: "Communes",
  quartier: "Quartiers",
} as const;

export default async function ZonesPage({ searchParams }: PageProps<"/admin/zones">) {
  await requireSpace("admin", "/admin/zones");
  const query = await searchParams;
  const parentId =
    typeof query.zone === "string" && /^[0-9a-f-]{36}$/.test(query.zone) ? query.zone : null;
  const [parent, children, path, openNames] = await Promise.all([
    parentId ? getArea(parentId) : Promise.resolve(null),
    getAreaChildren(parentId),
    parentId ? getAreaPath(parentId) : Promise.resolve([]),
    getOpenZoneNames(),
  ]);
  const level = children[0]?.level ?? (parent?.level === "commune" ? "quartier" : "region");

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-4xl">Zones ouvertes</h1>
      <p className="mt-2 text-gris-700">
        Ouvrir une zone rend visibles les profils vérifiés de cette zone et de toutes ses
        sous-zones. Tout le pays est déjà dans le référentiel.
      </p>
      <Notice tone="info" className="mt-4" title="Ouvertes aujourd’hui">
        {openNames.join(", ") || "Aucune zone ouverte."}
      </Notice>

      <nav aria-label="Fil d’Ariane" className="mt-6 flex flex-wrap items-center gap-1 text-sm">
        <Link href="/admin/zones" className="font-bold underline">
          Sénégal
        </Link>
        {path.map((p) => (
          <span key={p.id} className="flex items-center gap-1">
            <Icon name="chevronRight" size={16} />
            <Link href={`/admin/zones?zone=${p.id}`} className="font-bold underline">
              {p.name}
            </Link>
          </span>
        ))}
      </nav>

      {parent && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-md border border-ligne bg-white p-4">
          <div>
            <p className="text-xl font-bold">{parent.name}</p>
            <p className="text-sm text-gris-700">
              {parent.isOpen
                ? parent.openedByParent
                  ? "Ouverte par une zone plus large"
                  : "Ouverte"
                : "Fermée"}
            </p>
          </div>
          {!parent.openedByParent && (
            <ActionForm action={toggleArea}>
              <input type="hidden" name="zone" value={parent.id} />
              <input type="hidden" name="ouvrir" value={parent.isOpen ? "non" : "oui"} />
              <SubmitButton variant={parent.isOpen ? "danger" : "success"} pendingLabel="…">
                {parent.isOpen ? "Fermer cette zone" : "Ouvrir cette zone"}
              </SubmitButton>
            </ActionForm>
          )}
        </div>
      )}

      <h2 className="mt-8 text-2xl">{LEVEL_LABELS[level]}</h2>
      <ul className="mt-3 divide-y divide-ligne rounded-md border border-ligne bg-white">
        {children.map((c) => (
          <li key={c.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
            <span className="min-w-0 flex-1">
              {c.childCount > 0 ? (
                <Link href={`/admin/zones?zone=${c.id}`} className="font-bold underline">
                  {c.name}
                </Link>
              ) : (
                <span className="font-bold">{c.name}</span>
              )}
              {c.childCount > 0 && (
                <span className="ml-2 text-sm text-gris-700">{c.childCount} sous-zones</span>
              )}
            </span>
            {c.isOpen ? (
              <Pill tone="succes">{c.openedByParent ? "Ouverte (incluse)" : "Ouverte"}</Pill>
            ) : (
              <Pill>Fermée</Pill>
            )}
            {!c.openedByParent && (
              <ActionForm action={toggleArea}>
                <input type="hidden" name="zone" value={c.id} />
                <input type="hidden" name="ouvrir" value={c.isOpen ? "non" : "oui"} />
                <SubmitButton variant="quiet" pendingLabel="…">
                  {c.isOpen ? "Fermer" : "Ouvrir"}
                </SubmitButton>
              </ActionForm>
            )}
          </li>
        ))}
        {children.length === 0 && <li className="px-4 py-3 text-gris-700">Aucune sous-zone.</li>}
      </ul>

      {parent?.level === "commune" && (
        <section className="mt-8 rounded-md border border-ligne bg-white p-5">
          <h2 className="text-2xl">Ajouter un quartier à {parent.name}</h2>
          <p className="mt-1 text-sm text-gris-700">
            Le point central sert à trier par distance : quelques centaines de mètres de précision
            suffisent.
          </p>
          <ActionForm
            action={addQuartier}
            className="mt-4 grid gap-4 sm:grid-cols-3"
            resetOnSuccess
          >
            <input type="hidden" name="commune" value={parent.id} />
            <div className="sm:col-span-3">
              <Label htmlFor="nom">Nom du quartier</Label>
              <TextInput id="nom" name="nom" required />
            </div>
            <div>
              <Label htmlFor="lat">Latitude</Label>
              <TextInput id="lat" name="lat" inputMode="decimal" placeholder="14.708" required />
            </div>
            <div>
              <Label htmlFor="lng">Longitude</Label>
              <TextInput id="lng" name="lng" inputMode="decimal" placeholder="-17.476" required />
            </div>
            <div className="self-end">
              <SubmitButton pendingLabel="Ajout…">Ajouter</SubmitButton>
            </div>
          </ActionForm>
        </section>
      )}
    </div>
  );
}
