// Construit src/db/seed/data/areas.json : régions → départements → communes (→ quartiers pour Dakar).
//
// Source : Wikidata (licence CC0), complétée et corrigée à la main pour la région de Dakar
// (découpage de 2021 avec le département de Keur Massar, quartiers du département de Dakar).
// Les coordonnées sont des points centraux approchés : suffisants pour trier par distance,
// à remplacer par le référentiel officiel (ANSD / ANAT) avant un lancement réel.
//
// Usage :
//   node scripts/referentiel/build-areas.mjs                  # interroge Wikidata
//   node scripts/referentiel/build-areas.mjs --from raw.json  # rejoue une extraction enregistrée
//   node scripts/referentiel/build-areas.mjs --save raw.json  # enregistre l'extraction brute

import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const OUTPUT = fileURLToPath(new URL("../../src/db/seed/data/areas.json", import.meta.url));
const ENDPOINT = "https://query.wikidata.org/sparql";
const USER_AGENT = "dorwar-referentiel/0.1 (prototype ; referentiel administratif du Senegal)";

const CLASS = {
  region: "Q847667",
  departement: "Q751030",
  arrondissement: "Q2424478",
  commune: "Q2989649",
  communauteRurale: "Q369385",
  communeArrondissement: "Q2989468",
};

// Les 14 régions en vigueur (les anciennes régions Fleuve, Sine-Saloum, Sénégal oriental sont exclues).
const REGIONS = new Set([
  "Q856268",
  "Q856261",
  "Q856282",
  "Q1059694",
  "Q847671",
  "Q738081",
  "Q738061",
  "Q856275",
  "Q1046666",
  "Q178872",
  "Q589848",
  "Q848554",
  "Q847682",
  "Q822692",
]);
// Doublons ou entrées mal typées côté Wikidata.
const IGNORED_DEPARTMENTS = new Set(["Q126219191", "Q273779", "Q126219489"]);
const DAKAR_REGION = "Q856268";

const QUERY = `SELECT ?x ?cls ?label ?coord ?parent ?dissolved WHERE {
  VALUES ?cls { ${Object.values(CLASS)
    .map((q) => `wd:${q}`)
    .join(" ")} }
  ?x wdt:P31 ?cls .
  OPTIONAL { ?x rdfs:label ?label . FILTER(LANG(?label) = "fr") }
  OPTIONAL { ?x wdt:P625 ?coord }
  OPTIONAL { ?x wdt:P131 ?parent }
  OPTIONAL { ?x wdt:P576 ?dissolved }
}`;

// Région de Dakar, découpage en vigueur. Les points [lat, lng] des quartiers sont approchés.
const DAKAR = {
  Dakar: {
    "Dakar-Plateau": { quartiers: { Plateau: [14.6705, -17.437], Rebeuss: [14.676, -17.444] } },
    Médina: {},
    "Gueule Tapée-Fass-Colobane": {
      quartiers: {
        "Gueule Tapée": [14.6915, -17.457],
        Fass: [14.689, -17.4505],
        Colobane: [14.6935, -17.445],
      },
    },
    "Fann-Point E-Amitié": {
      quartiers: {
        "Fann Résidence": [14.6905, -17.4655],
        "Point E": [14.6985, -17.46],
        Amitié: [14.7045, -17.456],
      },
    },
    Gorée: { wikidata: "île de Gorée" },
    "Grand Dakar": {},
    Biscuiterie: {},
    HLM: {},
    "Hann Bel-Air": {
      quartiers: {
        "Hann Village": [14.721, -17.428],
        "Hann Maristes": [14.7365, -17.433],
        "Bel-Air": [14.7035, -17.425],
      },
    },
    "Dieuppeul-Derklé": {
      quartiers: {
        Dieuppeul: [14.7185, -17.4555],
        Derklé: [14.715, -17.45],
        Castors: [14.7125, -17.4475],
      },
    },
    "Sicap-Liberté": {
      quartiers: { "Sicap Liberté": [14.72, -17.459], "Liberté 6": [14.7295, -17.4655] },
    },
    "Mermoz-Sacré-Cœur": {
      quartiers: {
        Mermoz: [14.708, -17.476],
        "Sacré-Cœur": [14.7205, -17.468],
        Pyrotechnie: [14.704, -17.4685],
      },
    },
    Ouakam: {
      quartiers: {
        Ouakam: [14.723, -17.492],
        Mamelles: [14.73, -17.505],
        "Cité Avion": [14.732, -17.487],
      },
    },
    Ngor: { quartiers: { Ngor: [14.748, -17.513], Almadies: [14.743, -17.523] } },
    Yoff: { quartiers: { "Yoff Village": [14.759, -17.471], "Nord Foire": [14.744, -17.465] } },
    "Grand Yoff": {},
    "Parcelles Assainies": { wikidata: "Les Parcelles Assainies" },
    "Patte d'Oie": {},
    Cambérène: {},
  },
  Guédiawaye: {
    "Golf Sud": { wikidata: "Golf Sud (Guédiawaye)" },
    "Médina Gounass": {},
    "Ndiarème Limamoulaye": {},
    "Sam Notaire": {},
    "Wakhinane Nimzatt": {},
  },
  Pikine: {
    Dalifort: {},
    "Diamaguène Sicap Mbao": {},
    "Djiddah Thiaroye Kao": { wikidata: "Djidah Thiaroye Kaw" },
    "Guinaw Rail Nord": {},
    "Guinaw Rail Sud": {},
    Mbao: {},
    "Pikine Est": {},
    "Pikine Nord": {},
    "Pikine Ouest": {},
    "Thiaroye Gare": {},
    "Thiaroye-sur-Mer": {},
    "Tivaouane Diacksao": {},
  },
  "Keur Massar": {
    "Keur Massar Nord": {},
    "Keur Massar Sud": {},
    "Jaxaay-Parcelles": {},
    Malika: {},
    "Yeumbeul Nord": {},
    "Yeumbeul Sud": {},
  },
  Rufisque: {
    "Rufisque Est": {},
    "Rufisque Nord": {},
    "Rufisque Ouest": {},
    Bambilor: { wikidata: "commune de Bambylor" },
    Bargny: {},
    Diamniadio: {},
    Sangalkam: {},
    Sébikotane: {},
    Sendou: {},
    "Tivaouane Peulh-Niaga": {},
    Yène: { wikidata: "Yenne" },
  },
};

