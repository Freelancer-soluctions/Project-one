## ADDED Requirements

### Requirement: Relaciones 1:N deben tener alias coincidentes

Cuando una relacion 1:N se define en Prisma Schema con `@relation("alias")` en el lado "many", el lado "one" DEBE tener el mismo `@relation("alias")` para que Prisma pueda validar y generar el cliente correctamente.

#### Scenario: alias en events.attendees coincide con attendees.event
- **WHEN** el modelo `events` declara `attendees attendees[]`
- **THEN** DEBE tener `@relation("eventAttendees")` para coincidir con `attendees.event` que usa `@relation("eventAttendees", fields: [eventId], references: [id])`

#### Scenario: alias en events.registrationLog coincide con registration_log.attendee
- **WHEN** el modelo `events` declara `registrationLog registration_log[]`
- **THEN** DEBE tener `@relation("attendeeLogs")` para coincidir con `registration_log.attendee` que usa `@relation("attendeeLogs", fields: [attendeeId], references: [id])`

### Requirement: Validacion de schema pasa sin errores

El schema Prisma debe ser validable sintacticamente.

#### Scenario: prisma validate exit 0
- **WHEN** se ejecuta `npx prisma validate --schema=apps/server/prisma/schema.prisma`
- **THEN** debe retornar codigo de salida 0 con mensaje "The schema at ... is valid"

#### Scenario: prisma generate exit 0
- **WHEN** se ejecuta `npx prisma generate --schema=apps/server/prisma/schema.prisma`
- **THEN** debe retornar codigo de salida 0 y generar Prisma Client exitosamente

### Requirement: Workspace install no bloqueado por P1012

El monorepo debe poder ejecutar `npm install` con soporte de workspaces sin errores P1012 de Prisma.

#### Scenario: npm install desde raiz completa sin errores
- **WHEN** se ejecuta `npm install` desde la raiz del monorepo
- **THEN** el script `postinstall` de `apps/server` ejecuta `prisma generate` sin errores P1012
- **THEN** todas las dependencias de todos los workspaces se instalan correctamente
