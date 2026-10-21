import { describe, expect, it } from "vitest";
import {
  allowedTransitions,
  canTransition,
  followUpDate,
  guaranteeEndDate,
  isReviewable,
  timelineStages,
} from "./placements";

describe("étapes d'un placement", () => {
  it("longue durée : rencontre, essai, puis confirmation", () => {
    expect(canTransition("rencontre_demandee", "rencontre_prevue", "longue")).toBe(true);
    expect(canTransition("rencontre_prevue", "essai", "longue")).toBe(true);
    expect(canTransition("essai", "confirme", "longue")).toBe(true);
    expect(canTransition("rencontre_demandee", "confirme", "longue")).toBe(false);
    expect(canTransition("rencontre_prevue", "confirme", "longue")).toBe(false);
  });

  it("mission ponctuelle : pas d'essai, confirmation possible sans rencontre", () => {
    expect(canTransition("rencontre_demandee", "confirme", "ponctuelle")).toBe(true);
    expect(canTransition("rencontre_prevue", "essai", "ponctuelle")).toBe(false);
    expect(timelineStages("ponctuelle")).not.toContain("essai");
  });

  it("un placement terminé ou annulé n'évolue plus", () => {
    expect(allowedTransitions("termine", "longue")).toEqual([]);
    expect(allowedTransitions("annule", "ponctuelle")).toEqual([]);
  });

  it("on ne note qu'une fois la personne au travail", () => {
    expect(isReviewable("rencontre_prevue")).toBe(false);
    expect(isReviewable("essai")).toBe(true);
    expect(isReviewable("termine")).toBe(true);
  });

  it("garantie et appel de suivi se calculent depuis le début de l'essai", () => {
    expect(guaranteeEndDate("2026-03-01", 30)).toBe("2026-03-31");
    expect(followUpDate("2026-03-01")).toBe("2026-03-08");
    expect(followUpDate("2026-12-28")).toBe("2027-01-04");
  });
});
