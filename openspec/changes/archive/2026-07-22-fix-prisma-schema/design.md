## Context

El schema Prisma en `apps/server/prisma/schema.prisma` tiene relaciones 1:N entre los modelos `events`, `attendees` y `registration_log`. El lado "many" (`attendees.event` y `registration_log.attendee`) ya tiene alias `@relation` definidos (`"eventAttendees"` y `"attendeeLogs"` respectivamente). Sin embargo, el lado "one" (`events.attendees` y `events.registrationLog`) carece de estos alias, lo que causa el error Prisma P1012 al ejecutar `prisma generate`.

Este error bloquea el script `postinstall` de `apps/server` (`"postinstall": "prisma generate "`) y, por ende, cualquier `npm install` con soporte de workspaces desde la raiz del monorepo.

## Goals / Non-Goals

**Goals:**
- Restaurar la capacidad de ejecutar `prisma generate` y `npm install` sin errores P1012
- Agregar los alias `@relation` faltantes en el modelo `events` para las relaciones con `attendees` y `registration_log`
- Validar que el schema Prisma sea sintacticamente correcto

**Non-Goals:**
- Generar migraciones de base de datos (no se ejecuta `prisma migrate dev`)
- Refactorizar problemas adicionales del schema (olores preexistentes, campos sin usar, etc.)
- Modificar DAOs, controladores, servicios o cualquier codigo de aplicacion
- Completar el cambio `fix-workspaces-gaps` (solo desbloquear su verificacion)

## Decisions

### D1: Fix minimo — solo alias
- **Decision**: Agregar unicamente los alias `@relation` faltantes sin tocar nada mas del schema
- **Razon**: Es la correccion mas segura y de menor riesgo. No cambia el comportamiento en runtime porque los alias Prisma son solo identificadores internos para el generador. Cualquier mejora adicional al schema debe ser un cambio separado
- **Alternativa considerada**: Refactorizar el schema completo (rechazada por riesgo y alcance)

### D2: Sin generacion de migraciones
- **Decision**: No ejecutar `prisma migrate dev` ni `prisma db push`. Solo validar con `prisma validate` y `prisma generate`
- **Razon**: Las migraciones requieren conexion a base de datos (`DATABASE_URL`) y podrian intentar alterar tablas existentes. Como solo se agregan alias sintacticos (no cambian la estructura fisica), no se necesita migracion
- **Alternativa considerada**: Ninguna — las migraciones son irrelevantes para este cambio

### D3: Sin cambios en codigo de aplicacion
- **Decision**: No modificar DAOs, controladores, servicios ni tests
- **Razon**: Los alias `@relation` son internos de Prisma. El cliente Prisma expone los campos por su nombre (`events.attendees`), no por el alias. Ningun codigo de aplicacion se ve afectado
- **Alternativa considerada**: Ninguna — no hay impacto en codigo de aplicacion

## Riesgos / Trade-offs

| Riesgo | Mitigacion |
|--------|------------|
| Error tipografico en el alias (discrepancia entre one y many side) | Verificar que los strings coincidan exactamente: `"eventAttendees"` y `"attendeeLogs"` |
| Conflictos con ramas que tengan cambios en schema.prisma | Este cambio es atomico y no conflictivo (solo 2 lineas). Resolucion trivial via merge |
| `prisma generate` falle por otra razon | Se ejecuta validacion completa. Cualquier otro error se reporta como hallazgo separado |
