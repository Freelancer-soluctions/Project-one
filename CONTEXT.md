# CONTEXT.md: Project Domain Glossary

## Agent Architecture
- **Orchestrator**: Primary agent that coordinates and delegates to specialized subagents. Never executes domain tasks directly.
- **Subagent**: Secondary agent with a single, bounded responsibility domain.
- **Primary Agent**: Main agent that receives all user requests and redirects them.
- **Subagent Mode**: State of an agent that can only be invoked by the orchestrator.
- **Steps**: Interaction limit for token savings.
- **Tool/Task Permissions**: Granular permissions for tools (write/edit/bash) and invocation.

## Development Methodologies
- **Specification-Driven Development (SDD)**: 6-phase flow (Exploration → Spec → Review → Implementation → Verification → Archive) where specification precedes implementation.
- **Command-Driven Development (CDD)**: Operations triggered by deterministic slash commands.
- **Artifact-Driven Workflow**: Flow based on sequential artifact creation (proposal, specs, design, tasks).
- **Delta Specs**: Incremental specifications for changes against the main specs.
- **Conventional Commits**: Message standard: `type(scope): description`.

## OpenSpec Artifacts
- **Change**: Work container at `openspec/changes/<name>/`.
- **Proposal**: Document of the "why" and "what" of the change.
- **Spec**: Detailed requirements in WHEN/THEN format.
- **Design (SDD)**: Document of technical decisions and architecture.
- **Tasks**: Atomic list of implementation steps with checkboxes.
- **Fast-Forward (FF)**: Bulk artifact creation in a single step.

## Technical Concepts & Skills
- **MCP (Model Context Protocol)**: Communication protocol with external services.
- **Workflow Skill**: Skill that manages the OpenSpec lifecycle.
- **Knowledge Skill**: Skill with domain technical knowledge.
- **Cascading Materialization**: (Suggested term) Synchronization problem when a lesson becomes "real" in the filesystem.
- **gh CLI / GitHub CLI**: Binary at `C:\Program Files\GitHub CLI\gh.exe` for GitHub operations (gists, issues, PRs). Installed via Chocolatey.
- **gh-wrapper**: Shell script at `~/bin/gh` that forwards `gh` commands to `gh.exe`. Required because MSYS2/bash doesn't inherit Windows PATH.
- **Gist Creation Workflow**: `gh gist create <files> --desc "..."` from bash via @git-manager. Creates secret gist by default; add `--public` for public.

## GitHub CLI & Opencode Integration
- **Auth**: `gh auth login` — stores token in Windows Credential Manager (not env vars).
- **Shell compatibility**: Opencode uses `bash` (MSYS2) for agents. `gh.exe` accessed via `~/bin/gh` wrapper.
- **Token scope needed**: `repo`, `gist`, `workflow` for full GitHub operations.
