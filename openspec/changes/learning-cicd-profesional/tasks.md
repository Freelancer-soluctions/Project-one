# Tasks

## 1. Setup del nivel Profesional

- [ ] 1.1 Crear `docs/learning/ci-cd/profesional-README.md` con: índice del nivel (6 guías: 23 publicada y 25-29 planificadas, con descripción breve, estado y orden de lectura 18-29), prerequisitos ("completado Fundamentos + Intermedio + Avanzado"), objetivos de aprendizaje del nivel, enlace de vuelta al nivel Avanzado, cross-links a la documentación técnica, y la sección de wrap-up/graduación de la ruta de 4 niveles

## 2. Guía 25: security.yml — SAST / SCA / SBOM

- [ ] 2.1 Escribir `docs/learning/ci-cd/25-security-yml-sast-sca-sbom.md` con objetivos de aprendizaje y prerequisitos (completado Fundamentos + Intermedio + Avanzado)
- [ ] 2.2 Introducir la taxonomía de seguridad desde cero: SAST vs SCA vs SBOM vs secrets detection vs dependency review (tabla comparativa)
- [ ] 2.3 Presentar el workflow `security.yml` completo: 5 jobs (dependency-scan/sast/secrets/sbom/dependency-review), triggers (workflow_call, pull_request, push), concurrency y permissions
- [ ] 2.4 Explicar el job `sast` (SAST): CodeQL `init@v4` + `analyze@v4`, `languages: javascript,actions`, autobuild comentado → `npm ci` manual (monorepo con workspaces)
- [ ] 2.5 Explicar el job `dependency-scan` (SCA): Trivy `aquasecurity/trivy-action@0.36.0`, scan fs, severity CRITICAL/HIGH, `exit-code: '1'` (fail-closed), `ignore-unfixed: true`, SARIF upload via `codeql-action/upload-sarif@v4` con `if: always()`
- [ ] 2.6 Explicar el job `sbom`: `anchore/sbom-action@v0.24.0`, formato CycloneDX JSON, artifact con `retention-days: 365` e `if-no-files-found: error`
- [ ] 2.7 Explicar el job `secrets`: Gitleaks OSS (`docker://zricethezav/gitleaks:v8.22.1`) diff scan (`base.sha..head.sha`) + licensed (`gitleaks/gitleaks-action@v3`) gated por `${{ secrets.GIT_LEAKS }}` + gotcha del warning/skip silencioso
- [ ] 2.8 Explicar el job `dependency-review`: `actions/dependency-review-action@v5` (vuln + license check en PR)
- [ ] 2.9 Explicar el modelo de permisos: `security-events: write` está presente en los workflows que suben SARIF (security.yml + scheduled-security.yml) Y en ci-enterprise.yml (excepción — workflow de referencia no-operacional; notarlo como excepción/violación del 'mínimo privilegio'); security-digest.yml NO lo necesita (sube artifacts, no SARIF)
- [ ] 2.10 Cerrar con resumen y enlace a `26-scheduled-security-yml.md`

## 3. Guía 26: Seguridad programada (cron)

- [ ] 3.1 Escribir `docs/learning/ci-cd/26-scheduled-security-yml.md` con objetivos de aprendizaje y prerequisitos
- [ ] 3.2 Explicar el modelo de seguridad de 3 niveles (pre-commit / PR / cron) como principio organizador con diagrama mermaid
- [ ] 3.3 Desglosar `scheduled-security.yml`: cron `0 3 * * 1` (Mon 03:00 UTC), checkout `fetch-depth: 0`, Gitleaks full-history `--log-opts="--all"` → JSON + SARIF, uploads con `if: always()` (artifact 30 días + Security tab)
- [ ] 3.4 Desglosar `security-digest.yml`: mismo cron, SBOM (`anchore/sbom-action@v0.24.0`), OSV Scanner (`google/osv-scanner-action@v2.5.0`), generación de digest con `scripts/security/generate-security-digest.mjs`, comment opcional en PR via input `pull_request_number` (solo si CRITICAL/HIGH/DENY-LIST)
- [ ] 3.5 Explicar los jobs `notify-failure` (needs + `if: failure()` + `issues: write` solo aquí) que crean issues en fallo
- [ ] 3.6 Explicar la semántica fail-closed (`continue-on-error` removido) y el rol de `if: always()` en uploads
- [ ] 3.7 Cerrar con resumen y enlace a `27-dependabot-3-ecosistemas.md`

