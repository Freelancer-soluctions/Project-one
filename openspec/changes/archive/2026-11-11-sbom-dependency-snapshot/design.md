# Design — sbom-dependency-snapshot

## Decisiones

1. **Habilitar `dependency-snapshot: true`.** El parámetro ya existe en `anchore/sbom-action`. Activarlo sube el SBOM a la GitHub Dependency submission API, lo que permite a Dependabot detectar vulnerabilidades en dependencias transitivas.

2. **Permisos.** El job necesita `contents: write` para la **Dependency submission API** (no para upload de artifact, que no requiere write). El job `sbom` en `security.yml` ya tiene `contents: read` (L212); se eleva a `contents: write`. Nota: en PRs de forks el token es read-only y la submission falla silenciosamente (esperado, no es un error).

3. **Formato.** El formato actual es `cyclonedx-json` (security.yml:221, security-digest.yml:27), no el default SPDX del action. La Dependency submission API acepta CycloneDX; se verificó contra docs de anchore/GitHub. No se cambia el formato.

4. **Workflows afectados.** `security.yml` y `security-digest.yml` son los dos workflows que usan `anchore/sbom-action`. `scheduled-security.yml` está fuera de scope: su SBOM usa `npm sbom` (sin capability de snapshot).

5. **Sin cambios en el formato.** El formato sigue siendo CycloneDX. No se cambia a SPDX.

## No se toca

- No se cambia el formato del SBOM (sigue CycloneDX).
- No se añaden nuevos jobs.
- No se cambia la retención de artifacts.
