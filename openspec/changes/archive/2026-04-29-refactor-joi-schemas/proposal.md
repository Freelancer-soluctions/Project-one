## Why

The server currently has a single monolithic Joi validation schemas file (`apps/server/src/utils/joiSchemas/joi.js`) containing ~577 lines with schemas for all 20+ modules. This structure makes maintenance difficult, increases merge conflicts, and doesn't align with the modular architecture where each module has its own controllers, services, and routes.

## What Changes

- Split the monolithic `joi.js` file into separate schema files organized by module
- Create `schemas/` directory in each of the 20 modules that have Joi schemas
- Move schema definitions from `utils/joiSchemas/joi.js` to `modules/<module>/schemas/<module>.joi.js`
- Update all `routes.js` import statements to reference the new schema file locations
- Do not Delete the old `utils/joiSchemas/joi.js`the user needs this for reference
- **NO changes to schema validation logic** - this is a pure structural refactoring

## Capabilities

### New Capabilities
- `modular-joi-schemas`: Reorganize Joi validation schemas from monolithic file to per-module schema files that align with the modular architecture

### Modified Capabilities

<!-- No existing spec-level behavior changes - this is a structural refactoring only -->

## Impact

- **Code Organization**: All 20 modules (auth, users, notes, news, events, settings, products, providers, warehouse, stock, inventoryMovement, sales, clients, purchases, employees, attendance, payroll, vacation, permission, expenses, performanceEvaluation) will gain a `schemas/` directory
- **Import Updates**: All `routes.js` files that import from `../../utils/joiSchemas/joi.js` will need import path updates
- **Developer Experience**: Improved maintainability, easier code reviews, reduced merge conflicts
- **No Breaking Changes**: All schema validation logic remains identical - only file locations change