## 4. Guía 27: Dependabot — 3 ecosistemas

- [ ] 4.1 Escribir `docs/learning/ci-cd/27-dependabot-3-ecosistemas.md` con objetivos de aprendizaje y prerequisitos
- [ ] 4.2 Explicar el concepto de Dependabot (PRs automáticos de dependencias) y su rol en la cadena de suministro
- [ ] 4.3 Desglosar `.github/dependabot.yml`: ecosistema npm (raíz, weekly lunes 03:00 UTC, grupos dev-deps minor/patch)
- [ ] 4.4 Desglosar los ecosistemas github-actions (weekly, prefix `ci`) y docker (`apps/server`, weekly, prefix `ci`)
- [ ] 4.5 Explicar la diferencia de cadencia npm vs github-actions (por qué las actions se priorizan)
- [ ] 4.6 Explicar la rutina mensual: revisar cluster de PRs, batch-merge patch+minor que pasan CI, evaluar major aparte, respetar ignore de majors react/react-dom
- [ ] 4.7 Explicar por qué Dependabot evita el drift de actions (problema enumerado en `docs/learning/ci-cd/workflows-mantenimiento-guia.md` y medible con la tabla de pins de `CONTEXT-CICD.md` §13.5) y qué pasa si `dependabot.yml` desaparece
- [ ] 4.8 Cerrar con resumen y enlace a `28-mantenimiento-workflows.md`

## 5. Guía 28: Mantenimiento de workflows

- [ ] 5.1 Escribir `docs/learning/ci-cd/28-mantenimiento-workflows.md` con objetivos de aprendizaje y prerequisitos, apoyado en `docs/learning/ci-cd/workflows-mantenimiento-guia.md` (no duplicarlo)
- [ ] 5.2 Explicar la filosofía "los workflows son código y se pudren" (`docs/learning/ci-cd/workflows-mantenimiento-guia.md` sección 1)
- [ ] 5.3 Explicar `.nvmrc` como single source of truth con el Caso 1 (EBADENGINE omniroute@3.8.49, commit `cf5e1bb`) y la propagación atómica a todos los workflows que consumen Node (9 archivos cuando se resolvió el caso; hoy 15 archivos / 94 jobs — la regla sobrevive al número)
- [ ] 5.4 Explicar la regla `fetch-depth: 0` opt-in con el Caso 2 (dorny/test-reporter exit 128) y los anti-patrones asociados
- [ ] 5.5 Explicar la política de versionado de actions: tags vs SHA pinning (decisión: tags + Dependabot gana, riesgo residual aceptado)
- [ ] 5.6 Explicar el gotcha del timeout de bash 120s en `.husky/pre-commit` (commits `cf5e1bb` y `32d35a8`) y la mitigación (`timeout 600 bash -c "git commit ..."`)
- [ ] 5.7 Presentar el checklist de mantenimiento trimestral (11 items de la sección 17 de `docs/learning/ci-cd/workflows-mantenimiento-guia.md`)
- [ ] 5.8 Enumerar los anti-patrones: editar `.nvmrc` workflow por workflow, engines floors en package.json, `fetch-depth: 0` "por si acaso", combinar bump+workflow en un commit
- [ ] 5.9 Cerrar con resumen y enlace a `29-dora-metrics-performance-tuning.md`

## 6. Guía 29: Métricas DORA y performance tuning

- [ ] 6.1 Escribir `docs/learning/ci-cd/29-dora-metrics-performance-tuning.md` con objetivos de aprendizaje y prerequisitos
- [ ] 6.2 Explicar las 4 métricas DORA (Deployment Frequency, Lead Time for Changes, Change Failure Rate, MTTR) en tabla y cómo el pipeline del proyecto afecta cada una (conectar `docs/ci-cd-pipeline-empresarial.md` §26)
- [ ] 6.3 Explicar SLSA desde cero: niveles 1-4 y dónde se ubica el proyecto (**Build L1**: SBOM + dependency review sin provenance firmada; OIDC de AWS no cuenta como SLSA Build), referenciando `docs/ci-cd-pipeline-empresarial.md` §25.2 y `docs/security/security-enterprise-guide.md`
- [ ] 6.4 Presentar DORA y SLSA con framing Staff-level (marcadores de la transición Senior → Staff)
- [ ] 6.5 Explicar performance tuning: jobs paralelos, cache hit ratio (npm/Vitest/Playwright), path filtering (`dorny/paths-filter`), cancelación por `concurrency`, composite actions para deduplicar setup
- [ ] 6.6 Introducir `act` para dry-run local sin gastar minutos de GitHub Actions (ej. `act -j quality -W .github/workflows/ci.yml` — el job `quality` vive ahora en `ci.yml`)
- [ ] 6.7 Cerrar con resumen y enlace al `profesional-README.md` (fin del nivel y graduación de la ruta)

