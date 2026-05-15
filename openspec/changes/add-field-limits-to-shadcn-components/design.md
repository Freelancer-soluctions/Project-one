## Context

### Current Situation

The client application (apps/client) uses shadcn UI components (Input, Textarea, Select, etc.) throughout all forms. These components are rendered from the apps/client/src/components/ui/ directory. Currently, most of these components do not have maxLength, max, or min attributes set, which means users can enter more characters than the database allows.

### Field Limits from Prisma Schema

The field limits are defined in apps/server/prisma/schema.prisa:

| Model | Field | Limit |
|-------|-------|-------|
| users | name | 100 |
| users | email | 254 |
| users | password | 100 |
| users | address | 250 |
| users | city | 35 |
| users | document | 128 |
| users | socialSecurity | 128 |
| users | state | 50 |
| users | telephone | 15 |
| users | zipcode | 9 |
| notes | title | 50 |
| notes | content | 2000 |
| notes | color | 6 |
| noteColumns | title | 15 |
| noteColumns | code | 3 |
| news | description | 400 |
| events | title | 50 |
| events | description | 200 |
| events | speaker | 20 |
| events | startTime | 5 |
| events | endTime | 5 |
| products | sku | 16 |
| products | name | 80 |
| products | description | 2000 |
| products | barCode | 25 |
| productCategories | code | 3 |
| productCategories | description | 50 |
| productProviders | code | 3 |
| productProviders | name | 100 |
| productProviders | contactName | 60 |
| productProviders | contactEmail | 80 |
| productProviders | contactPhone | 15 |
| productProviders | address | 120 |
| productAttributes | name | 50 |
| productAttributes | description | 100 |
| warehouse | name | 50 |
| warehouse | description | 120 |
| warehouse | address | 120 |
| stock | lot | 50 |
| inventoryMovement | reason | 200 |
| clients | name | 100 |
| clients | email | 100 |
| clients | phone | 15 |
| clients | address | 120 |
| employees | name | 100 |
| employees | lastName | 100 |
| employees | dni | 128 |
| employees | phone | 15 |
| employees | email | 100 |
| employees | address | 120 |
| employees | position | 100 |
| employees | department | 100 |
| employees | salary | 128 |
| payroll | baseSalary | 128 |
| payroll | extraHours | 128 |
| payroll | deductions | 128 |
| payroll | totalPayment | 128 |
| performanceEvaluation | comments | 200 |
| permission | type | 100 |

## Goals / Non-Goals

**Goals:**
- Create a centralized field limits configuration file
- Add maxLength attributes to all Input and Textarea components
- Add max/min attributes to numeric fields
- Ensure UI validation matches database constraints

**Non-Goals:**
- Modify the backend validation (already exists in Joi schemas)
- Change the shadcn UI component library source code
- Add runtime validation (only static maxLength attributes)

## Decisions

### 1. Configuration Approach
**Decision:** Create a static configuration file with all field limits.

**Rationale:**
- Field limits are fixed in the database schema
- No need for dynamic configuration
- Simple and maintainable

### 2. Component Update Strategy
**Decision:** Update each form component individually with inline maxLength values.

**Rationale:**
- Allows per-field customization
- More explicit and readable
- Easier to track changes per module

### 3. Implementation Location
**Decision:** Create fieldLimits.js in apps/client/src/config/

**Rationale:**
- Central location for configuration
- Easy to import in any component
- Follows existing config patterns in the project

## Risks / Trade-offs

### Risk 1: Missing Fields
**Risk:** Some fields might be missed during implementation.

**Mitigation:**
- Systematic review of each module
- Test each form after changes

### Risk 2: Inconsistency
**Risk:** Some forms might be updated while others are forgotten.

**Mitigation:**
- Create a checklist based on tasks
- Use grep to find all Input/Textarea usages

### Trade-off: Configuration vs Inline
**Decision:** Inline limits (trade-off)

**Pros:**
- Explicit
- Self-documenting
- No extra import needed

**Cons:**
- Repeated values
- Harder to change globally