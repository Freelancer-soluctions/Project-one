## Context

The project currently has a monolithic Joi validation schemas file at `apps/server/src/utils/joiSchemas/joi.js` containing ~577 lines with schemas for all 20+ modules. The codebase follows a modular architecture where each module (auth, users, notes, etc.) has its own directory under `apps/server/src/modules/` with controllers, services, and routes. However, validation schemas are centralized in a single utility file, which:
- Makes maintenance difficult as all schema changes affect one file
- Increases likelihood of merge conflicts in team environments
- Doesn't align with the modular organization pattern used elsewhere
- Makes it harder to locate schemas when working within a specific module

## Goals / Non-Goals

**Goals:**
- Reorganize Joi schemas from monolithic file to per-module schema files
- Create `schemas/` directory in each module that has Joi schemas
- Update all import statements in `routes.js` files to point to new locations
- Maintain all existing schema validation logic without changes
- Align schema file location with module structure for better developer experience

**Non-Goals:**
- No changes to schema validation logic or rules
- No addition of new validation schemas
- No removal of existing validation functionality
- No changes to modules without schemas (clientOrder, providerOrder, security)

## Decisions

### Decision 1: File Naming Convention
**Choice**: Use `<module>.joi.js` pattern (e.g., `auth.joi.js`, `users.joi.js`)
**Rationale**: The `.joi.js` suffix clearly identifies these as Joi schema files and avoids naming conflicts with other potential files in the schemas directory.
**Alternatives considered**:
- `schema.js` - Too generic, could conflict with other schema types (e.g., database schemas)
- `validation.js` - Less specific to Joi, could be confused with general validation logic
- `joiSchema.js` - Redundant "Schema" in name since it's in a schemas/ directory

### Decision 2: Directory Structure
**Choice**: Create `schemas/` directory inside each module: `modules/<module>/schemas/<module>.joi.js`
**Rationale**: Keeps schemas co-located with the module they belong to, following the principle of high cohesion. Routes can import using relative paths (`./schemas/auth.joi.js`).
**Alternatives considered**:
- Central `schemas/` directory at `modules/schemas/` - Would still be somewhat centralized
- Keep in utils but split files - Doesn't align with modular architecture

### Decision 3: Import Path Updates
**Choice**: Update all `routes.js` files to use direct relative imports to `./schemas/<module>.joi.js`
**Rationale**: Simplicity and clarity. Each route file imports only the schemas it needs from its own module's schemas directory.
**Example**: `const { loginSchema } = require('../../utils/joiSchemas/joi.js')` becomes `const { loginSchema } = require('./schemas/auth.joi.js')`

### Decision 4: Modules to Process
**Choice**: Process 18 modules that have schemas: auth, users, notes, news, events, settings, products, providers, warehouse, stock, inventoryMovement, sales, clients, purchases, employees, attendance, payroll, vacation, permission, expenses, performanceEvaluation
**Rationale**: Based on user-provided list of modules that need schemas. Modules without schemas (clientOrder, providerOrder, security) require no action.

## Risks / Trade-offs

**[Risk] Broken imports after refactoring**
→ **Mitigation**: Run lint and tests after changes to verify all imports are correct. Use search to verify no remaining references to old `joi.js` path.

**[Risk] Missing schemas during file split**
→ **Mitigation**: Carefully copy each schema definition to its corresponding module file. Do NOT modify schema logic. Verify all exports match what routes expect.

**[Risk] Merge conflicts during transition**
→ **Mitigation**: This is a one-time refactoring. Complete all changes in a single commit/PR to minimize conflict window.

**[Trade-off] Many small files vs one large file**
→ **Benefit**: Easier maintenance, clearer ownership, fewer merge conflicts
→ **Cost**: More files to manage, but offset by better organization