## 7. Guía: Pipeline enterprise de referencia

> **Estado 2026-11-07**: entregada como `docs/learning/ci-cd/23-ci-enterprise-reference-pipeline.md` (469 líneas). Las
> tareas se reescribieron para reflejar lo verificado: se descartaron el conteo "9 workflows vs 30+ jobs", el "SLSA 2-3",
> el "gap G18", el "job `iac-security` comentado" y la idea de que `ci-enterprise.yml` sigue en el repo.

- [x] 7.1 Escribir `docs/learning/ci-cd/23-ci-enterprise-reference-pipeline.md` con objetivos de aprendizaje y prerequisitos (6 guías previas: 06, 09, 18, 22 + 24 como siguiente)
- [x] 7.2 Enseñar a **medir la escala** con las cuatro métricas que se confunden (archivos 15 / definiciones de job 94, 57 en `ci.yml` con 16 `if: false` / workflows activos en el registro 9 / required checks 4) y explicar qué tabla de `CONTEXT-CICD.md` §3.4-§5.9 es la fuente de cada una
- [x] 7.3 Reencuadrar la comparación enterprise: los 14 stages de `docs/ci-cd-pipeline-empresarial.md` §2.3 frente a lo que el repo cubre hoy, con la conclusión de que la brecha es de **capacidades**, no de número de jobs
- [x] 7.4 Explicar SLSA Build L1-L4 con la posición real del proyecto (**Build L1**: SBOM CycloneDX + dependency review, sin `attest|cosign|provenance|sigstore`) y enumerar qué falta para L3, incluido el requisito organizativo de revisión de dos partes
- [x] 7.5 Explicar VEX (4 statuses: `not_affected`, `affected`, `fixed`, `under_investigation`) y por qué `ignore-unfixed: 'true'` de Trivy es una política implícita, no VEX (sin citar el inexistente "gap G18")
- [x] 7.6 Explicar el escaneo de IaC real: job `checkov-iac` en `ci.yml` (advisory: `soft_fail: true` + `continue-on-error: true`, artifact 14d, Code Scanning sólo en weekly), FASE 2 planificada en comentario pero **sin** `.checkov.baseline` en el repo, y alcance vacío hoy (1 Dockerfile, 0 Terraform/K8s)
- [x] 7.7 Presentar `ci-enterprise.yml` como workflow **retirado**, estudiado por los snippets de las guías 02 §7.1 y 09 §6.1-§6.3, con los cinco anti-patrones de portabilidad y su síntoma observable
- [x] 7.8 Explicar future-proofing con criterio coste/beneficio (attestations y OpenTelemetry primero; Kubernetes/canary/flags bloqueados sin entornos ni tráfico real)
- [x] 7.9 Cerrar con FAQ, glosario, checklist, navegación (22 → 23 → 24) y fuentes sólo con URLs ya usadas en el repo

## 8. Verificación de cross-references

- [ ] 8.1 Verificar que las guías 18-23 enlazan correctamente entre sí (anterior/siguiente/README profesional)
- [ ] 8.2 Verificar enlaces de vuelta al nivel Avanzado (guías 11-17 / `avanzado-README.md`) y a los niveles previos
- [ ] 8.3 Verificar que los enlaces relativos a `docs/` y `.github/` apuntan a archivos existentes
- [ ] 8.4 Verificar que los snippets citados existen en las rutas indicadas (security.yml, scheduled-security.yml, security-digest.yml, dependabot.yml, ci-enterprise.yml)

## 9. Verificación de anti-duplicación

