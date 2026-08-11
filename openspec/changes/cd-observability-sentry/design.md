## Context

Ver `proposal.md` → _Why_ para la motivación (Sprint 4 task 4.6 del plan `docs/cicd-plan-implementacion.md`, Stage 7 post-deploy snippet, §12/§16 observabilidad).

Estado que condiciona el diseño:

- **Cero Sentry en el repo**: grep `sentry` solo encuentra el plan; `@sentry/*` NO existe en `apps/server/package.json` ni `apps/client/package.json` — **dependencias nuevas** (flag del proposal).
- **Parent `cd-aws-deploy-pipeline` (ACTIVE)**: `deploy.yml` con jobs `docker-build` (fase 1, sin AWS) → `ecr-push`/`deploy-staging`/`deploy-production` (fase 2, gated por `vars.AWS_ROLE_ARN != ''`, D6 del parent). **NO contiene** el step `getsentry/action-release@v1` ni ningún deploy marker — la fase 2 del parent cubre ECR/ECS/RDS/OIDC/rollback, NO observabilidad. Este change es **SA dependiente/complementario**.
- Server: Express + Socket.IO, bootstrap en `apps/server/src/bin/index.js` (crea el HTTP server y adjunta Socket.IO). Client: React/Vite, entry `apps/client/src/main.jsx`.
- El plan fija Sentry (gratuito hasta 5k eventos/mes) como error tracking + RUM (G5/G6), y el snippet Stage 7 usa `getsentry/action-release@v1` con `SENTRY_AUTH_TOKEN`/`SENTRY_ORG` y `environment: production`.
- Siblings: acciones pinneadas por tag, `GITHUB_TOKEN`-only salvo donde sea imprescindible; el release de Sentry requiere `SENTRY_AUTH_TOKEN` (secret) — excepción justificada.

## Goals / Non-Goals

**Goals:**

- Init de Sentry en server y client que **degrade a no-op** sin DSN (cero impacto en boot/tests/contratos)
- Release de Sentry por deploy (deploy marker) en el post-deploy del parent, **gated por `vars.AWS_ROLE_ARN`** — consistente con D6 del parent: sin infra AWS, el step se skippea limpio y el pipeline sigue verde
- Correlación error↔release por `github.sha` (criterio de aceptación 4.6: "Cada deploy crea release en Sentry")
- Verificación local sin cuenta Sentry: smoke de init + dry-run de release con `sentry-cli`

**Non-Goals:**

- No crear la cuenta/org/proyecto Sentry (pre-requisito externo, consentimiento del usuario — GUARDRAIL propose-only)
- No implementar RUM/Performance completo (Sentry Performance es post-deploy continuo, fuera de este change; solo `tracesSampleRate` base)
- No configurar alertas/notificaciones de Sentry (dashboard, fuera del repo)
- No tocar el deploy del client React (Vercel, fuera de este change)
- No modificar contratos de API ni comportamiento del server

## Decisions

### D1. Init de Sentry en server: bootstrap, no-op sin DSN (DECISIÓN CENTRAL)

**Decisión**: `Sentry.init` en `apps/server/src/bin/index.js` al inicio de `bootstrap()`, condicionado a `SENTRY_DSN` presente. `environment` = `NODE_ENV` (staging/production), `release` = `process.env.SENTRY_RELEASE` (inyectado por el workflow como `github.sha` — sin fallback a `github.sha` en runtime: es contexto de GitHub Actions, no una variable de Node), `tracesSampleRate` = `SENTRY_TRACES_SAMPLE_RATE` (default 0.1). Se registran `process.on('unhandledRejection')`/`uncaughtException`, se registra `Sentry.Handlers.requestHandler()` antes de las rutas (contexto de transacción/span) y se añade el middleware de error de Express (`Sentry.Handlers.errorHandler()`) en `src/app.js` **ANTES** del error handler existente (capture-first: el errorHandler existente responde y NO llama `next(err)`, así que cualquier middleware de error posterior nunca corre). En tests, `SENTRY_DSN` no está seteado → no-op (cero red).

**Por qué**: el bootstrap es el único punto de entrada del server (Express + Socket.IO comparten el HTTP server); condicionar a env evita romper el boot y mantiene los tests verdes sin mocks. El release por SHA es el contrato de correlación con el deploy marker.

