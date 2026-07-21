# Engram Documentation

**Persistent Memory for AI Agents**

Engram is a persistent memory system that enables AI agents to remember decisions, discoveries, and context across sessions, compactions, and even different agent instances. It provides structured memory with full-text search, project/session detection, and cloud sync capabilities.

---

## Table of Contents

1. [What is Engram?](#what-is-engram)
2. [How It Works](#how-it-works)
3. [Installation](#installation)
4. [Agent Setup (OpenCode)](#agent-setup-opencode)
5. [MCP Tools Reference](#mcp-tools-reference)
6. [CLI Reference](#cli-reference)
7. [Session Lifecycle](#session-lifecycle)
8. [Topic Keys (Upsert Workflow)](#topic-keys-upsert-workflow)
9. [Memory Protocol](#memory-protocol)
10. [Environment Variables](#environment-variables)
11. [Configuration](#configuration)
12. [Engram vs claude-mem](#engram-vs-claude-mem)
13. [Best Practices](#best-practices)
14. [Troubleshooting](#troubleshooting)

---

## What is Engram?

### Description

Engram is a **local-first, agent-agnostic persistent memory system** designed for AI agents. Unlike traditional context windows that reset on each session, Engram stores structured observations with metadata (title, type, scope, topic_key) in a local SQLite database with FTS5 full-text search. This allows agents to:

- **Remember across sessions**: Decisions, bugs, patterns persist beyond context windows
- **Search semantically**: Find relevant past work using natural language queries
- **Track projects automatically**: Auto-detect projects from git remotes, package.json, or directory structure
- **Manage sessions**: Explicit session start/end with summaries for continuity
- **Handle conflicts**: Surface and resolve contradictory memories intelligently
- **Sync for teams**: Optional cloud sync for shared memory across team members

### Key Differentiators

| Feature | Engram | Traditional Context | claude-mem (Legacy) |
|---------|--------|---------------------|---------------------|
| **Persistence** | SQLite + FTS5 (local) | Session-only | File-based (JSON) |
| **Search** | Full-text (FTS5) + semantic | None | Basic grep |
| **Project Detection** | Auto (git, package.json, dir) | Manual | Manual |
| **Session Management** | Explicit start/end + summaries | Implicit | None |
| **Conflict Resolution** | Structured judgment workflow | None | None |
| **Cloud Sync** | Optional (team sharing) | No | No |
| **Agent Agnostic** | Yes (MCP standard) | N/A | Claude-specific |
| **Structured Memory** | Title, type, scope, topic_key | Unstructured | Basic key-value |
| **Dependencies** | Zero (single binary) | N/A | Python/Node |
| **Cross-compaction** | Survives context resets | Lost on compaction | Manual backup needed |

### Why Engram?

**For Individual Developers:**
- Never lose a design decision or bug fix again
- Resume work seamlessly after compaction or context reset
- Build a personal knowledge base that grows with you

**For Teams:**
- Share institutional memory across team members
- Onboard new developers faster with searchable project history
- Maintain consistency in architectural decisions

**For Agent Developers:**
- Standard MCP interface works with any compatible agent
- Structured memory enables better reasoning and planning
- Conflict detection prevents contradictory guidance

---

## How It Works

### The Agent Saves, Engram Stores Workflow

```
┌─────────────────┐     mem_save      ┌──────────────────┐
│   AI Agent      │ ───────────────▶  │     Engram       │
│  (OpenCode,     │   {title, type,   │  (SQLite + FTS5) │
│   Cursor, etc)  │    content, ...}  │                  │
└─────────────────┘                   └────────┬─────────┘
                                               │
                    mem_search ◀───────────────┤
              (natural language query)         │
                                               ▼
                                    ┌──────────────────┐
                                    │  Structured      │
                                    │  Observations    │
                                    │  (title, type,   │
                                    │   content, scope,│
                                    │   topic_key,     │
                                    │   project,       │
                                    │   session_id)    │
                                    └──────────────────┘
```

**Flow:**
1. **Agent encounters something worth remembering** (decision, bug fix, discovery, pattern)
2. **Agent calls `mem_save`** with structured data (title, type, content with What/Why/Where/Learned format)
3. **Engram stores** in SQLite with FTS5 indexing for full-text search
4. **Later, agent needs context** → calls `mem_search` with natural language query
5. **Engram returns** relevant observations ranked by relevance
6. **Agent reads full content** with `mem_get_observation` if needed
7. **Agent updates memory** with `mem_update` or resolves conflicts with `mem_judge`

### Project Detection Logic

Engram automatically detects the current project using this priority order:

1. **Git Remote Origin** — Extracts project name from `origin` remote URL
   - `github.com/user/repo` → project: `repo`
   - `gitlab.com/group/project` → project: `project`

2. **package.json / Cargo.toml / go.mod** — Uses `name` field
   - `{ "name": "my-app" }` → project: `my-app`

3. **Directory Name** — Falls back to current working directory name
   - `/home/user/projects/my-project` → project: `my-project`

4. **Manual Override** — Can be set via `ENGRAM_PROJECT` env var or `--project` flag

**Multi-project Workspaces:** If working in a monorepo, Engram detects the nearest `package.json` or git root. Use explicit `--project` flag to disambiguate.

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        Engram Architecture                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐      │
│  │   Agent A    │    │   Agent B    │    │   Agent C    │      │
│  │  (OpenCode)  │    │   (Cursor)   │    │  (Custom)    │      │
│  └──────┬───────┘    └──────┬───────┘    └──────┬───────┘      │
│         │                   │                   │               │
│         │      MCP (Model Context Protocol)      │               │
│         └─────────────────┬──────────────────────┘               │
│                           ▼                                       │
│              ┌────────────────────────┐                          │
│              │     Engram Server      │                          │
│              │  (Single Go Binary)    │                          │
│              │                        │                          │
│              │  ┌──────────────────┐  │                          │
│              │  │  MCP Transport   │  │                          │
│              │  │  (stdio/HTTP)    │  │                          │
│              │  └────────┬─────────┘  │                          │
│              │           │            │                          │
│              │  ┌────────▼─────────┐  │                          │
│              │  │  Core Engine     │  │                          │
│              │  │  - Project Detect│  │                          │
│              │  │  - Session Mgmt  │  │                          │
│              │  │  - Conflict Res  │  │                          │
│              │  └────────┬─────────┘  │                          │
│              │           │            │                          │
│              │  ┌────────▼─────────┐  │                          │
│              │  │  Storage Layer   │  │                          │
│              │  │  - SQLite + FTS5 │  │                          │
│              │  │  - Vector Index* │  │                          │
│              │  └────────┬─────────┘  │                          │
│              └───────────┼────────────┘                          │
│                          │                                        │
│              ┌───────────▼───────────┐                            │
│              │   Local File System   │                            │
│              │  ~/.engram/           │                            │
│              │  ├── engram.db        │                            │
│              │  ├── config.toml      │                            │
│              │  └── sessions/        │                            │
│              └───────────────────────┘                            │
│                          │                                        │
│              ┌───────────▼───────────┐                            │
│              │   Cloud Sync (Opt)    │                            │
│              │  - End-to-end encrypted│                           │
│              │  - Team workspaces    │                            │
│              │  - Conflict-free      │                            │
│              │    replication        │                            │
│              └───────────────────────┘                            │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

*Vector index is optional and requires additional dependencies.

### Project Structure

```
~/.engram/
├── engram.db              # Main SQLite database with FTS5
├── config.toml            # User configuration
├── sessions/              # Session metadata
│   ├── session-<id>.json  # Session start/end/summary
│   └── ...
├── sync/                  # Cloud sync metadata (if enabled)
│   ├── credentials.enc    # Encrypted sync credentials
│   └── state.json         # Sync state
└── logs/                  # Debug logs (rotated)
    └── engram-<date>.log
```

**Database Schema (engram.db):**

```sql
-- Main observations table
CREATE TABLE observations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'manual',
    content TEXT NOT NULL,
    scope TEXT NOT NULL DEFAULT 'project',
    topic_key TEXT,
    project TEXT NOT NULL,
    session_id TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    -- For conflict resolution
    judgment_status TEXT DEFAULT 'pending',  -- pending, judged, superseded
    judgment_id TEXT,
    -- Vector embedding (optional)
    embedding BLOB
);

-- Full-text search virtual table (FTS5)
CREATE VIRTUAL TABLE observations_fts USING fts5(
    title, content, type, topic_key,
    content='observations', content_rowid='id'
);

-- Triggers to keep FTS in sync
CREATE TRIGGER observations_ai AFTER INSERT ON observations BEGIN
    INSERT INTO observations_fts(rowid, title, content, type, topic_key)
    VALUES (new.id, new.title, new.content, new.type, new.topic_key);
END;

CREATE TRIGGER observations_ad AFTER DELETE ON observations BEGIN
    INSERT INTO observations_fts(observations_fts, rowid, title, content, type, topic_key)
    VALUES ('delete', old.id, old.title, old.content, old.type, old.topic_key);
END;

CREATE TRIGGER observations_au AFTER UPDATE ON observations BEGIN
    INSERT INTO observations_fts(observations_fts, rowid, title, content, type, topic_key)
    VALUES ('delete', old.id, old.title, old.content, old.type, old.topic_key);
    INSERT INTO observations_fts(rowid, title, content, type, topic_key)
    VALUES (new.id, new.title, new.content, new.type, new.topic_key);
END;

-- Sessions table
CREATE TABLE sessions (
    id TEXT PRIMARY KEY,
    project TEXT NOT NULL,
    directory TEXT NOT NULL,
    started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    ended_at DATETIME,
    summary TEXT,
    status TEXT DEFAULT 'active'  -- active, completed, archived
);

-- Conflict judgments table
CREATE TABLE judgments (
    id TEXT PRIMARY KEY,  -- rel-<hex>
    memory_id_a INTEGER NOT NULL,
    memory_id_b INTEGER NOT NULL,
    relation TEXT NOT NULL,  -- related, compatible, scoped, conflicts_with, supersedes, not_conflict
    confidence REAL NOT NULL,
    reasoning TEXT,
    evidence TEXT,
    judged_by TEXT,  -- 'agent' | 'user' | 'engram'
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (memory_id_a) REFERENCES observations(id),
    FOREIGN KEY (memory_id_b) REFERENCES observations(id)
);

-- Sync metadata (for cloud sync)
CREATE TABLE sync_state (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for common queries
CREATE INDEX idx_observations_project ON observations(project);
CREATE INDEX idx_observations_session ON observations(session_id);
CREATE INDEX idx_observations_topic ON observations(topic_key);
CREATE INDEX idx_observations_type ON observations(type);
CREATE INDEX idx_observations_judgment ON observations(judgment_status);
CREATE INDEX idx_sessions_project ON sessions(project);
```

### Database Configuration

**Default Location:** `~/.engram/engram.db` (Linux/macOS) or `%USERPROFILE%\.engram\engram.db` (Windows)

**Custom Location:** Set via `ENGRAM_DB_PATH` environment variable or `--db-path` CLI flag.

**SQLite Pragmas (Auto-configured):**
```sql
PRAGMA journal_mode = WAL;           -- Write-Ahead Logging for concurrency
PRAGMA synchronous = NORMAL;         -- Balance safety/performance
PRAGMA cache_size = -32768;          -- 32MB cache
PRAGMA temp_store = MEMORY;          -- Temp tables in memory
PRAGMA mmap_size = 268435456;        -- 256MB mmap
PRAGMA page_size = 4096;             -- 4KB pages
```

**FTS5 Configuration:**
- Tokenizer: `unicode61` (Unicode-aware, good for code)
- Prefix indexing: Enabled for 2-3 character prefixes
- Contentless: No (stores content for snippet generation)

---

## Installation

### macOS / Linux (Homebrew)

```bash
# Tap and install
brew tap engram-memory/engram
brew install engram

# Verify installation
engram --version
```

### Windows

**Option 1: Go Install (Recommended if Go toolchain present)**
```powershell
go install github.com/engram-memory/engram/cmd/engram@latest
# Ensure $env:GOPATH/bin or $env:GOBIN is in PATH
```

**Option 2: Download Pre-built Binary**
```powershell
# Download latest release
$url = "https://github.com/engram-memory/engram/releases/latest/download/engram_windows_amd64.zip"
Invoke-WebRequest -Uri $url -OutFile "engram.zip"
Expand-Archive -Path "engram.zip" -DestinationPath "$env:USERPROFILE\bin"
# Add $env:USERPROFILE\bin to PATH
```

**Option 3: Build from Source**
```powershell
git clone https://github.com/engram-memory/engram.git
cd engram
go build -o engram.exe ./cmd/engram
# Move engram.exe to a directory in PATH
```

**Option 4: Scoop (Community)**
```powershell
scoop bucket add extras
scoop install engram
```

### Verification

```bash
# Check version
engram --version

# Test MCP server starts
engram mcp --stdio

# Test database initialization
engram doctor

# Should output something like:
# Engram v0.3.1 (commit abc123)
# Database: /home/user/.engram/engram.db
# Config: /home/user/.engram/config.toml
# Status: OK
```

---

## Agent Setup (OpenCode)

### Full Setup (Recommended)

**1. Install Engram binary** (see Installation section)

**2. Add to OpenCode configuration**

Edit `~/.config/opencode/opencode.json` (or `opencode.jsonc`):

```json
{
  "$schema": "https://opencode.dev/schema.json",
  "mcp": {
    "engram": {
      "command": "engram",
      "args": ["mcp", "--stdio"],
      "env": {
        "ENGRAM_PROJECT": "${OPENCODE_PROJECT_NAME}"
      }
    }
  },
  "agents": {
    "primary": {
      "model": "anthropic/claude-3.5-sonnet",
      "instructions": "... your existing instructions ...",
      "tools": {
        "mcp": ["engram"]
      }
    }
  }
}
```

**3. Restart OpenCode** — The MCP server will start automatically

**4. Verify in OpenCode**
```
> /mcp
# Should show "engram" with 20 tools available
```

### Manual MCP-Only Setup

If you only want Engram for memory (not as default agent):

```json
{
  "mcp": {
    "engram": {
      "command": "engram",
      "args": ["mcp", "--stdio"],
      "env": {}
    }
  }
}
```

Then invoke tools manually:
```
> mem_save title="Fixed auth bug" type="bugfix" content="**What**: Fixed JWT validation..."
> mem_search query="JWT authentication"
```

### Memory Protocol for System Prompts

Add this to your agent's system prompt or instructions:

```markdown
## Engram Persistent Memory — Protocol

You have access to Engram, a persistent memory system that survives across sessions and compactions.

### CORE TOOLS (always available — use without ToolSearch):
  mem_save — save decisions, bugs, discoveries, conventions PROACTIVELY (do not wait to be asked)
  mem_search — find past work, decisions, or context from previous sessions
  mem_context — get recent session history (call at session start or after compaction)
  mem_session_summary — save end-of-session summary (MANDATORY before saying "done")
  mem_get_observation — get full untruncated content of a search result by ID
  mem_save_prompt — save user prompt for context
  mem_current_project — detect current project from cwd (recommended first call)

### DEFERRED TOOLS (use ToolSearch when needed):
  mem_update, mem_review, mem_pin, mem_unpin, mem_suggest_topic_key, mem_session_start, mem_session_end,
  mem_stats, mem_delete, mem_timeline, mem_capture_passive, mem_merge_projects

### PROACTIVE SAVE RULE: Call mem_save immediately after ANY decision, bug fix, discovery, or convention — not just when asked.

### FORMAT for mem_save content — use this structured format:
  **What**: [concise description of what was done]
  **Why**: [the reasoning, user request, or problem that drove it]
  **Where**: [files/paths affected, e.g. src/auth/middleware.ts, internal/store/store.go]
  **Learned**: [any gotchas, edge cases, or decisions made — omit if none]

### TITLE should be short and searchable, like: "JWT auth middleware", "FTS5 query sanitization", "Fixed N+1 in user list"

### WHEN TO SEARCH MEMORY
When user asks to recall something — "remember", "recall", "what did we do", "how did we solve" — call mem_context first, then mem_search.

Also search PROACTIVELY when starting work on something that might have been done before.

### SESSION CLOSE PROTOCOL (mandatory)
Before ending a session or saying "done", you MUST call mem_session_summary with this structure:

## Goal
[What we were working on this session]

## Instructions
[User preferences or constraints discovered — skip if none]

## Discoveries
- [Technical findings, gotchas, non-obvious learnings]

## Accomplished
- ✅ [Completed task 1 — with key implementation details]
- ✅ [Completed task 2 — mention files changed]
- 🔲 [Identified but not yet done — for next session]

## Next Steps
- [What remains to be done — for the next session]

## Relevant Files
- path/to/file.ts — [what it does or what changed]

This is NOT optional. If you skip this, the next session starts blind.
```

### Project-One Specific Example

For the `project-one` monorepo, add this to your agent instructions:

```markdown
## Project-One Specific Memory Protocol

### Project Detection
This is a monorepo with multiple apps. Engram will detect the project as "project-one" from the git root.

### Key Topic Keys to Use
- `architecture/monorepo-structure` — Monorepo organization decisions
- `architecture/auth-model` — Authentication/authorization patterns
- `backend/api-design` — REST API conventions
- `backend/prisma-patterns` — Prisma ORM usage patterns
- `frontend/state-management` — Redux/RTK Query patterns
- `frontend/component-library` — shadcn/ui composition patterns
- `testing/strategy` — Vitest/Playwright testing approaches
- `config/tailwind-setup` — Tailwind v4 configuration
- `config/typescript-config` — TypeScript project references

### Example Memory Saves for This Project

**After setting up Prisma with PostgreSQL:**
```
mem_save title="Prisma Postgres setup for project-one" type="config" topic_key="backend/prisma-patterns" content="**What**: Configured Prisma with PostgreSQL for apps/server\n**Why**: Need type-safe database access for Express backend\n**Where**: apps/server/prisma/schema.prisma, apps/server/package.json\n**Learned**: Use prisma-migration script for migrations, not prisma db push in prod"
```

**After deciding on authentication approach:**
```
mem_save title="JWT auth with httpOnly cookies" type="decision" topic_key="architecture/auth-model" content="**What**: Chose JWT in httpOnly cookies over sessions\n**Why**: Stateless, scales across instances, CSRF protection via SameSite\n**Where**: apps/server/src/auth/middleware.ts, apps/server/src/auth/routes.ts\n**Learned**: Must implement refresh token rotation, secure flag in production"
```

**After fixing a React rendering issue:**
```
mem_save title="Fixed infinite re-render in UserList" type="bugfix" topic_key="frontend/state-management" content="**What**: Fixed UserList component re-rendering on every keystroke\n**Why**: useSelector was returning new object reference each render\n**Where**: apps/client/src/features/users/UserList.tsx\n**Learned**: Use shallowEqual or select individual fields, not entire state slice"
```

---

## MCP Tools Reference

### Core Memory Tools

| Tool | Description | Required Params | Optional Params |
|------|-------------|-----------------|-----------------|
| `mem_save` | Save an observation to memory | `title` | `content`, `type`, `scope`, `topic_key`, `project`, `session_id`, `capture_prompt` |
| `mem_search` | Full-text search across observations | `query` | `limit`, `match_mode`, `project`, `scope`, `type`, `all_projects` |
| `mem_get_observation` | Get full content by ID | `id` | — |
| `mem_update` | Update existing observation | `id` | `title`, `content`, `type`, `scope`, `topic_key` |
| `mem_delete` | Delete observation by ID | `id` | — |

### Session Lifecycle Tools

| Tool | Description | Required Params | Optional Params |
|------|-------------|-----------------|-----------------|
| `mem_session_start` | Register new session | `id`, `directory` | — |
| `mem_session_end` | Mark session complete | `id` | `summary` |
| `mem_session_summary` | Save comprehensive summary | `content`, `session_id` | — |
| `mem_context` | Get recent session context | — | `project`, `scope`, `limit` |
| `mem_timeline` | Get chronological observations | — | `project`, `scope`, `limit`, `since` |

### Discovery & Context Tools

| Tool | Description | Required Params | Optional Params |
|------|-------------|-----------------|-----------------|
| `mem_current_project` | Detect project from cwd | — | — |
| `mem_save_prompt` | Save user prompt | `content` | `project`, `session_id` |
| `mem_capture_passive` | Extract learnings from text | `content` | `session_id`, `source` |
| `mem_stats` | Get memory statistics | — | `project` |

### Topic & Conflict Tools

| Tool | Description | Required Params | Optional Params |
|------|-------------|-----------------|-----------------|
| `mem_suggest_topic_key` | Suggest stable topic key | — | `title`, `content`, `type` |
| `mem_judge` | Resolve memory conflict | `judgment_id`, `relation` | `reason`, `evidence`, `confidence`, `session_id` |
| `mem_compare` | Persist semantic verdict | `memory_id_a`, `memory_id_b`, `relation`, `confidence`, `reasoning` | `model` |

### Review Tools

| Tool | Description | Required Params | Optional Params |
|------|-------------|-----------------|-----------------|
| `mem_review` | List or mark observations for review | `action` | `observation_id`, `limit`, `project` |
| `mem_pin` | Pin observation for priority | `id` | — |
| `mem_unpin` | Unpin observation | `id` | — |

### Special Tools

| Tool | Description | Required Params | Optional Params |
|------|-------------|-----------------|-----------------|
| `mem_doctor` | Run diagnostics | — | `check`, `project` |
| `mem_merge_projects` | Merge two project memories | `source_project`, `target_project` | `dry_run` |

---

### Tool Usage Patterns with Examples

#### Basic Save Pattern
```json
// Save a decision
{
  "tool": "mem_save",
  "params": {
    "title": "Chose Zustand over Redux for client state",
    "type": "decision",
    "topic_key": "frontend/state-management",
    "content": "**What**: Selected Zustand for global client state\n**Why**: Simpler API, smaller bundle, no Provider wrapper needed\n**Where**: apps/client/src/store/\n**Learned**: Middleware pattern differs from Redux; immer integration built-in"
  }
}
```

#### Search Patterns
```json
// Natural language search (default: all tokens must match)
{
  "tool": "mem_search",
  "params": {
    "query": "JWT authentication middleware",
    "limit": 5
  }
}

// Broader search (any token matches)
{
  "tool": "mem_search",
  "params": {
    "query": "auth middleware",
    "match_mode": "any",
    "limit": 10
  }
}

// Filter by type
{
  "tool": "mem_search",
  "params": {
    "query": "bug",
    "type": "bugfix",
    "limit": 5
  }
}
```

#### Session Management
```json
// At session start
{
  "tool": "mem_session_start",
  "params": {
    "id": "sess-2026-06-29-001",
    "directory": "/home/user/projects/project-one"
  }
}

// Get context from recent sessions
{
  "tool": "mem_context",
  "params": {
    "project": "project-one",
    "limit": 3
  }
}

// At session end (MANDATORY)
{
  "tool": "mem_session_summary",
  "params": {
    "session_id": "sess-2026-06-29-001",
    "content": "## Goal\nImplemented JWT authentication for Express API\n\n## Instructions\nUser wants httpOnly cookies with SameSite=strict\n\n## Discoveries\n- Prisma User model needs passwordHash field\n- Refresh token rotation requires separate table\n\n## Accomplished\n- ✅ Created auth middleware with token validation\n- ✅ Added login/register routes\n- 🔲 Need to add password reset flow\n\n## Next Steps\n- Implement refresh token endpoint\n- Add rate limiting to auth routes\n\n## Relevant Files\n- apps/server/src/auth/middleware.ts — JWT validation\n- apps/server/src/auth/routes.ts — Login/register endpoints"
  }
}
```

#### Conflict Resolution
```json
// When mem_save returns judgment_required=true
// Iterate candidates and call mem_judge for each
{
  "tool": "mem_judge",
  "params": {
    "judgment_id": "rel-a1b2c3d4",
    "relation": "supersedes",
    "reason": "New observation reflects current architecture after refactor",
    "confidence": 0.9
  }
}
```

#### Topic Key Suggestion
```json
// Before saving evolving decisions
{
  "tool": "mem_suggest_topic_key",
  "params": {
    "title": "API versioning strategy",
    "type": "decision"
  }
}
// Returns: "architecture/api-versioning"
// Then use in mem_save with topic_key
```

---

## CLI Reference

### Global Options
```
engram [global options] <command> [command options]

Global Options:
  --config, -c PATH       Config file path (default: ~/.engram/config.toml)
  --db-path PATH          Database path (default: ~/.engram/engram.db)
  --project NAME          Override project name
  --json                  Output as JSON
  --verbose, -v           Verbose output
  --help, -h              Show help
  --version               Show version
```

### Commands

#### Memory Operations
```bash
# Save observation
engram save --title "Fixed N+1 query" --type bugfix \
  --content "**What**: Added eager loading\n**Why**: N+1 in UserList\n**Where**: src/users/list.ts"

# Search memories
engram search "JWT authentication" --limit 10
engram search "auth" --match-mode any --type decision

# Get full observation
engram get <id>

# Update observation
engram update <id> --title "New title" --content "Updated content"

# Delete observation
engram delete <id>

# List recent observations
engram list --limit 20 --project project-one

# Show statistics
engram stats --project project-one
```

#### Session Management
```bash
# Start session
engram session start --id "sess-001" --dir "/path/to/project"

# End session
engram session end --id "sess-001" --summary "Completed auth implementation"

# Save session summary
engram session summary --id "sess-001" --file summary.md

# Show recent sessions
engram session list --limit 5

# Show session context
engram context --project project-one --limit 3
```

#### Project Management
```bash
# Detect current project
engram project detect

# List all projects
engram project list

# Set default project
engram project set project-one

# Merge projects
engram project merge --source old-name --target new-name
```

#### MCP Server
```bash
# Start MCP server (stdio transport)
engram mcp --stdio

# Start MCP server (HTTP transport)
engram mcp --http --port 3001

# Show MCP tool list
engram mcp tools
```

#### Configuration
```bash
# Show current config
engram config show

# Set config value
engram config set key value

# Edit config in $EDITOR
engram config edit

# Validate config
engram config validate
```

#### Diagnostics & Maintenance
```bash
# Run health checks
engram doctor

# Full diagnostics with JSON output
engram doctor --json

# Vacuum database (reclaim space)
engram vacuum

# Backup database
engram backup --output ~/backups/engram-$(date +%Y%m%d).db

# Restore from backup
engram restore --input ~/backups/engram-20260629.db
```

#### Cloud Sync (Optional)
```bash
# Login to sync service
engram sync login

# Check sync status
engram sync status

# Push local changes
engram sync push

# Pull remote changes
engram sync pull

# Configure team workspace
engram sync team create --name "my-team"
engram sync team invite --email colleague@company.com
```

---

## Session Lifecycle

### Overview

Engram's session model provides explicit continuity management for agent workflows. Each session represents a coherent unit of work with a beginning, middle, and end.

```
┌────────────────────────────────────────────────────────────────┐
│                    Session Lifecycle                            │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│   mem_session_start         mem_save (xN)        mem_session_  │
│   ─────────────────▶        ──────────────▶      summary       │
│        │                          │                  │          │
│        ▼                          ▼                  ▼          │
│   ┌─────────┐               ┌───────────┐      ┌─────────┐    │
│   │ Register│               │  Accumulate │      │ Persist │    │
│   │ session │               │  memories   │      │ summary │    │
│   │ metadata│               │  with context│     │ + end   │    │
│   └─────────┘               └───────────┘      └─────────┘    │
│                                                                 │
│   After compaction/context reset:                              │
│   mem_context ──────▶ Recover recent sessions                  │
│   mem_session_summary (previous) ──▶ Full context restore      │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
```

### Phase Details

#### Phase 1: Explore (Session Start)
```bash
# Agent starts work
engram session start --id "sess-20260629-auth" --dir "/project-one"

# Or via MCP
mem_session_start(id="sess-20260629-auth", directory="/project-one")

# Immediately get context
mem_context(project="project-one", limit=3)
```
**Purpose:** Register session, recover context from previous sessions, understand current state.

#### Phase 2: Specify (Active Work)
```bash
# Save decisions, specs, designs as they're made
mem_save(title="Auth API spec", type="spec", topic_key="backend/api-design", content="...")

# Search for relevant prior work
mem_search(query="password reset flow", type="design")
```
**Purpose:** Build specification artifacts, reference past decisions, avoid re-work.

#### Phase 3: Implement (Active Work)
```bash
# Save implementation decisions, bug fixes, patterns
mem_save(title="JWT middleware implementation", type="pattern", topic_key="backend/api-design", content="...")

# Save discoveries during implementation
mem_save(title="Prisma transaction handling", type="discovery", topic_key="backend/prisma-patterns", content="...")
```
**Purpose:** Capture implementation knowledge, document gotchas, create reusable patterns.

#### Phase 4: Verify (Active Work)
```bash
# Save test results, verification outcomes
mem_save(title="Auth integration tests passing", type="learning", topic_key="testing/strategy", content="...")

# Mark observations for review if needed
mem_review(action="list", project="project-one")
```
**Purpose:** Document verification results, flag items needing review.

#### Phase 5: Archive (Session End)
```bash
# MANDATORY: Save comprehensive summary
mem_session_summary(session_id="sess-20260629-auth", content="## Goal\n...")

# End session
mem_session_end(id="sess-20260629-auth", summary="Completed JWT auth implementation")
```
**Purpose:** Create durable summary for future sessions, mark session complete.

### Session Continuity Management

#### After Compaction/Context Reset
```bash
# 1. Detect project
mem_current_project()

# 2. Get recent session context
mem_context(project="project-one", limit=5)

# 3. Read full summary of last session
# (Find last session ID from context, then get its summary)
mem_get_observation(id=<last-session-summary-id>)

# 4. Start new session with continuity
mem_session_start(id="sess-20260629-auth-continued", directory="/project-one")
```

#### Multi-Agent Session Handoff
```
Agent A (Explorer)          Engram              Agent B (Implementer)
    │                        │                        │
    ├── mem_session_start ──▶│                        │
    │                        │                        │
    ├── mem_save (specs) ───▶│                        │
    │                        │                        │
    ├── mem_session_summary▶│                        │
    ├── mem_session_end ────▶│                        │
    │                        │                        │
    │                        │◀── mem_context ────────┤
    │                        │◀── mem_get_observation─┤
    │                        │                        │
    │                        │◀── mem_session_start ──┤
```

#### Long-Running Feature Branches
```bash
# Tag session with feature branch
mem_session_start(
  id="sess-feature-user-dashboard",
  directory="/project-one"
)
# topic_key: "feature/user-dashboard" for all related saves

# At merge time, sync to main specs
# (Use openspec-sync skill or manual process)
```

---

## Topic Keys (Upsert Workflow)

### Purpose

Topic keys provide stable identifiers for evolving observations. Instead of creating duplicate observations for the same topic, you **upsert** — update the latest observation with that topic_key.

### How It Works

```bash
# First save on a topic
mem_save(
  title="Initial API design",
  type="design",
  topic_key="backend/api-design",
  content="**What**: RESTful API with plural nouns\n**Why**: Standard convention\n**Where**: docs/api-spec.md"
)
# Creates observation #42

# Later, design evolves
mem_save(
  title="API design v2 - added versioning",
  type="design",
  topic_key="backend/api-design",  # SAME topic_key
  content="**What**: Added /v1/ prefix\n**Why**: Need breaking change path\n**Where**: docs/api-spec.md, apps/server/src/routes.ts"
)
# UPDATES observation #42 (not create #43)
```

### Best Practice: Use `mem_suggest_topic_key` first for new topics.

```bash
# Get suggested key
mem_suggest_topic_key(title="Database indexing strategy", type="decision")
# Returns: "backend/database-indexing"

# Use in save
mem_save(topic_key="backend/database-indexing", ...)
```

### Topic Key Conventions

| Domain | Prefix | Examples |
|--------|--------|----------|
| Architecture | `architecture/` | `architecture/auth-model`, `architecture/microservices` |
| Backend | `backend/` | `backend/api-design`, `backend/prisma-patterns` |
| Frontend | `frontend/` | `frontend/state-management`, `frontend/component-library` |
| Testing | `testing/` | `testing/strategy`, `testing/e2e-patterns` |
| Config | `config/` | `config/tailwind-setup`, `config/typescript-config` |
| Features | `feature/` | `feature/user-dashboard`, `feature/payment-integration` |
| Security | `security/` | `security/cors-policy`, `security/rate-limiting` |

### Upsert Behavior Details

- **Scope matters**: `scope="project"` (default) vs `scope="personal"` — different scopes = different observations
- **Type matters**: Different `type` with same `topic_key` = different observations
- **Project matters**: Different projects = different observations even with same topic_key
- **Returns**: `mem_save` returns the observation ID (new or updated)

---

## Memory Protocol

### Structured Content Format

All `mem_save` content **MUST** follow this format:

```markdown
**What**: [One sentence — what was done/decided/discovered]
**Why**: [The reasoning, user request, or problem that drove it]
**Where**: [Files/paths affected, e.g. src/auth/middleware.ts]
**Learned**: [Gotchas, edge cases, decisions made — omit if none]
```

### Type Taxonomy

| Type | Use For | Examples |
|------|---------|----------|
| `decision` | Architectural/technical choices | "Chose PostgreSQL over MongoDB" |
| `architecture` | System design, high-level structure | "Monorepo with shared packages" |
| `bugfix` | Bug fixes and root causes | "Fixed N+1 query in UserList" |
| `pattern` | Reusable code patterns | "Prisma transaction wrapper" |
| `config` | Configuration decisions | "Tailwind v4 CSS variables setup" |
| `discovery` | Non-obvious findings | "FTS5 tokenizer behavior" |
| `learning` | General learnings | "Vitest parallel execution limits" |
| `spec` | Specification artifacts | "Auth API OpenAPI spec" |
| `design` | Design documents | "Database schema v3" |
| `manual` | Uncategorized (default) | — |

### Scope Taxonomy

| Scope | Use For | Visibility |
|-------|---------|------------|
| `project` | Project-specific knowledge | Current project only |
| `personal` | Personal preferences, workflows | All projects (user-level) |

### Proactive Save Triggers

**Call `mem_save` IMMEDIATELY after:**
- ✅ Making an architectural decision
- ✅ Fixing a non-trivial bug
- ✅ Discovering a gotcha or edge case
- ✅ Establishing a new pattern/convention
- ✅ Changing configuration significantly
- ✅ Completing a specification/design document
- ✅ Finishing a coding session (via `mem_session_summary`)

**Do NOT wait for:**
- User asking "save this"
- End of day
- "Good stopping point"

---

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `ENGRAM_DB_PATH` | Database file path | `~/.engram/engram.db` |
| `ENGRAM_CONFIG_PATH` | Config file path | `~/.engram/config.toml` |
| `ENGRAM_PROJECT` | Override project name | Auto-detected |
| `ENGRAM_SCOPE` | Default scope | `project` |
| `ENGRAM_LOG_LEVEL` | Log level (debug, info, warn, error) | `info` |
| `ENGRAM_LOG_FILE` | Log file path | `~/.engram/logs/engram.log` |
| `ENGRAM_SYNC_ENABLED` | Enable cloud sync | `false` |
| `ENGRAM_SYNC_ENDPOINT` | Sync server URL | `https://sync.engram.dev` |
| `ENGRAM_SYNC_TOKEN` | Sync auth token | — |
| `ENGRAM_MCP_TRANSPORT` | MCP transport (stdio, http) | `stdio` |
| `ENGRAM_MCP_PORT` | HTTP port for MCP | `3001` |
| `ENGRAM_FTS_TOKENIZER` | FTS5 tokenizer | `unicode61` |

### Example .env File

```bash
# ~/.engram/.env
ENGRAM_PROJECT=project-one
ENGRAM_LOG_LEVEL=debug
ENGRAM_SYNC_ENABLED=true
ENGRAM_SYNC_TOKEN=your-sync-token-here
```

---

## Configuration

### Config File Location

`~/.engram/config.toml`

### Full Configuration Schema

```toml
# Engram Configuration

[database]
path = "~/.engram/engram.db"
# Connection pool settings
max_open_conns = 10
max_idle_conns = 5
conn_max_lifetime = "1h"

[search]
# FTS5 settings
tokenizer = "unicode61"
prefix_lengths = [2, 3]
# Semantic search (requires vector extension)
semantic_enabled = false
embedding_model = "all-MiniLM-L6-v2"

[session]
# Auto-end idle sessions (0 = disabled)
idle_timeout = "4h"
# Auto-summary on idle end
auto_summary = true

[project]
# Project detection priority
detection_order = ["git", "package", "directory"]
# Custom project mappings
mappings = { "my-old-name" = "project-one" }

[mcp]
transport = "stdio"  # or "http"
http_port = 3001
http_host = "127.0.0.1"
# Tool filtering (empty = all tools)
enabled_tools = []

[sync]
enabled = false
endpoint = "https://sync.engram.dev"
# Token stored in keychain/credential manager
# token = "..."  # Don't put in config file
team_workspace = ""

[retention]
# Observation retention (0 = forever)
max_age_days = 0
# Max observations per project (0 = unlimited)
max_per_project = 0
# Auto-delete judged superseded observations
auto_cleanup_superseded = true

[privacy]
# Telemetry
telemetry_enabled = false
# Redact sensitive patterns in logs
redact_patterns = [
  "password",
  "secret",
  "token",
  "api_key",
  "private_key"
]
```

### Configuration Commands

```bash
# View current config
engram config show

# View as JSON
engram config show --json

# Set a value
engram config set database.path "/custom/path/engram.db"

# Set nested value
engram config set search.tokenizer "porter"

# Edit in $EDITOR
engram config edit

# Validate config
engram config validate

# Reset to defaults
engram config reset
```

---

## Engram vs claude-mem

> **Note:** "claude-mem" appears to be a legacy or hypothetical comparison target. Engram was designed as a modern, agent-agnostic replacement for earlier memory systems. The comparison below reflects typical legacy memory system limitations.

| Aspect | Engram (Current) | Legacy Memory Systems |
|--------|------------------|----------------------|
| **Architecture** | Single Go binary, SQLite + FTS5 | Often Python/Node, JSON files |
| **Search** | Full-text (FTS5) + optional vectors | Grep or basic keyword |
| **Project Awareness** | Auto-detect + explicit | Manual project switching |
| **Session Model** | Explicit start/end + summaries | Implicit or none |
| **Conflict Handling** | Structured judgment workflow | Manual resolution |
| **Sync** | Optional cloud, e2e encrypted | Usually none or basic git |
| **Agent Compatibility** | MCP standard (any agent) | Often Claude-specific |
| **Memory Structure** | Typed, scoped, topic-keyed | Key-value or unstructured |
| **Performance** | Sub-ms queries, WAL mode | Degrades with size |
| **Dependencies** | Zero (static binary) | Runtime + packages |
| **Cross-platform** | Windows, macOS, Linux | Often Unix-only |
| **Maintenance** | Active development | Often abandoned |

### Migration from Legacy Systems

If you have existing memory files (JSON, markdown, etc.):

```bash
# Import from JSON Lines
engram import --format jsonl --input ~/old-memories.jsonl

# Import from directory of markdown files
engram import --format markdown --input ~/memory-notes/

# Import from claude-mem format (if applicable)
engram import --format claude-mem --input ~/.claude-mem/
```

---

## Best Practices

### 1. Save Proactively, Not Reactively
```bash
# ❌ BAD: Wait until asked
User: "Save this decision"
Agent: mem_save(...)

# ✅ GOOD: Save immediately
Agent makes decision → mem_save(...) → Continue working
```

### 2. Use Structured Content Format
```bash
# ❌ BAD: Unstructured
content: "Fixed the auth bug by changing the middleware"

# ✅ GOOD: Structured
content: "**What**: Fixed JWT validation in auth middleware\n**Why**: Token expiration not checked\n**Where**: apps/server/src/auth/middleware.ts:45\n**Learned**: Must verify exp claim before signature"
```

### 3. Choose Stable Topic Keys
```bash
# ❌ BAD: Too specific, changes often
topic_key: "backend/auth/jwt-middleware-v2"

# ✅ GOOD: Stable, hierarchical
topic_key: "backend/auth-model"
```

### 4. Use Appropriate Types
```bash
# Decision → type: "decision"
# Bug fix → type: "bugfix"
# Reusable pattern → type: "pattern"
# Configuration → type: "config"
# Discovery → type: "discovery"
```

### 5. Scope Correctly
```bash
# Project-specific → scope: "project" (default)
# Personal preference → scope: "personal"
```

### 6. Search Before Starting
```bash
# At session start
mem_context(project="current", limit=3)
mem_search(query="what you're about to work on")
```

### 7. Write Quality Session Summaries
```bash
# ❌ BAD: Vague
"Worked on auth stuff"

# ✅ GOOD: Specific, actionable
"## Goal: Implemented JWT auth with refresh tokens
## Discoveries: Prisma needs separate RefreshToken model
## Accomplished: Login, register, refresh endpoints
## Next: Password reset, rate limiting
## Files: apps/server/src/auth/*.ts"
```

### 8. Resolve Conflicts Promptly
```bash
# When mem_save returns judgment_required
# Don't ignore — judge immediately
for candidate in response.candidates:
    mem_judge(judgment_id=candidate.judgment_id, relation="supersedes", ...)
```

### 9. Pin Important Observations
```bash
# For frequently referenced memories
mem_pin(id=42)  # Architecture decisions, key patterns
```

### 10. Regular Maintenance
```bash
# Weekly
engram doctor
engram vacuum

# Monthly
engram backup --output ~/backups/engram-$(date +%Y%m).db
```

---

## Troubleshooting

### Common Issues

#### "Database locked" Error
```bash
# Cause: Multiple processes accessing database
# Fix: Ensure only one Engram instance runs
engram doctor --check locks

# Or enable WAL mode (default)
# Check: PRAGMA journal_mode = WAL;
```

#### "Project not detected"
```bash
# Cause: No git remote, no package.json, generic directory name
# Fix: Set explicitly
export ENGRAM_PROJECT=my-project
# Or
engram project set my-project
```

#### "MCP tools not showing in agent"
```bash
# Check MCP server runs
engram mcp --stdio

# Check OpenCode config
cat ~/.config/opencode/opencode.json | jq '.mcp.engram'

# Restart agent after config change
```

#### "Search returns no results"
```bash
# Check FTS index
engram doctor --check fts

# Rebuild FTS if corrupted
engram rebuild-fts

# Try broader search
engram search "auth" --match-mode any
```

#### "Sync not working"
```bash
# Check credentials
engram sync status

# Re-authenticate
engram sync logout
engram sync login

# Check network
curl -v https://sync.engram.dev/health
```

#### "Memory growing too large"
```bash
# Check stats
engram stats

# Clean up old sessions
engram cleanup --older-than 90d

# Or configure retention
engram config set retention.max_age_days 180
```

#### "Conflicts not surfacing"
```bash
# Check judgment status
engram list --judgment-status pending

# Force conflict check
engram doctor --check conflicts
```

### Debug Commands

```bash
# Full diagnostics
engram doctor --json

# Database integrity
sqlite3 ~/.engram/engram.db "PRAGMA integrity_check;"

# Check FTS content
sqlite3 ~/.engram/engram.db "SELECT * FROM observations_fts LIMIT 5;"

# View recent sessions
sqlite3 ~/.engram/engram.db "SELECT * FROM sessions ORDER BY started_at DESC LIMIT 10;"

# Enable debug logging
ENGRAM_LOG_LEVEL=debug engram mcp --stdio
```

### Performance Tuning

```toml
# In config.toml for large databases (>100k observations)
[database]
max_open_conns = 20
cache_size = -65536  # 64MB
mmap_size = 536870912  # 512MB

[search]
# Enable semantic search for better relevance
semantic_enabled = true
```

### Getting Help

```bash
# Built-in help
engram --help
engram <command> --help

# Report issues
# GitHub: https://github.com/engram-memory/engram/issues

# Community
# Discord: https://discord.gg/engram
# Discussions: https://github.com/engram-memory/engram/discussions
```

---

## Appendix: Quick Reference Card

### Most Used Commands
```bash
engram save -t "Title" -T bugfix -c "**What**: ...\n**Why**: ...\n**Where**: ..."
engram search "query"
engram context
engram session summary --file summary.md
engram doctor
```

### Most Used MCP Tools
```javascript
mem_save({title, type, topic_key, content})
mem_search({query, limit: 5})
mem_context({project, limit: 3})
mem_session_summary({session_id, content})
mem_get_observation({id})
mem_judge({judgment_id, relation, reason})
```

### Content Template
```markdown
**What**: 
**Why**: 
**Where**: 
**Learned**: 
```

### Topic Key Pattern
```
domain/subdomain
backend/api-design
frontend/state-management
architecture/auth-model
```

---

*Last updated: 2026-06-29 | Engram v0.3+ | For project-one monorepo*