- [ ] 9.1 Verificar que ninguna guía copia secciones enteras (>40 líneas) de `docs/learning/ci-cd/workflows-mantenimiento-guia.md` — deben enlazar (uso intensivo como fuente, no como copia)
- [ ] 9.2 Verificar que no se duplica `docs/ci-cd-pipeline-empresarial.md` (§2.3 stages, §25 supply chain, §26 DORA, §27 progressive delivery) ni `docs/CONTEXT-CICD.md` (§3.4/§5.9 inventario, §13.5 pins) — enlazar + resumir
- [ ] 9.3 Verificar que los snippets cortos (<40 líneas) citan la ruta fuente
- [ ] 9.4 Verificar que el contenido didáctico (explicaciones desde cero de SAST/SCA/SBOM/SLSA/VEX) es original de las guías y no duplica la documentación técnica

## 10. Control de calidad markdown

- [ ] 10.1 Verificar la extensión de cada archivo: guías 800-1500 líneas, con la excepción documentada de la guía 23 (469 líneas, delegando profundidad a `docs/ci-cd-pipeline-empresarial.md` por la regla link-don't-copy)
- [ ] 10.2 Verificar que todas las guías tienen secciones de objetivos de aprendizaje y prerequisitos ("completed Fundamentos + Intermedio + Avanzado levels")
- [ ] 10.3 Verificar formato markdown válido: tablas bien formadas, diagramas mermaid sin errores de sintaxis (incluido el mermaid del modelo de seguridad de 3 niveles), código en español
- [ ] 10.4 Verificación final: revisar que las 6 guías + README cumplen los requisitos de `specs/cicd-professional-guide/spec.md` y `specs/cicd-profesional-readme-index/spec.md`

## 11. README wrap-up de graduación

- [ ] 11.1 Verificar que `profesional-README.md` incluye la sección de wrap-up/graduación que conecta los 4 niveles (Fundamentos → Intermedio → Avanzado → Profesional) en una ruta de maestría CI/CD coherente, con siguientes pasos para el lector graduado

## 12. Reconciliación con el repo real (limitaciones 2026-11-07)

> Hallazgos que bloquean o condicionan el resto del plan. Detalle en `proposal.md` §Limitaciones conocidas y
> `design.md` §Risks.

- [x] 12.1 **Renumeración decidida** (D10, 2026-11-07): las cinco guías pendientes pasan a `25-security-yml-sast-sca-sbom.md`,
      `26-scheduled-security-yml.md`, `27-dependabot-3-ecosistemas.md`, `28-mantenimiento-workflows.md` y
      `29-dora-metrics-performance-tuning.md`, conservando el orden relativo del plan y sin renombrar archivos publicados.
      Las tareas 2.x-6.x y los cross-links ya usan los números nuevos; `workflows-mantenimiento-guia.md` no se renombra
      (132 referencias).
- [ ] 12.2 Reemplazar en todo el cambio las referencias a `docs/cicd-estado-actual.md` y
      `docs/cicd-plan-implementacion.md` (inexistentes) por `docs/ci-cd-pipeline-empresarial.md` y
      `docs/CONTEXT-CICD.md`. Auditado 2026-11-07: proposal y specs ya corregidos; revisar las tareas 2.x-6.x al ejecutarlas.
- [ ] 12.3 Eliminar el "gap G18" de cualquier requisito o tarea (no existe en ninguna parte del repo) y, si se quiere un
      identificador de gap, definirlo contra la lista real de `docs/CONTEXT-CICD.md`.
- [ ] 12.4 Corregir en `profesional-README.md` los enlaces a docs inexistentes (`docs/cicd-estado-actual.md`,
      `docs/cicd-plan-implementacion.md`) y la afirmación "SLSA nivel 2-3" → Build L1.
- [ ] 12.5 Sustituir el conteo "9 workflows" del README y del nivel por la tabla de cuatro métricas (15/94/9/4) y anotar
      que cualquier número de workflows caduca, con la fuente `CONTEXT-CICD.md` §3.4.
- [ ] 12.6 Verificar en CI el gate de prosa `npm run docs:vale` sobre la guía 23 y el README (no ejecutable en local:
      vale no instalado). Registrar el resultado en la evidencia del change.
- [ ] 12.7 Revisar las URLs externas de las guías al publicarlas: la página VEX de CISA devolvió 404 y se descartó; sólo
      se admiten URLs ya presentes en la documentación del repo.
