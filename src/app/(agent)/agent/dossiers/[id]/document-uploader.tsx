"use client";

import { useRef, useState, useTransition } from "react";
import { Icon } from "@/components/icons";
import { Notice } from "@/components/ui/notice";
import type { ActionResult } from "@/lib/action-result";
import { useHydrated } from "@/lib/use-hydrated";
import { uploadDocument } from "../../actions";

const MAX_SIDE = 1600;

/**
 * Réduit une photo avant l'envoi (1 600 px, JPEG) : sur le terrain, la connexion est lente
 * et les données mobiles coûtent cher. Un PDF est envoyé tel quel.
 */
async function shrink(file: File): Promise<File> {
  if (!file.type.startsWith("image/")) return file;
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
    if (scale === 1 && file.size < 700_000) return file;
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", 0.82),
    );
    return blob ? new File([blob], "photo.jpg", { type: "image/jpeg" }) : file;
  } catch {
    return file;
  }
}

export function DocumentUploader({ stepId, stepLabel }: { stepId: string; stepLabel: string }) {
  const [result, setResult] = useState<ActionResult>(null);
  const [pending, startTransition] = useTransition();
  const [size, setSize] = useState<string | null>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const hydrated = useHydrated();

  const send = (picked: File | undefined) => {
    if (!picked) return;
    setResult(null);
    startTransition(async () => {
      const file = await shrink(picked);
      setSize(`${Math.round(file.size / 1024)} Ko`);
      const data = new FormData();
      data.set("etape", stepId);
      data.set("fichier", file);
      data.set("libelle", stepLabel);
      setResult(await uploadDocument(data));
      if (cameraRef.current) cameraRef.current.value = "";
      if (fileRef.current) fileRef.current.value = "";
    });
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <label className="flex min-h-14 cursor-pointer items-center justify-center gap-2 rounded-sm bg-indigo-900 px-3 font-bold text-sable-50 has-focus-visible:outline-3 has-focus-visible:outline-offset-2 has-focus-visible:outline-indigo-900">
          <Icon name="photo" size={22} />
          Prendre une photo
          <input
            ref={cameraRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="sr-only"
            disabled={pending || !hydrated}
            onChange={(e) => send(e.target.files?.[0])}
          />
        </label>
        <label className="flex min-h-14 cursor-pointer items-center justify-center gap-2 rounded-sm border-[1.5px] border-indigo-900 px-3 font-bold text-indigo-900 has-focus-visible:outline-3 has-focus-visible:outline-offset-2 has-focus-visible:outline-indigo-900">
          <Icon name="televerser" size={22} />
          Choisir un fichier
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,application/pdf"
            className="sr-only"
            disabled={pending || !hydrated}
            onChange={(e) => send(e.target.files?.[0])}
          />
        </label>
      </div>
      {pending && (
        <p className="flex items-center gap-2 text-sm text-gris-700" aria-live="polite">
          <span
            className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent"
            aria-hidden="true"
          />
          Réduction et envoi en cours…
        </p>
      )}
      {result && (
        <Notice
          tone={result.ok ? "succes" : "erreur"}
          title={result.ok ? result.message : result.error}
        >
          {result.ok && size ? `Taille envoyée : ${size}.` : null}
        </Notice>
      )}
    </div>
  );
}
