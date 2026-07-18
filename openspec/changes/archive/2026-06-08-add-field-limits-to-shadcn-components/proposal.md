## Why

The client application (apps/client) uses shadcn UI components (Input, Textarea, etc.) in forms throughout the entire application. However, many of these components are missing validation attributes like maxLength, max, min, which can lead to future bugs where users can enter more characters than what the database allows.

The field limits are defined in apps/server/prisma/schema.prisma for each model, but these limits are not being enforced at the UI level.

## What Changes

- Analyze all String and numeric fields in the Prisma schema to extract their limits
- Create a centralized configuration file with all field limits
- Update all shadcn UI components used in forms to include appropriate maxLength/max/min attributes
- Ensure consistency between frontend validation and backend database constraints

## Capabilities

### New Capabilities
- `field-limits-config`: Centralized field limits configuration based on Prisma schema

### Modified Capabilities

## Impact

- Affects apps/client/src/ - all forms using shadcn UI components
- Changes to multiple modules: notes, users, products, events, clients, employees, etc.
- Also affects filter forms (10) across all modules
- Backend Joi schemas aligned to fix validation mismatches with Prisma
- Improves data integrity by enforcing UI-level validation

## Scope Expansion

During implementation, additional work was performed beyond the original proposal:

### Additional field limits added
- `search.searchTerm`: 100 (unified search filter limit)
- `news.title`: 30 (pre-defined for NewsDialog)
- `permission.reason`: 500, `permission.comments`: 1000
- `expenses`: new section with description: 255
- `providerOrder`: new section with notes: 200

### Filter forms migrated
All 10 filter form components across modules were migrated to use FIELD_LIMITS instead of hardcoded maxLength values.

### Backend Joi alignment
Fixed validation mismatches discovered during review:
- Unified searchTerm/searchQuery to max(100)
- productAttributes.description: 50→100
- employee dni: 10→128

### Centralization cleanup
- Removed local NOTES_FIELD_LIMITS constant in favor of central FIELD_LIMITS