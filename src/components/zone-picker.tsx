"use client";

import { useEffect, useState } from "react";
import { Label, Select } from "@/components/ui/field";

export type ZoneOption = { id: string; name: string; isOpen: boolean; childCount: number };

const LEVELS = ["Région", "Département", "Commune", "Quartier"];

/**
 * Choix d'une zone en cascade : région, département, commune, quartier.
 * Les sous-zones sont chargées à la demande (connexion lente : rien de superflu).
 */
export function ZonePicker({
  chain,
  regions,
  onSelect,
  markClosed = true,
}: {
  chain: string[];
  regions: ZoneOption[];
  onSelect: (areaId: string, chain: string[], label: string) => void;
  markClosed?: boolean;
}) {
  const [levels, setLevels] = useState<ZoneOption[][]>([regions]);
  const [loading, setLoading] = useState(false);

  // Recharge les niveaux d'un choix déjà fait (brouillon restauré).
  useEffect(() => {
    let cancelled = false;
    async function restore() {
      const loaded: ZoneOption[][] = [regions];
      for (const id of chain.slice(0, 3)) {
        const res = await fetch(`/api/zones?parent=${id}`);
        if (!res.ok) break;
        const children: ZoneOption[] = await res.json();
        if (!children.length) break;
        loaded.push(children);
      }
      if (!cancelled) setLevels(loaded);
    }
    if (chain.length) void restore();
    return () => {
      cancelled = true;
    };
    // Seulement au montage : les changements suivants passent par `select`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const select = async (depth: number, id: string) => {
    const nextChain = [...chain.slice(0, depth), ...(id ? [id] : [])];
    const names = nextChain.map((cid, d) => levels[d]?.find((o) => o.id === cid)?.name ?? "");
    const deepest = names[names.length - 1] ?? "";
    const label =
      names.length > 1
        ? `${deepest} (région de ${names[0]})`
        : deepest
          ? `Région de ${deepest}`
          : "";
    onSelect(nextChain[nextChain.length - 1] ?? "", nextChain, label);
    const kept = levels.slice(0, depth + 1);
    const option = levels[depth]?.find((o) => o.id === id);
    if (id && option && option.childCount > 0 && depth < 3) {
      setLoading(true);
      try {
        const res = await fetch(`/api/zones?parent=${id}`);
        kept.push(res.ok ? await res.json() : []);
      } finally {
        setLoading(false);
      }
    }
    setLevels(kept);
  };

  return (
    <div className="space-y-4">
      {levels.map((options, depth) =>
        options.length ? (
          <div key={depth}>
            <Label htmlFor={`zone-${depth}`} optional={depth === 3}>
              {LEVELS[depth]}
            </Label>
            <Select
              id={`zone-${depth}`}
              value={chain[depth] ?? ""}
              onChange={(e) => void select(depth, e.target.value)}
            >
              <option value="">{depth === 0 ? "Choisir une région…" : "Toute la zone"}</option>
              {options.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name}
                  {markClosed && depth === 0 && !o.isOpen ? " (pas encore ouverte)" : ""}
                </option>
              ))}
            </Select>
          </div>
        ) : null,
      )}
      {loading && <p className="animate-pulse-soft text-sm text-gris-700">Chargement des zones…</p>}
    </div>
  );
}
