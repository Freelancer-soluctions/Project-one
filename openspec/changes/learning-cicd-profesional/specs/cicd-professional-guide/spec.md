## Purpose

Define el contrato de contenido, estructura y estilo pedagógico de las 6 guías del nivel Profesional (18-23) de la ruta de aprendizaje de CI/CD, para que un desarrollador que completó los niveles Fundamentos, Intermedio y Avanzado alcance una práctica de CI/CD de nivel Staff: SecOps, mantenimiento, métricas DORA, SLSA y patrones enterprise.

## ADDED Requirements

### Requirement: Guías del nivel Profesional

El nivel Profesional SHALL contener exactamente 6 guías markdown en `docs/learning/ci-cd/`: `18-security-yml-sast-sca-sbom.md`, `19-scheduled-security-yml.md`, `20-dependabot-3-ecosistemas.md`, `21-mantenimiento-workflows.md`, `22-dora-metrics-performance-tuning.md` y `23-ci-enterprise-reference-pipeline.md`.

#### Scenario: Existen las 6 guías

- **WHEN** se inspecciona el directorio `docs/learning/ci-cd/`
- **THEN** existen los 6 archivos de guía con los nombres exactos especificados

#### Scenario: La numeración continúa a los niveles previos

- **WHEN** se listan los archivos del nivel Profesional
- **THEN** la numeración de las guías continúa la secuencia de los niveles Fundamentos (00-04), Intermedio (05-10) y Avanzado (11-17) con los números 18-23

#### Scenario: No hay guías fuera del nivel

- **WHEN** se listan los archivos del nivel Profesional
- **THEN** no existen guías de este nivel en otros directorios ni guías de otros niveles con numeración 18-23

### Requirement: Estructura obligatoria de cada guía

Cada guía SHALL seguir la estructura: objetivos de aprendizaje, prerequisitos (indicando que se debe haber completado los niveles Fundamentos 00-04, Intermedio 05-10 y Avanzado 11-17), sección de teoría desde cero, sección de walkthrough de la implementación real en el proyecto con snippets citando la ruta fuente, resumen y enlace a la siguiente guía.

#### Scenario: La guía abre con objetivos y prerequisitos

- **WHEN** se lee el inicio de cualquier guía del nivel
- **THEN** contiene una sección de objetivos de aprendizaje y una sección de prerequisitos antes del contenido teórico

#### Scenario: Los prerequisitos indican haber completado los tres niveles previos

- **WHEN** se lee la sección de prerequisitos
- **THEN** indica que el lector debe haber completado los niveles Fundamentos + Intermedio + Avanzado (y que se asume conocimiento de workflows, composite actions, caching, Husky, AWS CD con Floci/ECS/OIDC y Changesets)

#### Scenario: La guía conecta teoría con implementación real

- **WHEN** se recorre el cuerpo de la guía
- **THEN** contiene una sección de teoría desde cero y una sección de walkthrough que muestra la implementación real en el proyecto con snippets de código que citan la ruta fuente

#### Scenario: La guía cierra con resumen y navegación

- **WHEN** se lee el final de cualquier guía
- **THEN** contiene un resumen de lo aprendido y un enlace a la siguiente guía del nivel (o al índice profesional si es la última)

### Requirement: Contenido didáctico de 18-security-yml-sast-sca-sbom

La guía `18-security-yml-sast-sca-sbom.md` SHALL hacer un walkthrough profundo de `.github/workflows/security.yml` (5 jobs: dependency-scan, sast, secrets, sbom, dependency-review), introduciendo los conceptos de seguridad desde cero: SAST (CodeQL), SCA (Trivy), SBOM (Anchore), detección de secrets (Gitleaks) y Dependency Review.

#### Scenario: Introduce SAST desde cero

- **WHEN** un lector sin background de seguridad lee la guía
- **THEN** entiende qué es el Análisis Estático de Seguridad de Aplicaciones (SAST), en qué se diferencia de otros tipos de análisis, y cómo el job `sast` de `security.yml` lo implementa con CodeQL (`init@v4` + `analyze@v4`, `languages: javascript,actions`)

#### Scenario: Explica el autobuild comentado

