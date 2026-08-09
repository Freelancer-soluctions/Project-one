## Context

El plan CI/CD (`docs/cicd-plan-implementacion.md` §Stage 8, §4.1 y tabla de cobertura) define un stage "Scheduled" con 3 ítems pendientes: security full scan semanal, SBOM actualizado y Gitleaks full repo. Los siblings ya cubren: secret scanning PR + cron semanal (`ci-secret-scanning`: `secret-scanning.yml` + `scheduled-security.yml`, cron `0 3 * * 1`, modo auditoría) y SBOM + Dependency Review en PR/push (`ci-security-enhance`: jobs `sbom` y `dependency-review` en `security.yml`). Lo que falta (brecha del Stage 8 restante): cadencia periódica de dependencias — re-ejecutar SBOM + revisión de vulnerabilidades/licencias sobre el estado mergeado de `main` entre actividad de PRs, y consolidarlo en un digest humano-legible.

**Restricciones clave:**

- NO duplicar `scheduled-security.yml` (sibling `ci-secret-scanning`) ni `security.yml` (sibling `ci-security-enhance`).
- REUTILIZAR el patrón de trigger programado del sibling (cron semanal + `workflow_dispatch`).
- Todas las actions pineadas por tag (consistente con siblings).
- Sin deps npm nuevas; tools corren solo en workflow jobs.

## Goals / Non-Goals

**Goals:**

- Workflow nuevo `.github/workflows/security-digest.yml` con cron semanal que re-ejecuta SBOM CycloneDX + escaneo de vulnerabilidades/licencias del árbol mergeado.
- Digest markdown humano-legible (conteos SBOM + paquetes vulnerables + resumen de licencias + cross-ref de secretos) subido como artifact; opcionalmente PR summary comment cuando es accionable.
- Cross-reference del cron de secret-scanning (descargar artifact `gitleaks-report` del run semanal del sibling) sin duplicar su workflow.
- Modo auditoría: el run no falla por hallazgos; los hallazgos se ven en artifacts/digest.
- Documentación en `docs/security/SECURITY.md`.

**Non-Goals:**

- No crear/modificar `scheduled-security.yml` ni `security.yml` (siblings).
- No migrar las tools de SAST/SCA existentes (CodeQL, Trivy, Gitleaks se quedan donde están).
- No rotar secretos ni vulnerabilidades (solo detección/reporte).
- No integrar SIEM/dashboards externos (el plan lo menciona como futuro; fuera de alcance).
- No añadir dependencias npm al runtime.

## Decisions

### D1: Workflow nuevo `security-digest.yml` (no duplicar siblings)

Se crea un workflow NUEVO con `schedule` (cron semanal, mismo patrón `0 3 * * 1` — nota: se usará el mismo día/hora base que `scheduled-security.yml` para que el cross-ref del artifact `gitleaks-report` sea del run más reciente) + `workflow_dispatch`. No se tocan `scheduled-security.yml` ni `security.yml`.

- **Por qué**: el Stage 8 requiere cadencia periódica de dependencias; los siblings ya son dueños de sus archivos. Un workflow propio aísla el alcance y evita conflictos de merge.
- **Alternativa considerada**: ampliar `scheduled-security.yml` con jobs de SBOM/vulns → rechazada (viola la restricción de no duplicar/duplicar dueño; el sibling ya lo archiva con su propio alcance).
- **Cross-change note**: `ci-secret-scanning` y `ci-security-enhance` DEBEN mergearse primero (este change consume sus artifacts/workflows). En el PR de este change, los pasos que descargan `gitleaks-report` deben degradarse elegantemente si el artifact no existe aún (ver D4).

### D2: Re-ejecutar SBOM CycloneDX en el cron con `anchore/sbom-action@v0.17.2`

El job `sbom` del nuevo workflow re-ejecuta la generación del SBOM (misma action y formato que el sibling `ci-security-enhance`: CycloneDX JSON, `output-file: sbom-project-one.json`) sobre el estado de `main`.

- **Por qué**: el SBOM de PR/push refleja solo el estado en ese evento; entre PRs, `main` cambia por merges directos o dependabot. El cron regenera el SBOM del estado mergeado actual y lo sube como artifact (mismo nombre de artifact `sbom` para consistencia).
- **Alternativa considerada**: confiar solo en el SBOM de PR → rechazada (no cubre merges sin PR, ni dependencias publicadas después del último PR).
- **Por qué CycloneDX y no SPDX**: consistencia con el sibling (`ci-security-enhance` D1) y con la spec del change (formato fijado); el plan menciona SPDX para el cron y el sibling `ci-security-enhance` reserva "SBOM SPDX en otro workflow" como Non-Goal — DESVIACIÓN documentada: este change usa CycloneDX (mismo action/formato que el sibling, un solo parser). Desviaciones del plan Stage 8: cron `0 3 * * 1` (plan: `0 6 * * 1` — mismo día que el sibling para cross-ref de artifacts) y nombre `sbom-project-one.json` (plan: `sbom-project-one-weekly.json` — consistencia con `ci-security-enhance`). Al archivar, reconciliar el Non-Goal del sibling con esta nota.

