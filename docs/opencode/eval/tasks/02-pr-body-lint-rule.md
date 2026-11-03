# TASK-02 — New PR body rule

## Task ID & Title

`TASK-02` — Add one governance rule to the PR body linter without breaking its
frozen return shape.

## Scope

- **Goal:** `scripts/ci/pr-body-lint.mjs` gains a rule that fails a PR body whose
  `How Has This Been Tested?` section contains only unchecked boxes.
- **In scope:** the linter module, its lockstep test, the PR template if the rule
  needs a section, and the gate's documentation row.
- **Out of scope:** the GitHub workflow wrapper, bot exemption, any new warning
  severity (the policy has failures only).
- **Affected apps:** none at runtime — root CI script + docs.

## Inputs

- Existing `evaluateBody({ body, author }) -> { verdict, failures, warnings }`
  contract; `failures: [{ rule, section, message }]`.
- `.github/PULL_REQUEST_TEMPLATE.md` and `docs/pre-merge-gates-governance.md`.

## Steps expected

1. grill-me — rule id, message wording, and whether an unchecked-only section is
   distinguishable from an empty one.
2. spec — `pr-body-lint-governance` delta with the new requirement + scenarios.
3. review — reviewer checks the rule does not duplicate R2c.
4. implement — module change + tests for pass/fail/empty cases.
5. verify — targeted vitest run for the linter test file; `node --check`.
6. commit — Conventional Commit, signed, DCO signoff.
7. Trello — card created and linked.

## Expected artifacts

- OpenSpec change with a `pr-body-lint-governance` delta.
- Modified linter module + its test file.
- Test output showing the new rule firing and not firing.
- One signed commit; one Trello card id.

## Acceptance criteria

- [ ] A body whose tested-section holds only `- [ ]` entries fails with the new rule id.
- [ ] A body with at least one checked box still passes.
- [ ] `warnings` remains an always-empty array; the return shape is unchanged.
- [ ] Linter tests pass; lint clean.
- [ ] Commit is conventional, signed, DCO-signed-off, and references the Trello card.

## Run notes

### Run A

_pending_

### Run B

_pending_
