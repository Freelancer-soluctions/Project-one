# Design: output-contracts-hook-migration

## Decision 1: HYBRID over Full Migration

**Problem**: The output-contracts system has two validation layers available: Layer 1 (prompt self-validation, shipped in Phase 8 of original change) and Layer 2 (programmatic hook, deferred because Issue #25918 was presumed blocking). With the premise invalidated, we must decide whether to migrate fully to hook-only, keep self-validation only, or adopt a hybrid approach.

**Chosen fix**: HYBRID architecture - Layer 1 (self-validation) stays; Layer 2 (hook plugin) adds on top. Both layers operate independently and redundantly.

**Alternatives considered**:
- **OBSERVE-ONLY** (keep Layer 1, no Layer 2): rejected - misses programmatic enforcement and telemetry
- **REWRITE** (hook rewrites output.output on failure): rejected - validator reports WHAT is wrong, not the CORRECT value; string manipulation of LLM output is fragile
- **NO-MIGRATION** (keep only Layer 1 forever): rejected - no programmatic backstop for the 5-10% compliance gap
- **FULL-MIGRATION** (remove Layer 1, use only hook): rejected - hooks cannot programmatically trigger retry

**Evidence**: Architectural Verdict 4 - tool.execute.after fires AFTER tool execution completes; withRetry cannot be invoked from the hook context. Agent in-thread self-correction loop is irreplaceable.

## Decision 2: Observe-Only Layer 2 (No output.output Rewriting)

**Problem**: The plugin could mutate output.output to fix malformed envelopes, but carries significant risks.

**Chosen fix**: Plugin does NOT mutate output.output. It writes JSONL audit log + sets output.metadata.contractValidation. Observe-only.

**Reasons**:
1. Validator reports what is wrong, not the correct value - cannot auto-fix
2. The task_result wrapper must be preserved for parent-agent parsing
3. String manipulation of LLM-generated output is fragile and format-dependent
4. Layer 1 (self-validation) handles correction via retry; Layer 2 is a backstop, not a fixer

**Evidence**: Verdict 1 confirms mutations DO work for native tools (task is native, not MCP). We choose NOT to use that capability for safety.

## Decision 3: Hook Choice - tool.execute.after (Not before)

**Problem**: OpenCode plugins support both tool.execute.before and tool.execute.after. Must choose correct hook.

**Chosen fix**: tool.execute.after filtered to input.tool === "task".

**Rationale**: tool.execute.before fires BEFORE subagent execution completes - no envelope to validate yet. tool.execute.after fires after the task tool returns its result (subagent final message wrapped in task_result). Filter on task only to ignore all other tool invocations (bash, read, write, glob, grep) and reduce noise.

## Decision 4: Agent Identification via input.args.subagent_type

**Problem**: Plugin must know which agent produced the response.

**Chosen fix**: Use input.args.subagent_type directly from hook event. When input.tool === "task", this field yields the exact agent name string. No session-lookup required. PR #15412 (parentAgent) is not needed.

**Evidence**: task.ts Parameters schema confirms subagent_type is a required field in task tool input args.

## Decision 5: Lazy-Load Validator via Dynamic import()

**Problem**: Plugin needs access to contractValidator.js. Import path resolution is platform-dependent; must not block plugin startup.

**Chosen fix**: Use new URL(...) for cross-directory ESM resolution (platform-independent). Loaded on FIRST hook invocation (not plugin startup) to avoid startup delay. Wrapped in try/catch with graceful fallback to no-op validator (always returns {valid:true, degraded:true}) - never crash a session due to validator import failure.

## Decision 6: Audit Log Format - JSONL

**Chosen fix**: Append-only JSONL at .opencode/logs/contract-audit.jsonl. Fields: {timestamp, agent, task, sessionId, callId, validationErrors, retryCount:0, degraded}. Written via fs.appendFileSync (atomic for small writes). File is gitignored.

Telemetry counters complement: in-memory {[agentName]: {total, failed}}, reset on plugin reload. JSONL is the persistent record.

## Decision 7: Metadata Propagation as Layer 3 Signal

**Chosen fix**: Plugin sets output.metadata.contractValidation with {valid, agent, version, errors, degraded} on failure. Issue #3574 confirms native tool metadata propagation works (bug was MCP-only, fixed in PR #3573).

**Fallback**: If broken in practice (tested in Task 3.1), fall back to JSONL-only mode.

## Decision 8: Ajv Resolution Strategy

**Chosen fix**: ADD ajv@^8.17.1 + ajv-formats@^3.0.1 to .opencode/package.json (currently only has @opencode-ai/plugin@1.4.3).

## Open Questions
- Q1: Plugin import path reliability on Windows vs Linux - mitigated by file:// URL + try/catch
- Q2: output.metadata propagation for task tool - tested in Task 3.1, fallback to JSONL-only
- Q3: Ajv resolution from plugin context - mitigated by Decision 8

## Alternatives Considered

| # | Decision | Rejected | Why |
|---|----------|----------|-----|
| 1 | HYBRID | FULL-MIGRATION | Hooks cannot retry |
|   | HYBRID | NO-MIGRATION | Misses programmatic backstop |
|   | HYBRID | REWRITE | Fragile string manipulation |
| 2 | Observe-only | output.output rewrite | Preserves task_result wrapper |
| 3 | tool.execute.after | tool.execute.before | Fires before envelope exists |
| 4 | subagent_type direct | Session-lookup | Field already present |
| 5 | Dynamic import() | Static import | Blocks plugin startup |
| 6 | JSONL audit log | No logging | No persistent record |
| 7 | metadata annotation | Metadata-only | Audit log is persistent record |
| 8 | ajv in .opencode/package.json | Transitive resolution | Different node_modules roots |

## References

- Memory #59 (Engram) - full architectural evaluation (5 verdicts, HYBRID recommendation)
- Memory #27 (Engram) - original premise (now invalidated)
- GitHub Issues: #25918, #13573, #13575, #35882, #36472, #5894, #31680, #3574, #21149
- PR #19519 - output.inject for future retry indirection
- docs/opencode/output-contracts.md
- docs/opencode/prompts/contracts/contractValidator.js
- docs/opencode/prompts/orchestrator.md sections 442-494
- openspec/changes/archive/2026-07-08-output-contracts-hardening/
- openspec/specs/output-contract-validation/spec.md
