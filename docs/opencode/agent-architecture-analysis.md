---

# Subagent System Architectural Analysis

> **Project:** project-one  
> **Date:** May 18, 2026 (v1.3 — steps audit applied, v1.2: Steps Configuration Analysis, v1.1: Phase 0, Token Efficiency, skill discrimination)  
> **Purpose:** Document and analyze the intelligent agent architecture, its design patterns, associated terminology, and technology stack.

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Architecture Overview](#2-architecture-overview)
3. [Agent Topology](#3-agent-topology)
4. [Architectural Patterns & Approaches](#4-architectural-patterns--approaches)
5. [Specification-Driven Workflow (SDD)](#5-specification-driven-workflow-sdd)
6. [Command System (Command-Driven Development)](#6-command-system-command-driven-development)
7. [Skill System](#7-skill-system)
8. [Agent Architecture Tech Stack](#8-agent-architecture-tech-stack)
9. [External Integrations (MCP)](#9-external-integrations-mcp)
10. [Project Management & Lifecycle](#10-project-management--lifecycle)
11. [Security & Quality](#11-security--quality)
12. [Real Case Studies](#12-real-case-studies)
13. [General Architecture Diagram](#13-general-architecture-diagram)
14. [Glossary of Terms](#14-glossary-of-terms)
15. [Conclusions & Recommendations](#15-conclusions--recommendations)

---

## 1. Executive Summary

The subagent system of **project-one** implements a **multi-agent orchestration architecture** on the OpenCode platform. It consists of **7 specialized agents** coordinated by a **central orchestrator**, following the principles of **Specification-Driven Development (SDD)**, **Command-Driven Development (CDD)**, and **System Design Document (SDD)** as fundamental methodologies.

This architecture allows strictly separating responsibilities across the software development lifecycle: exploration, specification, planning, implementation, review, source code management, and project management — all automated through specialized AI agents.

In its most recent evolution, the architecture has incorporated three key innovations: (1) **Phase 0 (/grill-me)**, an exhaustive user interrogation phase before any specification; (2) **Token Efficiency Protocols**, a set of 3 strategic rules (Context Injection, 20-Word Rule, /caveman) to optimize token consumption; and (3) **Skill Discrimination**, a system that assigns each skill to the precise agent and component where it should execute, avoiding unnecessary loads.

---

## 2. Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    OPENCODE PLATFORM                        │
│                                                             │
│  ┌───────────────────────────────────────────────────┐      │
│  │             ORCHESTRATOR (Primary Agent)           │      │
│  │  Model: opencode/big-pickle                      │      │
│  │  Role: Coordination and delegation                │      │
│  │  Tools: question, task (denied: write/edit/bash)  │      │
│  └──────┬──────┬──────┬──────┬──────┬──────┬───────┘      │
│         │      │      │      │      │      │              │
│         ▼      ▼      ▼      ▼      ▼      ▼              │
│  ┌────────┐ ┌──────┐ ┌────┐ ┌──────┐ ┌──────┐ ┌───────┐  │
│  │ spec-  │ │ git- │ │plan│ │devel │ │review│ │project│  │
│  │manager │ │manager│ │ner │ │oper  │ │ er   │ │manager│  │
│  │CLI ops │ │  SCM │ │Rev.│ │Impl. │ │Review│ │Trello │  │
│  └────────┘ └──────┘ └────┘ └──────┘ └──────┘ └───────┘  │
│         │                                       │         │
│         ▼                                       ▼         │
│  ┌──────────┐                           ┌────────────┐    │
│  │researcher│                           │  MCP Apps  │    │
│  │  Invest. │                           │Composio/T7 │    │
│  └──────────┘                           └────────────┐    │
└─────────────────────────────────────────────────────────────┘
```

### Core Principles

| Principle | Description |
|-----------|-------------|
| **Single Responsibility Agent** | Each agent has exactly one domain of responsibility |
| **Centralized Orchestration** | The orchestrator is the single entry point for delegation |
| **Zero Implementation by Coordinator** | The orchestrator NEVER writes code, specs, or performs reviews |
| **Command-Driven Operations** | Each workflow is triggered by predefined slash commands |
| **Specification-First** | Every implementation must be preceded by formal specifications |
| **Token Efficiency First** | All inter-agent communication must prioritize lexical compression: CONTEXT.md, /caveman, 20-word rule |
| **Phase 0 Interrogation** | Before specifying, the orchestrator must ask the user ≥3 critical questions using the `grill-me` skill |

---

## 3. Agent Topology

### 3.1 Orchestrator

| Property | Value |
|----------|-------|
| **ID** | `orchestrator` |
| **Mode** | `primary` |
| **Model** | `opencode/big-pickle` |
| **Steps** | 45 |
| **Tools** | `question`, `task` (write/edit/bash = false) |
| **Prompt** | `docs/opencode/prompts/orchestrator.md` (374 lines) |

**Responsibilities:**
- Workflow coordination
- Phase sequencing
- Delegation to specialized agents
- Full lifecycle tracking
- Error and blocker handling
- Phase 0 execution: loads `/skill grill-me` and interviews the user
- Token Efficiency Protocols application (CONTEXT.md injection, /caveman in delegations)

**Critical Restrictions:**
- ❌ Does not write code
- ❌ Does not create specifications
- ❌ Does not perform reviews
- ❌ Does not execute git operations
- ❌ Does not execute project management operations directly

### 3.2 Spec-Manager

| Property | Value |
|----------|-------|
| **ID** | `spec-manager` |
| **Mode** | `subagent` |
| **Model** | `nvidia/minimaxai/minimax-m2.7` |
| **Steps** | 15 |
| **Tools** | `bash` (write/edit = false) |
| **Prompt** | `docs/opencode/prompts/spec-manager.md` (274 lines) |

**Responsibilities:**
- OpenSpec CLI command execution (`/opsx-*`)
- Specification generation
- Specification validation
- OpenSpec operational flows

### 3.3 Git-Manager

| Property | Value |
|----------|-------|
| **ID** | `git-manager` |
| **Mode** | `subagent` |
| **Model** | `nvidia/minimaxai/minimax-m2.7` |
| **Steps** | 20 |
| **Tools** | `bash` (write/edit = false) |
| **Prompt** | `docs/opencode/prompts/git-manager.md` (89 lines) |

**Responsibilities:**
- Git workflows
- Conventional Commits
- Repository state management
- Source control operations

### 3.4 Planner

| Property | Value |
|----------|-------|
| **ID** | `planner` |
| **Mode** | `subagent` |
| **Model** | `opencode/ring-2.6-1t-free` |
| **Steps** | 15 |
| **Tools** | `write` (edit/bash = false) |
| **Prompt** | `docs/opencode/prompts/planner.md` (67 lines) |

**Responsibilities:**
- Technical specification review
- Technical feasibility validation
- Improvement suggestions
- Potential issue identification

### 3.5 Developer

| Property | Value |
|----------|-------|
| **ID** | `developer` |
| **Mode** | `subagent` |
| **Model** | `opencode/qwen3.6-plus-free` |
| **Steps** | 25 |
| **Tools** | `write`, `edit`, `bash` |
| **Prompt** | `docs/opencode/prompts/developer.md` (33 lines) |

**Responsibilities:**
- Code implementation following tasks
- Sequential task execution from `tasks.md`
- Test writing
- Project convention adherence

### 3.6 Reviewer

| Property | Value |
|----------|-------|
| **ID** | `reviewer` |
| **Mode** | `subagent` |
| **Model** | `opencode/nemotron-3-super-free` |
| **Steps** | 10 |
| **Tools** | None (write/edit/bash = false) |
| **Prompt** | `docs/opencode/prompts/reviewer.md` (155 lines) |

**Responsibilities:**
- Code validation against specifications
- Correctness, security, performance, quality, testing checklist
- Structured report with severities (CRITICAL/HIGH/MEDIUM/LOW)

### 3.7 Researcher

| Property | Value |
|----------|-------|
| **ID** | `researcher` |
| **Mode** | `subagent` |
| **Model** | `opencode/minimax-m2.5` |
| **Steps** | 12 |
| **Tools** | `bash` (write/edit not defined) |
| **Permissions** | `webfetch: allow` |
| **Prompt** | `docs/opencode/prompts/researcher.md` (85 lines) |

**Responsibilities:**
- Technical research
- Official documentation analysis
- Best practices and pattern research
- Integration with OpenSpec exploration flow

### 3.8 Project-Manager

| Property | Value |
|----------|-------|
| **ID** | `project-manager` |
| **Mode** | `subagent` |
| **Model** | `nvidia/minimaxai/minimax-m2.7` |
| **Steps** | 15 |
| **Tools** | None (write/edit/bash = false) |
| **Prompt** | `docs/opencode/prompts/project-manager.md` (176 lines) |

**Responsibilities:**
- Trello flow management
- Card creation/movement/deletion
- State synchronization with development cycle
- Workflow transitions

### 3.9 Agent Comparison Table

| Agent | Model | Steps | Prompt | write | edit | bash | Mode |
|-------|-------|-------|--------|-------|------|------|------|
| **Orchestrator** | `big-pickle` | 45 | 374 | ❌ | ❌ | ❌ | primary |
| **Spec-Manager** | `minimax-m2.7` | 15 | 274 | ❌ | ❌ | ✅ | subagent |
| **Git-Manager** | `minimax-m2.7` | 20 | 89 | ❌ | ❌ | ✅ | subagent |
| **Planner** | `ring-2.6-1t-free` | 15 | 67 | ✅ | ❌ | ❌ | subagent |
| **Developer** | `qwen3.6-plus-free` | 25 | 33 | ✅ | ✅ | ✅ | subagent |
| **Reviewer** | `nemotron-3-super-free` | 10 | 155 | ❌ | ❌ | ❌ | subagent |
| **Researcher** | `minimax-m2.5` | 12 | 85 | - | - | ✅ | subagent |
| **Project-Manager** | `minimax-m2.7` | 15 | 176 | ❌ | ❌ | ❌ | subagent |

---

## 4. Architectural Patterns & Approaches

### 4.1 Multi-Agent Orchestration Pattern

The architecture follows the **Centralized Orchestrator** pattern where a primary agent (orchestrator) receives all requests and delegates to specialized subagents.

**Characteristics:**
- **Explicit coordination**: The orchestrator handles sequencing and dependencies
- **Separation of concerns**: Each subagent has a bounded domain
- **Mandatory delegation**: The orchestrator cannot execute domain tasks
- **Granular permissions**: Tool configuration per agent

### 4.2 Specification-Driven Development (SDD)

Central methodology where every implementation must be preceded by formal specifications. The lifecycle has 6 phases:

```
Phase 0: Interrogation (/grill-me)
         │
         ▼
Phase 1: Exploration ─► Phase 2: Spec Creation ─► Phase 3: Spec Review
                                                           │
                                                           ▼
                                                   Phase 4: Implementation
                                                           │
                                                           ▼
                                                   Phase 5: Verification
                                                           │
                                                           ▼
                                                   Phase 6: Archive
```

### 4.3 Command-Driven Development (CDD)

Every operation in the system is triggered by predefined slash commands. This enables:

- **Determinism**: Each command has predictable behavior
- **Logic separation**: Operational logic lives in command files
- **Exact execution**: Agents execute commands exactly as delegated
- **Living documentation**: Commands are self-documented (frontmatter `description`)

### 4.4 Two-Mode Operation

Each agent operates in two modes depending on context:

| Mode | When | Behavior |
|------|------|----------|
| **OpenSpec Active (SDD)** | Active change exists in `openspec/changes/` | Strictly follows `tasks.md` and `design.md` |
| **Normal Mode** | No active SDD | Uses own judgment, creates documentation, implements directly |

### 4.5 Agent Permission Model

The architecture implements a **per-agent permission model** at three levels:

1. **Tool Permissions**: `write`, `edit`, `bash` enabled/disabled
2. **Task Permissions**: Which subagents the orchestrator can invoke (allow/deny)
3. **Feature Permissions**: Special permissions like `webfetch: allow`

```jsonc
// Example orchestrator permission configuration
"permission": {
  "question": "allow",
  "task": {
    "*": "deny",                    // Denied by default
    "spec-manager": "allow",        // Only these allowed
    "planner": "allow",
    "developer": "allow",
    "reviewer": "allow",
    "researcher": "allow",
    "git-manager": "allow",
    "project-manager": "allow"
  }
}
```

### 4.6 Document-Driven Artifacts

The specification system uses an artifact-based model:

```
openspec/changes/<change-name>/
├── .openspec.yaml       # Metadata (schema, created date)
├── proposal.md          # What & Why (problem, solution, scope)
├── specs/               # Delta specs (incremental changes)
│   └── <capability>/
│       └── spec.md      # Requirements in WHEN/THEN format
├── design.md            # How (technical decisions, architecture)
└── tasks.md             # Implementation checklist with checkboxes
```

### 4.7 Steps Configuration Analysis

The `steps` property in `opencode.jsonc` determines the maximum number of AI interaction turns an agent can execute before being interrupted. Each turn = one think+respond cycle. When steps run out mid-workflow, the agent is cut off without completing its task — no error, no warning.

#### Current Configuration vs. Actual Demand

| Agent | Steps | Tools | Workflow Demand | Verdict |
|-------|:-----:|-------|-----------------|:-------:|
| **Orchestrator** | 45 | question, task | ~25-35 turns for full SDD lifecycle delegation | ✅ Adequate |
| **Spec-Manager** | 15 | bash | 3-4 sequential commands; `/opsx-new` consumes 4-6 turns alone | ✅ Adequate |
| **Git-Manager** | 20 | bash | 5-15 turns depending on number of commit groups + hook failures | ✅ Adequate |
| **Planner** | 15 | write | 4-file review consumes all 5 turns; no margin for re-read or multi-spec files | ✅ Adequate |
| **Developer** | 25 | write, edit, bash | 3 clean tasks fit; 4th task or test failures or #context7 queries push past 15 | ✅ Adequate |
| **Reviewer** | 10 | none | Can read 2-3 files; cannot review 5-10 files across 7 checklist sections | ✅ Adequate |
| **Researcher** | 12 | bash | Single-source research fits; multi-source research exceeds limit | ✅ Adequate |
| **Project-Manager** | 15 | none | 2-3 Trello operations fit; complex card + multi-move may exceed | ✅ Adequate |

#### Turn Trace: `/commit-all` (Git-Manager Case Study)

The `/commit-all` command groups changes into Conventional Commits. Its workflow trace:

| Turn | Action |
|:----:|--------|
| 1 | `git status --short` |
| 2 | `git diff --stat` |
| 3 | `git diff` |
| 4 | `git log --oneline -10` |
| 5 | Analyze, plan groups, present plan |
| 6 | `git add` + `git commit` (group 1) |
| 7 | `git add` + `git commit` (group 2) |
| 8 | `git add` + `git commit` (group 3) |
| 9 | `git add` + `git commit` (group 4) |
| 10 | Handle hook failure if any |
| 11 | `git add` + `git commit` (group 5) |
| 12 | Summarize result |

With the original `steps: 10`, the agent was cut off after 5 groups with no room for summary or error recovery. After correcting to `steps: 20`, there is sufficient margin.

#### Resolution Status

All priority recommendations from v1.2 have been applied. Current status:

| Priority | Agent | Was | Now | Status |
|:--------:|-------|:---:|:---:|:------:|
| **1** | Developer | 15 | 25 | ✅ Applied |
| **2** | Reviewer | 5 | 10 | ✅ Applied |
| **3** | Spec-Manager | 8 | 15 | ✅ Applied (exceeds 12 recommendation) |
| **4** | Planner | 5 | 15 | ✅ Applied (exceeds 8 recommendation) |
| **5** | Researcher | 8 | 12 | ✅ Applied |
| **6** | Orchestrator | 35 | 45 | ✅ Applied (extra headroom) |
| **7** | Project-Manager | 10 | 15 | ✅ Applied (extra headroom) |

All agents now have adequate steps for their workflow demands. The steps exhaustion issue that affected `/commit-all` (Git-Manager at original 10) and other agent truncations has been resolved across the entire architecture.

---

## 5. Specification-Driven Workflow (SDD)

### 5.1 Detailed Phases

#### Phase 0: Relentless Interrogation (/grill-me)

| Action | Delegate | Command |
|--------|----------|---------|
| Load interrogation skill | @orchestrator | `/skill grill-me` |
| Interview the user (≥3 questions) | @orchestrator | One question at a time |
| Confirm shared understanding | @orchestrator | Wait for user confirmation |

**Phase 0 Rules:**
1. Load the skill: `/skill grill-me`
2. Interview the user following the skill instructions — one question at a time
3. If a question can be answered by exploring the codebase, do so before asking
4. DO NOT delegate to @spec-manager until the user confirms absolute shared understanding of the plan

**Complementary Skill Loading:**
- After Phase 0, if the orchestrator will delegate internally, load `/skill caveman` for ultra-compressed communication

#### Phase 1: Exploration

| Action | Delegate | Command |
|--------|----------|---------|
| Explore existing context | @spec-manager | `/opsx-explore <topic>` |
| Onboard repository | @spec-manager | `/opsx-onboard` |
| Technical investigation | @researcher | Direct delegation |

#### Phase 2: Specification Creation

| Action | Delegate | Command |
|--------|----------|---------|
| New change (step by step) | @spec-manager | `/opsx-new <name>` |
| Propose change (all-in-one) | @spec-manager | `/opsx-propose <name>` |
| Fast-forward artifacts | @spec-manager | `/opsx-ff <name>` |
| Continue change | @spec-manager | `/opsx-continue <name>` |

#### Phase 3: Specification Review

| Action | Delegate |
|--------|----------|
| Review proposal | @planner |
| Validate design | @planner |
| Verify tasks | @planner |

**Review Checklist:**
1. `proposal.md` - Problem and solution clearly defined?
2. `specs/` - Requirements in WHEN/THEN format?
3. `design.md` - Solid architecture? Missing components?
4. `tasks.md` - Atomic tasks? Correct order? Missing steps?

#### Phase 4: Implementation

| Action | Delegate | Command |
|--------|----------|---------|
| Implement task | @developer | Direct instruction |
| Apply changes | @spec-manager | `/opsx-apply <name>` |
| Continue implementation | @spec-manager | `/opsx-continue <name>` |

**Implementation Rules:**
- Tasks execute **sequentially** (1, 2, 3...)
- Each task is marked complete (`[x]`) before continuing
- The developer reads `tasks.md` completely before starting

#### Phase 5: Verification

| Action | Delegate | Command |
|--------|----------|---------|
| Verify against specs | @spec-manager | `/opsx-verify <name>` |
| Validate code quality | @reviewer | Direct instruction |

**Verification Dimensions:**
1. **Completeness**: Tasks complete, requirement coverage
2. **Correctness**: Requirements implemented, scenarios covered
3. **Coherence**: Design adherence, pattern consistency

#### Phase 6: Archive

| Action | Delegate | Command |
|--------|----------|---------|
| Archive change | @spec-manager | `/opsx-archive <name>` |
| Bulk archive | @spec-manager | `/opsx-bulk-archive` |

---

## 6. Command System (Command-Driven Development)

### 6.1 Command Architecture

Slash commands are defined in Markdown files inside `.opencode/command/` with YAML frontmatter:

```markdown
---
description: <functional description>
---
<detailed execution instructions>
```

### 6.2 Command Catalog

#### OpenSpec Commands (11 commands)

| File | Command | Purpose |
|------|---------|---------|
| `opsx-explore.md` | `/opsx-explore` | Exploration mode: think, investigate, clarify |
| `opsx-new.md` | `/opsx-new` | Create new change step by step |
| `opsx-propose.md` | `/opsx-propose` | Create change + all artifacts in one step |
| `opsx-ff.md` | `/opsx-ff` | Fast-forward: create all artifacts at once |
| `opsx-apply.md` | `/opsx-apply` | Implement tasks from a change |
| `opsx-continue.md` | `/opsx-continue` | Continue working on a change |
| `opsx-verify.md` | `/opsx-verify` | Verify implementation against artifacts |
| `opsx-archive.md` | `/opsx-archive` | Archive completed change |
| `opsx-bulk-archive.md` | `/opsx-bulk-archive` | Archive multiple changes |
| `opsx-sync.md` | `/opsx-sync` | Sync delta specs with main specs |
| `opsx-onboard.md` | `/opsx-onboard` | Guided OpenSpec flow onboarding |

#### Git Commands (1 command)

| File | Command | Purpose |
|------|---------|---------|
| `commit-all.md` | `/commit-all` | Group changes into Conventional Commits |

#### Trello Commands (3 commands)

| File | Command | Purpose |
|------|---------|---------|
| `trello-create-card.md` | `/trello-create-card` | Create Trello card |
| `trello-update-card.md` | `/trello-update-card` | Update/move card |
| `trello-delete-card.md` | `/trello-delete-card` | Permanently delete card |

### 6.3 CDD Principles

1. **Determinism**: Same command → same behavior
2. **Self-containment**: Each command has all necessary logic
3. **Exact execution**: Agents execute WITHOUT modifying the command
4. **Integrated documentation**: The frontmatter `description` serves as IDE help

---

## 7. Skill System

### 7.1 Two Skill Layers

```
.opencode/skills/ (11 skills)     .agents/skills/ (15 skills)
├── openspec-apply-change          ├── caveman
├── openspec-archive-change        ├── grill-me
├── openspec-bulk-archive-change   ├── modern-javascript-patterns
├── openspec-continue-change       ├── nodejs-backend-patterns
├── openspec-explore               ├── owasp-security-check
├── openspec-ff-change             ├── playwright-best-practices
├── openspec-new-change            ├── postgresql-table-design
├── openspec-onboard               ├── prisma-postgres
├── openspec-propose               ├── react-testing-library
├── openspec-sync-specs            ├── shadcn
├── openspec-verify-change         ├── storybook
                                   ├── tailwind-design-system
                                   ├── test-driven-development
                                   └── vitest
```

### 7.2 Skills OpenSpec (Workflow Layer)

Skills that handle the change lifecycle. Loaded via `/skill` and correspond 1:1 with slash commands. Exclusively owned by @spec-manager.

### 7.3 Domain Skills (Knowledge Layer)

Skills that provide specialized technical knowledge for implementation:

| Skill | Source | Purpose |
|-------|--------|---------|
| `caveman` | `mattpocock/skills` (GitHub) | Ultra-compressed communication (token efficiency) |
| `grill-me` | `mattpocock/skills` (GitHub) | Exhaustive user interrogation (Phase 0) |
| `modern-javascript-patterns` | `wshobson/agents` (GitHub) | Modern ES6+ patterns |
| `nodejs-backend-patterns` | `wshobson/agents` (GitHub) | Production-ready Node.js backend |
| `owasp-security-check` | `sergiodxa/agent-skills` (GitHub) | OWASP security audit |
| `playwright-best-practices` | `currents-dev/...` (GitHub) | E2E testing with Playwright |
| `postgresql-table-design` | `wshobson/agents` (GitHub) | PostgreSQL schema design |
| `prisma-postgres` | `prisma/skills` (GitHub) | Prisma setup and operations |
| `react-testing-library` | `itechmeat/llm-code` (GitHub) | React component testing |
| `shadcn` | `vercel/vercel-plugin` (GitHub) | shadcn/ui components |
| `storybook` | `dalestudy/skills` (GitHub) | Storybook CSF 3.0 |
| `tailwind-design-system` | `wshobson/agents` (GitHub) | Design systems with Tailwind |
| `test-driven-development` | `obra/superpowers` (GitHub) | TDD: test-first development |
| `vercel-react-best-practices` | `vercel-labs/agent-skills` (GitHub) | React/Vercel optimization |
| `vitest` | `onmax/nuxt-skills` (GitHub) | Unit testing with Vitest |

### 7.4 Classification by Agent and Component

Each skill is discriminated to load ONLY in the corresponding context:

| Category | Skills | Agent | Component | SDD Phase |
|----------|--------|-------|-----------|-----------|
| **Meta-Skills** | `grill-me`, `caveman` | Orchestrator / Reviewer / Git-Manager | Cross-cutting | Phase 0, delegations |
| **OpenSpec Workflow** | `openspec-*` (11) | Spec-Manager | Cross-cutting | Phases 1-6 |
| **Backend** | `nodejs-backend-patterns`, `postgresql-table-design`, `prisma-postgres` | Developer | `apps/server/`, `prisma/` | Phase 4 |
| **Frontend** | `vercel-react-best-practices`, `shadcn`, `tailwind-design-system`, `storybook`, `modern-javascript-patterns` | Developer | `apps/client/`, `components/ui/` | Phase 4 |
| **Testing** | `vitest`, `react-testing-library`, `playwright-best-practices`, `test-driven-development` | Developer | `apps/*/tests/`, `apps/e2e/` | Phase 4 |
| **Security** | `owasp-security-check` | Reviewer | Cross-cutting | Phase 5 |

### 7.5 Auto-Invoke Mapping

When performing these actions, the corresponding skill MUST be loaded automatically:

| Action | Skill to Load | Context |
|--------|---------------|---------|
| Audit security pre-merge | `owasp-security-check` | Reviewer |
| Build API endpoint or middleware | `nodejs-backend-patterns` | Developer in server/ |
| Change Prisma schema or migrations | `prisma-postgres` | Developer in server/ |
| Create shadcn/ui components | `shadcn` | Developer in client/ |
| Create OpenSpec change | `openspec-propose` | Spec-Manager |
| Design PostgreSQL tables | `postgresql-table-design` | Developer |
| Write E2E tests | `playwright-best-practices` | Developer in e2e/ |
| Write unit tests | `vitest` | Developer |
| Explore topic before change | `openspec-explore` | Spec-Manager |
| Do TDD (bugfix/feature) | `test-driven-development` | Developer |
| Interrogate user (Phase 0) | `grill-me` | Orchestrator |
| Compressed communication mode | `caveman` | Orchestrator / Reviewer / Git-Manager |
| Optimize React performance | `vercel-react-best-practices` | Developer in client/ |
| Refactor to modern JS | `modern-javascript-patterns` | Developer |
| Storybook stories | `storybook` | Developer in client/ |
| Tailwind styling | `tailwind-design-system` | Developer in client/ |
| Verify implementation | `openspec-verify` | Spec-Manager |

---

## 8. Agent Architecture Tech Stack

### 8.1 Base Platform

| Component | Technology | Version |
|-----------|------------|---------|
| **Agent Platform** | OpenCode | Latest |
| **Plugin** | `@warp-dot-dev/opencode-warp` | - |
| **Plugin Core** | `@opencode-ai/plugin` | 1.4.3 |
| **Config Format** | `opencode.jsonc` | JSON with Comments |

### 8.2 AI Models

| Agent | Model | Provider |
|-------|-------|----------|
| Orchestrator | `opencode/big-pickle` | OpenCode |
| Spec-Manager | `nvidia/minimaxai/minimax-m2.7` | NVIDIA/NVIDIA NIM |
| Git-Manager | `nvidia/minimaxai/minimax-m2.7` | NVIDIA/NVIDIA NIM |
| Planner | `opencode/ring-2.6-1t-free` | OpenCode |
| Developer | `opencode/qwen3.6-plus-free` | OpenCode |
| Reviewer | `opencode/nemotron-3-super-free` | OpenCode |
| Researcher | `opencode/minimax-m2.5` | OpenCode |
| Project-Manager | `nvidia/minimaxai/minimax-m2.7` | NVIDIA/NVIDIA NIM |

**Local Model (Fallback):**
```jsonc
"ollama-local": {
  "npm": "@ai-sdk/openai-compatible",
  "baseURL": "http://127.0.0",
  "models": { "qwen2.5-coder:7b": {} }
}
```

### 8.3 Integration Protocols & APIs

| Protocol | Use |
|----------|-----|
| **MCP (Model Context Protocol)** | Communication with external services |
| **Composio MCP (Remote)** | Trello integration (`https://connect.composio.dev/mcp`) |
| **Context7 MCP (Remote)** | Library documentation (`https://mcp.context7.com/mcp`) |
| **OpenAI-compatible SDK** | Local Ollama provider (`@ai-sdk/openai-compatible`) |

### 8.4 Host Project Stack

| Layer | Technology |
|-------|------------|
| **Runtime** | Node.js |
| **Frontend** | React 18, Vite, Tailwind, shadcn/ui, Redux Toolkit, RTK Query |
| **Backend** | Express, Prisma ORM, PostgreSQL |
| **Testing** | Vitest, Testing Library, Playwright, MSW |
| **Monorepo** | npm workspaces |
| **Code Quality** | ESLint, Prettier, Husky, commitlint |
| **Security** | Gitleaks, Semgrep, Trivy |

---

## 9. External Integrations (MCP)

### 9.1 Composio (Trello Integration)

- **Type:** `remote`
- **URL:** `https://connect.composio.dev/mcp`
- **Authentication:** OAuth
- **Purpose:** Trello board management for project management

**Trello Context:**
```json
{
  "defaultBoard": "project-one",
  "boards": {
    "project-one": {
      "id": "663aa79b4bb80987bc775706",
      "lists": ["Backlog", "Sprint Backlog", "In Progress", "Testing", "Complete", "Failed", "Revision"],
      "labels": ["Verified on branch", "Regression", "Blocked", "Bugs", "Security Issue", ...],
      "members": ["laurafalcon1", "johangarcia6"]
    }
  }
}
```

### 9.2 Context7 (Documentation)

- **Type:** `remote`
- **URL:** `https://mcp.context7.com/mcp`
- **Authentication:** API Key (`CONTEXT7_API_KEY`)
- **Purpose:** Updated library documentation queries

---

## 10. Project Management & Lifecycle

### 10.1 Integrated Trello Flow

```
Backlog ──► Sprint Backlog ──► In Progress ──► Testing
                                        │
                            ┌───────────┴───────────┐
                            ▼                       ▼
                      Complete (OK)            Failed / Revision
```

### 10.2 OpenSpec Sync

| OpenSpec Phase | Trello Status | Action |
|----------------|---------------|--------|
| Exploration | Backlog | Card created with `/trello-create-card` |
| Spec Creation | Sprint Backlog | Move with `/trello-update-card` |
| Spec Review | Sprint Backlog | - |
| Implementation | In Progress | Move card |
| Verification | Testing | Move card |
| Archive | Complete | Move card + archive |

### 10.3 Repository Protections

- **Husky Hooks:** `commit-msg`, `pre-commit`, `pre-push`
- **commitlint:** Conventional Commits validation
- **Gitleaks:** Secret detection in staged and full scan
- **Semgrep:** SAST in staged and full scan
- **Trivy:** Dependency scanning
- **lint-staged:** Auto format + lint on stage

---

## 11. Security & Quality

### 11.1 Security Layers

```
┌────────────────────────────────────────────┐
│          Source Code                       │
├────────────────────────────────────────────┤
│  ESLint + Prettier (Code Quality)          │
├────────────────────────────────────────────┤
│  commitlint (Conventional Commits)         │
├────────────────────────────────────────────┤
│  Husky Hooks (pre-commit, pre-push)        │
├────────────────────────────────────────────┤
│  Gitleaks (Secret Scanning)               │
├────────────────────────────────────────────┤
│  Semgrep (SAST Pattern Matching)          │
├────────────────────────────────────────────┤
│  Trivy (Dependency Vulnerability Scan)    │
└────────────────────────────────────────────┘
```

### 11.2 Reviewer Checklist

The `reviewer` agent executes a multidimensional checklist:

1. **Correctness**: Logic, edge cases, error handling, TypeScript types
2. **Security**: SQL injection, XSS, auth/authz, input validation, CORS, rate limiting
3. **Performance**: N+1 queries, re-renders, memory leaks, bundle size
4. **Code Quality**: ESLint/Prettier, DRY, abstractions, naming
5. **Testing**: 80% coverage, edge cases, integration, E2E
6. **React-Specific**: Functional components, hooks, prop drilling, a11y
7. **Express-Specific**: Async/await, HTTP codes, input validation, transactions

---

## 12. Real Case Studies

### 12.1 Active Changes (6 changes in progress)

| Change | Status | Artifacts |
|--------|--------|-----------|
| `add-field-limits-to-shadcn-components` | Completed | 5/5 artifacts ✅, 58/58 tasks ✅ |
| `add-users-by-status-endpoint` | In progress | 5/5 artifacts |
| `client-i18n-full-coverage` | In progress | 5/5 artifacts |
| `improve-jsdoc-documentation` | In progress | 6/5 artifacts (+1 extra) |
| `notes-mentions` | In progress | 5/5 artifacts |
| `testing-strategy` | In progress | 5/5 artifacts |

### 12.2 Archived Changes (2 changes)

| Change | Date | Artifacts |
|--------|------|-----------|
| `2026-04-19-document-system-modules` | 2026-04-19 | `design.md`, `tasks.md` |
| `2026-04-29-refactor-joi-schemas` | 2026-04-29 | `.openspec.yaml`, `design.md`, `proposal.md`, `specs/`, `tasks.md` |

### 12.3 Case Study: field-limits

**Artifact structure generated by the SDD flow:**

1. **proposal.md**: Defines "why" — form inputs lack length validation
2. **specs/field-limits-config/spec.md**: Defines requirements in WHEN/THEN format
3. **design.md**: Documents decision to create centralized `fieldLimits.js` file
4. **tasks.md**: 58 tasks across 9 phases, all completed
5. Code is implemented in `apps/client/src/config/fieldLimits.js`

---

## 13. General Architecture Diagram

```
┌──────────────────────────────────────────────────────────────────┐
│                     OPENCODE PLATFORM LAYER                      │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                  opencode.jsonc                          │    │
│  │  Provider: ollama-local (fallback)                      │    │
│  │  Plugin: @warp-dot-dev/opencode-warp                    │    │
│  │  Subagents: 7 | Steps: 45/15/20/15/25/10/12/15         │    │
│  └─────────────────────────────────────────────────────────┘    │
├──────────────────────────────────────────────────────────────────┤
│                     ORCHESTRATION LAYER                          │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │              ORCHESTRATOR (primary)                     │    │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │    │
│  │  │ spec-    │ │  git-    │ │  planner │ │developer │  │    │
│  │  │ manager  │ │ manager  │ │          │ │          │  │    │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘  │    │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐              │    │
│  │  │ reviewer │ │researcher│ │ project- │              │    │
│  │  │          │ │          │ │ manager  │              │    │
│  │  └──────────┘ └──────────┘ └──────────┘              │    │
│  └─────────────────────────────────────────────────────────┘    │
├──────────────────────────────────────────────────────────────────┤
│                     COMMAND LAYER                                │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │   .opencode/command/                                     │    │
│  │   ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │    │
│  │   │ opsx-*   │ │  commit- │ │ trello-  │ │ trello-  │  │    │
│  │   │ (11 cmds)│ │ all      │ │ create   │ │ update   │  │    │
│  │   └──────────┘ └──────────┘ └──────────┘ └──────────┘  │    │
│  └─────────────────────────────────────────────────────────┘    │
├──────────────────────────────────────────────────────────────────┤
│                     SKILLS LAYER                                 │
│  ┌─────────────────────────────────┐  ┌──────────────────────┐   │
│  │ .opencode/skills/ (11 skills)   │  │ .agents/skills/      │   │
│  │ OpenSpec workflow layer         │  │ Domain knowledge     │   │
│  │ openspec-apply, verify, archive │  │ React, Node, TDD...  │   │
│  └─────────────────────────────────┘  └──────────────────────┘   │
├──────────────────────────────────────────────────────────────────┤
│                     MCP INTEGRATION LAYER                        │
│  ┌─────────────────────────────────┐  ┌──────────────────────┐   │
│  │ Composio (Remote)              │  │ Context7 (Remote)    │   │
│  │ Trello API                     │  │ Documentation Query  │   │
│  └─────────────────────────────────┘  └──────────────────────┘   │
├──────────────────────────────────────────────────────────────────┤
│                     APPLICATION LAYER                            │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │   Monorepo: npm workspaces                               │    │
│  │   ┌──────────────┐ ┌──────────────┐ ┌──────────────┐   │    │
│  │   │ apps/client  │ │ apps/server  │ │ apps/e2e     │   │    │
│  │   │ React 18     │ │ Express      │ │ Playwright   │   │    │
│  │   │ Vite/Tailwind│ │ Prisma/PSQL  │ │ E2E Tests    │   │    │
│  │   └──────────────┘ └──────────────┘ └──────────────┘   │    │
│  └─────────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────────┘
```

---

## 14. Glossary of Terms

### 14.1 Agent Architecture Terms

| Term | Definition |
|------|------------|
| **Orchestrator** | Primary agent that coordinates and delegates to specialized subagents. Never executes domain tasks directly. |
| **Subagent** | Secondary agent with a single, bounded domain of responsibility. |
| **Primary Agent** | Main agent that receives all user requests and redirects them. |
| **Subagent Mode** | Agent that can only be invoked by another agent (the orchestrator), not directly by the user. |
| **Steps** | Maximum number of interactions an agent can have. Primary token-saving mechanism. |
| **Tool Permissions** | Granular per-agent permissions for `write`, `edit`, `bash`. |
| **Task Permissions** | Control over which subagents an agent can invoke. |

### 14.2 Development Methodology Terms

| Term | Definition |
|------|------------|
| **Specification-Driven Development (SDD)** | Methodology where every implementation must be preceded by formal specifications. 6 phases: Exploration → Spec → Review → Implementation → Verification → Archive. |
| **Command-Driven Development (CDD)** | Approach where every operation is triggered by predefined slash commands with deterministic behavior. |
| **System Design Document (SDD)** | Artifact that documents technical decisions, architecture, trade-offs, and implementation approach. |
| **Artifact-Driven Workflow** | Workflow based on sequential artifact creation (proposal → specs → design → tasks). |
| **Delta Specs** | Incremental specifications representing changes relative to main specifications. |
| **Conventional Commits** | Commit message standard: `type(scope): description`. |

### 14.3 OpenSpec Terms

| Term | Definition |
|------|------------|
| **Change** | Container for all work related to a modification. Lives in `openspec/changes/<name>/`. |
| **Proposal** | Artifact capturing the "why" and "what" of the change. |
| **Spec** | Detailed requirement specification in WHEN/THEN format. |
| **Design** | Document of technical decisions, architecture, and approach. |
| **Tasks** | Implementation task list with checkboxes. |
| **OpenSpec Schema** | Defines what artifacts a change must have and in what order to create them. |
| **Fast-Forward (FF)** | Create all artifacts of a change in a single operation. |

### 14.4 Technical Terms

| Term | Definition |
|------|------------|
| **MCP (Model Context Protocol)** | Protocol for AI models to communicate with external services. |
| **Composio** | Integration platform that connects apps through unified APIs. |
| **Context7** | Library documentation query service optimized for LLMs. |
| **SAST (Static Application Security Testing)** | Static security analysis of source code. |
| **Trunk-Based Development (TBD)** | Branching strategy where all developers work on a main branch. |

### 14.5 Skill Terms

| Term | Definition |
|------|------------|
| **Skill** | Set of specialized instructions loaded on-demand for specific tasks. |
| **Workflow Skill** | Skill that handles the OpenSpec change lifecycle (`.opencode/skills/`). |
| **Knowledge Skill** | Skill that provides domain technical knowledge (`.agents/skills/`). |
| **Skill Lock** | `skills-lock.json` file that records hashes and sources of installed skills. |
| **grill-me** | Skill from `mattpocock/skills` for relentlessly interviewing the user. Loaded in Phase 0. |
| **caveman** | Skill from `mattpocock/skills` for ultra-compressed communication (~75% fewer tokens). |
| **Context Injection** | Technique of injecting `CONTEXT.md` into the subagent prompt before delegating. |
| **20-Word Rule** | Rule requiring a term to be defined in `CONTEXT.md` if a concept requires >20 words. |
| **CONTEXT.md** | Glossary file at the project root defining compressed technical terms. |
| **Token Efficiency Protocols** | Set of 3 rules (Context Injection, 20-Word Rule, /caveman) for token savings. |
| **Skill Discrimination** | System that assigns each skill to the precise agent, component, and phase where it should execute. |
| **Auto-Invoke** | Mechanism that triggers automatic skill loading when detecting a specific action. |

---

## 15. Conclusions & Recommendations

### 15.1 Current Architecture Strengths

1. **Extremely strict separation of responsibilities**: Each agent has a clearly bounded domain and cannot step outside it.
2. **Granular permission model**: Detailed control over which tools each agent can use and which subagents it can invoke.
3. **Deterministic flow**: Slash commands guarantee predictable and repeatable behavior.
4. **Dual skill layer**: Clean separation between workflow skills (OpenSpec) and technical knowledge skills.
5. **Project management integration**: Trello synchronized with the development lifecycle.
6. **Multi-layer security**: Gitleaks + Semgrep + Trivy + commitlint + Husky.
7. **Persistent artifacts**: Decision history is documented in archived changes.
8. **Integrated Token Efficiency**: Phase 0, CONTEXT.md, and /caveman drastically reduce token consumption across all interactions.
9. **Context-discriminated skills**: Each skill loads only where relevant (client, server, e2e), avoiding cognitive noise in agents.

### 15.2 Potential Improvement Areas

1. **Model diversity**: 4 different models across 8 agents. Possible inconsistency in output quality.
2. **Steps exhaustion protection**: Although all agents now have adequate steps, there is still no mechanism to detect or recover when a subagent runs out of steps mid-workflow. The agent stops silently — no error propagation, no recovery handoff, no warning to the orchestrator.
3. **No overload protection when steps exhausted**: When an agent runs out of steps, it stops silently — no error propagation, no recovery mechanism, no warning to the orchestrator.
4. **Underutilized local model**: `ollama-local` configured with incomplete `baseURL` and no active models.
5. **No testing specialist**: No agent dedicated solely to test writing and execution.
6. **No performance metrics**: No tracking of execution times, step consumption rates, success/failure rates, or per-agent token costs.
7. **CONTEXT.md requires active maintenance**: The glossary loses effectiveness if not updated with each new compressed term.
8. **Missing automatic skill verification**: No mechanism validates that the correct skill was loaded in the correct context.

### 15.3 Recommendations

1. **Steps configuration applied**: All agent steps have been adjusted per the v1.2 analysis (see section 4.7). Current: orchestrator=45, spec-manager=15, git-manager=20, planner=15, developer=25, reviewer=10, researcher=12, project-manager=15. Monitor for 1-2 weeks and validate sufficiency under real workloads.
2. **Implement steps exhaustion detection**: Add monitoring so the orchestrator is notified when a subagent reaches its step limit, enabling recovery or re-delegation.
3. **Standardize models**: Evaluate moving all subagents to the same model family for consistency.
4. **Create testing agent**: Implement `test-engineer` specialized in writing and maintaining tests, offloading this responsibility from `developer`.
5. **Activate local Ollama**: Complete the local provider configuration for offline development capability.
6. **Add telemetry logging**: Track agent invocations, response times, step consumption, and error rates per agent.
7. **Automate CONTEXT.md maintenance**: Add a step in Phase 6 (Archive) to review and update the glossary with compressed terms used during the change.
8. **Implement skill-context validation**: Verify that loaded skills correspond to the active component (client vs server vs e2e) using the `pathPatterns` defined in skill metadata.

---

> **Document generated through complete filesystem analysis of the project-one project.**  
> *May 18, 2026*

---
