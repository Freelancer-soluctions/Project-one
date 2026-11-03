# Design

## Context

The orchestrator (`docs/opencode/prompts/orchestrator.md`), git-manager
(`docs/opencode/prompts/git-manager.md`), and planner (`docs/opencode/prompts/planner.md`)
prompts embed reusable workflow knowledge inline: the 6 SDD phases and gates,
Conventional Commits / Trunk-Based Development / atomic commits, and the
planner's normal (non-OpenSpec) design-doc mode. This knowledge is
domain-stable and not agent-specific, so it is a good candidate for on-demand
skills under `.opencode/skills/`, which the opencode skill loader discovers
from the paths declared in `opencode.jsonc` (`skills.paths: [".opencode/skills", ".agents/skills"]`).

See `proposal.md` for motivation and scope. No spec-level behavior changes;
`skip_specs: true` is set in `.openspec.yaml`.

## Goals / Non-Goals

**Goals:**

- Extract the SDD phase/gate knowledge into `.opencode/skills/sdd-workflow/SKILL.md`.
- Extract the git workflow knowledge into `.opencode/skills/git-workflow/SKILL.md`.
- Extract the planner's normal-mode design-doc knowledge into `.opencode/skills/design-docs/SKILL.md`.
- Follow the skill-creator pattern (YAML frontmatter + markdown body, under 500 lines, progressive disclosure).
- Make skills loadable on demand via `/skill <name>`.

**Non-Goals:**

- No changes to agent prompt files' execution behavior; prompts may later reference the skills but this change only creates them.
- No new spec-level capabilities (skip_specs: true).
- No bundled scripts/references/assets beyond a single SKILL.md per skill.
- No description optimization run (trigger eval loop) in this change.

## Decisions

### Decision 1: One SKILL.md per skill (no bundled resources)

**Chosen:** A single `SKILL.md` per skill directory, frontmatter + body, no
`scripts/`/`references/`/`assets/`.

**Rationale:** The extracted content is short, self-contained prose (well under
500 lines). Bundled resources add indirection without benefit for static
reference material. Progressive disclosure is satisfied by the frontmatter
metadata alone; the body is the full skill.

**Alternatives considered:** Splitting into `references/` files per phase —
rejected as over-engineering for content this small; would complicate loading.

### Decision 2: Frontmatter follows skill-creator conventions

**Chosen:** Each SKILL.md uses YAML frontmatter with `name`, `description`,
`license`, and `metadata` (author, version), matching the existing skills in
`.opencode/skills/` (e.g., `openspec-new-change`).

**Rationale:** Consistency with the loader's expectations and existing skills
ensures the skills are recognized and triggerable. `description` is the primary
triggering mechanism and includes both what the skill does and when to use it.

**Alternatives considered:** Minimal frontmatter (name only) — rejected because
the loader relies on `description` for triggering and the existing convention
includes license/metadata.

### Decision 3: Content extraction scope (what goes in, what stays out)

**Chosen:** Extract only the reusable workflow knowledge, not agent identity,
output contracts, or execution plumbing.

- `sdd-workflow`: the 6 phases (0–6), their owners, gates, and the rules
  (sequential tasks, verify before archive). Source: orchestrator.md
  `# SPECIFICATION-DRIVEN WORKFLOW` + `## Fase 0` … `## Phase 6` + gates.
- `git-workflow`: TBD, Conventional Commits (types, scope rules, subject
  pattern), atomic commits, DCO, safety rules. Source: git-manager.md
  `# REPOSITORY CONTEXT`, `## Behavioral Rules`, commit workflow.
- `design-docs`: planner's normal mode (when OpenSpec inactive): allowed
  artifacts, output locations, output format, and the critical distinction vs.
  OpenSpec-active review mode. Source: planner.md `### When OpenSpec is NOT Active`.

**Rationale:** Keeps agent prompts focused on coordination/execution while
making the reusable knowledge discoverable and loadable on demand. Excludes
identity, output-contract, and delegation-suffix material, which is agent-specific.

**Alternatives considered:** Copying whole prompt sections verbatim — rejected
because it would duplicate agent-specific boilerplate and bloat the skill.

### Decision 4: On-demand loading mechanism

**Chosen:** Skills are loaded via `/skill <name>` (and auto-invoke table in
`AGENTS.md`), which reads the SKILL.md body into context only when triggered.
Metadata (name + description) is always in context; body loads on trigger.

**Rationale:** Matches the progressive-disclosure model in skill-creator and
the existing opencode skill loader. No code change needed — placing the
directory under `.opencode/skills/` is sufficient because that path is already
registered in `opencode.jsonc`.

**Alternatives considered:** Eagerly inlining into agent prompts — rejected as
it defeats the purpose of extraction and increases token usage.

## Risks / Trade-offs

- [Content drift] Source prompts may evolve; skills can become stale. Mitigation: skills state "Extracted from <file>" and a future change can re-sync; keep extraction minimal and refer to source for details.
- [Trigger accuracy] Descriptions may under/over-trigger. Mitigation: descriptions are written pushy per skill-creator guidance; description optimization is deferred (Non-Goal) and can be a follow-up.
- [Duplication] Knowledge exists in both prompt and skill. Mitigation: acceptable for a refactor; prompts remain authoritative for agent behavior, skills for on-demand reference.

## Migration Plan

1. Create the three skill directories under `.opencode/skills/`.
2. Write each `SKILL.md` with frontmatter + extracted body.
3. Ensure `.openspec.yaml` has `skip_specs: true` (already set).
4. Verify each skill loads: frontmatter parses, body under 500 lines, directory present in registered skill path.
5. (Optional follow-up) Update agent prompts to reference skills instead of inline knowledge.

## Open Questions

None. All decisions above are resolved and do not require user input.
