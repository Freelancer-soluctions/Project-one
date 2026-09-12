## Context

The CI pipeline (`ci.yml`, the only enabled workflow) has 4 governance checks and `dependency-review`, but no SAST. Semgrep exists locally in `pre-commit` via `semgrep-staged.ps1` (Docker, staged-only) and in `security.yml`/`scheduled-security.yml` (both `disabled_manually`). The governance gap: ERROR-severity findings (SQL injection, XSS, command injection) can reach `main` without automated detection.

The existing `ci.yml` job pattern is well-established: `verify-signatures` (L54), `commit-lint` (L296), `pr-title-lint` (L332), `dco` (L370), `dependency-review` (L733). All governance jobs share: `runs-on: ubuntu-latest`, `permissions: contents: read`, PR-scoped `if` conditions, and participation in the `pr-<number>` concurrency group.

See proposal.md for motivation and OUT-OF-SCOPE items.

## Goals / Non-Goals

**Goals:**

- Add Semgrep SAST as a governance gate in `ci.yml` that blocks ERROR-severity findings on PR diffs
- Use Docker `semgrep/semgrep` directly (no 3rd-party action) for full CLI control
- Diff-scoped scan (`--baseline-commit`) to avoid scanning unchanged code
- Inline packs via `--config p/...` flags — zero changes to local config files
- Phased rollout: F1 (non-blocking) → F2 (blocking + ruleset binding)

**Non-Goals:**

- Changing `.semgrep/.semgrep.yml` (local config activation is out-of-scope)
- Changing `.semgrepignore` (local dev tool, not pipeline concern)
- Modifying `security.yml` or `scheduled-security.yml` (out-of-scope; SECURITY domain)
- Weekly full scan with SARIF (future change, SECURITY domain)
- Modifying `ci-complete.needs` (SAST is standalone, not aggregated)
- Changing the 4 existing governance checks (signatures, commit-lint, pr-title-lint, DCO)
- Changing the pre-commit hook behavior (local hook remains as-is)

## Decisions

### D-1: Inline packs via `--config p/...` (NO local config reference)

**Decision:** The CI job passes Semgrep packs inline via `--config p/owasp-top-ten --config p/security-audit ...` flags. It does NOT reference `.semgrep/.semgrep.yml`.

**Rationale:**

- The job must be self-contained in the YAML — zero dependency on local config files that might change independently.
- Avoids coupling CI behavior to local dev config. The local `.semgrep.yml` has only one active rule (`no-console-log` at WARNING severity) and commented-out packs. Uncommenting those packs is a separate local config change (out-of-scope).
- Inline packs are explicit and auditable in the workflow file itself.
- If packs need tuning (add/remove), the change is in the workflow YAML — visible in PR diff, reviewed by CODEOWNERS.

**Packs selected:**

```
--config p/owasp-top-ten
--config p/security-audit
--config p/secrets
--config p/nodejs
--config p/expressjs
--config p/sql-injection
--config p/command-injection
--config p/react
--config p/xss
```

**Exclusions:** `--exclude node_modules --exclude dist --exclude build --exclude coverage --exclude .env --exclude '*.min.js' --exclude prisma/generated --exclude e2e` (inline, no `.semgrepignore` dependency).

**Alternatives considered:**

- Reference `.semgrep/.semgrep.yml`: rejected — couples CI to local config file; file has only 1 active rule today; uncommenting packs is a separate concern.
- Create separate CI-only config file: rejected — adds file maintenance burden; inline packs are simpler and self-documenting.

### D-2: `--severity ERROR --fail-on error` vs. full scan

**Decision:** Use `--severity ERROR --fail-on error` to gate only on ERROR findings.

**Rationale:** WARNING findings (like `no-console-log`) are noise for a governance gate. ERROR findings represent genuine security vulnerabilities (injection, XSS, prototype pollution). Matches the stated intent from `docs/ci-cd-pipeline-empresarial.md` §23.3/§23.4: "early-abort gate" for critical findings only.

**Alternatives considered:**

- `--severity WARNING`: rejected — too noisy, would block on `no-console-log` and other non-critical findings.
- `--severity ERROR` without `--fail-on`: rejected — Semgrep exits 0 even with findings unless `--fail-on` is set.

### D-3: Diff-scoped vs. full-codebase scan

