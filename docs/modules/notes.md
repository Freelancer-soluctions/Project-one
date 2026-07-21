# Módulo: Notes (Server + Client)

> Documentación técnica del módulo **Notes**. arc42 / C4 / IEEE 1016.
> Backend: `apps/server/src/modules/notes/`. Client: `apps/client/src/modules/notes/`.

---

## 1. Metadatos

| Campo | Valor |
| ---------------- | ------------------------------------------------ |
| **Módulo** | `notes` |
| **Estado** | Released |
| **Path Server** | `apps/server/src/modules/notes/` |
| **Path Client** | `apps/client/src/modules/notes/` |
| **Base URL API** | `/api/v1/notes` |

---

## 2. Introducción y Objetivos

Sistema de notas tipo Kanban con columnas, hashtags, menciones y favoritos. Notificaciones en tiempo real vía socket bus.

**Sub-recursos**: Hashtags, Mentions, Columns, Favorites.

Funcionalidades:
- CRUD notas con columnas Kanban (drag & drop via PATCH columnId)
- Hashtags CRUD con conteo de notas
- Menciones @usuarios con read/unread
- Favoritos por usuario (join table)
- Scope: 'mine' (propias) / 'mixed' (propias + mencionadas)
- Socket bus events: MENTION_CREATED
- Sin paginación — retorna todas las notas agrupadas por columna

---

## 3. Contexto y Alcance

```
[Admin / Manager / User]
      |
[Notes Module] <--CRUD--> [/api/v1/notes]
      |
      |-- N:1 --> [noteColumns]
      |-- N:M --> [hashtags] (via note_hashtags)
      |-- 1:N --> [mentions] (socket bus notification)
      |-- N:M --> [users] (favorites via user_notes_favorites)
```

**In-Scope**: CRUD notas, hashtags, menciones, favoritos, socket bus.

**Out-of-Scope**: Paginación server-side, versionado, adjuntos.

---

## 4. Restricciones

| ID | Restricción |
| -- | ----------- |
| C-01 | PostgreSQL + Prisma ORM |
| C-02 | Express.js + React + RTK Query |
| C-03 | JWT + `verifyToken` obligatorio |
| C-04 | Socket.io para notificaciones en tiempo real |
| C-05 | Color computado de columnas via `computeColorFromCode` |

---

## 5. Stack Tecnológico

Express, Prisma, PostgreSQL, React, RTK Query, Socket.io, Joi, Zod, react-hook-form.

---

## 6. Arquitectura del Módulo

```
apps/server/src/modules/notes/
├── routes.js                              # 12 rutas
├── controller.js                          # 11 handlers
├── service.js                             # lógica de negocio + extractMentionIds
├── dao.js                                 # Prisma ORM puro
├── utils/
│   ├── computeColorFromCode.js            # color hex de código de columna
│   └── extractMentionIds.js               # extrae @menciones del texto
└── schemas/notes.joi.js                   # filters, create, update, hashtag schemas

apps/client/src/modules/notes/
├── api/notesAPI.js                        # RTK Query
├── components/                            # Datatable, Dialog, FiltersForm, etc.
├── pages/
└── utils/                                 # schema.js, enums.js, adapters.js
```

---

## 7. Building Blocks — Server

### Router

| Método | Ruta | Handler |
| ------ | ---- | ------- |
| GET | `/` | `getAllNotes` |
| POST | `/` | `createNote` |
| PATCH | `/:id` | `updateNoteById` |
| PATCH | `/:id/fav` | `toggleFavorite` |
| DELETE | `/:id` | `deleteById` |
| GET | `/notesColumns` | `getAllNotesColumns` |
| PATCH | `/notecolumn` | `updateNoteColumId` |
| GET | `/notesCount` | `getAllNotesCount` |
| GET | `/:id/mentions` | `getMentionsByNoteId` |
| GET | `/hashtags` | `getAllHashtags` |
| POST | `/hashtags` | `createHashtag` |
| PATCH | `/hashtags/:id` | `updateHashtag` |
| DELETE | `/hashtags/:id` | `deleteHashtag` |

Middleware global: `verifyToken` + `checkRoleAuthOrPermisssion(ADMIN/MANAGER/USER)`.

### Controller

Key handlers:
- `getAllNotes(req.query)` — scope 'mine'/'mixed', agrupa por columna
- `createNote(req.body, req.userId)` — crea nota + hashtags + mentions + socket emit
- `toggleFavorite(req.params.id, req.userId)` — upsert favorites join table
- `updateNoteById` — actualiza nota + re-sync hashtags + extract mentions

### Service

- Scope filtering: 'mine' → `createdBy: userId`, 'mixed' → `createdBy: userId OR mentions: { mentionedUserId: userId }`
- Hashtags sync: `deleteMany` + `createMany` en nota-edición
- Mentions: `extractMentionIds` parsea `@username` del content, busca userId, filtra self-mentions, emite `MENTION_CREATED` via socket bus
- Favorites: upsert via `prisma.userNotesFavorites.upsert`

### DAO (Prisma ORM puro)

- `getAllNotes`: `prisma.notes.findMany` con `include: { column, hashtags, favorites, userNoteCreated }`
- `createNote`: `prisma.notes.create` con relations connect
- `updateNoteById`: dinámico, re-sync hashtags
- `toggleFavorite`: upsert en `userNotesFavorites`
- Hashtag CRUD: `prisma.hashtags.findMany/create/update/delete`

---

## 8. Building Blocks — Client

### RTK Query

Endpoints: `getAllNotes`, `createNote`, `updateNoteById`, `toggleFavorite`, `deleteById`, `getAllNotesColumns`, `updateNoteColumId`, `getAllNotesCount`, `getMentionsByNoteId`, CRUD hashtags.

