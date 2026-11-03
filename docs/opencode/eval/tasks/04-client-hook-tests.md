# TASK-04 — Close a per-file coverage breach with hook tests

## Task ID & Title

`TASK-04` — Bring a below-floor client hook back over the per-file coverage floor
by testing real behavior, not by widening thresholds.

## Scope

- **Goal:** one client hook under `apps/client/src/` gains tests that exercise its
  branching paths until its file coverage clears the floor.
- **In scope:** the hook's test file and, only if unavoidable, a minimal
  testability fix in the hook.
- **Out of scope:** lowering thresholds, `/* istanbul ignore */`, snapshot tests,
  refactoring unrelated hooks.
- **Affected apps:** client.

## Inputs

- The current coverage summary naming the breaching file and its percentage.
- Existing React Testing Library setup and render helpers in `apps/client`.

## Steps expected

1. grill-me — is the untested branch real behavior or dead code; do we test the
   hook directly or through a component.
2. spec — `client-testing` delta requiring behavior-level coverage of the hook's
   branches.
3. review — reviewer rejects coverage padding (no assertions-less renders).
4. implement — hook tests with `renderHook`/RTL and `user-event` where relevant.
5. verify — `npm run test` for the client workspace; the coverage summary shows the
   file above the floor; lint clean.
6. commit — `test(client)` commit, signed, DCO signoff.
7. Trello — card created and linked.

## Expected artifacts

- OpenSpec change with a `client-testing` delta.
- New/updated hook test file with named behaviors.
- Before/after coverage numbers for the target file.
- One signed commit; one Trello card id.

## Acceptance criteria

- [ ] Target file is at or above the per-file floor afterwards.
- [ ] Each new test asserts observable behavior (no assertion-free renders).
- [ ] No coverage suppression comments added; no threshold changed.
- [ ] Client tests and lint pass.
- [ ] Commit is conventional, signed, DCO-signed-off, and references the Trello card.

## Run notes

### Run A

_pending_

### Run B

_pending_
