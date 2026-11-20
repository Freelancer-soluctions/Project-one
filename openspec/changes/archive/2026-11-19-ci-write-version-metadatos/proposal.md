# Proposal

## Why

El PRD §"Versionado, metadatos de build y release" define `scripts/write-version.mjs` que escribe `dist/version.json` con `{ revision, created }` usando `GITHUB_SHA` o `git rev-parse HEAD`, y `SOURCE_DATE_EPOCH` o la fecha del commit (solo `Date.now()` si se pide explícitamente). Así dos builds del mismo commit producen el mismo `version.json` y la reproducibilidad no se rompe. El repo no tiene este script ni `version.json`, ni el endpoint de versión para soporte.

## What Changes

- Crear `scripts/write-version.mjs` que escribe `dist/version.json` con `{ revision, created }`.
- Añadir `SOURCE_DATE_EPOCH` al build de imagen (Dockerfile ENV o build arg de BuildKit).
- Añadir un endpoint de versión en `apps/server` que sirva `version.json` (soporte).
- Verificar reproducibilidad: dos builds del mismo commit → mismo `version.json`.

## Capabilities

- **New Capabilities**: `ci-write-version-metadatos`.
- **Modified Capabilities**: (ninguna).

## Impact

- Archivos: `scripts/write-version.mjs` (nuevo), `apps/server/Dockerfile`, `apps/server/src/` (endpoint).
- Necesario para que el Dockerfile siga construyendo: los workflows que hacen
  `docker build` pasan los build-args (`.github/workflows/{build,deploy,preview}.yml`),
  porque `.git` está en `.dockerignore` y la imagen no puede resolver el commit sola.
- Riesgo: bajo.
