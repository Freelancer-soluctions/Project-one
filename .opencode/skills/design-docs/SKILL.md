---
name: design-docs
description: >
  Normal (non-OpenSpec) design-doc mode of the reviewer: create architecture
  diagrams, technical specs, implementation plans, and design documents outside
  openspec/. Use when OpenSpec is not active. Extracted from reviewer.md.
license: MIT
metadata:
  author: project-one
  version: '1.0'
---

# Design Docs — Planner Normal Mode

When OpenSpec is NOT active, the reviewer CAN create planning documents (not
inside `openspec/`). This is the "normal mode" of the reviewer.

## When to Use

- User wants design/architecture without an OpenSpec change.
- No `openspec/` context for the task.
- Standalone technical planning.

## Outputs (Normal Mode)

Create structured planning documents in appropriate locations:

- `docs/architecture/`
- `docs/planning/`
- `.md` files in project root

Allowed artifacts:

- Architecture diagrams
- Technical specifications
- Implementation plans
- Design documents (NOT in `openspec/` folder)

## Output Format

Provide structured planning documents with:

- Clear problem statement
- Proposed architecture
- Component breakdown
- Implementation steps
- Risks and open questions

### Architecture Diagrams

When creating architecture diagrams, include:

- Component boundaries and responsibilities
- Data flow between components
- External dependencies and integration points
- Technology choices with rationale

### Technical Specifications

When creating technical specs, include:

- Problem statement and goals
- Non-goals and out-of-scope items
- Proposed solution with alternatives considered
- Data model changes (if any)
- API contract (if applicable)
- Security considerations
- Performance implications

### Implementation Plans

When creating implementation plans, include:

- Phased breakdown (Phase 0, 1, 2, ...)
- Task list with atomic, ordered steps
- Dependencies between tasks
- Exit criteria per phase
- Rollback strategy

### Design Documents

When creating design documents, include:

- Context and motivation
- Goals and non-goals
- Key decisions with rationale and alternatives
- Risks and trade-offs
- Migration plan
- Open questions

## Critical Distinction (OpenSpec Active)

When OpenSpec IS active, the reviewer does NOT create files. It only:

- READS files created by OpenSpec
- VALIDATES technical feasibility
- SUGGESTS improvements/corrections
- FLAGS potential issues

Never duplicate what OpenSpec already generates. In OpenSpec mode, review
checklist: proposal.md → spec.md → design.md → tasks.md.

## Example Output (Normal Mode)

```
# Design Document: Authentication Feature

## Context
The application needs user authentication...

## Problem Statement
Currently there is no authentication mechanism...

## Proposed Architecture
- Auth middleware layer
- JWT token service
- User repository

## Component Breakdown
1. AuthMiddleware - validates JWT on each request
2. TokenService - generates and verifies JWTs
3. UserRepository - manages user credentials

## Implementation Steps
1. Create User model in Prisma schema
2. Implement TokenService
3. Add AuthMiddleware
4. Wire up routes

## Risks and Open Questions
- Token expiration strategy TBD
- Refresh token rotation not yet designed
```
