## Context

`release.yml` is the only workflow that commits (via `changesets/action@v2`). During `ci-commit-signing`, a GATE 4.0 spike appeared to confirm that release commits would be rejected by the `Require signed commits` ruleset, motivating a GitHub App + SSH signing migration. Post-hoc analysis revealed the spike tested the wrong mechanism. This document records the corrected understanding so the dead code is never reintroduced.

## Goals / Non-Goals

**Goals**

- Document that the SSH signing block in `release.yml` is dead code.
- Record the correct signing behavior of changesets API mode.
- Establish a guardrail against re-adding SSH signing config.

**Non-Goals**

- No code or workflow changes (already cleaned up in `ci-commit-signing`).
- No spec behavior changes (documentation-only).

## Decisions

### D1 — changesets/action@v2 defaults to API mode

`changesets/action@v2` sets `push-with-git-cli: false` by default. In this mode it creates the version commit and opens the Release PR via the GitHub REST API (Octokit), **not** via a local `git push`.

### D2 — API mode auto-signs via web-flow GPG key

Commits created through the GitHub REST API (e.g., the Changesets bot / `github-actions[bot]`) are automatically signed by GitHub using its web-flow GPG key (key id `4AEE18F83AFDEB23`). They appear as "Verified" in the GitHub UI without any runner-side git signing configuration.

### D3 — required_signatures accepts web-flow signatures

The `Require signed commits` ruleset (id `21227644`) accepts commits signed by the web-flow key: `verification.verified=true` for API-created commits, so they pass the `required_signatures` rule. No developer SSH signing key is involved.

### D4 — GATE 4.0 spike tested the wrong mechanism

The GATE 4.0 spike in `ci-commit-signing` tested a raw `git push` authenticated with `GITHUB_TOKEN`, which was (correctly) rejected with `GH013: ... Commits must have verified signatures`. But changesets does **not** use `git push` — it uses the REST API. The spike therefore validated a mechanism changesets never invokes, producing a false confirmation that "release commits would be rejected," which drove the unnecessary GitHub App + SSH signing migration work.

### D5 — SSH config in release.yml was dead code

The SSH signing block in `release.yml` (`git config gpg.format ssh`, `user.signingkey`, `commit.gpgsign=true`) was never executed in API mode. changesets performs the commit/push server-side via the REST API, so no runner-side git signing config is consulted. The block had zero effect.

### D6 — SSH config was non-functional even in git-cli mode

Even if `push-with-git-cli: true` were set, the SSH config would still fail: only the public key was provisioned (written to `/tmp`), and no private key was loaded into `ssh-agent`. Git SSH signing requires the private key to be available to the agent; without it, signing cannot occur. So the config was both dead (API mode) and non-functional (git-cli mode).

### D7 — App token is still required (only SSH signing is dead)

The GitHub App token (`APP_ID` + `APP_PRIVATE_KEY`) used by `actions/create-github-app-token` is still necessary: changesets needs an elevated token (with `contents: write` + `pull-requests: write`) to push the version commit and open the Release PR. Only the SSH-based _signing_ configuration is dead code; the _authentication_ token remains essential.

## Risks / Trade-offs

- [Risk] Future developers re-add SSH signing config to `release.yml`, reintroducing dead code and confusion. → Mitigation: this `design.md` is the authoritative record; treat it as the guardrail.
- [Risk] Misreading GATE 4.0 as proof that release commits need a signing App. → Mitigation: D4 clarifies the spike tested `git push`, not the REST API path changesets uses.

## Verification

- Confirmed `changesets/action@v2` default `push-with-git-cli: false` (upstream action docs / source).
- Confirmed API-created commits are web-flow signed (`verified=true`) and pass `required_signatures`.
- Confirmed only the public key was in `/tmp`; no private key was in `ssh-agent` (from `ci-commit-signing` session logs).
