// Compile les scripts de migration et de seed en fichiers autonomes pour l'image Docker
// (l'image finale ne contient ni TypeScript ni les dépendances de développement).
import { build } from "esbuild";

await build({
  entryPoints: {
    migrate: "scripts/migrate.ts",
    seed: "scripts/seed.ts",
    service: "scripts/service.ts",
  },
  outdir: "dist-scripts",
  outExtension: { ".js": ".mjs" },
  bundle: true,
  platform: "node",
  target: "node22",
  format: "esm",
  external: ["pg-native"],
  // Les dépendances CommonJS (pg) utilisent require : on le fournit dans le module ESM.
  banner: {
    js: "import { createRequire } from 'node:module'; const require = createRequire(import.meta.url);",
  },
  logLevel: "info",
});
