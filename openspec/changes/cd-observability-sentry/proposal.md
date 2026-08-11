## Why

Project One no tiene observabilidad post-deploy: no existe error tracking ni correlación de errores con releases (brecha del plan `docs/cicd-plan-implementacion.md`, Sprint 4 task 4.6 "Configurar deploy markers + integración con Sentry", Stage 7 post-deploy snippet, §12/§16 observability). El plan ya decidió **Sentry** (gratuito hasta 5k eventos/mes) como herramienta de error tracking + RUM. Verificado: **cero código Sentry en el repo** (grep `sentry` solo encuentra el plan), **cero dependencias** `@sentry/*` en `apps/server/package.json` ni `apps/client/package.json`, y el workflow `deploy.yml` del change `cd-aws-deploy-pipeline` (ACTIVE) **no contiene** el paso `getsentry/action-release@v1` — la fase 2 de ese change cubre ECR/ECS/RDS/OIDC/rollback, NO observabilidad.

**Decisión de alcance (GPS):** este change es **dependiente/complementario (SA)** de `cd-aws-deploy-pipeline`. Implementa lo que es verificable YA sin cuenta AWS (init de Sentry en server+client, config por env, smoke local, dry-run de release con sentry-cli) y deja el step de release en CI **gated** por la misma variable `vars.AWS_ROLE_ARN` que ya gatea la fase 2 del parent — el release real a Sentry se activa cuando el deploy a staging/producción exista. El setup de la cuenta/org/proyecto Sentry es **pre-requisito externo** (consentimiento del usuario, no implementado aquí).

## What Changes

- **Dependencias nuevas** (`@sentry/node` en `apps/server`, `@sentry/react` en `apps/client`): NO existen hoy — se añaden como deps de runtime (flag en design)
- **Init de Sentry en server**: `Sentry.init` en el bootstrap (`apps/server/src/bin/index.js`), DSN desde env `SENTRY_DSN`, `tracesSampleRate` configurable, `environment` desde `NODE_ENV`; captura de errores no capturados (`process.on('unhandledRejection'/'uncaughtException')` + middleware de error Express)
- **Init de Sentry en client**: `Sentry.init` en `apps/client/src/main.jsx` con `@sentry/react` (Sentry.ErrorBoundary opcional), DSN desde `import.meta.env.VITE_SENTRY_DSN`
- **Workflow `deploy.yml` (modificado)**: step post-deploy `getsentry/action-release@v1` (release name = `github.sha`, input `environment` = staging/production — única fuente de verdad del environment del release) en los jobs `deploy-staging`/`deploy-production` del parent, gated por `vars.AWS_ROLE_ARN` (mismo patrón D6 del parent — sin infra, el step se skippea limpio)
- **Deploy markers**: comentario de milestone en el PR/commit del deploy (release correlation) — el release de Sentry ES el deploy marker (criterio de aceptación 4.6: "Cada deploy crea release en Sentry")
- **Env vars**: `SENTRY_DSN` (server, env secret), `VITE_SENTRY_DSN` (client, build-time), `SENTRY_AUTH_TOKEN` + `SENTRY_ORG` + `SENTRY_PROJECT` (secrets del workflow — la action `getsentry/action-release@v1` requiere los tres), `SENTRY_RELEASE` (inyectado por workflow como `github.sha`); el environment del release es el input `environment` de la action (staging/production), no una env var
- **Verificación**: smoke de init local (Sentry no debe romper boot ni tests), dry-run de release con `sentry-cli` en CI
- **BREAKING**: No aplica — no cambia contratos de API ni comportamiento de usuario; Sentry es aditivo y degrada a no-op si `SENTRY_DSN` no está seteado

## Capabilities

### New Capabilities

- `sentry-error-tracking`: Init de Sentry en server (`@sentry/node`) y client (`@sentry/react`), DSN vía env, `tracesSampleRate` configurable, captura de errores no controlados, degradación a no-op sin DSN
- `sentry-deploy-markers`: Release de Sentry por deploy (release name = `github.sha`, input `environment` staging/production) vía `getsentry/action-release@v1` en el post-deploy del parent, gated por `vars.AWS_ROLE_ARN`; correlación error↔release

### Modified Capabilities

- Ninguna: los specs existentes (`openspec/specs/`) cubren funcionalidad de la app (events, notes, websocket, etc.), no observabilidad. Este change introduce tooling de observabilidad sin cambiar requisitos de comportamiento.

## Impact

- **`apps/server/package.json`**: + `@sentry/node` (dependencia runtime nueva)
- **`apps/server/src/bin/index.js`**: init de Sentry en bootstrap (antes de crear el HTTP server)
- **`apps/client/package.json`**: + `@sentry/react` (dependencia runtime nueva)
- **`apps/client/src/main.jsx`**: init de Sentry antes del render de React
- **`.github/workflows/deploy.yml`** (parent `cd-aws-deploy-pipeline`): + step `getsentry/action-release@v1` en `deploy-staging` y `deploy-production` (gated por `vars.AWS_ROLE_ARN` — consistente con D6 del parent)
- **Env vars**: `SENTRY_DSN` (server), `VITE_SENTRY_DSN` (client), `SENTRY_AUTH_TOKEN`/`SENTRY_ORG`/`SENTRY_PROJECT` (secrets workflow), `SENTRY_RELEASE` (inyectado por workflow como `github.sha`); el environment del release es el input `environment` de la action (staging/production), no una env var
- **GitHub (fuera del repo, manual)**: secrets `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, `SENTRY_PROJECT` en el repositorio; cuenta/proyecto Sentry (pre-requisito externo, consentimiento del usuario)
- **Dependencias**: `@sentry/node` + `@sentry/react` (nuevas); acciones GitHub pinneadas por tag (consistente con siblings)
- **Tests**: sin cambios en tests de la app; se añade verificación de que el init no rompe el boot (smoke) y dry-run de release con `sentry-cli`
