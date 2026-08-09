# ci-preview-aws-emulation Specification

## Purpose

Provee un stack local y de CI con Floci emulando servicios AWS (puerto 4566) junto al servidor Express y una PostgreSQL efímera, para aprender AWS y validar PRs sin cuenta real ni hosting cloud.

## Requirements

### Requirement: Stack de emulación AWS con Floci

El sistema SHALL proporcionar un stack docker-compose de preview (`apps/server/docker-compose.preview.yml`) que levante el servidor Express, un contenedor Floci emulando AWS y una PostgreSQL efímera, sin requerir cuenta real de AWS ni hosting cloud.

#### Scenario: Stack emulado se levanta en local

- **WHEN** un desarrollador ejecuta `docker compose -f apps/server/docker-compose.preview.yml up`
- **THEN** el servicio Floci escucha en el puerto 4566 emulando servicios AWS
- **AND** el servidor Express y la PostgreSQL efímera arrancan en el mismo stack
- **AND** ninguna llamada a servicios AWS sale a la nube real

#### Scenario: Stack aislado del compose de dev local

- **WHEN** el stack de emulación corre
- **THEN** `apps/server/docker-compose.yml` (dev local) permanece intacto
- **AND** no se comparten volúmenes persistentes entre el stack emulado y otros entornos

### Requirement: Conexión de Secrets Manager vía AWS_ENDPOINT_URL

El sistema SHALL conectar `@aws-sdk/client-secrets-manager` al emulador Floci mediante la variable `AWS_ENDPOINT_URL` cuando esté definida, sin cambios en el código de la aplicación.

#### Scenario: El cliente de secrets usa el emulador

- **WHEN** `AWS_ENDPOINT_URL` apunta al servicio Floci del stack
- **THEN** `secrets-manager.client.js` configura ese endpoint en el `SecretsManagerClient`
- **AND** las llamadas a Secrets Manager se resuelven contra Floci y no contra AWS real

#### Scenario: Credenciales dummy en el stack emulado

- **WHEN** el stack de emulación se inicializa
- **THEN** se inyectan credenciales de prueba (`AWS_ACCESS_KEY_ID`/`AWS_SECRET_ACCESS_KEY` de test) y una región configurada
- **AND** nunca se utilizan credenciales reales de AWS en el stack emulado

### Requirement: PostgreSQL efímera del stack emulado

El stack de emulación SHALL usar su propia PostgreSQL efímera, creada dentro del compose, sin volúmenes persistentes compartidos y sin conexión a bases de producción o staging.

#### Scenario: Base de datos dedicada del stack

- **WHEN** el stack de emulación se provisiona
- **THEN** se crea un contenedor PostgreSQL efímero dedicado para ese stack
- **AND** se ejecuta `prisma migrate deploy` contra esa base para aplicar el esquema

#### Scenario: Datos desechables

- **WHEN** el stack de emulación se detiene
- **THEN** los datos de la PostgreSQL efímera se descartan
- **AND** no pueden afectar a otros stacks ni a bases de otros entornos

### Requirement: Validación del backend contra AWS emulado en CI

El sistema SHALL levantar el stack emulado (Floci + PostgreSQL) en el runner de CI y ejecutar smoke tests contra los servicios AWS emulados para validar el PR.

#### Scenario: Smoke tests contra el emulador

- **WHEN** el workflow de preview ejecuta la validación del backend
- **THEN** los smoke tests corren contra el endpoint de Floci (`AWS_ENDPOINT_URL`)
- **AND** un fallo en esos tests marca la validación como fallida en el PR

#### Scenario: Sin hosting público de la API

- **WHEN** el PR está abierto
- **THEN** el backend validado contra Floci no se expone en una URL pública de hosting cloud
- **AND** la validación del backend se reporta como resultado de los smoke tests, no como un endpoint accesible por el revisor
