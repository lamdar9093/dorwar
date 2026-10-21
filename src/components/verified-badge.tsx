import { SealMini } from "@/components/brand/seal";
import { Icon } from "@/components/icons";
import { formatDate } from "@/lib/format";
import type { BadgeItem } from "@/lib/verification";

/**
 * Badge « Vérifié par Dorwar » : un toucher déplie ce qui a été vérifié et quand.
 * Construit sur <details> : fonctionne sans JavaScript. Ne montre jamais de document.
 */
export function VerifiedBadge({
  items,
  verifiedAt,
  defaultOpen = false,
}: {
  items: BadgeItem[];
  verifiedAt: Date | null;
  defaultOpen?: boolean;
}) {
  return (
    <details
      className="group rounded-md border border-baobab-600/30 bg-baobab-100/70"
      open={defaultOpen}
    >
      <summary className="flex min-h-12 items-center gap-2.5 px-3 py-2 text-baobab-700">
        <SealMini size={22} className="shrink-0 text-baobab-600" />
        <span className="font-bold">Vérifié par Dorwar</span>
        {verifiedAt && <span className="text-sm text-indigo-900">· {formatDate(verifiedAt)}</span>}
        <Icon
          name="chevronDown"
          size={20}
          className="ml-auto shrink-0 transition-transform group-open:rotate-180"
        />
        <span className="sr-only">Voir le détail de la vérification</span>
      </summary>
      <ul className="space-y-2 border-t border-baobab-600/20 px-3 pt-3 pb-3.5">
        {items.map((item) => (
          <li key={item.key} className="flex items-start gap-2.5 text-sm">
            <Icon
              name={item.done ? "checkCircle" : "horloge"}
              size={20}
              className={
                item.done ? "mt-px shrink-0 text-baobab-700" : "mt-px shrink-0 text-gris-700"
              }
            />
            <span className="text-indigo-900">
              {item.label}
              {item.done && item.date ? (
                <span className="text-gris-700"> — le {formatDate(item.date)}</span>
              ) : !item.done ? (
                <span className="text-gris-700"> — en cours</span>
              ) : null}
            </span>
          </li>
        ))}
        <li className="flex items-start gap-2.5 pt-1 text-sm text-gris-700">
          <Icon name="cadenas" size={20} className="mt-px shrink-0" />
          <span>
            La pièce d’identité n’est jamais affichée. Seul le résultat de la vérification l’est.
          </span>
        </li>
      </ul>
    </details>
  );
}
