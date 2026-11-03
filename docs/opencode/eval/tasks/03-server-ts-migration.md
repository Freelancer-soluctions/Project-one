# TASK-03 — Migrate one server module to TypeScript

## Task ID & Title

`TASK-03` — Migrate a single Express middleware module from `.js` to `.ts` with no
runtime behavior change.

## Scope

- **Goal:** one middleware under `apps/server/src/` becomes `.ts`, imports resolve
  under the server's TS config, and its existing tests still pass unchanged in
  behavior.
- **In scope:** that module, its test file (if the extension must change), the
  server `tsconfig`/test filter entry.
- **Out of scope:** the entry point, `nodemon`/`tsx` switch, mass migration, any
  behavior or API change.
- **Affected apps:** server.

## Inputs

- `docs/server-typescript-migration-research.md` (migration constraints, runtime
  endgame).
- An existing middleware with at least one passing test.
- Node `22.23.1`; server workspace dependencies already installed.

## Steps expected

1. grill-me — which module, how types are expressed (`Request`/`Response`
   generics?), how the test filter gains `.ts`.
2. spec — `server-typescript-migration` delta with the parity requirement
   (same behavior, no signature change).
3. review — reviewer confirms no runtime behavior moves.
4. implement — rename + types + any test filter change; keep the diff minimal.
5. verify — `npm run test:unit` (server) for the touched test file; typecheck;
   lint.
6. commit — Conventional Commit with `refactor(server)` scope, signed, DCO signoff.
7. Trello — card created and linked.

## Expected artifacts

- OpenSpec change with a `server-typescript-migration` delta.
- `.js` → `.ts` module diff (types only, no logic edits).
- Typecheck + test + lint output.
- One signed commit; one Trello card id.

## Acceptance criteria

- [ ] Module is `.ts` and carries real types (no blanket `any` on the request/response).
- [ ] Existing middleware tests pass with the same assertions.
- [ ] Typecheck and lint are clean for `apps/server`.
- [ ] No other module was migrated in the same commit.
- [ ] Commit is conventional, signed, DCO-signed-off, and references the Trello card.

## Run notes

### Run A

_pending_

### Run B

_pending_
