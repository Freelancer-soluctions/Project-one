## Context

`.github/workflows/ci.yml` (1066 lines) has job blocks in a semi-random order that doesn't match the canonical pipeline diagram in `docs/ci-cd-pipeline-empresarial.md` §23.3. Current issues:

1. **Header naming collision**: ci.yml uses `STAGE 1: INICIACIÓN`, `STAGE 2: PRE-BUILD QUALITY`, `STAGE 5: CI-COMPLETE` — these don't match the diagram's `ENTRY`, `STAGE 2: PRE-BUILD — VALIDATE`, `AGGREGATOR`
2. **SAST job misplaced**: `sast` (L757) sits between `dependency-review` and `ci-complete`, visually isolated from the 4 ruleset checks it logically belongs with
3. **Missing stages**: No placeholders for stages 5–11 that exist in other workflows (deploy.yml, security.yml) — makes it impossible to see the full pipeline when reading ci.yml alone

## Goals / Non-Goals

**Goals:**

- Reorder job blocks in ci.yml to match the 11-stage pipeline sequence from §23.3
- Rename section headers to use exact diagram stage names
- Move `sast` into the PRE-BUILD VALIDATE block alongside the 4 ruleset checks
- Add commented placeholder sections for stages 5–11
- Rename ci-complete section header from `STAGE 5: CI-COMPLETE` to `AGGREGATOR — CI Complete`

**Non-Goals:**

- NO changes to job behavior (needs, if conditions, continue-on-error, name)
- NO changes to `ci-complete.needs` array (sast stays excluded)
- NO activation of `if: false` jobs
- NO changes to ruleset-bound job names
- NO changes to any other workflow file
- NO new specs (pure refactor, `skip_specs: true`)

## Decisions

### Decision 1: Physical order follows §23.3 diagram exactly

**Choice**: Reorder job blocks to match the diagram sequence:

```
ENTRY → STAGE 2 → STAGE 3 → STAGE 4 → AGGREGATOR → GUARDS
```

**Rationale**: The diagram is the single source of truth for pipeline stages. Aligning ci.yml to it eliminates cross-reference confusion. The diagram's STAGE 1 is local (.husky) — represented as a comment placeholder.

**Alternatives considered**:

- Keep current order, only rename headers → rejected: doesn't fix the core navigation problem
- Group by domain (governance/security/quality) → rejected: conflicts with diagram stages

### Decision 2: SAST moves to STAGE 2 PRE-BUILD VALIDATE

**Choice**: Move `sast` block from its current position (L757) into the STAGE 2 block alongside verify-signatures, commit-lint, pr-title-lint, dco.

**Rationale**: §9.3.9 of CONTEXT-CICD.md confirms SAST is GOVERNANCE. The diagram L3226 shows early-abort SAST as part of the PR GATE. Logically, SAST validates source code before build — same as the 4 ruleset checks.

**Alternatives considered**:

- Keep SAST in current position → rejected: visually isolated from related checks
- Create a separate "SECURITY" stage in ci.yml → rejected: would change the stage model

### Decision 3: Commented placeholders for stages 5–11

**Choice**: Add commented `# ═══ STAGE N: NAME ═══` blocks for stages that live in other workflows.

**Rationale**: Shows the full pipeline topology when reading ci.yml, without claiming ownership of stages that live elsewhere. Developers can see "where does deploy happen?" without switching files.

**Alternatives considered**:

- No placeholders → rejected: loses topology visibility
- Actually include the stages → rejected: they live in deploy.yml/security.yml; duplicating would create a second source of truth

### Decision 4: ci-complete section header rename only

**Choice**: Rename the section comment from `STAGE 5: CI-COMPLETE` to `AGGREGATOR — CI Complete`. The job `name: CI Complete` is untouched.

**Rationale**: The job name is a candidate for future ruleset binding (§5.5 of CONTEXT-CICD.md). Renaming the comment is cosmetic; renaming the job would break the potential binding.

### Decision 5: Ruleset-bound names are sacred

**Choice**: The 4 job `name:` values from §3.2 (`Verify Commit Signatures`, `Commit Lint (Conventional Commits)`, `PR Title Lint`, `DCO`) are NOT touched.

**Rationale**: Ruleset 21227644 binds by exact job name. Renaming breaks the binding silently.

## Risks / Trade-offs

**[Large diff]** → The reorder produces a large `git diff` with mostly moved lines. Mitigation: commit message explicitly states "reorder only, zero behavior changes"; reviewer should verify no logic changes via `git diff --stat` + spot-checking.

**[Comment-only stages may confuse]** → Commented placeholders could be mistaken for TODOs. Mitigation: each placeholder clearly states "lives in <workflow>.yml (disabled_manually)" so readers know it's informational, not actionable.

**[ci.yml self-documentation]** → Adding stage names from the diagram makes ci.yml depend on the diagram being kept in sync. Mitigation: the diagram is the source of truth; ci.yml is derived. If the diagram changes, ci.yml headers should follow.
