---
name: review-express
description: >
  Conditional Express checklist for code reviews: async error handling, HTTP
  status codes, validation middleware, request/response typing, and
  transactions. Load when the review touches files under apps/server/.
  Extracted from reviewer.md.
license: MIT
metadata:
  author: project-one
  version: '1.0'
---

# Review Express — Conditional Checklist

Load this in addition to `review-code` when the review touches backend code.

## Load triggers

Load when any of these is true for the changed files:

- Path is under `apps/server/` (`apps/server/src/**`).
- The file is a route, middleware, controller, service, or DAO
  (`apps/server/src/**/routes/**`, `**/middleware/**`, `**/controllers/**`,
  `**/services/**`, `**/dao/**` or `**/DAOs/**`).

## The five checks

- **Async/await with proper error handling** — async handlers are wrapped
  (try/catch or the project's async wrapper) so rejections reach the error
  middleware; no floating promises.
- **Correct HTTP status codes** — 200/201/204 for success paths, 400 for
  validation, 401 vs 403 distinguished, 404 for missing resources, 409 for
  conflicts; no 200 with an `error` body.
- **Input validation middleware** — Joi/Zod schema runs before the controller;
  the controller never reads unvalidated `req.body`/`req.params`/`req.query`.
- **Request/response typing** — handler params and response shapes are typed
  or explicitly documented; no `any` leaking into the service layer.
- **Database transactions where needed** — multi-write operations are wrapped
  in `prisma.$transaction`; no partial writes on failure.

## Reporting

- CRITICAL: unhandled rejection that crashes the process, authorization
  skipped in the handler, partial write on a multi-step operation.
- HIGH: wrong status code on a client-visible contract, unvalidated input
  reaching the database, floating promise.
- Every entry includes `file` and `line`.
