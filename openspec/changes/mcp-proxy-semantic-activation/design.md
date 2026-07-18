## Context

The MCP proxy at `.opencode/proxy/` was built ahead of OpenSpec documentation (SDD drift). It implements semantic tool filtering using local embeddings (`Xenova/all-MiniLM-L6-v2`) but has never been active in production because:

- `opencode.jsonc` uses direct remote MCP URLs instead of the local proxy
- Task context (`PROXY_TASK_CONTEXT`) cannot propagate to subagent processes due to opencode bugs #30892/#26332
- Safe-fallback returns ALL tools when context is empty, making the filter a no-op
- `TOP_K=8` instead of validated `K=3`, reducing token savings by ~50%

### Constraints
- opencode MCP environment block is not passed to child processes (confirmed upstream bugs)
- Plugin hooks (`tool.execute.before`) fire synchronously and are guaranteed to complete before subagent session creation
- Proxy runs as stdio MCP server (two instances: composio, context7)
- Runtime state must survive across subagent invocations but not persist across opencode restarts

## Goals / Non-Goals

**Goals:**
- Activate semantic tool filtering to reduce per-subagent context by ~82% (article's own data: 1557→275 tokens per server); production systems report up to 89% (rconnect.tech, 2025)
- Eliminate ALL-tools safe-fallback that bypasses the filter
- Establish file-based IPC pattern for task context propagation (env var workaround)
- Wire proxy into `opencode.jsonc` with plugin registration
- Update documentation to reflect the active architecture

**Non-Goals:**
- Runtime "operation success hallucination" verification (separate future change)
- Two-stage retrieval / meta-tool architecture (smartmcp pattern)
- HTTP MCP server transport migration
- Embedding model upgrade (bge-small-en-v1.5)
- Unit tests for proxy modules (separate change following activation)

## Decisions

### Decision 1: File-based IPC over env vars
- **Chosen**: Write `subagent_type||description` to `.opencode/proxy/current-task.txt` synchronously via plugin hook
- **Rejected**: `PROXY_TASK_CONTEXT` env var set in `opencode.jsonc` `mcp.<name>.environment` block
- **Rationale**: opencode bugs #30892/#26332 confirmed that MCP environment variables are NOT forwarded to child subagent processes. File IPC is synchronous (written before subagent starts) and the file is scoped to the proxy runtime. Env var approach was the original design but never worked.
- **File path**: `.opencode/proxy/current-task.txt` — inside the proxy directory, added to `.opencode/.gitignore`
- **Precedence**: File wins (runtime context per delegation). Env var fallback applies only when file is missing OR empty. Rationale: file is dynamic per task invocation; env var is static and primarily for testing.

### Decision 2: Synchronous plugin hook over async alternatives
- **Chosen**: `tool.execute.before` hook on `task` tool writes file synchronously
- **Rejected**: Async file write, env var set in parent process, subprocess spawning
- **Rationale**: The `tool.execute.before` hook fires synchronously and completes BEFORE the subagent session starts. This guarantees the context file exists when the proxy handles `tools/list`. No race condition.
- **Error handling**: Plugin logs error on disk failure but does NOT block the task invocation (fail-open)
- **Parsing rule**: First-occurrence `||` split, not array split. Proxy SHALL use `content.indexOf('||')` to find the first separator, then `content.slice(sep + 2)`. Rationale: LLM task descriptions may contain `||` tokens (string operators, conditional expressions) — `split('||')[1]` would prematurely truncate.

### Decision 3: K=3 over K=8
- **Chosen**: `TOP_K = 3` (dropped from 8)
- **Rejected**: K=5, K=8, dynamic K based on tool count
- **Rationale**: AWS article validates K=3 (29 tools → 1557→275 tokens, ~82% reduction from article's own tests). arXiv:2603.20313 confirms 97.1% hit rate @ K=3 across 121 tools. K=8 keeps ~50% more tokens with marginal recall gain.
- **Threshold adjustable**: `THRESHOLD=0.25` is default but MAY be adjusted per-server after validation. If representative task descriptions yield <3 qualifying tools consistently, lower to 0.20 or 0.15. Document per-server value.

### Decision 4: Empty return on no context (no padding)
- **Chosen**: Return `{ tools: [] }` when context is missing or empty
- **Rejected**: Return ALL tools as safe-fallback (current behavior)
- **Rationale**: Smartmcp reference implementation returns empty on no context — padding is confirmed anti-pattern. If the proxy has no context, it cannot meaningfully filter, and returning all tools defeats the purpose. The subagent will see 0 tools, which is a signal to the orchestrator that context was not provided.

### Decision 5: Preserve embedding model
- **Chosen**: Keep `Xenova/all-MiniLM-L6-v2` (same model from original implementation)
- **Rejected**: Upgrade to `bge-small-en-v1.5` or OpenAI `text-embedding-3-small`
- **Rationale**: Model is already loaded, cached, and working. Upgrade yields marginal accuracy gains vs. activation delay. Model upgrade is documented as future enhancement.
- **Note**: Manual `cosineSimilarity()` replaces FAISS `IndexFlatL2` from the article. With L2-normalized embeddings (`normalize: true` at `semantic.js:28`), ranking by cosine similarity produces identical top-K ordering to FAISS `IndexFlatL2`. Substitution is required by the JavaScript runtime (FAISS is Python-only) and has no effect on results.

### Decision 6: OAuth unchanged
- **Chosen**: Preserve OAuth flow in `targets.js` (unchanged)
- **Rationale**: Auth works independently of filtering. No changes needed.

### Decision 7: Cold-Cache Guard on startup
- **Chosen**: Return ALL tools on first `tools/list` call when `toolEmbeddingCache` is empty (cold cache), while building embedding index in background.
- **Rejected**: Await `buildToolIndex()` before responding — would block `tools/list` for 2+ minutes with 30+ tools on slow embedding init.
- **Rationale**: `buildToolIndex()` at `.opencode/proxy/index.js:81` is fire-and-forget (non-awaited, `.catch()` only). On cold start (fresh clone, no `cache.json`), `toolEmbeddingCache = {}` causes all tools to score 0.0 against threshold, silently returning `[]`. The guard ensures subagent sees the full tool list on first invocation while embeddings initialize in background. Subsequent calls use populated cache for filtered results.

### Limitation: Accuracy ceiling (per AWS article + arXiv:2601.05214)
Semantic tool selection achieves **up to 86.4% accuracy** in production with hundreds of tools and ambiguous queries. Complex domains with overlapping tool semantics remain challenging — relevant to composio's 30+ MCP tools where multiple operations may describe similar actions (e.g., `create_issue` vs `update_issue` in Jira/Linear). This change reduces token waste and tool selection errors but **does not eliminate them**. Semantic filtering primarily mitigates:
- Function selection errors (mode 1) — by reducing N options to ≤3
- Tool bypass behavior (mode 4) — fewer tools = less temptation to generate output instead of calling

Parameter errors (mode 2), completeness errors (mode 3), and operation success hallucination (mode 5) require additional defenses planned in article's Parts 3-4 as separate future changes.

## Architecture Flow

```
Orchestrator calls task tool
  │ subagent_type="developer", description="Implement JWT auth"
  ▼
[Plugin: context-propagator.ts]
  tool.execute.before hook fires SYNCHRONOUSLY
  │ writes "developer||Implement JWT auth" → .opencode/proxy/current-task.txt
  ▼
Subagent session created (file already exists)
  │ subagent requests MCP tools → tools/list
  ▼
[Proxy: index.js]
  getCurrentTaskContext() reads current-task.txt
  │ strips "developer||" prefix → filterQuery = "Implement JWT auth"
  ▼
[Proxy: semantic.js]
  embed(filterQuery) → cosine similarity vs cached tool embeddings
  │ top-K=3, threshold=0.25
  ▼
{ tools: [3 best matches] } → subagent
  │ subagent sees only relevant tools
  ▼
Subagent calls tools/cool → proxy forwards to remote MCP
```

## Risks / Trade-offs

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| [R1] Plugin write fails (disk error) | Low | Subagent sees 0 tools | Plugin logs error, fail-open (does NOT block task) |
| [R2] File read race condition | Very Low | Stale or no context | Sync hook guarantees file written before subagent starts |
| [R3] Plugin not loaded | Medium | Context file never written | Add to opencode.jsonc `plugin` array; verify on startup |
| [R4] no context → 0 tools | Medium | Subagent has no MCP access | Intentional — orchestrator must provide task context |
| [R5] Embedding cache stale | Low | Mismatched tool ranking | buildToolIndex rebuilds on new tools; cache.json persists |
| [R6] File not cleaned between tasks | Low | Stale context from prior task | Each `task` tool call overwrites the file |

## Migration Plan

1. **Create plugin**: Write `.opencode/plugins/context-propagator.ts` (~40 LOC)
2. **Modify proxy**: Update `getCurrentTaskContext()` in `index.js` to read file; parse `||` separator
3. **Fix semantic.js**: Change `TOP_K` default 8→3; remove safe-fallback padding (lines 68-89 rewrite)
4. **Wire proxy**: Swap `opencode.jsonc` mcp section from remote to local proxy commands
5. **Register plugin**: Add `./.opencode/plugins/context-propagator.ts` to plugin array in `opencode.jsonc`
6. **Gitignore**: Add `.opencode/proxy/current-task.txt` to `.opencode/.gitignore`
7. **Update doc**: Revise `docs/opencode/mcp-proxy.md` with file IPC pattern, K=3, no fallback
8. **Smoke test**: Start opencode, invoke task, verify file written and proxy filters

Rollback: Revert `opencode.jsonc` changes, remove plugin entry, restore remote URLs.

## Open Questions

- None identified. All design decisions are documented with rationale.