- **WHEN** la guía trata el job `sast`
- **THEN** explica por qué `github/codeql-action/autobuild@v4` está comentado en `security.yml` y por qué se usa `npm ci` manual en su lugar (fiabilidad en monorepos con workspaces), citando la ruta fuente y `docs/workflows-mantenimiento-guia.md`

#### Scenario: Introduce SCA desde cero

- **WHEN** la guía trata la composición de software
- **THEN** explica qué es el Análisis de Composición de Software (SCA) y cómo el job `dependency-scan` usa Trivy (`aquasecurity/trivy-action@0.36.0`) con scan de filesystem, severidad CRITICAL/HIGH, `exit-code: '1'` (fail-closed), `ignore-unfixed: true` y subida de SARIF via `codeql-action/upload-sarif@v4` con `if: always()`

#### Scenario: Introduce SBOM desde cero

- **WHEN** la guía trata la lista de materiales de software
- **THEN** explica qué es un SBOM (Software Bill of Materials), por qué se genera en formato CycloneDX JSON con `anchore/sbom-action@v0.24.0`, y por qué el artifact se conserva 365 días (`retention-days: 365`)

#### Scenario: Explica la detección de secrets con Gitleaks

- **WHEN** la guía trata el job `secrets`
- **THEN** explica los dos pasos: Gitleaks OSS (`docker://zricethezav/gitleaks:v8.22.1`) con scan de diff del PR (`base.sha..head.sha`), y el licensed `gitleaks/gitleaks-action@v3` gated por `${{ secrets.GIT_LEAKS != '' }}`

#### Scenario: Cubre el gotcha del secret GIT_LEAKS

- **WHEN** la guía trata el secret opcional GIT_LEAKS
- **THEN** explica que si el secret no está configurado el licensed scan se salta silenciosamente con un warning (`::warning::`) sin fallar el job, y que el secret debe verificarse/rotarse trimestralmente (referenciando `docs/workflows-mantenimiento-guia.md`)

#### Scenario: Explica Dependency Review

- **WHEN** la guía trata el job `dependency-review`
- **THEN** explica qué hace `actions/dependency-review-action@v5` (diff de dependencias del PR, check de vulnerabilidades y licencias) y por qué corre solo en `pull_request`

#### Scenario: Explica la política de permisos del workflow

- **WHEN** la guía trata los permisos de `security.yml`
- **THEN** explica que `security-events: write` está presente en los workflows que suben SARIF (security.yml + scheduled-security.yml) Y en ci-enterprise.yml (excepción — workflow de referencia no-operacional; deberías notar esto como excepción/violación del 'mínimo privilegio'), y que security-digest.yml NO lo necesita (sube artifacts, no SARIF) — conectando con el principio de mínimo privilegio de `docs/workflows-mantenimiento-guia.md` sección 16

### Requirement: Contenido didáctico de 19-scheduled-security-yml

La guía `19-scheduled-security-yml.md` SHALL explicar la seguridad por cron: `.github/workflows/scheduled-security.yml` (Gitleaks full-history `--all` → JSON + SARIF + artifact con `if: always()`), `.github/workflows/security-digest.yml` (SBOM + OSV Scanner → digest markdown + comment opcional en PR) y los jobs `notify-failure`, presentando el modelo de seguridad de 3 niveles (pre-commit / PR / cron) como principio organizador.

#### Scenario: Explica el cron de scheduled-security

- **WHEN** la guía trata `scheduled-security.yml`
- **THEN** explica el disparador `cron: '0 3 * * 1'` (lunes 03:00 UTC), el checkout con `fetch-depth: 0`, el scan de Gitleaks full-history con `--log-opts="--all"`, la generación de reportes JSON y SARIF, y la subida con `if: always()` (artifact 30 días + Security tab)

#### Scenario: Explica el modelo de seguridad de 3 niveles

- **WHEN** la guía presenta el modelo de seguridad
- **THEN** explica los 3 niveles (pre-commit / PR / cron) con un diagrama mermaid, mostrando qué cubre cada uno y por qué se complementan (shifting left con red de seguridad por cron)

#### Scenario: Explica security-digest

- **WHEN** la guía trata `security-digest.yml`
- **THEN** explica el mismo cron, la generación de SBOM con `anchore/sbom-action@v0.24.0`, el escaneo con OSV Scanner (`google/osv-scanner-action@v2.5.0`), la generación del digest markdown con `scripts/security/generate-security-digest.mjs` y el comentario opcional en PR via input `pull_request_number` (solo si hay hallazgos CRITICAL/HIGH o DENY-LIST)

