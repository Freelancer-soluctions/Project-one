## 1. Dependencia y setup de Testcontainers

- [ ] 1.1 Añadir `@floci/testcontainers`, `@aws-sdk/client-s3` y `@aws-sdk/client-dynamodb` como devDependencies en `apps/server/package.json` y ejecutar `npm install` — verificar que quedan pineadas en el lockfile (política de pinning del repo); los smoke tests S3/DynamoDB importan estos clientes SDK (hoy solo existe `@aws-sdk/client-secrets-manager` en el árbol de dependencias)
- [ ] 1.2 Crear el setup de Testcontainers en UN SOLO archivo (p.ej. `apps/server/tests/testcontainers/floci-container.js`) que exporte setup + teardown (patrón canónico de `@floci/testcontainers` — dos archivos separados no pueden compartir el handle del contenedor; alternativa: módulo singleton compartido): arranca un contenedor Floci efímero con imagen `floci/floci:1.5.31`, `FLOCI_STORAGE_MODE=memory`, puerto `4566:4566`, y setea las variables AWS de test (`AWS_ENDPOINT_URL=http://localhost:4566`, `AWS_ACCESS_KEY_ID=test`, `AWS_SECRET_ACCESS_KEY=test`, `AWS_REGION=us-east-1`). Verificar que `FlociContainer` soporta la imagen pineada, `FLOCI_STORAGE_MODE=memory` y el mapeo estático `4566:4566`; tras arrancar, verificar con `docker inspect` que el contenedor corre la tag `floci/floci:1.5.31`
- [ ] 1.3 Implementar el teardown en el MISMO archivo del setup (export del handle del contenedor + función de teardown que lo derriba al final de la corrida) — NO como archivo separado (dos archivos no pueden compartir el handle del contenedor)
- [ ] 1.4 Registrar `globalSetup`/`globalTeardown` SOLO para corridas de integración: crear `apps/server/vitest.integration.config.js` (extiende `vitest.config.js` vía `mergeConfig`, añade `test.globalSetup`/`test.globalTeardown`) y apuntar el script `test:integration` a esa config — alternativa aceptada: `globalSetup` env-gated no-op. NO registrar en `vitest.config.js` compartido (forzaría Docker en unit/coverage/changed/regression/prepush y ralentizaría el job CI `test-unit-server`). Sin tocar `include`, `setupFiles` ni los thresholds de coverage
- [ ] 1.5 Añadir a `apps/server/.env.test` las variables AWS de test (endpoint Floci, dummy creds `test`/`test`, `AWS_REGION=us-east-1`) marcadas como "solo test / dummy" — no tocar `.env` real

## 2. Smoke tests AWS

- [ ] 2.1 Crear `apps/server/tests/integration/aws/s3-smoke.integration.test.js`: create bucket → put object → get object (verificar contenido) → delete object contra Floci, con cliente S3 configurado con `forcePathStyle: true` (el emulador requiere path-style addressing, no virtual-hosted contra localhost:4566); nombre de bucket ÚNICO por corrida (sufijo uuid/timestamp) y cleanup en `afterAll` que BORRA el bucket (no solo los objetos) — aislamiento para workers paralelos (`pool: forks`) y `retry: 2` en CI (evita `BucketAlreadyOwnedByYou`)
- [ ] 2.2 Crear `apps/server/tests/integration/aws/dynamodb-smoke.integration.test.js`: create table → put item → get item (verificar contenido) → delete item contra Floci, con nombre de tabla ÚNICO por corrida (sufijo uuid/timestamp) y cleanup en `afterAll` que BORRA la tabla (no solo los ítems) — aislamiento para workers paralelos (`pool: forks`) y `retry: 2` en CI (evita `ResourceInUseException`)
- [ ] 2.3 Crear `apps/server/tests/integration/aws/secrets-manager.integration.test.js`: create secret + get secret vía `@aws-sdk/client-secrets-manager` contra Floci (smoke test vía SDK directo; NOTA: `loadSecrets()` es código muerto hoy — ampliar al path completo de la app cuando exista consumidor real, ver spec Scenario "Consumidor real disponible")

## 3. Verificación local

- [ ] 3.1 Correr `npm run test:integration` desde `apps/server` con Docker disponible → los 3 smoke tests AWS pasan
- [ ] 3.2 Verificar que el contenedor Floci de test se derriba al final de la corrida (`docker ps` no muestra contenedor de test residual)
- [ ] 3.3 Verificar que los tests de integración existentes (events, notes) siguen pasando sin cambios

## 4. Verificación en CI

- [ ] 4.1 Verificar que el job `test-integration` de `ci.yml` corre los tests AWS sin cambios de workflow (Docker disponible en `ubuntu-latest`; Testcontainers gestiona su propio contenedor, sin service container adicional) y que el `timeout-minutes: 10` del job alcanza para: pull de la imagen floci (cold) + arranque del contenedor + `prisma migrate` + los tests de integración existentes (events, notes) + los nuevos tests AWS
- [ ] 4.2 Verificar que la config CI de Vitest (`maxWorkers: 1, isolate: false, retry: 2`) es compatible con Testcontainers (el contenedor se levanta en el globalSetup, no por worker)

## 5. Documentación

- [ ] 5.1 Actualizar `docs/aws-dev-local-floci.md` — sección "Follow-up: Ampliación de Tests AWS" (L-244-254): marcar ítem 2.4 como implementado, referenciar este change, y reformular la línea L-254 "Estado: Pendiente — requiere consumidor real de `loadSecrets()`" (los smoke tests vía SDK directo ya cubren el path; nuevo estado: "Implementado — smoke tests vía SDK directo; ampliar al path completo de la app cuando exista consumidor real")
- [ ] 5.2 Documentar el patrón de tests AWS con Testcontainers: prerequisito Docker, cómo correrlos (`npm run test:integration`), y nota de conflicto de puerto 4566 con el compose dev-local (`docker compose stop floci` antes de correr los tests)

## 6. Verificación final vs packaged

- [ ] 6.1 Verificar que la spec nueva `ci-floci-testcontainers` no duplica requisitos de `openspec/specs/ci-floci-dev-emulation/spec.md` (compose, healthcheck, conexión por env vars) — solo extiende con tooling de tests
- [ ] 6.2 Verificar que no hay impacto en producción/staging: sin `AWS_ENDPOINT_URL` definida, el cliente de Secrets Manager usa el endpoint real de AWS por defecto
- [ ] 6.3 Confirmar que el compose dev-local (`apps/server/docker-compose.yml`) y la spec `ci-floci-dev-emulation` no se tocaron
