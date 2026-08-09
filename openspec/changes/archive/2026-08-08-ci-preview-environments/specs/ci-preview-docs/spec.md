## Purpose

Provee una guía de aprendizaje de AWS con Floci para desarrolladores: cómo levantar el stack emulado localmente, qué servicios AWS emula Floci, cómo se conecta el código de Secrets Manager vía `AWS_ENDPOINT_URL` y qué ruta de aprendizaje seguir — sin costo ni cuenta AWS.

## ADDED Requirements

### Requirement: Guía del stack emulado local

El repositorio SHALL contener documentación (`docs/aws-learning-with-floci.md`) que explique cómo levantar y verificar el stack AWS emulado con Floci en local.

#### Scenario: Desarrollador levanta el stack emulado

- **WHEN** un desarrollador lee la guía de aprendizaje AWS
- **THEN** encuentra los comandos para levantar el stack con `docker compose -f apps/server/docker-compose.preview.yml up`
- **AND** encuentra cómo verificar que Floci responde en el puerto 4566 y que el servidor levanta contra el emulador

#### Scenario: Guía describe los componentes del stack

- **WHEN** un desarrollador lee la guía
- **THEN** se explica qué rol cumple cada componente (servidor Express, Floci, PostgreSQL efímera)
- **AND** se aclara que Floci es un emulador local de AWS y no un proveedor de hosting

### Requirement: Servicios AWS emulados documentados

La documentación SHALL enumerar los servicios AWS que Floci emula y las diferencias relevantes frente a AWS real.

#### Scenario: Catálogo de servicios emulados

- **WHEN** un desarrollador lee la guía de aprendizaje
- **THEN** encuentra la lista de servicios AWS emulados por Floci (incluyendo Secrets Manager, el usado por la app)
- **AND** se indican limitaciones o diferencias frente a los servicios reales de AWS

### Requirement: Conexión de Secrets Manager documentada

La documentación SHALL explicar cómo el código de Secrets Manager de la app se conecta al emulador mediante `AWS_ENDPOINT_URL`.

#### Scenario: Ruta del código de secrets explicada

- **WHEN** un desarrollador lee la guía de aprendizaje
- **THEN** se explica que `apps/server/src/config/aws/secret-manager.client.js` usa `AWS_ENDPOINT_URL` para apuntar el `SecretsManagerClient` al emulador
- **AND** se muestra cómo configurar las variables de entorno del stack emulado (endpoint, credenciales dummy, región)

### Requirement: Ruta de aprendizaje AWS

La documentación SHALL ofrecer una ruta de aprendizaje progresiva de AWS usando el stack emulado.

#### Scenario: Camino de aprendizaje progresivo

- **WHEN** un desarrollador sigue la guía de aprendizaje
- **THEN** encuentra una ruta progresiva (levantar el stack emulado → consumir Secrets Manager emulado → explorar otros servicios AWS emulados)
- **AND** se referencia el change `ci-floci-migration` para la migración LocalStack → Floci en dev local
