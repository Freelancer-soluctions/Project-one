---
name: review-code
description: >
  Base code review checklist: correctness, security baseline, performance, code
  quality, and testing, with severity mapping and evidence requirements. Use for
  every code review; load review-security, review-react, and review-express when
  their triggers match. Extracted from reviewer.md.
license: MIT
metadata:
  author: project-one
  version: '1.0'
---

# Review Code — Base Checklist

Load this for every code review. This skill stays at baseline depth; deeper
dimensions live in the conditional skills, so do not duplicate them here:

| Dimension            | Load              |
| -------------------- | ----------------- |
| Deep security review | `review-security` |
| React / client UI    | `review-react`    |
| Express / backend    | `review-express`  |

## 1. Correctness

- Logic errors or bugs
- Edge cases handled properly
- Error handling present and complete
- Null/undefined checks
- Type safety (TypeScript)

## 2. Security (baseline only)

- SQL injection risk in raw Prisma usage (`$queryRaw`, `$executeRaw`)
- Authentication/authorization checks on new entry points
- Sensitive data exposed in responses or logs (passwords, tokens, secrets)
- → For the deep checklist (XSS, input validation, CORS, rate limiting),
  load `review-security`.

## 3. Performance

- Database query efficiency (N+1 problems)
- Unnecessary React re-renders
- Memory leaks
- Bundle size (frontend)
- Proper use of indexes (Prisma schema)

## 4. Code Quality

- Follows project conventions (ESLint, Prettier)
- No code duplication (DRY principle)
- Proper abstractions and separation of concerns
- Clear, meaningful naming
- Adequate comments for complex logic
- Consistent code style

## 5. Testing

- Tests exist and pass
- Coverage meets the 80% threshold
- Tests cover edge cases and error scenarios
- Integration tests for API endpoints
- E2E tests for critical flows
- Mock data realistic and comprehensive

## Severity mapping

| Severity | Use for                                            |
| -------- | -------------------------------------------------- |
| CRITICAL | Security vulnerabilities, data loss risks, crashes |
| HIGH     | Bugs, performance issues, missing error handling   |
| MEDIUM   | Code quality, maintainability, minor bugs          |
| LOW      | Style preferences, micro-optimizations             |

Every CRITICAL and HIGH entry MUST include `file` and `line`. An enumeration
without a location cannot be verified and will be treated as noise.
