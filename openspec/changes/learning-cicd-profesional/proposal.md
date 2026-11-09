## Why

Un desarrollador que completó los niveles Fundamentos (00-04), Intermedio (05-10) y Avanzado (11-17) ya sabe escribir y modificar workflows, dominar Husky, composite actions, caching, y desplegar a AWS con Floci + ECS + OIDC + Changesets. Pero **todavía no piensa como dueño de un pipeline de producción**: no conoce la familia SAST/SCA/SBOM en profundidad, no gestiona Dependabot de forma rutinaria, no tiene una filosofía de mantenimiento de workflows ("el código se pudre"), y no conoce los marcos que separan a un Senior de un Staff (DORA, SLSA, VEX). La documentación técnica existente (`docs/ci-cd-pipeline-empresarial.md` §25 supply chain / §26 DORA, `docs/CONTEXT-CICD.md` §3.4/§5.9 inventario, `docs/learning/ci-cd/workflows-mantenimiento-guia.md`) es de referencia y asume conocimientos; sin este nivel el lector se queda en "puedo operar el CI" y no alcanza el objetivo Staff: **"diseño, aseguro, mido y mantengo el pipeline como un activo de producción"**.

## What Changes

- Crear el nivel **Profesional** (final) de la ruta de aprendizaje incremental de CI/CD en `docs/learning/ci-cd/`, continuando la numeración de los niveles previos (00-04 Fundamentos, 05-10 Intermedio, 11-17 Avanzado). Las guías pendientes de este nivel se numeran **25-29** (decisión D10, `design.md`): la 23 misma ya está publicada, y 18-22 y 24 pertenecen a otros cambios.
- `profesional-README.md`: índice del nivel Profesional (archivo separado, siguiendo la convención de `intermedio-README.md`), con objetivos del nivel, prerequisitos ("completado Fundamentos + Intermedio + Avanzado"), mapa de navegación **18-29**, y una **sección final de wrap-up/graduación** que conecta los 4 niveles en una ruta de maestría CI/CD coherente (Junior → Staff).
- `25-security-yml-sast-sca-sbom.md`: walkthrough profundo de `.github/workflows/security.yml` (5 jobs: dependency-scan/sast/secrets/sbom/dependency-review). Conceptos de seguridad introducidos **desde cero**: SAST (CodeQL `init@v4` + `analyze@v4`, `languages: javascript,actions`, autobuild comentado → `npm ci` manual por ser monorepo), SCA (Trivy `aquasecurity/trivy-action@0.36.0`, filesystem scan, severidad CRITICAL/HIGH, `exit-code: '1'` fail-closed, SARIF via `codeql-action/upload-sarif@v4`), SBOM (`anchore/sbom-action@v0.24.0`, CycloneDX JSON, artifact 365 días), detección de secrets con Gitleaks (OSS `docker://zricethezav/gitleaks:v8.22.1` + licensed `gitleaks/gitleaks-action@v3` gated por `${{ secrets.GIT_LEAKS }}`), Dependency Review (`actions/dependency-review-action@v5`). Incluye el gotcha del secret opcional GIT_LEAKS (warning + skip silencioso) y la política de permisos: `security-events: write` presente en los workflows que suben SARIF (security.yml + scheduled-security.yml) Y en ci-enterprise.yml (excepción — workflow de referencia no-operacional; notarlo como excepción/violación del 'mínimo privilegio'); security-digest.yml NO lo necesita (sube artifacts, no SARIF).
- `26-scheduled-security-yml.md`: seguridad por cron. `.github/workflows/scheduled-security.yml` (lunes 03:00 UTC, gitleaks full-history `--all` → JSON + SARIF + artifact con `if: always()`) y `.github/workflows/security-digest.yml` (mismo cron, SBOM + OSV Scanner `google/osv-scanner-action@v2.5.0` → digest markdown + comment opcional en PR via input `pull_request_number`). Jobs `notify-failure` (crean issues, `issues: write` solo aquí). Semántica fail-closed (`continue-on-error` removido). **El modelo de seguridad de 3 niveles: pre-commit / PR / cron (shifting left)** como principio organizador central.
- `27-dependabot-3-ecosistemas.md`: Dependabot en profundidad. `.github/dependabot.yml` (auditado agosto 2026): tres ecosistemas — npm (raíz, weekly lunes 03:00 UTC, grupos dev-deps minor/patch), github-actions (weekly, prefix `ci`), docker (`apps/server`, weekly, prefix `ci`). Rutina mensual: revisar cluster de PRs, batch-merge patch+minor, evaluar major aparte, ignore de majors react/react-dom. Diferencia de cadencia npm vs github-actions. Por qué Dependabot evita que el repo se quede con actions stale (problema de drift enumerado en `docs/workflows-mantenimiento-guia.md`).
- `28-mantenimiento-workflows.md`: filosofía de mantenimiento "**los workflows son código y se pudren**". `.nvmrc` como single source of truth — nunca editar `node-version:` workflow por workflow (Caso 1 EBADENGINE con omniroute@3.8.49). `fetch-depth: 0` opt-in, no default (Caso 2 dorny/test-reporter). Política de versionado de actions: tags vs SHA pinning (decisión: tags + Dependabot gana). Gotcha del timeout de bash 120s en pre-commit. Checklist de mantenimiento trimestral (11 items de la sección 17 de `docs/workflows-mantenimiento-guia.md`). Anti-patrones: editar `.nvmrc` workflow por workflow, pins en engines de package.json, `fetch-depth: 0` "por si acaso", combinar bump+workflow en un commit.
- `29-dora-metrics-performance-tuning.md`: métricas DORA en profundidad — Deployment Frequency, Lead Time for Changes, Change Failure Rate, MTTR — y cómo el pipeline afecta cada una. SLSA (Supply-chain Levels for Software Artifacts) niveles 1-4 y dónde se ubica el proyecto (**Build L1**: SBOM + dependency review, sin provenance firmada; ver corrección en §Limitaciones). Performance tuning: jobs paralelos, cache hit ratio, path filtering para saltar trabajo no usado, cancelación por concurrency, composite actions para deduplicar setup, y `act` para dry-run local sin gastar minutos de GitHub Actions.
- `23-ci-enterprise-reference-pipeline.md` (**implementada 2026-11-07**, 469 líneas): qué capacidades —no cuántos jobs— separan el CI/CD del proyecto de un pipeline enterprise. Las cuatro métricas de escala que se confunden en una, con valores verificados (15 archivos en `.github/workflows/`, 94 definiciones de job, 57 en `ci.yml` con 16 `if: false`, 9 workflows activos en el registro, 4 required checks): la comparación "9 workflows vs 30+ jobs" queda descartada por obsoleta. Los 14 stages del pipeline genérico (`docs/ci-cd-pipeline-empresarial.md` §2.3) frente a lo que el repo cubre hoy. SLSA Build L1-L4, posición real del proyecto (**Build L1**: hay SBOM CycloneDX y dependency review, **no** hay provenance firmada — 0 resultados de `attest|cosign|provenance|sigstore` en workflows) y requisitos de L3 que faltan. VEX: los 4 statuses y por qué `ignore-unfixed: 'true'` de Trivy es una política implícita, no VEX. Escaneo de IaC: **existe** como job `checkov-iac` en `ci.yml` (advisory, `soft_fail: true` + `continue-on-error: true`, FASE 2 planificada y sin baseline en el repo), no como job comentado en `security.yml`. `ci-enterprise.yml` **retirado del repo** (no existe ni está en el registro): la guía lo estudia por los snippets supervivientes de las guías 02 §7.1 y 09 §6 y documenta sus cinco anti-patrones de portabilidad. Future-proofing con criterio coste/beneficio (attestations y OpenTelemetry antes que Kubernetes/canary en un repo sin entornos definidos).
- **No se modifica código de aplicación ni workflows**: es documentación didáctica nueva. No se duplica `docs/ci-cd-pipeline-empresarial.md`, `docs/CONTEXT-CICD.md`, `docs/learning/ci-cd/workflows-mantenimiento-guia.md`, `docs/security/security-enterprise-guide.md` ni `docs/aws-*.md` — se enlazan (link, no copy), con snippets cortos citando la ruta fuente.

