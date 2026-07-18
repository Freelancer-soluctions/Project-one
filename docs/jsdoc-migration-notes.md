# JSDoc Documentation Migration Notes

## Summary of the Change

JSDoc documentation has been standardized across all controller, service, and dao modules in the server application. This initiative ensures consistent, maintainable, and well-documented code throughout the `apps/server/src/modules/` directory.

## What Changed

### Before (Old Pattern)
```javascript
/**
 * Creates a new user
 */
async function createUser(req, res) {
  // Implementation...
}
```

### After (New Standard)
```javascript
/**
 * Creates a new user account.
 *
 * @param {Object} req - The HTTP request object
 * @param {Object} req.body - The request body containing user data
 * @param {string} req.body.email - User email address (must be unique)
 * @param {string} req.body.password - User password (will be hashed)
 * @param {string} req.body.firstName - User's first name
 * @param {string} req.body.lastName - User's last name
 * @param {number} req.body.roleId - ID of the assigned role
 * @param {Object} res - The HTTP response object
 * @returns {Promise<void>} Sends JSON response with created user or error
 * @throws {ClientError} When email is already registered (400)
 * @throws {ClientError} When validation fails (400)
 */
async function createUser(req, res) {
  // Implementation...
}
```

## Key Patterns to Follow

1. **Controller Functions**
   - Document `req` and `res` objects with specific properties
   - Break down `req.body`, `req.params`, `req.safeQuery` with specific properties
   - Use `@returns {Promise<void>}` (controllers send responses, not return data)
   - Document all `@throws` with error type and status code

2. **Service Functions**
   - Document `data` or `params` object with all properties
   - Use brackets `[paramName]` for optional parameters
   - Specify exact return type: `@returns {Promise<Object>}`, `@returns {Promise<Array>}`, etc.
   - Include a second `@returns` with the object structure for complex returns

3. **DAO Functions**
   - Use `where` parameter for filter conditions with specific properties
   - Always document `take` and `skip` for paginated queries
   - Return types: `Promise<Object>`, `Promise<Array>`, `Promise<Object|null>`

4. **What NOT to Do**
   - Do NOT use `@function`, `@async`, or `@description` tags
   - Do NOT add JSDoc to `routes.js` files (use Swagger/OpenAPI instead)

**Reference Guide**: For complete patterns and examples, see `docs/jsdoc-reference-guide.md`

## Modules Affected

All **24 modules** in `apps/server/src/modules/` have been updated:

| # | Module Name | Controller | Service | DAO |
|---|-------------|------------|---------|-----|
| 1 | `attendance` | ✅ | ✅ | ✅ |
| 2 | `auth` | ✅ | ✅ | ✅ |
| 3 | `clientOrder` | ✅ | ✅ | ✅ |
| 4 | `clients` | ✅ | ✅ | ✅ |
| 5 | `employees` | ✅ | ✅ | ✅ |
| 6 | `events` | ✅ | ✅ | ✅ |
| 7 | `expenses` | ✅ | ✅ | ✅ |
| 8 | `inventoryMovement` | ✅ | ✅ | ✅ |
| 9 | `news` | ✅ | ✅ | ✅ |
| 10 | `notes` | ✅ | ✅ | ✅ |
| 11 | `payroll` | ✅ | ✅ | ✅ |
| 12 | `performanceEvaluation` | ✅ | ✅ | ✅ |
| 13 | `permission` | ✅ | ✅ | ✅ |
| 14 | `products` | ✅ | ✅ | ✅ |
| 15 | `providerOrder` | ✅ | ✅ | ✅ |
| 16 | `providers` | ✅ | ✅ | ✅ |
| 17 | `purchase` | ✅ | ✅ | ✅ |
| 18 | `sales` | ✅ | ✅ | ✅ |
| 19 | `security` | N/A | N/A | N/A |
| 20 | `settings` | ✅ | ✅ | ✅ |
| 21 | `stock` | ✅ | ✅ | ✅ |
| 22 | `users` | ✅ | ✅ | ✅ |
| 23 | `vacation` | ✅ | ✅ | ✅ |
| 24 | `warehouse` | ✅ | ✅ | ✅ |

**Note**: The `security` module only has `routes.js` (no controller, service, or dao files), so it was excluded from JSDoc documentation.

## Files Excluded

- **`routes.js` files**: These files use **Swagger/OpenAPI** documentation instead of JSDoc
- Reason: Route files define API endpoints and should use OpenAPI/Swagger annotations for API specification generation

## How to Maintain the Standard Going Forward

### For New Functions
1. Reference `docs/jsdoc-reference-guide.md` for the correct pattern
2. Copy the pattern from similar existing functions in the module
3. Ensure all parameters are documented with types and descriptions
4. Add `@throws` tags for any errors the function may throw
5. Use `@example` for complex functions (recommended but not required)

### For Code Reviews
1. Use the checklist in `docs/code-review-checklist.md`
2. Verify all new controller, service, and dao functions have proper JSDoc
3. Check that `@throws` is used for functions that throw errors
4. Ensure no JSDoc is added to `routes.js` files

### Enforcement
- Pull requests missing proper JSDoc will be flagged during code review
- Linting will help maintain formatting consistency
- The reference guide should be updated when new patterns emerge

## Timeline

- **Started**: Module-by-module documentation (prioritized by criticality)
- **Completed**: All 24 modules documented (72 files total: 24 controllers, 24 services, 24 DAOs)
- **Validated**: All documentation reviewed for consistency with reference patterns

## Questions?

For questions about the JSDoc standards, refer to:
- Full reference guide: `docs/jsdoc-reference-guide.md`
- Code style guide: `docs/code-style.md`
- Code review checklist: `docs/code-review-checklist.md`

---

*Migration completed: 2026-05-03*
