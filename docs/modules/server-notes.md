# Module: Notes (Server)

Descripción General
- Gestión de notas en la capa de servidor. Incluye persistencia, lógica de negocio y endpoints para CRUD de notas.
- Soporte para menciones de usuarios (@username) dentro del contenido de notas.

🗄️ Base de Datos (schema.prisma)
- Model Notes:
  - id: Int, @id, @default(autoincrement())
  - updatedOn: DateTime? @db.Timestamp(3)
  - createdOn: DateTime @db.Timestamp(3)
  - title: String @db.VarChar(50)
  - content: String @db.VarChar(2000)
  - color: String @db.VarChar(6)
  - columnId: Int @db.Integer
  - columnStatus: noteColumns @relation("noteColumns", fields: [columnId], references: [id])
  - userNoteCreated: users @relation("userNoteCreated", fields: [createdBy], references: [id])
  - createdBy: Int @db.Integer
  - hasMentions: Boolean @default(false)
  - mentions: mentions[] @relation("NoteMentions")

- Model mentions:
  - id: Int @id @default(autoincrement())
  - noteId: Int @db.Integer
  - mentionedUserId: Int @db.Integer
  - mentionedByUserId: Int @db.Integer
  - positionStart: Int @db.Integer
  - positionEnd: Int @db.Integer
  - createdOn: DateTime @default(now()) @db.Timestamp(3)
  - isRead: Boolean @default(false)
  - Relaciones:
    - mentionedUser: users @relation("MentionedUser", fields: [mentionedUserId], references: [id])
    - mentionedByUser: users @relation("MentionedByUser", fields: [mentionedByUserId], references: [id])
    - note: notes @relation("NoteMentions", fields: [noteId], references: [id])

- Model noteColumns:
  - id: Int @id @default(autoincrement())
  - title: String @db.VarChar(15)
  - code: String @unique @db.VarChar(3)
  - notes: notes[] @relation("noteColumns")

- Relaciones clave: notes -> noteColumns, users, mentions

⚙️ Servidor (Backend)
- Endpoints: ver notas, crear, actualizar, eliminar (ver server/notes/routes.js)
- Lógica de negocio: validaciones, disponibilidades, auditoría de cambios
- DAO: server/notes/dao.js

💻 Cliente (Frontend)
- Referenciado para interacción con notas (ver docs/modules/client-notes.md)

🔗 Relaciones
- Con usuarios y columnas de notas (noteColumns)

## 🛠️ Implementación y Flujo
- El flujo de notas sigue el patrón CRUD con validaciones simples y auditabilidad de creador/actualizador.

## 🔔 Menciones (Mentions)
Las menciones permiten referenciar usuarios dentro del contenido de notas usando el patrón @username.

### Flujo de Menciones
1. **Detección**: Al crear o actualizar una nota, el contenido se parsea buscando el patrón @username
2. **Validación**: Se verifica que el usuario mencionado exista en la base de datos
3. **Persistencia**: Se crean entradas en la tabla `mentions` para cada mención válida
4. **Flag**: El campo `hasMentions` en la nota se establece a `true` si se detectan menciones

### Campos de Menciones
| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | Int | Identificador único de la mención |
| noteId | Int | FK a la nota que contiene la mención |
| mentionedUserId | Int | FK al usuario mencionado |
| mentionedByUserId | Int | FK al usuario que creó la mención |
| positionStart | Int | Posición inicial de la mención en el contenido |
| positionEnd | Int | Posición final de la mención en el contenido |
| createdOn | DateTime | Fecha de creación de la mención |
| isRead | Boolean | Indica si el usuario ha visto la mención |

### API de Menciones
- **GET /api/v1/notes/:id/mentions** - Obtiene todas las menciones de una nota específica

### Funciones del Servicio
- `parseMentions(content)`: Parsea el contenido y extrae menciones con posiciones
- `findUserByName(username)`: Busca un usuario por su nombre
- `processMentions(content, noteId, mentionedByUserId)`: Procesa y persiste las menciones
- `getMentionsByNoteId(noteId)`: Obtiene las menciones de una nota
