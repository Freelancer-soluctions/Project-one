# Design

## Context

Knip reads exactly ONE config file, resolved from the CWD (verified locally with `--debug`, knip 6.32.2): from the repo root only `/knip.jsonc` loads; from inside a workspace only that workspace's `knip.json` loads as a standalone project (`workspaces: []`). `--workspace` filters analysis, not config discovery. The repo therefore has three files where only one is authoritative: root `/knip.jsonc` (full client section: 23 `ignore`, 18 `ignoreIssues`) vs stale `apps/client/knip.json` (2 `ignore`, 20 `ignoreIssues`) and a matching-but-redundant `apps/server/knip.json`. CI's `client-dead-code`/`server-dead-code` jobs set `working-directory: apps/*`, so they actually load the NESTED configs — contradicting the docs and the OpenSpec claim that root config drives CI. See proposal.md — Why for motivation; requirements in `specs/`.

## Goals / Non-Goals

**Goals:**

- One root `knip.jsonc` as sole source of truth for all four workspaces (`.`, `apps/client`, `apps/server`, `e2e`)
- Identical analysis scope regardless of CWD or `--workspace` filter
- Narrower `ignoreDependencies` achieved by widening `project` globs (root-cause fix)
- CI and OpenSpec claims match verified config-discovery behavior

**Non-Goals:**

- Deleting dead code found by knip (`--fix` stays out of scope; config must be trusted first)
- Flipping rule severities (graduation warn→error is a later ratchet; `duplicates: off` stays)
- Enabling `cycles`/`includeEntryExports` (separate hardening change)
- Uninstalling the accidental `add`/`command` packages (flagged here, executed separately after confirmation)

## Decisions

1. **Delete nested configs instead of syncing them.** Alternatives: (a) keep + manual sync, (b) generate as copies via script. Rationale: knip has no `extends`/merge — any second file is guaranteed drift (already proven by the stale client file). Deletion makes the root file the only possible answer.
2. **Root section wins on conflict; union otherwise.** For differing entries the root file is newer and matches CI baseline intent. Exception: `fieldLimits.js`/`socketService.js` — root blanket-`ignore`s them, nested lists them under `ignoreIssues: ["exports"]`. Choose the nested (surgical) form: knip's official preference order ranks `ignoreIssues` above `ignore`, and exports-only suppression keeps `files`/`dependencies` reporting for those files alive. All other nested-only `ignoreIssues` entries merge into root.
3. **Widen `project`, then shrink `ignoreDependencies`.** Client `project` gains `tests/**/*.{js,jsx}`, `.storybook/**/*.{js,jsx}`, `*.config.{js,mjs}`; server gains `prisma/**/*.js`, `tests/**/*.js`; add `paths` for the Vite `@/` alias (top `#1` cause of false reports). Only after parity runs confirm it, drop `msw`, `globals`, `@storybook/addon-docs`, `@chromatic-com/storybook` from `ignoreDependencies`. Genuinely-outside-graph deps (`shadcn-ui`, `why-is-node-running`, `@prisma/language-server`, peer/optional picks) stay ignored, documented per entry.
4. **CI jobs run from repo root.** Change `working-directory` (or drop it) so both dead-code jobs execute `npx knip --workspace=apps/<x> --no-progress` at root. `continue-on-error: true` semantics untouched (Phase 1 non-blocking). Alternative rejected: `--config ../../knip.json` from the workspace dir — works, but leaves CWD-relative globs and plugins resolved from the workspace, diverging from local root runs.
5. **Add `"."` and `"e2e"` sections rather than relying on defaults.** Top-level `entry`/`project` are ignored in workspaces-based repos; explicit sections make root scripts and playwright tests first-class analysis scope instead of implicit defaults.
6. **npm scripts instead of nested configs for per-app commands.** `knip:client`/`knip:server` keep the "run from root" invariant mechanically enforced.

## Risks / Trade-offs

- [Finding counts shift after glob widening + ignore reconciliation → CI/parity noise] → Capture JSON baselines (`npx knip --reporter json`) before AND after; compare per workspace; `continue-on-error` keeps Phase 1 non-blocking during calibration.
- [Widened globs expose NEW unused exports/deps previously out of scope] → Re-audit `ignoreIssues` per file after widening; only keep entries with a documented reason; document newly surfaced findings as follow-up tasks, not silent ignores.
- [Developers with stale muscle memory (`cd apps/* && npx knip`)] → Behavior is now identical to root runs (root config discovered via repo root); add npm scripts and a note in `docs/learning/knip-configuration.md`.
- [Wrong OpenSpec/CI claims recur] → Fixed via the `ci-prebuild-substage-structure` delta in this change; doc §3/§9 updated in the same change.
- [Accidental `add`/`command` packages linger in ignores] → Listed as uninstall candidates in tasks; removal is a separate, reversible `npm uninstall` after verification.

## Migration Plan

1. Baseline: JSON outputs of the three current entry points (root run, `cd apps/client`, `cd apps/server`).
2. Rewrite root `/knip.jsonc` (merged + widened + new sections).
3. Parity check per workspace (`npx knip --workspace=… --no-progress`); reconcile deltas into ignore lists with documented reasons.
4. Delete nested configs; update CI dead-code steps; add npm scripts; update the OpenSpec delta + docs.
5. Rollback = `git revert` — all changes are declarative config/workflow files, no data migration.

## Open Questions

- Should `add`/`command` be uninstalled inside this change or a follow-up? Deferred to tasks as a separate, confirmation-gated step (does not affect specs or task breakdown: it is an independent package.json edit either way).
