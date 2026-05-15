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
- Improves data integrity by enforcing UI-level validation