# Plan de Implementación CI/CD — Project One

> Documento de planificación para la implementación de Integración Continua (CI) y Despliegue Continuo (CD)
> del monorepo **Project One** (Node.js/Express + React + E2E).
> Audiencia: personas técnicas y no técnicas.
> Fecha: julio 2026.

---

## Tabla de contenidos

1. [Resumen ejecutivo](#1-resumen-ejecutivo)
2. [Glosario de términos](#2-glosario-de-términos)
3. [Estado actual vs estado ideal](#3-estado-actual-vs-estado-ideal)
4. [Mapa completo de stages (Diagrama)](#4-mapa-completo-de-stages)
   - 4.1 [Cobertura de cambios OpenSpec](#41-cobertura-de-cambios-openspec)
5. [Detalle de cada stage](#5-detalle-de-cada-stage)
6. [Estrategia de entornos y promoción](#6-estrategia-de-entornos-y-promoción)
7. [Estrategia de branching y release](#7-estrategia-de-branching-y-release)
8. [Estrategia de rollback](#8-estrategia-de-rollback)
9. [Cloud provider: AWS + Floci](#9-cloud-provider-aws--floci)
10. [Plan de implementación por sprints](#10-plan-de-implementación-por-sprints)
11. [Herramientas recomendadas](#11-herramientas-recomendadas)
12. [KPIs y DORA metrics](#12-kpis-y-dora-metrics)
13. [Riesgos y anti-patterns](#13-riesgos-y-anti-patterns)
14. [Próximos pasos concretos](#14-próximos-pasos-concretos)
15. [Referencias y fuentes](#15-referencias-y-fuentes)

---

## 1. Resumen ejecutivo

### ¿Qué es CI/CD?

CI/CD es un sistema de **verificación y publicación automática** del código. Cada vez que un desarrollador propone un cambio, el sistema:

- **CI (Integración Continua)**: revisa estilo, ejecuta pruebas, verifica seguridad y compila el proyecto **automáticamente** antes de aceptar el cambio.
- **CD (Despliegue Continuo)**: publica el código verificado a entornos reales (entorno de pruebas → producción) **sin pasos manuales**.

### ¿Dónde estamos hoy?

| Aspecto                             | Estado 2026                      | Meta 12 meses                         |
| ----------------------------------- | -------------------------------- | ------------------------------------- |
| **Calidad en Pull Requests**        | ✅ Lint + format + security scan | ✅ + tests + build + lint             |
| **Pruebas en CI**                   | ❌ No se ejecutan                | ✅ 100% de PRs con tests              |
| **Build en CI**                     | ❌ No se ejecuta                 | ✅ Build obligatorio en cada PR       |
| **Despliegue automático**           | ❌ No existe                     | ✅ Auto-deploy a staging + producción |
| **Entorno de pruebas (staging)**    | ❌ Inexistente                   | ✅ Staging con datos realistas        |
| **Seguridad en pipeline**           | ✅ Parcial (SAST, SCA, secrets)  | ✅ + SBOM, Dependabot, IaC scan       |
| **Tiempo de pipeline CI**           | ❌ Sin medir                     | ✅ < 7 minutos                        |
| **Frecuencia de deploys**           | ❌ Manual                        | ✅ ≥ 1/semana                         |
| **Recuperación ante fallos (MTTR)** | ❌ No medido                     | ✅ < 30 minutos                       |

### Las decisiones clave para el plan

| Decisión                            | Opción elegida                                                                  |
| ----------------------------------- | ------------------------------------------------------------------------------- |
| **Proveedor cloud (server + DB)**   | AWS (producción) + Floci (desarrollo/CI, emulador AWS gratuito, MIT, port 4566) |
| **Proveedor cloud (cliente React)** | Vercel (gratuito, CDN global, preview URLs por PR)                              |
| **Actualización de dependencias**   | Dependabot (nativo GitHub, zero-config)                                         |
| **Entornos preview por PR**         | Sprint 2, usando Floci + Vercel preview URLs                                    |
| **Estrategia de branching**         | Trunk-Based Development (TBD) + releases con Changesets                         |

### El plan en una frase

En **8 semanas** (~48 story points) pasamos de no tener pruebas ni despliegue automático a tener un pipeline enterprise completo: PR con tests + reporting + caching → staging automático → producción con rollback.

---

## 2. Glosario de términos

| Término                          | Significado (para no técnicos)                                                                                  |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| **CI (Integración Continua)**    | Verificación automática del código cada vez que alguien propone un cambio.                                      |
| **CD (Despliegue Continuo)**     | Publicación automática del código verificado a un entorno real (staging, producción).                           |
| **Pipeline / Workflow**          | Secuencia automática de etapas que se ejecutan en orden (verificar → construir → probar → publicar).            |
| **Pull Request (PR)**            | Solicitud para incorporar una rama de cambios a la rama principal `main`.                                       |
| **Rama `main`**                  | La versión "oficial" del proyecto. Todo cambio entra ahí.                                                       |
| **Staging**                      | Entorno de pruebas previo a producción, con datos realistas.                                                    |
| **Producción**                   | El entorno real que usan los usuarios finales.                                                                  |
| **Build (Construcción)**         | Transformar el código fuente en archivos listos para producción.                                                |
| **Lint**                         | Revisor automático de estilo y buenas prácticas del código.                                                     |
| **Tests / Pruebas**              | Pequeños programas que verifican que el código hace lo esperado.                                                |
| **Unit test**                    | Prueba que verifica una función o componente aislado.                                                           |
| **Integration test**             | Prueba que verifica cómo trabajan juntos varios módulos (ej. API + base de datos).                              |
| **E2E (end-to-end)**             | Prueba que simula a un usuario real usando la aplicación de punta a punta.                                      |
| **SAST**                         | Static Application Security Testing: analiza el código fuente buscando vulnerabilidades.                        |
| **SCA**                          | Software Composition Analysis: examina las librerías de terceros buscando vulnerabilidades conocidas.           |
| **SBOM**                         | Software Bill of Materials: inventario de todos los componentes y dependencias del software.                    |
| **Secret scanning**              | Busca contraseñas, tokens o claves accidentalmente escritas en el código.                                       |
| **Hook (git hook)**              | Script que corre automáticamente en un evento de git (antes de un commit, antes de un push).                    |
| **Changesets**                   | Herramienta que gestiona cambios de versión y publica paquetes npm.                                             |
| **DORA metrics**                 | 4 métricas clave de rendimiento DevOps (frecuencia deploy, lead time, MTTR, tasa de fallos).                    |
| **SLSA**                         | Supply-chain Levels for Software Artifacts: niveles de seguridad en la cadena de suministro.                    |
| **VEX**                          | Vulnerability Exploitability Exchange: comunicación sobre si una vulnerabilidad es explotable.                  |
| **Floci**                        | Emulador AWS gratuito (MIT, 68 servicios, port 4566). Permite desarrollar y testear contra AWS sin cuenta real. |
| **IaC (Infrastructure as Code)** | Infraestructura definida como código (Terraform, Pulumi). Reproducible y versionable.                           |
| **Preview environment**          | Entorno temporal que se levanta automáticamente por cada PR para validar cambios antes del merge.               |
| **Rollback**                     | Revertir un despliegue a una versión anterior cuando algo sale mal.                                             |
| **Blue/Green deploy**            | Estrategia de despliegue donde dos entornos idénticos (azul y verde) se alternan para cero downtime.            |
| **Canary deploy**                | Despliegue gradual: primero a un pequeño % de usuarios, luego al resto.                                         |

---

## 3. Estado actual vs estado ideal

Referencia: `docs/cicd-estado-actual.md` — inventario completo de brechas.

### Brechas críticas (deben resolverse en Sprint 1)

| ID  | Brecha                  | Estado actual                 | Estado ideal                                                    | Impacto si no se resuelve                             |
| --- | ----------------------- | ----------------------------- | --------------------------------------------------------------- | ----------------------------------------------------- |
| C1  | Tests en CI             | Comentados en `ci.yml`        | 100% PRs ejecutan unit + integration + E2E                      | PRs mergean sin pruebas → defectos en main            |
| C2  | Build en CI             | No se ejecuta `npm run build` | Build obligatorio en cada PR                                    | Errores de compilación llegan a main                  |
| C3  | CD inexistente          | Sin pipelines de deploy       | Auto-deploy a staging y producción                              | Despliegues manuales → errores humanos, días perdidos |
| C4  | ~~Hook pre-push vacío~~ | ✅ **Resuelto**               | Ejecuta `vitest --changed origin/main` scoped (server + client) | —                                                     |

### Brechas altas (Sprint 1-2)

| ID     | Brecha                                                        | Estado actual                                                                                              | Estado ideal                                                                                     |
| ------ | ------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| A1     | Lint no bloqueante en CI                                      | ESLint configurado pero no es gate obligatorio                                                             | ESLint como gate en CI — `npm run lint` bloquea si hay errores                                   |
| A2     | Gitleaks en CI requiere licencia                              | Job falla si `GIT_LEAKS` no está configurado                                                               | Usar GitHub secret scanning (gratuito) + Floci no-license                                        |
| A3     | `ci-enterprise.yml` references paths inexistentes             | `frontend/`, `backend/` no existen (el proyecto usa `apps/client/`, `apps/server/`) — **gap REMAINS OPEN** | Eliminar o adaptar a `apps/client`, `apps/server` — **propuesta follow-up: `ci-enterprise-fix`** |
| ~~A4~~ | ~~`release.yml` usa `setup-node@v4` con Node 20 hardcodeado~~ | ~~`release.yml` hardcodea Node 20 vs `.nvmrc`~~                                                            | ✅ **Resuelto** — release.yml usa `node-version-file: .nvmrc`                                    |
| A5     | Sin gate de coverage                                          | Cobertura sin umbral                                                                                       | `coverage.thresholds` en Vitest config                                                           |
| A6     | Sin Dependabot/Renovate                                       | Dependencias se desactualizan                                                                              | Dependabot activo con auto-PR de seguridad                                                       |

### Brechas medias (Sprint 2-4)

| ID     | Brecha                         | Estado actual                                   | Estado ideal                                                  |
| ------ | ------------------------------ | ----------------------------------------------- | ------------------------------------------------------------- |
| M1     | Sin `.dockerignore`            | Imágenes pueden incluir `.env`, logs            | `.dockerignore` creado antes de integrar Docker               |
| M2     | Sin entornos staging           | Imposible validar antes de producción           | Staging con Floci + datos realistas                           |
| M3     | Sin IaC                        | Infra no reproducible                           | Terraform/OpenTofu para AWS                                   |
| M4     | Sin SBOM                       | Sin inventario de componentes                   | SBOM CycloneDX en cada release                                |
| M5     | Sin caching en CI              | CI lento con tests                              | npm cache + Vitest cache + Turborepo remote cache             |
| ~~M6~~ | ~~Node version inconsistente~~ | ~~`release.yml` hardcodea Node 20 vs `.nvmrc`~~ | ✅ **Resuelto** — release.yml usa `node-version-file: .nvmrc` |
| M7     | Secret scanning solo en staged | Secretos viejos no se detectan                  | Full repo scan programado (cron semanal)                      |

---

## 4. Mapa completo de stages

```mermaid
flowchart TD
    subgraph LOCAL["💻 LOCAL (Dev Machine)"]
        Edit[Editar código] --> PreCommit[.husky/pre-commit]
        PreCommit --> LintStaged[lint-staged: eslint + prettier]
        PreCommit --> Semgrep[Semgrep SAST en staged]
        PreCommit --> Gitleaks[Gitleaks secret scan en staged]
        Edit --> CommitMsg[.husky/commit-msg]
        CommitMsg --> Commitlint[commitlint: Conventional Commits]

        PreCommit --> PrePush[.husky/pre-push ✅ ACTIVO]
        PrePush --> TestLocal[vitest --changed origin/main scoped tests]
        PrePush --> GitFetch[git fetch origin main --depth=1]
        PrePush --> OriginCheck[origin/main availability check]
    end

    LOCAL --> Push[git push]

    subgraph PR["🔄 PULL REQUEST (CI)"]
        PR_Open[Abrir PR → main] --> DetectChanges[changes: paths-filter]
        DetectChanges --> QOS{Quality or Skip?}

        QOS -->|frontend| QualityClient[quality: lint + format client]
        QOS -->|backend| QualityServer[quality: lint + format server]
        QOS -->|shared| QualityAll[quality: lint + format todos]

        DetectChanges --> TestStrategy{Tests segun cambios}

        TestStrategy -->|frontend| UnitClient[test-unit-client\nvitest run client unit tests]
        TestStrategy -->|backend| UnitServer[test-unit-server\nvitest run server unit tests]
        TestStrategy -->|backend| IntegServer[test-integration-server\nvitest run integration\nSERVICE: postgres:16-alpine\nprisma migrate deploy]

        DetectChanges --> Build[build all\nnpm run build --ws --if-present]

        DetectChanges -->|e2e changed| E2E[e2e opcional\nPlaywright\nCache browsers\n--project=chromium]

        QualityClient --> PRAnnotations[📋 Test Reporter\ndorny/test-reporter@v3\nJUnit annotations en PR]
        QualityServer --> PRAnnotations
        UnitClient --> PRAnnotations
        UnitServer --> PRAnnotations
        IntegServer --> PRAnnotations
        Build --> PRAnnotations
        E2E --> PRAnnotations

        PRAnnotations --> MergeGate{Gate: todo OK?}

        subgraph SEC[Workflow: security.yml]
            SCA[Trivy SCA filesystem HIGH/CRITICAL]
            SAST[CodeQL SAST + Semgrep]
            Secrets[GitHub secret scanning + Gitleaks]
            SBOM[SBOM CycloneDX ** nuevo **]
            DepReview[Dependency Review ** nuevo **]
        end

        PR_Open --> SEC
        SEC --> MergeGate

        subgraph PREVIEW["👀 Preview per PR"]
            FlociPR[Floci container con estado efímero]
            VercelPR[Vercel preview URL automática]
        end

        PREVIEW --> MergeGate

        MergeGate -->|Pasa| Mergeable[PR mergeable]
        MergeGate -->|Falla| Blocked[PR bloqueado -fix requerido]
    end

    Mergeable --> Merge[Merge a main]

    subgraph CD["🚀 POST-MERGE (CD)"]
        Merge --> Release[release.yml: Changesets]
        Release --> PubNpm[Publicar paquetes npm]

        Merge --> DockerBuild[Docker build + push a ECR]
        DockerBuild --> Tag[Tag semver + sha + branch]
        Tag --> DeployStaging[Deploy a Staging]
        DeployStaging --> Smoke[Smoke tests automáticos]

        Smoke -->|OK| DeployProd[Deploy a Producción]
        Smoke -->|FAIL| RollbackStaging[Rollback automático]

        DeployProd --> HealthCheck[Health check post-deploy 5 min]
        HealthCheck -->|OK| Done[Despliegue completado]
        HealthCheck -->|FAIL| RollbackProd[Rollback automático]

        RollbackProd --> RollbackDB[Migrate down de Prisma si aplica]
        RollbackProd --> Redeploy[Redeploy tag anterior]
    end

    subgraph SCHEDULED["📅 SCHEDULED (cron)"]
        CronWeekly[Cron semanal: lunes 03:00 UTC]
        CronWeekly --> FullGitleaks[Gitleaks full repo scan\n(JSON + SARIF → Security tab)]
        CronWeekly --> SecurityDigest[Security Digest (OSV + SBOM +\nGitleaks sibling artifact)\n→ PR comment si critical/high/deny-list]

        Dependabot[Dependabot: PRs automáticos de seguridad]
        Dependabot --> AutoMergePatches[Auto-merge parches seguros]
        Dependabot --> ManualReviewMinor[Manual review para minor]

        TrivyProposed[Trivy full + npm audit cron\n⬅ ci-scheduled-trivy (en propuesta)]
    end

    style PrePush fill:#a5f3fc,stroke:#0891b2
    style Test fill:#a5f3fc,stroke:#0891b2
    style Typecheck fill:#a5f3fc,stroke:#0891b2
    style Smoke fill:#fef08a,stroke:#ca8a04
    style RollbackProd fill:#fecaca,stroke:#dc2626
    style RollbackStaging fill:#fecaca,stroke:#dc2626
    style FlociPR fill:#bbf7d0,stroke:#16a34a
    style VercelPR fill:#bbf7d0,stroke:#16a34a
    style SBOM fill:#a5f3fc,stroke:#0891b2
    style DepReview fill:#a5f3fc,stroke:#0891b2

    linkStyle 3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28 stroke-width:2px
```

### Leyenda

- 🔵 (azul claro/cyan) — etapas **nuevas** que no existían en el estado actual
- 🟢 (verde) — etapas con Floci (emulador AWS gratuito)
- 🟡 (amarillo) — punto de decisión con riesgo (smoke tests)
- 🔴 (rojo) — etapa de rollback (recuperación ante fallos)

### 4.1 Cobertura de Cambios OpenSpec

La siguiente tabla mapea cada stage de la arquitectura contra los cambios OpenSpec creados y pendientes:

```
                    ARQUITECTURA COMPLETA vs CAMBIOS OPENSPEC
    ┌──────────────────────────────────────────────────────────────────────┐
    │  STAGE 0-1: LOCAL                                                    │
    │  ├── Pre-commit (lint-staged, SAST, secrets)     ✅ Existe           │
    │  ├── Commit-msg (commitlint)                     ✅ Existe           │
    │  ├── Pre-push (scoped tests)                     ✅ Existe           │
    │  └── Floci dev-local (LocalStack → Floci) ⬅ ci-floci-migration       │
    │                                              ✅ IMPLEMENTADO + ARCHIVADO (08-08) │
    ├──────────────────────────────────────────────────────────────────────┤
    │  STAGE 2-4: PULL REQUEST (CI) — SPRINT 1                             │
    │  ├── Change detection (paths-filter)             ✅ Existe           │
    │  ├── Quality (lint gate) ⬅ ci-quality-gates      ✅ IMPLEMENTADO + ARCHIVADO (08-06) │
    │  ├── Tests unit + integración ⬅ ci-test-integ    ✅ EN IMPLEMENTACIÓN │
    │  ├── Build + caching + reporting ⬅ ci-test-integ ✅ EN IMPLEMENTACIÓN │
    │  ├── E2E + PostgreSQL ⬅ ci-test-integ            ✅ EN IMPLEMENTACIÓN │
    │  ├── Dependabot ⬅ ci-test-integ                  ✅ EN IMPLEMENTACIÓN │
    │  ├── Coverage baselines ⬅ ci-quality-gates       ✅ IMPLEMENTADO + ARCHIVADO (08-06) │
    │  └── Zombie cleanup ⬅ ci-cleanup-enterprise      ✅ IMPLEMENTADO + ARCHIVADO (08-02) │
    │       └── zombie-workflow-guard job (ci.yml:250-269) — Falla si reaparecen `pr-validation.yml`, `lint.yml`, `formatter.yml` (guardia anti-regresión post-limpieza) │
    ├──────────────────────────────────────────────────────────────────────┤
    │  STAGE 5: SECURITY — SPRINT 1-2                                      │
    │  ├── SAST (CodeQL, Semgrep)                      ✅ Existe           │
    │  ├── SCA (Trivy)                                  ✅ Existe           │
    │  ├── Secrets (PR diff-scoped) ⬅ ci-secret-scanning                  │
    │  │                                  ✅ IMPLEMENTADO + ARCHIVADO (08-07) │
    │  ├── SBOM (CycloneDX) + Dep Review ⬅ ci-security-enhance            │
    │  │                                  ✅ IMPLEMENTADO + ARCHIVADO (08-06) │
    │  └── Dependency Review (PR) ⬅ ci-security-enhance                   │
    │                                  ✅ IMPLEMENTADO + ARCHIVADO (08-06) │
    ├──────────────────────────────────────────────────────────────────────┤
    │  STAGE 6: PREVIEW ENVIRONMENTS — SPRINT 2                            │
    │  ├── Floci container efímero ⬅ ci-preview-environments              │
    │  │                                  ✅ IMPLEMENTADO + ARCHIVADO (08-08) │
    │  └── Vercel preview URL per PR ⬅ ci-preview-environments            │
    │                                  ✅ IMPLEMENTADO + ARCHIVADO (08-08) │
    ├──────────────────────────────────────────────────────────────────────┤
    │  STAGE 7: POST-MERGE (CD) — SPRINT 3-4                              │
    │  ├── Release + Changesets        ⬅ (preexistente release.yml)       │
    │  ├── Docker build + push a ECR   ⬅ cd-aws-deploy-pipeline           │
    │  ├── Deploy staging              ⬅ cd-aws-deploy-pipeline           │
    │  ├── Smoke tests post-deploy     ⬅ cd-aws-deploy-pipeline           │
    │  ├── Deploy producción           ⬅ cd-aws-deploy-pipeline           │
    │  └── Rollback automático         ⬅ cd-aws-deploy-pipeline           │
    │          (Phase 1: emulated ✅ | Phase 2: AWS gated) EN IMPLEMENTACIÓN │
    ├──────────────────────────────────────────────────────────────────────┤
    │  STAGE 8: SCHEDULED — SPRINT 4                                       │
    │  ├── Security full scan semanal  ⬅ ci-scheduled-security            │
    │  │                                  ✅ IMPLEMENTADO + ARCHIVADO (08-07) │
    │  ├── SBOM actualizado            ⬅ ci-scheduled-security            │
    │  ├── Gitleaks full repo (cron)   ⬅ ci-secret-scanning               │
    │  │                                  ✅ IMPLEMENTADO + ARCHIVADO (08-07) │
    │  ├── Security Digest (OSV + SBOM) ⬅ ci-scheduled-security-digest    │
    │  │                                  ✅ IMPLEMENTADO + ARCHIVADO (08-07) │
    │  └── Trivy full + npm audit cron  ⬅ ci-scheduled-trivy (en propuesta) │
    └──────────────────────────────────────────────────────────────────────┘
```

**Resumen de cobertura:**

| Categoría           | Total  | Cubierto | %       |
| ------------------- | ------ | -------- | ------- |
| Local (Stage 0-1)   | 4      | 4        | 100%    |
| PR CI (Stage 2-4)   | 8      | 6\*      | 75%     |
| Security (Stage 5)  | 5      | 5        | 100%    |
| Preview (Stage 6)   | 2      | 2        | 100%    |
| CD (Stage 7)        | 6      | 1\*      | 17%     |
| Scheduled (Stage 8) | 4      | 4        | 100%    |
| **Total**           | **29** | **22**   | **76%** |

- Stage 2-4: 2 tareas en implementación (tests, build, E2E, Dependabot — via `ci-test-integration`)
- Stage 7: Phase 1 (emulated) implementado; Phase 2 (AWS gated) pendiente `vars.AWS_ROLE_ARN`

**Cambios OpenSpec — Estado actual (agosto 2026):**

| Change                    | Artefactos                       | Estado                              |
| ------------------------- | -------------------------------- | ----------------------------------- |
| `ci-test-integration`     | proposal, design, tasks, specs   | ✅ EN IMPLEMENTACIÓN                |
| `ci-quality-gates`        | proposal, design, tasks          | ✅ IMPLEMENTADO + ARCHIVADO (08-06) |
| `ci-cleanup-enterprise`   | proposal, design, tasks          | ✅ IMPLEMENTADO + ARCHIVADO (08-02) |
| `ci-security-enhance`     | proposal, design, tasks, specs   | ✅ IMPLEMENTADO + ARCHIVADO (08-06) |
| `ci-secret-scanning`      | proposal, design, tasks, specs   | ✅ IMPLEMENTADO + ARCHIVADO (08-07) |
| `ci-preview-environments` | proposal, design, tasks, 5 specs | ✅ IMPLEMENTADO + ARCHIVADO (08-08) |
| `ci-floci-migration`      | proposal, design, tasks, specs   | ✅ IMPLEMENTADO + ARCHIVADO (08-08) |
| `cd-aws-deploy-pipeline`  | proposal, design, tasks, 5 specs | ✅ EN IMPLEMENTACIÓN (Phase 1 done) |
| `ci-scheduled-security`   | proposal, design, tasks, specs   | ✅ IMPLEMENTADO + ARCHIVADO (08-07) |
| `ci-scheduled-trivy`      | proposal, design, tasks          | 📝 EN PROPUESTA                     |
| `cd-observability-sentry` | proposal, design, tasks          | 📝 EN PROPUESTA                     |

**Cambios OpenSpec pendientes de implementar:**

`ci-test-integration` (tests unit/integración/E2E + build + Dependabot + caching + reporting) → luego `cd-aws-deploy-pipeline` Phase 2 (ECS/RDS/OIDC real) → propuestas `ci-scheduled-trivy` (Trivy full + npm audit cron) y `cd-observability-sentry` (Sentry deploy markers).

> **Nota (Exit-digital / context bracket):** `ci-enterprise.yml` (Fintech PR CI) sigue activo en `.github/workflows/` pero referencia paths inexistentes `frontend/` y `backend/` (el proyecto usa `apps/client/` y `apps/server/`). Este workflow no se ha adaptado aún — gap OPEN documentado en §3 (A3) y §19. Brecha pendiente: proponer `ci-enterprise-fix` o migrar sus jobs a `ci.yml` + `security.yml`.

---

## 5. Detalle de cada stage

### Stage 0 — Pre-commit (local)

**Qué**: Antes de que el desarrollador confirme un cambio localmente.

**Por qué**: Atrapar errores **antes** de que lleguen al repositorio compartido. Es la capa más barata de corrección.

**Cómo** (ya existe, se refuerza):

```bash
# .husky/pre-commit (existentes)
npx lint-staged                                # eslint + prettier a staged
npm run sast:semgrep                           # Semgrep SAST en staged
npm run security:secrets                        # Gitleaks protect --staged

# .husky/commit-msg (existente)
npx --no -- commitlint --edit $1               # Conventional Commits
```

**Nuevo**: El hook `commit-msg` ya valida el formato del mensaje. Se mantiene sin cambios.

### Stage 1 — Pre-push (local, NUEVO)

**Qué**: Antes de que el desarrollador suba código al remoto.

**Por qué**: Evitar que código que no compila o falla pruebas llegue al remoto y desperdicie minutos de CI.

**Cómo** (reemplazar el hook vacío actual):

> ✅ **Cambio aplicado (jul 2026):** El hook fue implementado en el change `pre-push-scoped-tests`. A diferencia del plan original (full suite), se optó por tests scoped con `vitest --changed origin/main` para mantener feedback rápido.

```bash
# .husky/pre-push (ACTUAL - implementado)
#!/bin/sh
set -e

git fetch origin main --depth=1

if ! git rev-parse --verify origin/main > /dev/null 2>&1; then
  echo "❌ origin/main not found locally."
  echo "   Run 'git fetch origin main' first, then push again."
  exit 1
fi

echo "Running scoped tests (server)..."
npx vitest run --changed origin/main --config apps/server/vitest.config.js || { echo "❌ Server scoped tests failed."; exit 1; }
echo "✅ Server scoped tests passed."

echo "Running scoped tests (client)..."
npx vitest run --changed origin/main --config apps/client/vitest.config.js || { echo "❌ Client scoped tests failed."; exit 1; }
echo "✅ Client scoped tests passed."
```

> **Nota**: Se usa `vitest --changed origin/main` en vez de la suite completa — solo corren tests afectados por cambios desde `origin/main`. E2E y tests de integración con DB se excluyen del pre-push y se ejecutan en CI.

**Criterio de aceptación**: `git push` ejecuta scoped tests; falla si hay tests rotos en los archivos modificados.

### Stage 2 — Detección de cambios (CI)

**Qué**: El workflow `ci.yml` detecta qué workspaces cambiaron para ejecutar solo las etapas relevantes.

**Por qué**: Optimizar tiempo de CI — si solo cambió el cliente, no ejecutar tests del servidor.

**Cómo** (existe, se mantiene):

```yaml
# .github/workflows/ci.yml
jobs:
  changes:
    runs-on: ubuntu-latest
    outputs:
      frontend: ${{ steps.filter.outputs.frontend }}
      backend: ${{ steps.filter.outputs.backend }}
      e2e: ${{ steps.filter.outputs.e2e }}
    steps:
      - uses: actions/checkout@v5
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
```

### Stage 3 — Quality (CI) — Mejorado

**Qué**: Ejecuta lint y format check por workspace.

**Por qué**: Mantener estilo de código consistente y detectar problemas de sintaxis.

**Cómo** (existe, se refuerza):

```yaml
jobs:
  quality:
    uses: ./.github/workflows/quality.yml # reutilizable existente
    with:
      frontend: ${{ needs.changes.outputs.frontend }}
      backend: ${{ needs.changes.outputs.backend }}
```

El `quality.yml` actual ya ejecuta `lint` y `format:check` para ambos workspaces. Se refuerza como gate obligatorio:

```yaml
- name: Lint
  run: npm run lint
  if: ${{ inputs.frontend == 'true' || inputs.backend == 'true' }}
```

> **Nota**: El proyecto es JavaScript puro (no TypeScript). El lint con ESLint es el gate de calidad primario. Si se migra a TypeScript en el futuro, se agregará `tsc --noEmit` como paso adicional.

### Stage 4 — Tests + Build (CI, NUEVO)

**Qué**: Ejecuta pruebas unitarias, de integración, build y test reporting en CI.

**Por qué**: Es el corazón de la CI — sin tests, no hay calidad garantizada. Sin test reporting, los fallos son difíciles de depurar.

**Arquitectura de jobs**:

```
changes (dorny/paths-filter)
  ├── test-unit-client (si frontend cambió)
  ├── test-unit-server (si backend cambió)
  ├── test-integration (si backend cambió — con PostgreSQL service)
  ├── test-smoke (si backend cambió — con PostgreSQL service)
  ├── build (siempre)
  └── e2e (si e2e cambió — opcional, parallel)
```

**Multi-layer caching strategy**:

| Capa cache                              | Qué cachea                                                                             | Key                          | Recuperación                        |
| --------------------------------------- | -------------------------------------------------------------------------------------- | ---------------------------- | ----------------------------------- |
| **npm** (built-in `cache: 'npm'`)       | `~/.npm`                                                                               | hash `package-lock.json`     | Automática con setup-node@v4        |
| **Vitest** (actions/cache)              | `node_modules/.cache/vitest` \* ${{ runner.os }}-${{ hashFiles('package-lock.json') }} | Manual + restore-keys        |
| **Playwright browsers** (actions/cache) | `~/.cache/ms-playwright`                                                               | hash `e2e/package-lock.json` | Manual, instalar solo si cache miss |

> **Target**: CI < 7 min con las 3 capas + path-filtering + jobs paralelos.

**Test reporting**:

Se usa `dorny/test-reporter@v3` para parsear JUnit XML y crear GitHub Check Run con anotaciones en el PR:

```yaml
- name: Test Report
  uses: dorny/test-reporter@v3
  if: success() || failure()
  with:
    name: Unit Tests Report
    path: reports/junit.xml
    reporter: java-junit
```

Configurar Vitest para emitir JUnit: `--reporter=junit --outputFile=reports/junit.xml`. Playwright tiene reporter `github` nativo que genera anotaciones directamente.

**Flaky test handling**:

- Playwright: `retries: process.env.CI ? 2 : 0` en configuración
- Vitest: `retry: 2` en tests de integración (más propensos a flakiness)
- Post-test: considerar DeFlaky / Trunk Flaky Tests para auto-detección + cuarentena con TTL

**Cómo**:

```yaml
# --- COMPOSITE ACTION: .github/actions/setup-monorepo/action.yml ---
# Se recomienda crear esta action para evitar duplicación entre jobs.
# NO incluye checkout: el job invocador ejecuta actions/checkout@v5 con fetch-depth: 0
# ANTES de usar la composite (necesario para resolver la action local + test-reporter).
name: 'Setup Monorepo'
description: 'Setup Node.js, install dependencies, and cache Vitest (requires prior actions/checkout with fetch-depth: 0)'
runs:
  using: 'composite'
  steps:
    - uses: actions/setup-node@v4
      with:
        node-version-file: '.nvmrc'
        cache: 'npm'
    - run: npm ci
      shell: bash
    - uses: actions/cache@v4
      with:
        path: apps/*/node_modules/.cache/vitest
        key: vitest-${{ runner.os }}-${{ hashFiles('package-lock.json') }}
        restore-keys: vitest-${{ runner.os }}-
```

```yaml
# --- Job tipo en ci.yml (patrón de checkout único) ---
jobs:
  test-unit-client:
    steps:
      - uses: actions/checkout@v5
        with:
          fetch-depth: 0 # historial completo → test-reporter (exit 128 sin él)
      - uses: ./.github/actions/setup-monorepo
```

```yaml
# --- Jobs de test en ci.yml ---
jobs:
  changes:
    runs-on: ubuntu-latest
    outputs:
      frontend: ${{ steps.filter.outputs.frontend }}
      backend: ${{ steps.filter.outputs.backend }}
      e2e: ${{ steps.filter.outputs.e2e }}
    steps:
      - uses: actions/checkout@v5
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

  test-unit-client:
    needs: changes
    if: needs.changes.outputs.frontend == 'true' || needs.changes.outputs.shared == 'true'
    runs-on: ubuntu-latest
    steps:
      - uses: ./.github/actions/setup-monorepo
      - name: Run client unit tests
        run: npm run test --workspace=client-react
      - name: Test Report
        uses: dorny/test-reporter@v3
        if: success() || failure()
        with:
          name: Client Unit Tests
          path: apps/client/reports/junit.xml
          reporter: java-junit

  test-unit-server:
    needs: changes
    if: needs.changes.outputs.backend == 'true' || needs.changes.outputs.shared == 'true'
    runs-on: ubuntu-latest
    steps:
      - uses: ./.github/actions/setup-monorepo
      - name: Run server unit tests
        run: npm run test:unit --workspace=server-express
      - name: Test Report
        uses: dorny/test-reporter@v3
        if: success() || failure()
        with:
          name: Server Unit Tests
          path: apps/server/reports/junit.xml
          reporter: java-junit

  test-integration:
    needs: changes
    if: needs.changes.outputs.backend == 'true' || needs.changes.outputs.shared == 'true'
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16-alpine
        env:
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
          POSTGRES_DB: project_one_test
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    steps:
      - uses: ./.github/actions/setup-monorepo
      - name: Setup database schema
        run: npx prisma migrate deploy
        working-directory: apps/server
        env:
          DATABASE_URL: postgresql://test:test@localhost:5432/project_one_test
      - name: Run integration tests
        run: npm run test:integration --workspace=server-express
        env:
          DATABASE_URL: postgresql://test:test@localhost:5432/project_one_test
      - name: Test Report
        uses: dorny/test-reporter@v3
        if: success() || failure()
        with:
          name: Integration Tests
          path: apps/server/reports/junit.xml
          reporter: java-junit

  build:
    needs: changes
    if: always()
    runs-on: ubuntu-latest
    steps:
      - uses: ./.github/actions/setup-monorepo
      - name: Build all
        run: npm run build --ws --if-present

  e2e:
    needs: [changes]
    if: needs.changes.outputs.e2e == 'true'
    runs-on: ubuntu-latest
    steps:
      - uses: ./.github/actions/setup-monorepo
      - name: Cache Playwright browsers
        uses: actions/cache@v4
        id: playwright-cache
        with:
          path: ~/.cache/ms-playwright
          key: playwright-${{ runner.os }}-${{ hashFiles('e2e/package-lock.json') }}
      - name: Install Playwright browsers
        if: steps.playwright-cache.outputs.cache-hit != 'true'
        run: npx playwright install --with-deps
      - name: Run E2E tests
        run: npm run test --workspace=e2e
```

> **Notas importantes**:
>
> - `needs: [changes]` con `if:` condicional por workspace — si shared cambió (package.json, lockfile), corren TODOS los tests
> - `if: always()` en build para que corra incluso si algún job de test falló (queremos saber si el build también está roto)
> - `fail-fast: false` en cada job matrix para que un workspace no cancele al otro
> - El server (Express) tiene build script no-op ("echo 'No build step needed for Express'")
> - El client (Vite) genera los bundles estáticos en `apps/client/dist`
> - Prisma migrate deploy antes de integration tests: replica el esquema exacto de producción

### Stage 5 — Security (CI) — Mejorado

**Qué**: Análisis de seguridad en múltiples capas.

**Por qué**: Detectar vulnerabilidades antes de que lleguen a producción. Capas redundantes (SAST + SCA + secret scanning + SBOM).

**Cómo** (workflow `security.yml` existente, se agregan):

```yaml
jobs:
  dependency-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v5
      - name: Trivy filesystem scan
        uses: aquasecurity/trivy-action@0.36.0
        with:
          scan-type: fs
          scan-ref: .
          severity: CRITICAL,HIGH
          format: sarif
          output: trivy-results.sarif
          exit-code: '1'
          ignore-unfixed: 'true'

  sast:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v5
      - uses: github/codeql-action/init@v4
        with:
          languages: javascript
      - name: Install dependencies
        run: npm ci
      - uses: github/codeql-action/analyze@v4

  secrets:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v5
        with:
          fetch-depth: 0
      - name: GitHub secret scanning
        uses: actions/secret-scanning@v1

      - name: Semgrep SAST (multi-regla)
        uses: semgrep/semgrep-action@v2
        with:
          config: >-
            p/owasp-top-ten
            p/javascript
            p/express
            p/react

  dependency-review:
    runs-on: ubuntu-latest
    if: github.event_name == 'pull_request'
    steps:
      - uses: actions/checkout@v5
      - uses: actions/dependency-review-action@v5
        with:
          license-check: true
          vulnerability-check: true

  sbom:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v5
      - uses: anchore/sbom-action@v0.24.0
        with:
          format: cyclonedx-json
          output-file: sbom-project-one.json
      - uses: actions/upload-artifact@v5
        with:
          name: sbom
          path: sbom-project-one.json
```

### Stage 6 — Preview per PR (NUEVO)

**Qué**: Por cada Pull Request se levanta un entorno efímero con Floci emulando AWS + Vercel preview para el frontend.

**Por qué**: Validar visual y funcionalmente el cambio antes de mergear, con infraestructura realista.

**Cómo**:

```yaml
# Dentro de preview.yml (workflow nuevo)
# ALINEADO CON ci-preview-environments (APPROVED):
# - floci pinneado v1.5.31 (no :latest)
# - Vercel preview NATIVO vía commit status con GITHUB_TOKEN (sin VERCEL_TOKEN)
# - Smoke tests reales contra Floci + Vercel commit-status poller
jobs:
  preview:
    name: Preview Validation
    runs-on: ubuntu-latest
    timeout-minutes: 15

    services:
      # Floci - Emulador AWS (puerto 4566)
      floci:
        image: floci/floci:1.5.31
        ports:
          - '4566:4566'
        env:
          FLOCI_STORAGE_MODE: memory
          FLOCI_HOSTNAME: floci
        options: >-
          --health-cmd "curl -f http://localhost:4566/_localstack/health || exit 1"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
          --health-start-period 10s

      # PostgreSQL efímera para el stack de preview
      db:
        image: postgres:16-alpine
        ports:
          - 5432:5432
        env:
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
          POSTGRES_DB: project_one_preview
        options: >-
          --health-cmd "pg_isready -U test -d project_one_preview"
          --health-interval 5s
          --health-timeout 5s
          --health-retries 10
          --health-start-period 5s

    steps:
      # 1. Checkout
      - name: Checkout repository
        uses: actions/checkout@v5

      # 2. Setup Node.js
      - name: Setup Node.js
        uses: actions/setup-node@v5
        with:
          node-version-file: '.nvmrc'
          cache: 'npm'

      # 3. Install dependencies at monorepo root
      - name: Install dependencies
        run: npm ci

      # 4. Build server Docker image (validates Dockerfile used by compose)
      # Build from monorepo root to access package-lock.json; tag for reuse in step 6
      - name: Build server Docker image
        run: docker build -t preview-server -f apps/server/Dockerfile .

      # 5. Run Prisma migrations against ephemeral Postgres
      - name: Run Prisma migrations
        working-directory: apps/server
        run: npx prisma migrate deploy
        env:
          DATABASE_URL: postgresql://test:test@localhost:5432/project_one_preview

      # 6. Start server from built image with service containers
      # ENABLE_SMOKE_ROUTE=true expone el endpoint interno /_smoke/secrets usado por preview-smoke.mjs
      - name: Start server container
        run: |
          docker run -d \
            --name preview-server \
            --network host \
            -e DATABASE_URL=postgresql://test:test@localhost:5432/project_one_preview \
            -e AWS_ENDPOINT_URL=http://localhost:4566 \
            -e AWS_ACCESS_KEY_ID=test \
            -e AWS_SECRET_ACCESS_KEY=test \
            -e AWS_REGION=us-east-1 \
            -e PORT=3000 \
            -e ENABLE_SMOKE_ROUTE=true \
            preview-server

      # 7. Health check with retries
      # Health gate accepts 200 (healthy) or 503 (degraded DB).
      # 503 indicates server is alive but DB not ready — preview env assessment deferred to subsequent smoke tests.
      - name: Wait for server health
        run: |
          for i in {1..30}; do
            http_code=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/health)
            if [[ "$http_code" == "200" || "$http_code" == "503" ]]; then
              echo "✅ Server health check passed (HTTP $http_code)"
              exit 0
            fi
            echo "⏳ Waiting for server... ($i/30) [HTTP $http_code]"
            sleep 2
          done
          echo "❌ Server health check failed after 60s"
          exit 1

      # 8. Run smoke tests against Floci (AWS emulated)
      # Ejecuta apps/server/scripts/preview-smoke.mjs que valida:
      # - CreateSecret + GetSecretValue contra Secrets Manager emulado (Floci)
      # - Path de la app /_smoke/secrets (secretsClient interno)
      - name: Run AWS emulation smoke tests
        run: |
          AWS_ENDPOINT_URL=http://localhost:4566 \
          AWS_ACCESS_KEY_ID=test \
          AWS_SECRET_ACCESS_KEY=test \
          AWS_REGION=us-east-1 \
          SERVER_BASE_URL=http://localhost:3000 \
          node apps/server/scripts/preview-smoke.mjs
        env:
          AWS_ENDPOINT_URL: http://localhost:4566
          AWS_ACCESS_KEY_ID: test
          AWS_SECRET_ACCESS_KEY: test
          AWS_REGION: us-east-1
          SERVER_BASE_URL: http://localhost:3000

      # 9. Capture Vercel preview URL from commit status
      # Polling loop (max 60s) via gh api sobre commit statuses buscando context que empieza con "vercel"
      - name: Capture Vercel preview URL
        if: github.event_name == 'pull_request'
        id: vercel-url
        continue-on-error: true
        run: |
          # Use PR head SHA for commit status lookup
          SHA="${{ github.event.pull_request.head.sha }}"
          # Poll for Vercel deployment status (max 60s)
          for i in {1..12}; do
            STATUS=$(gh api repos/${{ github.repository }}/commits/${SHA}/status --jq '.statuses[] | select(.context | ascii_downcase | startswith("vercel")) | .target_url' 2>/dev/null | head -1) || true
            if [ -n "$STATUS" ]; then
              echo "vercel_url=$STATUS" >> $GITHUB_OUTPUT
              echo "✅ Found Vercel preview URL: $STATUS"
              break
            fi
            echo "⏳ Waiting for Vercel deployment... ($i/12)"
            sleep 5
          done
          if [ -z "$STATUS" ]; then
            echo "⚠️ Vercel preview URL not found in commit status after 60s"
            echo "vercel_url=" >> $GITHUB_OUTPUT
          fi
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}

      # 10. Find existing preview comment (marker-based)
      - name: Find existing preview comment
        if: always() && github.event_name == 'pull_request' && github.event.pull_request.head.repo.fork == false
        uses: peter-evans/find-comment@v3
        id: find-comment
        with:
          token: ${{ secrets.GITHUB_TOKEN }}
          issue-number: ${{ github.event.pull_request.number }}
          comment-author: 'github-actions[bot]'
          body-includes: '<!-- preview-environments -->'

      # 11. Create or update PR comment with combined preview info
      - name: Create or update preview comment
        if: github.event_name == 'pull_request' && github.event.pull_request.head.repo.fork == false
        uses: peter-evans/create-or-update-comment@v4
        with:
          token: ${{ secrets.GITHUB_TOKEN }}
          issue-number: ${{ github.event.pull_request.number }}
          comment-id: ${{ steps.find-comment.outputs.comment-id }}
          body: |
            <!-- preview-environments -->
            ## 🔍 Preview Environments Validation

            **Pull Request**: #${{ github.event.pull_request.number }}

            ### 🌐 Frontend Preview (Vercel)
            ${{ steps.vercel-url.outputs.vercel_url != '' && format('**Preview URL**: {0}', steps.vercel-url.outputs.vercel_url) || '**Preview URL**: *Not yet available — Vercel deployment may still be building*' }}

            ### ⚙️ Backend Validation (AWS Emulated via Floci)
            **Status**: ✅ Backend validation passed (smoke tests OK)

            **Details**:
            - Stack: Server (Docker) + Floci (AWS emulator) + PostgreSQL 16 (ephemeral)
            - Smoke tests: CreateSecret + GetSecretValue against Secrets Manager emulated
            - AWS Endpoint: `http://localhost:4566` (Floci)
            - No real AWS credentials used — dummy test credentials only

            ---
            *Updated on ${{ github.event_name == 'pull_request' && github.event.pull_request.updated_at || github.run_id }}*
            *Workflow: [Preview Environments](${{ github.server_url }}/${{ github.repository }}/actions/runs/${{ github.run_id }})*

          edit-mode: replace
          continue-on-error: true

      # 12. Report backend validation failure if smoke tests failed
      - name: Report backend failure
        if: failure() && github.event_name == 'pull_request' && github.event.pull_request.head.repo.fork == false
        uses: peter-evans/create-or-update-comment@v4
        with:
          token: ${{ secrets.GITHUB_TOKEN }}
          issue-number: ${{ github.event.pull_request.number }}
          comment-id: ${{ steps.find-comment.outputs.comment-id }}
          body: |
            <!-- preview-environments -->
            ## 🔍 Preview Environments Validation

            **Pull Request**: #${{ github.event.pull_request.number }}

            ### 🌐 Frontend Preview (Vercel)
            ${{ steps.vercel-url.outputs.vercel_url != '' && format('**Preview URL**: {0}', steps.vercel-url.outputs.vercel_url) || '**Preview URL**: *Not yet available — Vercel deployment may still be building*' }}

            ### ⚙️ Backend Validation (AWS Emulated via Floci)
            **Status**: ❌ Backend validation failed — see workflow logs for details

            **Details**:
            - Stack: Server (Docker) + Floci (AWS emulator) + PostgreSQL 16 (ephemeral)
            - Smoke tests: CreateSecret + GetSecretValue against Secrets Manager emulated
            - Check workflow logs for failure details

            ---
            *Updated on ${{ github.event_name == 'pull_request' && github.event.pull_request.updated_at || github.run_id }}*
            *Workflow: [Preview Environments](${{ github.server_url }}/${{ github.repository }}/actions/runs/${{ github.run_id }})*

          edit-mode: replace
          continue-on-error: true
```

### Stage 7 — Post-merge: CD (NUEVO)

**Qué**: Cuando un PR se mergea a `main`, se dispara el pipeline completo de CD en **2 fases**:

- **Fase 1 (sin AWS, implementada)**: `docker-build` — build de imagen Docker + validación completa contra stack emulado (Floci + PostgreSQL efímera) + smoke tests.
- **Fase 2 (con AWS, gated por `vars.AWS_ROLE_ARN`)**: `ecr-push` → `deploy-staging` → `deploy-production` — jobs que requieren infraestructura AWS real (OIDC role, ECR, ECS, RDS). Si `AWS_ROLE_ARN` no está configurado, corren jobs "skipped" reporters que documentan por qué no se ejecutan.

**Por qué**: Separar validación de imagen (rápida, sin credenciales AWS) del despliegue real (requiere AWS). Permite iterar en CI/CD sin bloqueo por infraestructura pendiente.

**Cómo** (workflow `deploy.yml` implementado — arquitectura 2-phase gated):

```yaml
name: CD Deploy Pipeline
on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read

jobs:
  # ============================================================
  # JOB 1: docker-build (Fase 1 - sin AWS, YA IMPLEMENTADO)
  # Build de la imagen + validación boot contra Floci + Postgres efímera
  # ============================================================
  docker-build:
    name: Build & Validate Image (Emulated Stack)
    runs-on: ubuntu-latest
    timeout-minutes: 20
    concurrency:
      group: deploy-staging
      cancel-in-progress: false
    permissions:
      contents: read

    services:
      # Floci - Emulador AWS (puerto 4566)
      floci:
        image: floci/floci:1.5.31
        ports:
          - 4566:4566
        env:
          FLOCI_STORAGE_MODE: memory
          FLOCI_HOSTNAME: floci
        options: >-
          --health-cmd "curl -f http://localhost:4566/_localstack/health || exit 1"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
          --health-start-period 10s

      # PostgreSQL efímera para validación de imagen
      db:
        image: postgres:16-alpine
        ports:
          - 5432:5432
        env:
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
          POSTGRES_DB: project_one_cd
        options: >-
          --health-cmd "pg_isready -U test -d project_one_cd"
          --health-interval 5s
          --health-timeout 5s
          --health-retries 10
          --health-start-period 5s

    steps:
      # 1. Checkout
      - name: Checkout repository
        uses: actions/checkout@v5

      # 2. Setup Node.js (needed for test:smoke if running in-process)
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version-file: '.nvmrc'
          cache: 'npm'

      # 3. Install dependencies at monorepo root
      - name: Install dependencies
        run: npm ci

      # 4. Build server Docker image (tag: SHA + latest)
      - name: Build server Docker image
        run: |
          docker build -t project-one-server:${GITHUB_SHA} -t project-one-server:latest -f apps/server/Dockerfile .
        env:
          GITHUB_SHA: ${{ github.sha }}

      # 5. Run Prisma migrations against ephemeral Postgres
      - name: Run Prisma migrations
        working-directory: apps/server
        run: npx prisma migrate deploy
        env:
          DATABASE_URL: postgresql://test:test@localhost:5432/project_one_cd

      # 6. Start server container with emulated AWS stack
      - name: Start server container
        run: |
          docker run -d \
            --name cd-server \
            --network host \
            -e DATABASE_URL=postgresql://test:test@localhost:5432/project_one_cd \
            -e AWS_ENDPOINT_URL=http://localhost:4566 \
            -e AWS_ACCESS_KEY_ID=test \
            -e AWS_SECRET_ACCESS_KEY=test \
            -e AWS_REGION=us-east-1 \
            -e PORT=3000 \
            project-one-server:${GITHUB_SHA}
        env:
          DATABASE_URL: postgresql://test:test@localhost:5432/project_one_cd
          AWS_ENDPOINT_URL: http://localhost:4566
          AWS_ACCESS_KEY_ID: test
          AWS_SECRET_ACCESS_KEY: test
          AWS_REGION: us-east-1
          PORT: 3000

      # 7. Health check with retries (wait for /health 200)
      - name: Wait for server health
        run: |
          for i in {1..30}; do
            if curl -sf http://localhost:3000/health > /dev/null; then
              echo "✅ Server health check passed"
              exit 0
            fi
            echo "⏳ Waiting for server... ($i/30)"
            sleep 2
          done
          echo "❌ Server health check failed after 60s"
          exit 1

      # 8. Run smoke tests against emulated stack
      - name: Run smoke tests (emulated)
        working-directory: apps/server
        run: |
          AWS_ENDPOINT_URL=http://localhost:4566 \
          AWS_ACCESS_KEY_ID=test \
          AWS_SECRET_ACCESS_KEY=test \
          AWS_REGION=us-east-1 \
          npm run test:smoke
        env:
          AWS_ENDPOINT_URL: http://localhost:4566
          AWS_ACCESS_KEY_ID: test
          AWS_SECRET_ACCESS_KEY: test
          AWS_REGION: us-east-1

  # ============================================================
  # JOB 2: ecr-push (Fase 2 - GATED por AWS_ROLE_ARN)
  # Push de la imagen validada a ECR via OIDC
  # ============================================================
  ecr-push:
    name: Push to ECR
    needs: docker-build
    runs-on: ubuntu-latest
    timeout-minutes: 10
    concurrency:
      group: deploy-staging
      cancel-in-progress: false
    permissions:
      id-token: write
      contents: read
    if: ${{ vars.AWS_ROLE_ARN != '' }}

    steps:
      - name: Checkout repository
        uses: actions/checkout@v5

      - name: Configure AWS credentials (OIDC)
        uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: ${{ vars.AWS_ROLE_ARN }}
          aws-region: us-east-1

      - name: Login to Amazon ECR
        uses: aws-actions/amazon-ecr-login@v2

      - name: Build and push image to ECR
        run: |
          docker build -t project-one-server:${GITHUB_SHA} -t project-one-server:latest -f apps/server/Dockerfile .
          docker tag project-one-server:${GITHUB_SHA} ${{ vars.AWS_ACCOUNT_ID }}.dkr.ecr.us-east-1.amazonaws.com/project-one-server:${GITHUB_SHA}
          docker tag project-one-server:latest ${{ vars.AWS_ACCOUNT_ID }}.dkr.ecr.us-east-1.amazonaws.com/project-one-server:latest
          docker push ${{ vars.AWS_ACCOUNT_ID }}.dkr.ecr.us-east-1.amazonaws.com/project-one-server:${GITHUB_SHA}
          docker push ${{ vars.AWS_ACCOUNT_ID }}.dkr.ecr.us-east-1.amazonaws.com/project-one-server:latest
        env:
          GITHUB_SHA: ${{ github.sha }}
          AWS_ACCOUNT_ID: ${{ vars.AWS_ACCOUNT_ID }}

  # ============================================================
  # JOB 3: deploy-staging (Fase 2 - GATED por AWS_ROLE_ARN)
  # Deploy a ECS Fargate staging con circuit breaker + smoke post-deploy
  # ============================================================
  deploy-staging:
    name: Deploy to Staging
    needs: ecr-push
    runs-on: ubuntu-latest
    timeout-minutes: 15
    concurrency:
      group: deploy-staging
      cancel-in-progress: false
    permissions:
      id-token: write
      contents: read
    environment: staging
    if: ${{ vars.AWS_ROLE_ARN != '' }}

    steps:
      - name: Configure AWS credentials (OIDC)
        uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: ${{ vars.AWS_ROLE_ARN }}
          aws-region: us-east-1

      # 1. Register new task definition with SHA-tagged image (NEW revision)
      - name: Register task definition (staging)
        id: task-def-staging
        run: |
          TASK_DEF=$(aws ecs register-task-definition \
            --family project-one-staging-api \
            --network-mode awsvpc \
            --requires-compatibilities FARGATE \
            --cpu "256" \
            --memory "512" \
            --execution-role-arn ${{ secrets.STAGING_TASK_EXECUTION_ROLE_ARN }} \
            --task-role-arn ${{ secrets.STAGING_TASK_ROLE_ARN }} \
            --container-definitions '[
              {
                "name": "api",
                "image": "'${{ vars.AWS_ACCOUNT_ID }}'.dkr.ecr.us-east-1.amazonaws.com/project-one-server:'${{ github.sha }}'",
                "portMappings": [{"containerPort": 3000, "protocol": "tcp"}],
                "environment": [
                  {"name": "NODE_ENV", "value": "staging"},
                  {"name": "PORT", "value": "3000"}
                ],
                "secrets": [
                  {"name": "DATABASE_URL", "valueFrom": "'${{ secrets.STAGING_DATABASE_URL_SECRET_ARN }}'"},
                  {"name": "SECRETKEY", "valueFrom": "'${{ secrets.STAGING_JWT_SECRET_SECRET_ARN }}'"},
                  {"name": "REFRESHSECRETKEY", "valueFrom": "'${{ secrets.STAGING_REFRESH_SECRETKEY_SECRET_ARN }}'"},
                  {"name": "AWS_REGION", "valueFrom": "'${{ secrets.STAGING_AWS_REGION_SECRET_ARN }}'"}
                ],
                "logConfiguration": {
                  "logDriver": "awslogs",
                  "options": {
                    "awslogs-group": "/ecs/project-one-staging",
                    "awslogs-region": "us-east-1",
                    "awslogs-stream-prefix": "api"
                  }
                },
                "healthCheck": {
                  "command": ["CMD-SHELL", "curl -f http://localhost:3000/health || exit 1"],
                  "interval": 30,
                  "timeout": 5,
                  "retries": 3,
                  "startPeriod": 60
                }
              }
            ]' \
            --query 'taskDefinition.taskDefinitionArn' \
            --output text)
          echo "task_definition_arn=$TASK_DEF" >> $GITHUB_OUTPUT
        env:
          GITHUB_SHA: ${{ github.sha }}
          AWS_ACCOUNT_ID: ${{ vars.AWS_ACCOUNT_ID }}

      # 2. Update service with force-new-deployment + circuit breaker
      - name: Update ECS service (staging)
        run: |
          aws ecs update-service \
            --cluster project-one-staging \
            --service api \
            --task-definition ${{ steps.task-def-staging.outputs.task_definition_arn }} \
            --force-new-deployment \
            --deployment-configuration "deploymentCircuitBreaker={enable=true,rollback=true}"

      # 3. Wait for service stability
      - name: Wait for service stability (staging)
        run: |
          aws ecs wait services-stable \
            --cluster project-one-staging \
            --services api

      # 4. Smoke test post-deploy: health endpoint + remote smoke suite
      - name: Post-deploy health check (staging)
        run: |
          for i in {1..30}; do
            if curl -sf "${{ secrets.STAGING_URL }}/health" > /dev/null; then
              echo "✅ Staging health check passed"
              exit 0
            fi
            echo "⏳ Waiting for staging health... ($i/30)"
            sleep 10
          done
          echo "❌ Staging health check failed after 5 minutes"
          exit 1

      # 5. Run remote smoke tests against deployed staging (requires BASE_URL support)
      - name: Run remote smoke tests (staging)
        working-directory: apps/server
        run: |
          BASE_URL="${{ secrets.STAGING_URL }}" npm run test:smoke
        env:
          BASE_URL: ${{ secrets.STAGING_URL }}

  # ============================================================
  # JOB 4: deploy-production (Fase 2 - GATED por AWS_ROLE_ARN)
  # Deploy a producción con approval manual + circuit breaker + health check 5 min
  # ============================================================
  deploy-production:
    name: Deploy to Production
    needs: deploy-staging
    runs-on: ubuntu-latest
    timeout-minutes: 20
    concurrency:
      group: deploy-production
      cancel-in-progress: false
    permissions:
      id-token: write
      contents: read
    environment: production
    if: ${{ vars.AWS_ROLE_ARN != '' }}

    steps:
      - name: Configure AWS credentials (OIDC)
        uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: ${{ vars.AWS_ROLE_ARN }}
          aws-region: us-east-1

      # 1. Register new task definition with SHA-tagged image (NEW revision)
      - name: Register task definition (production)
        id: task-def-production
        run: |
          TASK_DEF=$(aws ecs register-task-definition \
            --family project-one-prod-api \
            --network-mode awsvpc \
            --requires-compatibilities FARGATE \
            --cpu "512" \
            --memory "1024" \
            --execution-role-arn ${{ secrets.PROD_TASK_EXECUTION_ROLE_ARN }} \
            --task-role-arn ${{ secrets.PROD_TASK_ROLE_ARN }} \
            --container-definitions '[
              {
                "name": "api",
                "image": "'${{ vars.AWS_ACCOUNT_ID }}'.dkr.ecr.us-east-1.amazonaws.com/project-one-server:'${{ github.sha }}'",
                "portMappings": [{"containerPort": 3000, "protocol": "tcp"}],
                "environment": [
                  {"name": "NODE_ENV", "value": "production"},
                  {"name": "PORT", "value": "3000"}
                ],
                "secrets": [
                  {"name": "DATABASE_URL", "valueFrom": "'${{ secrets.PROD_DATABASE_URL_SECRET_ARN }}'"},
                  {"name": "SECRETKEY", "valueFrom": "'${{ secrets.PROD_JWT_SECRET_SECRET_ARN }}'"},
                  {"name": "REFRESHSECRETKEY", "valueFrom": "'${{ secrets.PROD_REFRESH_SECRETKEY_SECRET_ARN }}'"},
                  {"name": "AWS_REGION", "valueFrom": "'${{ secrets.PROD_AWS_REGION_SECRET_ARN }}'"}
                ],
                "logConfiguration": {
                  "logDriver": "awslogs",
                  "options": {
                    "awslogs-group": "/ecs/project-one-prod",
                    "awslogs-region": "us-east-1",
                    "awslogs-stream-prefix": "api"
                  }
                },
                "healthCheck": {
                  "command": ["CMD-SHELL", "curl -f http://localhost:3000/health || exit 1"],
                  "interval": 30,
                  "timeout": 5,
                  "retries": 3,
                  "startPeriod": 60
                }
              }
            ]' \
            --query 'taskDefinition.taskDefinitionArn' \
            --output text)
          echo "task_definition_arn=$TASK_DEF" >> $GITHUB_OUTPUT
        env:
          GITHUB_SHA: ${{ github.sha }}
          AWS_ACCOUNT_ID: ${{ vars.AWS_ACCOUNT_ID }}

      # 2. Update service with force-new-deployment + circuit breaker
      - name: Update ECS service (production)
        run: |
          aws ecs update-service \
            --cluster project-one-prod \
            --service api \
            --task-definition ${{ steps.task-def-production.outputs.task_definition_arn }} \
            --force-new-deployment \
            --deployment-configuration "deploymentCircuitBreaker={enable=true,rollback=true}"

      # 3. Wait for service stability
      - name: Wait for service stability (production)
        run: |
          aws ecs wait services-stable \
            --cluster project-one-prod \
            --services api

      # 4. Health check post-deploy: poll /health for up to 5 minutes
      - name: Post-deploy health check (production)
        run: |
          echo "🔍 Polling production health for up to 5 minutes..."
          for i in {1..30}; do
            if curl -sf "${{ secrets.PROD_URL }}/health" > /dev/null; then
              echo "✅ Production health check passed"
              exit 0
            fi
            echo "⏳ Waiting for production health... ($i/30, 10s intervals)"
            sleep 10
          done
          echo "❌ Production health check failed after 5 minutes"
          exit 1

      # 5. Run remote smoke tests against deployed production
      - name: Run remote smoke tests (production)
        working-directory: apps/server
        run: |
          BASE_URL="${{ secrets.PROD_URL }}" npm run test:smoke
        env:
          BASE_URL: ${{ secrets.PROD_URL }}

  # ============================================================
  # JOBS DE REPORTE: skipped jobs cuando falta AWS_ROLE_ARN
  # Estos jobs corren siempre y reportan "skipped" con razón visible
  # ============================================================
  ecr-push-skipped:
    name: ECR Push (Skipped - No AWS Config)
    needs: docker-build
    runs-on: ubuntu-latest
    timeout-minutes: 1
    concurrency:
      group: deploy-staging
      cancel-in-progress: false
    if: ${{ vars.AWS_ROLE_ARN == '' }}
    steps:
      - name: Report skipped
        run: |
          echo "::notice title=ECR Push Skipped::AWS_ROLE_ARN repository variable is not configured. This job requires AWS infrastructure (OIDC role + ECR repo). Configure vars.AWS_ROLE_ARN and vars.AWS_ACCOUNT_ID to enable Phase 2."
          exit 0

  deploy-staging-skipped:
    name: Deploy Staging (Skipped - No AWS Config)
    needs: docker-build
    runs-on: ubuntu-latest
    timeout-minutes: 1
    concurrency:
      group: deploy-staging
      cancel-in-progress: false
    if: ${{ vars.AWS_ROLE_ARN == '' }}
    steps:
      - name: Report skipped
        run: |
          echo "::notice title=Staging Deploy Skipped::AWS_ROLE_ARN repository variable is not configured. ECS staging cluster and environment secrets not provisioned. Complete Floci ECS learning milestone to unlock."
          exit 0

  deploy-production-skipped:
    name: Deploy Production (Skipped - No AWS Config)
    needs: docker-build
    runs-on: ubuntu-latest
    timeout-minutes: 1
    concurrency:
      group: deploy-production
      cancel-in-progress: false
    if: ${{ vars.AWS_ROLE_ARN == '' }}
    steps:
      - name: Report skipped
        run: |
          echo "::notice title=Production Deploy Skipped::AWS_ROLE_ARN repository variable is not configured. ECS production cluster, ALB, and environment not provisioned. Complete Floci learning path milestones to unlock."
          exit 0
```

### Stage 8 — Scheduled / Cron (NUEVO)

**Qué**: Tareas programadas que corren en intervalos regulares.

**Por qué**: Detectar secretos históricos, vulnerabilidades nuevas en dependencias, y mantener SBOM actualizado.

**Cómo** (workflow `scheduled-security.yml` implementado):

```yaml
name: Scheduled Security Scan
on:
  schedule:
    - cron: '0 3 * * 1' # Cada lunes 03:00 UTC

permissions:
  contents: read
  security-events: write

jobs:
  gitleaks-full-scan:
    name: Gitleaks Full History Scan
    runs-on: ubuntu-latest
    continue-on-error: true

    steps:
      - uses: actions/checkout@v5
        with:
          fetch-depth: 0

      - name: Run Gitleaks full history scan (JSON report)
        uses: docker://zricethezav/gitleaks:v8.22.1
        with:
          args: git --log-opts="--all" --report-format=json --report-path=gitleaks-report.json --redact

      - name: Upload Gitleaks JSON report
        uses: actions/upload-artifact@v4
        with:
          name: gitleaks-report
          path: gitleaks-report.json
          retention-days: 30

      - name: Run Gitleaks full history scan (SARIF report)
        uses: docker://zricethezav/gitleaks:v8.22.1
        with:
          args: git --log-opts="--all" --report-format=sarif --report-path=gitleaks.sarif --redact

      - name: Upload SARIF to Security tab
        uses: github/codeql-action/upload-sarif@v4
        with:
          sarif_file: gitleaks.sarif
          category: gitleaks
```

> **Nota**: El workflow actual ejecuta **solo Gitleaks full history scan** (JSON + SARIF → Security tab). Trivy full scan + npm audit + SBOM regeneration NO están en este workflow; están propuestos como cambio OpenSpec `ci-scheduled-trivy` (en propuesta).

#### Stage 8.1 — Scheduled Security Digest (NUEVO)

**Workflow**: `.github/workflows/security-digest.yml` (implementado, cron 03:00 UTC lunes)

Ejecuta un resumen de seguridad semanal combinando múltiples fuentes:

| Job                      | Qué hace                                                                                                                                                                                                                   |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **sbom**                 | Regenera SBOM CycloneDX (`anchore/sbom-action`) y lo sube como artifact (retención 365 días)                                                                                                                               |
| **vulnerability-review** | Ejecuta **OSV Scanner** (`google/osv-scanner-action`) sobre `package-lock.json` → reporte JSON                                                                                                                             |
| **digest**               | Descarga SBOM + OSV report + **Gitleaks SARIF artifact del workflow hermano** `scheduled-security.yml` (via `actions/github-script`), ejecuta `scripts/security/generate-security-digest.mjs`, genera `security-digest.md` |
| **digest (PR comment)**  | Si hay hallazgos `CRITICAL`/`HIGH` o `DENY-LIST`, publica comentario condicional en PR (input `pull_request_number`)                                                                                                       |

**Diferencia clave vs `scheduled-security.yml`**:

- `scheduled-security.yml`: **Gitleaks full history only** (secret scanning histórico, SARIF → Security tab)
- `security-digest.yml`: **OSV Scanner + SBOM + Gitleaks sibling artifact** → digest legible + PR comment accionable

**OSV Scanner en vez de npm audit**: Para el digest programado se usa `google/osv-scanner` (base de datos OSV, más completa y actualizada que npm audit). El `npm audit` permanece en el análisis event-driven (`security.yml` dependency-scan job).

---

## 6. Estrategia de entornos y promoción

### Mapa de entornos

| Entorno              | Propósito                 | Infraestructura                             | Datos                 | ¿Quién accede? |
| -------------------- | ------------------------- | ------------------------------------------- | --------------------- | -------------- |
| **Local**            | Desarrollo diario         | Floci (docker) + PostgreSQL local           | Datos de prueba, seed | Desarrollador  |
| **Preview** (por PR) | Validación de PR          | Floci efímero (GH Actions) + Vercel preview | Datos sintéticos      | Revisor, QA    |
| **Staging**          | Validación pre-producción | AWS (ECS Fargate + RDS pequeño)             | Datos anonimizados    | Equipo interno |
| **Producción**       | Usuarios finales          | AWS (ECS Fargate + RDS escalado)            | Datos reales          | Usuarios       |

### Reglas de promoción

```
Local ──(push)──▶ Preview ──(merge a main)──▶ Staging ──(approval manual)──▶ Producción
```

1. **Local → Preview**: Se activa al abrir un PR contra `main`. Automático.
2. **Preview → Staging**: Se activa al mergear a `main`. Automático si los tests pasan.
3. **Staging → Producción**: Requiere **aprobación manual** (GitHub Environments + reviewers). Opcionalmente, si los smoke tests pasan en staging, se puede habilitar promoción automática.

### Principios

- **Inmutabilidad**: Nunca se modifica un entorno en caliente. Siempre se despliega una nueva versión.
- **Paridad**: Staging es idéntico a producción en tamaño reducido. Misma imagen Docker, misma configuración.
- **Aislamiento**: Los secretos de producción nunca están en staging. Cada entorno tiene su propio conjunto de secretos.

---

## 7. Estrategia de branching y release

### Branching: Trunk-Based Development (TBD)

```
main  ←── commits directos (triviales) o PRs ultra-cortos
  │
  └── feature/lo-que-sea  (PR → main, < 1 día)
  └── fix/arreglo-algo     (PR → main, < 1 día)
  └── hotfix/urgente       (commit directo a main + tag)
```

**Reglas:**

- `main` siempre es deployable (branch estable).
- Ramas de features: **máximo 1 día de vida**. Se integran varias veces al día.
- Commits directos a `main` permitidos para cambios triviales (docs, lint, config). PR requerido para cambios funcionales.
- Sin ramas `develop`, `release/*`, etc. — TBD puro.
- CI debe ser rápido (< 10 min) porque las integraciones son frecuentes.
- Feature flags para cambios grandes que requieren múltiples PRs.

**Justificación**: Para un equipo pequeño (2-3 devs), TBD maximiza la velocidad de integración. Las ramas cortas evitan merge conflicts y el CI rápido (Sprint 1-2) compensa la ausencia de ramas largas. Cambios grandes se protegen con feature flags, no con ramas longevas.

### Releases: Changesets + Tags

```mermaid
flowchart LR
    Merge[Merge a main] --> ChangesetDetect{¿Hay changesets?}
    ChangesetDetect -->|Sí| VersionPR[PR automático: version packages]
    VersionPR --> MergeVersion[PR mergeado]
    MergeVersion --> PublishNpm[Publicar a npm]
    MergeVersion --> GitTag[Crear tag semver]
    GitTag --> DockerTag[Tag Docker con versión]
```

**Proceso:**

1. El desarrollador agrega un changeset en cada PR (`npm run changeset`).
2. `release.yml` detecta changesets y abre un PR de versionado automático.
3. Al mergear ese PR, se publican los paquetes a npm y se crea un tag git.
4. El tag semver se usa como tag de Docker para trazabilidad.

**Frecuencia objetivo**: 1+ releases por semana.

---

## 8. Estrategia de rollback

### Principio general

Todo deploy debe ser **reversible en menos de 15 minutos**.

### Capas de rollback

| Capa                         | Método                                | Tiempo | Automático              |
| ---------------------------- | ------------------------------------- | ------ | ----------------------- |
| **Aplicación** (ECS Fargate) | `ecs update-service` con tag anterior | ~2 min | ✅ Sí (circuit breaker) |
| **Base de datos** (Prisma)   | `prisma migrate down` secuencial      | ~5 min | ⚠️ Manual con revisión  |
| **Cliente** (Vercel)         | Instant rollback en dashboard Vercel  | ~1 min | ✅ Sí                   |

### Rollback automático en CI/CD

**En staging:**

```yaml
# Si smoke tests fallan en staging → rollback automático
- name: Rollback staging
  if: failure()
  run: |
    aws ecs update-service --cluster project-one-staging \
      --service api \
      --task-definition ${{ steps.previous-task-def.outputs.value }} \
      --force-new-deployment
```

**En producción:**

```yaml
# ECS deployment circuit breaker se encarga
deployment-configuration:
  deploymentCircuitBreaker:
    enable: true
    rollback: true
```

### Rollback de base de datos

Las migraciones de Prisma deben ser **reversibles**:

```bash
# Forward
npx prisma migrate deploy

# Reverse (última migración)
npx prisma migrate down
```

**Regla**: Toda migración debe tener su contraparte `down`. Si no es posible revertir (ej. `DROP COLUMN` irreversible), se requiere plan de datos previo.

### Script de rollback manual (DR)

```bash
#!/bin/bash
# rollback.sh — Úsalo solo si CI/CD falla
TAG_ANTERIOR=$(git tag --sort=-version:refname | head -2 | tail -1)
echo "Rollback a $TAG_ANTERIOR"

# 1. Revertir BD
npx prisma migrate down

# 2. Redeploy tag anterior
git checkout $TAG_ANTERIOR
docker build -t api:rollback apps/server
# deploy...
```

---

## 9. Cloud provider: AWS + Floci

### Decisión tomada

| Componente            | Proveedor             | Justificación                                                   |
| --------------------- | --------------------- | --------------------------------------------------------------- |
| **Server (Express)**  | AWS (ECS Fargate)     | Escalabilidad, ecosistema maduro, Floci emula servicios AWS 1:1 |
| **Base de datos**     | AWS RDS PostgreSQL    | Managed, PITR backups, integración nativa con Prisma            |
| **Emulador local/CI** | Floci (MIT, gratuito) | 68 AWS services emulados, port 4566, ~90 MB, startup 24ms       |
| **Cliente (React)**   | Vercel                | Gratuito, CDN global, preview URLs automáticas por PR           |
| **Registry Docker**   | Amazon ECR            | Integrado con ECS Fargate, IAM-based auth                       |

### ¿Por qué Floci?

| Aspecto            | Floci                      | LocalStack (Community)                  |
| ------------------ | -------------------------- | --------------------------------------- |
| **Licencia**       | MIT (forever free)         | Restringida (auth token desde mar 2026) |
| **Servicios**      | 68 (todos gratuitos)       | ~26 esenciales                          |
| **Startup**        | ~24 ms                     | ~3.3 s                                  |
| **Imagen**         | ~90 MB                     | ~1.0 GB                                 |
| **Memory idle**    | ~13 MiB                    | ~143 MiB                                |
| **SDK tests**      | 1,925/1,925 pass           | Parcial                                 |
| **Testcontainers** | ✅ `@floci/testcontainers` | ❌ No oficial                           |
| **Telemetría**     | ❌ Ninguna                 | ✅ Requiere                             |
| **RDS real**       | ✅ PostgreSQL/MySQL        | ❌ No disponible                        |
| **Lambda real**    | ✅ Docker containers       | Parcial                                 |

### Migración desde LocalStack

Es un **cambio de 1 línea** en `docker-compose.yml`:

```yaml
# Antes: image: localstack/localstack:latest
# Después (pin 1.5.31 — tag real publicado en Docker Hub):
services:
  floci:
    image: floci/floci:1.5.31
    ports:
      - '4566:4566'
    environment:
      FLOCI_STORAGE_MODE: memory
      FLOCI_HOSTNAME: floci
    healthcheck:
      test:
        [
          'CMD-SHELL',
          'curl -f http://localhost:4566/_localstack/health >/dev/null 2>&1 || exit 1',
        ]
```

> **Nota**: La configuración actual de desarrollo usa `FLOCI_STORAGE_MODE: memory` **sin volumen persistente** (según `ci-floci-migration` y `docker-compose.yml` del server). El modo `persistent` con volumen `floci_data:/app/data` está disponible vía config si se necesita retención de estado entre reinicios (ej. para desarrollo local prolongado).

### Costos estimados (AWS + Vercel)

| Servicio                        | Detalle                                       | Costo estimado/mes |
| ------------------------------- | --------------------------------------------- | ------------------ |
| **ECS Fargate** (staging)       | 1 vCPU, 2 GB RAM, always-on                   | ~$10-15            |
| **ECS Fargate** (producción)    | 2 vCPU, 4 GB RAM, always-on                   | ~$20-30            |
| **RDS PostgreSQL** (staging)    | db.t3.micro, 20 GB                            | ~$15               |
| **RDS PostgreSQL** (producción) | db.t3.small, 50 GB, multi-AZ                  | ~$50-70            |
| **ECR**                         | Almacenamiento imágenes                       | ~$1-3              |
| **ELB / NAT / Data transfer**   | Variable                                      | ~$10-20            |
| **Vercel** (frontend)           | Free tier (100 GB bandwidth, 6000 build mins) | $0                 |
| **Total estimado**              |                                               | **~$106-153/mes**  |

> Para referencia: Render cuesta ~$14-28/mes para el mismo stack. Sin embargo, la elección de AWS + Floci permite escalar sin migración futura y aprovecha el ecosistema AWS enterprise.

---

## 10. Plan de implementación por sprints

### Sprint 1 — Cerrar gaps críticos de CI (2 semanas, ~16 SP)

**Objetivo**: Que cada PR ejecute tests + build + lint con reporting y caching antes de ser mergeable.

| #    | Tarea                                                                                                                                 | SP  | Dependencia | Criterio de aceptación                                                            | Estado / Change Ref                           |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------- | --- | ----------- | --------------------------------------------------------------------------------- | --------------------------------------------- |
| 1.1  | Reforzar ESLint en `package.json` raíz y workspaces (proyecto es JS puro, no TypeScript)                                              | 1   | —           | `npm run lint` se ejecuta en CI y funciona sin errores                            | ✅ **DONE** — `ci-quality-gates`              |
| 1.2  | Descomentar y configurar jobs `test-unit-client`, `test-unit-server`, `test-integration` en `ci.yml` con PostgreSQL service container | 4   | 1.1         | PR ejecuta `test:unit` (client/server) y `test:integration` (server) con Postgres | ✅ **DONE** — `ci-test-integration`           |
| 1.3  | Agregar job `build` en `ci.yml`                                                                                                       | 1   | 1.2         | `npm run build` corre en cada PR, falla si hay errores                            | ✅ **DONE** — `ci-test-integration`           |
| 1.4  | Agregar `coverage.thresholds` en Vitest config (statements ≥80%, branches ≥75%, functions ≥80%)                                       | 1   | 1.2         | Cobertura mínima configurada por módulo                                           | ✅ **DONE** — `ci-quality-gates`              |
| 1.5  | Crear composite action `.github/actions/setup-monorepo/action.yml` (checkout + setup-node + npm ci + Vitest cache)                    | 2   | —           | Jobs usan `uses: ./.github/actions/setup-monorepo` en vez de repetir pasos        | ✅ **DONE** — `ci-test-integration`           |
| 1.6  | Configurar test reporting con `dorny/test-reporter@v3` + JUnit reporter de Vitest                                                     | 2   | 1.2         | PR muestra anotaciones de tests pasados/fallados en el diff                       | ✅ **DONE** — `ci-test-integration`           |
| 1.7  | Habilitar Dependabot (`.github/dependabot.yml`) con grouping config                                                                   | 1   | —           | Dependabot crea PRs automáticos para parches de seguridad                         | ✅ **DONE** — `ci-test-integration` (task 13) |
| 1.8  | Implementar caching multi-capa (npm + Vitest + Playwright)                                                                            | 1   | 1.5         | CI time < 7 minutos con todas las capas                                           | ✅ **DONE** — `ci-test-integration`           |
| 1.9  | Crear `.dockerignore`                                                                                                                 | 1   | —           | `docker build` no incluye `.env`, `node_modules`, etc.                            | ✅ **DONE** — `ci-test-integration`           |
| 1.10 | Re-activar `lint-staged` en `.husky/pre-commit` (hoy comentado)                                                                       | 1   | —           | Pre-commit ejecuta ESLint + Prettier en archivos staged antes de cada commit      | ✅ **DONE** — `ci-quality-gates`              |
| 1.11 | Configurar flaky test handling: Playwright `retries: 2`, Vitest `retry: 2` en integration tests                                       | 1   | 1.2         | Tests flaky se reintentan automáticamente en CI                                   | ✅ **DONE** — `ci-test-integration`           |

**Dependabot config** (actual `.github/dependabot.yml` — 3 ecosistemas):

```yaml
# .github/dependabot.yml
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
    labels:
      - 'dependencies'
      - 'automated'
    groups:
      dev-dependencies:
        patterns:
          - 'eslint*'
          - 'prettier*'
          - 'typescript*'
          - 'vitest*'
          - '@testing-library*'
          - '@types*'
        update-types:
          - 'minor'
          - 'patch'
    ignore:
      - dependency-name: 'react'
        update-types: ['version-update:semver-major']
      - dependency-name: 'react-dom'
        update-types: ['version-update:semver-major']

  - package-ecosystem: 'github-actions'
    directory: '/'
    schedule:
      interval: 'weekly'
      day: 'monday'
      time: '03:00'
      timezone: 'UTC'
    open-pull-requests-limit: 10
    labels:
      - 'dependencies'
      - 'github-actions'
    commit-message:
      prefix: 'ci'

  - package-ecosystem: 'docker'
    directory: '/apps/server'
    schedule:
      interval: 'weekly'
      day: 'monday'
      time: '03:00'
      timezone: 'UTC'
    open-pull-requests-limit: 10
    labels:
      - 'dependencies'
      - 'docker'
    commit-message:
      prefix: 'ci'
```

### Sprint 2 — CI avanzado + Preview environments (2 semanas, ~12 SP)

**Objetivo**: E2E en CI, previews por PR con Floci + Vercel, y limpieza de workflows muertos.

| #      | Tarea                                                                                                                           | SP  | Dependencia | Criterio de aceptación                                       | Estado / Change Ref                                                                                                                                                         |
| ------ | ------------------------------------------------------------------------------------------------------------------------------- | --- | ----------- | ------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2.1    | Agregar job E2E Playwright en `ci.yml` con caché de browsers                                                                    | 3   | 1.2         | E2E corre en CI cuando `e2e/**` cambia                       | ✅ **DONE** — `ci-test-integration`                                                                                                                                         |
| 2.2    | Crear workflow `preview.yml` con Floci + Vercel preview                                                                         | 3   | —           | Cada PR genera URL de preview comentada en el PR             | ✅ **DONE** — `ci-preview-environments`                                                                                                                                     |
| 2.3    | Migrar de LocalStack a Floci (1 línea en docker-compose.yml)                                                                    | 1   | —           | `docker compose up` levanta Floci en port 4566               | ✅ **DONE** — `ci-floci-migration`                                                                                                                                          |
| 2.4    | Integrar `@floci/testcontainers` con Vitest para tests AWS                                                                      | 2   | 2.3         | Tests que usan S3/DynamoDB funcionan con Floci en CI y local | ⚠️ Pendiente (post-Sprint 4)                                                                                                                                                |
| ✅ 2.5 | ✅ **Eliminar workflows zombie** (`pr-validation.yml`, `lint.yml`, `formatter.yml`) — **COMPLETADO en `ci-cleanup-enterprise`** | 1   | —           | `ls .github/workflows/` solo muestra workflows activos       | ✅ **DONE** — `ci-cleanup-enterprise` (08-02)                                                                                                                               |
| ✅ 2.6 | ✅ **Unificar versión de Node** en todos los workflows a `.nvmrc` — **COMPLETADO en `ci-cleanup-enterprise`**                   | 1   | —           | Todos los workflows usan `node-version-file: .nvmrc`         | ✅ **DONE** — `ci-cleanup-enterprise` (08-02)                                                                                                                               |
| 2.7    | Configurar GitHub secret scanning (gratuito, no requiere licencia)                                                              | 1   | —           | Secret scanning activo en GitHub Security tab                | ⚠️ **Pendiente verificación** — GitHub native secret scanning configurado en Settings (externo); Gitleaks PR-diff en `security.yml` + cron full en `scheduled-security.yml` |

### Sprint 3 — CD básico: Staging automático (2 semanas, ~12 SP)

**Objetivo**: Despliegue automático a staging con smoke tests al mergear a main.

| #   | Tarea                                                     | SP   | Dependencia | Criterio de aceptación                                                                                         | Estado / Change Ref                                                                      |
| --- | --------------------------------------------------------- | ---- | ----------- | -------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| 3.1 | Configurar cuenta AWS (IAM, ECR, ECS, RDS, VPC)           | 8-13 | —           | Despliegue manual exitoso a staging desde local. Estimación alta porque el equipo no tiene experiencia con AWS | ⚠️ **Phase 2 pending** — `cd-aws-deploy-pipeline` Phase 2 gated por `vars.AWS_ROLE_ARN`  |
| 3.2 | Crear workflow `deploy.yml` con build Docker + push a ECR | 2    | 3.1         | `git push main` → imagen Docker en ECR                                                                         | ✅ **Phase 1 DONE** — `deploy.yml` docker-build job (emulado con Floci+Postgres)         |
| 3.3 | Configurar deploy a staging en ECS Fargate                | 3    | 3.2         | Cambio mergeado → staging actualizado en < 5 min                                                               | ⚠️ **Phase 2 pending** — `deploy.yml` deploy-staging job (gated por `vars.AWS_ROLE_ARN`) |

> **Prerequisito**: Agregar endpoint `GET /api/health` al server (Express) si no existe. El health check es usado por ECS target group y por los smoke tests post-deploy.
> | 3.4 | Implementar smoke tests automáticos post-deploy | 2 | 3.3 | Smoke test falla → rollback automático en staging | ✅ **Phase 1 DONE** — `deploy.yml` smoke tests contra Floci emulado + `deploy-staging` smoke tests post-deploy |
> | 3.5 | Configurar Floci en staging como AWS emulador para integración | 1 | 3.3 | Servicios AWS emulados disponibles en staging | ⚠️ **Skipped by design** — staging usa AWS real; Floci solo en CI/preview (Phase 1 emulation) |
> | 3.6 | Configurar GitHub Environments con secrets por entorno | 1 | 3.1 | Staging y producción tienen secretos separados | ⚠️ **Phase 2 pending** — `deploy.yml` usa `environment: staging/production` (gated por `vars.AWS_ROLE_ARN`) |

### Sprint 4 — CD completo: Producción + Madurez (2 semanas, ~8 SP)

**Objetivo**: Despliegue a producción con rollback, SBOM, y monitoreo.

| #   | Tarea                                                  | SP  | Dependencia | Criterio de aceptación                                           | Estado / Change Ref                                                                                                                         |
| --- | ------------------------------------------------------ | --- | ----------- | ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| 4.1 | Configurar deploy a producción con aprobación manual   | 3   | 3.3         | Deploy a producción requiere reviewer + health check             | ✅ **Phase 1 DONE** — `deploy.yml` deploy-production job con `environment: production` (gated)                                              |
| 4.2 | Implementar blue/green deploy con ECS circuit breaker  | 2   | 4.1         | Rollback automático si health check falla post-deploy            | ✅ **Phase 1 DONE** — `deploy.yml` usa `deploymentCircuitBreaker={enable=true,rollback=true}`                                               |
| 4.3 | Agregar SBOM generation en security.yml y cron semanal | 1   | —           | Cada release genera SBOM CycloneDX                               | ✅ **DONE** — `security.yml` sbom job + `security-digest.yml` sbom job (cron semanal)                                                       |
| 4.4 | Agregar Dependency Review action en PRs                | 1   | —           | PRs bloqueados si dependencia tiene vulnerabilidad conocida      | ✅ **DONE** — `security.yml` dependency-review job                                                                                          |
| 4.5 | Configurar cron semanal de security full scan          | 1   | —           | Cada lunes 6am corre Gitleaks full repo + Trivy full + npm audit | ⚠️ **Partial** — `scheduled-security.yml`: Gitleaks full cron ✅ (03:00 UTC); Trivy full + npm audit **propuestos** en `ci-scheduled-trivy` |
| 4.6 | Configurar deploy markers + integración con Sentry     | 1   | 4.1         | Cada deploy crea release en Sentry                               | 📝 **Propuesto** — cambio `cd-observability-sentry` (Sentry deploy markers + releases)                                                      |

### Total: 8 semanas, ~48 SP

---

## 11. Herramientas recomendadas

| Categoría              | Herramienta                           | Versión            | ¿Por qué?                                                  | Costo                   |
| ---------------------- | ------------------------------------- | ------------------ | ---------------------------------------------------------- | ----------------------- |
| **CI/CD platform**     | GitHub Actions                        | —                  | Ya en uso, integración nativa con GitHub                   | Gratuito (2000 min/mes) |
| **Contenedores local** | Docker Compose + Floci                | floci/floci:1.5.31 | MIT, 68 servicios, 90 MB, startup 24ms                     | Gratuito                |
| **Emulador AWS**       | Floci                                 | 1.5.31             | Sustituye LocalStack, licencia MIT, Testcontainers oficial | Gratuito                |
| **Testcontainers AWS** | `@floci/testcontainers`               | latest             | Integración con Vitest, configuración zero-código          | Gratuito                |
| **Registry**           | Amazon ECR                            | —                  | Integrado con ECS, IAM auth, sin límite de pulls           | ~$1-3/mes               |
| **Orquestación**       | ECS Fargate                           | —                  | Serverless containers, sin VMs que gestionar               | Pricing por uso         |
| **Base de datos**      | AWS RDS PostgreSQL                    | 16                 | Managed PITR, backups automáticos, multi-AZ                | ~$15-70/mes             |
| **Frontend hosting**   | Vercel                                | —                  | CDN global, preview URLs, SSR, gratis para este proyecto   | Gratuito                |
| **Dep management**     | Dependabot                            | nativo GitHub      | Zero-config, grupos de dependencias, auto-merge patches    | Gratuito                |
| **Lint**               | ESLint                                | v9 (flat config)   | Ya en uso                                                  | Gratuito                |
| **Formato**            | Prettier                              | v3                 | Ya en uso                                                  | Gratuito                |
| **Testing**            | Vitest + Testing Library + Playwright | —                  | Ya en uso                                                  | Gratuito                |
| **SAST**               | CodeQL + Semgrep                      | —                  | Gratuito en GitHub, cubre OWASP Top 10                     | Gratuito                |
| **SCA**                | Trivy + npm audit                     | —                  | Ya en uso, complementan Dependabot                         | Gratuito                |
| **Secret scanning**    | GitHub secret scanning + Gitleaks     | —                  | GitHub native gratuito, Gitleaks como backup               | Gratuito                |
| **SBOM**               | anchore/sbom-action                   | v0                 | Genera CycloneDX y SPDX                                    | Gratuito                |
| **Dependency review**  | GitHub Dependency Review              | v4                 | Bloquea PRs con dependencias vulnerables                   | Gratuito                |
| **Rollback**           | ECS deployment circuit breaker        | —                  | Nativo de AWS, zero-config                                 | Incluido en ECS         |
| **Monitoreo**          | Sentry + CloudWatch                   | —                  | Sentry gratis hasta 5k eventos/mes                         | Gratuito                |
| **IaC**                | Terraform / OpenTofu                  | 1.x                | Para infra futura; por ahora manual vía AWS Console        | Gratuito                |

### Herramientas consideradas y descartadas

| Herramienta    | Descartada por                                                          | En favor de               |
| -------------- | ----------------------------------------------------------------------- | ------------------------- |
| **Renovate**   | Configuración YAML más compleja, Dependabot suficiente para el proyecto | Dependabot                |
| **LocalStack** | Licencia restrictiva desde mar 2026, auth token requerido               | Floci (MIT)               |
| **Render**     | AWS + Floci elegido (escalabilidad enterprise)                          | AWS + Floci               |
| **Railway**    | Precios impredecibles bajo carga                                        | AWS + Floci               |
| **Jenkins**    | Mantenimiento pesado, no cloud-native                                   | GitHub Actions            |
| **CircleCI**   | Costo, no hay necesidad de migrar de GitHub Actions                     | GitHub Actions            |
| **SonarQube**  | Complejidad adicional; ESLint + CodeQL + Semgrep cubren                 | ESLint + CodeQL + Semgrep |
| **Snyk**       | Costo para equipo pequeño; Dependabot + Trivy cubren                    | Dependabot + Trivy        |

---

## 12. KPIs y DORA metrics

### DORA metrics (4 keys)

Baseline actual y targets a 6 y 12 meses:

| Métrica                          | Definición                                | Estado actual    | Target 6 meses | Target 12 meses |
| -------------------------------- | ----------------------------------------- | ---------------- | -------------- | --------------- |
| **Deployment Frequency**         | Frecuencia de despliegues a producción    | Manual (0/mes)   | ≥ 1/semana     | ≥ 3/semana\*    |
| **Lead Time for Changes**        | Tiempo desde commit hasta producción      | Días (sin medir) | < 1 día        | < 4 horas       |
| **Mean Time to Recovery (MTTR)** | Tiempo en recuperarse de un fallo en prod | Días (sin medir) | < 2 horas      | < 30 minutos    |
| **Change Failure Rate**          | % de despliegues que causan incidentes    | No medido        | < 15%          | < 10%           |

> \*⚠️ **Nota sobre target de Deployment Frequency**: El equipo no tiene experiencia con AWS (ver riesgo §13). Los targets de 3 deploys/semana requieren automatización completa de CD (Sprint 4). Target realista a 12 meses: **≥ 1 deploy/semana estable**; 3/semana solo si CD está maduro.

### KPIs operativos adicionales

| KPI                            | Definición                              | Target   | Cómo se mide             |
| ------------------------------ | --------------------------------------- | -------- | ------------------------ |
| **CI pipeline duration**       | Tiempo medio de CI completo             | < 10 min | GitHub Actions analytics |
| **PR merge rate**              | % de PRs mergeados sin blockers         | > 90%    | GitHub Insights          |
| **Test coverage**              | Cobertura de línea global               | > 80%    | Vitest coverage report   |
| **Dependency freshness**       | % de dependencias sin vulns conocidas   | > 95%    | Dependabot alerts        |
| **SBOM generation**            | % de releases con SBOM generado         | 100%     | Workflow logs            |
| **Rollback success rate**      | % de rollbacks exitosos                 | 100%     | Deploy logs              |
| **Build success rate on main** | % de builds exitosos en main            | 100%     | GitHub Actions           |
| **Flaky test rate**            | % de tests que fallan intermitentemente | < 1%     | Vitest retry stats       |

### Dashboard propuesto

```mermaid
flowchart LR
    GA[GitHub Actions] --> DORA[DORA Dashboard]
    Dependabot[Dependabot] --> DORA
    Vitest[Vitest Coverage] --> DORA
    Sentry[Sentry] --> DORA
    DORA --> Notif[Alertas: Slack / Teams / Email]
```

Implementar en un GitHub Project board o dashboard simple con:

- Deploy frequency → GitHub Actions deploy workflow runs
- Lead time → Time from PR merged to deploy completed
- MTTR → Time from incident to rollback
- Change failure rate → Deployments causing rollback / total deploys

---

## 13. Riesgos y anti-patterns

### Mapeo vs OWASP CI/CD Top 10

| #           | Riesgo OWASP                             | ¿Aplica?   | Mitigación                                                                |
| ----------- | ---------------------------------------- | ---------- | ------------------------------------------------------------------------- |
| CICD-SEC-1  | Insufficient Pipeline Security           | ✅         | Secrets en GitHub Environments, IAM roles, OIDC                           |
| CICD-SEC-2  | Inadequate Pipeline Isolation            | ✅         | Workflows separados, entornos aislados                                    |
| CICD-SEC-3  | Poisoned Pipeline Execution (PPE)        | ✅         | Revisión de PRs antes de merge, Dependabot reviews automáticos            |
| CICD-SEC-4  | Insecure Secret Management               | ⚠️ Parcial | GitHub Secrets + Environments; migrar a AWS Secrets Manager cuando crezca |
| CICD-SEC-5  | Insecure Provisioning of Cloud Resources | ⚠️ Parcial | IaC planeado pero no inmediato                                            |
| CICD-SEC-6  | Insecure Artifact Management             | ✅         | Imágenes firmadas vía ECR, SBOM generado                                  |
| CICD-SEC-7  | Insecure Dependency Management           | ✅         | Dependabot + Trivy + npm audit                                            |
| CICD-SEC-8  | Insecure Testing                         | ⚠️ Parcial | Unit + Integration + E2E + Smoke tests                                    |
| CICD-SEC-9  | Insecure Compliance and Audit            | ✅         | SBOM, auditoría de deploys, deploy markers                                |
| CICD-SEC-10 | Insecure Configuration                   | ⚠️ Parcial | Branch protection rules, required status checks                           |

### Anti-patterns a evitar

| Anti-pattern            | Riesgo                                  | Cómo evitarlo                                             |
| ----------------------- | --------------------------------------- | --------------------------------------------------------- |
| **Long-lived branches** | Merge conflicts, despliegues atrasados  | TBD: ramas < 1 día, integración continua                  |
| **Manual deploys**      | Errores humanos, inconsistencia         | CD automático con gates de aprobación                     |
| **Missing rollback**    | Deploy fallido = downtime prolongado    | ECS circuit breaker + script de rollback                  |
| **Slow CI (>7 min)**    | Desarrolladores ignoran CI              | Caching multi-capa, tests paralelizados                   |
| **Flaky tests**         | Tests ignorados, CI pierde credibilidad | Retry policy, quarantine de flaky tests                   |
| **Secret leakage**      | Exposición de credenciales              | Secret scanning pre-commit + CI + cron                    |
| **Untested migrations** | DB corruption en producción             | Prisma migrate test en CI + migrate down siempre definido |
| **Docker as root**      | Seguridad comprometida en contenedores  | USER node en Dockerfile (ya configurado)                  |
| **Large base images**   | CI lento, superficie de ataque grande   | Alpine base (ya configurado: `node:20-alpine`)            |
| **No SBOM**             | Sin visibilidad de dependencias         | SBOM en cada release + cron semanal                       |

### Riesgos del plan y mitigaciones

| Riesgo                                                | Probabilidad | Impacto | Mitigación                                                                                  |
| ----------------------------------------------------- | ------------ | ------- | ------------------------------------------------------------------------------------------- |
| **AWS config se vuelve compleja** (VPC, IAM, ECS)     | Media        | Alto    | Usar AWS Console + CloudFormation quick-start; IaC en Sprint 4                              |
| **Floci no cubre algún servicio AWS que necesitemos** | Baja         | Medio   | Floci cubre 68 servicios; si falta, usar LocalStack (con auth token) como fallback temporal |
| **Costos AWS más altos de lo estimado**               | Media        | Medio   | Monitoreo de costos + alarmas de presupuesto en AWS Budgets                                 |
| **El equipo no tiene experiencia con AWS**            | Alta         | Alto    | AWS Free Tier + documentación + templates de ECS pre-configurados                           |
| **Pruebas de integración son lentas en CI**           | Media        | Medio   | Caching de Vitest, sharding de tests, E2E opcional solo cuando cambia e2e                   |

---

## 14. Próximos pasos concretos

### Qué hacer mañana (orden de prioridad — mapeado a Sprint 1)

1. ✅ **Crear composite action `.github/actions/setup-monorepo/action.yml`** — **DONE** en `ci-test-integration` (Sprint 1.5)
2. ✅ **Descomentar y armar jobs test en `ci.yml`** — **DONE** test-unit-client, test-unit-server, test-integration con PostgreSQL service + prisma migrate deploy en `ci-test-integration` (Sprint 1.2)
3. ✅ **Agregar job `build` en `ci.yml`** — **DONE** `npm run build --ws --if-present` en `ci-test-integration` (Sprint 1.3)
4. ✅ **Configurar test reporting** — **DONE** `dorny/test-reporter@v3` + JUnit reporter de Vitest en `ci-test-integration` (Sprint 1.6)
5. ✅ **Agregar caching multi-capa** — **DONE** npm (built-in), Vitest cache, Playwright browsers en `ci-test-integration` (Sprint 1.8)
6. ✅ **Configurar flaky test retry** — **DONE** Playwright `retries: 2`, Vitest `retry: 2` en `ci-test-integration` (Sprint 1.11)
7. ✅ **Crear `.github/dependabot.yml`** — **DONE** habilitar Dependabot con grouping config en `ci-test-integration` task 13 (Sprint 1.7)
8. ✅ **Agregar `coverage.thresholds`** en Vitest config — **DONE** en `ci-quality-gates` (Sprint 1.4)
9. ✅ **Verificar ESLint como gate en CI** — **DONE** `npm run lint` falla si hay errores en `ci-quality-gates` (Sprint 1.1)
10. ✅ **Re-activar `lint-staged`** en `.husky/pre-commit` — **DONE** en `ci-quality-gates` (Sprint 1.10)
11. ✅ **Crear `.dockerignore`** — **DONE** en `ci-test-integration` (Sprint 1.9)
12. ✅ **Eliminar `pr-validation.yml`, `lint.yml`, `formatter.yml`** — **COMPLETADO en `ci-cleanup-enterprise`** (08-02)

**Siguiente foco**: Implementar `ci-test-integration` (tests + build + reporting completos) → luego `cd-aws-deploy-pipeline` Phase 2 (AWS real).

### Quick reference — comandos iniciales

```bash
# 1. Crear .dockerignore
cat > .dockerignore << 'EOF'
node_modules
.env
.env.*
!.env.example
.git
.gitignore
*.md
*.log
dist
.next
coverage
.gitkeep
EOF

# 2. ✅ Pre-push hook ya configurado (ver .husky/pre-push)
#    Implementado con vitest --changed origin/main en change pre-push-scoped-tests

# 3. Verificar que ESLint funciona como gate
npm run lint
```

### Día 1 checklist

```markdown
- [x] `.github/dependabot.yml` creado (Sprint 1.7) — `ci-test-integration` task 13
- [x] ~~`.husky/pre-push`~~ ✅ Completado — `vitest --changed origin/main` scoped
- [x] `lint-staged` re-activado en `.husky/pre-commit` (Sprint 1.10) — `ci-quality-gates`
- [x] Composite action `.github/actions/setup-monorepo/action.yml` creado (Sprint 1.5) — `ci-test-integration`
- [x] Tests + PostgreSQL service container en ci.yml (Sprint 1.2) — `ci-test-integration`
- [x] Build job en ci.yml (Sprint 1.3) — `ci-test-integration`
- [x] npm cache + Vitest cache + Playwright cache (Sprint 1.8) — `ci-test-integration`
- [x] Test reporting con dorny/test-reporter (Sprint 1.6) — `ci-test-integration`
- [x] coverage.thresholds en vitest.config (Sprint 1.4) — `ci-quality-gates`
- [x] `.dockerignore` creado (Sprint 1.9) — `ci-test-integration`
- [x] Flaky test retry configurado (Sprint 1.11) — `ci-test-integration`
- [x] Workflows zombie eliminados — `ci-cleanup-enterprise` (08-02)
- [ ] Branch protection rules: required test + build + lint (pendiente configurar en GitHub repo settings)
```

---

## 14.5. Coverage Baselines (Jul 2026)

Medidas de cobertura de código actuales (baseline) para ambos workspaces. Estos valores se usarán como referencia para configurar umbrales (`coverage.thresholds`) en el cambio `ci-test-integration`.

| Métrica        | Client (React) | Server (Express) |
| -------------- | -------------- | ---------------- |
| **Statements** | 84.69%         | 39.5%            |
| **Branches**   | 50.00%         | 18.14%           |
| **Functions**  | 64.28%         | 7.51%            |
| **Lines**      | 85.86%         | 39.90%           |

**Fecha de medición:** Julio 2026  
**Herramienta:** Vitest + V8 coverage provider  
**Nota:** Los umbrales mínimos se configurarán en el cambio `ci-test-integration` (Sprint 1, tarea 1.4). El server tiene cobertura baja en branches/functions debido a middlewares y módulos sin tests unitarios directos; se priorizará elevar branches > 50% en modules críticos (events, auth, notes) antes de activar gate estricto.

---

## 15. Referencias y fuentes

### Industry standards

- **DORA (DevOps Research & Assessment)** — https://dora.dev/
  - "Accelerate State of DevOps Report" 2023-2025
  - 4 Key Metrics: Deployment Frequency, Lead Time, MTTR, Change Failure Rate
- **SLSA (Supply-chain Levels for Software Artifacts)** — https://slsa.dev/
  - Niveles 1-3 para seguridad de cadena de suministro
- **OWASP CI/CD Security Risks Top 10** — https://owasp.org/www-project-top-10-ci-cd-security-risks/
  - Mapeo de riesgos específicos de pipelines
- **CALMS (Culture, Automation, Lean, Measurement, Sharing)** — https://itrevolution.com/calms/
  - Framework de adopción de DevOps
- **SPACE framework** — https://queue.acm.org/detail.cfm?id=3454124
  - Satisfacción, Performance, Activity, Communication, Efficiency

### Herramientas (versiones y docs)

- **Floci** v1.5.11 — https://floci.io/ — MIT, 68 servicios AWS, port 4566
- **GitHub Actions** — https://docs.github.com/en/actions
- **GitHub Dependency Review** v4 — https://github.com/actions/dependency-review-action
- **Trivy** v0.56+ — https://github.com/aquasecurity/trivy-action
- **Anchore SBOM** v0 — https://github.com/anchore/sbom-action
- **CodeQL** v4 — https://github.com/github/codeql-action
- **Semgrep** — https://semgrep.dev/ — Reglas: p/owasp-top-ten, p/javascript, p/express, p/react
- **Playwright** — https://playwright.dev/ — Browser testing
- **Vitest** — https://vitest.dev/ — Coverage thresholds, cache
- **ECS Fargate** — https://aws.amazon.com/ecs/ — Deployment circuit breaker
- **Changesets** — https://github.com/changesets/changesets — Versionado npm

### Recursos adicionales

- "Continuous Delivery" (Humble & Farley) — https://continuousdelivery.com/
- GitHub Actions best practices — https://docs.github.com/en/actions/using-workflows/workflow-best-practices
- Prisma migration safety — https://www.prisma.io/docs/orm/prisma-migrate/getting-started

### Investigación 2026 (incorporada a este plan)

| Fuente                                         | Enlace                                                                                                 | Aportación al plan                               |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------------------ | ------------------------------------------------ |
| **GitHub Docs: Building and testing Node.js**  | https://docs.github.com/en/actions/automating-builds-and-tests/building-and-testing-nodejs             | Estructura base workflows Node.js                |
| **GitHub Docs: PostgreSQL service containers** | https://docs.github.com/en/actions/using-containerized-services/creating-postgresql-service-containers | Service container pattern para integration tests |
| **dorny/test-reporter**                        | https://github.com/marketplace/actions/test-reporter                                                   | JUnit annotations en PRs                         |
| **ECOSIRE: CI/CD for Monorepo Projects**       | https://ecosire.com/blog/github-actions-cicd-monorepo                                                  | Path-filtering + matrix parallelism              |
| **WarpBuild: GitHub Actions Monorepo Guide**   | https://www.warpbuild.com/blog/github-actions-monorepo-guide                                           | Composite actions, affected detection            |
| **OneUptime: Monorepos with GitHub Actions**   | https://oneuptime.com/blog/post/2026-02-02-github-actions-monorepos/view                               | Job DAG optimization                             |
| **DeFlaky: Flaky Tests in GitHub Actions**     | https://deflaky.com/blog/flaky-tests-github-actions                                                    | Auto-detección y cuarentena de flaky tests       |
| **FlakyGuard: Fixing Flaky Tests**             | https://flakyguard.com/blog/flaky-tests-github-actions                                                 | Retry strategies, TTL policies                   |
| **RexBytes: GitHub Actions Integration Tests** | https://rexbytes.com/2026/02/21/github-actions-ci-cd-6-10-integration-tests/                           | PostgreSQL service setup paso a paso             |
| **Pact: CI/CD Setup Guide**                    | https://docs.pact.io/pact_nirvana                                                                      | Contract testing integration (futuro)            |
| **Pact: can-i-deploy**                         | https://docs.pact.io/pact_nirvana                                                                      | Deployment gates con contract testing            |

---

## 16. Técnicas Avanzadas de CI/CD

Esta sección documenta **30 técnicas de CI/CD** organizadas en seis subsecciones, mapeadas al stack de Project One (Node.js/Express/React monorepo con AWS+Floci+Vercel). Cada técnica incluye definición, propósito, etapa de aplicación y herramientas concretas.

---

### 16.1 Shift Left — Mover la calidad hacia la izquierda

El principio de **Shift Left** consiste en ejecutar validaciones lo más temprano posible en el ciclo de desarrollo: desde el IDE del desarrollador hasta la integración continua en PR. El objetivo es detectar defectos en segundos (pre-commit) o minutos (CI), en lugar de horas o días (CD/producción).

> **Para no técnicos**: "Shift Left" significa detectar problemas **antes** de que lleguen a producción. Es más barato y rápido corregir un error cuando lo acabas de escribir (segundos) que cuando ya está en producción (horas o días).

| Técnica Shift Left         | Etapa                            | Herramienta                                              | Beneficio para Project One                               |
| -------------------------- | -------------------------------- | -------------------------------------------------------- | -------------------------------------------------------- |
| **Linting**                | Pre-commit (husky + lint-staged) | ESLint, Prettier                                         | Errores de sintaxis detectados en <2s antes del commit   |
| **SAST (Static Analysis)** | Pre-commit + CI-PR               | Semgrep (rules p/javascript, p/express, p/react), CodeQL | Vulnerabilidades OWASP Top 10 detectadas antes de merge  |
| **Secret scanning**        | Pre-commit + CI-PR               | Gitleaks / GitHub secret scanning                        | Credenciales filtradas bloqueadas antes del push         |
| **SCA (Dependency scan)**  | CI-PR (PR gate)                  | Dependabot + Dependency Review v4                        | Dependencias vulnerables bloqueadas al abrir PR          |
| **Unit tests**             | Pre-push + CI-PR                 | Vitest (coverage thresholds)                             | Regresiones lógicas detectadas en <30s                   |
| **Component tests**        | CI-PR (paralelo)                 | Vitest + Testing Library                                 | UI components verificados sin arrancar navegador         |
| **Integration tests**      | CI-PR (tras unit)                | Vitest + MSW                                             | APIs y DB verificadas contra contratos mockeados         |
| **Contract tests (CDC)**   | CI-PR                            | MSW handlers + OpenAPI validation                        | Cliente y server nunca desincronizados                   |
| **Performance/Lighthouse** | CI-PR (preview URL)              | Lighthouse CI (Vercel preview)                           | Budgets de rendimiento validados por PR                  |
| **Bundle analysis**        | Pre-push + CI-PR                 | vite-bundle-analyzer / esbuild-visualizer                | Regresiones de tamaño detectadas antes del merge         |
| **IaC validation**         | CI-PR                            | OpenTofu plan + tfsec/checkov                            | Infraestructura validada y revisada por PR               |
| **Policy as Code (OPA)**   | CI-PR                            | OPA / conftest                                           | Políticas de tagging, seguridad y costos validadas en PR |

---

### 16.2 Shift Right — Validación en producción y más allá

**Shift Right** comprende las técnicas que validan el software en entornos reales o similares a producción (staging, producción, post-deploy). Complementa al Shift Left capturando problemas que solo aparecen con tráfico real, datos reales o infraestructura real.

> **Para no técnicos**: "Shift Right" significa monitorear y validar la aplicación **después** de que está corriendo, con usuarios reales. No importa cuánto pruebes antes, algunos problemas solo aparecen con tráfico real.

| Técnica Shift Right            | Etapa                     | Herramienta                            | Beneficio para Project One                                  |
| ------------------------------ | ------------------------- | -------------------------------------- | ----------------------------------------------------------- |
| **Smoke tests post-deploy**    | CD Staging + CD Prod      | Playwright + curl tests                | Verificación básica de que el deploy fue exitoso            |
| **Synthetic monitoring**       | Cron (cada 5 min)         | CloudWatch Synthetics / Checkly        | Disponibilidad y latencia monitoreada 24/7                  |
| **Canary deployment**          | CD Prod (tráfico gradual) | ECS CodeDeploy canary 10/10/90         | Riesgo minimizado: nueva versión recibe 10% tráfico inicial |
| **Blue/Green deployment**      | CD Prod                   | ECS multi-target group + DNS           | Rollback instantáneo: swap target group                     |
| **Dark launching**             | CD Prod (feature flags)   | Feature flags (Unleash / LaunchDarkly) | Funcionalidades desplegadas pero ocultas hasta activación   |
| **A/B testing**                | CD Prod                   | Feature flags + analytics              | Decisiones basadas en datos, no en suposiciones             |
| **Real User Monitoring (RUM)** | Post-deploy continuo      | Sentry Performance + Web Vitals        | Métricas reales de usuario: LCP, CLS, INP                   |
| **Error tracking**             | Post-deploy continuo      | Sentry + CloudWatch Logs               | Errores en producción capturados con stack traces           |
| **Chaos engineering**          | Scheduled cron            | AWS Fault Injection Simulator          | Resiliencia probada mediante inyección controlada de fallos |
| **Runtime security**           | Post-deploy continuo      | CloudWatch + GuardDuty                 | Amenazas activas detectadas en tiempo real                  |
| **SBOM verification**          | Cron (semanal)            | Anchore SBOM + Trivy                   | Cumplimiento SLSA: firmas y dependencias verificadas        |
| **Full security scan**         | Cron (semanal)            | Trivy + CodeQL full scan               | Escaneo completo sin límite de tiempo vs CI                 |

---

### 16.3 Mapa de técnicas por stage

Matriz completa de las 30 técnicas mapeadas al stage del pipeline donde se ejecutan. ✅ = aplicación primaria, ◐ = aplicación secundaria.

| #   | Técnica                              | Pre-commit | Pre-push | CI-PR | CD Staging | CD Prod | Cron / Post-deploy |
| --- | ------------------------------------ | ---------- | -------- | ----- | ---------- | ------- | ------------------ |
| 1   | Shift Left Testing (unit)            | ◐          | ✅       | ✅    | —          | —       | —                  |
| 2   | Shift Left Security (SAST)           | ✅         | ◐        | ✅    | —          | —       | —                  |
| 3   | Shift Right Testing (smoke)          | —          | —        | —     | ✅         | ✅      | ◐                  |
| 4   | Shift Right Security                 | —          | —        | —     | —          | ◐       | ✅                 |
| 5   | Fail Fast                            | ✅         | ✅       | ✅    | —          | —       | —                  |
| 6   | Test Pyramid                         | —          | ◐        | ✅    | —          | —       | —                  |
| 7   | Shift Left Performance               | —          | —        | ✅    | ◐          | —       | —                  |
| 8   | Contract Testing (CDC)               | —          | —        | ✅    | ◐          | —       | —                  |
| 9   | IaC + Shift Left Infra               | —          | —        | ✅    | ✅         | —       | —                  |
| 10  | Feature Flags / Progressive Delivery | —          | —        | ◐     | ✅         | ✅      | —                  |
| 11  | Traceability                         | ◐          | ◐        | ✅    | ✅         | ✅      | ✅                 |
| 12  | Immutable Infrastructure             | —          | —        | —     | ✅         | ✅      | —                  |
| 13  | Observability-Driven Dev             | ◐          | —        | —     | ◐          | ✅      | ✅                 |
| 14  | Chaos Engineering                    | —          | —        | —     | ◐          | —       | ✅                 |
| 15  | Quality Gates                        | ✅         | ✅       | ✅    | ✅         | ✅      | —                  |
| 16  | Shift Left Documentation             | ✅         | —        | ✅    | —          | —       | —                  |
| 17  | Policy as Code (OPA)                 | —          | —        | ✅    | ✅         | —       | ◐                  |
| 18  | GitOps                               | —          | —        | —     | ✅         | ✅      | ✅                 |
| 19  | Inner Loop / Outer Loop              | ✅         | ✅       | ◐     | ◐          | —       | —                  |
| 20  | Blast Radius Reduction               | —          | —        | —     | ✅         | ✅      | —                  |
| 21  | Blue/Green Deployment                | —          | —        | —     | ◐          | ✅      | —                  |
| 22  | Canary Deployment                    | —          | —        | —     | ◐          | ✅      | —                  |
| 23  | Dark Launching                       | —          | —        | —     | ✅         | ✅      | —                  |
| 24  | Trunk-Based Development              | ◐          | ◐        | ✅    | —          | —       | —                  |
| 25  | Continuous Testing                   | —          | —        | ◐     | ◐          | ◐       | ✅                 |
| 26  | Self-Healing Pipelines               | —          | —        | ✅    | ✅         | ✅      | ◐                  |
| 27  | Compliance as Code                   | —          | —        | ◐     | ✅         | ✅      | ✅                 |
| 28  | Semantic Versioning + Changelog      | ◐          | —        | ✅    | ✅         | —       | —                  |
| 29  | Artifact Integrity / Supply Chain    | —          | —        | ✅    | ✅         | ✅      | ✅                 |
| 30  | Cost-Aware Deployments (FinOps)      | —          | —        | ◐     | ✅         | ✅      | ✅                 |

---

### 16.4 Cómo se aplican en Project One

Las 30 técnicas se priorizan en tres niveles según impacto y esfuerzo para Project One:

#### 🔴 Must-have (Sprint 1–4)

Técnicas esenciales implementadas durante los sprints definidos en el roadmap (Apéndice B).

| Técnica                         | Sprint     | Implementación concreta                                                                                                                   |
| ------------------------------- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| **Fail Fast** (5)               | Sprint 1   | Pre-commit hook `lint-staged` ejecuta ESLint + Prettier en archivos staged. Falla en <2s.                                                 |
| **Shift Left Testing** (1)      | Sprint 1-2 | `vitest --coverage` con thresholds: statements ≥80%, branches ≥75%. Tests unitarios paralelizados por paquete (`--pool=forks`).           |
| **Shift Left Security** (2)     | Sprint 1-3 | Semgrep en pre-commit (reglas `p/javascript p/express p/react`). Gitleaks en pre-push. CodeQL + Dependency Review en PR gate.             |
| **Test Pyramid** (6)            | Sprint 1-2 | Ratio vigilado en CI: ⩾70% unit, ⩽20% integration, ⩽10% E2E. E2E separados en job independiente.                                          |
| **Quality Gates** (15)          | Sprint 1-4 | Gates secuenciales: lint → coverage → build → E2E → smoke → health. Cada gate detiene pipeline si falla.                                  |
| **Shift Right Testing** (3)     | Sprint 3-4 | Smoke tests con Playwright tras deploy a staging. Comando: `npx playwright test --grep @smoke`.                                           |
| **Blue/Green + Canary** (21,22) | Sprint 4   | ECS CodeDeploy con canary 10%. `aws deploy create-deployment --deployment-config-name CodeDeployDefault.ECSLinear10PercentEvery1Minutes`. |
| **Observability** (13)          | Sprint 3-4 | Pino structured logs en server. Sentry en client+server. CloudWatch dashboard con métricas clave.                                         |
| **Traceability** (11)           | Sprint 1-4 | Tags: `git tag v1.2.3` + ECR `:sprint-4-{sha}` + Sentry release. SBOM attachado a cada release de GitHub.                                 |

**Ejemplo concreto — Quality Gate en CI-PR:**

```yaml
# .github/workflows/quality-gates.yml (extracto)
jobs:
  gate-lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v5
      - run: npm run lint:check
  gate-unit:
    needs: gate-lint
    steps:
      - run: npm run test:coverage
  gate-build:
    needs: gate-unit
    steps:
      - run: npm run build
  gate-e2e:
    needs: gate-build
    steps:
      - run: npx playwright test --grep @smoke
```

**Ejemplo concreto — Pre-commit hook (Fail Fast + SAST):**

```bash
# .husky/pre-commit
npx lint-staged
npx semgrep --config p/javascript --error --quiet
npx gitleaks detect --source . --verbose
```

**Ejemplo concreto — Coverage thresholds (Test Pyramid):**

```typescript
// vitest.config.ts (shared)
export default defineConfig({
  test: {
    coverage: {
      thresholds: {
        statements: 80,
        branches: 75,
        functions: 80,
        lines: 80,
      },
    },
  },
});
```

#### 🟡 Should-have (Post-Sprint 4)

Técnicas de alto valor que se implementan después de estabilizar el pipeline base.

| Técnica                           | Implementación                                                                                                                                                                                                                                                                                                                                       |
| --------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Contract Testing** (8)          | MSW handlers como source of truth. Validación automática contra OpenAPI spec.                                                                                                                                                                                                                                                                        |
| **Shift Left Performance** (7)    | Lighthouse CI en preview URLs de Vercel. Budgets: LCP <2.5s, CLS <0.1, TBT <200ms.                                                                                                                                                                                                                                                                   |
| **Feature Flags** (10)            | Unleash self-hosted o LaunchDarkly. Flags en responses de API, toggle en UI.                                                                                                                                                                                                                                                                         |
| **Self-Healing Pipelines** (26)   | GitHub Actions `concurrency: cancel-in-progress`. Flaky test auto-retry (jest --retries 2). **Zombie workflow guard** (`ci.yml:zombie-workflow-guard`, líneas 250-269): job que falla si reaparecen workflows legacy eliminados (`pr-validation.yml`, `lint.yml`, `formatter.yml`) — guardia anti-regresión implementado en `ci-cleanup-enterprise`. |
| **Immutable Infrastructure** (12) | ECS Fargate sin SSH. Nueva task definition por deploy.                                                                                                                                                                                                                                                                                               |
| **IaC validation** (9)            | OpenTofu plan en CI-PR. tfsec scanning de módulos.                                                                                                                                                                                                                                                                                                   |
| **SBOM + Supply Chain** (29)      | Anchore SBOM en cada release. Cosign para firmar imágenes ECR.                                                                                                                                                                                                                                                                                       |

#### 🟢 Nice-to-have (Long-term)

Técnicas de madurez avanzada que aportan valor incremental a largo plazo.

| Técnica                           | Implementación                                                                             |
| --------------------------------- | ------------------------------------------------------------------------------------------ |
| **Chaos Engineering** (14)        | AWS FIS experimentos: latencia redis, failover RDS, terminación ECS tasks.                 |
| **GitOps** (18)                   | ArgoCD o Flux para sincronizar estado ECS con repositorio git.                             |
| **Policy as Code** (17)           | OPA reglas para tagging de recursos AWS, security groups, budget alerts.                   |
| **FinOps** (30)                   | Terraform cost estimation en PR. AWS Budget + alerts. Scheduled stop/start staging (cron). |
| **Dark Launching** (23)           | Feature flags avanzados: rollout por usuario, región, plan.                                |
| **Compliance as Code** (27)       | Auditoría automatizada SOC2/GDPR. Signed commits, audit trails.                            |
| **Continuous Testing** (25)       | Regression suite completa cada 24h vía cron. Smoke tests cada 5min en prod.                |
| **Shift Left Documentation** (16) | JSDoc linting en CI. OpenAPI spec validation. Storybook stories tests en CI.               |

---

### 16.5 Matriz de madurez — Técnicas CI/CD

Estado actual de Project One vs objetivo al Sprint 4 vs visión a 12 meses.

| Técnica                           | Estado actual                         | Objetivo Sprint 4                                           | Objetivo 12 meses                           |
| --------------------------------- | ------------------------------------- | ----------------------------------------------------------- | ------------------------------------------- |
| Shift Left Testing (unit)         | ⚠️ Tests existen sin thresholds ni CI | ✅ CI con thresholds y paralelización                       | ✅ Tests con TIA (test impact analysis)     |
| Shift Left Security (SAST)        | ❌ Sin SAST en CI                     | ✅ Semgrep + CodeQL en CI-PR                                | ✅ Semgrep + CodeQL + secrets en pre-commit |
| Shift Right Testing (smoke)       | ❌ Sin smoke tests                    | ✅ Smoke tests post-deploy staging                          | ✅ Smoke tests en staging y prod            |
| Shift Right Security              | ❌ Sin runtime security               | ⚠️ Sentry + CloudWatch básico                               | ✅ GuardDuty + WAF + runtime scan           |
| Fail Fast                         | ❌ Sin pre-commit hooks activos       | ✅ Husky + lint-staged + ESLint                             | ✅ Hooks completos + test impact analysis   |
| Test Pyramid                      | ⚠️ Tests mezclados sin ratio          | ✅ Ratio 70/20/10 vigilado                                  | ✅ Ratio automatizado con tooling           |
| Shift Left Performance            | ❌ Sin performance testing            | ⚠️ Lighthouse CI básico                                     | ✅ Lighthouse + k6 + bundle budgets         |
| Contract Testing (CDC)            | ❌ Sin contract tests                 | ⚠️ MSW handlers documentados                                | ✅ Pact CDC automatizado                    |
| IaC + Shift Left Infra            | ❌ Infra manual                       | ❌ Pendiente (postergado)                                   | ✅ OpenTofu + tfsec en CI                   |
| Feature Flags                     | ❌ Sin feature flags                  | ⚠️ Evaluación de plataforma                                 | ✅ Feature flags en producción              |
| Traceability                      | ❌ Sin trazabilidad                   | ✅ Git tags + SBOM + Sentry releases                        | ✅ Trazabilidad SLSA completa               |
| Immutable Infrastructure          | ❌ Sin contenedores                   | ✅ ECS Fargate imágenes inmutables                          | ✅ Imágenes firmadas + canary               |
| Observability-Driven Dev          | ❌ Sin observabilidad estructurada    | ✅ Pino + Sentry + CloudWatch                               | ✅ Dashboards + KPIs + alertas              |
| Chaos Engineering                 | ❌ No aplicado                        | ❌ No planificado                                           | ⚠️ Experimentos básicos AWS FIS             |
| Quality Gates                     | ❌ Sin gates definidos                | ✅ 7 gates secuenciales                                     | ✅ Gates + policy as code                   |
| Shift Left Documentation          | ❌ Documentación manual               | ⚠️ Generación automática básica                             | ✅ Doc-as-code en CI                        |
| Policy as Code (OPA)              | ❌ Sin políticas                      | ❌ No planificado                                           | ⚠️ OPA para tagging AWS                     |
| GitOps                            | ❌ Sin GitOps                         | ❌ No planificado                                           | ⚠️ ArgoCD pilot                             |
| Inner Loop / Outer Loop           | ❌ Sin separación                     | ✅ Pre-commit/pre-push vs CI definido                       | ✅ Caché inteligente inner/outer            |
| Blast Radius Reduction            | ⚠️ Monolito con separación lógica     | ⚠️ Feature flags básicos                                    | ✅ Canary + circuit breakers                |
| Blue/Green Deployment             | ❌ Sin deploys                        | ✅ ECS multi-target group                                   | ✅ Zero-downtime automatizado               |
| Canary Deployment                 | ❌ Sin canary                         | ✅ CodeDeploy canary 10%                                    | ✅ Canary automático con rollback           |
| Dark Launching                    | ❌ Sin dark launches                  | ❌ Pendiente feature flags                                  | ⚠️ Dark launches con Unleash                |
| Trunk-Based Development           | ✅ TBD con PRs opcionales             | ✅ TBD + PRs pequeños commits directos                      | ✅ Branch age limit + merge queue           |
| Continuous Testing                | ❌ Solo bajo demanda                  | ⚠️ Tests en cada push + PR                                  | ✅ Regression diaria + smoke 5min           |
| Self-Healing Pipelines            | ❌ Sin auto-healing                   | ✅ Zombie workflow guard + Concurrency + cancel-in-progress | ✅ Flaky test quarantine automático         |
| Compliance as Code                | ❌ Sin compliance automatizado        | ⚠️ SBOM + license checks                                    | ✅ Auditoría automatizada SOC2              |
| Semantic Versioning + Changelog   | ⚠️ Changesets configurado             | ✅ Changesets operativo                                     | ✅ Auto-changelog + publish npm             |
| Artifact Integrity / Supply Chain | ❌ Sin firmas                         | ✅ SBOM por release                                         | ✅ Cosign + SLSA level 2                    |
| Cost-Aware Deployments (FinOps)   | ❌ Sin cost gates                     | ❌ Budget alert manual                                      | ✅ Cost estimation + stop/start             |

---

### 16.6 Diagrama conceptual: Shift Left vs Shift Right

```mermaid
flowchart LR
    subgraph LEFT["⬅️ SHIFT LEFT (temprano / prevención)"]
        direction TB
        PreCommit["Pre-commit\n<2s"] --> PrePush["Pre-push\n<30s"] --> PR_CI["CI-PR\n<10min"]
    end

    subgraph RIGHT["➡️ SHIFT RIGHT (producción / observación)"]
        direction TB
        Staging["CD Staging\nSmoke tests"] --> Prod["CD Producción\nCanary + Blue/Green"]
        Prod --> PostDeploy["Post-deploy\nMonitoring + RUM"]
        PostDeploy --> Scheduled["Scheduled / Cron\nFull scan + Chaos"]
    end

    Dev["💻 Developer IDE\nESLint, Prettier"] --> PreCommit
    PreCommit -.-> |"lint, SAST (Semgrep),\nsecrets (Gitleaks)"| FastFeedback["⚡ Feedback rápido\n<2 segundos"]
    PrePush -.-> |"lint, build"| MediumFeedback["⚡ Feedback medio\n<30 segundos"]
    PR_CI -.-> |"QA completa: cobertura,\nE2E (Playwright),\nSAST (CodeQL), SCA, build"| CIFeedback["⚡ Feedback CI\n<10 minutos"]
    Prod -.-> |"Métricas reales:\nSentry, CloudWatch,\nWeb Vitals"| ProdFeedback["👁️ Feedback producción\ncontinuo"]
    Scheduled -.-> |"Escaneo completo:\nTrivy, SBOM, Chaos"| Compliance["✅ Compliance & Auditoría\nsemanal"]

    style Dev fill:#e1f5fe,stroke:#0288d1
    style FastFeedback fill:#c8e6c9,stroke:#388e3c
    style MediumFeedback fill:#c8e6c9,stroke:#388e3c
    style CIFeedback fill:#c8e6c9,stroke:#388e3c
    style ProdFeedback fill:#fff9c4,stroke:#fbc02d
    style Compliance fill:#f3e5f5,stroke:#7b1fa2
    style LEFT fill:#e8f5e9,stroke:#2e7d32,stroke-dasharray: 5 5
    style RIGHT fill:#fff3e0,stroke:#e65100,stroke-dasharray: 5 5
```

---

### Notas sobre la implementación

- **Prioridad**: los sprints en §16.4 se alinean con el roadmap del Apéndice B. Las técnicas Must-have de Sprint 1 deben implementarse antes de las de Sprint 4.
- **Dependencias**: IaC (OpenTofu) está postergado por decisión del proyecto (ver Apéndice A). Las técnicas que dependen de IaC (Policy as Code, GitOps, FinOps) heredan esa postergación.
- **Monitoreo continuo**: las técnicas de Shift Right (§16.2) dependen de tener el despliegue en AWS funcional (Sprint 3-4). No intentar antes.
- **Costo cero**: salvo Sentry (gratuito hasta 5k eventos/mes), CloudWatch (incluido en AWS Free Tier) y feature flags (gratuitos en tier básico), todas las herramientas listadas son open-source.

---

## Apéndice A — Resumen de decisiones del proyecto

| Decisión                 | Opción                           | Rationale                                                                        |
| ------------------------ | -------------------------------- | -------------------------------------------------------------------------------- |
| Cloud provider server+DB | AWS (prod) + Floci (dev/CI)      | Máxima escalabilidad enterprise; Floci emula 68 servicios AWS sin costo          |
| Frontend hosting         | Vercel                           | Gratuito, preview URLs por PR, CDN global                                        |
| Dependencia management   | Dependabot                       | Nativo GitHub, zero-config, auto-merge patches                                   |
| Preview environments     | Sprint 2                         | Ephemeral Floci containers + Vercel preview                                      |
| Branching strategy       | Trunk-Based Development (TBD)    | Ramas < 1 día, commits directos en triviales, feature flags para cambios grandes |
| Release strategy         | Changesets + Blue/Green          | Versionado semántico + deploys sin downtime                                      |
| Rollback                 | Automático (ECS circuit breaker) | Nativo de AWS, no requiere código extra                                          |
| Emulador AWS             | Floci (MIT)                      | Sustituye LocalStack, más rápido, más servicios, sin auth token                  |
| IaC                      | Terraform/OpenTofu (postergado)  | Infra manual inicial; IaC cuando el setup AWS se estabilice                      |
| SAST                     | CodeQL + Semgrep                 | Cobertura redundante, uno nativo GitHub, otro multi-rule                         |

---

## Apéndice B — Diagrama de sprints (roadmap visual)

```mermaid
gantt
    title CI/CD Implementation Roadmap
    dateFormat  YYYY-MM-DD
    axisFormat  %b %d

    section Sprint 1 (2 weeks)
    ESLint gate en CI           :s1a, 2026-07-21, 2d
    Tests + Build en CI        :s1b, after s1a, 5d
    coverage.thresholds        :s1c, after s1b, 2d
    pre-push hook              :s1d, after s1c, 1d
    Dependabot                 :s1e, 2026-07-21, 1d
    Caching CI                 :s1f, after s1b, 2d
    .dockerignore              :s1g, 2026-07-21, 1d

    section Sprint 2 (2 weeks)
    E2E en CI                  :s2a, 2026-08-04, 3d
    Preview envs (Floci+Vercel):s2b, after s2a, 3d
    Migrar a Floci             :s2c, after s2b, 1d
    Eliminar zombies           :s2d, after s2c, 1d
    Node version unify         :s2e, after s2d, 1d
    GitHub secret scanning     :s2f, after s2e, 1d

    section Sprint 3 (2 weeks)
    AWS setup (IAM, ECR, ECS)  :s3a, 2026-08-18, 5d
    Docker build + ECR push    :s3b, after s3a, 2d
    Deploy staging (ECS)       :s3c, after s3b, 3d
    Smoke tests post-deploy    :s3d, after s3c, 2d
    GitHub Environments        :s3e, after s3d, 1d

    section Sprint 4 (2 weeks)
    Deploy prod + approval     :s4a, 2026-09-01, 3d
    Blue/Green + rollback      :s4b, after s4a, 2d
    SBOM generation            :s4c, after s4b, 1d
    Dependency review          :s4d, after s4c, 1d
    Cron security scan         :s4e, after s4d, 1d
    Sentry integration         :s4f, after s4e, 1d
```

---

## 17. Citas y Referencias

Esta sección lista todas las fuentes consultadas durante la investigación para este plan, con enlaces directos y la sección del documento donde se aplica cada una.

### Estándares de la industria

| Fuente                                                                                                     | Enlace                                                                     | Secciones donde se cita                            |
| ---------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- | -------------------------------------------------- |
| **DORA (DevOps Research & Assessment)** — Accelerate State of DevOps Report 2023-2025, 4 Key Metrics       | https://dora.dev/                                                          | §12 KPIs y DORA metrics, §2 Glosario               |
| **SLSA (Supply-chain Levels for Software Artifacts)** — Niveles 1-3 para seguridad de cadena de suministro | https://slsa.dev/                                                          | §2 Glosario, §13 Riesgos, §16 Técnicas             |
| **OWASP CI/CD Security Risks Top 10** — Mapeo de riesgos específicos de pipelines CI/CD                    | https://owasp.org/www-project-top-10-ci-cd-security-risks/                 | §13 Riesgos y anti-patterns, §5 Security Stage     |
| **OWASP Top 10 Web Application Security Risks** — Vulnerabilidades web más críticas                        | https://owasp.org/www-project-top-ten/                                     | §5 Security Stage (Semgrep rules)                  |
| **CALMS (Culture, Automation, Lean, Measurement, Sharing)** — Framework de adopción de DevOps              | https://itrevolution.com/calms/                                            | §12 KPIs, §1 Resumen ejecutivo                     |
| **SPACE framework** — Satisfacción, Performance, Activity, Communication, Efficiency                       | https://queue.acm.org/detail.cfm?id=3454124                                | §12 KPIs, §13 Riesgos                              |
| **Continuous Delivery** (Humble & Farley) — Libro fundamental de CD                                        | https://continuousdelivery.com/                                            | §15 Recursos adicionales, §7 Estrategia de release |
| **GitHub Actions best practices** — Documentación oficial de GitHub                                        | https://docs.github.com/en/actions/using-workflows/workflow-best-practices | §5 Stages, §10 Sprints                             |
| **Prisma migration safety** — Guía oficial de Prisma para migraciones seguras                              | https://www.prisma.io/docs/orm/prisma-migrate/getting-started              | §8 Estrategia de rollback                          |

### Herramientas y tecnologías

| Fuente                                                                        | Enlace                                              | Secciones donde se cita                          |
| ----------------------------------------------------------------------------- | --------------------------------------------------- | ------------------------------------------------ |
| **Floci** v1.5.11 — Emulador AWS, MIT, 68 servicios, port 4566                | https://floci.io/                                   | §9 Cloud provider, §2 Glosario, §5 Preview stage |
| **Floci GitHub** — Repositorio oficial, 16.9k stars, MIT license              | https://github.com/floci-io/floci                   | §9 Comparativa LocalStack                        |
| **Floci Documentación** — Docker images, storage modes, Testcontainers        | https://floci.io/floci/configuration/docker-images/ | §9 Migración, §5 Test Stage                      |
| **Floci Testcontainers Node.js** — Paquete oficial @floci/testcontainers      | https://floci.io/floci/testcontainers/nodejs/       | §5 Integración con Vitest                        |
| **Floci Comparativa AWS** — 1,925/1,925 SDK tests                             | https://floci.io/aws/compare/                       | §9 Tabla comparativa vs LocalStack               |
| **GitHub Actions** — Documentación oficial                                    | https://docs.github.com/en/actions                  | §5 YAML workflows                                |
| **GitHub Dependency Review** v4 — Bloqueo de PRs con dependencias vulnerables | https://github.com/actions/dependency-review-action | §5 Security Stage, §10 Sprint 4                  |
| **Trivy** v0.56+ — Escáner de vulnerabilidades (SCA)                          | https://github.com/aquasecurity/trivy-action        | §5 Security Stage, §8 Scheduled cron             |
| **Anchore SBOM** v0 — Generación de SBOM CycloneDX y SPDX                     | https://github.com/anchore/sbom-action              | §5 SBOM stage, §10 Sprint 4                      |
| **CodeQL** v4 — SAST nativo de GitHub                                         | https://github.com/github/codeql-action             | §5 SAST stage                                    |
| **Semgrep** — Reglas p/owasp-top-ten, p/javascript, p/express, p/react        | https://semgrep.dev/                                | §5 SAST stage, §13 Anti-patterns                 |
| **Playwright** — Browser testing E2E                                          | https://playwright.dev/                             | §5 E2E stage, §16 Técnicas                       |
| **Vitest** — Coverage thresholds, caching                                     | https://vitest.dev/                                 | §5 Test stage, §10 Coverage                      |
| **ECS Fargate** — AWS deployment circuit breaker                              | https://aws.amazon.com/ecs/                         | §8 Rollback, §9 Cloud provider                   |
| **Changesets** — Versionado semántico npm                                     | https://github.com/changesets/changesets            | §7 Estrategia de release                         |

### Técnicas y metodologías CI/CD

| Fuente                                                                            | Enlace                                                                                        | Secciones donde se cita                      |
| --------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- | -------------------------------------------- |
| **Shift Left Testing** — Pruebas tempranas en el ciclo de desarrollo              | https://www.atlassian.com/devops/devops-tutorials/shift-left-testing                          | §16.1 Técnicas Shift Left                    |
| **DevSecOps: Shift Left Security** — Integración de seguridad en CI/CD            | https://www.synopsys.com/software-integrity/glossary/devsecops.html                           | §16.1 Shift Left Security, §13 Anti-patterns |
| **Shift Right Testing** — Validación en producción                                | https://www.guru99.com/shift-right-testing.html                                               | §16.2 Técnicas Shift Right                   |
| **Test Pyramid** (Martin Fowler) — Estrategia de automatización de pruebas        | https://martinfowler.com/bliki/TestPyramid.html                                               | §16.4 Test Pyramid, §8 Testing-architecture  |
| **Contract Testing (CDC)** — Consumer-Driven Contracts (Martin Fowler)            | https://martinfowler.com/bliki/ConsumerDrivenContract.html                                    | §16.4 Contract Testing                       |
| **Feature Flags** (Martin Fowler) — Toggles para liberación controlada            | https://martinfowler.com/articles/feature-flags.html                                          | §16.4 Feature Flags                          |
| **Blue/Green Deployment** — Patrón de despliegue sin downtime                     | https://martinfowler.com/bliki/BlueGreenDeployment.html                                       | §7 Estrategia de release, §8 Rollback        |
| **Canary Release** — Despliegue gradual con monitoreo                             | https://martinfowler.com/bliki/CanaryRelease.html                                             | §7 Release, §8 Rollback                      |
| **Trunk-Based Development** — Ramas cortas y merges frecuentes                    | https://trunkbaseddevelopment.com/                                                            | §7 Branching                                 |
| **Immutable Infrastructure** — Servidores que nunca se modifican                  | https://www.hashicorp.com/resources/what-is-mutable-vs-immutable-infrastructure               | §16.4 Inmutable Infrastructure               |
| **GitOps** — Git como fuente única de verdad para infra                           | https://www.gitops.tech/                                                                      | §16.4 GitOps                                 |
| **Chaos Engineering** (Principles of Chaos) — Pruebas de resiliencia              | https://principlesofchaos.org/                                                                | §16.4 Chaos Engineering                      |
| **FinOps** — Gestión de costos en cloud                                           | https://www.finops.org/                                                                       | §16.4 Cost-Aware Deployments                 |
| **DORA Metrics: The Four Keys** — Investigación académica original (Google Cloud) | https://cloud.google.com/blog/products/devops-sre/dora-2024-accelerate-state-of-devops-report | §12 KPIs                                     |
| **SRE (Site Reliability Engineering)** — Google SRE Book                          | https://sre.google/sre-book/table-of-contents/                                                | §8 Rollback, §13 Riesgos                     |

### Investigación de estado actual

| Fuente                                                                          | Enlace                                 | Secciones donde se cita             |
| ------------------------------------------------------------------------------- | -------------------------------------- | ----------------------------------- |
| **Estado actual de CI/CD de Project One** — Documento preexistente del proyecto | `docs/cicd-estado-actual.md` (local)   | §3 Gap matrix, §1 Resumen ejecutivo |
| **Testing Architecture** — Pirámide de pruebas del proyecto                     | `docs/testing-architecture.md` (local) | §5 Test Stage                       |
| **Project One AGENTS.md** — Contexto del monorepo                               | `AGENTS.md` (local)                    | Contexto general del plan           |
| **Context Glossary** — Términos del proyecto                                    | `CONTEXT.md` (local)                   | §2 Glosario                         |

---

## 18. Catálogo Completo de Stages CI/CD Enterprise

### 18.1 Introducción

Este catálogo documenta **todos los stages que existen en pipelines CI/CD enterprise** en la industria, organizados por categoría. No todos aplican a Project One, pero sirven como referencia de madurez y roadmap a largo plazo.

> **Para no técnicos**: Esta sección es como un "menú completo" de todos los ingredientes que puede tener una cocina CI/CD profesional. Project One ya tiene algunos (Sections 5 y 16), y este catálogo muestra qué más se puede agregar a futuro.

**Cómo leer este catálogo:**

- ✅ **Implementado o planificado** en Project One (Sections 5, 10, 16)
- ⚠️ **Disponible** para implementar en futuros sprints
- 🔲 **No aplica** por escala o stack actual

Cada stage incluye: nombre, descripción técnica y para no técnicos, cuándo se ejecuta, y herramientas típicas de la industria.

---

### 18.2 Catálogo Completo por Categoría

#### A. Source Control & Code Quality (12 stages)

| #   | Stage                         | Descripción técnica / No técnica                                                                                                            | Cuándo corre      | Herramientas típicas                                |
| --- | ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- | ----------------- | --------------------------------------------------- |
| A1  | **Pre-commit hooks**          | Scripts que validan código antes del commit. _Para no técnicos: revisión automática antes de guardar un cambio._                            | Pre-commit        | Husky, lint-staged, Lefthook                        |
| A2  | **Pre-push validation**       | Tests y build antes de subir al remoto. _Para no técnicos: asegura que el código funciona antes de compartirlo._                            | Pre-push          | Husky, custom scripts                               |
| A3  | **Commit message validation** | Valida formato del mensaje (Conventional Commits). _Para no técnicos: asegura mensajes descriptivos y estandarizados._                      | Pre-commit        | commitlint, semantic-release                        |
| A4  | **Code review automation**    | Asigna revisores automáticos según áreas del código. _Para no técnicos: el sistema asigna los revisores adecuados sin intervención manual._ | PR                | CODEOWNERS, auto-assign, PullApprove                |
| A5  | **Branch protection rules**   | Reglas que protegen ramas principales. _Para no técnicos: evita que alguien dañe la rama principal sin autorización._                       | CI-PR             | GitHub Branch Protection, GitLab Protected Branches |
| A6  | **Merge Queue**               | Cola de merges que valida cambios en grupo. _Para no técnicos: organiza varios cambios para que no se pisen entre sí._                      | CI-PR             | GitHub Merge Queue, GitLab Merge Trains, Mergify    |
| A7  | **Change detection**          | Detecta qué partes del monorepo cambiaron. _Para no técnicos: solo ejecuta las pruebas necesarias, ahorrando tiempo._                       | CI-PR             | dorny/paths-filter, Turborepo, Nx, Bazel            |
| A8  | **Code style enforcement**    | Aplica formato y estilo consistente. _Para no técnicos: todo el código se ve como si lo hubiera escrito una sola persona._                  | Pre-commit, CI-PR | ESLint, Prettier, EditorConfig, SonarQube           |
| A9  | **Type checking**             | Verifica tipos de datos estáticamente. _Para no técnicos: detecta errores de lógica como pasar texto donde se espera número._               | Pre-push, CI-PR   | TypeScript (tsc), Flow, Pyright                     |
| A10 | **Complexity analysis**       | Mide complejidad del código (cíclica, cognitiva). _Para no técnicos: identifica código demasiado enredado que será difícil de mantener._    | CI-PR             | SonarQube, ESLint complexity, Plato                 |
| A11 | **Dead code detection**       | Encuentra código no utilizado. _Para no técnicos: identifica funciones, variables o archivos que ya no se usan._                            | CI-PR, Scheduled  | ts-prune, knip, depcheck, Moderne                   |
| A12 | **Duplication detection**     | Detecta código duplicado. _Para no técnicos: encuentra fragmentos copiados que deberían compartirse._                                       | CI-PR             | jscpd, SonarQube, PMD CPD                           |

#### B. Build & Compilation (12 stages)

| #   | Stage                              | Descripción técnica / No técnica                                                                                                | Cuándo corre | Herramientas típicas                                           |
| --- | ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- | ------------ | -------------------------------------------------------------- |
| B1  | **Dependency installation**        | Instala dependencias del proyecto. _Para no técnicos: descarga las librerías externas que necesita el proyecto._                | CI-PR, CD    | npm ci, pnpm install, go mod download, pip install             |
| B2  | **Compilation / Build**            | Compila código fuente a producción. _Para no técnicos: transforma el código legible por humanos en código ejecutable._          | CI-PR, CD    | tsc, webpack, vite build, esbuild, go build                    |
| B3  | **Multi-arch build**               | Compila para múltiples arquitecturas (AMD64, ARM64). _Para no técnicos: prepara versiones para diferentes tipos de servidores._ | CD           | Docker buildx, QEMU, Bazel                                     |
| B4  | **Container image build**          | Construye imagen Docker. _Para no técnicos: empaqueta la aplicación lista para ejecutar._                                       | CD           | Docker, BuildKit, Kaniko, Podman, ko                           |
| B5  | **Image optimization**             | Optimiza tamaño de imagen (multistage, slim, distroless). _Para no técnicos: hace que el paquete sea más pequeño y seguro._     | CD           | Docker multistage, distroless, DockerSlim, UPX                 |
| B6  | **Binary signing / notarization**  | Firma digital de artefactos. _Para no técnicos: garantiza que el código no ha sido alterado._                                   | CD           | cosign, GPG, codesign, Sigstore                                |
| B7  | **SBOM generation during build**   | Genera inventario de componentes durante el build. _Para no técnicos: lista todos los ingredientes del software._               | CD           | Syft, CycloneDX, SPDX, Anchore                                 |
| B8  | **Build attestation / provenance** | Prueba criptográfica de cómo se construyó. _Para no técnicos: sello que certifica el origen del código._                        | CD           | SLSA, in-toto, cosign attest, Sigstore                         |
| B9  | **Build caching**                  | Cachea resultados de build para acelerar. _Para no técnicos: evita reconstruir lo que no cambió._                               | CI-PR, CD    | Turborepo, Nx, Bazel, Docker layer cache, remote cache         |
| B10 | **Artifact publishing**            | Publica artefactos a repositorios. _Para no técnicos: sube el paquete a la tienda de componentes._                              | CD           | npm publish, docker push, mvn deploy, twine                    |
| B11 | **Semantic versioning automation** | Versión automática basada en cambios. _Para no técnicos: el sistema decide si es cambio mayor, menor o parche._                 | Post-merge   | Changesets, semantic-release, release-please, standard-version |
| B12 | **Artifact retention / cleanup**   | Limpia artefactos viejos. _Para no técnicos: elimina versiones antiguas para ahorrar espacio._                                  | Scheduled    | ECR lifecycle, GitHub Packages retention, custom scripts       |

#### C. Testing (22 stages)

| #   | Stage                               | Descripción técnica / No técnica                                                                                            | Cuándo corre        | Herramientas típicas                                          |
| --- | ----------------------------------- | --------------------------------------------------------------------------------------------------------------------------- | ------------------- | ------------------------------------------------------------- |
| C1  | **Unit tests**                      | Pruebas de funciones individuales. _Para no técnicos: verifica que cada pieza funcione sola._                               | Pre-push, CI-PR     | Vitest, Jest, Mocha, JUnit, pytest                            |
| C2  | **Integration tests**               | Pruebas de módulos combinados. _Para no técnicos: verifica que las piezas funcionen juntas._                                | CI-PR               | Vitest, supertest, Testcontainers, Spring Boot Test           |
| C3  | **Component tests**                 | Pruebas de componentes UI aislados. _Para no técnicos: verifica que cada elemento visual funcione correctamente._           | CI-PR               | Testing Library, Storybook test, Cypress Component            |
| C4  | **Contract tests (CDC)**            | Pruebas de contratos entre servicios. _Para no técnicos: asegura que cliente y servidor se comuniquen correctamente._       | CI-PR               | Pact, Spring Cloud Contract, MSW + OpenAPI                    |
| C5  | **E2E tests**                       | Pruebas de punta a punta simulando usuario. _Para no técnicos: un robot usa la app como un usuario real._                   | CI-PR, Scheduled    | Playwright, Cypress, Selenium, WebDriverIO                    |
| C6  | **Visual regression tests**         | Compara capturas de pantalla visuales. _Para no técnicos: detecta cambios visuales no intencionales._                       | CI-PR               | Chromatic, Percy, Applitools, Happo                           |
| C7  | **Accessibility tests**             | Verifica accesibilidad (WCAG). _Para no técnicos: asegura que personas con discapacidad puedan usar la app._                | CI-PR               | axe-core, Lighthouse a11y, WAVE, Pa11y                        |
| C8  | **Performance tests**               | Mide rendimiento de endpoints. _Para no técnicos: verifica que la app responda rápido._                                     | CI-PR, Scheduled    | k6, Artillery, Locust, Gatling, autocannon                    |
| C9  | **Load tests**                      | Prueba bajo carga esperada. _Para no técnicos: verifica cuántos usuarios puede soportar simultáneamente._                   | Scheduled           | k6, JMeter, vegeta, hey                                       |
| C10 | **Stress tests**                    | Prueba hasta punto de ruptura. _Para no técnicos: encuentra el límite máximo de usuarios que soporta._                      | Scheduled           | k6, JMeter, Locust, Gatling                                   |
| C11 | **Soak tests**                      | Prueba de larga duración. _Para no técnicos: detecta problemas que aparecen después de horas de uso._                       | Scheduled           | k6, JMeter, Locust                                            |
| C12 | **Smoke tests**                     | Verificación rápida post-deploy. _Para no técnicos: confirma que la app arrancó correctamente._                             | CD-Staging, CD-Prod | Playwright, curl, health checks                               |
| C13 | **Sanity tests**                    | Subset rápido de smoke para decidir rollback. _Para no técnicos: checks ultra-rápidos para decidir si deshacer._            | CD-Prod             | curl, custom scripts, Playwright                              |
| C14 | **Mutation tests**                  | Mide calidad de tests insertando errores. _Para no técnicos: verifica que las pruebas detecten errores reales._             | Scheduled           | Stryker, Pitest, Mutmut                                       |
| C15 | **Fuzz tests**                      | Prueba con datos aleatorios o malformados. _Para no técnicos: lanza datos inesperados para ver si la app resiste._          | Scheduled           | libFuzzer, AFL, Jazzer, RESTler                               |
| C16 | **Security tests (DAST/IAST)**      | Pruebas de seguridad dinámicas. _Para no técnicos: intenta hackear la app automáticamente._                                 | CI-PR, Scheduled    | OWASP ZAP, Burp Suite, Acunetix, Contrast                     |
| C17 | **API contract validation**         | Valida APIs contra especificación OpenAPI. _Para no técnicos: verifica que la API cumpla lo prometido._                     | CI-PR               | Dredd, Schemathesis, Postman/Newman, OpenAPI Enforcer         |
| C18 | **Database migration tests**        | Prueba migraciones de BD antes de aplicar. _Para no técnicos: verifica que los cambios en BD no rompan nada._               | CI-PR, CD           | Prisma migrate test, Flyway testcontainers, Liquibase         |
| C19 | **Coverage enforcement**            | Umbrales mínimos de cobertura. _Para no técnicos: asegura que el código esté suficientemente probado._                      | CI-PR               | Vitest thresholds, Istanbul, JaCoCo, Cobertura                |
| C20 | **Flaky test detection**            | Detecta y aísla pruebas inestables. _Para no técnicos: identifica pruebas que a veces fallan sin razón._                    | CI-PR, Scheduled    | Vitest retry, Jest --retry, quarantine, flaky-test-tracker    |
| C21 | **Test parallelization / sharding** | Divide tests en grupos paralelos. _Para no técnicos: ejecuta varias pruebas al mismo tiempo para acelerar._                 | CI-PR               | Vitest sharding, Jest --shard, Playwright sharding, pytest -x |
| C22 | **Test Impact Analysis (TIA)**      | Solo ejecuta tests afectados por cambios. _Para no técnicos: inteligentemente elige qué pruebas ejecutar según qué cambió._ | CI-PR               | Nx affected, Turborepo, Jest-preview, custom TIA              |

#### D. Security (15 stages)

| #   | Stage                              | Descripción técnica / No técnica                                                                                                   | Cuándo corre                 | Herramientas típicas                                      |
| --- | ---------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- | ---------------------------- | --------------------------------------------------------- |
| D1  | **SAST — Static Analysis**         | Analiza código fuente buscando vulnerabilidades. _Para no técnicos: escanea el código en busca de fallos de seguridad._            | Pre-commit, CI-PR            | CodeQL, Semgrep, SonarQube, Checkmarx, Fortify            |
| D2  | **SCA — Dependency scan**          | Analiza dependencias por vulnerabilidades conocidas. _Para no técnicos: revisa si las librerías externas tienen fallos conocidos._ | CI-PR, Scheduled             | Trivy, Dependabot, Renovate, Snyk, Black Duck             |
| D3  | **Secret scanning**                | Busca credenciales filtradas en el código. _Para no técnicos: busca passwords o tokens escritos accidentalmente._                  | Pre-commit, CI-PR, Scheduled | Gitleaks, TruffleHog, GitHub secret scanning, GitGuardian |
| D4  | **DAST — Dynamic Testing**         | Prueba seguridad desde afuera (app corriendo). _Para no técnicos: intenta atacar la app como lo haría un hacker._                  | Scheduled                    | OWASP ZAP, Burp Suite, Acunetix, AppScan                  |
| D5  | **IAST — Interactive Testing**     | Analiza seguridad desde dentro mientras corre. _Para no técnicos: monitorea la seguridad desde adentro de la app._                 | Scheduled                    | Contrast, Seeker, Hdiv                                    |
| D6  | **RASP — Runtime Protection**      | Se protege a sí misma en runtime. _Para no técnicos: la app se defiende sola de ataques en tiempo real._                           | Runtime                      | Contrast RASP, Signal Sciences, Sqreen                    |
| D7  | **Container image scanning**       | Escanea imágenes Docker por vulnerabilidades. _Para no técnicos: revisa si el empaquetado tiene virus o fallos._                   | CD, Scheduled                | Trivy, Clair, Grype, Docker Scout, Snyk                   |
| D8  | **Kubernetes security scanning**   | Escanea config K8s por riesgos. _Para no técnicos: revisa si la configuración del orquestador es segura._                          | CI-PR, Scheduled             | kube-bench, kube-hunter, Popeye, Checkov                  |
| D9  | **IaC scanning**                   | Escanea infraestructura como código. _Para no técnicos: revisa si la configuración de servidores es segura._                       | CI-PR                        | tfsec, Checkov, Terrascan, Kics, Bridgecrew               |
| D10 | **License compliance**             | Verifica licencias de dependencias. _Para no técnicos: asegura que las librerías usadas tengan licencias compatibles._             | CI-PR                        | FOSSA, WhiteSource, License Finder, Dependency Review     |
| D11 | **SBOM generation + verification** | Genera y verifica inventario de componentes. _Para no técnicos: crea y chequea la lista completa de ingredientes._                 | CD, Scheduled                | Syft, CycloneDX, Anchore, Dependency Track                |
| D12 | **Supply chain attestation**       | Prueba de integridad de la cadena de suministro. _Para no técnicos: certifica que el software no fue manipulado en tránsito._      | CD                           | SLSA, in-toto, cosign, Sigstore                           |
| D13 | **Vulnerability management**       | Gestión de vulnerabilidades reportadas. _Para no técnicos: sistema que rastrea y prioriza la corrección de fallos._                | Continuous                   | Dependabot alerts, GitHub Advisory, NVD, DefectDojo       |
| D14 | **Policy as Code**                 | Políticas de seguridad como código ejecutable. _Para no técnicos: reglas automáticas que revisan el cumplimiento de seguridad._    | CI-PR, CD                    | OPA, Conftest, Kyverno, Sentinel                          |
| D15 | **Security orchestration**         | Orquestación de herramientas de seguridad. _Para no técnicos: centraliza todos los resultados de seguridad en un solo lugar._      | CI-PR, Scheduled             | DefectDojo, Dependency-Track, Arnica, Nucleus             |

#### E. Infrastructure & IaC (9 stages)

| #   | Stage                              | Descripción técnica / No técnica                                                                                          | Cuándo corre | Herramientas típicas                                |
| --- | ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------- | ------------ | --------------------------------------------------- |
| E1  | **Infrastructure provisioning**    | Aprovisiona infraestructura en cloud. _Para no técnicos: crea servidores, redes y bases de datos automáticamente._        | CI-PR, CD    | Terraform, OpenTofu, Pulumi, CloudFormation, CDK    |
| E2  | **Infrastructure validation**      | Valida cambios de infra antes de aplicar. _Para no técnicos: simula los cambios para verificar que no rompan nada._       | CI-PR        | terraform plan, checkov, sentinel, conftest         |
| E3  | **Configuration management**       | Gestiona configuración de servidores. _Para no técnicos: asegura que todos los servidores tengan la misma configuración._ | CD           | Ansible, Chef, Puppet, Salt                         |
| E4  | **Container orchestration deploy** | Despliega a Kubernetes o ECS. _Para no técnicos: orquesta los contenedores en el clúster._                                | CD           | Helm, Kustomize, kubectl, ECS CLI                   |
| E5  | **Service mesh configuration**     | Configura la malla de servicios. _Para no técnicos: gestiona el tráfico y la seguridad entre servicios._                  | CD           | Istio, Linkerd, Consul, Ambassador                  |
| E6  | **DNS / SSL configuration**        | Configura dominios y certificados SSL. _Para no técnicos: gestiona los nombres de dominio y la seguridad HTTPS._          | CD           | Route53, Cloudflare, cert-manager, Let's Encrypt    |
| E7  | **Secret provisioning**            | Distribuye secretos de forma segura. _Para no técnicos: entrega contraseñas y tokens sin exponerlos._                     | CD           | HashiCorp Vault, AWS Secrets Manager, Doppler, SOPS |
| E8  | **Database provisioning**          | Crea y migra bases de datos. _Para no técnicos: gestiona la creación y actualización de bases de datos._                  | CD           | Prisma, Flyway, Liquibase, Alembic                  |
| E9  | **Network policy validation**      | Valida políticas de red. _Para no técnicos: verifica que la comunicación entre servicios sea segura._                     | CI-PR        | Cilium, Calico, OPA Gatekeeper, Kyverno             |

#### F. CD & Deployment (13 stages)

| #   | Stage                                | Descripción técnica / No técnica                                                                                                       | Cuándo corre           | Herramientas típicas                                   |
| --- | ------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------- | ---------------------- | ------------------------------------------------------ |
| F1  | **Blue/Green deployment**            | Dos entornos idénticos, switch atómico. _Para no técnicos: dos versiones idénticas, se cambia el tráfico instantáneamente._            | CD-Prod                | ECS multi-target, Kubernetes service mesh, ALB         |
| F2  | **Canary deployment**                | Tráfico gradual a nueva versión. _Para no técnicos: envía 10% de usuarios a la nueva versión para probar._                             | CD-Prod                | ECS CodeDeploy, Argo Rollouts, Flagger                 |
| F3  | **Rolling deployment**               | Reemplazo gradual de instancias. _Para no técnicos: actualiza servidores de uno en uno sin detener el servicio._                       | CD-Prod                | ECS rolling, Kubernetes rolling, ASG                   |
| F4  | **A/B testing deployment**           | Dos versiones con medición de conversión. _Para no técnicos: prueba dos versiones para ver cuál funciona mejor._                       | CD-Prod                | Feature flags + analytics, Google Optimize, Statsig    |
| F5  | **Feature flag validation**          | Valida toggles de features antes de activar. _Para no técnicos: verifica que las funciones ocultas funcionen antes de mostrarlas._     | CD                     | LaunchDarkly, Unleash, Flagsmith, Split                |
| F6  | **Environment promotion**            | Promueve entre entornos con gates. _Para no técnicos: el código avanza por etapas con controles de calidad en cada una._               | CD                     | GitHub Environments, GitLab CI environments, custom    |
| F7  | **Preview / ephemeral environments** | Entornos temporales por PR. _Para no técnicos: cada cambio propuesto tiene su propio entorno de prueba temporal._                      | CI-PR                  | Vercel preview, Render preview, Heroku review apps     |
| F8  | **Database migration in deploy**     | Migraciones de BD durante el deploy. _Para no técnicos: actualiza la base de datos justo antes o después de actualizar el código._     | CD                     | Prisma migrate deploy, Flyway, Liquibase               |
| F9  | **Post-deploy smoke tests**          | Verificación rápida tras deploy. _Para no técnicos: confirma que la app funciona después de la actualización._                         | CD                     | Playwright, curl, health check endpoints               |
| F10 | **Synthetic monitoring**             | Monitoreo sintético continuo. _Para no técnicos: robots que usan la app 24/7 para detectar fallos._                                    | Post-deploy, Scheduled | CloudWatch Synthetics, Checkly, Datadog Synthetics     |
| F11 | **Rollback automation**              | Reversión automática ante fallo. _Para no técnicos: si algo sale mal, vuelve automáticamente a la versión anterior._                   | CD                     | ECS circuit breaker, Argo Rollouts, CodeDeploy         |
| F12 | **Traffic mirroring / shadowing**    | Duplica tráfico a nueva versión sin afectar usuarios. _Para no técnicos: envía copia del tráfico real a la nueva versión para probar._ | CD                     | Istio mirror, AWS X-Ray shadow, Envoy                  |
| F13 | **Release orchestration**            | Orquestación completa de releases. _Para no técnicos: coordina todos los pasos de una publicación automáticamente._                    | CD                     | Spinnaker, Harness, Argo Rollouts, CodeDeploy, Octopus |

#### G. Observability, Monitoring & Incident Response (11 stages)

| #   | Stage                          | Descripción técnica / No técnica                                                                                                               | Cuándo corre         | Herramientas típicas                                         |
| --- | ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------- | -------------------- | ------------------------------------------------------------ |
| G1  | **Build/deploy metrics**       | Métricas de pipeline (duración, éxito, frecuencia). _Para no técnicos: mide qué tan rápido y confiable es el proceso._                         | CI-PR, CD            | GitHub Actions analytics, Datadog CI, DORA dashboard         |
| G2  | **Log aggregation**            | Centraliza logs de todos los servicios. _Para no técnicos: junta todos los registros en un solo lugar para buscar problemas._                  | Post-deploy, Runtime | ELK Stack, Loki, CloudWatch Logs, Datadog                    |
| G3  | **Metrics & dashboards**       | Métricas y tableros de monitoreo. _Para no técnicos: tableros visuales que muestran la salud del sistema._                                     | Post-deploy, Runtime | Prometheus + Grafana, Datadog, New Relic                     |
| G4  | **Distributed tracing**        | Traza peticiones a través de servicios. _Para no técnicos: sigue el camino de una petición a través de todos los servicios._                   | Runtime              | OpenTelemetry, Jaeger, Zipkin, X-Ray                         |
| G5  | **Real User Monitoring (RUM)** | Mide experiencia real de usuarios. _Para no técnicos: mide cuánto tardan las páginas en cargar para usuarios reales._                          | Post-deploy, Runtime | Sentry Performance, Web Vitals, Lighthouse CrUX, Datadog RUM |
| G6  | **Error tracking**             | Captura errores en producción. _Para no técnicos: atrapa y reporta errores que ocurren con usuarios reales._                                   | Post-deploy, Runtime | Sentry, Rollbar, Bugsnag, Datadog Error Tracking             |
| G7  | **Alerting**                   | Alertas automáticas de anomalías. _Para no técnicos: notifica al equipo cuando algo anda mal._                                                 | Runtime              | PagerDuty, OpsGenie, Slack, AWS SNS                          |
| G8  | **Incident management**        | Gestión de incidentes automatizada. _Para no técnicos: coordina la respuesta del equipo ante emergencias._                                     | Runtime              | incident.io, FireHydrant, PagerDuty, OpsLevel                |
| G9  | **SLI/SLO monitoring**         | Monitorea indicadores de nivel de servicio. _Para no técnicos: mide si el sistema cumple con los acuerdos de calidad._                         | Runtime              | Google SRE tools, Datadog SLO, Grafana                       |
| G10 | **Post-mortem automation**     | Automatiza análisis post-incidente. _Para no técnicos: documenta automáticamente qué falló y por qué._                                         | Post-incident        | incident.io, FireHydrant, custom                             |
| G11 | **Chaos Engineering**          | Inyecta fallos controlados para probar resiliencia. _Para no técnicos: rompe cosas a propósito para asegurarse de que el sistema se recupere._ | Scheduled            | Gremlin, AWS FIS, LitmusChaos, Chaos Mesh                    |

#### H. Compliance & Governance (7 stages)

| #   | Stage                             | Descripción técnica / No técnica                                                                                                   | Cuándo corre      | Herramientas típicas                                  |
| --- | --------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- | ----------------- | ----------------------------------------------------- |
| H1  | **Audit trail automation**        | Registro inmutable de todos los cambios. _Para no técnicos: guarda un registro a prueba de manipulaciones de todo lo que ocurre._  | CI-PR, CD         | Deploy markers, signed artifacts, immutable logs      |
| H2  | **Compliance scanning**           | Escaneo automático de cumplimiento normativo. _Para no técnicos: verifica que el sistema cumpla regulaciones (GDPR, SOC2, HIPAA)._ | Scheduled         | Drata, Vanta, Secureframe, AWS Audit Manager          |
| H3  | **License compliance**            | Verificación de licencias de software. _Para no técnicos: asegura que las librerías tengan licencias permitidas._                  | CI-PR             | FOSSA, License Finder, Dependency Review, WhiteSource |
| H4  | **Data privacy checks**           | Escaneo de datos personales en código/logs. _Para no técnicos: busca información sensible que no debería estar en el código._      | Pre-commit, CI-PR | Nightfall, GitGuardian, BigID, custom                 |
| H5  | **Cost governance / FinOps**      | Control de costos en cloud. _Para no técnicos: monitorea y controla cuánto se gasta en servidores._                                | Scheduled         | AWS Budgets, Infracost, CloudHealth, Vantage          |
| H6  | **SBOM retention / distribution** | Almacena y distribuye SBOMs. _Para no técnicos: mantiene un archivo histórico de todos los componentes usados._                    | CD, Scheduled     | Dependency Track, Anchore, GitHub SBOM                |
| H7  | **Policy enforcement gates**      | Puertas de cumplimiento de políticas. _Para no técnicos: bloquea cambios que no cumplan las reglas de la empresa._                 | CI-PR, CD         | OPA, Sentinel, Kyverno, Conftest                      |

#### I. Scheduling & Automation (8 stages)

| #   | Stage                            | Descripción técnica / No técnica                                                                                   | Cuándo corre | Herramientas típicas                              |
| --- | -------------------------------- | ------------------------------------------------------------------------------------------------------------------ | ------------ | ------------------------------------------------- |
| I1  | **Scheduled dependency updates** | Actualiza dependencias automáticamente. _Para no técnicos: mantiene las librerías al día sin intervención manual._ | Scheduled    | Dependabot, Renovate, Snyk                        |
| I2  | **Scheduled security full scan** | Escaneo completo de seguridad. _Para no técnicos: revisión exhaustiva de seguridad semanal._                       | Scheduled    | Gitleaks full, Trivy full, CodeQL full, npm audit |
| I3  | **Scheduled SBOM regeneration**  | Regenera inventario de componentes. _Para no técnicos: actualiza la lista de ingredientes del software._           | Scheduled    | Anchore, Syft, CycloneDX                          |
| I4  | **Scheduled cleanup**            | Limpia artefactos e imágenes viejas. _Para no técnicos: elimina versiones antiguas para ahorrar espacio._          | Scheduled    | ECR lifecycle, GitHub Actions cache clean, custom |
| I5  | **Scheduled cost optimization**  | Optimiza costos (apagar staging en horarios). _Para no técnicos: apaga entornos de prueba cuando no se usan._      | Scheduled    | AWS Instance Scheduler, custom cron + scripts     |
| I6  | **Scheduled regression suite**   | Suite completa de pruebas regresivas. _Para no técnicos: ejecuta todas las pruebas periódicamente._                | Scheduled    | Playwright, Vitest, cron workflow                 |
| I7  | **Webhook-driven automation**    | Automatización por eventos externos. _Para no técnicos: reacciona automáticamente a eventos de otros sistemas._    | On-demand    | GitHub webhooks, Zapier, custom                   |
| I8  | **ChatOps integration**          | Notificaciones y aprobaciones vía chat. _Para no técnicos: recibe alertas y aprueba despliegues desde el chat._    | CI-PR, CD    | Slack, Teams, Discord webhooks, GitHub Actions    |

#### J. Developer Experience (DX) (7 stages)

| #   | Stage                        | Descripción técnica / No técnica                                                                                             | Cuándo corre      | Herramientas típicas                                          |
| --- | ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------- | ----------------- | ------------------------------------------------------------- |
| J1  | **Auto-labeling of PRs**     | Etiqueta automática de PRs (tamaño, área, prioridad). _Para no técnicos: clasifica automáticamente los cambios propuestos._  | CI-PR             | GitHub Actions labeler, size-label, ML-based                  |
| J2  | **PR template enforcement**  | Valida plantilla de PR. _Para no técnicos: asegura que los cambios incluyan descripción, tests y screenshots._               | CI-PR             | PR template check, GH action                                  |
| J3  | **CHANGELOG automation**     | Genera changelog automáticamente. _Para no técnicos: crea la lista de novedades de cada versión sin escribirlas a mano._     | CD                | auto-changelog, conventional-changelog, Changesets            |
| J4  | **Documentation generation** | Genera documentación del código. _Para no técnicos: crea documentación técnica automáticamente a partir del código._         | CI-PR             | TypeDoc, JSDoc, Storybook, Swagger UI, OpenAPI                |
| J5  | **CI/CD status badges**      | Badges de estado del pipeline en README. _Para no técnicos: muestra visualmente si el proyecto está saludable._              | CI-PR             | Shields.io, GitHub badges                                     |
| J6  | **Blame-free CI**            | CI inteligente (no corre si solo cambian docs). _Para no técnicos: evita ejecutar pruebas cuando solo cambió documentación._ | CI-PR             | paths-filter, skip-duplicate-actions, [skip ci]               |
| J7  | **Developer feedback loops** | Feedback rápido al desarrollador. _Para no técnicos: el sistema avisa rápido si hay problemas, no después de horas._         | Pre-commit, CI-PR | Fast CI (<10min), flaky test quarantine, test impact analysis |

---

### 18.3 Mapa de Cobertura: Project One vs Enterprise Completo

| Categoría Enterprise                 | Cubierto en Project One                                                                                                | Brecha                                                                                |
| ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| **A. Source Control & Code Quality** | ✅ A1, A2, A3, A4, A5, A7, A8, A9. ⚠️ A6 (Merge Queue no planificado)                                                  | A10-A12 (complejidad, dead code, duplicación) no planificados                         |
| **B. Build & Compilation**           | ✅ B1, B2, B4, B9, B10, B11. ⚠️ B5 (image optimization postergado)                                                     | B3 (multi-arch), B6 (signing), B7, B8, B12 no planificados                            |
| **C. Testing**                       | ✅ C1, C2, C3, C5, C12, C19, C21. ⚠️ C4 (contract tests Should-have), C7 (a11y), C8 (perf)                             | C6 (visual regression), C9-C11 (load/stress/soak), C13-C18, C20, C22                  |
| **D. Security**                      | ✅ D1, D2, D3, D7, D11, D13. ⚠️ D9 (IaC scanning postergado), D10 (license via Dep Review), D14 (postergado)           | D4 (DAST), D5 (IAST), D6 (RASP), D8 (K8s), D12 (supply chain), D15 (orchestration)    |
| **E. Infrastructure & IaC**          | ⚠️ E7 (secrets vía GitHub Environments). E1 (Terraform postergado)                                                     | E2-E6, E8, E9 no planificados (IaC postergado)                                        |
| **F. CD & Deployment**               | ✅ F1 (Blue/Green Sprint 4), F2 (Canary Sprint 4), F7 (Preview Sprint 2), F9 (Smoke Sprint 3), F11 (Rollback Sprint 4) | F4 (A/B), F5 (feature flags Should-have), F8 (DB migration postergada), F10, F12, F13 |
| **G. Observability & Monitoring**    | ✅ G2 (CloudWatch), G3 (Prometheus+Grafana en docker-compose), G6 (Sentry Sprint 4)                                    | G1, G4, G5, G7-G11 no planificados                                                    |
| **H. Compliance & Governance**       | ⚠️ H6 (SBOM Sprint 4). H3 (Dependency Review)                                                                          | H1, H2, H4, H5, H7 no planificados                                                    |
| **I. Scheduling & Automation**       | ✅ I1 (Dependabot Sprint 1), I2 (cron security Sprint 4), I3 (SBOM cron Sprint 4)                                      | I4-I8 no planificados                                                                 |
| **J. Developer Experience**          | ✅ J4 (Storybook, Swagger). ⚠️ J3 (Changesets operativo), J5 (badges)                                                  | J1, J2, J6, J7 no planificados                                                        |

---

### 18.4 Prioridad para Project One

#### 🔴 Core — Ya implementado o planificado en Sprint 1-4

A1, A2, A3, A7, A8, A9, B1, B2, B4, B10, B11, C1, C2, C3, C5, C12, C19, C21, D1, D2, D3, D7, D11, D13, E7, F1, F2, F7, F9, F11, G2, G3, G6, H3, H6, I1, I2, I3, J3, J4, J5

#### 🟡 High Value — Recomendado para próximos sprints (post-Sprint 4)

A6 (Merge Queue), B5 (Image optimization), C4 (Contract testing), C7 (Accessibility), C8 (Performance), C20 (Flaky detection), C22 (Test impact analysis), D10 (License compliance), D14 (Policy as Code), F5 (Feature flags), F12 (Traffic mirroring), G1 (Build/deploy metrics), G4 (Distributed tracing), G5 (RUM), G7 (Alerting), I4 (Cleanup), J7 (Feedback loops)

#### 🟢 Nice to Have — Madurez a largo plazo

A10 (Complexity), A11 (Dead code), A12 (Duplication), B3 (Multi-arch), B6 (Binary signing), B7, B8 (Attestation), C6 (Visual regression), C9-C11 (Load/stress/soak), C13-C18, D4-D6 (DAST/IAST/RASP), D8 (K8s scan), D12 (Supply chain attestation), D15 (Security orchestration), E1-E6, E8-E9 (IaC completo), F4 (A/B testing), F8 (DB migration), F10 (Synthetic), F13 (Release orchestration), G8-G11 (Incident, SLO, Chaos), H1-H7 (Compliance completo), I5-I8, J1-J2, J6

#### ⚪ Not Applicable (escala/stack actual no lo requiere)

B3 (multi-arch — solo AMD64 por ahora), D5, D6 (IAST/RASP — excesivo para equipo pequeño), D8 (K8s — no usamos Kubernetes), E3-E6 (IaC complejo — postergado), F4 (A/B testing — cuando haya tráfico significativo), G8-G9 (incident/SLO — cuando haya SLO definidos), H2 (compliance scanning — cuando aplique SOC2/HIPAA)

---

### 18.5 Fuentes de esta investigación

| Fuente                                                                 | Enlace                                                                                                  | Categorías                     |
| ---------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- | ------------------------------ |
| **GitHub Actions documentation** — Workflow syntax, triggers, matrices | https://docs.github.com/en/actions                                                                      | A, B, C, D, F, I, J            |
| **GitHub CI/CD best practices** — Recommended workflows for Node.js    | https://docs.github.com/en/actions/guides/building-and-testing-nodejs                                   | A, B, C                        |
| **DORA — Accelerate State of DevOps Report**                           | https://dora.dev/                                                                                       | G1, KPIs                       |
| **SLSA — Supply-chain Levels for Software Artifacts**                  | https://slsa.dev/                                                                                       | B6, B8, D12                    |
| **OWASP CI/CD Security Risks Top 10**                                  | https://owasp.org/www-project-top-10-ci-cd-security-risks/                                              | D, H                           |
| **OWASP Testing Guide** — DAST, IAST, SAST methodology                 | https://owasp.org/www-project-web-security-testing-guide/                                               | D1, D4, D5                     |
| **CNCF CI/CD Landscape** — Cloud Native Interactive Landscape          | https://landscape.cncf.io/                                                                              | General (todas las categorías) |
| **Pact documentation** — Consumer-Driven Contracts                     | https://docs.pact.io/                                                                                   | C4                             |
| **Playwright documentation** — E2E testing best practices              | https://playwright.dev/                                                                                 | C5, C12                        |
| **k6 documentation** — Performance testing in CI                       | https://k6.io/docs/                                                                                     | C8, C9, C10, C11               |
| **Terraform documentation** — IaC best practices                       | https://developer.hashicorp.com/terraform                                                               | E1, E2                         |
| **SPACE framework** — Developer Productivity Metrics                   | https://queue.acm.org/detail.cfm?id=3454124                                                             | J                              |
| **Google SRE Book** — SLI, SLO, error budgets, incident response       | https://sre.google/sre-book/table-of-contents/                                                          | G7, G8, G9                     |
| **Chaos Engineering Principles** — Principles of Chaos                 | https://principlesofchaos.org/                                                                          | G11                            |
| **FinOps Framework** — Cloud cost management                           | https://www.finops.org/                                                                                 | H5                             |
| **Trunk-Based Development** — Branching strategy                       | https://trunkbaseddevelopment.com/                                                                      | A5, A6                         |
| **Feature Flags (Martin Fowler)** — Article on feature toggles         | https://martinfowler.com/articles/feature-flags.html                                                    | F4, F5                         |
| **Blue/Green Deployment (Martin Fowler)**                              | https://martinfowler.com/bliki/BlueGreenDeployment.html                                                 | F1                             |
| **Canary Release (Martin Fowler)**                                     | https://martinfowler.com/bliki/CanaryRelease.html                                                       | F2                             |
| **Test Pyramid (Martin Fowler)**                                       | https://martinfowler.com/bliki/TestPyramid.html                                                         | C1-C5                          |
| **Continuous Delivery (Humble & Farley)**                              | https://continuousdelivery.com/                                                                         | F (general)                    |
| **Vitest documentation** — Coverage thresholds, sharding               | https://vitest.dev/                                                                                     | C19, C21                       |
| **Testing Library documentation** — Component testing                  | https://testing-library.com/                                                                            | C3                             |
| **Semgrep documentation** — SAST rules                                 | https://semgrep.dev/docs/                                                                               | D1                             |
| **Trivy documentation** — Container and filesystem scanning            | https://trivy.dev/                                                                                      | D2, D7                         |
| **Syft / Anchore documentation** — SBOM generation                     | https://anchore.com/sbom/                                                                               | B7, D11                        |
| **CycloneDX — SBOM Standard**                                          | https://cyclonedx.org/                                                                                  | B7, D11, H6                    |
| **Open Policy Agent (OPA)** — Policy as Code                           | https://www.openpolicyagent.org/                                                                        | D14, H7                        |
| **GitOps — Principles and Practices**                                  | https://www.gitops.tech/                                                                                | E4                             |
| **GitHub Merge Queue documentation**                                   | https://docs.github.com/en/repositories/configuring-branches/merging-a-pull-request-using-a-merge-queue | A6                             |
| **Helm documentation** — Kubernetes package manager                    | https://helm.sh/                                                                                        | E4                             |
| **Argo Rollouts — Progressive Delivery for Kubernetes**                | https://argoproj.github.io/argo-rollouts/                                                               | F1, F2, F13                    |
| **Gremlin — Chaos Engineering platform**                               | https://www.gremlin.com/                                                                                | G11                            |
| **AWS FIS — Fault Injection Simulator**                                | https://aws.amazon.com/fis/                                                                             | G11                            |
| **HashiCorp Vault — Secrets management**                               | https://www.vaultproject.io/                                                                            | E7                             |
| **OpenTelemetry — Observability framework**                            | https://opentelemetry.io/                                                                               | G4                             |
| **PagerDuty — Incident management**                                    | https://www.pagerduty.com/                                                                              | G7, G8                         |

---

## 19. Análisis de Brechas y Conocimientos CI/CD Faltantes

### 19.1 Introducción

Esta sección documenta el **análisis de brechas** realizado sobre el plan completo, identificando qué conocimientos CI/CD no están cubiertos o están insuficientemente tratados en las secciones anteriores.

> **Para no técnicos**: Así como un mapa puede tener zonas inexploradas, este análisis identifica qué temas de CI/CD no se han cubierto todavía. Algunos son relevantes para Project One ahora, otros son conocimiento para futuro.

**Metodología**: Cada sección del documento se evaluó contra:

- Estándares de la industria (DORA, SLSA, OWASP, CALMS, SPACE)
- Literatura de referencia (Continuous Delivery, SRE Book, DevOps Handbook)
- Prácticas observadas en organizaciones enterprise con madurez CI/CD alta
- Prácticas emergentes 2024-2026

| Métrica del análisis              | Valor |
| --------------------------------- | ----- |
| Secciones existentes analizadas   | 18    |
| Brechas identificadas             | 47    |
| Categorías de brechas             | 10    |
| Topics para expansión futura      | 21    |
| Topics NO aplicables documentados | 14    |
| Mejoras de calidad propuestas     | 34+   |
| Nuevas fuentes consultadas        | 33    |

---

### 19.2 Brechas Identificadas por Categoría

#### 19.2.1 Cultura DevOps y People (6 brechas)

| #   | Brecha                                       | Detalle                                                                                                                      | Impacto                                                                                         | Prioridad |
| --- | -------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- | --------- |
| G1  | **CALMS — solo mencionado, no desarrollado** | El documento cita CALMS en §15 y §17 pero no explica cómo aplica Culture, Automation, Lean, Measurement, Sharing al pipeline | El equipo podría ver CI/CD solo como tecnología, ignorando la transformación cultural necesaria | 🟡 Alta   |
| G2  | **Blameless culture en pipelines**           | No se menciona cómo manejar errores de pipeline sin culpa, ni política de "post-mortem sin blame"                            | Sin cultura blameless, los equipos ocultan errores y no se mejora la resiliencia                | 🟡 Alta   |
| G3  | **Team topology para DevOps**                | Conway's Law, Team Topologies (Stream-aligned, Enabling, Complicated-subsystem, Platform) no se mencionan                    | La estructura del equipo impacta directamente el diseño del pipeline CI/CD                      | 🟢 Media  |
| G4  | **DevOps maturity model**                    | No hay un modelo de madurez más allá de DORA (ej. CMMI for DevOps, Techtonic maturity)                                       | Sin modelo, es difícil medir progreso más allá de los 4 keys de DORA                            | 🟢 Media  |
| G5  | **SRE practices embedded**                   | Error budgets, SLOs como gates de CI/CD, toil reduction no están desarrollados                                               | SRE y CI/CD deben trabajar juntos; error budgets pueden ser gates de canary                     | 🟡 Alta   |
| G6  | **On-call rotation vinculado a deploys**     | No se discute quién es responsable del pipeline en horario no laboral, ni la rotación de guardia vinculada a despliegues     | Sin ownership claro, los fallos de pipeline nocturnos no tienen respuesta                       | 🟢 Media  |

#### 19.2.2 Arquitectura Avanzada (5 brechas)

| #   | Brecha                                    | Detalle                                                                                                                 | Impacto                                                                                                | Prioridad |
| --- | ----------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ | --------- |
| G7  | **Microservicios vs monorepo CI/CD**      | El documento asume monorepo. No discute cómo cambiaría la estrategia si se migrara a microservicios con repos separados | Decisiones de CI/CD tomadas ahora pueden no escalar si se migra a microservicios                       | 🟢 Media  |
| G8  | **Pipeline as Code profundo**             | No se discute que los pipelines (YAML) deben ser versionados, testeados y revisados como código de aplicación           | Workflows rotos en main pueden bloquear a todo el equipo                                               | 🔴 Alta   |
| G9  | **Pull Request pipelines vs merge queue** | Se menciona Merge Queue (A6) pero no se profundiza en cómo funciona con CI/CD, ni la diferencia con el flujo PR actual  | Sin merge queue, dos PRs aprobados pueden romper main si el segundo no incluye los cambios del primero | 🟡 Alta   |
| G10 | **Event-driven CI/CD**                    | Workflows disparados por eventos externos (webhooks, issues, comments) no se cubren más allá de lo básico               | Hay automatizaciones valiosas que dependen de eventos externos al código                               | 🟢 Media  |
| G11 | **Cross-repo dependencies**               | Project One depende de paquetes npm publicados. No se cubre cómo CI/CD maneja dependencias entre repos                  | Un cambio en una dependencia puede romper Project One sin que CI lo detecte hasta el PR                | 🟡 Alta   |

#### 19.2.3 Seguridad y Cumplimiento Profundo (7 brechas)

| #   | Brecha                             | Detalle                                                                                                                    | Impacto                                                                                                        | Prioridad |
| --- | ---------------------------------- | -------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- | --------- |
| G12 | **Zero Trust CI/CD**               | Principio de mínimo privilegio para workflows, OIDC federation, workload identity — no desarrollado                        | Workflows con demasiados permisos son un vector de ataque                                                      | 🔴 Alta   |
| G13 | **OIDC deep dive**                 | Se menciona OIDC de pasada. No se explica cómo configurar OIDC entre GitHub Actions y AWS para eliminar secretos estáticos | Sin OIDC, se necesitan AWS keys estáticas → riesgo de seguridad                                                | 🔴 Alta   |
| G14 | **Dynamic secrets**                | No se cubre el patrón de secrets dinámicos (Vault dynamic secrets, STS temporary credentials)                              | Secrets estáticos son menos seguros y requieren rotación manual                                                | 🟡 Alta   |
| G15 | **Threat modeling for CI/CD**      | STRIDE aplicado a cada etapa del pipeline no está documentado                                                              | Sin threat modeling, hay riesgos de seguridad no identificados                                                 | 🟡 Alta   |
| G16 | **Data retention de artefactos**   | No se especifica política de retención para logs de build, imágenes Docker, SBOMs históricos                               | Sin retención definida, los costos de almacenamiento crecen indefinidamente o se borra evidencia de compliance | 🟢 Media  |
| G17 | **Compliance evidence automation** | No se describe cómo el pipeline recolecta evidencia de cumplimiento automáticamente para auditorías                        | Auditorías requieren evidencia manual → costoso y propenso a error                                             | 🟡 Alta   |
| G18 | **VEX y CSAF para SBOM**           | Se menciona SBOM pero no VEX (Vulnerability Exploitability eXchange) ni CSAF (Common Security Advisory Framework)          | Sin VEX, no se puede comunicar si una vulnerabilidad es explotable o no → ruido en alerts                      | 🟢 Media  |

#### 19.2.4 Testing Avanzado (5 brechas)

| #   | Brecha                                   | Detalle                                                                                                | Impacto                                                                      | Prioridad |
| --- | ---------------------------------------- | ------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------- | --------- |
| G19 | **Test data management**                 | No se cubre cómo generar, sembrar, enmascarar y gestionar datos de prueba para CI/CD                   | Tests con datos inconsistentes son flaky o no representan realidad           | 🟡 Alta   |
| G20 | **Performance regression gates**         | No se definen thresholds automáticos de rendimiento que bloqueen deploys                               | Una regresión de rendimiento puede pasar desapercibida hasta producción      | 🟡 Alta   |
| G21 | **Testing in Production patterns**       | Shadow traffic, smoke canary, A/B testing no se desarrollan como estrategia de testing en producción   | El único testing que ocurre con datos y tráfico real es el testing en prod   | 🟢 Media  |
| G22 | **Flaky test management framework**      | Se menciona flaky detection pero no un framework completo: quarantine, SLI de tests, ticket automático | Los flaky tests erosionan la confianza en el pipeline completo               | 🟡 Alta   |
| G23 | **Chaos Engineering como gate de CI/CD** | Se menciona Chaos Engineering como nice-to-have pero no como gate que pueda bloquear un deploy         | Sin validación de resiliencia, los deploys pueden degradar la disponibilidad | 🟢 Media  |

#### 19.2.5 Operaciones de Despliegue Profundas (5 brechas)

| #   | Brecha                              | Detalle                                                                                                             | Impacto                                                                   | Prioridad |
| --- | ----------------------------------- | ------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- | --------- |
| G24 | **Expand-Migrate-Contract para BD** | El documento menciona migrate down pero no el patrón expand-migrate-contract para cambios backward-compatible       | Migraciones irreversibles pueden forzar rollbacks imposibles de deshacer  | 🔴 Alta   |
| G25 | **Canary analysis techniques**      | No se especifica cómo analizar estadísticamente los resultados del canary (Mann-Whitney, t-test, beta distribution) | Sin análisis estadístico, la decisión de continuar/rollback es subjetiva  | 🟡 Alta   |
| G26 | **Multi-region deployment**         | No se cubre estrategia multi-región o multi-AZ para alta disponibilidad                                             | Un fallo de región deja la aplicación offline                             | 🟢 Media  |
| G27 | **DR testing via CI/CD**            | Disaster Recovery testing automatizado a través del pipeline no se menciona                                         | Sin DR testing, el plan de recuperación puede fallar cuando sea necesario | 🟢 Media  |
| G28 | **Runbook automation**              | No se documenta cómo automatizar runbooks de incidentes comunes a través del pipeline                               | Cada incidente requiere intervención manual → MTTR alto                   | 🟡 Alta   |

#### 19.2.6 Gobernanza y Regulatorio (4 brechas)

| #   | Brecha                           | Detalle                                                                                                           | Impacto                                                                                  | Prioridad |
| --- | -------------------------------- | ----------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- | --------- |
| G29 | **Segregation of duties**        | No se documenta la separación de roles: quién puede mergear, quién puede desplegar a producción, 4-eyes principle | Sin segregación, una persona puede introducir cambios maliciosos o erróneos a producción | 🔴 Alta   |
| G30 | **Approval gates con evidencia** | Las aprobaciones no recolectan evidencia automática (logs, results, screenshots) para auditoría                   | Sin evidencia, las aprobaciones no son auditables                                        | 🔴 Alta   |
| G31 | **Change management automation** | No se documenta cómo CI/CD automatiza el change management (cambio estándar vs cambio normal vs emergencia)       | Cambios urgentes pueden requerir CAB approval manual que retrasa la respuesta            | 🟡 Alta   |
| G32 | **Regulatory mapping**           | No se mapea CI/CD contra requisitos regulatorios específicos (SOC2 CC6, PCI-DSS 6.3, HIPAA 164.308)               | Sin mapeo, no se puede demostrar compliance durante auditorías                           | 🟢 Media  |

#### 19.2.7 Métricas y Medición (4 brechas)

| #   | Brecha                     | Detalle                                                                                                            | Impacto                                                                                   | Prioridad |
| --- | -------------------------- | ------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------- | --------- |
| G33 | **SPACE framework**        | Se menciona SPACE en §17 pero no se integra al plan de métricas del §12                                            | DORA solo mide 4 aspectos; SPACE cubre satisfacción, rendimiento, actividad, comunicación | 🟡 Alta   |
| G34 | **Value Stream Mapping**   | No se aplica Value Stream Mapping al flujo de desarrollo para identificar cuellos de botella                       | Sin VSM, las optimizaciones de CI/CD pueden no dirigirse a los cuellos de botella reales  | 🟢 Media  |
| G35 | **Cost of CI/CD**          | No se estima el costo de las pipelines (minutos GitHub Actions, almacenamiento artefactos, transferencia de datos) | Minutos CI pueden escalar sin control con la adición de tests                             | 🟡 Alta   |
| G36 | **Pipeline observability** | No se monitorea el pipeline en sí mismo (tiempo de espera vs tiempo de procesamiento, tasa de fallo por etapa)     | Sin observabilidad del pipeline, no se puede mejorar lo que no se mide                    | 🔴 Alta   |

#### 19.2.8 Temas Emergentes (5 brechas)

| #   | Brecha                                | Detalle                                                                                           | Impacto                                                                        | Prioridad |
| --- | ------------------------------------- | ------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ | --------- |
| G37 | **AI-assisted CI/CD**                 | No se discute IA para generar tests, revisar PRs, predecir fallos de pipeline                     | La IA está transformando CI/CD; ignorarla es perder una ventaja competitiva    | 🟢 Media  |
| G38 | **Internal Developer Platform (IDP)** | Backstage, Port, Humanitec no se mencionan como evolución de CI/CD                                | Un IDP puede simplificar la experiencia del desarrollador sobre CI/CD complejo | 🟢 Media  |
| G39 | **GitOps vs PipelineOps**             | No se compara GitOps (ArgoCD, Flux) vs PipelineOps (GitHub Actions CD) para diferentes escenarios | La estrategia de CD puede beneficiarse de entender ambos paradigmas            | 🟢 Media  |
| G40 | **Carbon-aware CI/CD**                | No se discute programar builds cuando la matriz energética es más verde                           | Sostenibilidad es un requisito creciente en empresas enterprise                | ⚪ Baja   |
| G41 | **Platform Engineering**              | No se conecta CI/CD con el movimiento de Platform Engineering                                     | La madurez de CI/CD lleva naturalmente a crear una plataforma interna          | 🟢 Media  |

#### 19.2.9 Brechas de Implementación Práctica (5 brechas)

| #   | Brecha                                      | Detalle                                                                                              | Impacto                                                                     | Prioridad |
| --- | ------------------------------------------- | ---------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- | --------- |
| G42 | **Pipeline testing**                        | No se cubre cómo testear un workflow antes de ponerlo en producción (act local, nektos/act, dry-run) | Un workflow mal configurado puede romper CI para todo el equipo             | 🔴 Alta   |
| G43 | **DR para CI/CD infraestructura**           | No hay plan de contingencia si GitHub Actions está caído o si se pierde acceso a GitHub              | Sin CI/CD, el equipo no puede desplegar → downtime prolongado               | 🟡 Alta   |
| G44 | **Self-hosted vs GitHub-hosted runners**    | No se compara cuándo usar self-hosted runners vs GitHub-hosted para este proyecto                    | Self-hosted runners dan más control pero requieren mantenimiento            | 🟢 Media  |
| G45 | **Composite actions vs reusable workflows** | No se discute cuándo usar composite actions vs reusable workflows para organizar la CI/CD            | Sin esta guía, los workflows pueden volverse difíciles de mantener          | 🟡 Alta   |
| G46 | **Monorepo tooling comparison**             | No se compara Turborepo vs Nx vs Bazel para CI/CD con monorepo Node.js                               | La elección del tooling de monorepo impacta directamente la velocidad de CI | 🟡 Alta   |

#### 19.2.10 Brechas de Contenido del Documento (1 brecha)

| #   | Brecha                               | Detalle                                                                                   | Impacto                                                                           | Prioridad |
| --- | ------------------------------------ | ----------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- | --------- |
| G47 | **Training / upskilling del equipo** | No hay sección sobre qué habilidades necesita el equipo para operar el pipeline propuesto | Sin upskilling, el pipeline avanzado puede quedar sin mantenimiento o mal operado | 🔴 Alta   |

---

### 19.3 Topics Recomendados para Expansión Futura

De las 47 brechas identificadas, las siguientes son las de **mayor prioridad para Project One** y deberían incorporarse en futuras iteraciones del plan:

#### 🔴 Alta prioridad — Recomendado para próximo sprint de documentación

| Topic                                               | Brecha asociada | ¿Dónde insertarlo?                                 | Recursos sugeridos                                        |
| --------------------------------------------------- | --------------- | -------------------------------------------------- | --------------------------------------------------------- |
| **Zero Trust CI/CD + OIDC con AWS**                 | G12, G13        | Nueva subsección en §9 (Cloud Provider)            | GitHub Actions OIDC docs, AWS IAM OIDC provider docs      |
| **Expand-Migrate-Contract para BD**                 | G24             | Nueva subsección en §8 (Estrategia de rollback)    | Prisma docs, Liquibase expand-contract patterns           |
| **Segregation of duties + approval gates**          | G29, G30        | Nueva subsección en §7 (Branching) o §10 (Sprints) | GitHub Protected branches, GitHub Environments            |
| **Pipeline observability (monitorear el pipeline)** | G36             | Nueva subsección en §12 (KPIs)                     | GitHub Actions analytics, Datadog CI                      |
| **Pipeline testing (testear workflows)**            | G42             | Nueva subsección en §5 (Stage 0 pre-commit)        | nektos/act, GitHub Actions workflow validation            |
| **Training del equipo**                             | G47             | Nueva sección en apéndices                         | Formación GitHub Actions, AWS, Docker, CI/CD fundamentals |

#### 🟡 Prioridad media — Recomendado para sprints de madurez

| Topic                           | Brecha asociada | ¿Dónde insertarlo?                 |
| ------------------------------- | --------------- | ---------------------------------- |
| Flaky test management framework | G22             | §5 Stage 4 (tests)                 |
| Performance regression gates    | G20             | §5 Stage 4 (tests)                 |
| Cost of CI/CD                   | G35             | §12 (KPIs) + §9 (Costos)           |
| Event-driven CI/CD              | G10             | §5 Stage 8 (cron) como nuevo stage |
| Value Stream Mapping            | G34             | Nueva subsección en §12            |
| Test data management            | G19             | §5 Stage 4 (tests)                 |

#### 🟢 Prioridad baja — Para crecimiento a largo plazo

Topics G1 (CALMS), G3 (Team Topologies), G7 (Microservicios), G18 (VEX/CSAF), G26 (Multi-región), G27 (DR testing), G37 (AI-assisted), G38 (IDP), G39 (GitOps vs PipelineOps), G41 (Platform Engineering), G44 (Self-hosted runners)

---

### 19.4 Topics NO Aplicables a Project One (con justificación)

Algunos temas CI/CD son relevantes en organizaciones enterprise grandes pero **no aplican a Project One** en su estado actual (2-3 devs, monorepo, stack Node.js/Express/React). Se documentan para contexto pero no se recomienda implementarlos:

| Topic                                                | Justificación de no aplicabilidad                                                                     |
| ---------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| **Microservicios con repos separados**               | Project One es monorepo. Si se migra a microservicios, el plan CI/CD debería revisarse completamente. |
| **Kubernetes avanzado (service mesh, K8s scanning)** | Project One usa ECS Fargate, no K8s. Si el equipo migra a K8s, estos temas aplicarán.                 |
| **Multi-región / multi-cloud**                       | La aplicación no tiene requisitos de latencia global ni HA multi-región por ahora.                    |
| **Carbon-aware CI/CD**                               | Proyecto pequeño; el impacto ambiental de los builds es despreciable.                                 |
| **Multi-arch builds (AMD64 + ARM64)**                | Solo se despliega a AMD64 (ECS Fargate). Cuando ARM sea económicamente ventajoso, aplicar.            |
| **DAST/IAST/RASP profundo**                          | Trivy + CodeQL + Dependabot cubren el riesgo para la escala actual.                                   |
| **Chaos Engineering como gate de CD**                | Excesivo para 2-3 devs. Aplicar cuando el sistema tenga SLOs definidos y tráfico significativo.       |
| **A/B testing platform**                             | Sin tráfico significativo, A/B testing no tiene poder estadístico.                                    |
| **SLOs formales como gates**                         | Sin SLOs definidos, no pueden ser gates. Aplicar cuando el producto tenga métricas de negocio.        |
| **Internal Developer Platform (IDP)**                | IDP tiene sentido cuando hay 5+ equipos. Para 1 equipo, GitHub Actions + Vercel + AWS es suficiente.  |
| **GitOps (ArgoCD/Flux)**                             | ECS Fargate + GitHub Actions CD es más simple que GitOps para la escala actual.                       |
| **Incident management platform**                     | PagerDuty/incident.io es valioso pero excesivo para el tamaño del equipo. Usar Slack + GitHub.        |
| **Compliance scanning SOC2/HIPAA**                   | Si el proyecto requiere compliance en el futuro, se puede agregar. Por ahora no aplica.               |
| **AI-assisted CI/CD (code review, test generation)** | Tecnología emergente; evaluar cuando madure y la escala del proyecto lo justifique.                   |

---

### 19.5 Mejoras de Calidad para el Documento Actual

Basado en el análisis de brechas, se proponen las siguientes mejoras para las secciones existentes:

#### Glosario (§2) — Términos a agregar

| Término                                         | Definición propuesta                                                                                                                    |
| ----------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| **OIDC (OpenID Connect)**                       | Protocolo de autenticación que permite a GitHub Actions obtener credenciales temporales de AWS sin almacenar secretos estáticos.        |
| **Zero Trust**                                  | Principio de seguridad donde ningún actor (usuario, máquina, workflow) es confiable por defecto; todo debe verificarse.                 |
| **Expand-Migrate-Contract**                     | Patrón de migración de BD en 3 fases: expandir esquema (add), migrar datos, contraer esquema (remove). Permite rollback seguro.         |
| **Segregation of Duties**                       | Principio de que ninguna persona debe tener todos los permisos para promover código a producción sin revisión.                          |
| **Canary Analysis**                             | Evaluación estadística de métricas (errores, latencia, tráfico) entre la versión canary y la versión estable para decidir si continuar. |
| **VEX (Vulnerability Exploitability Exchange)** | Formato estandarizado para comunicar si una vulnerabilidad conocida es explotable en un contexto específico.                            |
| **PSF (Pipeline Success Factor)**               | Porcentaje de ejecuciones de pipeline que completan todas las etapas exitosamente.                                                      |
| **CALMS**                                       | Culture, Automation, Lean, Measurement, Sharing — framework de adopción DevOps.                                                         |
| **MTTR**                                        | Mean Time to Recovery — tiempo promedio en recuperarse de un fallo.                                                                     |
| **WIP (Work in Progress)**                      | Trabajo en progreso; límite de trabajo simultáneo para mejorar flujo.                                                                   |
| **Toil**                                        | Trabajo manual, repetitivo, automatizable que no produce valor duradero.                                                                |
| **Blameless Post-mortem**                       | Análisis post-incidente enfocado en mejorar el sistema, no en culpar personas.                                                          |

#### Diagramas a agregar

| Diagrama faltante             | ¿Dónde?   | Propósito                                                          |
| ----------------------------- | --------- | ------------------------------------------------------------------ |
| **Arquitectura de red AWS**   | §9        | VPC, subnets, load balancer, ECS, RDS, NAT — cómo se conectan      |
| **Flujo de datos CI/CD**      | §4        | Datos que fluyen entre stages (artifacts, reports, secrets)        |
| **OIDC flow**                 | §9 nuevo  | Cómo GitHub Actions obtiene credenciales AWS sin secrets estáticos |
| **Expand-Migrate-Contract**   | §8        | Las 3 fases de migración de BD en el tiempo                        |
| **Value Stream Map**          | §12 nuevo | Mapa del flujo de valor del desarrollo a producción                |
| **Pipeline health dashboard** | §12       | Dashboard visual con DORA metrics + pipeline observability         |

#### Decisiones adicionales a documentar

| Decisión no documentada                   | Recomendación                                                                                 |
| ----------------------------------------- | --------------------------------------------------------------------------------------------- |
| **¿GitHub-hosted runners o self-hosted?** | GitHub-hosted (2000 min/mes gratis) es suficiente para Project One. Self-hosted si se excede. |
| **¿Merge Queue o no?**                    | No por ahora. Con 2-3 devs, el riesgo de conflictos post-merge es bajo. Re-evaluar al crecer. |
| **¿Monorepo tool?**                       | npm workspaces suficiente para escala actual. Turborepo recomendado como paso siguiente.      |
| **¿Política de retención de artefactos?** | 90 días para imágenes Docker en ECR, 30 días para logs de build, 1 año para SBOMs.            |
| **¿Horario de deploys a producción?**     | Lunes-Jueves 9am-5pm, evitar viernes y fines de semana.                                       |

#### Riesgos adicionales para §13

| Riesgo adicional                                 | Probabilidad | Impacto | Mitigación                                                             |
| ------------------------------------------------ | ------------ | ------- | ---------------------------------------------------------------------- |
| **GitHub Actions downtime**                      | Baja         | Alto    | Tener script de build/deploy manual como DR                            |
| **Workflow mal configurado rompe CI**            | Media        | Alto    | Testear workflows con `act` antes de mergear                           |
| **Secreto de OIDC mal configurado**              | Baja         | Alto    | Validar OIDC con GitHub's OIDC debugger antes de usar                  |
| **Canary falso positivo/negativo**               | Media        | Medio   | Análisis estadístico con tamaño de muestra suficiente                  |
| **Migración de BD irreversible**                 | Baja         | Crítico | Expand-Migrate-Contract + migrate down siempre definido                |
| **Cobertura de tests decrece sin ser detectado** | Media        | Medio   | Coverage diff en PR (no solo umbral global)                            |
| **Dependencia de Floci no mantenida**            | Baja         | Medio   | Tener LocalStack como fallback; Floci es MIT (código disponible)       |
| **Sobrecosto de GitHub Actions**                 | Media        | Bajo    | Monitorear minutos; self-hosted runner si es necesario                 |
| **Falta de skills AWS en el equipo**             | Alta         | Alto    | Training plan en Sprint 0 + AWS Free Tier + templates pre-configurados |

#### Métricas adicionales para §12

| Métrica adicional                                 | Target            | Por qué                                                      |
| ------------------------------------------------- | ----------------- | ------------------------------------------------------------ |
| **Pipeline Success Rate (PSR)**                   | > 95%             | Mide la fiabilidad del pipeline en sí mismo                  |
| **Time to feedback (commit → first test result)** | < 5 min           | Mide cuán rápido el desarrollador sabe si algo falló         |
| **Deploy to production time**                     | < 15 min          | Mide la eficiencia del CD                                    |
| **WIP limit compliance**                          | > 90%             | Mide si el equipo respeta los límites de trabajo en progreso |
| **PR size distribution**                          | > 80% < 300 lines | PRs pequeños se revisan y mergean más rápido                 |
| **Flaky test rate**                               | < 1%              | Tests inestables erosionan confianza en el pipeline          |
| **SBOM generation rate**                          | 100%              | Compliance: todo release debe tener SBOM                     |

---

### 19.6 Fuentes de esta Investigación (Nuevas)

| Fuente                                                   | Enlace                                                                                                                              | Brechas que cubre |
| -------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- | ----------------- |
| **GitHub Actions OIDC — OpenID Connect en AWS**          | https://docs.github.com/en/actions/deployment/security-hardening-your-deployments/about-security-hardening-with-openid-connect      | G12, G13          |
| **GitHub Actions workflow syntax — OIDC subject claims** | https://docs.github.com/en/actions/deployment/security-hardening-your-deployments/configuring-openid-connect-in-amazon-web-services | G12, G13          |
| **Prisma — Expand and Contract pattern**                 | https://www.prisma.io/dataguide/types/relational/expand-and-contract-pattern                                                        | G24               |
| **Liquibase — Safe database deployments**                | https://www.liquibase.com/safe-database-deployments                                                                                 | G24               |
| **Google SRE — Error Budgets**                           | https://sre.google/sre-book/error-budget/                                                                                           | G5, G8            |
| **Site Reliability Engineering (Google SRE Book)**       | https://sre.google/sre-book/table-of-contents/                                                                                      | G1, G5            |
| **CALMS framework (IT Revolution)**                      | https://itrevolution.com/calms/                                                                                                     | G1                |
| **DevOps Handbook (Kim, Humble, Debois, Willis)**        | https://itrevolution.com/product/the-devops-handbook/                                                                               | G1, G2, G3        |
| **Team Topologies (Matthew Skelton & Manuel Pais)**      | https://teamtopologies.com/                                                                                                         | G3                |
| **SPACE framework (ACM Queue)**                          | https://queue.acm.org/detail.cfm?id=3454124                                                                                         | G33               |
| **Value Stream Mapping for DevOps**                      | https://www.amazon.com/Value-Stream-Mapping-DevOps-Lean/dp/1098127840                                                               | G34               |
| **OWASP Threat Modeling — STRIDE per stage**             | https://owasp.org/www-community/Threat_Modeling                                                                                     | G15               |
| **Zero Trust Architecture (NIST SP 800-207)**            | https://csrc.nist.gov/publications/detail/sp/800-207/final                                                                          | G12               |
| **Sigstore / cosign — Supply chain signing**             | https://www.sigstore.dev/                                                                                                           | G12, G17          |
| **VEX — Vulnerability Exploitability Exchange (CISA)**   | https://www.cisa.gov/resources-tools/resources/vex-use-cases                                                                        | G18               |
| **CSAF — Common Security Advisory Framework (OASIS)**    | https://oasis-open.github.io/csaf-documentation/                                                                                    | G18               |
| **Flaky test management (Google Testing Blog)**          | https://testing.googleblog.com/                                                                                                     | G22               |
| **Canary analysis — Kayenta (Netflix)**                  | https://netflixtechblog.com/kayenta-gray-release-analysis-9779b483a0                                                                | G25               |
| **Testing in Production (Cindy Sridharan)**              | https://copyconstruct.medium.com/testing-in-production-the-safe-way-3ab94522bb1                                                     | G21               |
| **nektos/act — Run GitHub Actions locally**              | https://github.com/nektos/act                                                                                                       | G42               |
| **Turborepo — Monorepo CI/CD optimization**              | https://turbo.build/repo/docs                                                                                                       | G46               |
| **Nx — Monorepo with CI/CD**                             | https://nx.dev/ci                                                                                                                   | G46               |
| **Bazel — Build system for monorepos**                   | https://bazel.build/                                                                                                                | G46               |
| **Composite Actions vs Reusable Workflows**              | https://docs.github.com/en/actions/creating-actions/creating-a-composite-action                                                     | G45               |
| **GitHub Action self-hosted runners**                    | https://docs.github.com/en/actions/hosting-your-own-runners/managing-self-hosted-runners/about-self-hosted-runners                  | G44               |
| **Backstage — Internal Developer Platform**              | https://backstage.io/                                                                                                               | G38               |
| **Port — IDP platform**                                  | https://www.getport.io/                                                                                                             | G38               |
| **Carbon-aware computing (Green Software Foundation)**   | https://greensoftware.foundation/                                                                                                   | G40               |
| **AI-assisted code review (GitHub Copilot Code Review)** | https://github.com/features/code-review                                                                                             | G37               |
| **GitOps vs PipelineOps (Weaveworks)**                   | https://www.weave.works/technologies/gitops/                                                                                        | G39               |
| **DevOps Maturity Model (Techtonic)**                    | https://www.techtonic.com/insights/the-devops-maturity-model                                                                        | G4                |
| **Change Management Automation (ITIL 4)**                | https://www.axelos.com/case-studies-and-white-papers/itil-4-high-velocity-it                                                        | G31               |
| **AWS multi-region deployment patterns**                 | https://docs.aws.amazon.com/wellarchitected/latest/reliability-pillar/multi-region-deployment.html                                  | G26               |

---

> **Documento generado**: julio 2026
> **Última actualización de citas**: julio 2026
> **Última actualización de catálogo de stages**: julio 2026
> **Última actualización de análisis de brechas**: julio 2026
> **Próxima revisión sugerida**: al completar Sprint 2, o antes si cambian los requisitos de infraestructura.
