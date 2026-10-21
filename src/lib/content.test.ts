import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { intendanceDeMaison } from "@/db/seed/services/intendance-de-maison";

// Garde-fou éditorial du brief : certains mots n'apparaissent nulle part dans le site,
// ni les formules creuses. Ce fichier est exclu de la recherche (il contient la liste).

const ROOT = path.resolve(__dirname, "..");
const SELF = path.resolve(__filename);

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = path.join(dir, name);
    if (statSync(full).isDirectory()) return name === "data" ? [] : files(full);
    return /\.(tsx?|json)$/.test(name) && full !== SELF ? [full] : [];
  });
}

const sources = files(ROOT).map((file) => ({
  file: path.relative(ROOT, file),
  text: readFileSync(file, "utf8"),
}));

const FORBIDDEN_WORDS = [
  /\bmbindaan\b/i,
  /\bdiank[ée]\b/i,
  /\bdomestiques?\b/i,
  /\bservantes?\b/i,
  /\b(une|la|les|des|ma|ta|sa|votre|notre|leur|nos|vos|cette) bonnes?\b/i,
  /\bbonnes? à tout faire\b/i,
];

const HOLLOW_PHRASES = [
  /en quelques clics/i,
  /solution innovante/i,
  /r[ée]volutionnaire/i,
  /\bid[ée]ale?s?\b/i,
];

const FUTURE_SERVICES = [
  /bient[ôo]t disponible/i,
  /prochainement/i,
  /(services?|offres?|nouveaut[ée]s?) (sont |est )?[àa] venir/i,
  /d'autres services/i,
  /commissionnaire/i,
];

describe("vocabulaire du site", () => {
  it.each(FORBIDDEN_WORDS)("aucun texte ne contient %s", (pattern) => {
    const hits = sources.filter((s) => pattern.test(s.text)).map((s) => s.file);
    expect(hits).toEqual([]);
  });

  it.each(HOLLOW_PHRASES)("aucune formule creuse : %s", (pattern) => {
    const hits = sources.filter((s) => pattern.test(s.text)).map((s) => s.file);
    expect(hits).toEqual([]);
  });

  it.each(FUTURE_SERVICES)("aucune annonce de service futur : %s", (pattern) => {
    const hits = sources.filter((s) => pattern.test(s.text)).map((s) => s.file);
    expect(hits).toEqual([]);
  });

  it("chaque mot wolof est marqué pour validation par un locuteur", () => {
    const wolof = readFileSync(path.join(ROOT, "i18n", "wo.ts"), "utf8");
    const entries = wolof.split("\n").filter((line) => /^\s+\w+: ".+",/.test(line));
    expect(entries.length).toBeGreaterThan(0);
    for (const line of entries) expect(line).toContain("// À FAIRE VALIDER PAR UN LOCUTEUR");
  });
});

// Un service est une catégorie, pas l'identité de Dorwar : son nom, son vocabulaire et ses formules
// vivent dans sa configuration (src/db/seed/services). Les pages, composants et dictionnaires
// communs à tous les services ne les reprennent jamais : ils les lisent dans la configuration.
const SHARED = ["app", "components", "i18n"].map((dir) => path.join(ROOT, dir) + path.sep);
const sharedSources = sources.filter((s) =>
  SHARED.some((dir) => path.join(ROOT, s.file).startsWith(dir)),
);
const seeded = [intendanceDeMaison({ guaranteeDays: 30, feeFcfa: 0, missionFeeFcfa: 0 })];
const serviceWords = seeded.flatMap((s) => [
  s.name,
  s.config.vocabulary.female,
  s.config.vocabulary.male,
  ...s.config.formulas.flatMap((f) => [f.label, f.shortLabel]),
]);

describe("textes communs à tous les services", () => {
  it("couvrent bien les pages, les composants et les dictionnaires", () => {
    expect(sharedSources.length).toBeGreaterThan(50);
  });

  it.each(serviceWords)("ne nomment pas « %s »", (word) => {
    const needle = word.toLowerCase();
    const hits = sharedSources
      .filter((s) => s.text.toLowerCase().includes(needle))
      .map((s) => s.file);
    expect(hits).toEqual([]);
  });
});
