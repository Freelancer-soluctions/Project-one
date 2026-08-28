## Goal

Consolidated duplicate dependency-review workflows in project-one per research verdict.

## Instructions

- Working tree changes only, no commits, no workflow execution
- Focus: eliminate duplicates, fix dangling ci-complete.needs, inline job in ci.yml

## Discoveries

- The governance change created a duplicate workflow `.github/workflows/dependency-review.yml` + config `.github/dependency-review-config.yml`
- The original `dependency-review` job already existed in `security.yml` (lines 150-169)
- `ci.yml` had `dependency-review` in `ci-complete.needs` (line 742) but the job didn't exist in ci.yml — making it a dangling reference (GitHub Actions `needs` only resolves jobs in the same workflow)

## Accomplished

- ✅ Deleted `.github/workflows/dependency-review.yml` (35 lines)
- ✅ Deleted `.github/dependency-review-config.yml` (13 lines)
- ✅ Added `dependency-review` job inline in `ci.yml` (lines 732-754) before `ci-complete` stage
- ✅ Removed duplicate `dependency-review` job from `security.yml` (lines 150-169)
- ✅ Validated with `actionlint` — no errors (only pre-existing warnings)

## Next Steps

- @researcher to verify GHAS requirement for dependency-review-action@v5
- @planner to update tasks.md artifacts (parallel)

## Relevant Files

- `.github/workflows/ci.yml` — added dependency-review job (lines 732-754), ci-complete.needs now valid
- `.github/workflows/security.yml` — removed duplicate dependency-review job, preserved: dependency-scan, sast, secrets, sbom
- `.github/workflows/dependency-review.yml` — DELETED
- `.github/dependency-review-config.yml` — DELETED
