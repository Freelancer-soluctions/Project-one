# ============================================================
# Dockerfile para API Express + Socket.IO
# ============================================================
# Usamos Node 20 Alpine por tamaño reducido (~120MB vs ~300MB de node:20)
# Build context: monorepo root (to access package-lock.json)
#   docker build -f apps/server/Dockerfile .
# ============================================================

FROM node:20-alpine

WORKDIR /app

# OpenSSL CLI: necesario para que Prisma detecte linux-musl-openssl-3.0.x durante
# `prisma generate`. Alpine trae libssl3 (OpenSSL 3) pero NO el CLI; sin él, generate
# produce el engine "linux-musl" (OpenSSL 1.1) que no puede cargar sobre libssl.so.3
# del node:20-alpine actual (Error: libssl.so.1.1: No such file or directory).
# hadolint ignore=DL3018 — sin pin de versión a propósito: la versión de openssl
# debe seguir a la release de Alpine de la imagen base (node:20-alpine móvil);
# un pin quedaría desincronizado en cada bump de la base y rompería el build.
RUN apk add --no-cache openssl

# Copiar root package.json + lockfile, luego workspace package.json y prisma schema
# Esto permite `npm ci --workspace=apps/server` que encuentra el lockfile en la raíz
COPY package.json package-lock.json ./
COPY apps/server/package.json ./apps/server/package.json
COPY apps/server/prisma ./apps/server/prisma/

# Instalar dependencias del workspace (incluye devDeps: prisma CLI), generar el client
# de Prisma y podar devDeps — TODO EN UNA SOLA CAPA:
# 1) `--ignore-scripts` evita el prepare del root (husky) Y suprime el postinstall
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
COPY apps/server/. .

# El servidor Express corre en puerto 3000
EXPOSE 3000

# Comando de inicio
CMD ["node", "src/bin/index.js"]

# NOTA: El compose de dev-local (apps/server/docker-compose.yml) usa `build: .` con context apps/server.
# Con este Dockerfile (context: root), el build de dev-local FALLA.
# Para build local de dev, usa: `docker build -f apps/server/Dockerfile .` desde la raíz del repo.
# El change `ci-floci-migration` actualizará docker-compose.yml a `{ context: .., dockerfile: apps/server/Dockerfile }`.