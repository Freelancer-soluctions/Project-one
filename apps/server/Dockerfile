# ============================================================

# Dockerfile para API Express + Socket.IO
# ============================================================

# Usamos Node 22 Alpine por tamaño reducido (~120MB vs ~300MB de node:22)
# (upgrade desde Node 20 por EOL 2026-04-30 — Fase 0 task 1.11)
# Build context: monorepo root (to access package-lock.json)
#   docker build -f apps/server/Dockerfile .
# ============================================================

FROM node:22-alpine

WORKDIR /app

# OpenSSL CLI: necesario para que Prisma detecte linux-musl-openssl-3.0.x durante
# `prisma generate`. Alpine trae libssl3 (OpenSSL 3) pero NO el CLI; sin él, generate
# produce el engine "linux-musl" (OpenSSL 1.1) que no puede cargar sobre libssl.so.3
# del node:22-alpine actual (Error: libssl.so.1.1: No such file or directory).
# Sin pin de versión a propósito: la versión de openssl debe seguir a la release de
# Alpine de la imagen base (node:22-alpine); un pin quedaría desincronizado en
# cada bump de la base y rompería el build. (PrAGMA: hadolint exige que la línea de
# ignore sea EXACTA e inmediatamente superior al hadolint ignore.)
# hadolint ignore=DL3018
RUN apk add --no-cache openssl

# Copiar root package.json + lockfile, luego workspace package.json y prisma schema
# Esto permite `npm ci --workspace=apps/server` que encuentra el lockfile en la raíz
COPY package.json package-lock.json ./
COPY apps/server/package.json ./apps/server/package.json
COPY apps/server/prisma ./apps/server/prisma/

# Instalar dependencias del workspace (incluye devDeps: prisma CLI), generar el client
# de Prisma y podar devDeps — TODO EN UNA SOLA CAPA:
# 1) `--ignore-scripts` evita el prepare del root (husky) Y suprime el postinit
#    "prisma generate" de apps/server → por eso generate corre explícito aquí.
# 2) El schema ya fue copiado (COPY apps/server/prisma) y @prisma/client queda hoisted
#    en el node_modules raíz → output en node_modules/.prisma/client.
# 3) El orden importa: generate DEBE correr ANTES de prune (prune elimina el CLI).
# Consolidación (hadolint DL3059 + tamaño de imagen): una sola capa = las devDeps
# nunca persisten en capa intermedia (npm ci + prune separados las dejaban enterradas).
RUN npm ci --workspace=apps/server --ignore-scripts \
 && npx prisma generate --schema=apps/server/prisma/schema.prisma \
 && npm prune --workspace=apps/server --omit=dev

# Copiar código fuente del server (sobrescribe package.json del workspace, OK: deps ya instaladas)
COPY apps/server/. ./

# no-root para runtime (menor superficie si hay RCE); node:image trae el usuario `node`
USER node

# el Express corre en puerto 3000
EXPOSE 3000

# tsx vive en node_modules/.bin (no en el PATH por defecto del exec-form CMD):
ENV PATH="/app/node_modules/.bin:$PATH"

# Default de imagen: production (fail-closed: CSP estricta + HSTS de helmet, sin
# detalles dev en los errores 500). Verificado 2026-10-22 antes de fijarlo:
# - `NODE_ENV=production` NO activa Secrets Manager en el arranque:
#   `config/aws/secrets.ts:loadSecrets()` no tiene consumidores en `src/`
#   (el cliente solo se instancia con región + endpoint opcional Floci).
# - SÍ conflicta con el guard de `src/middleware/encription-prisma-middleware.ts:36-45`,
#   que rechaza la dummy AES_GCM_KEY bajo `NODE_ENV=production` en module scope.
#   Por eso los stacks emulados (deploy.yml Fase 1, preview.yml) sobreescriben este
#   default con `-e NODE_ENV=development` en su `docker run` — la dummy key solo
#   es válida fuera de producción. Las task definitions de ECS (staging/production)
#   también fijan NODE_ENV explícitamente, así que este default no las afecta.
# FRONTEND_URL NO va aquí: es configuración de entorno, no de imagen — un valor
# horneado en producción sería un fallo de configuración (se inyecta por stack).
ENV NODE_ENV=production

# Comando de inicio con tsx en lugar de node
CMD ["tsx", "src/bin/index.ts"]

# NOTA: El compose de dev-local (apps/server/docker-compose.yml) usa `build: .` con context apps/server.
# Con este Dockerfile (context: root), el build de dev-local FALLA.
# Para build local de dev, usa: `docker build -f apps/server/Dockerfile .` desde la raíz del repo.
# El change `ci-floci-migration` actualizará docker-compose.yml a `{ context: .., dockerfile: apps/server/Dockerfile }`.
