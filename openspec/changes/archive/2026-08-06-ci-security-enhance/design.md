## Context

Ver `proposal.md` — Why para la motivación. Estado actual relevante:

- `.github/workflows/security.yml` contiene hoy 3 jobs activos: `dependency-scan` (Trivy SCA), `sast` (CodeQL) y `secrets` (Gitleaks)
- Hay un bloque SBOM **comentado** en el mismo archivo (líneas ~117-125) que se reemplaza por el job activo
- Triggers actuales: `workflow_call` + `pull_request` sobre `main` — **no** hay `push` a main
- Permisos actuales: `contents: read` + `security-events: write`
- Monorepo npm workspaces: el lockfile raíz `package-lock.json` declara todas las dependencias (client + server + e2e)
- El plan (`docs/cicd-plan-implementacion.md` §Stage 5) ya define el YAML de referencia para ambos jobs

## Goals / Non-Goals

**Goals:**

- Generar SBOM CycloneDX JSON en cada PR y push a main usando `anchore/sbom-action@v0`
- Subir el SBOM como artifact (`actions/upload-artifact@v4`) para trazabilidad
- Bloquear PRs que introduzcan dependencias vulnerables o licencias incompatibles con `actions/dependency-review-action@v4`
- Mantener todo dentro de `security.yml` (Stage 5 consolidado en un solo workflow)
- Agregar trigger `push` a main para que SBOM corra también post-merge

**Non-Goals:**

- No se implementa el cron semanal (Stage 8: `ci-scheduled-security`), que generará SBOM SPDX en otro workflow
- No se toca el secret scanning (brecha A2 — change `ci-secret-scanning` aparte)
- No se agregan gates de coverage ni otros jobs del Stage 5
- No se cambia el código de la aplicación (solo configuración CI)

## Decisions

### D1: `anchore/sbom-action@v0` con formato CycloneDX JSON

Se usa la action oficial de Anchore (syft bajo el capó) con `format: cyclonedx-json` y `output-file: sbom-project-one.json`.

- **Por qué**: Zero-config, cataloga `package-lock.json` raíz (cubre los 3 workspaces por hoisting npm), y es el formato recomendado por OWASP y la executive order 14028. El plan ya lo lista para PR/main; SPDX queda reservado para el cron semanal (Stage 8).
- **Alternativas**: `syft` vía container (más control, más setup), `npm`-basado (no produce CycloneDX nativo). Rechazadas por complejidad sin beneficio aquí.

### D2: `actions/dependency-review-action@v4` con vulnerability + license check

Se habilita `vulnerability-check: true` (default) **y** `license-check: true`, ejecutando solo en PR (`if: github.event_name == 'pull_request'`).

- **Por qué**: El plan define ambos checks como gate. El license-check usa una deny-list por defecto de licencias incompatibles, sin bloqueos extraños.
- **Alternativas**: Solo vulnerability-check (default) — no cubriría la brecha de licencias del plan. `fail-on-scopes: development,unknown` — más granular, se puede afinar luego si hay falsos positivos (ver Open Questions).

### D3: Los jobs viven en `security.yml` (no workflow nuevo)

Se agregan los jobs `sbom` y `dependency-review` al workflow existente.

- **Por qué**: El mapa Stage 5 del plan los muestra dentro del workflow `security.yml`. Un solo archivo = un solo lugar para revisar el estado de seguridad del pipeline.
- **Alternativas**: Workflow separado `supply-chain.yml` — fragmenta el Stage 5 sin beneficio real.

### D4: Permisos job-scoped (least privilege)

El bloque `permissions` top-level se conserva mínimo y cada job declara SOLO el permiso extra que necesita:

```yaml
permissions:
  contents: read
  security-events: write   # CodeQL SARIF (existente)

# job sbom:
permissions:
  contents: read
  actions: write           # upload-artifact: subir SBOM

# job dependency-review:
permissions:
  contents: read
  pull-requests: write     # dependency-review-action: comentario con hallazgos en PR
```

