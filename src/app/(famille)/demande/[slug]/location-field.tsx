"use client";

import { useState } from "react";
import { Icon } from "@/components/icons";
import { FieldError, Label, Select } from "@/components/ui/field";
import { cn } from "@/lib/cn";
import { ZonePicker, type ZoneOption } from "@/components/zone-picker";
import { SEARCH_RADII_KM, type LocationAnswer } from "@/lib/form-engine/constants";

export type AreaGroup = { group: string; options: { id: string; label: string }[] };
export type { ZoneOption };
export type LocationValue = LocationAnswer & { chain?: string[]; label?: string };

export function LocationField({
  value,
  onChange,
  areaGroups,
  regions,
  error,
}: {
  value: LocationValue | undefined;
  onChange: (value: LocationValue) => void;
  areaGroups: AreaGroup[];
  regions: ZoneOption[];
  error?: string;
}) {
  const mode = value?.mode ?? "autour";
  const radius = value?.mode === "autour" ? value.radiusKm : 5;
  const [geo, setGeo] = useState<"idle" | "attente" | "ok" | "refus" | "indisponible">(
    value?.mode === "autour" && value.lat !== undefined ? "ok" : "idle",
  );

  const setMode = (next: "autour" | "zone") => {
    if (next === mode) return;
    onChange(
      next === "autour" ? { mode: "autour", radiusKm: 5 } : { mode: "zone", areaId: "", chain: [] },
    );
  };

  const shareLocation = () => {
    if (!("geolocation" in navigator)) {
      setGeo("indisponible");
      return;
    }
    setGeo("attente");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        // Arrondi à environ 100 m : la position exacte n'est jamais envoyée.
        const lat = Math.round(pos.coords.latitude * 1000) / 1000;
        const lng = Math.round(pos.coords.longitude * 1000) / 1000;
        onChange({ mode: "autour", radiusKm: radius, lat, lng });
        setGeo("ok");
      },
      (err) => setGeo(err.code === err.PERMISSION_DENIED ? "refus" : "indisponible"),
      { enableHighAccuracy: false, timeout: 15000, maximumAge: 300000 },
    );
  };

  return (
    <div className="space-y-6">
      <fieldset>
        <legend className="sr-only">Comment chercher</legend>
        <div className="grid grid-cols-2 gap-2 rounded-md bg-sable-100 p-1.5">
          {(
            [
              ["autour", "Autour de moi", "position"],
              ["zone", "Par zone", "carte_zone"],
            ] as const
          ).map(([key, label, icon]) => (
            <label
              key={key}
              className={cn(
                "flex min-h-14 cursor-pointer items-center justify-center gap-2 rounded-sm px-3 text-center font-bold",
                "has-focus-visible:outline-3 has-focus-visible:outline-indigo-900",
                mode === key
                  ? "bg-white text-indigo-900 shadow-raise"
                  : "text-gris-700 hover:text-indigo-900",
              )}
            >
              <input
                type="radio"
                name="mode-lieu"
                className="sr-only"
                checked={mode === key}
                onChange={() => setMode(key)}
              />
              <Icon name={icon} size={22} />
              {label}
            </label>
          ))}
        </div>
      </fieldset>

      {mode === "autour" ? (
        <div className="space-y-6">
          <div>
            <button
              type="button"
              onClick={shareLocation}
              className="inline-flex min-h-13 w-full items-center justify-center gap-2.5 rounded-sm border-[1.5px] border-indigo-900 px-5 font-bold text-indigo-900 hover:bg-indigo-900 hover:text-sable-50"
            >
              <Icon name="position" size={22} />
              {geo === "attente" ? "Recherche de votre position…" : "Utiliser ma position"}
            </button>
            <p className="mt-2 text-sm text-gris-700" aria-live="polite">
              {geo === "ok" && value?.mode === "autour" && value.lat !== undefined && (
                <span className="inline-flex items-center gap-1.5 font-bold text-baobab-700">
                  <Icon name="checkCircle" size={18} /> Position partagée, arrondie à environ 100 m.
                </span>
              )}
              {geo === "refus" &&
                "Vous n’avez pas autorisé la position. Choisissez plutôt votre quartier ci-dessous."}
              {geo === "indisponible" &&
                "Position indisponible sur cet appareil. Choisissez votre quartier ci-dessous."}
              {geo === "idle" && "Votre position n’est jamais affichée ni conservée telle quelle."}
            </p>
          </div>
          <div>
            <Label htmlFor="quartier">Ou choisissez votre quartier</Label>
            <Select
              id="quartier"
              value={
                value?.mode === "autour" && value.lat === undefined ? (value.areaId ?? "") : ""
              }
              onChange={(e) => {
                onChange({ mode: "autour", radiusKm: radius, areaId: e.target.value || undefined });
                setGeo("idle");
              }}
            >
              <option value="">Choisir…</option>
              {areaGroups.map((g) => (
                <optgroup key={g.group} label={g.group}>
                  {g.options.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.label}
                    </option>
                  ))}
                </optgroup>
              ))}
            </Select>
          </div>
          <fieldset>
            <legend className="mb-2 font-bold">Jusqu’à quelle distance ?</legend>
            <div className="flex flex-wrap gap-2">
              {SEARCH_RADII_KM.map((r) => (
                <label
                  key={r}
                  className="inline-flex min-h-12 min-w-20 cursor-pointer items-center justify-center rounded-full border-[1.5px] border-trait bg-white px-4 font-bold has-checked:border-indigo-900 has-checked:bg-indigo-900 has-checked:text-sable-50 has-focus-visible:outline-3 has-focus-visible:outline-offset-2 has-focus-visible:outline-indigo-900"
                >
                  <input
                    type="radio"
                    name="rayon"
                    className="sr-only"
                    checked={radius === r}
                    onChange={() =>
                      onChange({
                        ...(value?.mode === "autour" ? value : { mode: "autour" }),
                        radiusKm: r,
                      } as LocationValue)
                    }
                  />
                  {r} km
                </label>
              ))}
            </div>
          </fieldset>
        </div>
      ) : (
        <ZonePicker
          chain={value?.mode === "zone" ? (value.chain ?? []) : []}
          regions={regions}
          onSelect={(areaId, chain, label) => onChange({ mode: "zone", areaId, chain, label })}
        />
      )}
      <FieldError>{error}</FieldError>
    </div>
  );
}