**Alternativas**: _init en `app.js`_ — descartado: `app.js` se importa en tests y en el bootstrap; el init debe ser idempotente y solo en el entry real. _Sentry como middleware global sin condicionar_ — descartado: rompe el no-op requerido.

### D2. Init en client: `main.jsx` con `@sentry/react`, DSN build-time

**Decisión**: `Sentry.init` en `apps/client/src/main.jsx` antes de `createRoot(...).render(...)`, condicionado a `import.meta.env.VITE_SENTRY_DSN`; `environment` = `import.meta.env.MODE` (development/production), `tracesSampleRate` default 0.1. Opcional: envolver la app en `Sentry.ErrorBoundary` (no bloqueante).

**Por qué**: `main.jsx` es el entry único del client; Vite expone `VITE_*` en build-time (el DSN del client es público por diseño — Sentry lo documenta; el token de auth es el secreto, no el DSN). Sin `VITE_SENTRY_DSN` el bundle no incluye Sentry activo.

**Alternativas**: _DSN en runtime vía endpoint_ — sobreingeniería para este proyecto; el DSN público en build-time es el patrón estándar de Sentry.

### D3. Release de Sentry en CI: `getsentry/action-release@v1` en el post-deploy del parent, gated por `vars.AWS_ROLE_ARN`

**Decisión**: añadir un step `getsentry/action-release@v1` al final de los jobs `deploy-staging` y `deploy-production` del parent (`deploy.yml`), con `env: SENTRY_AUTH_TOKEN: ${{ secrets.SENTRY_AUTH_TOKEN }}`, `SENTRY_ORG: ${{ secrets.SENTRY_ORG }}`, `SENTRY_PROJECT: ${{ secrets.SENTRY_PROJECT }}` (la action `getsentry/action-release@v1` requiere los TRES), `with: environment: staging|production`, `version: ${{ github.sha }}` (release name = SHA). El step se añade **dentro de los jobs ya gated** por `vars.AWS_ROLE_ARN` (D6 del parent) — si no hay infra AWS, el job completo se skippea y no hay release (consistente: no hay deploy → no hay release).

**Por qué**: el release DEBE ocurrir después del deploy exitoso (correlación con el SHA desplegado); reutilizar el gate del parent evita duplicar lógica de activación por fases. `github.sha` es el mismo tag inmutable que usa el parent (D7) — correlación exacta.

**Alternativas**: _job separado `sentry-release`_ — descartado: añade un job más con `needs` y duplica el gate; el step dentro del job de deploy es más simple y garantiza orden. _`sentry-cli` directo_ — la action oficial encapsula auth/versionado; menos código.

### D4. Manejo de credenciales Sentry ausentes: skip con notice vs fallo

**Decisión**: `SENTRY_AUTH_TOKEN`/`SENTRY_ORG`/`SENTRY_PROJECT` como **secrets del repositorio** (no del environment — el release aplica a ambos entornos y el token es único). El step de release usa `if: ${{ secrets.SENTRY_AUTH_TOKEN != '' }}` a nivel de step (los secrets SÍ son accesibles en `if` de step, a diferencia de job — D6 del parent) para skippear con notice si no hay token. Si el token existe pero el release falla, el job falla (el deploy está hecho; el release es parte del criterio de aceptación).

**Por qué**: separa dos casos: (a) sin infra AWS → job completo skip (gate del parent), (b) con infra pero sin token Sentry → step skip con notice visible, pipeline verde (el usuario aún no consintió la cuenta). Evita que un deploy válido se marque rojo por un pre-requisito externo pendiente.

**Riesgo controlado**: el token de Sentry es un secret de repositorio (no de environment) — accesible en ambos jobs; el DSN del client es público por diseño (Sentry lo documenta).

### D5. Deploy marker: el release de Sentry ES el marker + milestone comment

**Decisión**: el deploy marker del criterio 4.6 se materializa como (1) el release de Sentry (release name = SHA, environment) y (2) un milestone comment en el commit/PR del deploy (step `actions/github-script@v7` que comenta `Deploy <env> SHA <sha> → Sentry release <sha>`). El comment es opcional y no bloqueante (si falla, notice). El step requiere `contents: write` en los permissions del job (la API de commit comments POST /repos/{owner}/{repo}/commits/{sha}/comments devuelve 403 con `contents: read` — los jobs del parent hoy tienen `id-token: write` + `contents: read`). El step debe ser **idempotente**: buscar un marker existente `Deploy <env> SHA <sha>` y actualizarlo/skippearlo si ya existe (los re-runs y `workflow_dispatch` duplicarían comentarios).

