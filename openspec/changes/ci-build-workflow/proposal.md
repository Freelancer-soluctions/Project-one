# Proposal

## Why

El workflow de build del PRD (dos jobs: `build` que compila con permisos mínimos y `image` que publica/atesta con permisos extra) no existe en el repo. El único workflow que construye imagen (`deploy.yml`) está `disabled_manually`. No hay SBOM, provenance, atestación ni escaneo de imagen en CI. El PRD define el flujo completo con gates G1-G7.

## What Changes

- Crear `.github/workflows/build.yml` con jobs `build` (tsc -b, timeout 15min, permisos read) e `image` (needs: build, push solo en main, provenance mode=max, sbom, cache gha con scope, attestations).
- Fijar todas las actions por SHA (checkout, setup-node, setup-buildx, login, metadata, build-push, attest).
- Añadir job de escaneo de imagen con Trivy (CRITICAL+HIGH con fix, advisory inicial).
- Añadir `merge_group` trigger y `concurrency` con cancelación en PRs.
- Integrar con `quality-complete` (needs) cuando el stage Quality esté activo.

## Capabilities

- **New Capabilities**: `ci-build-workflow`.
- **Modified Capabilities**: (ninguna).

## Impact

- Archivos: `.github/workflows/build.yml` (nuevo), `.github/workflows/deploy.yml` (eventualmente deprecar docker-build o mantener como deploy).
- Riesgo: medio — requiere ejecución real en GitHub para validar atestaciones y caché.