### D3: Revisión de vulnerabilidades con `google/osv-scanner-action` sobre `package-lock.json`; licencias derivadas del SBOM

El job `vulnerability-review` escanea el lockfile raíz (que declara los 3 workspaces por hoisting npm) con osv-scanner, generando salida JSON (`--format json`) que alimenta el digest. El resumen de licencias NO se escanea por separado: se deriva del SBOM (los componentes CycloneDX incluyen metadata de licencia) y se filtra contra una deny-list estática del script (D5) alineada con el default deny-list de dependency-review-action del sibling.

- **Por qué osv-scanner y no `actions/dependency-review-action@v4` en el cron**: dependency-review-action está diseñada para PRs (compara base vs head); en un cron no hay diff de PR. osv-scanner consulta la base de datos OSV contra el lockfile del estado actual — exactamente el caso de uso "dependencia vulnerable ya mergeada". dependency-review-action además hace license check con su deny-list propia — de ahí que este change la copie como constante (D5) para el digest.
- **Alternativa considerada**: `aquasecurity/trivy-action` (v0.28.0 verificado) sobre el árbol → rechazada como herramienta principal porque escanea el filesystem completo y su salida JSON es menos directa para el digest; se documenta como alternativa futura. Nota: `security.yml` ya usa trivy-action@0.33.1 para SCA en PR; no se duplica aquí.
- **Pin a verificar en implementación**: `google/osv-scanner-action@v2.3.8` (re-verificar el tag contra el repo remoto al implementar — task 3.1).
- **Por qué audit-style**: consistente con el cron sibling de secret scanning (spec del sibling: "SHALL NOT fail the scheduled run merely for reporting a finding"); el run queda verde y los hallazgos se ven en el digest/artifacts (spec R5).

### D4: Cross-reference del artifact `gitleaks-report` del cron sibling (sin duplicar)

El job `digest` intenta descargar el artifact `gitleaks-report` del run más reciente de `scheduled-security.yml` (vía `actions/download-artifact@v4` con `run-id` del workflow del sibling, o `gh api` para resolver el último run) y consolida un resumen de hallazgos de secretos en el digest.

- **Por qué**: reutiliza el trigger programado existente (el cron ya corre Gitleaks full-history); el digest solo lo cruza — cero duplicación de scanning.
- **Degradación elegante**: si el artifact no existe (workflow del sibling aún no mergeado, primer run, o run fallido), el digest incluye "secret report unavailable" y el job no falla (spec R4 scenario: "SHALL note when the secret report is unavailable instead of failing").
- **Alternativa considerada**: re-ejecutar Gitleaks en este workflow → rechazada (duplicaría `scheduled-security.yml`).

### D5: Digest markdown generado por script Node puro `scripts/security/generate-security-digest.mjs`

Un script (Node >= 20, sin deps npm; `node:fs`/`node:path` built-ins) parsea `sbom-project-one.json` + el reporte JSON de osv-scanner + (opcional) `gitleaks-report.json` y emite `security-digest.md`: total de dependencias, paquetes vulnerables con severidad, resumen de licencias, timestamp, y estado del cross-ref de secretos. **Política de licencias**: constante estática `LICENSE_DENY_LIST` en el script con **15 entradas** que cubren la familia GPL/LGPL/AGPL (versiones base + variantes `-+` "or later" de GPL/AGPL, y versiones base de LGPL: LGPL-1.0, LGPL-2.0, LGPL-2.1, LGPL-3.0); documentada en `docs/security/SECURITY.md` (task 5.1) para que la política sea auditable y testeable (spec R3). **DESVIACIÓN DOCUMENTADA (decisión aceptada)**: el default deny-list real de `actions/dependency-review-action` tiene 18 entradas — añade `LGPL-2.0+`, `LGPL-2.1+`, `LGPL-3.0+`. Este change omite intencionalmente esas 3 variantes `-+`: la familia LGPL base ya está cubierta y las variantes `-+` se omiten para evitar sobre-bloqueo (over-blocking). La implementación actual (15 entradas) es correcta; spec y documentación se alinean con el código implementado.

