import "server-only";
import { createHmac, randomInt, timingSafeEqual } from "node:crypto";
import { and, count, desc, eq, gt, isNull } from "drizzle-orm";
import { db } from "@/db/client";
import { otpCodes } from "@/db/schema";
import { env } from "@/lib/env";
import { getSmsProvider } from "./sms";

export const OTP_TTL_MINUTES = 5;
export const OTP_MAX_ATTEMPTS = 5;
const MAX_CODES_PER_QUARTER_HOUR = 5;

function hashCode(phone: string, code: string): string {
  return createHmac("sha256", env().sessionSecret).update(`${phone}:${code}`).digest("hex");
}

export type IssueResult =
  { ok: true; demoCode: string | null } | { ok: false; reason: "trop_de_demandes" };

export async function issueOtp(phone: string): Promise<IssueResult> {
  const since = new Date(Date.now() - 15 * 60_000);
  const [{ recent }] = await db
    .select({ recent: count() })
    .from(otpCodes)
    .where(and(eq(otpCodes.phone, phone), gt(otpCodes.createdAt, since)));
  if (recent >= MAX_CODES_PER_QUARTER_HOUR) return { ok: false, reason: "trop_de_demandes" };

  const { demoMode, demoOtp } = env();
  // Le code fixe n'existe qu'en démonstration : hors démo, il est toujours aléatoire.
  const code = demoMode && demoOtp ? demoOtp : String(randomInt(0, 1_000_000)).padStart(6, "0");
  await db.insert(otpCodes).values({
    phone,
    codeHash: hashCode(phone, code),
    expiresAt: new Date(Date.now() + OTP_TTL_MINUTES * 60_000),
  });
  await getSmsProvider(demoMode).sendOtp(phone, code);
  return { ok: true, demoCode: demoMode ? code : null };
}

export type CheckResult =
  | { ok: true }
  | { ok: false; reason: "expire" | "trop_essais" }
  | { ok: false; reason: "invalide"; remaining: number };

export async function checkOtp(phone: string, code: string): Promise<CheckResult> {
  const [latest] = await db
    .select()
    .from(otpCodes)
    .where(and(eq(otpCodes.phone, phone), isNull(otpCodes.consumedAt)))
    .orderBy(desc(otpCodes.createdAt))
    .limit(1);
  if (!latest || latest.expiresAt.getTime() < Date.now()) return { ok: false, reason: "expire" };
  if (latest.attempts >= OTP_MAX_ATTEMPTS) return { ok: false, reason: "trop_essais" };

  const expected = Buffer.from(latest.codeHash, "hex");
  const given = Buffer.from(hashCode(phone, code), "hex");
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) {
    const attempts = latest.attempts + 1;
    await db.update(otpCodes).set({ attempts }).where(eq(otpCodes.id, latest.id));
    if (attempts >= OTP_MAX_ATTEMPTS) return { ok: false, reason: "trop_essais" };
    return { ok: false, reason: "invalide", remaining: OTP_MAX_ATTEMPTS - attempts };
  }
  await db.update(otpCodes).set({ consumedAt: new Date() }).where(eq(otpCodes.id, latest.id));
  return { ok: true };
}
