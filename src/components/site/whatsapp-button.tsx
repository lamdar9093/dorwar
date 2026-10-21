import { ExternalButton, type ButtonVariant } from "@/components/ui/button";
import { getDictionary } from "@/i18n";
import { whatsappLink } from "@/lib/phone";
import { getSettings } from "@/lib/settings";

/** « Parler à l'équipe Dorwar sur WhatsApp » : lien wa.me vers le numéro configuré dans l'admin. */
export async function WhatsAppButton({
  variant = "secondary",
  full,
  message,
  label,
  className,
}: {
  variant?: ButtonVariant;
  full?: boolean;
  message?: string;
  label?: string;
  className?: string;
}) {
  const [{ whatsappNumber }, t] = await Promise.all([getSettings(), getDictionary()]);
  if (!whatsappNumber) {
    return <p className="text-sm text-gris-700">{t.whatsapp.missing}</p>;
  }
  return (
    <ExternalButton
      href={whatsappLink(whatsappNumber, message ?? t.whatsapp.prefill)}
      variant={variant}
      full={full}
      icon="discussion"
      className={className}
    >
      {label ?? t.whatsapp.cta}
    </ExternalButton>
  );
}
