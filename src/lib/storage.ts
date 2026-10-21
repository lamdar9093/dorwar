import "server-only";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { env } from "@/lib/env";

/**
 * Stockage privé des documents. En démonstration : un dossier sur un volume Docker.
 * Une implémentation compatible S3 pourra remplacer `LocalDiskStorage` sans toucher aux appels.
 */
export interface StoragePort {
  put(key: string, data: Uint8Array): Promise<void>;
  get(key: string): Promise<Uint8Array>;
  delete(key: string): Promise<void>;
}

const KEY_PATTERN = /^[a-z0-9][a-z0-9/_-]*\.[a-z0-9]{2,5}$/;

export class LocalDiskStorage implements StoragePort {
  private readonly root: string;

  constructor(root: string) {
    this.root = path.resolve(root);
  }

  private resolve(key: string): string {
    if (!KEY_PATTERN.test(key) || key.includes("..")) throw new Error("Clé de stockage invalide");
    const full = path.resolve(this.root, key);
    if (!full.startsWith(this.root + path.sep)) throw new Error("Clé de stockage invalide");
    return full;
  }

  async put(key: string, data: Uint8Array): Promise<void> {
    const file = this.resolve(key);
    await mkdir(path.dirname(file), { recursive: true });
    await writeFile(file, data, { mode: 0o600 });
  }

  async get(key: string): Promise<Uint8Array> {
    return readFile(this.resolve(key));
  }

  async delete(key: string): Promise<void> {
    await rm(this.resolve(key), { force: true });
  }
}

let instance: StoragePort | undefined;

export function getStorage(): StoragePort {
  instance ??= new LocalDiskStorage(env().uploadsDir);
  return instance;
}
