#!/bin/sh
# Applique les migrations (idempotent) puis lance la commande demandée (le serveur par défaut).
# RUN_MIGRATIONS=false pour démarrer sans toucher à la base.
set -e

if [ "${RUN_MIGRATIONS:-true}" = "true" ]; then
  echo "Dorwar : application des migrations…"
  node dist-scripts/migrate.mjs
fi

exec "$@"
