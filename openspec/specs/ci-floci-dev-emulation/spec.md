# ci-floci-dev-emulation Specification

## Purpose

Activa Floci como emulador local de AWS en el stack dev-local del server (docker compose), permitiendo desarrollar y probar contra Secrets Manager emulado sin cuenta AWS real ni código de app modificado.

## Requirements

### Requirement: Servicio floci en el compose dev-local

El compose dev-local (`apps/server/docker-compose.yml`) SHALL proveer un servicio `floci` que emule servicios AWS en el puerto 4566, en sustitución de la sección LocalStack comentada.

#### Scenario: Stack dev-local levantado

- **WHEN** se ejecuta `docker compose up` con el compose dev-local del server
- **THEN** el servicio `floci` corre con la imagen pineada `floci/floci:1.5.31`
- **AND** el puerto 4566 del host mapea al puerto 4566 del contenedor
- **AND** el servicio usa `FLOCI_STORAGE_MODE=memory` (estado efímero, sin volúmenes persistentes)

#### Scenario: Servicios existentes intactos

- **WHEN** el servicio `floci` se activa en el compose dev-local
- **THEN** los servicios existentes (`db`, `pgAdmin`, `api`, `nginx`, `prometheus`, `grafana`) siguen funcionando sin cambios
- **AND** la versión de Postgres (`postgres:17`) no se modifica

### Requirement: Healthcheck de Floci

El servicio `floci` SHALL exponer un healthcheck ejecutable que permita a `docker compose` reportar su estado de salud.

#### Scenario: Contenedor sano

- **WHEN** el contenedor `floci` está corriendo correctamente
- **THEN** su healthcheck (`["CMD-SHELL", "curl -f http://localhost:4566/_localstack/health"]`) reporta el estado healthy

> **Nota de alineación con la implementación**: el tag `floci/floci:v1.5.11` no existe en Docker Hub; el tag publicado real es `floci/floci:1.5.31` (el que usa el compose dev-local). El comando `floci health` no existe en la imagen; el patrón correcto es el healthcheck curl contra `/_localstack/health` (endpoint de compatibilidad LocalStack), consistente con el stack de preview (`ci-preview-environments`).

### Requirement: Conexión de la app vía variables de entorno

La app SHALL poder conectarse al AWS emulado por Floci usando variables de entorno, sin cambios de código en el cliente de Secrets Manager.

#### Scenario: App local contra Floci

- **WHEN** se ejecuta un script/REPL independiente en local que importa `loadSecrets()` con `AWS_ENDPOINT_URL=http://localhost:4566`, credenciales dummy (`AWS_ACCESS_KEY_ID=test`, `AWS_SECRET_ACCESS_KEY=test`) y `AWS_REGION=us-east-1`
- **THEN** el cliente de Secrets Manager apunta al endpoint emulado de Floci
- **AND** `loadSecrets()` puede obtener un secret almacenado en Floci vía `SECRET_NAME`
- **AND** la validación se realiza vía script/REPL porque `loadSecrets()` es código muerto hoy (ningún archivo de la app la importa); ejecutar la app en sí no ejercita el path de Secrets Manager hasta que exista un consumidor

#### Scenario: Sin variable de endpoint

- **WHEN** `AWS_ENDPOINT_URL` no está definida (entorno de producción/staging)
- **THEN** el cliente de Secrets Manager usa el endpoint real de AWS por defecto
- **AND** el comportamiento de la app en producción no se ve afectado

### Requirement: Documentación de uso dev-local

La documentación del repositorio SHALL explicar cómo levantar Floci junto con la app local y cómo conectar el código de Secrets Manager al emulador.

#### Scenario: Guía de activación disponible

- **WHEN** un desarrollador sigue `docs/aws-dev-local-floci.md`
- **THEN** puede levantar el servicio `floci` con `docker compose up` desde `apps/server`
- **AND** puede verificar que el puerto 4566 responde (healthcheck de Floci)
- **AND** encuentra las variables de entorno AWS necesarias para el setup local
