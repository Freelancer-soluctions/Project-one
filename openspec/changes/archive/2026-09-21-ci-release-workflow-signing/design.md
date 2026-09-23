## Context

`release.yml` is the only workflow that commits (via `changesets/action@v2`). During `ci-commit-signing`, a GATE 4.0 spike appeared to confirm that release commits would be rejected by the `Pre-Merge Governance Gate` ruleset, motivating a GitHub App + SSH signing migration. Post-hoc analysis revealed the spike tested the wrong mechanism. This document records the corrected understanding so the dead code is never reintroduced. A follow-up review (2026-09-21) found the same unverified-premise pattern in the remedy itself (D7) and in the live `commit-signing-release-migration` spec; both corrections are recorded here and the spec is fixed via this change's spec delta (D8).

## Goals / Non-Goals

**Goals**

- Document that the SSH signing block in `release.yml` is dead code.
- Record the correct signing behavior of changesets API mode.
- Establish a guardrail against re-adding SSH signing config.
- Correct the live `commit-signing-release-migration` spec via delta (discard R8 as its own conditional note prescribed).

**Non-Goals**

- No code or workflow changes (already cleaned up in `ci-commit-signing`).
- Repairing the broken changesets wiring in `release.yml` (CLI v2 vs action v2; token input) — that is code, tracked as a separate change (see D7).

## Decisions

### D1 — changesets/action@v2 defaults to API mode

`changesets/action@v2` sets `push-with-git-cli: false` by default. In this mode it creates the version commit and opens the Release PR via the GitHub REST API (Octokit), **not** via a local `git push`.

### D2 — API mode auto-signs via web-flow GPG key

Commits created through the GitHub REST API (e.g., the Changesets bot / `github-actions[bot]`) are automatically signed by GitHub using its web-flow GPG key (key id `4AEE18F83AFDEB23`). They appear as "Verified" in the GitHub UI without any runner-side git signing configuration.

### D3 — required_signatures accepts web-flow signatures

The `Pre-Merge Governance Gate` ruleset (id `21227644`) accepts commits signed by the web-flow key: `verification.verified=true` for API-created commits, so they pass the `required_signatures` rule. No developer SSH signing key is involved.

### D4 — GATE 4.0 spike tested the wrong mechanism

The GATE 4.0 spike in `ci-commit-signing` tested a raw `git push` authenticated with `GITHUB_TOKEN`, which was (correctly) rejected with `GH013: ... Commits must have verified signatures`. But changesets does **not** use `git push` — it uses the REST API. The spike therefore validated a mechanism changesets never invokes, producing a false confirmation that "release commits would be rejected," which drove the unnecessary GitHub App + SSH signing migration work.

### D5 — SSH config in release.yml was dead code

The SSH signing block in `release.yml` (`git config gpg.format ssh`, `user.signingkey`, `commit.gpgsign=true`) was never executed in API mode. changesets performs the commit/push server-side via the REST API, so no runner-side git signing config is consulted. The block had zero effect.

### D6 — SSH config was non-functional even in git-cli mode

Even if `push-with-git-cli: true` were set, the SSH config would still fail: only the public key was provisioned (written to `/tmp`), and no private key was loaded into `ssh-agent`. Git SSH signing requires the private key to be available to the agent; without it, signing cannot occur. So the config was both dead (API mode) and non-functional (git-cli mode).

### D7 — The App token as wired is ALSO dead code, and the release pipeline is currently broken (corrected 2026-09-21)

The original D7 claimed the App token (`APP_ID` + `APP_PRIVATE_KEY`) is "still necessary" and that only the SSH _signing_ config is dead. That was wrong for the workflow as written:

