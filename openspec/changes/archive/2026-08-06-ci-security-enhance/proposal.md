## Why

El Stage 5 (Security) del plan CI/CD (`docs/cicd-plan-implementacion.md`) tiene cobertura parcial: `security.yml` ya ejecuta SAST (CodeQL), SCA (Trivy) y secret scanning (Gitleaks), pero faltan dos controles de supply-chain security: **SBOM** y **Dependency Review**. Sin SBOM no hay inventario de componentes (brecha M4 del plan) y sin Dependency Review los PRs pueden introducir dependencias vulnerables o con licencias incompatibles sin bloqueo en el merge.

**Estado actual:**

- `security.yml` ejecuta: Trivy (SCA), CodeQL (SAST), Gitleaks (secrets)
- Job SBOM comentado en `security.yml` (líneas 117-125) — sin implementar
- Sin Dependency Review → dependencias vulnerables pueden llegar a `main`
- Sin SBOM artifact → sin trazabilidad del inventario de dependencias

**Qué resuelve:**

- SBOM CycloneDX JSON generado en cada PR y push a main, con artifact subido para trazabilidad
- Dependency Review bloquea PRs que introduzcan dependencias vulnerables o licencias incompatibles
- Ambos jobs corren en PR + push a main, cerrando la brecha M4 y el componente faltante del mapa Stage 5

## What Changes

- Agregar job `sbom` en `.github/workflows/security.yml` usando `anchore/sbom-action@v0`
  - Formato `cyclonedx-json`, archivo `sbom-project-one.json`
  - Subir artifact con `actions/upload-artifact@v4` para trazabilidad
- Agregar job `dependency-review` en `.github/workflows/security.yml` usando `actions/dependency-review-action@v4`
  - `vulnerability-check: true` y `license-check: true` (gate bloqueante en PRs)
- Extender triggers del workflow: agregar `push: branches: [main]` (hoy solo `workflow_call` + `pull_request`)
- Descomentar/quitar el job SBOM comentado existente (se reemplaza por el nuevo job activo)

## Capabilities

### New Capabilities

- `ci-supply-chain-security`: Control de seguridad de cadena de suministro en CI — genera SBOM CycloneDX de las dependencias del monorepo en cada PR y push a main, sube el SBOM como artifact para trazabilidad, y bloquea PRs que introduzcan dependencias vulnerables o con licencias incompatibles vía Dependency Review

### Modified Capabilities

<!-- Ninguna: no hay specs existentes para el workflow security.yml en openspec/specs/ -->

## Impact

- **`.github/workflows/security.yml`**: Se agregan jobs `sbom` y `dependency-review`, y el trigger `push` a `main`
- **Sin cambios de código de aplicación** — solo configuración de CI/CD
- **Permisos del workflow**: `contents: read` + `security-events: write` (existentes) + `pull-requests: write` (comentarios del dependency-review) + `actions: write` (upload del SBOM). Sin secrets nuevos requeridos.
- **Dependencias**: `anchore/sbom-action@v0` y `actions/dependency-review-action@v4` (GitHub-hosted)
