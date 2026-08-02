# Omniroute + Opencode Integration Plan (Project-One)

> Status: PLAN — Pending user confirmation before execution
> Last investigated: 2026-07-30
> Owner: @researcher (investigation) → @developer (execution)

## TL;DR

Add omniroute (AI gateway at `http://localhost:20128/v1`, 290+ providers, free tiers) as a provider inside project-one's opencode config. **Manual approach only** — never run `omniroute setup-opencode` or `omniroute setup opencode` as those write to the **global** `~/.config/opencode/opencode.json` and have a history of breaking the config (CJS bundle bug, plugin loader incompatibility). Instead, add a hand-crafted `provider.omniroute` block to the **project-level** `opencode.jsonc`, using the same `@ai-sdk/openai-compatible` npm package already proven by the existing `ollama-local` provider. The API key is injected via `{env:OMNIROUTE_API_KEY}` in the config (no shell profile changes needed beyond setting one env var). Omniroute itself runs via Docker (recommended) or `npm install -g omniroute`. The doc covers exact JSONC snippets, agent-scoped binding, env var strategy, failure recovery, and a numbered execution checklist.

## Context

### What is omniroute

Omniroute is an **MIT-licensed AI gateway** (npm `omniroute`, v3.8.50, 34.6k+ stars on GitHub). It exposes a single OpenAI-compatible endpoint at `http://localhost:20128/v1` that routes requests across **290+ providers** (90+ with free tiers, ~1.53B free tokens/month). Key features:

- **Auto-fallback**: If one provider is down or rate-limited, omniroute automatically tries the next.
- **19 routing strategies**: priority, round-robin, cost-optimized, LKGP (sticky), etc.
- **Zero-config `auto` model**: Call `model: "auto"` and omniroute picks the best available provider from live scoring.
- **Compression**: RTK + Caveman stacked compression (15-95% token savings).
- **MCP & A2A support**: Built-in MCP server with 104 tools, Agent-to-Agent protocol.
- **Dashboard**: Web UI at `http://localhost:20128` for managing providers, keys, combos, usage.

### Why this project

Project-one is a monorepo (Express backend + React client) using opencode as the AI coding agent. The existing `opencode.jsonc` at the project root already has a custom provider (`ollama-local` using `@ai-sdk/openai-compatible`), 8 custom agents, 2 MCP servers, and a sophisticated permission system. Adding omniroute as a second OpenAI-compatible provider gives the user access to hundreds of models (Claude, GPT, Gemini, DeepSeek, GLM, MiniMax, and many free tiers) through a single config block.

### Prior incident

A previous attempt to integrate omniroute into opencode caused opencode to break. The root cause was likely one of these:

