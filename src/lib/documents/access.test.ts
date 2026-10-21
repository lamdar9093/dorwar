import { describe, expect, it, vi } from "vitest";
import type { Actor } from "@/lib/auth/rbac";
import { readDocumentForActor, type DocumentAccessDeps, type StoredDocument } from "./access";
import { sniffMime } from "./filetype";

const doc: StoredDocument = {
  id: "d1",
  storageKey: "documents/w1/d1.jpg",
  mimeType: "image/jpeg",
  workerProfileId: "w1",
  deletedAt: null,
};

function deps(found: StoredDocument | null = doc) {
  const calls: string[] = [];
  const d: DocumentAccessDeps = {
    findDocument: vi.fn(async () => found),
    logAccess: vi.fn(async () => {
      calls.push("journal");
    }),
    readFile: vi.fn(async () => {
      calls.push("lecture");
      return new Uint8Array([0xff, 0xd8, 0xff]);
    }),
  };
  return { d, calls };
}

const agent: Actor = { id: "a1", role: "agent" };

describe("lecture d'un document privé", () => {
  it("refuse une personne non connectée", async () => {
    const { d } = deps();
    expect((await readDocumentForActor(null, "d1", d)).status).toBe(401);
    expect(d.readFile).not.toHaveBeenCalled();
  });

  it.each(["famille", "prestataire"] as const)(
    "refuse un compte %s, sans rien journaliser ni lire",
    async (role) => {
      const { d } = deps();
      const result = await readDocumentForActor({ id: "u1", role }, "d1", d);
      expect(result.status).toBe(403);
      expect(d.findDocument).not.toHaveBeenCalled();
      expect(d.logAccess).not.toHaveBeenCalled();
      expect(d.readFile).not.toHaveBeenCalled();
    },
  );

  it("journalise la consultation avant de lire le fichier", async () => {
    const { d, calls } = deps();
    const result = await readDocumentForActor(agent, "d1", d, "10.0.0.1");
    expect(result.status).toBe(200);
    expect(calls).toEqual(["journal", "lecture"]);
    expect(d.logAccess).toHaveBeenCalledWith({
      userId: "a1",
      documentId: "d1",
      workerProfileId: "w1",
      action: "consultation",
      ip: "10.0.0.1",
    });
  });

  it("ne sert pas un document supprimé", async () => {
    const { d } = deps({ ...doc, deletedAt: new Date() });
    expect((await readDocumentForActor(agent, "d1", d)).status).toBe(404);
    expect(d.logAccess).not.toHaveBeenCalled();
  });
});

describe("type réel d'un fichier envoyé", () => {
  it("reconnaît JPEG, PNG, WebP et PDF par leurs premiers octets", () => {
    expect(sniffMime(new Uint8Array([0xff, 0xd8, 0xff, 0xe0]))).toBe("image/jpeg");
    expect(sniffMime(new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))).toBe(
      "image/png",
    );
    expect(sniffMime(new TextEncoder().encode("RIFF\0\0\0\0WEBPVP8 "))).toBe("image/webp");
    expect(sniffMime(new TextEncoder().encode("%PDF-1.7"))).toBe("application/pdf");
  });

  it("refuse un fichier déguisé (SVG, HTML, exécutable)", () => {
    expect(sniffMime(new TextEncoder().encode("<svg onload=alert(1)>"))).toBeNull();
    expect(sniffMime(new TextEncoder().encode("<!doctype html>"))).toBeNull();
    expect(sniffMime(new Uint8Array([0x4d, 0x5a, 0x90, 0x00]))).toBeNull();
  });
});
