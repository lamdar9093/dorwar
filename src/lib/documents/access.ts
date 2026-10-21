import { canViewDocuments, type Actor } from "@/lib/auth/rbac";

export type StoredDocument = {
  id: string;
  storageKey: string;
  mimeType: string;
  workerProfileId: string;
  deletedAt: Date | null;
};

export type DocumentAccessDeps = {
  findDocument(id: string): Promise<StoredDocument | null>;
  logAccess(entry: {
    userId: string;
    documentId: string;
    workerProfileId: string;
    action: "consultation";
    ip: string | null;
  }): Promise<void>;
  readFile(storageKey: string): Promise<Uint8Array>;
};

export type DocumentAccessResult =
  { status: 401 | 403 | 404 } | { status: 200; body: Uint8Array; mimeType: string };

/**
 * Seul point de lecture d'un document privé. L'accès est journalisé avant que le fichier soit lu :
 * aucune consultation ne peut échapper au journal.
 */
export async function readDocumentForActor(
  actor: Actor | null,
  documentId: string,
  deps: DocumentAccessDeps,
  ip: string | null = null,
): Promise<DocumentAccessResult> {
  if (!actor) return { status: 401 };
  if (!canViewDocuments(actor)) return { status: 403 };
  const doc = await deps.findDocument(documentId);
  if (!doc || doc.deletedAt) return { status: 404 };
  await deps.logAccess({
    userId: actor.id,
    documentId: doc.id,
    workerProfileId: doc.workerProfileId,
    action: "consultation",
    ip,
  });
  const body = await deps.readFile(doc.storageKey);
  return { status: 200, body, mimeType: doc.mimeType };
}
