## ADDED Requirements

### Requirement: System supports global hashtags for notes
The system SHALL allow users to create, list, update, delete, and associate hashtags with notes.

#### Scenario: Create a new hashtag
- WHEN user sends POST /notes/hashtags with name "Ventas"
- THEN system creates hashtag with unique id and returns 201 with hashtag object

#### Scenario: Create hashtag with duplicate name
- WHEN user sends POST /notes/hashtags with name that already exists
- THEN system returns 409 "Hashtag already exists"

#### Scenario: List all hashtags
- WHEN user sends GET /notes/hashtags
- THEN system returns 200 with array of all hashtags sorted by name

#### Scenario: Rename a hashtag
- WHEN user sends PUT /notes/hashtags/1 with name "Marketing"
- THEN system updates the hashtag name and returns 200

#### Scenario: Delete a hashtag
- WHEN user sends DELETE /notes/hashtags/1
- THEN system deletes the hashtag and returns 200

#### Scenario: Delete a hashtag with associated notes (cascade)
- WHEN user sends DELETE /notes/hashtags/1 where hashtag 1 is associated with notes
- THEN system deletes the hashtag, removes all note_hashtags associations for that hashtag, and returns 200

#### Scenario: Filter notes by hashtag
- WHEN user sends GET /notes?hashtagIds[]=1
- THEN system returns notes that have hashtag id 1

#### Scenario: Filter notes by multiple hashtags
- WHEN user sends GET /notes?hashtagIds[]=1&hashtagIds[]=2
- THEN system returns notes matching ANY of hashtags 1 or 2

#### Scenario: Create note with hashtags
- WHEN user sends POST /notes with { hashtagIds: [1, 2] }
- THEN system creates note_hashtags rows for each hashtagId

#### Scenario: Update note hashtags
- WHEN user sends PUT /notes/1 with { hashtagIds: [2, 3] }
- THEN system replaces all note_hashtags for note 1

#### Scenario: Clear all hashtags from note
- WHEN user sends PUT /notes/1 with { hashtagIds: [] }
- THEN system removes all note_hashtags for note 1

#### Scenario: Edit hashtag name via UI
- WHEN user clicks pencil icon on hashtag in selector, edits name, and clicks save
- THEN system shows editing state, pre-fills current name, updates hashtag on save

#### Scenario: Backward compatible GET
- WHEN user sends GET /notes without hashtagIds
- THEN system returns all notes as before
