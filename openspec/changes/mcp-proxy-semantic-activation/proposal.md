## Why

Custom MCP proxy exists at `.opencode/proxy/` implementing semantic tool filtering (AWS article strategy) but is currently dormant and never activated:

- Proxy unwired in `opencode.jsonc` — commented-out entries replaced by direct remote URLs
- `TOP_K=8` (AWS article validates `K=3`; at current setting loses ~50% token savings from filter)
- Safe-fallback at `semantic.js:69` returns ALL tools when `PROXY_TASK_CONTEXT` empty → semantic filter effectively never runs
- `PROXY_TASK_CONTEXT` env var never propagated to subagent processes due to opencode bugs #30892/#26332 (MCP environment block not passed to child processes)
- No OpenSpec change exists for proxy — built without specification (SDD drift)

Without activation, the monorepo incurs unnecessary token overhead from all remote MCP tools being injected into every subagent context (30+ tools per server).

## What Changes

1. **New plugin** — `.opencode/plugins/context-propagator.ts`: hooks `tool.execute.before` on `task` tool, synchronously writes `subagent_type||description` to `.opencode/proxy/current-task.txt` before subagent session starts (file-based IPC avoids env var propagation bugs)
2. **Proxy reads file** — `getCurrentTaskContext()` in `index.js` updated to read `current-task.txt` with env var fallback for testing
3. **Fix TOP_K** — `8` → `3` in `semantic.js` (validated by AWS article: 29 tools → 1557→275 tokens, ~89% reduction)
4. **Kill safe-fallback** — Remove ALL-tools padding when semantic filter returns < 3 results; return empty array if no matches
5. **Wire proxy** — Swap `opencode.jsonc` MCP section from remote URLs back to local proxy commands
6. **Register plugin** — Add `./.opencode/plugins/context-propagator.ts` to `opencode.jsonc` `plugin` array
7. **Gitignore runtime file** — Add `.opencode/proxy/current-task.txt` to `.opencode/.gitignore`
8. **Update documentation** — `docs/opencode/mcp-proxy.md` to reflect file-based IPC, K=3, no safe-fallback

## Capabilities

### New Capabilities
- `mcp-proxy`: Semantic tool activation layer — synchronously captures task context via file IPC, embeds task descriptions for cosine-similarity filtering, and returns only top-3 relevant tools per subagent invocation

### Modified Capabilities
<!-- No existing specs are modified — the proxy was built without spec coverage -->

## Impact

- `.opencode/proxy/index.js` — `getCurrentTaskContext()` reads file instead of env var; parses `||` separator
- `.opencode/proxy/semantic.js` — `TOP_K` default `8` → `3`; remove safe-fallback padding logic
- `opencode.jsonc` — MCP entries swapped from remote to local; plugin registration added
- `.opencode/plugins/context-propagator.ts` — new TypeScript plugin (~40 LOC)
- `.opencode/.gitignore` — new entry for runtime state file
- `docs/opencode/mcp-proxy.md` — updated architecture documentation
