# Pipeline CI/CD Empresarial y Profesional: Guía Exhaustiva por Stages

> **Documento de investigación técnica** — Cómo aplicar un pipeline de CI/CD (Continuous Integration / Continuous Delivery & Deployment) con estándares empresariales y profesionales.
>
> **Fecha:** agosto 2026
> **Contexto del proyecto:** monorepo Node.js/Express + React (Vite) con GitHub Actions como runner CI/CD (ver `docs/cicd-estado-actual.md`). Herramientas actuales: Vitest, Testing Library, Playwright, Prisma, Husky, Conventional Commits.
> **Alcance:** documento genérico/educativo con notas contextuales para stacks Node.js/React.
> **Idioma:** español técnico, conservando términos en inglés cuando son estándar de la industria (SAST, DAST, blue/green, canary, etc.).

---

## Tabla de contenidos

1. [Introducción al CI/CD empresarial](#1-introducción-al-cicd-empresarial)
2. [Pipeline genérico / visual](#2-pipeline-genérico--visual)
3. [Stage 1 — Source / Commit Stage](#3-stage-1--source--commit-stage)
4. [Stage 2 — Build / Compile Stage](#4-stage-2--build--compile-stage)
5. [Stage 3 — Code Quality / Static Analysis Stage](#5-stage-3--code-quality--static-analysis-stage)
6. [Stage 4 — Security Scanning Stage (DevSecOps)](#6-stage-4--security-scanning-stage-devsecops)
7. [Stage 5 — Testing Stage](#7-stage-5--testing-stage)
8. [Stage 6 — Artifact / Packaging Stage](#8-stage-6--artifact--packaging-stage)
9. [Stage 7 — Integration Stage](#9-stage-7--integration-stage)
10. [Stage 8 — Deployment Staging Stage](#10-stage-8--deployment-staging-stage)
11. [Stage 9 — Acceptance / UAT Stage](#11-stage-9--acceptance--uat-stage)
12. [Stage 10 — Performance & Reliability Stage](#12-stage-10--performance--reliability-stage)
13. [Stage 11 — Approval / Governance Stage](#13-stage-11--approval--governance-stage)
    - [13.10 Governance a lo largo de todo el ciclo de vida](#1310-governance-a-lo-largo-de-todo-el-ciclo-de-vida-ci-a-cd-post-deploy-y-audit)
14. [Stage 12 — Production Deployment Stage](#14-stage-12--production-deployment-stage)
15. [Stage 13 — Post-Deployment / Monitoring Stage](#15-stage-13--post-deployment--monitoring-stage)
16. [Stage 14 — Cleanup / Teardown Stage](#16-stage-14--cleanup--teardown-stage)
17. [Métricas DORA y métricas del pipeline](#17-métricas-dora-y-métricas-del-pipeline)
18. [Pipeline as Code](#18-pipeline-as-code)
19. [Patrones avanzados](#19-patrones-avanzados)
20. [DevSecOps integrado](#20-devsecops-integrado)
21. [Glosario](#21-glosario)
22. [Fuentes consultadas](#22-fuentes-consultadas)
23. [Orden correcto de stages — Evidencia de fuentes autoritativas (apéndice)](#23-orden-correcto-de-stages--evidencia-de-fuentes-autoritativas-apéndice)
    - [23.3.1 Governance Lifecycle — Los 6 pasos del commit al merge](#2331-governance-lifecycle--los-6-pasos-del-commit-al-merge)
    - [23.3.1.1 Ciclo completo de Governance (7 momentos)](#23311-ciclo-completo-de-governance-7-momentos-commit-a-audit)
    - [23.3.2 Matriz completa de Governance por momento](#2332-matriz-completa-de-governance-por-momento-del-pipeline)
    - [23.6 Coverage Merge Gate (requerido con sharding)](#236-coverage-merge-gate-requerido-con-sharding)
    - [23.7 Rollback Automation Gate (requerido para ERP)](#237-rollback-automation-gate-requerido-para-erp)
    - [23.8 CI vs CD Boundary — Discriminación por Stage](#238-ci-vs-cd-boundary--discriminación-por-stage)
24. [GitHub Actions Enterprise: Patrones de implementación](#24-github-actions-enterprise-patrones-de-implementación)
25. [Supply Chain Security: SLSA, Sigstore, SBOM, NIST SSDF](#25-supply-chain-security-slsa-sigstore-sbom-nist-ssdf)
26. [Métricas DORA 5, Optimización y Costo del Pipeline](#26-métricas-dora-5-optimización-y-costo-del-pipeline)
27. [Progressive Delivery y Costo de Retraso](#27-progressive-delivery-y-costo-de-retraso)
28. [Plantilla completa: CI/CD para project-one (GitHub Actions)](#28-plantilla-completa-cicd-para-project-one-github-actions)
29. [Containerización en CI/CD](#29-containerización-en-cicd)
30. [Kubernetes Deployment Strategies](#30-kubernetes-deployment-strategies)
31. [GitOps](#31-gitops)
32. [Infrastructure as Code en CI/CD](#32-infrastructure-as-code-en-cicd)
33. [Database Migrations en CI/CD](#33-database-migrations-en-cicd)
34. [Secrets Management en Pipeline](#34-secrets-management-en-pipeline)
35. [Environment Management](#35-environment-management)
36. [Testing Avanzado en CI/CD](#36-testing-avanzado-en-cicd)
37. [Compliance y Audit en CI/CD](#37-compliance-y-audit-en-cicd)
38. [Monorepo CI/CD](#38-monorepo-cicd)
39. [Artifact Management](#39-artifact-management)
40. [Pipeline Observability](#40-pipeline-observability)
41. [Estrategias de Branch y Disaster Recovery](#41-estrategias-de-branch-y-disaster-recovery)
42. [Dependency Automation](#42-dependency-automation)
43. [Release Management](#43-release-management)
44. [ChatOps & Notifications](#44-chatops--notifications)
45. [Documentation as Code](#45-documentation-as-code)
46. [Feature Flags Deep Dive](#46-feature-flags-deep-dive)
47. [Self-hosted Runners & Fleet Management](#47-self-hosted-runners--fleet-management)
48. [Multi-region / Edge Deployment](#48-multi-region--edge-deployment)
49. [API Versioning in CI/CD](#49-api-versioning-in-cicd)
50. [AI/ML en CI/CD](#50-aiml-en-cicd-mlops--ai-assisted-development)
51. [Zero-trust CI/CD y OWASP CI/CD Top 10](#51-zero-trust-cicd-y-owasp-cicd-top-10)
52. [Platform Engineering e IDP](#52-platform-engineering-e-internal-developer-platform-idp)
53. [CI/CD Sostenible (Green CI)](#53-cicd-sostenible-green-ci)
54. [Modelo de Madurez CI/CD](#54-modelo-de-madurez-cicd)
55. [Developer Experience (DevEx)](#55-developer-experience-devex-en-cicd)
56. [InnerSource en CI/CD](#56-innersource-en-cicd)
57. [Deployment Serverless](#57-deployment-serverless)
58. [Chaos Engineering en CI/CD](#58-chaos-engineering-en-cicd)
59. [FinOps para CI/CD](#59-finops-para-cicd)
60. [DORA Capabilities Model](#60-dora-capabilities-model)
61. [Pipeline Self-healing](#61-pipeline-self-healing)
62. [Mobile CI/CD](#62-mobile-cicd-iosandroid)
63. [Data Pipeline CI/CD](#63-data-pipeline-cicd)
64. [WebAssembly (WASM) CI/CD](#64-webassembly-wasm-cicd)
65. [Multi-cloud / Hybrid CI/CD](#65-multi-cloud--hybrid-cicd)
66. [Apéndice A: Temas NICE-TO-HAVE (fuera de alcance)](#apéndice-a-temas-nice-to-have-fuera-de-alcance-para-nodeexpress--react-monorepo)

---

## 1. Introducción al CI/CD empresarial

### 1.1 ¿Qué es CI/CD?

CI/CD es la disciplina de **automatizar el camino del código desde el commit hasta la producción** (o hasta la entrega lista para desplegar), aplicando verificaciones automáticas en cada etapa. Se compone de tres prácticas complementarias:

- **Continuous Integration (CI):** integrar el trabajo de todos los desarrolladores en una rama principal (trunk) con alta frecuencia (varias veces al día). Cada integración dispara automáticamente la construcción y la ejecución de pruebas. El objetivo es detectar conflictos y errores de integración **temprano**, cuando son baratos de corregir.
- **Continuous Delivery (CD):** mantener el software **siempre desplegable**. Cada cambio que pasa todas las verificaciones queda listo en un artifact versionado que puede desplegarse a producción con un solo comando/acción manual o automatizada. La entrega (release) es un evento de negocio, no técnico.
- **Continuous Deployment:** la extensión extrema de CD: cada cambio que pasa todas las verificaciones se despliega a producción **automáticamente, sin intervención humana**. Requiere la máxima madurez de testing, observabilidad y rollback.

> **Nota contextual (project-one):** el proyecto actual implementa CI completo + CD con deployment a ECS Fargate desde GitHub Actions, PR como puerta de entrada, preview environments por PR y circuit breaker en el deploy (ver `docs/cicd-estado-actual.md`). La adopción de Continuous Deployment total dependerá de la madurez de las verificaciones automáticas descritas en este documento.

### 1.2 ¿Por qué importa? Evidencia DORA

El informe anual **Accelerate State of DevOps** de DORA (DevOps Research and Assessment) mide el desempeño de entrega de software con 4 métricas clave (lead time, deployment frequency, change failure rate, time to restore). Los hallazgos históricos son contundentes:

- Las organizaciones de alto desempeño despliegan **973 veces más frecuentemente** que las de bajo desempeño.
- Su lead time desde commit hasta deploy es **6.570 veces más rápido**.
- Su tiempo de recuperación tras un fallo (MTTR) es **7 veces más rápido**.
- Su tasa de fallo de cambios (change failure rate) es **3 veces menor** (porcentaje mucho más bajo de cambios que degradan producción).

Fuente: [DORA 2019 Accelerate State of DevOps Report — Google Cloud Blog](https://cloud.google.com/blog/products/devops-sre/dora-2019-accelerate-state-of-devops-report)

El CI/CD maduro es la infraestructura que hace posibles estas cifras: automatización, verificación continua y despliegues de bajo riesgo.

### 1.3 Principios rectores del pipeline empresarial

1. **Shift-left:** mover las verificaciones lo más temprano posible en el ciclo (pre-commit, luego en PR, luego en CI).
2. **Fail fast, fail loud:** el pipeline debe fallar en la etapa más temprana posible y con mensajes claros.
3. **Reproducibilidad:** el mismo commit + configuración debe producir el mismo artifact, siempre.
4. **Artifacts inmutables:** un artifact construido una vez se promueve por los entornos sin reconstruirse.
5. **Trunk-based development:** ramas cortas, integración frecuente, despliegue desde la rama principal.
6. **Verificación progresiva:** cada stage añade confianza; solo avanza lo que pasa los gates.
7. **Observabilidad como parte del pipeline:** métricas de calidad y de entrega (DORA) se registran desde el primer día.
8. **Seguridad integrada (DevSecOps), no añadida al final.**

### 1.4 Componentes de un pipeline empresarial

| Componente                            | Función                                                         |
| ------------------------------------- | --------------------------------------------------------------- |
| Sistema de control de versiones (VCS) | Git (GitHub, GitLab, Bitbucket)                                 |
| Runner / agente CI                    | GitHub Actions, Jenkins, GitLab CI, CircleCI, Buildkite, Tekton |
| Registry de artifacts                 | npm registry, GitHub Packages, Artifactory, ECR, Docker Hub     |
| Gestión de secretos                   | GitHub Secrets, Vault, AWS Secrets Manager, Doppler             |
| Gate de calidad                       | SonarQube, Coverage Thresholds, tests obligatorios              |
| Gate de seguridad                     | SAST/DAST/SCA, firma de artifacts (sigstore/cosign)             |
| Orquestación de deploy                | GitHub Environments, Argo CD, Flux, Spinnaker                   |
| Observabilidad                        | Prometheus, Grafana, Datadog, Sentry, OpenTelemetry             |

---

## 2. Pipeline genérico / visual

### 2.1 Diagrama ASCII del "golden path"

> **Nota:** El orden correcto de stages está respaldado por investigación (ver sección 23). Unit tests, SAST, SCA y lint van ANTES del build porque operan sobre source code. E2E y DAST van DESPUÉS del deploy porque necesitan la app corriendo.

```
┌────────────────────────────────────────────────────────────────────────────┐
│                     PIPELINE CI/CD EMPRESARIAL (golden path)               │
└────────────────────────────────────────────────────────────────────────────┘

 [Commit/PR] → [Pre-commit hooks] → [PRE-BUILD VALIDATE]
       │              (local)          │
       │                ┌──────────────┼──────────────┐
       │                ▼              ▼              ▼
       │          ┌──────────┐  ┌──────────┐  ┌──────────┐
       │          │ TESTING  │  │ SECURITY │  │ QUALITY  │
       │          │ Unit     │  │ SAST     │  │ Lint     │
       │          │ Snapshot │  │ SCA      │  │ Format   │
       │          │          │  │ Secrets  │  │ TypeChk  │
       │          │          │  │ IaC      │  │          │
       │          └────┬─────┘  └────┬─────┘  └────┬─────┘
       │               └──────────────┼──────────────┘
       │                              ▼
       │                     [BUILD (compile)]
       │                              │
       │                ┌─────────────┼─────────────┐
       │                ▼             ▼             ▼
       │          ┌──────────┐ ┌──────────┐ ┌──────────┐
       │          │ TESTING  │ │ SECURITY │ │ ARTIFACT │
       │          │ Integ.   │ │ Container│ │ SBOM     │
       │          │ Contract │ │ Scan     │ │ Sign     │
       │          └────┬─────┘ └────┬─────┘ └────┬─────┘
       │               └─────────────┼─────────────┘
       │                              ▼
       │                     [DEPLOY STAGING]
       │                              │
       │                ┌─────────────┼─────────────┐
       │                ▼             ▼             ▼
       │          ┌──────────┐ ┌──────────┐ ┌──────────┐
       │          │ TESTING  │ │ SECURITY │ │ QUALITY  │
       │          │ E2E      │ │ DAST     │ │ Perf     │
       │          │ UAT      │ │          │ │ A11y     │
       │          └────┬─────┘ └────┬─────┘ └────┬─────┘
       │               └─────────────┼─────────────┘
       │                              ▼
       │                     [APPROVAL / GOV]
       │                              │
       │                              ▼
       │                     [DEPLOY PRODUCTION]
       │                              │
       │                              ▼
       │                     [MONITOR & CLEANUP]
       │                              │
       │                              ▼
       │                     [ROLLBACK if needed]
```

### 2.2 Diagrama Mermaid (renderizable en GitHub)

```mermaid
flowchart LR
    A[Commit / PR] --> B[Pre-commit hooks]
    B --> C[Pre-Build Validate]
    C --> C1[Testing: Unit, Snapshot]
    C --> C2[Security: SAST, SCA, Secrets]
    C --> C3[Quality: Lint, Format, TypeCheck]
    C1 --> D[Build]
    C2 --> D
    C3 --> D
    D --> E[Post-Build Integrate]
    E --> E1[Testing: Integration, Contract]
    E --> E2[Security: Container Scan]
    E1 --> F[Artifact: SBOM, Sign]
    E2 --> F
    F --> G[Deploy Staging]
    G --> H[Post-Deploy Accept]
    H --> H1[Testing: E2E, UAT]
    H --> H2[Security: DAST]
    H --> H3[Quality: Perf, A11y]
    H1 --> I[Approval / Governance]
    H2 --> I
    H3 --> I
    I --> J[Deploy Production]
    J --> K[Monitor & Cleanup]
    J -.Rollback.-> J
```

### 2.3 Vista consolidada de los 14 stages (orden corregido)

> **Nota:** El orden fue corregido según investigación de fuentes autoritativas (sección 23). Las secciones individuales (3-16) describen cada stage en profundidad; el orden aquí refleja la secuencia correcta de ejecución.

| Orden | Stage                    | Categoría | Puerta (gate) principal                          | Entorno típico         |
| ----- | ------------------------ | --------- | ------------------------------------------------ | ---------------------- |
| 1     | Source / Commit          | —         | hooks, firma, políticas de rama                  | Local / VCS            |
| 2     | Code Quality             | QUALITY   | gates de calidad (lint, coverage)                | CI runner              |
| 3     | Security Scanning        | SECURITY  | SAST/SCA/secretos sin hallazgos críticos         | CI runner              |
| 4     | Testing (Unit)           | TESTING   | todas las suites verdes                          | CI runner              |
| 5     | Build                    | —         | compila + dependencias resueltas                 | CI runner              |
| 6     | Integration              | TESTING   | servicios integrados verdes                      | CI runner / shared env |
| 7     | Artifact                 | —         | artifact firmado + SBOM + versionado             | Registry               |
| 8     | Deploy Staging           | —         | deploy exitoso + smoke tests                     | Staging                |
| 9     | Acceptance / UAT         | TESTING   | criterios de aceptación + aprobación humana      | Staging/UAT            |
| 10    | Security (DAST)          | SECURITY  | Dynamic scan sin hallazgos críticos              | Staging                |
| 11    | Performance              | QUALITY   | SLOs de rendimiento cumplidos                    | Performance env        |
| 12    | Approval / Governance    | —         | aprobación + compliance                          | Gate manual/automático |
| 13    | Deploy Production        | —         | estrategia (blue/green, canary) + rollback       | Production             |
| 14    | Post-Deploy / Monitoring | —         | métricas de salud, alertas, MTTD/MTTR            | Production             |
| 15    | Cleanup / Teardown       | —         | recursos efímeros eliminados, costos controlados | Todos                  |

---

## 3. Stage 1 — Source / Commit Stage

> **Nota sobre orden:** Las secciones 3-16 describen cada stage en profundidad. El **orden correcto de ejecución** (con evidencia de fuentes autoritativas) está definido en la sección 23 y en la tabla 2.3. En resumen: Code Quality, Security Scanning y Testing (unit) van ANTES del Build; Integration va después del Build; Acceptance/DAST van después del Deploy a Staging.

### 3.1 Descripción

Es la **puerta de entrada** del pipeline. Todo empieza en el sistema de control de versiones: convenciones de commits, ramas, firmas y políticas de protección. Aquí se aplican las verificaciones más baratas posibles, idealmente **antes** de que el código llegue al runner de CI (pre-commit) y en el momento del PR.

### 3.2 Objetivo de negocio

- Reducir el costo de corrección: detectar errores triviales en segundos, en la máquina del desarrollador, en vez de minutos/horas después en CI.
- Mantener un historial legible y auditable (convenciones de commits, autoría, trazabilidad con issues).
- Evitar que código mal formado, con secretos o sin firmar ingrese al repositorio.

### 3.3 Prácticas recomendadas (exhaustivo)

1. **Conventional Commits:** mensajes con formato `tipo(alcance): descripción` (ej. `feat(auth): agregar refresh tokens`). Tipos estándar: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`. Permite generar changelogs y versionados automáticos. Fuente: [conventionalcommits.org](https://www.conventionalcommits.org/)
2. **Versionado Semántico (SemVer):** `MAJOR.MINOR.PATCH` con reglas de compatibilidad (breaking change = MAJOR, nueva feature retrocompatible = MINOR, bugfix = PATCH). Fuente: [semver.org](https://semver.org/)
3. **Pre-commit hooks (Husky + lint-staged):** ejecutar en local antes del commit: linter (ESLint), formateador (Prettier), type-check (tsc), y **escaneo de secretos (Gitleaks)**. `lint-staged` limita la ejecución a los archivos modificados para mantenerla rápida.
4. **Commitlint:** validar el formato del mensaje de commit en el hook `commit-msg` (fails fast si no cumple Conventional Commits).
5. **Firma de commits:** firmar commits y tags con SSH/Sigstore/GPG. GitHub lo soporta nativamente y permite verificar identidad. Fuente: [About commit signature verification — GitHub Docs](https://docs.github.com/en/authentication/managing-commit-signature-verification/about-commit-signature-verification)
6. **Protected branches:** la rama principal protegida: requiere PR, revisiones aprobatorias, checks obligatorios verdes, sin push directo, sin force-push, actualización de la rama (draft) y administradores sujetos a las mismas reglas. Fuente: [About protected branches — GitHub Docs](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches)
7. **Branch policies:** ramas cortas y descriptivas (`fix/login-token-expiry`), con vinculación a issues/tickets cuando aplique (trazabilidad).
8. **Merge queues:** en equipos grandes, encolar PRs listos para integrarlos secuencialmente contra la rama actualizada, evitando que CI se ejecute en código obsoleto. Fuente: [About merge queues — GitHub Docs](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-merge-queue/about-merge-queues)
9. **Dependabot / Renovate:** PRs automáticos de actualización de dependencias (npm/pip/maven), incluyendo alertas de seguridad (GitHub Dependabot alerts y dependency review).
10. **CODEOWNERS:** asignar revisores responsables por directorio/dominio (ej. `apps/server/` a los dueños del backend).
11. **Branch naming enforcement:** scripts/CI que validan el nombre de rama y el formato del PR (template de PR con checklist de QA).
12. **Secret scanning en PR:** GitHub secret scanning y Gitleaks en CI para detectar credenciales filtradas antes del merge.
13. **Trunk-based development:** commits pequeños y frecuentes directamente o vía PR cortos hacia `main`; evitar ramas largas y merges masivos. Fuente: [Trunk Based Development](https://trunkbaseddevelopment.com/)
14. **Zero-downtime de repositorio:** `main` siempre debe estar en estado desplegable (green). Prohibir merges que rompan la rama principal.
15. **Large-file guard:** prevenir la adición de archivos binarios grandes (>500KB) o de tipos no permitidos (_.zip, _.exe, \*.jar) al repositorio. Se implementa como pre-commit hook o check en CI que rechaza el commit si detecta archivos que exceden el umbral de tamaño. Herramientas: `git-secrets`, custom scripts con `git diff --cached --name-only --diff-filter=A` + `wc -c`, o LFS para assets grandes legítimos (imágenes, videos). Evita la degradación del historial de Git y tiempos de clone excesivos.
16. **Pre-push hooks — scoped tests:** ejecutar un subconjunto rápido de tests antes del push (no el suite completo). El hook `pre-push` de Husky ejecuta solo los tests afectados por los archivos modificados (`vitest --changed` o scripts con `git diff --name-only HEAD@{1}`), proporcionando feedback antes de que CI consuma recursos. Diferencia con pre-commit: pre-push corre tests (más lento que lint, pero más barato que CI completo). Si el developer trabaja offline, CI actúa como fallback obligatorio (defense-in-depth).

### 3.4 Herramientas comunes

| Categoría         | Herramientas                                                               |
| ----------------- | -------------------------------------------------------------------------- |
| Hooks locales     | Husky, pre-commit, lefthook                                                |
| Lint de commits   | commitlint, commitizen                                                     |
| Secretos          | Gitleaks, trufflehog, detect-secrets, GitHub secret scanning               |
| Políticas de rama | GitHub branch protection, GitLab protected branches, Azure branch policies |
| Dependencias      | Dependabot, Renovate, Snyk                                                 |
| Firmas            | GPG, SSH signing, Sigstore                                                 |

### 3.5 Mejores prácticas

- Ejecutar pre-commit en local **y** en CI (nunca confiar solo en lo local).
- Mensajes de commit legibles por humanos y por máquinas (habilitan changelog automático).
- Revisión de PR con checklist (ver `docs/code-review-checklist.md` en project-one).
- Medir y reportar el tiempo desde commit hasta merge (una de las métricas DORA: lead time).

### 3.6 Errores comunes (anti-patrones)

- Push directo a `main` sin PR ni revisión.
- PRs gigantes (miles de líneas) que nadie puede revisar de verdad.
- Mensajes de commit sin contexto (`fix`, `update`, `wip`).
- Confiar en el pre-commit hook local como único gate (los desarrolladores pueden saltárselo con `--no-verify`; el CI debe re-verificar).
- Ramas de larga duración que divergen y producen conflictos masivos al mergear.
- Secretos commiteados por error (el anti-patrón más caro: rotación de credenciales + historial reescrito).

### 3.7 Métricas recomendadas

- % de commits que cumplen Conventional Commits (objetivo: ~100%).
- Lead time for changes (DORA): tiempo desde commit hasta deploy.
- Número de PRs mergeados sin revisión aprobatoria (debe ser 0).
- Tiempo medio de revisión de PR.
- Incidentes de secretos filtrados (debe ser 0).

### 3.8 Fuentes

- https://www.conventionalcommits.org/
- https://semver.org/
- https://docs.github.com/en/authentication/managing-commit-signature-verification/about-commit-signature-verification
- https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches
- https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-merge-queue/about-merge-queues
- https://trunkbaseddevelopment.com/
- https://gitleaks.io/

### 3.9 Ejemplo práctico — GitHub Actions

```yaml
# .github/workflows/commit-checks.yml
# Stage 1: Validación de commits y detección de secretos
name: Commit Checks

on:
  pull_request:
    branches: [main]

permissions:
  contents: read
  pull-requests: write

jobs:
  commit-lint:
    name: Lint Commit Messages
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683 # v4.2.2
        with:
          fetch-depth: 0 # Necesario para acceder a todos los commits del PR
      - uses: actions/setup-node@49933ea5288caeca8642d1e84afbd3f7d6820020 # v4.4.0
        with:
          node-version-file: '.nvmrc'
      - run: npm ci
      - run: npx commitlint --from ${{ github.event.pull_request.base.sha }} --to ${{ github.event.pull_request.head.sha }} --verbose

  secret-scan:
    name: Detect Secrets
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683 # v4.2.2
        with:
          fetch-depth: 0
      - uses: gitleaks/gitleaks-action@952e542951b4928d37bfd72cd538f71396aea71e # v2.3.3
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}

  dependency-review:
    name: Dependency Review
    runs-on: ubuntu-latest
    if: github.event_name == 'pull_request'
    steps:
      - uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683 # v4.2.2
      - uses: actions/dependency-review-action@da24556b548a50705dd671f47852072ea4c105d9 # v4.6.0
        with:
          fail-on-severity: high
          comment-summary-in-pr: always
```

---

## 4. Stage 2 — Build / Compile Stage

### 4.1 Descripción

El stage de build toma el código fuente verificado y produce **artifacts de construcción**: bundles, binarios, imágenes Docker, paquetes npm, etc. Es el primer punto donde el pipeline puede fallar por errores de compilación, dependencias rotas o configuración incorrecta. En un monorepo como project-one, el build puede ser por workspace (client, server, e2e).

### 4.2 Objetivo de negocio

- Garantizar que el código compila y produce un artifact utilizable.
- Establecer la **reproducibilidad**: mismo commit, mismo artifact (incluso meses después).
- Detectar errores de dependencias (resolución, versiones, plataformas) tempranamente.

### 4.3 Prácticas recomendadas (exhaustivo)

1. **Lockfiles versionados:** `package-lock.json` / `yarn.lock` / `pnpm-lock.yaml` en el repositorio, con instalación reproducible (`npm ci` en CI en vez de `npm install`).
2. **Caché de dependencias:** `actions/cache` (GitHub Actions) o caché nativo del runner para node_modules y caché de npm/pnpm, reduciendo el tiempo de build drásticamente. Fuente: [Caching dependencies — GitHub Docs](https://docs.github.com/en/actions/using-workflows/caching-dependencies-to-speed-up-workflows)
3. **Build determinista:** evitar timestamps embebidos, rutas absolutas, números de versión inyectados aleatoriamente. Usar `--frozen-lockfile`, y considerar determinismo de builds de Vite/esbuild (production build minificado).
4. **Type-check estricto:** `tsc --noEmit` para TypeScript como gate previo al bundle (en project-one: client y server son TypeScript).
5. **Build matrix:** compilar/probar en múltiples versiones de Node (LTS + actual) y OS si aplica (Linux/macOS/Windows) para detectar incompatibilidades de plataforma.
6. **Build por workspace:** en monorepos, construir solo los paquetes afectados (detección de cambios: `turbo`, `nx`, o scripts custom con `git diff`), para CI rápido.
7. **Imágenes de contenedor multi-stage:** si se empaqueta en Docker, usar builds multi-stage (build → runtime) con imágenes base distroless/alpine minimalistas; etiquetar con SHA del commit + tag semver.
8. **SBOM temprana:** generar la lista de dependencias (CycloneDX/SPDX) en el build para trazabilidad de supply chain (ver Stage 6 Artifact / Packaging).
9. **Fail fast en dependencias:** comprobar integridad (checksums), rechazar versiones pinneadas a rangos no exactos para producción.
10. **Paralelización:** dividir el build en jobs paralelos independientes (lint, typecheck, unit, build) con pasos combinables (concurrency groups, dependencias entre jobs).
11. **Tree-shaking verification:** verificar que el bundler (Vite/Rollup/esbuild) elimina correctamente código no utilizado del bundle de producción. El tree-shaking es una optimización que elimina imports no referenciados; si falla, el bundle crece innecesariamente. Verificar: (a) analizar el bundle con `rollup-plugin-visualizer` o `webpack-bundle-analyzer` para identificar módulos grandes no esperados; (b) usar `size-limit` para comparar tamaño del bundle contra un threshold; (c) verificar que no haya `sideEffects: false` ausente en package.json de dependencias (impide el tree-shaking). En CI: ejecutar como step post-build y comparar contra baseline.

### 4.4 Herramientas comunes

| Categoría             | Herramientas                                 |
| --------------------- | -------------------------------------------- |
| Gestión de paquetes   | npm, pnpm, Yarn, Bun                         |
| Bundlers              | Vite, esbuild, webpack, Rollup, tsc          |
| Build de contenedores | Docker BuildKit, buildah, kaniko, Buildx     |
| Caché CI              | actions/cache, GitLab cache, CircleCI cache  |
| Monorepo builds       | Turborepo, Nx, pnpm workspaces               |
| SBOM                  | Syft, CycloneDX CLI, Trivy (también escanea) |

### 4.5 Mejores prácticas

- Instalar dependencias con `npm ci` (o equivalente frozen) en CI — nunca `npm install`.
- Etiquetar los artifacts con el SHA completo del commit para trazabilidad exacta.
- Mantener el build de producción y el de desarrollo separados; el artifact que se despliega es el de producción.
- Hacer el build reproducible en local: `npm ci && npm run build` debe funcionar idéntico en CI y local.

### 4.6 Errores comunes (anti-patrones)

- `npm install` en CI (no reproducible; puede resolver versiones distintas).
- Cachear en exceso: caché corrupta que produce falsos verdes (limpiar caché periódicamente).
- Build que depende del estado de la máquina del desarrollador (funciona en local, falla en CI).
- Subir dependencias sin lockfile (resultado no determinista).
- Artefactos no versionados o sin metadatos (imposible rastrear qué código generó qué binario).

### 4.7 Métricas recomendadas

- Tiempo total del build (objetivo: < 5-10 min; tendencia a la baja).
- Tasa de éxito del build (objetivo: > 95-98%).
- % de builds reproducibles (verificados por hash).

### 4.8 Fuentes

- https://docs.github.com/en/actions/using/workflows/using-github-cli-in-workflows (build context) — mejor: https://docs.github.com/en/actions/using-workflows/caching-dependencies-to-speed-up-workflows
- https://docs.docker.com/build/building/multi-stage/
- https://cyclonedx.org/
- https://syft/anchore — https://github.com/anchore/syft

### 4.9 Ejemplo práctico — GitHub Actions

```yaml
# .github/workflows/build.yml
# Stage 2: Build del monorepo con cache de npm y build incremental
name: Build

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

permissions:
  contents: read

jobs:
  build:
    name: Build All Workspaces
    runs-on: ubuntu-latest
    strategy:
      matrix:
        workspace: [apps/server, apps/client]
    steps:
      - uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683 # v4.2.2

      - uses: actions/setup-node@49933ea5288caeca8642d1e84afbd3f7d6820020 # v4.4.0
        with:
          node-version-file: '.nvmrc'
          cache: 'npm'

      - run: npm ci
        env:
          NODE_OPTIONS: '--max-old-space-size=4096'

      - name: Build ${{ matrix.workspace }}
        run: npm run build --workspace=${{ matrix.workspace }}

      - name: Prisma Generate (server only)
        if: matrix.workspace == 'apps/server'
        run: npx prisma generate --schema=apps/server/prisma/schema.prisma

      - name: Upload build artifacts
        uses: actions/upload-artifact@ea165f8d65b6e75b540449e92b4886f43607fa02 # v4.6.2
        with:
          name: build-${{ matrix.workspace }}
          path: ${{ matrix.workspace }}/dist/
          retention-days: 7
```

---

## 5. Stage 3 — Code Quality / Static Analysis Stage

### 5.1 Descripción

Este stage aplica **análisis estático de calidad** sobre el código: estilo, reglas de lint, complejidad, duplicación, cobertura de pruebas y mantenibilidad. Es distinto del análisis de seguridad (Stage 4), aunque ambos son "estáticos" en el sentido de no ejecutar la aplicación. Se ejecuta automáticamente en cada PR y de forma completa en cada merge.

### 5.2 Objetivo de negocio

- Mantener la **deuda técnica controlada** y el código mantenible a largo plazo.
- Estandarizar el estilo sin fricción (el formateador elimina debates de estilo).
- Reducir defectos futuros: la complejidad y la duplicación se correlacionan con más bugs.

### 5.3 Prácticas recomendadas (exhaustivo)

1. **Linter con reglas de equipo:** ESLint (con `typescript-eslint` para TS) con reglas de calidad, no solo de estilo; reglas de accesibilidad (eslint-plugin-jsx-a11y) para frontend.
2. **Formateador automático:** Prettier (integración con editor, `pre-commit`, y check en CI `--check`).
3. **TypeScript strict mode:** `strict: true` y reglas adicionales de `noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch`; forbid `any` implícito.
4. **Análisis estático avanzado (SonarQube/SonarCloud):** bugs, code smells, vulnerabilidades, duplicación, cobertura. Quality Gates configurables (ej. coverage mínima, 0 bugs críticos/bloqueantes).
5. **Coverage tripwire (floor ratchet, no gate primario):** Vitest `coverage.thresholds` con el v8 provider como tripwire de piso absoluto — no como quality gate. c8/V8 instrumenta source en runtime (NODE_V8_COVERAGE) sin necesidad de build, así que los datos de cobertura son un byproduct casi gratuito del unit-test run. Configurar: `coverage.include` explícito (Vitest 4 eliminó `coverage.all`), `autoUpdate: false` (nunca dejar que CI reescriba el piso), threshold bajo como tripwire (ej. 60% global) para atrapar abandono catastrófico (módulo nuevo con 0 tests). **El gate de cobertura AUTORITATIVO es STAGE 4** — SonarQube quality gate sobre **new-code coverage** (≥80% en código nuevo, "Clean as You Code"), no sobre el global absoluto que es ruidoso y gameable (refactors, deletions, shallow tests). Si unit tests pasan pero coverage es bajo, **build de todas formas pero no merge** — coverage es gate de merge/release, no de build. El artifact es necesario para integration/E2E downstream. Ver §36.3 para detalles.
6. **Análisis de complejidad:** ciclomática por función/método, profundidad de anidamiento, límite de líneas por función. **PRE-Build:** ESLint `complexity`/`max-lines-per-rule` reglas (source-level, sin build). **POST-Build:** SonarQube/SonarCloud análisis completo (cyclomatic, cognitive, MI, Halstead) — requiere build artifact + datos de cobertura de test para métricas precisas (§23.3 STAGE 4).
7. **Detector de duplicación (POST-Build):** la detección de código duplicado pertenece al stage post-build (STAGE 4) porque SonarQube — la herramienta principal — requiere el artifact compilado y datos de cobertura para análisis preciso. **SonarQube/SonarCloud** detecta duplicación a nivel de líneas (cross-file) y bloques duplicados, generando métricas de `duplicated_lines_density`. **jscpd** puede ejecutarse como check rápido pre-build (language-agnostic, parsea AST sin compilar) como indicador temprano, pero el análisis definitivo es post-build. En monorepos, la duplicación cross-workspace es un problema frecuente — refactorizar duplicados a helpers/compartidos compartidos. Ver §36.3 para la explicación completa y §23.3 STAGE 4.
8. **Check de formato en CI:** `prettier --check` falla el pipeline si hay archivos sin formatear.
9. **Quality gate en PR:** comentar el estado del análisis en el PR (SonarQube PR analysis, CodeQL PR comments), bloqueando el merge si el gate no pasa.
10. **Reglas de dependencias (import boundaries):** prohibir imports cruzados indebidos (ej. `apps/server` importando código de `apps/client`) con ESLint `import/no-restricted-paths` o herramientas como dependency-cruiser.
11. **Análisis de tipos en el PR:** el type-check corre en el stage de build; aquí se puede añadir `tsc --noEmit --incremental` con caché.
12. **Dead code detection:** knip, ts-prune (detectar exports/módulos no usados).
13. **Docs generadas:** JSDoc/TSDoc review automático (ver `docs/jsdoc-review-checklist.md` en project-one).
14. **Baseline y evolución:** fijar la deuda actual como baseline y exigir que las métricas no empeoren (quality trend en el PR).
15. **PR Review Automation:** herramientas de revisión automática de código que analizan cada PR y comentan sugerencias de calidad, bugs potenciales, vulnerabilidades y code smells directamente en el pull request. Herramientas principales: DeepSource (análisis estático multi-lenguaje con auto-fix), CodeRabbit (AI-powered review que comenta en el PR con explicaciones), SonarQube PR Analysis (quality gate comentado en el PR). Ventaja: feedback inmediato sin esperar un reviewer humano; el reviewer se enfoca en lógica de negocio mientras la herramienta cubre calidad estática. Desventaja: falsos positivos que generan ruido; requiere calibración de reglas para evitar alert fatigue.
16. **Dependency Analysis (POST-Build):** detección de dependencias no utilizadas (unused) y faltantes (missing) con `depcheck`. Ver §36.3 item 13 para la explicación completa.

### 5.4 Herramientas comunes

| Categoría               | Herramientas                                          |
| ----------------------- | ----------------------------------------------------- |
| Lint                    | ESLint, typescript-eslint, stylelint (CSS)            |
| Formato                 | Prettier, dprint                                      |
| Análisis estático       | SonarQube / SonarCloud, Codacy, CodeClimate           |
| Complejidad/duplicación | jscpd, SonarQube, ESLint complexity                   |
| Dead code               | knip, ts-prune                                        |
| Dependency analysis     | depcheck                                              |
| Import boundaries       | dependency-cruiser, eslint import/no-restricted-paths |
| Coverage                | Vitest/V8, Istanbul/nyc, c8                           |

### 5.5 Mejores prácticas

- Automatizar todo lo automatizable: el CI debe ser el árbitro final de estilo y calidad.
- Configuración de lint/format versionada en el repo (`.eslintrc`, `prettier.config`, `eslint.config.js` flat config en ESLint 9+).
- Quality gates acordes al riesgo: frontend y backend pueden tener umbrales distintos.
- El análisis completo (Sonar) corre en `main`; el análisis incremental corre en PRs (más rápido).

### 5.6 Errores comunes (anti-patrones)

- Lint solo en local (o con `--no-verify`), sin gate en CI.
- Reglas de lint desactivadas masivamente (`/* eslint-disable */` sin justificación).
- Cobertura alta pero vacía (tests que no asertan nada — ver Stage 5 Testing).
- Umbrales de calidad tan bajos que no filtran nada, o tan altos que paralizan el equipo.
- Herramientas de análisis en modo "solo reporte" sin bloquear el merge.

### 5.7 Métricas recomendadas

- Cobertura de líneas y ramas por suite (target por servicio).
- Tiempo de resolución de code smells críticos/bloqueantes.
- Density de duplicación (%).
- Complejidad ciclomática media por función.
- % de PRs que pasan el quality gate sin excepciones.

### 5.8 Fuentes

- https://eslint.org/
- https://prettier.io/
- https://www.sonarsource.com/products/sonarqube/
- https://www.typescriptlang.org/tsconfig
- https://vitest.dev/guide/coverage
- https://github.com/david-04/knip — https://knip.dev/

### 5.9 Ejemplo práctico — GitHub Actions

```yaml
# .github/workflows/quality.yml
# Stage 3: Lint, format, typecheck y cobertura
name: Code Quality

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

permissions:
  contents: read

jobs:
  lint:
    name: ESLint
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683 # v4.2.2
      - uses: actions/setup-node@49933ea5288caeca8642d1e84afbd3f7d6820020 # v4.4.0
        with:
          node-version-file: '.nvmrc'
          cache: 'npm'
      - run: npm ci
      - run: npm run lint

  format:
    name: Prettier Check
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683 # v4.2.2
      - uses: actions/setup-node@49933ea5288caeca8642d1e84afbd3f7d6820020 # v4.4.0
        with:
          node-version-file: '.nvmrc'
          cache: 'npm'
      - run: npm ci
      - run: npx prettier --check "**/*.{ts,tsx,json,md}"

  typecheck:
    name: TypeScript Check
    runs-on: ubuntu-latest
    strategy:
      matrix:
        workspace: [apps/server, apps/client]
    steps:
      - uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683 # v4.2.2
      - uses: actions/setup-node@49933ea5288caeca8642d1e84afbd3f7d6820020 # v4.4.0
        with:
          node-version-file: '.nvmrc'
          cache: 'npm'
      - run: npm ci
      - name: Typecheck ${{ matrix.workspace }}
        run: npx tsc --noEmit --project ${{ matrix.workspace }}/tsconfig.json

  coverage:
    name: Test Coverage
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683 # v4.2.2
      - uses: actions/setup-node@49933ea5288caeca8642d1e84afbd3f7d6820020 # v4.4.0
        with:
          node-version-file: '.nvmrc'
          cache: 'npm'
      - run: npm ci
      - run: npx vitest run --coverage --reporter=lcov
        env:
          DATABASE_URL: 'postgresql://postgres:postgres@localhost:5432/testdb'
      - uses: codecov/codecov-action@18283e04ce6e62d37312384ff67ab3f971f18f48 # v5.4.3
        with:
          files: ./coverage/lcov.info
          fail_ci_if_error: false
```

---

## 6. Stage 4 — Security Scanning Stage (DevSecOps)

### 6.1 Descripción

El stage de seguridad aplica **escaneo automático** sobre el código y las dependencias en cada PR/commit. Es la materialización del principio _shift-left_ aplicado a la seguridad: detectar vulnerabilidades cuando son baratas de corregir, antes de producción. Se integra con el framework OWASP (Top 10 y DevSecOps Guideline).

### 6.2 Objetivo de negocio

- Reducir la superficie de ataque y el riesgo de incidentes de seguridad.
- Cumplir requisitos de compliance y auditoría (trazabilidad de escaneos, informes, evidencia).
- Evitar que vulnerabilidades conocidas lleguen a producción (supply chain security).

### 6.3 Prácticas recomendadas (exhaustivo)

1. **SAST (Static Application Security Testing):** analiza el código fuente sin ejecutarlo en busca de patrones inseguros (SQLi, XSS, inyección, deserialización insegura). Ejemplos: Semgrep, CodeQL, SonarQube (security rules), ESLint security plugins. Fuente: [CodeQL — GitHub](https://codeql.github.com/), [Semgrep](https://semgrep.dev/)
2. **DAST (Dynamic Application Security Testing):** ejecuta la aplicación y la ataca con peticiones maliciosas contra el entorno staging/preview. Ejemplos: OWASP ZAP, Burp Suite, GitLab DAST. Se ejecuta típicamente tras el deploy a staging.
3. **SCA (Software Composition Analysis):** analiza las dependencias de terceros contra bases de datos de vulnerabilidades (CVE) y licencias. Ejemplos: Dependabot, Snyk, Trivy, `npm audit`. Fuente: [About dependency review — GitHub Docs](https://docs.github.com/en/code-security/supply-chain-security/understanding-your-software-supply-chain/about-dependency-review)
4. **IAST (Interactive Application Security Testing):** instrumenta la aplicación y detecta vulnerabilidades durante la ejecución de pruebas funcionales (Contrast Security, Checkmarx IAST). Complementa SAST/DAST con contexto real.
5. **Secret scanning:** Gitleaks (pre-commit + CI), GitHub secret scanning (repositorio y PRs), detect-secrets, trufflehog. Bloquea el merge si se detecta un secreto.
6. **Container scanning:** escanear imágenes Docker por vulnerabilidades del sistema base y dependencias (Trivy, Grype, Snyk, Anchore, Scan de Docker Hub). Idealmente dentro del stage de artifact (post-build, después de Build).
7. **IaC scanning:** analizar Terraform/CloudFormation/Kubernetes manifests en busca de configuraciones inseguras (Checkov, tfsec, Terrascan, KICS). Fuente: [Checkov](https://www.checkov.io/), [tfsec (archivado, reemplazado por Trivy IaC)](https://github.com/aquasecurity/tfsec)
8. **Supply chain hardening — SLSA:** aplicar el framework Supply-chain Levels for Software Artifacts (niveles 1-4) para garantizar integridad y procedencia. Fuente: [slsa.dev](https://slsa.dev/) y [SLSA Spec v1.2](https://slsa.dev/spec/v1.2)
9. **Firma de artifacts — Sigstore/cosign:** firmar imágenes y artifacts; verificar firma antes del deploy. Fuente: [Sigstore Docs](https://docs.sigstore.dev/), [slsa-github-generator](https://github.com/slsa-framework/slsa-github-generator)
10. **Hardening del runner (GitHub Actions):** restringir permisos de tokens (read-only por defecto), usar OIDC en vez de secretos de larga duración, pin de acciones a SHA, revisar acciones de terceros, entornos separados. Fuente: [Security hardening for GitHub Actions](https://docs.github.com/en/actions/security-guides/security-hardening-for-github-actions), [Using OpenID Connect with GitHub Actions](https://docs.github.com/en/actions/security-guides/using-openid-connect-with-github-actions)
11. **SARIF reporting:** subir resultados de escaneos en formato SARIF a GitHub code scanning para visualización centralizada. Fuente: [SARIF support for code scanning](https://docs.github.com/en/actions/security-guides/sarif-support-for-code-scanning)
12. **Dependency review en PR:** GitHub dependency review muestra qué dependencias nuevas se añaden en un PR y si tienen vulnerabilidades conocidas.
13. **OWASP Top 10 como checklist:** verificar cada release contra los riesgos Top 10 (A01 broken access control, A03 injection, A07 auth failures, etc.). Fuente: [OWASP Top 10](https://owasp.org/Top10/)
14. **DevSecOps Guideline (OWASP):** integrar seguridad en todo el ciclo con responsabilidades compartidas. Fuente: [OWASP DevSecOps Guideline](https://owasp.org/www-project-devsecops-guideline/)
15. **Política de severidad:** definir gates: 0 vulnerabilidades críticas/altas sin excepción documentada; automatizar bloqueo con Snyk/Semgrep rules.
16. **Fuzz Testing:** técnica de testing de seguridad que genera inputs aleatorios o mutados para encontrar crashes, memory leaks y vulnerabilidades no descubiertas por SAST/DAST. Se ejecuta contra APIs (REST/GraphQL), parsers de archivos, binarios y protocolos. Herramientas: OSS-Fuzz (Google, fuzzing continuo open-source), AFL++ (fuzzer compile-time instrumentation), GitLab CI/CD Fuzzing (integración nativa), libFuzzer (fuzzing lib). Configurar en CI como job post-build con tiempo límite (ej. 30 min fuzzing por suite). Idealmente ejecutar en nightly builds por el costo computacional. Fuente: [OSS-Fuzz](https://google.github.io/oss-fuzz/)
17. **API Security Testing — BOLA/IDOR:** prueba específica de Broken Object Level Authorization (BOLA, antes IDOR) y Broken Function Level Authorization (BFLA), las vulnerabilidades #1 y #5 del OWASP API Security Top 10. Herramientas: 42Crunch (API security testing), OWASP ZAP API scan (Active Scan contra endpoints), Schemathesis (fuzzing basado en OpenAPI spec). Verificar que un usuario autenticado no pueda acceder a recursos de otro usuario manipulando IDs en la URL/body. Ejecutar contra staging después del deploy. Fuente: [OWASP API Security Top 10](https://owasp.org/API-Security/)
18. **CNAPP Runtime Posture (Cloud-Native Application Protection Platform):** monitoreo continuo de la postura de seguridad en runtime en entornos cloud. Combina CSPM (Cloud Security Posture Management) + CWPP (Cloud Workload Protection) + CIEM (Cloud Infrastructure Entitlement Management). Herramientas: Prisma Cloud (Palo Alto), Wiz, Falco (runtime threat detection para Kubernetes), Aqua Security. Detecta: contenedores con permisos excesivos, imágenes vulnerables desplegadas, drift de configuración, acceso no autorizado a servicios. Se integra como check post-deploy o como monitoreo continuo en STAGE 11.
19. **Misconfiguration scan (post-deploy):** escaneo de la infraestructura desplegada para detectar configuraciones inseguras que IaC scanning no captura (porque se detectan después del apply). Herramientas: ScoutSuite (multi-cloud security auditing), Prowler (AWS/Azure/GCP security assessments), AWS Config Rules (reglas de compliance continuo). Ejemplo: un S3 bucket abierto después de un Terraform apply manual, un Security Group con reglas 0.0.0.0/0, un RDS sin encryption. Ejecutar periódicamente (cron diario/semanal) y como post-deploy validation. Diferente de IaC scanning (pre-deploy) — esta es validación del estado real en la nube.

### 6.4 Herramientas comunes

| Categoría    | Herramientas                                |
| ------------ | ------------------------------------------- |
| SAST         | Semgrep, CodeQL, SonarQube, ESLint security |
| DAST         | OWASP ZAP, Burp Suite, GitLab DAST          |
| SCA          | Dependabot, Snyk, npm audit, Trivy, Grype   |
| Secretos     | Gitleaks, trufflehog, detect-secrets        |
| Contenedores | Trivy, Grype, Anchore, Clair                |
| IaC          | Checkov, tfsec, Terrascan, KICS             |
| Supply chain | SLSA, Sigstore/cosign, in-toto              |
| Gestión      | DefectDojo, GitHub code scanning, SARIF     |

### 6.5 Mejores prácticas

- Shift-left: escaneos baratos en pre-commit, escaneos completos en PR, escaneos periódicos (cron semanal) para deuda acumulada.
- Escanear también los cambios de infraestructura (IaC), no solo el código de aplicación.
- Nunca desplegar un artifact no firmado o sin SBOM (política de supply chain).
- Mantener las dependencias al día (Dependabot/Renovate) para reducir el ruido de alertas.
- Triaje de alertas: automatizar la clasificación y escalar solo lo que es explotable en contexto.

### 6.6 Errores comunes (anti-patrones)

- Escaneos en modo "solo informe" que nunca bloquean nada.
- Falsos positivos ignorados sin triaje: generan ruido y desensibilizan al equipo.
- Secretos en variables de entorno del CI (usar secret stores / OIDC).
- Dependencias con años de CVE sin actualizar (deuda de seguridad).
- Escaneo de contenedores solo al final, tras el deploy (demasiado tarde).
- Confiar en el escaneo de GitHub sin firmar la cadena (attestation).

### 6.7 Métricas recomendadas

- Número de vulnerabilidades críticas/altas abiertas (target: 0 críticas).
- Time to fix de vulnerabilidades (SLAs por severidad).
- % de PRs escaneados (target 100%).
- Cobertura de escaneos: código, contenedores, IaC, dependencias.
- SBOMs generados y firmados por release (target 100%).

### 6.8 Fuentes

- https://owasp.org/www-project-devsecops-guideline/
- https://owasp.org/Top10/
- https://docs.github.com/en/actions/security-guides/security-hardening-for-github-actions
- https://docs.github.com/en/actions/security-guides/using-openid-connect-with-github-actions
- https://docs.github.com/en/actions/security-guides/sarif-support-for-code-scanning
- https://docs.github.com/en/code-security/supply-chain-security/understanding-your-software-supply-chain/about-dependency-review
- https://slsa.dev/ y https://slsa.dev/spec/v1.2
- https://docs.sigstore.dev/
- https://github.com/slsa-framework/slsa-github-generator
- https://semgrep.dev/ | https://codeql.github.com/ | https://gitleaks.io/
- https://www.checkov.io/ | https://github.com/aquasecurity/tfsec

### 6.9 Ejemplo práctico — GitHub Actions

```yaml
# .github/workflows/security.yml
# Stage 4: SAST, SCA, secret scanning y dependency review
name: Security Scanning

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]
  schedule:
    - cron: '0 6 * * 1' # Escaneo semanal completo

permissions:
  contents: read
  security-events: write # Para subir SARIF a GitHub Code Scanning

jobs:
  semgrep:
    name: Semgrep SAST
    runs-on: ubuntu-latest
    container:
      image: semgrep/semgrep
    steps:
      - uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683 # v4.2.2
      - run: semgrep scan --config .semgrep/ --sarif --output semgrep.sarif .
        env:
          SEMGREP_RULES: 'p/default p/javascript p/typescript'
      - uses: github/codeql-action/upload-sarif@v3
        with:
          sarif_file: semgrep.sarif

  dependency-scan:
    name: Dependency Audit
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683 # v4.2.2
      - uses: actions/setup-node@49933ea5288caeca8642d1e84afbd3f7d6820020 # v4.4.0
        with:
          node-version-file: '.nvmrc'
          cache: 'npm'
      - run: npm ci
      - name: Audit production dependencies
        run: npm audit --audit-level=high --omit=dev
      - name: Audit all dependencies
        run: npm audit --audit-level=critical

  secret-scan:
    name: Gitleaks
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683 # v4.2.2
        with:
          fetch-depth: 0
      - uses: gitleaks/gitleaks-action@952e542951b4928d37bfd72cd538f71396aea71e # v2.3.3
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}

  sbom:
    name: Generate SBOM
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683 # v4.2.2
      - uses: actions/setup-node@49933ea5288caeca8642d1e84afbd3f7d6820020 # v4.4.0
        with:
          node-version-file: '.nvmrc'
          cache: 'npm'
      - run: npm ci
      - name: Install Syft
        uses: anchore/sbom-action/download-syft@v0
      - run: syft dir:. -o spdx-json=sbom.spdx.json -o cyclonedx-json=sbom.cdx.json
      - uses: actions/upload-artifact@ea165f8d65b6e75b540449e92b4886f43607fa02 # v4.6.2
        with:
          name: sbom
          path: sbom.*.json
          retention-days: 90
```

---

## 7. Stage 5 — Testing Stage

### 7.1 Descripción

El stage de testing es el **corazón del CI**: ejecuta las suites de pruebas que verifican que el código hace lo que debe. En un pipeline empresarial se aplica la **pirámide de testing** (test pyramid): muchas pruebas baratas y rápidas en la base, pocas costosas y lentas en la cima. Fuente: [The Test Pyramid — Martin Fowler](https://martinfowler.com/bliki/TestPyramid.html) y [Practical Test Pyramid](https://martinfowler.com/articles/practical-test-pyramid.html).

### 7.2 Objetivo de negocio

- Confianza: que un deploy verde tenga alta probabilidad de funcionar en producción.
- Velocidad: detectar regresiones en minutos, no en días.
- Reducción de costes: cada bug detectado en CI cuesta una fracción de uno detectado en producción.

### 7.3 Tipos de pruebas (exhaustivo)

1. **Unit tests (pruebas unitarias):** prueban la unidad más pequeña (función/método) de forma aislada, con mocks de dependencias. Rápidas (ms), miles en segundos. Ejemplos: Vitest/Jest, Mocha, Playwright Test (unit), xUnit. Herramienta del proyecto: **Vitest** (ver skill `vitest`).
2. **Contract tests (pruebas de contrato):** verifican que un consumidor y un proveedor de API coinciden en el contrato (pactos), sin desplegar todos los servicios. Ejemplos: Pact, Spring Cloud Contract. Fuente: [ContractTest — Fowler](https://martinfowler.com/bliki/ContractTest.html), [Consumer-Driven Contracts](https://martinfowler.com/articles/consumerDrivenContracts.html), [Pact](https://pact.io/)
3. **Integration tests (pruebas de integración):** prueban la interacción real entre componentes (BD, colas, APIs externas) con dependencias reales o cercanas a reales (Testcontainers). Más lentas que unitarias. Fuente: [Testcontainers](https://www.testcontainers.com/)
4. **Component tests:** prueban un componente del sistema de forma aislada (ej. el servidor Express completo contra una BD de test) — nivel entre unit e integration.
5. **E2E tests (end-to-end):** prueban el flujo completo del usuario a través del sistema real (UI + API + BD), en un entorno lo más parecido a producción. Ejemplos: Playwright, Cypress. Herramienta del proyecto: **Playwright** (ver skill `playwright-best-practices`).
6. **Smoke tests:** subconjunto mínimo de pruebas que verifican que el sistema arranca y los flujos críticos funcionan tras un deploy. Se ejecutan en producción tras el deploy (ver Stage 13 Post-Deployment / Monitoring).
7. **Regression tests:** suite que garantiza que funcionalidades existentes no se rompen con cambios nuevos (normalmente la suite E2E + integration).
8. **Performance / load tests:** verifican rendimiento bajo carga (ver Stage 10 Performance & Reliability). Ejemplos: k6, Artillery, JMeter, Locust.
9. **Security tests:** SAST/DAST/SCA (Stage 4) + pruebas de penetración manual/automatizada.
10. **Mutation testing:** muta el código (cambia operadores, borra condiciones) y verifica que las pruebas existentes detectan las mutaciones; mide la **calidad real** de los tests (mutation score). **Ubicación: pipeline SEPARADO (nightly/on-demand)**, NO en el pipeline de PRs — el full sweep es 10-40x más costoso que unit tests y añadiría horas de lead time por PR. Ver §36.3 item 5 para análisis completo y §23.3 para el diagrama del pipeline separado. Ejemplos: StrykerJS. Fuente: [Stryker Mutator](https://stryker-mutator.io/), [Mutation testing — Microsoft Learn](https://learn.microsoft.com/en-us/dotnet/core/testing/unit-testing-with-mutation-testing)
11. **Property-based testing:** genera entradas aleatorias y verifica propiedades invariantes del código (fast-check para JS/TS, Hypothesis para Python). Excelente para parsers, validaciones, lógica financiera. **Ubicación: STAGE 2 PRE-Build** — lightweight (<1-2 min), opera sobre source code, complementa unit tests. Ver §36.3 item 14 para explicación completa.
12. **Chaos engineering tests:** inyectan fallos deliberados (latencia, caídas de servicio) para verificar resiliencia. Se ejecutan contra staging, no en CI normal. Fuente: [Principles of Chaos Engineering](https://principlesofchaos.org/)
13. **Accessibility tests:** verifican accesibilidad (axe-core con Playwright/Jest). Fuente: skill `react-testing-library`, axe-core.
14. **Visual regression tests:** comparan capturas de pantalla de la UI contra un baseline (Playwright visual comparisons, Percy, Chromatic).
15. **Exploratory testing:** pruebas manuales/semimanuales de exploración en staging/UAT (complementan lo automatizado).
16. **Coverage gates:** umbrales mínimos de cobertura que bloquean el merge si no se cumplen (unit: 80%+, integration: 70%+). Nota: el gate AUTORITATIVO es SonarQube new-code coverage (≥80%) en STAGE 4. El pre-build es un tripwire de piso para atrapar abandono catastrófico.
17. **Test doubles:** mocks, stubs, spies, fakes — con cuidado de no mockear lo que se quiere probar (anti-patrón: mockear todo y probar nada).
18. **Paralelización y sharding:** dividir suites entre runners (vitest --shard, Playwright shards) para CI más rápido.
19. **Test data management:** datos de prueba aislados por test (BD transaccional o Testcontainers), sin dependencia del estado global.
20. **Flaky test policy:** los tests flaky (intermitentes) se diagnostican y corrigen con prioridad; el pipeline no debe "reintentar hasta que pase" de forma silenciosa.
21. **Smart test ordering:** ordenar la ejecución de tests para ejecutar primero los más probables de fallar (fail-first / fail-fast). Herramientas: Launchable (usa ML para predecir qué tests fallarán basándose en historial de cambios y fallos), Nx affected (ejecuta solo tests afectados por el cambio), Vitest `--changed` (tests que modificaron archivos del commit). Ventaja: feedback más rápido — si hay una regresión, se detecta en minutos en vez de esperar al final del suite completo. Implementar como stage de pre-build (STAGE 2) antes del build pesado.
22. **Early-abort gate:** punto de verificación intermedio dentro de un stage que aborta el pipeline completo si falla, evitando consumir recursos en stages posteriores. Ejemplo: en STAGE 2, después de unit tests pero antes de build — si unit tests fallan, abortar sin ejecutar linter, type-check, ni build. En Vite/GitHub Actions: usar `if: success()` entre steps, o jobs separados con `needs:` condicional. También aplicable a `pytest --maxfail=1` (abortar después del primer fallo en vez de ejecutar todo el suite). El early-abort es un patrón de fail-fast que reduce tiempos de feedback y costes de compute.

### 7.4 Herramientas comunes

| Categoría      | Herramientas                                  |
| -------------- | --------------------------------------------- |
| Unit/Component | Vitest, Jest, Mocha, Playwright Test          |
| Integration    | Testcontainers, supertest, Vitest             |
| Contract       | Pact (pact-js), Spring Cloud Contract         |
| E2E            | Playwright, Cypress, WebdriverIO              |
| Coverage       | V8, Istanbul/nyc, c8                          |
| Mutation       | StrykerJS                                     |
| Property-based | fast-check, Hypothesis                        |
| Accesibilidad  | axe-core, Pa11y                               |
| Visual         | Playwright toHaveScreenshot, Percy, Chromatic |

### 7.5 Mejores prácticas

- Pirámide de testing: ~70% unit, ~20% integration, ~10% E2E (aproximación; depende del contexto).
- Tests deterministas: sin dependencia de hora/red/orden de ejecución.
- Cada test verifica un comportamiento, no una implementación (evitar over-mocking).
- Los tests son código de primera clase: se revisan y mantienen como el código de producción.
- E2E en PRs para cambios de UI; E2E completos en el pipeline principal.
- Aislar el entorno de tests (BD efímera con Testcontainers, mocks de servicios externos con MSW si procede).

### 7.6 Errores comunes (anti-patrones)

- Pirámide invertida: muchos E2E lentos y frágiles, pocos unit tests.
- Tests que no asertan nada ("tests verdes falsos").
- Mockear demasiado: se prueba la implementación del mock, no el comportamiento real.
- Tests flaky ignorados ("tarda, lo reintento") — erosionan la confianza en el pipeline.
- Dependencia de datos compartidos entre tests (orden de ejecución importa).
- Coverage como único criterio: cobertura alta no garantiza calidad (mutation testing lo demuestra).

### 7.7 Métricas recomendadas

- Cobertura de líneas/ramas por suite.
- Mutation score (target: 60-80%+ para módulos críticos).
- % de tests flaky por semana (target: < 1%).
- Tiempo total de la suite de testing (target: < 10 min).
- Defectos escapados a producción por categoría (regresión, integración, etc.).

### 7.8 Fuentes

- https://martinfowler.com/bliki/TestPyramid.html
- https://martinfowler.com/articles/practical-test-pyramid.html
- https://martinfowler.com/bliki/ContractTest.html
- https://martinfowler.com/articles/consumerDrivenContracts.html
- https://pact.io/
- https://www.testcontainers.com/
- https://stryker-mutator.io/
- https://learn.microsoft.com/en-us/dotnet/core/testing/unit-testing-with-mutation-testing
- https://principlesofchaos.org/
- https://k6.io/

### 7.9 Ejemplo práctico — GitHub Actions

```yaml
# .github/workflows/test.yml
# Stage 5: Unit + integration tests con matrix, coverage gates
name: Testing

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

permissions:
  contents: read

jobs:
  unit-test:
    name: Unit Tests (${{ matrix.workspace }})
    runs-on: ubuntu-latest
    strategy:
      matrix:
        workspace: [apps/server, apps/client]
      fail-fast: false
    services:
      postgres:
        image: postgres:16-alpine
        env:
          POSTGRES_USER: postgres
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: testdb
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    steps:
      - uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683 # v4.2.2
      - uses: actions/setup-node@49933ea5288caeca8642d1e84afbd3f7d6820020 # v4.4.0
        with:
          node-version-file: '.nvmrc'
          cache: 'npm'
      - run: npm ci
      - name: Prisma Migrate (server)
        if: matrix.workspace == 'apps/server'
        run: npx prisma migrate deploy --schema=apps/server/prisma/schema.prisma
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/testdb
      - name: Run unit tests
        run: npx vitest run --project ${{ matrix.workspace }}
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/testdb
          NODE_ENV: test

  integration-test:
    name: Integration Tests
    runs-on: ubuntu-latest
    needs: unit-test
    services:
      postgres:
        image: postgres:16-alpine
        env:
          POSTGRES_USER: postgres
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: testdb
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    steps:
      - uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683 # v4.2.2
      - uses: actions/setup-node@49933ea5288caeca8642d1e84afbd3f7d6820020 # v4.4.0
        with:
          node-version-file: '.nvmrc'
          cache: 'npm'
      - run: npm ci
      - name: Prisma Migrate
        run: npx prisma migrate deploy --schema=apps/server/prisma/schema.prisma
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/testdb
      - name: Run integration tests
        run: npm run test:integration --workspace=apps/server
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/testdb
          NODE_ENV: test
```

---

## 8. Stage 6 — Artifact / Packaging Stage

### 8.1 Descripción

El stage de artifact toma los outputs del build (bundle, imagen, binario) y los **empaqueta, versiona, firma y publica** en un registry central. Es el punto donde el código se convierte en un **artifact inmutable y verificable** que se promoverá por los entornos. Los artifacts incluyen SBOM (lista de componentes) y attestations de procedencia.

### 8.2 Objetivo de negocio

- Garantizar que lo que se despliega es exactamente lo que se construyó y verificó (integridad).
- Permitir rollbacks instantáneos a artifacts anteriores (inmutabilidad).
- Cumplir supply chain security (SLSA) y auditoría (SBOM, firmas).

### 8.3 Prácticas recomendadas (exhaustivo)

1. **Versionado semántico automático:** derivar la versión de los Conventional Commits (semantic-release calcula MAJOR/MINOR/PATCH y genera changelog). Fuente: [semantic-release](https://semantic-release.gitbook.io/)
2. **Tagging por SHA y SemVer:** tag de la imagen con `sha-<hash>` + `v1.2.3` + `latest` (pero nunca desplegar por `latest`).
3. **Inmutabilidad:** un artifact publicado no se sobrescribe jamás; cada versión es única e inmutable.
4. **Firma con cosign (Sigstore):** firmar imágenes/artifacts; el deploy verifica la firma antes de continuar. Fuente: [Sigstore](https://docs.sigstore.dev/)
5. **SBOM (CycloneDX/SPDX):** generar y adjuntar el inventario de dependencias al artifact; publicarlo junto al release. Herramientas: Syft, CycloneDX CLI, Trivy.
6. **Attestations (in-toto/SLSA provenance):** registrar quién construyó qué, con qué workflow, a partir de qué commit. GitHub Actions: `actions/attest-build-provenance`. Fuente: [SLSA GitHub Generator](https://github.com/slsa-framework/slsa-github-generator)
7. **Publicación a registry:** npm registry (GitHub Packages, npmjs), ECR/Docker Hub para imágenes, Artifactory/Nexus como proxy central. Fuente: [Publishing Node.js packages — GitHub Docs](https://docs.github.com/en/actions/publishing-packages/publishing-nodejs-packages)
8. **Gates de publicación:** solo publicar si los stages previos (build, calidad, seguridad, tests) pasaron; publicar desde `main` tras merge, no desde PRs (excepto previews).
9. **Retención de artifacts:** política de retención (ej. 90 días para previews, 1 año+ para releases) para control de costes y compliance.
10. **Promotion model:** el artifact se promueve entre entornos (staging → prod) sin reconstruirse; la reconstrucción rompe la trazabilidad.
11. **Scan de contenedor final:** escanear la imagen ya construida (Trivy/Grype) y bloquear publicación si hay críticas.
12. **Reproducibilidad verificable:** registrar los inputs (lockfile hash, node version) en el artifact; opcional: verificar build reproducible con buildx.
13. **Notarización (Apple/Windows):** proceso de certificación de software distribuido que verifica la identidad del desarrollador y la ausencia de malware. Apple: `notarytool` envía el DMG/pkg a Apple para escaneo, y si pasa, recibe un "ticket" de notarización que se "pegar" (`staple`) al artefacto. Windows: Authenticode signing con certificado EV (Extended Validation) firmado por una CA reconocida. Para software open-source: Sigstore (gratuito) reemplaza certificados tradicionales con identidad de OIDC (GitHub/GitLab). Herramientas: `notarytool` (macOS), `signtool.exe` (Windows), `cosign` (Linux/cross-platform). La notarización es OBLIGATORIA para distribuir software en macOS (Gatekeeper) y recomendada en Windows para evitar SmartScreen warnings.

### 8.4 Herramientas comunes

| Categoría            | Herramientas                                                    |
| -------------------- | --------------------------------------------------------------- |
| Versionado           | semantic-release, standard-version, changesets                  |
| Registros            | GitHub Packages, npmjs, ECR, Docker Hub, Artifactory, Nexus     |
| Firma                | cosign, sigstore, GPG                                           |
| SBOM                 | Syft, CycloneDX, Trivy                                          |
| Attestations         | actions/attest-build-provenance, in-toto, slsa-github-generator |
| Escaneo contenedores | Trivy, Grype, Snyk                                              |

### 8.5 Mejores prácticas

- Un artifact por commit verde en `main`, versionado por SemVer.
- Nunca reconstruir para desplegar; promover el artifact existente.
- Firmar y verificar: el deploy falla si la firma no valida.
- Adjuntar SBOM + provenance al release para auditoría.
- Evitar secretos dentro del artifact (inyectar en runtime desde secret stores).

### 8.6 Errores comunes (anti-patrones)

- Rebuild en cada entorno (rompe trazabilidad y reproducibility).
- Sobrescribir tags/versiones existentes.
- Publicar artifacts sin firmar ni SBOM (no auditable).
- Imágenes "latest" desplegadas sin verificación.
- Secretos embebidos en la imagen.

### 8.7 Métricas recomendadas

- % de releases con SBOM + firma (target 100%).
- Tiempo de publicación (commit → artifact disponible).
- Tasa de rollbacks a artifacts previos (deben funcionar siempre).

### 8.8 Fuentes

- https://semantic-release.gitbook.io/
- https://docs.sigstore.dev/
- https://slsa.dev/
- https://github.com/slsa-framework/slsa-github-generator
- https://docs.github.com/en/actions/publishing-packages/publishing-nodejs-packages
- https://cyclonedx.org/
- https://github.com/anchore/syft

### 8.9 Ejemplo práctico — GitHub Actions

```yaml
# .github/workflows/artifact.yml
# Stage 6: Packaging, SBOM y attestation
name: Artifact

on:
  push:
    branches: [main]

permissions:
  contents: read
  id-token: write # Para OIDC → cosign signing
  attestations: write

jobs:
  package:
    name: Package & Sign
    runs-on: ubuntu-latest
    outputs:
      version: ${{ steps.version.outputs.version }}
    steps:
      - uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683 # v4.2.2
      - uses: actions/setup-node@49933ea5288caeca8642d1e84afbd3f7d6820020 # v4.4.0
        with:
          node-version-file: '.nvmrc'
          cache: 'npm'

      - run: npm ci

      - name: Version (semver from tags)
        id: version
        run: |
          VERSION=$(git describe --tags --abbrev=0 2>/dev/null || echo "0.0.0")
          echo "version=${VERSION}" >> "$GITHUB_OUTPUT"

      - name: Build all workspaces
        run: npm run build

      - name: Generate SBOM
        uses: anchore/sbom-action@78fc5d3ea430609c6289675418831e209853a788 # v0.18.0
        with:
          path: .
          format: spdx-json
          output-file: sbom.spdx.json

      - name: Install cosign
        uses: sigstore/cosign-installer@d7d6bc7722e3daa8354c57bcb84e1f03e4403235 # v3.8.2

      - name: Sign artifact with cosign
        run: |
          cosign sign-blob sbom.spdx.json \
            --bundle sbom.sigstore.json \
            --yes

      - uses: actions/upload-artifact@ea165f8d65b6e75b540449e92b4886f43607fa02 # v4.6.2
        with:
          name: release-${{ steps.version.outputs.version }}
          path: |
            sbom.spdx.json
            sbom.sigstore.json
          retention-days: 365

      - name: Generate attestation
        uses: actions/attest-build-provenance@ef244123eb79f2f7a7e75d99086184ef3e0a0dc8 # v2.2.3
        with:
          subject-path: sbom.spdx.json
```

---

## 9. Stage 7 — Integration Stage

### 9.1 Descripción

El stage de integración verifica que los **componentes del sistema funcionan juntos**: backend con frontend, servicios entre sí, colas, BD, APIs externas. Va más allá de los tests unitarios aislados: ejecuta pruebas de integración y contract tests contra un entorno integrado (o con dobles de alta fidelidad).

### 9.2 Objetivo de negocio

- Detectar incompatibilidades entre componentes antes de producción (los fallos de integración son de los más caros).
- Validar contratos API frontend-backend de forma continua.
- En monorepos: verificar que un cambio en `apps/server` no rompe `apps/client`.

### 9.3 Prácticas recomendadas (exhaustivo)

1. **Contract tests (Pact):** el consumidor (client) define el contrato; el proveedor (server) verifica que lo cumple en CI. Fuente: [Pact](https://docs.pact.io/)
2. **Integration tests con dependencias reales:** BD real efímera (Testcontainers), servicios externos simulados (WireMock/MSW) o reales en entorno compartido.
3. **End-to-end de integración en CI:** en monorepos, levantar server + client + BD y ejecutar E2E (Playwright) contra ese entorno integrado.
4. **Pruebas de esquema de datos:** verificar migraciones de Prisma/BD en CI contra una BD de test (migraciones aplicables y rollback).
5. **Compatibilidad de versiones:** probar las combinaciones de versiones de servicios que coexistirán en producción (ej. client vX con server vY durante despliegues graduales).
6. **Consumer-driven contracts en CI:** el broker de contratos (Pact Broker) valida compatibilidad entre consumidores y proveedores antes del merge.
7. **Pruebas de serialización/deserialización:** JSON/Protobuf schemas entre servicios.
8. **Backward compatibility checks:** verificar que el backend mantiene endpoints/formatos esperados por versiones antiguas del client (Parallel Change/expand-contract). Fuente: [ParallelChange — Fowler](https://martinfowler.com/bliki/ParallelChange.html)
9. **Test environment management:** entornos de integración compartidos con despliegue automático de ramas principales; preview environments por PR para E2E completos.
10. **Fixtures de datos realistas:** datos de prueba que reflejan la producción (anonymized copies), para que las pruebas de integración sean relevantes.

### 9.4 Herramientas comunes

| Categoría       | Herramientas                                         |
| --------------- | ---------------------------------------------------- |
| Contract        | Pact (pact-js), Pact Broker, Spring Cloud Contract   |
| Integration env | Testcontainers, Docker Compose, docker-compose en CI |
| API mocks       | WireMock, MSW, Mountebank                            |
| E2E integrado   | Playwright, Cypress                                  |
| BD migrations   | Prisma Migrate, Flyway, Liquibase                    |
| Schema          | OpenAPI, JSON Schema, protobuf                       |

### 9.5 Mejores prácticas

- Contract tests primero: rápidos y sin infraestructura pesada.
- E2E de integración en CI para el "happy path" de cada PR relevante.
- Preview environments por PR para validación humana y E2E completos.
- Ejecutar migraciones de BD en CI y verificar integridad (idempotencia).

### 9.6 Errores comunes (anti-patrones)

- Probar integración solo contra mocks (no se valida el contrato real).
- Entornos de integración compartidos sin despliegue automático (quedan obsoletos).
- E2E solo en local o solo en producción (demasiado tarde).
- Ignorar la compatibilidad backward del API (rompe clientes antiguos).

### 9.7 Métricas recomendadas

- % de contratos verificados en CI (target 100%).
- Tiempo medio del stage de integración.
- Fallos de integración detectados antes de staging/prod.
- Número de E2E ejecutados por PR.

### 9.8 Fuentes

- https://docs.pact.io/
- https://pact.io/
- https://www.testcontainers.com/
- https://martinfowler.com/bliki/ContractTest.html
- https://martinfowler.com/articles/consumerDrivenContracts.html
- https://martinfowler.com/bliki/ParallelChange.html
- https://www.prisma.io/docs/orm/prisma-migrate

### 9.9 Ejemplo práctico — GitHub Actions

```yaml
# .github/workflows/integration.yml
# Stage 7: Integration tests con servicios reales (PostgreSQL)
name: Integration Tests

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

permissions:
  contents: read

jobs:
  integration:
    name: Server Integration (Prisma + PostgreSQL)
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16-alpine
        env:
          POSTGRES_USER: postgres
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: integration_test
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    env:
      DATABASE_URL: postgresql://postgres:postgres@localhost:5432/integration_test
    steps:
      - uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683 # v4.2.2
      - uses: actions/setup-node@49933ea5288caeca8642d1e84afbd3f7d6820020 # v4.4.0
        with:
          node-version-file: '.nvmrc'
          cache: 'npm'

      - run: npm ci

      - name: Generate Prisma client
        run: npx prisma generate --schema=apps/server/prisma/schema.prisma

      - name: Run migrations
        run: npx prisma migrate deploy --schema=apps/server/prisma/schema.prisma

      - name: Run integration tests
        run: npm run test:integration --workspace=apps/server

      - name: Verify schema drift
        run: npx prisma diff --exit-code --schema=apps/server/prisma/schema.prisma
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/integration_test
```

---

## 10. Stage 8 — Deployment Staging Stage

### 10.1 Descripción

El stage de staging despliega el artifact verificado a un entorno de **staging/preview** que replica producción (configuración, infraestructura, datos sanitizados). Tras el deploy, se ejecutan smoke tests y pruebas de integración/E2E contra ese entorno. Es la última verificación antes de la aprobación final.

### 10.2 Objetivo de negocio

- Validar el artifact completo en un entorno casi-producción (los bugs de "funciona en mi máquina" mueren aquí).
- Permitir pruebas funcionales, de aceptación y manuales sin riesgo para producción.
- Entrenar el playbook de deploy (lo que se hace en staging se hará igual en prod).

### 10.3 Prácticas recomendadas (exhaustivo)

1. **Paridad con producción:** staging debe replicar versiones de dependencias, configuración y datos (sanitizados) de producción. La deriva de staging es la causa nº1 de falsos verdes.
2. **Preview environments por PR (efímeros):** desplegar cada PR a un entorno aislado para validación humana/E2E; se destruyen al cerrar el PR. Fuente: [Vercel Previews](https://vercel.com/), [Qovery Ephemeral Environments](https://www.qovery.com/)
3. **Deploy automatizado idéntico a prod:** el mismo script/acción que despliega staging despliega prod (solo cambia el entorno y los gates).
4. **Smoke tests post-deploy:** verificar health checks, endpoints críticos, versiones desplegadas, conexión a BD, migraciones aplicadas.
5. **Migraciones de BD en staging:** aplicar migraciones (Prisma Migrate/Flyway) y verificar idempotencia antes de prod. Fuente: [Flyway](https://www.flywaydb.org/), [Liquibase](https://www.liquibase.org/)
6. **Datos de prueba realistas:** cargar datos sanitizados/anonymizados para pruebas relevantes.
7. **Verificación de configuración:** validar variables de entorno, feature flags, y config por entorno (secretos inyectados, no embebidos).
8. **Checks de integración E2E completos:** ejecutar la suite E2E completa contra staging (no solo en CI aislado).
9. **Gate manual para UAT (si aplica):** el entorno queda disponible para QA/PO/usuarios de negocio (ver Stage 9 Acceptance / UAT).
10. **Evaluación de la salud tras deploy:** monitorear logs/errores del entorno staging durante un periodo de observación.
11. **Cluster posture checks (kube-bench/kube-hunter):** verificación de la postura de seguridad del clúster Kubernetes después del deploy de staging. Herramientas: kube-bench (ejecuta los checks del CIS Kubernetes Benchmark — permisos de etcd, RBAC, network policies, secrets encryption), kube-hunter (hunting de vulnerabilidades activas en el clúster). Ejecutar como post-deploy check en STAGE 6 (Deploy Staging): si el clúster no pasa los checks de seguridad críticos,阻塞 el pipeline antes de continuar con testing. Ejemplos de findings: RBAC con permisos cluster-admin excesivos, etcd sin cifrado en reposo, absence of Pod Security Standards, puertos expuestos innecesariamente. Integrar con Trivy para escaneo de configuración de clúster (`trivy k8s cluster`).

### 10.4 Herramientas comunes

| Categoría    | Herramientas                                            |
| ------------ | ------------------------------------------------------- |
| Preview envs | Vercel, Netlify, Qovery, AWS Amplify, GitHub Codespaces |
| Orquestación | GitHub Actions, Argo CD (app of apps), GitLab           |
| Smoke tests  | Playwright, curl + health checks, supertest             |
| Migraciones  | Prisma Migrate, Flyway, Liquibase                       |
| Config       | env files, Vault, AWS Secrets Manager                   |

### 10.5 Mejores prácticas

- Staging "sano" siempre: nadie debe esperar a que staging se arregle para validar.
- Destruir y recrear preview environments automáticamente (reproducibilidad).
- El deploy a staging es automático en cada merge a main; a prod, tras gates adicionales.
- Registrar quién/cuándo/qué se desplegó (deployment audit trail, GitHub deployments).

### 10.6 Errores comunes (anti-patrones)

- Staging con datos vacíos o viejos (las pruebas no reflejan la realidad).
- Deploys manuales a staging por consola (sin reproducibilidad ni auditoría).
- Desplegar a prod sin haber pasado por staging.
- Staging más pequeño/diferente que prod (problemas de escala pasan desapercibidos).
- No verificar la salud tras el deploy (smoke).

### 10.7 Métricas recomendadas

- Tasa de éxito del deploy a staging.
- Tiempo de disponibilidad del entorno staging tras merge.
- Falsos verdes (deploy a staging ok → fallo en prod) — target: mínimo.

### 10.8 Fuentes

- https://vercel.com/
- https://www.qovery.com/
- https://www.flywaydb.org/
- https://www.liquibase.org/
- https://docs.github.com/en/actions/managing-workflow-runs-and-deployments/managing-deployments/viewing-deployment-history

### 10.9 Ejemplo práctico — GitHub Actions

```yaml
# .github/workflows/deploy-staging.yml
# Stage 8: Deploy to staging + smoke tests
name: Deploy Staging

on:
  workflow_run:
    workflows: ['CI'] # Se ejecuta tras CI completo en main
    types: [completed]
    branches: [main]

permissions:
  contents: read
  deployments: write

jobs:
  deploy:
    name: Deploy to Staging
    runs-on: ubuntu-latest
    if: ${{ github.event.workflow_run.conclusion == 'success' }}
    environment:
      name: staging
      url: https://staging.project-one.example.com
    steps:
      - uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683 # v4.2.2

      - uses: actions/setup-node@49933ea5288caeca8642d1e84afbd3f7d6820020 # v4.4.0
        with:
          node-version-file: '.nvmrc'
          cache: 'npm'

      - run: npm ci && npm run build

      - name: Prisma Migrate (staging)
        run: npx prisma migrate deploy --schema=apps/server/prisma/schema.prisma
        env:
          DATABASE_URL: ${{ secrets.STAGING_DATABASE_URL }}

      - name: Deploy server
        run: |
          echo "Deploy server to staging environment"
          # Replace with actual deploy command (Docker push, rsync, cloud deploy, etc.)

      - name: Deploy client
        run: |
          echo "Deploy client to staging environment"
          # Replace with actual deploy command

      - name: Smoke tests
        run: |
          curl -sf https://staging.project-one.example.com/health || exit 1
          echo "Health check passed"
```

---

## 11. Stage 9 — Acceptance / UAT Stage

### 11.1 Descripción

El stage de aceptación valida que el sistema **cumple los criterios de aceptación del negocio**: pruebas funcionales, UAT (User Acceptance Testing) con stakeholders, verificación de requisitos y, cuando aplica, aprobación explícita de negocio/producto. Combina automatización (tests de aceptación BDD) con validación humana.

### 11.2 Objetivo de negocio

- Garantizar que lo que se despliega es lo que el negocio pidió (no solo lo que el código hace).
- Reducir el riesgo de releases que no aportan valor o que incumplen requisitos contractuales.
- Formalizar la aprobación para releases regulatorios (compliance).

### 11.3 Prácticas recomendadas (exhaustivo)

1. **Tests de aceptación automatizados (BDD):** Given/When/Then (Cucumber, Gherkin) o pruebas funcionales E2E sobre los criterios de aceptación de cada historia. Fuente: [BDD — Cucumber](https://cucumber.io/)
2. **UAT manual con entorno estable:** stakeholders prueban el preview/staging; checklist de aceptación por release.
3. **Criterios de aceptación explícitos:** cada user story define criterios verificables (definición de hecho/DoD) que los tests automatizan.
4. **Sign-off digital:** aprobación registrada (comentario en PR, issue de release, workflow de aprobación) para trazabilidad.
5. **Validación de requerimientos no funcionales:** accesibilidad, usabilidad, localización, cumplimiento (ver Stage 10 Performance & Reliability para rendimiento).
6. **Release candidate management:** cada release candidate se etiqueta (RC1, RC2) y se documenta qué verificaciones pasó.
7. **Paralelismo con el negocio:** los equipos de negocio participan en la revisión de previews desde el inicio (no solo al final).
8. **Checklist regulatorio:** para entornos regulados (SOX, HIPAA, PCI), checklist de evidencia por release.

### 11.4 Herramientas comunes

| Categoría  | Herramientas                                               |
| ---------- | ---------------------------------------------------------- |
| BDD        | Cucumber, Gherkin, Playwright/Cypress con BDD              |
| UAT env    | Preview environments, staging dedicado                     |
| Aprobación | GitHub Environments (required reviewers), Jira transitions |
| Checklist  | PR templates, release notes, DoD                           |

### 11.5 Mejores prácticas

- Automatizar la mayor parte de la aceptación (criterios → tests); reservar UAT humano para lo que la automatización no cubre (usabilidad, negocio).
- Entorno de UAT estable y aislado (los stakeholders no deben ver código a medio hacer).
- Registrar la evidencia de aprobación para auditoría.
- Feedback rápido: los stakeholders ven los cambios en previews, no solo en releases.

### 11.6 Errores comunes (anti-patrones)

- UAT sobre entornos inestables o datos falsos (aceptación inválida).
- Aprobación "a ciegas" sin revisar (ritual vacío).
- Criterios de aceptación vagos e inverificables.
- Bloquear el pipeline esperando UAT manual para cambios triviales (sobre-proceso; usar revisión por riesgo).

### 11.7 Métricas recomendadas

- % de criterios de aceptación automatizados (target alto para flujos core).
- Tiempo de ciclo de UAT (feedback → aprobación).
- Defectos encontrados en UAT por release.
- Tasa de releases aprobados a la primera.

### 11.8 Fuentes

- https://cucumber.io/
- https://docs.github.com/en/actions/managing-workflow-runs-and-deployments/managing-deployments/viewing-deployment-history
- https://www.martinfowler.com/bliki/DefinitionOfDone.html

### 11.9 Ejemplo práctico — GitHub Actions

```yaml
# .github/workflows/acceptance.yml
# Stage 9: Acceptance con Playwright en staging
name: Acceptance / UAT

on:
  workflow_run:
    workflows: ['Deploy Staging']
    types: [completed]
    branches: [main]

permissions:
  contents: read

jobs:
  acceptance:
    name: Playwright E2E (Staging)
    runs-on: ubuntu-latest
    if: ${{ github.event.workflow_run.conclusion == 'success' }}
    environment:
      name: staging
    steps:
      - uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683 # v4.2.2
      - uses: actions/setup-node@49933ea5288caeca8642d1e84afbd3f7d6820020 # v4.4.0
        with:
          node-version-file: '.nvmrc'
          cache: 'npm'
      - run: npm ci
      - name: Install Playwright browsers
        run: npx playwright install --with-deps
      - name: Run acceptance tests
        run: npx playwright test
        env:
          BASE_URL: https://staging.project-one.example.com
      - name: Upload report
        if: failure()
        uses: actions/upload-artifact@ea165f8d65b6e75b540449e92b4886f43607fa02 # v4.6.2
        with:
          name: playwright-report
          path: e2e/playwright-report/
          retention-days: 7
```

---

## 12. Stage 10 — Performance & Reliability Stage

### 12.1 Descripción

El stage de rendimiento verifica que el sistema cumple **SLOs de rendimiento y fiabilidad** bajo carga: tiempos de respuesta, throughput, uso de recursos, escalabilidad y resiliencia. Incluye load testing, stress testing, soak testing, spike testing y pruebas de resiliencia (chaos). Se ejecuta contra entornos dedicados (no contra staging compartido) antes de producción.

### 12.2 Objetivo de negocio

- Evitar degradación de rendimiento en producción (pérdida de usuarios/ingresos).
- Validar la capacidad de escalado antes de eventos de tráfico (lanzamientos, temporadas).
- Detectar regresiones de rendimiento que los tests funcionales no ven.

### 12.3 Tipos de pruebas de rendimiento (exhaustivo)

1. **Load testing:** carga esperada sostenida; verifica rendimiento bajo tráfico normal/pico previsto.
2. **Stress testing:** carga creciente hasta el punto de fallo; identifica el límite del sistema.
3. **Soak testing (endurance):** carga sostenida durante horas/días; detecta fugas de memoria, agotamiento de conexiones, degradación gradual.
4. **Spike testing:** picos abruptos de carga; verifica que el sistema se recupera (auto-scaling, colas).
5. **Escalabilidad:** verificación horizontal (más instancias) y vertical; test de auto-scaling.
6. **Resiliencia / Chaos:** inyección de fallos (latencia, errores de red, caída de dependencias) y verificación de degradación controlada. Fuente: [Principles of Chaos Engineering](https://principlesofchaos.org/)
7. **Probar puntos críticos:** endpoints más usados, consultas BD, autenticación, uploads, paginación.
8. **Comparación de regresiones:** benchmarks automáticos en CI (perf budgets) que fallan si un cambio degrada >X% el rendimiento.
9. **Perf budgets en el frontend:** tamaño de bundle, LCP, CLS (Core Web Vitals) con umbrales en CI (ver skill `vercel-react-best-practices`).
10. **Memory leak detection:** detección de fugas de memoria en la aplicación durante cargas sostenidas. Se ejecuta preferiblemente en soak testing (STAGE 8) o en monitoreo post-deploy (STAGE 11). Herramientas: `clinic.js` (Node.js) genera flame graphs y heap snapshots, `--inspect` con Chrome DevTools para analizar heap, `heapdump`/`v8.writeHeapSnapshot()` para snapshots comparativos (tomar snapshot antes y después de 1000 requests y comparar con `--diff-instances`). Señales: uso de memoria que crece linealmente sin estabilizarse, objetos que no se recolectan con GC. En staging: ejecutar 30-60 min de carga sostenida y monitorear RSS/heapUsed.
11. **DDoS resilience / rate-limit validation:** verificación de que la aplicación resiste ataques de denegación de servicio y que los rate limits funcionan correctamente. Pruebas: (a) traffic spike test con k6 que simula 10-100x la carga normal; (b) validación de rate limits en endpoints públicos (login, API) — verificar que el 429 se devuelve después del umbral; (c) test de slowloris (connections agotándose); (d) validación de WAF rules (AWS WAF, Cloudflare) que bloquean patrones maliciosos. Implementar como parte de performance testing o como job separado de resiliencia.

### 12.4 Herramientas comunes

| Categoría               | Herramientas                                               |
| ----------------------- | ---------------------------------------------------------- |
| Load testing            | k6, Artillery, JMeter, Locust, Gatling                     |
| Monitoring durante test | Prometheus, Grafana, Datadog                               |
| Frontend perf           | Lighthouse CI, WebPageTest, Playwright (tracing)           |
| Chaos                   | Chaos Mesh, Litmus, Gremlin, AWS Fault Injection Simulator |
| SLO validation          | OpenTelemetry, Grafana Cloud, k6 browser                   |

### 12.5 Mejores prácticas

- Entorno de rendimiento aislado y representativo (mismo tamaño que prod o proporcional conocido).
- Baselines: medir el rendimiento de referencia antes de cada release para comparar.
- Umbrales/SLO explícitos (p95/p99 de latencia, error rate, throughput) que bloquean el release.
- Test de rendimiento automatizado en CI para cambios de alto riesgo; suites completas en cron o por release.
- Investigar y documentar los hallazgos de rendimiento (no solo "falla o pasa").

### 12.6 Errores comunes (anti-patrones)

- Load testing contra staging compartido (resultados contaminados).
- Probar con datos irreales (pocos datos en BD → índices no representativos).
- Ignorar los percentiles altos (p95/p99) y mirar solo el promedio.
- Tests de rendimiento manuales y esporádicos (sin baseline ni historial).
- No verificar la recuperación tras el fallo (solo que el sistema se cae).

### 12.7 Métricas recomendadas

- Latencia p50/p95/p99 por endpoint crítico.
- Throughput máximo (RPS) antes de degradación.
- Error rate bajo carga.
- Uso de CPU/memoria/BD durante soak.
- Tiempo de recuperación tras inyección de fallos.

### 12.8 Fuentes

- https://k6.io/
- https://grafana.com/docs/grafana-cloud/synthetic-monitoring/
- https://principlesofchaos.org/
- https://sre.google/sre-book/service-level-objectives/
- https://github.com/grafana/lighthouse-ci — https://github.com/GoogleChrome/lighthouse-ci

### 12.9 Ejemplo práctico — GitHub Actions

```yaml
# .github/workflows/performance.yml
# Stage 10: Lighthouse CI + k6 load test
name: Performance

on:
  workflow_run:
    workflows: ['Deploy Staging']
    types: [completed]
    branches: [main]

permissions:
  contents: read

jobs:
  lighthouse:
    name: Lighthouse CI
    runs-on: ubuntu-latest
    if: ${{ github.event.workflow_run.conclusion == 'success' }}
    steps:
      - uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683 # v4.2.2
      - uses: actions/setup-node@49933ea5288caeca8642d1e84afbd3f7d6820020 # v4.4.0
        with:
          node-version-file: '.nvmrc'
          cache: 'npm'
      - run: npm ci
      - name: Run Lighthouse CI
        run: |
          npx lhci autorun \
            --config=apps/client/lighthouserc.json \
            --upload.target=lighthouse-cloud
        env:
          LHCI_GITHUB_APP_TOKEN: ${{ secrets.LHCI_GITHUB_APP_TOKEN }}

  load-test:
    name: k6 Load Test
    runs-on: ubuntu-latest
    if: ${{ github.event.workflow_run.conclusion == 'success' }}
    steps:
      - uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683 # v4.2.2
      - name: Run k6 load test
        uses: grafana/k6-action@b5546982b9d0c5a4585d6e346ad31264591c8fc5 # v0.3.1
        with:
          filename: e2e/performance/load-test.js
          flags: --out json=results.json
        env:
          K6_BASE_URL: https://staging.project-one.example.com
      - name: Threshold check
        run: |
          P95=$(cat results.json | jq 'select(.type=="Point") | select(.metric=="http_req_duration") | .data.value' | awk '{s+=$1; n++} END {print s/n}')
          echo "p95 latency: ${P95}ms"
          [ $(echo "$P95 < 500" | bc) -eq 1 ] || { echo "FAIL: p95 > 500ms"; exit 1; }
```

---

## 13. Stage 11 — Approval / Governance Stage

### 13.1 Descripción

El stage de aprobación/gobernanza aplica los **gates de decisión** que separan "listo para desplegar" de "desplegar": aprobaciones humanas (producto, negocio, compliance), validación de políticas (OPA/Conftest), checks de compliance y trazabilidad. Es el punto donde la automatización entrega el control a la gobernanza organizacional.

### 13.2 Objetivo de negocio

- Asegurar que los releases cumplen políticas corporativas y regulatorias antes de producción.
- Formalizar la responsabilidad (quién aprueba qué).
- Prevenir despliegues no autorizados o que incumplen normas (PCI, HIPAA, SOC2).

### 13.3 Prácticas recomendadas (exhaustivo)

1. **Aprobaciones por entorno (GitHub Environments):** required reviewers + protección de environment para producción; `environment: production` con reviewers obligatorios. Fuente: [Viewing deployment history — GitHub Docs](https://docs.github.com/en/actions/managing-workflow-runs-and-deployments/managing-deployments/viewing-deployment-history)
2. **Policy as Code (OPA/Conftest):** validar manifests, configs y pipelines contra políticas declarativas (ej. "prohibido puerto 22 abierto", "imagen debe venir de registry interno"). Fuente: [OPA — CI/CD policy](https://www.openpolicyagent.org/docs/latest/cicd/), [Conftest](https://www.conftest.dev/)
3. **Compliance checks automatizados:** evidencia de escaneos, SBOM, firmas, audit logs adjunta al release.
4. **Separación de deberes (SoD):** quien escribe el código no aprueba su propio deploy a producción.
5. **Change advisory board (CAB) para cambios de alto riesgo:** aprobación humana para cambios que tocan infraestructura crítica o datos sensibles; cambios de bajo riesgo con aprobación automática.
6. **Audit trail:** cada deploy registra: commit, artifact, aprobador, entorno, hora, resultados de gates.
7. **Release notes generadas automáticamente:** a partir de Conventional Commits; visibles para stakeholders.
8. **Ventana de deploy (deployment window):** restringir deploys a horas de bajo tráfico si el sistema no soporta deploys continuos sin impacto.
9. **Rollback plan obligatorio:** el plan de rollback (y su drill) se valida antes del deploy de alto riesgo.
10. **Código de conducta de deploys:** política de "quién puede desplegar y cuándo", documentada y automatizada (RBAC en el pipeline).
11. **Security Review Board (SRB):** comité de seguridad que revisa y aprueba cambios de alto riesgo antes de su despliegue a producción. A diferencia del CAB (Change Advisory Board, enfocado en impacto operacional), el SRB se enfoca en riesgo de seguridad: nuevos endpoints públicos, cambios en autenticación/autorización, actualizaciones de dependencias críticas, modificaciones a infraestructura de seguridad. Composición: security engineer, DevSecOps lead, arquitecto de seguridad. Aplicar como approval environment en GitHub Actions para cambios etiquetados como `security-sensitive` en el PR. No confundir con CAB (§13.3 item 5) — SRB es especializado en seguridad, CAB es generalista de cambios.
12. **Code Freeze Check:** verificación automática de que no hay "code freeze" activo antes de ejecutar un deploy. Un code freeze es un período donde se prohiben cambios al código fuente (típicamente antes de releases importantes,Black Friday, eventos de alto tráfico). Implementar como gate en el pipeline: consultar la API de GitHub para verificar si hay branch protection temporal activa, o leer un archivo de configuración (`config/code-freeze.json` con fechas), o verificar una label especial en el último commit. Si hay freeze activo →阻塞 el deploy y notificar al equipo. Evita deploys accidentales durante períodos de estabilidad crítica.

### 13.4 Herramientas comunes

| Categoría      | Herramientas                                            |
| -------------- | ------------------------------------------------------- |
| Aprobaciones   | GitHub Environments, GitLab approvals, ServiceNow, Jira |
| Policy as Code | OPA, Conftest, Kyverno (k8s), Sentinel (HashiCorp)      |
| Compliance     | Vault, audit logs, SIEM (Splunk, Datadog)               |
| RBAC           | GitHub teams/permissions, IAM de cloud                  |
| Releases       | semantic-release, release-please                        |

### 13.5 Mejores prácticas

- Automatizar todo lo automatizable; reservar la aprobación humana para decisiones de riesgo real.
- Gates de compliance como código (policy as code): auditables y versionados.
- La aprobación debe tener evidencia (logs, artefactos verificados).
- Evaluar el riesgo de cada cambio para decidir el nivel de aprobación (change risk assessment).

### 13.6 Errores comunes (anti-patrones)

- Aprobaciones rituales sin evidencia (firmar sin revisar).
- Deploy a producción sin aprobación (bypass del gate).
- Políticas solo documentadas, no aplicadas (nadie las lee).
- CAB para TODO cambio (sobre-proceso que paraliza).
- Auditoría incompleta (no se sabe quién aprobó qué versión).

### 13.7 Métricas recomendadas

- % de deploys a prod con aprobación registrada (target 100%).
- Tiempo medio de aprobación (bottleneck detection).
- Número de excepciones/políticas violadas (target 0).
- % de deploys que cumplen la ventana definida.

### 13.8 Fuentes

- https://docs.github.com/en/actions/managing-workflow-runs-and-deployments/managing-deployments/viewing-deployment-history
- https://www.openpolicyagent.org/docs/latest/cicd/
- https://www.conftest.dev/
- https://sre.google/sre-book/service-level-objectives/

### 13.9 Ejemplo práctico — GitHub Actions

```yaml
# .github/workflows/approval.yml
# Stage 11: GitHub Environments con protection rules
# (Este workflow define el environment; las aprobaciones se configuran en GitHub Settings)
#
# Configuración requerida en GitHub:
#   Settings → Environments → production:
#     ☑ Required reviewers (mínimo 1)
#     ☑ Wait timer: 15 minutos
#     ☑ Restrict to protected branches

name: Approval Gate

on:
  workflow_run:
    workflows: ['Performance']
    types: [completed]
    branches: [main]

permissions:
  contents: read
  deployments: write

jobs:
  request-approval:
    name: Wait for Production Approval
    runs-on: ubuntu-latest
    if: ${{ github.event.workflow_run.conclusion == 'success' }}
    environment:
      name: production # ← GitHub Enforces: required reviewers
    steps:
      - uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683 # v4.2.2
      - name: Verify SBOM & signatures
        run: |
          echo "Checking artifact provenance..."
          # Descargar y verificar attestations antes de deploy
          gh attestation verify sbom.spdx.json \
            --owner ${{ github.repository_owner }} || { echo "Attestation failed"; exit 1; }
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
      - name: Deploy to Production
        run: |
          echo "Approved! Deploying to production..."
          # Trigger deploy after approval
```

---

### 13.10 Governance a lo largo de todo el ciclo de vida (CI a CD, post-deploy y audit)

> **Principio rector:** Governance NO es el "Stage 11" aislado — es una capa continua que recorre `commit → PR → merge → build/artifact → deploy → post-deploy → audit/recovery`. El Stage 11 (§13) concentra las **decisiones de aprobación humana y cumplimiento**, pero la gobernanza se ejerce en cada momento del pipeline mediante controles automatizados y manuales combinados. Ver la matriz completa en [§23.3.2](#2332-matriz-completa-de-governance-por-momento-del-pipeline) y el ciclo de vida en [§23.3.1.1](#23311-ciclo-completo-de-governance-7-momentos-commit-a-audit).

#### 13.10.1 Aprobación automatizada vs manual

- **Automatizada (gate de código):** GitHub Rulesets (required status checks, required reviews, required signatures, CODEOWNERS, merge queue) y policy-as-code (OPA/Conftest/Kyverno) bloquean el merge o el deploy sin intervención humana cuando fallan controles objetivos. Fuente: [GitHub Docs — About rulesets](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/about-rulesets)
- **Manual (gate de persona):** GitHub Environments `required reviewers` + `wait timer` + `custom protection rules` (CAB/Change Advisory Board, SRB/Security Review Board) para cambios de alto riesgo. La aprobación humana se reserva para decisiones de riesgo real, no para rituales. Fuente: [GitHub Docs — Deployments and environments](https://docs.github.com/en/actions/reference/workflows-and-actions/deployments-and-environments)
- **Por riesgo (tiered):** cambios de bajo riesgo → aprobación automática; medio → 1 reviewer; alto → CAB + SRB + rollback plan validado. El change `ci-governance-pre-merge-gates` implementa los gates pre-PR/merge; los gates de deploy/post-merge se documentan aquí (OUT OF SCOPE de implementación en ese change).

#### 13.10.2 Change management (ITIL CAB / SOC 2 CC8.1 / ISO 27001 A.8.32)

El despliegue es un cambio controlado. Cada cambio a infraestructura, datos, software o procedimientos debe: **autorizarse, diseñarse, probarse, aprobarse y documentarse** antes de producción, con **segregación de deberes (SoD)** — quien propone no aprueba ni despliega unilateralmente.

- **Ticket linkage:** el commit/PR enlaza el cambio al ticket (ServiceNow/Jira) — trazabilidad commit → deploy. Fuente: [SOC 2 CC8.1 — Change Management](https://truvocyber.com/blog/soc-2-cc8-1-change-management)
- **Risk assessment:** clasificar el cambio (alto/medio/bajo) y definir rollback plan antes del deploy. Fuente: [ISO 27001:2022 A.8.32 (mapping AICPA)](https://www.aicpa-cima.com/resources/download/mapping-2017-trust-services-criteria-to-iso-27001)
- **Post-implementation review:** cambios fallidos/emergencia → retrospectiva (blameless postmortem).
- **Emergency changes:** se documentan y revisan después; el pipeline aún genera la evidencia (deploy log, approval record).

#### 13.10.3 Sign-off y evidencia de auditoría

- Cada gate produce **evidencia inmutable**: deployment event record (commit SHA, artifact SHA, aprobador, entorno, hora), SBOM + provenance attestations, resultados de SAST/SCA adjuntos al PR.
- El audit trail (WORM) alimenta **continuous compliance** (SOC 2 CC8.1, ISO 27001 A.8.32, NIST SSDF PS.3 — archive and protect each release + provenance).
- Las DORA metrics (deploy frequency, lead time, change failure rate, MTTR) cierran el loop dev→ops y evidencian la madurez de la gobernanza.

> **Alcance del change `ci-governance-pre-merge-gates`:** pre-PR/merge (commit signing, commit lint, PR metadata, dependency review, branch protection/rulesets, CODEOWNERS, merge queue) es **implementable**; build/artifact, deploy, post-deploy y audit son **documentados** (post-merge OUT OF SCOPE de implementación en este change, pero requeridos para cumplir SOC2/ISO/SSDF).

---

## 14. Stage 12 — Production Deployment Stage

### 14.1 Descripción

El stage de despliegue a producción aplica el artifact verificado con una **estrategia de release de bajo riesgo**: blue/green, canary, rolling, o feature flags. El objetivo es desplegar con **cero o mínimo downtime**, con capacidad de rollback inmediato y con observabilidad activa durante el proceso.

### 14.2 Objetivo de negocio

- Desplegar rápido y seguro: releases frecuentes sin incidentes.
- Minimizar el impacto de un fallo (blast radius limitado).
- Poder revertir en segundos si algo sale mal.

### 14.3 Estrategias de despliegue (exhaustivo)

1. **Rolling update:** reemplaza instancias gradualmente (pods/instancias de a poco); el sistema queda disponible, pero hay mezcla de versiones durante el deploy. Ejemplo: ECS rolling update, Kubernetes rolling update. Fuente: [Kubernetes Deployments](https://kubernetes.io/docs/concepts/workloads/controllers/deployment/)
2. **Blue/green:** dos entornos (azul = versión actual, verde = nueva); se despliega a verde, se verifica, y se cambia el tráfico. Rollback = volver el tráfico a azul. Fuente: [Blue/Green Deployments — AWS Whitepaper](https://docs.aws.amazon.com/whitepapers/latest/blue-green-deployments/welcome.html), [ECS blue/green](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/deployment-type-bluegreen.html)
3. **Canary release:** se expone la nueva versión a un pequeño % de tráfico (1-5%), se mide (métricas, errores, SLOs), y se incrementa gradualmente hasta 100%. Ejemplos: Argo Rollouts, Flagger, AWS AppConfig, Spinnaker. Fuente: [Argo Rollouts](https://argoproj.github.io/argo-rollouts/), [Flagger](https://flagger.app/), [CanaryRelease — Fowler](https://martinfowler.com/bliki/CanaryRelease.html)
4. **Feature flags (launches):** desplegar el código "apagado" y activar la feature para segmentos (usuarios, % de tráfico) sin redeploy. Complementa las otras estrategias. Fuente: [Feature Toggles — Fowler](https://martinfowler.com/articles/feature-toggles.html), [OpenFeature](https://openfeature.dev/), [LaunchDarkly](https://launchdarkly.com/)
5. **A/B testing:** variantes de producto a segmentos para medir negocio (no es estrategia de deploy, pero se apoya en flags).
6. **Smoke tests post-deploy en prod:** health checks y flujos críticos verificados inmediatamente tras el cambio de tráfico.
7. **Rollback automatizado:** si las métricas/SLOs empeoran durante el canary, se revierte automáticamente (Argo Rollouts/Flogger analysis). Fuente: [Netflix canary analysis (Kayenta)](https://netflixtechblog.com/implementing-canary-releases-of-netflix-deployment-api-with-aws-asm-3100a3b9df1)
8. **Deploy de BD antes del código (expand/contract):** migraciones compatibles hacia atrás: expandir esquema primero, desplegar código, luego contract. Fuente: [ParallelChange](https://martinfowler.com/bliki/ParallelChange.html), [Evolutionary Database Design](https://martinfowler.com/articles/evodb.html), [Zero-downtime migrations](https://bytebase.com/blog/)
9. **Deployments as code (GitOps):** el estado deseado en git (Argo CD/Flux) y el cluster converge; ideal para infraestructura. Fuente: [Argo CD](https://argo-cd.readthedocs.io/), [Flux](https://fluxcd.io/)
10. **Registro del deploy:** GitHub deployment events, tags, y metadata (versión, commit, persona, entorno) para trazabilidad.
11. **Pre-deploy readiness:** verificaciones finales: backups, feature flags configurados, variables de entorno, permisos, quotas.
12. **Post-deploy verification runbook:** qué verificar tras el deploy (health, métricas, logs, errores) documentado y automatizado donde sea posible.

### 14.4 Herramientas comunes

| Categoría          | Herramientas                                            |
| ------------------ | ------------------------------------------------------- |
| Orchestration      | GitHub Actions, Spinnaker, Argo Rollouts, Argo CD, Flux |
| Blue/green         | ECS CodeDeploy, ALB target groups, k8s services         |
| Canary             | Argo Rollouts, Flagger, Istio, AWS AppConfig            |
| Feature flags      | LaunchDarkly, Flagsmith, Unleash, OpenFeature           |
| BD migrations      | Prisma Migrate, Flyway, Liquibase, expand/contract      |
| Análisis de canary | Kayenta, Prometheus + metrics analysis                  |

### 14.5 Mejores prácticas

- Preferir canary + feature flags para features grandes; rolling/blue-green para deploys estándar.
- El rollback debe ser automático o de un solo clic, y probado (drills).
- Nunca desplegar BD y código a la vez sin compatibilidad hacia atrás.
- Los deploys se hacen con el artifact firmado y verificado (nunca reconstruir en el pipeline de deploy).
- Observabilidad activa durante y después del deploy (dashboards de canary).
- Desplegar con el mismo mecanismo en staging y prod (una sola vía).

### 14.6 Errores comunes (anti-patrones)

- Despliegues masivos (big bang) sin gradualidad.
- Rollback no probado (el plan existe pero nadie lo ha ejecutado).
- Cambio de BD destructivo antes de migrar el código.
- Deploy manual desde la consola (sin auditoría, sin reproducibilidad).
- Canary sin criterios de éxito definidos (no se sabe cuándo avanzar).
- Ignorar las métricas post-deploy (el deploy "verde" rompe producción silenciosamente).

### 14.7 Métricas recomendadas

- Change failure rate (DORA): % de cambios que degradan producción.
- MTTR/tiempo de rollback (DORA: time to restore).
- % de deploys con canary/gradual (target alto para cambios de riesgo).
- Tiempo de deploy total (commit → producción).

### 14.8 Fuentes

- https://docs.aws.amazon.com/whitepapers/latest/blue-green-deployments/welcome.html
- https://docs.aws.amazon.com/AmazonECS/latest/developerguide/deployment-type-bluegreen.html
- https://kubernetes.io/docs/concepts/workloads/controllers/deployment/
- https://argoproj.github.io/argo-rollouts/
- https://flagger.app/
- https://martinfowler.com/bliki/CanaryRelease.html
- https://martinfowler.com/articles/feature-toggles.html
- https://openfeature.dev/
- https://launchdarkly.com/
- https://netflixtechblog.com/implementing-canary-releases-of-netflix-deployment-api-with-aws-asm-3100a3b9df1
- https://argo-cd.readthedocs.io/
- https://fluxcd.io/
- https://martinfowler.com/bliki/ParallelChange.html
- https://martinfowler.com/articles/evodb.html
- https://bytebase.com/blog/
- https://www.prisma.io/docs/orm/prisma-migrate

### 14.9 Ejemplo práctico — GitHub Actions

```yaml
# .github/workflows/deploy-production.yml
# Stage 12: Canary deploy + automated rollback
name: Deploy Production

on:
  workflow_dispatch:
    inputs:
      version:
        description: 'Version to deploy'
        required: true

permissions:
  contents: read
  deployments: write

jobs:
  canary:
    name: Canary Deploy (10% → 50% → 100%)
    runs-on: ubuntu-latest
    environment:
      name: production
      url: https://project-one.example.com
    strategy:
      matrix:
        weight: [10, 50, 100]
    steps:
      - uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683 # v4.2.2

      - name: Deploy canary ${{ matrix.weight }}%
        run: |
          echo "Deploying version ${{ inputs.version }} at ${{ matrix.weight }}% traffic"
          # Replace: kubectl set image / ecs update-service / flagger promote

      - name: Monitor canary metrics (5 min)
        run: |
          echo "Monitoring error rate and latency for 5 minutes..."
          # Replace: kubectl logs, Prometheus queries, custom monitoring script
          sleep 300

      - name: Check error rate
        run: |
          ERROR_RATE=$(curl -s "http://prometheus:9090/api/v1/query?query=rate(http_requests_total{status=~'5..'}[5m])" | jq '.data.result[0].value[1]' -r)
          echo "Error rate: $ERROR_RATE"
          if [ $(echo "$ERROR_RATE > 0.05" | bc) -eq 1 ]; then
            echo "FAIL: Error rate > 5%. Rolling back..."
            # Replace: rollback command
            exit 1
          fi

      - name: Promotion gate
        if: matrix.weight < 100
        run: echo "Canary at ${{ matrix.weight }}% stable. Proceeding to next step."

  rollback:
    name: Emergency Rollback
    runs-on: ubuntu-latest
    needs: canary
    if: failure()
    steps:
      - name: Rollback to previous version
        run: |
          echo "ROLLBACK: Reverting to previous stable version"
          # Replace: kubectl rollout undo / ECS rollback
```

---

## 15. Stage 13 — Post-Deployment / Monitoring Stage

### 15.1 Descripción

El stage post-deploy garantiza que el sistema **sigue sano después del despliegue**: monitoreo de salud, métricas, logs, trazas, alertas y respuesta a incidentes. Es donde se cierra el círculo del ciclo de vida: el deploy no termina cuando el tráfico cambia, sino cuando el sistema demuestra salud sostenida (o se activa el rollback).

### 15.2 Objetivo de negocio

- Detectar problemas post-deploy lo antes posible (MTTD bajo).
- Recuperarse rápido (MTTR bajo) — métrica DORA clave.
- Aprender de los incidentes (blameless postmortems) para mejorar el pipeline.

### 15.3 Prácticas recomendadas (exhaustivo)

1. **Los tres pilares de la observabilidad:** logs (eventos), métricas (números temporales) y trazas (flujos de peticiones). OpenTelemetry como estándar para instrumentación. Fuente: [OpenTelemetry](https://opentelemetry.io/), [SRE book — Monitoring](https://sre.google/sre-book/monitoring-distributed-systems/)
2. **Health checks:** liveness/readiness/startup probes en k8s; health endpoints en Express (`/health`, `/ready`). Fuente: [Kubernetes probes](https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/)
3. **SLOs y presupuestos de error (error budgets):** definir SLOs (objetivo de servicio, ej. 99.9% disponibilidad), medir SLIs y gestionar error budgets. Fuente: [SRE — Service Level Objectives](https://sre.google/sre-book/service-level-objectives/)
4. **Synthetic monitoring:** checks proactivos desde fuera (uptime, transacciones críticas) — Grafana Synthetic Monitoring, UptimeRobot, Pingdom, Checkly.
5. **RUM (Real User Monitoring):** métricas de experiencia real del usuario (Core Web Vitals: LCP, INP, CLS) — Datadog RUM, Sentry, Grafana Faro.
6. **Alerting basado en SLOs:** alertas cuando se consume el error budget, no solo cuando "algo se rompe"; evitar alertas ruidosas (paging on symptoms, no on causes).
7. **Incident response:** runbooks, on-call, escalado, canales de incidente, clasificación de severidad.
8. **Postmortems sin culpa (blameless):** análisis de causa raíz, acciones correctivas y seguimiento. Fuente: [SRE — Postmortem Culture](https://sre.google/sre-book/postmortem-culture/)
9. **Log aggregation:** centralizar logs (ELK/Loki/CloudWatch/Datadog) con correlación entre servicios y request IDs.
10. **Dashboards por servicio y por release:** comparar métricas de la nueva versión contra la anterior (canary dashboards).
11. **Automatización del rollback:** si las alertas/SLOs se violan en la ventana post-deploy, activar rollback (manual o automático según política).
12. **Release markers en observabilidad:** marcar en dashboards/logs cuándo se desplegó cada versión (deploy markers) para correlacionar cambios con métricas.
13. **Monitoreo del pipeline en sí:** medir la salud del CI/CD (tiempos, tasas de fallo) para detectar degradación de la infraestructura de entrega.
14. **Business KPI monitoring:** monitoreo de métricas de negocio impactadas por el deploy, distincto de métricas técnicas de infraestructura. Métricas: tasa de conversión, revenue por sesión, carrito de compra abandonment rate, registro de usuarios, engagement de usuarios. Herramientas: Google Analytics 4, Mixpanel, Amplitude, Datadog RUM (Real User Monitoring). Implementar: dashboards de negocio en Grafana/Datadog que se superponen con deploy markers; alertas automáticas si la conversión cae >5% en 15 min post-deploy. Diferente de SLOs técnicos (latencia, error rate) — business KPIs miden impacto en el negocio, no en la infraestructura.
15. **Threat Intelligence Feed Integration:** integración de feeds de inteligencia de amenazas para enriquecer la detección de seguridad en runtime. Fuentes: Sigma rules (reglas de detección de formato estándar), MITRE ATT&CK (framework de tácticas/techniques), AlienVault OTX, MISP (Malware Information Sharing Platform), CVE feeds (NVD). Implementar: (a) Sigma rules en SIEM (Splunk/Datadog/ELK) para detectar patrones de ataque conocidos; (b) CVE feeds para escaneo continuo de dependencias contra vulnerabilidades recién descubiertas; (c) IP/domain blocklists actualizadas en WAF/API Gateway. La integración es continua — no es un paso de CI/CD sino un componente de monitoreo en STAGE 11.

### 15.4 Herramientas comunes

| Categoría  | Herramientas                                        |
| ---------- | --------------------------------------------------- |
| Métricas   | Prometheus, Grafana, Datadog, CloudWatch, New Relic |
| Logs       | Loki, ELK, CloudWatch Logs, Datadog                 |
| Trazas     | Jaeger, Tempo, Zipkin, Datadog APM                  |
| Sintéticos | Grafana Synthetic Monitoring, Checkly, UptimeRobot  |
| RUM        | Datadog RUM, Sentry, Grafana Faro                   |
| Alerting   | Alertmanager, PagerDuty, Opsgenie                   |
| Incidentes | Incident.io, PagerDuty, Opsgenie                    |
| OTel       | OpenTelemetry Collector, SDKs                       |

### 15.5 Mejores prácticas

- Definir SLOs antes de producir (el SLO guía las alertas y los presupuestos).
- Alertar sobre síntomas (latencia, errores, disponibilidad), no sobre causas individuales.
- Post-deploy: ventana de observación (10-30 min) con dashboards dedicados antes de dar el release por "completado".
- Correlacionar deploys con métricas (deploy markers) para identificar regresiones rápido.
- Documentar runbooks de rollback y probarlos periódicamente.

### 15.6 Errores comunes (anti-patrones)

- Monitoreo "pasivo" (dashboards que nadie mira) sin alertas accionables.
- Alertas demasiado sensibles (pager-fatigue → alertas ignoradas).
- Sin SLOs definidos (no se sabe qué significa "sano").
- Incidentes sin postmortem (los mismos errores se repiten).
- Métricas de promedio que ocultan degradación de p95/p99.
- Rollback manual lento (minutos de downtime evitables).

### 15.7 Métricas recomendadas

- MTTD (Mean Time to Detect) y MTTR (Mean Time to Restore) — DORA.
- Disponibilidad real vs SLO.
- Error budget restante.
- Cobertura de instrumentación (% servicios con métricas/trazas).
- Volumen de alertas por semana (target: pocas, accionables).

### 15.8 Fuentes

- https://sre.google/sre-book/service-level-objectives/
- https://sre.google/sre-book/monitoring-distributed-systems/
- https://sre.google/sre-book/postmortem-culture/
- https://opentelemetry.io/
- https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/
- https://grafana.com/docs/grafana-cloud/synthetic-monitoring/
- https://oneuptime.com/

### 15.9 Ejemplo práctico — GitHub Actions

```yaml
# .github/workflows/post-deploy.yml
# Stage 13: Post-deploy smoke tests + rollback trigger
name: Post-Deploy Monitoring

on:
  workflow_run:
    workflows: ['Deploy Production']
    types: [completed]
    branches: [main]

permissions:
  contents: read

jobs:
  smoke-test:
    name: Production Smoke Test
    runs-on: ubuntu-latest
    if: ${{ github.event.workflow_run.conclusion == 'success' }}
    steps:
      - uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683 # v4.2.2

      - name: Health check
        run: |
          for i in 1 2 3; do
            STATUS=$(curl -sf -o /dev/null -w '%{http_code}' https://project-one.example.com/health)
            if [ "$STATUS" = "200" ]; then
              echo "Health check passed (attempt $i)"
              exit 0
            fi
            echo "Attempt $i failed (status: $STATUS), retrying in 10s..."
            sleep 10
          done
          echo "FAIL: Health check failed after 3 attempts"
          exit 1

      - name: Critical path smoke tests
        run: |
          # Login flow
          curl -sf -X POST https://project-one.example.com/api/auth/login \
            -H "Content-Type: application/json" \
            -d '{"email":"smoke-test@example.com","password":"test"}' || exit 1
          echo "Login smoke passed"
          # API critical endpoints
          curl -sf https://project-one.example.com/api/health/detailed || exit 1
          echo "API smoke passed"

      - name: Deploy marker
        if: success()
        run: |
          echo "::notice::Deploy verified at $(date -u +%Y-%m-%dT%H:%M:%SZ)"

  auto-rollback:
    name: Auto-Rollback
    runs-on: ubuntu-latest
    needs: smoke-test
    if: failure()
    steps:
      - name: Trigger rollback
        run: |
          echo "ROLLBACK: Smoke test failed. Reverting to previous version."
          # Replace: kubectl rollout undo / ECS rollback / gh workflow run rollback.yml
```

---

## 16. Stage 14 — Cleanup / Teardown Stage

### 16.1 Descripción

El stage de limpieza gestiona el **ciclo de vida de los recursos temporales**: destruir preview environments al cerrar PRs, eliminar artifacts obsoletos, limpiar cachés, controlar costos (FinOps) y cumplir políticas de retención. Un pipeline maduro automatiza la limpieza tanto como el deploy.

### 16.2 Objetivo de negocio

- Controlar costos: los entornos efímeros y los artifacts sin retención cuestan dinero.
- Evitar "basura" que contamine pruebas futuras (envs obsoletos que rompen E2E).
- Cumplir políticas de retención de datos y compliance.

### 16.3 Prácticas recomendadas (exhaustivo)

1. **Destroy on merge/close:** al cerrar un PR, destruir automáticamente su preview environment (workflow `on: pull_request: closed` en GitHub Actions).
2. **TTL en entornos efímeros:** entornos sin actividad N días se destruyen automáticamente (política de caducidad).
3. **Retención de artifacts:** política por tipo (previews: días; releases: meses/años); purga automática.
4. **Limpieza de cachés de CI:** purgar cachés corruptos/obsoletos para evitar falsos verdes.
5. **Limpieza de recursos de cloud:** instancias, volúmenes, load balancers, DNS de previews huérfanos (tagging + scripts de barrido, AWS Nuke para lab).
6. **FinOps:** etiquetado de costos por entorno/equipo, reportes de coste, alertas de presupuesto.
7. **Rotación de credenciales:** credenciales de entornos efímeros se rotan/revocan al destruirlos.
8. **Limpieza de datos de prueba:** entornos de prueba con datos sensibles se borran de forma segura (anonimización/purga).
9. **Policy de retención de logs/registros:** según compliance (ej. 90 días para logs de auditoría).
10. **Revisión periódica de recursos huérfanos:** scripts de auditoría que detectan recursos sin owner/uso.

### 16.4 Herramientas comunes

| Categoría        | Herramientas                                                    |
| ---------------- | --------------------------------------------------------------- |
| Destroy previews | GitHub Actions workflows, Vercel/Netlify auto-destroy, Qovery   |
| Gestión de costs | AWS Cost Explorer, CloudHealth, Infracost                       |
| Tagging/barrido  | AWS Tag Editor, aws-nuke, Cloud Custodian                       |
| Retención        | ECR lifecycle policies, GitHub Packages retention, S3 lifecycle |
| Cachés           | actions/cache (con expiry), purge scripts                       |

### 16.5 Mejores prácticas

- Todo entorno efímero debe tener un TTL (si no se usa, se destruye).
- La limpieza es parte del pipeline: automatizada, no manual.
- Tagging obligatorio (env, owner, TTL) para poder auditar y limpiar.
- Políticas de retención explícitas y documentadas.
- Costos visibles: dashboards FinOps por entorno.

### 16.6 Errores comunes (anti-patrones)

- Preview environments acumulados sin destruir (costos y confusión).
- Artifacts ilimitados en el registry (costos de almacenamiento).
- Dependencias de entornos efímeros de otros PRs (contaminación).
- Sin tagging: imposible saber qué recurso pertenece a qué.
- Limpieza manual que nadie ejecuta.

### 16.7 Métricas recomendadas

- Número de entornos efímeros activos (target: solo PRs abiertos).
- Coste por entorno y por release.
- % de recursos con tagging correcto (target 100%).
- Tiempo de vida medio de entornos efímeros.

### 16.8 Fuentes

- https://vercel.com/docs/deployments/preview-deployments — https://vercel.com/
- https://www.qovery.com/
- https://docs.aws.amazon.com/AmazonECR/latest/userguide/lifecycle_policy.html
- https://www.infracost.io/

### 16.9 Ejemplo práctico — GitHub Actions

```yaml
# .github/workflows/cleanup.yml
# Stage 14: Preview environment destroy + cache purge
name: Cleanup

on:
  pull_request:
    types: [closed]
  schedule:
    - cron: '0 3 * * 0' # Weekly cleanup

permissions:
  contents: read
  pull-requests: write

jobs:
  destroy-preview:
    name: Destroy Preview Environment
    runs-on: ubuntu-latest
    if: github.event_name == 'pull_request' && github.event.pull_request.merged == false
    steps:
      - uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683 # v4.2.2
      - name: Teardown preview
        run: |
          PR_NUMBER=${{ github.event.pull_request.number }}
          echo "Destroying preview environment for PR #${PR_NUMBER}"
          # Replace: docker compose down, kubectl delete namespace, cloud cleanup
          docker compose -f docker-compose.preview.yml down -v --remove-orphans || true
          # Remove preview DNS, load balancer, etc.

  purge-old-artifacts:
    name: Purge Old Artifacts
    runs-on: ubuntu-latest
    if: github.event_name == 'schedule'
    steps:
      - uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683 # v4.2.2
      - name: Delete stale workflow runs
        uses: Mattraks/delete-workflow-runs@main
        with:
          retain_days: 30
          keep_minimum_runs: 10

  cleanup-caches:
    name: Cleanup GitHub Actions Caches
    runs-on: ubuntu-latest
    if: github.event_name == 'schedule'
    steps:
      - uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683 # v4.2.2
      - name: Purge caches older than 7 days
        uses: actions/github-script@60a0d83039c74a4aee543508d2ffcb1c3799cdea # v7.0.1
        with:
          script: |
            const caches = await github.rest.actions.getActionsCacheList({
              owner: context.repo.owner,
              repo: context.repo.repo,
              per_page: 100,
            });
            const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
            for (const cache of caches.data.actions_caches) {
              if (new Date(cache.last_accessed_at).getTime() < cutoff) {
                await github.rest.actions.deleteActionsCacheById({
                  owner: context.repo.owner,
                  repo: context.repo.repo,
                  cache_id: cache.id,
                });
                console.log(`Deleted cache: ${cache.key}`);
              }
            }
```

---

## 17. Métricas DORA y métricas del pipeline

### 17.1 Las 4 métricas DORA (core)

| Métrica                            | Qué mide                                                     | Alta performance      | Baja performance |
| ---------------------------------- | ------------------------------------------------------------ | --------------------- | ---------------- |
| **Deployment Frequency**           | ¿Con qué frecuencia se despliega a producción?               | Múltiples deploys/día | Semanal/mensual  |
| **Lead Time for Changes**          | Tiempo desde commit hasta deploy en producción               | < 1 día               | Semanas/meses    |
| **Change Failure Rate (CFR)**      | % de deploys que causan degradación en producción            | 0-15%                 | 45%+             |
| **Time to Restore Service (MTTR)** | Tiempo desde el incidente hasta la restauración del servicio | < 1 hora              | Días             |

Fuente: [DORA — Accelerate State of DevOps 2019 (Google Cloud Blog)](https://cloud.google.com/blog/products/devops-sre/dora-2019-accelerate-state-of-devops-report) y [dora.dev](https://dora.dev/)

**Cómo se miden:** mediante integraciones del pipeline con el VCS y el sistema de deploys (ej. GitHub API para fechas de merge/deploy, Jira/PagerDuty para MTTR). Herramientas: DORA Metrics (Google), Jellyfish, harness DORA dashboards, o scripts propios con las GitHub APIs.

### 17.2 Métricas adicionales del pipeline (por stage)

| Área         | Métricas                                                                         |
| ------------ | -------------------------------------------------------------------------------- |
| Velocidad    | Tiempo de build, tiempo de test, tiempo total commit→deploy                      |
| Calidad      | Cobertura, mutation score, code smells, duplicación                              |
| Seguridad    | Vulnerabilidades abiertas, time-to-fix, % PRs escaneados                         |
| Fiabilidad   | Tasa de éxito de deploys, flaky tests, rollbacks                                 |
| Eficiencia   | Utilización de runners, costo por build, tiempo en cola de CI                    |
| Organización | Lead time de PR (creación→merge), tiempo de revisión, batch size (líneas por PR) |

### 17.3 Cómo usar las métricas

- **Objetivos, no metas imposibles:** las métricas DORA se comparan contra la propia línea base y la industria (percentiles), no contra números absolutos.
- **North star:** reducir lead time y CFR; aumentar deployment frequency con seguridad.
- **Evitar métricas de vanidad:** no medir solo el número de builds, sino el valor que entregan (deploys seguros).
- **Feedback loop:** revisar las métricas en retrospectivas y ajustar el pipeline (mejora continua).
- **Capability model de DORA:** DORA publica 24 capabilities (trunk-based development, continuous delivery, monitoring, etc.) correlacionadas con la performance. La adopción incremental produce mejoras medibles.

---

## 18. Pipeline as Code

### 18.1 Concepto

**Pipeline as Code** (también CI/CD as Code) consiste en definir el pipeline completo como archivos versionados en el repositorio: `workflow.yml` (GitHub Actions), `.gitlab-ci.yml`, `Jenkinsfile` declarativo, `.circleci/config.yml`, Tekton `Pipeline`/`Task`, Azure `azure-pipelines.yml`. El pipeline es código de primera clase: se revisa en PRs, se versiona, se prueba y se audita como cualquier otro código.

### 18.2 Beneficios

- **Versionado y trazabilidad:** cada cambio del pipeline se asocia a un commit/PR y autor.
- **Revisión por pares:** los cambios de CI/CD pasan por code review (evita pipelines rotos por "mejoras" no revisadas).
- **Reproducibilidad:** el pipeline viaja con el código (branch-aware).
- **Auditoría/compliance:** el historial del pipeline es evidencia.
- **Bootstrap de nuevos proyectos:** plantillas reutilizables (templates/reusable workflows).

### 18.3 Patrones por plataforma

1. **GitHub Actions:** workflows en `.github/workflows/*.yml`; eventos (`push`, `pull_request`, `workflow_dispatch`, `schedule`); jobs con steps; **reusable workflows** (llamadas entre workflows) y **composite actions** para lógica compartida; **environments** para gates; **concurrency** para cancelar runs obsoletos; **OIDC** para credenciales cloud efímeras. Fuente: [GitHub Actions docs](https://docs.github.com/en/actions)
2. **GitLab CI:** `.gitlab-ci.yml` con stages, jobs, rules; `include` para plantillas; runners compartidos/específicos; environments con approvals.
3. **Jenkins:** `Jenkinsfile` declarativo (pipeline DSL) con stages/agent/steps; shared libraries para lógica reutilizable; Jenkinsfile permite estructura condicional y paralelismo explícito.
4. **CircleCI:** `.circleci/config.yml` con workflows, jobs, orbs (paquetes reutilizables).
5. **Tekton (Kubernetes nativo):** CRDs `Pipeline`, `Task`, `PipelineRun`; ejecución en clusters k8s; ideal para plataformas internas. Fuente: [Tekton](https://tekton.dev/)
6. **Azure Pipelines:** `azure-pipelines.yml` con stages/jobs/steps y templates.
7. **Sistemas híbridos:** GitHub Actions + Argo CD (CI en Actions, CD GitOps en cluster) — patrón común y recomendable.

### 18.4 Mejores prácticas de pipeline as code

- **Un solo lugar de verdad:** la definición del pipeline vive en el repo, no en la UI de la plataforma.
- **Reusable workflows/templates:** extraer lógica común (build, test, security) a plantillas reutilizables para consistencia entre apps.
- **Secrets por environment:** nunca hardcodear secretos; usar secret stores (GitHub Secrets por environment, Vault, OIDC).
- **DRY en pipelines:** evitar duplicación masiva entre apps del monorepo; parametrizar por workspace.
- **Validar el pipeline:** lint de YAML (actionlint para GitHub Actions), validación local (act para ejecutar workflows localmente), tests de la lógica del pipeline cuando sea posible.
- **Pin de acciones a SHA:** seguridad de supply chain (evitar mutaciones en tags).
- **Documentación:** comentar workflows y mantener un README del pipeline (objetivo, triggers, cómo correr localmente).
- **Observabilidad del pipeline:** métricas de tiempos, tasas de fallo, costos por workflow; alertas si el pipeline se degrada.

### 18.5 Errores comunes

- Pipeline definido en la UI (no versionado) → se rompe sin saber quién lo cambió.
- Workflows gigantes con todo inline (imposibles de revisar/mantener).
- Secrets en los archivos del pipeline o en logs.
- Trigger con `pull_request` mal configurado (ej. se ejecuta en forks maliciosos con secretos expuestos — usar `pull_request_target` con cuidado extremo).
- Caché mal gestionada que produce resultados no reproducibles.
- Copiar-pegar pipelines entre repos sin mantenerlas (deriva).

### 18.6 Fuentes

- https://docs.github.com/en/actions
- https://docs.github.com/en/actions/security-guides/security-hardening-for-github-actions
- https://docs.github.com/en/actions/security-guides/using-openid-connect-with-github-actions
- https://www.jenkins.io/doc/book/pipeline/
- https://docs.gitlab.com/ee/ci/
- https://circleci.com/docs/
- https://tekton.dev/
- https://learn.microsoft.com/en-us/azure/devops/pipelines/?view=azure-devops
- https://github.com/rhysd/actionlint

---

## 19. Patrones avanzados

### 19.1 Workflow de ramas: trunk-based vs GitFlow vs GitHub Flow

| Aspecto           | Trunk-Based Development      | GitFlow                                                    | GitHub Flow               |
| ----------------- | ---------------------------- | ---------------------------------------------------------- | ------------------------- |
| Rama principal    | `main` (o `trunk`)           | `develop` + `main` (release branches)                      | `main`                    |
| Ramas de features | Cortas (1-2 días)            | Largas                                                     | Cortas (por PR)           |
| Releases          | Continuos desde `main`       | Release branches + tags                                    | Tags desde `main`         |
| Complejidad       | Baja                         | Alta                                                       | Media                     |
| Ideal para        | Entrega continua, CD         | Releases planificadas/versionadas (enterprise tradicional) | Entrega frecuente con PRs |
| Riesgo de merge   | Bajo (integración frecuente) | Alto (merges grandes tardíos)                              | Bajo                      |

Recomendación: **trunk-based + PRs cortos** es la base de CI/CD de alta performance (correlacionado con DORA). GitFlow tiene sentido cuando el negocio exige releases versionadas planificadas y mantenimiento de múltiples versiones simultáneas. Fuentes: [Trunk Based Development](https://trunkbaseddevelopment.com/), [GitFlow — Atlassian](https://www.atlassian.com/git/tutorials/comparing-workflows/gitflow-workflow), [GitHub Flow](https://docs.github.com/en/get-started/using-github/github-flow)

### 19.2 Feature flags (toggles)

- **Tipos:** release toggles (activar/desactivar features), experiment toggles (A/B), ops toggles (kill-switch), permission toggles (premium).
- **Ciclo de vida:** el flag nace con la feature, se activa progresivamente (por % o segmentos) y se **elimina** cuando la feature está estable (deuda de flags).
- **Best practices:** defaults seguros, flags de corta vida, eliminar flags antiguos, monitorear flags (proporción de tráfico), usar SDKs estándar (OpenFeature) para no acoplarse al proveedor.
- **Herramientas:** LaunchDarkly, Flagsmith, Unleash, OpenFeature (estándar CNCF), o flags en config de la app para casos simples.
- Fuente: [Feature Toggles — Fowler](https://martinfowler.com/articles/feature-toggles.html), [OpenFeature](https://openfeature.dev/)

### 19.3 Progressive Delivery (entrega progresiva)

Combinación de **canary releases + feature flags + análisis automatizado** para exponer nuevas versiones gradualmente y decidir con métricas:

1. Desplegar canary (1-5% de tráfico).
2. Analizar métricas/SLOs del canary vs baseline (análisis automatizado: Argo Rollouts + Prometheus, Flagger, Kayenta).
3. Avanzar al 25% → 50% → 100% (o rollback automático si se violan SLOs).
4. Desactivar la feature con flag si el problema persiste (kill-switch).

Fuentes: [Argo Rollouts](https://argoproj.github.io/argo-rollouts/), [Flagger](https://flagger.app/), [CanaryRelease — Fowler](https://martinfowler.com/bliki/CanaryRelease.html)

### 19.4 GitOps

- **Principio:** el repositorio git es la única fuente de verdad del estado deseado; un operador (Argo CD/Flux) converge el cluster al estado declarado en git.
- **Ventajas:** reversión instantánea (git revert), auditoría completa, consistencia multi-cluster, reconciliación automática de deriva.
- **Aplicación:** infraestructura (Terraform via Atlantis), Kubernetes (Argo CD/Flux), y aplicaciones.
- **Fuentes:** [Argo CD](https://argo-cd.readthedocs.io/), [Flux](https://fluxcd.io/), [GitOps — Weaveworks](https://www.weave.works/technologies/gitops/)

### 19.5 Entornos efímeros + preview environments

- Desplegar cada PR a un entorno aislado (frontend + backend + BD efímeras) para revisión humana y E2E.
- Destroy automático al cerrar el PR (ver Stage 14 Cleanup / Teardown).
- Fuente: [Qovery ephemeral environments](https://www.qovery.com/), [Vercel previews](https://vercel.com/)

### 19.6 Deploys sin downtime con migraciones de BD (expand/contract)

1. **Expand:** añadir columnas/tablas nuevas (compatibles hacia atrás) y desplegar.
2. **Deploy del código** que usa lo nuevo.
3. **Contract:** eliminar lo antiguo en un release posterior (backfill de datos incluido).

Fuente: [ParallelChange](https://martinfowler.com/bliki/ParallelChange.html), [Evolutionary Database Design](https://martinfowler.com/articles/evodb.html), [Zero-downtime schema migrations](https://bytebase.com/blog/)

---

## 20. DevSecOps integrado

### 20.1 Qué es

DevSecOps integra la seguridad en todo el ciclo de vida (plan → code → build → test → release → deploy → operate → monitor), compartiendo la responsabilidad de seguridad entre desarrollo, operaciones y seguridad. No es un stage más: es una **capa transversal** a todos los stages. Fuente: [OWASP DevSecOps Guideline](https://owasp.org/www-project-devsecops-guideline/)

### 20.2 Mapa de controles por stage

| Stage        | Controles de seguridad                                                             |
| ------------ | ---------------------------------------------------------------------------------- |
| Source       | Secret scanning (gitleaks), firma de commits, CODEOWNERS, dependency review        |
| Build        | Dependencias fijas (lockfile), builds reproducibles, escaneo de dependencias (SCA) |
| Code Quality | Reglas SAST básicas en lint (no-eval, no-secrets)                                  |
| Security     | SAST, SCA, secret scanning en CI, IaC scanning, container scanning                 |
| Artifact     | Firma (cosign), SBOM, attestations (SLSA)                                          |
| Integration  | Contract tests de seguridad (authz), pruebas de inyección                          |
| Staging      | DAST contra el entorno, pruebas de autenticación/autorización                      |
| Deploy Prod  | Gate de severidad, verificación de firma, OIDC sin secretos largos                 |
| Post-Deploy  | Monitoreo de seguridad (SIEM), alertas de anomalías, escaneos periódicos cron      |
| Cleanup      | Rotación/revocación de credenciales, purga segura de datos                         |

### 20.3 Modelo de madurez (shift-left progresivo)

1. **Nivel 1 — Reactivo:** escaneos manuales, seguridad solo en auditorías.
2. **Nivel 2 — Automatizado:** SAST/SCA en CI, gates básicos, secretos protegidos.
3. **Nivel 3 — Integrado:** DAST, IaC scanning, container scanning, firmas y SBOM, políticas (policy as code).
4. **Nivel 4 — Proactivo/continuo:** escaneos en cada commit, threat modeling en el diseño, chaos + seguridad (red teaming), monitoreo de seguridad en runtime (RASP, IAST).

### 20.4 Métricas DevSecOps

- Tiempo medio de remediación de vulnerabilidades (por severidad).
- % de pipelines con gates de seguridad activos.
- Cobertura: % de código, dependencias, contenedores e IaC escaneados.
- MTTD/MTTR de incidentes de seguridad.
- Número de excepciones de seguridad aprobadas.

### 20.5 Fuentes

- https://owasp.org/www-project-devsecops-guideline/
- https://owasp.org/Top10/
- https://slsa.dev/
- https://docs.sigstore.dev/
- https://www.openpolicyagent.org/docs/latest/cicd/
- https://docs.github.com/en/actions/security-guides/security-hardening-for-github-actions

---

## 21. Glosario

| Término                 | Definición                                                                    |
| ----------------------- | ----------------------------------------------------------------------------- |
| **Artifact**            | Output del build (binario, imagen, bundle) versionado e inmutable             |
| **Blue/Green**          | Dos entornos paralelos; cambio de tráfico atómico entre versiones             |
| **Canary**              | Exposición gradual de una nueva versión a un % de tráfico                     |
| **CD**                  | Continuous Delivery/Deployment: entrega o despliegue continuo                 |
| **CFR**                 | Change Failure Rate: % de cambios que degradan producción (DORA)              |
| **CI**                  | Continuous Integration: integración y verificación continua del código        |
| **DAST**                | Dynamic Application Security Testing: análisis de seguridad dinámico          |
| **DORA**                | DevOps Research and Assessment: investigación de métricas de entrega          |
| **Error budget**        | Presupuesto de error derivado del SLO (tiempo permitido de fallo)             |
| **Feature flag**        | Interruptor que activa/desactiva una feature sin redeploy                     |
| **GitOps**              | Git como fuente de verdad del estado deseado; operador converge el sistema    |
| **IAST**                | Interactive Application Security Testing: análisis en runtime durante pruebas |
| **IaC**                 | Infrastructure as Code: infraestructura definida como código                  |
| **Lead time**           | Tiempo commit → producción (DORA)                                             |
| **MTTD**                | Mean Time to Detect: tiempo medio de detección de incidentes                  |
| **MTTR**                | Mean Time to Restore: tiempo medio de restauración del servicio               |
| **OIDC**                | OpenID Connect: identidad federada para credenciales efímeras en CI           |
| **Preview environment** | Entorno efímero por PR para validación                                        |
| **Pipeline as Code**    | Pipeline definido como código versionado en el repo                           |
| **Rollback**            | Reversión a una versión anterior estable                                      |
| **SAST**                | Static Application Security Testing: análisis de seguridad estático           |
| **SBOM**                | Software Bill of Materials: inventario de componentes de software             |
| **SCA**                 | Software Composition Analysis: análisis de dependencias/vulnerabilidades      |
| **Shift-left**          | Mover verificaciones lo más temprano posible en el ciclo                      |
| **SLO/SLI**             | Service Level Objective/Indicator: objetivo/indicador de nivel de servicio    |
| **SLSA**                | Supply-chain Levels for Software Artifacts: framework de integridad de cadena |
| **Smoke test**          | Prueba mínima post-deploy que valida salud básica del sistema                 |
| **Trunk-based**         | Desarrollo sobre rama principal con integración frecuente                     |
| **UAT**                 | User Acceptance Testing: pruebas de aceptación del usuario/negocio            |

---

## 22. Fuentes consultadas

### Oficiales y de referencia (autoridad alta)

1. https://cloud.google.com/blog/products/devops-sre/dora-2019-accelerate-state-of-devops-report — DORA 2019, métricas de alto desempeño
2. https://dora.dev/ — Portal oficial DORA (research, capabilities, métricas)
3. https://www.conventionalcommits.org/ — Especificación Conventional Commits
4. https://semver.org/ — Versionado semántico
5. https://martinfowler.com/bliki/TestPyramid.html — Pirámide de testing
6. https://martinfowler.com/articles/practical-test-pyramid.html — Pirámide de testing práctica
7. https://martinfowler.com/bliki/ContractTest.html — Pruebas de contrato
8. https://martinfowler.com/articles/consumerDrivenContracts.html — Contratos consumer-driven
9. https://martinfowler.com/articles/feature-toggles.html — Feature toggles
10. https://martinfowler.com/bliki/CanaryRelease.html — Canary release
11. https://martinfowler.com/bliki/ParallelChange.html — Expand/contract
12. https://martinfowler.com/articles/evodb.html — Evolución de BD
13. https://trunkbaseddevelopment.com/ — Trunk-based development
14. https://owasp.org/www-project-devsecops-guideline/ — OWASP DevSecOps Guideline
15. https://owasp.org/Top10/ — OWASP Top 10
16. https://slsa.dev/ — SLSA framework
17. https://slsa.dev/spec/v1.2 — SLSA spec v1.2
18. https://docs.sigstore.dev/ — Sigstore (firma de artifacts)
19. https://github.com/slsa-framework/slsa-github-generator — SLSA GitHub generator
20. https://www.openpolicyagent.org/docs/latest/cicd/ — OPA en CI/CD
21. https://www.conftest.dev/ — Conftest (policy testing)
22. https://docs.github.com/en/actions — GitHub Actions docs
23. https://docs.github.com/en/actions/security-guides/security-hardening-for-github-actions — Hardening de GitHub Actions
24. https://docs.github.com/en/actions/security-guides/using-openid-connect-with-github-actions — OIDC en Actions
25. https://docs.github.com/en/actions/security-guides/sarif-support-for-code-scanning — SARIF
26. https://docs.github.com/en/code-security/supply-chain-security/understanding-your-software-supply-chain/about-dependency-review — Dependency review
27. https://docs.github.com/en/actions/using-workflows/caching-dependencies-to-speed-up-workflows — Caché de dependencias
28. https://docs.github.com/en/actions/publishing-packages/publishing-nodejs-packages — Publicación de paquetes Node
29. https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches — Protected branches
30. https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-merge-queue/about-merge-queues — Merge queues
31. https://docs.github.com/en/authentication/managing-commit-signature-verification/about-commit-signature-verification — Firma de commits
32. https://docs.github.com/en/actions/managing-workflow-runs-and-deployments/managing-deployments/viewing-deployment-history — Deployment history
33. https://docs.aws.amazon.com/whitepapers/latest/blue-green-deployments/welcome.html — Blue/green (AWS whitepaper)
34. https://docs.aws.amazon.com/AmazonECS/latest/developerguide/deployment-type-bluegreen.html — ECS blue/green
35. https://kubernetes.io/docs/concepts/workloads/controllers/deployment/ — K8s Deployments
36. https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/ — K8s probes
37. https://argoproj.github.io/argo-rollouts/ — Argo Rollouts (canary/blue-green)
38. https://flagger.app/ — Flagger (progressive delivery)
39. https://argo-cd.readthedocs.io/ — Argo CD (GitOps)
40. https://fluxcd.io/ — Flux (GitOps)
41. https://sre.google/sre-book/service-level-objectives/ — SLOs (Google SRE)
42. https://sre.google/sre-book/monitoring-distributed-systems/ — Monitoreo (Google SRE)
43. https://sre.google/sre-book/postmortem-culture/ — Postmortems (Google SRE)
44. https://opentelemetry.io/ — OpenTelemetry
45. https://pact.io/ — Pact (contract testing)
46. https://docs.pact.io/ — Pact docs
47. https://www.testcontainers.com/ — Testcontainers
48. https://stryker-mutator.io/ — Stryker (mutation testing)
49. https://learn.microsoft.com/en-us/dotnet/core/testing/unit-testing-with-mutation-testing — Mutation testing (Microsoft)
50. https://principlesofchaos.org/ — Chaos engineering principles

### Herramientas y blogs técnicos

51. https://semgrep.dev/ — Semgrep (SAST)
52. https://codeql.github.com/ — CodeQL (SAST)
53. https://gitleaks.io/ — Gitleaks (secret scanning)
54. https://www.checkov.io/ — Checkov (IaC scanning)
55. https://github.com/aquasecurity/tfsec — tfsec (IaC scanning, archivado → Trivy)
56. https://semantic-release.gitbook.io/ — semantic-release
57. https://k6.io/ — k6 (load testing)
58. https://grafana.com/docs/grafana-cloud/synthetic-monitoring/ — Grafana Synthetic Monitoring
59. https://vercel.com/ — Vercel (previews/deploy)
60. https://www.qovery.com/ — Qovery (ephemeral environments)
61. https://www.flywaydb.org/ — Flyway (migraciones)
62. https://www.liquibase.org/ — Liquibase (migraciones)
63. https://bytebase.com/blog/ — Migraciones zero-downtime (Bytebase blog)
64. https://openfeature.dev/ — OpenFeature (estándar feature flags)
65. https://launchdarkly.com/ — LaunchDarkly (feature flags)
66. https://netflixtechblog.com/implementing-canary-releases-of-netflix-deployment-api-with-aws-asm-3100a3b9df1 — Canary en Netflix (Kayenta)
67. https://oneuptime.com/ — OneUptime (SLO/monitoring)
68. https://www.atlassian.com/git/tutorials/comparing-workflows/gitflow-workflow — GitFlow (Atlassian)
69. https://docs.github.com/en/get-started/using-github/github-flow — GitHub Flow
70. https://www.weave.works/technologies/gitops/ — GitOps (Weaveworks)
71. https://tekton.dev/ — Tekton (CI/CD nativo k8s)
72. https://www.jenkins.io/doc/book/pipeline/ — Jenkins Pipeline
73. https://circleci.com/docs/ — CircleCI
74. https://learn.microsoft.com/en-us/azure/devops/pipelines/ — Azure Pipelines
75. https://github.com/rhysd/actionlint — actionlint (lint de workflows)
76. https://eslint.org/ — ESLint
77. https://prettier.io/ — Prettier
78. https://www.sonarsource.com/products/sonarqube/ — SonarQube
79. https://www.typescriptlang.org/tsconfig — TypeScript tsconfig
80. https://vitest.dev/guide/coverage — Vitest coverage
81. https://knip.dev/ — Knip (dead code)
82. https://cucumber.io/ — Cucumber (BDD)
83. https://github.com/anchore/syft — Syft (SBOM)
84. https://cyclonedx.org/ — CycloneDX (SBOM)
85. https://www.infracost.io/ — Infracost (costos IaC)
86. https://docs.aws.amazon.com/AmazonECR/latest/userguide/lifecycle_policy.html — ECR lifecycle policies
87. https://docs.aws.amazon.com/prescriptive-guidance/latest/strategy-cicd-litmus/understanding-cicd.html — AWS Prescriptive Guidance: CI/CD litmus (unit tests antes de build)
88. https://docs.aws.amazon.com/wellarchitected/latest/devops-guidance/ — AWS Well-Architected DevOps Guidance (QA post-deploy)
89. https://docs.gitlab.com/ee/user/application_security/sast/ — GitLab SAST (análisis sobre source code)
90. https://docs.gitlab.com/ee/user/application_security/dast/ — GitLab DAST (necesita app corriendo)
91. https://docs.gitlab.com/ee/ci/pipelines/ — GitLab CI/CD Pipelines (orden de stages)
92. https://dora.dev/capabilities/continuous-integration/ — DORA: Continuous Integration (tests + build en paralelo)
93. https://dora.dev/capabilities/continuous-delivery/ — DORA: Continuous Delivery (continuous testing)
94. https://docs.sonarsource.com/sonarqube-server/quality-standards-administration/managing-quality-gates — SonarQube Quality Gates (bloqueo de merge)
95. https://docs.snyk.io/implementation-guides/team-implementation-guide/phase-5-rolling-out-the-prevention-stage/add-and-configure-snyk-to-your-ci-cd-pipeline — Snyk CI/CD (gatekeeper)

> **Nota final sobre contexto project-one:** las herramientas actuales del monorepo (Vitest, Testing Library, Playwright, Prisma, Husky, Conventional Commits, GitHub Actions) cubren los stages 1, 2, 3, 5, 7 y parte del 8. Las brechas más relevantes para avanzar hacia un pipeline "empresarial" completo son: SAST/DAST y SCA automatizados en el gate de PR (Stage 4), firma + SBOM de artifacts (Stage 6), canary/blue-green con análisis automático (Stage 12), SLOs + alertas por error budget (Stage 13) y policy as code (Stage 11). **Ver sección 23 para el orden correcto de stages respaldado por 16 fuentes autoritativas.**

---

## 23. Orden correcto de stages — Evidencia de fuentes autoritativas (apéndice)

> **Nota:** Esta sección complementa los 14 stages descritos en las secciones 3-16 con hallazgos de investigación que establecen el orden **óptimo** de ejecución. Las 14 secciones anteriores describen cada stage en profundidad; esta sección define el **orden secuencial correcto** y por qué ciertos stages deben ejecutarse ANTES o EN PARALELO de otros.

### 23.1 El problema: Build antes de Validate

El documento principal (secciones 3-16) presenta los stages en un orden que coloca **Build (Stage 2) antes de Code Quality (Stage 3), Security (Stage 4) y Testing (Stage 5)**. Si bien cada stage está correctamente descrito individualmente, el **orden de ejecución** propuesto tiene un problema técnico fundamental:

> **Unit tests, SAST, SCA, linting y secret scanning NO requieren un artifact compilado como input.** Operan directamente sobre código fuente, lockfiles y manifiestos de dependencias. Ejecutarlos DESPUÉS del build es innecesario y añade latencia al pipeline.

Las fuentes autoritativas de la industria respaldan consistentemente que las validaciones sobre código fuente deben ejecutarse **antes o en paralelo** del build, no después.

### 23.2 Evidencia de fuentes Tier 1 (obligatorias)

#### AWS Prescriptive Guidance — El orden explícito

AWS documenta el pipeline de CD con un orden **explícito** donde los unit tests van ANTES del build:

> _"The most common steps include: **1. Unit tests**, **2. Code build**, 3. Resource provisioning, **4. Integration tests**"_

Fuente: [AWS Prescriptive Guidance — Understanding CI/CD Litmus Tests](https://docs.aws.amazon.com/prescriptive-guidance/latest/strategy-cicd-litmus/understanding-cicd.html)

**Implicación para project-one:** Vitest (unit tests) debe ejecutarse ANTES de `npm run build`. Los integration tests van después del build porque necesitan el artifact compilado.

#### GitLab — SAST corre sobre código fuente, no sobre artifacts

GitLab ejecuta SAST en el stage `test`, **sobre código fuente directamente**, sin requerir un artifact compilado:

> _"Static application security testing (SAST) discovers vulnerabilities in your **source code** before they reach production. Integrated directly into your CI/CD pipeline, SAST identifies security issues during development when they're easiest and most cost-effective to fix."_

Los jobs de SAST aparecen explícitamente _"under the `test` stage"_ en el `.gitlab-ci.yml` de ejemplo, junto con los unit tests.

Fuente: [GitLab SAST Documentation](https://docs.gitlab.com/ee/user/application_security/sast/)

#### GitLab CI/CD — Lint y compile como stages separados

GitLab documenta que un pipeline puede tener stages donde _"an early stage could have jobs that lint and compile code"_ — linting es un job temprano, separado del build:

> _"A small pipeline could consist of three stages: A `build` stage, with a job called `compile`... A `test` stage... A `deploy` stage"_

Fuente: [GitLab CI/CD Pipelines](https://docs.gitlab.com/ee/ci/pipelines/)

#### GitLab DAST — Requiere la aplicación corriendo

DAST (Dynamic Application Security Testing) **sí** requiere la aplicación desplegada y en ejecución:

> _"Dynamic application security testing (DAST) runs automated penetration tests to find vulnerabilities in your web applications and APIs **as they are running**... DAST is completely language-neutral and **examines your application from the outside in**"_

Fuente: [GitLab DAST Documentation](https://docs.gitlab.com/ee/user/application_security/dast/)

**Implicación:** DAST va después del deploy a staging (Stage 6 en la estructura reorganizada), no antes del build.

#### DORA — Tests y build en paralelo desde cada commit

DORA (DevOps Research and Assessment) establece que cada commit debe disparar **tanto el build como los tests** como actividades paralelas:

> _"Each commit should trigger a **build** of the software. Each commit should trigger a series of **automated tests** that provide feedback in a few minutes."_

> _"Continuous testing: **Testing throughout the software delivery lifecycle** rather than as a separate phase after dev complete."_

> _"testing security features **as a part of the automated test suite**"_

Fuente: [DORA — Continuous Integration](https://dora.dev/capabilities/continuous-integration/) y [DORA — Continuous Delivery](https://dora.dev/capabilities/continuous-delivery/)

**Implicación:** Tests y security scanning son actividades del mismo nivel que el build — no dependen de él. Se ejecutan en paralelo o antes.

#### SLSA — Unit tests como builds de nivel cero

El framework SLSA (Supply-chain Levels for Software Artifacts) clasifica los unit tests como builds de nivel más bajo, **previos a cualquier pipeline de release**:

> _"No requirements — L0 represents the lack of SLSA. Intended for **Development or test builds** of software that are built and run on the same machine, such as **unit tests**."_

Fuente: [SLSA Specification v1.2 — Levels](https://slsa.dev/spec/v1.2/levels)

#### OWASP — Detección temprana como objetivo

OWASP DevSecOps Guideline establece el orden de detección de seguridad como parte del pipeline, con el objetivo explícito de shift-left:

> _"The Ideal goal is '**detect security issues** (by design or application vulnerability) **as fast as possible**'"_

El orden de herramientas que proponen es: _"Scan git repositories (credential leakage) → SAST → SCA → IAST → DAST → IaC Scanning → Infrastructure scanning → Compliance check"_

Fuente: [OWASP DevSecOps Guideline](https://owasp.org/www-project-devsecops-guideline/)

**Implicación:** Credential scanning, SAST y SCA van al inicio del pipeline (pre-build). DAST va después del deploy.

#### SonarQube — Quality gate como gatekeeper del PR

SonarQube permite que los quality gates **bloqueen el merge del PR** sin necesidad de un artifact compilado:

> _"The quality gate status can be reported to your CI pipeline. It can be used to **fail your CI pipeline** if the quality gate fails"_

> _"It can be used to **block the merge of the pull request**"_

Fuente: [SonarQube — Managing Quality Gates](https://docs.sonarsource.com/sonarqube-server/quality-standards-administration/managing-quality-gates)

#### Snyk — Gatekeeper en el pipeline de build

Snyk actúa como gatekeeper **en el pipeline de build**, fallando si detecta vulnerabilidades:

> _"Using Snyk as a **gatekeeper in your build pipeline** prevents the introduction of new vulnerabilities, based on the 'fail' criteria you set"_

Fuente: [Snyk — CI/CD Pipeline Integration](https://docs.snyk.io/implementation-guides/team-implementation-guide/phase-5-rolling-out-the-prevention-stage/add-and-configure-snyk-to-your-ci-cd-pipeline)

#### AWS Well-Architected — QA después de cada deployment

AWS establece que los tests de QA (incluyendo seguridad) deben ejecutarse **después de cada deployment** a entornos no productivos:

> _"Incorporate QA stages into your delivery pipeline to automatically conduct required **functional, non-functional, security, and data tests after deployments occur**. Deployments to environments is the ideal enforcement point for quality assurance"_

> _"Each non-production deployment serves as a gate, only allowing changes to progress to the next stage after they pass all validations"_

Fuente: [AWS Well-Architected — DevOps Guidance](https://docs.aws.amazon.com/wellarchitected/latest/devops-guidance/)

**Implicación:** DAST, E2E tests y acceptance tests van DESPUÉS del deploy a staging, no antes.

#### Martin Fowler — Pirámide de testing y timing

Martin Fowler establece que los tests de alto nivel (E2E) son la **segunda línea de defensa**, no la primera, y deben ejecutarse al final del pipeline:

> _"High-level tests are there as **a second line of test defense**"_

> _"End-to-end tests by their very nature are **slower, more brittle, and more expensive to write**"_

> _"Teams should split out **longer-running tests** into a separate build using the **deployment pipeline pattern**"_

Fuente: [Martin Fowler — Test Pyramid](https://martinfowler.com/bliki/TestPyramid.html) y [Martin Fowler — Continuous Integration](https://martinfowler.com/articles/continuousIntegration.html)

#### Plataformas CI — Patrón universal

Las plataformas de CI/CD documentan consistentemente el patrón Build → Test → Deploy como mínimo, con tests que van después del build solo cuando lo requieren:

| Plataforma       | Patrón documentado                                                                                             | Fuente                                                                                         |
| ---------------- | -------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| **Jenkins**      | `stage('Build') { sh 'make' }; stage('Test') { sh 'make check' }; stage('Deploy') { sh 'make publish' }`       | [Jenkins Pipeline](https://www.jenkins.io/doc/book/pipeline/)                                  |
| **Azure DevOps** | _"Stages are the major divisions in a pipeline: build this app, run these tests, and deploy to preproduction"_ | [Azure DevOps Stages](https://learn.microsoft.com/en-us/azure/devops/pipelines/process/stages) |
| **CircleCI**     | `build → test → hold (approval) → deploy → cleanup`                                                            | [CircleCI Workflows](https://circleci.com/docs/guides/orchestrate/workflows/)                  |
| **GitLab**       | `build → test → canary → production`                                                                           | [GitLab Pipelines](https://docs.gitlab.com/ee/ci/pipelines/)                                   |

**Nota:** Estas plataformas colocan "Test" después de "Build" por convención de UI/nomenclatura, pero los **unit tests y SAST/SCA pueden ejecutarse como jobs paralelos ANTES del build** cuando se configuran explícitamente como jobs independientes (no dependientes del job de build).

### 23.3 Pipeline reorganizado — Orden óptimo con evidencia y discriminación por categoría

Basado en la investigación anterior, el orden óptimo de stages es. **Cada fase discrimina entre categorías: Testing, Security y Quality.** El diagrama incorpora las estrategias **Shift-left**, **Fail-fast**, **Fail-first**, **Progressive validation** y **Defense in depth**.

Además de los gates puntuales de GOVERNANCE que aparecen dentro de cada stage (Stage 1/2, 5, 7, 9, 10 y 11), el diagrama representa una **capa transversal continua de GOVERNANCE TRANSVERSAL** (Momento=CONTINUOUS) que recorre todo el pipeline desde el commit hasta el audit y no se limita a un momento concreto. Sus 10 dimensiones se detallan en la matriz §23.3.2 (filas `CONTINUOUS`) y se muestran como banda continua al cierre del diagrama. Ver también §13.10 (governance a lo largo de todo el ciclo de vida).

**Discriminación CI vs CD (según Octopus Deploy, Atlassian, DeployHQ):**

| Fase                          | Stage(s) | Tipo      | Definición                                                                                                                                             |
| ----------------------------- | -------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **CI (Integración Continua)** | 1–4      | CI        | Construye confianza centrada en el artefacto: unit tests, scans sobre source, build, integration tests contra el artefacto sin infraestructura externa |
| **⚡ FRONTERA**               | 5        | CD start  | Push al registry: Cosign, SBOM, publish — aquí termina CI, arranca CD                                                                                  |
| **CD (Entrega Continua)**     | 5–10     | CD        | Mueve artefacto validado hacia ambientes reales; Stage 9 es el gate que hace Delivery (no Deployment puro)                                             |
| **Post-CD**                   | 11       | Operación | Observability + cleanup — retroalimenta al ciclo vía DORA metrics                                                                                      |

> **Nota sobre Continuous Delivery vs Continuous Deployment:** Este pipeline es **Continuous Delivery** (no Continuous Deployment). Stage 9 tiene gate manual explícito (Environment Protection Rules, Security Review Board approval). El código siempre está en estado desplegable, pero un humano decide cuándo apretar el botón hacia Stage 10. Esto es correcto para un ERP financiero: el gate humano en Stage 9 es compliance (SoD), no una limitación.

> **Zona gris — Stage 4:** Integration Tests y Contract Tests corren contra el artefacto pero sin infraestructura externa desplegada → todavía CI. E2E ephemeral deploy dentro de ese stage técnicamente ya despliega algo (aunque sea efímero) → empieza a mezclarse con CD según definición estricta. En la práctica, la mayoría de equipos lo tratan como "CI extendido" mientras no toque staging/producción real.

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│           PIPELINE CI/CD ENTERPRISE — TODAS LAS ACTIVIDADES POR STAGE                   │
│           Testing / Security / Quality / Build / Deploy / Governance / Monitoring       │
│                                                                                         │
│  ESTRATEGIAS:  [SL] Shift-left  [FF] Fail-fast  [F1] Fail-first  [PV] Progressive val.  │
│                [DD] Defense-in-depth  [BL] Build-less/test-more  [FB] Fast feedback     │
│                                                                                         │
│  Convención: cada check local DEBE tener espejo en CI. Herramientas entre paréntesis.   │
└─────────────────────────────────────────────────────────────────────────────────────────┘

 [Commit/PR] → [ENTRY: PATH-FILTERED + CHANGE-DETECTION [BL]]
       │          ├─ Skip-CI on docs-only / non-code changes (§53.3)
       │          ├─ Affected-only gate: --filter=...[HEAD^1] antes de build/test/lint (§38)
       │          └─ Diff-scoped triggers: solo workspaces afectados en monorepo
       ▼
 ╔═══════════════════════════════════════════════════════════════════════════════════════╗
 ║  CI — INTEGRACIÓN CONTINUA (Stages 1–4)                                               ║
 ║  Construye confianza centrada en el artefacto: validate → build → integrate           ║
 ╚═══════════════════════════════════════════════════════════════════════════════════════╝
       │
 [STAGE 1: PRE-COMMIT HOOKS (local — skippable via --no-verify) [SL]]
       │          ├─ SECURITY: Secrets scan (Gitleaks), quick SAST (Semgrep) [DD]
       │          ├─ QUALITY: Lint+Format (lint-staged), large-file guard
       │          ├─ TESTING: Pre-push hooks — scoped tests (Vitest changed-only) [SL][F1]
       │          ├─ GOVERNANCE: Commit signing (GPG/sigstore gitsign)
       │          └─ GOVERNANCE: Commit lint (commitlint — Conventional Commits)
       │
       │  ┌─────────────────────────────────────────────────────────────────────────┐
       │  │  GOVERNANCE LIFECYCLE (6 pasos, NO es un stage paralelo — es el flujo   │
       │  │  que conecta commit → merge. Cada paso depende del anterior.)           │
       │  │                                                                         │
       │  │  1. LOCAL COMMIT SIGNING + COMMIT LINT (pre-commit hook)                │
       │  │     ├─ GPG/SSH/sigstore gitsign firma el commit automáticamente         │
       │  │     └─ commitlint valida Conventional Commits                           │
       │  │                                                                         │
       │  │  2. PR GATE (CI — 1 solo workflow GOVERNANCE) [FF][F1]                  │
       │  │     ├─ Commit Lint (commitlint — Conventional Commits)                  │
       │  │     ├─ Commit Signing verify (CI job — verifica GPG/SSH/sigstore)       │
       │  │     ├─ PR Metadata Checks (DCO sign-off, title/body templates)          │
       │  │     └─ Early-abort gate (solo diff PR, crítico/alta, segundos)          │
       │  │                                                                         │
       │  │  3. CODE PIPELINE (STAGES 2-8 — testing, security, quality, build)      │
       │  │     └─ GOVERNANCE: artifacts firmados (Cosign), SBOM, provenance        │
       │  │                                                                         │
       │  │  4. BRANCH PROTECTION (GitHub Rulesets — PASSIVO, lee resultados)       │
       │  │     ├─ Lee: ¿todos los required checks en verde?                        │
       │  │     ├─ Lee: ¿hay approval de reviewer requerido?                        │
       │  │     ├─ Lee: ¿commits están firmados?                                    │
       │  │     ├─ SÍ a todo → botón "Merge" habilitado                             │
       │  │     └─ NO a alguno → botón bloqueado, muestra qué falta                 │
       │  │                                                                         │
       │  │  5. POST-DEPLOY GOVERNANCE (stages 6-7)                                 │
       │  │     ├─ Change record/ticket linkage (ServiceNow/Jira)                   │
       │  │     ├─ Release readiness dashboard + sign-off evidence                  │
       │  │     └─ Acceptance record (who approved what, evidence archive)          │
       │  │                                                                         │
       │  │  6. MERGE + CLEANUP (post-merge)                                        │
       │  │     ├─ Deployment event record (timestamp, commit, artifact SHA)        │
       │  │     ├─ DORA Metrics capture (deploy frequency, lead time)               │
       │  │     ├─ Audit trail export (immutable, compliance-ready)                 │
       │  │     └─ Stale branch cleanup, artifact retention, secrets rotation       │
       │  └─────────────────────────────────────────────────────────────────────────┘
       ▼
┌──────────────────────────────────────────────────────────────────────────────────────┐
│  STAGE 2: PRE-BUILD — VALIDATE (source code, 0 dependencia de build)                 │
│                                                                                      │
│  ┌────────────────────────────────────────────────────────────────────────────────┐  │
│  │  GOVERNANCE (Paso 2 del ciclo — 1 solo workflow CI)                            │  │
│  │  ├─ Commit Lint (commitlint — Conventional Commits Validation)                 │  │
│  │  ├─ Commit Signing verify (CI job — verifica GPG/SSH/sigstore en cada commit)  │  │
│  │  ├─ PR Metadata Checks (DCO sign-off, title/body templates)                    │  │
│  │  └─ Early-abort gate [FF][F1]:                                                 │  │
│  │     ├─ Alcance: solo diff del PR (NO full repo)                                │  │
│  │     ├─ Severidad: solo CRÍTICA/ALTA (SQL injection, RCE, secrets hardcoded)    │  │
│  │     ├─ Tiempo: segundos — pocas reglas, poco código                            │  │
│  │     └─ Si falla → aborta pipeline ANTES de suites largas                       │  │
│  │     pero no corre en CI.                                                       │  │
│  └────────────────────────────────────────────────────────────────────────────────┘  │
│  ┌────────────────────────────────────────────────────────────────────────────────┐  │
│  │  TESTING                                                                       │  │
│  │  ├─ Unit Tests (Vitest/Jest) — [AWS: "1. Unit tests"] [SL]                     │  │
│  │  ├─ Snapshot Tests (Testing Library)                                           │  │
│  │  ├─ Coverage Tripwire — floor ratchet (c8/Vitest --coverage) [FF]              │  │
│  │  ├─ Test Impact Analysis (TIA) — solo tests afectados por diff [BL][FB]        │  │
│  │  ├─ Smart test ordering — rápido / previamente fallido primero [F1]            │  │
│  │  ├─ Test sharding — distribuir suites entre runners [FB]                       │  │
│  │  ├─ Coverage Merge Gate — merge artifacts de todos los shards, check-coverage  │  │
│  │  └─ Property-Based Testing (fast-check) — invariantes, parsers, lógica [SL]    │  │
│  └────────────────────────────────────────────────────────────────────────────────┘  │
│  ┌────────────────────────────────────────────────────────────────────────────────┐  │
│  │  SECURITY [DD]                                                                 │  │
│  │  ├─ Secrets Detection full-repo + history (Gitleaks/TruffleHog) [SL]           │  │
│  │  ├─ SAST diff-scoped en PR + full scan en merge/nightly [DD]                   │  │
│  │  ├─ SCA dependency scan lockfiles (Dependabot/Snyk/OSV-Scanner)                │  │
│  │  ├─ Dependency Review (security.yml — vuln+license en PR) [DD]                 │  │
│  │  ├─ License Compliance (FOSSA/ScanCode)                                        │  │
│  │  ├─ IaC Scanning (Checkov/tfsec/KICS) — [OWASP]                                │  │
│  │  ├─ Containerfile lint (Hadolint) — antes de Docker build                      │  │
│  │  ├─ Pipeline config scan (actionlint/zizmor) — unpinned actions                │  │
│  │  └─ Typosquatted package detection (Socket/GuardDog)                           │  │
│  └────────────────────────────────────────────────────────────────────────────────┘  │
│  ┌────────────────────────────────────────────────────────────────────────────────┐  │
│  │  QUALITY (Grupo A — source code)                                               │  │
│  │  ├─ Lint (ESLint/Ruff/golangci-lint) — [GitLab: "early stage lint"] [F1]       │  │
│  │  ├─ Format Check (Prettier --check / Black --check)                            │  │
│  │  ├─ Type Check strict (tsc --noEmit --incremental)                             │  │
│  │  ├─ Compile-check multi-lang (go vet / cargo check) [F1]                       │  │
│  │  ├─ Complexity Rules — ESLint complexity/max-lines-per-rule [SL][F1]           │  │
│  │  ├─ Dead Code Detection (knip/ts-prune)                                        │  │
│  │  ├─ Import Boundaries (dependency-cruiser)                                     │  │
│  │  ├─ PR Review Automation (DeepSource/CodeRabbit/SonarQube PR checks)           │  │
│  │  └─ Docs/CHANGELOG Validation (markdownlint/vale) [SL]                         │  │
│  └────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                      │
│  Todos PARALELOS. Matrix params: fail-fast:false, max-parallel: 4,                   │
│  continue-on-error. Concurrency groups: cancel runs obsoletos en mismo PR.           │
│  AWS "1. Unit tests, 2. Code build". DORA: tests + build paralelo. [FF][FB]          │
└──────────────────────────────────────────────────────────────────────────────────────┘
      │ (all green)
      ▼
┌──────────────────────────────────────────────────────────────────────────────────────┐
│  STAGE 3: BUILD (compilación, empaquetado, artifact)                                 │
│                                                                                      │
│  ┌────────────────────────────────────────────────────────────────────────────────┐  │
│  │  BUILD                                                                         │  │
│  │  ├─ Reproducible install (npm ci / yarn --frozen-lockfile)                     │  │
│  │  ├─ Compilation (Vite build / tsc / webpack) — [AWS: "2. Code build"]          │  │
│  │  ├─ Bundling + minification + compression (gzip/brotli)                        │  │
│  │  ├─ Docker image build multi-arch (docker buildx / kaniko)                     │  │
│  │  ├─ Hermetic build (Bazel/Nix — build reproducible)                            │  │
│  │  ├─ Build caching remote (Turborepo/Nx/BuildKit)                               │  │
│  │  └─ Codegen artifacts (OpenAPI client, GraphQL codegen)                        │  │
│  └────────────────────────────────────────────────────────────────────────────────┘  │
│  ┌────────────────────────────────────────────────────────────────────────────────┐  │
│  │  SECURITY (build-time)                                                         │  │
│  │  ├─ Container Image Scan (Trivy image/Grype/Anchore) — [SLSA L0]               │  │
│  │  ├─ SBOM Generation CycloneDX/SPDX (Syft/Trivy sbom) — EO 14028                │  │
│  │  └─ Base-image hardening check (digest pin, distroless)                        │  │
│  └────────────────────────────────────────────────────────────────────────────────┘  │
│  ┌────────────────────────────────────────────────────────────────────────────────┐  │
│  │  QUALITY (build-time)                                                          │  │
│  │  ├─ Bundle Size Analysis (size-limit / source-map-explorer)                    │  │
│  │  ├─ Tree-shaking Verification (rollup-plugin-visualizer)                       │  │
│  │  └─ Schema Contract Validation (Spectral / protoc)                             │  │
│  └────────────────────────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────────────────────────────────────────────────┐
│  STAGE 4: POST-BUILD — INTEGRATE (requieren artifact compilado)                      │
│                                                                                      │
│  ┌────────────────────────────────────────────────────────────────────────────────┐  │
│  │  TESTING                                                                       │  │
│  │  ├─ Integration Tests (Testcontainers/supertest) — [AWS: "4."]                 │  │
│  │  ├─ Contract Tests consumer-driven (Pact/Pact Broker)                          │  │
│  │  ├─ API Contract Validation (Newman/REST Assured/Schemathesis)                 │  │
│  │  ├─ Component Tests (Testing Library / Vitest)                                 │  │
│  │  ├─ Visual Regression (Percy/Chromatic/Playwright screenshots)                 │  │
│  │  ├─ Accessibility Scan WCAG 2.1 AA (axe-core/pa11y-ci)                         │  │
│  │  ├─ E2E ephemeral deploy (Playwright/Cypress)                                  │  │
│  │  ├─ Flaky Test Detection + quarantine [FF]                                     │  │
│  │  └─ Quarantine policy: pass-rate < 70% → auto-quarantine, requiere humano      │  │
│  │     para restaurar (verificar commit nuevo en archivo en 7 días o aprobación)  │  │
│  └────────────────────────────────────────────────────────────────────────────────┘  │
│  ┌────────────────────────────────────────────────────────────────────────────────┐  │
│  │  SECURITY                                                                      │  │
│  │  ├─ IAST runtime instrumentation (Contrast Security)                           │  │
│  │  └─ Fuzz Testing APIs/binaries (OSS-Fuzz/AFL++/GitLab Fuzz)                    │  │
│  └────────────────────────────────────────────────────────────────────────────────┘  │
│  ┌────────────────────────────────────────────────────────────────────────────────┐  │
│  │  QUALITY (Grupo B — artifact)                                                  │  │
│  │  ├─ SonarQube/SonarCloud full analysis (bugs, code smells, complexity,         │  │
│  │  │   duplicación cross-file, MI, Halstead) — necesita build + coverage [PV][DD]│  │
│  │  ├─ Coverage enforcement integration suite (c8/JaCoCo)                         │  │
│  │  ├─ Dependency Analysis — unused/missing deps (depcheck)                       │  │
│  │  └─ Contract validation output (OpenAPI spec compliance)                       │  │
│  └────────────────────────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────────────────────┘
       │
       ▼
 ╔═══════════════════════════════════════════════════════════════════════════════════════╗
 ║  ⚡ FRONTERA CI/CD — PUSH TO REGISTRY                                                 ║
 ║  Aquí termina Integración Continua, arranca Entrega Continua                          ║
 ║  El artefacto se publica, firma, y genera provenance — listo para ambientes reales    ║
 ╚═══════════════════════════════════════════════════════════════════════════════════════╝
       │
       ▼
 ┌──────────────────────────────────────────────────────────────────────────────────────┐
 │  STAGE 5: ARTIFACT & SIGN (empaquetado, firma, publicación)                          │
 │                                                                                      │
 │  ┌────────────────────────────────────────────────────────────────────────────────┐  │
 │  │  PACKAGING + SECURITY                                                          │  │
 │  │  ├─ Semantic Versioning + git tag (semantic-release/release-please)            │  │
 │  │  ├─ Publish to registry (npm/GHCR/ECR/Artifactory)                             │  │
 │  │  ├─ Artifact Signing (Cosign/Sigstore) — containers + binaries                 │  │
 │  │  ├─ SLSA Provenance Generation (slsa-github-generator)                         │  │
 │  │  ├─ SBOM Attach as signed attestation (cosign attach)                          │  │
 │  │  ├─ Notarization platform (Apple notarization / Windows signtool)              │  │
 │  │  ├─ Immutable Digest Pinning (SHA256, not tag)                                 │  │
 │  │  ├─ Registry-side continuous re-scan (ECR/Trivy registry)                      │  │
 │  │  └─ Signature + Provenance verification gate (cosign verify/slsa-verifier)     │  │
 │  └────────────────────────────────────────────────────────────────────────────────┘  │
 │  ┌────────────────────────────────────────────────────────────────────────────────┐  │
 │  │  GOVERNANCE (Paso 3 del ciclo — artifacts firmados)                            │  │
 │  │  ├─ Artifact promotion policy (staging registry → prod via pipeline)           │  │
 │  │  └─ Retention/immutability policy (no tag overwrite)                           │  │
 │  └────────────────────────────────────────────────────────────────────────────────┘  │
 └──────────────────────────────────────────────────────────────────────────────────────┘
       │
       ▼
 ╔═══════════════════════════════════════════════════════════════════════════════════════╗
 ║  CD — ENTREGA CONTINUA (Stages 5–10)                                                  ║
 ║  Mueve artefacto validado hacia ambientes reales; Stage 9 = gate manual (Delivery)    ║
 ╚═══════════════════════════════════════════════════════════════════════════════════════╝
       │
       ▼
┌──────────────────────────────────────────────────────────────────────────────────────┐
│  STAGE 6: DEPLOY STAGING (entorno de validación)                                     │
│                                                                                      │
│  ┌────────────────────────────────────────────────────────────────────────────────┐  │
│  │  DEPLOY                                                                        │  │
│  │  ├─ Infrastructure provisioning IaC (Terraform/CDK/Pulumi)                     │  │
│  │  ├─ DB Migrations expand phase (Prisma Migrate/Flyway/Liquibase)               │  │
│  │  ├─ Config + Secrets injection (Vault/External Secrets Operator)               │  │
│  │  ├─ Manifest render + apply (Helm/Kustomize/ArgoCD)                            │  │
│  │  ├─ Deployment strategy (rolling/blue-green/canary)                            │  │
│  │  ├─ DNS + TLS + WAF + CDN warm-up                                              │  │
│  │  └─ Feature flag init (LaunchDarkly/Unleash — flags OFF)                       │  │
│  └────────────────────────────────────────────────────────────────────────────────┘  │
│  ┌────────────────────────────────────────────────────────────────────────────────┐  │
│  │  TESTING                                                                       │  │
│  │  └─ Deployment Smoke Test (health/readiness endpoints)                         │  │
│  └────────────────────────────────────────────────────────────────────────────────┘  │
│  ┌────────────────────────────────────────────────────────────────────────────────┐  │
│  │  SECURITY                                                                      │  │
│  │  ├─ IaC plan-time scan + drift detection (Checkov/driftctl)                    │  │
│  │  ├─ Cluster posture checks (kube-bench/kube-hunter)                            │  │
│  │  └─ Admission policy (signed+scanned images — Kyverno/Gatekeeper)              │  │
│  └────────────────────────────────────────────────────────────────────────────────┘  │
│  ┌────────────────────────────────────────────────────────────────────────────────┐  │
│  │  GOVERNANCE (Paso 5 del ciclo — post-deploy)                                   │  │
│  │  └─ Change record/ticket linkage (ServiceNow/Jira)                             │  │
│  └────────────────────────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────────────────────────────────────────────────┐
│  STAGE 7: POST-DEPLOY — ACCEPT (app desplegada corriendo)                            │
│                                                                                      │
│  ┌────────────────────────────────────────────────────────────────────────────────┐  │
│  │  TESTING                                                                       │  │
│  │  ├─ Full E2E Regression (Playwright/Cypress) — [Fowler: "2nd line"]            │  │
│  │  ├─ Smoke Suite critical journeys (Playwright/Checkly)                         │  │
│  │  ├─ Synthetic Monitoring scripts (Checkly/Datadog Synthetics)                  │  │
│  │  ├─ UAT / Acceptance validation (manual + automated)                           │  │
│  │  └─ Memory Leak Detection (clinic.js / heap snapshots)                         │  │
│  └────────────────────────────────────────────────────────────────────────────────┘  │
│  ┌────────────────────────────────────────────────────────────────────────────────┐  │
│  │  SECURITY                                                                      │  │
│  │  ├─ DAST Active Scan auth-aware (OWASP ZAP/Burp/Nuclei) — [GitLab DAST]        │  │
│  │  ├─ API Security Testing BOLA/rate-limit (42Crunch/ZAP API scan)               │  │
│  │  ├─ Infrastructure Vuln Scan (Nessus/Trivy infra/AWS Inspector)                │  │
│  │  ├─ CNAPP Runtime Posture (Prisma Cloud/Wiz/Falco)                             │  │
│  │  └─ Misconfiguration scan deployed (ScoutSuite/Prowler)                        │  │
│  └────────────────────────────────────────────────────────────────────────────────┘  │
│  ┌────────────────────────────────────────────────────────────────────────────────┐  │
│  │  QUALITY (app desplegada)                                                      │  │
│  │  ├─ Lighthouse CI (Performance ≥ 90, LCP < 2.5s, CLS < 0.1)                    │  │
│  │  ├─ Visual Regression (Chromatic/Percy/Playwright)                             │  │
│  │  ├─ Accessibility Audit axe-core + manual (WCAG 2.1 AA)                        │  │
│  │  └─ Content/brand review gate (manual)                                         │  │
│  └────────────────────────────────────────────────────────────────────────────────┘  │
│  ┌────────────────────────────────────────────────────────────────────────────────┐  │
│  │  GOVERNANCE (Paso 5 del ciclo — post-deploy)                                   │  │
│  │  ├─ Release readiness dashboard + sign-off evidence                            │  │
│  │  └─ Acceptance record (who approved what, evidence archive)                    │  │
│  └────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                      │
│  Todos PARALELOS (todos requieren la app corriendo).                                 │
└──────────────────────────────────────────────────────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────────────────────────────────────────────────┐
│  STAGE 8: PERFORMANCE (stability + performance gated)                                │
│                                                                                      │
│  ┌────────────────────────────────────────────────────────────────────────────────┐  │
│  │  PERFORMANCE                                                                   │  │
│  │  ├─ Load Testing k6/Locust (p95 latency, throughput, error rate)               │  │
│  │  ├─ Stress Testing / Soak (extended duration under load)                       │  │
│  │  ├─ Spike Testing (burst traffic patterns)                                     │  │
│  │  ├─ Performance Budget Enforcement (Lighthouse CI / Web Vitals)                │  │
│  │  ├─ Resource Usage Profiling (CPU, memory, I/O under load)                     │  │
│  │  └─ Auto-scaling Validation (HPA trigger, cold-start time)                     │  │
│  └────────────────────────────────────────────────────────────────────────────────┘  │
│  ┌────────────────────────────────────────────────────────────────────────────────┐  │
│  │  SECURITY                                                                      │  │
│  │  └─ DDoS resilience / rate-limit validation under load                         │  │
│  └────────────────────────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────────────────────┘
       │
       ▼
 ┌──────────────────────────────────────────────────────────────────────────────────────┐
 │  STAGE 9: APPROVAL & GOVERNANCE (human gate + compliance)                            │
 │                                                                                      │
 │  ┌────────────────────────────────────────────────────────────────────────────────┐  │
 │  │  TESTING                                                                       │  │
 │  │  └─ UAT / Acceptance gate (manual QA sign-off)                                 │  │
 │  └────────────────────────────────────────────────────────────────────────────────┘  │
 │  ┌────────────────────────────────────────────────────────────────────────────────┐  │
 │  │  GOVERNANCE (Paso 4 del ciclo — Branch Protection lee esto)                    │  │
 │  │  ├─ Manual/Environment Protection Rules (GitHub environment approval)          │  │
 │  │  ├─ Security Review Board approval (for high-risk changes)                     │  │
 │  │  ├─ Quality gate (SonarQube quality gate pass)                                 │  │
 │  │  ├─ Security gate (vulnerability severity threshold)                           │  │
 │  │  ├─ Release Notes + CHANGELOG verification                                     │  │
 │  │  ├─ Compliance evidence archive (SOC2/ISO 27001/artifact trail)                │  │
 │  │  ├─ Policy-as-code validation (OPA/Conftest/Kyverno)                           │  │
 │  │  ├─ Code Freeze Check (freeze windows)                                         │  │
 │  │  ├─ Rollback Plan + Backout procedure documented                               │  │
 │  │  └─ Rollback Gate: verificar que migration-down existe + funciona en staging   │  │
 │  └────────────────────────────────────────────────────────────────────────────────┘  │
 │  ┌────────────────────────────────────────────────────────────────────────────────┐  │
 │  │  SECURITY                                                                      │  │
 │  │  └─ Penetration Testing approval (scheduled/third-party for critical)          │  │
 │  └────────────────────────────────────────────────────────────────────────────────┘  │
 │                                                                                      │
 │  Sequential: testing → security → governance approval chain.                         │
 │  Branch Protection (Paso 4 del ciclo) lee todos estos resultados passivamente.       │
 └──────────────────────────────────────────────────────────────────────────────────────┘
       │
       ▼
 ┌──────────────────────────────────────────────────────────────────────────────────────┐
 │  STAGE 10: DEPLOY PRODUCTION (release)                                               │
 │                                                                                      │
 │  ┌────────────────────────────────────────────────────────────────────────────────┐  │
 │  │  DEPLOY                                                                        │  │
 │  │  ├─ Strategy: canary / blue-green / rolling / feature flag progressive         │  │
 │  │  ├─ Canary analysis automated (Argo Rollouts + Prometheus/Loki)                │  │
 │  │  ├─ Traffic shifting (5% → 25% → 50% → 100%)                                   │  │
 │  │  ├─ Auto-rollback on metric degradation (latency/error rate) [FF]              │  │
 │  │  ├─ Roll-forward / hotfix-forward strategy [F1]                                │  │
 │  │  ├─ Infrastructure-as-Code apply (Terraform plan → apply)                      │  │
 │  │  └─ CDN cache invalidation + edge warm-up                                      │  │
 │  └────────────────────────────────────────────────────────────────────────────────┘  │
 │  ┌────────────────────────────────────────────────────────────────────────────────┐  │
 │  │  TESTING                                                                       │  │
 │  │  ├─ Production Smoke Tests (critical path health checks)                       │  │
 │  │  └─ Synthetic Monitoring activation (Checkly/Datadog)                          │  │
 │  └────────────────────────────────────────────────────────────────────────────────┘  │
 │  ┌────────────────────────────────────────────────────────────────────────────────┐  │
 │  │  GOVERNANCE (Paso 6 del ciclo — post-merge)                                    │  │
 │  │  ├─ Deployment event record (timestamp, commit, artifact SHA)                  │  │
 │  │  ├─ License Compliance final gate (FOSSA/ScanCode)                             │  │
 │  │  └─ CI/CD DORA Metrics capture (deploy frequency, lead time)                   │  │
 │  └────────────────────────────────────────────────────────────────────────────────┘  │
 └──────────────────────────────────────────────────────────────────────────────────────┘
       │
       ▼
 ╔═══════════════════════════════════════════════════════════════════════════════════════╗
 ║  POST-CD — OPERACIÓN CONTINUA (Stage 11)                                              ║
 ║  Observability + cleanup — retroalimenta al ciclo vía DORA metrics                    ║
 ║  No es CD en sentido estricto; es la fase que cierra el loop DevOps                   ║
 ╚═══════════════════════════════════════════════════════════════════════════════════════╝
       │
       ▼
 ┌──────────────────────────────────────────────────────────────────────────────────────┐
 │  STAGE 11: MONITOR & CLEANUP (observability + limpieza)                              │
 │                                                                                      │
 │  ┌────────────────────────────────────────────────────────────────────────────────┐  │
 │  │  MONITORING                                                                    │  │
 │  │  ├─ Observability (metrics/logs/traces — OpenTelemetry/Grafana/Prometheus)     │  │
 │  │  ├─ SLO monitoring + error budgets (burn-rate alerts)                          │  │
 │  │  ├─ Business KPI monitoring (conversion, revenue, adoption)                    │  │
 │  │  ├─ Runtime security monitoring (Falco/Sysdig/Amazon GuardDuty)                │  │
 │  │  ├─ Anomaly Detection (ML-driven, Datadog/Dynatrace)                           │  │
 │  │  ├─ Uptime SLA reporting (99.9% target tracking)                               │  │
 │  │  ├─ Time-to-first-feedback (commit → primer test < 5 min) [FB]                 │  │
 │  │  └─ Threat Intelligence Feed Integration (Sigma rules)                         │  │
 │  └────────────────────────────────────────────────────────────────────────────────┘  │
 │  ┌────────────────────────────────────────────────────────────────────────────────┐  │
 │  │  RESPONSE                                                                      │  │
 │  │  ├─ Incident Response automation (PagerDuty/Opsgenie + Slack)                  │  │
 │  │  ├─ Auto-remediation (self-healing, auto-restart, auto-revert)                 │  │
 │  │  ├─ Blameless Postmortems (template + 5-whys + timeline)                       │  │
 │  │  └─ Feature flag kill-switch (LaunchDarkly kill-switch)                        │  │
 │  └────────────────────────────────────────────────────────────────────────────────┘  │
 │  ┌────────────────────────────────────────────────────────────────────────────────┐  │
 │  │  CLEANUP + GOVERNANCE (Paso 6 del ciclo — post-merge)                          │  │
 │  │  ├─ Stale branch cleanup (gh, >30 days)                                        │  │
 │  │  ├─ Preview env cleanup (ephemeral, auto-destroy)                              │  │
 │  │  ├─ Container registry cleanup (untagged, old digests)                         │  │
 │  │  ├─ Artifact retention policy (rotate/archive/expire)                          │  │
 │  │  ├─ Build artifact purge (old caches, temp files)                              │  │
 │  │  ├─ Vault secrets rotation audit                                               │  │
 │  │  ├─ SBOM/Provenance archival (immutable store)                                 │  │
 │  │  ├─ DORA Metrics export (AI/ML/LLM projects only if applicable)                │  │
 │  │  └─ Audit trail export (immutable, compliance-ready)                           │  │
 │  └────────────────────────────────────────────────────────────────────────────────┘  │
 └──────────────────────────────────────────────────────────────────────────────────────┘
       │
       │  ═══════════════════════════════════════════════════════════════════════════════
       │
 ┌──────────────────────────────────────────────────────────────────────────────────────┐
 │  PIPELINE SEPARADO — SIN GATE DE MERGE (nightly / on-demand)                         │
 │                                                                                      │
 │  ┌────────────────────────────────────────────────────────────────────────────────┐  │
 │  │  MUTATION TESTING (Stryker — full sweep, non-blocking)                         │  │
 │  │  ├─ Schedule: nightly cron (e.g. 02:00 UTC) sobre main                         │  │
 │  │  ├─ On-demand: workflow_dispatch antes de releases                             │  │
 │  │  ├─ Mode: --incremental con baseline stryker-incremental.json cacheado         │  │
 │  │  ├─ Full --force periódico (weekly) para evitar drift del reporte              │  │
 │  │  ├─ Thresholds: --break-at como SEÑAL, NO required check                       │  │
 │  │  ├─ Reporte: HTML + badge + scoreboard de tendencia semanal                    │  │
 │  │  └─ Opcional: PR incremental diff-scoped (--since) advisory, jamás full gate   │  │
 │  └────────────────────────────────────────────────────────────────────────────────┘  │
 │                                                                                      │
 │  WHY SEPARATE: full sweep = mutants × suite duration (10-40x unit tests).            │
 │  ~8k mutantes → 4+ horas. PR pipeline agotaría 3k min/mes de GitHub Team en días.    │
 │  Ver §36.3 item 5 para análisis completo y fuentes (StrykerJS, CircleCI, Pitest).    │
 └──────────────────────────────────────────────────────────────────────────────────────┘
```

**GOVERNANCE TRANSVERSAL (CONTINUOUS) — capa continua que recorre todo el pipeline (commit → audit)**

No es una caja aislada en un stage: es una capa transversal continua que se aplica en paralelo a Testing / Security / Quality durante los 7 momentos del ciclo de governance (commit → PR → merge → build/artifact → deploy → post-deploy → audit). Se distingue de los gates puntuales de GOVERNANCE mostrados dentro de Stage 1/2, 5, 7, 9, 10 y 11.

Representación de la capa continua:

```
══════════════════════════════════════════════════════════════════════════════════════════════
 GOVERNANCE TRANSVERSAL (CONTINUOUS)
 commit ─▶ PR ─▶ merge ─▶ build/artifact ─▶ deploy ─▶ post-deploy ─▶ audit     (Momento = CONTINUOUS)
══════════════════════════════════════════════════════════════════════════════════════════════
```

**10 dimensiones transversales (Momento=CONTINUOUS)** — detalle y fuentes en la matriz §23.3.2 (filas `CONTINUOUS`):

1. Human repo access governance (RBAC)
2. Vulnerability mgmt governance (SLA / excepciones / disclosure)
3. Third-party & tooling governance (allowlist actions, license)
4. Data governance in pipelines (PII/PHI, masking, test data)
5. Release governance (trains, feature-flag, changelog, semver)
6. Incident & postmortem governance (SEV, SLA, war-room)
7. SLO / error-budget governance (release gate)
8. Configuration & environment drift governance
9. Meta-governance (governance-as-code, versionado, auditoría de policy)
10. Docs & knowledge governance (ADRs, docs-as-code, runbook review)

Coherencia: ver §13.10 (governance a lo largo de todo el ciclo de vida CI→CD→post-deploy→audit) y el ciclo de 7 momentos en §23.3.1.1. Las 10 dimensiones son **post-merge → documentadas (OUT OF SCOPE de implementación en el change `ci-governance-pre-merge-gates`)**, alineadas con la nota de alcance de §23.3.2.

### 23.3.1 Governance Lifecycle — Los 6 pasos del commit al merge

GOVERNANCE **no es un stage paralelo** — es un ciclo de vida de extremo a extremo que atraviesa `commit → PR → merge → build/artifact → deploy → post-deploy → audit/recovery`. Los 6 pasos originales (commit → merge) son el **núcleo CI**; a continuación se documenta la extensión CD y post-deploy/audit (momentos 4–7) sin romper el modelo. Cada momento depende del anterior y alimenta al siguiente:

```
  DEV COMMIT                    GOVERNANCE                     CODE PIPELINE
  ──────────                    ──────────                     ─────────────
  1. git commit -m "feat:..."   2. 1 solo workflow CI         3. Testing + Security
     └─ pre-commit hook            ├─ commitlint ✓              + Quality + Build
        firma + lint               ├─ PR metadata ✓            (stages 2-8)
        (GPG/sigstore +            └─ early-abort gate ✓
         commitlint)                  (diff PR, crítico/alta,
                                   ⚠️  signing verify ✓         segundos)
                                   (GitHub nativo, NO CI)
                                        │
                                        ▼
                              BRANCH PROTECTION              POST-DEPLOY + MERGE
                              (passivo — lee todo)           ────────────────────
                              4. ¿checks verdes? ✓           5. Change record
                                 ¿approval? ✓                   + sign-off evidence
                                 ¿commits firmados? ✓        6. Deployment record
                                        │                       + DORA metrics
                                        ▼                       + audit trail
                              ┌─────────────────┐
                              │  MERGE habilitado│
                              └─────────────────┘
```

**Clave:** Branch Protection (paso 4) NO es un job de CI — es una configuración de GitHub Rulesets que **lee pasivamente** los resultados de todos los required checks. Si falta algún check, approval o firma, el botón "Merge" se bloquea y muestra qué falta. El dev no hace click en "Merge" hasta que todo esté verde.

**Extensión CD/post-deploy:** el mismo principio de "capa pasiva que lee resultados" se aplica en deploy (GitHub Environments lee required reviewers/wait timer) y en post-deploy/audit (smoke tests, DORA, audit trail). La gobernanza no termina en el merge: continúa como gates automatizados + manuales hasta el audit. Ver [§23.3.1.1](#23311-ciclo-completo-de-governance-7-momentos-commit-a-audit) y [§23.3.2](#2332-matriz-completa-de-governance-por-momento-del-pipeline).

**⚠️ Nota sobre GOVERNANCE en Stage 2:** Los 4 items de GOVERNANCE que aparecen en el diagrama de Stage 2 (commitlint, commit signing verify, PR metadata, early-abort) son el **mismo workflow** que el paso 2 del ciclo de Governance Lifecycle arriba — NO se re-ejecutan. El diagrama de Stage 2 muestra dónde se ejecutan físicamente en el pipeline; el Lifecycle muestra la secuencia lógica del ciclo completo.

| Paso                            | ¿Quién ejecuta?  | ¿Cuándo?            | Ejemplo                                                                    | CI/CD           |
| ------------------------------- | ---------------- | ------------------- | -------------------------------------------------------------------------- | --------------- |
| 1. Commit Signing + Commit Lint | Dev (local)      | Pre-commit hook     | GPG key firma el commit + commitlint valida Conventional Commits           | CI (local)      |
| 2. PR Gate (1 solo workflow CI) | CI (automático)  | Push al PR          | commitlint, commit signing verify, PR metadata, early-abort                | CI              |
| 2a. Commit Signing verify (CI)  | CI (job)         | Push al PR          | `git verify-commit` — defense-in-depth contra solo confiar en GitHub badge | CI              |
| 2b. Commit Signing verify (GH)  | GitHub (nativo)  | Push al PR          | badge "Verified" — primera línea, no sustituye el job CI                   | CI (nativo)     |
| 3. Code Pipeline                | CI (automático)  | Después del PR gate | tests, security, quality, build                                            | CI (Stages 2–4) |
| 4. Branch Protection            | GitHub (passivo) | Continuous          | lee required checks, approval, signing                                     | CI (gate)       |
| 5. Post-deploy Governance       | CI + humano      | Después del deploy  | change record, sign-off                                                    | CD (Stages 6–9) |
| 6. Merge + Cleanup              | CI + GitHub      | Post-merge          | DORA metrics, audit trail, cleanup                                         | Post-CD         |

#### 23.3.1.1 Ciclo completo de Governance (7 momentos: commit a audit)

El núcleo CI (pasos 1–4 del diagrama anterior) se extiende con las fases CD y post-deploy sin romper el modelo. La gobernanza recorre los 7 momentos: además de estos 7 momentos puntuales, la capa **GOVERNANCE TRANSVERSAL (CONTINUOUS)** de la matriz §23.3.2 (10 dimensiones: acceso humano/RBAC, vulnerabilidades, terceros/tooling, datos/PII-PHI, release, incidentes/postmortem, SLO/error-budget, config/drift, meta-governance, docs/ADRs) se aplica de forma continua a lo largo de todos ellos — véase la banda continua al cierre del diagrama §23.3.

```
 [1 COMMIT] -> [2 PR GATE] -> [3 MERGE] -> [4 BUILD/ARTIFACT] -> [5 DEPLOY] -> [6 POST-DEPLOY] -> [7 AUDIT/RECOVERY]
    |             |             |              |                   |                |                  |
 firma GPG/    commitlint    branch          SLSA provenance    GitHub Envs +    smoke/health +    audit trail (WORM)
 sigstore+     PR metadata    protection       + SBOM + artifact  required reviewers canary vs        DORA metrics +
 commitlint    early-abort    (lee checks,     signing (cosign)  + wait timer +   baseline +         compliance evidence
 + pre-commit  + signing verify approval,       + policy-as-code  custom protection release readiness (SOC2/ISO/SSDF)
 hooks secret  + code pipeline firma)           (OPA/Kyverno)     rules (CAB/SRB)   + rollback/
 (gitleaks)   (CI)          -> MERGE          + artifacts        (auto + manual    fix-forward       continuous
                             habilitado        inmutables        por riesgo)       (change mgmt)     compliance
```

- **Momento 1 — Commit-time:** firma (GPG/SSH/Sigstore gitsign), commit lint (Conventional Commits), pre-commit hooks (secret scan local). Ejecuta el dev en local; primera línea de defensa.
- **Momento 2 — PR-time:** 1 solo workflow CI agrupa commitlint, PR metadata (DCO/templates), early-abort SAST en diff, dependency review (SCA en diff), y commit signing verify (job CI + badge GH nativo). Fuente: [GitHub Docs — Dependency review](https://docs.github.com/code-security/supply-chain-security/understanding-your-software-supply-chain/about-dependency-review)
- **Momento 3 — Merge-time (branch protection / rulesets):** GitHub Rulesets leen pasivamente required checks + required reviews + CODEOWNERS + required signatures + linear history + no force-push + merge queue. El botón Merge se bloquea hasta cumplir todo. Fuente: [GitHub Docs — About rulesets](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/about-rulesets)
- **Momento 4 — Build/Artifact-time:** SLSA provenance (L1→L3), SBOM (CycloneDX/SPDX), artifact signing (cosign/sigstore con OIDC keyless + Rekor), policy-as-code (OPA/Conftest/Kyverno), artifacts inmutables. Fuente: [SLSA levels](https://slsa.dev/spec/v1.0-rc2/levels), [Sigstore](https://www.sigstore.dev/)
- **Momento 5 — Deploy-time:** GitHub Environments `required reviewers` + `wait timer` + `custom protection rules` (CAB/SRB/ServiceNow), code freeze check, change record/ticket linkage, rollback plan validado. Fuente: [GitHub Docs — Deployments and environments](https://docs.github.com/en/actions/reference/workflows-and-actions/deployments-and-environments)
- **Momento 6 — Post-deploy:** smoke tests, health checks, canary/baseline comparison con auto-rollback, release readiness sign-off (acceptance record). Fuente: [OWASP DevSecOps Guideline](https://owasp.org/www-project-devsecops-guideline/)
- **Momento 7 — Audit/Recovery:** audit trail inmutable (WORM), DORA metrics, compliance evidence archive (SOC2/ISO/SSDF), rollback/fix-forward + blameless postmortem. Cierra el loop dev→ops. Fuente: [DORA Accelerate](https://cloud.google.com/blog/products/devops-sre/dora-2019-accelerate-state-of-devops-report)

> **Nota de coherencia:** los momentos 1–3 (commit/PR/merge + dependency review + rulesets) pertenecen al change `ci-governance-pre-merge-gates` (pre-PR/merge, implementable). Los momentos 4–7 (build/artifact, deploy, post-deploy, audit) son **post-merge OUT OF SCOPE** de implementación en ese change, pero se documentan aquí para cubrir governance en su totalidad y alinear con SOC2 CC8.1 / ISO 27001 A.8.32 / NIST SSDF.

### 23.3.2 Matriz completa de Governance por momento del pipeline (governance en su totalidad)

Tabla exhaustiva de TODAS las capacidades de governance mapeadas al momento del pipeline donde intervienen. Cubre los 10 dominios: commit-time, PR-time, merge-time, build/artifact-time, deploy-time, post-deploy, audit/recovery, supply-chain, operational y **GOVERNANCE TRANSVERSAL** (dimensiones continuas de cobertura total que no se limitan a un momento del pipeline: acceso humano, gestión de vulnerabilidades, terceros/tooling, datos, release, incidentes, SLO/error-budget, config/drift y meta-governance). Total: 34 → 44 filas.

| Momento        | Dominio                | Capacidad                                                                                | ¿Quién ejecuta?                  | ¿Cuándo?                | Ejemplo / herramienta                                                                                                                                                    | CI/CD      | Fuente                                                                                                                                                                                                                                                     |
| -------------- | ---------------------- | ---------------------------------------------------------------------------------------- | -------------------------------- | ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| COMMIT         | Commit-time            | Firma de commits (GPG/SSH/Sigstore)                                                      | Dev (local)                      | pre-commit hook         | `git commit -S` / `git config gpg.format ssh`                                                                                                                            | CI(local)  | [GitHub Docs](https://docs.github.com/en/authentication/managing-commit-signature-verification/about-commit-signature-verification)                                                                                                                        |
| COMMIT         | Commit-time            | Commit lint (Conventional Commits)                                                       | Dev (local)                      | pre-commit hook         | commitlint + Husky (implementado ✅)                                                                                                                                     | CI(local)  | [Conventional Commits](https://www.conventionalcommits.org/)                                                                                                                                                                                               |
| COMMIT         | Commit-time            | Pre-commit secret scan                                                                   | Dev (local)                      | pre-commit hook         | Husky + gitleaks (implementado ✅)                                                                                                                                       | CI(local)  | [OWASP DevSecOps](https://owasp.org/www-project-devsecops-guideline/)                                                                                                                                                                                      |
| PR             | PR-time                | PR metadata (DCO, templates, title)                                                      | CI + Dev                         | push PR                 | DCO action, PR template                                                                                                                                                  | CI         | [GitHub Docs](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-commit-approve-and-signing)                                                                                        |
| PR             | PR-time                | Code review policies (CODEOWNERS)                                                        | Equipo + GitHub                  | push PR                 | CODEOWNERS, required reviews                                                                                                                                             | CI(gate)   | [GitHub Docs CODEOWNERS](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-code-owners)                                                                                            |
| PR             | PR-time (SECURITY)     | Dependency review (SCA en diff) — **control SECURITY preexistente**, no capability nueva | CI (action, home `security.yml`) | push PR                 | `security.yml:dependency-review` (dependency-review-action@v5, vuln+license) elevado a REQUIRED por `ci-governance-pre-merge-gates` vía `ci-complete` + ruleset 21227644 | CI         | [GitHub Docs dependency review](https://docs.github.com/code-security/supply-chain-security/understanding-your-software-supply-chain/about-dependency-review)                                                                                              |
| PR             | PR-time                | Early-abort SAST en diff                                                                 | CI                               | push PR                 | Semgrep diff (crítico/alta)                                                                                                                                              | CI         | [OWASP DevSecOps](https://owasp.org/www-project-devsecops-guideline/)                                                                                                                                                                                      |
| MERGE          | Merge-time             | Required status checks                                                                   | GitHub Rulesets                  | continuous              | checks verdes antes de merge                                                                                                                                             | CI(gate)   | [GitHub Docs](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches)                                                                                             |
| MERGE          | Merge-time             | Required reviews + CODEOWNERS                                                            | GitHub Rulesets                  | continuous              | N approvals, code owner review                                                                                                                                           | CI(gate)   | [GitHub Docs](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-code-owners)                                                                                                       |
| MERGE          | Merge-time             | Required signatures                                                                      | GitHub Rulesets                  | continuous              | commits firmados requeridos                                                                                                                                              | CI(gate)   | [GitHub Docs](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/available-rules-for-rulesets)                                                                                                   |
| MERGE          | Merge-time             | Linear history / no force-push                                                           | GitHub Rulesets                  | continuous              | squash/rebase, bloquear force-push                                                                                                                                       | CI(gate)   | [GitHub Docs](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches)                                                                                             |
| MERGE          | Merge-time             | Merge queue                                                                              | GitHub Rulesets                  | continuous              | merge_group FIFO, checks en grupo                                                                                                                                        | CI(gate)   | [GitHub Docs](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/configuring-pull-request-merges/managing-a-merge-queue)                                                                                           |
| MERGE          | Merge-time             | Bypass policies (SoD)                                                                    | GitHub Rulesets                  | continuous              | solo roles autorizados by-pass                                                                                                                                           | CI(gate)   | [GitHub Docs](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/about-rulesets)                                                                                                                 |
| BUILD/ARTIFACT | Build-time             | SLSA provenance (L1→L3)                                                                  | CI (build service)               | post-build              | slsa-github-generator / GitHub OIDC                                                                                                                                      | CD start   | [SLSA](https://slsa.dev/spec/v1.0-rc2/levels)                                                                                                                                                                                                              |
| BUILD/ARTIFACT | Build-time             | SBOM (CycloneDX/SPDX)                                                                    | CI                               | post-build              | syft / CycloneDX                                                                                                                                                         | CD start   | [OWASP CycloneDX](https://owasp.org/www-project-cyclonedx/)                                                                                                                                                                                                |
| BUILD/ARTIFACT | Supply chain           | Artifact signing (cosign/sigstore)                                                       | CI (OIDC keyless)                | post-build              | cosign sign + Fulcio + Rekor                                                                                                                                             | CD start   | [Sigstore](https://www.sigstore.dev/)                                                                                                                                                                                                                      |
| BUILD/ARTIFACT | Supply chain           | Immutable artifacts                                                                      | CI/CD                            | post-build              | artifact promovido, no rebuild                                                                                                                                           | CD         | [SLSA](https://slsa.dev/spec/v1.0-rc2/levels)                                                                                                                                                                                                              |
| BUILD/ARTIFACT | Supply chain           | Policy-as-code (OPA/Conftest/Kyverno)                                                    | CI                               | post-build              | validar manifests/imagen                                                                                                                                                 | CD start   | [OPA](https://www.openpolicyagent.org/docs/latest/cicd/)                                                                                                                                                                                                   |
| DEPLOY         | Deploy-time            | GitHub Environments + required reviewers                                                 | GitHub                           | deploy                  | `environment: production` + reviewers                                                                                                                                    | CD         | [GitHub Docs](https://docs.github.com/en/actions/reference/workflows-and-actions/deployments-and-environments)                                                                                                                                             |
| DEPLOY         | Deploy-time            | Wait timer / deployment freeze                                                           | GitHub                           | deploy                  | freeze windows, wait timer                                                                                                                                               | CD         | [GitHub Docs](https://docs.github.com/en/actions/reference/workflows-and-actions/deployments-and-environments)                                                                                                                                             |
| DEPLOY         | Deploy-time            | Custom protection rules (CAB/SRB)                                                        | GitHub App + humano              | deploy                  | aprobación ITIL/CAB, SRB seguridad                                                                                                                                       | CD         | [GitHub Docs](https://docs.github.com/en/actions/how-tos/deploy/configure-and-manage-deployments/create-custom-protection-rules)                                                                                                                           |
| DEPLOY         | Change mgmt            | Change record / ticket linkage                                                           | CI + ITSM                        | deploy                  | ServiceNow/Jira ref en commit                                                                                                                                            | CD         | [SOC 2 CC8.1](https://truvocyber.com/blog/soc-2-cc8-1-change-management)                                                                                                                                                                                   |
| DEPLOY         | Change mgmt            | Rollback plan validado (gate)                                                            | CI                               | pre-deploy              | rollback-gate (migration down)                                                                                                                                           | CD         | [ISO 27001 A.8.32](https://www.aicpa-cima.com/resources/download/mapping-2017-trust-services-criteria-to-iso-27001)                                                                                                                                        |
| POST-DEPLOY    | Post-deploy            | Smoke tests / health checks                                                              | CI                               | post-deploy             | `/health`, critical path                                                                                                                                                 | CD         | [Google SRE](https://sre.google/sre-book/service-level-objectives/)                                                                                                                                                                                        |
| POST-DEPLOY    | Post-deploy            | Canary/baseline + auto-rollback                                                          | CI/CD                            | post-deploy             | Argo Rollouts + Prometheus                                                                                                                                               | CD         | [OWASP DevSecOps](https://owasp.org/www-project-devsecops-guideline/)                                                                                                                                                                                      |
| POST-DEPLOY    | Sign-off               | Release readiness sign-off                                                               | Humano + CI                      | post-deploy             | acceptance record, evidence archive                                                                                                                                      | CD         | [SOC 2 CC8.1](https://truvocyber.com/blog/soc-2-cc8-1-change-management)                                                                                                                                                                                   |
| AUDIT          | Audit/recovery         | Audit trail inmutable (WORM)                                                             | CI + GitHub                      | post-merge              | deployment event record: commit+artifact SHA                                                                                                                             | Post-CD    | [SOC 2 CC8.1](https://truvocyber.com/blog/soc-2-cc8-1-change-management)                                                                                                                                                                                   |
| AUDIT          | Audit/recovery         | DORA metrics (4 claves)                                                                  | CI                               | post-merge              | deploy freq, lead time, CFR, MTTR                                                                                                                                        | Post-CD    | [DORA Accelerate](https://cloud.google.com/blog/products/devops-sre/dora-2019-accelerate-state-of-devops-report)                                                                                                                                           |
| AUDIT          | Compliance             | Compliance evidence archive                                                              | CI                               | post-merge              | SOC2/ISO27001/SSDF evidence                                                                                                                                              | Post-CD    | [NIST SSDF](https://csrc.nist.gov/pubs/sp/800/218/final)                                                                                                                                                                                                   |
| AUDIT          | Recovery               | Rollback / fix-forward + postmortem                                                      | Humano + CI                      | on-incident             | feature flag kill-switch, blameless postmortem                                                                                                                           | Post-CD    | [Google SRE](https://sre.google/sre-book/implementing-devops/)                                                                                                                                                                                             |
| OPERATIONAL    | Operational            | Cost governance / FinOps                                                                 | Plataforma                       | continuous              | presupuesto runners, OIDC                                                                                                                                                | CI/CD      | [FinOps](https://www.finops.org/)                                                                                                                                                                                                                          |
| OPERATIONAL    | Operational            | Secrets management governance                                                            | Plataforma                       | continuous              | Vault, OIDC, pin actions by SHA                                                                                                                                          | CI/CD      | [OWASP CI/CD Security](https://cheatsheetseries.owasp.org/cheatsheets/CI_CD_Security_Cheat_Sheet.html)                                                                                                                                                     |
| OPERATIONAL    | Operational            | Identity & access (least privilege)                                                      | Plataforma                       | continuous              | `permissions:` mínimo, OIDC workload identity                                                                                                                            | CI/CD      | [OWASP DevSecOps](https://owasp.org/www-project-devsecops-guideline/)                                                                                                                                                                                      |
| OPERATIONAL    | Operational            | Runner security                                                                          | Plataforma                       | continuous              | ephemeral runners, egress restrict                                                                                                                                       | CI/CD      | [OWASP CI/CD Security](https://cheatsheetseries.owasp.org/cheatsheets/CI_CD_Security_Cheat_Sheet.html)                                                                                                                                                     |
| CONTINUOUS     | GOVERNANCE TRANSVERSAL | Human repo access governance (RBAC)                                                      | Org owners / Plataforma          | continuous              | GitHub repo roles (Read/Triage/Write/Maintain/Admin) + custom roles + org base permissions; 4-eyes para acciones destructivas (admin/bypass)                             | Repo       | [GitHub Docs repository roles](https://docs.github.com/en/organizations/managing-user-access-to-your-organizations-repositories/managing-repository-roles/repository-roles-for-an-organization)                                                            |
| CONTINUOUS     | GOVERNANCE TRANSVERSAL | Vulnerability mgmt governance (SLA / excepciones / disclosure)                           | Security / PSIRT                 | continuous              | Remediation SLA por severidad, waiver documentado, vulnerability disclosure program (ISO 29147), PSIRT                                                                   | CD / Repo  | [NIST SSDF RV.1.3 / RV.2](https://csrc.nist.gov/pubs/sp/800/218/final)                                                                                                                                                                                     |
| CONTINUOUS     | GOVERNANCE TRANSVERSAL | Third-party & tooling governance (allowlist actions, license)                            | Plataforma / Security            | continuous              | Allowed-actions policy + SHA pinning + blocklist; license compliance (FOSSA/ScanCode); OAuth app policy                                                                  | CI/CD      | [GitHub allowed actions policy](https://docs.github.com/en/enterprise-cloud@latest/organizations/managing-organization-settings/actions-policies) + [OWASP CI/CD Security](https://cheatsheetseries.owasp.org/cheatsheets/CI_CD_Security_Cheat_Sheet.html) |
| CONTINUOUS     | GOVERNANCE TRANSVERSAL | Data governance in pipelines (PII/PHI, masking, test data)                               | Plataforma / Privacy             | continuous              | PII/PHI masking en logs y artifacts, test data sintética, GDPR data minimization, retention/deletion (A.8.10)                                                            | CI/CD      | [ISO 27001 A.5.34 / A.8.11 / A.8.33](https://www.isms.online/iso-27001/annex-a-2022/8-11-data-masking-2022)                                                                                                                                                |
| CONTINUOUS     | GOVERNANCE TRANSVERSAL | Release governance (trains, feature-flag, changelog, semver)                             | Release Eng / Product / QA       | continuous + release    | Release train cadence, feature-flag lifecycle (kill-switch, cleanup), CHANGELOG governance (keepachangelog), SemVer cadence                                              | CD         | [Release train governance](https://beefed.ai/en/release-train-orchestration) + [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)                                                                                                                    |
| CONTINUOUS     | GOVERNANCE TRANSVERSAL | Incident & postmortem governance (severity, SLA, war-room, action items)                 | SRE / On-call                    | on-incident             | Severity classification (SEV1-4), response SLA, Incident Commander / war-room, blameless postmortem con action items trackeados (SLO 30/60d)                             | Post-CD    | [Google SRE Postmortem Culture](https://sre.google/sre-book/postmortem-culture/) + [NIST SP 800-61r3](https://csrc.nist.gov/pubs/sp/800/61/r3/final)                                                                                                       |
| CONTINUOUS     | GOVERNANCE TRANSVERSAL | SLO / error-budget governance (release gate)                                             | SRE / Plataforma                 | continuous + pre-deploy | Error budget policy como gate de release (freeze si se agota), alerting burn-rate, SLO committee, feedback al change process                                             | CD gate    | [SRE Error Budget Policy](https://sre.google/workbook/error-budget-policy/) + [Release gating](https://oneuptime.com/blog/post/2026-02-17-how-to-establish-error-budget-policies-for-release-gating-on-google-cloud/view)                                  |
| CONTINUOUS     | GOVERNANCE TRANSVERSAL | Configuration & environment drift governance                                             | Plataforma / SRE                 | continuous              | Config baselines (CIS), drift detection, environment parity (staging≈prod), change control de config                                                                     | CI/CD + CD | [ISO 27001 A.8.9](https://www.upguard.com/compliance/iso-27001/8-9) + [NIST 800-53 CM](https://csf.tools/reference/nist-sp-800-53/r4/cm)                                                                                                                   |
| CONTINUOUS     | GOVERNANCE TRANSVERSAL | Meta-governance (governance-as-code, versionado, auditoría de policy)                    | Plataforma / Governance          | continuous              | Policy-as-code versionada en Git (Rego/CUE/CEL), multiparty review de la policy, audit de la policy, periodic gate review                                                | CI/CD      | [CNCF Policy-as-Code](https://www.cncf.io/blog/2024/02/14/policy-as-code-in-the-software-supply-chain/)                                                                                                                                                    |
| CONTINUOUS     | GOVERNANCE TRANSVERSAL | Docs & knowledge governance (ADRs, docs-as-code, runbook review)                         | Equipo / Tech leads              | continuous              | ADR governance (ciclo Proposed→Accepted→Superseded, review trimestral), docs-as-code, runbook review cadence — ver §45 y docs/adr/                                       | Repo       | [ADR (Nygard)](https://adr.github.io/) + §45 docs-as-code (este doc)                                                                                                                                                                                       |

> **Alcance del change `ci-governance-pre-merge-gates`:** los momentos **COMMIT, PR y MERGE** (firma, lint, PR metadata, dependency review, branch protection/rulesets, CODEOWNERS, merge queue) son **pre-PR/merge → implementables** en este change. Los momentos **BUILD/ARTIFACT, DEPLOY, POST-DEPLOY y AUDIT** son **post-merge → documentados** (OUT OF SCOPE de implementación en este change), pero se incluyen para cubrir governance en su totalidad y cumplir SOC 2 CC8.1, ISO 27001 A.8.32 y NIST SSDF PS.3. Ver también [§13.10](#1310-governance-a-lo-largo-de-todo-el-ciclo-de-vida-ci-a-cd-post-deploy-y-audit) y el diagrama §23.3 (Stage 9 y Stage 10 ya muestran GOVERNANCE en deploy/post-deploy). Las 10 filas del dominio **GOVERNANCE TRANSVERSAL** son **post-merge → documentadas** (continuas, OUT OF SCOPE de implementación en este change) y extienden la cobertura hacia la responsabilidad total de governance en CI/CD.

> **Dominio de `dependency-review`:** es un control **SECURITY** preexistente en `security.yml` (creado por `ci-security-enhance`), NO una capability nueva de governance. `ci-governance-pre-merge-gates` solo lo eleva a **REQUIRED** (vía `ci.yml:ci-complete` fan-in + ruleset 21227644). Único home: `security.yml` — no se crea `dependency-review.yml` ni se duplica el job.

#### 23.3.2.1 Governance transversal continuo (dimensiones de cobertura total)

Las 10 filas del dominio `GOVERNANCE TRANSVERSAL` agrupan las capacidades de governance que **no se limitan a un momento único** del pipeline (commit→audit) sino que son continuas o transversales a varios momentos. Su adición responde a un análisis de brechas frente a la matriz original (34 filas, 9 dominios), que cubría correctamente los gates puntuales pero omitía dimensiones organizativas y de ciclo de vida completo exigidas por SOC 2 (CC6 acceso, CC7 monitoreo, CC8 cambio), ISO 27001:2022 (A.5.15/A.5.16 acceso, A.5.27 aprendizaje de incidentes, A.8.9 configuración, A.5.34/A.8.11 privacidad/datos), NIST SSDF (RV gestión de vulnerabilidades, PO requisitos a terceros) y NIST 800-53 (AC, CM, IR).

- **Acceso humano (RBAC):** complementa la fila `Identity & access (least privilege)` del dominio OPERATIONAL, que gobierna el _token/workload_ de CI (permissions mínimo, OIDC). La nueva fila gobierna el _acceso humano al repositorio_ (roles Read/Triage/Write/Maintain/Admin, custom roles, base permissions de org, enterprise policies y 4-eyes para bypass/admin) — una capa distinta no cubierta antes.
- **Gestión de vulnerabilidades:** la matriz original solo tenía _detección_ (dependency review — control SECURITY preexistente en `security.yml`, elevado a REQUIRED por el change; early-abort SAST). Falta la _respuesta_: SLA de remediación por severidad, waiver documentado y programa de divulgación (PSIRT/ISO 29147) — requerido por SSDF RV.
- **Terceros/tooling:** extiende el `pin actions by SHA` (hasta aquí solo mencionado en secrets governance) hacia _allowlist/blocklist de actions a nivel org_, _evaluación de riesgo de Marketplace/OAuth apps_ y _license compliance_ (SSDF PO.1.3).
- **Datos en pipelines:** nueva dimensión — PII/PHI en artifacts y logs, data masking, test data governance (A.8.33 Test Information) y GDPR data minimization, ausente en la matriz original.
- **Release governance:** va más allá del `Release readiness sign-off` (post-deploy) hacia release trains, feature-flag lifecycle, changelog y cadencia SemVer.
- **Incidentes/postmortem:** la matriz original tenía `Rollback / fix-forward + postmortem` (blameless). Se añaden clasificación de severidad, SLA de respuesta, war-room/Incident Commander y _action items trackeados con SLO_ (A.5.27).
- **SLO / error-budget:** nuevo gate de release basado en error budget policy (freeze automático si se agota) y alerting burn-rate — cierra el feedback de observabilidad al proceso de change.
- **Config / env drift:** baselines CIS, drift detection y _environment parity_ (staging≈prod), gobernanza de configuración ausente antes (A.8.9 / CM).
- **Meta-governance:** el governance del propio governance — policy-as-code versionada en Git, multiparty review de la policy, auditoría de la policy y revisión periódica de gates (CNCF Policy-as-Code). La matriz original trataba los rulesets como lectores pasivos, sin gobernar la evolución de las propias reglas.
- **Docs & knowledge:** ya cubierto en el cuerpo del doc (§45 docs-as-code, `docs/adr/`, runbooks en §13.10 / §37) — se integra como fila de referencia para no duplicar y mantener la matriz completa.

> **Coherencia:** estas filas son continuas y transversales a los 7 momentos de [§23.3.1.1](#23311-ciclo-completo-de-governance-7-momentos-commit-a-audit); no reemplazan los gates puntuales sino que los enmarcan en la responsabilidad total de governance. Todas son **documentadas** (post-merge) dentro del alcance del change `ci-governance-pre-merge-gates`.

### 23.4 Tabla resumen: ¿Qué va antes y después del Build? (con categorías)

| Categoría      | Capacidad                             | ¿Necesita build como input?                    | Posición correcta        | Fuente                                                                                                                                                                                                                    |
| -------------- | ------------------------------------- | ---------------------------------------------- | ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **TESTING**    | Unit Tests (Vitest)                   | **NO** — opera sobre source TS/JS              | **ANTES del build**      | [AWS: "1. Unit tests"](https://docs.aws.amazon.com/prescriptive-guidance/latest/strategy-cicd-litmus/understanding-cicd.html)                                                                                             |
| **TESTING**    | Snapshot Tests (Testing Library)      | **NO** — opera sobre source JSX/TSX            | **ANTES del build**      | [AWS: "1. Unit tests"](https://docs.aws.amazon.com/prescriptive-guidance/latest/strategy-cicd-litmus/understanding-cicd.html)                                                                                             |
| **TESTING**    | Property-Based Tests (fast-check)     | **NO** — opera sobre source TS/JS              | **ANTES del build**      | [fast-check](https://fast-check.dev/) — invariantes, parsers, lógica. <1-2 min, complementa unit tests.                                                                                                                   |
| **SECURITY**   | SAST (Semgrep, CodeQL)                | **NO** — análisis estático sobre source        | **ANTES del build**      | [GitLab SAST](https://docs.gitlab.com/ee/user/application_security/sast/)                                                                                                                                                 |
| **SECURITY**   | SCA (Dependabot, Snyk)                | **NO** — analiza lockfiles                     | **ANTES del build**      | [Snyk CI/CD](https://docs.snyk.io/implementation-guides/team-implementation-guide/phase-5-rolling-out-the-prevention-stage/add-and-configure-snyk-to-your-ci-cd-pipeline)                                                 |
| **SECURITY**   | Secret Detection (Gitleaks)           | **NO** — archivos crudos                       | **ANTES del build**      | [OWASP DevSecOps](https://owasp.org/www-project-devsecops-guideline/)                                                                                                                                                     |
| **SECURITY**   | IaC Scanning (Checkov/Trivy)          | **NO** — archivos de configuración             | **ANTES del build**      | [OWASP DevSecOps](https://owasp.org/www-project-devsecops-guideline/)                                                                                                                                                     |
| **QUALITY**    | Lint (ESLint)                         | **NO** — opera sobre source code               | **ANTES del build**      | [GitLab CI/CD](https://docs.gitlab.com/ee/ci/pipelines/)                                                                                                                                                                  |
| **QUALITY**    | Format (Prettier)                     | **NO** — opera sobre source code               | **ANTES del build**      | [GitLab CI/CD](https://docs.gitlab.com/ee/ci/pipelines/)                                                                                                                                                                  |
| **QUALITY**    | Type Check (tsc --noEmit)             | **NO** — opera sobre source TS                 | **ANTES del build**      | [TypeScript tsconfig](https://www.typescriptlang.org/tsconfig)                                                                                                                                                            |
| —              | **BUILD** (compile, bundle)           | —                                              | **BUILD**                | [AWS: "2. Code build"](https://docs.aws.amazon.com/prescriptive-guidance/latest/strategy-cicd-litmus/understanding-cicd.html)                                                                                             |
| **TESTING**    | Integration Tests                     | **SÍ** — necesita artifact compilado           | **POST-BUILD**           | [AWS: "4. Integration tests"](https://docs.aws.amazon.com/prescriptive-guidance/latest/strategy-cicd-litmus/understanding-cicd.html)                                                                                      |
| **TESTING**    | Contract Tests (Pact)                 | **SÍ** — necesita artifact compilado           | **POST-BUILD**           | [AWS: "4. Integration tests"](https://docs.aws.amazon.com/prescriptive-guidance/latest/strategy-cicd-litmus/understanding-cicd.html)                                                                                      |
| **SECURITY**   | Container Scan (Trivy image)          | **SÍ** — necesita Docker image                 | **POST-BUILD**           | [SLSA](https://slsa.dev/spec/v1.2/levels)                                                                                                                                                                                 |
| —              | Deploy Staging                        | **SÍ** — necesita artifact firmado             | **DEPLOY**               | [AWS DL.ADS.1](https://docs.aws.amazon.com/wellarchitected/latest/devops-guidance/)                                                                                                                                       |
| **TESTING**    | E2E Tests (Playwright)                | **SÍ** — necesita app corriendo                | **POST-DEPLOY**          | [Fowler: Test Pyramid](https://martinfowler.com/bliki/TestPyramid.html)                                                                                                                                                   |
| **TESTING**    | UAT / Manual Verification             | **SÍ** — necesita app corriendo                | **POST-DEPLOY**          | [Fowler: Test Pyramid](https://martinfowler.com/bliki/TestPyramid.html)                                                                                                                                                   |
| **SECURITY**   | DAST (OWASP ZAP)                      | **SÍ** — necesita app desplegada               | **POST-DEPLOY**          | [GitLab DAST](https://docs.gitlab.com/ee/user/application_security/dast/)                                                                                                                                                 |
| **QUALITY**    | Accessibility (axe-core)              | **SÍ** — necesita app desplegada               | **POST-DEPLOY**          | [OWASP DevSecOps](https://owasp.org/www-project-devsecops-guideline/)                                                                                                                                                     |
| **QUALITY**    | Performance (k6)                      | **SÍ** — necesita app bajo carga               | **POST-DEPLOY**          | [AWS DL.CD.3](https://docs.aws.amazon.com/wellarchitected/latest/devops-guidance/)                                                                                                                                        |
| **QUALITY**    | Lighthouse CI (Core Web Vitals)       | **SÍ** — necesita app desplegada               | **POST-DEPLOY**          | [AWS DL.CD.3](https://docs.aws.amazon.com/wellarchitected/latest/devops-guidance/)                                                                                                                                        |
| **TESTING**    | Test Impact Analysis (TIA)            | **NO** — selecciona tests por diff             | **ANTES del build**      | [Launchable/Nx/Turborepo query](https://martinfowler.com/articles/continuousIntegration.html)                                                                                                                             |
| **TESTING**    | Test Sharding (Vitest/Playwright)     | **DEPENDS** — distribuye entre runners         | **PRE-BUILD/POST-BUILD** | Parallel execution + Fast feedback (< 5 min target)                                                                                                                                                                       |
| **TESTING**    | Coverage Merge Gate                   | **SÍ** — necesita artifacts de shards          | **PRE-BUILD**            | Merge coverage artifacts de todos los shards + check-coverage. Requerido cuando se usa sharding — sin esto el ratchet falla falsamente.                                                                                   |
| **TESTING**    | Smart Test Ordering (fail-first)      | **NO** — reordena por histórico de fallos      | **ANTES del build**      | Fail-first strategy — rápido / previamente fallido primero                                                                                                                                                                |
| **TESTING**    | Coverage Tripwire (floor ratchet)     | **NO** — byproduct del unit-test run           | **PRE-BUILD**            | Vitest coverage.thresholds (v8 provider) — tripwire de piso (60%), NO quality gate. El gate autoritativo es SonarQube new-code ≥80% en STAGE 4. Si unit tests pasan pero coverage bajo → build de todas formas, no merge. |
| **GOVERNANCE** | Path-filtered entry / Skip-CI         | **NO** — change detection en source            | **ENTRY**                | [§53.3 Skip unnecessary builds](https://docs.aws.amazon.com/wellarchitected/latest/devops-guidance/)                                                                                                                      |
| **GOVERNANCE** | Commit Signing (GPG/sigstore)         | **NO** — local pre-commit hook                 | **PRE-COMMIT**           | GPG/sigstore gitsign firma commit antes de push                                                                                                                                                                           |
| **GOVERNANCE** | Commit Lint (commitlint)              | **NO** — verifica mensaje commit               | **PR GATE**              | Conventional Commits enforcement — `feat(scope): desc`. 1 solo workflow CI con PR metadata checks [SL]                                                                                                                    |
| **GOVERNANCE** | Commit Signing verify (CI job)        | **NO** — `git verify-commit` en CI             | **PR GATE**              | Defense-in-depth: job CI verifica firma en cada commit del PR. No confía solo en GitHub badge. `git log --format='%H' \| xargs git verify-commit`                                                                         |
| **GOVERNANCE** | Commit Signing verify (GitHub nativo) | **NO** — GitHub verifica firma automáticamente | **PR GATE**              | Badge "Verified" — primera línea de defensa. No sustituye el job CI (defense-in-depth).                                                                                                                                   |
| **GOVERNANCE** | PR Metadata Checks (DCO, templates)   | **NO** — valida metadata del PR                | **PR GATE**              | DCO sign-off, title/body templates, labels                                                                                                                                                                                |
| **GOVERNANCE** | Early-abort gate (SAST crítico)       | **NO** — aborta antes de suites largas         | **PR GATE**              | Solo diff del PR, severidad CRÍTICA/ALTA (SQL injection, RCE, secrets hardcoded). Segundos — pocas reglas, poco código. Fail-fast: aborta pipeline completo si falla.                                                     |
| **GOVERNANCE** | Branch Protection + Required Checks   | **NO** — lee resultados de CI (passivo)        | **CONTINUOUS**           | GitHub Rulesets: checks verdes + approval + signing → Merge habilitado                                                                                                                                                    |
| **GOVERNANCE** | Artifact Signing (Cosign/Sigstore)    | **SÍ** — necesita artifact compilado           | **ARTIFACT & SIGN**      | Cosign firma containers/binaries, SLSA provenance                                                                                                                                                                         |
| **GOVERNANCE** | Change Record / Ticket Linkage        | **SÍ** — necesita deploy realizado             | **DEPLOY STAGING**       | ServiceNow/Jira linkage — trazabilidad commit → deploy                                                                                                                                                                    |
| **GOVERNANCE** | Release Readiness + Sign-off          | **SÍ** — necesita app desplegada               | **POST-DEPLOY**          | Dashboard + acceptance record (who approved what, evidence archive)                                                                                                                                                       |
| **GOVERNANCE** | Quality Gate (SonarQube)              | **SÍ** — necesita build + coverage             | **APPROVAL**             | SonarQube quality gate pass — bloquea merge si no pasa                                                                                                                                                                    |
| **GOVERNANCE** | Security Gate (vuln threshold)        | **SÍ** — necesita scans completados            | **APPROVAL**             | Vulnerability severity threshold — bloquea merge si críticos/high abiertos                                                                                                                                                |
| **GOVERNANCE** | Compliance Evidence Archive           | **SÍ** — necesita todos los scans              | **APPROVAL**             | SOC2/ISO 27001/artifact trail — evidencia para auditorías                                                                                                                                                                 |
| **GOVERNANCE** | Deployment Event Record               | **SÍ** — necesita deploy a producción          | **DEPLOY PROD**          | Timestamp, commit SHA, artifact SHA — audit trail inmutable                                                                                                                                                               |
| **GOVERNANCE** | DORA Metrics Capture                  | **NO** — métrica del pipeline                  | **POST-MERGE**           | Deploy frequency, lead time, change failure rate, MTTR                                                                                                                                                                    |
| **GOVERNANCE** | Audit Trail Export                    | **NO** — exportación post-merge                | **POST-MERGE**           | Immutable, compliance-ready — para auditorías externas                                                                                                                                                                    |
| **TESTING**    | Flaky Quarantine Policy               | **DEPENDS** — corre en post-build              | **POST-BUILD**           | Pass-rate < 70% → quarantine; **requiere humano para restaurar** (commit nuevo en archivo o aprobación manual)                                                                                                            |
| **DEPLOY**     | Roll-forward / Hotfix-forward         | **SÍ** — necesita artifact firmado             | **DEPLOY PROD**          | Fail-forward strategy — deploy forward como alternativa al rollback                                                                                                                                                       |
| **MONITORING** | Time-to-first-feedback (< 5 min)      | **NO** — métrica del pipeline                  | **MONITOR**              | Fast feedback loop — commit → primer test resultado                                                                                                                                                                       |
| **QUALITY**    | Complexity Rules (ESLint)             | **NO** — reglas source-level                   | **ANTES del build**      | [ESLint complexity](https://eslint.org/)                                                                                                                                                                                  |
| **QUALITY**    | SonarQube Full Analysis               | **SÍ** — necesita build + coverage data        | **POST-BUILD**           | [SonarQube Quality Gates](https://docs.sonarsource.com/sonarqube-server/quality-standards-administration/managing-quality-gates) — bugs, code smells, complexity, duplicación, MI, Halstead                               |
| **QUALITY**    | Dependency Analysis (depcheck)        | **NO** — source-level, post-build preciso      | **POST-BUILD**           | depcheck — unused deps, missing deps, unused devDeps. Más preciso post-build (imagen completa del proyecto). Falta: missing = gate fail, unused = warning.                                                                |

### 23.5 Implicación para project-one

Las herramientas actuales del monorepo, su posición en el orden correcto **y su categoría**:

| Categoría      | Herramienta actual               | Fase correcta      | CI/CD        | Nota                            |
| -------------- | -------------------------------- | ------------------ | ------------ | ------------------------------- |
| —              | Husky + lint-staged + commitlint | Pre-commit (local) | CI (local)   | Ya implementado ✅              |
| **SECURITY**   | Gitleaks (`security:secrets`)    | Pre-Build          | CI           | Pre-commit + CI                 |
| **QUALITY**    | ESLint + Prettier                | Pre-Build          | CI           | Jobs paralelos                  |
| **TESTING**    | Vitest (`npm run test`)          | Pre-Build          | CI           | **ANTES del build**, no después |
| **SECURITY**   | Semgrep (`sast:semgrep`)         | Pre-Build          | CI           | Job paralelo a unit tests       |
| —              | `npm run build`                  | Build              | CI           | Solo después de Pre-Build verde |
| **TESTING**    | Integration tests (supertest)    | Post-Build         | CI           | Necesita artifact compilado     |
| **SECURITY**   | Container scan (Trivy)           | Post-Build         | CI           | Necesita Docker image           |
| **GOVERNANCE** | ci-complete aggregator           | Post-Build         | CI           | `if: always()`, needs ALL jobs  |
| **GOVERNANCE** | ⚡ Push to registry (frontiera)  | Artifact & Sign    | **CD start** | Cosign, SBOM, publish           |
| —              | Prisma Migrate                   | Deploy Staging     | CD           | En el deploy                    |
| **TESTING**    | Playwright (`test:e2e`)          | Post-Deploy        | CD           | Después del deploy a staging    |
| **SECURITY**   | DAST (OWASP ZAP)                 | Post-Deploy        | CD           | Necesita app corriendo          |
| **QUALITY**    | Performance (k6)                 | Post-Deploy        | CD           | Necesita app bajo carga         |

> **Recomendación para GitHub Actions:** definir los jobs de Pre-Build como **3 grupos paralelos** (Testing, Security, Quality), cada grupo con sus jobs internos paralelos, y el job de Build con `needs: [pre-build-testing, pre-build-security, pre-build-quality]`. Esto produce feedback de validación en ~1-2 minutos vs ~5-10 minutos si todo es secuencial.

> **⚠️ Control de costos por paralelización:** Cada bloque matrix (sharding de tests, TIA por workspace) necesita `max-parallel` explícito (ej. `max-parallel: 4`). Sin esto, la factura de GitHub Actions escala linealmente con el tamaño de la matriz. Agregar `concurrency groups` a nivel workflow para cancelar runs obsoletos cuando llega un push nuevo al mismo PR — sin esto, cada push acumula runners corriendo en paralelo sin cancelarse.

> **⚠️ Continuous Delivery, no Continuous Deployment:** Este pipeline es **Continuous Delivery** (no Continuous Deployment puro). Stage 9 tiene gate manual explícito (Environment Protection Rules, Security Review Board approval). El código siempre está en estado desplegable, pero un humano decide cuándo apretar el botón hacia Stage 10. Esto es correcto para un ERP financiero: el gate humano en Stage 9 es compliance (SoD — Segregation of Duties), no una limitación técnica.

### 23.6 Coverage Merge Gate (requerido con sharding)

Cuando se usa test sharding (Vitest `--shard=1/3`, `--shard=2/3`, `--shard=3/3`), cada shard reporta cobertura parcial. Sin un job explícito de merge, el coverage tripwire ratchet falla falsamente porque compara cobertura parcial contra thresholds absolutos.

**Solución:** Agregar job `coverage-merge-gate` después de test sharding:

```yaml
coverage-merge-gate:
  needs: [test-shard-1, test-shard-2, test-shard-3]
  steps:
    - uses: actions/download-artifact@v4
      with:
        pattern: coverage-*
        merge-multiple: true
    - run: npx vitest merge-reports --reporter=coverage
    - run: npx vitest run --coverage --reporter=coverage
```

Este job:

1. Descarga todos los artifacts de cobertura de los shards
2. Merge los reportes con `vitest merge-reports`
3. Ejecuta check-coverage contra los thresholds absolutos
4. **Bloquea el pipeline si la cobertura合并后 no cumple**

> **Nota:** Este job es REQUERIDO cuando se usa sharding. Sin él, el ratchet miente — puede fallar falsamente (shard con poca cobertura) o pasar falsamente (shard con cobertura artificialmente alta).

### 23.7 Rollback Automation Gate (requerido para ERP)

ERP deployments mutan PostgreSQL vía Prisma migrations — rollback es riesgo de datos, no solo código. Un checkbox manual "Rollback Plan documented" no verifica que el script funcione.

**Solución:** Agregar job `rollback-gate` que verifique automáticamente que el rollback es ejecutable:

```yaml
rollback-gate:
  needs: [prisma-migrate]
  steps:
    - name: Verify migration down exists
      run: |
        if [ ! -f "prisma/migrations/$(ls -t prisma/migrations | head -1)/migration_down.sql" ]; then
          echo "⚠️ No migration_down.sql found for latest migration"
          exit 1
        fi
    - name: Test rollback in staging
      run: |
        # Execute migration down in staging DB
        psql $STAGING_DATABASE_URL -f prisma/migrations/$(ls -t prisma/migrations | head -1)/migration_down.sql
        # Verify system recovers
        curl -f $STAGING_URL/health
```

Este job:

1. Verifica que existe un `migration_down.sql` para la migración más reciente
2. Ejecuta el rollback en staging (no producción)
3. Verifica que el sistema recupera salud después del rollback
4. **Bloquea el deploy a producción si el rollback no funciona**

> **⚠️ Mayor ROI para ERP:** Rollback no probado en producción puede corromper datos de negocio. Este gate es el más importante para ERP con DB stateful. Ver §23.3.1 paso 5 (Post-deploy Governance) para el ciclo completo.

### 23.8 CI vs CD Boundary — Discriminación por Stage

Según Octopus Deploy, Atlassian y DeployHQ, la distinción fundamental es:

| Concepto                        | Definición                                                                                                                       | En este pipeline                                              |
| ------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| **CI (Continuous Integration)** | Construye confianza en el artefacto: code → tests → build. No toca infraestructura externa ni ambientes desplegados.             | Stages 1–4                                                    |
| **CD (Continuous Delivery)**    | Mueve artefacto validado hacia ambientes reales. Siempre en estado desplegable, pero puede requerir gate humano para producción. | Stages 5–10                                                   |
| **CD (Continuous Deployment)**  | Deploy automático a producción sin gate humano.                                                                                  | **NO aplica** — este pipeline es Delivery, no Deployment puro |
| **Post-CD / Operación**         | Observability, cleanup, retroalimentación al ciclo.                                                                              | Stage 11                                                      |

**¿Por qué Stage 5 es la frontera y no Stage 3 (Build)?**

| Argumento           | Explicación                                                                                                                                                                        |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Build ≠ publish     | Compilar (`tsc`, `vite build`) genera artefactos en `dist/` pero NO los publica ni los firma. El artefacto vive dentro del runner.                                                 |
| Publish = CD start  | Push al registry (npm/GHCR/ECR) + Cosign + SBOM = el artefacto existe fuera del runner. A partir de aquí, el pipeline **maneja** el artefacto publicado, no solo lo **construye**. |
| SLSA association    | La provenance se genera al publicar, no al compilar. La firma (Cosign) requiere el digest del artefacto publicado.                                                                 |
| Industry convention | Atlassian, Octopus Deploy y DeployHQ colocan el boundary en el punto de publish/push, no en build.                                                                                 |

**¿Por qué Stage 9 es manual (Delivery, no Deployment)?**

| Razón                                       | Detalle                                                                                                                                             |
| ------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| ERP compliance                              | SoD (Segregation of Duties) requiere que quien aprueba ≠ quien deploya. Stage 9 tiene `environment approval` de GitHub.                             |
| Financial data                              | Mover datos financieros a producción sin gate humano viola SOC2/ISO 27001.                                                                          |
| Reversibility                               | En ERP, un bad deploy puede causar pérdida de datos. El gate humano verifica que el rollback funciona (§23.7).                                      |
| Continuous Delivery ≠ Continuous Deployment | Ambos son válidos. Delivery = siempre desplegable, humano decide cuándo. Deployment = deploy automático. Para ERP financiero, Delivery es correcto. |

**Zona gris — Stage 4 (Integration Tests):**

Stage 4 contiene E2E ephemeral deploy que técnicamente ya despliega algo (aunque sea efímero). Según definición estricta, esto ya empieza a mezclar CI con CD. En la práctica, la mayoría de equipos lo tratan como "CI extendido" mientras no toque staging/producción real. El artefacto efímero se destruye al terminar el job — no persiste ni se promueve.

> **Decisión para project-one:** Este pipeline es **Continuous Delivery**. El gate humano en Stage 9 (Environment Protection Rules) es compliance, no limitación. Stage 11 retroalimenta al ciclo vía DORA metrics y audit trail export.

### 23.6 Fuentes de esta sección

| #   | Fuente                        | URL                                                                                                                                                         | Hallazgo clave                          |
| --- | ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------- |
| 1   | AWS Prescriptive Guidance     | https://docs.aws.amazon.com/prescriptive-guidance/latest/strategy-cicd-litmus/understanding-cicd.html                                                       | Unit tests ANTES de Code build          |
| 2   | AWS Well-Architected DevOps   | https://docs.aws.amazon.com/wellarchitected/latest/devops-guidance/                                                                                         | QA después de cada deployment           |
| 3   | GitLab SAST                   | https://docs.gitlab.com/ee/user/application_security/sast/                                                                                                  | SAST sobre source code en stage `test`  |
| 4   | GitLab DAST                   | https://docs.gitlab.com/ee/user/application_security/dast/                                                                                                  | DAST necesita app corriendo             |
| 5   | GitLab CI/CD Pipelines        | https://docs.gitlab.com/ee/ci/pipelines/                                                                                                                    | Lint como job temprano                  |
| 6   | DORA — Continuous Integration | https://dora.dev/capabilities/continuous-integration/                                                                                                       | Tests + build en paralelo               |
| 7   | DORA — Continuous Delivery    | https://dora.dev/capabilities/continuous-delivery/                                                                                                          | Continuous testing throughout lifecycle |
| 8   | SLSA v1.2 Levels              | https://slsa.dev/spec/v1.2/levels                                                                                                                           | Unit tests como builds L0               |
| 9   | OWASP DevSecOps Guideline     | https://owasp.org/www-project-devsecops-guideline/                                                                                                          | Detección temprana como objetivo        |
| 10  | SonarQube Quality Gates       | https://docs.sonarsource.com/sonarqube-server/quality-standards-administration/managing-quality-gates                                                       | Quality gate bloquea merge              |
| 11  | Snyk CI/CD Integration        | https://docs.snyk.io/implementation-guides/team-implementation-guide/phase-5-rolling-out-the-prevention-stage/add-and-configure-snyk-to-your-ci-cd-pipeline | Snyk como gatekeeper                    |
| 12  | Martin Fowler — Test Pyramid  | https://martinfowler.com/bliki/TestPyramid.html                                                                                                             | E2E como segunda línea de defensa       |
| 13  | Martin Fowler — CI            | https://martinfowler.com/articles/continuousIntegration.html                                                                                                | Build incluye test suite + linters      |
| 14  | Jenkins Pipeline              | https://www.jenkins.io/doc/book/pipeline/                                                                                                                   | Build → Test → Deploy                   |
| 15  | Azure DevOps Stages           | https://learn.microsoft.com/en-us/azure/devops/pipelines/process/stages                                                                                     | Stages como divisiones del pipeline     |
| 16  | CircleCI Workflows            | https://circleci.com/docs/guides/orchestrate/workflows/                                                                                                     | build → test → approval → deploy        |

---

## 24. GitHub Actions Enterprise: Patrones de implementación

### 24.1 Descripción

Esta sección documenta los patrones de implementación **producción-ready** para GitHub Actions en entornos empresariales. No es un tutorial — es un catálogo de patrones verificados contra la documentación oficial y changelogs de 2025-2026, con ejemplos YAML reutilizables. Aplica directamente a project-one (monorepo Node.js/Express + React).

### 24.2 Reusable Workflows (workflow_call)

#### Por qué importa en enterprise

- Centraliza la política CI/CD: checks de seguridad, deploys y compliance se escriben una vez, se revisan una vez (via CODEOWNERS), y se consumen en todos los repos.
- Versionados por git tag: los consumers fijan a un tag testeado; breaking changes se rolloutan via nuevos tags.
- Separación de responsabilidades: reusable workflows orquestan **jobs** (plantillas de pipeline); composite actions encapsulan **step groups** (plantillas de tareas compartidas). Mezclar ambos es el anti-patrón organizacional nº1.
- **Restricción crítica:** un workflow con `workflow_call` no puede llamar otro con `workflow_call` (solo 1 nivel de nesting). Composite actions no tienen este límite.

#### Patrón A — Reusable workflow (plantilla de pipeline)

```yaml
# .github/workflows/reusable-deploy.yml (en repo compartido my-org/shared-workflows)
name: Reusable Deploy
on:
  workflow_call:
    inputs:
      environment:
        type: string
        required: true
      image-tag:
        type: string
        required: true
    secrets:
      DEPLOY_TOKEN:
        required: true
    outputs:
      deployment-url:
        value: ${{ jobs.deploy.outputs.url }}

jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: ${{ inputs.environment }}
    outputs:
      url: ${{ steps.deploy.outputs.url }}
    steps:
      - name: Deploy
        id: deploy
        run: ./deploy.sh ${{ inputs.image-tag }}
        env:
          TOKEN: ${{ secrets.DEPLOY_TOKEN }}
```

```yaml
# Caller workflow (en cualquier repo de aplicación)
jobs:
  deploy-prod:
    uses: my-org/shared-workflows/.github/workflows/reusable-deploy.yml@v1.4.0
    with:
      environment: production
      image-tag: ${{ github.sha }}
    secrets: inherit
```

#### Patrón B — Composite action (plantilla de tareas compartidas)

```yaml
# .github/actions/setup-project/action.yml
name: 'Setup project'
description: 'Node + pnpm + cache setup'
runs:
  using: composite
  steps:
    - uses: pnpm/action-setup@v4
      with:
        version: 9
    - uses: actions/setup-node@v4
      with:
        node-version: '22'
        cache: 'pnpm'
    - run: pnpm install --frozen-lockfile
      shell: bash
```

#### Mejores prácticas empresariales

- Repo dedicado `my-org/shared-workflows` con CODEOWNERS, CI propia, y org allowlist.
- Consumers fijan a **TAGS** (no `@main`) — debugging de cambios combined en `@main` es dolor conocido.
- Cada action/workflow compartido necesita: ownership claro, PR review obligatoria (CODEOWNERS), inputs/outputs/secrets documentados.
- Acoplamiento bajo: pasar todo configurable via inputs; nunca hardcodear env names o regiones.
- Enforce con org-level policies: allowed actions allowlist + SHA enforcement.

> **Fuente:** [GitHub Docs: Reusing workflows](https://docs.github.com/en/actions/concepts/workflows-and-actions/reusing-workflow-configurations), [GitHub Community #171037](https://github.com/orgs/community/discussions/171037), [Incredibuild: Reusable Workflows Best Practices](https://www.incredibuild.com/blog/best-practices-to-create-reusable-workflows-on-github-actions)

### 24.3 Concurrency Controls

#### Por qué importa en enterprise

- PR runs obsoletas queman runner minutes; deploys superpuestos corrompen estado (DB locks, prod half-deployed); releases sin coordinación se compiten entre sí.
- **Queue support** (nuevo May 2026 GA): permite serializar deploys SIN cancellation — anteriormente un segundo run reemplazaba el pendiente. Soporta hasta 100 runs encolados por grupo.

#### Patrón A — PR cancellation scopeado a eventos

Usado por moby/moby, grafana/grafana, vercel/next.js:

```yaml
concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: ${{ github.event_name == 'pull_request' }}
```

> **NUNCA** setear `cancel-in-progress: true` literal en workflows que también corren en push-to-main o release tags — un deploy podría ser cancelado mid-run.

#### Patrón B — Serialized deployments con queueing

```yaml
concurrency:
  group: deploy-${{ inputs.environment }}
  cancel-in-progress: false
  queue: max # hasta 100 runs encolados (May 2026 GA)
```

- `queue: max` requiere `cancel-in-progress: false` (o unset).
- Job-level concurrency para matrix jobs: `group: deploy-${{ matrix.region }}`.

#### Patrón C — Split CI vs deploy lanes

```yaml
# CI: cancel runs obsoletas
concurrency:
  group: test-${{ github.ref }}
  cancel-in-progress: true

# Deploy job: NUNCA cancelar, siempre serializar
jobs:
  deploy:
    concurrency:
      group: deploy-${{ inputs.environment }}
      cancel-in-progress: false
```

#### Notas operacionales

- Concurrency groups son **FIFO sin prioridad** — para priorizar hotfixes, merge a main primero.
- Agregar `timeout-minutes` a jobs para prevenir colas infinitas de stuck predecessors.
- Monorepo caution: NO usar un group global `deploy` para todos los servicios; keyear por service o environment.

> **Fuente:** [GitHub: Concurrency](https://docs.github.com/en/actions/concepts/workflows-and-actions/concurrency), [GitHub Changelog May 2026](https://github.blog/changelog/2026-05-07-github-actions-concurrency-groups-now-allow-larger-queues/)

### 24.4 Caching Strategies

#### Por qué importa en enterprise

- Dependency install + build cache hits reducen CI minutes un **30-80%** y reducen directamente costo y queue time.
- Límites duros: **10GB cache por repository** (LRU eviction). Monorepos pierden cache si las keys son demasiado amplias.

#### Patrón A — actions/setup-node built-in cache (monorepo-aware)

```yaml
- uses: actions/setup-node@v4
  with:
    node-version: '22'
    cache: 'npm' # npm | yarn | pnpm
    cache-dependency-path: |
      apps/client/package-lock.json
      apps/server/package-lock.json
```

- Default busca el lockfile en repo root; `cache-dependency-path` maneja múltiples lockfiles en subdirectorios.
- **Nota:** setup-node cachea el package manager store (`~/.npm`, pnpm store), NO `node_modules`.

#### Patrón B — actions/cache v4 con content-based keys

```yaml
- name: Cache npm store
  id: cache-npm
  uses: actions/cache@v4
  with:
    path: ~/.npm
    key: ${{ runner.os }}-npm-${{ hashFiles('**/package-lock.json') }}
    restore-keys: |
      ${{ runner.os }}-npm-
```

- Keys **DEBEN** ser content-based (hash de lockfiles), NUNCA `github.sha` (cada commit falla).
- `restore-keys` da hits parciales — crítico en monorepos donde exact-hash misses son comunes.

#### Patrón C — Docker layer caching (Apr 2025 Cache API v2)

```yaml
- uses: docker/build-push-action@v6
  with:
    context: .
    push: true
    cache-from: type=gha
    cache-to: type=gha,mode=max # cachea capas intermedias multi-stage
```

- `mode=max` cachea todas las capas intermedias. Requiere Buildx >= v0.21.0 / BuildKit >= v0.20.0 tras la migración Apr 2025 a Cache service API v2.
- Para >10GB o cross-repo sharing: `type=registry,ref=ghcr.io/myorg/myapp:buildcache,mode=max`.

#### Patrón D — Turborepo remote caching (monorepo)

- Local `.turbo` dir via `actions/cache` es fallback; el win real es remote cache compartido entre developers y CI.
- Dos opciones: Vercel Remote Cache via OIDC (recommended — sin `TURBO_TOKEN` secret long-lived) o self-hosted server.

```yaml
permissions:
  contents: read
  id-token: write # para OIDC con Vercel
steps:
  - uses: actions/checkout@v6
  - uses: vercel/setup-turborepo-remote-cache-action@v1.0.0
    with:
      team: ${{ vars.TURBO_TEAM }}
  - run: pnpm turbo build test
```

- Nuevo: `turbo.json` → `remoteCache.signature: true` + `TURBO_REMOTE_CACHE_SIGNATURE_KEY` firma cache artifacts (integrity protection contra cache poisoning).

> **Fuente:** [GitHub: Dependency Caching](https://docs.github.com/en/actions/reference/workflows-and-actions/dependency-caching), [Turborepo CI Vendors](https://turborepo.dev/docs/guides/ci-vendors/github-actions), [Tenki: CI Caching](https://tenki.cloud/blog/github-actions-caching-npm-docker-turborepo)

### 24.5 Matrix Builds

#### Patrón A — include/exclude + fail-fast + max-parallel

```yaml
strategy:
  fail-fast: false # collect ALL failures en vez de cancelar siblings
  max-parallel: 4 # cap concurrent runners
  matrix:
    os: ['ubuntu-latest', 'windows-latest', 'macos-latest']
    node: ['18', '20', '22']
    exclude:
      - os: 'windows-latest'
        node: '18'
      - os: 'macos-latest'
        node: '18'
    include:
      - os: 'ubuntu-latest'
        node: '23'
        experimental: true
```

- `fail-fast` default es `true` — bueno para velocidad, malo para signal. Enterprise PR gates usualmente quieren `fail-fast: false`.
- Experimental combos: `continue-on-error: ${{ matrix.experimental }}` para que bleeding-edge combos nunca blockeen merges.

#### Patrón B — Dynamic matrix desde detection job (monorepo / affected-only)

```yaml
jobs:
  detect:
    runs-on: ubuntu-latest
    outputs:
      matrix: ${{ steps.set-matrix.outputs.matrix }}
    steps:
      - uses: actions/checkout@v6
        with:
          fetch-depth: 0
      - id: set-matrix
        run: |
          packages=$(jq -R -s -c 'split("\n")[:-1]' <<< 'api web worker')
          echo "matrix={\"package\":$packages,\"node\":[\"20\",\"22\"]}" >> $GITHUB_OUTPUT

  test:
    needs: detect
    runs-on: ubuntu-latest
    strategy:
      fail-fast: false
      matrix: ${{ fromJson(needs.detect.outputs.matrix) }}
    steps:
      - run: npm test --workspace=${{ matrix.package }}
```

- Combinar con `dorny/paths-filter` outputs (sección 24.8) para construir la matrix SOLO de affected packages.

> **Fuente:** [GitHub: Matrix strategy](https://docs.github.com/en/actions/using-workflows/workflow-syntax-for-github-actions)

### 24.6 Environment Protection

#### Por qué importa en enterprise

- Environments = change-management gate antes de prod: aprobación humana, cooling-off window, branch restriction, blast-radius-limited secrets — todo auditable.
- **Tier caveat:** required reviewers y wait timers en private repos requieren Enterprise; Free/Pro/Team los obtienen solo en public repos.

#### Patrón — job targeting a protected environment

```yaml
jobs:
  deploy:
    runs-on: ubuntu-latest
    environment:
      name: production
      url: https://app.example.com
    steps:
      - run: ./deploy.sh
        env:
          API_KEY: ${{ secrets.API_KEY }} # env-scoped, solo disponible en prod deploys
```

#### Protection rules (Settings > Environments)

| Regla                                | Detalle                                                                                            |
| ------------------------------------ | -------------------------------------------------------------------------------------------------- |
| Required reviewers                   | Hasta 6 users/teams; ONE approval procede; habilitar "Prevent self-review" en production           |
| Wait timer                           | 1 a 43,200 min (30 días); **no factura Actions minutes**                                           |
| Deployment branches/tags             | Protected branches only / selected patterns (main, release/_, v_._._)                              |
| Custom protection rules (Enterprise) | Plugin-driven gates (ITSM ticket, linters, observability checks)                                   |
| NEW Mar 2026                         | `deployment: false` en job-level — targets environment para secrets/URL pero nunca encola approval |

#### Composición empresarial

- **Un build por tag, promover el MISMO artifact:** staging auto-deploys, production requiere approval — **nunca rebuild en prod**.
- Pair environment rules con repository Rulesets + required checks.
- Environment-scoped secrets reducen blast radius; preferir OIDC sobre stored cloud keys.
- Concurrency: dar a cada environment su propio group (`deploy-${{ inputs.environment }}`, `queue: max`).

> **Fuente:** [GitHub: Environments](https://docs.github.com/en/actions/managing-workflow-runs-and-deployments/managing-deployments/using-environments-for-deployment), [GitHub Mar 2026: deployment false](https://learn.github.com/product-guides/github-actions/succeed-long-term/implement-deployment-controls-and-environment-protection)

### 24.7 OIDC for Cloud Providers

#### Por qué importa en enterprise

- Elimina la clase entera de leaked long-lived cloud secrets: sin AWS keys / GCP SA JSON / Azure creds en GitHub Secrets. Tokens son job-scoped, expiran en minutos, y cada emisión se audita (CloudTrail / GCP logs / Entra audit) con repo+branch+workflow+run ID.
- La rotación se vuelve innecesaria; los audit trails se vuelven estructurales en vez de manuales.

#### Patrón A — AWS (IAM web identity federation)

```yaml
permissions:
  id-token: write
  contents: read
steps:
  - uses: aws-actions/configure-aws-credentials@v4
    with:
      role-to-assume: arn:aws:iam::123456789012:role/gha-deploy
      aws-region: us-east-1
      role-duration-seconds: 900 # 15 min floor
```

#### Patrón B — GCP (Workload Identity Federation)

```yaml
permissions:
  id-token: write
  contents: read
steps:
  - uses: google-github-actions/auth@v2
    with:
      workload_identity_provider: ${{ vars.GCP_WIF_PROVIDER }}
      service_account: ${{ vars.GCP_SERVICE_ACCOUNT }}
  - uses: google-github-actions/setup-gcloud@v2
```

#### Patrón C — Azure (federated credentials)

```yaml
permissions:
  id-token: write
  contents: read
steps:
  - uses: azure/login@v2
    with:
      client-id: ${{ vars.AZURE_CLIENT_ID }}
      tenant-id: ${{ vars.AZURE_TENANT_ID }}
      subscription-id: ${{ vars.AZURE_SUBSCRIPTION_ID }}
```

#### El control de seguridad CRÍTICO — subject-claim trust policies

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Federated": "arn:aws:iam::123456789012:oidc-provider/token.actions.githubusercontent.com"
      },
      "Action": "sts:AssumeRoleWithWebIdentity",
      "Condition": {
        "StringEquals": {
          "token.actions.githubusercontent.com:aud": "sts.amazonaws.com"
        },
        "StringLike": {
          "token.actions.githubusercontent.com:sub": "repo:my-org/my-app:environment:production"
        }
      }
    }
  ]
}
```

- **Scopear a repo + branch** (`ref:refs/heads/main`) + **environment** (`environment:production`). NUNCA grantear a PR workflows roles de prod — `pull_request` runs pueden ser triggered por forks.
- Pitfalls: subject conditions overly permissive; missing environment protection rules; reusable-workflow injection; long token TTLs (keep 900s / 15 min floor).

> **Fuente:** [GitHub: OIDC](https://docs.github.com/en/actions/concepts/security/openid-connect), [Scramble ID: OIDC Federation](https://www.scrambleid.com/learn/github-actions-oidc-federation-across-clouds)

### 24.8 GitHub Actions para Monorepos

#### Por qué importa en enterprise

- Monorepos ejecutan 10-100x más CI jobs que single-repo teams. Configs naïfs explotan minutes, queue time y costo. **Affected-only execution** es la diferencia entre 90 jobs y 8 por PR.

#### Capa 1 — Workflow-level path triggers (cheap, coarse)

```yaml
on:
  pull_request:
    paths:
      - 'apps/server/**'
      - 'packages/shared/**'
      - '.github/workflows/server-ci.yml'
```

#### Capa 2 — dorny/paths-filter v4 (job/step level, precise)

```yaml
jobs:
  changes:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      pull-requests: read
    outputs:
      server: ${{ steps.filter.outputs.server }}
    steps:
      - uses: actions/checkout@v6
      - uses: dorny/paths-filter@v4
        id: filter
        with:
          filters: |
            server:
              - 'apps/server/**'
            client:
              - 'apps/client/**'
          list-files: json

  test-server:
    needs: changes
    if: needs.changes.outputs.server == 'true'
    runs-on: ubuntu-latest
    steps:
      - run: npm test --workspace=apps/server
```

- Por qué no solo built-in paths: built-in triggers funcionan al nivel de WORKFLOW; paths-filter habilita condiciones por job/step y entrega JSON a matrix `fromJson`.

#### Capa 3 — Turborepo affected-only + remote cache

```yaml
steps:
  - uses: actions/checkout@v6
    with:
      fetch-depth: 0 # requerido para change detection vs origin/main
  - run: pnpm turbo build test --filter='...[origin/main]'
```

- `'...[origin/main]'` = changed packages + sus dependents.
- Medir: cache hit rate (>80% target), queue time (<30s target).

> **Fuente:** [dorny/paths-filter](https://github.com/dorny/paths-filter), [Turborepo CI](https://turborepo.dev/docs/guides/ci-vendors/github-actions), [WarpBuild: Monorepo Guide](https://www.warpbuild.com/blog/github-actions-monorepo-guide)

### 24.9 Security Hardening

#### Por qué importa en enterprise

El compromise de **tj-actions/changed-files** (Mar 2025, CVE-2025-30066, ~23,000 repos) probó que version tags son attack surface mutable: attackers repointaron tags existentes a malicious code. El blast radius se define por qué pueden hacer las actions, qué código confían, y a qué pueden acceder.

#### Control 1 — SHA-pin cada third-party action (ahora ENFORCEABLE)

```yaml
# MAL — tag mutable, attack surface
- uses: actions/checkout@v4

# BIEN — SHA inmutable, verificable
- uses: actions/checkout@b4ffde65f46336ab88eb53be808477a3936bae11 # v4.1.1
```

- **Aug 2025 GA:** org/enterprise policy puede (a) enforce full-SHA pinning (workflows usando tags FAIL) y (b) blocklist actions específicas con prefix `!`.
- Mantener actualizados: Dependabot (version-updates) + Renovate automatizan SHA bumps.

#### Control 2 — Least-privilege permissions

```yaml
permissions:
  contents: read # workflow-wide floor
jobs:
  release:
    permissions:
      contents: write # escalate per-job only
      id-token: write
      attestations: write
```

- `persist-credentials: false` en checkout a menos que later steps necesiten el token.
- Nunca usar `pull_request_target` checkeando untrusted head code.

#### Control 3 — CODEOWNERS on workflow files

```
# .github/CODEOWNERS
.github/workflows/ @my-org/platform-eng
.github/actions/     @my-org/platform-eng
```

Cada cambio a CI/CD debe pasar platform-eng review. Enforce via branch protection / rulesets.

#### Control 4 — Artifact attestations

```yaml
permissions:
  id-token: write
  contents: read
  attestations: write
steps:
  - uses: actions/checkout@v6
  - run: make my-app
  - uses: actions/attest-build-provenance@v2
    with:
      subject-path: '${{ github.workspace }}/my-app'
```

- Binding subject (artifact + digest) a SLSA v1.2 build provenance (in-toto format), signed con short-lived Sigstore cert.
- Verify: `gh attestation verify <artifact> --repo owner/repo`.
- Achieves **SLSA v1 Build Level 3** cuando se combina con reusable workflows (permissions: `attestations: write` + `contents: read` + `id-token: write` en BOTH caller y reusable workflow).

#### Control 5 — Script injection prevention

```yaml
# MAL — untrusted context inline en run block
- run: echo "Branch is ${{ github.head_ref }}"

# BIEN — route through env
- run: echo "Branch is $BRANCH"
  env:
    BRANCH: ${{ github.head_ref }}
```

- Nunca escribir untrusted data a `GITHUB_ENV`/`GITHUB_PATH`.
- `step-security/harden-runner` per job: egress allowlists + runtime monitoring.
- Self-hosted runners: **ephemeral only** (`--ephemeral` / ARC), nunca en public repos.

> **Fuente:** [GitHub Changelog Aug 2025: SHA Pinning Policy](https://github.blog/changelog/2025-08-15-github-actions-policy-now-supports-blocking-and-sha-pinning-actions), [GitHub: Secure Use](https://docs.github.com/en/actions/reference/security/secure-use), [actions/attest-build-provenance](https://github.com/actions/attest-build-provenance)

### 24.10 Checklist consolidado — GitHub Actions Enterprise

| #   | Capa             | Acción                                                                                                                          | Impacto                                      |
| --- | ---------------- | ------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------- |
| 1   | Shared workflows | Repo dedicado con tagged reusable workflows + composite actions, CODEOWNERS-protected, SHA-enforcement policy                   | Consistencia cross-repo                      |
| 2   | Concurrency      | Per-workflow-per-ref groups; cancel-in-progress solo en PR events; `queue: max` por environment para deploys                    | Ahorro de minutos + previene race conditions |
| 3   | Caching          | setup-node built-in (`cache-dependency-path`) + Turborepo remote cache via OIDC; content-based keys; Docker `type=gha,mode=max` | 30-80% reducción en job duration             |
| 4   | Matrices         | Affected-only dynamic matrices desde paths-filter, `fail-fast: false`, `max-parallel`, include/exclude, experimental flags      | 90→8 jobs por PR en monorepo                 |
| 5   | Environments     | Reviewers (+prevent self-review), wait timer, branch/tag policy, env-scoped secrets; `deployment: false` para plan jobs         | Change management gate para prod             |
| 6   | OIDC             | AWS/GCP/Azure federation; subject-claim scoped a repo+branch+environment; 15-min tokens; quarterly audit                        | Elimina long-lived cloud secrets             |
| 7   | Monorepo         | paths triggers + dorny/paths-filter + turbo `--filter='...[origin/main]'` con `fetch-depth: 0`                                  | Solo affected workspaces se construyen       |
| 8   | Security         | SHA-pinned actions, minimal permissions, CODEOWNERS, attest-build-provenance + gh attestation verify, harden-runner             | Supply chain integrity                       |

### 24.11 GitHub Actions 2026 Security Features

GitHub Actions ha lanzado nuevas features de seguridad en 2026 que complementan el hardening de la sección 24.9:

#### Workflow Execution Protections (public preview desde junio 2026)

Permite definir **actor rules** y **event rules** vía GitHub Rulesets para controlar QUÉ workflows se ejecutan y CUÁNDO:

```yaml
# Repository Ruleset — workflow execution protection
name: 'workflow-execution-protection'
target: branch
enforcement: active
rules:
  - type: workflow_execution
    parameters:
      allowed_actions: 'selected'
      allowed_workflows:
        - '.github/workflows/ci.yml'
        - '.github/workflows/deploy.yml'
```

**Casos de uso:**

- Bloquear workflows de forks en PRs (evitar miners de crypto)
- Restringir a reusable workflows de un repo específico
- Permitir solo workflows con SHA-pinned actions

#### Scoped Secrets

Los secrets ahora se pueden scopear por **workflow file** además de environment. Esto evita que reusable workflows hereden secrets innecesariamente:

```yaml
jobs:
  deploy:
    secrets: inherit # Hereda secrets del caller
    # NUEVO 2026: caller puede filtrar qué secrets pasan
```

#### Egress Firewall nativo

Control de red a nivel de workflow: permitir solo conexiones a dominios aprobados. Previene data exfiltration desde pipelines compromised. Se define vía repository ruleset.

#### Immutable Releases

Las releases de GitHub ahora soportan **immutability**: una vez publicada, no se puede modificar el artifact. Complementa SLSA provenance y cosign signatures.

#### `dependencies:` Section con SHA-lock

Nueva sección en workflow files que declara explícitamente las dependencias (actions, reusable workflows) con SHA pins:

```yaml
dependencies:
  actions:
    - uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683
    - uses: actions/setup-node@49933ea5288caeca8642d1e84afbd3f7d6820020
  reusable:
    - uses: my-org/shared-workflows/deploy@v2
```

**Impacto:** receptor puede auditar dependencias sin leer cada `uses:` en steps.

> **Fuentes:** [GitHub Actions 2026 Security Roadmap](https://github.blog/news-insights/product-news/whats-coming-to-our-github-actions-2026-security-roadmap/), [Workflow Execution Protections](https://github.blog/changelog/2026-06-18-control-who-and-what-triggers-github-actions-workflows/)

---

## 25. Supply Chain Security: SLSA, Sigstore, SBOM, NIST SSDF

### 25.1 Descripción

La seguridad de la supply chain de software se convirtió en el **foco regulatorio nº1** de 2024-2026: EO 14028 (US), EU Cyber Resilience Act (2024/1689), OMB M-22-18 (attestation), FedRAMP, y DoD CMMC. Un pipeline CI/CD seguro no es opcional — es requisito de compliance para vender software a gobiernos y empresas reguladas. Esta sección documenta los marcos y herramientas que constituyen una supply chain enterprise-grade.

### 25.2 SLSA Framework (Supply-chain Levels for Software Artifacts)

#### Qué es

SLSA (pronunciado "salsa", slsa.dev) es un framework de seguridad creado por Google y mantenido bajo OpenSSF. SLSA v1.x reestructura el framework en **tracks**: Source (provenance del source code y review policy), Build (provenance del build), y Reproducibility (track futuro).

#### Niveles de Build (qué requiere cada uno)

| Nivel            | Requisito                                                                                                                                            | Confianza                                                            | Implementación en GitHub Actions                                  |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- | ----------------------------------------------------------------- |
| **Build L1**     | Provenance existe — build script produce un documento con builder identity, source repo, output digest                                               | Audit trail, habilita tooling                                        | Cualquier pipeline que genere un provenance doc                   |
| **Build L2**     | Hosted, non-forgeable — build en plataforma managed + provenance generada y firmada por la plataforma, NO por user scripts                           | Compromised build script no puede forge provenance                   | GitHub Actions + GitHub Artifact Attestations (out of box)        |
| **Build L3**     | Hardened, hermetic — ephemeral isolated environments, no shared state, no network access (hermetic), provenance out-of-band, two-party source review | Even con full control del build config, no se puede forge provenance | Reusable workflows + `actions/attest` con trusted-builder pattern |
| **Reproducible** | Bit-for-bit reproducible builds                                                                                                                      | Aspiracional/future; pocas orgs operan aquí                          | slsa-framework/slsa-github-generator (maintenance mode)           |

> **Nota:** slsa-github-generator está en **maintenance mode** (último release v2.1.0, Feb 2025). GitHub Artifact Attestations es el camino recomendado en GitHub Actions. Verificar con `gh attestation verify` en vez de `slsa-verifier`.

#### Implementación — GitHub Artifact Attestations (recomendado 2025+)

```yaml
permissions:
  id-token: write # mint OIDC token para Sigstore signing cert
  attestations: write # persist attestation
  contents: read
steps:
  - uses: actions/checkout@v6
  - run: ./build.sh # produce dist/app
  - uses: actions/attest@v4 # unified action (reemplaza attest-build-provenance)
    with:
      subject-path: dist/app
```

- **actions/attest** (v4) es la unified action — auto-detecta mode: Provenance (default), SBOM (`sbom-path`), Custom (`predicate-type`/`predicate`).
- Verificar: `gh attestation verify dist/app --owner org-name`
- Achieves **SLSA v1.2 Build L2** out of the box; **L3** via isolated trusted-builder pattern.

> **Fuente:** [SLSA Spec v1.2](https://slsa.dev/spec/v1.2/), [SLSA Levels](https://slsa.dev/spec/v1.2/levels), [actions/attest](https://github.com/actions/attest)

### 25.3 Sigstore (cosign, keyless signing, Fulcio, Rekor)

#### Qué es

Sigstore es un proyecto OpenSSF que provee un ecosistema gratuito para signing y verification de artifacts. Tres componentes core:

| Componente | Función                                                                                                        |
| ---------- | -------------------------------------------------------------------------------------------------------------- |
| **cosign** | CLI para firmar container images y blobs arbitrarios; firmas almacenadas como OCI artifacts o Sigstore bundles |
| **Fulcio** | Certificate Authority que emite short-lived X.509 certs (~10 min) bound a una OIDC identity                    |
| **Rekor**  | Public, append-only transparency log que registra cada signing event — tamper-evidence y auditability          |

#### Flujo de keyless signing (por qué importa)

1. CI mintea un OIDC token (`id-token: write`)
2. Fulcio emite un cert short-lived binding una ephemeral key a esa OIDC identity
3. Signature + cert se registran en Rekor
4. Verifiers checkean la signature contra el cert y confirman la identity/issuer pinnada

**No hay long-lived private key** — nothing to store, rotate, o leak. Este es el win enterprise primary.

#### Implementación en GitHub Actions

```yaml
permissions:
  id-token: write
  contents: read
steps:
  - uses: actions/checkout@v6
  - uses: sigstore/cosign-installer@v3.8.1
  - name: Sign artifact
    run: cosign sign-blob --yes --bundle dist/app.sigstore dist/app
  - name: Verify (self-check in CI)
    run: |
      cosign verify-blob --bundle dist/app.sigstore \
        --certificate-identity 'https://github.com/org/repo/.github/workflows/release.yml@refs/tags/v*' \
        --certificate-oidc-issuer 'https://token.actions.githubusercontent.com' \
        dist/app
```

> **CRÍTICO:** Siempre pin `--certificate-identity` y `--certificate-oidc-issuer` en verification; de lo contrario solo pruebas "alguien lo firmó".

> **Fuente:** [Sigstore Docs](https://docs.sigstore.dev/cosign/signing/overview/), [Fulcio](https://github.com/sigstore/fulcio), [Rekor](https://github.com/sigstore/rekor)

### 25.4 In-toto (CNCF Graduated, Apr 2025)

#### Qué es

in-toto es un proyecto CNCF **graduated** (abril 2025) para supply chain integrity. Dos capas:

1. **Classic layout/link model** — defines un _layout_ (qué steps deben correr) y _link metadata_ (evidencia firmada de qué pasó realmente).
2. **In-toto Attestation Framework (ITE-6)** — formato genérico de signed statement: DSSE envelope → Statement → `subject[]` + `predicateType` + `predicate`. **Este es el layer que el ecosistema estandarizó.**

#### Por qué importa

SLSA provenance se define como in-toto attestation predicate type; GitHub Artifact Attestations emite signed in-toto statements; cosign attest y Docker BuildKit attestations también producen formato in-toto. Es la **lingua franca** de supply chain metadata — SBOMs, provenance, vuln-scan results, y policy decisions comparten un envelope format.

Adopters en producción: Datadog (desde 2019), SolarWinds (post-SUNBURST pipeline redesign), Autodesk (FedRAMP ATO).

> **Fuente:** [in-toto.io](https://in-toto.io/), [in-toto Attestation](https://github.com/in-toto/attestation), [CNCF Project](https://www.cncf.io/projects/in-toto/)

### 25.5 SBOM Standards: CycloneDX vs SPDX

#### Qué son

Un Software Bill of Materials (SBOM) es un inventario machine-readable de componentes en software — **requerido** por US EO 14028 y EU Cyber Resilience Act (BSI TR-03183-2 requiere CycloneDX 1.6+ o SPDX 3.0.1+).

| Aspecto     | CycloneDX (OWASP, ECMA-424)                                     | SPDX (Linux Foundation, ISO/IEC 5962:2021)            |
| ----------- | --------------------------------------------------------------- | ----------------------------------------------------- |
| Foco        | **Security-first** — vulnerabilities, services, VEX integration | **License-first** — deepest license/attribution model |
| Compliance  | CRA/BSI compliant (v1.6+)                                       | ISO standard, CRA compliant (v3.0.1+)                 |
| Tools       | CycloneDX CLI, cdxgen, plugins                                  | Microsoft SBOM Tool, SPDX tools                       |
| Cuándo usar | DevSecOps, vulnerability workflows, compliance para EU CRA      | Legal/IP audits, export control, M&A due diligence    |

**Recomendación práctica:** generar **ambos** del mismo build (tools lo hacen trivial) — legal teams obtienen SPDX, security teams obtienen CycloneDX.

#### Herramientas de generación

| Herramienta                           | Tipo                     | Fortaleza                                                                                                                                          |
| ------------------------------------- | ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Syft** (Anchore, Apache-2.0)        | Dedicated SBOM generator | Deepest cataloger coverage (Go/Rust compiled binaries), outputs CycloneDX/SPDX/GitHub/custom. Pairs with Grype. Best cuando SBOM es el deliverable |
| **Trivy** (Aqua Security, Apache-2.0) | All-in-one scanner       | Vulnerabilities + SBOM + IaC + secrets + licenses. Best cuando vulnerability scanning es primary goal                                              |

```bash
# Syft — CycloneDX desde container image
syft packages registry.example.com/app:latest -o cyclonedx-json > sbom.cdx.json

# Syft — SPDX desde directorio
syft dir:./dist -o spdx-json > sbom.spdx.json

# Trivy — SBOM + scan en un paso
trivy image --format cyclonedx --output sbom.cdx.json registry.example.com/app:latest

# Convertir formatos
cyclonedx convert --input-format spdxjson --output-format json \
  --input-file sbom.spdx.json --output-file sbom.cdx.json
```

> **Fuente:** [CycloneDX](https://cyclonedx.org/), [SPDX](https://spdx.dev/), [Syft](https://github.com/anchore/syft), [Trivy](https://github.com/aquasecurity/trivy)

### 25.6 Dependency Security Layered Strategy

La security de dependencias es **por capas** — ninguna herramienta sola cubre todo:

| Capa                     | Herramienta                                           | Qué detecta                                                                                               |
| ------------------------ | ----------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| **Automated updates**    | Dependabot (GitHub-native) o Renovate (100+ managers) | Version updates + security updates de GitHub Advisory Database                                            |
| **CVE scanning**         | Trivy / Grype / Snyk en CI                            | Known vulnerabilities en dependency graph                                                                 |
| **Behavioral detection** | Socket.dev                                            | Malicious code, typosquatting, hijacked packages, suspicious network/file behavior — **más allá de CVEs** |
| **PR gate**              | actions/dependency-review-action                      | Scanea PR diff contra dependency graph; bloquea merges que introducen vulnerables                         |

```yaml
# .github/workflows/dependency-review.yml
name: Dependency Review
on: [pull_request]
permissions:
  contents: read
jobs:
  dependency-review:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6
      - uses: actions/dependency-review-action@v4
        with:
          fail-on-severity: high
```

```yaml
# .github/dependabot.yml
version: 2
updates:
  - package-ecosystem: npm
    directory: '/'
    schedule:
      interval: weekly
    groups:
      minor-and-patch:
        patterns: ['*']
        update-types: ['minor', 'patch']
  - package-ecosystem: github-actions
    directory: '/'
    schedule:
      interval: weekly
```

> **Fuente:** [Dependabot](https://docs.github.com/en/code-security/dependabot), [Renovate](https://github.com/renovatebot/renovate), [Socket.dev](https://socket.dev/), [dependency-review-action](https://github.com/actions/dependency-review-action)

### 25.7 OpenSSF Scorecard

#### Qué es

OpenSSF Scorecard es una herramienta automatizada que puntúa (0-10) un repositorio contra ~19 supply-chain risk checks: Pinned-Dependencies, Token-Permissions, Branch-Protection, Signed-Releases, Fuzzing, SAST, Dependency-Update-Tool, Vulnerabilities, Code-Review, Security-Policy, Dangerous-Workflow, CI-Tests, Binary-Artifacts, Packaging, Maintained, License, Contributors, CII-Best-Practices.

#### Implementación

```yaml
# .github/workflows/scorecard.yml
name: Scorecard supply-chain security
on:
  push:
    branches: [main]
  schedule:
    - cron: '0 0 * * 0' # weekly
  workflow_dispatch: {}
permissions: read-all
jobs:
  scorecard:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6
        with:
          persist-credentials: false
      - uses: ossf/scorecard-action@v2.4.0
        with:
          results_file: results.sarif
          results_format: sarif
          publish_results: true
      - uses: github/codeql-action/upload-sarif@v3
        with:
          sarif_file: results.sarif
```

El action **signa resultados y los sube a Rekor** (tamper-evident), y upload SARIF para CodeQL/code scanning integration.

> **Fuente:** [OpenSSF Scorecard](https://github.com/ossf/scorecard), [Scorecard Action](https://github.com/ossf/scorecard-action), [scorecard.dev](https://scorecard.dev/)

### 25.8 NIST SSDF (SP 800-218) — Mapeo a CI/CD

#### Qué es

NIST SP 800-218 define el **Secure Software Development Framework** (SSDF) — un core set de prácticas de secure software development integrable en cualquier SDLC. Baseline: **v1.1 (Feb 2022)**. **Rev. 1 / v1.2** initial public draft publicado Dec 2025 (en response a EO 14306).

#### Los 4 practice groups y su mapeo a CI/CD

| Practice Group                                | Mapeo a CI/CD                                                   | Herramientas                                                                             |
| --------------------------------------------- | --------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| **PO — Prepare Organization** (PO.5)          | Generar y archivar SBOM per release                             | Syft/Trivy + attestation                                                                 |
| **PS — Protect Software** (PS.3)              | Firmar artifacts, generar SLSA provenance, builds reproducibles | Sigstore keyless / GitHub attestations                                                   |
| **PW — Produce Well-Secured Software** (PW.4) | Software composition analysis                                   | Dependabot/Renovate + dependency-review-action + Socket.dev + Trivy/Grype                |
| **PW — Produce Well-Secured Software** (PW.5) | Harden CI/CD                                                    | Least-privilege tokens, SHA pin actions, hosted/isolated runners, provenance attestation |
| **PW — Produce Well-Secured Software** (PW.7) | Security testing SAST/DAST gates                                | CodeQL/Semgrep + DAST como merge-required status checks                                  |
| **RV — Respond to Vulnerabilities** (RV.1)    | Aggregate findings centrally, remediate within SLAs             | Dependabot alerts + centralized vuln management con triage SLAs                          |

#### Controles NIST SP 800-53 aplicables a CI/CD

| Control      | Título                                        | Aplicación CI/CD                              | project-one                                             |
| ------------ | --------------------------------------------- | --------------------------------------------- | ------------------------------------------------------- |
| **SA-11(a)** | Developer Testing and Analysis                | Unit/integration tests, code review, SAST     | Vitest, Testing Library, Semgrep                        |
| **SA-15(a)** | Development Tools, Techniques, and Methods    | Control de acceso a herramientas de build     | Pipeline as Code (GitHub Actions), SHA-pinned actions   |
| **RA-5**     | Vulnerability Scanning and Monitoring         | SAST, SCA, container scanning                 | Semgrep, Gitleaks, Dependabot, dependency-review-action |
| **CM-2**     | Baseline Configuration                        | Pipeline configuration management             | Infrastructure as Code, pipeline versioning             |
| **CM-6**     | Configuration Settings                        | Security hardening de pipeline                | Least-privilege permissions, ephemeral runners          |
| **SI-7**     | Software, Firmware, and Information Integrity | Artifact signing, hash verification           | Cosign keyless, SLSA provenance, GitHub attestations    |
| **AC-2**     | Account Management                            | RBAC en pipelines, credential rotation        | GitHub Environments, OIDC tokens, least-privilege       |
| **AU-2**     | Audit Events                                  | Audit trail, logs inmutables                  | GitHub Audit Log, DORA metrics, deployment records      |
| **AU-3**     | Content of Audit Records                      | Trazabilidad: quién hizo qué, cuándo, por qué | PR linking, approval records, signed commits            |

#### Por qué importa para compliance

SSDF es el baseline para **EO 14028** secure software requirements y **OMB M-22-18 Secure Software Attestation Form** requerido de software producers vendiendo al gobierno US federal; ampliamente referenciado por FedRAMP y procurement enterprise.

> **Nota:** Para mapeo detallado de cada componente del pipeline a NIST/CISA, ver §25.11.

### 25.9 Adoption Roadmap pragmático

| Fase                         | Acción                                                                                                | Cubre                                                                      |
| ---------------------------- | ----------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| **1. Foundation**            | Branch protection con two-party review; pin actions por SHA; least-privilege workflow permissions     | SLSA Source L3, SSDF PW.5, Scorecard Pinned-Dependencies/Token-Permissions |
| **2. Dependencies**          | Dependabot (npm + github-actions) con grouped updates; dependency-review-action gate; Socket.dev      | SSDF PW.4, RV.1                                                            |
| **3. Provenance**            | `actions/attest@v4` en cada release artifact; `gh attestation verify` en deployment pipelines         | **SLSA Build L2** (signed provenance + SBOM), SSDF PS.3                    |
| **4. SBOM**                  | Syft-generated CycloneDX + SPDX per release, attested                                                 | CRA/EO 14028, SSDF PO.5                                                    |
| **5. Container signing**     | cosign keyless en registry push; admission policy en Kubernetes                                       | Sigstore verification                                                      |
| **6. Continuous assessment** | OpenSSF Scorecard weekly con SARIF upload                                                             | Ongoing supply chain health                                                |
| **7. Compliance evidence**   | Documentar SSDF mapping, archivar SBOMs + attestations per release, SECURITY.md con disclosure policy | EO 14028/FedRAMP attestation                                               |

> **Nota para ERP:** El target recomendado es **SLSA Build L2** (hosted build + signed provenance + SBOM). SLSA L3/L4 requiere hermetic builds, two-party verification, y hardened runners — justified para distribución externa, overkill para ERP interno. Ver §23.3 diagrama para la distribución correcta de SLSA claims.

### 25.10 CISA CI/CD Security Guidance

#### Qué es

CISA (Cybersecurity and Infrastructure Security Agency) es la agencia del DHS enfocada en protección de infraestructura crítica, incluyendo software supply chain. Publica guías operativas para asegurar CI/CD contra amenazas reales.

#### Documentos clave

| Documento                                                         | Enfoque                                               | Relevancia CI/CD                                      |
| ----------------------------------------------------------------- | ----------------------------------------------------- | ----------------------------------------------------- |
| **"Securing CI/CD"**                                              | Threat model específico para CI/CD pipelines          | 5 amenazas core + mitigaciones                        |
| **"Defending Against Software Supply Chain Attacks"** (ANB-22-01) | Protección contra ataques en supply chain             | Typosquatting, dependency confusion, credential theft |
| **BOD 22-01**                                                     | Binding Operational Directive para agencias federales | Requisitos de vulnerability scanning                  |
| **KEV Catalog**                                                   | Known Exploited Vulnerabilities                       | Vulnerabilities que deben ser parcheadas urgentemente |
| **SBOM Guidance**                                                 | Software Bill of Materials                            | SBOM como requisito para transparencia de componentes |

#### 5 Amenazas CI/CD identificadas por CISA

| #   | Amenaza                           | Descripción                                                | Mitigación en project-one                                           |
| --- | --------------------------------- | ---------------------------------------------------------- | ------------------------------------------------------------------- |
| 1   | **Compromiso de credentials**     | Tokens de CI/CD, secrets hardcodeados, OIDC identity theft | Gitleaks (pre-commit + CI), least-privilege tokens, SHA pin actions |
| 2   | **Inyección de código malicioso** | Cambios no autorizados en pipeline, workflow tampering     | Branch protection, commit signing, PR review mandatory              |
| 3   | **Dependencias comprometidas**    | Typosquatting, dependency confusion, hijacked packages     | Dependabot, dependency-review-action, Socket.dev                    |
| 4   | **Artifact tampering**            | Modificación de bins/images entre build y deploy           | Artifact signing (Cosign/Sigstore), SLSA provenance                 |
| 5   | **Acceso no autorizado**          | Permisos excesivos en runners de CI                        | Least-privilege workflow permissions, ephemeral runners             |

#### Mapeo CISA → project-one

| CISA Control             | Implementación en project-one                                          |
| ------------------------ | ---------------------------------------------------------------------- |
| Credential protection    | Gitleaks pre-commit + CI, OIDC for signing, no long-lived tokens       |
| Pipeline integrity       | Branch protection (signed commits, 2-party review), SHA-pinned actions |
| Dependency security      | Dependabot + dependency-review-action + Socket.dev                     |
| Artifact integrity       | Cosign keyless signing, SLSA Build L2 attestation                      |
| Access controls          | GitHub Environments, required reviewers, least-privilege permissions   |
| Vulnerability management | Semgrep SAST, early-abort gate (critical/high), KEV-aware patching     |

> **Fuente:** [CISA Securing CI/CD](https://www.cisa.gov/news-events/cybersecurity-advisories/aa22-118a), [CISA Supply Chain](https://www.cisa.gov/topics/cyber-threats-and-advisories/addressing-vulnerabilities/secure-software-development), [CISA KEV](https://www.cisa.gov/known-exploited-vulnerabilities-catalog)

### 25.11 NIST/CISA Mapping a project-one Pipeline

La siguiente tabla mapea cada componente del pipeline de project-one a los controles NIST y las guías CISA correspondientes:

| Componente Pipeline                     | NIST Control                    | CISA Guidance                                               | Evidencia Generada                                |
| --------------------------------------- | ------------------------------- | ----------------------------------------------------------- | ------------------------------------------------- |
| **Commit Signing (GPG/sigstore)**       | SI-7 (Software Integrity)       | Pipeline integrity — autenticación de commits               | Signed commit objects, GitHub "Verified" badge    |
| **Commit Lint (commitlint)**            | SA-11 (Developer Testing)       | Pipeline integrity — estándares de código                   | Commit validation logs                            |
| **PR Metadata Checks**                  | AC-2 (Account Management)       | Access controls — trazabilidad de cambios                   | DCO sign-off, PR template compliance              |
| **Early-abort gate (SAST crítico)**     | RA-5 (Vulnerability Scanning)   | Vulnerability management — fail-fast para amenazas críticas | Semgrep results (critical/high only, diff-scoped) |
| **Gitleaks (Secret Detection)**         | RA-5 (Vulnerability Scanning)   | Credential protection — detección de secrets                | Gitleaks scan results                             |
| **Semgrep (SAST)**                      | RA-5 (Vulnerability Scanning)   | Vulnerability management — static analysis                  | SAST findings with severity                       |
| **ESLint / Prettier**                   | SA-11 (Developer Testing)       | Pipeline integrity — code quality gates                     | Lint/format results                               |
| **TypeScript (tsc --noEmit)**           | SA-15 (Development Tools)       | Pipeline integrity — type safety como control               | Type check results                                |
| **Coverage Tripwire**                   | SA-11(a) (Developer Testing)    | Vulnerability management — mínimo de testing                | Coverage reports (v8 provider)                    |
| **Branch Protection (GitHub Rulesets)** | AC-2 (Account Management)       | Access controls — required checks, approval                 | Audit log: who approved, when                     |
| **Artifact Signing (Cosign)**           | SI-7 (Software Integrity)       | Artifact integrity — firmas de containers/bins              | Cosign signatures, Sigstore bundle                |
| **SBOM Generation**                     | PO.5 (SSDF)                     | SBOM Guidance — inventario de componentes                   | CycloneDX/SPDX per release                        |
| **DORA Metrics**                        | AU-2 (Audit Events)             | Métricas de seguridad del pipeline                          | Deployment frequency, lead time, CFR, MTTR        |
| **Audit Trail Export**                  | AU-3 (Content of Audit Records) | Compliance evidence — trazabilidad inmutable                | Immutable audit logs, compliance reports          |

#### Controles NIST más relevantes para CI/CD

| Control      | Título                                        | Aplicación CI/CD                                            |
| ------------ | --------------------------------------------- | ----------------------------------------------------------- |
| **SA-11(a)** | Developer Testing and Analysis                | Unit tests, integration tests, code review, static analysis |
| **SA-15(a)** | Development Tools, Techniques, and Methods    | Control de acceso a herramientas de build, pipeline as code |
| **RA-5**     | Vulnerability Scanning and Monitoring         | SAST, SCA, container scanning, dependency scanning          |
| **CM-2**     | Baseline Configuration                        | Pipeline configuration management, infrastructure as code   |
| **CM-6**     | Configuration Settings                        | Security hardening de pipeline, least-privilege defaults    |
| **SI-7**     | Software, Firmware, and Information Integrity | Artifact signing, hash verification, provenance attestation |
| **AC-2**     | Account Management                            | RBAC en pipelines, access reviews, credential rotation      |
| **AU-2**     | Audit Events                                  | Audit trail, logs inmutables, evidence collection           |
| **AU-3**     | Content of Audit Records                      | Quién hizo qué, cuándo, por qué — trazabilidad completa     |

> **Fuente:** [NIST SP 800-53 Rev. 5](https://csrc.nist.gov/pubs/sp/800/53/r5/upd1/final), [NIST SP 800-218 SSDF](https://csrc.nist.gov/projects/ssdf), [NIST IR 8397](https://csrc.nist.gov/pubs/ir/8397/final), [CISA Securing CI/CD](https://www.cisa.gov/news-events/cybersecurity-advisories/aa22-118a)

---

## 26. Métricas DORA 5, Optimización y Costo del Pipeline

### 26.1 DORA Metrics — Ahora SON 5, no 4

El 2024 State of DevOps Report agregó una 5ta métrica y reorganizó las existentes:

| Métrica                             | Categoría   | Definición                                                       |
| ----------------------------------- | ----------- | ---------------------------------------------------------------- |
| **Deployment Frequency (DF)**       | Throughput  | Cuántas veces se despliega a producción por día/semana/mes       |
| **Lead Time for Changes (LT)**      | Throughput  | Tiempo desde first commit en la branch hasta producción          |
| **Failed Deployment Recovery Time** | Throughput  | Tiempo para restaurar servicio tras un deployment fallido        |
| **Change Failure Rate (CFR)**       | Instability | % de deployments que causan fallo en producción                  |
| **Rework Rate** (NUEVA)             | Instability | Ratio de unplanned deployments causados por production incidents |

#### Benchmarks — Tabla clásica (4-tier, aún la más citada)

| Métrica                | Elite                                      | High         | Medium         | Low              |
| ---------------------- | ------------------------------------------ | ------------ | -------------- | ---------------- |
| Deployment Frequency   | Múltiples veces/día                        | 1/día–1/week | 1/week–1/month | <1/month         |
| Lead Time for Changes  | <1 hour                                    | 1 day–1 week | 1 week–1 month | 1 month–6 months |
| Change Failure Rate    | 0–15% (2025 ideal: 0–2%; Accelerator: <5%) | 0–15%        | 16–30%         | 45–60%           |
| Time to Restore (MTTR) | <1 hour                                    | <1 day       | <1 day         | 1 day–1 week     |

#### Distribución 2024

~18–19% elite, 26% high, 37% medium, 19% low. **La mayoría son medium** — mayor leverage de mejora ahí.

#### 2025 shift: 7 Team Archetypes

DORA reemplazó los 4 tiers con **7 archetypes** (latent class analysis):

| Archetype               | DF            | LT   | CFR    | MTTR | Rework |
| ----------------------- | ------------- | ---- | ------ | ---- | ------ |
| **Accelerators** (~18%) | Múltiples/día | <1h  | <5%    | <1h  | <5%    |
| Stable Shippers         | 1–5x/day      | <1d  | <5%    | <1d  | <10%   |
| Fast Movers             | 1–3x/day      | 1–3d | 5–10%  | <1d  | 10–15% |
| Reliability Focused     | 1–3x/week     | 1–7d | <5%    | <4h  | <10%   |
| Batch Releasers         | 1–3x/week     | 3–7d | 10–15% | 1–4h | 10–20% |
| Struggling Shippers     | 1–3x/month    | 1–4w | >20%   | >24h | >25%   |
| Reactive Teams          | <1x/month     | >1mo | >30%   | >1w  | >30%   |

#### Gap stats 2024

Elite = **127x** faster lead time, **182x** more deployments/yr, **8x** lower CFR, **2,293x** faster recovery vs low performers.

#### Cómo medir correctamente (errores comunes)

- Contar **SOLO production deployments** — nunca staging/QA/UAT.
- Definir failure consistentemente: cualquier deployment que requiera rollback, hotfix, o customer-visible degradation.
- Lead time: medir **desde first commit on the branch** (DORA definition), no desde merge.
- **Zero CFR is usually a warning sign** — no shipping, narrow failure definition, o underreporting.

#### Calibración por company size (2025)

| Company Size                   | Accelerator Target DF                        |
| ------------------------------ | -------------------------------------------- |
| Seed <20 eng                   | 5–15 deploys/day                             |
| Series A/B 20–100              | 10–30/day                                    |
| Growth 100–500                 | 30–100/day                                   |
| Regulated (fintech/healthcare) | Weekly + CFR <3% puede ser elite en contexto |

> **Fuente:** [DORA Metrics Guide](https://dora.dev/guides/dora-metrics/), [2025 DORA AI Report](https://cloud.google.com/resources/content/2025-dora-ai-assisted-software-development-report), [Accelerate Book](https://itrevolution.com/product/accelerate/), [cd.foundation DORA 5](https://cd.foundation/blog/2025/10/16/dora-5-metrics)

### 26.2 CI/CD Cost Optimization (GitHub Actions focus)

#### Pricing 2026 (verificado Aug 2026)

| Runner         | Rate 2025  | Rate 2026  | Change   |
| -------------- | ---------- | ---------- | -------- |
| Linux 2-core   | $0.008/min | $0.006/min | **-25%** |
| Windows 2-core | $0.016/min | $0.010/min | **-38%** |
| macOS          | $0.080/min | $0.062/min | **-23%** |

**Free tier:** 2,000 Linux min/mo + 500MB storage. **Team:** $4/user, 3,000 min. **Enterprise:** $21/user, 50,000 min. Storage overage: $0.25/GB/mo. Windows count 2x, macOS 10x contra quotas.

**Self-hosted runner fee:** $0.002/min announced Dec 2025 (Mar 2026 start) — **postponed after backlash; never took effect**. Self-hosted remains free at platform level. May resurface — budget defensively.

#### Optimization levers ranked by ROI

| #   | Lever                              | Impacto                                                | Config                                                  |
| --- | ---------------------------------- | ------------------------------------------------------ | ------------------------------------------------------- |
| 1   | **Caching**                        | 30–60% job duration reduction                          | `actions/cache@v4` + lockfile hash key + `restore-keys` |
| 2   | **Don't run what didn't change**   | 90→8 jobs por PR                                       | `dorny/paths-filter` + path triggers                    |
| 3   | **Concurrency cancel-in-progress** | Cancel stale PR runs                                   | `concurrency: cancel-in-progress: true` on PR events    |
| 4   | **Fail-fast + flaky quarantine**   | Reduce wasted minutes on broken builds                 | `pytest --maxfail=1`, Playwright retries 2              |
| 5   | **Test impact analysis**           | 60–90% test reduction                                  | Launchable (ML), Nx affected, Turborepo, Bazel query    |
| 6   | **OS/runner selection**            | Linux-first (cheapest); macOS solo para iOS/Mac builds | Right-size runners                                      |
| 7   | **Artifact retention**             | Reduce storage costs                                   | 3–7 days transient, 90 days release                     |
| 8   | **Self-hosted runners**            | ~90% savings when feasible                             | Solo >80K Linux min/month payback                       |

#### Ejemplo worked (números reales)

4-dev team, 20-min npm test, 80 PRs/day:

| Optimization                        | Avg Duration | Monthly Cost |
| ----------------------------------- | ------------ | ------------ |
| Baseline                            | 20 min       | $211/mo      |
| + Fail-fast                         | 15 min       | $158/mo      |
| + Test impact analysis (Launchable) | 3 min        | $32/mo       |
| + Flaky quarantine (5 tests)        | —            | **$26/mo**   |

**Reducción total: 88%** ($211→$26/mo).

> **Fuente:** [GitHub Actions Billing](https://docs.github.com/en/billing/concepts/product-billing/github-actions), [GitHub Pricing Changelog Dec 2025](https://github.blog/changelog/2025-12-16-coming-soon-simpler-pricing-and-a-better-experience-for-github-actions/), [WarpBuild: Cost Reduction](https://www.warpbuild.com/blog/github-actions-cost-reduction)

### 26.3 Pipeline Performance Targets

#### Benchmarks enterprise 2025-2026

| Métrica                  | Elite Target                        | Enterprise Benchmark | Optimized |
| ------------------------ | ----------------------------------- | -------------------- | --------- |
| Build time               | **<10 min** (DORA 2024)             | 15–30 min            | <5 min    |
| Feedback loop            | **<10 min** (Google/Meta target)    | 30–60 min            | <10 min   |
| Lead time                | <1h (high-stakes) / <24h (standard) | Days                 | Hours     |
| CFR                      | <15% (elite ~5%)                    | 20–30%               | <10%      |
| Test automation coverage | ~80%                                | 60–70%               | >90%      |
| Runner utilization       | 70–80% at peak                      | 40–60%               | >80%      |

#### Flaky tests — el costo hidden #1

"a third of teams slow CI is actually 5-10 flaky tests." Las herramientas maduras (BuildPulse, Trunk Flaky Tests, Allure TestOps, Datadog Test Optimization) auto-detectan, quarantinan, y miden flake impact en hours/PRs-blocked.

**Quarantine workflow:** state machine — quarantine blockea PR merge pero sigue corriendo; **requiere humano para restaurar** (verificar commit nuevo en archivo del test en 7 días, o aprobación manual); >3 retries usualmente significa remediation, no más retries.

> **⚠️ Peligro del auto-restore automático:** Restaurar un test flaky después de 7 días sin verificación humana puede reintroducir un test que detecta un bug real (no flaky) sin que nadie lo haya investigado. Para ERP (finance, inventory), perder un defecto intermitente es costoso. El timer solo sirve como recordatorio, no como gate de reactivación.

#### Test Parallelization (caso documentado)

Google's own infra: 45-min sequential suite → **<8 min** via intelligent sharding (~88% reduction). Timing-based sharding (distribute by historical durations) reduce variance de ±40% a ±5%.

#### OpenTelemetry for CI/CD (Feb 2025 milestone)

OTel CI/CD SIG shipped first-phase semantic conventions. CI/CD span conventions (pipeline.run, pipeline.task.run) now **Release Candidate**. Instrumentation paths: `otel-cli`, `inception-health/otel-export-trace-action` (GitHub Actions), Jenkins OpenTelemetry plugin, `pytest-otel`.

Span naming: `<action>:<target>` e.g., `build:application`, `test:unit`, `deploy:production`.

> **Fuente:** [OpenTelemetry CI/CD SIG](https://opentelemetry.io/blog/2025/otel-cicd-sig/), [OTel CI/CD Spans](https://opentelemetry.io/docs/specs/semconv/cicd/cicd-spans/), [BuildPulse](https://buildpulse.io/products/flaky-tests)

### 26.4 Developer Cost of Slow Pipelines

#### Fórmula de Developer Downtime Cost

```
Downtime Cost = (current - target build duration) × daily pipeline runs × dev cost/min × working days/yr
```

**Ejemplo:** (15-7) × 1,500 runs × $1/min × 250 days = **$3M/yr** por 8 min de mejora.

#### Harness 2026 State of DevOps Modernization

- 69% de devs pierden tiempo en slow/unreliable CI
- ~20% de weekly time lost to CI inefficiency
- ≈**$78K/developer/year** en context switching (at $83/hr)
- Senior engineer replacement cost: $200–400K — talent leaves slow pipelines

#### Compound effect

- **Virtuous cycle:** faster feedback → smaller batches → fewer failures → more confidence → faster deploys.
- **Reverse compounds negatively:** long loops esconden problemas hasta large batches; large changes fail más; failures erosionan trust.

> **Fuente:** [CircleCI: Business Value](https://circleci.com/blog/business-value-of-software-delivery/), [Harness 2026 Report](https://www.harness.io/state-of-devops-modernization-2026), [Cost of Delay](https://www.pmi.org/disciplined-agile/what-is-the-economic-cost-of-delay-for-software-delivery)

---

## 27. Progressive Delivery y Costo de Retraso

### 27.1 Descripción

Progressive delivery **desacopla deploy de release**: el binario se despliega en todas partes; la visibilidad se gatilla con feature flags y traffic routing. 2025 DORA: 71% de Accelerators usan automated pre-deploy risk assessment. Elite teams differentiated review para AI-generated code.

### 27.2 Feature Flags (Deploy/Release Decoupling)

#### OpenFeature — CNCF Standard

OpenFeature es el standard vendor-neutral API. Implementations: LaunchDarkly, Flipt, Flagsmith, Optimizely, GrowthBook.

#### Canary ramp via flags

```
1% → 10% → 50% → 100% con instant 0% rollback (sin redeploy)
```

Dark launch a internal users primero. **Flag lifecycle management es mandatory:** creation date, owner, removal deadline. Flag debt tracks like technical debt.

### 27.3 Canary / Blue-Green Automation (Kubernetes)

#### Argo Rollouts

Replaces Deployment con Rollout CRD; step-based traffic weights; AnalysisTemplate runs (Prometheus/Datadog/Job providers); autoPromotionEnabled; failed analysis → abort → weight back to 0 (Degraded) → automatic rollback.

#### Flagger

Works alongside existing Deployments; service mesh traffic shifting (Istio, Linkerd) o ingress weighting (NGINX, Contour); metrics-driven; `revertOnFailure: true`.

```yaml
# Flagger Canary spec (ejemplo)
apiVersion: flagger.app/v1beta1
kind: Canary
spec:
  analysis:
    interval: 1m
    threshold: 5
    maxWeight: 30
    stepWeight: 10
    metrics:
      - name: request-success-rate
        thresholdRange:
          min: 99
      - name: request-duration
        thresholdRange:
          max: 500
```

**Key:** definir BOTH success rate AND latency thresholds — error rate alone misses perf degradation.

#### ROI Data Point

FinTech canary system con 47 metric checks across 3 consecutive windows redujo production incidents from new deployments por **74% in year one**.

### 27.4 SLI/SLO-Based Promotion

- Definir success criteria **antes** del rollout.
- Conectar rollout gates a error-budget burn signals (multi-window burn alerts).
- Si error budget está bajo presión, slow canary steps o require extra pre-production validation.
- Rollback cheap enough que deploys se vuelven **routine experiments** con clear abort conditions.

### 27.5 Multi-Environment Promotion

#### Core pattern: build once, promote the artifact

- Build ONE immutable image por push; los mismos bytes validados en staging reach prod. **Nunca rebuild por environment** — dos artifacts = dos chances de drift.
- Promote el mismo digest through dev → staging → prod con approval gates.

#### Environment Parity (Twelve-Factor)

| Gap                 | Fix                                                                                   |
| ------------------- | ------------------------------------------------------------------------------------- |
| **Time** drift      | Deploy continuously, small batches                                                    |
| **Personnel** drift | Devs own deploys end-to-end                                                           |
| **Tools** drift     | Same backing services everywhere (SQLite-in-dev vs Postgres-in-prod = classic killer) |

Pin todo: exact runtime minor (`.nvmrc` + `engines`), committed lockfiles (`npm ci` fails on drift), base image por digest (no `:latest`).

### 27.6 Cost of Delay — Framework

Si solo quantificas una cosa, quantifica el **cost of delay** (Don Reinertsen). Lead time es inventory turnover para software: long lead time retrasa value realization; low DF incrementa batch size y blast radius; high MTTR incrementa downtime cost; high CFR crea rework y trust erosion.

#### Developer Downtime Cost Formula

```
Cost = (current avg workflow duration − target) × daily pipeline runs × developer cost/min × working days/yr
```

#### Ejemplo worked

| Variable             | Value          |
| -------------------- | -------------- |
| Current avg duration | 15 min         |
| Target duration      | 7 min          |
| Daily pipeline runs  | 1,500          |
| Developer cost/min   | $1             |
| Working days/yr      | 250            |
| **Annual Cost**      | **$3,000,000** |

#### Harness 2026 concrete numbers

- 69% devs waste time en slow/unreliable CI
- ~20% weekly time lost
- ≈$78K/developer/year en context switching (at $83/hr)
- Teams con 10+ DevOps tools ven 40% higher platform-team burnout
- Senior engineer replacement: $200–400K — talent leaves slow pipelines

#### Business case framework

| Component                              | Conservative Estimate |
| -------------------------------------- | --------------------- |
| Faster builds (dev downtime reduction) | $3M/yr                |
| Reclaimed innovation time              | $1M/yr                |
| Productivity gains                     | $2.5M/yr              |
| Success rate improvements              | $300K/yr              |
| **Total**                              | **$6.8M/yr**          |

Real case: financial services customer cut workflow time 27% → **$2.3M saved** on one project.

> **Fuente:** [CircleCI Business Value](https://circleci.com/blog/business-value-of-software-delivery/), [Harness 2026](https://www.harness.io/state-of-devops-modernization-2026), [PMI Cost of Delay](https://www.pmi.org/disciplined-agile/what-is-the-economic-cost-of-delay-for-software-delivery), [OpenFeature](https://openfeature.dev/), [Argo Rollouts](https://argo-rollouts.readthedocs.io/en/stable/features/analysis), [Flagger](https://flagger.app/)

---

## 28. Plantilla completa: CI/CD para project-one (GitHub Actions)

Esta sección integra **todos los patrones de las secciones 24-27** en workflows completos, listos para copiar a `.github/workflows/`. Adaptados a la estructura de monorepo de project-one (npm workspaces, Express server, React client, Playwright E2E).

### 28.1 Requisitos previos

| Requisito           | Detalle                                                                    |
| ------------------- | -------------------------------------------------------------------------- |
| Node version        | 22.x (`.nvmrc`)                                                            |
| Package manager     | npm (workspaces)                                                           |
| Database            | PostgreSQL 16 (para Prisma)                                                |
| GitHub Environments | `staging`, `production` (con required reviewers)                           |
| Secrets required    | `STAGING_DATABASE_URL`, `PRODUCTION_DATABASE_URL`, `LHCI_GITHUB_APP_TOKEN` |
| OIDC                | Habilitado para cosign signing (id-token: write)                           |

### 28.2 Workflow principal: CI (`ci.yml`)

Flujo completo: commit checks → build → quality → security → test → integration → artifact.

```yaml
# .github/workflows/ci.yml
# Pipeline CI completo: todos los stages 1-7 del pipeline empresarial
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

concurrency:
  group: ci-${{ github.ref }}
  cancel-in-progress: ${{ github.event_name == 'pull_request' }}

permissions:
  contents: read
  security-events: write
  id-token: write
  attestations: write

env:
  NODE_VERSION: '22'
  REGISTRY: ghcr.io

jobs:
  # ── Stage 1: Source / Commit ──────────────────────────────────────
  commit-lint:
    name: 'Stage 1: Commit Lint'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683 # v4.2.2
        with:
          fetch-depth: 0
      - uses: actions/setup-node@49933ea5288caeca8642d1e84afbd3f7d6820020 # v4.4.0
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: npm
      - run: npm ci
      - run: npx commitlint --from ${{ github.event.pull_request.base.sha }} --to ${{ github.event.pull_request.head.sha }} --verbose

  secret-scan:
    name: 'Stage 1: Secret Detection'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683 # v4.2.2
        with:
          fetch-depth: 0
      - uses: gitleaks/gitleaks-action@952e542951b4928d37bfd72cd538f71396aea71e # v2.3.3
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}

  # ── Stage 2: Build ───────────────────────────────────────────────
  build:
    name: 'Stage 2: Build (${{ matrix.workspace }})'
    runs-on: ubuntu-latest
    needs: [commit-lint, secret-scan]
    strategy:
      matrix:
        workspace: [apps/server, apps/client]
      fail-fast: true
    steps:
      - uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683 # v4.2.2
      - uses: actions/setup-node@49933ea5288caeca8642d1e84afbd3f7d6820020 # v4.4.0
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: npm
      - run: npm ci
      - name: Build ${{ matrix.workspace }}
        run: npm run build --workspace=${{ matrix.workspace }}
      - name: Prisma Generate (server only)
        if: matrix.workspace == 'apps/server'
        run: npx prisma generate --schema=apps/server/prisma/schema.prisma
      - uses: actions/upload-artifact@ea165f8d65b6e75b540449e92b4886f43607fa02 # v4.6.2
        with:
          name: build-${{ matrix.workspace }}
          path: ${{ matrix.workspace }}/dist/
          retention-days: 3

  # ── Stage 3: Code Quality ────────────────────────────────────────
  lint:
    name: 'Stage 3: ESLint'
    runs-on: ubuntu-latest
    needs: build
    steps:
      - uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683 # v4.2.2
      - uses: actions/setup-node@49933ea5288caeca8642d1e84afbd3f7d6820020 # v4.4.0
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: npm
      - run: npm ci
      - run: npm run lint

  format:
    name: 'Stage 3: Prettier'
    runs-on: ubuntu-latest
    needs: build
    steps:
      - uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683 # v4.2.2
      - uses: actions/setup-node@49933ea5288caeca8642d1e84afbd3f7d6820020 # v4.4.0
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: npm
      - run: npm ci
      - run: npx prettier --check "**/*.{ts,tsx,json,md}"

  typecheck:
    name: 'Stage 3: TypeScript (${{ matrix.workspace }})'
    runs-on: ubuntu-latest
    needs: build
    strategy:
      matrix:
        workspace: [apps/server, apps/client]
    steps:
      - uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683 # v4.2.2
      - uses: actions/setup-node@49933ea5288caeca8642d1e84afbd3f7d6820020 # v4.4.0
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: npm
      - run: npm ci
      - run: npx tsc --noEmit --project ${{ matrix.workspace }}/tsconfig.json

  # ── Stage 4: Security Scanning ───────────────────────────────────
  semgrep:
    name: 'Stage 4: SAST (Semgrep)'
    runs-on: ubuntu-latest
    needs: build
    container:
      image: semgrep/semgrep
    steps:
      - uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683 # v4.2.2
      - run: semgrep scan --config .semgrep/ --sarif --output semgrep.sarif .
        env:
          SEMGREP_RULES: p/default p/javascript p/typescript
      - uses: github/codeql-action/upload-sarif@v3
        with:
          sarif_file: semgrep.sarif

  dependency-audit:
    name: 'Stage 4: Dependency Audit'
    runs-on: ubuntu-latest
    needs: build
    steps:
      - uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683 # v4.2.2
      - uses: actions/setup-node@49933ea5288caeca8642d1e84afbd3f7d6820020 # v4.4.0
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: npm
      - run: npm ci
      - run: npm audit --audit-level=high --omit=dev

  # ── Stage 5: Testing ─────────────────────────────────────────────
  unit-test:
    name: 'Stage 5: Unit Tests (${{ matrix.workspace }})'
    runs-on: ubuntu-latest
    needs: build
    strategy:
      matrix:
        workspace: [apps/server, apps/client]
      fail-fast: false
    services:
      postgres:
        image: postgres:16-alpine
        env:
          POSTGRES_USER: postgres
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: testdb
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    steps:
      - uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683 # v4.2.2
      - uses: actions/setup-node@49933ea5288caeca8642d1e84afbd3f7d6820020 # v4.4.0
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: npm
      - run: npm ci
      - name: Prisma Migrate (server)
        if: matrix.workspace == 'apps/server'
        run: npx prisma migrate deploy --schema=apps/server/prisma/schema.prisma
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/testdb
      - name: Run tests
        run: npx vitest run --project ${{ matrix.workspace }}
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/testdb
          NODE_ENV: test

  # ── Stage 7: Integration ─────────────────────────────────────────
  integration-test:
    name: 'Stage 7: Integration Tests'
    runs-on: ubuntu-latest
    needs: unit-test
    services:
      postgres:
        image: postgres:16-alpine
        env:
          POSTGRES_USER: postgres
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: integration_test
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    steps:
      - uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683 # v4.2.2
      - uses: actions/setup-node@49933ea5288caeca8642d1e84afbd3f7d6820020 # v4.4.0
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: npm
      - run: npm ci
      - run: npx prisma generate --schema=apps/server/prisma/schema.prisma
      - run: npx prisma migrate deploy --schema=apps/server/prisma/schema.prisma
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/integration_test
      - run: npm run test:integration --workspace=apps/server
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/integration_test
          NODE_ENV: test

  # ── Stage 6: Artifact ────────────────────────────────────────────
  artifact:
    name: 'Stage 6: Package & Sign'
    runs-on: ubuntu-latest
    needs:
      [lint, format, typecheck, semgrep, dependency-audit, integration-test]
    if: github.ref == 'refs/heads/main'
    outputs:
      version: ${{ steps.version.outputs.version }}
    steps:
      - uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683 # v4.2.2
      - uses: actions/setup-node@49933ea5288caeca8642d1e84afbd3f7d6820020 # v4.4.0
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: npm
      - run: npm ci
      - id: version
        run: echo "version=$(git describe --tags --abbrev=0 2>/dev/null || echo '0.0.0')" >> "$GITHUB_OUTPUT"
      - run: npm run build
      - uses: anchore/sbom-action@78fc5d3ea430609c6289675418831e209853a788 # v0.18.0
        with:
          path: .
          format: spdx-json
          output-file: sbom.spdx.json
      - uses: sigstore/cosign-installer@d7d6bc7722e3daa8354c57bcb84e1f03e4403235 # v3.8.2
      - run: cosign sign-blob sbom.spdx.json --bundle sbom.sigstore.json --yes
      - uses: actions/attest-build-provenance@ef244123eb79f2f7a7e75d99086184ef3e0a0dc8 # v2.2.3
        with:
          subject-path: sbom.spdx.json
      - uses: actions/upload-artifact@ea165f8d65b6e75b540449e92b4886f43607fa02 # v4.6.2
        with:
          name: release-${{ steps.version.outputs.version }}
          path: |
            sbom.spdx.json
            sbom.sigstore.json
          retention-days: 365
```

### 28.3 Workflow de deploy: `deploy.yml`

Pipeline CD completo: staging → acceptance → approval → production (canary) → post-deploy → cleanup.

```yaml
# .github/workflows/deploy.yml
# Pipeline CD: staging → acceptance → approval → canary → post-deploy
name: Deploy

on:
  workflow_run:
    workflows: ["CI"]
    types: [completed]
    branches: [main]

permissions:
  contents: read
  deployments: write
  id-token: write
  packages: write

jobs:
  # ── Stage 8: Deploy Staging ──────────────────────────────────────
  deploy-staging:
    name: 'Stage 8: Deploy Staging'
    runs-on: ubuntu-latest
    if: ${{ github.event.workflow_run.conclusion == 'success' }}
    environment:
      name: staging
      url: https://staging.project-one.example.com
    steps:
      - uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683 # v4.2.2
      - uses: actions/setup-node@49933ea5288caeca8642d1e84afbd3f7d6820020 # v4.4.0
        with:
          node-version: '22'
          cache: npm
      - run: npm ci && npm run build
      - name: Prisma Migrate (staging)
        run: npx prisma migrate deploy --schema=apps/server/prisma/schema.prisma
        env:
          DATABASE_URL: ${{ secrets.STAGING_DATABASE_URL }}
      - name: Deploy server
        run: echo "Deploy server → staging"
      - name: Deploy client
        run: echo "Deploy client → staging"
      - name: Smoke test
        run: curl -sf https://staging.project-one.example.com/health || exit 1

  # ── Stage 9: Acceptance / UAT ────────────────────────────────────
  acceptance:
    name: 'Stage 9: Playwright E2E'
    runs-on: ubuntu-latest
    needs: deploy-staging
    steps:
      - uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683 # v4.2.2
      - uses: actions/setup-node@49933ea5288caeca8642d1e84afbd3f7d6820020 # v4.4.0
        with:
          node-version: '22'
          cache: npm
      - run: npm ci
      - run: npx playwright install --with-deps
      - name: Run E2E tests
        run: npx playwright test
        env:
          BASE_URL: https://staging.project-one.example.com
      - uses: actions/upload-artifact@ea165f8d65b6e75b540449e92b4886f43607fa02 # v4.6.2
        if: failure()
        with:
          name: playwright-report
          path: e2e/playwright-report/
          retention-days: 7

  # ── Stage 10: Performance ────────────────────────────────────────
  performance:
    name: 'Stage 10: Lighthouse + k6'
    runs-on: ubuntu-latest
    needs: acceptance
    steps:
      - uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683 # v4.2.2
      - uses: actions/setup-node@49933ea5288caeca8642d1e84afbd3f7d6820020 # v4.4.0
        with:
          node-version: '22'
          cache: npm
      - run: npm ci
      - name: Lighthouse CI
        run: npx lhci autorun --config=apps/client/lighthouserc.json
        env:
          LHCI_GITHUB_APP_TOKEN: ${{ secrets.LHCI_GITHUB_APP_TOKEN }}
      - name: k6 load test
        uses: grafana/k6-action@b5546982b9d0c5a4585d6e346ad31264591c8fc5 # v0.3.1
        with:
          filename: e2e/performance/load-test.js
        env:
          K6_BASE_URL: https://staging.project-one.example.com

  # ── Stage 11: Approval ───────────────────────────────────────────
  approval:
    name: 'Stage 11: Production Approval'
    runs-on: ubuntu-latest
    needs: performance
    environment:
      name: production  # GitHub Enforces: required reviewers + wait timer
    steps:
      - uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683 # v4.2.2
      - name: Verify attestations
        run: |
          gh attestation verify sbom.spdx.json --owner ${{ github.repository_owner }} || exit 1
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}

  # ── Stage 12: Production Deploy (Canary) ─────────────────────────
  canary-10:
    name: 'Stage 12: Canary 10%'
    runs-on: ubuntu-latest
    needs: approval
    environment:
      name: production
      url: https://project-one.example.com
    steps:
      - uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683 # v4.2.2
      - name: Deploy 10% canary
        run: echo "Canary 10% traffic"
      - name: Monitor (5 min)
        run: sleep 300
      - name: Check error rate < 5%
        run: |
          echo "Checking canary health..."
          # Replace with real Prometheus query
          # curl -sf "http://prometheus:9090/api/v1/query?query=..." || exit 1

  canary-50:
    name: 'Stage 12: Canary 50%'
    runs-on: ubuntu-latest
    needs: canary-10
    steps:
      - uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683 # v4.2.2
      - name: Promote to 50%
        run: echo "Canary 50% traffic"
      - name: Monitor (5 min)
        run: sleep 300

  canary-100:
    name: 'Stage 12: Full Rollout'
    runs-on: ubuntu-latest
    needs: canary-50
    steps:
      - uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683 # v4.2.2
      - name: Promote to 100%
        run: echo "Full rollout complete"

  # ── Stage 13: Post-Deploy ────────────────────────────────────────
  post-deploy:
    name: 'Stage 13: Post-Deploy Verification'
    runs-on: ubuntu-latest
    needs: canary-100
    steps:
      - name: Health check (retries)
        run: |
          for i in 1 2 3; do
            STATUS=$(curl -sf -o /dev/null -w '%{http_code}' https://project-one.example.com/health)
            [ "$STATUS" = "200" ] && echo "Healthy" && exit 0
            sleep 10
          done
          exit 1
      - name: Critical path smoke
        run: |
          curl -sf https://project-one.example.com/api/health/detailed || exit 1
      - name: Deploy marker
        run: echo "::notice::Deploy $(git describe --tags) verified at $(date -u)"

  # ── Stage 14: Cleanup ────────────────────────────────────────────
  cleanup:
    name: 'Stage 14: Artifact Retention'
    runs-on: ubuntu-latest
    if: always()
    needs: [canary-10, canary-50, canary-100]
    steps:
      - name: Purge old artifacts (30 days)
        uses: Mattraks/delete-workflow-runs@main
        with:
          retain_days: 30
          keep_minimum_runs: 5

  # ── Auto-rollback ────────────────────────────────────────────────
  rollback:
    name: 'Emergency Rollback'
    runs-on: ubuntu-latest
    if: failure() && (needs.canary-10.result == 'failure' || needs.canary-50.result == 'failure' || needs.canary-100.result == 'failure')
    steps:
      - name: Revert to previous version
        run: echo "ROLLBACK: Reverting production"
```

### 28.4 Workflow de cleanup: `cleanup-preview.yml`

Destrucción automática de preview environments al cerrar PRs.

```yaml
# .github/workflows/cleanup-preview.yml
name: Cleanup Preview Environment

on:
  pull_request:
    types: [closed]

permissions:
  contents: read

jobs:
  destroy:
    name: Destroy Preview
    runs-on: ubuntu-latest
    if: github.event.pull_request.merged == false
    steps:
      - uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683 # v4.2.2
      - name: Teardown
        run: |
          PR=${{ github.event.pull_request.number }}
          echo "Destroying preview for PR #${PR}"
          # docker compose -f docker-compose.preview.yml down -v
```

### 28.5 Diagrama de flujo de ejecución

```
PR abierto:
  commit-lint ─┐
  secret-scan ─┤
               ├→ build (server, client)
               │    ├→ lint
               │    ├→ format
               │    ├→ typecheck
               │    ├→ semgrep
               │    ├→ dependency-audit
               │    └→ unit-test → integration-test
               │
               └→ (gate: todos los checks pasan) → merge a main

Merge a main → CI workflow → artifact (SBOM + cosign)
                │
                └→ Deploy workflow:
                     deploy-staging
                       → acceptance (Playwright E2E)
                         → performance (Lighthouse + k6)
                           → approval (GitHub Environment)
                             → canary 10% → 50% → 100%
                               → post-deploy verification
                                 → cleanup

                   Cualquier fallo en canary → auto-rollback
```

### 28.6 Checklist de implementación

- [ ] Copiar workflows a `.github/workflows/`
- [ ] Configurar GitHub Environments: `staging`, `production` (required reviewers, wait timer)
- [ ] Configurar secrets: `STAGING_DATABASE_URL`, `PRODUCTION_DATABASE_URL`
- [ ] Habilitar OIDC en repo settings (para cosign/attestations)
- [ ] Instalar y configurar Gitleaks (`.gitleaks.toml`)
- [ ] Instalar y configurar Semgrep (`.semgrep/`)
- [ ] Configurar commitlint (`.commitlintrc`)
- [ ] Configurar lighthouserc.json para Lighthouse CI
- [ ] Crear load-test.js para k6
- [ ] Verificar que `npm run build`, `npm run lint`, `npm run test` funcionan localmente
- [ ] Test: abrir PR y verificar que todos los checks pasan
- [ ] Test: merge a main y verificar deploy a staging
- [ ] Test: verificar approval gate en production

---

### Fuentes nuevas (Secciones 24-27)

| #   | Fuente                                        | Secciones  |
| --- | --------------------------------------------- | ---------- |
| 96  | GitHub Docs: Reusing Workflows                | 24.2       |
| 97  | GitHub Community #171037                      | 24.2       |
| 98  | Incredibuild: Reusable Workflows              | 24.2       |
| 99  | GitHub: Concurrency                           | 24.3       |
| 100 | GitHub Changelog May 2026: Concurrency Queues | 24.3       |
| 101 | GitHub: Dependency Caching                    | 24.4       |
| 102 | Turborepo CI Vendors                          | 24.4       |
| 103 | Tenki: CI Caching                             | 24.4       |
| 104 | dorny/paths-filter                            | 24.8       |
| 105 | WarpBuild: Monorepo Guide                     | 24.8       |
| 106 | GitHub Changelog Aug 2025: SHA Pinning        | 24.9       |
| 107 | GitHub: Secure Use                            | 24.9       |
| 108 | actions/attest-build-provenance               | 24.9, 25.2 |
| 109 | SLSA Spec v1.2                                | 25.2       |
| 110 | SLSA Levels                                   | 25.2       |
| 111 | Sigstore Docs                                 | 25.3       |
| 112 | Fulcio                                        | 25.3       |
| 113 | Rekor                                         | 25.3       |
| 114 | in-toto.io                                    | 25.4       |
| 115 | in-toto Attestation                           | 25.4       |
| 116 | CNCF: in-toto                                 | 25.4       |
| 117 | CycloneDX                                     | 25.5       |
| 118 | SPDX                                          | 25.5       |
| 119 | Syft (Anchore)                                | 25.5       |
| 120 | Trivy (Aqua Security)                         | 25.5       |
| 121 | Dependabot                                    | 25.6       |
| 122 | Renovate                                      | 25.6       |
| 123 | Socket.dev                                    | 25.6       |
| 124 | dependency-review-action                      | 25.6       |
| 125 | OpenSSF Scorecard                             | 25.7       |
| 126 | Scorecard Action                              | 25.7       |
| 127 | scorecard.dev                                 | 25.7       |
| 128 | NIST SP 800-218                               | 25.8       |
| 129 | NIST SSDF Rev. 1 draft                        | 25.8       |
| 130 | DORA Metrics Guide                            | 26.1       |
| 131 | 2025 DORA AI Report                           | 26.1       |
| 132 | Accelerate (Forsgren/Humble/Kim)              | 26.1       |
| 133 | cd.foundation DORA 5                          | 26.1       |
| 134 | GitHub Actions Billing                        | 26.2       |
| 135 | GitHub Pricing Changelog Dec 2025             | 26.2       |
| 136 | WarpBuild: Cost Reduction                     | 26.2       |
| 137 | OpenTelemetry CI/CD SIG                       | 26.3       |
| 138 | OTel CI/CD Spans                              | 26.3       |
| 139 | BuildPulse                                    | 26.3       |
| 140 | CircleCI Business Value                       | 26.4, 27.6 |
| 141 | Harness 2026 Report                           | 26.4, 27.6 |
| 142 | PMI Cost of Delay                             | 27.6       |
| 143 | OpenFeature                                   | 27.2       |
| 144 | Argo Rollouts                                 | 27.3       |
| 145 | Flagger                                       | 27.3       |

---

## 29. Containerización en CI/CD

### 29.1 Descripción

La containerización empaqueta la aplicación con todas sus dependencias en una **imagen inmutable** que se ejecuta de forma idéntica en cualquier entorno. En CI/CD, los contenedores son la unidad de despliegue estándar: el mismo artifact containerizado se promueve por dev → staging → prod sin reconstruirse. Docker es el runtime dominante; Podman emerge como alternativa rootless.

### 29.2 Objetivo de negocio

- Eliminar el problema "funciona en mi máquina" — entorno reproducible.
- Acelerar deploys: imágenes pre-construidas se promueven sin rebuild.
- Seguridad: escaneo de vulnerabilidades antes del deploy, SBOM por imagen.
- Portabilidad: desplegar en ECS, Kubernetes, Cloud Run, o cualquier orchestrator.

### 29.3 Prácticas recomendadas (exhaustivo)

1. **Multi-stage builds:** separar build de runtime para minimizar tamaño de imagen. Stage de dependencias → stage de build → stage de runtime (solo producción). Fuente: [Docker Multi-stage](https://docs.docker.com/build/building/multi-stage/)
2. **Base image pinning:** usar tags de digest (`node:22-alpine@sha256:...`) en lugar de tags mutables (`latest`). Reducir superficie de ataque con imágenes minimalistas (Alpine, Distroless, Scratch). Fuente: [Docker Best Practices](https://docs.docker.com/build/building/best-practices/)
3. **Layer caching estratégico:** ordenar Dockerfile de menos a más volatile (OS deps → apt → npm ci → copy source). Usar `--mount=type=cache` para npm. Fuente: [Docker Cache Mount](https://docs.docker.com/build/guides/using-cache-mount/)
4. **.dockerignore completo:** excluir node_modules, .git, test files, docs, .env del contexto de build. Reducir contexto de build = builds más rápidos + menos riesgo de exposición.
5. **Escaneo de vulnerabilidades:** Trivy, Grype o Snyk escanean cada imagen antes de push. Gate: bloquear push si hay vulnerabilidades CRITICAL/HIGH. Fuente: [Trivy](https://trivy.dev/), [Grype](https://github.com/anchore/grype)
6. **Registry con lifecycle policies:** políticas de retención (últimas 10 imágenes, tags immutables), scan automático al push (ECR scanning, GHCR Dependabot). Fuente: [ECR Lifecycle](https://docs.aws.amazon.com/AmazonECR/latest/userguide/lifecycle_policy.html)
7. **Digest pinning en deploys:** referenciar imágenes por digest en manifests de deploy, no por tag mutable. Evitar "tag drift" donde prod ejecuta una versión diferente de staging.
8. **SBOM por imagen:** generar SBOM (Syft/SPDX/CycloneDX) para cada imagen y firmar con cosign. Chain of trust: build → SBOM → sign → push → verify → deploy.
9. **Rootless containers:** ejecutar contenedores sin root en producción. Dockerfile con `USER node` o `USER 1001`. Reducir blast radius de un escape de container.
10. **Health checks en Dockerfile:** incluir `HEALTHCHECK` instruction para que el orchestrator detecte containers no sanos.

### 29.4 Herramientas comunes

| Categoría    | Herramientas                                         |
| ------------ | ---------------------------------------------------- |
| Runtime      | Docker, Podman, containerd, CRI-O                    |
| Build        | BuildKit, Buildpacks (paketo), Jib, Ko               |
| Registry     | GHCR, ECR, ACR, GCR, Docker Hub, Artifactory, Harbor |
| Escaneo      | Trivy, Grype, Snyk Container, Docker Scout           |
| SBOM         | Syft, Docker SBOM, Tern                              |
| Optimización | Dive (image analysis), Slim, Docker Slim             |

### 29.5 Mejores prácticas

- Multi-stage siempre: imagen de build ≠ imagen de runtime.
- Un proceso por contenedor (12-factor app).
- Tags para humanos, digests para máquinas.
- Escanear ANTES de push, no después.
- ImagesScarce cache: layer ordering importa más que el tamaño total.
- Signing obligatorio para imágenes de producción.

### 29.6 Errores comunes (anti-patrones)

- Usar `FROM node:latest` (tag mutable → builds no reproducibles).
- Copiar node_modules al contenedor (debe ser `npm ci` en el build).
- Containers como VMs (múltiples procesos, SSH dentro).
- No .dockerignore → contexto gigante, posibles secrets en la imagen.
- Imágenes de 2GB que podrían ser de 150MB con Alpine/Distroless.
- Sin HEALTHCHECK → orchestrator no detecta containers rotos.

### 29.7 Métricas recomendadas

- Tamaño de imagen (target: < 200MB para Node.js apps).
- Tiempo de build de imagen (target: < 5 min con cache).
- % de imágenes escaneadas antes de push (target: 100%).
- Vulnerabilidades CRITICAL/HIGH abiertas (target: 0).
- % de imágenes con SBOM + firma (target: 100% en prod).

### 29.8 Fuentes

- https://docs.docker.com/build/building/multi-stage/
- https://docs.docker.com/build/building/best-practices/
- https://docs.docker.com/build/guides/using-cache-mount/
- https://trivy.dev/
- https://github.com/anchore/grype
- https://github.com/anchore/syft
- https://docs.aws.amazon.com/AmazonECR/latest/userguide/lifecycle_policy.html

### 29.9 Ejemplo práctico — GitHub Actions

```yaml
# .github/workflows/container.yml
# Build, scan, sign y push de imagen Docker multi-stage
name: Container Build & Push

on:
  push:
    branches: [main]

permissions:
  contents: read
  packages: write
  id-token: write

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}/server-express

jobs:
  build:
    name: Build & Push Image
    runs-on: ubuntu-latest
    outputs:
      digest: ${{ steps.build.outputs.digest }}
    steps:
      - uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683 # v4.2.2

      - uses: docker/setup-buildx-action@b5ca514318bd6ebac0fb2aedd5d36ec1b5c232a2 # v3.10.0

      - uses: docker/login-action@74a5d142397b4f367a81961eba4e8cd7edddf772 # v3.4.0
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Build image
        id: build
        uses: docker/build-push-action@14487ce63c7a62a4a324b0bfb37086795e31c6c1 # v6.16.0
        with:
          context: apps/server
          file: apps/server/Dockerfile
          push: true
          tags: |
            ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:latest
            ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:${{ github.sha }}
          cache-from: type=gha
          cache-to: type=gha,mode=max
          provenance: true
          sbom: true

      - name: Install Trivy
        uses: aquasecurity/trivy-action@18f2510ee396bbf400402947e795f215e8d8f4f0 # v0.30.0
        with:
          image-ref: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:${{ github.sha }}
          format: sarif
          output: trivy-results.sarif
          severity: CRITICAL,HIGH

      - name: Upload Trivy scan
        uses: github/codeql-action/upload-sarif@v3
        if: always()
        with:
          sarif_file: trivy-results.sarif

      - name: Install cosign
        uses: sigstore/cosign-installer@d7d6bc7722e3daa8354c57bcb84e1f03e4403235 # v3.8.2

      - name: Sign image
        run: |
          cosign sign ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}@${{ steps.build.outputs.digest }} --yes

      - name: Generate SBOM
        uses: anchore/sbom-action@78fc5d3ea430609c6289675418831e209853a788 # v0.18.0
        with:
          image: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:${{ github.sha }}
          format: spdx-json
          output-file: container-sbom.spdx.json
```

---

## 30. Kubernetes Deployment Strategies

### 30.1 Descripción

Kubernetes ofrece primitives nativas para despliegues de bajo riesgo. El **Deployment** (recurso estándar) gestiona ReplicaSets y ofrece rolling updates con configuración de `maxSurge`/`maxUnavailable`. Para estrategias más avanzadas (canary, blue-green), se usan controllers especializados como **Argo Rollouts** o **Flagger** que extienden el Deployment con análisis de métricas y promoción automática.

### 30.2 Objetivo de negocio

- Zero-downtime deployments con rolling updates nativos.
- Canary releases con análisis automático antes de promocionar.
- Rollback instantáneo a versión anterior si algo falla.
- Separar deploy (código) de release (tráfico) con feature flags.

### 30.3 Prácticas recomendadas (exhaustivo)

1. **Rolling update (default):** reemplaza pods gradualmente. Configurar `maxSurge: 25%` y `maxUnavailable: 0` para no perder capacidad durante el deploy. Fuente: [K8s Deployments](https://kubernetes.io/docs/concepts/workloads/controllers/deployment/)
2. **Readiness/Liveness/Startup probes:** readiness para tráfico, liveness para restart, startup para apps lentas. Sin probes → K8s envía tráfico a pods no listos. Fuente: [K8s Probes](https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/)
3. **Canary con Argo Rollouts:** definir `AnalysisTemplate` con métricas (error rate, latency), promoción automática si pasa, rollback si falla. Fuente: [Argo Rollouts](https://argoproj.github.io/argo-rollouts/)
4. **Blue-green con services:** dos Deployments (active/preview), cambiar selector del Service para switch instantáneo. Rollback = revertir selector. Fuente: [Blue-Green — K8s](https://kubernetes.io/docs/concepts/services-networking/service/#internal-load-balancer)
5. **Pod Disruption Budgets (PDB):** garantizar disponibilidad mínima durante rolling updates y node maintenance. `minAvailable: 75%` o `maxUnavailable: 1`.
6. **Resource requests y limits:** siempre definir CPU/memory requests (para scheduling) y limits (para evitar OOM kills). Default request = limit causa underprovisioning.
7. **Rollback automatizado:** `kubectl rollout undo` o Argo Rollouts analysis failure → auto-rollback. Probar el rollback en staging antes de producción.
8. **Pre-deploy hooks:** `kubectl wait --for=condition=Ready` antes de seguir. Job de migración de DB como pre-deploy hook.
9. **Topology spread constraints:** distribuir pods across zones/nodes para resiliencia. `topologySpreadConstraints` > `nodeSelector` para HA.
10. **ImagePullPolicy:** `Always` para tags mutables, `IfNotPresent` para digests. Nunca `Never` en producción.

### 30.4 Herramientas comunes

| Categoría              | Herramientas                                    |
| ---------------------- | ----------------------------------------------- |
| Orchestration          | Kubernetes, EKS, GKE, AKS, OpenShift            |
| Deployment controllers | Argo Rollouts, Flagger, Spinnaker               |
| Packaging              | Helm, Kustomize, Jsonnet                        |
| Service mesh           | Istio, Linkerd, Cilium (para traffic splitting) |
| Rollout analysis       | Kayenta, Prometheus, Datadog                    |

### 30.5 Mejores prácticas

- Rolling update para deploys estándar; canary para features de alto riesgo.
- Siempre con probes: sin readiness probe = tráfico a pods no listos.
- Canary analysis debe medir errores REALES, no solo "el pod está vivo".
- Helm charts versionados; Kustomize overlays para environments.
- RBAC para deployments: who can deploy what where.

### 30.6 Errores comunes (anti-patrones)

- `imagePullPolicy: Never` en producción → deploy con imagen cacheada obsoleta.
- Sin resource limits → un pod consume todo el nodo (noisy neighbor).
- Rolling update sin PDB → todos los pods caen simultáneamente.
- Canary sin analysis → "canary" es solo deploy manual del 10%.
- Rollback no probado → producción cae y no se sabe cómo revertir.
- `latest` tag en producción → deploy no reproducible.

### 30.7 Métricas recomendadas

- Tiempo de rollout completo (target: < 10 min).
- Disponibilidad durante deploy (target: 100% con PDB).
- Tasa de rollbacks (target: < 5% de deploys).
- Canary analysis pass rate (target: > 95%).
- Pod restart count post-deploy (target: 0).

### 30.8 Fuentes

- https://kubernetes.io/docs/concepts/workloads/controllers/deployment/
- https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/
- https://argoproj.github.io/argo-rollouts/
- https://flagger.app/
- https://helm.sh/docs/
- https://kustomize.io/

### 30.9 Ejemplo práctico — GitHub Actions

```yaml
# .github/workflows/k8s-deploy.yml
# Deploy a Kubernetes con Argo Rollouts + canary analysis
name: K8s Deploy

on:
  workflow_dispatch:
    inputs:
      image_tag:
        description: 'Image tag to deploy'
        required: true

permissions:
  contents: read
  id-token: write

jobs:
  deploy:
    name: Deploy to K8s
    runs-on: ubuntu-latest
    environment:
      name: production
      url: https://project-one.example.com
    steps:
      - uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683 # v4.2.2

      - name: Configure kubeconfig
        run: |
          echo "${{ secrets.KUBECONFIG }}" | base64 -d > $HOME/.kube/config

      - name: Update image in Rollout
        run: |
          kubectl argo rollouts set image server-rollout \
            server=ghcr.io/${{ github.repository }}/server-express:${{ inputs.image_tag }} \
            -n production

      - name: Wait for rollout
        run: |
          kubectl argo rollouts status server-rollout -n production --timeout=600s

      - name: Verify health
        run: |
          kubectl get pods -n production -l app=server -o jsonpath='{.items[*].status.conditions[?(@.type=="Ready")].status}' | grep -v False
```

---

## 31. GitOps

### 31.1 Descripción

GitOps es un paradigma de operaciones donde **git es la fuente de verdad única** para la infraestructura y la configuración de la aplicación. Un agente de reconciliación (Argo CD, Flux) observa el estado deseado en git y lo sincroniza continuamente con el estado real del cluster. Si alguien modifica manualmente el cluster (drift), el agente lo revierte automáticamente. Es **pull-based** (el cluster "toma" cambios de git) vs. push-based (el pipeline "empuja" al cluster).

### 31.2 Objetivo de negocio

- Trazabilidad completa: cada cambio de infraestructura tiene commit + PR + aprobación.
- Self-healing: el cluster converge al estado de git sin intervención humana.
- Drift detection: cambios manuales se revierten automáticamente.
- Rollback instantáneo: `git revert` = rollback de producción.

### 31.3 Prácticas recomendadas (exhaustivo)

1. **Repo de declaraciones:** un repo (o directorio) contiene los manifests de Kubernetes (Helm charts, Kustomize overlays, raw YAML). Cada cambio pasa por PR review. Fuente: [Argo CD](https://argo-cd.readthedocs.io/)
2. **Application CRD (Argo CD):** definir `Application` que apunta a un repo + path + target revision. Argo CD sincroniza automáticamente. Fuente: [Argo CD Applications](https://argo-cd.readthedocs.io/en/stable/user-guide/application-spec/)
3. **Kustomize overlays por environment:** base + overlays (dev, staging, prod) con diferencias de replicas, resources, secrets. Fuente: [Kustomize](https://kustomize.io/)
4. **Sync waves (Argo CD):** definir orden de deploy con annotations `argocd.argoproj.io/sync-wave`. DB primero, luego API, luego frontend. Fuente: [Sync Waves](https://argo-cd.readthedocs.io/en/stable/user-guide/sync-waves/)
5. **Diff automation:** el agente muestra diff entre git y cluster antes de sync. Auto-sync para dev, manual sync para prod.
6. **Multi-cluster management:** Argo CD/Flux gestionan múltiples clusters desde un único control plane. AppProjects para aislar namespaces.
7. **Progressive sync (Flux):** Flux v2 sincroniza componentes en orden de dependencia. Image Automation Controllers actualizan imágenes automáticamente en git.
8. **Drift detection + remediation:** monitoreo continuo de diferencias. Alertas si hay drift; auto-remediation opcional (dev) o manual (prod).
9. **Secret management en GitOps:** NUNCA commits secrets en git. Usar SOPS + age, Sealed Secrets, o External Secrets Operator. Fuente: [Sealed Secrets](https://github.com/bitnami-labs/sealed-secrets)
10. **Audit y compliance:** cada sync genera evento con commit SHA, usuario, resultado. Integrar con SIEM para compliance.

### 31.4 Herramientas comunes

| Categoría        | Herramientas                                 |
| ---------------- | -------------------------------------------- |
| GitOps engines   | Argo CD, Flux v2, Fleet, Drake               |
| Packaging        | Helm, Kustomize, Jsonnet                     |
| Secrets          | Sealed Secrets, External Secrets, SOPS+age   |
| Image automation | Flux Image Automation, Argo CD Image Updater |
| Multi-cluster    | Argo CD ApplicationSets, Flux_bm, Rancher    |

### 31.5 Mejores prácticas

- Git como única fuente de verdad: NUNCA kubectl apply manual en prod.
- Branch protection en el repo de declaraciones.
- Auto-sync en dev, manual sync en prod (con diff review).
- Secrets nunca en git: Sealed Secrets o External Secrets.
- Monitorear sync status: alarms en Argo CD health degraded.
- Commits atómicos: un commit = un cambio desplegable.

### 31.6 Errores comunes (anti-patrones)

- kubectl apply manual → drift silencioso, git ya no refleja realidad.
- Secrets en el repo de declaraciones (commit cifrado no es suficiente para todos los threat models).
- Auto-sync en producción sin review → deploy no autorizado.
- Repositorio monolítico sinAppProjects → colisión entre equipos.
- Sync waves incorrectos → frontend desplegado antes que el backend.
- Sin branch protection → cualquiera puede hacer push a main.

### 31.7 Métricas recomendadas

- Sync status (target: 100% synced en todo momento).
- Drift events por semana (target: 0).
- Time from git commit to cluster sync (target: < 5 min).
- Failed sync rate (target: < 1%).
- Rollback time via git revert (target: < 2 min).

### 31.8 Fuentes

- https://argo-cd.readthedocs.io/
- https://fluxcd.io/
- https://opengitops.dev/
- https://www.weave.works/technologies/gitops/
- https://github.com/bitnami-labs/sealed-secrets

### 31.9 Ejemplo práctico — GitHub Actions + Argo CD

```yaml
# .github/workflows/gitops-sync.yml
# Actualizar declaraciones en git para trigger GitOps sync
name: GitOps Sync

on:
  workflow_run:
    workflows: ['CI']
    types: [completed]
    branches: [main]

permissions:
  contents: write

jobs:
  update-manifests:
    name: Update K8s Manifests
    runs-on: ubuntu-latest
    if: ${{ github.event.workflow_run.conclusion == 'success' }}
    steps:
      - uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683 # v4.2.2
        with:
          repository: ${{ github.repository_owner }}/gitops-repo
          token: ${{ secrets.GITOPS_PAT }}

      - name: Update image tag
        run: |
          cd environments/production
          yq e '.spec.template.spec.containers[0].image = "ghcr.io/${{ github.repository }}/server-express:${{ github.sha }}"' -i rollout.yaml

      - name: Commit and push
        run: |
          git config user.name "CI Bot"
          git config user.email "ci@project-one.com"
          git add -A
          git commit -m "chore(deploy): update server to ${{ github.sha }}"
          git push
          # Argo CD detects the commit and syncs automatically
```

---

## 32. Infrastructure as Code en CI/CD

### 32.1 Descripción

Infrastructure as Code (IaC) gestiona la infraestructura de forma declarativa y versionada. En CI/CD, los pipelines de IaC automatizan la provisión, modificación y destrucción de recursos cloud (VPCs, databases, clusters, DNS, IAM). El flujo estándar es **plan → approve → apply**, con gates de aprobación para cambios de alto riesgo. Terraform domina la industria; Pulumi y Crossplane son alternativas modernas.

### 32.2 Objetivo de negocio

- Infraestructura reproducible y auditada (cada cambio tiene commit + plan diff).
- Eliminar configuración manual (drift, errors, undocumented changes).
- Environment parity: dev = staging = prod (diferenciado solo por variables).
- Velocidad: provisionar entornos completos en minutos, no días.

### 32.3 Prácticas recomendadas (exhaustivo)

1. **Remote state con locking:** state file en S3/GCS/Azure Blob con DynamoDB/Semaphore locking. Sin locking → race conditions entre pipelines. Fuente: [Terraform Backends](https://developer.hashicorp.com/terraform/language/backend)
2. **Workspaces por environment:** separar state de dev/staging/prod. Workspaces o directorios separados con tfvars específicos.
3. **Plan → Apply separados:** `terraform plan` genera diff; review humano o automatizado; `terraform apply` ejecuta. Plan como artifact del PR.
4. **Modules reutilizables:** encapsular infraestructura común (VPC, EKS, RDS) en módulos versionados. Consumir como `module "vpc" { source = "git::https://..." }`.
5. **IaC testing:** Terratest (Go tests contra infra real), Checkov (static analysis), tfsec (security scanning), OPA/Conftest (policy as code). Fuente: [Checkov](https://www.checkov.io/), [Terratest](https://github.com/gruntwork-io/terratest)
6. **Policy as Code:** OPA/Conftest para validar planes de Terraform contra políticas ("no open 0.0.0.0/0", "encryption enabled", "tagging required"). Gate: block apply si policy falla. Fuente: [OPA](https://www.openpolicyagent.org/)
7. **Drift detection:** Plan periódico (cron) para detectar cambios manuales. Alertas si state ≠ reality.
8. **Cost estimation:** Infracost en PRs para mostrar costo estimado de cambios de infra. Block si supera threshold. Fuente: [Infracost](https://www.infracost.io/)
9. **State migration strategies:** `terraform state mv` para renombrar; import para recursos existentes; never edit state manually.
10. **Destroy como pipeline:** `terraform destroy` automatizado para entornos efímeros. Destruir al cerrar PR.

### 32.4 Herramientas comunes

| Categoría        | Herramientas                                 |
| ---------------- | -------------------------------------------- |
| IaC core         | Terraform, OpenTofu, Pulumi, Crossplane, CDK |
| State management | Terraform Cloud, Spacelift, Env0, Scalr      |
| Testing          | Terratest, Checkov, tfsec, cfn-nag           |
| Policy as Code   | OPA, Conftest, Sentinel, Kyverno             |
| Cost estimation  | Infracost, Terraform Cloud cost estimation   |
| Drift detection  | Terraform Cloud drift, Spacelift drift       |

### 32.5 Mejores prácticas

- Remote state SIEMPRE (nunca local).
- Plan como artifact revisable en cada PR.
- Módulos versionados + registry privado para reutilización.
- Policy as code como gate obligatorio antes de apply.
- Cost estimation visible en PRs para decisiones informadas.
- Entornos efímeros con destroy automático.

### 32.6 Errores comunes (anti-patrones)

- State local → perdido, no reproducible, race conditions.
- `terraform apply` directo sin plan review → cambios no auditados.
- Secrets en tfvars o state → comprometidos si state es accesible.
- Módulos sin versionar → breaking changes inesperados.
- Sin drift detection → infra manual no detectada.
- Resources sin tagging → costos imposibles de atribuir.

### 32.7 Métricas recomendadas

- % de infra bajo IaC (target: 100%).
- Drift events detectados y corregidos (target: 0 abiertos).
- Tiempo de provisioning de entorno (target: < 30 min).
- Cost estimation accuracy (plan vs real).
- Policy compliance rate (target: 100%).

### 32.8 Fuentes

- https://developer.hashicorp.com/terraform/language/backend
- https://www.openpolicyagent.org/
- https://www.checkov.io/
- https://www.infracost.io/
- https://github.com/gruntwork-io/terratest
- https://www.pulumi.com/

### 32.9 Ejemplo práctico — GitHub Actions

```yaml
# .github/workflows/terraform.yml
# Plan + cost estimation + policy check + apply con approval
name: Terraform

on:
  pull_request:
    paths: ['infrastructure/**']
  push:
    branches: [main]
    paths: ['infrastructure/**']

permissions:
  contents: read
  id-token: write
  pull-requests: write

jobs:
  plan:
    name: Terraform Plan
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: infrastructure
    steps:
      - uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683 # v4.2.2
      - uses: hashicorp/setup-terraform@b9cd54a3c349d3f38e8881555d616ced269571ab # v3.1.2
        with:
          terraform_version: '1.9'
      - run: terraform init
        env:
          AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
      - run: terraform plan -out=tfplan -detailed-exitcode
        id: plan
        continue-on-error: true
      - name: Cost estimation
        uses: infracost/actions/setup@v3
      - run: infracost breakdown --path tfplan --format table
      - name: Policy check
        run: |
          conftest test tfplan -p infrastructure/policies/
      - uses: actions/upload-artifact@ea165f8d65b6e75b540449e92b4886f43607fa02 # v4.6.2
        with:
          name: tfplan
          path: infrastructure/tfplan

  apply:
    name: Terraform Apply
    runs-on: ubuntu-latest
    needs: plan
    if: github.ref == 'refs/heads/main'
    environment:
      name: production # Approval gate
    defaults:
      run:
        working-directory: infrastructure
    steps:
      - uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683 # v4.2.2
      - uses: hashicorp/setup-terraform@b9cd54a3c349d3f38e8881555d616ced269571ab # v3.1.2
      - uses: actions/download-artifact@d3f86a106a0bac45b974a628896c90dbdf5c8093 # v4.3.0
        with:
          name: tfplan
          path: infrastructure
      - run: terraform init
      - run: terraform apply -auto-approve tfplan
```

---

## 33. Database Migrations en CI/CD

### 33.1 Descripción

Las migraciones de base de datos son el **cambio más peligroso** en CI/CD: una migración incorrecta puede causar downtime, pérdida de datos, o corrupción. El patrón **expand/contract** permite cambios de schema sin downtime: expand (agregar columnas/tablas sin romper código viejo) → deploy código nuevo → contract (eliminar columnas viejas). Las herramientas (Prisma Migrate, Flyway, Liquibase) gestionan el versionado y orden de migraciones.

### 33.2 Objetivo de negocio

- Zero-downtime deployments con cambios de schema.
- Rollback seguro de cambios de database.
- Trazabilidad: cada cambio de schema tiene migration file versionado.
- Team collaboration: múltiples devs pueden crear migraciones sin conflictos.

### 33.3 Prácticas recomendadas (exhaustivo)

1. **Expand/Contract pattern (Parallel Change):** Phase 1 (expand): agregar columnas nullable, tablas nuevas. Phase 2 (migrate data): backfill. Phase 3 (contract): eliminar columnas viejas después de deploy de código compatible. Fuente: [ParallelChange — Fowler](https://martinfowler.com/bliki/ParallelChange.html)
2. **Migration files versionados:** cada cambio de schema es un archivo incremental (no destructivo). Prisma: `prisma migrate dev --name add_user_status`. Flyway: `V3__add_user_status.sql`.
3. **CI pipeline para migraciones:** ejecutar `prisma migrate deploy` o `flyway migrate` en CI contra test database. Verificar que no hay errores. Fuente: [Prisma Migrate](https://www.prisma.io/docs/orm/prisma-migrate)
4. **Shadow database:** Prisma usa una shadow DB para generar migraciones limpias sin contaminar la DB de desarrollo. Configurar en CI para validación.
5. **Schema diff verification:** después de migrar, ejecutar `prisma diff --exit-code` para verificar que el schema resultante coincide con el esperado.
6. **Rollback-safe migrations:** NUNCA destructivo en migrate up. Drop column → primero dejar de usar en código → deploy → luego drop. Expand/contract siempre.
7. **Migration testing:** tests de integración que ejecutan migraciones desde cero (clean DB → migrate → seed → test). Detectar migraciones rotas antes de prod.
8. **Ordered execution:** las migraciones se ejecutan en orden estricto. Merge conflicts en migraciones requieren renumeración cuidadosa.
9. **Data backfill como migración:** datos derivados (enums, default values) se backfill como paso de migración, no como fix manual.
10. **Pre-deploy + post-deploy hooks:** migraciones de esquema antes del deploy (pre), migraciones de datos después del deploy (post). Separar timing.

### 33.4 Herramientas comunes

| Categoría         | Herramientas                                |
| ----------------- | ------------------------------------------- |
| ORM migrations    | Prisma Migrate, TypeORM, Sequelize, Drizzle |
| Standalone        | Flyway, Liquibase, Atlas, golang-migrate    |
| Schema management | Prisma, Drizzle Studio, pgAdmin             |
| Testing           | Prisma test DB, Testcontainers, pg_tap      |
| Backfill          | Custom scripts, AWS DMS, pg_dump/restore    |

### 33.5 Mejores prácticas

- Expand/contract SIEMPRE para cambios de alto riesgo.
- Migraciones como código: review, test, version control.
- Nunca migrantar prod manualmente.
- Tests contra DB real (no mock) para validar migraciones.
- Backup ANTES de migrate prod (automático o verificado).
- Separar schema changes de code changes cuando sea posible.

### 33.6 Errores comunes (anti-patrones)

- `DROP COLUMN` en la misma migración que agrega la columna replacement → downtime si código viejo sigue corriendo.
- Migraciones destructivas sin backup → pérdida de datos irrecuperable.
- Migraciones manuales en prod sin PR → no auditadas, no reproducibles.
- Fix manual de datos sin migración → drift entre ambientes.
- Migraciones sin test → rotas descubiertas en producción.
- Renombrar columna en lugar de expand+contract → rompe queries existentes.

### 33.7 Métricas recomendadas

- % de migraciones ejecutadas exitosamente en CI (target: 100%).
- Tiempo de migración en prod (target: < 5 min).
- Rollbacks de migración por quarter (target: 0).
- Migraciones sin review (target: 0).
- Downtime por migraciones (target: 0s).

### 33.8 Fuentes

- https://www.prisma.io/docs/orm/prisma-migrate
- https://martinfowler.com/bliki/ParallelChange.html
- https://martinfowler.com/articles/evodb.html
- https://flywaydb.org/
- https://www.liquibase.org/
- https://atlasgo.io/

### 33.9 Ejemplo práctico — GitHub Actions

```yaml
# .github/workflows/db-migration.yml
# Validar migraciones en CI + deploy en staging/prod
name: Database Migration

on:
  pull_request:
    paths: ['apps/server/prisma/**']
  push:
    branches: [main]
    paths: ['apps/server/prisma/**']

permissions:
  contents: read

jobs:
  validate:
    name: Validate Migration
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16-alpine
        env:
          POSTGRES_USER: postgres
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: migration_test
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    steps:
      - uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683 # v4.2.2
      - uses: actions/setup-node@49933ea5288caeca8642d1e84afbd3f7d6820020 # v4.4.0
        with:
          node-version-file: '.nvmrc'
          cache: npm
      - run: npm ci
      - name: Generate Prisma client
        run: npx prisma generate --schema=apps/server/prisma/schema.prisma
      - name: Run migration on clean DB
        run: npx prisma migrate deploy --schema=apps/server/prisma/schema.prisma
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/migration_test
      - name: Verify schema drift
        run: npx prisma diff --from-migrations apps/server/prisma/migrations --to-schema-datamodel apps/server/prisma/schema.prisma --exit-code
      - name: Run tests against migrated DB
        run: npm run test:integration --workspace=apps/server
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/migration_test

  deploy-staging:
    name: Deploy Migration (Staging)
    runs-on: ubuntu-latest
    needs: validate
    if: github.ref == 'refs/heads/main'
    environment:
      name: staging
    steps:
      - uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683 # v4.2.2
      - run: npm ci
      - run: npx prisma migrate deploy --schema=apps/server/prisma/schema.prisma
        env:
          DATABASE_URL: ${{ secrets.STAGING_DATABASE_URL }}
```

---

## 34. Secrets Management en Pipeline

### 34.1 Descripción

Los secrets (API keys, database credentials, tokens, certificates) son el **punto más vulnerable** del pipeline CI/CD. Un secret comprometido puede significar acceso completo a producción. La gestión de secrets abarca: almacenamiento seguro, rotación automática, inyección just-in-time en pipelines, y prevención de exposición (secret scanning). El error más común es commitear secrets al repositorio.

### 34.2 Objetivo de negocio

- Prevenir compromiso de credenciales de producción.
- Cumplir compliance (SOC2, PCI) que requiere rotación y audit trail de secrets.
- Reducir blast radius: secrets de CI no tienen acceso a producción.
- Eliminar "secret sprawl" (secrets duplicados, sin rotar, sin owner).

### 34.3 Prácticas recomendadas (exhaustivo)

1. **GitHub Actions secrets:** usar `secrets.*` para CI secrets. Nunca hardcodear. Secrets no visibles en logs (automáticamente redacted). Pero: secrets se copian al fork en `pull_request_target`. Fuente: [GitHub Encrypted Secrets](https://docs.github.com/en/actions/security-for-github-actions/security-guides/using-encrypted-secrets-in-github-actions)
2. **OIDC federation:** eliminates long-lived secrets. GitHub Actions gets short-lived tokens from cloud providers via OIDC. No more AWS keys in GitHub secrets. Fuente: [OIDC GitHub Actions](https://docs.github.com/en/actions/security-for-github-actions/security-guides/using-openid-connect-with-github-actions)
3. **HashiCorp Vault:** secret engine centralizado, dynamic secrets (credenciales de DB generadas on-demand con TTL), audit log, policies granulares. Fuente: [Vault](https://www.vaultproject.io/)
4. **SOPS + age:** cifrar secrets en git con age encryption. Secrets versionados pero cifrados. Decrypt en pipeline. Ideal para GitOps (Flux tiene soporte nativo). Fuente: [SOPS](https://github.com/getsops/sops), [age](https://github.com/FiloSottile/age)
5. **External Secrets Operator (K8s):** sincroniza secrets desde AWS SM / Vault / GCP SM → Kubernetes Secrets. El cluster nunca almacena secrets originales. Fuente: [External Secrets](https://external-secrets.io/)
6. **Secret rotation:** rotar secrets periódicamente (90 días). Vault puede generar dynamic secrets con TTL. Automatizar con scripts o Vault leases.
7. **Least privilege en CI:** secrets de CI con permisos mínimos. Secret de PR review ≠ secret de deploy a prod. Environment-scoped secrets.
8. **Pre-commit hooks:** Gitleaks / TruffleHog en pre-commit para detectar secrets antes de commit. CI como segunda línea de defensa. Fuente: [Gitleaks](https://gitleaks.io/)
9. **Audit trail:** registrar quién accedió a qué secret y cuándo. Vault audit log, GitHub audit log.
10. **Secret scanning en PRs:** GitHub secret scanning + push protection habilitado. Dependabot alerts para tokens expuestos.

### 34.4 Herramientas comunes

| Categoría     | Herramientas                                                       |
| ------------- | ------------------------------------------------------------------ |
| Secret stores | HashiCorp Vault, AWS Secrets Manager, GCP Secret Manager, Azure KV |
| Encryption    | SOPS + age, Sealed Secrets, Mozilla SOPS                           |
| External      | External Secrets Operator, CSI Secrets Store                       |
| Scanning      | Gitleaks, TruffleHog, GitHub Secret Scanning                       |
| CI/CD native  | GitHub Actions secrets, GitLab CI variables                        |

### 34.5 Mejores prácticas

- OIDC > static secrets (short-lived tokens > long-lived keys).
- Environment-scoped secrets: dev secrets ≠ prod secrets.
- Secret scanning: pre-commit + CI + GitHub push protection (3 capas).
- Nunca logear secrets (estructurar logs para excluir env vars sensibles).
- Rotación automática: Vault dynamic secrets o rotación programada.
- Blast radius mínimo: CI token con permisos solo para el repo.

### 34.6 Errores comunes (anti-patrones)

- AWS keys hardcodeadas en código fuente → compromiso inmediato.
- Secret en `pull_request_target` → expuesto a forks maliciosos.
- Secrets compartidos entre todos los environments → un leak compromete todo.
- Sin rotación → credenciales stale que nadie revoca.
- `echo $SECRET` en pipeline → logs con secrets (GitHub redacta, pero no siempre).
- Secret scanning solo en CI (sin pre-commit) → llega al repo antes de detectarse.

### 34.7 Métricas recomendadas

- % de secrets usando OIDC federation (target: 100% en cloud).
- Secret rotation compliance (target: 100% rotados en < 90 días).
- Pre-commit secret detection rate (target: 100%).
- Secrets en GitHub push protection (target: habilitado).
- Mean time to revoke compromised secret (target: < 1 hora).

### 34.8 Fuentes

- https://docs.github.com/en/actions/security-for-github-actions/security-guides/using-encrypted-secrets-in-github-actions
- https://docs.github.com/en/actions/security-for-github-actions/security-guides/using-openid-connect-with-github-actions
- https://www.vaultproject.io/
- https://github.com/getsops/sops
- https://external-secrets.io/
- https://gitleaks.io/

### 34.9 Ejemplo práctico — GitHub Actions

```yaml
# .github/workflows/secrets-example.yml
# OIDC federation + Vault + secret scanning
name: Secrets Management Demo

on:
  push:
    branches: [main]

permissions:
  contents: read
  id-token: write # OIDC federation

jobs:
  deploy-with-oidc:
    name: Deploy with OIDC (no static secrets)
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683 # v4.2.2

      - name: Configure AWS credentials via OIDC
        uses: aws-actions/configure-aws-credentials@e3dd6a429d7300a6a4c196c26e071d42e0343502 # v4.0.2
        with:
          role-to-assume: arn:aws:iam::123456789012:role/github-actions-deploy
          aws-region: us-east-1
          # No AWS_ACCESS_KEY_ID or AWS_SECRET_ACCESS_KEY needed!

      - name: Fetch secrets from Vault
        run: |
          export VAULT_ADDR='https://vault.project-one.com'
          DB_PASS=$(vault kv get -field=password secret/prod/database)
          echo "::add-mask::${DB_PASS}"  # Redact from logs
          echo "DB_PASSWORD=${DB_PASS}" >> "$GITHUB_ENV"

      - name: Deploy
        run: |
          echo "Deploying with OIDC auth and Vault secrets..."
          # Deploy logic here
```

---

## 35. Environment Management

### 35.1 Descripción

La gestión de environments cubre el **ciclo de vida completo** de los entornos de ejecución: creación, configuración, promoción, y destrucción. Incluye entornos efímeros (preview environments por PR), entornos persistentes (dev, staging, production), y la promoción de cambios entre ellos. El objetivo es tener entornos consistentes, aislados, y de corta vida cuando sea posible.

### 35.2 Objetivo de negocio

- Preview environments por PR → QA puede ver y probar cambios ANTES de merge.
- Entornos efímeros → reducir costos (destruir cuando no se usan).
- Promoción consistente → staging replica prod, reduce "works on staging" syndrome.
- Environment parity → mismas herramientas, configs, versiones en todos los ambientes.

### 35.3 Prácticas recomendadas (exhaustivo)

1. **Preview environments per PR:** cada PR genera un entorno completo (app + DB). Destruir al merge o close. Mejora: QA puede probar features antes de merge. Fuente: [Vercel Preview](https://vercel.com/docs/deployments/preview-deployments)
2. **Environment naming convention:** `pr-{number}.preview.project-one.com`, `staging.project-one.com`, `project-one.com`. DNS automatizado.
3. **Environment promotion pipeline:** código pasa por dev → staging → prod con los mismos tests. El promotion es un deploy + approval.
4. **Environment as Code:** definir environments como código (Terraform, Docker Compose, K8s manifests). No snowflake environments.
5. **TTL en entornos efímeros:** preview environments se destruyen después de N días sin actividad. Automatizar con cron jobs.
6. **Environment isolation:** secrets separados, databases separadas, access controls diferentes. Un compromise de staging no debe afectar prod.
7. **Environment parity:** mismas versiones de runtime, dependencias, y configuración (diferenciado solo por variables de entorno). Reducir "works on my env".
8. **Feature branch environments:** deploy cada PR a un entorno dedicado. Reviewers pueden probar la feature interactivamente.
9. **Seed data por environment:** datos de prueba consistentes. Dev: datos fake. Staging: datos anonimizados de prod. Prod: datos reales.
10. **Cost tracking por environment:** medir costo de cada environment. Alertas si un preview acumula costos excesivos.

### 35.4 Herramientas comunes

| Categoría                 | Herramientas                                |
| ------------------------- | ------------------------------------------- |
| Preview envs              | Vercel, Netlify, Qovery, Telepresence, Tilt |
| Environment orchestration | Docker Compose, k3d, kind, Skaffold         |
| DNS management            | external-dns, Cloudflare, Route53           |
| Secrets per env           | GitHub Environments, Vault namespaces       |
| Cost tracking             | Infracost, Kubecost, CloudHealth            |

### 35.5 Mejores prácticas

- Preview environments: destroy automático al merge/close.
- Environment isolation: secrets y DB nunca compartidos entre envs.
- Parity: misma toolchain, misma config (diferenciado por env vars).
- TTL en efímeros: si no se usa, se destruye.
- Naming consistente: DNS predecible por PR number.
- Cost visibility: dashboard de costos por environment.

### 35.6 Errores comunes (anti-patrones)

- Preview environments acumulados sin destruir → costos excesivos.
- Staging con versiones diferentes de prod → falsos verdes.
- Secrets compartidos entre envs → compromiso en staging = compromiso en prod.
- Environment "snowflake" → configurado manualmente, no reproducible.
- Sin TTL → entornos efímeros se vuelven permanentes.
- Datos sensibles en staging sin anonimizar → compliance violation.

### 35.7 Métricas recomendadas

- Preview environments activos (target: solo PRs abiertos).
- Tiempo de creación de preview (target: < 5 min).
- % de environments con TTL configurado (target: 100%).
- Costo por environment por mes.
- Environment parity score (version diff entre staging y prod).

### 35.8 Fuentes

- https://vercel.com/docs/deployments/preview-deployments
- https://www.qovery.com/
- https://telepresence.io/
- https://www.skaffold.dev/
- https://github.com/telepresenceio/telepresence

### 35.9 Ejemplo práctico — GitHub Actions

```yaml
# .github/workflows/preview.yml
# Preview environment: crear al PR abierto, destruir al cerrar
name: Preview Environment

on:
  pull_request:
    types: [opened, synchronize, reopened, closed]

permissions:
  contents: read
  pull-requests: write
  deployments: write

env:
  PREVIEW_URL: https://pr-${{ github.event.pull_request.number }}.preview.project-one.com

jobs:
  deploy-preview:
    name: Deploy Preview
    runs-on: ubuntu-latest
    if: github.event.action != 'closed'
    environment:
      name: preview-pr-${{ github.event.pull_request.number }}
      url: ${{ env.PREVIEW_URL }}
    steps:
      - uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683 # v4.2.2
      - uses: actions/setup-node@49933ea5288caeca8642d1e84afbd3f7d6820020 # v4.4.0
        with:
          node-version-file: '.nvmrc'
          cache: npm
      - run: npm ci && npm run build
      - name: Deploy preview
        run: |
          echo "Deploying preview for PR #${{ github.event.pull_request.number }}"
          # Deploy to preview environment
      - name: Comment PR with preview URL
        uses: actions/github-script@60a0d83039c74a4aee543508d2ffcb1c3799cdea # v7.0.1
        with:
          script: |
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: `🚀 Preview deployed: ${{ env.PREVIEW_URL }}`
            })

  destroy-preview:
    name: Destroy Preview
    runs-on: ubuntu-latest
    if: github.event.action == 'closed'
    steps:
      - name: Teardown
        run: |
          echo "Destroying preview for PR #${{ github.event.pull_request.number }}"
          # Destroy preview environment
      - name: Remove comment
        uses: actions/github-script@60a0d83039c74a4aee543508d2ffcb1c3799cdea # v7.0.1
        with:
          script: |
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: `🗑️ Preview destroyed for PR #${{ github.event.pull_request.number }}`
            })
```

---

## 36. Testing Avanzado en CI/CD

### 36.1 Descripción

El testing avanzado va más allá de unit/integration/E2E para cubrir **dimensiones críticas** que los tests tradicionales pierden: contratos entre servicios, regresiones visuales, accesibilidad, resiliencia ante fallos, y mutaciones de código. Estos tests detectan bugs que solo emergen en interacción con otros servicios, cambios sutiles de UI, barreras de accesibilidad, y código muerto que los tests normales no alcanzan.

### 36.2 Objetivo de negocio

- Detectar regresiones visuales ANTES de que lleguen a producción.
- Cumplir WCAG 2.1 AA (obligatorio en muchos mercados).
- Verificar contratos entre servicios frontend/backend.
- Probar resiliencia ante fallos de dependencias.
- Medir calidad real de tests (mutation testing).

### 36.3 Prácticas recomendadas (exhaustivo)

1. **Contract testing (Pact):** defines contratos entre consumer y provider. Pact genera mocks del provider basados en el contrato. Detecta breaking changes antes de deploy. Fuente: [Pact](https://pact.io/)
2. **Visual regression testing:** Playwright snapshots, Chromatic (Storybook), Percy (BrowserStack). Comparar screenshots pixel-by-pixel. Configurar threshold para tolerar anti-aliasing diffs. Fuente: [Playwright Visual](https://playwright.dev/docs/test-snapshots)
3. **Accessibility testing (axe-core):** inyectar axe-core en tests E2E. Playwright + axe. Lighthouse CI a11y score. WCAG 2.1 AA como mínimo. Fuente: [axe-core](https://github.com/dequelabs/axe-core)
4. **Chaos engineering:** inyectar fallos controlados (latency, exceptions, pod kills) para probar resiliencia. Chaos Monkey (AWS), Litmus (K8s), Toxiproxy (network). Fuente: [Litmus](https://litmuschaos.io/)
5. **Mutation testing (Stryker) — pipeline SEPARADO, NO en el pipeline de PRs.** Stryker muta el código fuente (cambia operadores, borra condiciones, invierte booleanos) y ejecuta el suite de tests contra cada mutación; si un mutante sobrevive → los tests ejecutan el código pero no asertan el comportamiento (test gap). Métrica: mutation score (target: >80% en módulos críticos, 60-70% general; no perseguir 100% — equivalent mutants y retorno decreciente).

   **¿Por qué NO en el pipeline de PRs? (consenso de industria):** El mutation testing full-sweep ejecuta el suite de tests una vez POR MUTANTE (costo ≈ nº de mutantes × duración del suite). Proyecto medio (10k LOC, 500 tests) → ~8.000 mutantes → 4+ horas de cómputo por run completo (10-40x el costo de unit tests). Mantenerlo en el PR pipeline causaría: (a) **lead time de horas por PR** — degrada DORA lead time for changes, pierde nivel Elite, colapsa merge queue; (b) **agotamiento de GitHub Actions minutes** — Linux 2-core = $0.006/min; full sweep de 60-120 min ≈ $0.36-0.72/run; 20 PRs/día = $7-15/día → $150-450/mes, y consume la cuota de 3.000 min/mes de GitHub Team en 2-5 días; (c) **contención de recursos** — compite por runners con unit/integration/E2E, timeouts falsos por CPU saturada inflan el mutation score (máquina saturada reporta score más alto del que el código merece); (d) **developer experience** — feedback de horas → context-switching, re-triggers, cultura de bypass; (e) **ruido del mutation score** — fluctúa por equivalent mutants, timeouts, cambios de scope — sirve como tendencia, no como gate bloqueante de merge.

   **Ubicación recomendada (workflow separado `mutation.yml`):**
   - **PRIMARIO — Nightly scheduled full sweep** sobre `main` (`schedule: cron`, ej. 02:00 UTC): Stryker con `--incremental`, baseline `stryker-incremental.json` cacheado/restaurado entre runs; **non-blocking** (NO required check, no bloquea merge); thresholds `--break-at` como señal; reporte HTML + scoreboard para lectura de tendencia semanal. Full `--force` semanal para evitar drift del reporte incremental.
   - **SECUNDARIO — On-demand** (`workflow_dispatch`): full run manual antes de releases importantes o al modificar la config del flujo de mutation testing.
   - **OPCIONAL AVANZADO — PR runs incrementales diff-scoped** (`--since origin/main`, `fetch-depth: 0`): solo sobre el diff (3-8 min), advisory primero ('indicator first, gate later' — Mercado Libre), umbral acordado por equipo, bypass con label+justificación para hotfixes. Jamás full sweep en PR.

   Fuente: [StrykerJS incremental mode](https://stryker-mutator.io/blog/announcing-incremental-mode/), [StrykerJS issue #2247 — nicojs](https://github.com/stryker-mutator/stryker-js/issues/2247), [CircleCI — Mutation Testing](https://circleci.com/blog/what-is-mutation-testing/), [Autotomy — How teams use mutation testing in CI](https://autotomy.dev/blog/mutation-testing-takes-4-hours-how-do-teams-actually-use-it-in-ci/), [Pitest — Don't let your code dry](http://blog.pitest.org/dont-let-your-code-dry/), [Mercado Libre — Mutation Testing at Scale](https://medium.com/mercadolibre-tech/mutation-testing-at-mercado-libre-from-pilot-to-everyday-guardrail-2ffe0a273f0e), [Tesis Chalmers — MT in CI pipelines](https://odr.chalmers.se/bitstreams/38f0710c-ad11-409f-a579-aa35102e38e0/download). Ver §23.3 diagrama: bloque "PIPELINE SEPARADO — SIN GATE DE MERGE".

6. **Contract testing en monorepo:** intra-workspace contracts (apps/server ↔ apps/client) con Pact o MSW handlers compartidos. External contracts para APIs de terceros.
7. **Test data management:** datos de prueba deterministas, seed scripts, testcontainers para DB real, datos anonymizados para staging. Nunca usar datos reales de prod en tests.
8. **Test parallelization:** Vitest workspace config para correr test suites en paralelo. Sharding en CI para distribuir entre runners. Target: < 5 min para full suite.
9. **Flaky test detection:** Playwright retry + reporter de flaky tests. Dashboard de test stability. Quarantine flaky tests automáticamente.
10. **Performance budgets en tests:** Lighthouse CI con performance budgets (FCP < 1.8s, LCP < 2.5s). k6 smoke test en CI para endpoints críticos.
11. **Duplication Detection (POST-Build):** detección de código duplicado ejecutada en STAGE 4 (post-build) porque la herramienta principal — SonarQube/SonarCloud — requiere el artifact compilado y datos de cobertura para un análisis preciso. **SonarQube** detecta: (a) `duplicated_lines_density` — porcentaje de líneas duplicadas en el proyecto; (b) duplicación cross-file — bloques idénticos en archivos diferentes (crítico en monorepos donde se copian lógicas entre workspaces); (c) `duplicated_blocks` vs `duplicated_files` — permite distinguir entre código copiado entre archivos vs archivos enteros duplicados. **jscpd** (JavaScript Copy/Paste Detector) puede ejecutarse como indicador temprano pre-build (language-agnostic, parsea AST sin necesidad de compilación), pero es menos preciso que SonarQube porque no considera métricas de complejidad ni cobertura. Workflow recomendado: jscpd en STAGE 2 como señal temprana (threshold: <5% duplicación), SonarQube en STAGE 4 como gate definitivo (quality gate: duplicación no puede empeorar). En monorepos, refactorizar duplicados a módulos compartidos reduce deuda técnica y previene bugs por inconsistencia.
12. **Content/brand review gate:** verificación automática de que el contenido desplegado cumple estándares de marca y contenido antes de la aprobación de UAT. Checks: (a) validación de que los textos legales (términos de uso, privacy policy) están presentes y actualizados; (b) verificación de que los logos/imágenes de marca tienen la resolución correcta (usando Playwright screenshot + OCR o comparación visual); (c) link rot detection — verificar que todos los links internos/externos funcionan (usar `lychee` o `markdown-link-check`); (d) validación de metadata SEO (title, description, OG tags) con Playwright. Ejecutar como step en STAGE 7 (Post-Deploy Acceptance) antes de UAT manual. Es un gate automático que complementa la revisión humana de contenido.
13. **Dependency Analysis (depcheck):** análisis de dependencias para detectar: (a) **unused dependencies** — paquetes en `package.json` que no se importan en ningún archivo del proyecto (dependencias huérfanas que inflan el bundle y aumentan superficie de ataque); (b) **missing dependencies** — paquetes importados en código que no están declarados en `package.json` (resolución exitosa solo por hoisting de npm, frágil y no reproducible); (c) **unused devDependencies** — herramientas de desarrollo que ya no se usan (tests migrados, linters removidos). Herramienta principal: `depcheck` (npm package) — escanea AST de todos los archivos del proyecto buscando `require()`/`import` y los cruza con `package.json`. Ejecutar como post-build quality check en STAGE 4: después del build se tiene la imagen completa del proyecto (todos los archivos transpilados/bundled), permitiendo un análisis más preciso que pre-build donde algunos archivos pueden no estar parseados. Configurar con `.depcheckrc` para ignorar configuraciones especiales (ej. `@types/*` en devDependencies). En monorepos: ejecutar `depcheck` por workspace para detectar dependencias huérfanas en cada paquete. Resultado: fallo del quality gate si hay >0 missing dependencies (riesgo de runtime error), warning si hay unused dependencies (deuda técnica).
14. **Property-Based Testing (fast-check) — STAGE 2 PRE-Build.** A diferencia de los unit tests tradicionales (example-based: "para input X espero output Y"), los property-based tests definen **propiedades invariantes** que deben cumplirse para CUALQUIER input generado automáticamente: `fc.assert(fc.property(fc.integer(), fc.integer(), (a, b) => a + b === b + a))`. fast-check genera miles de inputs aleatorios (shrinked para minimal failure case) y verifica que la propiedad se cumpla. **Por qué en PRE-Build (STAGE 2):** opera sobre source code sin necesidad de build artifact, es ejecutable con el mismo runner que unit tests (Vite/Vitest), y añade <1-2 minutos al pipeline (fast-check es lightweight: 1,000 cases por property en ~1-3s en hardware moderno). **Qué detecta que los unit tests no detectan:** edge cases en parsers (JSON, URLs, emails), invariantes matemáticos (asociatividad, conmutatividad, idempotencia), lógica de validación (si `validate(input)` es true, entonces `sanitize(input)` no lanza), correlaciones entre funciones (si `encode(x)` produce `y`, entonces `decode(y)` produce `x`). **Configuración recomendada en Vitest:** importar `fast-check/vitest` para integración nativa; configurar `numRuns: 1_000` para CI (más que en local: 200); usar `--seed` fijo para reproducibilidad en CI; integrar con `@fast-check/vitest` para auto-discovery de properties. **Qué NO reemplaza:** no sustituye unit tests example-based (que validan casos conocidos y regression); es complementario — los property-based tests cubren el espacio de inputs que el developer no imaginó. **Categorías ideales:** parsers, serialización/deserialización, algoritmos de ordenamiento, CRUD operations (create → read → update → delete → verify invariant), transformaciones de datos (sanitization, normalization). Fuente: [fast-check](https://github.com/dubzzz/fast-check), [fast-check docs](https://fast-check.dev/), [Property-Based Testing — Martin Fowler](https://martinfowler.com/articles/ Replace-Industrial-Legacy-Code-With-Property-Based-Testing.html)

### 36.4 Herramientas comunes

| Categoría         | Herramientas                                       |
| ----------------- | -------------------------------------------------- |
| Contract testing  | Pact, MSW, WireMock, Spring Cloud Contract         |
| Visual regression | Playwright Snapshots, Chromatic, Percy, Applitools |
| Accessibility     | axe-core, Lighthouse a11y, Pa11y, jest-axe         |
| Chaos engineering | Litmus, Chaos Monkey, Toxiproxy, Pumba             |
| Mutation testing  | Stryker, mutmut, cosmic-ray                        |
| Property-based    | fast-check, Hypothesis, jqwik                      |
| Test data         | Testcontainers, Faker, factory-bot                 |

### 36.5 Mejores prácticas

- Contract testing para APIs públicas y entre microservicios.
- Visual regression: baseline images en CI, no en local.
- a11y testing: parte del E2E pipeline, no opcional.
- Chaos: stagin primero, prod solo con feature flags.
- Mutation testing: pipeline separado (nightly full sweep + on-demand), jamás en PRs como gate (ver §36.3 item 5).
- Flaky test quarantine: no bloquear CI por tests inestables.

### 36.6 Errores comunes (anti-patrones)

- Visual regression sin threshold → falsos positivos por anti-aliasing.
- a11y comoafterthought → se acumulan 200 violaciones que nadie corrige.
- Contract testing sin consumer-driven → el provider define contratos que no reflejan uso real.
- Chaos en prod sin circuit-breakers → puede causar cascada de fallos.
- Mutation testing en cada PR → pipeline excesivamente lento.
- Test data de prod → compliance violation (GDPR, PCI).

### 36.7 Métricas recomendadas

- Mutation score (target: > 80%).
- Visual regression false positive rate (target: < 2%).
- a11y violations abiertas (target: 0 críticas, < 5 moderadas).
- Contract test coverage (target: 100% de APIs públicas).
- Flaky test rate (target: < 1% de tests).

### 36.8 Fuentes

- https://pact.io/
- https://playwright.dev/docs/test-snapshots
- https://github.com/dequelabs/axe-core
- https://litmuschaos.io/
- https://stryker-mutator.io/
- https://testcontainers.com/

### 36.9 Ejemplo práctico — GitHub Actions

```yaml
# .github/workflows/advanced-testing.yml
# Contract + visual regression + a11y + mutation testing
name: Advanced Testing

on:
  pull_request:
    branches: [main]

permissions:
  contents: read

jobs:
  contract-tests:
    name: Contract Tests (Pact)
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683 # v4.2.2
      - uses: actions/setup-node@49933ea5288caeca8642d1e84afbd3f7d6820020 # v4.4.0
        with:
          node-version-file: '.nvmrc'
          cache: npm
      - run: npm ci
      - name: Run Pact consumer tests
        run: npm run test:contract --workspace=apps/client
      - name: Run Pact provider verification
        run: npm run test:pact:verify --workspace=apps/server
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test

  visual-regression:
    name: Visual Regression
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683 # v4.2.2
      - uses: actions/setup-node@49933ea5288caeca8642d1e84afbd3f7d6820020 # v4.4.0
        with:
          node-version-file: '.nvmrc'
          cache: npm
      - run: npm ci
      - name: Install Playwright browsers
        run: npx playwright install --with-deps
      - name: Visual regression tests
        run: npx playwright test --project=visual
      - uses: actions/upload-artifact@ea165f8d65b6e75b540449e92b4886f43607fa02 # v4.6.2
        if: failure()
        with:
          name: visual-diffs
          path: e2e/test-results/

  a11y:
    name: Accessibility Audit
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683 # v4.2.2
      - uses: actions/setup-node@49933ea5288caeca8642d1e84afbd3f7d6820020 # v4.4.0
        with:
          node-version-file: '.nvmrc'
          cache: npm
      - run: npm ci
      - name: Install Playwright browsers
        run: npx playwright install --with-deps
      - name: Run a11y tests
        run: npx playwright test --project=a11y
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test
```

---

## 37. Compliance y Audit en CI/CD

### 37.1 Descripción

Compliance en CI/CD significa que cada cambio de código e infraestructura tiene **evidencia auditble** de quién hizo qué, cuándo, y por qué. Frameworks como SOC 2, HIPAA, PCI-DSS, GDPR, y **marcos NIST/CISA** requieren trazabilidad, controles de acceso, y evidencia de que los procesos se siguen. CI/CD automatiza la recolección de evidencia: cada pipeline run genera logs, approvals, test results, y deploy records.

### 37.2 Objetivo de negocio

- Pass audit requirements (SOC 2 Type II, PCI-DSS, HIPAA, **NIST SP 800-53**) con evidencia automatizada.
- Reducir tiempo de auditoría de semanas a horas con evidencia pre-recopilada.
- Cumplir GDPR con data retention policies y right-to-erasure automation.
- Cumplir **EO 14028** y **OMB M-22-18** con SBOM + attestations per release.
- Crear cultura de accountability con approvals y audit trails.

### 37.3 Prácticas recomendadas (exhaustivo)

1. **Approval gates para producción:** GitHub Environments con required reviewers. Cada deploy a prod requiere aprobación humana registrada. Audit log: quién aprobó, cuándo. Fuente: [GitHub Environments](https://docs.github.com/en/actions/deployment/targeting-different-environments/using-environments-for-deployment)
2. **Signed commits:** commit signing con GPG/SSH keys o Sigstore. Verificar que commits no son spoofados. Branch protection: require signed commits. **NIST SI-7, CISA Pipeline Integrity.**
3. **Automated evidence collection:** pipeline genera artifacts de evidencia: test results, security scans, deploy manifests, approval records. Retener por 7+ años para SOC2. Fuente: [SOC 2](https://www.aicpa-cima.com/topic/audit-assurance/audit-and-assurance-greater-than-soc-2)
4. **Change control automation:** cada change tiene ticket (Jira/Linear), PR, review, CI pass, approval, deploy. Cadena completa trazable. PR linking con ticket.
5. **Access reviews periódicos:** revisar quién tiene acceso a GitHub secrets, cloud accounts, databases. Automatizar con access review tools. Target: quarterly. **NIST AC-2.**
6. **Compliance-as-Code:** definir reglas de compliance como código verificable (OPA policies, Checkov rules, custom scripts). Ejecutar en CI como gates. Fuente: [OPA](https://www.openpolicyagent.org/)
7. **Audit log aggregation:** centralizar logs de CI/CD (GitHub audit log, cloud audit logs, Vault audit log). SIEM integration (Splunk, Datadog, ELK). **NIST AU-2, AU-3.**
8. **Data retention policies:** logs de CI retener X días, artifacts Y meses. Automatizar cleanup. Cumplir con GDPR right-to-erasure para datos de usuarios.
9. **Incident response automation:** runbooks ejecutables, alertas automatizadas, on-call rotation. Post-mortems blameless documentados. Fuente: [PagerDuty](https://www.pagerduty.com/)
10. **Vendor assessment:** evaluar riesgo de dependencias de CI/CD (GitHub Actions marketplace, Docker Hub, npm). SLSA compliance para supply chain.
11. **SBOM generation per release:** generar CycloneDX/SPDX SBOM para cada release. Archivar con attestation. **Requerido por EO 14028 y EU CRA. NIST PO.5.**
12. **Vulnerability management SLA:** definir SLAs de remediación por severidad (critical: 24h, high: 7d, medium: 30d). **CISA KEV-aware patching.**

### 37.4 Mapeo NIST/CISA a Compliance Practices

| Practice              | NIST Control                    | CISA Guidance       | Evidence Generated                           |
| --------------------- | ------------------------------- | ------------------- | -------------------------------------------- |
| Approval gates        | AC-2 (Account Management)       | Access controls     | Audit log: approver, timestamp               |
| Signed commits        | SI-7 (Software Integrity)       | Pipeline integrity  | Signed commit objects                        |
| Automated evidence    | AU-2 (Audit Events)             | Compliance evidence | Test results, scan reports, deploy manifests |
| Access reviews        | AC-2 (Account Management)       | Access controls     | Quarterly access review records              |
| Compliance-as-Code    | CM-6 (Configuration Settings)   | Security hardening  | OPA/Checkov scan results                     |
| Audit log aggregation | AU-3 (Content of Audit Records) | Audit trail         | Centralized logs, SIEM alerts                |
| SBOM generation       | PO.5 (SSDF)                     | SBOM Guidance       | CycloneDX/SPDX per release                   |
| Vuln management SLA   | RA-5 (Vulnerability Scanning)   | KEV-aware patching  | SLA compliance reports                       |

### 37.5 Herramientas comunes

| Categoría             | Herramientas                                     |
| --------------------- | ------------------------------------------------ |
| Audit trails          | GitHub Audit Log, AWS CloudTrail, GCP Audit Logs |
| Evidence collection   | Vanta, Drata, Sprinto, Lacework                  |
| Policy as Code        | OPA, Conftest, Sentinel, Kyverno                 |
| Access management     | GitHub RBAC, AWS IAM, Okta, Azure AD             |
| SIEM                  | Splunk, Datadog, ELK, Microsoft Sentinel         |
| Compliance frameworks | SOC 2, PCI-DSS, HIPAA, GDPR, ISO 27001           |

### 37.5 Mejores prácticas

- Approval gates: NUNCA deploy a prod sin aprobación registrada.
- Evidence automation: los pipelines generan evidencia, no los humanos.
- Compliance-as-Code: verificar políticas en CI, no solo documentar.
- Audit log retention: 7+ años para SOC2, 6+ para PCI-DSS.
- Quarterly access reviews: ¿quién tiene acceso? ¿debería?
- Blameless postmortems: cultura de mejora, no de culpa.

### 37.6 Errores comunes (anti-patrones)

- Deploy a prod sin approval → auditoría falla, no hay trazabilidad.
- Evidencia manual (screenshots, copy-paste) → incompleta, no escalable.
- Logs sin retention → se pierden antes de la auditoría.
- Access sprawl → ex-empleados con acceso activo.
- Compliance comochecklist anual → no refleja realidad diaria.
- Secrets compartidos entre personas → no hay accountability individual.

### 37.7 Métricas recomendadas

- % de deploys con approval registrado (target: 100%).
- Mean time to evidence collection (target: < 1 hora).
- Access review completion rate (target: 100% quarterly).
- Audit findings abiertos (target: 0).
- Compliance automation coverage (target: > 80%).

### 37.8 Fuentes

- https://www.aicpa-cima.com/topic/audit-assurance/audit-and-assurance-greater-than-soc-2
- https://docs.github.com/en/actions/deployment/targeting-different-environments/using-environments-for-deployment
- https://www.openpolicyagent.org/
- https://www.pagerduty.com/
- https://docs.aws.amazon.com/awscloudtrail/latest/userguide/cloudtrail-user-guide.html
- **NIST:** https://csrc.nist.gov/pubs/sp/800/53/r5/upd1/final (SP 800-53 Rev. 5)
- **NIST SSDF:** https://csrc.nist.gov/projects/ssdf (SP 800-218)
- **NIST IR 8397:** https://csrc.nist.gov/pubs/ir/8397/final (CI/CD Controls)
- **CISA Securing CI/CD:** https://www.cisa.gov/news-events/cybersecurity-advisories/aa22-118a
- **CISA Supply Chain:** https://www.cisa.gov/topics/cyber-threats-and-advisories/addressing-vulnerabilities/secure-software-development
- **CISA KEV:** https://www.cisa.gov/known-exploited-vulnerabilities-catalog

### 37.9 Ejemplo práctico — GitHub Actions

```yaml
# .github/workflows/compliance-evidence.yml
# Collect compliance evidence for every prod deployment
name: Compliance Evidence

on:
  deployment:
    types: [completed]

permissions:
  contents: write
  deployments: read

jobs:
  collect-evidence:
    name: Collect Audit Evidence
    runs-on: ubuntu-latest
    if: github.event.deployment.environment == 'production'
    steps:
      - uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683 # v4.2.2

      - name: Collect deployment evidence
        run: |
          mkdir -p evidence/${{ github.run_id }}
          cat > evidence/${{ github.run_id }}/deploy-record.json << EOF
          {
            "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
            "repository": "${{ github.repository }}",
            "commit_sha": "${{ github.sha }}",
            "deployer": "${{ github.actor }}",
            "environment": "${{ github.event.deployment.environment }}",
            "workflow_run": "${{ github.server_url }}/${{ github.repository }}/actions/runs/${{ github.run_id }}",
            "deployment_id": "${{ github.event.deployment.id }}"
          }
          EOF

      - name: Generate evidence bundle
        run: |
          echo "Evidence bundle for deployment ${{ github.event.deployment.id }}" > evidence/${{ github.run_id }}/README.md
          echo "Generated: $(date -u)" >> evidence/${{ github.run_id }}/README.md
          echo "Deployer: ${{ github.actor }}" >> evidence/${{ github.run_id }}/README.md

      - uses: actions/upload-artifact@ea165f8d65b6e75b540449e92b4886f43607fa02 # v4.6.2
        with:
          name: compliance-evidence-${{ github.run_id }}
          path: evidence/${{ github.run_id }}/
          retention-days: 2555 # ~7 years for SOC 2
```

---

## 38. Monorepo CI/CD

### 38.1 Descripción

CI/CD en monorepos requiere **inteligencia de dependencias** para ejecutar solo lo afectado por cada cambio. Sin esto, cada PR ejecuta la build completa de todos los workspaces (lento, costoso). Herramientas como Nx y Turborepo analizan el grafo de dependencias y ejecutan solo lo que cambió ("affected commands"). El challenge principal: escalabilidad de pipelines paralelos + caching compartido.

### 38.2 Objetivo de negocio

- Build/test mínimo: solo ejecutar lo que el PR afecta (reduce 70-90% del tiempo).
- Caching distribuido: sharing cache entre CI runs y entre developers.
- Developer experience: un repo, un PR, una build — sin multi-repo sync.
- Consistencia: todos los packages usan las mismas dependencias y herramientas.

### 38.3 Prácticas recomendadas (exhaustivo)

1. **Affected commands:** `turbo run build --filter=...[HEAD^1]` o `nx affected --target=build` para ejecutar solo packages modificados. Fuente: [Turborepo](https://turbo.build/), [Nx](https://nx.dev/)
2. **Remote caching:** cache compartido entre CI runs (Turborepo remote cache, Nx Cloud). Un dev construye, el siguiente reutiliza. Reducción de 60-80% en build times. Fuente: [Turborepo Remote Cache](https://turbo.build/repo/docs/core-concepts/remote-caching)
3. **Dependency graph analysis:** visualizar y monitorear el grafo de dependencias. Detectar ciclos, dependencias circulares, package coupling excesivo. Fuente: [Nx Graph](https://nx.dev/features/explore-graph)
4. **Task ordering topológico:** ejecutar builds en orden de dependencias. A → B → C (no en paralelo si hay dependencias). Turborepo y Nx manejan esto automáticamente.
5. **Selective CI triggers:** `paths` filter en GitHub Actions para ejecutar solo cuando ciertos paths cambian. Combinar con affected para maximum precision.
6. **Package-level granularity:** cada package tiene su propio `package.json`, tests, y lint config. No un monolito disfrazado.
7. **Shared tooling:** ESLint, Prettier, TypeScript config compartida desde root. Consistencia sin duplicación.
8. **Integration testing after merge:** tests de integración cross-package solo en main (no en PRs). PRs testean packages individuales.
9. **Constrained dependencies:** definir qué packages pueden depender de cuáles. Nx `constraints` o custom rules para evitar acoplamiento.
10. **Pipeline splitting inteligente:** PR → lint + affected build + affected test. Main → full integration + deploy. No ejecutar todo en todo PR.

### 38.4 Herramientas comunes

| Categoría      | Herramientas                                     |
| -------------- | ------------------------------------------------ |
| Monorepo tools | Turborepo, Nx, Lerna, Rush, Bazel                |
| Caching        | Turborepo Remote, Nx Cloud, Remote Build Cache   |
| Workspace mgmt | npm workspaces, pnpm workspaces, Yarn workspaces |
| Graph analysis | Nx Graph, Turborepo --graph, dependency-cruiser  |
| Task runners   | Turborepo pipeline, Nx run-many, pnpm -r         |

### 38.5 Mejores prácticas

- Affected-first: PRs solo ejecutan lo que cambió.
- Remote caching: configurar desde día 1 (el ROI es inmediato).
- Graph visualization: entender dependencias antes de refactorizar.
- Package isolation: cada package es independiente (testable standalone).
- Integration tests en main, no en PRs (costo vs benefit).
- Constrained dependencies: prevenir arquitectura caótica.

### 38.6 Errores comunes (anti-patrones)

- Build completa en cada PR → lento, desperdicia recursos.
- Sin remote caching → cada CI run construye desde cero.
- Dependencies circulares → affected commands fallan.
- Monorepo sin workspaces → node_modules duplicados, sin shared config.
- Testing completo en PRs → pipeline excesivamente lento.
- Packages acoplados → cambiar uno rompe todos los demás.

### 38.7 Métricas recomendadas

- Build time affected vs full (target: affected < 30% de full).
- Remote cache hit rate (target: > 70%).
- PR pipeline time (target: < 10 min).
- Package isolation score (dependency coupling).
- % de PRs que ejecutan solo affected (target: 100%).

### 38.8 Fuentes

- https://turbo.build/
- https://nx.dev/
- https://turbo.build/repo/docs/core-concepts/remote-caching
- https://nx.dev/features/explore-graph
- https://pnpm.io/workspaces
- https://www.lernajs.org/

### 38.9 Ejemplo práctico — GitHub Actions

```yaml
# .github/workflows/monorepo-ci.yml
# CI inteligente para monorepo: affected + remote cache
name: Monorepo CI

on:
  pull_request:
  push:
    branches: [main]

permissions:
  contents: read

jobs:
  affected:
    name: Affected Pipeline
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683 # v4.2.2
        with:
          fetch-depth: 0 # Full history for affected detection

      - uses: actions/setup-node@49933ea5288caeca8642d1e84afbd3f7d6820020 # v4.4.0
        with:
          node-version-file: '.nvmrc'
          cache: npm

      - run: npm ci

      - name: Detect affected packages
        id: affected
        run: |
          AFFECTED=$(npx turbo run build --filter=...[HEAD^1] --dry=json 2>/dev/null | jq -r '.packages[]')
          echo "packages=${AFFECTED}" >> "$GITHUB_OUTPUT"
          echo "Affected packages: ${AFFECTED}"

      - name: Build affected
        run: npx turbo run build --filter=...[HEAD^1]

      - name: Test affected
        run: npx turbo run test --filter=...[HEAD^1]

      - name: Lint affected
        run: npx turbo run lint --filter=...[HEAD^1]
```

---

## 39. Artifact Management

### 39.1 Descripción

La gestión de artifacts cubre la **creación, versionado, almacenamiento, promoción, y retención** de los productos de build (Docker images, npm packages, binaries, SBOMs). El artifact es la unidad de despliegue: se construye una vez, se prueba, y se promueve por environments sin reconstruirse. La inmutabilidad del artifact es clave: el mismo artifact desplegado en staging es el que llega a producción.

### 39.2 Objetivo de negocio

- Build once, deploy everywhere → consistencia y trazabilidad.
- Artifact immutability → no hay "build ad-hoc" para producción.
- Retention policies → reducir costos de almacenamiento.
- Reproducible builds → poder reconstruir cualquier versión histórica.

### 39.3 Prácticas recomendadas (exhaustivo)

1. **Semantic Versioning (semver):** `MAJOR.MINOR.PATCH` para releases. Tags git como fuente de verdad para versiones. Automatizar con `semantic-release` o `changesets`. Fuente: [SemVer](https://semver.org/)
2. **Artifact immutability:** una vez subido, NUNCA mutar un artifact. Registries con write-once policies. Docker: digest pinning. npm: `--tag` management.
3. **Promotion pipeline:** dev → staging → prod con el mismo artifact. Promoción = cambiar tag/label, no rebuild. Ejemplo: image `v1.2.3` se promueve de staging a prod.
4. **Retention policies:** retener últimos N releases, cleanup automático de tags obsoletos. GHCR: cleanup policy. npm: `npm unpublish` con time limit. Docker Hub: last 10 tags.
5. **Artifact signing y verification:** cosign para Docker images, npm provenance para packages. Cadena de trust: build → sign → push → verify → deploy. Fuente: [cosign](https://github.com/sigstore/cosign)
6. **SBOM por artifact:** SPDX o CycloneDX SBOM generado en build time. Adjuntado al artifact o almacenado en defecto registry.
7. **Reproducible builds:** determinismo en builds (same inputs → same outputs). Lock files, pinned dependencies, hermetic builds. Fuente: [reproducible-builds.org](https://reproducible-builds.org/)
8. **Artifact metadata:** tags descriptivos (no solo SHA), commit message, build number, author. Enriched metadata para auditoría.
9. **Download attestation:** verificar que el artifact descargado es el que fue construido y aprobado. Provenance attestations (SLSA).
10. **Cleanup automation:** workflow automático que limpia artifacts sin retention policy. Cron job semanal.

### 39.4 Herramientas comunes

| Categoría          | Herramientas                                         |
| ------------------ | ---------------------------------------------------- |
| Container registry | GHCR, ECR, ACR, Docker Hub, Harbor, JFrog            |
| Package registry   | npm, GitHub Packages, Verdaccio, Artifactory         |
| Versioning         | semantic-release, changesets, conventional-changelog |
| Signing            | cosign, npm provenance, notary                       |
| SBOM               | Syft, Docker SBOM, CycloneDX                         |

### 39.5 Mejores prácticas

- Build once: el artifact de staging ES el artifact de prod.
- Immutabilidad: tags inmutables, digests para referencia.
- Signing: para artifacts de producción, siempre.
- Retention: configurar cleanup automático desde el inicio.
- SBOM: generar en build time, no after the fact.
- Semver: para releases públicos; SHA tags para builds internos.

### 39.6 Errores comunes (anti-patrones)

- Rebuild para producción → puede ser diferente al stagin-testeado.
- Tags mutables (`latest`) en producción → no hay reproducibilidad.
- Sin retention → costos de storage crecen indefinidamente.
- No signing → supply chain vulnerable a tampering.
- SBOM manual → incompleto, no confiable.
- Artifact sin metadata → imposible saber qué versión está desplegada.

### 39.7 Métricas recomendadas

- Artifact immutability compliance (target: 100%).
- Build reproducibility (target: > 95% identical outputs).
- Artifact retention storage cost (target: within budget).
- Time from build to production deploy (target: < 1 hour con approval).
- SBOM coverage (target: 100% de artifacts).

### 39.8 Fuentes

- https://semver.org/
- https://github.com/sigstore/cosign
- https://reproducible-builds.org/
- https://slsa.dev/
- https://github.com/semantic-release/semantic-release

### 39.9 Ejemplo práctico — GitHub Actions

```yaml
# .github/workflows/artifact-promotion.yml
# Promote artifact from staging → prod with verification
name: Artifact Promotion

on:
  workflow_dispatch:
    inputs:
      artifact_tag:
        description: 'Artifact tag to promote (e.g., v1.2.3)'
        required: true

permissions:
  contents: read
  packages: read
  id-token: write

jobs:
  verify:
    name: Verify Artifact
    runs-on: ubuntu-latest
    outputs:
      verified: ${{ steps.verify.outputs.verified }}
    steps:
      - uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683 # v4.2.2
      - name: Verify image signature
        id: verify
        run: |
          IMAGE="ghcr.io/${{ github.repository }}/server-express:${{ inputs.artifact_tag }}"
          cosign verify "$IMAGE" --certificate-identity-regexp=".*" --certificate-oidc-issuer="https://token.actions.githubusercontent.com"
          echo "verified=true" >> "$GITHUB_OUTPUT"

  promote:
    name: Promote to Production
    runs-on: ubuntu-latest
    needs: verify
    if: needs.verify.outputs.verified == 'true'
    environment:
      name: production
      url: https://project-one.example.com
    steps:
      - name: Tag for production
        run: |
          IMAGE="ghcr.io/${{ github.repository }}/server-express"
          docker buildx imagetools create \
            --tag ${IMAGE}:production \
            ${IMAGE}:${{ inputs.artifact_tag }}
          echo "Promoted ${{ inputs.artifact_tag }} → production"
```

---

## 40. Pipeline Observability

### 40.1 Descripción

La observabilidad de pipelines CI/CD mide **salud, rendimiento, y costo** de los flujos de entrega. Sin observabilidad, los equipos no saben por qué los deploys son lentos, por qué fallan, o cuánto cuestan. El OpenTelemetry CI/CD SIG está estandarizando métricas y traces para pipelines. Las métricas clave son: duration, success rate, flaky test rate, MTTR, y cost per pipeline run.

### 40.2 Objetivo de negocio

- Identificar cuellos de botella en pipelines (test suite lenta, deploy manual bottleneck).
- Medir ROI de inversiones en CI/CD (¿la migración a GitHub Actions redujo build times?).
- Predecir y prevenir fallos (flaky tests, resource contention).
- Optimizar costos (GitHub Actions minutes, cloud compute en CI).

### 40.3 Prácticas recomendadas (exhaustivo)

1. **Pipeline duration tracking:** medir tiempo total y por job. Alertas si excede threshold (ej: > 30 min). Dashboard de tendencias. Fuente: [OpenTelemetry CI/CD](https://github.com/open-telemetry/opentelemetry-specification/blob/main/specification/trace/semantic_conventions/)
2. **Failure rate by stage:** % de pipelines que fallan en cada stage. Identificar el stage más frágil (ej: 40% fallan en E2E tests → investigar).
3. **Flaky test detection:** tests que pasan/fallen intermitentemente. Dashboard de flakiness. Quarantine automático si > 5% flaky rate. Fuente: [Flaky Tests — GitHub](https://github.blog/2023-02-09-customizing-your-ci-strategy-with-flaky-test-retries/)
4. **Resource utilization:** CPU/memory usage de CI runners. Identificar over-provisioned runners (wasting money) o under-provisioned (slow builds).
5. **Cost per pipeline run:** calcular costo de cada run (runner time × cost/min + storage + network). Alertas si un PR acumula > $X en CI.
6. **DORA metrics automation:** lead time for changes, deployment frequency, change failure rate, MTTR. Automatizar con dashboards. Fuente: [DORA](https://dora.dev/)
7. **Pipeline analytics dashboard:** dashboard consolidado con métricas de pipeline, test results, deployment history. Herramientas: BuildKite analytics, GitHub Insights, Grafana.
8. **Alerting en pipeline health:** alertas cuando: success rate < 95%, duration > threshold, flaky rate > 5%, queue time > 10 min.
9. **Trace pipeline execution:** OpenTelemetry traces para pipeline steps. Identificar exactamente qué paso es lento (no solo "el build fue lento").
10. **Historical trend analysis:** comparar métricas mes a mes. ¿Los deploys son más rápidos? ¿Más frecuentes? ¿Más exitosos?

### 40.4 Herramientas comunes

| Categoría       | Herramientas                                            |
| --------------- | ------------------------------------------------------- |
| CI/CD analytics | GitHub Insights, BuildKite Analytics, CircleCI Insights |
| Observability   | OpenTelemetry, Grafana, Datadog, New Relic              |
| Metrics         | Prometheus, InfluxDB, StatsD                            |
| Cost tracking   | GitHub Actions usage API, Infracost, Kubecost           |
| DORA            | DORA metrics, Space metrics, Sleuth                     |

### 40.5 Mejores prácticas

- Medir ANTES de optimizar (no asumir dónde están los problemas).
- Dashboard visible para todo el equipo (transparencia).
- Alertas en trends, no solo en snapshots (la cosa empeora gradualmente).
- Cost tracking por team/feature, no solo total.
- Flaky test quarantine: tests flaky no deberían bloquear deploys.
- Revisar métricas mensualmente en team retro.

### 40.6 Errores comunes (anti-patrones)

- Sin métricas → "nuestro CI es lento" pero nadie sabe por qué.
- Medir solo duration → ignorar success rate y flaky rate.
- Dashboard que nadie revisa → datos sin acción.
- Optimizar prematuramente → mejorar algo que no es el bottleneck.
- Sin cost tracking → CI cost crece sin control.
- Ignorar flaky tests → team aprende a ignorar fallos de CI.

### 40.7 Métricas recomendadas

- Pipeline duration p50/p95/p99 (target: p95 < 15 min).
- Success rate (target: > 95%).
- Flaky test rate (target: < 1%).
- Mean Time to Recovery — MTTR (target: < 30 min).
- Cost per pipeline run (target: within budget).
- Lead time for changes (target: < 1 day).

### 40.8 Fuentes

- https://github.com/open-telemetry/opentelemetry-specification
- https://dora.dev/
- https://github.blog/2023-02-09-customizing-your-ci-strategy-with-flaky-test-retries/
- https://www.gauge.org/
- https://buildkite.com/blog

### 40.9 Ejemplo práctico — GitHub Actions

```yaml
# .github/workflows/pipeline-observability.yml
# Collect pipeline metrics with OpenTelemetry
name: Pipeline Metrics

on:
  workflow_run:
    workflows: ['CI', 'CD']
    types: [completed]

permissions:
  contents: read

jobs:
  record-metrics:
    name: Record Pipeline Metrics
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683 # v4.2.2

      - name: Calculate pipeline metrics
        id: metrics
        run: |
          START="${{ github.event.workflow_run.run_started_at }}"
          END="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
          CONCLUSION="${{ github.event.workflow_run.conclusion }}"
          DURATION=$(( ($(date -d "$END" +%s) - $(date -d "$START" +%s)) ))

          echo "conclusion=${CONCLUSION}" >> "$GITHUB_OUTPUT"
          echo "duration_seconds=${DURATION}" >> "$GITHUB_OUTPUT"
          echo "workflow=${{ github.event.workflow_run.name }}" >> "$GITHUB_OUTPUT"

      - name: Export to OpenTelemetry
        run: |
          curl -X POST "${{ secrets.OTEL_ENDPOINT }}/v1/metrics" \
            -H "Content-Type: application/json" \
            -d '{
              "resource": {"service.name": "github-actions"},
              "metrics": [{
                "name": "ci.pipeline.duration",
                "value": ${{ steps.metrics.outputs.duration_seconds }},
                "attributes": {
                  "workflow": "${{ steps.metrics.outputs.workflow }}",
                  "conclusion": "${{ steps.metrics.outputs.conclusion }}",
                  "repository": "${{ github.repository }}"
                }
              }]
            }'
```

---

## 41. Estrategias de Branch y Disaster Recovery

### 41.1 Descripción

Las estrategias de branch definen **cómo los desarrolladores colaboran** en el código fuente y cómo los cambios fluyen hacia producción. El **trunk-based development** (1 branch principal, feature flags) es el estándar moderno. **GitHub Flow** es la variante más simple: feature branches + PR + merge a main. **GitFlow** es más pesado (develop, release, hotfix branches) y adecuado para releases con ciclos largos. Disaster Recovery (DR) cubre rollback strategies, backup procedures, y incident response.

### 41.2 Objetivo de negocio

- Deploys frecuentes y confiables (trunk-based: deploys diarios posibles).
- Rollback instantáneo ante fallos críticos.
- Resiliencia: backup, restore, y failover documentados y probados.
- Colaboración eficiente sin merge conflicts crónicos.

### 41.3 Prácticas recomendadas (exhaustivo)

1. **Trunk-based development:** una rama principal (main/trunk). Feature branches de vida corta (< 1 día). Feature flags para features incompletas. Deploys frecuentes. Fuente: [Trunk-Based Development](https://trunkbaseddevelopment.com/)
2. **GitHub Flow:** main siempre deployable. Feature branches cortas. PR con review obligatorio. Merge + auto-deploy. Ideal para SaaS. Fuente: [GitHub Flow](https://docs.github.com/en/get-started/using-github/github-flow)
3. **GitFlow (cuando aplica):** develop para integración, release para estabilización, hotfix para emergencias. Más overhead, adecuado para software con release cycles de semanas/meses.
4. **Branch protection rules:** require PR, require reviews (2+), require status checks, require signed commits, require linear history. No direct push a main. Fuente: [Branch Protection](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-a-branch-protection-rule)
5. **Rollback strategies:**
   - **Instant rollback:** revert commit + redeploy (GitOps: `git revert`).
   - **Staged rollback:** canary → rollback partial → full rollback.
   - **Database-safe rollback:** expand/contract reverso. Si migración no es reversible → forward-fix.
6. **Backup before deploy:** snapshot de DB antes de migración. Backup de artifacts. Backup de configuración.
7. **RTO/RPO definition:** Recovery Time Objective (cuánto tiempo sin servicio). Recovery Point Objective (cuántos datos se pierden). Definir y documentar para cada sistema crítico. Fuente: [RTO/RPO — AWS](https://docs.aws.amazon.com/whitepapers/latest/disaster-recovery-workloads-on-aws/disaster-recovery-options.html)
8. **Incident response automation:** alertas → diagnosis → mitigation → resolution. Runbooks ejecutables. PagerDuty/OpsGenie para on-call.
9. **Blameless postmortems:** después de cada incidente grave. Documentar: timeline, root cause, impact, action items. Sin culpa — con aprendizaje. Fuente: [Google SRE Book](https://sre.google/sre-book/postmortem-culture/)
10. **DR testing:** ejecutar restore desde backup periódicamente. Probar failover. Si no se prueba, no funciona.

### 41.4 Herramientas comunes

| Categoría         | Herramientas                                      |
| ----------------- | ------------------------------------------------- |
| Branch strategies | GitHub Flow, Trunk-Based, GitFlow, Release Flow   |
| Feature flags     | LaunchDarkly, Unleash, Flagsmith, OpenFeature     |
| Incident mgmt     | PagerDuty, OpsGenie, Incident.io, Rootly          |
| Rollback          | Git revert, Argo Rollouts rollback, Helm rollback |
| DR/Backup         | AWS Backup, Velero (K8s), pg_dump, restic         |

### 41.5 Mejores prácticas

- Trunk-based + feature flags para teams ágiles.
- Branch protection: no merge sin review + CI green.
- Rollback probado en staging ANTES de producción.
- DR drill quarterly: backup restore test.
- Postmortems blameless: cultura de mejora continua.
- Feature flags para big features: deploy incomplete code sin riesgo.

### 41.6 Errores comunes (anti-patrones)

- GitFlow sin necesidad → overhead innecesario para SaaS.
- Feature branches largas (> 1 semana) → merge conflicts crónicos.
- Rollback no probado → producción cae y no se sabe cómo revertir.
- Backup sin restore test → backup inútil (¿está corrupto?).
- Postmortems con culpa → team esconde incidentes.
- Sin DR plan documentado → pánico durante outage.

### 41.7 Métricas recomendadas

- Lead time for changes (target: < 1 day con trunk-based).
- Deployment frequency (target: ≥ 1 per day).
- Rollback time (target: < 5 min).
- RTO achieved vs defined (target: within RTO).
- DR restore test frequency (target: quarterly).
- Postmortem completion rate (target: 100% de incidents).

### 41.8 Fuentes

- https://trunkbaseddevelopment.com/
- https://docs.github.com/en/get-started/using-github/github-flow
- https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-a-branch-protection-rule
- https://docs.aws.amazon.com/whitepapers/latest/disaster-recovery-workloads-on-aws/disaster-recovery-options.html
- https://sre.google/sre-book/postmortem-culture/
- https://launchdarkly.com/

### 41.9 Ejemplo práctico — GitHub Actions

```yaml
# .github/workflows/rollback.yml
# Automated rollback workflow with approval gate
name: Rollback

on:
  workflow_dispatch:
    inputs:
      target_version:
        description: 'Version to rollback to (commit SHA or tag)'
        required: true
      reason:
        description: 'Reason for rollback'
        required: true

permissions:
  contents: write
  deployments: write

jobs:
  rollback:
    name: Execute Rollback
    runs-on: ubuntu-latest
    environment:
      name: production
    steps:
      - uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683 # v4.2.2
        with:
          ref: ${{ inputs.target_version }}

      - name: Create rollback deploy
        run: |
          echo "Rolling back to ${{ inputs.target_version }}"
          echo "Reason: ${{ inputs.reason }}"
          echo "Initiated by: ${{ github.actor }}"
          # Deploy the target version
          # kubectl rollout undo deployment/server -n production
          # OR Argo CD rollback
          # kubectl argo rollouts undo server-rollout -n production

      - name: Create incident record
        uses: actions/github-script@60a0d83039c74a4aee543508d2ffcb1c3799cdea # v7.0.1
        with:
          script: |
            github.rest.issues.create({
              owner: context.repo.owner,
              repo: context.repo.repo,
              title: `🚨 Rollback: ${{ inputs.target_version }}`,
              body: `## Rollback executed\n\n- **Version**: ${{ inputs.target_version }}\n- **Reason**: ${{ inputs.reason }}\n- **Executed by**: ${{ github.actor }}\n- **Time**: ${new Date().toISOString()}\n\n### Action Items\n- [ ] Investigate root cause\n- [ ] Create forward-fix if needed\n- [ ] Schedule postmortem`,
              labels: ['incident', 'rollback']
            })
```

---

## 42. Dependency Automation

### 42.1 Descripción

La automatización de dependencias gestiona el **ciclo de vida completo** de las librerías de terceros: detección de actualizaciones, creación de PRs de actualización, testing automático, y merge cuando los tests pasan. Sin automatización, las dependencias se vuelven obsoletas, acumulan vulnerabilidades, y generan "dependency drift" donde actualizar una dependencia rompe múltiples cosas simultáneamente.

### 42.2 Objetivo de negocio

- Reducir vulnerabilidades de dependencias (CVEs) a horas, no meses.
- Mantener dependencies actualizadas sin esfuerzo manual.
- Detectar breaking changes temprano (PR automático + tests).
- Cumplir compliance que requiere dependencies actualizadas.

### 42.3 Prácticas recomendadas (exhaustivo)

1. **Dependabot:** configuración en `dependabot.yml` para npm, Docker, GitHub Actions. Auto-merge para patch updates con CI green. Grouping para reducir PR noise. Fuente: [Dependabot](https://docs.github.com/en/code-security/dependabot/dependabot-version-updates)
2. **Renovate Bot:** alternativa más configurable. Reglas por package type, automerge policies, scheduling (no PRs en viernes). Fuente: [Renovate](https://docs.renovatebot.com/)
3. **Automerge con CI gate:** Dependabot/Renovate PR se merge automáticamente si: tests pasan + no es major bump + tiene approvals. Usar `gh pr merge --auto`. Fuente: [Auto-merge GitHub](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/incorporating-changes-from-a-pull-request/automatically-merging-a-pull-request)
4. **Grouped updates:** agrupar actualizaciones relacionadas en un solo PR (todas las `@types/*`, todas las `eslint-*`). Reduce PR fatigue. Fuente: [Dependabot Groups](https://docs.github.com/en/code-security/dependabot/dependabot-version-updates/configuration-options-for-the-dependabot.yml-file#groups)
5. **Security-only updates:** para dependencias críticas, solo auto-update cuando hay CVE (no feature updates). Frecuencia diaria para security, semanal para features.
6. **Lockfile maintenance:** mantener lockfiles actualizados. Dependabot puede actualizar `package-lock.json` semanalmente para detectar conflictos temprano.
7. **Monorepo dependency strategy:** Renovate con `ignorePaths` para packages que comparten dependencias. Group updates por workspace.
8. **Vulnerability alerting:** GitHub Dependabot Alerts + Security Advisories. Alertas en Slack para CRITICAL CVEs. SLA: patch en 24h, update en 7 días.
9. **License compliance:** verificar licencias de dependencias nuevas (GPL en proyecto privado = riesgo). Usar `license-checker` o `fossa`.
10. **Dependency review in PRs:** GitHub `dependency-review-action` en PRs para detectar CVEs en dependencias nuevas antes de merge.

### 42.4 Herramientas comunes

| Categoría          | Herramientas                                           |
| ------------------ | ------------------------------------------------------ |
| Version updates    | Dependabot, Renovate, Greenkeeper (deprecated), Socket |
| Security alerts    | GitHub Dependabot Alerts, Snyk, npm audit, Trivy       |
| License compliance | license-checker, FOSSA, Snyk License                   |
| Lockfile           | package-lock.json, pnpm-lock.yaml, shrinkwrap          |
| Dependency review  | dependency-review-action, Socket.dev                   |

### 42.5 Mejores prácticas

- Automerge para patch updates (CI green = safe).
- Group updates para reducir PR noise.
- Security SLA: CRITICAL en 24h, HIGH en 7 días.
- Lockfile maintenance semanal.
- License check en PRs nuevos.
- Monitorear dependency age (alertas si > 1 year outdated).

### 42.6 Errores comunes (anti-patrones)

- No automatizar → dependencias accumulation de CVEs.
- Auto-merge sin tests → introduce breaking changes.
- PRs de Dependabot acumulados → team ignora todos.
- Sin lockfile → "funciona en CI pero no local".
- Major bumps sin review → breaking changes en producción.
- Ignorar license compliance → riesgo legal.

### 42.7 Métricas recomendadas

- Dependency freshness (target: > 80% actualizadas en < 30 días).
- CVE remediation time (target: CRITICAL < 24h, HIGH < 7 días).
- Dependabot PR merge rate (target: > 90%).
- Average dependency age (target: < 6 meses).
- License compliance (target: 100% sin GPL en proprietary).

### 42.8 Fuentes

- https://docs.github.com/en/code-security/dependabot/dependabot-version-updates
- https://docs.renovatebot.com/
- https://docs.github.com/en/code-security/dependabot/dependabot-version-updates/configuration-options-for-the-dependabot.yml-file#groups
- https://socket.dev/
- https://docs.github.com/en/code-security/dependabot/dependabot-security-updates

### 42.9 Ejemplo práctico — GitHub Actions

```yaml
# .github/workflows/dependency-review.yml
# Dependency review en PRs para detectar CVEs en dependencias nuevas
name: Dependency Review

on:
  pull_request:

permissions:
  contents: read

jobs:
  dependency-review:
    name: Review New Dependencies
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683 # v4.2.2
      - uses: actions/dependency-review-action@da24556b598a8efec87b7f9f09fb1e9db01e7e91 # v4.6.0
        with:
          fail-on-severity: high
          comment-summary-in-pr: always
          deny-licenses: GPL-3.0, AGPL-3.0
          allow-licenses: MIT, Apache-2.0, BSD-2-Clause, BSD-3-Clause, ISC, 0BSD

# dependabot.yml (config, not workflow):
# version: 2
# updates:
#   - package-ecosystem: npm
#     directory: /
#     schedule:
#       interval: daily
#     groups:
#       types:
#         patterns: ["@types/*"]
#       eslint:
#         patterns: ["eslint*", "@typescript-eslint/*"]
#     open-pull-requests-limit: 10
#     reviewers: ["freelancer-soluctions"]
#   - package-ecosystem: docker
#     directory: /apps/server
#     schedule:
#       interval: weekly
#   - package-ecosystem: github-actions
#     directory: /
#     schedule:
#       interval: weekly
```

---

## 43. Release Management

### 43.1 Descripción

El release management gestiona la **creación, documentación, y distribución** de versiones de software. Cubre: versionado semántico automatizado, generación de changelogs, creación de GitHub Releases, y distribución de artifacts. El objetivo es que cada release sea **trazable, documentado, y reproducible** sin esfuerzo manual.

### 43.2 Objetivo de negocio

- Releases automatizados sin intervención humana.
- Changelogs precisos y actualizados (no manuales).
- GitHub Releases con notas de versión y artifacts adjuntos.
- Rollback instantáneo a cualquier versión histórica.

### 43.3 Prácticas recomendadas (exhaustivo)

1. **Semantic Release:** automatizar versión + changelog + GitHub Release + npm publish basándose en Conventional Commits. `feat:` → minor, `fix:` → patch, `BREAKING CHANGE` → major. Fuente: [semantic-release](https://github.com/semantic-release/semantic-release)
2. **Changesets:** alternativa más controlada. Dev crea changeset file → CI agrupa y genera changelog en merge. Más suitable para monorepos. Fuente: [Changesets](https://github.com/changesets/changesets)
3. **Conventional Commits enforcement:** commitlint en CI para validar formato. Sin conventional commits → semantic-release no sabe qué bumpear. Husky pre-commit hook. Fuente: [Conventional Commits](https://www.conventionalcommits.org/)
4. **Changelog generation:** automático desde conventional commits. `@semantic-release/changelog` o `conventional-changelog`. No manually maintained CHANGELOG.md.
5. **GitHub Releases:** semantic-release crea release automáticamente con tag, changelog, y artifacts. GitHub genera release notes automáticamente. Fuente: [GitHub Releases](https://docs.github.com/en/repositories/releasing-projects-on-github/managing-releases-in-a-repository)
6. **Release branches:** `main` → releases automáticos. `next` para pre-releases. `maintenance` para patches de versiones anteriores.
7. **Hotfix releases:** branch `hotfix/*` → fix → merge a main + release patch. No esperar al próximo release cycle.
8. **Release assets:** adjuntar binaries, Docker images, SBOMs a GitHub Releases. Download links estables por versión.
9. **Pre-release channels:** `alpha`, `beta`, `rc` para testing antes de stable. npm dist-tags: `@next`, `@latest`.
10. **Release verification:** post-release smoke tests para verificar que el release publicado funciona. Rollback automático si falla.

### 43.4 Herramientas comunes

| Categoría          | Herramientas                                           |
| ------------------ | ------------------------------------------------------ |
| Versioning         | semantic-release, changesets, commit-and-tag-version   |
| Changelog          | conventional-changelog, auto-changelog, release-please |
| Distribution       | npm, GitHub Releases, PyPI, Docker Hub                 |
| Commit enforcement | commitlint, husky, commitizen                          |
| Release automation | release-please (Google), semantic-release              |

### 43.5 Mejores prácticas

- Conventional Commits comorequisito (commitlint + husky).
- Semantic-release para proyectos con npm/Docker.
- Changesets para monorepos con releases independentes.
- Changelogs generados, nunca manuales.
- GitHub Releases con artifacts adjuntos.
- Pre-release channels para testing amplio.

### 43.6 Errores comunes (anti-patrones)

- Changelogs manuales → incompletos, desactualizados.
- Sin conventional commits → semantic-release no funciona.
- Releases sin artifacts → users no pueden instalar.
- Version bumps manuales → human error.
- Sin hotfix process → fix crítico espera al próximo release.
- Pre-releases sin testing → early adopters reciben bugs.

### 43.7 Métricas recomendadas

- Time from merge to release (target: < 5 min con automation).
- Release frequency (target: on-demand, not batched).
- Changelog accuracy (target: 100% de cambios documentados).
- Hotfix lead time (target: < 1 hour from fix to release).
- Pre-release adoption rate.

### 43.8 Fuentes

- https://github.com/semantic-release/semantic-release
- https://github.com/changesets/changesets
- https://www.conventionalcommits.org/
- https://docs.github.com/en/repositories/releasing-projects-on-github/managing-releases-in-a-repository
- https://github.com/googleapis/release-please

### 43.9 Ejemplo práctico — GitHub Actions

```yaml
# .github/workflows/release.yml
# Semantic Release automatizado con changelog + GitHub Release
name: Release

on:
  push:
    branches: [main]

permissions:
  contents: write
  issues: write
  pull-requests: write
  id-token: write

jobs:
  release:
    name: Semantic Release
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683 # v4.2.2
        with:
          fetch-depth: 0 # Full history for semantic-release

      - uses: actions/setup-node@49933ea5288caeca8642d1e84afbd3f7d6820020 # v4.4.0
        with:
          node-version-file: '.nvmrc'
          cache: npm

      - run: npm ci

      - name: Release
        run: npx semantic-release
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          NPM_TOKEN: ${{ secrets.NPM_TOKEN }}

# .releaserc.json (config):
# {
#   "branches": ["main"],
#   "plugins": [
#     "@semantic-release/commit-analyzer",
#     "@semantic-release/release-notes-generator",
#     "@semantic-release/changelog",
#     "@semantic-release/npm",
#     "@semantic-release/github",
#     "@semantic-release/git"
#   ]
# }
```

---

## 44. ChatOps & Notifications

### 44.1 Descripción

ChatOps integra los workflows de CI/CD en **herramientas de comunicación** (Slack, Teams, Discord) para que el equipo vea el estado de deploys, reciba alertas, y ejecute comandos desde el chat. Elimina la necesidad de cambiar de ventana para verificar estado. Las notificaciones de CI/CD son críticas para la visibilidad del equipo: deploy exitoso, fallo de test, aprobación pendiente.

### 44.2 Objetivo de negocio

- Visibilidad inmediata: el equipo sabe cuándo algo falla sin buscar.
- Reducir time-to-awareness (MTTR empieza cuando alguien se entera).
- Facilitar aprobaciones: deploy approval desde Slack.
- Transparencia: cada deploy es visible para todos.

### 44.3 Prácticas recomendadas (exhaustivo)

1. **GitHub → Slack integration:** GitHub Slack app para notificaciones de PR, issues, deployments. Configurar channels por topic (#deployments, #security-alerts). Fuente: [GitHub Slack](https://github.com/integrations/slack)
2. **Workflow notifications:** `slack-github-action` o `actions/github-script` para enviar a Slack/Teams. Notificar: CI success, CI failure, deploy start/end, approval request. Fuente: [Slack GitHub Action](https://github.com/slackapi/slack-github-action)
3. **Approval via chat:** GitHub Environments con `wait-for-deployment` + Slack interactive message para approve/reject. Reducir friction para deployments. Fuente: [GitHub Environments](https://docs.github.com/en/actions/deployment/targeting-different-environments/using-environments-for-deployment)
4. **Alert routing:** severity-based routing. CRITICAL → PagerDuty + Slack #incidents. WARNING → Slack #alerts. INFO → Slack #ci-cd-feed.
5. **ChatOps commands:** bot que responde a comandos: `/deploy production`, `/status`, `/rollback v1.2.3`. GitHub Actions como backend. Fuente: [ChatOps — GitHub](https://github.com/features/actions)
6. **Thread organization:** cada PR o deploy en su propio thread de Slack. No mezclar notificaciones. Facilita tracking.
7. **Digest notifications:** en lugar de 50 notificaciones/día, un digest diario de resumen: builds exitosos, pendientes, fallidos.
8. **Escalation automático:** si un alert no es acknowledged en 15 min → escalar a on-call. PagerDuty integration. Fuente: [PagerDuty](https://www.pagerduty.com/)
9. **Deploy announcements:** auto-post en #releases cuando hay deploy exitoso con changelog summary.
10. **Mute en off-hours:** suppress notificaciones no-críticas en horario nocturnal. CRITICAL siempre.

### 44.4 Herramientas comunes

| Categoría      | Herramientas                                |
| -------------- | ------------------------------------------- |
| Chat platforms | Slack, Microsoft Teams, Discord, Mattermost |
| Integrations   | GitHub Slack App, GitHub Teams App          |
| Actions        | slack-github-action, actions/github-script  |
| Incident       | PagerDuty, OpsGenie, Incident.io            |
| ChatOps bots   | Hubot, Lita, Microsoft Bot Framework        |

### 44.5 Mejores prácticas

- Channels separados: #deployments, #security, #incidents.
- Severity-based routing: CRITICAL ≠ INFO.
- Interactive approvals: approve/reject desde Slack.
- Thread organization: un thread por deploy/PR.
- Digest en lugar de flood.
- Mute en off-hours.

### 44.6 Errores comunes (anti-patrones)

- Too many notifications → team ignora todas (alert fatigue).
- Single channel para todo → important notifications lost in noise.
- No interactive approvals → team still goes to GitHub to approve.
- No escalation → alerts unacknowledged for hours.
- Raw logs en Slack → unreadable, useless.
- Notifications without context → "CI failed" without link or details.

### 44.7 Métricas recomendadas

- Time to awareness (target: < 1 min for critical alerts).
- Alert acknowledgment rate (target: > 95%).
- Alert fatigue score (notifications ack'd without reading).
- Deployment visibility (target: 100% of deploys announced).
- Approval response time (target: < 30 min).

### 44.8 Fuentes

- https://github.com/integrations/slack
- https://github.com/slackapi/slack-github-action
- https://docs.github.com/en/actions/deployment/targeting-different-environments/using-environments-for-deployment
- https://www.pagerduty.com/
- https://github.com/features/actions

### 44.9 Ejemplo práctico — GitHub Actions

```yaml
# .github/workflows/chatops-notify.yml
# Notificaciones a Slack para CI/CD events
name: ChatOps Notifications

on:
  workflow_run:
    workflows: ['CI', 'Deploy']
    types: [completed]
  pull_request:
    types: [review_requested]

permissions:
  contents: read

jobs:
  notify-success:
    name: Notify Success
    runs-on: ubuntu-latest
    if: ${{ github.event.workflow_run.conclusion == 'success' }}
    steps:
      - uses: slackapi/slack-github-action@485a9d42d3a744447e24dd72388f001f44b18bf5 # v2.1.0
        with:
          webhook: ${{ secrets.SLACK_WEBHOOK }}
          webhook-type: incoming-webhook
          payload: |
            {
              "blocks": [
                {
                  "type": "header",
                  "text": {"type": "plain_text", "text": "✅ ${{ github.event.workflow_run.name }} succeeded"}
                },
                {
                  "type": "section",
                  "fields": [
                    {"type": "mrkdwn", "text": "*Repository:*\n${{ github.repository }}"},
                    {"type": "mrkdwn", "text": "*Branch:*\n${{ github.event.workflow_run.head_branch }}"},
                    {"type": "mrkdwn", "text": "*Commit:*\n`${{ github.event.workflow_run.head_sha }}`"},
                    {"type": "mrkdwn", "text": "*Duration:*\n${{ github.event.workflow_run.updated_at }}"}
                  ]
                },
                {
                  "type": "actions",
                  "elements": [
                    {
                      "type": "button",
                      "text": {"type": "plain_text", "text": "View Run"},
                      "url": "${{ github.event.workflow_run.html_url }}"
                    }
                  ]
                }
              ]
            }

  notify-failure:
    name: Notify Failure
    runs-on: ubuntu-latest
    if: ${{ github.event.workflow_run.conclusion == 'failure' }}
    steps:
      - uses: slackapi/slack-github-action@485a9d42d3a744447e24dd72388f001f44b18bf5 # v2.1.0
        with:
          webhook: ${{ secrets.SLACK_INCIDENTS_WEBHOOK }}
          webhook-type: incoming-webhook
          payload: |
            {
              "blocks": [
                {
                  "type": "header",
                  "text": {"type": "plain_text", "text": "🚨 ${{ github.event.workflow_run.name }} FAILED"}
                },
                {
                  "type": "section",
                  "text": {"type": "mrkdwn", "text": "*${{ github.repository }}* — `${{ github.event.workflow_run.head_sha }}`\n<${{ github.event.workflow_run.html_url }}|View Run>"}
                }
              ]
            }
```

---

## 45. Documentation as Code

### 45.1 Descripción

Documentation as Code trata la documentación como **código fuente**: versionada, testada, y desplegada automáticamente desde el mismo pipeline de CI/CD. Incluye: auto-generated API docs (OpenAPI/Swagger), changelogs generados, documentation sites (Docusaurus, MkDocs, VitePress), y docs que se publican automáticamente con cada release. El problema que resuelve: docs desactualizadas porque nadie las actualiza manualmente.

### 45.2 Objetivo de negocio

- Docs siempre actualizadas (generadas desde código).
- API docs que reflejan el código actual (no el código de hace 6 meses).
- Documentation site desplegada automáticamente con cada release.
- Changelog automático (ya cubierto en Release Management).

### 45.3 Prácticas recomendadas (exhaustivo)

1. **OpenAPI/Swagger auto-generation:** generar spec desde código (nestia, swagger-jsdoc, express-openapi). El spec es la fuente de verdad para API docs. Fuente: [OpenAPI](https://www.openapis.org/)
2. **API docs in pipeline:** generar y publicar API docs en cada release. Stoplight, Redoc, Swagger UI. Deploy a GitHub Pages o Vercel. Fuente: [Redoc](https://redocly.com/)
3. **Documentation sites:** Docusaurus, VitePress, MkDocs Material. Deploy automático a GitHub Pages/Netlify/Vercel. Fuente: [Docusaurus](https://docusaurus.io/), [VitePress](https://vitepress.dev/)
4. **Doc testing:** link checker (markdown-link-check), spell checker, API spec validation (swagger-cli validate). Ejecutar en CI. Fuente: [markdown-link-check](https://github.com/tcort/markdown-link-check)
5. **Architecture Decision Records (ADRs):** documentos que registran decisiones de arquitectura. Plantilla: context → decision → consequences. Directories como `docs/adr/`. Fuente: [ADR](https://adr.github.io/)
6. **Runbook automation:** runbooks ejecutables (no solo docs). Combos de docs + scripts. PagerDuty Runbooks, GitHub wiki con scripts. Fuente: [PagerDuty Runbooks](https://support.pagerduty.com/docs/runbook-automation)
7. **Code-generated docs:** TypeDoc (TypeScript), JSDoc → HTML, GoDoc. Generar docs desde comments del código. Ejecutar en CI. Fuente: [TypeDoc](https://typedoc.org/)
8. **Changelog as Code:** semantic-release genera CHANGELOG.md. No mantener manualmente.
9. **Doc freshness alerts:** alertas si un doc no se ha actualizado en > 6 meses. Cron job en CI.
10. **Component Storybook:** stories como documentación interactiva de componentes. Fuente: [Storybook](https://storybook.js.org/)

### 45.4 Herramientas comunes

| Categoría      | Herramientas                                 |
| -------------- | -------------------------------------------- |
| API docs       | Swagger UI, Redoc, Stoplight, Postman        |
| Doc sites      | Docusaurus, VitePress, MkDocs Material, Hugo |
| Code docs      | TypeDoc, JSDoc, GoDoc                        |
| Validation     | swagger-cli, markdown-link-check, vale       |
| ADRs           | adr-tools, markdown templates                |
| Component docs | Storybook, React Styleguidist                |

### 45.5 Mejores prácticas

- OpenAPI spec generada desde código (nunca manuales).
- Doc site deploy automático con cada release.
- Link checking en CI (broken links = bad UX).
- ADRs para decisiones de arquitectura (no solo código).
- Runbooks ejecutables (docs + scripts, no solo texto).
- Doc freshness alerts (docs viejas = docs inútiles).

### 45.6 Errores comunes (anti-patrones)

- API docs manuales → desactualizadas con el primer cambio.
- Doc site deploy manual → docs no reflejan última versión.
- Sin link checking → links rotos acumulados.
- Docs sin versioning → usuarios de v1 ven docs de v2.
- Doc como afterthought → nunca se escribe.
- Runbooks sin testing → no funcionan cuando se necesitan.

### 45.7 Métricas recomendadas

- API spec freshness (target: spec = código actual).
- Doc site deployment frequency (target: cada release).
- Broken links count (target: 0).
- Doc coverage (target: > 80% de APIs documentadas).
- Doc freshness (target: 0 docs > 6 meses sin update).

### 45.8 Fuentes

- https://www.openapis.org/
- https://redocly.com/
- https://docusaurus.io/
- https://vitepress.dev/
- https://typedoc.org/
- https://adr.github.io/

### 45.9 Ejemplo práctico — GitHub Actions

```yaml
# .github/workflows/docs.yml
# Generate and deploy API docs + documentation site
name: Documentation

on:
  push:
    branches: [main]
    paths: ['apps/server/src/**', 'docs/**']

permissions:
  contents: read
  pages: write
  id-token: write

jobs:
  api-docs:
    name: Generate API Docs
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683 # v4.2.2
      - uses: actions/setup-node@49933ea5288caeca8642d1e84afbd3f7d6820020 # v4.4.0
        with:
          node-version-file: '.nvmrc'
          cache: npm
      - run: npm ci
      - name: Generate OpenAPI spec
        run: npx ts-node apps/server/src/swagger.ts > docs/api/openapi.json
      - name: Validate spec
        run: npx @redocly/cli lint docs/api/openapi.json
      - uses: actions/upload-artifact@ea165f8d65b6e75b540449e92b4886f43607fa02 # v4.6.2
        with:
          name: api-docs
          path: docs/api/

  doc-links:
    name: Check Documentation Links
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683 # v4.2.2
      - name: Check markdown links
        run: |
          npx markdown-link-check docs/**/*.md --retry --quiet
```

---

## 46. Feature Flags Deep Dive

### 46.1 Descripción

Los feature flags van más allá del progressive delivery para convertirse en un **primitivo fundamental de CI/CD**. Separan deploy (código desplegado) de release (feature visible). Esto permite: deploy continuo sin features visibles, testing en producción con tráfico real, y rollback instantáneo sin redeploy. El challenge principal es el **flag lifecycle management**: flags que no se limpian se convierten en dead code que nadie se atreve a quitar.

### 46.2 Objetivo de negocio

- Deploy continuo: código en producción pero no visible para usuarios.
- Testing en producción: habilitar feature para 1% de usuarios, medir, decidir.
- Rollback instantáneo: deshabilitar feature flag = rollback sin redeploy.
- Kill switch: deshabilitar feature problemática en segundos.

### 46.3 Prácticas recomendadas (exhaustivo)

1. **Flag lifecycle management:** crear → activar → medir → cleanup. Cada flag tiene fecha de expiración. Dashboard de flags activos. Alertas si flag > 30 días. Fuente: [LaunchDarkly](https://launchdarkly.com/)
2. **Flag types:** release flags (temporary, 1-2 semanas), experiment flags (A/B testing, 1-4 semanas), ops flags (permanent, infra config), permission flags (user roles). Cada tipo tiene lifecycle diferente. Fuente: [Feature Flags Patterns — Martin Fowler](https://martinfowler.com/articles/feature-toggles.html)
3. **Cleanup automation:** ci pipeline detecta flags obsoletos. Renovate-style: crear PR para remover flag code. Configurable SLA por flag type.
4. **Flag as code:** definir flags en código/config, no en UI solamente. Version control para flags. Git-based flag management. Fuente: [OpenFeature](https://openfeature.dev/)
5. **Flag evaluation in CI:** test con flag ON y OFF. Verificar que ambos code paths funcionan. No solo test con flag en estado default.
6. **Progressive rollout:** start percentage → increment → full rollout. Cada step con monitoring. Auto-pause si error rate > threshold. Fuente: [Flagger](https://flagger.app/)
7. **User targeting:** target por user ID, segment, percentage. No solo percentage global. Targeting rules versionadas.
8. **Audit trail:** quién creó/modificó/desactivó cada flag. Compliance requirement para flags en producción.
9. **Flag health monitoring:** track error rate, latency, conversion por flag variant. Dashboard de impacto por flag.
10. **Big flag cleanup events:** quarterly "flag cleanup day" para remover flags obsoletos. Team-wide event.

### 46.4 Herramientas comunes

| Categoría              | Herramientas                                          |
| ---------------------- | ----------------------------------------------------- |
| Feature flag platforms | LaunchDarkly, Unleash, Flagsmith, Split.io, ConfigCat |
| Open standard          | OpenFeature                                           |
| Git-based              | Featbit, Undici, gitflags                             |
| Experiment             | GrowthBook, Statsig, Eppo                             |
| Custom                 | Environment variables + config (simple flags)         |

### 46.5 Mejores prácticas

- Cada flag tiene dueño y fecha de expiración.
- Cleanup automatizado: flags > 30 días → alerta, > 60 días → auto-PR.
- Test BOTH paths (flag ON y OFF) en CI.
- Flags en código son versionados (git).
- Release flags son temporales por diseño.
- Quarterly cleanup events.

### 46.6 Errores comunes (anti-patrones)

- Flags sin cleanup → acumulación de dead code.
- Flags permanentes disfrazadas de temporales → technical debt.
- Sin testing del path OFF → code path roto sin detectar.
- Flags sin audit trail → cambios no rastreables.
- Too many flags → configuration complexity explosion.
- Flags en producción sin monitoring → features broken sin detectar.

### 46.7 Métricas recomendadas

- Active flags count (target: < 20 por proyecto).
- Average flag age (target: < 30 días para release flags).
- Flag cleanup rate (target: 100% removidos después de expiración).
- Both-path test coverage (target: 100% de flags testados ON y OFF).
- Flag-related incidents (target: 0).

### 46.8 Fuentes

- https://martinfowler.com/articles/feature-toggles.html
- https://launchdarkly.com/
- https://openfeature.dev/
- https://flagger.app/
- https://docs.getunleash.io/

### 46.9 Ejemplo práctico — GitHub Actions

```yaml
# .github/workflows/feature-flag-test.yml
# Test both flag paths (ON and OFF) in CI
name: Feature Flag Tests

on:
  pull_request:

permissions:
  contents: read

jobs:
  test-both-paths:
    name: Test Flag ON & OFF
    runs-on: ubuntu-latest
    strategy:
      matrix:
        flag_state: ['true', 'false']
    steps:
      - uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683 # v4.2.2
      - uses: actions/setup-node@49933ea5288caeca8642d1e84afbd3f7d6820020 # v4.4.0
        with:
          node-version-file: '.nvmrc'
          cache: npm
      - run: npm ci
      - name: Test with feature flag ${{ matrix.flag_state }}
        run: npm run test
        env:
          FEATURE_NEW_UI: ${{ matrix.flag_state }}

  flag-cleanup-check:
    name: Check Flag Expiry
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683 # v4.2.2
      - name: Detect expired flags
        run: |
          EXPIRED=$(grep -rn "FEATURE_.*_EXPIRY" apps/*/src/ | while read line; do
            EXPIRY=$(echo "$line" | grep -oP '\d{4}-\d{2}-\d{2}')
            if [[ "$EXPIRY" < "$(date +%Y-%m-%d)" ]]; then
              echo "$line"
            fi
          done)
          if [ -n "$EXPIRED" ]; then
            echo "::warning::Expired feature flags detected:"
            echo "$EXPIRED"
            exit 1
          fi
```

---

## 47. Self-hosted Runners & Fleet Management

### 47.1 Descripción

Los self-hosted runners son **máquinas propias** ejecutando jobs de CI/CD en lugar de los runners managed de GitHub. Son necesarios cuando: la app necesita hardware especial (GPU, ARM), los builds son demasiado pesados para runners cloud, hay restricciones de compliance (datos no pueden salir de la red), o se necesita reducir costos a escala. El fleet management cubre: autoscaling, security, maintenance, y cost tracking.

### 47.2 Objetivo de negocio

- Reducir costos de CI/CD a escala (self-hosted puede ser 50-80% más barato).
- Cumplir compliance (builds dentro de la red corporativa).
- Hardware especial (GPU para ML, ARM para cross-compilation).
- Control total sobre el entorno de build.

### 47.3 Prácticas recomendadas (exhaustivo)

1. **Ephemeral runners:** un runner por job. Nunca reutilizar runners entre jobs (security + isolation). GitHub Actions: `runs-on: self-hosted` con label routing. Fuente: [Self-hosted runners](https://docs.github.com/en/actions/hosting-your-own-runners/managing-self-hosted-runners)
2. **Autoscaling:** escalar runners según demanda. Kubernetes-based: Actions Runner Controller (ARC). Docker-based: `summerwind/actions-runner`. Scale to zero en off-hours. Fuente: [ARC](https://github.com/actions/actions-runner-controller)
3. **Runner groups & labels:** organizar runners por tipo (linux, windows, gpu, arm). Labels para routing: `runs-on: [self-hosted, gpu]`. Environment isolation via groups.
4. **Security hardening:** network isolation, no internet access para runners de prod. Ephemeral VMs o containers. Audit logging. No secrets permanently stored.
5. **Maintenance automation:** auto-update runner software, OS patches, Docker images. Rolling updates sin downtime.
6. **Cost tracking:** medir costo de self-hosted (hardware + electricity + maintenance) vs. cloud runners. Break-even analysis.
7. **Runner health monitoring:** heartbeat checks, queue depth, job wait time. Alertas si runners no están responding.
8. **Resource limits:** CPU/memory/disk limits por job. Evitar un job resource-hungry afecte otros. Container-based isolation.
9. **Image management:** custom runner images con tools pre-installed. Versioned images. Packer/Terraform para golden images.
10. **Disaster recovery:** backup runners en otra zona/region. Failover automático si primary falla.

### 47.4 Herramientas comunes

| Categoría          | Herramientas                                |
| ------------------ | ------------------------------------------- |
| Runner controllers | Actions Runner Controller (ARC), summerwind |
| Orchestration      | Kubernetes, Docker, Nomad                   |
| Image building     | Packer, AMI Builder, Docker                 |
| Monitoring         | Prometheus + Grafana, Datadog               |
| Cost tracking      | Kubecost, custom dashboards                 |

### 47.5 Mejores prácticas

- Ephemeral runners SIEMPRE (un job = un runner).
- Autoscaling con scale-to-zero.
- Security: network isolation, no persistent state.
- Cost tracking: self-hosted vs cloud comparison.
- Health monitoring: alertas por queue depth.
- Image versioning: golden images con tools pre-installed.

### 47.6 Errores comunes (anti-patrones)

- Runner reuse entre jobs → security contamination.
- No autoscaling → runners idle o overwhelmed.
- Persistent runners → state accumulation, security risk.
- No cost tracking → self-hosted más caro que cloud sin saberlo.
- Un runner type para todo → GPU jobs waiting behind CPU jobs.
- No health monitoring → broken runners undetected.

### 47.7 Métricas recomendadas

- Runner utilization rate (target: 70-85%).
- Queue wait time (target: < 2 min).
- Cost per build (self-hosted vs cloud).
- Runner uptime (target: > 99.5%).
- Scale-to-zero time (target: nights/weekends).

### 47.8 Fuentes

- https://docs.github.com/en/actions/hosting-your-own-runners/managing-self-hosted-runners
- https://github.com/actions/actions-runner-controller
- https://github.com/actions/actions-runner-controller/blob/master/docs/README.md
- https://packer.io/
- https://docs.github.com/en/actions/hosting-your-own-runners/about-self-hosted-runners

### 47.9 Ejemplo práctico — GitHub Actions

```yaml
# .github/workflows/self-hosted.yml
# Example with self-hosted runners + autoscaling
name: Self-hosted CI

on:
  pull_request:

jobs:
  build:
    name: Build (self-hosted)
    runs-on: [self-hosted, linux, x64]
    container:
      image: node:22-alpine
    steps:
      - uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683 # v4.2.2
      - run: npm ci
      - run: npm run build

  build-arm:
    name: Build (ARM64)
    runs-on: [self-hosted, linux, arm64]
    steps:
      - uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683 # v4.2.2
      - run: npm ci
      - run: npm run build

# ARC (Actions Runner Controller) for autoscaling:
# apiVersion: actions.summerwind.dev/v1alpha1
# kind: RunnerDeployment
# metadata:
#   name: github-runner
# spec:
#   replicas: 0  # Scale to zero
#   selector: {}
#   template:
#     spec:
#       repository: freelancer-soluctions/project-one
#       labels: [self-hosted, linux, x64]
#       minRunners: 0
#       maxRunners: 10
```

---

## 48. Multi-region / Edge Deployment

### 48.1 Descripción

El deployment multi-region lleva la aplicación a **múltiples geographic locations** para: reducir latencia (usuarios más cerca del servidor), mejorar disponibilidad (si una region falla, otra toma el tráfico), y cumplir regulations (datos deben permanecer en cierta region). Cubre: CDN deployment, edge functions, multi-region databases, y traffic routing. Para apps globales, esto es crítico.

### 48.2 Objetivo de negocio

- Latencia baja para usuarios globales (CDN + edge).
- Alta disponibilidad: failover entre regions.
- Compliance: datos en regiones específicas (GDPR, data residency).
- Disaster recovery: backup en otra region.

### 48.3 Prácticas recomendadas (exhaustivo)

1. **CDN deployment:** Cloudflare, CloudFront, Fastly para assets estáticos. Deploy automático desde CI/CD. Cache invalidation en cada release. Fuente: [Cloudflare Pages](https://pages.cloudflare.com/)
2. **Edge functions:** Cloudflare Workers, Vercel Edge Functions, Deno Deploy. Deploy a edge para APIs de baja latencia. CI/CD para edge deployment. Fuente: [Cloudflare Workers](https://workers.cloudflare.com/)
3. **Multi-region database:** read replicas por region, write to primary. Failover automático. CockroachDB, YugabyteDB para multi-region nativo. Fuente: [CockroachDB](https://www.cockroachlabs.com/)
4. **Traffic routing:** DNS-based (Route53, Cloudflare DNS) o service mesh (Istio, Linkerd). Weighted routing para canary entre regions. Health checks para failover.
5. **Region-aware deployment:** desplegar a regions en orden (US → EU → APAC). Canary en una region antes de global. Auto-rollback por region.
6. **Data residency:** GDPR requiere datos EU en EU. Architecture decisions: colocar datos en la region correcta. Encryption at rest por region.
7. **Immutable infrastructure:** cada region ejecuta el mismo artifact. No regional builds. Build once → deploy everywhere.
8. **Regional health checks:** health endpoints por region. Alertas si una region falla. Auto-failover a healthy regions.
9. **Cache strategy per region:** cache invalidation cross-region. CDN purge en releases. Edge cache TTL configuration.
10. **Cost optimization:** different pricing per region. Spot instances en non-critical regions. Reserved capacity para primary.

### 48.4 Herramientas comunes

| Categoría        | Herramientas                                    |
| ---------------- | ----------------------------------------------- |
| CDN              | Cloudflare, CloudFront, Fastly, Akamai          |
| Edge compute     | Cloudflare Workers, Vercel Edge, Deno Deploy    |
| Multi-region DB  | CockroachDB, YugabyteDB, Aurora Global, Spanner |
| DNS routing      | Route53, Cloudflare DNS, Azure Traffic Manager  |
| Service mesh     | Istio, Linkerd, Cilium                          |
| IaC multi-region | Terraform workspaces, Pulumi                    |

### 48.5 Mejores prácticas

- Build once, deploy everywhere (immutable artifacts).
- CDN para assets estáticos siempre.
- Canary por region antes de global rollout.
- Data residency compliance from design.
- Health checks per region.
- Cost optimization per region.

### 48.6 Errores comunes (anti-patrones)

- Regional builds → inconsistency between regions.
- No CDN → slow asset delivery globally.
- Data residency as afterthought → expensive re-architecture.
- No failover testing → region outage cascades.
- Global deploy without canary → all regions affected simultaneously.
- Inconsistent cache invalidation → stale content in some regions.

### 48.7 Métricas recomendadas

- Global latency p95 (target: < 200ms per region).
- Regional availability (target: 99.9% per region).
- Failover time (target: < 30 seconds).
- CDN cache hit rate (target: > 90%).
- Cost per region per month.

### 48.8 Fuentes

- https://pages.cloudflare.com/
- https://workers.cloudflare.com/
- https://www.cockroachlabs.com/
- https://docs.aws.amazon.com/route53/
- https://www.cloudflare.com/learning/performance/what-is-cdn/

### 48.9 Ejemplo práctico — GitHub Actions

```yaml
# .github/workflows/multi-region-deploy.yml
# Deploy to multiple regions with canary
name: Multi-region Deploy

on:
  push:
    branches: [main]

permissions:
  contents: read
  id-token: write

jobs:
  deploy-region:
    name: Deploy to ${{ matrix.region }}
    runs-on: ubuntu-latest
    strategy:
      max-parallel: 1 # Sequential rollout
      matrix:
        region: [us-east-1, eu-west-1, ap-southeast-1]
        include:
          - region: us-east-1
            environment: production-us
          - region: eu-west-1
            environment: production-eu
          - region: ap-southeast-1
            environment: production-apac
    environment:
      name: ${{ matrix.environment }}
    steps:
      - uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683 # v4.2.2

      - name: Deploy to ${{ matrix.region }}
        run: |
          echo "Deploying to ${{ matrix.region }}"
          # Deploy the SAME artifact to this region

      - name: Health check
        run: |
          sleep 30
          curl -sf https://${{ matrix.region }}.project-one.example.com/health || exit 1

  verify-global:
    name: Verify Global Health
    runs-on: ubuntu-latest
    needs: deploy-region
    steps:
      - name: Check all regions
        run: |
          for region in us-east-1 eu-west-1 ap-southeast-1; do
            curl -sf "https://${region}.project-one.example.com/health" || exit 1
          done
          echo "All regions healthy ✅"
```

---

## 49. API Versioning in CI/CD

### 49.1 Descripción

El versionado de APIs en CI/CD gestiona **breaking changes** de forma segura. Cuando una API pública cambia, los clientes existentes no deben romperse. Estrategias: URL versioning (`/v1/`, `/v2/`), header versioning (`Accept: application/vnd.api+json;version=2`), y content negotiation. El CI/CD pipeline debe detectar breaking changes automáticamente y rechazar PRs que rompan contratos.

### 49.2 Objetivo de negocio

- Evitar breaking changes que rompan clientes existentes.
- Deprecation warnings antes de remove endpoints.
- Breaking change detection automatizado en CI.
- API compatibility entre versiones.

### 49.3 Prácticas recomendadas (exhaustivo)

1. **OpenAPI diff en CI:** comparar spec nueva vs spec anterior. Detectar breaking changes automáticamente. `openapi-diff`, `oasdiff`. Gate: rechazar PR si breaking change sin version bump. Fuente: [oasdiff](https://github.com/Tufin/oasdiff)
2. **API design review:** review automático de API changes. linting de OpenAPI spec (Spectral). Fuente: [Spectral](https://github.com/stoplightio/spectral)
3. **Deprecation policy:** endpoints deprecated por N versiones antes de remove. Header `Sunset: <date>`. Link a migration guide. Fuente: [RFC 8594](https://datatracker.ietf.org/doc/html/rfc8594)
4. **Version strategy:** URL versioning para public APIs (simple, explicit). Header versioning para internal APIs (flexible). Content negotiation para REST purists.
5. **Contract testing with consumers:** Pact o similar para verificar que provider no rompe contratos de consumers. Fuente: [Pact](https://pact.io/)
6. **Breaking change categories:** addition (safe), deprecation (warning), removal (breaking), modification (maybe breaking). CI debe clasificar automáticamente.
7. **Migration guides:** auto-generate migration guide cuando hay breaking changes. Changelog con sección "Breaking Changes".
8. **API changelog:** documento automático de cambios por versión. Generado desde OpenAPI diff.
9. **Client SDK generation:** auto-generate client SDKs desde OpenAPI spec. Publicar a npm/PyPI con cada release.
10. **Version negotiation testing:** test que verifica que clients antiguos funcionan con nueva API version.

### 49.4 Herramientas comunes

| Categoría             | Herramientas                              |
| --------------------- | ----------------------------------------- |
| API spec              | OpenAPI, AsyncAPI, GraphQL Schema         |
| Diff/breaking changes | oasdiff, openapi-diff, swagger-cli        |
| Linting               | Spectral, optic, redocly                  |
| Contract testing      | Pact, Spring Cloud Contract               |
| SDK generation        | openapi-generator, swagger-codegen, orval |
| API gateway           | Kong, AWS API Gateway, Apigee             |

### 49.5 Mejores prácticas

- OpenAPI diff en CI: detectar breaking changes automáticamente.
- Deprecation warnings por al menos 2 versiones antes de removal.
- Breaking change sin version bump → CI fails.
- Auto-generate SDKs from spec.
- Migration guides para breaking changes.
- Contract testing con consumers reales.

### 49.6 Errores comunes (anti-patrones)

- Breaking changes sin version bump → clientes se rompen.
- Deprecation sin removal timeline → deprecations acumulados.
- Sin OpenAPI diff → breaking changes no detectados.
- Version sin migration guide → clientes no saben cómo migrar.
- API changes sin review → inconsistencias de diseño.
- No contract testing → provider rompe consumer silenciosamente.

### 49.7 Métricas recomendadas

- Breaking changes sin approval (target: 0).
- API version coverage (target: 100% de públicas bajo spec).
- Deprecation compliance (target: 100% removidos después de Sunset).
- Client SDK freshness (target: < 1 week after release).
- Contract test pass rate (target: 100%).

### 49.8 Fuentes

- https://github.com/Tufin/oasdiff
- https://github.com/stoplightio/spectral
- https://datatracker.ietf.org/doc/html/rfc8594
- https://pact.io/
- https://openapi-generator.tech/

### 49.9 Ejemplo práctico — GitHub Actions

```yaml
# .github/workflows/api-versioning.yml
# Detect breaking changes in API spec
name: API Version Check

on:
  pull_request:
    paths: ['apps/server/src/**', 'docs/api/**']

permissions:
  contents: read
  pull-requests: write

jobs:
  breaking-change-detect:
    name: Detect API Breaking Changes
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683 # v4.2.2
        with:
          fetch-depth: 0 # Need base branch

      - name: Generate new spec
        run: |
          npx ts-node apps/server/src/swagger.ts > /tmp/new-spec.json

      - name: Get base spec
        run: |
          git show origin/main:docs/api/openapi.json > /tmp/base-spec.json || echo '{}' > /tmp/base-spec.json

      - name: Check for breaking changes
        run: |
          npx @oasdiff/cli diff /tmp/base-spec.json /tmp/new-spec.json \
            --fail-on ERR \
            --format text

      - name: Validate spec
        run: |
          npx @redocly/cli lint /tmp/new-spec.json \
            --extends recommended

      - name: Comment PR
        if: failure()
        uses: actions/github-script@60a0d83039c74a4aee543508d2ffcb1c3799cdea # v7.0.1
        with:
          script: |
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: '⚠️ **Breaking API changes detected!** Please review the diff and bump the API version if necessary.'
            })
```

---

## 50. AI/ML en CI/CD (MLOps + AI-assisted Development)

### 50.1 Descripción

La integración de inteligencia artificial y machine learning en los pipelines de CI/CD abarca dos dimensiones: (a) **AI-assisted development** — herramientas de IA que aceleran la escritura, revisión y testing de código (GitHub Copilot, Claude, Cursor), y (b) **MLOps** — pipelines especializados para el ciclo de vida de modelos ML: desde datos de entrenamiento hasta serving en producción, con monitoreo de drift y retraining automático.

### 50.2 Objetivo de negocio

| Dimensión            | Beneficio                                      | Métrica                       |
| -------------------- | ---------------------------------------------- | ----------------------------- |
| AI code review       | Reducción de bugs en 40-60% (GitHub 2025)      | Defect density before/after   |
| AI test generation   | Cobertura de tests +30% con mismo esfuerzo     | Coverage delta                |
| MLOps pipelines      | Time-to-production de modelos: semanas → horas | Model deployment frequency    |
| Drift detection      | Prevención de degradación silenciosa           | Prediction accuracy over time |
| Automated retraining | Model freshness sin intervención manual        | Days since last training      |

### 50.3 Prácticas recomendadas

1. **AI code review como gate, no reemplazo**: Usar Copilot code review / SonarQube AI como primer filtro; human review para lógica de negocio y arquitectura
2. **AI-generated tests require human validation**: IA genera tests; humano valida que realmente testing business logic, no solo happy path
3. **Prompt quality gates**: Si el proyecto usa AI-generated content, validar con linters de prompt y output validators
4. **MLOps pipeline separado pero orquestado**: Data validation → Feature engineering → Training → Evaluation → Registry → Deployment → Monitoring
5. **Data validation gates**: Verificar schema, distribución, valores faltantes, data drift ANTES de entrenar (Great Expectations, Pandera)
6. **Model evaluation gates**: Métricas de accuracy, fairness, latency deben superar umbrales antes de promote a staging/production
7. **Model registry con promoción por políticas**: MLflow Model Registry con stages (Staging → Production) y approval gates
8. **Canary/shadow deployment de modelos**: Desplegar nuevo modelo a 5% del tráfico; comparar métricas con modelo actual antes de rollout completo
9. **Drift monitoring con retraining automático**: Monitorear prediction drift, feature drift, concept drift; trigger retraining cuando se superen umbrales
10. **AI para operaciones del pipeline**: Usar ML para predecir flaky tests, optimizar orchestration, triage de fallos automatizado

### 50.4 Herramientas comunes

| Herramienta                 | Categoría        | Uso en CI/CD                                |
| --------------------------- | ---------------- | ------------------------------------------- |
| GitHub Copilot              | AI code review   | Code review automático, sugerencias en PR   |
| SonarQube AI Code Assurance | AI quality gate  | Análisis de calidad con AI                  |
| SWE-agent / Devin           | AI coding agent  | Autonomía para tareas bien definidas        |
| MLflow                      | Model registry   | Versionado, staging, promotion de modelos   |
| Great Expectations          | Data validation  | Gates de calidad de datos antes de training |
| Pandera                     | Data validation  | Validación de schemas de datos              |
| Evidently AI                | Drift detection  | Monitoreo de data/model drift               |
| WhyLabs                     | Observability ML | Perf monitoring de modelos en producción    |
| Kubeflow Pipelines          | Orchestration ML | Pipelines ML como DAGs                      |
| MLServer                    | Model serving    | Serving de modelos con inference graph      |
| BentoML                     | Model serving    | Empaquetado y deployment de modelos         |
| CML (Continuous ML)         | CI/CD for ML     | DVC + CML para experiment tracking en CI    |

### 50.5 Mejores prácticas

- **Separar código de datos de código de modelo**: Repo de código ≠ repo de datos ≠ modelo artifacts (DVC para datos, MLflow para modelos)
- **Reproducibilidad del training**: Lock de versions de dependencias, seed random, containerized training
- **Fairness y bias checks como gates**: Usar Fairlearn, AI Fairness 360 como steps obligatorios antes de production
- **Costo de GPU tracking**: Los pipelines de training consumen GPU; trackear costo por experimento/modelo
- **Feature store**: Evitar feature engineering duplicado; Feast o Tecton como feature store centralizado
- **Shadow deployment**: Modelo nuevo recibe tráfico real pero no sirve respuestas; comparar quality sin riesgo

### 50.6 Errores comunes (anti-patrones)

| Anti-patrón                             | Problema                             | Solución                                         |
| --------------------------------------- | ------------------------------------ | ------------------------------------------------ |
| "AI review = no human review"           | AI misses business logic nuance      | AI as first filter; human for architecture/logic |
| Training without data validation        | Garbage in, garbage out              | Data validation gates mandatory                  |
| Model deployed without drift monitoring | Silent degradation over time         | Evidently/WhyLabs in monitoring pipeline         |
| No model versioning                     | Can't rollback broken model          | MLflow registry with stages                      |
| Training on production data             | Data leakage, compliance violation   | Separate training/production data access         |
| AI-generated tests without review       | Tests pass but don't test real logic | Human review of AI-generated test assertions     |

### 50.7 Métricas recomendadas

| Métrica                     | Target                  | Herramienta              |
| --------------------------- | ----------------------- | ------------------------ |
| AI code review adoption     | >70% PRs reviewed by AI | GitHub Copilot Analytics |
| Defect density delta        | -40% post-AI review     | SonarQube                |
| Model training → production | <24 hours               | Kubeflow/MLflow          |
| Data validation pass rate   | >95%                    | Great Expectations       |
| Model accuracy (production) | >threshold per use case | Evidently AI             |
| Drift detection latency     | <1 hour                 | WhyLabs                  |
| Model deployment frequency  | ≥1/week                 | MLflow + CI trigger      |

### 50.8 Fuentes

| #   | Fuente                                                                                                                                             |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | GitHub: AI Code Review — https://github.blog/changelog/2025-05-14-copilot-code-review/                                                             |
| 2   | DORA 2025 State of AI — https://dora.dev/dora-report-2025/                                                                                         |
| 3   | Microsoft MLOps Maturity Model — https://learn.microsoft.com/en-us/azure/architecture/ai-ml/guide/mlops-maturity-model                             |
| 4   | Google MLOps Reference Architecture — https://cloud.google.com/architecture/mlops-continuous-delivery-and-automation-pipelines-in-machine-learning |
| 5   | MLflow Documentation — https://mlflow.org/docs/latest/                                                                                             |
| 6   | Great Expectations — https://greatexpectations.io/                                                                                                 |
| 7   | Evidently AI — https://www.evidentlyai.com/                                                                                                        |
| 8   | CML (Continuous ML) — https://cml.dev/                                                                                                             |
| 9   | DVC (Data Version Control) — https://dvc.org/                                                                                                      |
| 10  | Fairlearn — https://fairlearn.org/                                                                                                                 |

### 50.9 Ejemplo práctico — GitHub Actions (YAML)

```yaml
name: MLOps Pipeline
on:
  push:
    paths: ['ml/**', 'data/schema/**']

jobs:
  data-validation:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683 # v4.2.2
      - name: Validate training data
        run: |
          pip install great_expectations pandera
          python ml/validate_data.py --input data/training.parquet --schema data/schema/training.json
        # Gates: schema match, missing values <5%, distribution shift <10%

  train-model:
    needs: data-validation
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683 # v4.2.2
      - name: Train model
        run: |
          python ml/train.py --config ml/config.yaml --output ml/model/
        env:
          MLFLOW_TRACKING_URI: ${{ secrets.MLFLOW_URI }}
      - name: Evaluate model
        run: |
          python ml/evaluate.py --model ml/model/ --test-data data/test.parquet \
            --min-accuracy 0.85 --min-fairness-score 0.80
        # Gates: accuracy >0.85, fairness >0.80, latency <200ms

  register-model:
    needs: train-model
    runs-on: ubuntu-latest
    steps:
      - name: Register in MLflow
        run: |
          mlflow models register --model-uri ml/model/ --name "my-model" --stage Staging
      - name: Create model card
        run: |
          python ml/create_model_card.py --model ml/model/ --metrics ml/metrics.json

  canary-deploy:
    needs: register-model
    runs-on: ubuntu-latest
    environment: staging
    steps:
      - name: Canary deploy (5% traffic)
        run: |
          curl -X POST ${{ secrets.DEPLOY_API }}/canary \
            -d '{"model": "my-model", "traffic_pct": 5}'
      - name: Monitor for 30 min
        run: |
          sleep 1800
          python ml/check_drift.py --baseline current --canary new --max-drift 0.05
        # If drift >5% → rollback automatically

  promote-to-production:
    needs: canary-deploy
    if: success()
    runs-on: ubuntu-latest
    environment: production
    steps:
      - name: Promote model
        run: |
          mlflow models transition --model-uri ml/model/ --version latest --stage Production
```

### 50.10 DORA AI Capabilities Model (2025)

El reporte DORA 2025 introduce un modelo de capacidades específico para organizaciones que adoptan AI en desarrollo. Las **7 capacidades** que predicen alto desempeño con AI son:

| #   | Capacidad                    | Descripción                                                                                  | Evidencia                                                               |
| --- | ---------------------------- | -------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| 1   | **AI Strategy**              | Estrategia clara de AI con objetivos medibles y ownership ejecutivo                          | Organizaciones con AI strategy tienen 2x probabilidad de alto desempeño |
| 2   | **Healthy Data Ecosystem**   | Datos de alta calidad, gobernados, accesibles para entrenamiento y validación                | AI sin datos limpios genera output no confiable                         |
| 3   | **Internal Knowledge**       | Equipos documentan y comparten conocimiento interno para contexto de AI tools                | Reduce hallucinations y mejora relevancia de suggestions                |
| 4   | **Foundational Practices**   | CI/CD maduro, testing automatizado, code review — base para que AI sea efectiva              | AI sobre código sin tests produce código no validado                    |
| 5   | **User-Centric Development** | Desarrollo orientado a feedback del usuario, con métricas de adoptión y satisfacción         | AI-generated features que el usuario no necesita = waste                |
| 6   | **Platform Engineering**     | IDP, golden paths, self-service — AI tools se integran en platforms existentes               | AI sin platform = shadow IT                                             |
| 7   | **Small Batches**            | Despliegues frecuentes en incrementos pequeños; AI-generated code se integra y valida rápido | Large batches + AI = large risk                                         |

> **Nota:** Las 2 capacidades originales de DORA (velocity y stability) siguen siendo el frame. Las 7 capacidades AI son **complementarias**, no reemplazantes. Organizations que combinan ambas tienen 3.5x más probabilidad de ser high performers.

> **Fuente:** [DORA 2025 AI Report](https://dora.dev/research/publications/)

---

## 51. Zero-trust CI/CD y OWASP CI/CD Top 10

### 51.1 Descripción

Zero-trust en CI/CD significa **asumir que cualquier paso del pipeline puede ser comprometido** y verificar explícitamente la integridad en cada punto de transferencia. El framework OWASP CI/CD Top 10 (CICD-SEC-1..10) define los 10 riesgos de seguridad más críticos en pipelines modernos, alineados con el modelo OWASP oficial.

> **Nota sobre numeración**: La siguiente tabla refleja el orden oficial de OWASP CI/CD Top 10 (https://owasp.org/www-project-top-10-ci-cd-security-risks/). El riesgo #1 es **Insufficient Flow Control**, no PPE — PPE es CICD-SEC-4. "Poisoned Actions" NO es una categoría OWASP oficial; es un término de GitHub que se menciona como referencia suplementaria.

### 51.2 Objetivo de negocio (mapeo OWASP CI/CD Top 10 oficial)

| Riesgo OWASP (oficial)                                       | Impacto potencial                                                                                | Protección zero-trust                                                                    |
| ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------- |
| CICD-SEC-1: Insufficient Flow Control                        | Merge sin approval, race conditions, bypass de gates                                             | Branch protection, required reviews, environment gates, wait timers                      |
| CICD-SEC-2: Inadequate IAM                                   | Acceso no autorizado a recursos/pipelines                                                        | Least-privilege IAM, OIDC federation scoped a repo+branch+env, rotation                  |
| CICD-SEC-3: Dependency Chain Abuse                           | Compromiso de dependencias supply chain (typosquatting, dependency confusion, malicious updates) | SHA pinning, SBOM, dependency review, Socket.dev, Dependabot alerts                      |
| CICD-SEC-4: Poisoned Pipeline Execution (PPE)                | Ejecución de código malicioso en pipeline (direct, indirect, public-PR, 3PE)                     | PBAC, aislamiento de secrets, runners efímeros, no checkout de PR en pull_request_target |
| CICD-SEC-5: Inadequate PBAC (Pipeline-Based Access Controls) | Acceso granular insuficiente por step/secret                                                     | PBAC por step, env-scoped secrets, JIT secret injection                                  |
| CICD-SEC-6: Insufficient Credential Hygiene                  | Secrets rotados tarde, exposure accidental, stored en plaintext                                  | Vault, SOPS, rotación automática, no secrets en logs, audit trail                        |
| CICD-SEC-7: Insecure System Configuration                    | Runner/agent configuration insegura                                                              | Hardened runners, egress filtering, container isolation, disable defaults                |
| CICD-SEC-8: Ungoverned 3rd Party Services                    | Servicios externos (webhooks, Marketplace apps, OAuth apps) sin governance                       | Inventario de integraciones, OAuth scope audit, webhook signature verify                 |
| CICD-SEC-9: Improper Artifact Integrity                      | Artefactos modificados post-build, no verification en deploy                                     | Sigstore/cosign, attestation verification, deploy gate check firma                       |
| CICD-SEC-10: Insufficient Logging & Visibility               | No audit trail de pipeline, no detection de IOC                                                  | OTel spans, immutable audit log, alerting de eventos sospechosos                         |

### 51.3 Prácticas recomendadas

1. **Assume breach mentality**: Cada step del pipeline es un posible vector de ataque; verificar integridad en cada transferencia
2. **PBAC (Pipeline-Based Access Controls)**: Cada step recibe solo los secrets/permisos que necesita explícitamente
3. **Runners efímeros y aislados**: Nunca reutilizar runners; container-based runners que se destruyen después de cada job
4. **OIDC federation scoped**: Tokens de cloud federados scoped a repo + branch + environment; nunca permanentes
5. **SHA pinning de actions**: Toda action referenciada por SHA completa, no por tag mutable
6. **Dependency confusion prevention**: Namespaces privados, registry scoping, dependabot alerts
7. **Egress filtering**: Runners solo pueden acceder a endpoints necesarios; bloquear internet general
8. **Artifact signing y verification**: Todo artefacto firmado con Sigstore; deploy gate verifica firma
9. **Immutable audit trail**: Cada acción del pipeline registrada en OTel spans con contexto de seguridad
10. **Self-review prohibition**: Nadie puede aprobar sus propios PRs; CODEOWNERS enforcement

### 51.4 Herramientas comunes

| Herramienta                | Categoría                 | Uso                                                   |
| -------------------------- | ------------------------- | ----------------------------------------------------- |
| OPA/Conftest               | Policy as Code            | Validar config de pipeline contra reglas de seguridad |
| Sigstore/cosign            | Artifact signing          | Firmar y verificar artefactos keyless                 |
| StepSecurity harden-runner | Runner hardening          | Egress filtering, file integrity monitoring           |
| Snyk CI/CD                 | Dependency scanning       | Detectar dependency confusion y vulnerabilidades      |
| Socket.dev                 | Supply chain              | Detectar typosquatting, install scripts maliciosos    |
| OpenSSF Scorecard          | Security posture          | Evaluar seguridad de dependencias open source         |
| GitHub Advanced Security   | SAST/DAST/secret scanning | Gates de seguridad integrados                         |
| Trivy                      | Container scanning        | Escaneo de imágenes antes de deploy                   |
| Checkov                    | IaC scanning              | Validar configuración de infra contra reglas          |

### 51.5 Mejores prácticas

- **Mapear cada mitigación a OWASP**: Mantener tabla de mapeo CICD-SEC-1..10 → control implementado → sección del documento
- **Threat modeling del pipeline**: Identificar trust boundaries entre stages del pipeline
- **Periodic security assessment**: Ejecutar OpenSSF Scorecard mensualmente; alertar sobre regresiones
- **Runner network segmentation**: Runners de build ≠ runners de deploy; aislamiento por environment
- **Secret scanning en push**: Gitleaks/Semgrep como hook pre-commit Y como CI step (defense in depth)
- **PR approval gates**: CODEOWNERS + required reviewers + dismiss stale approvals

### 51.6 Errores comunes (anti-patrones)

| Anti-patrón                                     | OWASP Risk                               | Solución                                                   |
| ----------------------------------------------- | ---------------------------------------- | ---------------------------------------------------------- |
| `pull_request_target` + checkout del PR         | CICD-SEC-4 (PPE indirecto)               | Nunca checkout de PR code en pull_request_target           |
| `${{ github.event.pull_request.title }}` en run | CICD-SEC-4 (PPE directo)                 | Sanitizar inputs, usar env en lugar de run                 |
| Fork PR con acceso a secrets                    | CICD-SEC-4 (PPE por PR público/3PE)      | Fork PRs sin secrets; approval manual antes de CI completa |
| `GITHUB_TOKEN: write` global                    | CICD-SEC-5 (Inadequate PBAC)             | Permisividad por step, no global                           |
| Actions por tag (`@v4`)                         | CICD-SEC-3 (Dependency Chain Abuse)      | SHA pinning completo                                       |
| Secrets disponibles en todos los jobs           | CICD-SEC-5 (Inadequate PBAC)             | Environment-scoped secrets                                 |
| Secrets en plaintext o sin rotación             | CICD-SEC-6 (Credential Hygiene)          | Vault/SOPS, rotación automática, audit                     |
| Sin approval para production deploy             | CICD-SEC-1 (Insufficient Flow Control)   | Required reviewers + wait timer + branch protection        |
| Webhooks / OAuth apps sin inventario            | CICD-SEC-8 (Ungoverned 3rd Party)        | Inventario de integraciones, scope audit                   |
| Artefactos deployados sin verificación de firma | CICD-SEC-9 (Improper Artifact Integrity) | Sigstore + deploy gate verifica attestation                |
| Sin audit trail de pipeline events              | CICD-SEC-10 (Insufficient Logging)       | OTel spans + immutable log + alerting                      |

### 51.7 Métricas recomendadas

| Métrica                     | Target                | Framework          |
| --------------------------- | --------------------- | ------------------ |
| OWASP CI/CD Top 10 coverage | 10/10 risks mitigated | OWASP assessment   |
| SHA-pinned actions          | 100%                  | repo audit         |
| Secrets scope compliance    | 100% env-scoped       | GitHub audit log   |
| Runner isolation            | 100% ephemeral        | Runner fleet audit |
| PR self-review blocks       | 0 approved            | Branch protection  |
| Dependency confusion alerts | 0 unresolved          | Dependabot/Socket  |

### 51.8 Fuentes

| #   | Fuente                                                                                     |
| --- | ------------------------------------------------------------------------------------------ |
| 1   | OWASP CI/CD Top 10 — https://owasp.org/www-project-top-10-ci-cd-security-risks/            |
| 2   | Microsoft Zero Trust Assessment — https://microsoft.github.io/zerotrustassessment/         |
| 3   | CDF Security Blueprint — https://cd.foundation/blog/2026/02/06/blueprinting-security/      |
| 4   | StepSecurity harden-runner — https://app.stepsecurity.io/                                  |
| 5   | SLSA Framework — https://slsa.dev/                                                         |
| 6   | Sigstore Documentation — https://www.sigstore.dev/                                         |
| 7   | GitHub Security Hardening — https://docs.github.com/en/actions/security-for-github-actions |
| 8   | Socket.dev Supply Chain — https://socket.dev/                                              |
| 9   | OpenSSF Scorecard — https://securityscorecards.dev/                                        |
| 10  | NIST SSDF — https://csrc.nist.gov/projects/ssdf                                            |

### 51.9 Ejemplo práctico — GitHub Actions (YAML)

```yaml
name: Secure Pipeline (Zero-trust)
on: [pull_request]

permissions:
  contents: read # Minimal global permissions
  pull-requests: write

jobs:
  build:
    runs-on: ubuntu-latest
    permissions:
      contents: read # Step-level override
      security-events: write
    steps:
      - uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683 # v4.2.2 — SHA pinned
      - uses: step-security/harden-runner@002fdce3c6a235733a90a27c80493a3241e56663 # v2.10.2
        with:
          egress-policy: audit # Monitor network egress
      - name: Build
        run: npm ci && npm run build
      - name: Generate SBOM
        run: npx @cyclonedx/cyclonedx-npm --output-file sbom.json
      - name: Attest build provenance
        uses: actions/attest-build-provenance@ef244123eb79f2f7a7e75d99086184ef3e0a0dc8 # v2.2.3
        with:
          subject-path: dist/*
      - name: Verify attestation
        run: |
          gh attestation verify dist/* --owner ${{ github.repository_owner }}

  deploy-staging:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: staging
      url: https://staging.example.com
    # Environment protection: required reviewers, wait timer
    steps:
      - name: Deploy
        run: |
          echo "Deploying to staging..."
          # Deploy logic here
      - name: Security scan
        uses: aquasecurity/trivy-action@18f2510ee396bbf400402947e1f8b8162398c3b0 # v0.30.0
        with:
          image-ref: 'app:${{ github.sha }}'
          severity: 'CRITICAL,HIGH'
          exit-code: '1'
```

---

## 52. Platform Engineering e Internal Developer Platform (IDP)

### 52.1 Descripción

Platform Engineering es la práctica de construir una **Internal Developer Platform (IDP)** que abstrae complejidad de infraestructura y proporciona **self-service** a los desarrolladores. La IDP incluye: developer portal (Backstage), golden paths (templates preconfiguradas), service catalog, y APIs de self-service para provisioning de entornos, pipelines CI/CD, y observabilidad.

### 52.2 Objetivo de negocio

| Capacidad IDP           | Beneficio                                       | Métrica                                 |
| ----------------------- | ----------------------------------------------- | --------------------------------------- |
| Golden paths            | Time-to-first-deploy reducido de días a minutos | Time from repo creation to first deploy |
| Self-service            | Eliminación de tickets/wait time                | Developer wait time (DORA)              |
| Service catalog         | Visibility de ownership y dependencias          | Services cataloged vs. total            |
| Observability integrada | Debugging más rápido                            | Mean time to debug                      |
| Standardized CI/CD      | Consistencia cross-team                         | Pipeline compliance %                   |

### 52.3 Prácticas recomendadas

1. **Treat the platform as a product**: Product manager para la IDP; métricas de adopción, NPS de desarrolladores, time-to-value
2. **Golden paths over golden cages**: Ofrecer path recomendado pero no forzar; escape hatches para casos edge
3. **Software templates (Backstage scaffolder)**: Template que provisiona repo + CI/CD + entorno preview + monitoring en un click
4. **Self-service over tickets**: Developers provisionan databases, queues, caches sin ticket de infra
5. **Service catalog con ownership**: Cada servicio tiene owner documentado; CODEOWNERS derivados del catalog
6. **IDP como puerta de entrada a CI/CD**: El pipeline es un componente de la plataforma, no un proyecto independiente
7. **Inner platform loop**: Build → Measure → Learn sobre la plataforma misma; DX Core 4 metrics
8. **GitOps como backend de la IDP**: Argo CD app-of-apps para gestionar la plataforma como código
9. **Self-service APIs**: APIs internas para provisioning (databases, queues, secrets) con policy as code
10. **Monitor platform adoption**: Trackear uso de golden paths vs. custom approaches; feedback loops

### 52.4 Herramientas comunes

| Herramienta         | Categoría                 | Uso                                                |
| ------------------- | ------------------------- | -------------------------------------------------- |
| Backstage (Spotify) | Developer portal          | Service catalog, software templates, tech docs     |
| Port                | Internal developer portal | Self-service actions, scorecards                   |
| Cortex              | Service catalog           | Ownership, dependencies, scorecards                |
| Kratix              | Platform framework        | Composable platform building blocks                |
| Humanitec           | Platform orchestrator     | Dynamic configuration, infrastructure provisioning |
| Argo CD             | GitOps                    | Platform deployment, app-of-apps pattern           |
| Crossplane          | Infrastructure            | Self-service infrastructure via Kubernetes         |
| Krateo              | Platform                  | Kubernetes-native platform engineering             |

### 52.5 Mejores prácticas

- **Start with the biggest pain point**: No construir toda la IDP de una; empezar con el mayor cuello de botella (e.g., environment provisioning)
- **Platform team as enablers**: El equipo de plataforma habilita, no bloquea; mindset de servicio
- **Measure developer experience**: DX Core 4 — velocidad, estabilidad, satisfacción, adopción
- **Document everything**: ADRs,rfc, y decisiones de plataforma en el portal (docs-as-code)
- **Iterate based on feedback**: Surveys trimestrales, office hours, slack channel dedicado
- **Avoid premature abstraction**: No abstraer hasta que el patrón se haya repetido 3+ veces

### 52.6 Errores comunes (anti-patrones)

| Anti-patrón                   | Problema                             | Solución                                    |
| ----------------------------- | ------------------------------------ | ------------------------------------------- |
| "Build it and they will come" | Platform sin adopción                | Product management approach, feedback loops |
| Golden cage (forced paths)    | Developers bypass platform           | Escape hatches, opt-in adoption             |
| Platform team as gatekeeper   | Bottleneck, friction                 | Self-service, enablement mindset            |
| No metrics on platform        | Can't prove value                    | DX Core 4, adoption metrics                 |
| Over-engineering from day 1   | Months before first value            | Start small, iterate                        |
| Siloed platform team          | Platform out of touch with dev needs | Embedded platform engineers in dev teams    |

### 52.7 Métricas recomendadas

| Métrica                            | Target                    | Source              |
| ---------------------------------- | ------------------------- | ------------------- |
| Golden path adoption rate          | >80% new services         | Backstage analytics |
| Time to first deploy (new service) | <30 minutes               | Template metrics    |
| Developer wait time (infra)        | <5 minutes (self-service) | IDP logs            |
| Service catalog coverage           | >95% services             | Backstage catalog   |
| Platform NPS                       | >50                       | Quarterly survey    |
| Pipeline standardization           | >90% using golden path    | Pipeline audit      |

### 52.8 Fuentes

| #   | Fuente                                                                                                                             |
| --- | ---------------------------------------------------------------------------------------------------------------------------------- |
| 1   | DORA 2025 Platform Engineering — https://dora.dev/dora-report-2025/                                                                |
| 2   | Backstage Documentation — https://backstage.io/docs/                                                                               |
| 3   | Red Hat: Backstage Self-Service — https://developers.redhat.com/articles/2025/06/25/how-implement-developer-self-service-backstage |
| 4   | PlatformEngineering.com — https://platformengineering.com/                                                                         |
| 5   | CNCF Platform White Paper — https://tag-app-delivery.cncf.io/whitepapers/platforms/                                                |
| 6   | Humanitec Platform Orchestrator — https://humanitec.com/                                                                           |
| 7   | Crossplane Documentation — https://docs.crossplane.io/                                                                             |
| 8   | DX Core 4 Metrics — https://dxstars.com/                                                                                           |
| 9   | CDF Security Blueprint — https://cd.foundation/blog/2026/02/06/blueprinting-security/                                              |
| 10  | Internal Developer Platform (IDP) Landscape — https://platformlandscape.com/                                                       |

### 52.9 Ejemplo práctico — Backstage Template (YAML)

```yaml
# backstage/templates/service-template.yaml
apiVersion: scaffolder.backstage.io/v1beta3
kind: Template
metadata:
  name: node-service-template
  title: Create Node.js Service
  description: Scaffolds a new Node.js service with CI/CD, monitoring, and deploy
spec:
  owner: platform-team
  type: service
  parameters:
    - title: Service Details
      properties:
        name:
          title: Service Name
          type: string
        owner:
          title: Team Owner
          type: string
          ui:field: OwnerPicker
    - title: Infrastructure
      properties:
        database:
          title: Database
          type: boolean
          default: true
        cache:
          title: Redis Cache
          type: boolean
          default: false
  steps:
    - id: fetch-template
      action: fetch:template
      input:
        url: ./skeleton
        values:
          name: ${{ parameters.name }}
          owner: ${{ parameters.owner }}
    - id: create-repo
      action: github:repo:create
      input:
        repoName: ${{ parameters.name }}
        private: true
    - id: create-ci-cd
      action: github:actions:workflow:create
      input:
        name: ci-cd.yaml
        body: |
          # CI/CD pipeline auto-generated from golden path
          # Includes: lint, test, build, security scan, deploy
    - id: register-catalog
      action: catalog:register
      input:
        catalogInfoPath: /catalog-info.yaml
    - id: create-environment
      action: infra:create
      input:
        type: kubernetes
        namespace: ${{ parameters.name }}-staging
    - id: notify
      action: slack:send
      input:
        channel: '#platform'
        message: 'New service ${{ parameters.name }} created by ${{ parameters.owner }}'
```

---

## 53. CI/CD Sostenible (Green CI)

### 53.1 Descripción

Green CI/CD es la práctica de **minimizar la huella de carbono** de los pipelines de integración continua y entrega continua. La especificación SCI (Software Carbon Intensity) de Green Software Foundation incluye explícitamente build y deploy pipelines en su boundary. Incluye carbon-aware scheduling, selección de runners por intensidad de carbono, y optimización de cómputo para reducir emisiones.

### 53.2 Objetivo de negocio

| Iniciativa              | Impacto ambiental                 | Impacto económico                                 |
| ----------------------- | --------------------------------- | ------------------------------------------------- |
| Carbon-aware scheduling | -30-50% emisiones de CI           | Runner costs ↓ cuando se usa energía verde barata |
| Caching agresivo        | -40% cómputo redundante           | Menos minutos CI consumidos                       |
| Right-sizing runners    | -20% energía desperdiciada        | Costo directo reducido                            |
| Build optimization      | -25% tiempo de build              | Menos energía + más rápido                        |
| Green reporting         | Compliance con EU CSRD, ISO 14068 | Reputación + avoidance de multas                  |

### 53.3 Prácticas recomendadas

1. **Medir primero**: Calcular carbon footprint actual del CI/CD usando SCI methodology
2. **Carbon-aware scheduling**: Programar builds no-urgentes (nightly, dependency updates) cuando la red eléctrica es más verde (Carbon Aware SDK)
3. **Caching agresivo**: Todo cache posible — dependencias, build artifacts, Docker layers, test results
4. **Right-size runners**: No usar 8-core para lint jobs; matching runner size a workloads reales
5. **Skip unnecessary builds**: paths filters, conditional workflows, skip CI para docs-only changes
6. **Green regions**: Preferir data centers con energías renovables (AWS regions con 100% renewable)
7. **Build optimization**: Incremental builds, affected-only testing, parallelización eficiente
8. **Report emisiones**: SCI score por build; dashboard de tendencias; targets de reducción
9. **Container efficiency**: Multi-stage builds, slim base images, layer optimization
10. **Auto-scaling runners**: Solo runners activos cuando hay builds; zero idle

### 53.4 Herramientas comunes

| Herramienta                   | Categoría          | Uso                                            |
| ----------------------------- | ------------------ | ---------------------------------------------- |
| Carbon Aware SDK (GSF)        | Measurement        | Calcular intensidad de carbono por región/hora |
| Green GitHub Action           | Scheduling         | Schedule builds cuando la grid es más verde    |
| SCI Specification             | Methodology        | Medir intensidad de carbono del software       |
| Joule (GSF)                   | Measurement        | Carbon footprint de aplicaciones               |
| AWS Customer Carbon Footprint | Reporting          | Tracking de emisiones AWS                      |
| Google Cloud Carbon Footprint | Reporting          | Tracking de emisiones GCP                      |
| Turborepo/Nx                  | Build optimization | Caching, affected-only, parallelization        |
| Act (local runner)            | Testing            | Ejecutar CI localmente antes de push           |

### 53.5 Mejores prácticas

- **SCI score en CI**: Calcular SCI score como parte de la pipeline; alertar sobre regresiones
- **Nightly builds carbon-aware**: Usar Carbon Aware SDK para schedules que prioricen energía verde
- **Measure and publish**: Dashboard público de emisiones CI/CD; targets de reducción anual
- **Cost-Green correlation**: Optimizar costo Y carbono simultáneamente (generalmente correlacionan)
- **Avoid over-provisioning**: Runners auto-scaling, no always-on; zero idle cuando no hay builds

### 53.6 Errores comunes (anti-patrones)

| Anti-patrón             | Problema                             | Solución                          |
| ----------------------- | ------------------------------------ | --------------------------------- |
| Always-on runners       | Idle energy consumption              | Auto-scaling, ephemeral runners   |
| Unnecessary builds      | Wasted compute                       | paths filters, skip CI for docs   |
| Oversized runners       | Energy waste                         | Right-size per workload           |
| No measurement          | Can't improve what you don't measure | SCI score in CI                   |
| Build everything always | Redundant computation                | Cache, incremental, affected-only |

### 53.7 Métricas recomendadas

| Métrica                  | Target                 | Herramienta             |
| ------------------------ | ---------------------- | ----------------------- |
| SCI score (gCO2e/minute) | Decreasing trend       | Carbon Aware SDK        |
| CI compute waste %       | <10%                   | Build analytics         |
| Cache hit rate           | >80%                   | Turborepo/Actions cache |
| Idle runner time         | <5%                    | Runner fleet monitoring |
| Carbon-aware build %     | >50% non-urgent builds | Carbon Aware SDK        |

### 53.8 Fuentes

| #   | Fuente                                                                                                          |
| --- | --------------------------------------------------------------------------------------------------------------- |
| 1   | Green Software Foundation SCI — https://sci.greensoftware.foundation/                                           |
| 2   | Carbon Aware SDK — https://github.com/Green-Software-Foundation/carbon-aware-sdk                                |
| 3   | ISO 14068 — Carbon neutrality standard                                                                          |
| 4   | EU CSRD — Corporate Sustainability Reporting Directive                                                          |
| 5   | Green Software Foundation — https://greensoftware.foundation/                                                   |
| 6   | Joule Measurement — https://github.com/Green-Software-Foundation/joule                                          |
| 7   | AWS Customer Carbon Footprint — https://sustainability.aboutamazon.com/programs-and-tools/carbon-footprint-tool |
| 8   | Google Cloud Carbon Footprint — https://cloud.google.com/carbon-footprint                                       |

### 53.9 Ejemplo práctico — GitHub Actions (YAML)

```yaml
name: Carbon-Aware CI
on:
  schedule:
    - cron: '0 2 * * *' # Nightly — scheduled for green energy window
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683 # v4.2.2
      - name: Check carbon intensity
        id: carbon
        uses: green-software-foundation/carbon-aware-sdk@v1
        with:
          request: '{"location": "westus", "startTime": "now"}'
      - name: Build (skip if carbon intensity > threshold)
        if: steps.carbon.outputs.intensity < 300 # gCO2e/kWh
        run: npm ci && npm run build
      - name: Cache dependencies
        uses: actions/cache@5a3ec84eff668545956fd18022155c47e93e2684 # v4.2.3
        with:
          path: ~/.npm
          key: npm-${{ hashFiles('**/package-lock.json') }}
          restore-keys: npm-
      - name: Report SCI score
        run: |
          SCI_SCORE=$(calculate_sci --build-time ${{ env.BUILD_DURATION }} --energy ${{ env.ENERGY_USED }})
          echo "SCI Score: $SCI_SCORE gCO2e/minute"
          # Post to dashboard or Slack
```

---

## 54. Modelo de Madurez CI/CD

### 54.1 Descripción

El modelo de madurez CI/CD proporciona un **framework de evaluación** para medir el estado actual de las prácticas de integración continua y entrega continua, y definir una hoja de ruta de mejora progresiva. Combina los archetypes de DORA (7 niveles), las capabilities de DORA (24 capacidades), y un modelo operacional de 5 niveles.

### 54.2 Niveles de madurez

| Nivel | Nombre                | Características                                                               | DORA Archetype   |
| ----- | --------------------- | ----------------------------------------------------------------------------- | ---------------- |
| 1     | Manual                | Builds manuales, deploys manuales, sin automatización                         | Low performer    |
| 2     | CI Basic              | Automatización de build + test en push; sin deployment automatizado           | Low performer    |
| 3     | CD Foundation         | Deployment automatizado a staging; manual a production; feature flags básicos | Medium performer |
| 4     | CD Advanced           | Deployment automatizado a production; canary/blue-green; monitoring integrado | High performer   |
| 5     | Continuous Excellence | AI-powered optimization; self-healing; full value stream visibility           | Elite performer  |

### 54.3 Prácticas recomendadas

1. **Assessment inicial**: Evaluar cada capability de DORA (24 capabilities) en una escala de 1-5; identificar gaps
2. **Priorizar por impacto**: Usar los datos de DORA para identificar qué capabilities tienen mayor impacto en performance
3. **Incremental improvement**: No saltar de nivel 1 a 5; mejorar 2-3 capabilities por trimestre
4. **Measure everything**: Cada capability tiene métricas asociadas; tracking continuo de progreso
5. **Team-level assessment**: Cada equipo puede estar en diferente nivel; no forzar uniformidad
6. **Tooling supports maturity**: CI/CD tools deben soportar el nivel actual Y el siguiente
7. **Cultural change alongside tooling**: Automatización sin cultural change tiene impacto limitado
8. **Regular reassessment**: Quarterly review de madurez; ajustar roadmap según progreso

### 54.4 DORA Capabilities → Pipeline Mapping

Las capacidades DORA oficiales provienen de https://dora.dev/capabilities/ y https://dora.dev/research/. La siguiente tabla mapea las capabilities DORA canónicas a las secciones del documento. Nota: algunas capabilities del documento (artifact management, environment management, feature flags, etc.) son prácticas de CI/CD estándar que NO están en la taxonomía DORA pero son complementarias.

**DORA Continuous Delivery Core (canónico):**

| Capability DORA            | Pipeline Section |
| -------------------------- | ---------------- |
| Test automation            | 4, 6, 36         |
| Deployment automation      | 13, 28           |
| Trunk-based development    | 41               |
| Pervasive security         | 20, 51           |
| Loosely coupled teams      | 38, 52           |
| Version control            | 1                |
| Database change management | 33               |
| Monitoring                 | 14, 40           |
| Test data management       | 36               |
| Proactive notification     | 44               |
| Code maintainability       | 2                |

**DORA Software Delivery Performance (canónico):**

| Capability DORA                     | Pipeline Section                     |
| ----------------------------------- | ------------------------------------ |
| Continuous integration              | 1-6                                  |
| Shift-left security                 | 20, 51                               |
| Progressive delivery                | 27                                   |
| Cloud infrastructure                | 32 (IaC), 47 (self-hosted)           |
| Lightweight change approval process | 13 (approval gates)                  |
| Working in small batches            | 41 (trunk-based), 46 (feature flags) |
| Visual management                   | 40 (observability), 44 (chatops)     |

**DORA Operational Excellence (canónico):**

| Capability DORA                  | Pipeline Section                     |
| -------------------------------- | ------------------------------------ |
| Lean management practices        | 41 (branch strategies)               |
| Limit WIP                        | 41, 46 (feature flags)               |
| Empowering teams to choose tools | 18 (pipeline as code), 52 (platform) |
| Value stream visibility          | 40 (pipeline observability)          |

**Complementarias (no DORA, pero prácticas CI/CD estándar):**

| Practice               | Pipeline Section |
| ---------------------- | ---------------- |
| Infrastructure as code | 32               |
| Artifact management    | 39               |
| Environment management | 35               |
| Dependency management  | 42               |
| Release management     | 43               |
| Feature flags          | 46               |
| Incident management    | 41               |
| Platform engineering   | 52               |
| Developer experience   | 55               |

### 54.5 Mejores prácticas

- **Use DORA metrics as baseline**: Los 4+1 metrics son el foundation del assessment
- **Capability over maturity level**: Enfocarse en capabilities individuales, no en "alcanzar nivel 5"
- **Team autonomy**: Cada equipo define su roadmap de madurez según su contexto
- **Celebrate incremental wins**: Cada capability mejorada es una victoria; no esperar al "nivel 5"
- **External benchmarking**: Comparar con DORA State of DevOps benchmarks por industria/tamaño

### 54.6 Errores comunes (anti-patrones)

| Anti-patrón            | Problema                            | Solución                              |
| ---------------------- | ----------------------------------- | ------------------------------------- |
| "We're level 3" badge  | Gamificación sin sustancia          | Focus on capabilities, not levels     |
| Big bang maturity jump | Overwhelm teams, resistance         | Incremental, 2-3 capabilities/quarter |
| One-size-fits-all      | Different teams, different contexts | Team-level assessment                 |
| Tool-first approach    | Buying tools without process change | Process → culture → tools             |
| No measurement         | Can't prove improvement             | DORA metrics baseline + tracking      |

### 54.7 Métricas de assessment

| Capability              | Measurement                   | Tool               |
| ----------------------- | ----------------------------- | ------------------ |
| Deployment frequency    | Deploys per day               | CI/CD analytics    |
| Lead time for changes   | Commit → production           | Git analytics      |
| Change failure rate     | % deployments causing failure | Incident tracking  |
| Time to restore service | MTTR                          | Incident tracking  |
| CI build time           | Build duration trend          | Pipeline analytics |
| Test coverage           | Code coverage %               | SonarQube          |
| Security scan coverage  | % projects scanned            | Security tools     |
| Developer satisfaction  | NPS survey                    | Quarterly survey   |

### 54.8 Fuentes

| #   | Fuente                                                                 |
| --- | ---------------------------------------------------------------------- |
| 1   | DORA Core Model — https://dora.dev/capabilities/                       |
| 2   | Accelerate (Forsgren/Humble/Kim)                                       |
| 3   | DORA State of DevOps 2025 — https://dora.dev/dora-report-2025/         |
| 4   | DORA 4 Tiers — https://dora.dev/guides/                                |
| 5   | CD Foundation Maturity Model — https://cd.foundation/                  |
| 6   | Axis Intelligence CI/CD Maturity — https://axis-intelligence.com/      |
| 7   | Microsoft DevOps Maturity — https://learn.microsoft.com/en-us/devops/  |
| 8   | Google Cloud DevOps Assessment — https://cloud.google.com/architecture |

### 54.9 Ejemplo práctico — Assessment Checklist

```yaml
# ci-cd-maturity-assessment.yaml
project: project-one
date: 2026-08-17
assessor: platform-team

capabilities:
  continuous_delivery:
    test_automation:
      level: 4
      evidence: 'Vitest + Playwright + MSW, >80% coverage'
      next_step: 'Add mutation testing (Stryker)'
    deployment_automation:
      level: 3
      evidence: 'GitHub Actions auto-deploy to staging; manual prod'
      next_step: 'Add canary deployment to production'
    trunk_based_development:
      level: 4
      evidence: 'Short-lived branches, PR-based workflow'
      next_step: 'Consider feature flags for long-lived features'
    pervasive_security:
      level: 4
      evidence: 'SAST + SCA + secret scanning + OWASP mapping'
      next_step: 'Add DAST to staging environment'

  platform_engineering:
    golden_paths:
      level: 2
      evidence: 'No standardized template yet'
      next_step: 'Create Backstage template for new services'
    self_service:
      level: 1
      evidence: 'All infra requests via tickets'
      next_step: 'Implement self-service for databases and queues'

overall:
  current_level: 3
  target_level: 4
  timeline: '6 months'
  priority_capabilities:
    - deployment_automation → level 4 (canary)
    - golden_paths → level 3 (Backstage template)
    - self_service → level 2 (database provisioning)
```

---

## 55. Developer Experience (DevEx) en CI/CD

### 55.1 Descripción

Developer Experience (DevEx) mide la **eficiencia, satisfacción y productividad** de los desarrolladores en su interacción con las herramientas de CI/CD. Incluye inner/outer loop, feedback time budgets, paridad local/CI, y métricas de experiencia del desarrollador.

### 55.2 Inner Loop vs. Outer Loop

| Loop              | Actividad                             | Feedback Time Target | Herramienta                     |
| ----------------- | ------------------------------------- | -------------------- | ------------------------------- |
| Inner (local)     | Code → Test → Lint → Commit           | <30 seconds          | Pre-commit hooks, hot reload    |
| Outer (CI/CD)     | Push → Build → Test → Review → Deploy | <10 minutes          | GitHub Actions, CI optimization |
| Extended (review) | PR → Review → Approve → Merge         | <24 hours            | CODEOWNERS, automation          |

### 55.3 Prácticas recomendadas

1. **Inner loop < 30 seconds**: Pre-commit hooks (lint-staged), hot module reload, Testcontainers for local services
2. **Outer loop < 10 minutes**: CI pipelines must be fast; developers should get feedback before context-switching
3. **Paridad local/CI**: Usar act (local GitHub Actions runner) o Docker Compose para ejecutar CI localmente
4. **Fail fast, fail clearly**: Pipeline failures must have actionable error messages, not cryptic logs
5. **Rerun policies**: Allow developers to rerun failed flaky tests without full pipeline re-execution
6. **Reduce context switching**: Notifications precisas (no spam); Slack/Teams integration with actionable alerts
7. **Self-service over tickets**: Developers should provision infra without waiting for ops team
8. **Measure DevEx**: DX Core 4 — velocity, stability, satisfaction, adoption; quarterly surveys
9. **Reduce toil**: Automate repetitive tasks (dependency updates, environment provisioning, post-deploy checks)
10. **Fast local tests**: Testcontainers for database/service dependencies; no shared test environments

### 55.4 Herramientas comunes

| Herramienta    | Categoría          | Uso                                        |
| -------------- | ------------------ | ------------------------------------------ |
| Testcontainers | Local parity       | Run databases/services locally like CI     |
| act            | Local CI           | Run GitHub Actions locally                 |
| Turborepo      | Build optimization | Caching, affected-only, parallel execution |
| lint-staged    | Inner loop         | Run linters on staged files only           |
| Husky          | Inner loop         | Git hooks for pre-commit validation        |
| Storybook      | Frontend dev       | Component development isolation            |
| Vite           | Frontend dev       | Fast HMR for React development             |

### 55.5 Métricas DevEx

| Métrica                     | Target           | Herramienta              |
| --------------------------- | ---------------- | ------------------------ |
| Inner loop feedback         | <30 seconds      | Developer profiling      |
| CI pipeline duration        | <10 minutes      | GitHub Actions analytics |
| Time to first feedback (PR) | <5 minutes       | CI analytics             |
| Developer NPS (tooling)     | >50              | Quarterly survey         |
| Context switch frequency    | Decreasing trend | Time tracking            |
| Rerun rate                  | <5%              | Pipeline analytics       |

### 55.6 Errores comunes (anti-patrones)

| Anti-patrón                     | Problema                             | Solución                                 |
| ------------------------------- | ------------------------------------ | ---------------------------------------- |
| CI > 15 minutes                 | Developers context-switch, lose flow | Optimize: cache, parallel, affected-only |
| Cryptic error messages          | "Failed" without context             | Actionable error messages with links     |
| Shared test environments        | Flaky tests, slow feedback           | Testcontainers for isolation             |
| No local parity                 | "Works on my machine"                | act + Docker Compose                     |
| Spam notifications              | Alert fatigue                        | Smart routing, digest summaries          |
| Manual environment provisioning | Wait time, frustration               | Self-service via IDP                     |

### 55.7 Fuentes

| #   | Fuente                                                                           |
| --- | -------------------------------------------------------------------------------- |
| 1   | DORA Core: Fast Feedback — https://dora.dev/capabilities/                        |
| 2   | Harness DevEx Report 2026 — https://harness.io/                                  |
| 3   | DX Core 4 — https://dxstars.com/                                                 |
| 4   | Testcontainers — https://testcontainers.com/                                     |
| 5   | act (local CI) — https://github.com/nektos/act                                   |
| 6   | Turborepo — https://turbo.build/repo                                             |
| 7   | Martin Fowler: CI — https://martinfowler.com/articles/continuousIntegration.html |

### 55.8 Ejemplo práctico — Developer Workflow

```yaml
# .github/workflows/devex-optimized.yml
name: DevEx-Optimized CI
on: [pull_request]

jobs:
  inner-loop-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683 # v4.2.2
      - name: Fast feedback (< 2 min)
        run: |
          npm ci --prefer-offline  # Cache hit should be >80%
          npx turbo run lint typecheck --filter=...[origin/main]
        # Developer gets lint/typecheck feedback in <2 minutes

  affected-only:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683 # v4.2.2
        with:
          fetch-depth: 0 # Full history for affected detection
      - name: Detect affected workspaces
        id: affected
        run: |
          AFFECTED=$(npx turbo run test --filter=...[origin/main] --dry=json | jq -r '.tasks[].target')
          echo "affected=$AFFECTED" >> $GITHUB_OUTPUT
      - name: Test affected only
        if: steps.affected.outputs.affected != ''
        run: npx turbo run test --filter=${{ steps.affected.outputs.affected }}
        # Only affected workspaces tested → 10-30 min saved

  actionable-errors:
    runs-on: ubuntu-latest
    if: failure()
    steps:
      - name: Generate actionable error summary
        run: |
          echo "## CI Failure Summary" >> $GITHUB_STEP_SUMMARY
          echo "- **Failed job**: ${{ github.job }}" >> $GITHUB_STEP_SUMMARY
          echo "- **Fix**: Run \`npm run lint\` locally to see errors" >> $GITHUB_STEP_SUMMARY
          echo "- **Rerun**: Click 'Re-run failed jobs' above" >> $GITHUB_STEP_SUMMARY
```

---

## 56. InnerSource en CI/CD

### 56.1 Descripción

InnerSource es la práctica de aplicar **principios de open source dentro de la organización**: código compartido entre equipos, contribuciones cross-team, y gobernanza distribuida. En CI/CD, esto significa pipelines que soportan contribuciones de equipos externos, forks seguros, y CODEOWNERS como mecanismo de gobernanza.

### 56.2 Objetivo de negocio

| Práctica InnerSource        | Beneficio                                       | Métrica                         |
| --------------------------- | ----------------------------------------------- | ------------------------------- |
| Cross-team contributions    | Reutilización de componentes, menos duplicación | Cross-team PRs merged           |
| Fork-based workflow         | Seguridad para contribuidores externos          | External contributor adoption   |
| CODEOWNERS governance       | Ownership claro, review eficiente               | Review turnaround time          |
| Shared components           | Consistencia UI/UX, menos bugs                  | Component reuse rate            |
| Transparent decision-making | ADRs, RFCs públicas                             | Decision documentation coverage |

### 56.3 Prácticas recomendadas

1. **Fork-based workflow for external contributors**: Contributors fork → PR from fork → CI runs with limited secrets
2. **CODEOWNERS por componente**: Cada directorio/componente tiene owner documentado; auto-assign reviewers
3. **Security for fork PRs**: No secrets en fork PRs; approval manual antes de CI completa; runners aislados
4. **Shared component libraries**: Packages compartidos entre equipos (npm workspaces, monorepo)
5. **ADR (Architecture Decision Records)**: Decisiones documentadas y accesibles; contribución abierta
6. **RFC process for major changes**: Propuestas abiertas para cambios cross-team; comentario público
7. **Inner source metrics**: Trackear contribuciones cross-team; reutilización de componentes compartidos
8. **Discovery portal**: Catálogo de componentes/servicios reutilizables; evitar duplicación

### 56.4 Herramientas comunes

| Herramienta          | Categoría     | Uso                                  |
| -------------------- | ------------- | ------------------------------------ |
| CODEOWNERS           | Governance    | Auto-assign reviewers por path       |
| Backstage            | Discovery     | Service catalog, component discovery |
| npm workspaces       | Monorepo      | Shared packages between teams        |
| GitHub Topics/Topics | Discovery     | Tagging repos by domain/capability   |
| ADR Tools            | Documentation | Architecture decision records        |

### 56.5 Errores comunes (anti-patrones)

| Anti-patrón          | Problema                           | Solución                                     |
| -------------------- | ---------------------------------- | -------------------------------------------- |
| No CODEOWNERS        | Review bottleneck, wrong reviewers | CODEOWNERS por directorio                    |
| Secrets in fork PRs  | Security risk                      | Isolated CI for fork PRs                     |
| Siloed teams         | Duplicated components              | Shared component libraries, discovery portal |
| No documentation     | Knowledge hoarding                 | ADRs, RFCs, tech docs                        |
| Forced contributions | Resistance, low adoption           | Opt-in, celebrate contributions              |

### 56.6 Métricas recomendadas

| Métrica              | Target                          | Herramienta       |
| -------------------- | ------------------------------- | ----------------- |
| Cross-team PRs       | >10% of total PRs               | GitHub analytics  |
| Component reuse rate | >60% shared components used     | Package analytics |
| CODEOWNERS coverage  | 100% directories                | Repo audit        |
| ADR coverage         | >80% major decisions documented | ADR directory     |
| Review turnaround    | <4 hours for inner-source PRs   | GitHub analytics  |

### 56.7 Fuentes

| #   | Fuente                                                                                                                                                     |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | InnerSource Commons — https://innersourcecommons.org/                                                                                                      |
| 2   | GitHub: CODEOWNERS — https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-code-owners |
| 3   | Backstage — https://backstage.io/                                                                                                                          |
| 4   | ADRs by Michael Nygard — https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions                                                          |

### 56.8 Ejemplo práctico — Fork-PR Security

```yaml
name: Fork-Safe CI
on: [pull_request]

jobs:
  # Fork PRs get limited CI — no secrets, no deploy
  fork-safe-build:
    runs-on: ubuntu-latest
    if: github.event.pull_request.head.repo.full_name != github.repository
    steps:
      - uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683 # v4.2.2
      - name: Build (no secrets)
        run: npm ci && npm run build
      - name: Lint
        run: npm run lint
      - name: Unit tests (no integration)
        run: npm run test:unit
        # NO integration tests (require DB/service secrets)
        # NO deploy steps

  # Internal PRs get full CI
  full-ci:
    runs-on: ubuntu-latest
    if: github.event.pull_request.head.repo.full_name == github.repository
    steps:
      - uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683 # v4.2.2
      - name: Full CI
        run: npm ci && npm run build && npm run test
```

---

## 57. Deployment Serverless

### 57.1 Descripción

El deployment serverless se refiere a desplegar funciones (FaaS — Functions as a Service), backends serverless (API Gateway + Lambda/Cloud Functions), y servicios managed sin infraestructura subyacente visible. En CI/CD, esto implica stages específicos para empaquetado de funciones, testing contra emuladores cloud, deployment por versión, y validación de cold starts.

### 57.2 Objetivo de negocio

| Aspecto                | Beneficio                            | Consideración                       |
| ---------------------- | ------------------------------------ | ----------------------------------- |
| Zero server management | Sin patching, sin scaling manual     | Cold starts, vendor lock-in         |
| Pay-per-execution      | Costo proporcional al uso            | Costo unpredictable under high load |
| Auto-scaling           | Scale to zero ↔ millions of requests | Throttling limits                   |
| Fast deployment        | Deploy de funciones en segundos      | Testing complexity                  |
| Event-driven           | Natural fit para event architectures | Debugging más difícil               |

### 57.3 Prácticas recomendadas

1. **Function-level CI/CD**: Cada función tiene su propio pipeline de build/test/deploy
2. **Local emulators**: Usar SAM Local, Functions Framework, o emuladores cloud para testing local
3. **Cold start testing**: Medir cold start latency como gate de deploy; funciones >1s cold start requieren optimización
4. **Versioned deployments**: Cada deploy crea versión; routing por versión; rollback instantáneo
5. **Canary deployments**: Route 10% tráfico a nueva versión; monitorear errores/latencia
6. **Integration testing contra emuladores**: Test locally against emulated services (DynamoDB Local, Pub/Sub emulator)
7. **Layer management**: Compartir dependencias comunes via Lambda Layers; optimizar tamaño de deployment
8. **Monitoring por función**: Métricas por función (invocations, errors, duration, throttles)
9. **IaC para funciones**: Terraform/SAM/Serverless Framework para definir funciones como código
10. **Security review**: IAM roles por función (least privilege); secrets via Parameter Store/Secrets Manager

### 57.4 Herramientas comunes

| Herramienta                  | Categoría     | Uso                                             |
| ---------------------------- | ------------- | ----------------------------------------------- |
| AWS SAM                      | Framework     | Build, test, deploy Lambda functions            |
| Serverless Framework         | Framework     | Multi-cloud serverless deployment               |
| AWS CDK                      | IaC           | Define serverless infrastructure as code        |
| Functions Framework (Google) | Local testing | Run Cloud Functions locally                     |
| LocalStack                   | Emulator      | Local AWS services emulation                    |
| DynamoDB Local               | Testing       | Local DynamoDB for integration tests            |
| Powertools (AWS)             | Observability | Structured logging, tracing, metrics for Lambda |

### 57.5 Errores comunes (anti-patrones)

| Anti-patrón           | Problema                             | Solución                            |
| --------------------- | ------------------------------------ | ----------------------------------- |
| No cold start testing | Cold starts >5s in production        | Measure cold start as CI gate       |
| Shared Lambda role    | Over-privileged, blast radius        | Least-privilege per function        |
| No local testing      | "Works in cloud" syndrome            | SAM Local + emulators               |
| Giant functions       | Hard to test, debug, maintain        | Single responsibility per function  |
| No versioning         | Can't rollback broken deploy         | Versioned aliases + traffic routing |
| Sync dependencies     | Large package size, slow cold starts | Lambda Layers, tree shaking         |

### 57.6 Métricas recomendadas

| Métrica              | Target                    | Herramienta        |
| -------------------- | ------------------------- | ------------------ |
| Cold start latency   | <500ms (API), <2s (async) | Lambda monitoring  |
| Function error rate  | <0.1%                     | CloudWatch/Datadog |
| Deployment frequency | ≥1/day per function       | CI/CD analytics    |
| P99 latency          | <1s (API functions)       | X-Ray/Datadog      |
| Package size         | <50MB (compressed)        | SAM build output   |
| Test coverage        | >80% per function         | Coverage tools     |

### 57.7 Fuentes

| #   | Fuente                                                                                       |
| --- | -------------------------------------------------------------------------------------------- |
| 1   | AWS SAM Documentation — https://docs.aws.amazon.com/serverless-application-model/            |
| 2   | Serverless Framework — https://www.serverless.com/                                           |
| 3   | AWS Lambda Best Practices — https://docs.aws.amazon.com/lambda/latest/dg/best-practices.html |
| 4   | Google Cloud Functions — https://cloud.google.com/functions/docs/                            |
| 5   | Azure Functions — https://learn.microsoft.com/en-us/azure/azure-functions/                   |
| 6   | Powertools for AWS Lambda — https://docs.powertools.aws.dev/lambda/python/                   |
| 7   | LocalStack — https://localstack.cloud/                                                       |

### 57.8 Ejemplo práctico — SAM CI/CD Pipeline

```yaml
# template.yaml (SAM)
AWSTemplateFormatVersion: '2010-09-09'
Transform: AWS::Serverless-2016-10-31
Resources:
  ApiFunction:
    Type: AWS::Serverless::Function
    Properties:
      Handler: src/handlers/api.handler
      Runtime: nodejs22.x
      MemorySize: 256
      Timeout: 10
      Environment:
        Variables:
          TABLE_NAME: !Ref Table
      Policies:
        - DynamoDBCrudPolicy:
            TableName: !Ref Table
      Events:
        Api:
          Type: Api
          Properties:
            Path: /{proxy+}
            Method: ANY

# .github/workflows/serverless-ci.yml
name: Serverless CI/CD
on: [push]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683 # v4.2.2
      - name: Install SAM
        run: pip install aws-sam-cli
      - name: Build
        run: sam build
      - name: Start local emulator
        run: sam local start-api --warm-containers EAGER &
      - name: Run integration tests
        run: |
          sleep 5  # Wait for emulator
          npm run test:integration -- --baseUrl http://127.0.0.1:3000
      - name: Check cold start latency
        run: |
          COLD=$(sam local invoke ApiFunction --event events/cold-start.json --dry-run 2>&1 | grep "Duration" | awk '{print $2}')
          if (( $(echo "$COLD > 1000" | bc -l) )); then
            echo "FAIL: Cold start ${COLD}ms > 1000ms threshold"
            exit 1
          fi

  deploy:
    needs: test
    runs-on: ubuntu-latest
    environment: production
    steps:
      - uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683 # v4.2.2
      - name: Deploy
        run: sam deploy --guided --stack-name my-api
      - name: Canary test
        run: |
          # Route 10% traffic to new version
          aws lambda invoke --function-name my-api-canary response.json
          # Monitor for 5 minutes
          sleep 300
          # Check error rate < 1%
          ERROR_RATE=$(aws cloudwatch get-metric-statistics ... | jq '.Datapoints[0].Average')
          if (( $(echo "$ERROR_RATE > 0.01" | bc -l) )); then
            echo "FAIL: Error rate ${ERROR_RATE} > 1%"
            aws lambda update-alias --function-name my-api --name live --function-version $PREVIOUS_VERSION
            exit 1
          fi
```

---

## 58. Chaos Engineering en CI/CD

### 58.1 Descripción

Chaos Engineering es la práctica de **inyectar fallos controlados** en sistemas para descubrir vulnerabilidades antes de que causen incidentes en producción. En el contexto CI/CD, esto significa ejecutar chaos experiments como parte del pipeline: desde game days programados hasta chaos automático en staging después de cada deploy.

### 58.2 Tipos de Chaos en Pipeline

| Tipo              | Timing                      | Impacto                                         | Herramienta                |
| ----------------- | --------------------------- | ----------------------------------------------- | -------------------------- |
| Pre-deploy chaos  | Antes de production deploy  | Validar resilience antes de cambios             | Chaos Mesh, Litmus         |
| Post-deploy chaos | Después de deploy a staging | Verificar que el deploy no degradó resilience   | Gremlin, AWS FIS           |
| Scheduled chaos   | Cron job semanal/quincenal  | Descubrir drift de resilience en el tiempo      | Litmus, Chaos Toolkit      |
| Continuous chaos  | Siempre activo en staging   | Resilience como propiedad continua              | Chaos Mesh + Argo Rollouts |
| Game day          | Evento planificado          | Ejercicios de equipo, tabletop + ejecución real | Gremlin, manual            |

### 58.3 Prácticas recomendadas

1. **Start in staging, never in production blind**: Ejecutar chaos primero en staging; production solo con guardrails
2. **Hypothesis-driven**: Cada experimento tiene hipótesis ("si muere el DB replica, el sistema degrada graceful")
3. **Blast radius control**: Limitar impacto a un service/namespace; timeouts automáticos
4. **Steady state hypothesis**: Definir qué métricas indican "normal" antes de inyectar fallos
5. **Automation en CI**: Chaos como job del pipeline post-deploy; failure = rollback automático
6. **Failure budgets**: Combinar chaos con SLO/error budgets; chaos exceed budget → alert
7. **Canary analysis integration**: Argo Rollouts AnalysisTemplate que ejecuta chaos; si métricas degradan → rollback
8. **Observability first**: No hacer chaos sin observabilidad completa; necesitas ver el impacto
9. **Runbook correlation**: Cada chaos scenario debe tener runbook asociado para respuesta
10. **Regular cadence**: Weekly chaos en staging; monthly game days; quarterly production drills

### 58.4 Herramientas comunes

| Herramienta                   | Tipo              | Uso                                            |
| ----------------------------- | ----------------- | ---------------------------------------------- |
| Chaos Mesh                    | Kubernetes-native | Pod/container/network/pod chaos en K8s         |
| Litmus Chaos                  | Kubernetes-native | Chaos experiments como CRDs                    |
| Gremlin                       | SaaS/On-prem      | Enterprise chaos platform, game days           |
| AWS Fault Injection Simulator | Cloud-native      | Chaos en servicios AWS                         |
| Toxiproxy                     | Network           | Proxy para inyectar latencia/break connections |
| Chaos Toolkit                 | Framework         | Declarative chaos experiments                  |
| PowerMix                      | Data              | Chaos en data pipelines                        |
| Pumba                         | Docker            | Container chaos (pause, stop, kill)            |

### 58.5 Scenarios comunes y su impacto

| Scenario           | What breaks       | Expected behavior                           | Pipeline gate                   |
| ------------------ | ----------------- | ------------------------------------------- | ------------------------------- |
| Kill DB primary    | Database failover | Replica promotes; <30s downtime             | Failover time <30s              |
| Network partition  | Service isolation | Circuit breaker opens; graceful degradation | Error rate <5% during partition |
| CPU stress (100%)  | Slow processing   | Queue backs up; no crash                    | No OOM kills                    |
| DNS failure        | Service discovery | Fallback to cached DNS; eventual recovery   | Response time <2s               |
| Disk full          | Write failures    | Logs truncate; app stays alive              | No crash; alert fires           |
| Dependency down    | External service  | Retry + circuit breaker; fallback response  | Fallback returns valid response |
| Certificate expiry | TLS failures      | Auto-renewal or graceful degradation        | No connection refused errors    |

### 58.6 Errores comunes (anti-patrones)

| Anti-patrón              | Problema                  | Solución                                           |
| ------------------------ | ------------------------- | -------------------------------------------------- |
| Chaos sin observabilidad | Can't measure impact      | Observability first; dashboards before experiments |
| One-shot chaos           | "We tested once"          | Continuous/scheduled chaos                         |
| No hypothesis            | Chaos for chaos sake      | Every experiment has measurable hypothesis         |
| Unbounded blast radius   | Takes down production     | Blast radius control + automatic abort             |
| No rollback plan         | Chaos breaks, no recovery | Automated rollback on metric degradation           |
| Skip staging             | Direct production chaos   | Staging first; production with extreme caution     |

### 58.7 Métricas recomendadas

| Métrica                      | Target                         | Herramienta              |
| ---------------------------- | ------------------------------ | ------------------------ |
| Chaos experiment pass rate   | >90%                           | Chaos platform dashboard |
| Mean time to recovery (MTTR) | <5 min for controlled failures | Incident tracking        |
| Failure budget remaining     | >20% after chaos               | SLO monitoring           |
| Game day participation       | >80% team members              | Event tracking           |
| Chaos scenarios covered      | >10 per critical service       | Chaos registry           |
| Automated rollback on chaos  | 100% of staging deploys        | Argo Rollouts analysis   |

### 58.8 Fuentes

| #   | Fuente                                                                               |
| --- | ------------------------------------------------------------------------------------ |
| 1   | Principles of Chaos Engineering — https://principlesofchaos.org/                     |
| 2   | Chaos Mesh Documentation — https://chaos-mesh.org/                                   |
| 3   | Litmus Chaos — https://litmuschaos.io/                                               |
| 4   | Gremlin Documentation — https://www.gremlin.com/                                     |
| 5   | AWS FIS — https://docs.aws.amazon.com/fis/                                           |
| 6   | Chaos Toolkit — https://chaostoolkit.org/                                            |
| 7   | Google SRE: Testing for Resilience — https://sre.google/sre-book/testing-resilience/ |
| 8   | Netflix Chaos Monkey — https://netflix.github.io/chaosmonkey/                        |

### 58.9 Ejemplo práctico — GitHub Actions (YAML)

```yaml
name: Chaos Engineering Pipeline
on:
  schedule:
    - cron: '0 3 * * 1' # Weekly Monday 3am
  workflow_dispatch:

jobs:
  chaos-staging:
    runs-on: ubuntu-latest
    environment: staging
    steps:
      - uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683 # v4.2.2
      - name: Install Chaos Mesh
        run: |
          helm repo add chaos-mesh https://charts.chaos-mesh.org
          helm install chaos-mesh chaos-mesh/chaos-mesh -n chaos-testing
      - name: Inject network latency
        run: |
          cat <<EOF | kubectl apply -f -
          apiVersion: chaos-mesh.org/v1alpha1
          kind: NetworkChaos
          metadata:
            name: api-latency-test
            namespace: staging
          spec:
            action: delay
            mode: all
            selector:
              labelSelectors:
                app: api-server
            delay:
              latency: "500ms"
              jitter: "100ms"
            duration: "5m"
          EOF
      - name: Monitor metrics during chaos
        run: |
          # Wait for chaos to take effect
          sleep 60
          # Check error rate
          ERROR_RATE=$(curl -s "$PROMETHEUS_URL/api/v1/query?query=rate(http_requests_total{status=~'5..'}[5m])" | jq '.data.result[0].value[1]' -r)
          if (( $(echo "$ERROR_RATE > 0.05" | bc -l) )); then
            echo "FAIL: Error rate ${ERROR_RATE} > 5% during chaos"
            kubectl delete networkchaos api-latency-test -n staging
            exit 1
          fi
          echo "PASS: Error rate ${ERROR_RATE} < 5% during chaos"
      - name: Cleanup chaos
        if: always()
        run: kubectl delete networkchaos --all -n staging

  chaos-auto-rollback:
    needs: chaos-staging
    if: failure()
    runs-on: ubuntu-latest
    steps:
      - name: Trigger rollback
        run: |
          echo "Chaos failed — rolling back to previous deployment"
          # Rollback logic here
```

---

## 59. FinOps para CI/CD

### 59.1 Descripción

FinOps para CI/CD es la práctica de **gestionar el costo de las pipelines** como un activo financiero: visibilidad de costos por equipo/proyecto, chargeback/showback, forecasting, y optimización continua. Los costos de CI/CD incluyen: minutos de runner, almacenamiento de artifacts, transferencia de datos, y servicios auxiliares (SonarQube, Snyk, etc.).

### 59.2 Desglose de costos CI/CD

| Componente           | Cost driver                           | Optimization lever                      |
| -------------------- | ------------------------------------- | --------------------------------------- |
| Runner minutes       | Parallel jobs × duration × tier       | Caching, affected-only, right-sizing    |
| Storage (artifacts)  | Retention days × artifact size        | Shorter retention, compression          |
| Storage (logs)       | Retention days × log verbosity        | Structured logging, shorter retention   |
| Docker registry      | Image size × pull frequency × storage | Multi-stage, slim images, ECR lifecycle |
| Secrets rotation     | Rotation frequency × secrets count    | Automated rotation, JIT secrets         |
| Security scanning    | Scans per build × tool cost           | Conditional scanning, open-source tools |
| Feature flags        | MAU × flag count                      | Flag cleanup automation                 |
| Preview environments | Uptime × resource count               | Ephemeral environments, auto-shutdown   |

### 59.3 Prácticas recomendadas

1. **Tag everything**: Cada job/consume tiene tags de team, project, environment para chargeback
2. **Budgets per team**: Asignar presupuesto CI/CD por equipo; alertar al 80% y 100%
3. **Showback reports**: Dashboard visible de costos CI/CD por equipo; transparencia sin casting blame
4. **Forecasting**: Predecir costos basado en tendencias; ajustar budgets según crecimiento
5. **Optimization cadence**: Monthly review de costos; identificar top consumers; optimizar
6. **Right-size runners**: No 8-core para lint jobs; match runner size a workload real
7. **Cache aggressively**: 30-60% reducción en costo con cache hits correctos
8. **Conditional scanning**: No ejecutar DAST en PRs small; solo en deploys a staging/production
9. **Preview environment lifecycle**: Auto-shutdown after 24h; branch delete cleanup
10. **Cross-tool visibility**: Agregar costos de CI + cloud + security tools en un dashboard

### 59.4 Herramientas comunes

| Herramienta             | Categoría            | Uso                               |
| ----------------------- | -------------------- | --------------------------------- |
| GitHub Actions billing  | Runner cost          | Cost breakdown by workflow/org    |
| Infracost               | IaC cost             | Cost estimation before deploy     |
| Kubecost                | Kubernetes cost      | Cost per namespace/deployment     |
| CloudHealth             | Multi-cloud          | Cost aggregation and optimization |
| Datadog Cost Management | Observability + cost | Correlate cost with performance   |
| Custom dashboards       | Reporting            | Chargeback/showback por team      |

### 59.5 Modelo FinOps CI/CD

```
┌─────────────────────────────────────────────────────┐
│                    FINOPS CYCLE                      │
│                                                      │
│   ┌──────────┐    ┌──────────┐    ┌──────────┐     │
│   │ INFORM   │───>│ OPTIMIZE │───>│ OPERATE  │     │
│   │          │    │          │    │          │     │
│   │ • Dashboards│ │ • Right-size│ │ • Budgets│     │
│   │ • Showback  │ │ • Cache    │ │ • Alerts │     │
│   │ • Allocation│ │ • Skip     │ │ • Forecast│    │
│   └──────────┘    └──────────┘    └──────────┘     │
│        │                                │            │
│        └────────────────────────────────┘            │
│              Continuous feedback loop                │
└─────────────────────────────────────────────────────┘
```

### 59.6 Errores comunes (anti-patrones)

| Anti-patrón                    | Problema                    | Solución                        |
| ------------------------------ | --------------------------- | ------------------------------- |
| No tagging                     | Can't attribute costs       | Tag every job with team/project |
| No budgets                     | Surprises at month end      | Budgets per team with alerts    |
| Always-on preview environments | $500+/month wasted          | Auto-shutdown after 24h         |
| Oversized runners              | Pay for cores you don't use | Right-size per workload         |
| No cache                       | Rebuilding everything       | Cache dependencies + artifacts  |
| Ignoring storage costs         | Artifacts accumulate        | Retention policies, compression |

### 59.7 Métricas recomendadas

| Métrica                  | Target           | Herramienta             |
| ------------------------ | ---------------- | ----------------------- |
| CI/CD cost per deploy    | Decreasing trend | Billing dashboard       |
| Cost per team (showback) | Allocated 100%   | Custom dashboard        |
| Cache hit rate           | >80%             | Actions cache analytics |
| Runner utilization       | >60% active time | Runner fleet monitoring |
| Storage growth rate      | <10% MoM         | Registry billing        |
| Budget adherence         | <100% per team   | Budget alerts           |

### 59.8 Fuentes

| #   | Fuente                                                          |
| --- | --------------------------------------------------------------- |
| 1   | FinOps Foundation — https://finops.org/                         |
| 2   | GitHub Actions Billing — https://docs.github.com/en/billing/    |
| 3   | Infracost — https://www.infracost.io/                           |
| 4   | Kubecost — https://www.kubecost.com/                            |
| 5   | FinOps for Cloud — https://www.finopscloud.org/                 |
| 6   | O'Reilly: FinOps — https://www.oreilly.com/library/view/finops/ |

### 59.9 Ejemplo práctico — Cost Tracking in Pipeline

```yaml
name: CI/CD with Cost Tracking
on: [push]

jobs:
  build:
    runs-on: ubuntu-latest
    outputs:
      cost-minutes: ${{ steps.timer.outputs.minutes }}
    steps:
      - name: Start timer
        id: timer-start
        run: echo "start=$(date +%s)" >> $GITHUB_OUTPUT
      - uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683 # v4.2.2
      - name: Build
        run: npm ci && npm run build
      - name: Calculate cost
        id: timer
        run: |
          START=${{ steps.timer-start.outputs.start }}
          END=$(date +%s)
          DURATION=$((END - START))
          MINUTES=$((DURATION / 60))
          COST=$(echo "scale=2; $MINUTES * 0.008" | bc)  # Linux rate
          echo "minutes=$MINUTES" >> $GITHUB_OUTPUT
          echo "cost=\$$COST" >> $GITHUB_OUTPUT
      - name: Report cost
        run: |
          echo "## CI/CD Cost Report" >> $GITHUB_STEP_SUMMARY
          echo "- **Job**: ${{ github.job }}" >> $GITHUB_STEP_SUMMARY
          echo "- **Duration**: ${{ steps.timer.outputs.minutes }} minutes" >> $GITHUB_STEP_SUMMARY
          echo "- **Estimated cost**: ${{ steps.timer.outputs.cost }}" >> $GITHUB_STEP_SUMMARY
          echo "- **Team**: platform-team" >> $GITHUB_STEP_SUMMARY
          echo "- **Project**: ${{ github.repository }}" >> $GITHUB_STEP_SUMMARY
```

---

## 60. DORA Capabilities Model

### 60.1 Descripción

El modelo de capabilities de DORA (DevOps Research and Assessment) define **24 capacidades organizacionales** que predicen el rendimiento de software delivery. Estas capabilities están agrupadas en categorías y mapeadas directamente a implementaciones específicas en el pipeline CI/CD.

### 60.2 DORA Capabilities Canónicas → Pipeline

Las capabilities DORA oficiales provienen de https://dora.dev/capabilities/. La siguiente tabla mapea las capabilities DORA canónicas a las secciones del documento.

**DORA Continuous Delivery Core:**

| Capability DORA (oficial)  | Impact | Pipeline Section |
| -------------------------- | ------ | ---------------- |
| Test automation            | HIGH   | 4, 6, 36         |
| Deployment automation      | HIGH   | 13, 28           |
| Trunk-based development    | HIGH   | 41               |
| Pervasive security         | HIGH   | 20, 51           |
| Loosely coupled teams      | HIGH   | 38, 52           |
| Version control            | HIGH   | 1                |
| Database change management | MEDIUM | 33               |
| Monitoring & observability | HIGH   | 14, 40           |
| Test data management       | MEDIUM | 36               |
| Proactive notification     | MEDIUM | 44               |
| Code maintainability       | MEDIUM | 2, 42            |

**DORA Software Delivery Performance:**

| Capability DORA (oficial)           | Impact | Pipeline Section |
| ----------------------------------- | ------ | ---------------- |
| Continuous integration              | HIGH   | 1-6              |
| Shift-left security                 | HIGH   | 20, 51           |
| Progressive delivery                | HIGH   | 27               |
| Cloud infrastructure                | HIGH   | 32, 47           |
| Lightweight change approval process | HIGH   | 13               |
| Working in small batches            | MEDIUM | 41, 46           |
| Visual management                   | MEDIUM | 40, 44           |

**DORA Operational Excellence:**

| Capability DORA (oficial)        | Impact | Pipeline Section |
| -------------------------------- | ------ | ---------------- |
| Lean management practices        | MEDIUM | 41               |
| Limit WIP                        | MEDIUM | 41, 46           |
| Empowering teams to choose tools | HIGH   | 18, 52           |
| Value stream visibility          | HIGH   | 40               |

**Complementarias (no DORA, pero prácticas CI/CD estándar):**

| Practice               | Impact | Pipeline Section |
| ---------------------- | ------ | ---------------- |
| Infrastructure as code | HIGH   | 32               |
| Artifact management    | MEDIUM | 39               |
| Environment management | MEDIUM | 35               |
| Dependency management  | MEDIUM | 42               |
| Release management     | MEDIUM | 43               |
| Feature flags          | MEDIUM | 46               |
| Incident management    | MEDIUM | 41               |
| Platform engineering   | HIGH   | 52               |
| Developer experience   | MEDIUM | 55               |

### 60.3 Assessment Framework

```yaml
# DORA Capabilities Assessment
assessment:
  team: platform-team
  date: 2026-08-17
  capabilities:
    test_automation:
      score: 4 # 1-5 scale
      evidence: 'Vitest + Playwright, >80% coverage, mutation testing planned'
      gap: 'No mutation testing yet'
      action: 'Add Stryker mutation testing (Q4)'

    deployment_automation:
      score: 3
      evidence: 'Auto-deploy staging; manual prod approval'
      gap: 'Production deploy not fully automated'
      action: 'Implement canary deploy with auto-rollback'

    trunk_based_development:
      score: 4
      evidence: 'Short-lived branches, PR workflow'
      gap: 'Some long-lived feature branches'
      action: 'Enforce feature flags over long branches'

    pervasive_security:
      score: 4
      evidence: 'SAST + SCA + secret scanning + OWASP mapping'
      gap: 'No DAST in pipeline'
      action: 'Add DAST to staging environment'

    loosely_coupled_teams:
      score: 3
      evidence: 'Monorepo with workspace boundaries'
      gap: 'Some cross-workspace dependencies'
      action: 'Define explicit API contracts between workspaces'

    monitoring_observability:
      score: 4
      evidence: 'OTel integration, deploy markers, SLO tracking'
      gap: 'No automated incident response'
      action: 'Implement runbook automation'

    platform_engineering:
      score: 2
      evidence: 'No formal platform team or IDP'
      gap: 'No golden paths, no self-service'
      action: 'Start Backstage pilot (Q3)'

    developer_experience:
      score: 3
      evidence: 'Good CI speed, some local parity'
      gap: 'No formal DevEx metrics'
      action: 'Implement DX Core 4 measurement'
```

### 60.4 Improvement Roadmap

| Quarter | Focus Capabilities                                 | Expected Impact                             |
| ------- | -------------------------------------------------- | ------------------------------------------- |
| Q3 2026 | Platform engineering (2→3), DevEx (3→4)            | Faster onboarding, less toil                |
| Q4 2026 | Test automation (4→5), Deployment automation (3→4) | Higher quality, faster delivery             |
| Q1 2027 | Loosely coupled (3→4), Observability (4→5)         | Better resilience, faster incident response |
| Q2 2027 | All capabilities ≥4                                | Elite performer status                      |

### 60.5 Fuentes

| #   | Fuente                                                                 |
| --- | ---------------------------------------------------------------------- |
| 1   | DORA Core Model — https://dora.dev/capabilities/                       |
| 2   | Accelerate (Forsgren/Humble/Kim)                                       |
| 3   | DORA State of DevOps 2025 — https://dora.dev/dora-report-2025/         |
| 4   | Google Cloud DevOps Assessment — https://cloud.google.com/architecture |
| 5   | CD Foundation — https://cd.foundation/                                 |
| 6   | Microsoft DevOps Maturity — https://learn.microsoft.com/en-us/devops/  |

---

## 61. Pipeline Self-healing

### 61.1 Descripción

Pipeline self-healing es la capacidad de un sistema CI/CD para **detectar y corregir automáticamente problemas** sin intervención humana. Incluye: auto-retry de fallos transitorios, quarantine de flaky tests, rollback automático ante métricas degradadas, y auto-reparación de runners.

### 61.2 Capabilities de Self-healing

| Capability              | Trigger                         | Action                         | Tool                            |
| ----------------------- | ------------------------------- | ------------------------------ | ------------------------------- |
| Auto-retry transitorio  | Network timeout, 5xx transient  | Retry with exponential backoff | GitHub Actions retry actions    |
| Flaky test quarantine   | Test fails 3/5 times            | Quarantine test, skip in CI    | Flaky test detection scripts    |
| Auto-rollback           | Post-deploy metrics degradation | Rollback to previous version   | Argo Rollouts, Flagger          |
| Runner auto-repair      | Runner health check fail        | Replace runner in fleet        | ARC (Actions Runner Controller) |
| Dependency fallback     | CDN/registry down               | Use cached/mirror              | Registry mirror, cache fallback |
| Pipeline state recovery | Workflow stuck >30min           | Cancel and retry               | GitHub Actions timeout          |

### 61.3 Prácticas recomendadas

1. **Retry with backoff**: Auto-retry fallos transitorios (network, 5xx) con exponential backoff; max 3 retries
2. **Flaky test detection**: Track test pass rate over last 10 runs; quarantine si <70% pass rate
3. **Metric-gated rollback**: Post-deploy, monitorear error rate/latency; si degradan >threshold → auto-rollback
4. **Runner health checks**: Health endpoint por runner; si falla → removeFrom pool + provision new
5. **Cache fallback**: Si CDN/registry falla → usar cache local; si cache falla → usar mirror
6. **Circuit breaker en pipeline**: Si un step falla 3 veces consecutivas → abort pipeline, alert team
7. **State persistence**: Pipeline state guardado; si runner muere → resume desde último step exitoso
8. **Self-healing dashboards**: Visibilidad de auto-healing events; audit trail de correcciones automáticas

### 61.4 Errores comunes (anti-patrones)

| Anti-patrón               | Problema                     | Solución                            |
| ------------------------- | ---------------------------- | ----------------------------------- |
| Infinite retry            | Pipeline hangs forever       | Max retries + backoff cap           |
| No flaky quarantine       | Flaky tests block all merges | Auto-quarantine after 3 failures    |
| No metric-gated rollback  | Bad deploy stays in prod     | Auto-rollback on metric degradation |
| Manual runner replacement | Ops overhead                 | ARC auto-scaling + health checks    |
| No circuit breaker        | Cascading failures           | Abort after 3 consecutive failures  |

### 61.5 Métricas recomendadas

| Métrica                    | Target                    | Herramienta             |
| -------------------------- | ------------------------- | ----------------------- |
| Auto-retry success rate    | >80% of retries succeed   | Pipeline analytics      |
| Flaky test quarantine time | <1 hour from first flake  | Flaky detection script  |
| Auto-rollback frequency    | Tracks metric degradation | Argo Rollouts metrics   |
| Runner availability        | >99.5%                    | Runner fleet monitoring |
| Pipeline recovery rate     | >90% self-healed          | Self-healing dashboard  |

### 61.6 Fuentes

| #   | Fuente                                                                                 |
| --- | -------------------------------------------------------------------------------------- |
| 1   | GitHub Actions: Automatic Retries — https://docs.github.com/en/actions                 |
| 2   | Argo Rollouts Analysis — https://argo-rollouts.readthedocs.io/                         |
| 3   | ARC (Actions Runner Controller) — https://github.com/actions/actions-runner-controller |
| 4   | Google SRE: Error Budgets — https://sre.google/sre-book/                               |
| 5   | Netflix: Auto-healing Infrastructure — https://netflix.github.io/                      |

### 61.7 Ejemplo práctico — Self-healing Pipeline

```yaml
name: Self-healing CI/CD
on: [push]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683 # v4.2.2
      - name: Build with auto-retry
        uses: nick-fields/retry@7f8f3d9f0f78d6e295857f55d864026dd5b8c4e3 # v3.0.2
        with:
          timeout_minutes: 10
          max_attempts: 3
          command: npm ci && npm run build
          retry_wait_seconds: 30

  test:
    needs: build
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683 # v4.2.2
      - name: Run tests
        run: npm run test:unit -- --reporter=json > test-results.json
      - name: Check flaky tests
        run: |
          # Load test history
          FLAKY=$(python scripts/check_flaky.py test-results.json --threshold 0.7)
          if [ "$FLAKY" != "" ]; then
            echo "Quarantining flaky tests: $FLAKY"
            echo "## Flaky Tests Quarantined" >> $GITHUB_STEP_SUMMARY
            echo "$FLAKY" >> $GITHUB_STEP_SUMMARY
          fi

  deploy-canary:
    needs: test
    runs-on: ubuntu-latest
    environment: production
    steps:
      - name: Deploy canary (10%)
        run: |
          kubectl set image deployment/app-canary app=app:${{ github.sha }}
          kubectl rollout status deployment/app-canary --timeout=120s
      - name: Monitor for 10 min
        run: |
          sleep 600
          ERROR_RATE=$(curl -s "$PROMETHEUS_URL/api/v1/query?query=rate(http_requests_total{status=~'5..',version='canary'}[5m])" | jq '.data.result[0].value[1]' -r)
          LATENCY=$(curl -s "$PROMETHEUS_URL/api/v1/query?query=histogram_quantile(0.99,rate(http_request_duration_seconds_bucket{version='canary'}[5m]))" | jq '.data.result[0].value[1]' -r)

          # Self-healing: auto-rollback if metrics degrade
          if (( $(echo "$ERROR_RATE > 0.05" | bc -l) )); then
            echo "AUTO-ROLLBACK: Error rate ${ERROR_RATE} > 5%"
            kubectl rollout undo deployment/app-canary
            exit 1
          fi
          if (( $(echo "$LATENCY > 2.0" | bc -l) )); then
            echo "AUTO-ROLLBACK: P99 latency ${LATENCY}s > 2s"
            kubectl rollout undo deployment/app-canary
            exit 1
          fi
          echo "Metrics healthy — promoting canary to production"
      - name: Promote to production
        if: success()
        run: |
          kubectl set image deployment/app-prod app=app:${{ github.sha }}
          kubectl rollout status deployment/app-prod --timeout=300s
```

---

## 62. Mobile CI/CD (iOS/Android)

### 62.1 Descripción

Mobile CI/CD tiene requerimientos únicos: code signing (certificados + provisioning profiles), submission a stores (TestFlight/Play Store), testing en dispositivos reales, gestión de versiones de build, y costo premium de runners macOS (10x Linux).

### 62.2 Pipeline Mobile

| Stage            | iOS                     | Android                       | Diferencia vs. Web         |
| ---------------- | ----------------------- | ----------------------------- | -------------------------- |
| Build            | xcodebuild              | Gradle                        | Compile nativo, no bundle  |
| Code signing     | Certificates + Profiles | Keystore + signing config     | Complejidad significativa  |
| Testing          | XCTest + Simulator      | Espresso + Emulator           | Emuladores pesados         |
| Store submission | TestFlight / App Store  | Play Console / internal track | Review policies diferentes |
| Distribution     | TestFlight beta         | Firebase App Distribution     | Tracks de rollout          |

### 62.3 Prácticas recomendadas

1. **Fastlane para automatización**: FastlaneMatch para certificates, Fastlane gym/build, Fastlane pilot/upload
2. **Code signing seguro**: Certificados en keychain temporal; nunca en repo; usar Fastlane Match o S3
3. **Device farm testing**: AWS Device Farm, Firebase Test Lab para testing en dispositivos reales
4. **Store submission como gate**: Approval manual antes de submit a stores; automated después de confianza
5. **Staged rollouts**: Play Store: 1% → 10% → 50% → 100%; TestFlight: internal → external
6. **Build versioning**: SemVer + build number auto-increment; no conflictos entre branches
7. **macOS runner optimization**: Minimizar tiempo en macOS runners (costoso); cache de DerivedData
8. **Binary artifact management**: App Center, Firebase para gestionar builds y distribución

### 62.4 Herramientas comunes

| Herramienta       | Categoría            | Uso                                  |
| ----------------- | -------------------- | ------------------------------------ |
| Fastlane          | Automation           | Build, sign, test, submit            |
| Match (Fastlane)  | Code signing         | Certificate/profile management       |
| AWS Device Farm   | Testing              | Real device testing                  |
| Firebase Test Lab | Testing              | Android device testing               |
| App Center        | Distribution         | Build distribution + crash reporting |
| TestFlight        | iOS distribution     | Apple beta testing                   |
| Play Console      | Android distribution | Google beta testing                  |

### 62.5 Errores comunes (anti-patrones)

| Anti-patrón             | Problema                            | Solución                       |
| ----------------------- | ----------------------------------- | ------------------------------ |
| Certificates in repo    | Security risk, revocation headaches | Fastlane Match + S3            |
| No device testing       | "Works on simulator" syndrome       | Device farm in CI              |
| Manual store submission | Slow release cycle                  | Fastlane upload                |
| No staged rollout       | 100% rollout of broken build        | Staged rollout with monitoring |
| macOS runner always-on  | High cost                           | Ephemeral macOS runners        |

### 62.6 Métricas recomendadas

| Métrica                | Target    | Herramienta         |
| ---------------------- | --------- | ------------------- |
| Build time (iOS)       | <15 min   | CI analytics        |
| Build time (Android)   | <10 min   | CI analytics        |
| Store review time      | <24 hours | Store analytics     |
| Crash-free rate        | >99.5%    | Crashlytics         |
| Beta tester engagement | >50%      | TestFlight/Firebase |

### 62.7 Fuentes

| #   | Fuente                                                                        |
| --- | ----------------------------------------------------------------------------- |
| 1   | Fastlane Documentation — https://docs.fastlane.tools/                         |
| 2   | Apple TestFlight — https://developer.apple.com/testflight/                    |
| 3   | Google Play Console — https://developer.android.com/console                   |
| 4   | AWS Device Farm — https://aws.amazon.com/device-farm/                         |
| 5   | Firebase App Distribution — https://firebase.google.com/docs/app-distribution |
| 6   | Codemagic CI/CD — https://codemagic.io/                                       |

### 62.8 Ejemplo práctico — Fastlane CI/CD

```yaml
name: Mobile CI/CD
on: [push]

jobs:
  build-ios:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683 # v4.2.2
      - name: Setup certificates
        uses: apple-actions/import-codesign-certs@674f1b8f90c8388f3e7684513927536332861d44 # v3
        with:
          p12-file-base64: ${{ secrets.IOS_CERTIFICATES_P12 }}
          p12-password: ${{ secrets.IOS_CERTIFICATES_PASSWORD }}
      - name: Install pods
        run: cd ios && pod install
      - name: Build iOS
        run: |
          cd ios
          fastlane gym --scheme MyApp --outputdirectory ../build
      - name: Upload to TestFlight
        run: |
          fastlane pilot upload --api_key ${{ secrets.APP_STORE_CONNECT_API_KEY }}
      - name: Run UI tests
        run: |
          fastlane scan --scheme MyAppUITests --devices "iPhone 15" --clean

  build-android:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683 # v4.2.2
      - name: Setup Java
        uses: actions/setup-java@c5195efecf7bdfc987ee8bae7a71cb8b11521c00 # v4.2.1
        with:
          java-version: '21'
          distribution: 'temurin'
      - name: Build Android
        run: |
          cd android
          ./gradlew assembleRelease
      - name: Upload to Play Store
        run: |
          fastlane supply --track internal --apk android/app/build/outputs/apk/release/app-release.apk
```

---

## 63. Data Pipeline CI/CD

### 63.1 Descripción

Data Pipeline CI/CD aplica prácticas de integración continua a **pipelines de datos**: ETL/ELT jobs, data transformations (dbt), data quality validation, schema evolution, y data catalog management. Incluye testing de datos, lineage tracking, y data contracts.

### 63.2 Pipeline Data

| Stage                  | Tool                        | Validation                        |
| ---------------------- | --------------------------- | --------------------------------- |
| Schema validation      | Great Expectations, Pandera | Column types, nulls, ranges       |
| Data quality           | dbt tests, Soda             | Uniqueness, referential integrity |
| Transformation testing | dbt --dry-run               | SQL syntax, materialization       |
| Data lineage           | OpenLineage, Marquez        | Upstream/downstream impact        |
| Data catalog           | DataHub, Amundsen           | Discovery, documentation          |
| Contract validation    | Data Contracts spec         | Schema compatibility              |

### 63.3 Prácticas recomendadas

1. **Data contracts**: Definir schemas explícitos entre producers y consumers; validate in CI
2. **dbt as CI/CD**: dbt build --select state:modified+ for affected-only transformations
3. **Data quality gates**: Great Expectations suites ejecutadas como CI jobs; failure = block merge
4. **Schema evolution testing**: Validar que cambios de schema no rompen consumers downstream
5. **Lineage tracking**: OpenLineage para trackear dependencies entre data assets
6. **Data catalog freshness**: Alertar cuando data assets no se actualizan >N days
7. **Secret rotation for data**: Rotate database credentials, API keys for data sources
8. **Backfill automation**: Scripts para reprocess historical data cuando cambian transformations

### 63.4 Herramientas comunes

| Herramienta        | Categoría       | Uso                            |
| ------------------ | --------------- | ------------------------------ |
| dbt                | Transformation  | SQL-based data transformation  |
| Great Expectations | Data validation | Data quality tests             |
| OpenLineage        | Lineage         | Data pipeline lineage tracking |
| Soda Core          | Data quality    | Data monitoring + testing      |
| DataHub            | Catalog         | Data discovery + documentation |
| Dagster            | Orchestration   | Data pipeline orchestration    |
| Airflow            | Orchestration   | Batch data pipeline scheduling |

### 63.5 Errores comunes (anti-patrones)

| Anti-patrón                 | Problema                            | Solución                    |
| --------------------------- | ----------------------------------- | --------------------------- |
| No data contracts           | Breaking changes propagate silently | Explicit schema contracts   |
| No data quality tests       | Bad data in production              | Great Expectations gates    |
| No lineage tracking         | Can't trace data issues             | OpenLineage integration     |
| Manual backfills            | Error-prone, slow                   | Automated backfill scripts  |
| No schema evolution testing | Consumer breakage                   | Schema compatibility checks |

### 63.6 Métricas recomendadas

| Métrica                | Target                        | Herramienta        |
| ---------------------- | ----------------------------- | ------------------ |
| Data quality score     | >99%                          | Great Expectations |
| Schema compatibility   | 100% backward compatible      | Schema registry    |
| Data freshness         | <1 hour for critical datasets | DataHub            |
| Pipeline SLA adherence | >99%                          | Dagster/Airflow    |
| Lineage coverage       | >90% assets                   | OpenLineage        |

### 63.7 Fuentes

| #   | Fuente                                             |
| --- | -------------------------------------------------- |
| 1   | dbt Documentation — https://docs.getdbt.com/       |
| 2   | Great Expectations — https://greatexpectations.io/ |
| 3   | OpenLineage — https://openlineage.io/              |
| 4   | Soda Core — https://docs.soda.io/                  |
| 5   | DataHub — https://datahubproject.io/               |
| 6   | Dagster — https://dagster.io/                      |
| 7   | Data Contracts — https://www.datacontractspec.io/  |

### 63.8 Ejemplo práctico — dbt CI/CD

```yaml
name: Data Pipeline CI/CD
on: [pull_request]

jobs:
  data-quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683 # v4.2.2
      - name: Install dbt
        run: pip install dbt-postgres great-expectations
      - name: Validate data quality
        run: |
          great_expectations checkpoint run my_checkpoint
          # Fails if data quality suite fails
      - name: Schema compatibility check
        run: |
          python scripts/schema_compat_check.py \
            --current schema/current.json \
            --proposed schema/proposed.json \
            --breaking-changes-disallowed
      - name: dbt build (affected only)
        run: |
          dbt ls --select state:modified+ --state target/ --profiles-dir .dbt/
          dbt build --select state:modified+ --state target/ --profiles-dir .dbt/
      - name: Data lineage report
        run: |
          dbt docs generate --profiles-dir .dbt/
          # Upload to data catalog
```

---

## 64. WebAssembly (WASM) CI/CD

### 64.1 Descripción

WebAssembly (WASM) permite ejecutar código compilado en el browser, edge functions, y plugins sandboxed. En CI/CD, WASM tiene pipeline específicos: compilation a .wasm, testing en runtime WASM, deployment a edge (Cloudflare Workers, Fastly), y plugin systems basados en WASM.

### 64.2 Pipeline WASM

| Stage             | Tool                      | Validation                    |
| ----------------- | ------------------------- | ----------------------------- |
| Compilation       | wasm-pack, Emscripten     | Compile a .wasm               |
| Size validation   | wasm-opt                  | Bundle size < threshold       |
| Runtime testing   | wasmtime, Wasmer          | Execute tests en WASM runtime |
| Edge deployment   | Wrangler (CF), Fastly CLI | Deploy a edge network         |
| Plugin validation | WASI sandbox              | Security sandbox testing      |

### 64.3 Prácticas recomendadas

1. **Size budgets**: WASM binaries must be <1MB para browser; <10MB para edge; validate in CI
2. **Multi-target compilation**: Compilar para wasm32-wasi, wasm32-unknown-unknown, wasm32-emscripten
3. **Runtime testing**: Ejecutar tests en wasmtime/wasmer, no solo unit tests del código fuente
4. **WASI sandbox security**: Validar que WASM modules no acceden a filesystem/network sin permiso
5. **Edge deployment testing**: Test en staging environment del edge runtime antes de production
6. **Cache optimization**: WASM binaries son cacheables; proper Content-Type headers
7. **Backward compatibility**: Validar que nuevas versiones de WASM modules son backward compatible

### 64.4 Herramientas comunes

| Herramienta | Categoría    | Uso                            |
| ----------- | ------------ | ------------------------------ |
| wasm-pack   | Build        | Rust → WASM compilation        |
| Emscripten  | Build        | C/C++ → WASM compilation       |
| wasm-opt    | Optimization | Binary size optimization       |
| wasmtime    | Runtime      | WASM runtime for testing       |
| Wasmer      | Runtime      | WASM runtime + package manager |
| Wrangler    | Deployment   | Cloudflare Workers deployment  |
| WASI        | Standards    | System interface for WASM      |

### 64.5 Errores comunes (anti-patrones)

| Anti-patrón              | Problema                         | Solución                   |
| ------------------------ | -------------------------------- | -------------------------- |
| No size validation       | Giant WASM binaries slow load    | Size budget gate in CI     |
| Testing only on native   | WASM runtime differs from native | Test on wasmtime/wasmer    |
| No WASI sandbox          | Security risk                    | WASI permission validation |
| No backward compat check | Breaking changes for consumers   | Schema/version validation  |

### 64.6 Métricas recomendadas

| Métrica                | Target                   | Herramienta         |
| ---------------------- | ------------------------ | ------------------- |
| WASM binary size       | <1MB browser, <10MB edge | wasm-opt output     |
| Build time             | <5 min                   | CI analytics        |
| Runtime test pass rate | >95%                     | wasmtime test suite |
| Edge deploy latency    | <30s                     | Wrangler deploy log |

### 64.7 Fuentes

| #   | Fuente                                               |
| --- | ---------------------------------------------------- |
| 1   | WebAssembly.org — https://webassembly.org/           |
| 2   | wasm-pack — https://rustwasm.github.io/wasm-pack/    |
| 3   | WASI — https://wasi.dev/                             |
| 4   | wasmtime — https://wasmtime.dev/                     |
| 5   | Wasmer — https://wasmer.io/                          |
| 6   | Cloudflare Workers — https://workers.cloudflare.com/ |

---

## 65. Multi-cloud / Hybrid CI/CD

### 65.1 Descripción

Multi-cloud CI/CD gestiona pipelines que **despliegan a múltiples proveedores cloud** simultáneamente (AWS + GCP + Azure) o en configuraciones híbridas (on-prem + cloud). Requiere abstracciones de infra, testing cross-cloud, y deployment orchestration.

### 65.2 Pipeline Multi-cloud

| Stage   | Challenge                 | Solution                                |
| ------- | ------------------------- | --------------------------------------- |
| Build   | Cross-cloud compatibility | Container-based builds (cloud-agnostic) |
| Test    | Cloud-specific APIs       | Mock services + cloud integration tests |
| Deploy  | Different IaC per cloud   | Terraform multi-provider, Pulumi        |
| Monitor | Unified observability     | OTel + cloud-specific exporters         |
| Cost    | Multi-cloud billing       | FinOps aggregation tool                 |

### 65.3 Prácticas recomendadas

1. **Abstraction layer**: Usar containers (Docker) como unit de deployment; no cloud-specific bundles
2. **Terraform multi-provider**: Un solo código Terraform con providers múltiples (AWS + GCP + Azure)
3. **Cloud-specific testing**: Test features específicas de cada cloud en su environment
4. **Unified observability**: OpenTelemetry para métricas unificadas; exporters a cada cloud
5. **Cost aggregation**: Herramienta FinOps que agrega costos cross-cloud
6. **DR cross-cloud**: Si un cloud falla, failover a otro; testing de DR scenario
7. **Secrets per cloud**: Cada cloud tiene sus propios secrets; no cross-share
8. **Network connectivity**: VPN/interconnect entre clouds; latency testing

### 65.4 Herramientas comunes

| Herramienta | Categoría         | Uso                                    |
| ----------- | ----------------- | -------------------------------------- |
| Terraform   | IaC               | Multi-cloud infrastructure             |
| Pulumi      | IaC               | Multi-cloud with programming languages |
| Crossplane  | Kubernetes-native | Cloud-agnostic infrastructure          |
| Spacelift   | IaC management    | Terraform/CDK/Pulumi management        |
| OTel        | Observability     | Unified metrics across clouds          |
| Kubecost    | Cost              | Multi-cloud cost management            |

### 65.5 Errores comunes (anti-patrones)

| Anti-patrón                  | Problema                     | Solución                                    |
| ---------------------------- | ---------------------------- | ------------------------------------------- |
| Cloud lock-in                | Can't failover               | Abstraction layer, containers               |
| Separate pipelines per cloud | Duplication, inconsistency   | Unified pipeline with cloud-specific stages |
| No cross-cloud testing       | "Works on AWS, fails on GCP" | Integration tests per cloud                 |
| Shared secrets cross-cloud   | Blast radius                 | Separate secrets per cloud                  |

### 65.6 Métricas recomendadas

| Métrica                 | Target              | Herramienta     |
| ----------------------- | ------------------- | --------------- |
| Cloud coverage          | 100% planned clouds | Pipeline config |
| Cross-cloud deploy time | <15 min per cloud   | CI analytics    |
| DR failover time        | <5 min              | DR testing      |
| Cost visibility         | 100% cross-cloud    | FinOps tool     |

### 65.7 Fuentes

| #   | Fuente                                                                    |
| --- | ------------------------------------------------------------------------- |
| 1   | Terraform Multi-Cloud — https://www.terraform.io/docs/language/providers/ |
| 2   | Pulumi Cross-Cloud — https://www.pulumi.com/                              |
| 3   | Crossplane — https://www.crossplane.io/                                   |
| 4   | Spacelift — https://spacelift.io/                                         |
| 5   | OpenTelemetry — https://opentelemetry.io/                                 |
| 6   | FinOps Foundation — https://finops.org/                                   |

### 65.8 Ejemplo práctico — Multi-cloud Deploy

```yaml
name: Multi-cloud CI/CD
on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683 # v4.2.2
      - name: Build container
        run: docker build -t app:${{ github.sha }} .
      - name: Push to ECR
        run: |
          aws ecr get-login-password | docker login --username AWS --password-stdin $ECR_URL
          docker tag app:${{ github.sha }} $ECR_URL/app:${{ github.sha }}
          docker push $ECR_URL/app:${{ github.sha }}
      - name: Push to GCR
        run: |
          echo $GCP_KEY | base64 -d > /tmp/gcp-key.json
          gcloud auth activate-service-account --key-file=/tmp/gcp-key.json
          docker tag app:${{ github.sha }} gcr.io/$GCP_PROJECT/app:${{ github.sha }}
          docker push gcr.io/$GCP_PROJECT/app:${{ github.sha }}

  deploy-aws:
    needs: build
    runs-on: ubuntu-latest
    environment: aws-production
    steps:
      - uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683 # v4.2.2
      - name: Deploy to ECS
        run: |
          aws ecs update-service --cluster prod --service app --force-new-deployment
      - name: Health check
        run: |
          sleep 60
          STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://aws.example.com/health)
          [ "$STATUS" = "200" ] || exit 1

  deploy-gcp:
    needs: build
    runs-on: ubuntu-latest
    environment: gcp-production
    steps:
      - uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683 # v4.2.2
      - name: Deploy to Cloud Run
        run: |
          gcloud run deploy app --image gcr.io/$GCP_PROJECT/app:${{ github.sha }} --region us-central1
      - name: Health check
        run: |
          sleep 30
          STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://gcp.example.com/health)
          [ "$STATUS" = "200" ] || exit 1

  verify-multi-cloud:
    needs: [deploy-aws, deploy-gcp]
    runs-on: ubuntu-latest
    steps:
      - name: Cross-cloud connectivity test
        run: |
          # Verify both deployments are healthy
          AWS_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://aws.example.com/health)
          GCP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://gcp.example.com/health)
          echo "AWS: $AWS_STATUS | GCP: $GCP_STATUS"
          [ "$AWS_STATUS" = "200" ] && [ "$GCP_STATUS" = "200" ] || exit 1
      - name: Cost report
        run: |
          echo "## Multi-cloud Cost Report" >> $GITHUB_STEP_SUMMARY
          echo "- AWS: \$$(aws ce get-cost-and-usage ...)" >> $GITHUB_STEP_SUMMARY
          echo "- GCP: \$$(gcloud billing budgets list ...)" >> $GITHUB_STEP_SUMMARY
```

---

### Fuentes nuevas (Secciones 29-41)

| #   | Fuente                        | Secciones |
| --- | ----------------------------- | --------- |
| 96  | Docker Multi-stage Builds     | 29.3      |
| 29  | Docker Best Practices         | 29.3      |
| 30  | Trivy Security Scanner        | 29.3      |
| 31  | Anchore Grype                 | 29.3      |
| 32  | ECR Lifecycle Policies        | 29.3      |
| 33  | Kubernetes Deployments        | 30.3      |
| 34  | K8s Liveness/Readiness Probes | 30.3      |
| 35  | Argo Rollouts                 | 30.3      |
| 36  | Flagger                       | 30.3      |
| 37  | Helm Docs                     | 30.3      |
| 38  | Kustomize                     | 30.3      |
| 39  | Argo CD Documentation         | 31.3      |
| 40  | Flux CD                       | 31.3      |
| 41  | OpenGitOps                    | 31.3      |
| 42  | Sealed Secrets                | 31.3      |
| 43  | Terraform Backends            | 32.3      |
| 44  | OPA Policy Engine             | 32.3      |
| 45  | Checkov IaC Scanner           | 32.3      |
| 46  | Infracost                     | 32.3      |
| 47  | Terratest                     | 32.3      |
| 48  | Prisma Migrate                | 33.3      |
| 49  | Fowler ParallelChange         | 33.3      |
| 50  | Evolutionary Database Design  | 33.3      |
| 51  | Flyway                        | 33.3      |
| 52  | Atlas Schema Migrations       | 33.3      |
| 53  | GitHub Encrypted Secrets      | 34.3      |
| 54  | OIDC GitHub Actions           | 34.3      |
| 55  | HashiCorp Vault               | 34.3      |
| 56  | Mozilla SOPS                  | 34.3      |
| 57  | External Secrets Operator     | 34.3      |
| 58  | Gitleaks                      | 34.3      |
| 59  | Vercel Preview Environments   | 35.3      |
| 60  | Qovery                        | 35.3      |
| 61  | Telepresence                  | 35.3      |
| 62  | Skaffold                      | 35.3      |
| 63  | Pact Contract Testing         | 36.3      |
| 64  | Playwright Visual Regression  | 36.3      |
| 65  | axe-core Accessibility        | 36.3      |
| 66  | Litmus Chaos Engineering      | 36.3      |
| 67  | Stryker Mutation Testing      | 36.3      |
| 68  | Testcontainers                | 36.3      |
| 69  | SOC 2 Type II                 | 37.3      |
| 70  | GitHub Environments           | 37.3      |
| 71  | AWS CloudTrail                | 37.3      |
| 72  | PagerDuty                     | 37.3      |
| 73  | Turborepo                     | 38.3      |
| 74  | Nx Monorepo                   | 38.3      |
| 75  | Nx Graph                      | 38.3      |
| 76  | pnpm Workspaces               | 38.3      |
| 77  | Semantic Versioning           | 39.3      |
| 78  | cosign Signing                | 39.3      |
| 79  | Reproducible Builds           | 39.3      |
| 80  | SLSA Framework                | 39.3      |
| 81  | semantic-release              | 39.3      |
| 82  | OpenTelemetry CI/CD           | 40.3      |
| 83  | DORA Metrics                  | 40.3      |
| 84  | GitHub Flaky Test Retries     | 40.3      |
| 85  | BuildKite Analytics           | 40.3      |
| 86  | Trunk-Based Development       | 41.3      |
| 87  | GitHub Flow                   | 41.3      |
| 88  | GitHub Branch Protection      | 41.3      |
| 89  | AWS Disaster Recovery         | 41.3      |
| 90  | Google SRE Postmortem Culture | 41.3      |
| 91  | LaunchDarkly Feature Flags    | 41.3      |

---

## Apéndice A: Temas NICE-TO-HAVE (fuera de alcance para Node/Express + React monorepo)

Los siguientes temas son válidos en contextos de CI/CD empresarial pero están **fuera de alcance** para este proyecto específico (Node.js/Express backend + React/Vite frontend, desplegado en AWS). Se listan por completitud académica.

### A.1 Configuration Management (Ansible/Chef/Puppet)

**¿Por qué no está en el documento principal?** Infrastructure as Code (sección 32) cubre Terraform/Pulumi/CloudFormation para infraestructura. Configuration Management es una capa distinta — configura software en servidores existentes. Para este proyecto, Docker/Kubernetes (secciones 29-30) manejan runtime configuration; no hay servidores bare-metal que configurar.

| Tema                      | Herramienta             | Cuándo aplica                            |
| ------------------------- | ----------------------- | ---------------------------------------- |
| Server provisioning       | Ansible, Chef, Puppet   | Servidores bare-metal o VMs persistentes |
| Desired state enforcement | Ansible Pull, SaltStack | Infraestructura long-lived               |
| Compliance as code        | InSpec, Serverspec      | Auditoría continua de configuración      |
| Idempotent playbooks      | Ansible Playbooks       | Reproducibilidad de entornos             |
| Dynamic inventory         | Ansible + AWS plugin    | Auto-discovery de instancias             |

**Fuentes**: Ansible (https://ansible.com), Chef (https://chef.io), Puppet (https://puppet.com)

### A.2 Service Mesh CI/CD (Istio/Linkerd)

**¿Por qué no está?**: Service mesh agrega complejidad operacional innecesaria para una app monolítica que escala con containers. Aplica cuando hay múltiples microservicios con comunicación service-to-service significativa.

| Tema                  | Herramienta                                | Cuándo aplica                           |
| --------------------- | ------------------------------------------ | --------------------------------------- |
| Traffic management    | Istio VirtualService, Linkerd TrafficSplit | Canary/blue-green a nivel de red        |
| mTLS automation       | Istio, Linkerd                             | Zero-trust networking entre servicios   |
| Observability sidecar | Envoy proxy                                | Métricas de latencia/error por servicio |
| Policy enforcement    | OPA + Istio, Kyverno                       | Validación de requests en runtime       |
| Multi-cluster mesh    | Istio multi-primary                        | Despliegue cross-cluster                |

**Fuentes**: Istio (https://istio.io), Linkerd (https://linkerd.io), Consul Connect (https://consul.io)

### A.3 GraphQL / gRPC CI/CD

**¿Por qué no está?**: Este proyecto usa REST API. GraphQL y gRPC tienen patrones de CI/CD específicos (schema registry, contract testing, code generation) que no aplican.

| Tema                      | Herramienta                        | Cuándo aplica                   |
| ------------------------- | ---------------------------------- | ------------------------------- |
| Schema registry CI        | Apollo Studio, Buf Schema Registry | Validación de schema evolution  |
| Code generation gates     | buf generate, graphql-codegen      | Generación automática de tipos  |
| Contract testing          | Pact, Prisma                       | Verificación de compatibilidad  |
| Breaking change detection | buf breaking, GraphQL Inspector    | Gate en CI para schemas         |
| Persisted queries         | Apollo Router, Grafbase            | Optimización de queries en edge |

**Fuentes**: Apollo GraphQL (https://www.apollographql.com), Buf (https://buf.build), gRPC (https://grpc.io)

### A.4 Rate Limiting & Throttling en CI/CD

**¿Por qué no está?**: Rate limiting es un tema de API design y runtime, no de CI/CD pipeline. Se cubre implícitamente en la sección de GitHub Actions (throttling de API calls) pero merece mención explícita en contextos de alta escala.

| Tema                   | Herramienta                     | Cuándo aplica                              |
| ---------------------- | ------------------------------- | ------------------------------------------ |
| API rate limiting      | Kong, Envoy, express-rate-limit | Protección de APIs en producción           |
| GitHub API throttling  | Octokit throttling plugin       | Pipelines con muchas llamadas a GitHub API |
| Registry rate limiting | Docker Hub rate limits          | Builds concurrentes con pull de imágenes   |
| Runner scaling limits  | GitHub Actions concurrency      | Control de parallelismo de jobs            |
| Webhook deduplication  | Custom middleware               | Evitar duplicate processing de events      |

**Fuentes**: Kong (https://konghq.com), express-rate-limit (https://github.com/express-rate-limit/express-rate-limit), GitHub Actions concurrency (https://docs.github.com/en/actions/using-jobs/using-concurrency)

### A.5 Security Champion Model & SPACE Framework

**¿Por qué no está?**: Security champion es un modelo organizacional (dev role assignment), no una práctica técnica de CI/CD. SPACE framework es un framework de métricas de developer productivity que complementa DORA pero no se mapea directamente a pipeline stages.

| Tema                           | Herramienta                                                   | Cuándo aplica                       |
| ------------------------------ | ------------------------------------------------------------- | ----------------------------------- |
| Security champion role         | Rotating assignment within teams                              | Organizaciones con 5+ dev teams     |
| OWASP Cornucopia               | Card game for threat modeling                                 | Workshops de seguridad              |
| SPACE metrics                  | Developer satisfaction, activity, communication, flow, output | Medición holística de productividad |
| Developer satisfaction surveys | Officevibe, Culture Amp                                       | Quarterly assessment                |
| Flow state tracking            | DX Core, Jellyfish                                            | Identificar blockers sistémicos     |

**Fuentes**: SPACE Framework (https://research.microsoft.com/publications/382726), DORA SPACE (https://dora.dev)

### A.6 Legacy / Mainframe CI/CD

**¿Por qué no está?**: Este proyecto es greenfield Node.js. Legacy CI/CD aplica cuando se integran mainframes (z/OS, AS/400) o sistemas heredados con pipelines modernos.

| Tema                  | Herramienta                      | Cuándo aplica          |
| --------------------- | -------------------------------- | ---------------------- |
| Host integration      | Zowe, IBM Dependency Based Build | z/OS mainframe         |
| Screen automation     | Robot Framework, IBM Rational    | Terminal-based UIs     |
| Incremental migration | Strangler Fig + CI/CD            | Monolith decomposition |
| COBOL testing         | COBOLUnit, JUnit for COBOL       | Legacy code testing    |
| Hybrid pipelines      | Jenkins + z/OS Connect           | Cross-platform CI/CD   |

**Fuentes**: Zowe (https://zowe.org), IBM z/OS Connect (https://www.ibm.com/products/z-os-connect), Strangler Fig Pattern (https://martinfowler.com/bliki/StranglerFigApplication.html)

### A.7 IoT / Embedded CI/CD

**¿Por qué no está?**: Aplica a firmware, dispositivos edge, hardware constraints. Este proyecto es una web app.

| Tema                    | Herramienta                       | Cuándo aplica                    |
| ----------------------- | --------------------------------- | -------------------------------- |
| Cross-compilation       | PlatformIO, Arduino CLI           | Firmware builds                  |
| Hardware-in-the-loop    | Renode, QEMU                      | Testing sin hardware físico      |
| OTA updates             | Mender, AWS IoT OTA               | Deploy a dispositivos remotos    |
| Binary size gates       | arm-none-eabi-size                | Constrains de memoria            |
| Device fleet management | AWS IoT Greengrass, Azure IoT Hub | Gestión de miles de dispositivos |

**Fuentes**: PlatformIO (https://platformio.org), Mender (https://mender.io), AWS IoT Greengrass (https://aws.amazon.com/greengrass/)

### A.8 Blockchain / Smart Contract CI/CD

**¿Por qué no está?**: Aplica a dApps, DeFi, NFT platforms. Este proyecto no tiene smart contracts.

| Tema                   | Herramienta          | Cuándo aplica                |
| ---------------------- | -------------------- | ---------------------------- |
| Contract compilation   | Hardhat, Foundry     | Solidity builds              |
| Gas optimization gates | hardhat-gas-reporter | Prevent deploy cost blowup   |
| Formal verification    | Certora, Echidna     | Security proofs              |
| Testnet deployment     | Sepolia, Mumbai      | Staging para smart contracts |
| Contract auditing      | Slither, Mythril     | Automated security analysis  |

**Fuentes**: Hardhat (https://hardhat.org), Foundry (https://book.getfoundry.sh), Slither (https://github.com/crytic/slither)

### A.9 Game Dev CI/CD (Unity/Unreal)

**¿Por qué no está?**: Builds de juego requieren assets especiales, platform-specific targets (consoles), y pipelines completamente distintos.

| Tema                        | Herramienta                     | Cuándo aplica             |
| --------------------------- | ------------------------------- | ------------------------- |
| Asset bundling              | Unity Addressables, Unreal Pak  | distribución de assets    |
| Platform builds             | Unity Cloud Build, UnrealJob    | Console/PC/Mobile targets |
| Performance profiling gates | Unity Profiler, Unreal Insights | Frame rate budgets        |
| Multiplayer testing         | GameDriver, custom bots         | Testing de networking     |
| Patch management            | Steamworks, Epic Online         | Live game updates         |

**Fuentes**: Unity Cloud Build (https://unity.com/products/cloud-build), Unreal Engine (https://www.unrealengine.com), GameDriver (https://gamedriver.io)

### A.10 Multi-tenancy CI/CD

**¿Por qué no está?**: Aplica a SaaS platforms que despliegan por tenant (customer-specific configs, data isolation). Este proyecto tiene un solo tenant.

| Tema                         | Herramienta                              | Cuándo aplica              |
| ---------------------------- | ---------------------------------------- | -------------------------- |
| Tenant-aware deploys         | Custom scripts, K8s namespace per tenant | Isolation por customer     |
| Per-tenant feature flags     | LaunchDarkly, Flagsmith                  | Rollout gradual por tenant |
| Tenant-specific migrations   | Custom migration scripts                 | Schema per tenant          |
| Data isolation verification  | Custom tests                             | Compliance multi-tenant    |
| Tenant onboarding automation | Custom scripts                           | Nuevo tenant en minutes    |

**Fuentes**: LaunchDarkly (https://launchdarkly.com), Flagsmith (https://flagsmith.com), Kubernetes Namespace (https://kubernetes.io/docs/concepts/overview/working-with-objects/namespaces/)

---

_Documento de referencia técnica CI/CD empresarial para el proyecto. Última actualización: agosto 2026. 65 secciones completas + 1 apéndice (Apéndice A: Temas NICE-TO-HAVE). ~9,976 líneas. Cobertura total: stages del pipeline (1-16), métricas (17, 26), pipeline as code (18), patrones (19), DevSecOps (20), glosario (21), evidencia de orden (23), GitHub Actions enterprise (24), supply chain security (25), progressive delivery (27), plantilla completa (28), containerización (29), Kubernetes (30), GitOps (31), IaC (32), DB migrations (33), secrets management (34), environment management (35), testing avanzado (36), compliance (37), monorepo (38), artifact management (39), pipeline observability (40), branch strategies y DR (41), dependency automation (42), release management (43), chatops (44), docs-as-code (45), feature flags (46), self-hosted runners (47), multi-region (48), API versioning (49), AI/ML MLOps (50), zero-trust OWASP (51), platform engineering (52), green CI (53), maturity model (54), DevEx (55), innerSource (56), serverless deployment (57), chaos engineering (58), FinOps CI/CD (59), DORA capabilities (60), self-healing (61), mobile CI/CD (62), data pipelines (63), WebAssembly (64), multi-cloud (65). Apéndice A: config management, service mesh, GraphQL/gRPC, rate limiting, security champion, legacy, IoT, blockchain, game dev, multi-tenancy._
