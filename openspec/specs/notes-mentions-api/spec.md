# notes-mentions-api Specification

## Purpose

Soporta menciones dentro del texto de notas (`@usuario`): modelo de datos, parsing al crear/editar, consultas por nota y validaciones de seguridad. Alcance MVP; mejoras futuras (autocompletado, notificaciones, filtrado, rendimiento) quedan fuera.

## Requirements

### Requirement: Modelo de datos de menciones

El sistema SHALL añadir el campo `has_mentions` al modelo `notes` y SHALL crear la tabla `mentions` con sus relaciones hacia `notes` y `users`.

#### Scenario: Estructura del modelo

- **WHEN** se inspecciona el esquema de Prisma, **THEN** `notes` SHALL tener `has_mentions Boolean @default(false)` y la relación hacia `mentions`
- **THEN** el modelo `mentions` SHALL tener: `id Int @id @default(autoincrement())`, `note_id Int`, `mentioned_user_id Int`, `mentioned_by_user_id Int`, `position_start Int`, `position_end Int`, `createdOn DateTime @default(now())`, `is_read Boolean @default(false)`
- **AND** SHALL tener las relaciones `note Notes @relation("NoteMentions", fields: [note_id], references: [id])`, `mentionedUser Users @relation("MentionedUser", ...)` y `mentionedByUser Users @relation("MentionedByUser", ...)`

#### Scenario: Migración de datos

- **WHEN** se aplican las migraciones, **THEN** SHALL existir una migración Prisma que cree la columna `has_mentions` y la tabla `mentions`
- **AND** la migración de menciones históricas SHALL quedar para iteraciones futuras si existieran

### Requirement: Parseo de menciones al crear o editar notas

El backend SHALL parsear las menciones del contenido de las notas al crear o editar, creando entradas en `mentions` y actualizando `has_mentions`.

#### Scenario: Crear nota con menciones

- **GIVEN** contenido que contenga `@usuario`, **WHEN** se crea la nota, **THEN** el sistema SHALL detectar las menciones, validar los usuarios, crear las entradas en `mentions` y setear `has_mentions = true`

#### Scenario: Editar nota con menciones

- **WHEN** se edita una nota, **THEN** el sistema SHALL re-evaluar las menciones y sincronizar la tabla `mentions`, actualizando `has_mentions` según corresponda

### Requirement: Consulta de menciones por nota

El sistema SHALL exponer un endpoint MVP para consultar menciones por nota, o alternativamente incluirlas en `GET /notes/:id`.

#### Scenario: Consulta de menciones

- **WHEN** se consultan las menciones de una nota, **THEN** SHALL poder obtenerse vía endpoint MVP de menciones por nota o incluidas en la respuesta de `GET /notes/:id`

### Requirement: Seguridad y validaciones de menciones

Las menciones SHALL restringirse a usuarios existentes y activos, y SHALL considerarse reglas de permisos para ver menciones si aplica.

#### Scenario: Usuarios válidos

- **WHEN** se procesa una mención a un usuario inexistente o inactivo, **THEN** el sistema SHALL evitar crear la mención
- **AND** SHALL considerarse reglas de permisos para ver menciones, si aplica