#### Scenario: Explica los jobs notify-failure

- **WHEN** la guía trata la notificación de fallos
- **THEN** explica los jobs `notify-failure` de ambos workflows (`needs` + `if: failure()` + `issues: write`) que crean issues en GitHub ante fallos de los scans programados, y por qué `issues: write` solo se concede aquí

#### Scenario: Explica la semántica fail-closed

- **WHEN** la guía trata la política de fallo
- **THEN** explica que `continue-on-error` fue removido (fail-closed) y el rol de `if: always()` en los uploads para no perder artefactos de diagnóstico aunque el scan falle

### Requirement: Contenido didáctico de 20-dependabot-3-ecosistemas

La guía `20-dependabot-3-ecosistemas.md` SHALL explicar la gestión de dependencias con Dependabot: `.github/dependabot.yml` con tres ecosistemas (npm, github-actions, docker), la rutina mensual de revisión y la importancia de Dependabot para evitar el drift de versions de actions.

#### Scenario: Explica los tres ecosistemas

- **WHEN** la guía trata `.github/dependabot.yml`
- **THEN** explica los tres ecosistemas configurados: npm (raíz, weekly lunes 03:00 UTC, grupos dev-deps minor/patch), github-actions (weekly, prefix `ci`) y docker (`apps/server`, weekly, prefix `ci`), citando el archivo real

#### Scenario: Explica la rutina mensual

- **WHEN** la guía trata la gestión rutinaria
- **THEN** explica la rutina mensual: revisar el cluster de PRs de Dependabot, batch-merge de patch+minor que pasan CI, evaluar major bumps por separado y respetar el ignore de majors de react/react-dom

#### Scenario: Explica la diferencia de cadencia npm vs github-actions

- **WHEN** la guía compara ecosistemas
- **THEN** explica por qué los updates de github-actions se priorizan (versiones de actions afectan seguridad del pipeline) y la diferencia de cadencia/riesgo frente a npm

#### Scenario: Explica por qué Dependabot evita el drift

- **WHEN** la guía trata el problema del drift
- **THEN** explica que sin Dependabot las actions se quedan stale (drift enumerado en `docs/workflows-mantenimiento-guia.md`), con el riesgo de CVEs no corregidos y breaking changes acumulados, y por qué Dependabot lo mitiga con PRs automáticos semanales

### Requirement: Contenido didáctico de 21-mantenimiento-workflows

La guía `21-mantenimiento-workflows.md` SHALL explicar la filosofía de mantenimiento de workflows ("los workflows son código y se pudren"), el `.nvmrc` como single source of truth, la política de `fetch-depth: 0` opt-in, la política de versionado de actions, el gotcha del timeout de bash 120s, el checklist trimestral y los anti-patrones.

#### Scenario: Explica la filosofía de mantenimiento

- **WHEN** un lector lee la guía
- **THEN** entiende que los workflows son código que se pudre (dependencias de terceros publican versiones nuevas, GitHub depreca APIs, los CVEs afectan actions viejas) y que el mantenimiento es parte del rol, citando `docs/workflows-mantenimiento-guia.md` sección 1

#### Scenario: Explica .nvmrc como single source of truth

- **WHEN** la guía trata el versionado de Node
- **THEN** explica que `.nvmrc` es la única fuente de verdad (leído por `node-version-file: '.nvmrc'` en 9 workflows + la composite action), usando el Caso 1 (EBADENGINE de omniroute@3.8.49, commit `cf5e1bb`) como ejemplo didáctico, y que NUNCA se debe editar `node-version:` workflow por workflow

#### Scenario: Explica la política fetch-depth opt-in

- **WHEN** la guía trata el checkout
- **THEN** explica que `fetch-depth: 0` es opt-in (solo cuando un step usa `git log`/`git diff` contra un SHA o un reporter como `dorny/test-reporter`), usando el Caso 2 (exit 128 del test-reporter) y por qué no se debe poner "por si acaso"

#### Scenario: Explica la política de versionado de actions