const DEPARTMENT_NAMES = { "M'bour": "Mbour", Salemata: "Salémata", Tivaoune: "Tivaouane" };

function cleanName(label) {
  let name = label
    .replace(/^(la )?communauté rurale (de |d'|du |des )/i, "")
    .replace(/^commune (de |d'|du )/i, "")
    .replace(/^(département|région) (de |d'|du )/i, "")
    .replace(/\s*\([^)]*\)\s*$/, "")
    .trim();
  name = name.charAt(0).toUpperCase() + name.slice(1);
  return DEPARTMENT_NAMES[name] ?? name;
}

// « Ross Béthio » et « Ross-Béthio », « Ndiébène Gandiol » et « Ndiébène Gandiole » : une seule commune.
function dedupeKey(name) {
  return name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z]/g, "")
    .replace(/e$/, "");
}

function parsePoint(wkt) {
  const match = /Point\(([-\d.]+) ([-\d.]+)\)/.exec(wkt ?? "");
  return match ? [Number(match[2]), Number(match[1])] : null;
}

function round(n) {
  return Math.round(n * 10000) / 10000;
}

function distanceKm([lat1, lng1], [lat2, lng2]) {
  const r = Math.PI / 180;
  const a =
    Math.sin(((lat2 - lat1) * r) / 2) ** 2 +
    Math.cos(lat1 * r) * Math.cos(lat2 * r) * Math.sin(((lng2 - lng1) * r) / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(a));
}

async function fetchRaw() {
  const url = `${ENDPOINT}?query=${encodeURIComponent(QUERY)}`;
  const res = await fetch(url, {
    headers: { Accept: "application/sparql-results+json", "User-Agent": USER_AGENT },
  });
  if (!res.ok) throw new Error(`Wikidata a répondu ${res.status}`);
  return res.json();
}

function buildEntities(raw) {
  const entities = new Map();
  for (const b of raw.results.bindings) {
    const id = b.x.value.split("/").pop();
    const e = entities.get(id) ?? {
      id,
      classes: new Set(),
      label: null,
      point: null,
      parents: new Set(),
      dissolved: false,
    };
    e.classes.add(b.cls.value.split("/").pop());
    if (b.label) e.label = b.label.value;
    if (b.coord) e.point = parsePoint(b.coord.value);
    if (b.parent) e.parents.add(b.parent.value.split("/").pop());
    if (b.dissolved) e.dissolved = true;
    entities.set(id, e);
  }
  return entities;
}

function build(raw) {
  const E = buildEntities(raw);
  const regions = [...E.values()].filter((e) => REGIONS.has(e.id));
  const departments = [...E.values()].filter(
    (e) =>
      e.classes.has(CLASS.departement) &&
      !IGNORED_DEPARTMENTS.has(e.id) &&
      !e.dissolved &&
      [...e.parents].some((p) => REGIONS.has(p)),
  );
  const departmentIds = new Set(departments.map((d) => d.id));

  const findDepartment = (id, depth = 0, seen = new Set()) => {
    if (departmentIds.has(id)) return id;
    const e = E.get(id);
    if (!e || depth > 4 || seen.has(id)) return null;
    seen.add(id);
    for (const p of e.parents) {
      const found = findDepartment(p, depth + 1, seen);
      if (found) return found;
    }
    return null;
  };

  const communeClasses = [CLASS.commune, CLASS.communauteRurale, CLASS.communeArrondissement];
  const candidates = [...E.values()].filter(
    (e) => communeClasses.some((c) => e.classes.has(c)) && !e.dissolved && e.point && e.label,
  );

  const mapped = [];
  const unmapped = [];
  for (const c of candidates) {
    let dep = null;
    for (const p of c.parents) {
      dep = findDepartment(p);
      if (dep) break;
    }
    (dep ? mapped : unmapped).push({ entity: c, departmentId: dep });
  }

  // Les communes sans rattachement explicite prennent le département majoritaire de leurs 5 voisines.
  for (const u of unmapped) {
    const neighbours = mapped
      .map((m) => ({ m, d: distanceKm(u.entity.point, m.entity.point) }))
      .sort((a, b) => a.d - b.d)
      .slice(0, 5);
    if (!neighbours.length || neighbours[0].d > 40) continue;
    const votes = new Map();
    for (const { m } of neighbours) votes.set(m.departmentId, (votes.get(m.departmentId) ?? 0) + 1);
    u.departmentId = [...votes.entries()].sort((a, b) => b[1] - a[1])[0][0];
    mapped.push(u);
  }

  const collator = new Intl.Collator("fr", { sensitivity: "base" });
  const byName = (a, b) => collator.compare(a.name, b.name);

  const out = regions
    .map((r) => {
      const isDakar = r.id === DAKAR_REGION;
      const deps = departments
        .filter((d) => d.parents.has(r.id))
        .map((d) => {
          const name = cleanName(d.label);
          let communes;
          if (isDakar) {
            communes = buildDakarDepartment(name, mapped);
          } else {
            const seen = new Map();
            for (const m of mapped.filter((m) => m.departmentId === d.id)) {
              const cname = cleanName(m.entity.label);
              const key = dedupeKey(cname);
              const prev = seen.get(key);
              // Préférer l'entrée « commune » à l'ancienne « communauté rurale » du même nom.
              if (
                !prev ||
                (m.entity.classes.has(CLASS.commune) && !prev.classes.has(CLASS.commune))
              ) {
                seen.set(key, { ...m.entity, cname });
              }
            }
            communes = [...seen.values()].map((c) => ({
              name: c.cname,
              wikidata: c.id,
              lat: round(c.point[0]),
              lng: round(c.point[1]),
            }));
          }
          return {
            name,
            wikidata: d.id,
            lat: round(d.point[0]),
            lng: round(d.point[1]),
            communes: communes.sort(byName),
          };
        })
        .sort(byName);
      return {
        name: cleanName(r.label),
        wikidata: r.id,
        lat: round(r.point[0]),
        lng: round(r.point[1]),
        departements: deps,
      };
    })
    .sort(byName);

  return out;

  function buildDakarDepartment(depName, mappedCommunes) {
    const spec = DAKAR[depName];
    if (!spec) throw new Error(`Département de Dakar inconnu : ${depName}`);
    return Object.entries(spec).map(([name, conf]) => {
      const wikiLabel = conf.wikidata ?? name;
      const match = mappedCommunes.find((m) => m.entity.label === wikiLabel);
      if (!match) throw new Error(`Commune introuvable dans Wikidata : ${wikiLabel}`);
      const commune = {
        name,
        wikidata: match.entity.id,
        lat: round(match.entity.point[0]),
        lng: round(match.entity.point[1]),
      };
      if (conf.quartiers) {
        commune.quartiers = Object.entries(conf.quartiers)
          .map(([qname, [lat, lng]]) => ({ name: qname, lat, lng }))
          .sort(byName);
      }
      return commune;
    });
  }
}

async function main() {
  const args = process.argv.slice(2);
  const fromIndex = args.indexOf("--from");
  const saveIndex = args.indexOf("--save");
  const raw =
    fromIndex >= 0 ? JSON.parse(await readFile(args[fromIndex + 1], "utf8")) : await fetchRaw();
  if (saveIndex >= 0) await writeFile(args[saveIndex + 1], JSON.stringify(raw));

  const regions = build(raw);
  const stats = {
    regions: regions.length,
    departements: regions.reduce((n, r) => n + r.departements.length, 0),
    communes: regions.reduce(
      (n, r) => n + r.departements.reduce((m, d) => m + d.communes.length, 0),
      0,
    ),
    quartiers: regions.reduce(
      (n, r) =>
        n +
        r.departements.reduce(
          (m, d) => m + d.communes.reduce((k, c) => k + (c.quartiers?.length ?? 0), 0),
          0,
        ),
      0,
    ),
  };
  const data = {
    source:
      "Wikidata (CC0), extraction automatique ; région de Dakar corrigée à la main (découpage 2021, quartiers du département de Dakar). Points centraux approchés.",
    generatedAt: new Date().toISOString().slice(0, 10),
    stats,
    regions,
  };
  await writeFile(OUTPUT, JSON.stringify(data, null, 1) + "\n");
  console.log("Référentiel écrit :", OUTPUT, stats);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