## Capabilities

### New Capabilities

- `cicd-professional-guide`: Guía didáctica de nivel Profesional con **seis archivos con nombre fijado**: `23-ci-enterprise-reference-pipeline.md` (publicada) y `25-security-yml-sast-sca-sbom.md`, `26-scheduled-security-yml.md`, `27-dependabot-3-ecosistemas.md`, `28-mantenimiento-workflows.md`, `29-dora-metrics-performance-tuning.md` (planificadas). Estructura pedagógica obligatoria (objetivos de aprendizaje, prerequisitos "completado Fundamentos + Intermedio + Avanzado", teoría primero desde cero para conceptos de seguridad SAST/SCA/SBOM/SLSA/VEX → walkthrough de la implementación real con snippets citando la ruta fuente, resumen y enlace a la siguiente guía), en español, 800-1500 líneas por guía, con tablas y diagramas mermaid (especialmente el modelo de seguridad de 3 niveles), framing Staff-level (SLSA/DORA/VEX como marcadores de la transición Senior → Staff), y cross-references a `docs/workflows-mantenimiento-guia.md` (uso intensivo), `docs/cicd-estado-actual.md` y `docs/cicd-plan-implementacion.md`.
- `cicd-profesional-readme-index`: Archivo `profesional-README.md` índice del nivel Profesional con objetivos del nivel, prerequisitos, navegación entre las guías del nivel (18-29, incluidas las de otros cambios), enlace de vuelta al nivel Avanzado, referencias a la documentación técnica existente, y la **sección de wrap-up de la ruta de 4 niveles** (Fundamentos → Intermedio → Avanzado → Profesional) que actúa como ceremonia de graduación y conecta toda la ruta en un camino de maestría CI/CD.

### Modified Capabilities

