## Why

Project One no tiene CD: un merge a `main` no produce ningún despliegue (brecha C3 del plan `docs/cicd-plan-implementacion.md`, Stage 7, sprint 3-4). El server Express solo corre localmente o en runners efímeros de CI; no existe staging ni producción. El plan ya decidió el stack objetivo: **AWS (ECS Fargate + RDS PostgreSQL + ECR)** para el server, con Floci como emulador de aprendizaje.

**Decisión del usuario (2026-07):** *"usaremos floci ya que debo de aprender de aws antes de usarlo"*. Esto NO cancela el CD a AWS — re-encuadra el plan: el pipeline real (Docker → ECR → staging → producción → rollback) se diseña completo, pero se implementa **por fases**, donde las tareas que requieren cuenta AWS real (ECR push, ECS, RDS, OIDC) se desbloquean al completar los hitos del learning path con Floci (emulador local/CI, MIT, puerto 4566, 68 servicios). Las tareas del pipeline son en sí mismas el vehículo de aprendizaje AWS.

**Estado actual:**
- No existe infraestructura AWS en el repo (sin Terraform/CloudFormation/Serverless, verificado)
- `apps/server/Dockerfile` existe (node:20-alpine, `npm ci --omit=dev`, EXPOSE 3000, CMD `node src/bin/index.js`) pero **fallará en build**: el postinstall `prisma generate` necesita el CLI de Prisma que `--omit=dev` elimina — fix coordinado con el change sibling `ci-preview-environments` (tasks 0.1-0.2, misma corrección para BUILD y CD)
- Server: Express + Socket.IO en el mismo HTTP server (puerto 3000), Prisma + PostgreSQL, `@aws-sdk/client-secrets-manager` respetando `AWS_ENDPOINT_URL` (listo para emulación)
- `release.yml` (Changesets) ya corre en push a `main` — el CD debe convivir sin duplicar su trabajo (tags semver para trazabilidad del deploy)
- Workflows existentes: `ci.yml`, `security.yml`, `quality.yml`, `release.yml` — todos `GITHUB_TOKEN`-only; el CD introducirá AWS (OIDC) solo donde es imprescindible

**Qué resuelve:**
- **Pipeline CD real diseñado y parcialmente implementable YA** (fase 1 sin cuenta AWS): fix Dockerfile, `.dockerignore`, build + validación de imagen en CI contra stack emulado (Floci + Postgres efímera), workflow `deploy.yml` con environments y gates, documentación de infraestructura y OIDC
- **Ruta de aprendizaje AWS con Floci**: hitos de aprendizaje que desbloquean las fases reales (ECR, ECS, RDS) — el usuario practica gratis con Floci antes de tocar cloud real
- **Deploy a staging y producción con revisión**: GitHub Environments (`staging` → `production`) con protection rules (approval manual para producción), smoke tests post-deploy y health check
- **Rollback en < 15 min**: ECS deployment circuit breaker + redeploy del tag anterior + `prisma migrate down` (reversible, por migración)

## What Changes

