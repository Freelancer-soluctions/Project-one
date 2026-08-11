# Implementation Tasks: CD Observability Sentry

> Cada grupo de tasks mapea a requisitos de los specs (`sentry-error-tracking`, `sentry-deploy-markers`) y a las decisiones del design (D1-D6). Este change es **SA dependiente/complementario** de `cd-aws-deploy-pipeline` (ACTIVE): los steps de release se añaden a los jobs `deploy-staging`/`deploy-production` del parent, gated por `vars.AWS_ROLE_ARN` (D6 del parent). El setup de la cuenta/org/proyecto Sentry es **pre-requisito externo** (consentimiento del usuario, GUARDRAIL propose-only — NO implementado aquí).

## 0. Prerrequisitos y coordinación con el parent

- [ ] 0.1 Verificar que `cd-aws-deploy-pipeline` está ACTIVE y que `deploy.yml` contiene los jobs `deploy-staging`/`deploy-production` con el gate `vars.AWS_ROLE_ARN != ''` (D6 del parent); si el parent NO está mergeado, BLOQUEAR este change (dependencia dura declarada) — no re-estructurar el workflow
- [ ] 0.2 Confirmar que NO existe `@sentry/*` en `apps/server/package.json` ni `apps/client/package.json` (grep sentry) — las dependencias son NUEVAS (flag del proposal)
- [ ] 0.3 Confirmar que las actions GitHub quedan pinneadas por tag (`getsentry/action-release@v1`, `actions/github-script@v7`) — consistencia con los siblings

## 1. Dependencias nuevas

- [ ] 1.1 Añadir `@sentry/node` a `apps/server/package.json` (runtime dep) e instalar
- [ ] 1.2 Añadir `@sentry/react` a `apps/client/package.json` (runtime dep) e instalar

## 2. Init de Sentry en server (spec `sentry-error-tracking`)

- [ ] 2.1 Implementar `Sentry.init` en `apps/server/src/bin/index.js` al inicio de `bootstrap()`: condicionado a `SENTRY_DSN` presente (no-op sin DSN — D1), `environment` = `NODE_ENV`, `release` = `process.env.SENTRY_RELEASE` (sin fallback `github.sha` — contexto de GitHub Actions, no variable de Node; inyectado por el workflow), `tracesSampleRate` = `SENTRY_TRACES_SAMPLE_RATE` (default 0.1); init envuelto en try/catch (spec: init failure no crashea el server)
- [ ] 2.2 Registrar `process.on('unhandledRejection')` y `process.on('uncaughtException')` → `Sentry.captureException` cuando Sentry esté inicializado (spec: unhandled errors reportados)
- [ ] 2.3 Añadir `Sentry.Handlers.errorHandler()` como middleware de error en `apps/server/src/app.js` **ANTES** del error handler existente (capture-first: el errorHandler existente responde y NO llama `next(err)` — cualquier middleware de error posterior nunca corre; spec: Express request errors reportados con contexto). Opcional: registrar `Sentry.Handlers.requestHandler()` antes de las rutas para contexto de transacción/span
- [ ] 2.4 Verificar que sin `SENTRY_DSN` el server bootea normal y los tests (unit + integration) corren verdes sin red de Sentry (spec: no-op sin DSN)

## 3. Init de Sentry en client (spec: sentry-error-tracking)

- [ ] 3.1 Implementar `Sentry.init` en `apps/client/src/main.jsx` antes de `createRoot(...).render(...)`: condicionado a `import.meta.env.VITE_SENTRY_DSN` (no-op sin él — D2), `environment` = `import.meta.env.MODE`, `tracesSampleRate` default 0.1
- [ ] 3.2 (Opcional, no bloqueante) Envolver la app en `Sentry.ErrorBoundary` para capturar errores de render
- [ ] 3.3 Verificar que sin `VITE_SENTRY_DSN` el client builda y renderiza normal (spec: client boots without DSN)

## 4. Release de Sentry en CI (s: sentry-deploy-markers)

