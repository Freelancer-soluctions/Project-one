# Module: Notes (Client)

Descripción General
- Gestión de notas desde la interfaz de usuario. Permite crear, editar y organizar notas en diferentes columnas.

🏗️ Referencia de servidor
- La entidad de notas se define en el backend ( Prisma ). Este módulo del cliente consume las APIs expuestas por server notes.

## 🗄️ Base de Datos (schema.prisma)
- Nota: En cliente no se define la base de datos; ver Notes en el servidor para el modelo completo.

## ⚙️ Servidor (Backend)
- Endpoints API (ver server/notes/routes.js):
  - GET /api/notes
  - GET /api/notes/:id
  - POST /api/notes
  - PUT /api/notes/:id
  - DELETE /api/notes/:id
- Lógica de negocio (server/notes/service.js): validaciones, formateo, auditoría de cambios.
- DAO (server/notes/dao.js): acceso a la entidad notes y relaciones (noteColumns, users).

## 💻 Cliente (Frontend)
- Páginas: modules/notes/pages/Notes.jsx
- Componentes: 
  - NotesFilters.jsx
  - NotesDialog.jsx
  - NotesCreateDialog.jsx
  - NotesColumn.jsx
  - NotesCard.jsx
- API: client note API: apps/client/src/modules/notes/api/notesAPI.js
- Utilidades: enums.js, schema.js, adapters.js

## 🔗 Relaciones
- Relacionado con usuarios (auditoría) y con columnas de notas (noteColumns).

## 🔄 Estados/Workflows
- Flujo típico: listado de notas → crear/editar → guardar
- Notas organizadas por columnas; soporte de filtrado y búsqueda
