# Proposal: Notas con Menciones

## Resumen
- Soportar menciones de usuarios dentro del texto de las notas en el módulo de notas.
- Extender el modelo de datos y la lógica de back-end para registrar menciones; la UI podrá resaltar y enlazar menciones en la lectura de notas.
- MVP orientado a datos y back-end; UX/UI avanzará en etapas siguientes.

## Problema que resolvemos
- Facilitar la colaboración y atribución cuando varias personas intervienen en una nota mediante menciones explícitas (p. ej., @usuario).

## Alcance

- Almacenamiento de datos (MVP):
  - Añadir en la tabla notes un campo has_mentions (Boolean).
  - Crear una nueva tabla mentions con:
    - id (PK)
    - note_id (FK → notes)
    - mentioned_user_id (FK → users)
    - mentioned_by_user_id (FK → users)
    - position_start (Int)
    - position_end (Int)
    - createdOn DateTime
    - is_read (Boolean)
  - Relaciones: notes ↔ mentions; users (mencionado) y users (quien menciona) a través de mentions.

- Backend MVP:
  - Detección de menciones al crear/editar una nota y persistencia en la tabla mentions.
  - Establecer has_mentions a true cuando existan menciones.
  - Validar que los usuarios mencionados existan y sean válidos.

- Endpoints (MVP):
  - Opción A: endpoint dedicado (GET /notes/:id/mentions) para obtener menciones de una nota.
  - Opción B: exponer menciones dentro de la respuesta de GET /notes/:id (menos API surface).
  - En una iteración posterior: endpoints para notificaciones o estadísticas de menciones.

- Frontend MVP:
  - Resaltar menciones dentro del contenido de la nota y enlazar al perfil del usuario mencionado.
  - Preparar la UI para autocompletar menciones en editores (opcional en MVP).

## Éxito / Criterios de aceptación
- El esquema de DB soporta:
  - notes.has_mentions: Boolean
  - model mentions con: id, note_id, mentioned_user_id, mentioned_by_user_id, position_start, position_end, createdOn, is_read
- Prisma genera migración que añade has_mentions y el modelo mentions con las relaciones correctas.
- Al crear/editar una nota que contenga menciones, se persisten entradas en mentions y se actualiza has_mentions en la nota correspondiente.
- Lógica básica de parsing de menciones disponible para MVP (detección de menciones en el texto y creación de entradas en mentions).
- Sincronización de estados lectura (is_read) disponible para futuras iteraciones.

## Supuestos
- La detección de menciones se realiza en el servidor (no en el cliente), utilizando una regla simple de parsing (por ejemplo, signos @ seguidos de un nombre de usuario).
- No se migran menciones existentes automáticamente a menos que se decida en una iteración posterior; el MVP tratará menciones como funcionalidad nueva a partir de ahora.
- Las relaciones entre usuarios y notas se mantienen coherentes con el modelo actual (FK a notas y FK a usuarios).

## Riesgos y consideraciones
- Migración de datos existente sin datos de menciones: no hay menciones previas, por lo que la tabla nueva estará vacía en un primer momento.
- Consistencia entre el parsing de menciones y las cuentas de usuario existentes; se debe validar que los usuarios mencionados existan.
- Impacto mínimo en la API pública si cualquier endpoint de notas se ve afectado por el nuevo campo.

## Entregables
- Cambios de modelo en Prisma (notes.has_mentions y model Announces).
- Migración Prisma para crear la tabla mentions y añadir has_mentions.
- Lógica base (pseudocódigo/contrucción de flujo) para parsing y creación de menciones.
- Esbozo de endpoints para exponer menciones (opcional; se decide en la planificación final).

## Preguntas abiertas
- ¿Qué convención de nombres prefieres para las relaciones en Prisma? (p. ej., NoteMentions, MentionedUser, MentionedByUser)
- ¿Endpoint MVP dedicado (GET /notes/:id/mentions) o incluir las menciones dentro de GET /notes/:id?
- ¿Comportamiento por defecto de is_read? ¿Lectura automática al abrir la nota o lectura manual por el destinatario?
- ¿Deseas activar desde ya un flag para desactivar menciones por ahora si se necesita reducir complejidad?
