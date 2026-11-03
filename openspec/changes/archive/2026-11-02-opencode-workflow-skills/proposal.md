# Proposal

## Why

The orchestrator, git-manager, and planner prompts embed reusable workflow knowledge (SDD phases, git conventions, design-doc mode) inline. Extracting these into dedicated skills makes them discoverable, loadable on demand, and keeps the agent prompts focused. This is a pure refactor/tooling change: no spec-level behavior changes.

## What Changes

- Create `.opencode/skills/sdd-workflow/SKILL.md` capturing the 6 SDD phases and their gates, extracted from `docs/opencode/prompts/orchestrator.md`.
- Create `.opencode/skills/git-workflow/SKILL.md` capturing Conventional Commits, Trunk-Based Development, and atomic commits, extracted from `docs/opencode/prompts/git-manager.md`.
- Create `.opencode/skills/design-docs/SKILL.md` capturing the planner's normal (non-OpenSpec) design-doc mode, extracted from `docs/opencode/prompts/planner.md`.
- Set `skip_specs: true` in `.openspec.yaml` (no spec-level behavior changes).

## Capabilities

### New Capabilities

<!-- None — this change introduces no new spec-level capabilities. -->

### Modified Capabilities

<!-- None — no requirement changes. -->

## Impact

- Affected files: `.opencode/skills/sdd-workflow/SKILL.md`, `.opencode/skills/git-workflow/SKILL.md`, `.opencode/skills/design-docs/SKILL.md`, `openspec/changes/opencode-workflow-skills/.openspec.yaml`.
- `skills-lock.json` (repo root, not `.opencode/skills-lock.json`) needs no update: it records only skills installed from external sources (`sourceType: github` with `computedHash`), and these three skills are authored in-repo. Skill discovery comes from `skills.paths` in `opencode.jsonc`, not from the lock file.
- No API, runtime, or dependency changes. No spec deltas. Skills become available to the opencode skill loader.
