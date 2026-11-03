# TASK-06 — Quarantine a flaky test with evidence

## Task ID & Title

`TASK-06` — Quarantine one reproducibly flaky test using the existing quarantine
exclude mechanism, with a linked tracking issue.

## Scope

- **Goal:** the named flaky test is excluded from the blocking suite through
  `scripts/ci/quarantine-exclude.mjs`'s mechanism, documented, and still runs in
  the non-blocking lane.
- **In scope:** the quarantine list/annotation, a note describing the failure
  signature, a tracking issue link.
- **Out of scope:** fixing the underlying race, changing the retry count, marking
  the test `skip`/`fixme` inline without the quarantine mechanism.
- **Affected apps:** client or server (whichever owns the flaky test).

## Inputs

- A failing test with at least 3 recorded failing runs and the error signature.
- `docs/testing-architecture.md` and the quarantine exclude script.

## Steps expected

1. grill-me — is it truly flaky (same test, alternating outcomes) or a real
   regression; which lane still runs it.
2. spec — `test-quarantine` delta: quarantined test, tracking link, unquarantine
   condition.
3. review — reviewer rejects quarantining a deterministic failure.
4. implement — add the quarantine entry + note; no inline skip.
5. verify — blocking lane excludes it; quarantine lane includes and runs it;
   lint clean.
6. commit — `test(ci)` commit, signed, DCO signoff.
7. Trello — card created and linked (card carries the unquarantine task).

## Expected artifacts

- OpenSpec change with a `test-quarantine` delta.
- Quarantine entry diff + failure-signature note.
- Output showing the test excluded from blocking and present in the quarantine lane.
- One signed commit; one Trello card id.

## Acceptance criteria

- [ ] Test is quarantined via the documented mechanism, not an inline skip.
- [ ] Failure signature and tracking issue are recorded.
- [ ] Blocking suite no longer runs it; quarantine lane does.
- [ ] Lint/tests for the touched workspace pass.
- [ ] Commit is conventional, signed, DCO-signed-off, and references the Trello card.

## Run notes

### Run A

_pending_

### Run B

_pending_
