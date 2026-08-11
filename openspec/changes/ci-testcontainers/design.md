## Context

- Motivación completa en proposal.md - Why: ítem 2.4 de `docs/cicd-plan-implementacion.md` diferido como follow-up en `ci-floci-migration` (archivado 2026-08-08); `@floci/testcontainers` no está en el árbol de dependencias (verificado).
- La base ya está en main specs: `openspec/specs/ci-floci-dev-emulation/spec.md` define el servicio `floci` del compose dev-local (imagen `floci/floci:1.5.31`, puerto 4566, `FLOCI_STORAGE_MODE=memory`, healthcheck `/_localstack/health`) y la conexión por `AWS_ENDPOINT_URL` + credenciales dummy. Este change NO toca esa spec.
- El server usa Vitest con configuración híbrida: unit tests colocated (`src/**/*.unit.test.js`) + integration tests centralizados (`tests/integration/<module>/*.integration.test.js`), `setupFiles: ./tests/setupTest.js` (carga `.env.test`), y en CI `maxWorkers: 1, isolate: false, retry: 2` (`apps/server/vitest.config.js`).
- El job `test-integration` de `ci.yml` corre en `ubuntu-latest` (Docker disponible) con PostgreSQL service container; Testcontainers puede usar el socket Docker del runner sin configuración extra.
- `loadSecrets()` (`src/config/aws/secrets.js`) es código muerto hoy (ningún archivo la importa) — verificado en `ci-floci-migration`; el smoke test de Secrets Manager se valida vía SDK directo hasta que exista consumidor.

## Goals / Non-Goals

**Goals:**

- Añadir `@floci/testcontainers`, `@aws-sdk/client-s3` y `@aws-sdk/client-dynamodb` como devDependencies y levantar un contenedor Floci efímero por corrida de tests (globalSetup/teardown)
- Proveer smoke tests de S3 y DynamoDB + smoke test de Secrets Manager contra Floci, ejecutables en local y en CI
- Mantener consistencia con `ci-floci-dev-emulation`: misma imagen pineada `floci/floci:1.5.31`, `FLOCI_STORAGE_MODE=memory`, endpoint `http://localhost:4566`, credenciales dummy `test`/`test`

**Non-Goals:**

- NO modificar el compose dev-local ni la spec `ci-floci-dev-emulation` (ya en main specs)
- NO cambiar el job de CI ni añadir service container para Floci (Testcontainers gestiona su propio contenedor)
- NO cubrir servicios AWS más allá de S3, DynamoDB y Secrets Manager (los que la app usa o usará)
- NO implementar consumidor real de `loadSecrets()` (fuera de scope; el smoke test se adapta cuando exista)

## Decisions

1. **Dependencias de test (devDependencies en `apps/server/package.json`)**
   - `@floci/testcontainers`: módulo oficial de Testcontainers para Floci (floci.io/floci/testcontainers/nodejs/), con integración Vitest. Versión `latest` pineada en el lockfile (política de pinning del repo).
   - `@aws-sdk/client-s3` y `@aws-sdk/client-dynamodb`: clientes SDK que importan los smoke tests S3/DynamoDB (hoy solo existe `@aws-sdk/client-secrets-manager` en el árbol de dependencias); versiones pineadas en el lockfile.
   - Alternativas rechazadas: (a) `testcontainers` genérico + `GenericContainer` — más código manual, sin helpers de Floci; (b) LocalStack Testcontainers — LocalStack Community se sunsets (auth token), y el repo ya migró a Floci.

2. **Vitest `globalSetup`/`globalTeardown` para el contenedor Floci — SOLO en corridas de integración**
   - Un `globalSetup` arranca el contenedor Floci una vez por corrida (imagen `floci/floci:1.5.31`, `FLOCI_STORAGE_MODE=memory`, puerto `4566:4566`) y el `globalTeardown` lo derriba. Setup y teardown viven en UN SOLO archivo que exporta ambos (patrón canónico de `@floci/testcontainers` — dos archivos separados no pueden compartir el handle del contenedor; alternativa: módulo singleton compartido).
   - **Registro aislado por config**: se registran en una config dedicada `apps/server/vitest.integration.config.js` (extiende `vitest.config.js` vía `mergeConfig`, usada por el script `test:integration`) — NO en `vitest.config.js` compartido, que forzaría Docker en unit/coverage/changed/regression/prepush y ralentizaría el job CI `test-unit-server`. Alternativa aceptada: `globalSetup` env-gated no-op.
   - **Verificación de opciones**: confirmar que `FlociContainer` soporta la imagen pineada `floci/floci:1.5.31`, `FLOCI_STORAGE_MODE=memory` y el mapeo estático `4566:4566`; tras arrancar, verificar con `docker inspect` que el contenedor corre la tag pineada.
   - Alternativas rechazadas: `beforeAll`/`afterAll` por archivo de test — arranca un contenedor por archivo (lento, N contenedores por corrida); `setupFiles` — corre por worker y no es el lugar para lifecycle de contenedores.
   - **Nota**: como el puerto se mapea fijo a `4566:4566`, el endpoint es determinista (`http://localhost:4566`) y no hace falta propagar puertos dinámicos entre procesos; las variables de entorno se definen en `.env.test` (ya cargado por `setupTest.js`) y en el propio `globalSetup` para los clientes AWS.