- [ ] 4.1 Añadir step `getsentry/action-release@v1` al final del job `deploy-staging` en `.github/workflows/deploy.yml` (parent): `env: SENTRY_AUTH_TOKEN: ${{ secrets.SENTRY_AUTH_TOKEN }}`, `SENTRY_ORG: ${{ secrets.SENTRY_ORG }}`, `SENTRY_PROJECT: ${{ secrets.SENTRY_PROJECT }}` (la action requiere los TRES), `with: environment: staging`, `version: ${{ github.sha }}`; step gated con `if: ${{ secrets.SENTRY_AUTH_TOKEN != '' }}` (D4 — secrets SÍ accesibles en `if` de step) — el job ya está gated por `vars.AWS_ROLE_ARN` (D3)
- [ ] 4.2 Añadir el mismo step al final del job `deploy-production` con `environment: production` y el mismo `env` (incluido `SENTRY_PROJECT`) (spec: production deploy creates release)
- [ ] 4.3 Añadir milestone comment (deploy marker) con `actions/github-script@v7` en ambos jobs: comenta `Deploy <env> SHA <sha> → Sentry release <sha>`; opcional y no bloqueante (D5). Añadir `contents: write` a los permissions de ambos jobs (la API de commit comments POST /repos/{owner}/{repo}/commits/{sha}/comments devuelve 403 con `contents: read`) + guard de idempotencia: buscar marker existente `Deploy <env> SHA <sha>` y actualizar/skip si existe (re-runs/`workflow_dispatch` duplicarían comentarios)
- [ ] 4.4 Añadir `SENTRY_DSN` (secret) + `SENTRY_RELEASE` (environment, value `github.sha`) al task definition ECS de `deploy-staging` en `deploy.yml` (hoy solo NODE_ENV/PORT/ALGORITHM + secrets DATABASE_URL/JWT_SECRET/AES_GCM_KEY/AWS_REGION) — sin esto el server desplegado es Sentry no-op mientras CI crea releases → correlación rota. El DSN viaja vía Secrets Manager (patrón D8 del parent): crear el env secret `STAGING_SENTRY_DSN_SECRET_ARN` (ARN del secret que contiene el DSN) y referenciarlo en el array `secrets` del task definition
- [ ] 4.5 Añadir `SENTRY_DSN` (secret) + `SENTRY_RELEASE` (environment, value `github.sha`) al task definition ECS de `deploy-production` en `deploy.yml`. El DSN viaja vía Secrets Manager (patrón D8 del parent): crear el env secret `PROD_SENTRY_DSN_SECRET_ARN` (ARN del secret que contiene el DSN) y referenciarlo en el array `secrets` del task definition
- [ ] 4.6 Verificar que sin infra AWS (`vars.AWS_ROLE_ARN` vacío) los jobs se skippean y NO se intenta release (spec: staging deploy without AWS infra skips release)

## 5. Documentación y secrets

- [ ] 5.1 Documentar env vars: `SENTRY_DSN` (server, env secret del environment staging/production — patrón D8 del parent), `VITE_SENTRY_DSN` (client, build-time — debe setearse en las env vars del proyecto Vercel para el build de producción; este change NO toca la config de Vercel), `SENTRY_TRACES_SAMPLE_RATE` (opcional), `SENTRY_RELEASE` (inyectado por workflow como `github.sha`), `SENTRY_AUTH_TOKEN`/`SENTRY_ORG`/`SENTRY_PROJECT` (secrets de repositorio — D4); el environment del release es el input `environment` de la action (staging/production), no una env var
- [ ] 5.2 Documentar el pre-requisito externo (requiere CONSENTIMIENTO del usuario antes de aplicar — NO implementado en este change): (a) crear cuenta/org/proyecto Sentry; (b) obtener el DSN del server (secret) y el DSN del client (público, build-time); (c) crear el token de auth Sentry y setear los secrets de repositorio `SENTRY_AUTH_TOKEN` + `SENTRY_ORG` + `SENTRY_PROJECT`; (d) setear `VITE_SENTRY_DSN` en las env vars del proyecto Vercel (client production build)

- [ ] 5.3 Actualizar `.env.example` con placeholders de Sentry (fase de código — NO editar `.env.example` en este change, artifacts-only): server `apps/server/.env.example` → `SENTRY_DSN=` + `SENTRY_TRACES_SAMPLE_RATE=0.1`; client `apps/client/.env.example` → `VITE_SENTRY_DSN=` (hoy no existen — verificado en el readiness pass)
- [ ] 5.4 Verificar `.gitignore`: ningún `.env` con DSN reales trackeado (hoy `.gitignore` L47-52 ignora `.env`, `.env.development.local`, `.env.test.local`, `.env.production.local`, `.env.local`; `.env.example` queda trackeado — correcto; `apps/server/.env.test` trackeado es fixture de test con valores dummy — confirmar que nunca contenga DSN reales de Sentry)

## 6. Verificación

- [ ] 6.1 Smoke de init local: boot del server con `SENTRY_DSN` dummy → Sentry inicializa sin crashear; boot sin DSN → no-op (spec `sentry-error-tracking`)
- [ ] 6.2 Dry-run de release con `sentry-cli` en CI (o local): `sentry-cli releases propose-version` (o validación de la action) — `--dry-run` NO es un flag documentado de `releases new`; `propose-version` propone el release name sin tocar la cuenta real
- [ ] 6.3 Correr `npm run test` (server) y tests del client — todos verdes sin DSN (spec: existing tests remain green)
- [ ] 6.4 Run `openspec validate "cd-observability-sentry" --strict` — todos los artifacts pasan
