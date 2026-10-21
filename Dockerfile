# syntax=docker/dockerfile:1.7
# Image de production de Dorwar : build Next.js en sortie « standalone », image finale légère,
# utilisateur non root, migrations appliquées au démarrage.

ARG NODE_IMAGE=node:24-alpine

# 1. Dépendances (y compris de développement : nécessaires au build)
FROM ${NODE_IMAGE} AS deps
WORKDIR /app
RUN apk add --no-cache libc6-compat
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

# 2. Build de l'application et des scripts (migrations, seed)
FROM ${NODE_IMAGE} AS builder
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build && npm run build:scripts

# 3. Image finale : uniquement ce qui sert à l'exécution
FROM ${NODE_IMAGE} AS runner
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0 \
    UPLOADS_DIR=/app/data/uploads \
    MIGRATIONS_DIR=/app/drizzle

RUN addgroup -S -g 1001 dorwar \
 && adduser -S -u 1001 -G dorwar dorwar \
 && mkdir -p /app/data/uploads \
 && chown -R dorwar:dorwar /app/data

COPY --from=builder --chown=dorwar:dorwar /app/.next/standalone ./
COPY --from=builder --chown=dorwar:dorwar /app/.next/static ./.next/static
COPY --from=builder --chown=dorwar:dorwar /app/public ./public
COPY --from=builder --chown=dorwar:dorwar /app/drizzle ./drizzle
COPY --from=builder --chown=dorwar:dorwar /app/dist-scripts ./dist-scripts
COPY --chown=dorwar:dorwar --chmod=755 docker-entrypoint.sh ./docker-entrypoint.sh

USER dorwar
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/api/health >/dev/null || exit 1

ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["node", "server.js"]
