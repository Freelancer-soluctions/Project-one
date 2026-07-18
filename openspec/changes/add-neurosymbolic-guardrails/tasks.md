## 1. Rules Definition (guardrails-rules.ts)

- [x] 1.1 Create `.opencode/plugins/guardrails-rules.ts` with `Rule` interface (`name`, `description`, `tool`, `validate`) and `ValidationResult` type (`allowed: boolean, message?: string`)
- [x] 1.2 Create `RuleContext` interface (`tool`, `args`, `sessionId`, `callId`)
- [x] 1.3 Implement `validateRules(rules: Rule[], args: unknown, context: RuleContext): ValidationResult` pure function — runs all rules for a tool, collects violations
- [x] 1.4 Create `TOOL_RULES: Record<string, Rule[]>` registry with **12 rules total** — 8 from system scan (Phase 1) + 4 extracted from agent prompt explicit rules (Phase 2, redesigned as pattern-based):

  **From system scan (8 rules — bash/write/edit domain, CRITICAL/HIGH):**
  - **no_git_force_push** (bash) — blocks `git push --force` / `git push -f` — CRITICAL: destroys shared history
  - **no_git_rewrite_history** (bash) — blocks `git rebase`, `git reset --hard`, `git commit --amend`, `git filter-branch`, `git reflog delete` — CRITICAL: destroys commit history
  - **no_git_no_verify** (bash) — blocks `git commit --no-verify`, `git push --no-verify` — CRITICAL: bypasses pre-commit hooks (lint, format, Semgrep, Gitleaks). Note: `-n` short flag intentionally NOT included to avoid false positive with `git commit -m "fix: n/a"`.
  - **no_prisma_db_push_force_reset** (bash) — blocks `prisma db push --force-reset`, `prisma migrate reset`, `prisma db push --accept-data-loss` — HIGH: destroys database data
  - **no_destructive_rm** (bash) — blocks `rm -rf` / `rm -fr` on dangerous paths (`.git`, `node_modules`, `dist`, `build`, `prisma/`) — HIGH: permanently deletes files. Allowlist for `/tmp/` and `node_modules/.cache/` (path resolution required to prevent traversal via `..`)
  - **no_delete_env** (bash) — blocks `rm/del .env*` — CRITICAL: protects credential files
  - **no_write_env_files** (write) — blocks direct write to `.env` files (except `.env.example`) — HIGH: prevents credential hardcoding
  - **no_edit_gitignore_security** (edit) — blocks removal of `.env`, `*.log`, `credentials` exclusions from `.gitignore` — MEDIUM: prevents accidental secret exposure

  **From agent prompt rule extraction (4 rules — Phase 2, redesigned as pattern-based, no agent identity required):**
  - **no_composio_git_ops** (composio_COMPOSIO_*) — blocks git operations invoked via Composio MCP server. Composio has `bash: deny` globally, but git-via-Composio could bypass. Blocks any Composio tool call where the arguments contain git command patterns (git push, git rebase, git commit, git reset, etc.)
  - **no_dev_bash_nonstandard** (bash) — blocks @developer from running bash commands not matching project conventions. Patterns: arbitrary scripts outside `scripts/`, direct `node` invocations with `-e` flags, Python/other language interpreters launched from bash. Excludes: npm scripts, npx, node with file paths, git, prisma, standard dev commands, plus npx playwright/turbo/storybook/nx/tsx/eslint/prettier.
  - **no_planner_write_specs** (write) — blocks direct file writes to `openspec/` directory and `specs/` subdirectories by any agent. Planner should use OpenSpec CLI (`/opsx-new`, `/opsx-propose`). Enforced via path pattern matching — no agent identity needed.
  - **no_direct_trello** (bash) — blocks any direct HTTP calls to Trello/Slack API (api.trello.com, api.slack.com) via bash curl/wget. All agents must delegate Trello operations to @project-manager only. Defense-in-depth for @developer who has bash: allow (Layer 5 covers orchestrator globally with bash: deny).

  **Why 6 rules were dropped (redundant with opencode.jsonc permissions):**
  - `no_spec_manual_create` — spec-manager already has `edit: deny` + global `write: deny`
  - `no_planner_edit_specs` — planner already has `edit: deny`
  - `no_project_mgr_write_code` — project-manager already has `edit: deny`
  - `no_orchestrator_openspec_cli` — orchestrator already has global `bash: deny`
  - `no_orchestrator_trello` — redundant with `no_direct_trello` (same intent, merged)
  - `no_project_mgr_git` — FATAL FLAW: cannot implement as guardrail. Agent identity not available in tool.execute.before for bash tool. Keep as Layer 1 prompt instruction only.

  **Total: 12 rules** covering bash destructive (5), credential protection (2), git safety via pattern matching (3), Composio MCP (1), Trello API restriction via URL pattern (1).

  Note: ~18 rules from prompts CANNOT be guardrails — they are behavioral (delegation sequencing, conversation flow), conversational (ask one question at a time), or output-format rules (JSON escaping, emoji in output). These remain as prompts and output-contracts.ts enforcement.
