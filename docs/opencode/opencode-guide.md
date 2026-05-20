# OpenCode — Compact Reference Guide

> **Project:** project-one  
> **Purpose:** Quick reference for OpenCode configuration, agents, commands, skills, MCP, and plugins.  
> **Source:** Official docs at [github.com/anomalyco/opencode](https://github.com/anomalyco/opencode)

---

## 1. Configuration (`opencode.jsonc`)

Single config file at project root. Schema: `https://opencode.ai/config.json`. All fields optional.

```jsonc
{
  "$schema": "https://opencode.ai/config.json",
  "default_agent": "orchestrator",
  "model": "provider/model-id",
  "small_model": "provider/model-id",
  "shell": "/bin/zsh",
  "logLevel": "DEBUG | INFO | WARN | ERROR",
  "autoupdate": true,
  "snapshot": true,
  "instructions": ["AGENTS.md", "docs/style.md"],
  "skills": { "paths": [".opencode/skills", ".agents/skills"] },
  "tool_output": {
    "max_lines": 200,
    "max_bytes": 8192
  },
  "compaction": {
    "auto": true,
    "prune": true,
    "reserved": 10000
  },
  "watcher": {
    "ignore": ["node_modules/**", ".git/**", "dist/**", "coverage/**", "build/**"]
  },
  "experimental": {
    "mcp_timeout": 30000
  },
  "permission": {
    "read": "allow",
    "write": "deny",
    "edit": "deny",
    "bash": "deny",
    "glob": "allow",
    "grep": "allow",
    "webfetch": "deny",
    "websearch": "deny",
    "question": "deny",
    "task": "deny",
    "skill": "allow",
    "lsp": "deny",
    "todowrite": "allow",
    "doom_loop": "ask",
    "external_directory": "ask"
  },
  "provider": { /* see §2 */ },
  "agent": { /* see §3 */ },
  "command": { /* see §4 */ },
  "mcp": { /* see §6 */ },
  "plugin": [ /* see §7 */ ]
}
```

---

## 2. Providers

Configure AI model providers. Multiple providers supported; OpenCode auto-fails over.

```jsonc
"provider": {
  "anthropic": {
    "name": "Anthropic",
    "options": { "apiKey": "{env:ANTHROPIC_API_KEY}" }
  },
  "openai": {
    "name": "OpenAI",
    "options": { "apiKey": "{env:OPENAI_API_KEY}" }
  },
  "ollama-local": {
    "npm": "@ai-sdk/openai-compatible",
    "name": "Ollama Local",
    "options": { "baseURL": "http://127.0.0.1:11434" },
    "models": {
      "qwen2.5-coder:7b": { "name": "Qwen 2.5 Coder 7B" }
    }
  }
}
```

Model ID format: `provider/model-name` (e.g., `anthropic/claude-sonnet-4-6`, `opencode/big-pickle`).

---

## 3. Agents

### 3.1 Agent Schema

```jsonc
"agent": {
  "agent-name": {
    "mode": "primary | subagent",
    "model": "provider/model-id",
    "description": "What this agent does",
    "prompt": "Inline text or {file:path/to/prompt.md}",
    "steps": 25,               // Max agentic iterations. Controls cost + response time.
    "temperature": 0,          // Deterministic output (omit for creative agents)
    "permission": {
      "read": "allow | deny | ask",
      "write": "allow | deny | ask",
      "edit": "allow | deny | ask",
      "bash": "allow | deny | ask | {\"pattern\":\"value\"}",
      "webfetch": "allow | deny | ask",
      "question": "allow | deny | ask",
      "skill": "allow | deny | ask",
      "task": {                // Subagent invocation control
        "*": "deny",           // Deny all by default
        "spec-manager": "allow",
        "developer": "ask"     // Ask user before delegating
      }
    }
  }
}
```

> **Inheritance:** Tools not listed in agent `permission` inherit from global defaults (root-level `permission` block). Agent values are deep-merged with global defaults.

### 3.2 Steps Behavior

`steps` limits **agentic turns** (think + respond cycles). Each turn = 1 AI generation.

- Default: infinite (no limit)
- When steps exhausted: agent **stops silently** — no error, no recovery, no orchestrator notification
- Used for: cost control, preventing runaway agents, ensuring timely responses
- Recommendation: set based on real workflow traces (see agent-architecture-analysis.md §4.7)

### 3.3 Modes

| Mode | Description | Invoked by |
|------|-------------|------------|
| `primary` | Main agent, receives user requests | User directly |
| `subagent` | Specialized agent, cannot be called directly | Only by other agents via `task` tool |

### 3.4 Tools vs Permissions

| Field | Scope | Values |
|-------|-------|--------|
| `tools.write` (deprecated) | Can create files | `bool` |
| `tools.edit` (deprecated) | Can modify files | `bool` |
| `tools.bash` (deprecated) | Can execute shell | `bool` |
| `permission.read` | Read files | `allow`/`deny`/`ask` |
| `permission.write` | Create files | `allow`/`deny`/`ask` |
| `permission.edit` | Modify files | `allow`/`deny`/`ask` |
| `permission.bash` | Execute shell | `allow`/`deny`/`ask` or `{"git *": "allow", "*": "deny"}` |
| `permission.webfetch` | Fetch URLs | `allow`/`deny`/`ask` |
| `permission.question` | Ask user questions | `allow`/`deny`/`ask` |
| `permission.skill` | Load skills | `allow`/`deny`/`ask` |
| `permission.task` | Subagent delegation | glob object |

> **Note:** `tools` (boolean) is deprecated. Use `permission` (allow/deny/ask) instead. OpenCode uses default-allow: all tools implicitly allowed unless explicitly denied.

### 3.5 Example: Orchestrator + Subagents (overrides only)

> Agents only declare tools that differ from global defaults. All other tools inherit from root-level `permission` block.

```jsonc
"agent": {
  "orchestrator": {
    "mode": "primary",
    "model": "opencode/big-pickle",
    "prompt": "{file:docs/opencode/prompts/orchestrator.md}",
    "steps": 45,
    "permission": {
      "question": "allow",
      "task": { "*": "deny", "spec-manager": "allow", "planner": "allow", "developer": "allow", "reviewer": "allow", "researcher": "allow", "git-manager": "allow", "project-manager": "allow" }
    }
  },
  "developer": {
    "mode": "subagent",
    "model": "opencode/qwen3.6-plus-free",
    "prompt": "{file:docs/opencode/prompts/developer.md}",
    "steps": 25,
    "permission": {
      "write": "allow", "edit": "allow", "bash": "allow",
      "webfetch": "allow", "websearch": "allow", "question": "allow", "lsp": "allow"
    }
  },
  "git-manager": {
    "mode": "subagent",
    "model": "nvidia/minimaxai/minimax-m2.7",
    "prompt": "{file:docs/opencode/prompts/git-manager.md}",
    "steps": 20,
    "permission": {
      "bash": { "git *": "allow", "*": "deny" },
      "todowrite": "deny"
    }
  },
  "spec-manager": {
    "mode": "subagent",
    "model": "nvidia/minimaxai/minimax-m2.7",
    "prompt": "{file:docs/opencode/prompts/spec-manager.md}",
    "steps": 15,
    "permission": { "bash": "allow" }
  },
  "planner": {
    "mode": "subagent",
    "model": "opencode/ring-2.6-1t-free",
    "prompt": "{file:docs/opencode/prompts/planner.md}",
    "steps": 15,
    "permission": { "write": "allow", "question": "allow" }
  },
  "reviewer": {
    "mode": "subagent",
    "model": "opencode/nemotron-3-super-free",
    "prompt": "{file:docs/opencode/prompts/reviewer.md}",
    "steps": 10,
    "permission": { "lsp": "allow" }
  },
  "researcher": {
    "mode": "subagent",
    "model": "opencode/minimax-m2.5",
    "prompt": "{file:docs/opencode/prompts/researcher.md}",
    "steps": 12,
    "permission": { "webfetch": "allow", "websearch": "allow", "question": "allow" }
  },
  "project-manager": {
    "mode": "subagent",
    "model": "nvidia/minimaxai/minimax-m2.7",
    "prompt": "{file:docs/opencode/prompts/project-manager.md}",
    "steps": 15,
    "permission": { "question": "allow" }
  }
}
```

---

## 4. Commands

### 4.1 Inline Definition (in `opencode.jsonc`)

```jsonc
"command": {
  "test": {
    "template": "Run full test suite with coverage. Show failures. Suggest fixes.",
    "description": "Run tests with coverage",
    "agent": "build",
    "model": "anthropic/claude-sonnet-4-6"
  }
}
```

### 4.2 Markdown Files (`.opencode/commands/<name>.md`)

```markdown
---
description: Group changes into Conventional Commits
---

Group all current changes into meaningful Conventional Commits.

Flow:
1. Inspect repo state: `git status`, `git diff`, `git log`
2. Group related files by intent
3. Commit each group with Conventional Commit format
4. Summarize results
```

> **Note:** File extension determines directory. Our project uses `.opencode/command/` (singular). Official docs reference `.opencode/commands/` (plural). Verify which your OpenCode version expects.

### 4.3 Built-in Commands

| Command | Purpose |
|---------|---------|
| `/init` | Initialize OpenCode in directory |
| `/undo` | Undo last action |
| `/redo` | Redo undone action |
| `/share` | Share conversation |
| `/help` | Show help |

Custom commands can override built-in commands by name.

### 4.4 Frontmatter Properties

| Property | Required | Description |
|----------|----------|-------------|
| `description` | ✅ | Shown in TUI command palette |
| `agent` | ❌ | Target agent for execution |
| `model` | ❌ | Override model for this command |

---

## 5. Skills

### 5.1 Discovery Paths

OpenCode loads skills from these directories (recursive, hierarchical):

| Priority | Path | Scope |
|:--------:|------|-------|
| 1 | `.opencode/skills/*/SKILL.md` | Project-specific workflow skills |
| 2 | `.agents/skills/*/SKILL.md` | Project-specific domain skills |
| 3 | `.claude/skills/*/SKILL.md` | Project-specific (legacy) |
| 4 | `~/.config/opencode/skills/*/SKILL.md` | Global user skills |
| 5 | `~/.agents/skills/*/SKILL.md` | Global domain skills |
| 6 | `~/.claude/skills/*/SKILL.md` | Global (legacy) |

### 5.2 Skill Structure

```
.opencode/skills/my-skill/
├── SKILL.md       # Required: skill instructions (YAML frontmatter optional)
├── scripts/       # Optional: helper scripts
├── reference/     # Optional: reference files
└── templates/     # Optional: templates
```

### 5.3 Skill Layers (project-one)

| Layer | Directory | Purpose | Count |
|-------|-----------|---------|:-----:|
| **Workflow (OpenSpec)** | `.opencode/skills/` | SDD lifecycle (propose, apply, verify, archive) | 11 |
| **Domain (Knowledge)** | `.agents/skills/` | Technical expertise (React, Node, TDD, security) | 15 |

### 5.4 Loading a Skill

Load via `/skill` command in conversation:
```
/skill grill-me
/skill caveman
/skill nodejs-backend-patterns
```

### 5.5 Installing External Skills

Use `find-skills` skill to discover, then install from GitHub:
```jsonc
// .opencode/skills-lock.json auto-generated on install
```

### 5.6 Auto-Invoke

Skills can be auto-triggered when detecting specific developer actions (configured in `AGENTS.md` auto-invoke tables). Example: loading `owasp-security-check` when auditing security pre-merge.

---

## 6. MCP (Model Context Protocol)

### 6.1 Remote MCP Server

```jsonc
"mcp": {
  "composio": {
    "type": "remote",
    "url": "https://connect.composio.dev/mcp",
    "oauth": {},
    "enabled": true
  },
  "context7": {
    "type": "remote",
    "url": "https://mcp.context7.com/mcp",
    "headers": { "CONTEXT7_API_KEY": "{env:CONTEXT7_API_KEY}" },
    "enabled": true
  }
}
```

### 6.2 Local MCP Server (stdio)

```jsonc
"mcp": {
  "playwright": {
    "type": "local",
    "command": ["npx", "-y", "@playwright/mcp"],
    "enabled": true,
    "env": {}
  }
}
```

### 6.3 MCP Properties

| Property | Type | Required | Description |
|----------|------|:--------:|-------------|
| `type` | `"local"` \| `"remote"` | ✅ | Connection type |
| `url` | string | for `remote` | SSE endpoint URL |
| `command` | string[] | for `local` | Command + args for stdio |
| `headers` | object | ❌ | HTTP headers for remote |
| `oauth` | object | ❌ | OAuth config |
| `env` | object | ❌ | Environment variables (local) |
| `enabled` | bool | ❌ | Enable/disable (default: true) |

---

## 7. Plugins

```jsonc
"plugin": [
  "@warp-dot-dev/opencode-warp",
  "opencode-gemini-auth",
  "opencode-foo@1.2.3",
  "./local-plugin.ts",
  ["opencode-bar", { "option": "value" }]
]
```

Plugins can be:
- npm package names (`@scope/name`)
- npm package with version (`name@1.2.3`)
- Local file paths (`./local-plugin.ts`)
- Tuples with options (`["name", { opt: "val" }]`)

---

## 8. Permissions System

### 8.1 Global Permissions

Apply to all agents unless overridden at agent level:
```jsonc
"permission": {
  "edit": "deny",
  "bash": { "git *": "allow", "*": "ask" }
}
```

### 8.2 Permission States

| State | Description |
|-------|-------------|
| `allow` | Auto-approved, no user prompt |
| `deny` | Rejected, tool call fails |
| `ask` | User prompted for approval |
| `auto` | Session-wide auto-approval (non-interactive) |

### 8.3 Permission Events (Go internals)

```
Pending → Approved (user granted)
Pending → Denied (user rejected)
Any → Auto (session has auto-approval)
```

---

## 9. Project-Specific Differences

| Aspect | Official Docs | project-one | Notes |
|--------|---------------|-------------|-------|
| Command dir | `.opencode/commands/` | `.opencode/command/` | Verify compatibility |
| Skill paths | `.opencode/skills/`, `.agents/skills/` | Both used | ✅ Aligned |
| Subagent mode | Documented as `"mode": "subagent"` | Used correctly | ✅ |
| Tools vs Permissions | Both `tools` (bool) and `permission` (allow/deny/ask) | Uses `permission` only | `permission` is newer/richer, `tools` deprecated |
| Global defaults + overrides | Not required (default-allow) | 15 tools at root, agents override only diffs | Inheritance model for config size reduction |
| `steps` | "limit max agentic iterations" | Configured per agent (range: 10-45) | ✅ Aligned |
| MCP | remote + local supported | 2 remote MCPs | ✅ |

---

## 10. Quick Troubleshooting

| Problem | Likely Cause | Fix |
|---------|-------------|-----|
| Agent stops mid-task | `steps` too low | Trace workflow turns, increase |
| Command not found | Wrong directory name | Check `.opencode/command/` vs `.opencode/commands/` |
| Skill not loading | Wrong path or missing SKILL.md | Verify `skills/*/SKILL.md` exists |
| MCP not connecting | Missing API key or OAuth | Check env vars, re-auth |
| Agent ignores instructions | Prompt file path wrong | Verify `{file:path}` resolves |

---

> **Reference:** [github.com/anomalyco/opencode](https://github.com/anomalyco/opencode) — Official docs, agents.mdx, config.mdx, commands.mdx, skills.mdx  
> **Generated:** May 18, 2026 — from project-one codebase analysis + Context7 documentation queries