- **`env: GITHUB_TOKEN` does not configure the action.** `changesets/action@v2.0.0` (2026-08-11) removed support for the `GITHUB_TOKEN` environment variable (release note #674): custom tokens must be passed explicitly through the `github-token` input. The released `v2` tag's `src/index.ts` goes further and **throws** when `process.env.GITHUB_TOKEN` is set and differs from the input. `release.yml` passes the App token via `env:` and sets no `github-token` input, so the input defaults to `${{ github.token }}` — the App token never reaches the action, and once the CLI error below is fixed, every run fails with `The GITHUB_TOKEN environment variable is set and does not match the "github-token" input.`
- **The pipeline is already failing for an independent reason.** The repo pins `@changesets/cli ^2.31.0` (CLI v2) while `changesets/action@v2` requires CLI v3 (release note #699). The two most recent release runs (2026-08-23: `32609462623`, `32609700337`) failed with `Changesets CLI v2 is not supported; use Changesets action v1 instead`. The `@v2` tag moved under the pinned major reference after the last green run (2026-08-11).
- **The App token's necessity was itself an unverified premise** — the same failure mode documented in D4. With API mode + web-flow auto-signing (D2/D3) and `contents: write` + `pull-requests: write` already granted to the default `GITHUB_TOKEN` at workflow level, the default token suffices provided the repo setting "Allow GitHub Actions to create and approve pull requests" is enabled. Keeping the App token is still defensible (PRs attributed to the App, not subject to that setting; the default token stays unprivileged) — but it is a preference, not a necessity, and it MUST be wired via `with: github-token:`.

**Scope note:** repairing `release.yml` (CLI v2↔v3 resolution and token input) is code and out of scope for this documentation-only change; it needs its own change (proposed name: `ci-release-action-v2-fix`).

### D8 — Correct the live spec via delta (R8 discarded as its own note prescribed)

`openspec/specs/commit-signing-release-migration/spec.md` still mandates "App con SSH signing key" and asserts "release.yml sin migrar rompe enforcement" — both invalidated by D2–D5. That spec's own conditional note prescribed discarding R8 if changesets commits turn out accepted/Verified; the corrected mechanism analysis (D4) shows exactly that. This change therefore replaces `skip_specs: true` with a spec delta (REMOVED old requirement + ADDED corrected requirement) so the main spec — not prose in this `design.md` — is the enforceable guardrail against re-adding SSH signing config.

## Risks / Trade-offs

- [Risk] Future developers re-add SSH signing config to `release.yml`, reintroducing dead code and confusion. → Mitigation: corrected spec delta (D8) + this `design.md` as the explanatory record.
- [Risk] Misreading GATE 4.0 as proof that release commits need a signing App. → Mitigation: D4 clarifies the spike tested `git push`, not the REST API path changesets uses.
- [Risk] `release.yml` is currently broken (CLI v2 vs action v2; env-wired App token) → Mitigation: out of scope for this docs-only change; recorded in D7 for a dedicated fix change.
- [Risk] Cross-reference drift: learning guides `docs/learning/ci-cd/05b-commit-signing.md` / `05c` still teach the wrong mechanism (F3 = App SSH signing). → Mitigation: sync them in a follow-up docs task.

## Verification

- Confirmed `changesets/action@v2` default `push-with-git-cli: false` and web-flow GPG signing of API-created commits (upstream `action.yml` / README, `v2` tag).
- Confirmed v2.0.0 release notes #674 (env `GITHUB_TOKEN` removed; token via `github-token` input) and #699 (CLI v3 validation); confirmed the env/input mismatch throw in the released `v2` tag's `src/index.ts`.
- Confirmed failed release runs `32609462623` / `32609700337` (2026-08-23) with `Changesets CLI v2 is not supported` (via `gh run view --log-failed`).
- Confirmed only the public key was in `/tmp`; no private key was in `ssh-agent` (from `ci-commit-signing` archived design D9).
- Confirmed `release.yml` still contains no SSH signing config; no other workflow commits (search of `.github/workflows/`).
- `openspec validate ci-release-workflow-signing --strict` passes with the spec delta in place.
