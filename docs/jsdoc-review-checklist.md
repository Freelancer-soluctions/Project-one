# JSDoc Code Review Checklist

Use this dedicated checklist when reviewing JSDoc documentation in pull requests. This checklist focuses exclusively on JSDoc standards.

## Controller Functions

- [ ] All controller functions have `@param {Object} req` with specific properties
  - [ ] `req.body` properties documented (when applicable)
  - [ ] `req.params` properties documented (when applicable)
  - [ ] `req.safeQuery` properties documented (when applicable)
  - [ ] `req.userId` documented for authenticated endpoints
  - [ ] `req.cookies` documented when used
- [ ] All controller functions have `@param {Object} res`
- [ ] All controller functions use `@returns {Promise<void>}`
- [ ] All controller functions with throw statements have `@throws` tags
  - [ ] Error type specified (e.g., `@throws {ClientError}`)
  - [ ] Reason for throw documented
  - [ ] Status code indicated when applicable

## Service Functions

- [ ] All service functions document `data` or `params` object properties
  - [ ] Each property has type annotation
  - [ ] Each property has clear description
- [ ] All service functions use Promise return types
  - [ ] `@returns {Promise<Object>}` or appropriate Promise type
  - [ ] Second `@returns` with object structure for complex returns (recommended)
- [ ] All service functions with throw statements have `@throws` tags
  - [ ] `@throws {Error}` for validation errors
  - [ ] `@throws {ClientError}` for business logic errors

## DAO Functions

- [ ] All DAO functions document `where` parameter with specific properties
- [ ] All DAO functions document `take` and `skip` for paginated queries
- [ ] All DAO functions use appropriate return types
  - [ ] `@returns {Promise<Object>}` for single items
  - [ ] `@returns {Promise<Array<Object>>}` for lists
  - [ ] `@returns {Promise<Object|null>}` when result may be null

## JSDoc Tag Validation

- [ ] No `@function` tags used (function name is self-documenting)
- [ ] No `@async` tags used (async is evident from function signature)
- [ ] No `@description` tags used (first line of JSDoc is the description)
- [ ] `@param` tags have proper format: `@param {type} name - description`
- [ ] `@returns` tags have proper format: `@returns {type} description`
- [ ] `@throws` tags have proper format: `@throws {ErrorType} Reason (status code)`
- [ ] Optional parameters use square brackets `[paramName]`

## File Exclusions

- [ ] No `routes.js` files modified for JSDoc (use Swagger/OpenAPI instead)
- [ ] No JSDoc added to route definition files

## Examples and Complex Functions

- [ ] Complex functions have `@example` tags (recommended, not required)
- [ ] Examples are clear and demonstrate actual usage
- [ ] Examples include both input and expected output

## Consistency

- [ ] Documentation follows patterns from `docs/jsdoc-reference-guide.md`
- [ ] Similar functions have consistent documentation structure
- [ ] Type annotations are consistent across modules
- [ ] All 24 modules follow the same standard

## Quick Validation Checklist

- [ ] All controller functions have `@param {Object} req` with specific properties
- [ ] All controller functions have `@param {Object} res`
- [ ] All controller functions use `@returns {Promise<void>}`
- [ ] All service functions document data object properties
- [ ] All service functions use Promise return types
- [ ] All functions with throw statements have `@throws` tags
- [ ] No `@function`, `@async`, or `@description` tags used
- [ ] No `routes.js` files modified
- [ ] Optional parameters use square brackets `[param]`
- [ ] Complex functions have `@example` tags (recommended, not required)

---

## Reference Documents

- **Full JSDoc Reference**: `docs/jsdoc-reference-guide.md`
- **Code Style Guide**: `docs/code-style.md`
- **Migration Notes**: `docs/jsdoc-migration-notes.md`
- **General Code Review Checklist**: `docs/code-review-checklist.md`

---

*Last updated: 2026-05-03*
