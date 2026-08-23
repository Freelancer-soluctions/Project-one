# Tasks

## 1. Setup del nivel Profesional

- [ ] 1.1 Crear `docs/learning/ci-cd/profesional-README.md` con: índice del nivel (README + 6 guías 18-23 con descripción breve y orden de lectura), prerequisitos ("completado Fundamentos + Intermedio + Avanzado"), objetivos de aprendizaje del nivel, enlace de vuelta al nivel Avanzado, cross-links a la documentación técnica, y la sección de wrap-up/graduación de la ruta de 4 niveles

## 2. Guía: security.yml — SAST / SCA / SBOM

- [ ] 2.1 Escribir `docs/learning/ci-cd/18-security-yml-sast-sca-sbom.md` con objetivos de aprendizaje y prerequisitos (completado Fundamentos + Intermedio + Avanzado)
- [ ] 2.2 Introducir la taxonomía de seguridad desde cero: SAST vs SCA vs SBOM vs secrets detection vs dependency review (tabla comparativa)
- [ ] 2.3 Presentar el workflow `security.yml` completo: 5 jobs (dependency-scan/sast/secrets/sbom/dependency-review), triggers (workflow_call, pull_request, push), concurrency y permissions
- [ ] 2.4 Explicar el job `sast` (SAST): CodeQL `init@v4` + `analyze@v4`, `languages: javascript,actions`, autobuild comentado → `npm ci` manual (monorepo con workspaces)
- [ ] 2.5 Explicar el job `dependency-scan` (SCA): Trivy `aquasecurity/trivy-action@0.36.0`, scan fs, severity CRITICAL/HIGH, `exit-code: '1'` (fail-closed), `ignore-unfixed: true`, SARIF upload via `codeql-action/upload-sarif@v4` con `if: always()`
- [ ] 2.6 Explicar el job `sbom`: `anchore/sbom-action@v0.24.0`, formato CycloneDX JSON, artifact con `retention-days: 365` e `if-no-files-found: error`
- [ ] 2.7 Explicar el job `secrets`: Gitleaks OSS (`docker://zricethezav/gitleaks:v8.22.1`) diff scan (`base.sha..head.sha`) + licensed (`gitleaks/gitleaks-action@v3`) gated por `${{ secrets.GIT_LEAKS }}` + gotcha del warning/skip silencioso
- [ ] 2.8 Explicar el job `dependency-review`: `actions/dependency-review-action@v5` (vuln + license check en PR)
- [ ] 2.9 Explicar el modelo de permisos: `security-events: write` está presente en los workflows que suben SARIF (security.yml + scheduled-security.yml) Y en ci-enterprise.yml (excepción — workflow de referencia no-operacional; notarlo como excepción/violación del 'mínimo privilegio'); security-digest.yml NO lo necesita (sube artifacts, no SARIF)
- [ ] 2.10 Cerrar con resumen y enlace a `19-scheduled-security-yml.md`

## 3. Guía: Seguridad programada (cron)

- [ ] 3.1 Escribir `docs/learning/ci-cd/19-scheduled-security-yml.md` con objetivos de aprendizaje y prerequisitos
- [ ] 3.2 Explicar el modelo de seguridad de 3 niveles (pre-commit / PR / cron) como principio organizador con diagrama mermaid
- [ ] 3.3 Desglosar `scheduled-security.yml`: cron `0 3 * * 1` (Mon 03:00 UTC), checkout `fetch-depth: 0`, Gitleaks full-history `--log-opts="--all"` → JSON + SARIF, uploads con `if: always()` (artifact 30 días + Security tab)
- [ ] 3.4 Desglosar `security-digest.yml`: mismo cron, SBOM (`anchore/sbom-action@v0.24.0`), OSV Scanner (`google/osv-scanner-action@v2.5.0`), generación de digest con `scripts/security/generate-security-digest.mjs`, comment opcional en PR via input `pull_request_number` (solo si CRITICAL/HIGH/DENY-LIST)
- [ ] 3.5 Explicar los jobs `notify-failure` (needs + `if: failure()` + `issues: write` solo aquí) que crean issues en fallo
- [ ] 3.6 Explicar la semántica fail-closed (`continue-on-error` removido) y el rol de `if: always()` en uploads
- [ ] 3.7 Cerrar con resumen y enlace a `20-dependabot-3-ecosistemas.md`

## 4. Guía: Dependabot — 3 ecosistemas