- **Por qué**: el proyecto es pure-JS (engine node >=20.0.0, type: module) — un `.mjs` built-in se ejecuta sin instalar nada en el runner (solo `node` del runner o `actions/setup-node`). Sin deps npm nuevas (restricción del change).
- **Alternativa considerada**: generar el markdown con un step `run: |` inline de bash → rechazada (parsear JSON anidado en bash es frágil; un script JS es testeable y mantenible).
- **Script en repo** (no en `scripts/security/` existente... sí, se coloca en `scripts/security/generate-security-digest.mjs` junto a `semgrep.ps1`/`dependency-scan.ps1`): consistente con la convención de tooling del repo.

### D6: Artifact upload + opcional PR summary comment (vía input de dispatch)

El digest se sube con `actions/upload-artifact@v4` (name `security-digest`). El PR summary comment se habilita por un input OPCIONAL `pull_request_number` del `workflow_dispatch` (task 1.1): el step condicional `if: inputs.pull_request_number != ''` postea el resumen en ese PR. El trigger set actual NO incluye `pull_request`, así que `github.event_name == 'pull_request'` nunca se cumple — el input es el único mecanismo realista (spec R4). Se omite en cron (no hay PR).

- **Por qué**: el plan pide "uploaded as a workflow artifact and/or posted as a PR summary comment when actionable". En cron no hay PR → artifact siempre; comment solo cuando un maintainer hace dispatch manual con PR (accionable).
- **Permisos**: `contents: read` + `actions: read` top-level; `pull-requests: write` job-scoped (solo job `digest` si se postea comment). Siguiendo el principio least-privilege del sibling (`ci-security-enhance` D4).

### D7: Documentación en `docs/security/SECURITY.md`

Sección nueva "Scheduled security digest": qué corre cada lunes (SBOM + osv-scanner + digest), cómo leer el digest, dónde están los artifacts, y cómo interpretar el cross-ref de secretos.

## Risks / Trade-offs

- **Artifact del sibling no disponible al mergear este change** → Mitigación: cross-ref degradable (D4); el PR de este change DEBE esperar a `ci-secret-scanning` y `ci-security-enhance` mergeados (merge-order note en tasks).
- **Cron deshabilitado tras >60 días de inactividad del repo (política GitHub)** → Mitigación: `workflow_dispatch` manual disponible; documentado (igual que sibling).
- **osv-scanner reporta falsos positivos o duplica findings del dependency-review de PR** → Mitigación: el digest es informativo (audit mode); la decisión de bloqueo sigue en el dependency-review de PR; el cron es capa de visibilidad.
- **SBOM del cron y SBOM de PR divergen en formato/ubicación** → Mitigación: misma action y formato (`anchore/sbom-action@v0.17.2`, cyclonedx-json, `sbom-project-one.json`) — consistente con sibling.
- **Parseo del SBOM/OSV puede fallar si el formato cambia (major bump de action)** → Mitigación: pines fijos por tag + dependabot `github-actions` (ya gestionado por el sibling `ci-secret-scanning` task 4.4; al mergear, combinar ecosistemas en un solo `.github/dependabot.yml`).
- **PR summary comment requiere `pull-requests: write`** → Mitigación: job-scoped en `digest`; en cron no hay PR y el step se omite (sin exposición innecesaria del token).
- **El job `digest` corre tras `sbom` + `vulnerability-review`** → Mitigación: `needs: [sbom, vulnerability-review]` con `if: always() && !cancelled()` (task 1.3): el job corre salvo cancelación; si AMBOS upstream fallan, el digest falla VISIBLEMENTE en el run y los artifacts de los jobs completados quedan disponibles para inspección manual (spec R5 scenario "Digest job failure handling").

## Migration Plan

1. Merge ordenado: `ci-secret-scanning` → `ci-security-enhance` → este change (los dos primeros DEBEN estar en `main` para que el cross-ref funcione).
2. Merge del PR que añade `security-digest.yml` + `scripts/security/generate-security-digest.mjs` + docs.
3. Observar el primer run programado (o `workflow_dispatch`): verificar artifact `security-digest` y cross-ref de `gitleaks-report`.
4. **Rollback**: `git revert` del workflow/script restaura el comportamiento anterior (config pura, sin migración de datos).

## Open Questions

- ¿Postear el digest también en un issue de GitHub cuando hay hallazgos críticos (no solo PR comment)? — Deferible: no cambia specs ni tasks; puede añadirse en implementación con `gh issue create` sin impacto contractual.
- ¿Extender el workflow a `pull_request` para tener digest en PRs? — Fuera del Stage 8 (cadencia periódica); el sibling `ci-security-enhance` ya cubre PR. Se deja como extensión futura.
- ¿Configurar el cron a una hora distinta del sibling (p.ej. `30 3 * * 1`) para que el cross-ref use SIEMPRE el run más reciente del mismo día? — Deferible: la resolución del último run vía API es robusta a la hora; se prefiere mantener el mismo `0 3 * * 1` por simplicidad y se resuelve el último run completo vía `gh api` (D4).
