import "server-only";
import { cookies } from "next/headers";
import { typoDeep } from "@/lib/typo";
import { fr, type Dictionary } from "./fr";
import { wo } from "./wo";

export type Locale = "fr" | "wo";
export const LOCALE_COOKIE = "dorwar_langue";

function merge<T>(base: T, override: unknown): T {
  if (!override || typeof override !== "object" || Array.isArray(override))
    return (override ?? base) as T;
  const out: Record<string, unknown> = { ...(base as Record<string, unknown>) };
  for (const [k, v] of Object.entries(override as Record<string, unknown>)) {
    out[k] = merge((base as Record<string, unknown>)[k], v);
  }
  return out as T;
}

/** Langue choisie (cookie), le français par défaut. Le wolof complète le français clé par clé. */
export async function getLocale(): Promise<Locale> {
  const value = (await cookies()).get(LOCALE_COOKIE)?.value;
  return value === "wo" ? "wo" : "fr";
}

const dictionaries: Record<Locale, Dictionary> = {
  fr: typoDeep<Dictionary>(fr),
  wo: typoDeep<Dictionary>(merge<Dictionary>(fr, wo)),
};

export async function getDictionary(locale?: Locale): Promise<Dictionary> {
  return dictionaries[locale ?? (await getLocale())];
}

export { fill, type Dictionary } from "./fr";
export { motsWolof } from "./wo";
