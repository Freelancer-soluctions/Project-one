---
name: review-security
description: >
  Deep security checklist for code reviews: SQL injection, XSS, auth/authz,
  sensitive data, input validation, CORS, and rate limiting. Load only when the
  change touches auth, input handling, DB/Prisma, secrets, CORS, rate limiting,
  or dependencies. Extracted from reviewer.md.
license: MIT
metadata:
  author: project-one
  version: '1.0'
---

# Review Security — Conditional Deep Checklist

Load this in addition to `review-code` when the review scope is
security-relevant. It deepens only the security dimension; the base checklist
still applies.

## Load triggers

Load when any of these is true for the changed files:

- Authentication, authorization, sessions, tokens, or permissions.
- Input handling: request bodies, params, query strings, uploads, headers.
- Database access, especially raw queries (`$queryRaw`, `$executeRaw`) or
  Prisma schema changes.
- Secrets, environment variables, or credential handling.
- CORS configuration or middleware order.
- Rate limiting or throttling on an endpoint.
- A new or changed dependency in `package.json` / lockfile.

**When uncertain on any of the above, load it.** Missing a security checklist
costs more than the extra tokens.

## The seven checks

- **SQL injection** — Prisma parameterizes by default; flag string-built SQL,
  `$queryRawUnsafe`, and template interpolation into queries.
- **XSS** — React escapes by default; flag `dangerouslySetInnerHTML`, manual
  `innerHTML`, and sanitization bypasses.
- **Auth/authz** — Every new route needs `verifyToken` and the role check;
  flag endpoints that trust client-supplied identity (IDs, roles, tenant).
- **Sensitive data exposure** — Passwords, tokens, and secrets never logged,
  never returned in responses, never in error messages.
- **Input validation** — Joi/Zod schemas on every new or changed request
  surface, including query params and path params.
- **CORS** — Explicit allowed origins; no reflective origin in production; no
  wildcard combined with credentials.
- **Rate limiting** — Sensitive endpoints (login, register, password reset,
  anything expensive) must be throttled.

## Reporting

- CRITICAL: exploitable injection, missing authorization, secret exposure.
- HIGH: missing validation on a reachable surface, missing rate limit on auth,
  permissive CORS.
- Every entry includes `file` and `line`, plus the concrete fix.
- Do not report a category you checked and found clean; report only findings.
