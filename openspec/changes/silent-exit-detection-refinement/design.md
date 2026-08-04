## Context

The orchestrator-subagent framework uses a 3-Layer Output Contract architecture:

- **Layer 1**: agent prompt self-validation (`docs/opencode/prompts/{agent}.md`) — each subagent prompt instructs the model to wrap its deliverable in an `<output-contract>` XML envelope.
- **Layer 2**: observe-only plugin (`.opencode/plugins/output-contracts.ts`) — observes output, distinguishes empty-body from envelope-less, but does NOT retry/block/rewrite.
- **Layer 3**: orchestrator retry protocol (`docs/opencode/prompts/orchestrator.md` lines 395-444) — parses the raw `<task_result>` via regex and re-delegates on silent exit.

On 2026-08-02 the Layer-3 protocol classified TWO conditions as "silent exit": (1) empty `<task_result>` body (TRUE silent exit) and (2) body without an `<output-contract>` envelope (false positive). Condition (2) misfired: subagents produced valid deliverable text but without the XML wrapper. Each misfire caused the orchestrator to re-delegate, re-running the subagent's full reasoning and **doubling token consumption**. Three silent-exit retries happened in one session before the user noticed.

## Root Cause Analysis

Three contributing factors:

1. **Lost-in-the-Middle effect** (Liu et al. 2023): subagent system prompts are long; the output-contract instruction sits mid-context and is not reliably honored at the end of the turn. This is the same root cause documented in the earlier `subagent-prompt-hardening` change.
2. **Subagent system prompts do not natively reinforce the contract**: the envelope requirement lives in the prompt but is not enforced by the runtime, so a subagent can emit valid text without the wrapper.
3. **Enforcement gap between Layer 2 and Layer 3**: the Layer-2 plugin correctly distinguishes empty-body from envelope-less, but Layer-3 does not consume the plugin's signal — it re-parses raw output via regex and treats both conditions identically. The plugin's granular signal is never used.

## Goals / Non-Goals

**Goals:**
- Eliminate token-wasteful false-positive retries on envelope-less-but-valid subagent outputs.
- Preserve TRUE silent-exit detection (empty body still retries).
- Document the exact re-enable procedure for future review/research.
- Record the diagnosis and the disabled state so the change is reversible.

**Non-Goals:**
- NOT implementing a framework-level retry-on-empty (requires opencode core changes).
- NOT changing the output-contract XML envelope schema.
- NOT modifying the Layer-2 plugin's implementation.
- NOT applying the alternative root-cause fixes (B/C/D) now — they are documented for future review.

## Decisions

### D1: Soften detection (Option A) — chosen
**Decision**: Only empty `<task_result>` bodies trigger retry. Envelope-less responses become a soft `MISSING_ENVELOPE` failure (no retry, preserve text, report to user).

**Rationale**: This directly eliminates the observed token waste with minimal change surface (one criterion in the orchestrator prompt + one plugin comment-out). It preserves the safety property that matters (TRUE silent exits are still caught) while removing the false-positive path. It is immediately reversible via the documented re-enable procedure.

**Trade-off**: Loses auto-recovery of the "Compliance Exit" case (envelope-less output that should have been re-emitted with an envelope). This is acceptable because the subagent's text is the source of truth — the envelope is a wrapper, not the content.

### D2: Disable the Layer-2 plugin (observe-only)
**Decision**: Comment out the Layer-2 plugin in `opencode.jsonc`.

**Rationale**: The plugin is observe-only (no retry/block/rewrite) and does not contribute to the token waste. Disabling it removes a redundant observer and makes the disabled state explicit. It is re-enabled by the same re-enable procedure.

### D3: Document re-enable procedure as a spec
**Decision**: Capture the exact re-enable steps as a spec requirement (`reenable-procedure`).

**Rationale**: The change is a deliberate regression of a safety behavior. Without a documented, deterministic revert path, a future session could either (a) forget the strict behavior existed, or (b) re-enable it incorrectly. A spec makes the revert auditable and testable.

## Alternative Fixes (for future review)

### Fix B: Reinforce subagent system prompts
Embed the contract requirement natively in each subagent system prompt (e.g., a hard `CRITICAL RULES` block at the top AND bottom, per the earlier `subagent-prompt-hardening` sandwich pattern). Addresses the root cause (lost-in-the-middle) rather than the symptom. Higher change surface (all subagent prompts).

### Fix C: Accept JSON envelope alternative format
Allow subagents to emit a JSON envelope (e.g., `{"output-contract": {...}}`) as an alternative to the XML wrapper. Reduces false positives by widening the accepted format. Requires schema/validation changes.

### Fix D: Use the plugin's metadata signal
Make Layer-3 consume the Layer-2 plugin's `metadata.contractValidation` signal for granular detection instead of parsing raw output via regex. Closes the enforcement gap between Layer 2 and Layer 3. Requires wiring the plugin signal into the orchestrator's detection path.

## Risks / Trade-offs

| Risk | Impact | Mitigation |
|------|--------|------------|
| Loses auto-recovery of Compliance Exit (envelope-less output no longer re-emitted) | Low — subagent text is preserved as the deliverable | Documented in D1; re-enable procedure restores strict behavior |
| TRUE silent exit could be missed if detection regresses | High | Regression test task 2.2 verifies empty body STILL triggers retry |
| Re-enable procedure could be applied incorrectly | Medium | Spec `reenable-procedure` gives exact steps; HTML comment in orchestrator.md references this change |
| Future session unaware of the disabled state | Medium | Task 3.1 updates `docs/opencode/output-contracts.md` audit section; HTML comments reference this change |

## Future Work

- **Fix B**: Reinforce subagent system prompts to embed the contract requirement natively (sandwich pattern).
- **Fix C**: Accept a JSON envelope alternative format.
- **Fix D**: Use the plugin's `metadata.contractValidation` signal for granular detection.
- **Framework-level retry-on-empty**: Implement retry-on-empty with resume message at the opencode Task tool layer (from the earlier `subagent-prompt-hardening` future work) — the robust long-term fix.
