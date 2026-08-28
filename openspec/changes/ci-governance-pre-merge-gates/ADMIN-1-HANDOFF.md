# Admin-1 Handoff: Repository Squash Merge Settings

## Status: BLOCKED-UNTIL-ADMIN

This document describes the repository settings changes required for Admin-1 to apply. These settings are consistent with `ci-pr-metadata-governance` D3 and preserve DCO trailers.

## Settings to Change

### 1. `squash_merge_commit_title` → `PR_TITLE`

**Current**: Likely `COMMIT_MESSAGES` (default) or `PR_TITLE`  
**Required**: `PR_TITLE`

**Effect**: When a PR is squash-merged, the squash commit title will be the PR title (which is validated by PR Title Lint / Conventional Commits), not the individual commit messages.

### 2. `squash_merge_commit_message` → `COMMIT_MESSAGES`

**Current**: Likely `BLANK` or `PR_BODY`  
**Required**: `COMMIT_MESSAGES`

**Effect**: The squash commit message body will contain all individual commit messages from the PR. This preserves DCO `Signed-off-by` trailers from each commit, maintaining the provenance chain.

## Combined Effect

| Setting                       | Value             | Purpose                                                                   |
| ----------------------------- | ----------------- | ------------------------------------------------------------------------- |
| `squash_merge_commit_title`   | `PR_TITLE`        | PR title (Conventional Commits validated) becomes squash commit title     |
| `squash_merge_commit_message` | `COMMIT_MESSAGES` | All individual commit messages (including DCO trailers) preserved in body |

## Why This Combination

1. **PR Title Lint** validates PR title follows Conventional Commits (`feat:`, `fix:`, etc.)
2. **Squash commit title** = PR title → squash commit follows Conventional Commits
3. **Squash commit body** = all commit messages → DCO `Signed-off-by` trailers preserved
4. **Consistent with ci-pr-metadata-governance D3** — single source of truth for squash settings

## Admin-1 Application Steps

### Via GitHub UI:

1. Go to Repository → Settings → General → Pull Requests
2. Under "Allow squash merging", configure:
   - **Default commit message for squash merges**: "Pull request title" (`PR_TITLE`)
   - **Default commit description for squash merges**: "Commit messages" (`COMMIT_MESSAGES`)

### Via GitHub CLI (requires repo admin):

```bash
# Set squash merge commit title to PR_TITLE
gh api --method PATCH /repos/{owner}/{repo} \
  -f allow_squash_merge=true \
  -f squash_merge_commit_title=PR_TITLE \
  -f squash_merge_commit_message=COMMIT_MESSAGES
```

### Via GitHub REST API:

```bash
PATCH /repos/{owner}/{repo}
{
  "allow_squash_merge": true,
  "squash_merge_commit_title": "PR_TITLE",
  "squash_merge_commit_message": "COMMIT_MESSAGES"
}
```

## Verification After Change

1. Create a test PR with multiple commits, each with `Signed-off-by` trailer
2. Squash merge the PR
3. Verify:
   - Squash commit title = PR title (Conventional Commits format)
   - Squash commit body contains all original commit messages including DCO trailers

## Related Files

- `openspec/changes/ci-governance-pre-merge-gates/tasks.md` — Task 2.2
- `openspec/changes/ci-governance-pre-merge-gates/design.md` — Decision D3
- `openspec/changes/ci-pr-metadata-governance/design.md` — Decision D3 (source of truth)

---

**Do NOT execute these settings changes via API.** This is a handoff document for Admin-1 manual application.
Task 2.2 remains `- [ ]` in tasks.md until Admin-1 applies the settings.
