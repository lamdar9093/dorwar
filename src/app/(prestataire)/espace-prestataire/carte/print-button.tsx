"use client";

import { Button } from "@/components/ui/button";

export function PrintButton() {
  return (
    <Button variant="secondary" icon="document" onClick={() => window.print()}>
      Imprimer ou enregistrer en PDF
    </Button>
  );
}