<!-- Ninguna: no cambian requisitos de capacidades existentes. Es documentación nueva. -->

## Limitaciones conocidas (2026-11-07)

Hallazgos de la implementación de la guía 23 y de la verificación del repo. Cada uno limita lo que este cambio puede afirmar;
los artefactos se ajustaron a lo verificado, no al plan original.

1. **Documentación de referencia inexistente.** `docs/cicd-estado-actual.md` y `docs/cicd-plan-implementacion.md` **no
   existen** en el repo, pese a citarse en el plan (§12 DORA, §16 SLSA, §19.2.3 gap G18, Stage 4/6) y en el README del nivel.
   Sustitutos reales: `docs/ci-cd-pipeline-empresarial.md`, `docs/CONTEXT-CICD.md`, `docs/security/security-enterprise-guide.md`.
2. **Ruta de la guía de mantenimiento.** `docs/workflows-mantenimiento-guia.md` no existe; el archivo real es
   `docs/learning/ci-cd/workflows-mantenimiento-guia.md`.
3. **`ci-enterprise.yml` retirado, no "interno".** El workflow no existe ni está en el registro de GitHub Actions; se
   estudia sólo por snippets (guías 02/09). Cualquier tarea que lo trate como "no operativo pero presente" es incorrecta.
4. **Colisión de numeración (resuelta).** Las guías 18-21 son la serie governance/review ya escrita, `22-rulesets-guide.md`
   y `24-dag-infraestructura.md` también existen. Sólo el número 23 estaba libre. Decisión D10: las guías pendientes se
   renumeran a **25-29** (`25` security.yml, `26` cron, `27` Dependabot, `28` mantenimiento, `29` DORA), conservando su
   orden relativo y sin renombrar ningún archivo publicado.
5. **Conteos del plan obsoletos.** "9 workflows", "12 pre-cleanup → 3 zombies" y "30+ jobs" no son verificables hoy
   (15 archivos / 94 jobs / 9 activos). Los números que sobreviven son los medidos, no los recordados.
6. **SLSA sobrevalorado.** El plan situaba el proyecto en "nivel 2-3"; sin attestations ni cosign es **Build L1**.
7. **IaC mal descrito.** No hay job `iac-security` comentado en `security.yml`; el escaneo vive en `ci.yml` como
   `checkov-iac` (advisory) y la FASE 2 (baseline `.checkov.baseline`) no está implementada.
8. **Verificación local incompleta.** `npm run docs:vale` no puede ejecutarse en este entorno (vale no instalado), así que el
   gate de prosa (`docs:vale`) **no** se validó localmente; sí `npm run docs:lint` (markdownlint) y `prettier --check`.
   Además, la fuente CISA de VEX se descartó por URL muerta (404) y sólo se citan URLs ya usadas en el repo.

**Consecuencia sobre el plan**: la guía 23 está entregada y el README ya refleja el estado real (qué guías están
publicadas y cuáles planificadas, sin enlaces a archivos inexistentes). Las cinco guías restantes conservan su contenido
pero cambian de número (**25-29**) y de fuentes de referencia; pueden escribirse sin más bloqueos. Ver `tasks.md` §12.

## Impact

- **Nuevos archivos**: 1 creado — `23-ci-enterprise-reference-pipeline.md`. Planificados: `25-security-yml-sast-sca-sbom.md`,
  `26-scheduled-security-yml.md`, `27-dependabot-3-ecosistemas.md`, `28-mantenimiento-workflows.md`,
  `29-dora-metrics-performance-tuning.md`. El plan preveía 7 archivos en total (README + 6 guías), pero el README **ya
  existía** y la numeración 18-22 estaba ocupada.
- **Archivos existentes actualizados**: `profesional-README.md` (renumeración a 25-29, estado de cada guía, enlaces a
  documentos reales, métricas de escala verificadas y SLSA Build L1).
- **Sin impacto en código**: no se tocan `apps/`, `.github/workflows/`, `.github/actions/`, `.husky/`, `.github/dependabot.yml`, ni dependencias.
- **Referencias (solo lectura)**: `.github/workflows/security.yml`, `.github/workflows/scheduled-security.yml`, `.github/workflows/security-digest.yml`, `.github/workflows/ci.yml` (job `checkov-iac`), `.github/dependabot.yml`, `docs/learning/ci-cd/workflows-mantenimiento-guia.md`, `docs/ci-cd-pipeline-empresarial.md`, `docs/CONTEXT-CICD.md`, `docs/security/security-enterprise-guide.md`, `docs/aws-deploy-architecture.md`, `docs/aws-cd-learning-path.md`, `scripts/security/generate-security-digest.mjs`, `openspec/changes/learning-cicd-fundamentos/`, `openspec/changes/learning-cicd-intermedio/`, `openspec/changes/learning-cicd-avanzado/`.
- **Convención**: documentación en español (convención del proyecto), 800-1500 líneas por archivo, tablas markdown, diagramas mermaid, bloques de código con snippets reales citando la ruta fuente, cross-references entre guías y a los docs existentes.
