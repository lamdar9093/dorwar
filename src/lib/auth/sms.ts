import "server-only";

/**
 * Envoi des codes de connexion. En démonstration, aucun SMS ne part : le code est affiché à l'écran.
 * Pour brancher un fournisseur réel, implémenter `SmsProvider` et le sélectionner avec SMS_PROVIDER.
 */
export interface SmsProvider {
  readonly name: string;
  sendOtp(toE164: string, code: string): Promise<{ delivered: boolean }>;
}

class DemoSmsProvider implements SmsProvider {
  readonly name = "demo";
  async sendOtp(toE164: string, code: string) {
    console.info(`[SMS de démonstration] code ${code} pour ${toE164}`);
    return { delivered: false };
  }
}

export function getSmsProvider(demoMode: boolean): SmsProvider {
  const provider = process.env.SMS_PROVIDER ?? "demo";
  switch (provider) {
    case "demo":
      // Hors démonstration, personne ne verrait le code : refuser plutôt que l'écrire dans les journaux.
      if (!demoMode) {
        throw new Error(
          "Aucun fournisseur SMS configuré : SMS_PROVIDER=demo n'est utilisable qu'avec DEMO_MODE=true.",
        );
      }
      return new DemoSmsProvider();
    default:
      throw new Error(`Fournisseur SMS inconnu : ${provider}`);
  }
}
