## Why

The orchestrator's Layer-3 retry protocol (documented in `docs/opencode/prompts/orchestrator.md` lines 395-444) classified TWO conditions as "silent exit": (a) an empty `<task_result>` body — a TRUE silent exit — and (b) a `<task_result>` body that does NOT contain an `<output-contract>` envelope. Condition (b) was a **false positive**: subagents WERE producing valid deliverable text, but without the XML envelope wrapper. On every misfire the orchestrator re-delegated, forcing the subagent to re-reason the entire task from scratch — **doubling token consumption per misfire**. Three silent-exit retries occurred in this session (2026-08-02) before the user noticed the waste.

The Layer-2 observe-only plugin (`.opencode/plugins/output-contracts.ts`) correctly distinguishes the two conditions, but the orchestrator's Layer-3 does not consume the plugin's signal — it parses the raw output via regex. This change records the diagnosis, the disabled state, and the exact re-enable procedure so the strict detection can be reviewed or restored later.

## What Changes

1. **Disable the Layer-2 observe-only plugin** in `opencode.jsonc` (commented out line 6) — it provides no retry/block/rewrite value and the real token waste came from Layer-3 retries.
2. **Soften the Layer-3 detection criterion** in `docs/opencode/prompts/orchestrator.md` — only TRUE silent exits (empty body) trigger retry; envelope-less-but-valid responses become a soft `MISSING_ENVELOPE` failure (no retry, preserve subagent text, report to user). The disabled criterion is wrapped in an HTML comment referencing this change.
3. **Document the re-enable procedure** as a spec requirement so a future review/research session can restore strict detection deterministically.

## Capabilities

### New Capabilities
- `silent-exit-detection`: Defines the refined detection semantics — empty `<task_result>` body is a TRUE silent exit (retry); text-without-envelope is a soft `MISSING_ENVELOPE` failure (no retry, preserve text, report to user).
- `reenable-procedure`: Documents the exact steps to re-enable strict silent-exit detection and the Layer-2 plugin for future review/research sessions.

### Modified Capabilities
- `orchestrator-retry-protocol`: The existing "Silent exit detection" requirement changes — the "missing envelope" OR-criterion no longer triggers retry; it becomes a soft `MISSING_ENVELOPE` failure. Only the empty-body criterion remains a retry-triggering silent exit.

## Impact

- `opencode.jsonc` — Layer-2 plugin commented out (line 6)
- `docs/opencode/prompts/orchestrator.md` — Layer-3 detection criterion softened (lines 399-401), disabled criterion wrapped in HTML comment, `MISSING_ENVELOPE` soft-failure fallback added
- `docs/opencode/output-contracts.md` — "Subagent Silent Exit Audit" section to be updated to note the current disabled state (task 3.1)
- `openspec/specs/orchestrator-retry-protocol/spec.md` — delta spec for the modified detection requirement
- NO application code, package config, or infrastructure affected
