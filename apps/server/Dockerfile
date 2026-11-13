# ============================================================
# Dockerfile multi-stage para API Express + Socket.IO
# change `ci-dockerfile-multi-stage`
#
# Build context: RAÍZ del monorepo (acceso a package-lock.json + workspaces)
#   docker build -f apps/server/Dockerfile -t server:local .
#
# Etapas:
#   base    → imagen fijada por digest (reproducibilidad)
#   deps    → npm ci --ignore-scripts + prisma generate + bcrypt nativo (musl)
#   build   → tsc emite JS (dist) + npm prune --omit=dev
#   runtime → no root (UID 1001), dumb-init, HEALTHCHECK, node dist/bin/index.js
#
# Runtime ejecuta JS COMPILADO (`node dist/bin/index.js`), NO tsx. tsx/vite son
# prod-deps del server y permanecen tras prune, pero no se usan en runtime.
# ============================================================

# --- base: node:22-alpine (Node 22 LTS, Alpine/musl) fijada por digest ---
# Digest del manifest index multi-arch, re-verificado contra el registro oficial
# de Docker Hub (registry-1.docker.io) el 2026-11-12. Dependabot (ecosystem docker,
# directory /apps/server) propone los bumps de este digest.
FROM node:22-alpine@sha256:1314fb30ec37592d5845e5a160d522c0e680972aa534549940b8d73bde88481a AS base
WORKDIR /app

# --- deps: install + generación Prisma + compilación del binding nativo bcrypt ---
FROM base AS deps
# openssl CLI: `prisma generate` detecta linux-musl-openssl-3.0.x. Alpine trae
#   libssl3 (OpenSSL 3) pero NO el CLI; sin él generate produce el engine
#   "linux-musl" (OpenSSL 1.1) que no carga sobre libssl.so.3 (libssl.so.1.1 missing).
# python3/make/g++: bcrypt 6.0.0 NO publica prebuild linux-musl-x64 (solo glibc
#   linux-x64); `npm rebuild bcrypt` compila el binding contra musl (node-gyp-build).
#   Toolchain SOLO en esta etapa: el runtime (FROM base) no la arrastra.
# Sin pin de versión a propósito: openssl/toolchain deben seguir a la release de
#   Alpine de la imagen base; un pin quedaría desincronizado en cada bump.
# hadolint ignore=DL3018
RUN apk add --no-cache openssl python3 make g++

# Manifiestos primero (cache de capa): lockfile raíz + package.json del workspace +
#   schema Prisma. .npmrc raíz (engine-strict) y del server (package-lock=false).
COPY package.json package-lock.json .npmrc ./
COPY apps/server/package.json apps/server/.npmrc ./apps/server/
COPY apps/server/prisma ./apps/server/prisma/

# --ignore-scripts evita el prepare del root (husky) Y el postinstall "prisma
#   generate" del server → por eso generate + rebuild corren EXPLÍCITOS (task 4.2).
# --include-workspace-root: typescript es devDep de la RAÍZ (no del server); sin
#   este flag `npm ci -w apps/server` (default include-root=false) NO instala tsc y
#   la etapa build fallaría. Incluye root+server, NO client/e2e (runtime lean).
# Cache mount BuildKit: reutiliza ~/.npm entre builds (no persiste en la imagen).
# Orden crítico: ci → generate (necesita el CLI prisma, devDep) → rebuild bcrypt
#   (necesita el toolchain) ANTES de prune (prune elimina el CLI de runtime).
RUN --mount=type=cache,target=/root/.npm \
    npm ci --workspace=apps/server --include-workspace-root --ignore-scripts \
 && npx prisma generate --schema=apps/server/prisma/schema.prisma \
 && npm rebuild bcrypt

# --- build: emisión JS con tsc + poda de devDeps ---
FROM deps AS build
# NO existe `tsconfig.base.json` en este repo: la base es `tsconfig.json` (raíz).
#   tsconfig.build.json extiende al de type-check (noEmit) y SÍ emite:
#   noEmit:false + rewriteRelativeImportExtensions (TS 5.7+) reescribe los imports
#   relativos `.ts` → `.js`, permitiendo `node dist/bin/index.js` sin tsx.
COPY tsconfig.json ./
COPY apps/server/tsconfig.json apps/server/tsconfig.build.json ./apps/server/
COPY apps/server/src ./apps/server/src

