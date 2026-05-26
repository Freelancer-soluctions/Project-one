## Why

Notes lack categorization beyond column status and text search. A robust tagging system will enable users to organize, filter, and discover notes more effectively, improving productivity and data discoverability.

## What Changes

- Add new `hashtags` and `note_hashtags` tables to the database.
- Implement CRUD endpoints for hashtags and a filter endpoint for notes by hashtag.
- Introduce dedicated UI components: NotesHashtagSelector and NotesHashtagCreator (separate from Tiptap editor).
- Apply Joi and Zod validations for request payloads.
- Seed initial hashtag data.
- Add unit and integration tests covering CRUD and filtering.

## Capabilities

### New Capabilities
- `note-hashtags`: Provides a Trello‑style hashtag system for notes.

### Modified Capabilities
- None.

## Impact

- Database schema changes (new tables, foreign keys).
- API surface changes (new routes, request/response models).
- Validation layer updates (Joi/Zod schemas).
- Test suite expansion.

