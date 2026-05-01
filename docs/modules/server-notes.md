# Module: Notes (Server)

Descripción General
- Gestión de notas en la capa de servidor. Incluye persistencia, lógica de negocio y endpoints para CRUD de notas.

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

- Model noteColumns:
  - id: Int @id @default(autoincrement())
  - title: String @db.VarChar(15)
  - code: String @unique @db.VarChar(3)
  - notes: notes[] @relation("noteColumns")

- Relaciones clave: notes -> noteColumns, users

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
