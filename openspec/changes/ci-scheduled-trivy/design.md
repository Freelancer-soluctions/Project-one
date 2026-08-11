## Context

Ver proposal.md (Why). Estado actual relevante:

- `.github/workflows/scheduled-security.yml` (cron `0 3 * * 1` + `workflow_dispatch`, permisos top-level `contents: read` + `security-events: write`) ejecuta SOLO el job `gitleaks-full-scan` (Gitleaks full-history, JSON + SARIF upload al Security tab con `category: gitleaks`). Es el workflow del change archivado `ci-secret-scanning` (2026-08-07) — ya no esta "owned" por un change activo.
- `security.yml` (sibling `ci-security-enhance`) corre Trivy fs (`aquasecurity/trivy-action@0.33.1`, `scan-type: fs`, `scan-ref: .`, `severity: CRITICAL,HIGH`) en PR/push — NO programado.
- `ci-enterprise.yml` corre `npm audit --audit-level=high` en push (job `dependency-audit`) — NO programado.
- `security-digest.yml` (sibling `ci-scheduled-security-review`) cubre OSV + SBOM + digest en cron — NO Trivy full, NO npm audit.
- El plan (`docs/cicd-plan-implementacion.md` L238, L914-952, L1273) describe UN workflow `scheduled-security.yml` con Gitleaks full + Trivy full + npm audit + SBOM. La realidad lo dividio: Gitleaks en `scheduled-security.yml`, OSV/SBOM/digest en `security-digest.yml`. Trivy full y npm audit programados NO existen (GAP C3).

## Goals / Non-Goals

**Goals:**

- Anadir cadencia semanal de Trivy full fs scan (HIGH/CRITICAL, SARIF) y `npm audit --audit-level=high` sobre el estado mergeado de `main`.
- Reutilizar el workflow programado existente (`scheduled-security.yml`) y su permiso `security-events: write` — un solo punto de entrada "scheduled security".
- Modo auditoria: el run no falla por hallazgos; los hallazgos se ven en el Security tab / logs.
- Documentar en `docs/security/SECURITY.md`.

**Non-Goals:**

- No crear un workflow nuevo paralelo con el mismo cron.
- No tocar `security.yml` (Trivy de PR/push) ni `ci-enterprise.yml` (npm audit de push) — sus escaneos event-driven se mantienen.
- No tocar `security-digest.yml` (OSV/SBOM/digest del sibling).
- No migrar el Gitleaks full-history ni cambiar su job.
- No rotar secretos ni remediar vulnerabilidades (solo deteccion/reporte).
- No integrar SIEM/dashboards externos.

## Decisions

### D1: EXTENDER `scheduled-security.yml` (no crear workflow paralelo)

Se anaden los jobs `trivy-full-scan` y `npm-audit` al workflow existente `scheduled-security.yml` (cron `0 3 * * 1` + `workflow_dispatch`). El job `gitleaks-full-scan` queda intacto.

- **Por que**: el plan describe UN workflow scheduled con el full scan completo; el workflow ya tiene el cron, `workflow_dispatch` y `security-events: write` (necesario para el upload SARIF). Extender evita un tercer run programado a la misma hora (03:00 lunes) y una tercera superficie de mantenimiento. El change `ci-secret-scanning` esta archivado, asi que el archivo ya no esta "owned" por un change activo — extenderlo es legitimo y no viola la spec del sibling (`ci-scheduled-security-review` solo prohibe tocar el archivo desde ESE change; el Gitleaks sigue siendo el unico dueno del full-history scan).
- **Alternativa considerada**: nuevo workflow `ci-scheduled-security-trivy.yml` → rechazada: cron paralelo duplicado (dos runs a las 03:00 lunes), permisos a re-declarar, y el plan concibe un solo workflow scheduled. Se documenta como alternativa si en el futuro el workflow crece demasiado.

### D2: Job `trivy-full-scan` — `aquasecurity/trivy-action@0.33.1` fs + SARIF al Security tab

Configuracion: step `actions/checkout@v5` PRIMERO (obligatorio — trivy-action NO hace checkout; sin el, `scan-ref: .` escanearia un workspace vacio → SARIF vacio en verde; espejo del job `gitleaks-full-scan` y del job `npm-audit` 1.4), seguido de `aquasecurity/trivy-action@0.33.1` con `scan-type: fs`, `scan-ref: .`, `severity: CRITICAL,HIGH` (orden normalizado a `security.yml:37`), `format: sarif`, `output: trivy.sarif`. Luego `github/codeql-action/upload-sarif@v4` con `sarif_file: trivy.sarif` y `category: trivy` (categoria distinta de `gitleaks` para separar alertas en el Security tab), y `actions/upload-artifact@v4` (name `trivy-sarif`, retention 30d, consistente con `gitleaks-report`).

