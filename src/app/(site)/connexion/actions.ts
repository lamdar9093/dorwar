"use server";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/db/client";
import { familyProfiles, users } from "@/db/schema";
import { fill, getDictionary } from "@/i18n";
import { checkOtp, issueOtp } from "@/lib/auth/otp";
import { canOpenPath, homeFor } from "@/lib/auth/rbac";
import { createSession } from "@/lib/auth/session";
import { normalizeSenegalMobile } from "@/lib/phone";

export type LoginState = {
  step: "telephone" | "code";
  phone?: string;
  demoCode?: string | null;
  isNew?: boolean;
  error?: string;
  fieldError?: "telephone" | "code" | "accord" | "nom";
};

/** Chemin de retour : uniquement un chemin interne (pas de redirection ouverte vers un autre site). */
function safeReturn(value: FormDataEntryValue | null): string | null {
  const path = typeof value === "string" ? value : "";
  return path.startsWith("/") && !path.startsWith("//") && !path.startsWith("/\\") ? path : null;
}

function intentOf(value: FormDataEntryValue | null): "famille" | "prestataire" {
  return value === "prestataire" ? "prestataire" : "famille";
}

export async function loginAction(prev: LoginState, formData: FormData): Promise<LoginState> {
  const t = await getDictionary();
  const step = formData.get("etape");

  if (step === "changer") return { step: "telephone" };

  if (step === "telephone") {
    const phone = normalizeSenegalMobile(String(formData.get("telephone") ?? ""));
    if (!phone)
      return { step: "telephone", error: t.auth.errors.invalidPhone, fieldError: "telephone" };
    const [existing] = await db
      .select({ status: users.status })
      .from(users)
      .where(eq(users.phone, phone))
      .limit(1);
    if (existing?.status === "suspendu")
      return { step: "telephone", error: t.auth.errors.suspended };
    let issued: Awaited<ReturnType<typeof issueOtp>>;
    try {
      issued = await issueOtp(phone);
    } catch (err) {
      console.error("Envoi du code impossible :", err);
      return { step: "telephone", error: t.auth.errors.smsUnavailable };
    }
    if (!issued.ok) return { step: "telephone", error: t.auth.errors.tooMany };
    return { step: "code", phone, demoCode: issued.demoCode, isNew: !existing };
  }

  // Étape « code »
  const phone = normalizeSenegalMobile(String(formData.get("telephone") ?? ""));
  if (!phone)
    return { step: "telephone", error: t.auth.errors.invalidPhone, fieldError: "telephone" };
  const keep = { step: "code" as const, phone, demoCode: prev.demoCode, isNew: prev.isNew };
  const code = String(formData.get("code") ?? "").replace(/\D/g, "");
  if (code.length !== 6) return { ...keep, error: t.auth.errors.codeFormat, fieldError: "code" };

  const intent = intentOf(formData.get("intention"));
  const [existing] = await db.select().from(users).where(eq(users.phone, phone)).limit(1);
  const familyName = String(formData.get("nom") ?? "")
    .trim()
    .slice(0, 60);
  if (!existing) {
    if (formData.get("accord") !== "oui")
      return { ...keep, isNew: true, error: t.auth.errors.consentRequired, fieldError: "accord" };
    if (intent === "famille" && familyName.length < 2) {
      return {
        ...keep,
        isNew: true,
        error: "Indiquez le nom sous lequel vous présenter, par exemple « Famille Ndiaye ».",
        fieldError: "nom",
      };
    }
  }

  const checked = await checkOtp(phone, code);
  if (!checked.ok) {
    if (checked.reason === "invalide") {
      return {
        ...keep,
        error: fill(t.auth.errors.wrongCode, { n: checked.remaining }),
        fieldError: "code",
      };
    }
    if (checked.reason === "expire") return { step: "telephone", error: t.auth.errors.expired };
    return { step: "telephone", error: t.auth.errors.tooManyAttempts };
  }

  let user = existing;
  if (!user) {
    const now = new Date();
    [user] = await db.insert(users).values({ phone, role: intent, consentAt: now }).returning();
    if (intent === "famille") {
      const displayName = /^famille\s/i.test(familyName) ? familyName : `Famille ${familyName}`;
      await db
        .insert(familyProfiles)
        .values({ userId: user.id, displayName, phoneVerifiedAt: now });
    }
  } else if (user.status !== "actif") {
    return { step: "telephone", error: t.auth.errors.suspended };
  }

  await createSession(user.id);
  const requested = safeReturn(formData.get("suite"));
  if (!existing && intent === "prestataire") redirect("/espace-prestataire/inscription");
  redirect(requested && canOpenPath(user.role, requested) ? requested : homeFor(user.role));
}
