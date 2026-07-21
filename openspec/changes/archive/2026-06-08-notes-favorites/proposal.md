## Why

Users need the ability to bookmark/favorite notes for quick access. The current system provides no personal curation or prioritization mechanism—users cannot mark important notes for easy retrieval. This is a fundamental UX gap that impacts daily workflow efficiency.

## What Changes

1. New Prisma model `user_notes_favorites` with fields `noteId`, `userId`, `createdOn` and a unique constraint on `[noteId, userId]` pair
2. New Joi validation schemas for `isFavorite` filter and toggle operations
3. Backend controller/service/DAO layer to handle `isFavorite` in create, update, and toggle operations
4. `GET /notes` accepts optional `isFavorite` (boolean) query parameter — when true, returns only the current user's favorited notes
5. `PATCH /notes/:id/fav` — lightweight toggle endpoint to add/remove a favorite
6. `POST /notes` and `PATCH /notes/:id` accept optional `isFavorite` field to set favorite status on create/update
7. Frontend: `FavoriteToggle` component (shadcn, PropTypes, i18n support)
8. `NotesFilters` component: favorite filter toggle to show only favorites
9. `NotesCard` component: star icon for quick favorite toggle
10. `NotesCreateDialog` and `NotesEditDialog`: optional `isFavorite` field in forms

## Capabilities

### New Capabilities
- `notes-favorites-create`: Backend service and DAO to mark a note as favorite during note creation
- `notes-favorites-toggle`: Lightweight toggle endpoint (`PATCH /notes/:id/fav`) to add/remove favorites
- `notes-favorites-filter`: Backend `GET /notes` filter support for `isFavorite` boolean parameter scoped to the current user
- `notes-favorites-ui`: Frontend components for favorite toggling and filtering (FavoriteToggle component, NotesFilters favorite toggle, NotesCard star icon, dialog integration)

### Modified Capabilities
<!-- No existing specs have requirement-level changes — all changes are additive (new model, new endpoints, new UI components). -->

## Impact

- **Database**: New `user_notes_favorites` table with foreign keys to `notes` and `users`
- **Backend API**: New route `PATCH /notes/:id/fav`; modified `GET /notes`, `POST /notes`, `PATCH /notes/:id`
- **Validation**: New Joi schemas for favorite operations
- **Frontend**: New `FavoriteToggle` component; modified `NotesFilters`, `NotesCard`, `NotesCreateDialog`, `NotesEditDialog`
- **i18n**: New translation keys for favorite-related labels and tooltips
- **Authorization**: All favorite operations scoped to the authenticated user
