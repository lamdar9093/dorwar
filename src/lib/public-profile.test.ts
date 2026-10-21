import { describe, expect, it } from "vitest";
import type { WorkerDossier, WorkerSummary } from "@/lib/data/workers";
import { peoplePath, publicProfilePath, toPublicProfile } from "./public-profile";

const dossier = {
  id: "d1",
  status: "verifie",
  formulaKeys: ["longue_non_logee"],
  skills: ["menage", "cuisine"],
  verifiedAt: new Date(Date.UTC(2026, 2, 12)),
  decisionReason: null,
  badge: [],
  steps: [],
} as unknown as WorkerDossier;

const worker: WorkerSummary = {
  profileId: "p1",
  userId: "u1",
  firstName: "Aminata",
  lastName: "Sow",
  lastInitial: "S",
  gender: "femme",
  age: 34,
  birthYear: 1992,
  areaId: "a1",
  areaName: "Mermoz",
  presentation: "Huit ans de métier.",
  languages: ["wolof", "français"],
  experienceYears: 8,
  interventionRadiusKm: 5,
  willingToRelocate: false,
  availableFrom: "2026-11-01",
  monthlyRateFcfa: 90_000,
  dailyRateFcfa: 10_000,
  ratingAvg: 4.8,
  ratingCount: 6,
  cardId: "DW-7K3M-Q2XP",
  location: { lat: 14.71, lng: -17.47 },
  dossiers: [dossier],
};

describe("fiche publique", () => {
  it("ne garde que les informations publiques", () => {
    expect(Object.keys(toPublicProfile(worker, dossier)).sort()).toEqual(
      [
        "areaName",
        "experienceYears",
        "firstName",
        "formulaKeys",
        "gender",
        "languages",
        "lastInitial",
        "presentation",
        "profileId",
        "ratingAvg",
        "ratingCount",
        "skills",
        "verifiedAt",
        "willingToRelocate",
      ].sort(),
    );
  });

  it("ne laisse sortir ni l'âge, ni la rémunération, ni le nom, ni la carte, ni la position", () => {
    const text = JSON.stringify(toPublicProfile(worker, dossier));
    for (const secret of [
      "Sow",
      "1992",
      "90000",
      "10000",
      "DW-7K3M-Q2XP",
      "14.71",
      "2026-11-01",
      "u1",
    ]) {
      expect(text).not.toContain(secret);
    }
  });

  it("prend le savoir-faire et la vérification du dossier du service", () => {
    const profile = toPublicProfile(worker, dossier);
    expect(profile.skills).toEqual(["menage", "cuisine"]);
    expect(profile.verifiedAt).toEqual(new Date(Date.UTC(2026, 2, 12)));
  });
});

describe("annuaire public", () => {
  it("donne une seule fiche par personne, le service n'étant qu'un choix d'affichage", () => {
    expect(publicProfilePath("p1")).toBe("/personnes/p1");
    expect(publicProfilePath("p1", "intendance-de-maison")).toBe(
      "/personnes/p1?service=intendance-de-maison",
    );
  });

  it("filtre l'annuaire par service et par quartier, sans liste propre à un service", () => {
    expect(peoplePath()).toBe("/personnes");
    expect(peoplePath({ quartier: "q1" })).toBe("/personnes?quartier=q1");
    expect(peoplePath({ service: "intendance-de-maison", quartier: "q1" })).toBe(
      "/personnes?service=intendance-de-maison&quartier=q1",
    );
  });
});
