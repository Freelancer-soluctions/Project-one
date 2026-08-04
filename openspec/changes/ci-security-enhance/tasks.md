## 1. Configuración del workflow

- [x] 1.1 Agregar trigger `push` con `branches: [ main ]` a `.github/workflows/security.yml` (además de `workflow_call` y `pull_request` existentes). **Nota**: antes de mergear, verificar que el secret `GIT_LEAKS` esté configurado en el repo O que `ci-secret-scanning` ya esté mergeado (el job `secrets` falla si `GIT_LEAKS` no existe)
- [x] 1.2 Mantener el bloque `permissions` top-level como `contents: read` + `security-events: write` (sin ampliar) y declarar permisos job-scoped: job `sbom` → `permissions: contents: read, actions: write`; job `dependency-review` → `permissions: contents: read, pull-requests: write`. No otorgar `actions: write`/`pull-requests: write` a nivel de workflow

## 2. Job SBOM

- [x] 2.1 Eliminar el bloque `sbom` comentado existente en `security.yml` (líneas ~117-125)
- [x] 2.2 Agregar job `sbom` en `security.yml` que hace `actions/checkout@v5` y genera el SBOM con `anchore/sbom-action@v0.17.2` (versión pinneada, no tag móvil), `format: cyclonedx-json` y `output-file: sbom-project-one.json`
- [x] 2.3 Agregar paso de subida del artifact con `actions/upload-artifact@v4` (name: `sbom`, path: `sbom-project-one.json`, `if-no-files-found: error`, `retention-days: 365`) al job `sbom`

## 3. Job Dependency Review

- [x] 3.1 Agregar job `dependency-review` en `security.yml` con `if: github.event_name == 'pull_request'` que usa `actions/checkout@v5` y `actions/dependency-review-action@v4`
- [x] 3.2 Configurar `with:` del dependency-review con `vulnerability-check: true` y `license-check: true`

## 4. Verificación

- [~] 4.1 Validar sintaxis del YAML con `docker run rhysd/actionlint:latest` (o parser YAML como fallback; `npx actionlint` usa un wrapper npm no oficial) en `.github/workflows/security.yml` — **DEFERRED a CI run per orchestrator 2026-08-02 (docker no disponible localmente)**
- [~] 4.2 Abrir un PR de prueba contra `main` y confirmar que los checks `sbom` y `dependency-review` aparecen y se ejecutan — **DEFERRED a primer PR post-merge per orchestrator 2026-08-02**
- [~] 4.3 Confirmar en el PR de prueba que el artifact `sbom` contiene `sbom-project-one.json` descargable — **DEFERRED a primer PR post-merge per orchestrator 2026-08-02**
- [~] 4.4 Confirmar que el dependency-review falla (bloquea) cuando el PR introduce una dependencia vulnerable o licencia incompatible, y pasa cuando el cambio es seguro — **DEFERRED a primer PR con dep Vulnerable post-merge per orchestrator 2026-08-02**

## 5. Documentación

- [x] 5.1 Actualizar la tabla de seguridad en `README.md` (~línea 252) para incluir SBOM y Dependency Review en la descripción de `security.yml`
- [x] 5.2 Actualizar `docs/cicd-estado-actual.md` (brecha M4, ~línea 450) para marcar SBOM/Dependency Review como implementados