**Decision:** Use `semgrep ci --baseline-commit ${{ github.event.pull_request.base.sha }}` with `fetch-depth: 0`.

**Rationale:** Scans only the PR diff, reducing scan time and false positives from unchanged code. Matches the `verify-signatures` pattern (diff-scoped via compare endpoint) and `commit-lint` pattern (range-based validation). The `--baseline-commit` flag is Semgrep's native mechanism for incremental scans.

**Alternatives considered:**

- Full codebase scan on every PR: rejected — slow (15+ min), reports pre-existing findings unrelated to the PR, noisy.
- `semgrep scan` with path arguments: rejected — doesn't leverage Semgrep's baseline comparison logic.

### D-4: Phased rollout strategy

**Decision:** Two-phase rollout (F3 weekly scan is OUT-OF-SCOPE for this change):

- **F1**: `continue-on-error: true` — non-blocking, tune false positives by adding `--exclude` patterns or `# nosemgrep` comments inline in code
- **F2**: Remove `continue-on-error` + ruleset PATCH — blocking gate (manual admin step, documented NOT executed in this change)

**Rationale:** Follows the precedent set by `pr-title-lint` and `dco` (which started as non-blocking and became blocking). F1 allows the team to see findings and tune before blocking merges. F2 requires ≥1 successful run before ruleset binding (prevents "unsatisfiable gate" scenario per Regla 7).

**F2 procedure (documented, manual admin):**

1. Verify ≥1 successful F1 run (job exits 0 on a real PR)
2. PATCH ruleset 21227644: add required status check `"SAST (Semgrep)"` — name MUST match job `name:` EXACTO (Regla 8)
3. Remove `continue-on-error: true` from the `sast` job in `ci.yml`

### D-5: SARIF upload scope

**Decision:** NO SARIF upload in the governance gate. SARIF is reserved for future full scan (out-of-scope).

**Rationale:** The governance gate (`ci.yml`) is diff-scoped and doesn't need Security tab integration. SARIF upload requires `security-events: write` permission, which adds unnecessary attack surface to the governance workflow. A future full scan job (in `scheduled-security.yml`, SECURITY domain) will handle SARIF.

### D-6: No `ci-complete.needs` modification

**Decision:** Do NOT add `sast` to `ci-complete.needs` array.

**Rationale:** `ci-complete` is gated by `CI_MINIMAL != 'true'` and aggregates quality/build/test jobs. SAST is a standalone governance gate (like `dependency-review`), not part of the quality/build pipeline. Adding it to `ci-complete.needs` would couple SAST to `CI_MINIMAL` toggle — SAST should run regardless of `CI_MINIMAL` (note: SAST job has NO `CI_MINIMAL` gate in its `if:` condition).

**Alternatives considered:**

- Add to `ci-complete.needs`: rejected — couples SAST to CI_MINIMAL toggle, contradicts standalone gate design.

### D-7: Docker image pinning

**Decision:** Pin to `semgrep/semgrep:1.176.1` (latest stable as of 2026-09-04, verified via Docker Hub API).

**Rationale:** Reproducible scans. Avoids surprise behavior from `latest` tag updates. Semgrep releases are frequent (~weekly); pinning allows deliberate upgrades.

**Monitoring:** Periodically check Docker Hub for security patches. Update pinned tag as part of regular maintenance (not bundled with feature changes).

### D-8: Limitaciones conocidas — diff-mode y baseline-commit

**Limitacion:** El modo diff con `--baseline-commit` SOLO escanea el diff del PR. Hallazgos en codigo preexistente (que no fue modificado por el PR) NO son detectados por este gate.

**Implicacion:** Un PR puede aprobar el gate SAST sin que el codigo preexistente sea auditado. Esto es intencional por disenno (evitar falsos positivos de codigo no modificado), pero significa que el gate NO reemplaza un full scan.

**Mitigacion:** Un full scan futuro (domain SECURITY, `scheduled-security.yml`) es complemento necesario, NO redundante (ver OUT-OF-SCOPE: F3 FULL SCAN). El governance gate protege merges; el full scan protege el codebase completo periodicamente.

### D-9: Custom rules layer (.semgrep/rules/ versioned in repo)

