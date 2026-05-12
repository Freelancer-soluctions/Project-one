# Specs: Notas con Menciones - API y Modelo

## Contexto
- Este spec describe el MVP para soportar menciones dentro del texto de notas.

## Alcance del cambio
- Modelo de datos:
  - notes.has_mentions: Boolean
  - Nueva tabla mentions con: id, note_id, mentioned_user_id, mentioned_by_user_id, position_start, position_end, createdOn, is_read
  - Relaciones: notes <-> mentions, users (mentioned) y users (mentioner)
- Backend:
  - Parsea menciones en el contenido de las notas al crear/editar.
  - Crea entradas en mentions para cada mención válida y actualiza has_mentions a true.
  - Endpoint MVP para consultar menciones por nota (opcional en la primera entrega).
- Frontend:
  - Resalta menciones dentro del contenido y enlaza a perfiles de usuarios mencionados.

## Modelo de datos (diff de alto nivel)
- En model notes: añadir has_mentions Boolean @default(false) y relation hacia mentions.
- Nuevo model mentions:
  - id Int @id @default(autoincrement())
  - note_id Int
  - mentioned_user_id Int
  - mentioned_by_user_id Int
  - position_start Int
  - position_end Int
  - createdOn DateTime @default(now())
  - is_read Boolean @default(false)
  - note Notes @relation("NoteMentions", fields: [note_id], references: [id])
  - mentionedUser Users @relation("MentionedUser", fields: [mentioned_user_id], references: [id])
  - mentionedByUser Users @relation("MentionedByUser", fields: [mentioned_by_user_id], references: [id])

## Flujos de negocio
- Crear nota con contenido que contenga @usuario:
  - Detectar menciones; validar usuarios; crear entradas en mentions; setear has_mentions = true.
- Editar nota:
  - Re-evaluar menciones y sincronizar la tabla mentions; actualizar has_mentions según corresponda.

## Migración de datos
- Se debe generar una migración Prisma que implemente el nuevo campo y la nueva tabla.
- En iteraciones futuras se puede considerar migración de menciones históricas si existieran.

## Criterios de aceptación
- Presencia del campo has_mentions en notes y del modelo mentions con las relaciones descritas.
- Migración que crea la columna y la tabla.
- Lógica de parsing funcional para MVP (detectar @usuario, validar existencia y crear entries en mentions).
- Possibilidad de consultar menciones por nota (endpoint MVP) o incluirlas en GET /notes/:id.

## Seguridad y validaciones
- Menciones solo a usuarios existentes y activos; evitar menciones a usuarios no válidos.
- Considerar reglas de permisos para ver menciones, si aplica.

## Notas
- Este spec cubre MVP; mejoras futuras pueden incluir autocompletado, notificaciones, filtrado y rendimiento optimizado.
