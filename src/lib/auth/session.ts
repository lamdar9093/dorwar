import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { and, eq, gt } from "drizzle-orm";
import { cookies } from "next/headers";
import { cache } from "react";
import { db } from "@/db/client";
import { sessions, users } from "@/db/schema";
import { env } from "@/lib/env";
import type { Role } from "./rbac";

const COOKIE = "dorwar_session";
const MAX_AGE_DAYS = 30;

export type SessionUser = { id: string; role: Role; phone: string; name: string | null };

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function createSession(userId: string): Promise<void> {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + MAX_AGE_DAYS * 86_400_000);
  await db.insert(sessions).values({ userId, tokenHash: hashToken(token), expiresAt });
  await db.update(users).set({ lastLoginAt: new Date() }).where(eq(users.id, userId));
  const jar = await cookies();
  jar.set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: env().siteUrl.startsWith("https://"),
    path: "/",
    maxAge: MAX_AGE_DAYS * 86_400,
  });
}

/** Utilisateur connecté (une seule lecture par requête), ou null. Un compte suspendu n'est plus connecté. */
export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  const [row] = await db
    .select({
      id: users.id,
      role: users.role,
      phone: users.phone,
      name: users.name,
      status: users.status,
    })
    .from(sessions)
    .innerJoin(users, eq(users.id, sessions.userId))
    .where(and(eq(sessions.tokenHash, hashToken(token)), gt(sessions.expiresAt, new Date())))
    .limit(1);
  if (!row || row.status !== "actif") return null;
  return { id: row.id, role: row.role, phone: row.phone, name: row.name };
});

export async function destroySession(): Promise<void> {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (token) await db.delete(sessions).where(eq(sessions.tokenHash, hashToken(token)));
  jar.delete(COOKIE);
}

export const SESSION_COOKIE = COOKIE;
