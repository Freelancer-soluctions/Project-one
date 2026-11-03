# TASK-05 — Segment a large snapshot test

## Task ID & Title

`TASK-05` — Split one oversized snapshot into per-cell snapshots so a single cell
change no longer invalidates the whole file.

## Scope

- **Goal:** one client test file's monolithic snapshot becomes one snapshot per
  rendered cell, with the same rendered output as before.
- **In scope:** the test file, its `__snapshots__` file, the snapshot update gate
  if the rename lands in its path.
- **Out of scope:** changing component markup or styles; changing
  `snapshotFormat.maxOutputLength`.
- **Affected apps:** client.

## Inputs

- The failing/oversized snapshot identified by `vitest/no-large-snapshots`.
- `scripts/ci/snapshot-update-gate.mjs` rules for legitimate snapshot updates.

## Steps expected

1. grill-me — snapshot granularity (per cell vs per section), whether any cell is
   still too large, how the obsolete snapshot is removed.
2. spec — `client-testing` delta: per-cell snapshots, unchanged rendered output.
3. review — reviewer checks the segmentation preserves coverage of every cell.
4. implement — restructure the test + regenerate snapshots; delete the stale entry.
5. verify — client test run; snapshot count before/after; lint clean.
6. commit — `test(client)` commit, signed, DCO signoff.
7. Trello — card created and linked.

## Expected artifacts

- OpenSpec change with a `client-testing` delta.
- Segmented test file and `__snapshots__` diff (one new entry per cell, old removed).
- Test output with the new snapshot count.
- One signed commit; one Trello card id.

## Acceptance criteria

- [ ] One snapshot per cell; no snapshot exceeds the configured size limit.
- [ ] The obsolete monolithic snapshot is removed, not left orphaned.
- [ ] Rendered output is unchanged (no markup edits in the diff).
- [ ] Client tests and lint pass.
- [ ] Commit is conventional, signed, DCO-signed-off, and references the Trello card.

## Run notes

### Run A

_pending_

### Run B

_pending_
