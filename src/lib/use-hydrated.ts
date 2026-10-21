import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

/**
 * Faux tant que le JavaScript de la page n'a pas pris la main. Sur une connexion lente, les formulaires
 * interactifs restent désactivés jusque-là : un geste fait trop tôt serait perdu.
 */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}