**Por qué**: el plan (Stage 7) separa "deploy marker" (curl a monitor) y "error tracking release" (Sentry); con Sentry como monitor, el release cumple ambos: correlación + trazabilidad. El comment de milestone da la auditoría visible en GitHub sin infraestructura extra.

**Alternativas**: _curl a `DEPLOY_MONITOR_URL`_ (snippet del plan) — descartado: no existe ese endpoint en el repo; Sentry lo sustituye (el plan ya lo lista como monitor).

### D6. Env vars y DSN injection

**Decisión**: `SENTRY_DSN` (server, env secret del environment staging/production — se pasa al task definition ECS como secret, patrón D8 del parent), `VITE_SENTRY_DSN` (client, build-time en el build de Vercel), `SENTRY_TRACES_SAMPLE_RATE` (opcional, default 0.1), `SENTRY_RELEASE` (inyectado por el workflow como `github.sha`). El DSN del server es un secret (apunta al proyecto Sentry); el del client es público (build-time).

**Por qué**: separación server/client por naturaleza (runtime vs build-time); el DSN del server no debe filtrarse al bundle del client.

## Risks / Trade-offs

- **[Costo/uso: Sentry free tier 5k eventos/mes → puede agotarse con RUM+errors]** → Mitigación: `tracesSampleRate` default 0.1 (10% de traces), sin RUM completo en este change; el plan ya asume el tier gratuito.
- **[Init de Sentry rompe el boot o los tests]** → Mitigación: no-op sin DSN (tests corren sin DSN → cero red); smoke de init en CI (task de verificación); init envuelto en try/catch (spec `sentry-error-tracking`).
- **[Release falla tras deploy OK → deploy marcado rojo]** → Mitigación: D4 — step gated por `secrets.SENTRY_AUTH_TOKEN != ''`; si el token existe y falla, el job falla (correcto: el release es parte del criterio de aceptación).
- **[DSN del server filtrado al bundle del client]** → Mitigación: D6 — el DSN del server es secret de environment y nunca se expone a Vite; el client usa su propio `VITE_SENTRY_DSN`.
- **[Dependencia del parent `cd-aws-deploy-pipeline` (deploy.yml) → conflicto de edición si ambos cambian el mismo archivo]** → Mitigación: este change SOLO añade steps al final de los jobs existentes del parent (no reestructura jobs); si el parent archiva primero, verificar el estado del workflow antes de aplicar.

## Migration Plan

1. Añadir dependencias `@sentry/node` (server) y `@sentry/react` (client)
2. Implementar init de Sentry en `apps/server/src/bin/index.js` + middleware de error en `src/app.js` (no-op sin DSN)
3. Implementar init de Sentry en `apps/client/src/main.jsx` (no-op sin `VITE_SENTRY_DSN`)
4. Añadir step `getsentry/action-release@v1` + milestone comment en `deploy.yml` (jobs `deploy-staging`/`deploy-production` del parent)
5. Documentar env vars y secrets (`SENTRY_DSN`, `VITE_SENTRY_DSN`, `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, `SENTRY_PROJECT`) — el environment del release es el input `environment` de la action (staging/production), no una env var
6. Verificar: smoke de init local (boot + tests verdes sin DSN), dry-run de release con `sentry-cli` en CI
7. Validar `openspec validate --strict`

**Rollback**: revertir el init (no-op sin DSN ya es el estado por defecto); quitar los steps del workflow; sin cambios de contrato ni de datos.

## Open Questions

- **RUM/Performance completo (Web Vitals)**: ¿activar Sentry Performance con mediciones reales de usuario? No cambia specs ni tasks — decidible post-deploy con datos reales (el plan lo lista como post-deploy continuo).
- **Alertas/notificaciones de Sentry**: ¿configurar alertas por rate de error? Dashboard de Sentry, fuera del repo — decidible cuando haya tráfico real.
