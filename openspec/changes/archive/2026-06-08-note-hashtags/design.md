# Design: Note Hashtags

## Context

Notes need flexible categorization beyond column status + text search. Trello-style hashtag system.

## Database Schema

### hashtags
| Column | Type | Constraints |
|--------|------|-------------|
| id | Int | PK, autoincrement |
| name | String | @unique, @db.VarChar(50), required |
| createdOn | DateTime | @default(now()) @db.Timestamp(3) |
| updatedOn | DateTime? | @db.Timestamp(3) |

### note_hashtags (join table)
| Column | Type | Constraints |
|--------|------|-------------|
| noteId | Int | FK -> notes.id |
| hashtagId | Int | FK -> hashtags.id, onDelete: Cascade |
| createdOn | DateTime | @default(now()) @db.Timestamp(3) |

@@unique([noteId, hashtagId])

### Relations
- notes -> note_hashtags (1:N)
- hashtags -> note_hashtags (1:N)

## API Endpoints

### Hashtag Endpoints (within notes module)
| Method | Path | Description |
|--------|------|-------------|
| GET | /api/v1/notes/hashtags | List all hashtags |
| POST | /api/v1/notes/hashtags | Create hashtag |
| PUT | /api/v1/notes/hashtags/:id | Rename hashtag |
| DELETE | /api/v1/notes/hashtags/:id | Delete hashtag |

### Note Endpoints (existing)
| Method | Path | Changes |
|--------|------|---------|
| GET | /api/v1/notes | Add optional ?hashtagIds[] param. Filter notes matching ANY of the provided hashtag IDs |
| POST | /api/v1/notes | Accept optional hashtagIds: number[] in body. Create note_hashtags rows |
| PUT | /api/v1/notes/:id | Accept optional hashtagIds: number[] in body. Replace all note_hashtags |

## Backend Architecture

### Modified Files
- routes.js
- controller.js
- service.js
- dao.js
- schemas/notes.joi.js

All hashtag logic is integrated into the existing notes module files. No separate hashtag files are created.

## Sync Pattern
WHEN note created/updated WITH hashtagIds[]:
1. DELETE FROM note_hashtags WHERE noteId = ?
2. INSERT INTO note_hashtags (noteId, hashtagId, createdOn) VALUES ...
Full replacement. Matches existing mentions pattern.

## Error Handling
| Scenario | HTTP Status | Message |
|----------|-------------|---------|
| Duplicate hashtag name | 409 | "Hashtag X already exists" |
| Invalid hashtagId in body | 400 | Validation error |
| Hashtag not found (PUT/DELETE) | 404 | "Hashtag not found" |
| Empty hashtagIds array | 200 | All tags cleared (sync to empty) |

## Frontend Architecture

### RTK Query (notesAPI.js)
- Add getAllHashtags query (GET /notes/hashtags) with tagType 'Hashtags'
- Add createHashtag mutation (POST /notes/hashtags) invalidates ['Hashtags']
- Add updateHashtag mutation (PUT /notes/hashtags/:id) invalidates ['Hashtags']
- Add deleteHashtag mutation (DELETE /notes/hashtags/:id) invalidates ['Hashtags']
- Modify getAllNotes - add hashtagIds[] to query params
- Modify createNote mutation - accept hashtagIds in body
- Modify updateNoteById mutation - accept hashtagIds in body
- Add useGetHashtagItems custom hook for fetching hashtag items with selection state

### Component Integration
- NotesFilters.jsx: Add Hashtags button with Popover + NotesHashtagSelector (exports HashtagsSelector)
- NotesCreateDialog.jsx: Add hashtag chip area below content editor
- NotesEditDialog.jsx: Add hashtag chip area below content editor
- NotesHashtagSelector: fetches all hashtags, shows checkboxes, selection stored as number[], includes delete button (Trash2, hover-visible)
- NotesHashtagCreator: form with name input, supports edit mode (pre-fills name on pencil icon click), calls createHashtag/ updateHashtag mutations
- Editing state: NotesFilters maintains editingHashtag state for edit mode

## Validations

### Backend (Joi)
- CreateHashtagSchema: name Joi.string().max(50).required().trim()
- UpdateHashtagSchema: name Joi.string().max(50).required().trim()
- NotesFilters hashtagId: Joi.alternatives().try(Joi.number().integer(), Joi.array().items(Joi.number().integer())).optional()
- NoteCreate hashtagIds: Joi.array().items(Joi.number().integer()).max(20).optional()
- NoteUpdate hashtagIds: Joi.array().items(Joi.number().integer()).max(20).optional()

### Frontend (Zod)
- NotesCreateDialogSchema: hashtagIds z.array(z.number()).optional()
- notesEditDialogSchema: hashtagIds z.array(z.number()).optional()

## Seed Data
Add to seed.js:
```javascript
const hashtags = [{ name: 'General', createdOn: new Date() }];
await createVarious('hashtags', hashtags);
```

## Migration
Additive only. Run: npx prisma migrate dev --name add_note_hashtags

## Locale Keys
Added 10 hashtags_* keys + hashtags_save in both en.json and es.json:
- hashtags_title: "Hashtags"
- hashtags_placeholder: "Create a hashtag..."
- hashtags_create: "Create"
- hashtags_editing: "Editing hashtag"
- hashtags_cancel: "Cancel"
- hashtags_save: "Save"
- hashtags_delete: "Delete"
- hashtags_confirm_delete: "Are you sure you want to delete this hashtag?"
- hashtags_delete_confirm: "Yes, delete"
- hashtags_delete_cancel: "No, keep it"
- hashtags_filter_label: "Filter by hashtag"

## Performance
- hashtags.name unique index
- note_hashtags composite index via @@unique
- JOIN on indexed columns
