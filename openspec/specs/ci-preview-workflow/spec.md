# ci-preview-workflow Specification

## Purpose

Define el workflow de preview que valida el backend del PR contra el stack AWS emulado con Floci (build, Prisma, smoke tests) y publica en el PR los resultados junto a la URL del preview del client de Vercel.

## Requirements

### Requirement: Disparadores del workflow de preview

El workflow de preview SHALL ejecutarse en eventos de pull request contra `main` y SHALL NOT ejecutarse en pushes directos a `main`.

#### Scenario: Workflow corre en el ciclo de vida del PR

- **WHEN** un pull request contra `main` se abre, se reabre o se sincroniza
- **THEN** el workflow de preview corre y valida el backend contra el stack AWS emulado
- **AND** actualiza el comentario de preview del PR con los resultados

#### Scenario: Workflow no corre en pushes a main

- **WHEN** un commit se pushea directamente a `main`
- **THEN** el workflow de preview no se ejecuta

### Requirement: Build y arranque del stack emulado en CI

El workflow SHALL construir la imagen del servidor desde el Dockerfile existente y levantar Floci + PostgreSQL como service containers del runner, aplicando las migraciones de Prisma y verificando la salud del stack.

#### Scenario: Build y servicios del stack

- **WHEN** el workflow de preview inicia la validación del backend
- **THEN** la imagen del servidor se construye desde `apps/server` (Dockerfile existente)
- **AND** los service containers de Floci (puerto 4566) y PostgreSQL efímera se levantan en el runner

#### Scenario: Migraciones y health check

- **WHEN** los service containers del stack están listos
- **THEN** se ejecuta `prisma migrate deploy` contra la PostgreSQL efímera
- **AND** el servidor responde en su endpoint de salud (`/health`, añadido en este change) dentro de la ventana de reintentos configurada, aceptando HTTP 200 o HTTP 503 como respuesta válida de liveness

#### Scenario: Health check con semántica 200/503 (liveness vs readiness)

- **WHEN** se llama a `GET /health` y la consulta de Prisma a la base de datos tiene éxito dentro del timeout de 500 ms
- **THEN** el servidor responde HTTP 200 con `status: ok` (servidor sano y base de datos alcanzable)
- **WHEN** se llama a `GET /health` y la base de datos no está alcanzable o la consulta excede el timeout de 500 ms
- **THEN** el servidor responde HTTP 503 con `status: degraded` (servidor vivo pero no listo para recibir tráfico)
- **AND** el workflow trata HTTP 200 y HTTP 503 como respuestas válidas de liveness (el proceso está vivo), distinguiendo liveness de readiness — patrón estándar de probes tipo Kubernetes

#### Scenario: Build del Dockerfile corregido

- **WHEN** el workflow construye la imagen del servidor
- **THEN** el Dockerfile genera el client de Prisma correctamente (prisma/ copiado antes de `npm ci` o `prisma generate` post-COPY)
- **AND** el contexto de build excluye node_modules/.env vía `.dockerignore`

### Requirement: Smoke tests contra AWS emulado

El workflow SHALL ejecutar smoke tests del servidor contra los servicios AWS emulados por Floci (vía `AWS_ENDPOINT_URL`) y reportar el resultado en el PR.

#### Scenario: Smoke tests contra el emulador

- **WHEN** el stack emulado está operativo
- **THEN** los smoke tests corren contra el endpoint de Floci con `AWS_ENDPOINT_URL` configurado
- **AND** los resultados se capturan para el comentario y los checks del PR

#### Scenario: Fallo de validación reportado

- **WHEN** un smoke test contra el AWS emulado falla
- **THEN** el workflow reporta la validación del backend como fallida en el PR
- **AND** el fallo es visible en la sección de checks del PR

### Requirement: Comentario combinado en el PR

El workflow SHALL publicar un comentario único en el PR con la URL del preview del client (Vercel) y el estado de la validación del backend emulado, actualizando el mismo comentario en eventos posteriores sin crear duplicados.

#### Scenario: Primer comentario creado

- **WHEN** la validación del backend termina y la URL del preview Vercel está disponible
- **THEN** el workflow publica un comentario con la URL del preview del client y el estado de los smoke tests

#### Scenario: Comentario actualizado en synchronize

- **WHEN** un nuevo commit se pushea a la rama del PR
- **THEN** el workflow actualiza el comentario de preview existente con los nuevos resultados
- **AND** no se crea un comentario duplicado

#### Scenario: Comentario identificable

- **WHEN** el workflow busca un comentario de preview existente
- **THEN** lo identifica por un marcador estable único de comentarios de preview
- **AND** actualiza ese comentario en su lugar

#### Scenario: PR de fork sin comentario

- **WHEN** el PR proviene de un fork (`head.repo.fork == true`)
- **THEN** el workflow corre la validación del backend y la reporta vía checks
- **AND** no intenta escribir el comentario combinado (GITHUB_TOKEN es read-only en PRs de forks)

### Requirement: Control de concurrencia del workflow

El workflow SHALL cancelar ejecuciones de preview en curso del mismo PR cuando se pushea un nuevo commit, para evitar validaciones obsoletas o en conflicto.

#### Scenario: Nuevo commit cancela ejecución obsoleta

- **WHEN** una ejecución del workflow está en curso y se pushea un nuevo commit al mismo PR
- **THEN** la ejecución en curso se cancela
- **AND** una nueva ejecución arranca para el commit más reciente
