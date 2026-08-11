## Purpose

Añade tests de integración AWS (S3, DynamoDB, Secrets Manager) con `@floci/testcontainers` + Vitest, levantando un contenedor Floci efímero por corrida de tests, ejecutable en local y en CI. Se apoya en `ci-floci-dev-emulation` (main specs) — el servicio `floci` del compose dev-local y la conexión por `AWS_ENDPOINT_URL` ya están definidos ahí y no se duplican.

## ADDED Requirements

### Requirement: Contenedor Floci efímero por corrida de tests

La suite de tests de integración AWS SHALL levantar un contenedor Floci efímero vía `@floci/testcontainers` al inicio de la corrida y derribarlo al final, sin estado residual entre corridas.

#### Scenario: Inicio de la corrida de tests

- **WHEN** se ejecuta la suite de tests de integración AWS (local o CI)
- **THEN** Testcontainers levanta un contenedor Floci con la imagen pineada `floci/floci:1.5.31`
- **AND** el contenedor usa `FLOCI_STORAGE_MODE=memory` (estado efímero, sin volúmenes persistentes)
- **AND** el puerto 4566 del host mapea al puerto 4566 del contenedor

#### Scenario: Fin de la corrida de tests

- **WHEN** la suite de tests de integración AWS termina (éxito o fallo)
- **THEN** Testcontainers derriba el contenedor Floci
- **AND** no queda ningún contenedor Floci de test corriendo en el host

### Requirement: Variables de entorno AWS para la suite de tests

La suite de tests de integración AWS SHALL conectarse al emulador Floci usando variables de entorno, sin código de app modificado.

#### Scenario: Cliente AWS apunta a Floci

- **WHEN** un test de integración AWS crea un cliente AWS (S3, DynamoDB o Secrets Manager) con `AWS_ENDPOINT_URL=http://localhost:4566`, credenciales dummy (`AWS_ACCESS_KEY_ID=test`, `AWS_SECRET_ACCESS_KEY=test`) y `AWS_REGION=us-east-1`
- **THEN** el cliente apunta al endpoint emulado de Floci
- **AND** las operaciones del test se ejecutan contra el contenedor Floci efímero

### Requirement: Smoke test de S3 contra Floci

La suite SHALL incluir un smoke test de S3 que valide las operaciones básicas de objetos contra Floci.

#### Scenario: Operaciones básicas de S3

- **WHEN** el smoke test de S3 crea un bucket, sube un objeto, lo lee y lo borra contra Floci, con el cliente S3 configurado con `forcePathStyle: true` (el emulador requiere path-style addressing, no virtual-hosted contra localhost:4566)
- **THEN** las cuatro operaciones (create bucket, put object, get object, delete object) completan sin error
- **AND** el objeto leído coincide con el objeto subido
- **AND** el bucket usa un nombre único por corrida (sufijo uuid/timestamp) y el cleanup de `afterAll` borra el bucket completo (no solo los objetos) — aislamiento entre workers paralelos y reintentos de CI (evita `BucketAlreadyOwnedByYou`)

### Requirement: Smoke test de DynamoDB contra Floci

La suite SHALL incluir un smoke test de DynamoDB que valide las operaciones básicas de tabla e ítems contra Floci.

#### Scenario: Operaciones básicas de DynamoDB

- **WHEN** el smoke test de DynamoDB crea una tabla, inserta un ítem, lo lee y lo borra contra Floci, con nombre de tabla único por corrida (sufijo uuid/timestamp)
- **THEN** las operaciones (create table, put item, get item, delete item) completan sin error
- **AND** el ítem leído coincide con el ítem insertado
- **AND** el cleanup de `afterAll` borra la tabla completa (no solo los ítems) — aislamiento entre workers paralelos y reintentos de CI (evita `ResourceInUseException`)

### Requirement: Ejecución en CI

Los tests de integración AWS SHALL ejecutarse en el job de integración de CI sin service container adicional, usando Docker del runner.

#### Scenario: CI corre los tests de integración

- **WHEN** el job de integración de `ci.yml` ejecuta la suite de tests en un runner con Docker disponible
- **THEN** Testcontainers levanta el contenedor Floci dentro del job
- **AND** los tests AWS (S3, DynamoDB, Secrets Manager) pasan en CI

### Requirement: Fallos de prerequisito con mensaje claro

La suite de tests de integración AWS SHALL fallar con un mensaje claro de prerequisito cuando Docker no esté disponible o el puerto 4566 esté ocupado — nunca omitir silenciosamente los tests (un skip silencioso produciría CI verde falso).

#### Scenario: Docker no disponible

- **WHEN** se ejecuta la suite de tests de integración AWS y Docker no está disponible (Docker Desktop/Engine no corre)
- **THEN** los tests FALLAN con un mensaje claro de prerequisito (p.ej. "Docker es requerido para los tests AWS — arranca Docker Desktop/Engine")
- **AND** los tests NO se omiten silenciosamente (un skip silencioso produciría CI verde falso)

#### Scenario: Puerto 4566 ya ocupado por el compose dev-local

- **WHEN** se ejecuta la suite de tests de integración AWS y el puerto 4566 ya está en uso por el servicio `floci` del compose dev-local
- **THEN** los tests fallan con un error claro que referencia `docker compose stop floci` antes de correr los tests AWS

### Requirement: Smoke test de Secrets Manager emulado

La suite SHALL incluir un smoke test del path de Secrets Manager que valide el cliente de la app contra Floci, cuando exista un consumidor real de `loadSecrets()`.

#### Scenario: Consumidor real disponible

- **WHEN** existe un consumidor real de `loadSecrets()` en la app y el smoke test crea un secret en Floci y lo lee vía el cliente de la app
- **THEN** el secret emulado se obtiene sin cambios de código en el cliente de Secrets Manager

#### Scenario: Sin consumidor real

- **WHEN** `loadSecrets()` sigue siendo código muerto (ningún archivo de la app la importa)
- **THEN** el smoke test de Secrets Manager se valida vía el cliente SDK directamente contra Floci (create secret + get secret)
- **AND** el test queda marcado para ampliarse al path completo de la app cuando exista consumidor
