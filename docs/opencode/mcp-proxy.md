# MCP Proxy — Semantic Tool Filter & Security Layer

## Problem

MCP tools from remote servers (Composio, Context7) inject tool descriptions directly into the LLM context. This causes:

1. **Context bloat** — Each tool adds 200-500 tokens. 5 servers × 30 tools = 30K-60K tokens overhead
2. **Tool poisoning** — Malicious tool descriptions can embed prompt injection payloads
3. **Tool interference** — Too many tools cause models to hallucinate or select wrong tools

## Solution Architecture

```
OpenCode
    ↓ (spawns)
node .opencode/proxy/index.js --target=composio  ← MCP stdio server
node .opencode/proxy/index.js --target=context7  ← MCP stdio server
    ↓
Proxy (sanitizes + filters)
    ↓ (HTTP)
Remote MCP servers (Composio, Context7)
```

## Components

```
.opencode/proxy/
├── index.js       # MCP stdio server — sanitizes, caches, forwards
├── sanitize.js    # Injection pattern detection + truncation
├── semantic.js    # Embedding-based tool filtering (optional)
├── targets.js     # Remote MCP endpoint configuration
├── cache.json      # Persistent embedding cache
└── package.json   # Dependencies
```

## Security: sanitize.js

The sanitization module blocks:

| Severity | Patterns |
|----------|----------|
| Critical | `ignore previous`, `system:`, `<system>`, `override`, authority framing (`**[CRITICAL]**`) |
| High | Unicode invisible chars (`\u200B-\u200D`), sensitive paths (`~/.ssh`, `/etc/passwd`) |
| Medium | Credential keywords, excessive whitespace |

**Truncation:** Descriptions capped at 500 chars with `...` suffix.

**FSP Defense:** Recursively sanitizes `inputSchema` descriptions — attackers hide injections in parameter descriptions.

## Setup

```bash
# 1. Install dependencies (one time)
cd .opencode/proxy && npm install

# 2. Set API keys (in your shell profile or .env)
export COMPOSIO_API_KEY=tu_key
export CONTEXT7_API_KEY=tu_key
```

## How It Works

### tools/list Flow

```
OpenCode → "list tools" (JSON-RPC over stdio)
    ↓
fetchRemoteTools() → HTTP POST to remote MCP endpoint
    ↓
Cache check (5 min TTL)
    ↓
sanitizeToolList(rawTools) → strips injection patterns, truncates descriptions
    ↓
filterTools() → semantic embedding filter (TOP_K=8, threshold=0.25)
    ↓
{ tools: [...] } → OpenCode → LLM context
```

### tools/call Flow

```
OpenCode → "call tool X" (JSON-RPC over stdio)
    ↓
Forward to remote MCP endpoint (no filtering — model decided)
    ↓
Check res.ok + data.error
    ↓
Return result or throw error
```

## Configuration

### opencode.jsonc (MCP section)

```jsonc
"mcp": {
  "composio": {
    "type": "local",
    "command": ["node", ".opencode/proxy/index.js", "--target=composio"],
    "enabled": true
  },
  "context7": {
    "type": "local",
    "command": ["node", ".opencode/proxy/index.js", "--target=context7"],
    "enabled": true
  }
}
```

### Per-Agent Permissions

```jsonc
"agent": {
  "researcher": {
    "permission": {
      "context7_*": "ask"  // Prompts before using context7 tools
    }
  },
  "developer": {
    "permission": {
      "context7_*": "ask"
    }
  }
}
```

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `COMPOSIO_API_KEY` | Composio API key fallback | - |
| `CONTEXT7_API_KEY` | Context7 API key fallback | - |
| `PROXY_TASK_CONTEXT` | Task context for semantic filtering | `""` |
| `PROXY_TOP_K` | Max tools to return | `8` |
| `PROXY_THRESHOLD` | Min similarity score | `0.25` |

## Why Proxy Over Direct MCP?

| Aspect | Direct Remote MCP | Proxy |
|--------|-------------------|-------|
| Tool filtering | None | Semantic TOP_K |
| Injection sanitization | None | Regex blocklist + truncation |
| Description truncation | None | 500 char cap |
| Cache | None | 5 min TTL |
| Error handling | Basic | Full with fallback |
| Auth | Per-request | Centralized in targets.js |

## Troubleshooting

### Proxy won't start

```bash
# Verify dependencies installed
ls .opencode/proxy/node_modules/@modelcontextprotocol/sdk

# Test manually
node .opencode/proxy/index.js --target=context7
# Should log: [proxy:context7] listo
```

### No tools appear in chat

1. Check proxy started: Look for `[proxy:context7] listo` in logs
2. Verify API keys set: `echo $CONTEXT7_API_KEY`
3. Check network: Can the proxy reach `mcp.context7.com`?

### Tools don't match task

The semantic filter uses `PROXY_TASK_CONTEXT`. If empty (default), all tools are returned. This is intentional as safe fallback.

### Injection detected in logs

```
[sanitize] INJECTION DETECTED: ignore-previous, system-injection
```

The tool description is replaced with `[Description blocked — potential injection detected]`.

## Future Enhancements

1. **RAG-MCP** — Vector store for tool retrieval (3x accuracy improvement)
2. **LLM Judge** — Secondary model to vet flagged descriptions
3. **Per-tool allowlist** — Explicitly permit known-safe tools only