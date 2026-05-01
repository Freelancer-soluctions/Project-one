# Design: Notas con Menciones

## Visión general
- Este diseño especifica el modelado de datos, relaciones y flujos básicos para soportar menciones en notas.

## Modelos y relaciones (diff conceptual)
- notes (actual)
  - Añadir: has_mentions Boolean @default(false)
  - Añadir relación: mentions mentions[] @relation("NoteMentions")
- model talks (nuevo) — model: mentions
  - id Int @id @default(autoincrement())
  - note_id Int
  - mentioned_user_id Int
  - mentioned_by_user_id Int
  - position_start Int
  - position_end Int
  - createdOn DateTime @default(now())
  - is_read Boolean @default(false)
  - Relaciones:
    - note: notes @relation("NoteMentions", fields: [note_id], references: [id])
    - mentionedUser: users @relation("MentionedUser", fields: [mentioned_user_id], references: [id])
    - mentionedByUser: users @relation("MentionedByUser", fields: [mentioned_by_user_id], references: [id])

## Relaciones sugeridas en Prisma
- model notes {
  id ...,
  has_mentions Boolean @default(false)
  mentions mentions[] @relation("NoteMentions")
}
- model users {
  // ...existing fields
  mentionsReceived mentions[] @relation("MentionedUser")
  mentionsGiven mentions[] @relation("MentionedByUser")
}
- model mentions {
  id Int @id @default(autoincrement())
  note_id Int
  mentioned_user_id Int
  mentioned_by_user_id Int
  position_start Int
  position_end Int
  createdOn DateTime @default(now())
  is_read Boolean @default(false)

  note           notes @relation("NoteMentions", fields: [note_id], references: [id])
  mentionedUser  users @relation("MentionedUser", fields: [mentioned_user_id], references: [id])
  mentionedByUser users @relation("MentionedByUser", fields: [mentioned_by_user_id], references: [id])
}

@@index([note_id])
@@index([mentioned_user_id])
@@index([mentioned_by_user_id])
// Opcional: índice compuesto para acelerar búsquedas por nota y posiciones
// @@index([note_id, position_start, position_end])

## Flujos de datos (Back-end MVP)
- Crear nota
  - Content llega al back-end.
  - Implementar un parser simple para detectar menciones con patrón @usuario.
  - Validar que cada usuario citado existe en la base de datos.
  - Crear entradas en mentions para cada mención detectada.
  - Establecer has_mentions en la nota a true si se detectaron menciones.
- Actualizar nota
  - Si content cambia, re-parse y actualizar entradas de menciones (agregar/eliminar) y setear has_mentions acorde.
- Consultas
  - Endpoint opcional para obtener menciones de una nota: GET /notes/:id/mentions.
  - Campos clave: id, note_id, mentioned_user_id, mentioned_by_user_id, position_start, position_end, is_read, createdOn.

## Compatibilidad
- Compatibilidad con código existente: no se eliminan rutas; se agregan estructuras de datos.


## Riesgos y mitigaciones
- Parsing más robusto en caso de requerir alias o menciones complejas; iniciar con regexp básico y validación de usuario.
- Integridad de FK: garantizar que los usuarios mencionados existan y no se eliminen.
- Rendimiento: usar índices en note_id y FK de mentions.

## Notas finales
- Este diseño está orientado a un MVP; se pueden iterar mejoras en siguientes fases (notificaciones, autocompletado, etc.).
