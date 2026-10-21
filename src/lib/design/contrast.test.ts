import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

// Les couleurs sont lues dans le thème réel (globals.css) : un changement de palette qui casse
// le contraste WCAG AA fait échouer ce test.

const css = readFileSync(new URL("../../app/globals.css", import.meta.url), "utf8");
const colors = Object.fromEntries(
  [...css.matchAll(/--color-([a-z0-9-]+):\s*(#[0-9a-f]{6})/gi)].map((m) => [m[1], m[2]]),
);

function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const lin = (c: number) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

function contrast(a: string, b: string): number {
  const [l1, l2] = [luminance(colors[a]), luminance(colors[b])].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
}

// [texte, fond] : 4,5:1 pour le texte courant (AA).
const TEXT_PAIRS: [string, string][] = [
  ["indigo-900", "sable-50"],
  ["indigo-900", "sable-100"],
  ["indigo-900", "white"],
  ["indigo-900", "ocre-100"],
  ["indigo-900", "ocre-500"],
  ["indigo-900", "terre-100"],
  ["indigo-900", "baobab-100"],
  ["indigo-900", "indigo-100"],
  ["gris-700", "sable-50"],
  ["gris-700", "sable-100"],
  ["gris-700", "white"],
  ["terre-700", "sable-50"],
  ["terre-700", "terre-100"],
  ["terre-700", "white"],
  ["baobab-700", "baobab-100"],
  ["baobab-700", "white"],
  ["rouge-700", "rouge-100"],
  ["rouge-700", "white"],
  ["rouge-700", "sable-50"],
  ["white", "terre-600"],
  ["white", "baobab-600"],
  ["white", "indigo-900"],
  ["sable-50", "indigo-950"],
  ["sable-100", "indigo-950"],
  ["sable-200", "indigo-950"],
  ["sable-100", "indigo-900"],
  ["ocre-500", "indigo-950"],
  ["ocre-500", "indigo-900"],
];

// Contours des champs et des boutons : 3:1 (WCAG 1.4.11).
const UI_PAIRS: [string, string][] = [
  ["trait", "sable-50"],
  ["trait", "white"],
  ["terre-600", "sable-50"],
  ["indigo-900", "sable-50"],
];

describe("contrastes du thème", () => {
  it("toutes les couleurs testées existent dans le thème", () => {
    for (const [a, b] of [...TEXT_PAIRS, ...UI_PAIRS]) {
      expect(colors[a], a).toBeDefined();
      expect(colors[b], b).toBeDefined();
    }
  });

  it.each(TEXT_PAIRS)("texte %s sur %s : au moins 4,5:1", (fg, bg) => {
    expect(contrast(fg, bg)).toBeGreaterThanOrEqual(4.5);
  });

  it.each(UI_PAIRS)("contour %s sur %s : au moins 3:1", (fg, bg) => {
    expect(contrast(fg, bg)).toBeGreaterThanOrEqual(3);
  });
});
