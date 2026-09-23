## 1. Author design.md (authoritative record of the dead-code discovery)

- [x] 1.1 D1 — `changesets/action@v2` defaults to API mode (`push-with-git-cli: false`)
- [x] 1.2 D2 — API mode auto-signs via web-flow GPG key (id `4AEE18F83AFDEB23`)
- [x] 1.3 D3 — `required_signatures` accepts web-flow signatures (`verified=true`)
- [x] 1.4 D4 — GATE 4.0 spike tested `git push` (wrong mechanism); changesets uses the REST API
- [x] 1.5 D5 — SSH config in `release.yml` was dead code (never executed)
- [x] 1.6 D6 — SSH config non-functional even in git-cli mode (public key only, no private key in `ssh-agent`)
- [x] 1.7 D7 — ~~App token (`APP_ID` + `APP_PRIVATE_KEY`) still required; only SSH signing is dead~~ **CORRECTED (2026-09-21):** as wired (`env: GITHUB_TOKEN`, no `github-token` input) the App token never reaches the action and would hard-fail; pipeline is also broken by CLI v2 vs action v2 (runs `32609462623`/`32609700337`). See design.md D7.
- [x] 1.8 D8 — correct the live `commit-signing-release-migration` spec via delta (R8 discarded as its own note prescribed)

## 2. Author proposal.md

- [x] 2.1 Document Why (dead-code discovery) and What Changes (documentation-only)
- [x] 2.2 ~~Declare no capability / spec changes; rely on `skip_specs: true`~~ **SUPERSEDED (2026-09-21):** change now modifies `commit-signing-release-migration` via spec delta; `skip_specs` removed

## 3. Metadata

- [x] 3.1 Ensure `.openspec.yaml` sets `schema: spec-driven`, `skip_specs: true`, and `created` date
  > Updated 2026-09-21: `skip_specs: true` removed — the change carries a real spec delta.

## 4. Spec delta for `commit-signing-release-migration` (added 2026-09-21)

- [x] 4.1 Author `specs/commit-signing-release-migration/spec.md` — REMOVED requirement "release.yml produce commits Verified vía GitHub App SSH" + ADDED "release.yml produce commits Verified sin firma en el runner (API mode)": API-mode web-flow auto-signing, optional App token via `github-token` input, guardrail against SSH signing config
- [x] 4.2 Remove `skip_specs: true` from `.openspec.yaml`
- [x] 4.3 Pass `openspec validate ci-release-workflow-signing --strict`
