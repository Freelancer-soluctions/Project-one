# TASK-01 — Cover the eval token-recording script

## Task ID & Title

`TASK-01` — Give `scripts/eval/record-tokens.mjs` a lockstep unit test and make the
scripts Vitest project actually collect it.

## Scope

- **Goal:** the token recorder's validation contract (schema fields, enums, date
  format, non-negative counts, `total = input + output`, append behavior) is
  covered by unit tests, and `npm run test:scripts` runs them.
- **In scope:** `scripts/eval/record-tokens.mjs` (only a testability seam if one is
  missing), a new `scripts/eval/record-tokens.test.mjs`, the `include` list in
  `vitest.scripts.config.js` (today `scripts/ci/*.test.mjs` + `scripts/*.test.mjs`,
  which does not match `scripts/eval/*.test.mjs`), and a root `package.json` test
  script only if the existing one cannot target the file.
- **Out of scope:** changing the row schema (the template file is its frozen
  source of truth), touching other scripts' tests, wiring anything into CI
  workflows, and writing rows into the real `docs/opencode/eval/tokens/`.
- **Affected apps:** none at runtime — root tooling only.

## Inputs

- `docs/opencode/eval/token-recording-template.md` — the canonical row schema
  (`date`, `agent`, `phase`, `task_id`, `run_id`, `input_tokens`, `output_tokens`,
  `total_tokens`, `source`, `notes`) and the agent/phase/source enums.
- `scripts/eval/record-tokens.mjs` — `parseArgs`, `buildRow`, `appendRow`, `main`.
- `vitest.scripts.config.js` — the standalone project for root scripts.
- Pattern to follow: `scripts/ci/coverage-baseline.test.mjs` and the other
  `scripts/ci/*.test.mjs` files (spawn or import the real module, temp fixtures).

## Steps expected

1. grill-me — assert by importing the module or by spawning the CLI; how to prove
   the include fix works; whether `--help` is in scope.
2. spec — OpenSpec change adding an `eval-tooling` capability with the recorder's
   validation contract as requirements + scenarios.
3. review — reviewer checks the tests assert behavior (not implementation) and that
   the schema file is untouched.
4. implement — new test file + `include` entry (+ seam only if required).
5. verify — `npm run test:scripts`; the new file appears in the collected list and
   passes; lint clean.
6. commit — Conventional Commit, signed, DCO signoff.
7. Trello — card created and linked.

## Expected artifacts

- `openspec/changes/<change-name>/{proposal.md,design.md,tasks.md,specs/**}` with
  the new `eval-tooling` delta.
- New `scripts/eval/record-tokens.test.mjs`.
- `vitest.scripts.config.js` diff (include list only).
- Test output showing the file collected and passing.
- One signed commit; one Trello card id.

## Acceptance criteria

- [ ] `npm run test:scripts` collects and runs the new test file (visible in the
      run output, not just present on disk).
- [ ] A valid row appended to a temp file parses back with exactly the schema's 10
      keys, in the schema's order.
- [ ] Invalid agent, invalid phase, malformed `--date`, negative token count, and
      `--total` ≠ `--in` + `--out` are each rejected with a non-zero exit and
      **no line written** (assert the temp file is unchanged).
- [ ] Omitting `--total` computes it as `input + output`; `--file` retargets the
      output; `--help` exits 0.
- [ ] No test writes into `docs/opencode/eval/tokens/`, and
      `token-recording-template.md` is unmodified.
- [ ] Tests pass; lint clean; commit conventional, signed, DCO-signed-off, and
      references the Trello card.

## Run notes

### Run A

_pending_

### Run B

_pending_
