import { randomInt } from "node:crypto";

// Sans 0/O, 1/I/L : lisible à voix haute et au téléphone.
const ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";

function chunk(length: number): string {
  let out = "";
  for (let i = 0; i < length; i++) out += ALPHABET[randomInt(0, ALPHABET.length)];
  return out;
}

/** Numéro de carte Dorwar, ex. « DW-7K3M-Q2XP ». */
export function generateCardId(): string {
  return `DW-${chunk(4)}-${chunk(4)}`;
}

export const CARD_ID_PATTERN = /^DW-[2-9A-HJKMNP-Z]{4}-[2-9A-HJKMNP-Z]{4}$/;