**Decision:** Add a custom rules directory `.semgrep/rules/` at the repo root, loaded by the CI job via `--config .semgrep/rules` BEFORE the inline packs. Rules are Semgrep YAML format, versioned in the repo, with test fixtures. Scope is pipeline-only -- rules are NOT a re-implementation of local tooling.

**Rationale:**

- **EASE 2024 (ACM):** Semgrep CE baseline achieves only 15.9% recall. With custom rules, recall jumps to 44.7% (+181%). The layer of rules matters more than the engine itself.
- **Systematic CWE gaps in Semgrep CE for Express/React:** (1) Prototype pollution via multi-file patterns, (2) SSRF with dynamic URL construction, (3) Insecure deserialization, (4) SQL injection via Prisma raw queries (`$queryRaw` with taint from `req.body`/`req.query`/`req.params`), (5) XSS in React with intermediate DOM manipulation (e.g., `req.query` -> variable -> `innerHTML`).
- Custom rules fill gaps that Semgrep CE default packs miss, specifically for the Express/Prisma/React stack.

**Architecture:**

- `.semgrep/rules/` contains YAML rule files at the repo root (sibling to `.semgrep/`).
- `.semgrep/rules/tests/` contains test fixture pairs (vulnerable + fixed) for each rule.
- CI job (task 1.2) loads them via `--config .semgrep/rules` BEFORE inline packs `--config p/...`.
- Semgrep resolution order: local rules take priority over registry packs when patterns overlap.

**Rules (initial 5):**

| Rule file                    | CWE      | Target                                                     | Confidence |
| ---------------------------- | -------- | ---------------------------------------------------------- | ---------- |
| `prototype-pollution.yml`    | CWE-1321 | `Object.assign(userInput)`, bracket notation               | HIGH       |
| `ssrf.yml`                   | CWE-918  | Dynamic URL -> `fetch`/`axios.get`/`http.request`          | HIGH       |
| `unsafe-deserialization.yml` | CWE-502  | `JSON.parse(userInput)` -> dangerous sinks                 | HIGH       |
| `prisma-raw-sqli.yml`        | CWE-89   | `$queryRaw`/`$queryRawUnsafe` with tainted input           | HIGH       |
| `xss-dom-intermediate.yml`   | CWE-79   | `innerHTML`/`dangerouslySetInnerHTML` via intermediate var | MEDIUM     |

**Maintenance policy:**

- Every rule MUST have >=1 true-positive and >=1 true-negative test fixture.
- Validation gate: `semgrep --validate --config .semgrep/rules/` + `semgrep --test .semgrep/rules/` must pass before merge.
- No rule with unresolved false positives may be merged -- suppressions documented as `nosemgrep` comments.
- Rules with `confidence: MEDIUM` or `LOW` MUST include a comment explaining the limitation.
- New rules require the same test discipline as existing code changes.

**Alternatives considered:**

- **CodeQL as gate:** Discarded -- 5-30 min/PR blocks merge throughput. Possible weekly complement (OUT-OF-SCOPE, F3).
- **OpenGrep:** Evaluated, not adopted -- maturity/supply chain concerns vs Semgrep CE.
- **Packs-only (no custom rules):** Insufficient -- EASE 2024 data shows 15.9% recall baseline is inadequate for governance gate.

**Non-scope boundary:** This is a PIPELINE-ONLY change. Custom rules are loaded by CI via `--config`. They do NOT activate the local pre-commit hook (`.semgrep/.semgrep.yml` remains unchanged). Local dev behavior is unaffected.

## Risks / Trade-offs

- **[False positives blocking F2]** → Mitigation: F1 phase allows tuning via `--exclude` patterns or `# nosemgrep` inline comments before removing `continue-on-error`.
- **[Docker image supply chain]** → Mitigation: Pin to specific tag (`1.176.1`), not `latest`. Monitor Semgrep releases for security patches.
- **[Scan timeout on large diffs]** → Mitigation: `timeout-minutes: 15` kills runaway scans. Diff-scoped scan is inherently fast.
- **[Ruleset PATCH requires admin]** → Mitigation: Documented as manual step in tasks.md. Must happen AFTER ≥1 successful F1 run (Regla 7).
- **[Naming sensitivity]** → Mitigation: Job `name: "SAST (Semgrep)"` must match ruleset check name EXACTO (Regla 8). Copy-pasteable in tasks.md.
