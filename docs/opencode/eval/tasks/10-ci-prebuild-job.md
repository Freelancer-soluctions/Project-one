# TASK-10 — Add a CI substage job

## Task ID & Title

`TASK-10` — Add one well-scoped job to the CI prebuild substage without changing
the existing DAG semantics.

## Scope

- **Goal:** `.github/workflows/ci.yml` gains one job in the prebuild substage with
  explicit `needs:`, a bounded timeout, and a clear failure message.
- **In scope:** the workflow file, the substage documentation row, any script the
  job calls.
- **Out of scope:** renaming existing jobs, changing required-check lists, touching
  branch protection.
- **Affected apps:** CI only.

## Inputs

- Current `ci.yml` job graph and `docs/CONTEXT-CICD.md` substage table.
- `docs/ci-prebuild-substage-structure-phase2-baseline.md` for naming conventions.

## Steps expected

1. grill-me — job name, which jobs it must follow, timeout, what makes it fail
   versus warn.
2. spec — CI-gate delta: the job's contract and its position in the DAG.
3. review — reviewer checks no required-check or branch-protection change is
   implied.
4. implement — workflow job + doc row.
5. verify — `actionlint`/YAML parse of the workflow; dry review of the `needs:`
   chain; no other job touched.
6. commit — `ci(...)` commit, signed, DCO signoff.
7. Trello — card created and linked.

## Expected artifacts

- OpenSpec change with the CI-gate delta.
- `ci.yml` diff with the single new job.
- Workflow lint/parse output and the updated substage doc row.
- One signed commit; one Trello card id.

## Acceptance criteria

- [ ] New job has explicit `needs:`, a timeout, and a descriptive step name.
- [ ] No existing job renamed or reordered; no required-check change.
- [ ] Workflow parses/lints cleanly.
- [ ] Documentation row matches the job name exactly.
- [ ] Commit is conventional, signed, DCO-signed-off, and references the Trello card.

## Run notes

### Run A

_pending_

### Run B

_pending_
