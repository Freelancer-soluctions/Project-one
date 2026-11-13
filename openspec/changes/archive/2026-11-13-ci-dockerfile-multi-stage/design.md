# Design: ci-dockerfile-multi-stage

## Decisiones

### D1 — Contexto de build en la raíz del monorepo
El Dockerfile vive en `apps/server/Dockerfile` pero el build context es la raíz (`.`), para acceder a `package.json`, `package-lock.json`, `tsconfig.base.json` y `apps/server`. Comando: `docker build -f apps/server/Dockerfile -t server:local .`.

### D2 — 4 etapas: base → deps → build → runtime
- `base`: node:22-alpine fijada por digest.
- `deps`: `npm ci --ignore-scripts` + `prisma generate` + `npm rebuild bcrypt` (toolchain musl).
- `build`: `tsc -p apps/server/tsconfig.build.json` + `npm prune --omit=dev`.
- `runtime`: no root (UID 1001), dumb-init, HEALTHCHECK, `node dist/bin/index.js`.

### D3 — Runtime ejecuta JS compilado, no tsx
tsx/vite son prod-deps pero no se usan en runtime. El entry es `dist/bin/index.js`.

### D4 — Digest pinneado y verificado
Digest multi-arch re-verificado contra Docker Hub (HTTP 200, OCI index) el 2026-11-12.

### D5 — Sin secretos en ARG/ENV
Secretos van por montajes de secretos de BuildKit / inyección por stack.

### D6 — tsconfig.build.json vs composite
`tsconfig.build.json` extiende `tsconfig.json` (composite desde ci-typescript-strict-config). Los overrides `declaration: false` e `incremental: false` se eliminaron porque entran en conflicto con `composite: true`. Hereda `declaration: true` y `incremental: true` de la base.

## Riesgos
- docker-compose.yml usa `build: .` (contexto apps/server) → incompatible con Dockerfile de contexto raíz. Diferido a ci-floci-migration.
- apps/server/.dockerignore obsoleto (contexto raíz usa el raíz). Eliminar.