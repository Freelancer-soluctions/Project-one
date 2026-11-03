# Tasks: opencode-workflow-skills

## 1. Skill: sdd-workflow

- [x] 1.1 Create `.opencode/skills/sdd-workflow/` directory and verify it exists
- [x] 1.2 Write `SKILL.md` with YAML frontmatter (name, description, license, metadata) and extracted SDD phase/gate content from `orchestrator.md`, and verify frontmatter parses
- [x] 1.3 Verify body is under 500 lines and covers phases 0–6 with gates summary

## 2. Skill: git-workflow

- [x] 2.1 Create `.opencode/skills/git-workflow/` directory and verify it exists
- [x] 2.2 Write `SKILL.md` with YAML frontmatter and extracted git workflow content (TBD, Conventional Commits with types/scopes/breaking changes/footers, atomic commits, DCO, safety rules) from `git-manager.md`, and verify frontmatter parses
- [x] 2.3 Verify body is under 500 lines and includes full Conventional Commits reference (type list, scope conventions, breaking-change notation, footer format, commit-msg hook reference)

## 3. Skill: design-docs

- [x] 3.1 Create `.opencode/skills/design-docs/` directory and verify it exists
- [x] 3.2 Write `SKILL.md` with YAML frontmatter and extracted planner normal-mode design-doc content from `planner.md` (architecture diagrams, technical specs, implementation plans, design documents, output format, examples), and verify frontmatter parses
- [x] 3.3 Verify body is under 500 lines and distinguishes OpenSpec-active vs normal mode

## 4. Verification

- [x] 4.1 Confirm all three skill directories are under a path registered in `opencode.jsonc` (`skills.paths` array) and verify by listing
- [x] 4.2 Confirm `.openspec.yaml` has `skip_specs: true` and verify by reading it
- [x] 4.3 Validate each SKILL.md frontmatter parses as YAML and contains required `name`/`description` fields
- [x] 4.4 Verify git-workflow includes breaking-change notation and footer format
- [x] 4.5 Verify design-docs includes actual planner normal-mode procedures and templates
- [x] 4.6 Document `.opencode/skills-lock.json` update in proposal.md Impact section
