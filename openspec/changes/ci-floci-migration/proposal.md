## Why

El plan `docs/cicd-plan-implementacion.md` (ítem 2.3) preveía "migrar de LocalStack a Floci", pero la investigación reveló que la sección LocalStack de `apps/server/docker-compose.yml` está **comentada** (líneas 96-119: un `api` alternativo + red `aws-local` con `AWS_ENDPOINT_URL: http://localstack:4566`) — no hay LocalStack activo que migrar. Este change se re-enmarca como **activar Floci** como tooling de emulación AWS en el stack dev-local.

LocalStack Community se sunsets en marzo 2026 (exige auth token; los updates de seguridad quedan congelados). Floci (`floci-io/floci`, MIT, puerto 4566, 68 servicios AWS) es el reemplazo drop-in: wire-compatible, Testcontainers-compatible. El server ya usa `@aws-sdk/client-secrets-manager` (`apps/server/src/config/aws/secret-manager.client.js`) que respeta `AWS_ENDPOINT_URL` — el código está listo para emulación sin cambios de app.

## What Changes

- **Activar servicio `floci` en `apps/server/docker-compose.yml`**: sustituir la sección LocalStack comentada por un servicio `floci` (imagen `floci/floci:v1.5.11` pineada, puerto `4566:4566`, `FLOCI_STORAGE_MODE=memory`, healthcheck `["CMD", "floci", "health"]`) — emulación AWS disponible en dev local con `docker compose up`
- **Setup de desarrollo documentado**: cómo levantar Floci + app local (`AWS_ENDPOINT_URL=http://localhost:4566`, credenciales dummy `test`/`test`, `AWS_REGION=us-east-1`, `SECRET_NAME`), verificar healthcheck y conectar Secrets Manager emulado
- **Documentación `docs/aws-dev-local-floci.md`**: qué es Floci (floci.io, MIT, 68 servicios), diferencias vs AWS real, cómo el código de Secrets Manager se conecta vía `AWS_ENDPOINT_URL`, ruta de aprendizaje (referencia cruzada a `docs/aws-learning-with-floci.md` del change sibling `ci-preview-environments`)
- **Tests**: verificado que ningún test de integración usa emulador AWS hoy (solo Postgres); este change NO añade tooling de tests — el path de Secrets Manager emulado queda documentado para uso manual/dev, y la ampliación con `@floci/testcontainers` + Vitest queda como follow-up
- **BREAKING**: No aplica — es tooling de desarrollo y documentación; no se modifican contratos de API, flujos de usuario, producción ni staging

## Capabilities

### New Capabilities

- `ci-floci-dev-emulation`: Emulación AWS en dev local vía el servicio `floci` del compose dev-local (`apps/server/docker-compose.yml`): puerto 4566, storage en memoria, healthcheck propio; la app se conecta con `AWS_ENDPOINT_URL` + credenciales dummy sin cambios de código

### Modified Capabilities

- Ninguna: los specs existentes (`openspec/specs/`) cubren funcionalidad de la aplicación (events, notes, websocket, etc.), no tooling de desarrollo. Este change introduce tooling dev-local sin cambiar requisitos de comportamiento de la app.

## Impact

- **`apps/server/docker-compose.yml`**: activar servicio `floci` (sustituye la sección LocalStack comentada de las líneas 96-119); los servicios existentes (`db`, `pgAdmin`, `api`, `nginx`, `prometheus`, `grafana`) quedan intactos; **Postgres 17 no se toca**
- **Docs**: `docs/aws-dev-local-floci.md` (nuevo) — guía de activación dev-local; NO colisiona con `docs/aws-learning-with-floci.md` (sibling `ci-preview-environments`)
- **`apps/server/.env.example`**: documentar variables AWS de dev (`AWS_REGION`, `AWS_ENDPOINT_URL`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `SECRET_NAME`) como referencia para setup local
- **Tests**: sin cambios (ningún test usa emulador AWS hoy)
- **No afecta**: `ci-preview-environments` (su `docker-compose.preview.yml` es stack separado), el workflow `preview.yml` (fuera de scope de este change), producción, staging, ni flujos de la aplicación
