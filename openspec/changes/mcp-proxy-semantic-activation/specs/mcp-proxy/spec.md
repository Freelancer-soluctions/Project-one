## ADDED Requirements

### Requirement: Semantic Tool Filtering
The proxy SHALL filter tools based on semantic relevance to the current task context.

#### Scenario: Tools filtered by relevance to task
- **WHEN** proxy receives tools/list request AND current-task.txt exists AND has content
- **THEN** proxy SHALL embed the description portion (after `||` separator) using all-MiniLM-L6-v2
- **THEN** proxy SHALL compute cosine similarity against cached tool embeddings
- **THEN** proxy SHALL return only top-3 tools scoring >= THRESHOLD (default 0.25)
- **WHEN** fewer than 3 tools meet threshold
- **THEN** proxy SHALL return only those tools that meet threshold (NO padding to reach 3)

#### Scenario: Cold-cache guard returns all tools on first call
- **WHEN** `tools/list` is called AND `toolEmbeddingCache` is empty (cold cache)
- **THEN** proxy SHALL skip semantic filtering
- **THEN** proxy SHALL return sanitized full tool list via `sanitizeToolList(allTools)`
- **THEN** proxy SHALL continue building embedding index in background
- **WHEN** subsequent `tools/list` calls arrive AND cache is populated
- **THEN** proxy SHALL apply semantic filtering normally

#### Scenario: Sanitize layer runs after filtering
- **WHEN** proxy returns filtered tools list
- **THEN** `sanitizeToolList()` SHALL run on each tool description and `inputSchema`
- **THEN** any flagged injection patterns SHALL be replaced with `[FILTERED]`
- **THEN** truncated descriptions SHALL be capped at 500 chars

### Requirement: Safe-Fallback Elimination
The proxy SHALL NOT return all tools when no task context is available.

#### Scenario: No context returns empty tool list
- **WHEN** current-task.txt missing OR empty
- **THEN** proxy SHALL log warning `[MCP-PROXY] WARNING: No task context`
- **THEN** proxy SHALL return empty tool list `{ tools: [] }`

### Requirement: Task Context Propagation (Plugin)
A plugin SHALL capture and propagate task context before subagent session starts.

#### Scenario: Plugin writes context before subagent
- **WHEN** orchestrator invokes `task` tool with subagent_type and description
- **THEN** `tool.execute.before` hook SHALL synchronously write `subagent_type||description` to `.opencode/proxy/current-task.txt` BEFORE subagent session starts

#### Scenario: Plugin write failure does not block task
- **WHEN** plugin fails to write context file (e.g., disk error)
- **THEN** plugin SHALL log error and NOT block the task invocation

#### Scenario: Description may contain embedded `||` tokens
- **WHEN** `current-task.txt` content contains `||` token within the description portion (e.g., "developer||Fix a || b evaluator")
- **THEN** proxy SHALL parse using first-occurrence split (`content.indexOf('||')`)
- **THEN** proxy SHALL pass the full description including the embedded `||` to the embedding model

#### Scenario: Plugin write failure cascades to empty tools (degraded mode)
- **WHEN** `tool.execute.before` hook fails to write `current-task.txt` (e.g., disk error, permission denied)
- **THEN** hook SHALL log error to stderr (non-blocking)
- **THEN** task tool invocation SHALL proceed (subagent session starts)
- **WHEN** subagent calls `tools/list` on proxy AND `current-task.txt` does NOT exist
- **THEN** proxy SHALL return `{ tools: [] }` (empty list)
- **THEN** subagent SHALL operate without remote MCP tools (degraded mode)

### Requirement: Proxy Activation in Opencode Config
The proxy SHALL be wired as a local stdio MCP server and the plugin SHALL be registered at startup.

#### Scenario: Proxy starts as local stdio server
- **WHEN** opencode.jsonc `mcp.composio` is local-type with command `node .opencode/proxy/index.js --target=composio`
- **THEN** proxy SHALL start as stdio MCP server and intercept all tools/list and tools/call for composio

#### Scenario: Plugin loads at opencode startup
- **WHEN** `plugin` array in opencode.jsonc includes `./.opencode/plugins/context-propagator.ts`
- **THEN** plugin SHALL load at opencode startup and register tool.execute.before hook
