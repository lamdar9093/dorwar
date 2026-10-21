import { describe, expect, it } from "vitest";
import { formatDistance, formatFcfa, formatPhone, formatTime, joinFr } from "./format";
import { normalizeSenegalMobile, whatsappLink } from "./phone";
import { typo } from "./typo";

const NNBSP = " ";

describe("distance affichée", () => {
  it("n'est jamais précise", () => {
    expect(formatDistance(350)).toBe("à moins d’1 km");
    expect(formatDistance(2400)).toBe("à environ 2 km");
    expect(formatDistance(2600)).toBe("à environ 3 km");
    expect(formatDistance(23_400)).toBe("à environ 25 km");
  });
});

describe("montants et dates", () => {
  it("formate les FCFA à la française", () => {
    expect(formatFcfa(90000)).toBe(`90${NNBSP}000 FCFA`);
  });
  it("formate les heures", () => {
    expect(formatTime("08:00")).toBe("8 h");
    expect(formatTime("13:30")).toBe("13 h 30");
  });
  it("énumère avec « et »", () => {
    expect(joinFr(["samedi", "dimanche"])).toBe("samedi et dimanche");
    expect(joinFr(["a", "b", "c"])).toBe("a, b et c");
  });
});

describe("numéros sénégalais", () => {
  it("normalise les saisies courantes", () => {
    expect(normalizeSenegalMobile("77 123 45 67")).toBe("+221771234567");
    expect(normalizeSenegalMobile("+221 76 123 45 67")).toBe("+221761234567");
    expect(normalizeSenegalMobile("00221701234567")).toBe("+221701234567");
  });
  it("refuse ce qui n'est pas un mobile du Sénégal", () => {
    expect(normalizeSenegalMobile("33 821 00 00")).toBeNull();
    expect(normalizeSenegalMobile("77 123 45")).toBeNull();
    expect(normalizeSenegalMobile("+33 6 12 34 56 78")).toBeNull();
  });
  it("affiche et relie à WhatsApp", () => {
    expect(formatPhone("+221771234567")).toBe("+221 77 123 45 67");
    expect(whatsappLink("221771234567", "Bonjour")).toBe("https://wa.me/221771234567?text=Bonjour");
  });
});

describe("typographie française", () => {
  it("pose les espaces insécables et l'apostrophe typographique", () => {
    expect(typo("Ça ne colle pas ? On vous propose quelqu'un d'autre.")).toBe(
      `Ça ne colle pas${NNBSP}? On vous propose quelqu’un d’autre.`,
    );
    expect(typo("« Un jour »")).toBe("« Un jour »");
  });
});
