# Admin-2 Handoff: COMBINED PUT Payload for Ruleset 21227644

## Status: BLOCKED-UNTIL-ADMIN

This document contains the prepared COMBINED PUT payload for Admin-2 to apply to ruleset `21227644`. The payload merges rules from both `ci-pr-metadata-governance` and `ci-governance-pre-merge-gates` changes.

## Preconditions (MUST verify before applying)

1. **GET current ruleset first**: `GET /repos/{owner}/{repo}/rulesets/21227644`
2. **Verify `required_signatures` exists** — do NOT assume it exists; check the GET response
3. **CODEOWNERS file exists** — required for `require_code_owner_review` (already exists at `.github/CODEOWNERS`)
4. **All required status check jobs exist** — Verify Commit Signatures, Commit Lint, PR Title Lint, DCO, ci-complete

## COMBINED PUT Payload (Full Replace)

```json
{
  "name": "main-branch-protection",
  "target": "branch",
  "enforcement": "active",
  "conditions": {
    "ref_name": {
      "include": ["refs/heads/main"],
      "exclude": []
    }
  },
  "rules": [
    {
      "type": "pull_request",
      "parameters": {
        "required_approving_review_count": 1,
        "dismiss_stale_reviews_on_push": true,
        "require_last_push_approval": true,
        "require_code_owner_review": true
      }
    },
    {
      "type": "required_linear_history",
      "parameters": {}
    },
    {
      "type": "non_fast_forward",
      "parameters": {}
    },
    {
      "type": "required_signatures",
      "parameters": {}
    },
    {
      "type": "required_status_checks",
      "parameters": {
        "strict_required_status_checks_policy": true,
        "required_status_checks": [
          {
            "context": "Verify Commit Signatures"
          },
          {
            "context": "Commit Lint (Conventional Commits)"
          },
          {
            "context": "PR Title Lint"
          },
          {
            "context": "DCO"
          },
          {
            "context": "CI Complete"
          }
        ]
      }
    }
  ],
  "bypass_actors": []
}
```

## Critical Notes

### ✅ Correct API Type Strings (per Design D8)

- `pull_request` (NOT `required_pull_request`)
- `non_fast_forward` (NOT `block_force_pushes`)
- `required_linear_history` (correct)
- `required_signatures` (correct)
- `required_status_checks` (correct)

### ❌ INCORRECT strings that cause HTTP 422:

- `required_pull_request`
- `block_force_pushes`
- `require_code_owner_reviews` (plural)

### Pull Request Parameters (exact names):

- `required_approving_review_count` (integer)
- `dismiss_stale_reviews_on_push` (boolean, NOT `dismiss_stale_reviews`)
- `require_last_push_approval` (boolean)
- `require_code_owner_review` (boolean, singular)

### Status Check Context Names (MUST match job `name:` exactly)

Per ci-pr-metadata-governance D4 job-name-matching risk:

1. `"Verify Commit Signatures"` — from `verify-signatures` job `name:`
2. `"Commit Lint (Conventional Commits)"` — from `commit-lint` job `name:`
3. `"PR Title Lint"` — from `pr-title-lint` job `name:`
4. `"DCO"` — from `dco` job `name:`
5. `"CI Complete"` — from `ci-complete` job `name:` (includes `dependency-review` via needs)

### Bypass Actors

- `bypass_actors: []` — zero bypass actors (no exceptions, including admins)
- Preserved from ci-pr-metadata-governance D5

## What This Payload Adds (vs current state)

From `ci-governance-pre-merge-gates`:

- `pull_request` with review requirements (1 approval, dismiss stale, last push, CODEOWNERS)
- `required_linear_history` (squash/rebase only)
- `non_fast_forward` (blocks force pushes)

Preserved from `ci-pr-metadata-governance`:

- `required_signatures` (if exists — verify via GET)
- `required_status_checks` with all 5 checks

## Admin-2 Application Steps

```bash
# 1. GET current ruleset to verify required_signatures and other existing rules
GET /repos/{owner}/{repo}/rulesets/21227644

# 2. If required_signatures is missing from GET response, remove it from the PUT payload above

# 3. Apply full PUT replace
PUT /repos/{owner}/{repo}/rulesets/21227644
# Body: the JSON payload above (with required_signatures adjusted per step 2)
```

## Rollback

If issues arise, re-apply the previous ruleset body from the GET response in step 1.

## Related Files

- `.github/workflows/ci.yml` — contains all 5 required status check jobs
- `.github/CODEOWNERS` — exists, enables `require_code_owner_review`
- `openspec/changes/ci-governance-pre-merge-gates/tasks.md` — Task 2.1
- `openspec/changes/ci-governance-pre-merge-gates/design.md` — Decisions D4, D7, D8

---

**Do NOT execute this payload via API.** This is a handoff document for Admin-2 manual application.
Task 2.1 remains `- [ ]` in tasks.md until Admin-2 applies the payload.
