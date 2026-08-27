## 1. Author design.md (authoritative record of the dead-code discovery)

- [x] 1.1 D1 — `changesets/action@v2` defaults to API mode (`push-with-git-cli: false`)
- [x] 1.2 D2 — API mode auto-signs via web-flow GPG key (id `4AEE18F83AFDEB23`)
- [x] 1.3 D3 — `required_signatures` accepts web-flow signatures (`verified=true`)
- [x] 1.4 D4 — GATE 4.0 spike tested `git push` (wrong mechanism); changesets uses the REST API
- [x] 1.5 D5 — SSH config in `release.yml` was dead code (never executed)
- [x] 1.6 D6 — SSH config non-functional even in git-cli mode (public key only, no private key in `ssh-agent`)
- [x] 1.7 D7 — App token (`APP_ID` + `APP_PRIVATE_KEY`) still required; only SSH signing is dead

## 2. Author proposal.md

- [x] 2.1 Document Why (dead-code discovery) and What Changes (documentation-only)
- [x] 2.2 Declare no capability / spec changes; rely on `skip_specs: true`

## 3. Metadata

- [x] 3.1 Ensure `.openspec.yaml` sets `schema: spec-driven`, `skip_specs: true`, and `created` date
