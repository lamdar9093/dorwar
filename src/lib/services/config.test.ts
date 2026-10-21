import { describe, expect, it } from "vitest";
import { intendanceDeMaison } from "@/db/seed/services/intendance-de-maison";
import { checkServiceConfig, guaranteeText, serviceConfigSchema } from "./config";

describe("configuration d'un service", () => {
  const seed = intendanceDeMaison({ guaranteeDays: 30, feeFcfa: 15000, missionFeeFcfa: 2500 });

  it("la configuration « Intendance de maison » respecte le schéma", () => {
    expect(() => serviceConfigSchema.parse(seed.config)).not.toThrow();
  });

  it("est cohérente : garantie et frais pour chaque formule, un seul champ formule et lieu", () => {
    expect(checkServiceConfig(serviceConfigSchema.parse(seed.config))).toEqual([]);
  });

  it("exige les cinq contrôles promis, avec deux références", () => {
    const keys = seed.config.verification.map((s) => s.key);
    expect(keys).toEqual([
      "identite",
      "photo",
      "adresse",
      "reference_1",
      "reference_2",
      "entretien",
    ]);
  });

  it("signale une formule sans garantie", () => {
    const config = serviceConfigSchema.parse(seed.config);
    delete config.guarantees.ponctuelle;
    expect(checkServiceConfig(config)).toContain(
      "garantie manquante pour la formule « ponctuelle »",
    );
  });

  it("insère la durée dans le texte de garantie", () => {
    const config = serviceConfigSchema.parse(seed.config);
    expect(guaranteeText(config.guarantees.longue_logee)).toContain("30 jours");
  });
});