- **WHEN** la guía trata las versiones de third-party actions
- **THEN** explica la decisión del proyecto de usar tags versionados en lugar de SHA pinning (rechazado por coste de mantenimiento, con riesgo residual aceptado), gestionado por Dependabot github-actions weekly, citando `docs/workflows-mantenimiento-guia.md` sección 7

#### Scenario: Cubre el gotcha del timeout de bash 120s

- **WHEN** la guía trata los hooks locales
- **THEN** explica el gotcha del timeout por defecto de bash (120s) en `.husky/pre-commit` (commits `cf5e1bb` y `32d35a8`) y la mitigación (`timeout 600 bash -c "git commit ..."`)

#### Scenario: Presenta el checklist trimestral

- **WHEN** la guía trata el mantenimiento periódico
- **THEN** presenta el checklist de mantenimiento trimestral (11 items de la sección 17 de `docs/workflows-mantenimiento-guia.md`): auditoría de actions, `.nvmrc` vs security releases, engines floors, fetch-depth, `act` local, Dependabot, runs fallidos, security workflows, imágenes Docker, rotation de secrets y documentación de nuevos casos

#### Scenario: Enumera los anti-patrones

- **WHEN** la guía trata lo que NO se debe hacer
- **THEN** enumera los anti-patrones: editar `.nvmrc` workflow por workflow, pins de engines en package.json, `fetch-depth: 0` "por si acaso" y combinar bump+workflow en un mismo commit (sección 18 de `docs/workflows-mantenimiento-guia.md`)

### Requirement: Contenido didáctico de 22-dora-metrics-performance-tuning

La guía `22-dora-metrics-performance-tuning.md` SHALL explicar las 4 métricas DORA (Deployment Frequency, Lead Time for Changes, Change Failure Rate, MTTR), los niveles SLSA (Supply-chain Levels for Software Artifacts) y las técnicas de performance tuning del pipeline.

#### Scenario: Explica las 4 métricas DORA

- **WHEN** un lector lee la guía
- **THEN** entiende las 4 métricas DORA (frecuencia de despliegue, lead time para cambios, tasa de fallos de cambio, tiempo medio de recuperación) con una tabla y cómo el pipeline del proyecto afecta a cada una, conectando con `docs/cicd-plan-implementacion.md` §12

#### Scenario: Explica SLSA desde cero

- **WHEN** la guía trata la cadena de suministro
- **THEN** explica qué es SLSA, sus niveles 1-4 y dónde se ubica el proyecto (nivel 2-3 vía provenance SBOM + OIDC + dependency review), referenciando `docs/cicd-plan-implementacion.md` §16 (Técnicas Avanzadas) + §2 Glosario y `docs/security/security-enterprise-guide.md`

#### Scenario: Explica el framing Staff-level

- **WHEN** la guía presenta DORA y SLSA
- **THEN** los presenta explícitamente como los conceptos que marcan la transición Senior → Staff en la práctica de CI/CD

#### Scenario: Explica el performance tuning

- **WHEN** la guía trata el rendimiento del pipeline
- **THEN** explica las técnicas: jobs paralelos, cache hit ratio (npm/Vitest/Playwright), path filtering (`dorny/paths-filter`) para saltar trabajo no usado, cancelación por `concurrency` y composite actions para deduplicar setup

#### Scenario: Introduce act para dry-run local

- **WHEN** la guía trata la optimización de coste
- **THEN** introduce `act` para ejecutar workflows localmente sin gastar minutos de GitHub Actions (ej. `act -j quality -W .github/workflows/quality.yml`), citando `docs/workflows-mantenimiento-guia.md` Apéndice A

### Requirement: Contenido didáctico de 23-ci-enterprise-reference-pipeline

La guía `23-ci-enterprise-reference-pipeline.md` SHALL explicar qué separa el CI/CD del proyecto de un pipeline enterprise de referencia: SLSA Level 3, VEX, escaneo de IaC, `ci-enterprise.yml` como referencia didáctica y future-proofing.

#### Scenario: Compara el proyecto con un pipeline enterprise

- **WHEN** la guía compara pipelines
- **THEN** presenta una tabla que contrasta los 9 workflows del proyecto con un pipeline enterprise hipotético de 30+ jobs, explicando qué añade cada diferencia (seguridad, observabilidad, compliance)

#### Scenario: Explica SLSA Level 3

