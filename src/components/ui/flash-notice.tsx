import { flashMessage } from "@/lib/flash";
import { Notice } from "./notice";

/** Confirmation affichée après une action qui a redirigé vers la page (?ok=…). */
export function FlashNotice({ value, className }: { value: unknown; className?: string }) {
  const message = flashMessage(value);
  return message ? <Notice tone="succes" title={message} className={className} /> : null;
}