- **Fix Dockerfile + `.dockerignore`**: `apps/server/Dockerfile` (copiar `prisma/` antes de `npm ci`, o mover `prisma generate` tras `COPY . .` con el CLI disponible) + `apps/server/.dockerignore` — **coordinado con `ci-preview-environments` tasks 0.1-0.2** (misma corrección; este change NO los duplica, depende de ellos para build+CD)
- **Workflow `.github/workflows/deploy.yml`** (NUEVO): trigger `push: branches: [main]`; jobs `docker-build` (fase 1, validación de imagen sin AWS) → [fase 2, gated por infra/learning] `ecr-push` → `deploy-staging` (environment `staging`, smoke tests) → `deploy-production` (environment `production`, **approval manual**, health check post-deploy)
- **GitHub Environments**: `staging` (deploy automático post-merge) y `production` (protection rules: reviewers obligatorios como env gate) — config fuera del repo (dashboard), documentada en el change
- **AWS OIDC en vez de access keys**: `aws-actions/configure-aws-credentials@v4` con `role-to-assume` (IAM role federado vía OIDC GitHub) — sin secrets de access keys largoplazo
- **Infraestructura AWS documentada** (no provisionada en fase 1): arquitectura (ECS Fargate + ALB + RDS + ECR + security groups) + Terraform reference en `docs/` — el provisionamiento real es fase 2 (learning)
- **Rollback documentado e implementado por fases**: ECS deployment circuit breaker (`deploymentCircuitBreaker.enable=true, rollback=true`) + redeploy del tag anterior desde ECR + `npx prisma migrate down` para BD
- **Docs de aprendizaje**: `docs/aws-cd-learning-path.md` (hitos Floci → AWS real, referencia cruzada a `docs/aws-learning-with-floci.md` y `docs/aws-dev-local-floci.md` de los siblings) + `docs/aws-deploy-architecture.md` (arquitectura + Terraform reference)
- **BREAKING**: No aplica — es infraestructura/tooling de CD y documentación; no se modifican contratos de API, flujos de usuario ni el comportamiento del server

## Capabilities

### New Capabilities

- `cd-docker-ecr`: Build de la imagen del server (Dockerfile corregido + `.dockerignore`), tag inmutable con `github.sha`, validación del boot contra stack emulado (Floci + Postgres efímera) en CI sin cuenta AWS, y push a Amazon ECR (fase 2, OIDC)
- `cd-staging-deploy`: Deploy automático a staging tras merge a `main` (environment `staging`): despliegue ECS Fargate con la imagen validada, smoke tests post-deploy y gate de aprobación para promoción
- `cd-production-deploy`: Promoción de staging a producción con **approval manual** (GitHub Environment protection rules): deploy ECS Fargate, health check post-deploy (5 min de observación) y circuit breaker de rollback automático
- `cd-rollback`: Estrategia de reversión en < 15 min: redeploy del tag Docker anterior desde ECR, ECS deployment circuit breaker automático, y reversión de migraciones Prisma (`migrate down` por migración, con regla de reversibilidad)
- `cd-aws-learning-path`: Ruta de aprendizaje AWS estructurada por hitos con Floci (emulador gratuito, 68 servicios) que desbloquea cada fase real del CD (ECR → ECS → RDS → OIDC); documentación de arquitectura AWS y Terraform reference en `docs/`

### Modified Capabilities

- Ninguna: los specs existentes (`openspec/specs/`) cubren funcionalidad de la aplicación (events, notes, websocket, etc.), no tooling de CD. Este change introduce infraestructura y pipeline sin cambiar requisitos de comportamiento de la app.

## Impact

- **`.github/workflows/deploy.yml`** (NUEVO): pipeline CD con environments, OIDC y gates; convive con `release.yml` (Changesets) — el CD espera el tag semver de Changesets como entrada para el tag de Docker cuando aplique
- **`apps/server/Dockerfile` + `apps/server/.dockerignore`**: fix de build (prisma) y contexto limpio — **misma corrección que `ci-preview-environments` tasks 0.1-0.2; se coordina, no se duplica**
- **`docs/`**: `docs/aws-deploy-architecture.md` (NUEVO) — arquitectura AWS (ECS Fargate + RDS + ECR + ALB + OIDC) y Terraform reference; `docs/aws-cd-learning-path.md` (NUEVO) — hitos de aprendizaje con Floci
- **GitHub (fuera del repo, manual)**: environments `staging`/`production` con protection rules, IAM OIDC provider + role, variable de repositorio `AWS_ROLE_ARN` (no secret — D6: `vars` es accesible en `if` de job, `secrets` no); documentado como pasos
- **Dependencias**: sin nuevas dependencias npm; acciones GitHub pinneadas por tag (consistente con siblings: `actions/checkout@v5`, `aws-actions/*@v4/v2`)
- **Tests**: sin cambios en tests de la app; se añade validación de boot de imagen (smoke contra emulador) en el job `docker-build`
