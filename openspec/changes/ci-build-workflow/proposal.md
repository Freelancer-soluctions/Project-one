# Proposal

## Why

El workflow de build del PRD (dos jobs: `build` que compila con permisos mínimos y `image` que publica/atesta con permisos extra) no existe en el repo. El único workflow que construye imagen (`deploy.yml`) está `disabled_manually`. No hay SBOM, provenance, atestación ni escaneo de imagen en CI. El PRD define el flujo completo con gates G1-G7.

## What Changes

- Crear `.github/workflows/build.yml` con jobs `build` (tsc -b, timeout 15min, permisos `contents: read`) e `image` (needs: build, timeout 30min, permisos `contents: read`/`packages: write`/`id-token: write`/`attestations: write`; push solo en main con `push: ${{ github.event_name != 'pull_request' }}`).
- **Permisos:** `permissions: {}` global + permisos por job (PRD §Workflow: el job que solo compila no escribe paquetes ni pide OIDC).
- **Atestación por digest:** `subject-name` = nombre completo de la imagen sin tag; `subject-digest` de la salida `digest` de build-push-action; `push-to-registry: true` (PRD §Supply chain).
- **Trivy:** fijado por SHA (no `@master`), `exit-code: 1`, `--severity CRITICAL,HIGH`, `--ignore-unfixed` (PRD §Escaneo).
- **Forks:** no publicar ni atestar desde forks; nunca `pull_request_target` (PRD §Pull requests de forks).
- **Decisión D5 (registro):** GHCR por defecto (PRD §Decisiones D5); coexistencia con `deploy.yml` (ECR/ECS) se resuelve en el change de deploy correspondiente.
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
