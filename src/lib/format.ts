// Mise en forme pour l'affichage (français, fuseau de Dakar). Sans dépendance serveur : utilisable partout.

export const TIME_ZONE = "Africa/Dakar";

const numberFormat = new Intl.NumberFormat("fr-FR");

export function formatFcfa(amount: number): string {
  return `${numberFormat.format(Math.round(amount))} FCFA`;
}

export function formatNumber(n: number): string {
  return numberFormat.format(n);
}

function toDate(value: Date | string): Date {
  if (value instanceof Date) return value;
  // Une date seule (AAAA-MM-JJ) est interprétée à midi pour éviter tout décalage de jour.
  return /^\d{4}-\d{2}-\d{2}$/.test(value) ? new Date(`${value}T12:00:00Z`) : new Date(value);
}

const longDate = new Intl.DateTimeFormat("fr-FR", { dateStyle: "long", timeZone: TIME_ZONE });
const dayMonth = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "long",
  timeZone: TIME_ZONE,
});
const weekdayDate = new Intl.DateTimeFormat("fr-FR", {
  weekday: "long",
  day: "numeric",
  month: "long",
  timeZone: TIME_ZONE,
});
const hourMinute = new Intl.DateTimeFormat("fr-FR", {
  hour: "numeric",
  minute: "2-digit",
  timeZone: TIME_ZONE,
});

/** « 12 mars 2026 » */
export function formatDate(value: Date | string): string {
  return longDate.format(toDate(value));
}

/** « 12 mars » — l'année est implicite (année en cours ou toute proche). */
export function formatDayMonth(value: Date | string): string {
  return dayMonth.format(toDate(value));
}

/** « jeudi 12 mars » */
export function formatWeekdayDate(value: Date | string): string {
  return weekdayDate.format(toDate(value));
}

/** « jeudi 12 mars à 10 h 30 » */
export function formatDateTime(value: Date | string): string {
  return `${formatWeekdayDate(value)} à ${formatTime(hourMinute.format(toDate(value)))}`;
}

/** « 08:00 » → « 8 h », « 13:30 » → « 13 h 30 » */
export function formatTime(hhmm: string): string {
  const match = /^(\d{1,2})[:h]\s?(\d{2})$/.exec(hhmm.trim());
  if (!match) return hhmm;
  const h = Number(match[1]);
  const m = match[2];
  return m === "00" ? `${h} h` : `${h} h ${m}`;
}

export function formatPhone(e164: string): string {
  const digits = e164.replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("221")) {
    const n = digits.slice(3);
    return `+221 ${n.slice(0, 2)} ${n.slice(2, 5)} ${n.slice(5, 7)} ${n.slice(7, 9)}`;
  }
  return e164;
}

/** Distance arrondie, jamais précise : « à moins d'1 km », « à environ 3 km », « à environ 25 km ». */
export function formatDistance(meters: number): string {
  if (!Number.isFinite(meters) || meters < 0) return "";
  if (meters < 1000) return "à moins d’1 km";
  const km = meters / 1000;
  const rounded = km < 20 ? Math.round(km) : Math.round(km / 5) * 5;
  return `à environ ${rounded} km`;
}

export function joinFr(items: string[]): string {
  if (items.length <= 1) return items.join("");
  return `${items.slice(0, -1).join(", ")} et ${items[items.length - 1]}`;
}

export function ageFromBirthYear(birthYear: number, today = new Date()): number {
  return today.getUTCFullYear() - birthYear;
}

export function pluralize(n: number, one: string, many: string): string {
  return `${formatNumber(n)} ${n > 1 ? many : one}`;
}

/** Jours entiers entre deux dates (positif si `to` est après `from`). */
export function daysBetween(from: Date | string, to: Date | string): number {
  const ms = toDate(to).getTime() - toDate(from).getTime();
  return Math.round(ms / 86_400_000);
}

/** « aujourd'hui », « hier », « il y a 3 jours », « dans 2 jours » */
export function formatRelativeDays(value: Date | string, now = new Date()): string {
  const d = daysBetween(startOfDay(now), startOfDay(toDate(value)));
  if (d === 0) return "aujourd’hui";
  if (d === -1) return "hier";
  if (d === 1) return "demain";
  return d < 0 ? `il y a ${-d} jours` : `dans ${d} jours`;
}

function startOfDay(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

/** Date du jour à Dakar (UTC+0 toute l'année), au format AAAA-MM-JJ. */
export function todayIso(now = new Date()): string {
  return now.toISOString().slice(0, 10);
}

export function addDaysIso(iso: string, days: number): string {
  const d = new Date(`${iso}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}
