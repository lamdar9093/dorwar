import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { db } from "@/db/client";
import { accessLogs, documents } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth/session";
import { readDocumentForActor } from "@/lib/documents/access";
import { getStorage } from "@/lib/storage";

/**
 * Seul point de lecture d'un document privé (pièce d'identité, photo, justificatif).
 * Réservé à l'équipe ; chaque consultation est inscrite au journal avant que le fichier soit lu.
 */
export async function GET(_request: Request, { params }: RouteContext<"/api/documents/[id]">) {
  const { id } = await params;
  const user = await getCurrentUser();
  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
  const result = await readDocumentForActor(
    user,
    id,
    {
      async findDocument(docId) {
        if (!/^[0-9a-f-]{36}$/i.test(docId)) return null;
        const [doc] = await db.select().from(documents).where(eq(documents.id, docId)).limit(1);
        return doc ?? null;
      },
      async logAccess(entry) {
        await db.insert(accessLogs).values(entry);
      },
      readFile: (key) => getStorage().get(key),
    },
    ip,
  );

  if (result.status !== 200) {
    const messages = {
      401: "Connexion requise.",
      403: "Accès réservé à l’équipe Dorwar.",
      404: "Document introuvable.",
    };
    return new Response(messages[result.status], {
      status: result.status,
      headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" },
    });
  }
  return new Response(Buffer.from(result.body), {
    headers: {
      "Content-Type": result.mimeType,
      "Cache-Control": "private, no-store",
      "Content-Disposition": "inline",
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy":
        "default-src 'none'; img-src 'self' data:; style-src 'unsafe-inline'; sandbox",
      "X-Robots-Tag": "noindex",
    },
  });
}
