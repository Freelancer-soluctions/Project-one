# Proposal: ci-mise-toolchain-parity

## Why

Project One ya tiene una base sólida de paridad local/CI para herramientas de seguridad/lint (`.tool-versions`, hooks Husky, workflows con políticas como código), pero la **mecánica de instalación y resolución de versiones** no es verificable: cada desarrollador instala manualmente (o vía `uv`) herramientas que no están garantizadas por un lockfile con checksums, y la CI las instala por caminos distintos (Actions SHA-pinned, `uvx`, `docker run`). Esto rompe la paridad, complica onboarding (especialmente en Windows) y deja agujeros de supply chain.

## What Changes

- Adoptar **Mise** como SSOT del toolchain con `mise.toml` + `mise.lock` (checksums por plataforma).
- Migrar `.tool-versions` y `scripts/install-lint-tools.sh` a Mise (`mise install --locked`).
- Actualizar hooks (`.husky/pre-commit`, `.husky/pre-push`) para usar `mise exec` / binaries resueltos por Mise.
- Actualizar workflows de GitHub Actions para usar `mise-action --locked` y cachear `downloads-cas`.
- Añadir job de CI que falle si la versión instalada no coincide con `mise.lock`.
- Documentar onboarding y air-gapped (mirror interno) en `docs/learning/ci-cd/`.
- Deprecar `.tool-versions` y el script manual tras migración.

## Capabilities

### Modified Capabilities

- `ci-prebuild-substage-structure`: añadir verificación de toolchain parity como gate pre-build.
- `ci-prebuild-lint`: ejecutar lint tools vía Mise con versiones lockeadas.

### New Capabilities

- `mise-toolchain-parity`: reproducibilidad del toolchain (lint/security) entre local y CI con lockfile + checksums + multiplataforma.

## Impact

- **CI workflow**: `.github/workflows/ci.yml` y workflows de seguridad — añadir step `mise install --locked`.
- **Hooks**: `.husky/pre-commit`, `.husky/pre-push` — usar Mise.
- **Scripts**: `scripts/install-lint-tools.sh` → reemplazar por `mise install`.
- **Docs**: onboarding, air-gapped, troubleshooting.
- **Tooling**: añadir `mise.toml`, `mise.lock`.
- **No API ni runtime changes** — solo pipeline y tooling.
