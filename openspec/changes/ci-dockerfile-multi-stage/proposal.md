# Proposal

## Why

El pipeline no valida que la imagen de contenedor arranque: `deploy.yml` (`docker-build`) está `disabled_manually` en GitHub, y en CI activo solo corre hadolint (lint estático, no build). El Dockerfile actual usa `CMD ["tsx", "src/bin/index.ts"]` y `npm prune --omit=dev`, pero no hay HEALTHCHECK ni multi-stage documentado según el PRD de Stage Build. Si `tsx`/`PATH`/prune se rompen, se descubre en el primer deploy manual.

## What Changes

- Reescribir `apps/server/Dockerfile` como multi-stage (base, deps, build, runtime) según el PRD: base fijada por digest, `npm ci --ignore-scripts`, `tsc -b`, `npm prune --omit=dev`, usuario no root (UID 1001), `HEALTHCHECK` contra `/health`.
- Añadir `.dockerignore` (node_modules, **/dist, .git, .env*).
- Añadir init de procesos (`dumb-init`) para señales y apagado ordenado.
- Validar el build localmente con `docker build` (primer build real) y smoke del contenedor como UID 1001.
- Documentar en `docs/` el tamaño de imagen y los módulos nativos probados con `--ignore-scripts`.

## Capabilities

- **New Capabilities**: `ci-dockerfile-multi-stage`.
- **Modified Capabilities**: (ninguna).

## Impact

- Archivos: `apps/server/Dockerfile`, `.dockerignore` (nuevo o raíz), `docs/` (notas de build).
- Riesgo: medio — requiere daemon Docker local (no disponible en el sandbox actual; primer build real en máquina con Docker).