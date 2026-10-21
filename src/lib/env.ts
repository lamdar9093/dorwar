import "server-only";
import { z } from "zod";

const boolean = z
  .enum(["true", "false", "1", "0", ""])
  .optional()
  .transform((v) => v === "true" || v === "1");

const schema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL est obligatoire"),
  SESSION_SECRET: z.string().min(32, "SESSION_SECRET doit faire au moins 32 caractères"),
  SITE_DOMAIN: z.string().optional(),
  SITE_URL: z.string().url().optional(),
  WHATSAPP_NUMBER: z
    .string()
    .regex(/^\d{8,15}$/)
    .optional()
    .or(z.literal("")),
  DEMO_MODE: boolean.default(true),
  DEMO_OTP: z
    .string()
    .regex(/^\d{6}$/)
    .optional()
    .or(z.literal("")),
  UPLOADS_DIR: z.string().default("./data/uploads"),
});

export type Env = {
  databaseUrl: string;
  sessionSecret: string;
  siteUrl: string;
  whatsappNumber: string | null;
  demoMode: boolean;
  demoOtp: string | null;
  uploadsDir: string;
};

let cached: Env | undefined;

/** Lu au premier appel (et non à l'import) : `next build` n'a pas besoin des secrets. */
export function env(): Env {
  if (cached) return cached;
  const parsed = schema.parse(process.env);
  const siteUrl =
    parsed.SITE_URL ??
    (parsed.SITE_DOMAIN ? `https://${parsed.SITE_DOMAIN}` : "http://localhost:3000");
  cached = {
    databaseUrl: parsed.DATABASE_URL,
    sessionSecret: parsed.SESSION_SECRET,
    siteUrl: siteUrl.replace(/\/$/, ""),
    whatsappNumber: parsed.WHATSAPP_NUMBER || null,
    demoMode: process.env.DEMO_MODE === undefined ? true : parsed.DEMO_MODE,
    demoOtp: parsed.DEMO_OTP || null,
    uploadsDir: parsed.UPLOADS_DIR,
  };
  return cached;
}
