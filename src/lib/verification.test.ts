import { describe, expect, it } from "vitest";
import { intendanceDeMaison } from "@/db/seed/services/intendance-de-maison";
import { serviceConfigSchema } from "@/lib/services/config";
import {
  buildBadge,
  canValidateDossier,
  dossierProgress,
  openDossierStatus,
  type StepState,
} from "./verification";

const config = serviceConfigSchema.parse(
  intendanceDeMaison({ guaranteeDays: 30, feeFcfa: 0, missionFeeFcfa: 0 }).config,
).verification;
const at = (day: number) => new Date(Date.UTC(2026, 2, day));

function steps(done: string[], failed: string[] = []): StepState[] {
  return config.map((c, i) => ({
    type: c.key,
    status: done.includes(c.key) ? "fait" : failed.includes(c.key) ? "echec" : "a_faire",
    completedAt: done.includes(c.key) ? at(i + 1) : null,
  }));
}

const ALL = ["identite", "photo", "adresse", "reference_1", "reference_2", "entretien"];

describe("validation d'un profil", () => {
  it("est impossible tant qu'une étape manque", () => {
    expect(canValidateDossier(config, steps(ALL.slice(0, 5)))).toBe(false);
  });

  it("est impossible si une étape a échoué", () => {
    expect(
      canValidateDossier(
        config,
        steps(
          ALL.filter((k) => k !== "reference_2"),
          ["reference_2"],
        ),
      ),
    ).toBe(false);
  });

  it("est possible quand toutes les étapes exigées sont faites", () => {
    expect(canValidateDossier(config, steps(ALL))).toBe(true);
  });

  it("compte la progression", () => {
    expect(dossierProgress(config, steps(["identite", "photo"]))).toEqual({ done: 2, total: 6 });
  });

  it("passe « en cours » dès la première étape traitée", () => {
    expect(openDossierStatus(steps([]))).toBe("en_attente");
    expect(openDossierStatus(steps(["identite"]))).toBe("en_cours");
    expect(openDossierStatus(steps([], ["identite"]))).toBe("en_cours");
  });
});

describe("badge public « Vérifié par Dorwar »", () => {
  it("fusionne les deux références en une ligne, datée de la seconde", () => {
    const badge = buildBadge(config, steps(ALL));
    expect(badge).toHaveLength(5);
    const refs = badge.find((b) => b.key === "references");
    expect(refs?.done).toBe(true);
    expect(refs?.date).toEqual(at(5));
  });

  it("une seule référence ne suffit pas", () => {
    const refs = buildBadge(config, steps(["reference_1"])).find((b) => b.key === "references");
    expect(refs?.done).toBe(false);
    expect(refs?.date).toBeNull();
  });

  it("ne contient ni note ni document", () => {
    for (const item of buildBadge(config, steps(ALL))) {
      expect(Object.keys(item).sort()).toEqual(["date", "done", "icon", "key", "label"]);
    }
  });
});
