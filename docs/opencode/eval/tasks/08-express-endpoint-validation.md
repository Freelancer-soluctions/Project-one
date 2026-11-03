# TASK-08 — Add a validated Express endpoint

## Task ID & Title

`TASK-08` — Add one `GET` endpoint with schema-validated input and integration
tests for the happy and error paths.

## Scope

- **Goal:** a read-only resource endpoint under `apps/server/src/routes/` validates
  its query params, returns a stable shape, and maps validation failures to 400.
- **In scope:** route + handler + validation schema, integration test, route
  registration.
- **Out of scope:** authentication/authorization changes, pagination beyond the
  spec, caching, client consumption.
- **Affected apps:** server.

## Inputs

- Existing Express router conventions and the server's test setup for integration
  tests.
- `docs/nodejs-backend-patterns`-style conventions already used in the repo.

## Steps expected

1. grill-me — response shape, error envelope, invalid-input contract, whether the
   endpoint needs the existing auth middleware.
2. spec — API delta with requirements + scenarios for 200, 400 and empty result.
3. review — reviewer checks the contract before implementation.
4. implement — route, handler, schema, tests.
5. verify — `npm run test:integration` for the server; lint/typecheck clean.
6. commit — `feat(server)` commit, signed, DCO signoff.
7. Trello — card created and linked.

## Expected artifacts

- OpenSpec change with the API delta.
- New route/handler + validation schema.
- Integration test output for 200, 400 and empty-result cases.
- One signed commit; one Trello card id.

## Acceptance criteria

- [ ] 200 returns the documented shape for valid input.
- [ ] 400 returns the documented error envelope for invalid input.
- [ ] Empty result is distinguishable from an error.
- [ ] Integration tests pass; lint and typecheck clean.
- [ ] Commit is conventional, signed, DCO-signed-off, and references the Trello card.

## Run notes

### Run A

_pending_

### Run B

_pending_
