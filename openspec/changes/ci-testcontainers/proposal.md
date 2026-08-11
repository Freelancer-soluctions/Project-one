## Why

El plan `docs/cicd-plan-implementacion.md` (ítem 2.4) prevé "Integrar `@floci/testcontainers` con Vitest para tests AWS" (criterio de aceptación: "Tests que usan S3/DynamoDB funcionan con Floci en CI y local"). Este ítem quedó **explícitamente diferido como follow-up** en el change archivado `ci-floci-migration` (2026-08-08): proposal L-12/19, design decisión 6, tasks 3.2 y `docs/aws-dev-local-floci.md` §Follow-up (L-244-254). No existe ningún OpenSpec change para ello — este change cubre ese gap.

La base ya está en main specs: `openspec/specs/ci-floci-dev-emulation/spec.md` (sync del change archivado) define el servicio `floci` en el compose dev-local (imagen pineada `floci/floci:1.5.31`, puerto 4566, `FLOCI_STORAGE_MODE=memory`, healthcheck `/_localstack/health`) y la conexión de la app vía `AWS_ENDPOINT_URL` + credenciales dummy. Lo que falta es el **tooling de tests**: hoy ningún test de integración usa emulador AWS (verificado en `ci-floci-migration`), y `@floci/testcontainers` **no existe en el árbol de dependencias** (verificado: ningún `package.json` lo declara). Este change añade la capa de tests AWS con Testcontainers sobre la emulación ya activa.

## What Changes

- **Dependencias nuevas de test** (devDependencies en `apps/server/package.json`): `@floci/testcontainers` (módulo oficial de Testcontainers para Floci, configuración zero-código con Vitest) + `@aws-sdk/client-s3` y `@aws-sdk/client-dynamodb` (clientes SDK que importan los smoke tests S3/DynamoDB)
- **Setup de Testcontainers en Vitest**: `globalSetup`/`globalTeardown` que levantan/derriban un contenedor Floci efímero por corrida de tests (imagen pineada `floci/floci:1.5.31`, `FLOCI_STORAGE_MODE=memory`, puerto 4566 mapeado), con variables de entorno AWS para la suite (`AWS_ENDPOINT_URL=http://localhost:4566`, credenciales dummy `test`/`test`, `AWS_REGION=us-east-1`)
- **Tests de integración AWS en `apps/server/tests/integration/aws/`**: patrones smoke + integración para S3 y DynamoDB (crear/leer/borrar objetos y ítems contra Floci), más un test del path de Secrets Manager emulado (`loadSecrets()`) si existe consumidor — ver nota en spec
- **CI**: los tests AWS corren en el job de integración existente de `ci.yml` (GitHub Actions `ubuntu-latest` tiene Docker; Testcontainers gestiona su propio contenedor, sin service container adicional)
- **Docs**: actualizar la sección follow-up de `docs/aws-dev-local-floci.md` (marcar ítem 2.4 como implementado) y documentar el patrón de tests AWS con Testcontainers
- **BREAKING**: No aplica — es tooling de testing y documentación; no se modifican contratos de API, flujos de usuario, producción ni staging

## Capabilities

### New Capabilities

- `ci-floci-testcontainers`: Tests de integración AWS (S3/DynamoDB/Secrets Manager) con `@floci/testcontainers` + Vitest — contenedor Floci efímero por corrida (globalSetup/teardown), variables de entorno AWS de test, patrones smoke/integración, ejecutable en local y en CI. Se apoya en `ci-floci-dev-emulation` (ya en main specs) sin duplicar sus requisitos.

### Modified Capabilities

- Ninguna: `ci-floci-dev-emulation` (main specs) no cambia sus requisitos — el compose dev-local, healthcheck y conexión por env vars quedan intactos; este change solo añade tooling de tests encima.

## Impact

- **`apps/server/package.json`**: nuevas devDependencies `@floci/testcontainers`, `@aws-sdk/client-s3` y `@aws-sdk/client-dynamodb` (versiones pineadas en lockfile) — los smoke tests S3/DynamoDB importan estos clientes SDK; hoy solo existe `@aws-sdk/client-secrets-manager` en el árbol de dependencias
- **`apps/server/vitest.integration.config.js`** (nueva): config dedicada que extiende `vitest.config.js` y registra `globalSetup`/`globalTeardown` de Testcontainers SOLO para corridas de integración — la config compartida `vitest.config.js` NO se toca (evita forzar Docker en unit/coverage/changed/regression/prepush)
- **Nuevos archivos de test**: `apps/server/tests/integration/aws/` (S3, DynamoDB, Secrets Manager) + setup de Testcontainers (p.ej. `apps/server/tests/testcontainers/`)
- **`apps/server/.env.test`**: variables AWS de test (endpoint Floci, dummy creds) si aplica
- **Docs**: `docs/aws-dev-local-floci.md` (sección follow-up → implementado) y posible nota en `docs/testing-architecture.md`
- **CI**: job `test-integration` de `ci.yml` — sin cambios de workflow (Docker ya disponible en runners ubuntu); verificar que el job no use `maxWorkers` que impida contenedores
- **No afecta**: `ci-floci-dev-emulation` (spec ya en main), `ci-preview-environments` (stack separado), producción, staging, ni flujos de la aplicación
