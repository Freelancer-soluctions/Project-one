## 1. Database Schema

- [x] 1.1 Add `hashtags` model to Prisma schema (id, name unique, createdOn, updatedOn)
- [x] 1.2 Add `note_hashtags` join model (noteId FK, hashtagId FK with onDelete: Cascade, createdOn, @@unique)
- [x] 1.3 Run `npx prisma migrate dev --name add_note_hashtags`
- [x] 1.4 Add seed data for "General" hashtag in seed.js

## 2. Backend - Hashtag CRUD (integrated into notes module)

- [x] 2.1 Add hashtag functions to dao.js (createHashtag, getAllHashtags, findByName, updateHashtag, deleteHashtag, getNoteHashtags, syncNoteHashtags)
- [x] 2.2 Add hashtag routes to routes.js (GET /notes/hashtags, POST /notes/hashtags, PUT /notes/hashtags/:id, DELETE /notes/hashtags/:id)
- [x] 2.3 Add Joi validation schemas to schemas/notes.joi.js (CreateHashtagSchema, UpdateHashtagSchema)
- [x] 2.4 Add service functions to service.js (createHashtag, getAllHashtags, updateHashtag, deleteHashtag, syncNoteHashtags)
- [x] 2.5 Add controller handlers to controller.js for hashtag endpoints

## 3. Backend - Note-Hashtag Association

- [x] 3.1 Modify notes DAO: getAllNotes LEFT JOIN note_hashtags, add hashtagIds[] filter
- [x] 3.2 Modify notes DAO: createNote handles hashtagIds via createMany
- [x] 3.3 Modify notes DAO: updateNoteById syncs note_hashtags (delete all + re-insert)
- [x] 3.4 Modify notes service: add syncNoteHashtags function
- [x] 3.5 Modify notes controller: pass hashtagIds through create/update
- [x] 3.6 Extend NotesFilters Joi schema with hashtagIds[] param

## 4. Frontend - RTK Query

- [x] 4.1 Add getAllHashtags query to notesAPI.js (tagType: 'Hashtags')
- [x] 4.2 Add createHashtag, updateHashtag, deleteHashtag mutations
- [x] 4.3 Modify getAllNotes query to accept hashtagIds[] params
- [x] 4.4 Modify createNote and updateNoteById to accept hashtagIds in body
- [x] 4.5 Add Zod hashtagIds field to NotesCreateDialogSchema and notesEditDialogSchema
- [x] 4.6 Add useGetHashtagItems custom hook for fetching hashtag items with selection state

## 5. Frontend - Components

- [x] 5.1 Wire NotesHashtagSelector in NotesFilters (popover with checkbox list, delete button with Trash2 icon, hover-visible)
- [x] 5.2 Wire NotesHashtagCreator for creating/editing hashtags (form with name input, edit mode via pencil icon, pre-fills name)
- [x] 5.3 Add hashtag chips display in NotesCreateDialog
- [x] 5.4 Add hashtag chips display in NotesEditDialog
- [x] 5.5 Create useGetHashtagItems custom hook
- [x] 5.6 Add locale translation keys (10 hashtags_* + hashtags_save) in en.json and es.json
- [x] 5.7 Wire edit mode for NotesHashtagCreator (pencil icon, editingHashtag state in NotesFilters)
- [x] 5.8 Wire delete button in NotesHashtagSelector (Trash2 icon, hover-visible, cascade removes note_hashtags)
- [x] 5.9 Wire multi-hashtag filter (hashtagIds[] array, backend uses in filter)

## 6. Testing

- [ ] 6.1 Backend unit tests: hashtag service (create, list, update, delete, duplicate)
- [ ] 6.2 Backend integration tests: hashtag endpoints CRUD
- [ ] 6.3 Backend unit tests: note service with hashtagIds sync
- [ ] 6.4 Backend integration tests: note creation/update with hashtagIds
- [ ] 6.5 Frontend unit tests: NotesHashtagSelector renders hashtags, selection works
- [ ] 6.6 Frontend integration tests: hashtag filter flow (select tags, fetch notes)