- **Por qué**: `dependency-review-action@v4` requiere `pull-requests: write` para publicar el comentario de resumen en el PR, y `actions/upload-artifact@v4` requiere `actions: write` para crear el artifact. Con permisos top-level amplios, los jobs `dependency-scan` (Trivy), `sast` (CodeQL) y `secrets` (Gitleaks) — que ejecutan código de dependencias no confiables — heredarían capacidad de escritura de artifact/PR que no necesitan. Job-scoped limita el blast radius.

### D5: SBOM sin `npm ci`

El job `sbom` hace checkout y ejecuta `anchore/sbom-action@v0` directamente, sin instalar dependencias.

- **Por qué**: syft cataloga el lockfile (`package-lock.json`) directamente; instalar dependencias solo añadiría ~1-2 min al job sin mejorar el SBOM. Los jobs que sí necesitan el árbol completo (`dependency-scan`, `sast`) ya hacen `npm ci` de forma independiente.

### D6: El bloque SBOM comentado se elimina

El job `sbom` comentado existente (sin `format` ni `output-file`) se reemplaza por el job activo con configuración completa.

- **Por qué**: Evita confusión entre el bloque muerto y el job real. El git history conserva el bloque original.

## Risks / Trade-offs

- [Falsos positivos del license-check (deps con licencias tipo GPL/AGPL en deny-list)] → Mitigación: los comentarios del dependency-review muestran el detalle; si aparecen, ajustar con `fail-on-scopes` o allowlist explícita. Los PRs bloqueados son revisables, no silenciosos.
- [Dependency Review bloquea PRs de Dependabot con parches de seguridad] → Mitigación: es el comportamiento deseado (gate); el comentario de la action explica el hallazgo y el parche de Dependabot suele resolverlo.
- [SBOM action escanea el repo completo y podría ser lento] → Mitigación: job independiente y paralelo a los otros; si el monorepo crece, acotar `path:` a los lockfiles.
- [`actions: write` amplía el permiso del workflow] → Mitigación: se usa job-scoped (D4) — solo el job `sbom` lo recibe; el token sigue sin acceso a otros ámbitos sensibles.
- [El SBOM de un PR refleja el estado de la rama, no de main] → Mitigación: el push a main (nuevo trigger) regenera el SBOM con el estado real post-merge.
- [El trigger `push` a main activa el job `secrets` (gitleaks/gitleaks-action@v2) que hoy falla si el secret `GIT_LEAKS` no está configurado] → Mitigación: este change DEBE mergearse después de `ci-secret-scanning` (que reemplaza Gitleaks por GitHub secret scanning nativo + Gitleaks open source sin licencia), o verificar que `GIT_LEAKS` exista en el repo antes de habilitar el push trigger. Orden de merge: `ci-secret-scanning` → `ci-security-enhance`.

## Migration Plan

1. **Deploy**: Merge del PR que modifica `security.yml`. GitHub Actions detecta el cambio de workflow en el propio PR (los jobs corren contra la versión del archivo en la rama).
2. **Validación**: En el PR, los checks `sbom` y `dependency-review` deben aparecer y pasar/fallar según el contenido del cambio.
3. **Rollback**: Revertir el cambio al workflow (git revert) — es configuración pura, sin migración de datos ni estado externo.

## Open Questions

- ¿Ajustar `fail-on-scopes` del dependency-review (p.ej. `development`, `unknown`) si el license-check genera falsos positivos con devDependencies? — Deferible: no cambia specs ni tasks, se afina después del primer run real.
- ~~¿Fijar el SHA de `anchore/sbom-action@v0` (pin de supply-chain) o mantener tag móvil `@v0`?~~ → **Resuelto**: fijar a versión completa (`anchore/sbom-action@v0.17.2`). El repo ya pinnea `aquasecurity/trivy-action@0.33.1`; para un change de supply-chain security, un tag móvil `@v0` en la action generadora del SBOM es un riesgo irónico. Se actualiza el job `sbom` y la task 2.2.