1. **`omniroute setup opencode`** (plugin command) wrote `@omniroute/opencode-plugin` into `~/.config/opencode/plugins/` and modified `~/.config/opencode/opencode.json`. The plugin had a **CJS bundle incompatibility** (PR #3883) where OpenCode's Bun-based plugin loader failed on CJS-to-ESM interop, causing `Plugin export is not a function`. Fixed in omniroute v3.8.26+ with ESM-only bundling, but an upstream OpenCode bug (`anomalyco/opencode#13543`) can still affect plugins with named exports.

2. **`omniroute setup-opencode`** (lightweight command) writes a provider block to the **global** `~/.config/opencode/opencode.json`. This can conflict with project-level overrides or overwrite the user's global config.

3. **`@/shared` path alias issue** — an older version of the omniroute plugin may have used TypeScript `@/` path aliases that weren't resolved at runtime, causing `Cannot find package @/shared`.

**Key lesson**: Never run `omniroute setup-opencode` or `omniroute setup opencode`. Always hand-edit the project-level `opencode.jsonc`. The manual provider block approach is project-scoped, version-controlled, reversible, and completely under your control.

## Current state of project opencode.jsonc

Source: `C:\Users\user\Desktop\Programacion\Node-express-nest\project-one\opencode.jsonc` (275 lines)

### Existing structure

The file has these top-level keys (in order):

| Key | Value | Notes |
|-----|-------|-------|
| `$schema` | `"https://opencode.ai/config.json"` | Schema URL for validation |
| `autoupdate` | `true` | Auto-update opencode |
| `plugin` | array (3 items) | `@warp-dot-dev/opencode-warp`, 2 local plugins |
| `provider` | object (1 entry: `ollama-local`) | Existing OpenAI-compatible provider |
| `default_agent` | `"orchestrator"` | Default is the orchestrator agent |
| `instructions` | array (2 items) | `AGENTS.md`, `CONTEXT.md` |
| `shell` | `"bash"` | Shell for bash tool (MSYS2) |
| `skills` | object | Paths to `.opencode/skills` and `.agents/skills` |
| `tool_output` | object | max_lines: 400, max_bytes: 65536 |
| `lsp` | object | Prisma language server |
| `permission` | object | Granular tool permissions |
| `agent` | object | 8 agents (orchestrator + 7 subagents) |
| `mcp` | object | composio (remote) + context7 (remote) |
| `compaction` | object | auto: true, prune: true, reserved: 10000 |
| `watcher` | object | ignore patterns for node_modules, .git, etc. |

The file also has commented-out blocks:
- `// "env": { "BASH_ENV": "$HOME/.bash_env" }` — **this field is NOT supported by the opencode schema**; would be rejected by `additionalProperties: false` validation
- `// "formatter": { ... }` — formatter disabled by design (Husky handles it)
- `// "permission": { "edit": "deny" }` — commented out due to bug #26758
- `// mcp composio/context7 local proxy blocks` — replaced by remote configs

### Existing providers

| Provider ID | npm package | baseURL | Models | Notes |
|-------------|-------------|---------|--------|-------|
| `ollama-local` | `@ai-sdk/openai-compatible` | `http://127.0.0.1:11434` | `qwen2.5-coder:7b` | Local LLM via Ollama |

The `ollama-local` provider uses the same `@ai-sdk/openai-compatible` npm package that we'll use for omniroute. Multiple instances of the same npm package in the `provider` object are **fully supported** — opencode's schema uses `additionalProperties` on the provider object with individual `$ref: ProviderConfig` per entry.

### Existing default model

There is **no top-level `model` or `small_model` field** set in the project config. Each agent has its own `model` setting:
- `orchestrator`: `"nvidia/minimaxai/minimax-m3"`
- `spec-manager`: `"opencode/deepseek-v4-flash-free"`
- `git-manager`: `"opencode/big-pickle"`
- `planner`: `"opencode/deepseek-v4-flash-free"`
- `developer`: `"opencode/nemotron-3-ultra-free"`
- `reviewer`: `"opencode/deepseek-v4-flash-free"`
- `researcher`: `"opencode/deepseek-v4-flash-free"`
- `project-manager`: `"opencode/deepseek-v4-flash-free"`

## Recommended integration approach

### Chosen method: Manual provider block + safe servant options

**Why NOT `setup-opencode`:**
- `omniroute setup-opencode` writes to **global** `~/.config/opencode/opencode.json` — not the project config
- `omniroute setup opencode` (plugin) had the CJS bundle bug (fixed in v3.8.26, but upstream OpenCode plugin loader issue `#13543` remains open)
- Neither is a postinstall hook — both are explicit CLI commands, but they're still risky for a production opencode setup
- Manual project-level config is version-controlled, reversible, auditable, and doesn't touch other projects

**Why manual is safer:**
- Project-scoped — only affects this project
- Version-controlled — `git checkout opencode.jsonc` restores it
- No global state pollution
- You control exactly which models to declare
- Zero risk of overwriting the user's global opencode config

### Provider block to insert

Add this block inside the existing `"provider": { ... }` object, **after** the `"ollama-local": { ... }` entry (order doesn't matter for providers, but alphabetical/natural grouping is cleaner):

```jsonc
    // Omniroute AI Gateway — 290+ providers through one endpoint
    // Requires OMNIROUTE_API_KEY env var set before starting opencode
    "omniroute": {
      "npm": "@ai-sdk/openai-compatible",
      "name": "OmniRoute Gateway",
      "options": {
        "baseURL": "http://localhost:20128/v1",
        "apiKey": "{env:OMNIROUTE_API_KEY}"
      },
      "models": {
        "auto": {
          "name": "OmniRoute Auto (smart routing)",
          "limit": {
            "context": 128000,
            "output": 65536
          }
        },
        "oc/free": {
          "name": "OpenCode Free (via OmniRoute)",
          "limit": {
            "context": 128000,
            "output": 4096
          }
        },
        "felo/felo": {
          "name": "Felo (via OmniRoute)",
          "limit": {
            "context": 32000,
            "output": 4096
          }
        }
      }
    }
```

**What this does NOT touch:**
- The existing `ollama-local` provider — preserved exactly as-is
- The top-level `model` field — **not set**; omniroute remains available but not the default
- Any agent configuration — **not changed**; all agents keep their current models
- Permission, MCP, LSP, plugin, or any other section — untouched

**Why only 3 models as seed set:**
- Omniroute's catalog has 500+ models. Listing all is impractical and wasteful.
- `auto` is the magic model — omniroute's smart routing picks the best available provider automatically. This is the primary entrypoint.
- `oc/free` and `felo/felo` are keyless free providers that work out of the box with omniroute (no API key needed for these specific models if omniroute has its own free-tier routing).
- Users can add more models as they discover favorites, using the pattern `"provider/model-slug": { "name": "Display Name" }`.

### Model defaulting (optional, decided by user)

**Option A**: Don't set a default — omniroute is available but no agent uses it unless explicitly assigned. This is the SAFEST starting point.

**Option B**: Set omniroute as the global default model:
```jsonc
"model": "omniroute/auto"
```

**Option C**: Set omniroute as the `small_model` for cheap/simple tasks:
```jsonc
"small_model": "omniroute/oc/free"
```

**Recommendation**: Start with Option A (no default). Let the user test omniroute interactively via `/models` first, then decide if they want to promote it to default.

### Agent-scoped binding (optional, advanced)

OpenCode supports per-agent model binding via `agent.<name>.model`. To bind specific agents to omniroute without changing the global default:

```jsonc
"agent": {
  // ... existing agents ...
  "developer": {
    // ... existing config ...
    "model": "omniroute/auto"  // Override: developer uses omniroute
  },
  "researcher": {
    // ... existing config ...
    "model": "omniroute/auto"  // Override: researcher uses omniroute
  }
}
```

This is the **cleanest way** to use omniroute for specific subagents while leaving others (e.g. orchestrator) on their current models. The schema supports this — `agent.<name>.model` is a `string` field in the `AgentConfig` schema, validated against `https://models.dev/model-schema.json`.

To revert an agent back to its original model, just remove the `"model"` line from that agent's config.

## Environment variables

### API key strategy

**IMPORTANT FINDING**: The opencode config schema (`https://opencode.ai/config.json`) does **NOT** have a top-level `env` field. The schema uses `additionalProperties: false` at the root, meaning any `"env"` key at the top level would be rejected by JSON Schema validation. The only `env` fields in the schema are:

1. **Inside `ProviderConfig`**: `"env": { "type": "array", "items": { "type": "string" } }` — this is an array of env var *names* that the provider needs, documented for the user. It does NOT set env vars.
2. **Inside `LspConfig`**: `"env": { "type": "object", ... }` — this sets env vars for LSP server processes only.

The existing commented-out `// "env": { "BASH_ENV": "$HOME/.bash_env" }` in the project's `opencode.jsonc` is **not a recognized configuration field**. It would be silently ignored at best, or cause a validation warning at worst.

**Therefore**: We must set `OMNIROUTE_API_KEY` as a system/user-level environment variable visible to both PowerShell and MSYS2 bash.

### OpenCode's {env:VAR_NAME} substitution

OpenCode supports `{env:VARIABLE_NAME}` syntax in config values (documented at `opencode.ai/docs/config/` under "Variables > Env vars"). This is how `apiKey` references the environment variable:

```jsonc
"apiKey": "{env:OMNIROUTE_API_KEY}"
```

If the env var is not set, it resolves to an empty string, which will cause an authentication error from omniroute. This is **not** a graceful path.

### Recommended: PowerShell user-scope env var + bash profile fallback

**Step 1: PowerShell (Windows User scope)**

```powershell
# Run as the user (not admin) — persists across reboots
[Environment]::SetEnvironmentVariable("OMNIROUTE_API_KEY", "sk-your-omniroute-api-key", "User")
```

**Step 2: Verify in PowerShell**

```powershell
# Immediate effect for current session
$env:OMNIROUTE_API_KEY = "sk-your-omniroute-api-key"
echo $env:OMNIROUTE_API_KEY
```

**Step 3: Add to MSYS2 bash profiles** (for opencode agents that run in bash)

Add to `~/.bashrc` (sourced by non-login shells):

```bash
# OmniRoute API key for opencode
export OMNIROUTE_API_KEY="sk-your-omniroute-api-key"
```

Also add to `~/.bash_profile` (sourced by login shells):

```bash
# OmniRoute API key for opencode
export OMNIROUTE_API_KEY="sk-your-omniroute-api-key"
```

And to `~/.profile` as a universal fallback:

```bash
# OmniRoute API key for opencode
export OMNIROUTE_API_KEY="sk-your-omniroute-api-key"
```

**Why three files**: OpenCode's `"shell": "bash"` setting spawns bash. Whether it's a login or non-login shell determines which file gets sourced. Covering all three ensures the var is available regardless.

**Step 4: Verify in bash from MSYS2**

```bash
echo $OMNIROUTE_API_KEY
# Should print: sk-your-omniroute-api-key
```

**Key detail about opencode's shell invocation**: opencode spawns bash with `"shell": "bash"` in the config. The exact invocation type (login vs non-login) is not guaranteed. Some systems use `bash -l` (login), others use plain `bash` (non-login). Covering `.bashrc`, `.bash_profile`, and `.profile` handles both cases.

## Servir options (pick one)

### Option A: npm install -g omniroute (PowerShell-friendly)

```powershell
# In PowerShell (Admin NOT required for npm global installs if using a proper prefix)
npm install -g omniroute
```

**What it touches:**
- Installs to `%AppData%\npm\node_modules\omniroute\`
- Adds `omniroute` command to PATH (via npm's bin directory)
- Postinstall runs ONLY runtime warmup (native binary pre-resolution) — does NOT modify opencode config
- Skips `setup-opencode` or `setup opencode` — those are explicit commands, not auto-run

**MSYS2 safety:**
- MSYS2 bash uses a separate PATH — but `~/bin/gh` wrapper pattern shows that Windows PATH entries ARE accessible via `/c/Users/user/AppData/Roaming/npm/omniroute`
- Alternatively, create a `~/bin/omniroute` wrapper (same pattern as `~/bin/gh`)

**Invocation:**
```powershell
omniroute   # Starts server on http://localhost:20128
```

**To skip postinstall warmup (if it causes issues):**
```powershell
$env:OMNIROUTE_SKIP_POSTINSTALL = "1"
npm install -g omniroute
```

### Option B: npm install local + npx (zero PATH footprint)

```powershell
# In PowerShell, from project root
cd C:\Users\user\Desktop\Programacion\Node-express-nest\project-one
npm init -y --scope project-one 2>$null  # if no package.json in root
npm install omniroute --save-dev --ignore-scripts
```

**What it touches:**
- Installs to `node_modules/omniroute/`
- Listed in `devDependencies` (not a runtime dep for the app, just for development tooling)
- **Zero PATH changes** — the binary lives in `node_modules/.bin/omniroute`

**Invocation:**
```powershell
npx omniroute   # Or: node_modules/.bin/omniroute
```

**Uninstall:**
```powershell
npm uninstall omniroute
```

### Option C: Docker (zero host footprint) — RECOMMENDED

```powershell
# Pull and run (Docker Desktop required)
docker pull diegosouzapw/omniroute:latest
docker run -d ^
  --name omniroute ^
  -p 20128:20128 ^
  -v omniroute-data:/app/data ^
  --restart unless-stopped ^
  diegosouzapw/omniroute:latest
```

**What it touches:**
- Nothing on the host filesystem except a Docker volume (`omniroute-data`)
- Zero npm pollution
- Zero PATH changes
- Runs isolated in its own container
- Port 20128 is exposed to the host

**Managing the container:**
```powershell
docker stop omniroute    # Pause the service
docker start omniroute   # Resume
docker rm -f omniroute   # Remove completely
docker logs omniroute    # View logs
```

**Persisting data across container restarts:**
The `-v omniroute-data:/app/data` volume persists provider configs, keys, and settings. To inspect/backup:
```powershell
docker volume inspect omniroute-data
```

**Docker Desktop check:**
```powershell
docker info  # Should not show "Server Errors"
```

### Recommendation

**Option C: Docker** — for this project specifically.

Rationale:
1. Project-one uses Node.js/Express/Prisma — adding omniroute as an npm dependency (even dev) clutters `node_modules` and risks version conflicts
2. Docker isolates omniroute completely — no MSYS2 PATH issues, no npm global state pollution
3. Docker Desktop is already the standard for cross-platform containerization on Windows
4. Easy stop/start/remove without affecting the Node.js toolchain
5. Volume mount persists configuration across container restarts
6. Port mapping is explicit and trivially changeable if 20128 conflicts

## Anti-patterns to avoid

### NEVER run `omniroute setup-opencode` or `omniroute setup opencode`

**Why:**
- Writes to global `~/.config/opencode/opencode.json` — hard to undo, not version-controlled
- The plugin-based `setup opencode` had the CJS bundle bug (PR #3883, v3.8.26). While fixed, the upstream OpenCode plugin loader bug (`anomalyco/opencode#13543`) means plugins with named exports can still fail with `Plugin export is not a function`
- Manual block in project `opencode.jsonc` is strictly better: version-controlled, scoped, reversible

**What to do instead:** Follow the manual provider block approach documented above.

### NEVER use `host.docker.internal` from the host

If omniroute runs in Docker, access it via `localhost:20128` from the host. The `host.docker.internal` DNS name is for containers that need to reach the **host**, not the other way around. From the host to a container, `localhost` + mapped port is correct.

### Don't install omniroute as a project dependency in apps/server or apps/client

Project-one is a monorepo with `apps/server/` (Express) and `apps/client/` (React). Installing omniroute in either workspace would:
- Pollute the application's dependency tree
- Get deployed to production (if not careful with devDeps vs deps)
- Confuse the monorepo's build pipeline (Turborepo)

Install either globally (`npm install -g`) or at the monorepo root as a dev dependency, or use Docker.

### Don't declare all 500+ omniroute models

Omniroute exposes 500+ models. Declaring all of them in `opencode.jsonc` would:
- Make the config file massive and unreadable
- Slow down opencode's model loading
- Clutter the `/models` picker

Instead, declare only the models you actually use. Start with 3 (`auto`, `oc/free`, `felo/felo`). Add more as needed using the pattern:
```jsonc
"models": {
  "google/gemini-2.5-pro": { "name": "Gemini 2.5 Pro" },
  "anthropic/claude-sonnet-4": { "name": "Claude Sonnet 4" }
}
```

## Verification procedure

### After install (servant-side)

**If using Docker:**
```powershell
docker ps --filter name=omniroute  # Should show running container
docker logs omniroute --tail 20    # Should show server started
```

**If using npm global/local:**
```bash
# Check the process is running
curl http://localhost:20128/v1/models
```

**Endpoint verification (any method):**
```powershell
# Test the models endpoint (expects JSON response with model IDs)
curl.exe -s http://localhost:20128/v1/models | Select-Object -First 1
```

**Expected response shape:**
```json
{
  "object": "list",
  "data": [
    { "id": "auto", "object": "model", ... },
    { "id": "oc/free", "object": "model", ... },
    { "id": "felo/felo", "object": "model", ... },
    ...
  ]
}
```

### After opencode.jsonc edit (opencode-side)

**Step 1: Back up current opencode.jsonc**
```powershell
copy C:\Users\user\Desktop\Programacion\Node-express-nest\project-one\opencode.jsonc C:\Users\user\Desktop\Programacion\Node-express-nest\project-one\opencode.jsonc.backup-2026-07-30
```

**Step 2: Validate JSONC syntax**
```bash
# Using node to check JSONC (stripping comments first)
node -e "
const fs = require('fs');
const content = fs.readFileSync('opencode.jsonc', 'utf8');
// Quick check: remove single-line comments and trailing commas
const cleaned = content
  .replace(/\/\/.*$/gm, '')
  .replace(/,(\s*[\]}])/g, '\$1');
JSON.parse(cleaned);
console.log('JSONC is valid');
"
```

**Step 3: Restart opencode**
Simply close and reopen opencode, or restart the opencode server:
```bash
# In the opencode terminal
/restart   # If running in TUI
```

**Step 4: List models in opencode**
Run this command inside opencode:
```
/models
```

Filter for omniroute models:
```
/models | grep -i omniroute
```

Expected output should show:
- `omniroute/auto`
- `omniroute/oc/free`
- `omniroute/felo/felo`

**Step 5: Test a chat completion**
```bash
# In opencode, start a session with explicit model
opencode -m omniroute/auto "Hello, what model are you?"
```

Or within the TUI:
```
/model omniroute/auto
```

Then send a test message.

**Step 6: Confirm existing providers still work**
Test the existing ollama-local provider as a regression check:
```bash
opencode -m ollama-local/qwen2.5-coder:7b "Hello"
```

### Env var verification

**From PowerShell:**
```powershell
echo $env:OMNIROUTE_API_KEY
# Should print the key (or nothing if not set)
```

**From MSYS2 bash:**
```bash
echo $OMNIROUTE_API_KEY
# Should print the key (or nothing if not set)
```

**From opencode (inside a session):**
```
/run echo $OMNIROUTE_API_KEY
```
This works because opencode's bash tool inherits the environment.

## Failure modes & recovery

### Omniroute server is down

**Symptoms:**
- OpenCode shows an error when trying to use an omniroute model: `Provider "omniroute" returned an error`, `ECONNREFUSED`, or `fetch failed`
- The `/models` command may not show omniroute models if the catalog fetch fails (depends on opencode version)
- Chat requests hang and eventually time out

**Diagnosis:**
```powershell
# From PowerShell
curl.exe -s http://localhost:20128/v1/models
# If server is down: "curl: (7) Failed to connect to localhost port 20128: Connection refused"

# Check if the container/process exists
docker ps --filter name=omniroute   # Docker
Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object { $_.CommandLine -match "omniroute" }  # npm install
```

**Recovery:**
```powershell
# If Docker: restart the container
docker start omniroute

# If npm: restart the process
omniroute

# If unable to start: temporarily remove or disable the omniroute provider
# in opencode.jsonc (see rollback plan)
```

**Graceful degradation:** OpenCode handles provider errors per-request. If omniroute is down but you haven't set it as the default model, only explicit `omniroute/*` model requests will fail. Other providers continue working. If omniroute IS the default model, opencode will show an error on startup — switch to another model with `/model <provider>/<model>` or restore the backup.

### Invalid API key

**Symptoms:**
- OpenCode returns `401 Unauthorized` or `403 Forbidden` when using omniroute models
- The omniroute server logs show `Invalid API key`
- Error message format (from omniroute): `{"error": {"message": "Invalid API key", "type": "authentication_error"}}`

**Diagnosis:**
```powershell
# Test with curl using the actual key
curl.exe -s -X POST http://localhost:20128/v1/chat/completions `
  -H "Content-Type: application/json" `
  -H "Authorization: Bearer $env:OMNIROUTE_API_KEY" `
  -d '{"model":"auto","messages":[{"role":"user","content":"hi"}]}'
```

**Recovery:**
1. Rotate the API key in the omniroute dashboard (http://localhost:20128/endpoints)
2. Update the env var:
   ```powershell
   [Environment]::SetEnvironmentVariable("OMNIROUTE_API_KEY", "sk-new-key", "User")
   ```
3. Restart opencode (env var changes in shell may not propagate to already-running processes)

### Port conflict (20128 in use)

**Detection:**
```powershell
netstat -ano | findstr :20128
```

If something is already listening on port 20128, the output shows the PID. Resolve by:
1. Stopping the conflicting service, OR
2. Running omniroute on a different port

**Resolution with different port:**
```powershell
# Docker: change the host port mapping
docker rm -f omniroute
docker run -d --name omniroute -p 20129:20128 -v omniroute-data:/app/data diegosouzapw/omniroute:latest
# Now available at http://localhost:20129/v1
```

Then update `opencode.jsonc`:
```jsonc
"options": {
  "baseURL": "http://localhost:20129/v1",
  ...
}
```

### Recovery from accidentally running setup-opencode

**If the global `~/.config/opencode/opencode.json` was modified:**

**Option A: Restore from backup** (if one exists):
```powershell
# Check if Windows Backup or git has a copy
copy C:\Users\user\.config\opencode\opencode.json.backup-* C:\Users\user\.config\opencode\opencode.json
```

**Option B: Restore from git global config** (if previously committed):
```bash
# The global config is typically NOT in git, but check
```

**Option C: Manually edit out the omniroute provider block:**
Open `C:\Users\user\.config\opencode\opencode.json` and remove the `"omniroute": { ... }` block from the `provider` object. The rest of the global config should be preserved.

**Option D: Remove the plugin (if `setup opencode` was run):**
```powershell
# Remove the plugin directory
Remove-Item -Recurse -Force "$env:USERPROFILE\.config\opencode\plugins\omniroute"

# Also remove any legacy auth plugin
Remove-Item -Recurse -Force "$env:USERPROFILE\.config\opencode\plugins\opencode-omniroute-auth"
```

Then restore the global opencode.json from backup or re-edit it.

## Rollback plan

### Uninstall omniroute servant

**Docker (if option C was used):**
```powershell
docker stop omniroute
docker rm omniroute
docker volume rm omniroute-data   # Optional: also remove persistent data
```

**npm global (if option A was used):**
```powershell
npm uninstall -g omniroute
```

**npm local root (if option B was used):**
```powershell
npm uninstall omniroute
```

### Revert opencode.jsonc

**If committed to git:**
```bash
git checkout opencode.jsonc
```

**If not committed but backup exists:**
```powershell
copy C:\Users\user\Desktop\Programacion\Node-express-nest\project-one\opencode.jsonc.backup-2026-07-30 C:\Users\user\Desktop\Programacion\Node-express-nest\project-one\opencode.jsonc
```

**If neither:**
Manually remove the `"omniroute": { ... }` block from the `provider` object in `opencode.jsonc`. Use a JSONC-aware editor to ensure valid syntax.

### Remove env vars

**PowerShell:**
```powershell
[Environment]::SetEnvironmentVariable("OMNIROUTE_API_KEY", $null, "User")
```

**bash profiles:**
Remove or comment out the `export OMNIROUTE_API_KEY="..."` line from:
- `~/.bashrc`
- `~/.bash_profile`
- `~/.profile`

**Current PowerShell session:**
```powershell
Remove-Item Env:OMNIROUTE_API_KEY
```

## Execution checklist (for @developer)

- [ ] **1. Back up opencode.jsonc** → `opencode.jsonc.backup-2026-07-30`
- [ ] **2. Back up global config** → `cp ~/.config/opencode/opencode.json ~/.config/opencode/opencode.json.backup-2026-07-30` (if exists)
- [ ] **3. Run port check**: `netstat -ano | findstr :20128` — resolve if occupied
- [ ] **4. Install/launch omniroute** (per Option C/Docker recommended):
      `docker pull diegosouzapw/omniroute:latest && docker run -d --name omniroute -p 20128:20128 -v omniroute-data:/app/data --restart unless-stopped diegosouzapw/omniroute:latest`
- [ ] **5. Test endpoint**: `curl http://localhost:20128/v1/models` — expect JSON list
- [ ] **6. Set OMNIROUTE_API_KEY**:
      - PowerShell: `[Environment]::SetEnvironmentVariable("OMNIROUTE_API_KEY", "sk-...", "User")`
      - `~/.bashrc`: `export OMNIROUTE_API_KEY="sk-..."`
      - `~/.bash_profile`: `export OMNIROUTE_API_KEY="sk-..."`
      - `~/.profile`: `export OMNIROUTE_API_KEY="sk-..."`
- [ ] **7. Edit opencode.jsonc**: Add the `"omniroute": { ... }` provider block (see section above for exact JSONC)
- [ ] **8. (Optional) Set default model or agent-scoped models**: Per user preference
- [ ] **9. Validate opencode.jsonc syntax**: `node -e "JSON.parse(require('fs').readFileSync('opencode.jsonc','utf8').replace(/\/\/.*$/gm,'').replace(/,(\s*[\]}])/g,'$1'))"`
- [ ] **10. Restart opencode**: Close and reopen, or restart server
- [ ] **11. Run /models** in opencode; verify `omniroute/auto`, `omniroute/oc/free`, `omniroute/felo/felo` appear
- [ ] **12. Test chat completion**: `opencode -m omniroute/auto "Hello"` — expect response
- [ ] **13. Regression check**: `opencode -m ollama-local/qwen2.5-coder:7b "Hello"` — verify existing provider still works
- [ ] **14. Update this doc's status to DONE**: Change `Status: PLAN` to `Status: DONE`

## References

| Source | URL | Verified claim |
|--------|-----|----------------|
| opencode providers docs | `https://opencode.ai/docs/providers/` | Custom provider schema: `npm`, `name`, `options.baseURL`, `options.apiKey`, `models`, `models.<id>.limit` |
| opencode config docs | `https://opencode.ai/docs/config/` | Config locations, merge model, no top-level `env` field |
| opencode config JSON schema | `https://opencode.ai/config.json` | Schema confirmed: `additionalProperties: false` at root, no `env` key. `env` only on ProviderConfig (array of strings) and LspConfig (object) |
| opencode agents docs | `https://opencode.ai/docs/agents/` | Agent-scoped model binding via `agent.<name>.model` confirmed |
| opencode models docs | `https://opencode.ai/docs/models/` | Model selection, `model`/`small_model` top-level fields |
| omniroute npm | `https://www.npmjs.com/package/omniroute` | Version 3.8.49/3.8.50, MIT license, open-source |
| omniroute GitHub | `https://github.com/diegosouzapw/OmniRoute` | 34.6k stars, 5,925 commits, 500+ contributors |
| omniroute setup guide | `https://raw.githubusercontent.com/diegosouzapw/OmniRoute/release/v3.8.50/docs/guides/SETUP_GUIDE.md` | Docker/npm install options, CLI flags |
| omniroute CLI integrations | `https://raw.githubusercontent.com/diegosouzapw/OmniRoute/release/v3.8.50/docs/guides/CLI-INTEGRATIONS.md` | `setup-opencode` writes to global config, NOT postinstall hook |
| omniroute package.json | `https://raw.githubusercontent.com/diegosouzapw/OmniRoute/release/v3.8.50/package.json` | Postinstall script: only runtime warmup, skippable via `OMNIROUTE_SKIP_POSTINSTALL=1` |
| omniroute PR #3908 (CJS fix) | `https://github.com/diegosouzapw/OmniRoute/pull/3908` | CJS bundle check removed — `setup-opencode` no longer crashes on ESM-only builds |
| omniroute PR #3883 (ESM-only) | `https://github.com/diegosouzapw/OmniRoute/pull/3883` | Plugin switched from dual ESM+CJS to ESM-only for OpenCode compatibility |
| omniroute PR #3726 (setup opencode) | `https://github.com/diegosouzapw/OmniRoute/pull/3726` | Original `setup opencode` command: writes to XDG config dir, copies plugin |
| Project opencode.jsonc | `C:\Users\user\Desktop\Programacion\Node-express-nest\project-one\opencode.jsonc` | Actual file read: 275 lines, existing ollama-local provider, 8 custom agents |

## Open questions for user

1. **Default model**: Do you want omniroute as the default model for all agents, just specific agents (via agent-scoped binding), or not as default at all (just available on-demand)?

2. **Docker Desktop availability**: Do you have Docker Desktop installed and running? This determines whether Option C (Docker, recommended) is viable vs needing npm.

3. **API key source**: Do you already have an omniroute API key (from the omniroute dashboard at `http://localhost:20128/endpoints`), or do you need instructions on creating one?

4. **Free-tier first**: Do you want to start with just the keyless free models (`auto`, `oc/free`, `felo/felo`) which work without an API key when omniroute is fresh-installed, or do you want to hook up paid API keys from the start?

5. **Model catalog expansion**: After the initial 3-model seed set works, would you like to add specific models (e.g., Claude, GPT, Gemini) to the `opencode.jsonc` as you discover them?

6. **LiteLLM consideration**: Omniroute's main differentiator is its free-tier aggregation and routing strategies. If you only need a single-model proxy, a simpler tool like LiteLLM could suffice. Do you want LiteLLM considered as an alternative, or proceed with omniroute's richer feature set?
