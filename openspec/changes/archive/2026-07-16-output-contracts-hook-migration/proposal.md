## Why

The original `output-contracts-hardening` change (Phase 1-8) shipped self-validation (Opción D) because research at the time (Engram memory #27, 2026-07-08) concluded that `tool.execute.after` hooks did not fire at runtime in OpenCode v1.14.39 (Issue #25918). This premise has been invalidated by external web research across 11 GitHub issues, PRs, and production plugin evidence:

- Issue #25918 was auto-closed by stale bot — the original reporter self-corrected in comment 2: hooks DO fire in `prompt.ts` for native tools
- Issue #13573 closed with correction: mutations to `output.output` DO propagate for registry tools
- Issue #13575: mutation reaches `Session.updatePart({ state: { output: ... } })`
- Issue #35882: production user confirms `tool.execute.before` mutation works in v1.18.x
- Issue #36472: production user with BOTH hooks working in real plugin since Jul 12, 2026
- Maintainer @rekram1-node in Issue #5894: "When the task tool spawns a subagent it runs its own session through the same prompt loop and plugins are loaded per-Instance so the hooks DO fire for the subagent's tools."
- `warpdotdev/opencode-warp` (already in our `opencode.jsonc` plugin array) uses BOTH hooks in production to ~1M users
- npm: `@opencode-ai/plugin` has 5.6M weekly downloads, 9,451 dependents

This change activates the originally-deferred Layer 2 (programmatic runtime hook) by adding a new OpenCode plugin at `.opencode/plugins/output-contracts.ts` that uses `tool.execute.after` to validate subagent output contracts. The plugin observes, logs, and annotates metadata — it does NOT rewrite output.

Self-validation (Layer 1) STAYS because hooks cannot trigger retry (Architectural Verdict 4). The agent's in-thread self-correction loop is irreplaceable. The hook adds a programmatic backstop plus per-agent telemetry that catches the 5-10% compliance gap where agents forget to self-validate.

## What Changes

**ADDED (new artifacts)**:
- `.opencode/plugins/output-contracts.ts` — TypeScript plugin registering `tool.execute.after` filtered to `input.tool === "task"`, validates subagent envelope via existing `validateContract()`, logs failures to `.opencode/logs/contract-audit.jsonl` (JSONL), sets `output.metadata.contractValidation` for Layer 3 consumption
- `.opencode/logs/` directory (gitignored) — runtime audit log storage
- `ajv` + `ajv-formats` to `.opencode/package.json` dependencies (for plugin import path resolution)

**MODIFIED (existing artifacts)**:
- `docs/opencode/output-contracts.md` — "Runtime Enforcement — Transition Plan" section renamed to "Runtime Enforcement — Architecture"; Layer 2 marked active; Issue #25918 noted as false alarm; new section documenting plugin location, hook name, audit log format, telemetry counters
- `openspec/changes/archive/2026-07-08-output-contracts-hardening/proposal.md` — add reference to this follow-up change; update deferred items status
- `openspec/changes/archive/2026-07-08-output-contracts-hardening/design.md` — Decision 10 status change: "rejected because Issue #25918 blocks" → "implemented as Layer 2 hook plugin (see `output-contracts-hook-migration` change). Issue #25918 was a false alarm."
- `openspec/changes/archive/2026-07-08-output-contracts-hardening/tasks.md` — add Phase 9 header referencing this follow-up change

**CONFIGURED**:
- `.opencode/logs/` added to root `.gitignore`

## Out of Scope

- Removing or modifying `## SELF-VALIDATION` sections in the 8 agent prompts (they stay — Layer 1 irreplaceable)
- Layer 3 orchestrator escalation logic (already documented in `orchestrator.md` sections 442-494)
- Plugin code for `/contract-stats` command (deferred to follow-up change)
- `output.inject`-based retry indirection (waits for PR #19519 to stabilize)
- Full migration to hook-only validation (rejected — would regress reliability by losing retry capability)

## Success Criteria

1. Plugin file exists at `.opencode/plugins/output-contracts.ts` and loads without errors on OpenCode startup
2. Subagent completions (task tool) with valid contracts: no audit log entry, telemetry `total++`
3. Subagent completions with invalid contracts: JSONL audit log entry written, `output.metadata.contractValidation` set, telemetry `total++ failed++`, `console.warn` emitted
4. Validator import failure: plugin falls back to no-op validator with `console.error`, session does NOT crash
5. Degraded mode (`{ valid: true, degraded: true }`): no audit log entry, telemetry `total++` (no `failed++`)
6. `npm test` from `docs/opencode/prompts/contracts/` still passes all 35 existing validator tests (no regression)
7. `.opencode/logs/` is gitignored
8. `docs/opencode/output-contracts.md` documents Layer 2 architecture with audit log schema
