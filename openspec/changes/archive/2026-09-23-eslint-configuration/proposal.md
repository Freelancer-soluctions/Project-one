# Proposal

## Why

The official-research document `docs/learning/eslint-configuration.md` (ESLint `^9.39.2`, flat config) — built from eslint.org sources plus a block-by-block analysis of `eslint.config.js` — surfaced three concrete defects verified against the real files: (1) the `server-complexity` CI job enforces cyclomatic `complexity` max **15** via the `--rule` CLI flag while `eslint.config.js` sets **20** (CLI `--rule` overrides the config file, so local lint runs at 20 and CI at 15); (2) the backend block (`files: ['apps/server/**/*.js']`) spreads `...globals.browser`, declaring `window`/`document` in Node code and weakening `no-undef`; (3) `eslint-plugin-import` is installed in root `devDependencies` but never imported or registered in `eslint.config.js`. Flat config is the right foundation (ESLint 9 default: single root file, `files` glob scoping, ordered array merge, no folder cascade) — but the knowledge about it must be a maintained, canonical, Spanish-language document, and the config/CI it documents must be defect-free.

## What Changes

- **Promote `docs/learning/eslint-configuration.md` to canonical documentation** — the single Spanish-language source of truth for the ESLint flat-config setup (mental model, block-by-block analysis, official references, CI jobs)
- **Align the server complexity threshold** — make the `server-complexity` job in `.github/workflows/ci.yml` and `eslint.config.js` enforce the same value (20), eliminating the local/CI drift caused by the CLI `--rule` override
- **Remove `globals.browser` from the backend block** — `apps/server` keeps `globals.node` + Vitest globals only; frontend/Storybook blocks keep browser globals
- **Verify `eslint-plugin-import`** — confirm zero usage (import boundaries are already enforced by the `dependency-cruiser` `*-import-bounds` jobs), then remove it from `package.json` (or wire it into the config if verification finds real usage)
- **Re-validate the canonical doc** after the fixes so its findings, line references, and plugin inventory stay accurate

## Capabilities

### New Capabilities

- `documentation-canónica-es`: Canonical Spanish-language documentation for project configuration knowledge. Covers `docs/learning/eslint-configuration.md` as the single ESLint flat-config reference: written in Spanish, citing official ESLint sources, and kept synchronized with the real `eslint.config.js` and CI quality gates.

### Modified Capabilities

- `config-correctness`: ESLint configuration correctness. Two requirement changes: (a) server complexity threshold aligned between CI and config, (b) backend block restricted to Node/Vitest globals with `globals.browser` removed.

## Impact

| File                                    | Change                                                                                                                    |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `eslint.config.js`                      | Delete `...globals.browser` from the `apps/server/**/*.js` block; complexity blocks unchanged (20)                        |
| `.github/workflows/ci.yml`              | `server-complexity` (and symmetric `client-complexity`) stop overriding via `--rule`; server threshold 15 → 20 per config |
| `package.json`                          | Remove `eslint-plugin-import` from `devDependencies` if verification confirms unused                                      |
| `docs/learning/eslint-configuration.md` | Designated canonical; update §2 findings, §4.3 plugin table, §4.5 CI table after the fixes                                |

**Risks:**

- Aligning server CI 15 → 20 _loosens_ the (currently `if: false`-disabled) gate — permissive direction, no new failures expected; if the team intends 15, both config and CI move to 15 instead (the single-source-of-truth rule still holds)
- Removing `globals.browser` may expose latent `no-undef` errors in server code that referenced browser globals — catch via `npm run lint --workspace=apps/server`
- Removing `eslint-plugin-import` is only safe after the verification task (no references found today outside `package.json`)
