## Why

El monorepo tiene un error Prisma P1012 que bloquea `npm install` desde la raíz: el script `postinstall` de `apps/server` ejecuta `prisma generate`, el cual falla porque dos relaciones 1:N en el modelo `events` carecen de alias `@relation` en el lado "one". Esto impide la verificacion de `fix-workspaces-gaps` (Fase 5). Es deuda tecnica preexistente, no introducida por el cambio de workspaces.

## What Changes

- Agregar `@relation("eventAttendees")` al campo `attendees attendees[]` en el modelo `events` (schema.prisma, linea ~287)
- Agregar `@relation("attendeeLogs")` al campo `registrationLog registration_log[]` en el modelo `events` (schema.prisma, linea ~288)
- No se modifican migraciones, DAOs, controladores ni otros campos del schema
- No hay cambios de comportamiento — solo correccion sintactica del schema Prisma

## Capabilities

### New Capabilities

- `schema-relation-aliases`: Las relaciones 1:N en Prisma deben tener alias `@relation` coincidentes en ambos lados (one y many) para que Prisma pueda validar y generar el cliente correctamente

### Modified Capabilities

Ninguna. No cambian requisitos de comportamiento existentes.

## Impact

- **Archivo modificado**: `apps/server/prisma/schema.prisma` (solo 2 lineas)
- **Dependencias**: Ninguna. No requiere migracion ni cambios en codigo de aplicacion
- **Riesgo**: Cero — solo se agregan alias sintacticos. El comportamiento en runtime no cambia
- **Desbloquea**: La verificacion de `fix-workspaces-gaps` (Fase 5) y cualquier `npm install` en el monorepo
