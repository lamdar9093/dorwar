import { describe, expect, it } from "vitest";
import { intendanceDeMaison } from "@/db/seed/services/intendance-de-maison";
import { serviceConfigSchema } from "@/lib/services/config";
import { validateAnswers } from "./compile";
import { pruneAnswers, visibleSteps } from "./visibility";

const config = serviceConfigSchema.parse(
  intendanceDeMaison({ guaranteeDays: 30, feeFcfa: 15000, missionFeeFcfa: 2500 }).config,
);
const form = config.needForm;
const today = "2026-10-18";
const ctx = { formulaKeys: config.formulas.map((f) => f.key), today };
const AREA = "6f1c2c1e-2c1f-4c55-9a2b-0d6a7b3e4f10";
const engagements = [0, 1, 2];

const longueLogee = {
  formule: "longue_logee",
  rythme: "6_sur_7",
  poste: "polyvalent",
  horaires: { start: "07:00", end: "20:00" },
  repos: ["dimanche"],
  fetes: ["tabaski"],
  duree_conges: "une_semaine",
  salaire: 90000,
  debut: "2026-11-02",
  lieu: { mode: "autour", radiusKm: 5, areaId: AREA },
  engagements,
};

describe("formulaire de besoin « Intendance de maison »", () => {
  it("accepte une demande longue durée complète", () => {
    const result = validateAnswers(form, ctx, longueLogee);
    expect(result.ok).toBe(true);
  });

  it("n'affiche pas les étapes de la mission ponctuelle pour une longue durée", () => {
    const keys = visibleSteps(form, longueLogee).map((s) => s.key);
    expect(keys).toContain("rythme");
    expect(keys).not.toContain("mission");
  });

  it("exige la contrepartie pour le 7 jours sur 7", () => {
    const result = validateAnswers(form, ctx, {
      ...longueLogee,
      rythme: "7_sur_7",
      repos: undefined,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.contrepartie).toBeDefined();
      expect(result.errors.contrepartie_detail).toBeDefined();
    }
  });

  it("accepte le 7 jours sur 7 avec sa contrepartie écrite", () => {
    const result = validateAnswers(form, ctx, {
      ...longueLogee,
      rythme: "7_sur_7",
      contrepartie: "repos_compense",
      contrepartie_detail: "Deux jours de repos consécutifs chaque mois",
    });
    expect(result.ok).toBe(true);
  });

  it("retire les réponses d'une branche abandonnée", () => {
    const pruned = pruneAnswers(form, { ...longueLogee, formule: "ponctuelle", mission_jours: 2 });
    expect(pruned.rythme).toBeUndefined();
    expect(pruned.salaire).toBeUndefined();
    expect(pruned.mission_jours).toBe(2);
  });

  it("refuse une option qui n'existe pas", () => {
    const result = validateAnswers(form, ctx, { ...longueLogee, poste: "jardinier" });
    expect(result.ok).toBe(false);
  });

  it("refuse un salaire hors bornes et une date passée", () => {
    const result = validateAnswers(form, ctx, {
      ...longueLogee,
      salaire: 500,
      debut: "2026-01-01",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.salaire).toBeDefined();
      expect(result.errors.debut).toMatch(/passée/);
    }
  });

  it("exige chaque engagement de la famille", () => {
    const result = validateAnswers(form, ctx, { ...longueLogee, engagements: [0, 1] });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.engagements).toMatch(/engagement/);
  });

  it("valide une mission ponctuelle et ignore les champs des autres formules", () => {
    const result = validateAnswers(form, ctx, {
      formule: "ponctuelle",
      mission_debut: "2026-10-25",
      mission_jours: 2,
      taches: ["cuisine", "evenement"],
      evenement: "Baptême",
      tarif_journalier: 10000,
      salaire: 90000,
      lieu: { mode: "zone", areaId: AREA },
      engagements,
    });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.answers.salaire).toBeUndefined();
  });

  it("exige une position ou un quartier pour « autour de moi »", () => {
    const result = validateAnswers(form, ctx, {
      ...longueLogee,
      lieu: { mode: "autour", radiusKm: 5 },
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.lieu).toBeDefined();
  });

  it("refuse un rayon qui n'est pas proposé", () => {
    const result = validateAnswers(form, ctx, {
      ...longueLogee,
      lieu: { mode: "autour", radiusKm: 7, areaId: AREA },
    });
    expect(result.ok).toBe(false);
  });
});
