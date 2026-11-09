# Spec: pbt-candidate-locations

## ADDED Requirements

### Requirement: Catalog of PBT candidate locations

The repository SHALL maintain a catalog of property-based testing candidates organized by layer and priority.

#### Scenario: Utils candidates identified

- **WHEN** the catalog is reviewed
- **THEN** high-priority utils (getSafePagination, sanitizePrismaMessage, pickDirty, cn, generateRandomBarcode, currencyFormat) are listed with their invariants

#### Scenario: Parser candidates identified

- **WHEN** the catalog is reviewed
- **THEN** parser candidates (parseMentions, extractMentionIds, getUserFromToken) are listed with round-trip/position invariants

#### Scenario: Schema candidates identified

- **WHEN** the catalog is reviewed
- **THEN** all Joi and Zod schemas are listed with valid-accepts and invalid-rejects patterns

#### Scenario: Service and store candidates identified

- **WHEN** the catalog is reviewed
- **THEN** state machines, time helpers, settings patch-display, and reducers are listed with their invariants
