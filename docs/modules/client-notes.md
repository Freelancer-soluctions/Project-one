# Module: Notes (Client)

Descripción General
- Gestión de notas desde la interfaz de usuario. Permite crear, editar y organizar notas en diferentes columnas.
- Soporte para menciones de usuarios con resaltado visual y enlaces a perfiles.

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
  - GET /api/notes/:id/mentions - Obtiene las menciones de una nota
- Lógica de negocio (server/notes/service.js): validaciones, formateo, auditoría de cambios.
- DAO (server/notes/dao.js): acceso a la entidad notes y relaciones (noteColumns, users, mentions).

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
- Las menciones se vinculan a usuarios a través de las relaciones con el backend.

## 🔄 Estados/Workflows
- Flujo típico: listado de notas → crear/editar → guardar
- Notas organizadas por columnas; soporte de filtrado y búsqueda

## 🔔 Menciones (Mentions)
El sistema de menciones permite referenciar usuarios dentro del contenido de notas usando @username.

### Flujo de Menciones (Frontend)
1. **Visualización**: Las menciones se muestran resaltadas en el contenido
2. **Enlace**: Cada mención es un enlace al perfil del usuario mencionado
3. **Persistencia**: Al guardar, el backend procesa y persiste las menciones

### Componentes de Menciones
- El contenido de las notas se procesa para identificar y resaltar menciones
- Las menciones se muestran como enlaces clicables al perfil del usuario