# `tsc -p` (no `tsc -b`: no hay project references/composite). outDir/include se
#   resuelven relativos al config → emite en apps/server/dist. prune DESPUÉS de tsc
#   (typescript es devDep). Una sola capa (hadolint DL3059). Sin `cd` (DL3003).
RUN npx tsc -p apps/server/tsconfig.build.json \
 && npm prune --omit=dev

# --- runtime: imagen mínima, no root, init de señales, healthcheck ---
FROM base AS runtime
# dumb-init: PID 1 que reenvía señales (SIGTERM → graceful shutdown en bin/index.ts).
# libstdc++: el binding C++ de bcrypt compilado contra musl la requiere en runtime.
# Usuario no root UID/GID 1001 (task 1.5): menor superficie ante un RCE.
# hadolint ignore=DL3018
RUN apk add --no-cache dumb-init libstdc++ \
 && addgroup -g 1001 -S app \
 && adduser -u 1001 -S app -G app

# cwd = raíz del paquete server. swagger-jsdoc lee globs `src/**` RELATIVOS al cwd
#   (src/docs/swagger-options.ts) y dotenv carga `.env` relativo al cwd. Por eso el
#   CMD es `dist/bin/index.js` y no `apps/server/dist/...`: el WORKDIR ya es apps/server.
WORKDIR /app/apps/server

# node_modules hoisted (raíz) + local del workspace (multer, @prisma, fs-extra, jiti
#   NO hoisted). Ambos necesarios: Node resuelve subiendo desde dist/bin →
#   apps/server/node_modules → /app/node_modules. Podados (sin devDeps) en build.
COPY --from=build --chown=app:app /app/node_modules /app/node_modules
COPY --from=build --chown=app:app /app/apps/server/node_modules ./node_modules
# dist: JS compilado que se EJECUTA. src: anotaciones @openapi que swagger-jsdoc
#   PARSEA como texto en runtime (globs src/**/*.ts); no se ejecuta. Se incluye src
#   para no romper /api/v1/docs (el config de swagger es compartido con el generador
#   de contrato `api-contract-linting` y no se modifica en este change).
COPY --from=build --chown=app:app /app/apps/server/dist ./dist
COPY --from=build --chown=app:app /app/apps/server/src ./src
COPY --from=build --chown=app:app /app/apps/server/package.json ./package.json
# prisma + migrations: para `prisma migrate deploy` dentro del contenedor.
COPY --from=build --chown=app:app /app/apps/server/prisma ./prisma

USER app

# El Express + Socket.IO escuchan en 3000.
EXPOSE 3000

# /health (src/app.ts): 200 si la DB responde, 503 si degradado. BusyBox wget ya
#   viene en Alpine; nada que instalar. (CKV_DOCKER_2; gate checkov-iac blocking.)
HEALTHCHECK --interval=30s --timeout=3s --start-period=20s --retries=3 \
  CMD wget -q -O /dev/null http://127.0.0.1:3000/health || exit 1

# production por defecto (fail-closed: CSP estricta + HSTS de helmet, sin detalles
#   dev en los 500). NO se hornean secretos aquí (PRD: nada de secretos en ARG/ENV;
#   van por montajes de secretos de BuildKit / inyección por stack).
# OJO (verificado 2026-10-22): el guard de src/middleware/encription-prisma-middleware.ts
#   rechaza la dummy AES_GCM_KEY bajo NODE_ENV=production en module scope. Por eso el
#   smoke local y los stacks emulados (preview.yml, deploy.yml Fase 1) corren con
#   `-e NODE_ENV=development`; las task definitions ECS fijan NODE_ENV explícitamente.
#   FRONTEND_URL/secretos NO van aquí: son configuración de entorno, no de imagen.
ENV NODE_ENV=production

# dumb-init como PID 1; node ejecuta el JS compilado (sin tsx en runtime).
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/bin/index.js"]

# NOTA: el compose de dev-local (apps/server/docker-compose.yml) usa `build: .` con
#   context apps/server; con este Dockerfile (context raíz) ese build FALLA. Para dev
#   local: `docker build -f apps/server/Dockerfile .` desde la raíz. El change
#   `ci-floci-migration` actualizará el compose a { context: .., dockerfile: apps/server/Dockerfile }.
