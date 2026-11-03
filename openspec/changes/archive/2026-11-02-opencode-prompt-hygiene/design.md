# Design

## Context

OpenCode loads `AGENTS.md`, `CONTEXT.md`, and `docs/CONTEXT-CICD.md` into every agent's
system prompt via the `instructions` array in `opencode.jsonc`. The four subagent prompts
(`developer.md`, `planner.md`, `researcher.md`, `project-manager.md`) each carry an MCP tool
usage policy section plus a trailing `**Why:**` rationale paragraph. `orchestrator.md` rule 19
instructs injecting `CONTEXT.md` into subagent prompts, which the `instructions` array already
does. See `proposal.md` for motivation and scope.

## Goals / Non-Goals

**Goals:**

- Remove only the rationale paragraphs (`**Why:**` lines) from the four named prompts,
  preserving actionable bullet guidance.
- Make CI/CD context available on-demand through a new `cicd-context` skill instead of
  always-loaded.
- Remove `docs/CONTEXT-CICD.md` from the `instructions` array.
- Remove the redundant orchestrator rule 19 (and renumber subsequent rules) after verifying
  `CONTEXT.md` is already injected globally.

**Non-Goals:**

- No changes to MCP permission configuration in `opencode.jsonc`.
- No rewriting of `docs/CONTEXT-CICD.md` content (it stays as the skill's source).
- No behavior/spec changes; `skip_specs: true`.

## Decisions

### D1 — Scope of prompt edits: remove MCP policy blocks AND `**Why:**` lines

- **Decision:** Remove the entire `# MCP TOOL USAGE POLICY` section (heading + all bullets) from each of the four prompts, AND remove the trailing `**Why:**` rationale lines. Both the MCP policy blocks and the Why paragraphs are removed per PRD Phase 1 ("Quita de los prompts los bloques de política de MCP y los párrafos 'Why:'").
- **Why:** The MCP policy blocks are redundant — MCP permissions are already enforced by `opencode.jsonc` permission settings (global `composio_COMPOSIO_*: deny`, `context7_*: deny`, and per-agent overrides). The `**Why:**` lines restate the permission rationale and inflate tokens without changing behavior. Removing both eliminates the duplication identified in the PRD ("el bloque de política de MCP se repite en 5 prompts").
- **Alternatives:** Keeping the MCP blocks as documentation was considered but rejected — the PRD explicitly calls for their removal, and the permission system is the authoritative source of truth for MCP tool access. Keeping them would leave redundant content that the PRD wants eliminated.
- **Affected sections:**
  - `docs/opencode/prompts/developer.md` — `## Context7 (\`context7\_\*\`)` subsection (heading + bullets + Why line)
  - `docs/opencode/prompts/planner.md` — `# MCP TOOL USAGE POLICY` section (heading + all bullets + Why line)
  - `docs/opencode/prompts/researcher.md` — `## Context7 (\`context7\_\*\`)` subsection (heading + bullets + Why line)
  - `docs/opencode/prompts/project-manager.md` — `## Composio (\`composio*COMPOSIO*\*\`)` subsection (heading + bullets + Why line)

### D2 — Affected prompts and exact removals

| Prompt                                     | Section                                  | Removed line                                                                                                                                                                                                                     |
| ------------------------------------------ | ---------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `docs/opencode/prompts/developer.md`       | `## Context7 (\`context7\_\*\`)`         | `- **Why:** Context7 is for targeted API validation, not routine lookups. The \`ask\` permission prevents resource waste.`                                                                                                       |
| `docs/opencode/prompts/planner.md`         | `# MCP TOOL USAGE POLICY`                | `**Why:** Context7 is for deep technical research, not routine validation. The \`ask\` permission keeps it available for when it's truly needed.`                                                                                |
| `docs/opencode/prompts/researcher.md`      | `## Context7 (\`context7\_\*\`)`         | `**Why:** Context7 is for deep-dive API validation. The \`ask\` permission ensures you only call it when truly needed.`                                                                                                          |
| `docs/opencode/prompts/project-manager.md` | `## Composio (\`composio*COMPOSIO*\*\`)` | `**Why:** Composio MCP provides Trello integration. It should ONLY be triggered by explicit Trello slash commands (\`/trello-create-card\`, etc.). Auto-invocation would waste API calls and could cause unwanted side effects.` |

- Verified via grep: no other prompts contain `**Why:**` MCP rationale lines.

### D3 — cicd-context skill

- **Location:** `.opencode/skills/cicd-context/SKILL.md`, mirroring
  `.opencode/skills/git-workflow/SKILL.md` frontmatter (name, description, license, metadata).
- **Content:** Concise index/quick facts (active vs disabled workflows, ruleset 21227644,
  required checks, CI_MINIMAL, gates) plus a pointer to `docs/CONTEXT-CICD.md` for full detail.
  Avoid duplicating the 1737-line doc; load full content on demand by reading the file.
- **Source:** `docs/CONTEXT-CICD.md` (unchanged; remains the canonical full reference).
- **Trigger:** description states "Use when working on CI/CD, GitHub Actions, workflows, or
  repository governance."

### D4 — Remove CONTEXT-CICD.md from instructions

- Edit `opencode.jsonc` `instructions` array: remove `"docs/CONTEXT-CICD.md"` entry; keep
  `AGENTS.md` and `CONTEXT.md`.

### D5 — Rule 19 verification and removal

- **Verification:** `CONTEXT.md` is present in `instructions` (line 56 of `opencode.jsonc`), so it
  is injected into every agent automatically; orchestrator rule 19 ("ALWAYS inject CONTEXT.md
  into subagent prompts before delegation") is redundant.
- **Verification method:** grep `CONTEXT.md` in `opencode.jsonc` instructions array; confirm
  `orchestrator.md` contains rule 19 text; confirm no external references depend on rule
  numbers.
- **Action:** Delete rule 19 line and renumber rules 20–26 to 19–25 to keep sequential
  numbering. Leave Token Efficiency Protocols section 1 as-is (it documents the protocol
  conceptually; behavior unchanged).

## Before/After

### developer.md (Context7)

Before:

```
- ✅ The `ask` permission level ensures you cannot auto-invoke — user must confirm each call
- **Why:** Context7 is for targeted API validation, not routine lookups. The `ask` permission prevents resource waste.
```

After:

```
- ✅ The `ask` permission level ensures you cannot auto-invoke — user must confirm each call
```

### planner.md (MCP TOOL USAGE POLICY)

Before:

```
- ✅ The `ask` permission prevents auto-invocation

**Why:** Context7 is for deep technical research, not routine validation. The `ask` permission keeps it available for when it's truly needed.
```

After:

```
- ✅ The `ask` permission prevents auto-invocation
```

### researcher.md

Before:

```
- ✅ The `ask` permission prevents auto-invocation while keeping the tool available for deep research

**Why:** Context7 is for deep-dive API validation. The `ask` permission ensures you only call it when truly needed.
```

After:

```
- ✅ The `ask` permission prevents auto-invocation while keeping the tool available for deep research
```

### project-manager.md

Before:

```
5. ✅ ONLY call Composio tools in direct response to /trello-\* command from orchestrator

**Why:** Composio MCP provides Trello integration. It should ONLY be triggered by explicit Trello slash commands (`/trello-create-card`, etc.). Auto-invocation would waste API calls and could cause unwanted side effects.
```

After:

```
5. ✅ ONLY call Composio tools in direct response to /trello-\* command from orchestrator
```

### opencode.jsonc instructions

Before:

```
"instructions": [
  "AGENTS.md",
  "CONTEXT.md",
  "docs/CONTEXT-CICD.md"
],
```

After:

```
"instructions": [
  "AGENTS.md",
  "CONTEXT.md"
],
```

### orchestrator.md Behavioral Rules

Before: rule 19 line present; rules 20–26 follow.
After: rule 19 line removed; rules 20–26 renumbered to 19–25.

## Risks / Trade-offs

- [Removing Why: lines] → Mitigation: bullets retained; permission system still enforces `ask`.
- [Removing CONTEXT-CICD from instructions] → Mitigation: new skill provides on-demand access; full doc still in repo.
- [Rule renumbering] → Mitigation: only sequential numbers change; no external references depend on numbers (verified grep for "rule 19" only in analysis doc, not code).

## Migration Plan

1. Edit four prompts (remove `**Why:**` lines).
2. Create `.opencode/skills/cicd-context/SKILL.md`.
3. Edit `opencode.jsonc` instructions array.
4. Edit `orchestrator.md` rule 19 + renumber.
5. Validate JSON syntax (`opencode.jsonc`) and grep verification.

## Open Questions

None.
