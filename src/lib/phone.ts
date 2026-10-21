// Numéros sénégalais : +221 suivi de 9 chiffres. Les mobiles commencent par 70, 75, 76, 77 ou 78.

const MOBILE = /^7[05678]\d{7}$/;

/** Normalise une saisie (« 77 123 45 67 », « +221771234567 », « 00221… ») en +221XXXXXXXXX, ou null. */
export function normalizeSenegalMobile(input: string): string | null {
  let digits = input.replace(/[^\d+]/g, "");
  if (digits.startsWith("+")) digits = digits.slice(1);
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.length === 12 && digits.startsWith("221")) digits = digits.slice(3);
  if (!MOBILE.test(digits)) return null;
  return `+221${digits}`;
}

/** Partie locale à 9 chiffres, pour préremplir un champ précédé de « +221 ». */
export function localPart(e164: string): string {
  return e164.startsWith("+221") ? e164.slice(4) : e164;
}

/** Lien wa.me (numéro sans « + »). */
export function whatsappLink(number: string, text?: string): string {
  const base = `https://wa.me/${number.replace(/\D/g, "")}`;
  return text ? `${base}?text=${encodeURIComponent(text)}` : base;
}