- [ ] 4.1 Escribir `docs/learning/ci-cd/20-dependabot-3-ecosistemas.md` con objetivos de aprendizaje y prerequisitos
- [ ] 4.2 Explicar el concepto de Dependabot (PRs automáticos de dependencias) y su rol en la cadena de suministro
- [ ] 4.3 Desglosar `.github/dependabot.yml`: ecosistema npm (raíz, weekly lunes 03:00 UTC, grupos dev-deps minor/patch)
- [ ] 4.4 Desglosar los ecosistemas github-actions (weekly, prefix `ci`) y docker (`apps/server`, weekly, prefix `ci`)
- [ ] 4.5 Explicar la diferencia de cadencia npm vs github-actions (por qué las actions se priorizan)
- [ ] 4.6 Explicar la rutina mensual: revisar cluster de PRs, batch-merge patch+minor que pasan CI, evaluar major aparte, respetar ignore de majors react/react-dom
- [ ] 4.7 Explicar por qué Dependabot evita el drift de actions (problema enumerado en `docs/workflows-mantenimiento-guia.md`) y qué pasa si `dependabot.yml` desaparece
- [ ] 4.8 Cerrar con resumen y enlace a `21-mantenimiento-workflows.md`

## 5. Guía: Mantenimiento de workflows

- [ ] 5.1 Escribir `docs/learning/ci-cd/21-mantenimiento-workflows.md` con objetivos de aprendizaje y prerequisitos
- [ ] 5.2 Explicar la filosofía "los workflows son código y se pudren" (`docs/workflows-mantenimiento-guia.md` sección 1)
- [ ] 5.3 Explicar `.nvmrc` como single source of truth con el Caso 1 (EBADENGINE omniroute@3.8.49, commit `cf5e1bb`) y la propagación atómica a 9 workflows + composite
- [ ] 5.4 Explicar la regla `fetch-depth: 0` opt-in con el Caso 2 (dorny/test-reporter exit 128) y los anti-patrones asociados
- [ ] 5.5 Explicar la política de versionado de actions: tags vs SHA pinning (decisión: tags + Dependabot gana, riesgo residual aceptado)
- [ ] 5.6 Explicar el gotcha del timeout de bash 120s en `.husky/pre-commit` (commits `cf5e1bb` y `32d35a8`) y la mitigación (`timeout 600 bash -c "git commit ..."`)
- [ ] 5.7 Presentar el checklist de mantenimiento trimestral (11 items de la sección 17 de `docs/workflows-mantenimiento-guia.md`)
- [ ] 5.8 Enumerar los anti-patrones: editar `.nvmrc` workflow por workflow, engines floors en package.json, `fetch-depth: 0` "por si acaso", combinar bump+workflow en un commit
- [ ] 5.9 Cerrar con resumen y enlace a `22-dora-metrics-performance-tuning.md`

## 6. Guía: Métricas DORA y performance tuning

- [ ] 6.1 Escribir `docs/learning/ci-cd/22-dora-metrics-performance-tuning.md` con objetivos de aprendizaje y prerequisitos
- [ ] 6.2 Explicar las 4 métricas DORA (Deployment Frequency, Lead Time for Changes, Change Failure Rate, MTTR) en tabla y cómo el pipeline del proyecto afecta cada una (conectar `docs/cicd-plan-implementacion.md` §12)
- [ ] 6.3 Explicar SLSA desde cero: niveles 1-4 y dónde se ubica el proyecto (nivel 2-3 vía provenance SBOM + OIDC + dependency review), referenciando `docs/cicd-plan-implementacion.md` §16 (Técnicas Avanzadas) + §2 Glosario
- [ ] 6.4 Presentar DORA y SLSA con framing Staff-level (marcadores de la transición Senior → Staff)
- [ ] 6.5 Explicar performance tuning: jobs paralelos, cache hit ratio (npm/Vitest/Playwright), path filtering (`dorny/paths-filter`), cancelación por `concurrency`, composite actions para deduplicar setup
- [ ] 6.6 Introducir `act` para dry-run local sin gastar minutos de GitHub Actions (ej. `act -j quality -W .github/workflows/quality.yml`)
- [ ] 6.7 Cerrar con resumen y enlace a `23-ci-enterprise-reference-pipeline.md`

## 7. Guía: Pipeline enterprise de referencia