### Components

- **NotesDatatable**: Kanban board — notas agrupadas por columna. Drag & drop entre columnas
- **NotesDialog**: Form con title, content, columnId (Select), hashtagIds (multi-select), favorite toggle
- **NotesFiltersForm**: searchTerm, statusCode, hashtagId, isFavorite, scope ('mine'/'mixed')

### Utils

- `schema.js`: `NotesSchema` (Zod) con title (max50), content (max2000), columnId, hashtagIds, isFavorite
- `enums.js`: scope constants, column code mappings
- `adapters.js`: `COLUMN_STYLES` mapping column codes → Tailwind classes

---

## 9. Modelo de Datos

### `notes`

| Columna | Tipo | Constraints |
| ------- | ---- | ----------- |
| `id` | `Int` | PK |
| `title` | `String` | `VarChar(50)` |
| `content` | `String` | `VarChar(2000)` |
| `color` | `String?` | `VarChar(7)` hex |
| `columnId` | `Int` | FK → noteColumns.id |
| `hasMentions` | `Boolean` | DEFAULT false |
| `createdBy` | `Int` | FK → users.id |
| `createdOn` | `DateTime` | |
| `updatedOn` | `DateTime?` | |

### `noteColumns`

| Columna | Tipo | Constraints |
| ------- | ---- | ----------- |
| `id` | `Int` | PK |
| `code` | `String` | UNIQUE `VarChar(3)` |
| `description` | `String` | `VarChar(20)` |

### `hashtags`

| Columna | Tipo | Constraints |
| ------- | ---- | ----------- |
| `id` | `Int` | PK |
| `name` | `String` | UNIQUE `VarChar(50)` |
| `createdBy` | `Int` | FK → users.id |
| `createdOn` | `DateTime` | |
| `updatedOn` | `DateTime?` | |

### `mentions`

| Columna | Tipo | Constraints |
| ------- | ---- | ----------- |
| `id` | `Int` | PK |
| `noteId` | `Int` | FK → notes.id |
| `mentionedUserId` | `Int` | FK → users.id |
| `mentionedByUserId` | `Int` | FK → users.id |
| `isRead` | `Boolean` | DEFAULT false |
| `createdOn` | `DateTime` | |

### `user_notes_favorites`

| Columna | Tipo | Constraints |
| ------- | ---- | ----------- |
| `userId` | `Int` | FK → users.id |
| `noteId` | `Int` | FK → notes.id |
| PK | `(userId, noteId)` | |

---

## 10. Contratos de API

### GET /api/v1/notes
Query: `searchTerm`, `statusCode`, `hashtagId`, `isFavorite`, `scope`.
Response 200: `{ columnId: { id, code, description, notes: [...] } }`.

### POST /api/v1/notes
Body: `{ title, content, columnId, hashtagIds?, isFavorite? }`.
Response 201: note object.

### PATCH /api/v1/notes/:id
Body: parcial. Response 200: note object.

### PATCH /api/v1/notes/:id/fav
Body: `{}`. Response 200: favorite { userId, noteId }.

### DELETE /api/v1/notes/:id
Response 200: `{ message }`.

### GET /api/v1/notes/hashtags
Response 200: `[{ id, name, _count: { notes } }]`.

### POST/PATCH/DELETE /api/v1/notes/hashtags/:id
CRUD hashtags estándar.

---

## 11. Validación

### Joi (Server)

```js
NotesFilters: searchTerm (max100), statusCode (3 chars), hashtagId (int|int[]), isFavorite (bool), scope ('mine'|'mixed')
NoteCreate: title (max50 req), content (max2000 req), columnId (int req), hashtagIds (array max20), isFavorite (bool)
NoteUpdate: mismo que create + .min(1)
CreateHashtagSchema: name (max50 req trim)
HashtagUpdateSchema: name (max50 trim) .min(1)
```

### Zod (Client)

```js
NotesSchema: title (min1), content (min1), columnId (int), hashtagIds (array).passthrough()
```

---

## 12. Seguridad

- `verifyToken` global
- Roles: ADMIN, MANAGER, USER (todos los endpoints)
- Mentions: self-mention filter evita auto-notificaciones
- Favorites: upsert con manejo P2002 (unique constraint)

---

## 13. Riesgos y Deuda Técnica

| ID | Descripción | Severidad |
| -- | ----------- | --------- |
| R-01 | **updateNoteById llamada recursiva**: Llama a sí misma con `{ hasMentions: true }` — side effects. | **HIGH** |
| R-02 | **Sin paginación en getAllNotes**: Retorna TODAS las notas. Escalabilidad limitada. | MEDIUM |
| R-03 | **Sin tests**: 0% cobertura. | HIGH |
| R-04 | **Sin manejo Prisma errors**: P2002 (hashtag unique), P2025 (not found). | HIGH |

---

## 14. Glosario

| Término | Definición |
| ------- | ---------- |
| **noteColumns** | Columnas Kanban con code (3 chars) y color computado |
| **Scope** | Filtro 'mine' (notas propias) / 'mixed' (propias + mencionadas) |
| **Mentions** | @username en content, extraídas vía regex, notificadas vía socket |

---

## 15. Apéndices

### Archivos

```
SERVER: routes.js (120), controller.js (180), service.js (250), dao.js (350),
        utils/extractMentionIds.js, utils/computeColorFromCode.js
CLIENT: api/notesAPI.js (80), pages/, 5 components, utils/schema.js (50)
```

### Socket Bus Events

```js
io.emit('MENTION_CREATED', { noteId, mentionedUserId, mentionedByUserId, noteTitle })
```
