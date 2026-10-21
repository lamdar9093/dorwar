// Typographie française pour les textes affichés : apostrophe typographique, espaces insécables
// avant les ponctuations hautes et à l'intérieur des guillemets (une « ? » ne part jamais seule à la ligne).

const NNBSP = " ";
const NBSP = " ";

export function typo(text: string): string {
  return text
    .replace(/'/g, "’")
    .replace(/ ([?!;])/g, `${NNBSP}$1`)
    .replace(/ :/g, `${NBSP}:`)
    .replace(/« /g, `«${NBSP}`)
    .replace(/ »/g, `${NBSP}»`);
}

/** Applique `typo` à toutes les chaînes d'un objet (dictionnaire, configuration d'un service). */
export function typoDeep<T>(value: T): T {
  if (typeof value === "string") return typo(value) as T;
  if (Array.isArray(value)) return value.map(typoDeep) as T;
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) out[k] = typoDeep(v);
    return out as T;
  }
  return value;
}