- **Por que**: misma action y version que `security.yml` (`aquasecurity/trivy-action@0.33.1`) — consistencia de pinning en el repo. El scan `fs` sobre `.` cubre el arbol completo incluyendo `package-lock.json` (deteccion de dependencias) y archivos de configuracion/entorno — complementa a `npm audit` (especifico de npm) y a OSV (solo lockfile).
- **Sobre "requires database init"**: `github/codeql-action/upload-sarif@v4` NO requiere inicializar una base de datos CodeQL — solo sube el SARIF a la API de code scanning. Lo unico necesario es el permiso `security-events: write`, ya presente en el workflow. (Correccion al supuesto del scope.)
- **Modo auditoria**: el job NO usa `exit-code: 1`; Trivy reporta hallazgos y el run queda verde (consistente con la spec R1 y con el `continue-on-error: true` del job Gitleaks sibling).
- **Semantica de fallo**: a diferencia de `gitleaks-full-scan` (que declara `continue-on-error: true` a nivel job), `trivy-full-scan` NO declara `continue-on-error` — un fallo de infraestructura (p.ej. timeout descargando la base de datos de vulnerabilidades) fallaria el run. Defensible: un scan que no pudo ejecutarse debe ser visible, no silenciado. Se documenta esta asimetria en SECURITY.md (task 2.1).
- **Alternativa considerada**: solo artifact (sin Security tab) → rechazada: los hallazgos no generan alertas visibles en la UI de GitHub. Issue por hallazgos → rechazada: ruido, requiere `issues: write`, y el "report to security dashboard" del plan es aspiracional (fuera de alcance).

### D3: Job `npm-audit` — `npm audit --audit-level=high` nativo

Configuracion: `actions/checkout@v5` + `actions/setup-node@v4` (`node-version-file: '.nvmrc'`, `cache: 'npm'`) + `run: npm audit --audit-level=high`. El audit lee `package-lock.json` raiz (cubre los 3 workspaces por hoisting npm) — no requiere `npm ci` (mas rapido; el lockfile ya esta en el checkout).

- **Por que**: `npm audit` es la herramienta nativa del ecosistema; el plan la lista explicitamente (L943). El lockfile raiz declara todos los workspaces, asi que un solo audit cubre el monorepo.
- **Modo audit**: el job usa `continue-on-error: true` (igual que `gitleaks-full-scan`): `npm audit --audit-level=high` sale con codigo != 0 cuando hay hallazgos >= high; con `continue-on-error` el run queda verde y los hallazgos se ven en los logs/annotations del job (spec R3). Nota: `continue-on-error` tambien enmascara fallos de infraestructura (p.ej. registry npm inalcanzable) — aceptado: el job es informativo y el run programado no debe romperse por un registry caido; se documenta en SECURITY.md (task 2.1).
- **Alternativa considerada**: `npm audit --json` + parseo → rechazada: sin consumidor del JSON (no hay digest que lo consuma); el log nativo es suficiente para la cadencia programada.

### D4: Permisos

Se mantienen los permisos top-level existentes del workflow: `contents: read` + `security-events: write`. `upload-sarif` requiere `security-events: write` (ya presente); `npm audit` y `upload-artifact` no requieren permisos extra. Sin secrets nuevos.

- **Por que**: cambio minimo sobre un workflow ya desplegado; el principio least-privilege del sibling (`ci-security-enhance` D4) ya esta satisfecho por los permisos actuales (no se anade `pull-requests` ni `issues`).

### D5: Documentacion en `docs/security/SECURITY.md`

Seccion nueva "Scheduled Trivy full scan + npm audit": que corre cada lunes 03:00 UTC (Gitleaks full + Trivy full + npm audit), como leer los hallazgos (Security tab → code scanning → categoria `trivy`; logs del job `npm-audit`), y nota de que los escaneos event-driven (`security.yml`, `ci-enterprise.yml`) no se duplican.

## Risks / Trade-offs

- **SARIF con rutas absolutas que no mapean al repo** → Mitigacion: trivy-action genera el SARIF desde el repo root; verificar en el dry-run local (task 4.1) que las rutas son relativas; si no, anadir un step de normalizacion antes del upload.
- **`npm audit` falla el job por hallazgos** → Mitigacion: `continue-on-error: true` en el job (modo audit, spec R3).
- **Alertas duplicadas con el Trivy de `security.yml`** → Descartado: `security.yml` (job `dependency-scan`) NO sube SARIF al Security tab — solo ejecuta el scan en PR/push sin upload. El scan programado es la UNICA fuente de alertas Trivy de code scanning; no hay duplicacion posible.
- **Cron deshabilitado tras >60 dias de inactividad (politica GitHub)** → Mitigacion: `workflow_dispatch` manual disponible (igual que siblings).
- **Trivy fs escanea `node_modules` (ruido)** → Descartado: el workflow programado NO ejecuta `npm ci` (a diferencia de `security.yml`), asi que `node_modules` no existe en el checkout; el scan fs cubre solo el arbol versionado. Riesgo nulo.
- **Overlap Trivy fs vs npm audit vs OSV** → Mitigacion: herramientas complementarias (Trivy: filesystem + deps; npm audit: advisories npm; OSV: base OSV en el digest sibling); el cron es capa de visibilidad, no de bloqueo.

## Migration Plan

1. Merge del PR que anade los jobs `trivy-full-scan` y `npm-audit` a `scheduled-security.yml` + docs.
2. Observar el primer run programado (o `workflow_dispatch` manual): verificar artifact `trivy-sarif`, alertas en Security tab (categoria `trivy`) y logs del job `npm-audit`.
3. **Rollback**: `git revert` del workflow restaura el comportamiento anterior (config pura, sin migracion de datos).

## Open Questions

- ¿Anadir `--ignore-unfixed` al scan Trivy para filtrar vulnerabilidades sin fix disponible? — Deferible: no cambia specs ni tasks; puede decidirse en implementacion sin impacto contractual.
- ¿Configurar el cron a una hora distinta (p.ej. `30 3 * * 1`) para no solaparse con el run del digest? — Deferible: los runs son independientes (jobs distintos en workflows distintos); se mantiene `0 3 * * 1` por consistencia con el plan y el sibling.
