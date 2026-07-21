## 1. Prisma Schema Update

- [x] 1.1 Añadir has_mentions en el modelo notes (schema.prisma)
- [x] 1.2 Crear el modelo mentions con campos: id, note_id, mentioned_user_id, mentioned_by_user_id, position_start, position_end, createdOn, is_read
- [x] 1.3 Definir las relaciones:
  - notes <-> mentions (NoteMentions)
  - users <-> mentions (MentionedUser, MentionedByUser)
- [x] 1.4 Criterios de aceptación: El schema.prisma contiene las definiciones solicitadas
- [x] 1.5 Dependencias: ninguno

## 2. Backend MVP: parsing y persistencia de menciones

- [x] 2.1 Implementar la lógica de parsing de menciones en el servicio de notas
  - Detectar menciones en el content usando un patrón simple (p. ej., @usuario)
- [x] 2.2 Validar que los usuarios mencionados existan
- [x] 2.3 Crear entradas en mentions para cada mención detectada
- [x] 2.4 Actualizar has_mentions a true si se detectaron menciones
- [x] 2.5 Asegurar que al actualizar una nota, se actualicen las menciones de manera coherente
- [x] 2.6 Criterios:
  - Función de parsing funcional para ejemplos básicos
  - Menciones válidas se persisten en la tabla mentions
  - La nota tiene has_mentions = true cuando corresponde
- [x] 2.7 Dependencias: Tarea 1

## 3. API e integración (MVP)

- [x] 3.1 Implementar endpoint MVP (si se elige dedicado): GET /notes/:id/mentions que retorne la lista de menciones para la nota
- [x] 3.2 Criterios: Endpoint disponible y retorna menciones asociadas
- [x] 3.3 Dependencias: 2

## 4. Frontend MVP: resaltado de menciones

- [x] 4.1 En la lectura de notas, resaltar las menciones detectadas (p. ej., con estilo distintivo) y enlazar al perfil de usuario mencionado
- [x] 4.2 Criterios:
  - Menciones visibles y destacadas en la UI de notas
  - Enlaces a perfiles de usuarios mencionados
- [x] 4.3 Dependencias: 3

## 5. Pruebas

- [x] 5.1 Pruebas unitarias para la función de parsing
- [x] 5.2 Pruebas de integración para la creación de notas y la persistencia de menciones
- [x] 5.3 Criterios: Cobertura básica de parsing y persistencia de menciones
- [x] 5.4 Dependencias: 1-4

## 6. Documentación y migración de datos

- [x] 6.1 Documentar el flujo de menciones y los campos (posiciones, is_read, etc.)
- [x] 6.2 Criterios: Documentación disponible para el equipo; existe documentación para este modelo en docs/client-notes y docs/server-notes y debe complementar los cambios realizados en estas tareas
- [x] 6.3 Dependencias: 1-5