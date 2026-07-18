## 1. Database & Schema

- [x] 1.1 Create Prisma model `user_notes_favorites` with fields: noteId (Int), userId (Int), createdOn (DateTime), `@@unique([noteId, userId])`, and `@@index([userId])`
- [x] 1.2 Add cascade delete relation from `notes` model to `user_notes_favorites`
- [x] 1.3 Generate and run Prisma migration

## 2. Backend Validation

- [x] 2.1 Add Joi validation schema for `isFavorite` boolean field (used in create/update note body)
- [x] 2.2 Add Joi validation schema for `isFavorite` query parameter on GET /notes
- [x] 2.3 Add Joi validation for `PATCH /notes/:id/fav` — validate path param (noteId as positive int), ignore request body if sent

## 3. Backend DAO Layer

- [x] 3.1 Add `createFavorite(userId, noteId)` method to DAO
- [x] 3.2 Add `deleteFavorite(userId, noteId)` method to DAO
- [x] 3.3 Add `isFavorited(userId, noteId)` method to DAO (EXISTS check)
- [x] 3.4 Modify `getAllNotes` DAO to accept `isFavorite` filter and add EXISTS subquery when true
- [x] 3.5 Modify `createNote` DAO to handle optional `isFavorite` parameter (insert into favorites table)
- [x] 3.6 Modify `updateNote` DAO to handle optional `isFavorite` parameter (insert or delete from favorites table)
- [x] 3.7 Modify `getAllNotes` DAO to include `isFavorited` boolean per note via batch lookup (single SELECT from user_notes_favorites for current user, then map)

## 4. Backend Service Layer

- [x] 4.1 Add `toggleFavorite(userId, noteId)` service method — check current state, insert or delete, return new state. Handle Prisma P2002 unique constraint violation (already favorited → treat as success) and delete on non-existent row (already unfavorited → treat as success)
- [x] 4.2 Pass `isFavorite` filter from controller through service to DAO
- [x] 4.3 Pass `isFavorite` create/update flag from controller through service to DAO

## 5. Backend Controller & Routes

- [x] 5.1 Add `PATCH /notes/:id/fav` route and controller handler — calls service.toggleFavorite
- [x] 5.2 Modify `GET /notes` controller to extract and pass `isFavorite` query param through service
- [x] 5.3 Modify `POST /notes` controller to extract and pass optional `isFavorite` body field
- [x] 5.4 Modify `PATCH /notes/:id` controller to extract and pass optional `isFavorite` body field
- [x] 5.5 Register new route in router configuration

## 6. Frontend i18n

- [x] 6.1 Add i18n keys: `favorite`, `favorites`, `mark_as_favorite`, `remove_from_favorites`, `show_favorites_only`
- [x] 6.2 Add Spanish/other locale translations for new keys

## 7. Frontend FavoriteToggle Component

- [x] 7.1 Extend existing `FavoriteToggle` component at `apps/client/src/components/favoriteToggle/favoriteToggle.jsx` with PropTypes, i18n labels, loading state, and error handling
- [x] 7.2 Implement loading spinner state during toggle request
- [x] 7.3 Implement error handling with toast notification and state rollback
- [ ] 7.4 Write unit tests for FavoriteToggle component

## 8. Frontend RTK Query Integration

- [x] 8.1 Add `isFavorite` parameter to `getAllNotes` query in notes API slice
- [x] 8.2 Add `toggleFavorite` mutation in notes API slice — calls PATCH /notes/:id/fav
- [x] 8.3 Configure cache invalidation on notes tag after toggleFavorite
- [x] 8.4 Read `isFavorited` field from GET /notes response per note to set initial toggle state

## 9. Frontend Component Integration

- [x] 9.1 Integrate FavoriteToggle into NotesCard header alongside edit/delete actions
- [x] 9.2 Add "Show favorites only" toggle to NotesFilters component
- [x] 9.3 Wire NotesFilters favorite toggle to trigger GET /notes?isFavorite=true
- [x] 9.4 Add optional isFavorite checkbox/switch to NotesCreateDialog
- [x] 9.5 Wire NotesCreateDialog isFavorite to POST /notes body
- [x] 9.6 Add isFavorite switch showing current state to NotesEditDialog
- [x] 9.7 Wire NotesEditDialog isFavorite change to PATCH /notes/:id body
- [ ] 9.8 Write integration tests for favorite UI interactions
- [x] 9.9 Show empty state message 'no_notes' when isFavorite filter has no results

## 10. Test Updates

- [ ] 10.1 Update backend unit tests for modified service and controller methods
- [ ] 10.2 Add backend integration tests for PATCH /notes/:id/fav endpoint
- [ ] 10.3 Add backend integration tests for GET /notes?isFavorite=true
- [ ] 10.4 Add backend integration tests for POST/PATCH /notes with isFavorite field
- [ ] 10.5 Update affected frontend component tests
- [ ] 10.6 Add E2E tests for favorite toggle and filter flow