3. **Variables de entorno AWS de test**
   - `AWS_ENDPOINT_URL=http://localhost:4566`, `AWS_ACCESS_KEY_ID=test`, `AWS_SECRET_ACCESS_KEY=test`, `AWS_REGION=us-east-1` — mismas dummy creds que `ci-floci-dev-emulation` (gitleaks no las detecta como secretos).
   - Se añaden a `apps/server/.env.test` (o se setean en el `globalSetup` antes de arrancar los workers) para que los clientes AWS de los tests apunten a Floci sin cambios de código.

4. **Ubicación de los tests: `apps/server/tests/integration/aws/`**
   - Sigue la convención híbrida del repo (integration tests centralizados por módulo en `tests/integration/<module>/`). El patrón `include` de Vitest (`tests/integration/**/*.integration.test.js`) ya los descubre sin tocar la config de include.
   - Archivos: `s3-smoke.integration.test.js`, `dynamodb-smoke.integration.test.js`, `secrets-manager.integration.test.js`.
   - **Cliente S3 con `forcePathStyle: true`**: el emulador Floci requiere path-style addressing (`http://localhost:4566/<bucket>/<key>`), no virtual-hosted (`http://<bucket>.localhost:4566/...`) — el cliente S3 de los tests se configura con `forcePathStyle: true`.
   - **Aislamiento por corrida**: nombres únicos de bucket/tabla por corrida (sufijo uuid/timestamp) y cleanup en `afterAll` que borra bucket/tabla completos (no solo objetos/ítems) — evita `BucketAlreadyOwnedByYou` / `ResourceInUseException` con `pool: forks` (workers paralelos) y `retry: 2` en CI.
   - Alternativa rechazada: `tests/integration/` top-level sin subcarpeta — rompe la agrupación por módulo de la convención.

5. **Smoke test de Secrets Manager vía SDK directo (hasta que exista consumidor)**
   - `loadSecrets()` es código muerto; el smoke test crea un secret con `@aws-sdk/client-secrets-manager` contra Floci y lo lee de vuelta (create secret + get secret). Cuando exista un consumidor real, se amplía al path completo de la app (ver spec — Scenario "Consumidor real disponible").

6. **CI sin cambios de workflow**
   - El job `test-integration` de `ci.yml` ya corre en `ubuntu-latest` con Docker; Testcontainers levanta el contenedor dentro del job. La config CI de Vitest (`maxWorkers: 1, isolate: false`) es compatible con Testcontainers.
   - Alternativa rechazada: service container `floci` en el job — duplica lo que Testcontainers ya gestiona y acopla el workflow a la imagen.

7. **Docs: actualizar `docs/aws-dev-local-floci.md`**
   - La sección "Follow-up: Ampliación de Tests AWS" (L-244-254) se marca como implementada (ítem 2.4) y se documenta el patrón de tests AWS con Testcontainers (cómo correrlos, prerequisito Docker, nota de conflicto de puerto con el compose dev).

## Risks / Trade-offs

- [Docker no disponible en el entorno local del dev] → Mitigation: los tests AWS fallan con mensaje claro de prerequisito (Docker Desktop/Engine); se documenta en `docs/aws-dev-local-floci.md`; en CI el runner siempre tiene Docker
- [Conflicto de puerto 4566 si el compose dev-local (`floci`) corre en paralelo] → Mitigation: se documenta `docker compose stop floci` antes de correr los tests AWS; en CI no corre el compose dev
- [`@floci/testcontainers` en `latest` puede romper compatibilidad] → Mitigation: pinning en lockfile + bump controlado como cualquier dependencia; el módulo es oficial de Floci
- [Smoke tests S3/DynamoDB contra emulador no garantizan paridad con AWS real] → Mitigation: son smoke/integración de contrato (endpoint, creds, operaciones básicas); la paridad real se cubre en staging (ítem 3.5 del plan, fuera de scope)
- [Tiempo de corrida: arrancar contenedor por corrida añade latencia] → Mitigation: un solo contenedor por corrida (globalSetup), no por archivo; startup de Floci es ~24 ms

## Migration Plan

1. Añadir `@floci/testcontainers`, `@aws-sdk/client-s3` y `@aws-sdk/client-dynamodb` a `apps/server/package.json` (devDependencies) y `npm install`
2. Crear el setup/teardown de Testcontainers en un solo archivo y registrarlos en `apps/server/vitest.integration.config.js` (config dedicada que extiende `vitest.config.js`; NO registrar en la config compartida)
3. Añadir variables AWS de test a `apps/server/.env.test`
4. Crear smoke tests en `apps/server/tests/integration/aws/` (S3, DynamoDB, Secrets Manager)
5. Correr `npm run test:integration` en local (con Docker) y verificar que los tests AWS pasan
6. Actualizar `docs/aws-dev-local-floci.md` (sección follow-up → implementado)
7. Rollback: `git revert` del cambio (solo dependencias + tests + docs; sin datos ni migraciones)

## Open Questions

- Ninguna: las decisiones de tooling, ubicación y alcance están resueltas; el único unknown diferible (consumidor real de `loadSecrets()`) está documentado en la spec como escenario condicional, no cambia el approach ni el breakdown de tasks.