- [ ] 7.1 Escribir `docs/learning/ci-cd/23-ci-enterprise-reference-pipeline.md` con objetivos de aprendizaje y prerequisitos
- [ ] 7.2 Comparar el proyecto (9 workflows) con un pipeline enterprise de 30+ jobs (tabla: seguridad, observabilidad, compliance, escalabilidad) — explicar el drift: 12 pre-cleanup Aug 2026 → 3 zombies eliminados (pr-validation, lint, formatter) → 9 workflows hoy; este es un ejemplo de por qué siempre verificar conteos contra el filesystem real, no contra doc secundaria
- [ ] 7.3 Explicar SLSA Level 3: provenance firmada, builds hermetic, entornos de build aislados, y qué le falta al proyecto (referenciar `docs/cicd-plan-implementacion.md` y `docs/security/security-enterprise-guide.md`)
- [ ] 7.4 Explicar VEX (Vulnerability Exploitability Exchange): comunicar si una vuln es explotable, enumerar los 4 statuses del estándar (not_affected, affected, fixed, under_investigation), relación con SBOM (gap G18 de `docs/cicd-plan-implementacion.md` §19.2.3)
- [ ] 7.5 Explicar el escaneo de IaC (Terraform en CI): el gap del proyecto (job `iac-security` comentado en `security.yml`), referencia `docs/aws-deploy-architecture.md`
- [ ] 7.6 Presentar `ci-enterprise.yml` como pipeline de referencia didáctico: paths `frontend/`/`backend/` inexistentes, cache miss garantizado (gap A3 de `docs/cicd-estado-actual.md`), NO operativo en este monorepo
- [ ] 7.7 Explicar future-proofing: Kubernetes/EKS, canary deploys, feature flags, OpenTelemetry (referenciar `docs/cicd-plan-implementacion.md` y `docs/aws-deploy-architecture.md`)
- [ ] 7.8 Cerrar con resumen y enlace al `profesional-README.md` (última guía del nivel)

## 8. Verificación de cross-references

- [ ] 8.1 Verificar que las guías 18-23 enlazan correctamente entre sí (anterior/siguiente/README profesional)
- [ ] 8.2 Verificar enlaces de vuelta al nivel Avanzado (guías 11-17 / `avanzado-README.md`) y a los niveles previos
- [ ] 8.3 Verificar que los enlaces relativos a `docs/` y `.github/` apuntan a archivos existentes
- [ ] 8.4 Verificar que los snippets citados existen en las rutas indicadas (security.yml, scheduled-security.yml, security-digest.yml, dependabot.yml, ci-enterprise.yml)

## 9. Verificación de anti-duplicación

- [ ] 9.1 Verificar que ninguna guía copia secciones enteras (>40 líneas) de `docs/workflows-mantenimiento-guia.md` — deben enlazar (uso intensivo como fuente, no como copia)
- [ ] 9.2 Verificar que no se duplica `docs/cicd-estado-actual.md` (Stage 4/6) ni `docs/cicd-plan-implementacion.md` (§12 DORA, §16 SLSA + §2 Glosario, §19.2.3 G18 VEX) — enlazar + resumir
- [ ] 9.3 Verificar que los snippets cortos (<40 líneas) citan la ruta fuente
- [ ] 9.4 Verificar que el contenido didáctico (explicaciones desde cero de SAST/SCA/SBOM/SLSA/VEX) es original de las guías y no duplica la documentación técnica

## 10. Control de calidad markdown

- [ ] 10.1 Verificar que los 7 archivos tienen entre 800 y 1500 líneas cada uno (profesional-README.md y 6 guías)
- [ ] 10.2 Verificar que todas las guías tienen secciones de objetivos de aprendizaje y prerequisitos ("completed Fundamentos + Intermedio + Avanzado levels")
- [ ] 10.3 Verificar formato markdown válido: tablas bien formadas, diagramas mermaid sin errores de sintaxis (incluido el mermaid del modelo de seguridad de 3 niveles), código en español
- [ ] 10.4 Verificación final: revisar que las 6 guías + README cumplen los requisitos de `specs/cicd-professional-guide/spec.md` y `specs/cicd-profesional-readme-index/spec.md`

## 11. README wrap-up de graduación

- [ ] 11.1 Verificar que `profesional-README.md` incluye la sección de wrap-up/graduación que conecta los 4 niveles (Fundamentos → Intermedio → Avanzado → Profesional) en una ruta de maestría CI/CD coherente, con siguientes pasos para el lector graduado