- [x] 1.5 Export `GuardrailBlockedError` class extending `Error` with `GUARDRAIL_BLOCKED:` prefix

## 2. Hook Plugin (neurosymbolic-guardrails.ts)

- [x] 2.1 Create `.opencode/plugins/neurosymbolic-guardrails.ts` with `tool.execute.before` hook registration
- [x] 2.2 Implement `buildContext(input)` function — extracts `tool`, `args`, `sessionId`, `callId` from tool call input with per-tool switch and fail-safe null return on parse errors
- [x] 2.3 Implement hook logic: lookup rules in `TOOL_RULES` → `buildContext()` → `validateRules()` → throw `GuardrailBlockedError` if blocked
- [x] 2.4 Wrap hook body in try/catch: re-throw `GuardrailBlockedError`, log-and-allow unexpected errors
- [x] 2.5 Wire audit logging to `.opencode/logs/guardrails-audit.jsonl` — JSONL entries with `timestamp`, `tool`, `sessionId`, `callId`, `violations`, `args`
- [x] 2.6 Create `.opencode/logs/` directory lazily on first write (`mkdirSync` with `recursive: true`)

## 3. Plugin Registration (opencode.jsonc)

- [x] 3.1 Add `"./.opencode/plugins/neurosymbolic-guardrails.ts"` to the `plugin` array in `opencode.jsonc`
- [ ] 3.2 Verify both plugins load without errors on OpenCode restart

## 4. Audit Log Verification

- [ ] 4.1 Verify `guardrails-audit.jsonl` is created on first blocked tool call
- [ ] 4.2 Verify each JSONL entry has valid JSON format (`timestamp`, `tool`, `sessionId`, `callId`, `violations`, `args`)
- [ ] 4.3 Ensure `.opencode/logs/` is in `.gitignore` (confirm it's already excluded)

## 5. Stateful Rules (Deferred — MVP Skip)

- [ ] 5.1 Implement JSON file persistence for rule state tracking (e.g., payment validation counters)
- [ ] 5.2 Add `stateFile` option to rule interface for rules that need cross-call state
- [ ] 5.3 Implement `loadState()` / `saveState()` helpers with file-locking consideration

## 6. Production Hardening

- [ ] 6.1 Write Vitest unit tests for `validateRules()` — test all-pass, one-fail, multiple-fail, empty-rules, deterministic behavior
- [ ] 6.2 Write Vitest unit tests for `buildContext()` — test recognized tool, unrecognized tool, parse error
- [ ] 6.3 Write integration test: register hook + trigger blocked call + verify audit log entry
- [ ] 6.4 Document the steer pattern gap in design.md. Add prompt instruction workaround to orchestrator.md system prompt AND all subagent prompt files (spec-manager.md, git-manager.md, planner.md, developer.md, reviewer.md, researcher.md, project-manager.md). Instruction text: "If a tool call fails with a 'BLOCKED:' or 'Tool call failed' error, the agent SHOULD self-correct based on the implied rule and retry with valid arguments rather than repeating the same call." Verify all 7 agent prompt files include the instruction.
- [x] 6.5 Implement `sanitizeArgs(args: Record<string, unknown>): Record<string, unknown>` helper that redacts known sensitive fields (password, apiKey, token, secret, authorization, cookie, x-api-key, x-auth-token) before writing to JSONL audit log. Apply in the audit log write path in neurosymbolic-guardrails.ts.
- [ ] 6.6 Document all 4 gaps (steer, try/catch, registry, state) with workarounds in design.md
