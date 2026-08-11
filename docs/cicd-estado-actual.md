# Estado actual de CI/CD del sistema

> Documento técnico exhaustivo de la implementación de Integración Continua (CI) y Despliegue Continuo (CD)
> del monorepo **Project One**.
> Audiencia: dual — resumen ejecutivo no-técnico + detalle técnico profundo.
> Última actualización: **agosto 2026** — **reemplaza completamente la versión previa** (julio 2026) que describía el estado _antes_ de la implementación (CD inexistente, tests ausentes en CI).

---

## Tabla de contenidos

1. [Resumen ejecutivo (para no técnicos)](#1-resumen-ejecutivo-para-no-técnicos)
2. [Glosario de términos](#2-glosario-de-términos)
3. [Estado actual de CI/CD de un vistazo (tabla resumen)](#3-estado-actual-de-cicd-de-un-vistazo-tabla-resumen)
4. [Mapa del pipeline — Diagrama Mermaid del flujo completo del PR al deploy](#4-mapa-del-pipeline--diagrama-mermaid-del-flujo-completo-del-pr-al-deploy)
5. [Stage 1 — Source / Código (Pre-commit local)](#5-stage-1--source--código-pre-commit-local)
6. [Stage 2 — Build (Construcción)](#6-stage-2--build-construcción)
7. [Stage 3 — Test (Pruebas)](#7-stage-3--test-pruebas)
8. [Stage 4 — Security (Seguridad en el pipeline)](#8-stage-4--security-seguridad-en-el-pipeline)
9. [Workflow reutilizable quality.yml (cross-cutting)](#9-workflow-reutilizable-qualityyml-cross-cutting)
10. [Stage 5 — Deploy (Despliegue)](#10-stage-5--deploy-despliegue)
11. [Stage 6 — Operate & Monitor (Operación y monitoreo)](#11-stage-6--operate--monitor-operación-y-monitoreo)
12. [Técnicas aplicadas (recopilación de patrones)](#12-técnicas-aplicadas-recopilación-de-patrones)
13. [Herramientas y tecnologías (tabla)](#13-herramientas-y-tecnologías-tabla)
14. [Secretos y variables requeridos (tabla)](#14-secretos-y-variables-requeridos-tabla)
15. [Cobertura de pruebas (tabla)](#15-cobertura-de-pruebas-tabla)
16. [Diagrama del flujo (Mermaid) — diagrama final del flujo del código](#16-diagrama-del-flujo-mermaid--diagrama-final-del-flujo-del-código)
17. [Apéndice A — Archivos relevantes](#17-apéndice-a--archivos-relevantes)

---

## 1. Resumen ejecutivo (para no técnicos)

**¿Qué es CI/CD?**
CI/CD (Integración Continua / Despliegue Continuo) es un conjunto de prácticas automáticas que verifican que cada cambio en el código sea seguro de integrar al proyecto principal (**CI**) y que ese código verificado llegue a producción sin pasos manuales propensos a error (**CD**).

**¿En qué estado está Project One hoy (agosto 2026)?**

- ✅ **Integración Continua (CI): completa y robusta.** Cada Pull Request hacia `main` ejecuta: análisis de calidad (lint, format), **tests unitarios** (client + server), **tests de integración** (server con PostgreSQL real), **tests de smoke**, **build completo**, **tests E2E** (Playwright Chromium), y análisis de seguridad multi-capa. La pipeline usa _path filtering_ para saltar jobs innecesarios y _concurrency_ con cancelación automática en PRs.
- ✅ **Quality gates pre-commit (Shifting Left):** Antes de confirmar código localmente, Husky ejecuta **Semgrep SAST** (100+ reglas OWASP), **Gitleaks** (secretos en archivos staged), **lint-staged** (Prettier + ESLint `--max-warnings 0`), y **commitlint** (Conventional Commits). El hook `pre-push` ejecuta tests _scoped_ (`vitest --changed origin/main`) solo en archivos modificados.
- ✅ **Seguridad integrada en 3 capas:** (1) **Pre-commit** — Semgrep + Gitleaks en staged; (2) **PR/CI** — Trivy SCA, CodeQL SAST, Gitleaks diff-PR, SBOM CycloneDX, Dependency Review; (3) **Cron semanal** — Gitleaks _full-history_ (SARIF), OSV Scanner, _security digest_ automático con comentario en PR si hay hallazgos críticos.
- ✅ **Despliegue Continuo (CD): implementado end-to-end.** Pipeline `deploy.yml` en **2 fases**: Fase 1 (sin credenciales AWS) construye imagen Docker y valida contra stack emulado (**Floci** — emulador AWS LocalStack-compatible en puerto 4566 + PostgreSQL). Fase 2 (gatillada solo si `vars.AWS_ROLE_ARN` configurado) hace **push a ECR vía OIDC** (sin credenciales estáticas), despliega a **ECS Fargate** (staging → production) con **circuit breaker + rollback automático**, health checks post-deploy (5 min), y smoke tests remotos.
- ✅ **Preview Environments por PR:** `preview.yml` levanta stack completo (Floci + Postgres + Docker server) en cada PR, ejecuta smoke tests contra AWS emulado, captura la **Vercel Preview URL** del frontend via GitHub API, y publica/actualiza comentario en el PR con status del backend y URL del frontend.
- ✅ **Release automatizado:** `release.yml` usa **Changesets** — al hacer push a `main`, si hay changesets pendientes abre PR de versionado; al mergear publica a npm y crea tags.
- ✅ **Dependabot activo:** 3 ecosistemas (npm, github-actions, docker) con PRs semanales, agrupación de dev-dependencies, e ignore de majors de React.

**En una frase:** Project One tiene un pipeline CI/CD **maduro, seguro, y listo para producción** que cubre todo el ciclo de vida: desde el commit local (shifting left) hasta el deploy en ECS Fargate con circuit breaker, pasando por tests exhaustivos, seguridad multi-capa, y preview environments automáticos por PR.

---

## 2. Glosario de términos

| Término                       | Significado (contexto técnico)                                                                                                                              |
| ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **CI (Integración Continua)** | Automatización que verifica cada cambio (lint, tests, build, security) al abrir PR contra `main`.                                                           |
| **CD (Despliegue Continuo)**  | Automatización que publica código verificado a entornos reales (staging → production) sin intervención manual.                                              |
| **Pipeline / Workflow**       | Secuencia de jobs/steps en GitHub Actions que ejecutan el ciclo CI/CD.                                                                                      |
| **Pull Request (PR)**         | Solicitud de integración de una rama de features a `main`; gatilla la pipeline CI.                                                                          |
| **Rama `main`**               | Rama principal protegida; única que dispara CD (`push` a `main`).                                                                                           |
| **Build**                     | Transformación de código fuente a artefactos desplegables (bundle Vite, imagen Docker).                                                                     |
| **Lint / Format check**       | Análisis estático de estilo (ESLint) y formato uniforme (Prettier).                                                                                         |
| **Unit test**                 | Prueba de una unidad aislada (función, componente, hook). Framework: Vitest.                                                                                |
| **Integration test**          | Prueba de interacción entre módulos (API + PostgreSQL real vía service container).                                                                          |
| **Smoke test**                | Prueba rápida de "sanity check" de endpoints críticos tras deploy/build.                                                                                    |
| **E2E (end-to-end)**          | Prueba de navegador real (Playwright Chromium) simulando usuario completo.                                                                                  |
| **SAST**                      | Static Application Security Testing — análisis de código fuente (CodeQL, Semgrep).                                                                          |
| **SCA**                       | Software Composition Analysis — escaneo de dependencias de terceros (Trivy, OSV Scanner).                                                                   |
| **Secret scanning**           | Detección de credenciales filtradas (Gitleaks).                                                                                                             |
| **SBOM**                      | Software Bill of Materials — inventario de componentes (CycloneDX JSON via anchore/sbom-action).                                                            |
| **OIDC**                      | OpenID Connect — autenticación sin credenciales estáticas (GitHub → AWS IAM role).                                                                          |
| **Circuit Breaker (ECS)**     | Patrón de resiliencia: `deploymentCircuitBreaker={enable=true,rollback=true}` revierte automáticamente si health checks fallan.                             |
| **Floci**                     | Emulador AWS (LocalStack-compatible, MIT, storage memory) en puerto 4566; usado en CI/CD para validar contra Secrets Manager, etc. sin credenciales reales. |
| **Path Filtering**            | `dorny/paths-filter@v3` detecta qué workspaces cambiaron para ejecutar jobs condicionales.                                                                  |
| **Concurrency Group**         | Agrupación de ejecuciones simultáneas; `cancel-in-progress: true` cancela runs previos del mismo PR.                                                        |
| **Composite Action**          | Acción reutilizable compuesta por múltiples steps (ej. `setup-monorepo`).                                                                                   |
| **Reusable Workflow**         | Workflow invocado vía `workflow_call` desde otros workflows (ej. `quality.yml`).                                                                            |
| **Changesets**                | Herramienta de versionado: genera changelog, bumpea versiones, publica a npm al mergear PR de release.                                                      |
| **Conventional Commits**      | Estándar de mensajes: `tipo(scope): descripción` (ej. `feat(auth): agregar login`).                                                                         |
| **Shifting Left**             | Mover validaciones (tests, security, lint) lo más temprano posible en el ciclo (pre-commit → PR → cron).                                                    |
| **Staging / Production**      | Entornos de validación previa y real; gateados por `environment:` en GitHub (approval manual en prod).                                                      |
| **Dependabot**                | Bot de GitHub que abre PRs automáticos para actualizar dependencias (npm, actions, docker).                                                                 |

---

## 3. Estado actual de CI/CD de un vistazo (tabla resumen)

| Aspecto                       | Estado               | Detalle técnico clave                                                                                                                    |
| ----------------------------- | -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- | --- | --------------------------------------------------------------- |
| **Integración Continua (CI)** | ✅ Completa          | 9 jobs en `ci.yml`: changes → quality → test-unit-client → test-unit-server → test-integration → test-smoke → build → e2e → zombie-guard |
| **Despliegue Continuo (CD)**  | ✅ Implementado      | `deploy.yml`: Fase 1 (docker-build + validación Floci) → Fase 2 (ECR OIDC → ECS Fargate staging → ECS Fargate prod con circuit breaker)  |
| **Preview Environments**      | ✅ Por PR            | `preview.yml`: Floci + Postgres + Docker server + Vercel URL capture + comentario PR                                                     |
| **Quality gates pre-commit**  | ✅ Shifting Left     | Husky: pre-commit (Semgrep 100+ reglas + Gitleaks staged + lint-staged), commit-msg (commitlint), pre-push (vitest --changed)            |
| **Seguridad multi-capa**      | ✅ 3 capas           | Pre-commit / PR (security.yml: Trivy, CodeQL, Gitleaks diff, SBOM, DepReview) / Cron (scheduled-security + security-digest)              |
| **Tests en CI**               | ✅ Pirámide completa | Unit (client+server), Integration (PostgreSQL service), Smoke, E2E (Playwright Chromium cached), JUnit reporting                         |
| **Build en CI**               | ✅ Obligatorio       | `npm run build --ws --if-present` en `ci.yml:build` (always); Docker build en `deploy.yml` y `preview.yml`                               |
| **Typecheck en CI**           | ⚠️ Condicionado      | `npm run typecheck                                                                                                                       |     | echo "Typecheck skipped"`en`quality.yml` — script no existe aún |
| **Release / Versionado**      | ✅ Changesets        | `release.yml`: push a main → PR version packages → merge → publish npm + tags                                                            |
| **Entornos remotos**          | ✅ Staging + Prod    | ECS Fargate services: `project-one-staging-api` (256 CPU/512 MB) → `project-one-prod-api` (512/1024)                                     |
| **Infra como código**         | ❌ Parcial           | No Terraform/Pulumi; ECS task definitions inline en `deploy.yml` (aws cli)                                                               |
| **Dockerización server**      | ✅ Integrada         | `apps/server/Dockerfile` multi-stage; build en CI, preview, y deploy                                                                     |
| **Caching strategy**          | ✅ Multi-layer       | npm (setup-node), Vitest (setup-monorepo composite), Playwright browsers (actions/cache)                                                 |
| **Dependabot**                | ✅ 3 ecosistemas     | npm (weekly, grouped dev-deps), github-actions, docker (apps/server)                                                                     |
| **Zombie workflow guard**     | ✅ Anti-regresión    | `ci.yml:zombie-workflow-guard` verifica que workflows legacy no reaparezcan                                                              |

---

## 4. Mapa del pipeline — Diagrama Mermaid del flujo completo del PR al deploy

```mermaid
flowchart TD
    %% Source Stage
    Dev[👨‍💻 Desarrollador] --> Commit[git commit]
    Commit --> PreCommit[.husky/pre-commit]
    PreCommit --> LintStaged[lint-staged: Prettier + ESLint --max-warnings 0]
    PreCommit --> Semgrep[Semgrep SAST 100+ reglas OWASP\nscripts/security/semgrep-staged.ps1]
    PreCommit --> GitleaksStaged[Gitleaks protect --staged\n.gitleaks.toml custom]
    Commit --> CommitMsg[.husky/commit-msg]
    CommitMsg --> Commitlint[commitlint: Conventional Commits]
    Commit --> Push[git push]
    Push --> PrePush[.husky/pre-push]
    PrePush --> ScopedTests[vitest --changed origin/main\nserver + client]
    ScopedTests --> PROpen[PR abierto vs main]

    %% Build Stage
    PROpen --> CI[ci.yml se dispara\nconcurrency: pr-#{PR}]
    CI --> Changes[Job: changes\ndorny/paths-filter@v3]
    Changes -->|frontend/backend/e2e/shared| Quality[Job: quality\nworkflow_call quality.yml]
    Changes -->|frontend/shared| UnitClient[Job: test-unit-client\nVitest + JUnit]
    Changes -->|backend/shared| UnitServer[Job: test-unit-server\nVitest + JUnit]
    Changes -->|backend/shared| IntegServer[Job: test-integration\nPostgreSQL service container]
    Changes -->|backend/shared| SmokeServer[Job: test-smoke\nPostgreSQL + prisma migrate]
    Changes -->|always| BuildCI[Job: build\nnpm run build --ws]
    Changes -->|e2e/shared| E2E[Job: e2e\nPlaywright Chromium cached]

    %% Security Stage (parallel)
    PROpen --> Security[security.yml se dispara]
    Security --> Trivy[dependency-scan: Trivy SCA\nCRITICAL,HIGH fs]
    Security --> CodeQL[sast: CodeQL SAST\nJavaScript analysis]
    Security --> GitleaksDiff[secrets: Gitleaks diff-PR\ndocker gitleaks:v8.22.1]
    Security --> SBOM[sbom: anchore/sbom-action\nCycloneDX JSON 365d]
    Security --> DepReview[dependency-review\nvuln + license check]

    %% Quality Gate
    Quality --> MergeGate{¿Quality + Tests + Security\n+ Build + E2E pasan?}
    UnitClient --> MergeGate
    UnitServer --> MergeGate
    IntegServer --> MergeGate
    SmokeServer --> MergeGate
    BuildCI --> MergeGate
    E2E --> MergeGate
    Trivy --> MergeGate
    CodeQL --> MergeGate
    GitleaksDiff --> MergeGate
    SBOM --> MergeGate
    DepReview --> MergeGate

    MergeGate -->|✅ Sí| Merged[PR mergeado a main]
    MergeGate -->|❌ No| Blocked[PR bloqueado]

    %% Deploy Stage (push a main)
    Merged --> Release[release.yml: Changesets\nversion packages + npm publish]
    Merged --> Deploy[deploy.yml se dispara\npush a main]

    Deploy --> DockerBuild[Job: docker-build\nFloci + Postgres services\nDocker build + health + smoke]
    DockerBuild -->|vars.AWS_ROLE_ARN != ''| ECRPush[Job: ecr-push\nOIDC configure-aws-credentials\namazon-ecr-login + push]
    DockerBuild -->|vars.AWS_ROLE_ARN == ''| SkipEC[::notice:: ECR push skipped\nconfigure AWS_ROLE_ARN]

    ECRPush --> DeployStaging[Job: deploy-staging\nenvironment: staging\nconcurrency: deploy-staging]
    DeployStaging --> TaskDefStaging[aws ecs register-task-definition\nfamily: project-one-staging-api\nFARGATE 256/512 secrets via ARN]
    TaskDefStaging --> UpdateStaging[aws ecs update-service\n--force-new-deployment\ncircuit-breaker rollback]
    UpdateStaging --> WaitStable[aws ecs wait services-stable]
    WaitStable --> HealthStaging[Health check poll\nSTAGING_URL/health 5 min]
    HealthStaging --> SmokeStaging[Remote smoke tests\nBASE_URL=STAGING_URL]

    SmokeStaging --> DeployProd[Job: deploy-production\nenvironment: production\nconcurrency: deploy-production\n⚠️ Manual approval gate]
    DeployProd --> TaskDefProd[register-task-definition\nfamily: project-one-prod-api\nFARGATE 512/1024 PROD secrets]
    TaskDefProd --> UpdateProd[update-service\ncircuit-breaker rollback]
    UpdateProd --> WaitStableProd[wait services-stable]
    WaitStableProd --> HealthProd[Health check 5 min]
    HealthProd --> SmokeProd[Remote smoke tests\nBASE_URL=PROD_URL]

    %% Preview Environments (parallel on PR)
    PROpen --> Preview[preview.yml se dispara\nconcurrency: preview-#{PR}]
    Preview --> FlociSvc[Services: floci:1.5.31\nport 4566 memory storage]
    Preview --> PostgresSvc[postgres:16-alpine\ndb: project_one_preview]
    Preview --> DockerPreview[docker build preview-server]
    Preview --> MigratePreview[npx prisma migrate deploy]
    Preview --> RunPreview[docker run --network host\nAWS_ENDPOINT_URL=floci]
    Preview --> HealthPreview[Health check 30 retries\naccept 200 or 503]
    Preview --> SmokePreview[preview-smoke.mjs\nCreateSecret/GetSecretValue\nvs Floci Secrets Manager]
    Preview --> VercelURL[Capture Vercel URL\ngh api commit status\npoll 60s context:vercel*]
    Preview --> PRComment[Find/Create PR comment\npeter-evans/find-comment\nmarker: <!-- preview-environments -->]
    PRComment --> CommentUpdate[Update comment:\nFrontend URL + Backend status]

    %% Operate & Monitor (cron)
    Cron[⏰ Cron: Mon 03:00 UTC] --> ScheduledSec[scheduled-security.yml\nGitleaks full-history --all\nJSON + SARIF 30d retention]
    Cron --> SecDigest[security-digest.yml\nSBOM + OSV Scanner\ngenerate-security-digest.mjs\nComment on PR if CRITICAL/HIGH]
    ScheduledSec --> SecDigest
    SecDigest --> Artifacts[Artifacts retenidos:\nSBOM 365d, digest, gitleaks 30d]

    %% Styles
    classDef source fill:#e8f5e9,stroke:#2e7d32,stroke-width:2px;
    classDef build fill:#e3f2fd,stroke:#1565c0,stroke-width:2px;
    classDef test fill:#fff3e0,stroke:#ef6c00,stroke-width:2px;
    classDef security fill:#fce4ec,stroke:#c2185b,stroke-width:2px;
    classDef deploy fill:#f3e5f5,stroke:#7b1fa2,stroke-width:2px;
    classDef preview fill:#e0f2f1,stroke:#00695c,stroke-width:2px;
    classDef operate fill:#fafafa,stroke:#616161,stroke-width:2px,stroke-dasharray: 5 5;
    classDef gate fill:#ffebee,stroke:#c62828,stroke-width:3px;

    class Dev,Commit,PreCommit,LintStaged,Semgrep,GitleaksStaged,CommitMsg,Commitlint,Push,PrePush,ScopedTests,PROpen source;
    class CI,Changes,Quality,UnitClient,UnitServer,IntegServer,SmokeServer,BuildCI,E2E build;
    class Trivy,CodeQL,GitleaksDiff,SBOM,DepReview security;
    class MergeGate,Blocked,Merged gate;
    class Release,Deploy,DockerBuild,ECRPush,SkipEC,DeployStaging,TaskDefStaging,UpdateStaging,WaitStable,HealthStaging,SmokeStaging,DeployProd,TaskDefProd,UpdateProd,WaitStableProd,HealthProd,SmokeProd deploy;
    class Preview,FlociSvc,PostgresSvc,DockerPreview,MigratePreview,RunPreview,HealthPreview,SmokePreview,VercelURL,PRComment,CommentUpdate preview;
    class Cron,ScheduledSec,SecDigest,Artifacts operate;
```

**Leyenda:** 🟢 Source (pre-commit/push) → 🔵 Build → 🟠 Test → 🟣 Security → 🔴 Quality Gate → 🟣 Deploy → 🟦 Preview → ⚪ Operate & Monitor (cron)

---

## 5. Stage 1 — Source / Código (Pre-commit local)

> **Concepto: _Shifting Left_** — Mover validaciones de calidad y seguridad lo más temprano posible en el ciclo de desarrollo. En Project One, esto significa: **pre-commit** (SAST + secret scanning + lint/format) → **pre-push** (tests scoped) → **PR/CI** (suite completa) → **Cron semanal** (full-history scans). Cada capa atrapa problemas antes de que avancen, reduciendo coste de fix exponencialmente.

### 5.1 Hooks Husky (`.husky/`)

| Hook           | Archivo             | Líneas | Qué ejecuta                                                                                              | Paralelismo                     |
| -------------- | ------------------- | ------ | -------------------------------------------------------------------------------------------------------- | ------------------------------- |
| **pre-commit** | `.husky/pre-commit` | 32     | 1. `npm exec lint-staged` (autofix) 2. **Paralelo**: `npm run sast:semgrep` + `npm run security:secrets` | `&` + `wait` captura exit codes |
| **commit-msg** | `.husky/commit-msg` | 1      | `commitlint --edit $1`                                                                                   | Secuencial                      |
| **pre-push**   | `.husky/pre-push`   | 22     | `git fetch origin main --depth=1` → `vitest run --changed origin/main` (server + client)                 | Secuencial                      |

**`pre-commit` — snippet comentado (ref: `.husky/pre-commit:1-32`):**

```bash
#!/usr/bin/env bash
set -e

# 1. lint-staged: Prettier + ESLint --max-warnings 0 en archivos staged
# Puede MODIFICAR archivos (autofix) antes del commit
npm exec lint-staged

# 2. Paralelo: Semgrep SAST + Gitleaks staged (background jobs)
npm run sast:semgrep &      # Semgrep 100+ reglas OWASP en staged
SEMgrep_PID=$!

npm run security:secrets &  # Gitleaks protect --staged --verbose --redact
GITLEAKS_PID=$!

# Espera ambos y propaga fallo si cualquiera falla
wait $SEMgrep_PID
SEMgrep_EXIT=$?
wait $GITLEAKS_PID
GITLEAKS_EXIT=$?

if [ $SEMgrep_EXIT -ne 0 ] || [ $GITLEAKS_EXIT -ne 0 ]; then
  exit 1
fi
```

**`pre-push` — snippet (ref: `.husky/pre-push:1-22`):**

```bash
#!/usr/bin/env bash
set -e

# Fetch shallow de main para base de comparación
git fetch origin main --depth=1

# Verifica que origin/main existe
if ! git rev-parse --verify origin/main >/dev/null 2>&1; then
  echo "ERROR: origin/main no disponible. Haz 'git fetch origin main' primero."
  exit 1
fi

# Tests scoped SOLO en archivos cambiados vs origin/main
# Server
npx vitest run --changed origin/main --config apps/server/vitest.config.js
# Client
npx vitest run --changed origin/main --config apps/client/vitest.config.js
```

### 5.2 lint-staged (config en `package.json`)

```json
// package.json:lint-staged
"lint-staged": {
  "*.{js,jsx,ts,tsx,cjs,mjs,json,jsonc,md}": ["prettier --write"],
  "*.{js,jsx,cjs,mjs}": ["eslint --fix --max-warnings 0"]
}
```

- **Prettier** formatea _todos_ los archivos staged (JS, TS, JSON, MD).
- **ESLint --max-warnings 0** trata warnings como errores — cero tolerancia.

### 5.3 Semgrep SAST (>100 reglas OWASP) — `scripts/security/semgrep-staged.ps1`

Ejecuta en **pre-commit** solo sobre archivos _staged_ (`git diff --cached --name-only --diff-filter=ACM`). Si no hay staged → exit 0.

**Categorías de reglas (extracto de `semgrep-staged.ps1`):**
| Categoría OWASP | Reglas representativas | Frameworks cubiertos |
|---|---|---|
| **A01: Broken Access Control** | `express-open-redirect`, `express-csrf-missing`, `path-traversal` | Express |
| **A02: Cryptographic Failures** | `insecure-transport`, `weak-crypto-algorithm`, `hardcoded-secret` | node-crypto |
| **A03: Injection** | `sql-injection`, `command-injection`, `prototype-pollution` | Express, generic |
| **A07: Identification Failures** | `jwt-none-algorithm`, `jwt-weak-secret`, `cookie-missing-secure`, `cookie-missing-httponly` | jsonwebtoken, Express |
| **A10: SSRF** | `ssrf-fetch`, `ssrf-axios` | Generic |

Ejecución: `docker run --rm -v ${PWD}:/src semgrep/semgrep:latest scan --config=auto --json /src` (filtrado a staged via `--include` generado dinámicamente).

### 5.4 Gitleaks protect --staged (`.gitleaks.toml` custom)

Configuración enterprise en `.gitleaks.toml` (139 líneas):

```toml
# .gitleaks.toml — extracto clave
useDefault = true  # Reglas oficiales: AWS, GitHub, Slack, Stripe, Google API, private keys

[allowlist]
paths = [
  "node_modules/**", "dist/**", "build/**", "coverage/**",
  ".next/**", ".agents/**", ".opencode/**", "openspec/**",
  "**/*.test.ts", "**/*.spec.ts", "**/__mocks__/**", "**/__fixtures__/**"
]

# Reglas custom project-one
[[rules]]
id = "generic-api-key"
description = "Generic API key pattern"
regex = '''(?i)(api[_-]?key|apikey)['"\s:=]+[a-z0-9_-]{20,}'''

[[rules]]
id = "jwt-secret-variable"
description = "JWT secret in variable assignment"
regex = '''(?i)(jwt[_-]?secret)['"\s:=]+[a-z0-9_-]{16,}'''

[[rules]]
id = "password-assignment"
description = "Password assignment in code"
regex = '''(?i)(password|passwd|pwd)['"\s:=]+[^\s]{8,}'''

# Allowlists para falsos positivos conocidos
[[allowlist]]
description = "Socket training files"
paths = ["**/socket-training/**"]

[[allowlist]]
description = "PM2 ecosystem config"
paths = ["ecosystem.config.js"]
```

**`.gitleaksignore`** (6 falsos positivos documentados):

- `client/src/locale/en.json` — `password-assignment` en claves de traducción
- `server/config/db.sequalize.js` — `password-assignment` en config legacy

### 5.5 commitlint — Conventional Commits

```js
// commitlint.config.js
export default {
  extends: ['@commitlint/config-conventional'],
  // Reglas: type(scope): subject
  // Types: feat, fix, docs, style, refactor, perf, test, chore, ci, build, revert
};
```

Valida en `commit-msg` hook. Ejemplos:

- ✅ `feat(auth): agregar login con GitHub`
- ✅ `fix(server): corregir migración prisma`
- ❌ `cambios varios`
- ❌ `update`

### 5.6 Dependabot — Prevención automatizada (`.github/dependabot.yml`)

```yaml
# .github/dependabot.yml — extracto
version: 2
updates:
  - package-ecosystem: 'npm'
    directory: '/'
    schedule:
      interval: 'weekly'
      day: 'monday'
      time: '03:00'
      timezone: 'UTC'
    open-pull-requests-limit: 10
    labels: ['dependencies', 'automated']
    groups:
      dev-dependencies:
        patterns:
          [
            'eslint*',
            'prettier*',
            'typescript*',
            'vitest*',
            '@testing-library/*',
            '@types/*',
          ]
        update-types: ['minor', 'patch']
    ignore:
      - dependency-name: 'react*'
        update-types: ['version-update:semver-major']
      - dependency-name: 'react-dom*'
        update-types: ['version-update:semver-major']

  - package-ecosystem: 'github-actions'
    directory: '/'
    schedule: { interval: 'weekly', day: 'monday', time: '03:00' }
    commit-message: { prefix: 'ci' }
    labels: ['github-actions']

  - package-ecosystem: 'docker'
    directory: 'apps/server'
    schedule: { interval: 'weekly', day: 'monday', time: '03:00' }
    labels: ['dependencies', 'docker']
```

- **3 ecosistemas** con PRs semanales lunes 03:00 UTC.
- **Agrupación inteligente** de dev-dependencies (evita ruido de 20+ PRs semanales).
- **Ignora majors de React** (breaking changes requieren revisión manual).

---

## 6. Stage 2 — Build (Construcción)

### 6.1 Composite Action: `setup-monorepo` (`.github/actions/setup-monorepo/action.yml`)

Acción reutilizable que encapsula el setup estándar del monorepo (Node + npm ci + cache Vitest). **NO hace checkout**: el job invocador debe ejecutar `actions/checkout@v5` con `fetch-depth: 0` ANTES (requisito de `dorny/test-reporter`). **Referencia: `.github/actions/setup-monorepo/action.yml:1-23`**

```yaml
# .github/actions/setup-monorepo/action.yml — composite action
name: 'Setup Monorepo'
description: 'Setup Node.js, install dependencies, and cache Vitest (requires prior actions/checkout with fetch-depth: 0 in the calling job)'
runs:
  using: 'composite'
  steps:
    - name: Setup Node
      uses: actions/setup-node@v4
      with:
        node-version-file: '.nvmrc' # Single source of truth para versión Node
        cache: 'npm' # Cache global de npm (~/.npm)

    - name: Install dependencies
      shell: bash
      run: npm ci # Instalación determinística desde package-lock.json

    - name: Cache Vitest
      uses: actions/cache@v4
      with:
        path: node_modules/.cache/vitest
        key: vitest-${{ runner.os }}-${{ hashFiles('package-lock.json') }}
        restore-keys: vitest-${{ runner.os }}-
```

**Uso en workflows:** SOLO `ci.yml` (6 jobs: test-unit-client, test-unit-server, test-integration, test-smoke, build, e2e). `deploy.yml`, `preview.yml`, `quality.yml`, etc. **NO usan esta composite** — configuran Node directamente en sus jobs.

**Patrón de checkout único (1 checkout por job):**

```yaml
# ci.yml — cada job que usa setup-monorepo
steps:
  - uses: actions/checkout@v5
    with:
      fetch-depth: 0 # historial completo → test-reporter (exit 128 sin él)
  - uses: ./.github/actions/setup-monorepo
```

### 6.2 Job `build` en `ci.yml` (ref: `ci.yml:180-195`)

```yaml
# ci.yml — job build (siempre ejecuta, even if tests fail)
build:
  name: Build
  if: always() # Ejecuta aunque fallen tests previos → detecta errores de compilación
  needs: changes
  runs-on: ubuntu-latest
  timeout-minutes: 10
  steps:
    - uses: ./.github/actions/setup-monorepo
    - name: Build all workspaces
      run: npm run build --ws --if-present
```

- `if: always()` garantiza que el build corra aún si tests fallaron (feedback rápido de errores de tipos/build).
- `--ws --if-present` ejecuta `build` en cada workspace que lo tenga definido (client, server).

### 6.3 Job `docker-build` en `deploy.yml` (Fase 1 — ref: `deploy.yml:45-95`)

Construye la imagen Docker del server y **valida contra stack emulado** (Floci + PostgreSQL) **sin credenciales AWS reales**.

```yaml
# deploy.yml — job docker-build
docker-build:
  name: Build & Validate Image - Emulated Stack
  runs-on: ubuntu-latest
  concurrency:
    group: deploy-staging
    cancel-in-progress: false # No cancelar builds en deploy
  permissions:
    contents: read
  services:
    floci:
      image: floci/floci:1.5.31
      ports: ['4566:4566']
      env:
        FLOCI_STORAGE_MODE: memory
      options: >-
        --health-cmd="curl -f http://localhost:4566/_localstack/health"
        --health-interval=5s --health-timeout=3s --health-retries=10
    db:
      image: postgres:16-alpine
      env:
        POSTGRES_USER: test
        POSTGRES_PASSWORD: test
        POSTGRES_DB: project_one_cd
      ports: ['5432:5432']
      options: >-
        --health-cmd="pg_isready -U test -d project_one_cd"
        --health-interval=5s --health-timeout=3s --health-retries=10
  steps:
    - uses: actions/checkout@v4
    - uses: ./.github/actions/setup-monorepo
    - name: Build Docker image (SHA + latest tags)
      run: |
        docker build -t project-one-server:${{ github.sha }} \
                     -t project-one-server:latest \
                     -f apps/server/Dockerfile .
    - name: Run migrations against test DB
      env:
        DATABASE_URL: postgresql://test:test@localhost:5432/project_one_cd
      run: npx prisma migrate deploy
    - name: Start container with emulated AWS
      run: |
        docker run -d --name cd-server --network host \
          -e DATABASE_URL=postgresql://test:test@localhost:5432/project_one_cd \
          -e AWS_ENDPOINT_URL=http://localhost:4566 \
          -e AWS_ACCESS_KEY_ID=test \
          -e AWS_SECRET_ACCESS_KEY=test \
          -e AWS_REGION=us-east-1 \
          -e PORT=3000 \
          -e AES_GCM_KEY=AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA= \
          -e ALGORITHM=aes-256-gcm \
          project-one-server:latest
    - name: Wait for health endpoint
      run: |
        for i in {1..30}; do
          if curl -f http://localhost:3000/health; then exit 0; fi
          sleep 2
        done
        exit 1
    - name: Smoke tests against emulated AWS
      env:
        AWS_ENDPOINT_URL: http://localhost:4566
        AWS_ACCESS_KEY_ID: test
        AWS_SECRET_ACCESS_KEY: test
        AWS_REGION: us-east-1
      run: |
        # Ejecuta tests de smoke que usan Secrets Manager emulado
        node apps/server/scripts/preview-smoke.mjs
```

**Puntos clave:**

- **Floci** emula AWS Secrets Manager, S3, etc. en puerto 4566 (storage en memoria, MIT license).
- **Tags duales**: `${{ github.sha }}` (trazabilidad) + `latest` (conveniencia).
- **Health check loop** 30 intentos × 2s = 60s máx.
- **Smoke tests** validan `CreateSecret` + `GetSecretValue` contra Floci.

### 6.4 Job `Build server Docker image` en `preview.yml` (ref: `preview.yml:35-55`)

Similar a `docker-build` pero optimizado para preview environments por PR:

```yaml
# preview.yml — steps de build
- name: Build server Docker image
  run: docker build -t preview-server -f apps/server/Dockerfile .
- name: Run migrations
  env:
    DATABASE_URL: postgresql://test:test@localhost:5432/project_one_preview
  run: npx prisma migrate deploy
- name: Start preview server with Floci
  run: |
    docker run -d --name preview-server --network host \
      -e DATABASE_URL=postgresql://test:test@localhost:5432/project_one_preview \
      -e AWS_ENDPOINT_URL=http://localhost:4566 \
      -e AWS_ACCESS_KEY_ID=test \
      -e AWS_SECRET_ACCESS_KEY=test \
      -e AWS_REGION=us-east-1 \
      -e PORT=3000 \
      -e ENABLE_SMOKE_ROUTE=true \
      -e AES_GCM_KEY=AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA= \
      -e ALGORITHM=aes-256-gcm \
      preview-server
```

### 6.5 Estrategia de Caching (Multi-layer)

| Capa                    | Herramienta                     | Key                                                             | Restore Keys             | Dónde se usa                                                                |
| ----------------------- | ------------------------------- | --------------------------------------------------------------- | ------------------------ | --------------------------------------------------------------------------- |
| **npm**                 | `actions/setup-node@v4`         | `cache: 'npm'`                                                  | —                        | Todos los workflows (`setup-monorepo`, `quality.yml`, `security.yml`, etc.) |
| **Vitest**              | `actions/cache@v4` (composite)  | `vitest-${{runner.os}}-${{hashFiles('package-lock.json')}}`     | `vitest-${{runner.os}}-` | `.github/actions/setup-monorepo/action.yml`                                 |
| **Playwright browsers** | `actions/cache@v4`              | `playwright-${{runner.os}}-${{hashFiles('package-lock.json')}}` | —                        | `ci.yml:e2e` job                                                            |
| **Docker layer cache**  | GitHub Actions cache (implicit) | —                                                               | —                        | `docker build` en `deploy.yml`, `preview.yml`                               |

---

## 7. Stage 3 — Test (Pruebas)

### 7.1 Pirámide de pruebas en CI (ref: `ci.yml` jobs)

```
                    ┌─────────────┐
                    │   E2E       │  ← 1 job (chromium, 15 min)
                    │ Playwright  │
           ┌────────┴────────┬────┴────────┐
           │                 │             │
    ┌──────┴──────┐   ┌─────┴─────┐ ┌─────┴─────┐
    │ Integration │   │  Smoke    │ │   Unit    │
    │  (server)   │   │  (server) │ │ Client+Srv│
    │ PostgreSQL  │   │  Prisma   │ │  Vitest   │
    │  service    │   │  migrate  │ │           │
    └─────────────┘   └───────────┘ └───────────┘
           ▲                 ▲             ▲
           │   Path Filtering (dorny/paths-filter)   │
           └───────────────┴─────────────────────────┘
                    jobs condicionales
```

### 7.2 Path Filtering — `dorny/paths-filter@v3` (ref: `ci.yml:15-45`)

```yaml
# ci.yml — job changes
changes:
  name: Detect Changes
  runs-on: ubuntu-latest
  outputs:
    frontend: ${{ steps.filter.outputs.frontend }}
    backend: ${{ steps.filter.outputs.backend }}
    e2e: ${{ steps.filter.outputs.e2e }}
    shared: ${{ steps.filter.outputs.shared }}
  steps:
    - uses: dorny/paths-filter@v3
      id: filter
      with:
        filters: |
          frontend:
            - 'apps/client/**'
          backend:
            - 'apps/server/**'
          e2e:
            - 'e2e/**'
          shared:
            - 'package.json'
            - 'package-lock.json'
            - '.github/workflows/**'
```

**Outputs → condicionales en jobs downstream:**

- `test-unit-client`: `if: needs.changes.outputs.frontend == 'true' || needs.changes.outputs.shared == 'true'`
- `test-unit-server`: `if: needs.changes.outputs.backend == 'true' || needs.changes.outputs.shared == 'true'`
- `test-integration`: `if: needs.changes.outputs.backend == 'true' || needs.changes.outputs.shared == 'true'`
- `test-smoke`: igual que integration
- `e2e`: `if: needs.changes.outputs.e2e == 'true' || needs.changes.outputs.shared == 'true'`
- `quality`: inputs `run-client`/`run-server` desde outputs

### 7.3 Test Reporting — `dorny/test-reporter@v3` (JUnit XML → GitHub Checks)

Todos los jobs de test generan JUnit XML y lo reportan como annotations en el PR:

```yaml
# Ejemplo: test-unit-client (ref: ci.yml:55-80)
test-unit-client:
  name: Unit Tests - Client
  if: ${{ needs.changes.outputs.frontend == 'true' || needs.changes.outputs.shared == 'true' }}
  runs-on: ubuntu-latest
  timeout-minutes: 10
  steps:
    - uses: ./.github/actions/setup-monorepo
    - name: Run unit tests (client)
      run: |
        npm run test:unit --workspace=client-react -- \
          --reporter=junit --outputFile=reports/junit.xml
    - name: Report test results
      uses: dorny/test-reporter@v3
      if: always()
      with:
        name: Unit Tests - Client
        path: apps/client/reports/junit.xml
        reporter: java-junit # Formato JUnit XML
```

**Resultado:** Fallos aparecen como _annotations_ en la pestaña "Checks" del PR, con archivo:línea clickeable.

### 7.4 Tests de Integración — Service Container PostgreSQL (ref: `ci.yml:95-130`)

```yaml
test-integration:
  name: Integration Tests - Server
  if: ${{ needs.changes.outputs.backend == 'true' || needs.changes.outputs.shared == 'true' }}
  runs-on: ubuntu-latest
  timeout-minutes: 10
  services:
    postgres:
      image: postgres:16-alpine
      env:
        POSTGRES_USER: test
        POSTGRES_PASSWORD: test
        POSTGRES_DB: project_one_test
      ports: ['5432:5432']
      options: >-
        --health-cmd="pg_isready -U test -d project_one_test"
        --health-interval=5s --health-timeout=3s --health-retries=10
  steps:
    - uses: ./.github/actions/setup-monorepo
    - name: Run migrations
      env:
        DATABASE_URL: postgresql://test:test@localhost:5432/project_one_test
      run: npx prisma migrate deploy
    - name: Run integration tests
      run: npm run test:integration --workspace=server-express
    - name: Report results
      uses: dorny/test-reporter@v3
      if: always()
      with:
        name: Integration Tests - Server
        path: apps/server/reports/junit.xml
        reporter: java-junit
```

### 7.5 Smoke Tests — CI y Post-Deploy

| Ubicación                            | Script                                                                                       | Qué valida                                                         |
| ------------------------------------ | -------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| **CI (`ci.yml:test-smoke`)**         | `npm run test:smoke:ci --workspace=server-express`                                           | Endpoints críticos tras migraciones en BD de test                  |
| **Preview (`preview.yml`)**          | `node apps/server/scripts/preview-smoke.mjs`                                                 | `CreateSecret` + `GetSecretValue` contra **Floci Secrets Manager** |
| **Deploy Staging (`deploy.yml`)**    | `npm run test:smoke:ci --workspace=server-express` con `BASE_URL=${{ secrets.STAGING_URL }}` | Health + endpoints críticos en staging real                        |
| **Deploy Production (`deploy.yml`)** | Igual con `BASE_URL=${{ secrets.PROD_URL }}`                                                 | Validación final en producción                                     |

### 7.6 E2E Tests — Playwright Chromium con Cache (ref: `ci.yml:145-180`)

```yaml
e2e:
  name: E2E Tests
  if: ${{ needs.changes.outputs.e2e == 'true' || needs.changes.outputs.shared == 'true' }}
  runs-on: ubuntu-latest
  timeout-minutes: 15
  services:
    postgres:
      image: postgres:16-alpine
      env:
        POSTGRES_USER: test
        POSTGRES_PASSWORD: test
        POSTGRES_DB: project_one_test
      options: >-
        --health-cmd="pg_isready -U test -d project_one_test"
        --health-interval=5s --health-timeout=3s --health-retries=10
  steps:
    - uses: ./.github/actions/setup-monorepo
    - name: Run migrations
      env:
        DATABASE_URL: postgresql://test:test@localhost:5432/project_one_test
      run: npx prisma migrate deploy
    - name: Cache Playwright browsers
      uses: actions/cache@v4
      with:
        path: ~/.cache/ms-playwright
        key: playwright-${{ runner.os }}-${{ hashFiles('package-lock.json') }}
    - name: Install Playwright (if cache miss)
      if: steps.cache.outputs.cache-hit != 'true'
      run: npx playwright install --with-deps chromium
    - name: Run E2E tests
      working-directory: ./e2e
      run: npx playwright test --project=chromium --output=test-results
    - name: Report E2E results
      uses: dorny/test-reporter@v3
      if: always()
      with:
        name: E2E Tests
        path: e2e/test-results/junit.xml
        reporter: java-junit
```

### 7.7 Concurrencia y Cancelación (ref: `ci.yml:8-12`)

```yaml
# ci.yml — nivel workflow
concurrency:
  group: pr-${{ github.event.pull_request.number }}
  cancel-in-progress: true # Cancela run anterior del MISMO PR al hacer push nuevo
```

- **Por PR**: Cada PR tiene su grupo de concurrencia independiente.
- **No afecta deploy**: `deploy.yml` usa grupos separados (`deploy-staging`, `deploy-production`) con `cancel-in-progress: false`.

### 7.8 Zombie Workflow Guard (Anti-regresión) (ref: `ci.yml:195-210`)

```yaml
zombie-workflow-guard:
  name: Zombie Workflow Guard
  runs-on: ubuntu-latest
  timeout-minutes: 2
  steps:
    - name: Assert legacy workflows do not exist
      run: |
        for f in pr-validation.yml lint.yml formatter.yml; do
          if [ -f ".github/workflows/$f" ]; then
            echo "::error::Legacy workflow $f still exists — remove it"
            exit 1
          fi
        done
        echo "✅ No legacy workflows found"
```

Previene que workflows eliminados (`ci-cleanup-enterprise`) reaparezcan por error.

---

## 8. Stage 4 — Security (Seguridad en el pipeline)

### 8.1 Diagrama de capas de seguridad (Shifting Left aplicado a seguridad)

```mermaid
flowchart LR
    subgraph Local["🖥️ Local (Pre-commit / Pre-push)"]
        L1[Semgrep SAST\n100+ reglas OWASP\nstaged files]
        L2[Gitleaks protect --staged\n.gitleaks.toml custom]
        L3[lint-staged\nPrettier + ESLint --max-warnings 0]
        L4[commitlint\nConventional Commits]
        L5[vitest --changed\nscoped tests]
    end

    subgraph PR["🔀 Pull Request (CI)"]
        P1[Trivy SCA\nFS scan CRITICAL/HIGH]
        P2[CodeQL SAST\nJavaScript analysis]
        P3[Gitleaks diff-PR\nPR diff only]
        P4[SBOM CycloneDX\nanchore/sbom-action]
        P5[Dependency Review\nvuln + license check]
    end

    subgraph Cron["⏰ Cron Semanal (Lunes 03:00 UTC)"]
        C1[Gitleaks full-history\n--log-opts=--all\nJSON + SARIF]
        C2[OSV Scanner\npackage-lock.json\nvuln + license]
        C3[Security Digest\ngenerate-security-digest.mjs\nComment on PR if CRITICAL]
    end

    L1 -.->|Shift Left| P1
    L2 -.->|Shift Left| P3
    L3 -.->|Shift Left| P4
    P1 -.->|Feed| C1
    P4 -.->|Feed| C3
    C1 -.->|Feed| C3
    C2 -.->|Feed| C3
```

### 8.2 `security.yml` — Security Pipeline (ref: `.github/workflows/security.yml`)

**Disparadores:** `workflow_call` + `pull_request` (branches: main) + `push` (branches: main)

```yaml
# security.yml — permissions
permissions:
  contents: read
  security-events: write # Para subir SARIF a GitHub Security tab
```

| Job                   | Herramienta                                            | Config clave                                                                                                                                                                                                                      | Output                              |
| --------------------- | ------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------- |
| **dependency-scan**   | Trivy (`aquasecurity/trivy-action@0.36.0`)             | `scan-type: fs`, `scan-ref: .`, `severity: CRITICAL,HIGH`, `exit-code: '1'`, `ignore-unfixed: true`, `format: sarif`, `output: trivy-results.sarif` + SARIF upload (`codeql-action/upload-sarif@v4`, `if: always()`)              | Vulnerabilidades deps (fail-closed) |
| **sast**              | CodeQL (`github/codeql-action/init@v4` + `analyze@v4`) | `languages: javascript,actions`, `npm ci`                                                                                                                                                                                         | CodeQL alerts en Security tab       |
| **secrets**           | Gitleaks (dual)                                        | 1. `docker://zricethezav/gitleaks:v8.22.1` args `git --log-opts="${{github.event.pull_request.base.sha}}..${{github.event.pull_request.head.sha}}"` (diff PR) 2. Si `secrets.GIT_LEAKS`: `gitleaks/gitleaks-action@v3` (licensed) | Secretos en diff del PR             |
| **sbom**              | `anchore/sbom-action@v0.24.0`                          | `format: cyclonedx-json`, `output-file: sbom-project-one.json`                                                                                                                                                                    | Artifact 365d retention             |
| **dependency-review** | `actions/dependency-review-action@v5`                  | `vulnerability-check: true`, `license-check: true`                                                                                                                                                                                | Bloquea PR si vuln/license fail     |

**Gitleaks dual mode en PR (ref: `security.yml:secrets job`):**

```yaml
secrets:
  name: Secret Detection
  if: github.event_name == 'pull_request'
  runs-on: ubuntu-latest
  permissions:
    contents: read
  steps:
    - uses: actions/checkout@v5
      with:
        fetch-depth: 0 # Necesario para diff del PR
    - name: Gitleaks OSS (diff PR only)
      uses: docker://zricethezav/gitleaks:v8.22.1
      with:
        args: >-
          detect
          --source=.
          --log-opts="${{ github.event.pull_request.base.sha }}..${{ github.event.pull_request.head.sha }}"
          --redact
          --verbose
          --config=.gitleaks.toml
    - name: Gitleaks Pro (if licensed)
      if: env.GIT_LEAKS != ''
      uses: gitleaks/gitleaks-action@v3
      env:
        GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        GITLEAKS_LICENSE: ${{ secrets.GIT_LEAKS }}
      with:
        args: --config=.gitleaks.toml
```

### 8.3 `scheduled-security.yml` — Gitleaks Full History (ref: `.github/workflows/scheduled-security.yml`)

**Cron:** `0 3 * * 1` (lunes 03:00 UTC) + `workflow_dispatch`

```yaml
# scheduled-security.yml — job gitleaks-full-scan
gitleaks-full-scan:
  name: Gitleaks Full History Scan
  runs-on: ubuntu-latest
  continue-on-error: true # No bloquear repo por hallazgos históricos
  permissions:
    contents: read
    security-events: write
  steps:
    - uses: actions/checkout@v4
      with:
        fetch-depth: 0 # Historial COMPLETO
    - name: Gitleaks full scan (JSON report)
      uses: docker://zricethezav/gitleaks:v8.22.1
      with:
        args: detect --source=. --log-opts="--all" --report-format=json --report-path=gitleaks-report.json --config=.gitleaks.toml
    - name: Upload JSON artifact
      uses: actions/upload-artifact@v4
      with:
        name: gitleaks-report
        path: gitleaks-report.json
        retention-days: 30
    - name: Gitleaks full scan (SARIF report)
      uses: docker://zricethezav/gitleaks:v8.22.1
      with:
        args: detect --source=. --log-opts="--all" --report-format=sarif --report-path=gitleaks.sarif --config=.gitleaks.toml
    - name: Upload SARIF to Security tab
      uses: github/codeql-action/upload-sarif@v4
      with:
        sarif_file: gitleaks.sarif
        category: gitleaks
```

### 8.4 `security-digest.yml` — Security Digest Automatizado (ref: `.github/workflows/security-digest.yml`)

**Cron:** `0 3 * * 1` + `workflow_dispatch` (input opcional `pull_request_number`)

```yaml
# security-digest.yml — jobs
jobs:
  sbom:
    name: Generate SBOM
    uses: anchore/sbom-action@v0.17.2
    with:
      format: cyclonedx-json
      output-file: sbom-project-one.json
    # upload-artifact 365d

  vulnerability-review:
    name: Vulnerability & License Review
    runs-on: ubuntu-latest
    continue-on-error: true
    steps:
      - uses: actions/checkout@v4
      - name: OSV Scanner
        uses: google/osv-scanner-action@v2.3.8
        with:
          scan-args: --format=json --output=osv-report.json package-lock.json
      - name: Upload OSV artifact
        uses: actions/upload-artifact@v4
        with:
          name: osv-report
          path: osv-report.json

  digest:
    name: Generate Security Digest
    needs: [sbom, vulnerability-review]
    if: always() && !cancelled()
    runs-on: ubuntu-latest
    permissions:
      contents: read
      actions: read
      pull-requests: write # Para comentar en PR
    steps:
      - uses: actions/download-artifact@v4
        with:
          name: sbom-project-one
          path: artifacts/
      - uses: actions/download-artifact@v4
        with:
          name: osv-report
          path: artifacts/
      # Descarga gitleaks-report del sibling run de scheduled-security.yml
      - name: Find sibling scheduled-security run
        uses: actions/github-script@v7
        id: sibling
        with:
          script: |
            const runs = await github.rest.actions.listWorkflowRuns({
              owner: context.repo.owner,
              repo: context.repo.repo,
              workflow_id: 'scheduled-security.yml',
              status: 'completed',
              per_page: 1
            });
            return runs.data.workflow_runs[0]?.id;
      - name: Download gitleaks artifact
        uses: actions/download-artifact@v4
        with:
          name: gitleaks-report
          path: artifacts/
          run-id: ${{ steps.sibling.outputs.result }}
      - name: Generate digest
        run: |
          node scripts/security/generate-security-digest.mjs \
            artifacts/sbom-project-one.json \
            artifacts/osv-report.json \
            artifacts/gitleaks-report.json \
            security-digest.md
      - name: Upload digest artifact
        uses: actions/upload-artifact@v4
        with:
          name: security-digest
          path: security-digest.md
      - name: Comment on PR if critical findings
        if: inputs.pull_request_number && contains(env.DIGEST_CONTENT, '🚨 CRITICAL') || contains(env.DIGEST_CONTENT, '🔴 HIGH') || contains(env.DIGEST_CONTENT, '⛔ DENY-LIST')
        uses: actions/github-script@v7
        with:
          script: |
            await github.rest.issues.createComment({
              owner: context.repo.owner,
              repo: context.repo.repo,
              issue_number: ${{ inputs.pull_request_number }},
              body: fs.readFileSync('security-digest.md', 'utf8')
            })
```

### 8.5 `.gitleaks.toml` — Enterprise Secret Detection Policy (resumen)

```toml
# .gitleaks.toml — estructura completa (139 líneas)
useDefault = true

[allowlist]
paths = [ "node_modules/**", "dist/**", "build/**", "coverage/**", ".next/**",
          ".agents/**", ".opencode/**", "openspec/**", "**/*.test.ts", "**/*.spec.ts",
          "**/__mocks__/**", "**/__fixtures__/**" ]

# Reglas custom
[[rules]]  # generic-api-key
[[rules]]  # jwt-secret-variable
[[rules]]  # generic-secret-variable
[[rules]]  # password-assignment
[[rules]]  # database-url

# Allowlists específicos
[[allowlist]]  # socket training files
[[allowlist]]  # PM2 ecosystem config
```

### 8.6 Semgrep Rules (>100 reglas) — `scripts/security/semgrep-staged.ps1`

Reglas OWASP Top 10 + framework-specific:

| Categoría              | Reglas clave                                                                                | Frameworks            |
| ---------------------- | ------------------------------------------------------------------------------------------- | --------------------- |
| **A01 Access Control** | `express-open-redirect`, `express-csrf-missing`, `path-traversal`                           | Express               |
| **A02 Crypto**         | `insecure-transport`, `weak-crypto-algorithm`, `hardcoded-secret`                           | node-crypto           |
| **A03 Injection**      | `sql-injection`, `command-injection`, `prototype-pollution`                                 | Express, Generic      |
| **A07 Auth**           | `jwt-none-algorithm`, `jwt-weak-secret`, `cookie-missing-secure`, `cookie-missing-httponly` | jsonwebtoken, Express |
| **A10 SSRF**           | `ssrf-fetch`, `ssrf-axios`                                                                  | Generic               |
| **React**              | `react-dangerously-set-inner-html`, `react-xss-prop`                                        | React                 |
| **Playwright**         | `playwright-hardcoded-credentials`                                                          | Playwright            |

---

## 9. Workflow reutilizable quality.yml (cross-cutting)

**Archivo:** `.github/workflows/quality.yml` — invocado vía `workflow_call` desde `ci.yml` y `workflow_dispatch` manual.

```yaml
# quality.yml — extracto (ref: quality.yml:1-60)
name: Code Quality
on:
  workflow_call:
    inputs:
      run-client:
        required: true
        type: string
      run-server:
        required: true
        type: string
  workflow_dispatch:
    inputs:
      run-client:
        required: true
        type: choice
        options: ['true', 'false']
      run-server:
        required: true
        type: choice
        options: ['true', 'false']

permissions:
  contents: read

jobs:
  quality:
    name: Lint + Format Check + TypeCheck
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version-file: '.nvmrc'
          cache: 'npm'
      - run: npm ci

      # Client checks (condicional)
      - name: Client Lint
        if: ${{ inputs.run-client == 'true' }}
        run: npm run lint --workspace=apps/client
      - name: Client Format Check
        if: ${{ inputs.run-client == 'true' }}
        run: npm run format:check --workspace=apps/client

      # Server checks (condicional)
      - name: Server Lint
        if: ${{ inputs.run-server == 'true' }}
        run: npm run lint --workspace=apps/server
      - name: Server Format Check
        if: ${{ inputs.run-server == 'true' }}
        run: npm run format:check --workspace=apps/server

      # Typecheck global (best-effort)
      - name: Type Check
        run: npm run typecheck || echo "Typecheck skipped - script not defined"
```

**Invocación desde `ci.yml` (ref: `ci.yml:quality job`):**

```yaml
quality:
  name: Code Quality
  needs: changes
  uses: ./.github/workflows/quality.yml
  with:
    run-client: ${{ needs.changes.outputs.frontend == 'true' || needs.changes.outputs.shared == 'true' }}
    run-server: ${{ needs.changes.outputs.backend == 'true' || needs.changes.outputs.shared == 'true' }}
```

---

## 10. Stage 5 — Deploy (Despliegue)

### 10.1 Disparadores

| Workflow      | Trigger                                                                    | Qué despliega                                                                         |
| ------------- | -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| `preview.yml` | `pull_request` (opened/reopened/synchronize vs main) + `workflow_dispatch` | Preview environment por PR (Floci + Postgres + Docker server + Vercel URL)            |
| `deploy.yml`  | `push` a `main` + `workflow_dispatch`                                      | CD pipeline: Docker build → ECR (OIDC) → ECS Fargate Staging → ECS Fargate Production |
| `release.yml` | `push` a `main`                                                            | **Solo paquetes npm** via Changesets (NO deploy de app)                               |

### 10.2 `preview.yml` — Preview Environments por PR (ref: `.github/workflows/preview.yml`)

```yaml
# preview.yml — resumen de job preview
name: Preview Environments
on:
  pull_request:
    types: [opened, reopened, synchronize]
    branches: [main]
  workflow_dispatch:

concurrency:
  group: preview-${{ github.event.pull_request.number }}
  cancel-in-progress: true

permissions:
  contents: read
  pull-requests: write
  statuses: read

jobs:
  preview:
    name: Preview Validation
    runs-on: ubuntu-latest
    timeout-minutes: 15
    services:
      floci: # Emulador AWS
        image: floci/floci:1.5.31
        ports: ['4566:4566']
        env:
          FLOCI_STORAGE_MODE: memory
        options: >-
          --health-cmd="curl -f http://localhost:4566/_localstack/health"
          --health-interval=5s --health-timeout=3s --health-retries=10
      db:
        image: postgres:16-alpine
        env:
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
          POSTGRES_DB: project_one_preview
    steps:
      - uses: actions/checkout@v4
      - uses: ./.github/actions/setup-monorepo
      - name: Build server Docker image
        run: docker build -t preview-server -f apps/server/Dockerfile .
      - name: Run migrations
        env:
          DATABASE_URL: postgresql://test:test@localhost:5432/project_one_preview
        run: npx prisma migrate deploy
      - name: Start preview server with Floci
        run: |
          docker run -d --name preview-server --network host \
            -e DATABASE_URL=postgresql://test:test@localhost:5432/project_one_preview \
            -e AWS_ENDPOINT_URL=http://localhost:4566 \
            -e AWS_ACCESS_KEY_ID=test \
            -e AWS_SECRET_ACCESS_KEY=test \
            -e AWS_REGION=us-east-1 \
            -e PORT=3000 \
            -e ENABLE_SMOKE_ROUTE=true \
            -e AES_GCM_KEY=AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA= \
            -e ALGORITHM=aes-256-gcm \
            preview-server
      - name: Health check (accept 200 or 503 degraded)
        run: |
          for i in {1..30}; do
            code=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/health)
            if [ "$code" = "200" ] || [ "$code" = "503" ]; then exit 0; fi
            sleep 2
          done
          exit 1
      - name: Smoke tests vs Floci
        env:
          AWS_ENDPOINT_URL: http://localhost:4566
          AWS_ACCESS_KEY_ID: test
          AWS_SECRET_ACCESS_KEY: test
          AWS_REGION: us-east-1
        run: node apps/server/scripts/preview-smoke.mjs
      - name: Capture Vercel Preview URL
        run: |
          # Poll GitHub commit statuses for vercel context
          for i in {1..12}; do
            url=$(gh api repos/${{ github.repository }}/commits/${{ github.event.pull_request.head.sha }}/statuses --jq '.[] | select(.context | startswith("vercel")) | .target_url' | head -1)
            if [ -n "$url" ]; then echo "VERCEL_URL=$url" >> $GITHUB_ENV; break; fi
            sleep 5
          done
      - name: Find/Create PR comment
        uses: peter-evans/find-comment@v3
        id: fc
        with:
          issue-number: ${{ github.event.pull_request.number }}
          comment-author: github-actions[bot]
          body-includes: '<!-- preview-environments -->'
      - name: Create or update comment
        uses: peter-evans/create-or-update-comment@v4
        with:
          issue-number: ${{ github.event.pull_request.number }}
          body: |
            <!-- preview-environments -->
            ## 🚀 Preview Environment Status

            **Frontend (Vercel):** ${{ env.VERCEL_URL || '⏳ Capturando...' }}
            **Backend (Floci + Postgres):** ${{ job.status == 'success' && '✅ Validado' || '❌ Fallido' }}

            _Actualizado: ${{ github.event.pull_request.updated_at }}_
          edit-mode: replace
```

**Flujo del preview:**

1. Levanta **Floci** (AWS emulator) + **PostgreSQL** como services.
2. Build Docker image del server.
3. Migra BD + arranca container con `AWS_ENDPOINT_URL=http://localhost:4566`.
4. Health check acepta **200 (healthy)** o **503 (degraded DB ok)**.
5. Smoke tests ejecutan `preview-smoke.mjs` contra **Secrets Manager emulado** (CreateSecret/GetSecretValue).
6. Captura **Vercel Preview URL** via `gh api` polling commit statuses (context starts with "vercel").
7. Publica/actualiza comentario en PR con marker `<!-- preview-environments -->`.

### 10.3 `deploy.yml` — CD Deploy Pipeline (2 fases) (ref: `.github/workflows/deploy.yml`)

```yaml
# deploy.yml — estructura general
name: CD Deploy Pipeline
on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read

# Fase 1: Sin AWS (validación local con emulador)
# Fase 2: Con AWS (gatillada por vars.AWS_ROLE_ARN != '')
```

#### Fase 1 — `docker-build` (Build & Validate - Emulated Stack)

Ya detallado en **Stage 2 (Build)**. Valida imagen Docker contra Floci + Postgres **sin credenciales AWS reales**.

#### Fase 2 — `ecr-push` (Push to ECR via OIDC) (ref: `deploy.yml:100-130`)

```yaml
ecr-push:
  name: Push to ECR
  needs: docker-build
  if: ${{ vars.AWS_ROLE_ARN != '' }} # GATE: solo si hay role ARN configurado
  runs-on: ubuntu-latest
  permissions:
    contents: read
    id-token: write # 🔑 OIDC: permite assumir role AWS sin credenciales estáticas
  steps:
    - uses: actions/checkout@v5
    - name: Configure AWS Credentials (OIDC)
      uses: aws-actions/configure-aws-credentials@v6
      with:
        role-to-assume: ${{ vars.AWS_ROLE_ARN }}
        aws-region: ${{ vars.AWS_REGION || 'us-east-1' }}
    - name: Login to Amazon ECR
      uses: aws-actions/amazon-ecr-login@v2
    - name: Build, tag, and push image
      env:
        ECR_REGISTRY: ${{ vars.AWS_ACCOUNT_ID }}.dkr.ecr.${{ vars.AWS_REGION || 'us-east-1' }}.amazonaws.com
        IMAGE_TAG: ${{ github.sha }}
      run: |
        docker tag project-one-server:${{ github.sha }} ${ECR_REGISTRY}/project-one-server:${IMAGE_TAG}
        docker tag project-one-server:${{ github.sha }} ${ECR_REGISTRY}/project-one-server:latest
        docker push ${ECR_REGISTRY}/project-one-server:${IMAGE_TAG}
        docker push ${ECR_REGISTRY}/project-one-server:latest
```

> **OIDC (OpenID Connect):** GitHub emite un token JWT (`id-token: write`) que AWS valida contra el provider GitHub configurado en IAM. El role `vars.AWS_ROLE_ARN` tiene policy `sts:AssumeRoleWithWebIdentity` restringida a `repo:org/project-one:ref:refs/heads/main`. **Cero credenciales estáticas** en GitHub Secrets.

#### Fase 2 — `deploy-staging` (Deploy to Staging) (ref: `deploy.yml:135-200`)

```yaml
deploy-staging:
  name: Deploy to Staging
  needs: ecr-push
  if: ${{ vars.AWS_ROLE_ARN != '' }}
  runs-on: ubuntu-latest
  environment: staging # 🔒 GitHub Environment: protection rules, secrets
  concurrency:
    group: deploy-staging
    cancel-in-progress: false
  permissions:
    contents: read
    id-token: write
  steps:
    - name: Configure AWS Credentials (OIDC)
      uses: aws-actions/configure-aws-credentials@v4
      with:
        role-to-assume: ${{ vars.AWS_ROLE_ARN }}
        aws-region: us-east-1
    - name: Register ECS Task Definition
      id: task-def
      run: |
        aws ecs register-task-definition \
          --family project-one-staging-api \
          --network-mode awsvpc \
          --requires-compatibilities FARGATE \
          --cpu 256 \
          --memory 512 \
          --execution-role-arn ${{ secrets.STAGING_TASK_EXECUTION_ROLE_ARN }} \
          --task-role-arn ${{ secrets.STAGING_TASK_ROLE_ARN }} \
          --container-definitions file://apps/server/ecs-task-def-staging.json \
          --log-configuration logDriver=awslogs,options={awslogs-group=/ecs/project-one-staging,awslogs-region=us-east-1,awslogs-stream-prefix=ecs} \
          --health-check command="CMD-SHELL,curl -f http://localhost:3000/health || exit 1",interval=30,timeout=5,retries=3,startPeriod=60
      # Outputs taskDefinitionArn
    - name: Update ECS Service (with Circuit Breaker)
      run: |
        aws ecs update-service \
          --cluster project-one-cluster \
          --service project-one-staging-api \
          --task-definition ${{ steps.task-def.outputs.taskDefinitionArn }} \
          --force-new-deployment \
          --deployment-configuration "deploymentCircuitBreaker={enable=true,rollback=true},maximumPercent=200,minimumHealthyPercent=100"
    - name: Wait for Service Stability
      run: aws ecs wait services-stable --cluster project-one-cluster --services project-one-staging-api
    - name: Post-deploy Health Check
      env:
        STAGING_URL: ${{ secrets.STAGING_URL }}
      run: |
        for i in {1..30}; do
          if curl -f ${STAGING_URL}/health; then exit 0; fi
          sleep 10
        done
        exit 1
    - name: Remote Smoke Tests
      env:
        BASE_URL: ${{ secrets.STAGING_URL }}
      run: npm run test:smoke:ci --workspace=server-express
```

**ECS Task Definition (inline en step o archivo `ecs-task-def-staging.json`):**

```json
{
  "containerDefinitions": [
    {
      "name": "api",
      "image": "${ECR_REGISTRY}/project-one-server:${IMAGE_TAG}",
      "portMappings": [{ "containerPort": 3000, "protocol": "tcp" }],
      "environment": [
        { "name": "PORT", "value": "3000" },
        { "name": "NODE_ENV", "value": "production" },
        { "name": "AWS_REGION", "value": "us-east-1" }
      ],
      "secrets": [
        {
          "name": "DATABASE_URL",
          "valueFrom": "${{ secrets.STAGING_DATABASE_URL_SECRET_ARN }}"
        },
        {
          "name": "SECRETKEY",
          "valueFrom": "${{ secrets.STAGING_JWT_SECRET_SECRET_ARN }}"
        },
        {
          "name": "REFRESHSECRETKEY",
          "valueFrom": "${{ secrets.STAGING_REFRESH_SECRETKEY_SECRET_ARN }}"
        },
        {
          "name": "AWS_REGION",
          "valueFrom": "${{ secrets.STAGING_AWS_REGION_SECRET_ARN }}"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/project-one-staging",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      },
      "healthCheck": {
        "command": [
          "CMD-SHELL",
          "curl -f http://localhost:3000/health || exit 1"
        ],
        "interval": 30,
        "timeout": 5,
        "retries": 3,
        "startPeriod": 60
      }
    }
  ]
}
```

#### Fase 2 — `deploy-production` (Deploy to Production) (ref: `deploy.yml:205-270`)

Igual a staging con diferencias:

- `environment: production` → **requiere approval manual** (GitHub Environment protection rule)
- `family: project-one-prod-api`
- `cpu: 512`, `memory: 1024`
- Secrets: `PROD_DATABASE_URL_SECRET_ARN`, `PROD_JWT_SECRET_SECRET_ARN`, `PROD_AWS_REGION_SECRET_ARN`
- Health check 5 min (30 × 10s)
- `BASE_URL=${{ secrets.PROD_URL }}` para smoke tests

#### Jobs Skipped (cuando `AWS_ROLE_ARN == ''`)

```yaml
ecr-push-skipped:
  name: ECR Push Skipped
  needs: docker-build
  if: ${{ vars.AWS_ROLE_ARN == '' }}
  runs-on: ubuntu-latest
  steps:
    - run: echo "::notice::ECR push skipped — configure vars.AWS_ROLE_ARN to enable"

deploy-staging-skipped:
  name: Deploy Staging Skipped
  needs: docker-build
  if: ${{ vars.AWS_ROLE_ARN == '' }}
  runs-on: ubuntu-latest
  steps:
    - run: echo "::notice::Staging deploy skipped — configure vars.AWS_ROLE_ARN and staging secrets"

deploy-production-skipped:
  name: Deploy Production Skipped
  needs: docker-build
  if: ${{ vars.AWS_ROLE_ARN == '' }}
  runs-on: ubuntu-latest
  steps:
    - run: echo "::notice::Production deploy skipped — configure vars.AWS_ROLE_ARN, production secrets, and environment protection rules"
```

### 10.4 `release.yml` — Changesets Release (solo npm packages) (ref: `.github/workflows/release.yml`)

```yaml
# release.yml
name: Release
on:
  push:
    branches: [main]

permissions:
  contents: write
  pull-requests: write

jobs:
  release:
    name: Release packages
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6
        with:
          fetch-depth: 0
      - uses: actions/setup-node@v5
        with:
          node-version-file: '.nvmrc'
          cache: 'npm'
      - run: npm ci
      - uses: changesets/action@v2
        with:
          version-script: npm run version:packages
          pr-title: 'chore: version packages'
          commit-message: 'chore: version packages'
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

**Comportamiento:**

1. Push a `main` → si hay changesets pendientes → abre PR "chore: version packages".
2. Merge PR → `changesets/action` publica a npm + crea git tags.
3. **NO despliega la app** — solo versiona/publica paquetes del monorepo.

---

## 11. Stage 6 — Operate & Monitor (Operación y monitoreo)

### 11.1 Circuit Breaker ECS + Rollback Automático

```yaml
# En aws ecs update-service (deploy-staging y deploy-production)
--deployment-configuration "deploymentCircuitBreaker={enable=true,rollback=true},maximumPercent=200,minimumHealthyPercent=100"
```

**Cómo funciona:**

- `enable=true`: Activa circuit breaker — ECS monitorea health checks de las nuevas tareas.
- `rollback=true`: Si health checks fallan durante deployment → **rollback automático** a task definition anterior.
- `maximumPercent=200`: Permite hasta 200% de desired count durante deploy (rolling update).
- `minimumHealthyPercent=100`: Mantiene 100% de tareas saludables durante deploy.

### 11.2 Health Checks Post-Deploy

| Entorno             | Endpoint                            | Retries | Interval | Timeout total          |
| ------------------- | ----------------------------------- | ------- | -------- | ---------------------- |
| **Staging**         | `${{ secrets.STAGING_URL }}/health` | 30      | 10s      | 5 min                  |
| **Production**      | `${{ secrets.PROD_URL }}/health`    | 30      | 10s      | 5 min                  |
| **Preview**         | `http://localhost:3000/health`      | 30      | 2s       | 60s (acepta 200 o 503) |
| **CI docker-build** | `http://localhost:3000/health`      | 30      | 2s       | 60s                    |

Health check en task definition (ECS):

```json
"healthCheck": {
  "command": ["CMD-SHELL", "curl -f http://localhost:3000/health || exit 1"],
  "interval": 30,
  "timeout": 5,
  "retries": 3,
  "startPeriod": 60
}
```

### 11.3 Smoke Tests Post-Deploy (Validación Runtime)

```bash
# Ejecutados en deploy-staging y deploy-production
BASE_URL=${{ secrets.STAGING_URL }} npm run test:smoke:ci --workspace=server-express
# Valida: GET /health, GET /api/status, POST /api/auth/test (si ENABLE_SMOKE_ROUTE)
```

### 11.4 Retención de Artifacts

| Artifact                    | Workflow                              | Retención           | Propósito                                 |
| --------------------------- | ------------------------------------- | ------------------- | ----------------------------------------- |
| **SBOM (CycloneDX JSON)**   | `security.yml`, `security-digest.yml` | 365 días            | Auditoría de componentes, compliance      |
| **Security Digest**         | `security-digest.yml`                 | 365 días            | Reporte consolidado semanal               |
| **Gitleaks Report (JSON)**  | `scheduled-security.yml`              | 30 días             | Historial de secretos full-scan           |
| **Gitleaks SARIF**          | `scheduled-security.yml`              | GitHub Security tab | Visualización en Security > Code scanning |
| **OSV Report**              | `security-digest.yml`                 | 365 días            | Vulnerabilidades + licencias de deps      |
| **Playwright Test Results** | `ci.yml:e2e`                          | Default (90d)       | Debug de flaky tests                      |
| **JUnit Reports**           | Todos los test jobs                   | Default             | GitHub Checks annotations                 |

### 11.5 Tasks Programadas (Cron)

| Workflow                        | Cron                        | Qué hace                                                                   |
| ------------------------------- | --------------------------- | -------------------------------------------------------------------------- |
| `scheduled-security.yml`        | `0 3 * * 1` (Mon 03:00 UTC) | Gitleaks full-history scan → JSON + SARIF artifact + Security tab          |
| `security-digest.yml`           | `0 3 * * 1` (Mon 03:00 UTC) | SBOM + OSV Scanner + Digest generation → artifact + PR comment si critical |
| `dependabot.yml` (3 ecosystems) | Weekly Mon 03:00 UTC        | PRs automáticos para actualizaciones de deps                               |

### 11.6 SBOM como Inventario de Componentes

- Generado por `anchore/sbom-action@v0.24.0` en formato **CycloneDX JSON**.
- Incluye: nombre, versión, licencia, purl, hashes de cada paquete npm (prod + dev).
- Usado por `security-digest.yml` para correlacionar con OSV Scanner y Gitleaks.
- Retención 365 días para compliance/auditoría.

### 11.7 Dependabot como Prevención Continua

- **npm:** Agrupa dev-deps (eslint, prettier, typescript, vitest, testing-library, types) → PRs semanales.
- **github-actions:** PRs semanales con prefix `ci:`.
- **docker (apps/server):** PRs semanales para base images.
- **Ignore majors de React** → evita breaking changes automáticos.

---

## 12. Técnicas aplicadas (recopilación de patrones)

| Técnica                              | Dónde se aplica                                                                                                                                       | Beneficio                                                                                               |
| ------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| **Shifting Left**                    | Stage 1 (pre-commit: Semgrep, Gitleaks, lint-staged) → Stage 3 (pre-push: vitest --changed) → Stage 4 (PR: security.yml) → Stage 6 (Cron: full scans) | Detecta defects/secretos temprano; coste de fix exponencialmente menor                                  |
| **Path Filtering**                   | `ci.yml:changes` job → `dorny/paths-filter@v3`                                                                                                        | Salta jobs innecesarios (ej. no testea server si solo cambia client); CI más rápido                     |
| **Concurrency Groups**               | `ci.yml: concurrency: pr-${{PR}} cancel-in-progress: true`; `deploy.yml: deploy-staging/deploy-production cancel-in-progress: false`                  | No gasta minutos en runs obsoletos de PR; deploy no se cancela automáticamente                          |
| **Caching Strategy**                 | npm (setup-node), Vitest (composite action), Playwright browsers (actions/cache)                                                                      | CI ~40-60% más rápido en runs posteriores                                                               |
| **Test Reporting (JUnit)**           | `dorny/test-reporter@v3` en todos los test jobs                                                                                                       | Fallos como annotations clickeables en PR Checks; feedback inmediato                                    |
| **Reusable Workflows**               | `quality.yml` via `workflow_call` desde `ci.yml`                                                                                                      | DRY: lint/format/typecheck definido una vez, usado en CI y manual                                       |
| **Composite Actions**                | `setup-monorepo` (node + npm ci + vitest cache; checkout es del job invocador)                                                                        | Encapsula setup común; versionado independiente; testeable                                              |
| **OIDC for Cloud Auth**              | `deploy.yml: ecr-push`, `deploy-staging`, `deploy-production` → `aws-actions/configure-aws-credentials@v4` con `id-token: write`                      | **Cero credenciales estáticas**; token JWT de corta vida; audit trail en CloudTrail                     |
| **Service Containers**               | `ci.yml: test-integration`, `test-smoke`, `e2e` → `postgres:16-alpine` con healthcheck                                                                | BD real efímera por job; aislamiento total; no BD compartida                                            |
| **ECS Circuit Breaker**              | `deploy.yml: update-service --deployment-configuration deploymentCircuitBreaker={enable=true,rollback=true}`                                          | Rollback automático si health checks fallan; zero-downtime deploy seguro                                |
| **Environment-based Approval Gates** | `deploy.yml: environment: staging` / `environment: production`                                                                                        | Staging: auto-deploy; Production: **manual approval** requerida (protection rule)                       |
| **Zero-trust: Floci Emulator**       | `deploy.yml:docker-build`, `preview.yml` → `floci/floci:1.5.31`                                                                                       | Valida contra AWS APIs (Secrets Manager, etc.) **sin credenciales reales**; MIT license, storage memory |
| **Zombie Workflow Guard**            | `ci.yml:zombie-workflow-guard`                                                                                                                        | Anti-regresión: falla si workflows legacy reaparecen                                                    |
| **Preview Environments per PR**      | `preview.yml`                                                                                                                                         | Stack completo efímero por PR; comentario automático con Vercel URL + backend status                    |
| **Changesets Release**               | `release.yml`                                                                                                                                         | Versionado semántico automático; changelog generado; npm publish al mergear                             |
| **Security Digest Automation**       | `security-digest.yml` + `generate-security-digest.mjs`                                                                                                | Consolidación semanal SBOM + OSV + Gitleaks → actionable comment en PR                                  |

---

## 13. Herramientas y tecnologías (tabla)

| Categoría              | Herramienta                                                    | Versión / Tag                                                  | Rol en pipeline                                      |
| ---------------------- | -------------------------------------------------------------- | -------------------------------------------------------------- | ---------------------------------------------------- |
| **CI/CD Platform**     | GitHub Actions                                                 | —                                                              | Orquestación de workflows                            |
| **Node Version**       | `.nvmrc`                                                       | (ej. 20.x)                                                     | Single source of truth Node version                  |
| **Monorepo**           | npm Workspaces                                                 | npm 10+                                                        | Gestión de workspaces (client, server, e2e)          |
| **Frontend**           | React 18, Vite, Tailwind, shadcn/ui, Redux Toolkit, RTK Query  | —                                                              | Build: `npm run build --workspace=apps/client`       |
| **Backend**            | Express, Prisma ORM, PostgreSQL                                | —                                                              | Build: Docker multi-stage; Tests: Vitest             |
| **E2E**                | Playwright                                                     | Chromium project                                               | `npx playwright test --project=chromium`             |
| **Testing**            | Vitest, Testing Library, MSW                                   | —                                                              | Unit, Integration, Component                         |
| **Lint**               | ESLint v9 (flat config)                                        | —                                                              | `npm run lint`                                       |
| **Format**             | Prettier v3                                                    | —                                                              | `npm run format:check`                               |
| **Git Hooks**          | Husky v9                                                       | —                                                              | pre-commit, commit-msg, pre-push                     |
| **Staged Lint**        | lint-staged                                                    | —                                                              | Prettier + ESLint en staged                          |
| **Commit Standard**    | commitlint + @commitlint/config-conventional                   | —                                                              | Conventional Commits validation                      |
| **Path Filtering**     | dorny/paths-filter@v4                                          | —                                                              | Conditional job execution                            |
| **Test Reporting**     | dorny/test-reporter@v3                                         | —                                                              | JUnit XML → GitHub Checks                            |
| **SAST Local**         | Semgrep                                                        | `semgrep/semgrep:latest`                                       | 100+ reglas OWASP en pre-commit                      |
| **SAST CI**            | GitHub CodeQL                                                  | `github/codeql-action@v4`                                      | JavaScript + Actions analysis en PR                  |
| **SCA**                | Trivy                                                          | `aquasecurity/trivy-action@0.36.0`                             | FS scan CRITICAL/HIGH (fail-closed, SARIF)           |
| **Secret Scanning**    | Gitleaks                                                       | `zricethezav/gitleaks:v8.22.1` + `gitleaks/gitleaks-action@v3` | Pre-commit staged + PR diff + full-history cron      |
| **SBOM**               | anchore/sbom-action@v0.24.0                                    | —                                                              | CycloneDX JSON generation                            |
| **Vuln Scanner**       | OSV Scanner                                                    | `google/osv-scanner-action@v2.5.0`                             | package-lock.json scan                               |
| **Dependency Review**  | actions/dependency-review-action@v5                            | —                                                              | PR dependency vuln/license gate                      |
| **Container**          | Docker                                                         | `apps/server/Dockerfile` multi-stage                           | Server image build                                   |
| **AWS Emulator**       | Floci                                                          | `floci/floci:1.5.31`                                           | Secrets Manager, S3 emulation en CI/CD               |
| **Cloud Deploy**       | AWS ECS Fargate                                                | —                                                              | Staging + Production services                        |
| **Container Registry** | Amazon ECR                                                     | —                                                              | Image storage (OIDC auth)                            |
| **AWS Auth**           | aws-actions/configure-aws-credentials@v6 + amazon-ecr-login@v2 | —                                                              | OIDC role assumption                                 |
| **IaC (Partial)**      | AWS CLI inline                                                 | —                                                              | `register-task-definition`, `update-service`, `wait` |
| **Release**            | Changesets                                                     | `changesets/action@v2`                                         | Version packages + npm publish                       |
| **Dependency Updates** | Dependabot                                                     | 3 ecosystems                                                   | Automated PRs weekly                                 |
| **Preview Comment**    | peter-evans/find-comment@v4 + create-or-update-comment@v5      | —                                                              | PR comment management                                |
| **Vercel Integration** | gh api (GitHub CLI)                                            | —                                                              | Capture preview URL from commit statuses             |

---

## 14. Secretos y variables requeridos (tabla)

| Nombre lógico                                  | Workflow/Job                                                                                                         | Requerido       | Descripción                                                                                                                                                                                                                                                                                                                               |
| ---------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- | --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `secrets.GIT_LEAKS`                            | `security.yml:secrets` (Gitleaks Pro)                                                                                | ⚠️ Opcional     | Licencia Gitleaks Pro; si ausente, usa OSS mode                                                                                                                                                                                                                                                                                           |
| `vars.AWS_ROLE_ARN`                            | `deploy.yml:ecr-push`, `deploy-staging`, `deploy-production`                                                         | ✅ Para CD      | ARN del role IAM para OIDC (ej. `arn:aws:iam::123456789:role/GitHubActionsDeploy`)                                                                                                                                                                                                                                                        |
| `vars.AWS_ACCOUNT_ID`                          | `deploy.yml:ecr-push`                                                                                                | ✅ Para CD      | Account ID para construir ECR registry URL                                                                                                                                                                                                                                                                                                |
| `secrets.STAGING_URL`                          | `deploy.yml:deploy-staging` (health + smoke)                                                                         | ✅ Para Staging | URL base del entorno staging (ej. `https://staging.api.example.com`)                                                                                                                                                                                                                                                                      |
| `secrets.PROD_URL`                             | `deploy.yml:deploy-production` (health + smoke)                                                                      | ✅ Para Prod    | URL base del entorno production                                                                                                                                                                                                                                                                                                           |
| `secrets.STAGING_DATABASE_URL_SECRET_ARN`      | `deploy.yml:deploy-staging` (task def secrets)                                                                       | ✅ Para Staging | ARN de secret en AWS Secrets Manager con DATABASE_URL staging                                                                                                                                                                                                                                                                             |
| `secrets.STAGING_JWT_SECRET_SECRET_ARN`        | `deploy.yml:deploy-staging` (task def secrets)                                                                       | ✅ Para Staging | ARN de secret con la **SECRETKEY real** de staging — el env var inyectado es `SECRETKEY` (el código lee `SECRETKEY`/`REFRESHSECRETKEY` en `createToken.js`/`socket/auth.js`; **NO `JWT_SECRET`** — ese nombre no existe en `apps/server/src/`; el ARN legacy conserva el nombre `JWT_SECRET` pero el env var del task def es `SECRETKEY`) |
| `secrets.STAGING_REFRESH_SECRETKEY_SECRET_ARN` | `deploy.yml:deploy-staging` (task def secrets)                                                                       | ✅ Para Staging | ARN **NUEVO** (2026-08-10) con la `REFRESHSECRETKEY` real de staging — requerida por `createToken.js:33,173` para renovar refresh tokens                                                                                                                                                                                                  |
| `secrets.STAGING_AWS_REGION_SECRET_ARN`        | `deploy.yml:deploy-staging` (task def secrets)                                                                       | ✅ Para Staging | ARN de secret con AWS_REGION staging                                                                                                                                                                                                                                                                                                      |
| `secrets.PROD_DATABASE_URL_SECRET_ARN`         | `deploy.yml:deploy-production` (task def secrets)                                                                    | ✅ Para Prod    | ARN de secret con DATABASE_URL production                                                                                                                                                                                                                                                                                                 |
| `secrets.PROD_JWT_SECRET_SECRET_ARN`           | `deploy.yml:deploy-production` (task def secrets)                                                                    | ✅ Para Prod    | ARN de secret con la **SECRETKEY real** de producción — env var inyectado `SECRETKEY` (NO `JWT_SECRET`; ver nota en staging)                                                                                                                                                                                                              |
| `secrets.PROD_REFRESH_SECRETKEY_SECRET_ARN`    | `deploy.yml:deploy-production` (task def secrets)                                                                    | ✅ Para Prod    | ARN **NUEVO** (2026-08-10) con la `REFRESHSECRETKEY` real de producción                                                                                                                                                                                                                                                                   |
| `secrets.PROD_AWS_REGION_SECRET_ARN`           | `deploy.yml:deploy-production` (task def secrets)                                                                    | ✅ Para Prod    | ARN de secret con AWS_REGION production                                                                                                                                                                                                                                                                                                   |
| `secrets.STAGING_AES_GCM_KEY_SECRET_ARN`       | `deploy.yml:deploy-staging` (task def secrets)                                                                       | ✅ Para Staging | ARN de secret con **AES_GCM_KEY real** (32 bytes base64) — requerida por el middleware de encripción en el bootstrap del server; sin ella el task de ECS aborta antes de `listen(3000)` y el health check post-deploy falla                                                                                                               |
| `secrets.PROD_AES_GCM_KEY_SECRET_ARN`          | `deploy.yml:deploy-production` (task def secrets)                                                                    | ✅ Para Prod    | ARN de secret con **AES_GCM_KEY real de producción** (32 bytes base64, distinta de staging) — ver arriba                                                                                                                                                                                                                                  |
| `secrets.STAGING_TASK_EXECUTION_ROLE_ARN`      | `deploy.yml:deploy-staging` (task def)                                                                               | ✅ Para Staging | ARN del execution role para task ECS staging (debe tener acceso de lectura a los secrets de staging)                                                                                                                                                                                                                                      |
| `secrets.STAGING_TASK_ROLE_ARN`                | `deploy.yml:deploy-staging` (task def)                                                                               | ✅ Para Staging | ARN del task role para task ECS staging                                                                                                                                                                                                                                                                                                   |
| `secrets.PROD_TASK_EXECUTION_ROLE_ARN`         | `deploy.yml:deploy-production` (task def)                                                                            | ✅ Para Prod    | ARN del execution role para task ECS production                                                                                                                                                                                                                                                                                           |
| `secrets.PROD_TASK_ROLE_ARN`                   | `deploy.yml:deploy-production` (task def)                                                                            | ✅ Para Prod    | ARN del task role para task ECS production                                                                                                                                                                                                                                                                                                |
| `ALGORITHM` (inline, no secret)                | `deploy.yml` task defs staging/prod + `preview.yml` + `deploy.yml:docker-build`                                      | ✅ Siempre      | `aes-256-gcm` — constante pública del algoritmo de cifrado; se pasa como `environment` (no como secret)                                                                                                                                                                                                                                   |
| `AES_GCM_KEY` (dummy inline)                   | `preview.yml:Start server container`, `deploy.yml:docker-build:Start server container`, `docker-compose.preview.yml` | ✅ CI/preview   | `AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=` — **dummy de 32 bytes cero**; seguro porque el stack emulado nunca persiste ni desencripta datos reales. Mantiene la clave real fuera de los archivos de workflow                                                                                                                          |
| `secrets.GITHUB_TOKEN`                         | `release.yml`, `security-digest.yml`                                                                                 | ✅ Auto         | Token automático de GitHub Actions                                                                                                                                                                                                                                                                                                        |

> **Nota:** Todos los secretos de staging/production se almacenan en **AWS Secrets Manager** y se referencian por ARN en la task definition ECS. GitHub solo guarda los ARNs, no los valores.
>
> **Sobre `AES_GCM_KEY` / `ALGORITHM`** (remediación 2026-08-10): el middleware `apps/server/src/middleware/encription-prisma-middleware.js:4-17` lee ambas env vars en el bootstrap del módulo y **lanza `throw` si faltan**, abortando el proceso Node antes de `httpServer.listen(3000)` → en CI el health check falla con `curl exit code 7` (connection refused). Aplica en:
>
> - **CI/preview** (`preview.yml`, `deploy.yml:docker-build`, `docker-compose.preview.yml`): **dummy key inline** (stack efímero, sin datos reales).
> - **Staging/Prod** (`deploy.yml:deploy-staging`, `deploy-production`): **clave real via Secrets Manager** (`*_AES_GCM_KEY_SECRET_ARN`), `ALGORITHM` como `environment` inline.
>
> Referencia operativa completa: `docs/server-bootstrap-env-vars.md`.

---

## 15. Cobertura de pruebas (tabla)

| Tipo                       | Workspace       | Comando Local                                         | En CI (`ci.yml`) | Job CI                | Service Container      | Reporte        |
| -------------------------- | --------------- | ----------------------------------------------------- | ---------------- | --------------------- | ---------------------- | -------------- |
| **Unitarias (Client)**     | `apps/client`   | `npm run test:unit --workspace=client-react`          | ✅               | `test-unit-client`    | No                     | JUnit → Checks |
| **Unitarias (Server)**     | `apps/server`   | `npm run test:unit --workspace=server-express`        | ✅               | `test-unit-server`    | No                     | JUnit → Checks |
| **Integración (Server)**   | `apps/server`   | `npm run test:integration --workspace=server-express` | ✅               | `test-integration`    | **postgres:16-alpine** | JUnit → Checks |
| **Smoke (Server CI)**      | `apps/server`   | `npm run test:smoke:ci --workspace=server-express`    | ✅               | `test-smoke`          | **postgres:16-alpine** | JUnit → Checks |
| **Smoke (Preview)**        | `apps/server`   | `node apps/server/scripts/preview-smoke.mjs`          | ✅               | `preview.yml:preview` | Floci + Postgres       | Console output |
| **Smoke (Deploy Staging)** | `apps/server`   | `npm run test:smoke:ci --workspace=server-express`    | ✅               | `deploy-staging`      | No (remote)            | Console output |
| **Smoke (Deploy Prod)**    | `apps/server`   | `npm run test:smoke:ci --workspace=server-express`    | ✅               | `deploy-production`   | No (remote)            | Console output |
| **E2E (Playwright)**       | `e2e/`          | `npm run test`                                        | ✅               | `e2e`                 | **postgres:16-alpine** | JUnit → Checks |
| **Build**                  | Todos (ws)      | `npm run build --ws --if-present`                     | ✅               | `build` (always)      | No                     | Exit code      |
| **Lint + Format**          | Client + Server | `npm run lint` + `npm run format:check`               | ✅               | `quality` (reusable)  | No                     | Exit code      |
| **Typecheck**              | —               | `npm run typecheck`                                   | ⚠️ Skipped       | `quality`             | No                     | Echo "skipped" |

**Condicionalidad (Path Filtering):**

- Unit Client: `frontend || shared`
- Unit Server: `backend || shared`
- Integration: `backend || shared`
- Smoke CI: `backend || shared`
- E2E: `e2e || shared`
- Quality: inputs desde `changes` outputs

---

## 16. Diagrama del flujo (Mermaid) — diagrama final del flujo del código

```mermaid
flowchart TD
    %% ============ SOURCE ============
    subgraph Source["🟢 STAGE 1: SOURCE (Local)"]
        direction TB
        S1[git commit] --> S2[.husky/pre-commit]
        S2 --> S3[lint-staged: Prettier + ESLint --max-warnings 0]
        S2 --> S4[Semgrep SAST 100+ reglas OWASP\nstaged files only]
        S2 --> S5[Gitleaks protect --staged\n.gitleaks.toml custom]
        S1 --> S6[.husky/commit-msg]
        S6 --> S7[commitlint: Conventional Commits]
        S1 --> S8[git push]
        S8 --> S9[.husky/pre-push]
        S9 --> S10[vitest --changed origin/main\nserver + client scoped]
    end

    %% ============ BUILD ============
    subgraph Build["🔵 STAGE 2: BUILD (CI)"]
        direction TB
        B1[ci.yml triggered\npull_request → main] --> B2[Job: changes\ndorny/paths-filter]
        B2 --> B3[Job: quality\nworkflow_call quality.yml\nlint + format:check]
        B2 --> B4[Job: build\nnpm run build --ws\nif: always]
        B2 -.->|Docker| B5[deploy.yml: docker-build\nFloci + Postgres services\nDocker build + validate]
        B5 --> B6[docker build -t project-one-server:SHA,latest]
        B6 --> B7[npx prisma migrate deploy]
        B7 --> B8[docker run + health check + smoke vs Floci]
    end

    %% ============ TEST ============
    subgraph Test["🟠 STAGE 3: TEST (CI)"]
        direction TB
        B2 -->|frontend \|\| shared| T1[Job: test-unit-client\nVitest + JUnit]
        B2 -->|backend \|\| shared| T2[Job: test-unit-server\nVitest + JUnit]
        B2 -->|backend \|\| shared| T3[Job: test-integration\nPostgreSQL service container\nprisma migrate + tests]
        B2 -->|backend \|\| shared| T4[Job: test-smoke\nPostgreSQL + prisma migrate\nsmoke tests]
        B2 -->|e2e \|\| shared| T5[Job: e2e\nPlaywright Chromium cached\nPostgreSQL service]
        T1 --> T6[dorny/test-reporter\nAnnotations en PR Checks]
        T2 --> T6
        T3 --> T6
        T4 --> T6
        T5 --> T6
    end

    %% ============ SECURITY ============
    subgraph Security["🟣 STAGE 4: SECURITY (Multi-capa)"]
        direction TB
        %% Local
        SecL1[Pre-commit: Semgrep + Gitleaks staged]
        %% PR
        SecP1[security.yml: Trivy SCA CRITICAL/HIGH]
        SecP2[security.yml: CodeQL SAST JavaScript]
        SecP3[security.yml: Gitleaks diff-PR\nOSS + Pro if licensed]
        SecP4[security.yml: SBOM CycloneDX 365d]
        SecP5[security.yml: Dependency Review\nvuln + license gate]
        %% Cron
        SecC1[scheduled-security.yml: Gitleaks full-history\nJSON 30d + SARIF Security tab]
        SecC2[security-digest.yml: SBOM + OSV Scanner\nSecurity Digest + PR comment]

        SecL1 -.->|Shift Left| SecP1
        SecL1 -.->|Shift Left| SecP3
        SecP4 -.->|Feed| SecC2
        SecC1 -.->|Feed| SecC2
        SecP5 -.->|Feed| SecC2
    end

    %% ============ QUALITY GATE ============
    QG{Quality Gate:\nQuality + Tests + Security + Build + E2E\n✅ = Merge}
    B3 --> QG
    T6 --> QG
    SecP1 --> QG
    SecP2 --> QG
    SecP3 --> QG
    SecP4 --> QG
    SecP5 --> QG
    B4 --> QG

    %% ============ DEPLOY ============
    subgraph Deploy["🟣 STAGE 5: DEPLOY"]
        direction TB
        QG -->|Merge to main| D1[release.yml: Changesets\nversion packages + npm publish]
        QG -->|Merge to main| D2[deploy.yml triggered\npush → main]

        D2 --> D3[Phase 1: docker-build\nFloci + Postgres\nValidate image locally]
        D3 -->|vars.AWS_ROLE_ARN != ''| D4[Phase 2a: ecr-push\nOIDC configure-aws-credentials\namazon-ecr-login + push SHA+latest]
        D3 -->|vars.AWS_ROLE_ARN == ''| D4s[::notice:: ECR push skipped]

        D4 --> D5[deploy-staging\nenvironment: staging\nconcurrency: deploy-staging]
        D5 --> D6[register-task-definition\nfamily: project-one-staging-api\nFARGATE 256/512\nsecrets via ARN]
        D6 --> D7[update-service\ncircuit-breaker rollback=true\nforce-new-deployment]
        D7 --> D8[wait services-stable]
        D8 --> D9[Health check poll\nSTAGING_URL/health 5 min]
        D9 --> D10[Remote smoke tests\nBASE_URL=STAGING_URL]

        D10 --> D11[deploy-production\nenvironment: production\n⚠️ MANUAL APPROVAL]
        D11 --> D12[register-task-definition\nfamily: project-one-prod-api\nFARGATE 512/1024\nPROD secrets]
        D12 --> D13[update-service\ncircuit-breaker rollback]
        D13 --> D14[wait services-stable]
        D14 --> D15[Health check 5 min]
        D15 --> D16[Remote smoke tests\nBASE_URL=PROD_URL]
    end

    %% ============ PREVIEW ============
    subgraph Preview["🟦 PREVIEW ENVIRONMENTS (Por PR)"]
        direction TB
        B1 -.->|PR opened/sync| P1[preview.yml triggered\nconcurrency: preview-#{PR}]
        P1 --> P2[Services: Floci + Postgres]
        P2 --> P3[Docker build preview-server]
        P3 --> P4[prisma migrate + run container\nAWS_ENDPOINT_URL=Floci]
        P4 --> P5[Health check 30 retries\naccept 200 or 503]
        P5 --> P6[preview-smoke.mjs\nCreateSecret/GetSecretValue vs Floci]
        P6 --> P7[Capture Vercel URL\ngh api commit statuses\npoll 60s]
        P7 --> P8[Find/Create PR comment\nmarker: <!-- preview-environments -->]
        P8 --> P9[Update comment:\nFrontend URL + Backend status]
    end

    %% ============ OPERATE ============
    subgraph Operate["⚪ STAGE 6: OPERATE & MONITOR"]
        direction TB
        O1[Cron Mon 03:00 UTC] --> O2[scheduled-security.yml\nGitleaks full-history]
        O1 --> O3[security-digest.yml\nSBOM + OSV + Digest]
        O2 --> O4[Artifacts: JSON 30d, SARIF Security tab]
        O3 --> O5[Artifacts: Digest 365d\nPR comment if CRITICAL/HIGH]
        O1 -.->|Dependabot| O6[3 ecosystems: npm, actions, docker\nWeekly PRs auto]
        D7 -.->|Circuit Breaker| O7[ECS deploymentCircuitBreaker\nrollback=true auto]
        D9 -.->|Health Checks| O8[Post-deploy health polling\n5 min max]
        D10 -.->|Smoke Tests| O9[Runtime validation\nremote endpoints]
        SecP4 -.->|SBOM| O10[CycloneDX JSON 365d\nCompliance inventory]
    end

    %% ============ STYLES ============
    classDef source fill:#e8f5e9,stroke:#2e7d32,stroke-width:2px;
    classDef build fill:#e3f2fd,stroke:#1565c0,stroke-width:2px;
    classDef test fill:#fff3e0,stroke:#ef6c00,stroke-width:2px;
    classDef security fill:#fce4ec,stroke:#c2185b,stroke-width:2px;
    classDef gate fill:#ffebee,stroke:#c62828,stroke-width:3px;
    classDef deploy fill:#f3e5f5,stroke:#7b1fa2,stroke-width:2px;
    classDef preview fill:#e0f2f1,stroke:#00695c,stroke-width:2px;
    classDef operate fill:#fafafa,stroke:#616161,stroke-width:2px,stroke-dasharray: 5 5;

    class S1,S2,S3,S4,S5,S6,S7,S8,S9,S10 source;
    class B1,B2,B3,B4,B5,B6,B7,B8 build;
    class T1,T2,T3,T4,T5,T6 test;
    class SecL1,SecP1,SecP2,SecP3,SecP4,SecP5,SecC1,SecC2 security;
    class QG gate;
    class D1,D2,D3,D4,D4s,D5,D6,D7,D8,D9,D10,D11,D12,D13,D14,D15,D16 deploy;
    class P1,P2,P3,P4,P5,P6,P7,P8,P9 preview;
    class O1,O2,O3,O4,O5,O6,O7,O8,O9,O10 operate;
```

---

## 17. Apéndice A — Archivos relevantes

### Workflows de GitHub Actions (`.github/workflows/`)

| Archivo                  | Propósito                                                  | Disparador                                                        | Jobs clave                                                                                                                                                                                  |
| ------------------------ | ---------------------------------------------------------- | ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ci.yml`                 | Pipeline principal CI                                      | `pull_request` → main                                             | changes, quality, test-unit-client, test-unit-server, test-integration, test-smoke, build, e2e, zombie-workflow-guard                                                                       |
| `quality.yml`            | Reusable lint/format/typecheck                             | `workflow_call`, `workflow_dispatch`                              | quality (condicional por inputs)                                                                                                                                                            |
| `security.yml`           | Security pipeline (PR + push)                              | `pull_request` → main, `push` → main, `workflow_call`             | dependency-scan, sast, secrets, sbom, dependency-review                                                                                                                                     |
| `scheduled-security.yml` | Gitleaks full-history cron                                 | `cron: 0 3 * * 1`, `workflow_dispatch`                            | gitleaks-full-scan                                                                                                                                                                          |
| `security-digest.yml`    | Security digest semanal                                    | `cron: 0 3 * * 1`, `workflow_dispatch` (input PR)                 | sbom, vulnerability-review, digest                                                                                                                                                          |
| `preview.yml`            | Preview environments por PR                                | `pull_request` (opened/reopened/sync) → main, `workflow_dispatch` | preview (Floci + Postgres + Docker + Vercel URL + PR comment)                                                                                                                               |
| `deploy.yml`             | CD Deploy Pipeline (2 fases)                               | `push` → main, `workflow_dispatch`                                | docker-build, ecr-push, deploy-staging, deploy-production, \*\_skipped                                                                                                                      |
| `release.yml`            | Changesets release (npm only)                              | `push` → main                                                     | release                                                                                                                                                                                     |
| `ci-enterprise.yml`      | **ZOMBIE — no documentado previamente** (ver §5 hallazgos) | `workflow_dispatch`, `workflow_call`                              | changes, install, lint, type-check, test, build, dependency-audit, codeql — **paths rotos** (`frontend/`, `backend/` — el monorepo usa `apps/client`, `apps/server`); nunca se auto-dispara |

### Composite Actions (`.github/actions/`)

| Archivo                     | Propósito                                                                            |
| --------------------------- | ------------------------------------------------------------------------------------ |
| `setup-monorepo/action.yml` | Node (.nvmrc) + npm ci + Cache Vitest (checkout: job invocador con `fetch-depth: 0`) |

### Hooks Husky (`.husky/`)

| Archivo      | Líneas | Qué ejecuta                                                                      |
| ------------ | ------ | -------------------------------------------------------------------------------- |
| `pre-commit` | 32     | lint-staged + (Semgrep SAST + Gitleaks staged) en paralelo                       |
| `commit-msg` | 1      | commitlint --edit $1                                                             |
| `pre-push`   | 22     | git fetch origin main --depth=1 + vitest --changed origin/main (server + client) |

### Scripts de Seguridad (`scripts/security/`)

| Archivo                        | Propósito                                                  |
| ------------------------------ | ---------------------------------------------------------- |
| `semgrep-staged.ps1`           | Semgrep SAST en archivos staged (100+ reglas OWASP)        |
| `semgrep.ps1`                  | Semgrep full scan (todo el repo)                           |
| `dependency-scan.ps1`          | Trivy fs scan HIGH/CRITICAL                                |
| `generate-security-digest.mjs` | Genera security-digest.md desde SBOM + OSV + Gitleaks JSON |

### Configuraciones de Seguridad

| Archivo                 | Propósito                                                                                  |
| ----------------------- | ------------------------------------------------------------------------------------------ |
| `.gitleaks.toml`        | Enterprise Secret Detection Policy (139 líneas, useDefault=true, custom rules, allowlists) |
| `.gitleaksignore`       | 6 falsos positivos documentados (password-assignment en locale/en.json y db.sequalize.js)  |
| `.semgrep/.semgrep.yml` | Configuración Semgrep (reglas custom)                                                      |
| `.semgrepignore`        | Exclusiones Semgrep                                                                        |

### Configuraciones de Calidad y Git

| Archivo                  | Propósito                                                                                                                                 |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `commitlint.config.js`   | Extiende `@commitlint/config-conventional`                                                                                                |
| `package.json` (root)    | Scripts: prepare, husky:disable/enable, prepush, sast:semgrep, security:secrets, changeset, version:packages, release, lint-staged config |
| `.prettierrc`            | Configuración Prettier                                                                                                                    |
| `eslint.config.js`       | ESLint v9 flat config (reglas separadas client/server/storybook)                                                                          |
| `.changeset/config.json` | Changesets config (baseBranch: main, ignore: e2e)                                                                                         |

### Configuración Dependabot

| Archivo                  | Propósito                                                                                        |
| ------------------------ | ------------------------------------------------------------------------------------------------ |
| `.github/dependabot.yml` | 3 ecosistemas: npm (grouped dev-deps, ignore React majors), github-actions, docker (apps/server) |

### Infraestructura Server (`apps/server/`)

| Archivo                      | Propósito                                                                                                                     |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `Dockerfile`                 | Multi-stage production image (Node 20 Alpine)                                                                                 |
| `docker-compose.yml`         | Orquesta: PostgreSQL, pgAdmin, API, nginx, Prometheus, Grafana                                                                |
| `docker-compose.preview.yml` | Stack de preview: Floci + PostgreSQL + server (efímero, usado localmente; el workflow `preview.yml` replica este stack en CI) |
| `ecosystem.config.js`        | PM2 cluster mode config                                                                                                       |
| `nginx.conf`                 | Reverse proxy con SSL + WebSocket                                                                                             |
| `scripts/preview-smoke.mjs`  | Smoke tests vs Floci (CreateSecret + GetSecretValue)                                                                          |

> **Nota 2026-08-10**: `ecs-task-def-staging.json` / `ecs-task-def-production.json` fueron referenciados en versiones previas de este doc, pero **no existen en el repo** — `deploy.yml` define las task definitions ECS **inline** (via `aws ecs register-task-definition --container-definitions '[...]'`).

---

_Fin del documento — Estado actual de CI/CD Project One (agosto 2026)_
