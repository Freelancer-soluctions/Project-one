# Design

## Context

`eslint.config.js` (235 lines, ESM, 8 configuration blocks) is the single root flat config for the npm-workspaces monorepo; every workspace lints with its own glob but shares this config. The research document `docs/learning/eslint-configuration.md` (official eslint.org sources + block-by-block analysis) documents how it works and flagged three defects, each verified against the real files:

1. **Complexity discrepancy (server 15 vs 20):** `eslint.config.js` sets `complexity: ['error', { max: 20 }]` for `apps/server/**/*.js`, but the `server-complexity` job in `.github/workflows/ci.yml` passes `npx eslint --rule '{"complexity": ["error", 15]}'`. The CLI `--rule` flag wins over the config file → local = 20, CI = 15. The job is currently `if: false`, so the drift is dormant but real on re-enable. (`client-complexity` passes 20, which happens to match.)
2. **`globals.browser` in the backend block:** `eslint.config.js` spreads `...globals.browser` into `files: ['apps/server/**/*.js']`, declaring `window`, `document`, etc. in Node code — `no-undef` can no longer catch accidental browser-global usage in the server.
3. **`eslint-plugin-import` unused:** declared in root `package.json` `devDependencies` (`^2.32.0`) but never imported in `eslint.config.js`; import boundaries are actually enforced by `dependency-cruiser` via the `*-import-bounds` CI jobs. No references exist in `apps/` or `.github/`.

The team's documentation and config comments are Spanish (`eslint.config.js` block comments, `docs/learning/*`).

## Goals / Non-Goals

**Goals:**

- Establish `docs/learning/eslint-configuration.md` as the canonical Spanish-language reference for the ESLint setup
- Make `eslint.config.js` the single source of truth for the `complexity` threshold (server CI/config aligned at 20)
- Restrict backend `languageOptions.globals` to Node + Vitest (`globals.browser` removed)
- Verify `eslint-plugin-import` usage and remove it if confirmed unused
- Re-validate the canonical document against the corrected configuration

**Non-Goals:**

- Activating `eslint-plugin-import` rules as a new feature (if verification finds a consumer it gets wired minimally; a full `import/order` rollout is a separate change)
- Adding, upgrading, or removing any other ESLint plugin or rule
- Re-enabling CI jobs currently disabled with `if: false` (`server-complexity`, `server-import-bounds`) — this change only fixes their contents
- Migrating to TypeScript or changing the Prettier/lint-staged setup
- Translating the canonical document to English

## Decisions

### 1. Documentación canónica en español

**Decision:** `docs/learning/eslint-configuration.md` becomes the single canonical document for the ESLint configuration, written in Spanish prose (short English identifiers for block names/globs so they stay greppable in `eslint.config.js` and the Config Inspector).

**Rationale:** The document already combines official research (eslint.org links) with the full block-by-block analysis of the real config — rewriting it elsewhere or splitting it per workspace would immediately create drift. Spanish matches the existing convention: every comment inside `eslint.config.js` and the rest of `docs/learning/` is Spanish, and the target audience is the hispanohablante team. Keeping technical identifiers (`files`, `languageOptions`, `globals.browser`) in English keeps the doc alignable with official docs and tooling output.

**Alternatives considered:**

- **English canonical doc** — matches upstream ESLint docs but breaks the repo's documentation language convention (`docs/learning/` prose is Spanish).
- **Per-workspace docs** (separate client/server lint docs) — duplicates the shared flat-config model; two files to keep in sync = the same drift class this change is fixing.
- **Comments-only in `eslint.config.js`** — no room for official-research narrative, comparative tables, and CI-job coverage; comments must stay short.

### 2. Corrección de los errores detectados

**Decision (A — complexity):** Remove the `--rule '{"complexity": ...}'` CLI override from BOTH `server-complexity` and `client-complexity` jobs in `.github/workflows/ci.yml`, so both jobs inherit the threshold from `eslint.config.js` (20 per workspace). Result: server CI 15 → 20, config unchanged.

**Rationale:** The root cause of the 15/20 discrepancy is the threshold being duplicated in two places with the CLI copy silently winning. Deleting the override makes one file — `eslint.config.js` — the single source of truth; future threshold changes happen in exactly one place and cannot drift again.

**Alternatives considered:**

- **Keep `--rule`, change 15 → 20** — one-character fix, but preserves the two-sources pattern that caused the bug; drift can recur.
- **Align to 15 (config 20 → 15)** — would tighten local lint for the server; nothing in the research justifies 15 as the governed value, and the job is currently disabled anyway. If the team later wants 15, it changes only `eslint.config.js` under this design.

**Decision (B — globals):** Delete `...globals.browser` from the backend block of `eslint.config.js`, keeping `...globals.node` and `...vitest.environments.env.globals`. Frontend and Storybook blocks keep `globals.browser` — those run in the browser.

**Rationale:** Official practice (and the doc's own §3.6 rule): backend = `globals.node` only. Browser globals in Node code neutralize `no-undef` for exactly the class of bug (using `window`/`document` server-side) that the rule exists to catch. Vitest globals must stay so server test files (`describe`, `expect`) don't fail `no-undef`.

**Alternatives considered:**

- **Keep browser globals "just in case"** — no server code legitimately needs them; the cost is a permanently weakened check.
- **Removing Vitest globals too** — would break `no-undef` on server tests; out of scope and explicitly wrong.

**Decision (C — eslint-plugin-import):** Verify usage first (task 2.1). If confirmed unused — expected, since zero references exist outside `package.json` and import boundaries are covered by `dependency-cruiser` (`*-import-bounds` jobs) — remove it from root `devDependencies`. If verification unexpectedly finds a consumer, register the plugin in `eslint.config.js` instead of removing it, and record the finding in the change artifacts.

**Rationale:** An unwired plugin is dead weight: Dependabot keeps bumping it, it adds install cost, and it is a misleading signal in the documented plugin table. Verification-before-removal avoids breaking an undiscovered consumer.

## Risks / Trade-offs

| Risk                                                                     | Impact                                                  | Mitigation                                                                                               |
| ------------------------------------------------------------------------ | ------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| Server CI gate loosens 15 → 20                                           | A function with complexity 16–20 would now pass CI      | Permissive direction; gate is currently `if: false` anyway; the doc records the governed value (20)      |
| Removing `globals.browser` surfaces new `no-undef` errors in server code | Lint failures if server code references browser globals | Run `npm run lint --workspace=apps/server` right after the edit; fix any real violations                 |
| Removing `eslint-plugin-import` breaks an undiscovered consumer          | Missing dependency at lint time                         | Task 2.1 verifies references across configs/CI/docs BEFORE removal; `npm install` + `npm run lint` after |
| Doc drifts again after future config edits                               | Canonical doc stale                                     | Synchronization requirement in `documentation-canónica-es` + validation task 3.1                         |
