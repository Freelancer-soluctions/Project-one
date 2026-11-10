# Design — sbom-dependency-snapshot

## Decisiones

1. **Habilitar `dependency-snapshot: true`.** El parámetro ya existe en `anchore/sbom-action`. Activarlo sube el SBOM a la GitHub Dependency submission API, lo que permite a Dependabot detectar vulnerabilidades en dependencias transitivas.

2. **Permisos.** El job necesita `contents: write` (para upload de artifact) y el token por defecto (`github.token`) es suficiente para la dependency submission API en repos públicos. En repos privados puede requerir permisos adicionales.

3. **Sin cambios en el formato.** El formato sigue siendo SPDX (default). No se cambia a CycloneDX.

4. **Aplicar en ambos workflows.** `security.yml` (PR-time) y `scheduled-security.yml` (semanal) deben tener el parámetro activado para cobertura completa.

## No se toca

- No se cambia el formato del SBOM (sigue SPDX).
- No se añaden nuevos jobs.
- No se cambia la retención de artifacts.
