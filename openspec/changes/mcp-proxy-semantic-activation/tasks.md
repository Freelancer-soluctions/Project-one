## 1. Context Propagation Plugin

- [ ] 1.1 Create `.opencode/plugins/context-propagator.ts` (~40 LOC) with `tool.execute.before` hook on `task` tool that writes `subagent_type||description` to `.opencode/proxy/current-task.txt`

## 2. Proxy File-Read Integration

- [ ] 2.2 Modify `.opencode/proxy/index.js` — update `getCurrentTaskContext()` to read `.opencode/proxy/current-task.txt` (replace env var impl, +8 LOC) with env var fallback for testing
- [ ] 2.3 Modify `.opencode/proxy/index.js` — parse `||` separator using first-occurrence split:
  ```
  const sep = content.indexOf('||')
  const description = sep >= 0 ? content.slice(sep + 2) : content
  ```
  Note: DO NOT use `split('||')[1]` — embedded `||` in description (e.g., "Fix a || b evaluator") would be truncated.

## 3. Semantic Filter Tuning

- [ ] 3.1 Modify `.opencode/proxy/semantic.js` — change `TOP_K` default from `8` to `3`
- [ ] 3.2 Modify `.opencode/proxy/semantic.js` — remove safe-fallback padding (lines 68-89): delete ALL-tools fallback, return `[]` if no matches
  - [ ] Validate `THRESHOLD=0.25` produces >=3 matches for typical task descriptions (test with samples: "implement auth", "review code", "debug logging"). If <3 consistently, adjust to 0.20 or 0.15 (per-server, for our tool counts). Document decision in design.md.
- [ ] 3.3 Add cold-cache guard in `filterTools()` at `semantic.js`: if `Object.keys(toolEmbeddingCache).length === 0` then return `allTools` (skip filter layer). Log `[MCP-PROXY] COLD CACHE — returning all tools while embeddings build`.

## 4. Proxy Activation in Opencode Config

- [ ] 4.1 Modify `opencode.jsonc` — swap `mcp` section: comment out remote URLs (lines 222-239), uncomment local proxy entries (lines 241-258)
- [ ] 4.2 Modify `opencode.jsonc` — add `./.opencode/plugins/context-propagator.ts` to `plugin` array

## 5. Housekeeping

- [ ] 5.1 Create/modify `.opencode/.gitignore` — add `.opencode/proxy/current-task.txt` entry

## 6. Documentation

- [ ] 6.1 Update `docs/opencode/mcp-proxy.md` — replace env var references with file-based IPC, update K to 3, eliminate safe-fallback section, add plugin registration

## 7. Smoke Test

- [ ] 7.1a (happy path) Invoke `@developer: test task`, verify `.opencode/proxy/current-task.txt` contains "developer||test task", verify proxy log shows "X total → 3 filtradas → 3 sanitizadas"
- [ ] 7.1b (negative) Manually delete `current-task.txt`, invoke subagent, verify proxy returns `{ tools: [] }` + logs WARNING
- [ ] 7.1c (cold cache) Delete `.opencode/proxy/cache.json`, invoke subagent, verify proxy returns ALL tools on FIRST call (cold-cache guard) + logs "COLD CACHE — returning all tools"; verify second call returns filtered tools
