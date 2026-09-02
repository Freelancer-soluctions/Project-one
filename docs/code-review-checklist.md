# Code Review Checklist

Use this checklist when reviewing pull requests to ensure code quality and consistency.
Companion guide (the "why" behind each dimension): `docs/learning/ci-cd/21-code-review.md`.

## PR Size and Response Etiquette

- [ ] PR is small enough to review in one 60-90 min session (< 400 LOC; split larger PRs thematically)
- [ ] First review started within 24h of the PR being opened
- [ ] Reading pace stays under ~500 LOC/h (beyond that, defects get missed)
- [ ] Feedback is specific, actionable, and aimed at the code, not the person
- [ ] Findings are tagged by severity: **Blocker** (blocks merge) / **Warning** (should fix) / **Nit** (minor, non-blocking)
- [ ] Nits recovered as "suggested changes" or follow-up, without blocking the merge

## General Code Review

### Functionality

- [ ] Code works as expected and meets requirements
- [ ] Edge cases are handled appropriately
- [ ] Error handling is implemented where needed
- [ ] No hardcoded values (use configuration or constants)

### Code Quality

- [ ] Code is readable and well-structured
- [ ] Functions are focused and have single responsibility
- [ ] No code duplication (DRY principle)
- [ ] Variable and function names are descriptive
- [ ] No commented-out code left in the PR

### Security

- [ ] Input validation is performed
- [ ] No sensitive data (passwords, tokens) logged or exposed
- [ ] Authentication/authorization checks are in place where needed
- [ ] SQL injection prevention (using Prisma properly)
- [ ] XSS prevention (output encoding)

### Testing

- [ ] New code has appropriate unit tests
- [ ] Tests cover happy path and error cases
- [ ] Integration tests added for new API endpoints
- [ ] All tests pass locally and in CI

### Performance

- [ ] No obvious N+1 queries or redundant DB round-trips (Prisma includes/joins used well)
- [ ] No expensive work inside loops/render cycles
- [ ] Pagination applied to list endpoints (`take`/`skip`)
- [ ] No unnecessary large payloads or blocking I/O on the hot path
- [ ] Changes align with `apps/client` Vercel patterns (avoid waterfalls/re-renders) when UI code

### Style and Formatting

- [ ] Code follows project style guide (`docs/code-style.md`)
- [ ] Prettier formatting applied (`npm run format`)
- [ ] No linting errors (`npm run lint`)
- [ ] Consistent indentation and spacing

### Automated vs Human Review (2026)

- [ ] Mechanics are delegated to CI: commit signing, Conventional Commits, PR title, DCO (the 4 checks of the ruleset) + dependency review — the human does NOT re-check these
- [ ] AI tools (Copilot/agents) used as a first "junior reviewer" pass for smells; AI comments do NOT count as an approval
- [ ] Final design/judgment decisions and the actual **approve** come from a person
- [ ] Reviewer focuses human effort on design, intent, security-of-design, and maintainability (non-automatable)

---

## JSDoc Documentation Validation

### Controller Functions

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

### Service Functions

- [ ] All service functions document `data` or `params` object properties
  - [ ] Each property has type annotation
  - [ ] Each property has clear description
  - [ ] Optional properties use square brackets: `[paramName]`
- [ ] All service functions use Promise return types
  - [ ] `@returns {Promise<Object>}` or `@returns {Promise<Array<Object>>}` etc.
  - [ ] Second `@returns` with object structure for complex returns (recommended)
- [ ] All service functions with throw statements have `@throws` tags
  - [ ] `@throws {Error}` for validation errors
  - [ ] `@throws {ClientError}` for business logic errors

### DAO Functions

- [ ] All DAO functions document `where` parameter with specific properties
- [ ] All DAO functions document `take` and `skip` for paginated queries
- [ ] All DAO functions use appropriate return types
  - [ ] `@returns {Promise<Object>}` for single items
  - [ ] `@returns {Promise<Array<Object>>}` for lists
  - [ ] `@returns {Promise<Object|null>}` when result may be null
- [ ] Optional parameters use square brackets: `[options]`

### JSDoc Tag Validation

- [ ] No `@function` tags used (function name is self-documenting)
- [ ] No `@async` tags used (async is evident from function signature)
- [ ] No `@description` tags used (first line of JSDoc is the description)
- [ ] `@param` tags have proper format: `@param {type} name - description`
- [ ] `@returns` tags have proper format: `@returns {type} description`
- [ ] `@throws` tags have proper format: `@throws {ErrorType} Reason (status code)`

### File Exclusions

- [ ] No `routes.js` files modified for JSDoc (use Swagger/OpenAPI instead)
- [ ] No JSDoc added to route definition files

### Examples and Complex Functions

- [ ] Complex functions have `@example` tags (recommended, not required)
- [ ] Examples are clear and demonstrate actual usage
- [ ] Examples include both input and expected output

### Consistency

- [ ] Documentation follows patterns from `docs/jsdoc-reference-guide.md`
- [ ] Similar functions have consistent documentation structure
- [ ] Type annotations are consistent across modules

---

## Reference Documents

- **JSDoc Reference Guide**: `docs/jsdoc-reference-guide.md`
- **Code Style Guide**: `docs/code-style.md`
- **JSDoc Migration Notes**: `docs/jsdoc-migration-notes.md`
- **JSDoc Review Checklist**: `docs/jsdoc-review-checklist.md` (dedicated checklist)

---

## Review Process

1. **First Pass — Context**: read the PR title and body (what, why, how it was tested); check CI checks are green
2. **Second Pass — Dimensions**: verify the 6 dimensions above (functionality, design, security, testing, performance, style) + JSDoc
3. **Third Pass — Severity**: tag findings Blocker / Warning / Nit; resolve blockers before merge; allow nits as follow-up
4. **Final Pass — Verify**: run tests and linting locally if needed
5. **Approval**: approve only when blockers resolved, warnings addressed (or justified), and all required checks pass
6. **Traceability**: resolve all review threads before merge (ruleset `required_review_thread_resolution`)

### Metrics to track

- Defect density per review (bugs found ÷ LOC reviewed) — directionally, it should rise as the process matures
- % of merges without review → target 0%
- Time-to-first-review < 24h
- Lead Time for Changes (DORA) impact of review latency

---

_Last updated: 2026-08-31_