- **WHEN** la guía trata SLSA Level 3
- **THEN** explica los requisitos de nivel 3 (provenance firmada, builds hermetic, entornos de build aislados) y qué le falta al proyecto para alcanzarlo, referenciando `docs/cicd-plan-implementacion.md` y `docs/security/security-enterprise-guide.md`

#### Scenario: Explica VEX

- **WHEN** la guía trata VEX
- **THEN** explica qué es VEX (Vulnerability Exploitability Exchange), cómo comunica si una vulnerabilidad es explotable en el contexto del proyecto, enumera los 4 statuses del estándar VEX (not_affected, affected, fixed, under_investigation — no solo 2), y su relación con el SBOM (gap G18 de `docs/cicd-plan-implementacion.md` §19.2.3)

#### Scenario: Explica el escaneo de IaC

- **WHEN** la guía trata IaC
- **THEN** explica el escaneo de infraestructura como código (Terraform en CI), identifica que el proyecto no tiene Terraform aún (gap, job `iac-security` comentado en `security.yml`) y referencia `docs/aws-deploy-architecture.md` como material de referencia

#### Scenario: Presenta ci-enterprise.yml como referencia didáctica

- **WHEN** la guía trata `ci-enterprise.yml`
- **THEN** lo presenta explícitamente como herramienta de enseñanza (qué es un pipeline de 30+ jobs), aclarando que los paths `frontend/` y `backend/` NO existen en este monorepo (cache miss garantizado, gap A3 de `docs/cicd-estado-actual.md`) y que NO es un workflow operativo aquí

#### Scenario: Muestra el version drift de ci-enterprise.yml

- **WHEN** la guía cubre ci-enterprise.yml
- **THEN** menciona que este workflow usa versiones más antiguas que los workflows operacionales (`setup-node@v4` vs `setup-node@v5` en otros; `codeql@v3` vs `codeql@v4`) — un buen ejemplo de version drift en pipelines enterprise de referencia

#### Scenario: Explica el future-proofing

- **WHEN** la guía trata la evolución del pipeline
- **THEN** explica las direcciones futuras: orquestación de contenedores (Kubernetes/EKS), canary deploys, feature flags y OpenTelemetry, referenciando `docs/cicd-plan-implementacion.md` y `docs/aws-deploy-architecture.md`

### Requirement: Estilo didáctico y formato

Las guías SHALL usar español, tono de enseñanza de nivel profesional, tablas markdown para comparaciones, diagramas mermaid para flujos (especialmente el modelo de seguridad de 3 niveles), bloques de código con snippets reales citando la ruta fuente, y una extensión de 800-1500 líneas por archivo.

#### Scenario: Las guías están en español

- **WHEN** se lee cualquier guía del nivel
- **THEN** el contenido está escrito en español siguiendo la convención del proyecto

#### Scenario: Usan tablas y diagramas

- **WHEN** la guía presenta comparaciones o flujos
- **THEN** usa tablas markdown para comparaciones y diagramas mermaid para flujos, incluyendo un diagrama mermaid del modelo de seguridad de 3 niveles en la guía 19

#### Scenario: Los snippets citan su fuente

- **WHEN** la guía incluye un snippet de código del proyecto
- **THEN** el bloque de código indica la ruta del archivo fuente (p. ej. `.github/workflows/security.yml`, `.github/dependabot.yml`)

#### Scenario: Extensión dentro del rango

- **WHEN** se mide la extensión de cada guía
- **THEN** cada archivo tiene entre 800 y 1500 líneas

### Requirement: Sin duplicación de documentación existente

Las guías SHALL referenciar con enlaces la documentación existente (`docs/workflows-mantenimiento-guia.md` con uso intensivo, `docs/cicd-estado-actual.md`, `docs/cicd-plan-implementacion.md`, `docs/aws-*.md`) en lugar de copiar su contenido.

#### Scenario: Se enlaza en lugar de copiar

- **WHEN** una guía necesita contenido que ya existe en `docs/cicd-*.md`, `docs/workflows-mantenimiento-guia.md` o docs de AWS
- **THEN** enlaza al documento existente en lugar de duplicar el contenido

#### Scenario: Los enlaces cruzados funcionan

- **WHEN** se validan los enlaces entre guías del nivel y hacia `docs/`
- **THEN** todas las rutas relativas apuntan a archivos existentes
