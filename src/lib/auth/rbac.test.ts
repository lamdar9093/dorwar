import { describe, expect, it } from "vitest";
import {
  canAccessSpace,
  canManageDossiers,
  canOpenPath,
  canReportIncident,
  canViewDocuments,
  canViewDossier,
  canViewPlacement,
  canViewRequest,
  canViewWorkerProfile,
  homeFor,
  type Actor,
  type Role,
  type Space,
} from "./rbac";

const famille: Actor = { id: "f1", role: "famille" };
const autreFamille: Actor = { id: "f2", role: "famille" };
const prestataire: Actor = { id: "p1", role: "prestataire" };
const autrePrestataire: Actor = { id: "p2", role: "prestataire" };
const agent: Actor = { id: "a1", role: "agent" };
const admin: Actor = { id: "x1", role: "admin" };

describe("espaces", () => {
  const expected: Record<Role, Space[]> = {
    famille: ["famille"],
    prestataire: ["prestataire"],
    agent: ["agent"],
    admin: ["agent", "admin"],
  };
  for (const role of Object.keys(expected) as Role[]) {
    for (const space of ["famille", "prestataire", "agent", "admin"] as Space[]) {
      it(`${role} ${expected[role].includes(space) ? "accède" : "n'accède pas"} à l'espace ${space}`, () => {
        expect(canAccessSpace(role, space)).toBe(expected[role].includes(space));
      });
    }
  }

  it("chaque rôle a un espace d'accueil qu'il peut ouvrir", () => {
    for (const role of ["famille", "prestataire", "agent", "admin"] as Role[]) {
      expect(canOpenPath(role, homeFor(role))).toBe(true);
    }
  });
});

describe("documents privés", () => {
  it("ne sont jamais visibles d'une famille ni d'un prestataire, même le sien", () => {
    expect(canViewDocuments(famille)).toBe(false);
    expect(canViewDocuments(prestataire)).toBe(false);
  });
  it("sont visibles de l'équipe", () => {
    expect(canViewDocuments(agent)).toBe(true);
    expect(canViewDocuments(admin)).toBe(true);
  });
});

describe("dossiers de vérification", () => {
  it("un prestataire ne voit que son propre dossier", () => {
    expect(canViewDossier(prestataire, { workerUserId: "p1" })).toBe(true);
    expect(canViewDossier(autrePrestataire, { workerUserId: "p1" })).toBe(false);
  });
  it("une famille ne voit aucun dossier", () => {
    expect(canViewDossier(famille, { workerUserId: "p1" })).toBe(false);
  });
  it("seule l'équipe gère les dossiers", () => {
    expect(canManageDossiers(prestataire)).toBe(false);
    expect(canManageDossiers(famille)).toBe(false);
    expect(canManageDossiers(agent)).toBe(true);
  });
});

describe("demandes, profils et placements", () => {
  const placement = { familyUserId: "f1", workerUserId: "p1" };

  it("une demande n'est visible que de sa famille et de l'équipe", () => {
    expect(canViewRequest(famille, { familyUserId: "f1" })).toBe(true);
    expect(canViewRequest(autreFamille, { familyUserId: "f1" })).toBe(false);
    expect(canViewRequest(prestataire, { familyUserId: "f1" })).toBe(false);
    expect(canViewRequest(agent, { familyUserId: "f1" })).toBe(true);
  });

  it("un prestataire ne parcourt pas les profils des autres", () => {
    expect(canViewWorkerProfile(prestataire)).toBe(false);
    expect(canViewWorkerProfile(famille)).toBe(true);
    expect(canViewWorkerProfile(agent)).toBe(true);
  });

  it("un placement n'est visible que des deux parties et de l'équipe", () => {
    expect(canViewPlacement(famille, placement)).toBe(true);
    expect(canViewPlacement(prestataire, placement)).toBe(true);
    expect(canViewPlacement(autreFamille, placement)).toBe(false);
    expect(canViewPlacement(autrePrestataire, placement)).toBe(false);
    expect(canViewPlacement(admin, placement)).toBe(true);
  });

  it("seules les parties d'un placement peuvent le signaler", () => {
    expect(canReportIncident(famille, placement)).toBe(true);
    expect(canReportIncident(prestataire, placement)).toBe(true);
    expect(canReportIncident(autreFamille, placement)).toBe(false);
  });
});

describe("retour après connexion", () => {
  it("n'ouvre une page que si le rôle y a droit", () => {
    expect(canOpenPath("famille", "/demande/intendance-de-maison")).toBe(true);
    expect(canOpenPath("famille", "/demandes/123")).toBe(true);
    expect(canOpenPath("famille", "/agent/dossiers/1")).toBe(false);
    expect(canOpenPath("prestataire", "/demandes")).toBe(false);
    expect(canOpenPath("agent", "/admin")).toBe(false);
    expect(canOpenPath("admin", "/agent/suivis")).toBe(true);
    expect(canOpenPath("agent", "/profils/abc")).toBe(true);
    expect(canOpenPath("famille", "/")).toBe(true);
  });
});
