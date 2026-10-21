# Semgrep Security Rules Definition

## Overview

This document describes the **Semgrep security rules configuration** of this repository: the rule
policy, the failure policy and the exit-code contract of every SAST path, following a **shift-left**
strategy. Semgrep scans source code to detect common vulnerabilities early — before code reaches
production.

There are exactly **two SAST execution paths**, and they deliberately do not share a rule list:

1. **Diff-scoped gates** — the local `pre-push` hook and the CI `sast` job — both run the **shared
   script** `scripts/sast-diff.mjs` (capability `sast-diff-scanning`). One script, one pinned
   version, one pack list, one exclusion list: the same diff produces the same verdict locally and
   in CI.
2. **On-demand full scan** — `npm run sast:semgrep:full` (`scripts/security/semgrep.ps1`) — scans
   the whole repository with its own list of individual `r/...` registry rules. This is the
   **documented exception** to the single-rule-source rule (see below).

The `pre-commit` hook runs **no SAST**: it scans staged secrets only (Gitleaks). SAST needs a
baseline commit (`--baseline-commit`), which does not exist at commit time — it lives in
`pre-push` + CI (decision D1 of change `sast-shift-left-hooks-parity`).

---

## Rule policy

### Gates (`pre-push` hook + CI `sast` job): packs + versioned custom rules

Defined **once**, in `scripts/sast-diff.mjs`, and consumed verbatim by both gates:

- **Pinned version.** `SEMGREP_VERSION` is a single constant in the shared script (currently
  `1.176.1`); the CI job, the hook and the full scan all resolve that same value. A floating image
  tag is never used (RNF-02).
- **Registry packs** (the governing rule set): `p/owasp-top-ten`, `p/security-audit`, `p/secrets`,
  `p/nodejs`, `p/expressjs`, `p/sql-injection`, `p/command-injection`, `p/react`, `p/xss`.
- **Versioned custom rules** (`.semgrep/rules/*.yml`, each with fixtures under
  `.semgrep/rules/tests/`), passed as `--config .semgrep/rules` **before** the packs so local rules
  keep priority. An absent or empty directory does not fail the scan.
- **Inline exclusions** (no `.semgrepignore` dependency): `node_modules`, `dist`, `build`,
  `coverage`, `.env`, `*.min.js`, `prisma/generated`, `e2e`.
- **Severity filter**: `--severity ERROR --error --metrics off`. Only `ERROR` findings can block;
  `WARNING`/`INFO` findings are invisible to the gate by construction, and no metrics are shipped.
- **Diff scope**: `--baseline-commit` in both modes — `git merge-base origin/main HEAD` locally,
  `github.event.pull_request.base.sha` in CI. Pre-existing findings in the baseline never block.

### Deliberate exception: the on-demand full scan

`scripts/security/semgrep.ps1` (`npm run sast:semgrep:full`) keeps its individual `r/...` rule list
(93 unique rules, deduplicated from 98 entries with the effective set unchanged) for full-repository
scans on demand. The rationale is cost: 93 `--config "r/..."` flags mean one registry request per
rule — inviable inside a hook (measured as finding H5 of the PRD) but acceptable in a manual scan.
The file **reads its image tag from `SEMGREP_VERSION`** at runtime, so the version still has a
single source. Neither the hook nor the CI job uses this list.

### Severity note: the gate is ERROR-only

Both gates run with `--severity ERROR`. Of the 93 `r/...` rules of the on-demand full scan, only
**16 are `ERROR`** — the other 77 are `WARNING`/`INFO`, so the full scan surfaces strictly more
than the gates. See the coverage audit at the bottom of this document for the exact per-rule
mapping.

---

## Failure policy and exit-code contract

The script interprets the scan result through a fixed contract (RF-FAIL-01):

| Semgrep/docker result                 | Classification         | `local` (pre-push)                            | `ci` (job `sast`)                                                                                                         |
| ------------------------------------- | ---------------------- | --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| exit `0`                              | no blocking finding    | ✅ push proceeds                              | ✅ step green                                                                                                             |
| exit `1`                              | blocking ERROR finding | 🛑 push blocked                               | ❌ step fails; FASE 1: merge still allowed (`continue-on-error`), FASE 2: blocks via `prebuild-governance-complete.needs` |
| any other exit, launch error, timeout | broken tool            | ⚠️ visible warning, push proceeds (fail-open) | ❌ step fails (fail-closed), message distinguishes tool failure from a finding                                            |

- **Local is fail-open on tool failure** (RF-FAIL-02): a stopped Docker daemon, a timeout or no
  network must not block a push for an environment problem.
- **CI is fail-closed** (RF-FAIL-03): a broken tool fails the job; it is never reported as a
  passing scan.
- **Local-only skips, both with a visible notice and exit 0**: dirty working tree (RF-PP-04) and a
  pushed diff touching none of `.js .jsx .cjs .mjs .ts .tsx` (RF-PP-03). Neither skip applies in
  `ci` mode — the enforcement path has no silent skip.
- **Timeout** (RF-PP-06, objective < 60 s local): the container is cut and force-removed, the
  outcome is classified as broken tool and resolved by the mode's policy. The timeout is a **safety
  net, not an objective enforcer**: it is **300 s** locally (13 min in CI). Using 60 s as the kill
  switch turned a slow-but-working scan into `tool-broken` → fail-open, i.e. the local gate blocked
  nothing on Windows. **Re-measured on this repo (2026-10-20)**: Windows + Docker Desktop, image
  already cached, 385 files / 81 rules → **135 s** on a clean clone, **149 s** in a linked
  worktree and **207 s** in a worktree while another process loaded the machine; the same diff on `ubuntu-latest` took **22.7 s**. The earlier 42-45 s / 68 s figures
  described a much smaller tree and no longer hold. Note that `--baseline-commit` scans the **whole
  tree at both revisions**, so the cost tracks the repo size, not the diff size.
- **Linked worktrees**: the git dir of a linked worktree lives outside the tree, so the plain
  `-v <root>:/src` produced `fatal: not a git repository` → exit 2 → fail-open, silently disabling
  the gate. The script now resolves `--absolute-git-dir` / `--git-common-dir`, mounts the common dir
  and passes `GIT_DIR=<common>/worktrees/<name>`, `GIT_COMMON_DIR`, `GIT_WORK_TREE=/src`, plus an
  ephemeral `[safe] directory = *` config at `.tmp/sast-gitconfig`. The chosen strategy is printed
  on every run (`Git strategy in container: …`) so a degrade can never be silent.
- **CI report**: in `ci` mode the script always writes `.tmp/sast-report.json` (rule, severity,
  file, line per finding, plus resolved mode and baseline commit; never secret values). The job
  retains it as a 14-day artifact. The verdict never depends on the report.

---

---

## Security Rule Categories (on-demand full scan ruleset)

The individual `r/...` rules below are the ruleset of the **on-demand full scan**
(`npm run sast:semgrep:full`), grouped by OWASP category. They are NOT used by the `pre-push`
hook or by the CI `sast` job — those consume the packs from the shared script.

## Broken Access Control

Rules that detect improper authorization validation, unsafe redirects, or filesystem access issues.

- `javascript.browser.security.open-redirect.js-open-redirect`
- `javascript.browser.security.open-redirect-from-function.js-open-redirect-from-function`
- `javascript.express.security.audit.express-check-csurf-middleware-usage.express-check-csurf-middleware-usage`
- `javascript.express.security.audit.express-check-directory-listing.express-check-directory-listing`
- `javascript.express.security.audit.express-open-redirect.express-open-redirect`
- `javascript.express.security.audit.express-path-join-resolve-traversal.express-path-join-resolve-traversal`
- `javascript.express.security.audit.possible-user-input-redirect.unknown-value-in-redirect`
- `javascript.express.security.audit.res-render-injection.res-render-injection`
- `javascript.lang.security.audit.detect-non-literal-fs-filename.detect-non-literal-fs-filename`
- `javascript.lang.security.audit.path-traversal.path-join-resolve-traversal.path-join-resolve-traversal`
- `javascript.lang.security.audit.unsafe-formatstring.unsafe-formatstring`
- `javascript.lang.security.detect-no-csrf-before-method-override.detect-no-csrf-before-method-override`
- `javascript.lang.security.insecure-object-assign.insecure-object-assign`
- `typescript.react.security.audit.react-jwt-decoded-property.react-jwt-decoded-property`
- `typescript.react.security.audit.react-jwt-in-localstorage.react-jwt-in-localstorage`

---

## Broken Authentication

Rules detecting weak session management and insecure authentication configurations.

- `javascript.express.security.audit.express-cookie-settings.express-cookie-session-default-name`
- `javascript.express.security.audit.express-cookie-settings.express-cookie-session-no-domain`
- `javascript.express.security.audit.express-cookie-settings.express-cookie-session-no-expires`
- `javascript.express.security.audit.express-cookie-settings.express-cookie-session-no-httponly`
- `javascript.express.security.audit.express-cookie-settings.express-cookie-session-no-path`
- `javascript.express.security.audit.express-cookie-settings.express-cookie-session-no-secure`
- `javascript.express.security.audit.express-jwt-not-revoked.express-jwt-not-revoked`
- `javascript.express.security.audit.remote-property-injection.remote-property-injection`
- `javascript.jsonwebtoken.security.audit.jwt-exposed-data.jwt-exposed-data`

---

## Cross-Site Scripting (XSS)

Rules that detect unsafe HTML rendering and DOM manipulation vulnerabilities.

- `javascript.audit.detect-replaceall-sanitization.detect-replaceall-sanitization`
- `javascript.browser.decoded-xss.decoded-xss`
- `javascript.browser.security.dom-based-xss.dom-based-xss`
- `javascript.browser.security.insecure-document-method.insecure-document-method`
- `javascript.browser.security.insecure-innerhtml.insecure-innerhtml`
- `javascript.browser.security.raw-html-concat.raw-html-concat`
- `javascript.browser.security.raw-html-join.raw-html-join`
- `javascript.express.security.audit.xss.direct-response-write.direct-response-write`
- `javascript.express.security.audit.xss.mustache.escape-function-overwrite.escape-function-overwrite`
- `javascript.express.security.injection.raw-html-format.raw-html-format`
- `javascript.lang.security.audit.unknown-value-with-script-tag.unknown-value-with-script-tag`
- `typescript.react.security.audit.react-dangerouslysetinnerhtml.react-dangerouslysetinnerhtml`
- `typescript.react.security.audit.react-href-var.react-href-var`
- `typescript.react.security.audit.react-unsanitized-method.react-unsanitized-method`
- `typescript.react.security.audit.react-unsanitized-property.react-unsanitized-property`
- `typescript.react.security.react-markdown-insecure-html.react-markdown-insecure-html`

---

## Cryptographic Failures

Rules detecting insecure cryptographic practices or weak encryption usage.

- `javascript.jsonwebtoken.security.jwt-none-alg.jwt-none-alg`
- `javascript.lang.security.audit.md5-used-as-password.md5-used-as-password`
- `javascript.lang.security.detect-pseudorandombytes.detect-pseudoRandomBytes`
- `javascript.node-crypto.security.aead-no-final.aead-no-final`
- `javascript.node-crypto.security.gcm-no-tag-length.gcm-no-tag-length`
- `problem-based-packs.insecure-transport.js-node.using-http-server.using-http-server`
- `typescript.react.security.react-insecure-request.react-insecure-request`

---

## Identification and Authentication Failures

Rules identifying insecure secrets or misconfigured authentication mechanisms.

- `javascript.express.security.audit.express-session-hardcoded-secret.express-session-hardcoded-secret`
- `javascript.express.security.cors-misconfiguration.cors-misconfiguration`
- `javascript.express.security.express-jwt-hardcoded-secret.express-jwt-hardcoded-secret`
- `javascript.jsonwebtoken.security.jwt-hardcode.hardcoded-jwt-secret`
- `javascript.lang.security.audit.hardcoded-hmac-key.hardcoded-hmac-key`

---

## Injection

Rules detecting unsafe code execution, command injection, template injection, or SQL injection patterns.

- `javascript.audit.detect-replaceall-sanitization.detect-replaceall-sanitization`
- `javascript.browser.security.insecure-document-method.insecure-document-method`
- `javascript.browser.security.insecure-innerhtml.insecure-innerhtml`
- `javascript.browser.security.raw-html-concat.raw-html-concat`
- `javascript.browser.security.raw-html-join.raw-html-join`
- `javascript.express.security.audit.xss.direct-response-write.direct-response-write`
- `javascript.express.security.audit.xss.mustache.escape-function-overwrite.escape-function-overwrite`
- `javascript.express.security.express-insecure-template-usage.express-insecure-template-usage`
- `javascript.express.security.express-sandbox-injection.express-sandbox-code-injection`
- `javascript.express.security.injection.raw-html-format.raw-html-format`
- `javascript.express.security.injection.tainted-sql-string.tainted-sql-string`
- `javascript.lang.security.audit.code-string-concat.code-string-concat`
- `javascript.lang.security.audit.dangerous-spawn-shell.dangerous-spawn-shell`
- `javascript.lang.security.audit.detect-non-literal-require.detect-non-literal-require`
- `javascript.lang.security.audit.incomplete-sanitization.incomplete-sanitization`
- `javascript.lang.security.audit.spawn-shell-true.spawn-shell-true`
- `javascript.lang.security.audit.unknown-value-with-script-tag.unknown-value-with-script-tag`
- `javascript.lang.security.audit.unsafe-dynamic-method.unsafe-dynamic-method`
- `javascript.lang.security.detect-child-process.detect-child-process`
- `javascript.lang.security.detect-disable-mustache-escape.detect-disable-mustache-escape`
- `javascript.lang.security.detect-eval-with-expression.detect-eval-with-expression`
- `javascript.lang.security.html-in-template-string.html-in-template-string`
- `javascript.lang.security.spawn-git-clone.spawn-git-clone`
- `javascript.playwright.security.audit.playwright-exposed-chrome-devtools.playwright-exposed-chrome-devtools`
- `typescript.react.security.audit.react-dangerouslysetinnerhtml.react-dangerouslysetinnerhtml`
- `typescript.react.security.audit.react-href-var.react-href-var`
- `typescript.react.security.audit.react-unsanitized-method.react-unsanitized-method`
- `typescript.react.security.audit.react-unsanitized-property.react-unsanitized-property`
- `typescript.react.security.react-markdown-insecure-html.react-markdown-insecure-html`

---

## Insecure Deserialization

- `javascript.express.security.audit.express-third-party-object-deserialization.express-third-party-object-deserialization`

---

## Insecure Design

Rules identifying insecure architectural or configuration patterns.

- `javascript.express.security.audit.express-cookie-settings.express-cookie-session-default-name`
- `javascript.express.security.audit.express-cookie-settings.express-cookie-session-no-domain`
- `javascript.express.security.audit.express-cookie-settings.express-cookie-session-no-expires`
- `javascript.express.security.audit.express-cookie-settings.express-cookie-session-no-httponly`
- `javascript.express.security.audit.express-cookie-settings.express-cookie-session-no-path`
- `javascript.express.security.audit.express-cookie-settings.express-cookie-session-no-secure`
- `javascript.express.security.audit.express-jwt-not-revoked.express-jwt-not-revoked`
- `javascript.express.security.audit.express-res-sendfile.express-res-sendfile`
- `javascript.express.security.audit.remote-property-injection.remote-property-injection`
- `javascript.express.security.x-frame-options-misconfiguration.x-frame-options-misconfiguration`
- `javascript.jsonwebtoken.security.audit.jwt-exposed-data.jwt-exposed-data`

---

## Security Misconfiguration

- `javascript.express.security.audit.express-check-directory-listing.express-check-directory-listing`
- `javascript.lang.security.audit.detect-non-literal-regexp.detect-non-literal-regexp`
- `javascript.lang.security.audit.detect-redos.detect-redos`

---

## Sensitive Data Exposure

- `javascript.jsonwebtoken.security.jwt-none-alg.jwt-none-alg`
- `javascript.lang.security.audit.md5-used-as-password.md5-used-as-password`
- `problem-based-packs.insecure-transport.js-node.bypass-tls-verification.bypass-tls-verification`
- `problem-based-packs.insecure-transport.js-node.disallow-old-tls-versions1.disallow-old-tls-versions1`
- `problem-based-packs.insecure-transport.js-node.disallow-old-tls-versions2.disallow-old-tls-versions2`
- `problem-based-packs.insecure-transport.js-node.ftp-request.ftp-request`
- `problem-based-packs.insecure-transport.js-node.http-request.http-request`
- `typescript.react.security.react-insecure-request.react-insecure-request`

---

## Server-Side Request Forgery (SSRF)

- `javascript.chrome-remote-interface.security.audit.chrome-remote-interface-compilescript-injection.chrome-remote-interface-compilescript-injection`
- `javascript.express.security.audit.express-ssrf.express-ssrf`
- `javascript.express.security.express-phantom-injection.express-phantom-injection`
- `javascript.phantom.security.audit.phantom-injection.phantom-injection`
- `javascript.playwright.security.audit.playwright-addinitscript-code-injection.playwright-addinitscript-code-injection`
- `javascript.playwright.security.audit.playwright-evaluate-arg-injection.playwright-evaluate-arg-injection`
- `javascript.playwright.security.audit.playwright-evaluate-code-injection.playwright-evaluate-code-injection`
- `javascript.playwright.security.audit.playwright-goto-injection.playwright-goto-injection`
- `javascript.playwright.security.audit.playwright-setcontent-injection.playwright-setcontent-injection`

---

## Software and Data Integrity Failures

- `javascript.browser.security.insufficient-postmessage-origin-validation.insufficient-postmessage-origin-validation`
- `javascript.browser.security.wildcard-postmessage-configuration.wildcard-postmessage-configuration`
- `javascript.express.security.audit.express-third-party-object-deserialization.express-third-party-object-deserialization`
- `javascript.express.security.express-data-exfiltration.express-data-exfiltration`
- `javascript.lang.security.audit.prototype-pollution.prototype-pollution-assignment.prototype-pollution-assignment`
- `javascript.lang.security.audit.prototype-pollution.prototype-pollution-loop.prototype-pollution-loop`
- `javascript.lang.security.audit.sqli.node-postgres-sqli.node-postgres-sqli`

---

## Vulnerable and Outdated Components

- `javascript.express.security.audit.express-detect-notevil-usage.express-detect-notevil-usage`

---

---

## Coverage audit: the 93 `r/...` rules vs the 9 packs and the custom rules (change `sast-shift-left-hooks-parity`)

Methodology (task 1.4 of the change) — every number below is reproducible from three live
sources, fetched on **2026-10-19**:

1. **Pack membership and severity**: `GET https://semgrep.dev/c/p/<pack>` for the nine packs
   (owasp-top-ten 560, security-audit 225, secrets 52, nodejs 36, expressjs 71, sql-injection 47,
   command-injection 31, react 4, xss 35 — **1,061 pack rules**).
2. **Canonical severity of each `r/...` rule**: `GET /api/registry/rule/<id>`, field
   `definition.rules[0].severity` (16 ERROR, 71 WARNING, 6 INFO over the 93).
3. **Custom-rule coverage**: hand-audited rule by rule, reading each custom rule's
   `pattern-sources`/`pattern-sinks` in `.semgrep/rules/*.yml`.

Two cross-checks were run before classifying anything:

- For the **125** rule ids that appear both in a pack and in the registry, the pack severity equals
  the canonical severity (**0 mismatches**). So "the pack ships it at WARNING" is the rule's _own_
  severity, not a pack-specific override.
- The 93 ids in `FULL_SCAN_RULES` (`scripts/sast-diff.mjs`) were compared against the 93
  `--config="r/…"` entries of `scripts/security/semgrep.ps1`: **identical set, identical order,
  0 differences on either side**. The manifest is a faithful copy of the full-scan list.

### Why severity decides the outcome

The gates run `--severity ERROR --error`. A rule shipped by a pack at WARNING/INFO produces a
finding that the severity filter **discards**: the rule is in the rule set, but it can never block
a push. That is a materially different situation from "the rule is not there at all", so the
classification keeps the two apart.

| State        | Meaning                                                                                                                 | Count |
| ------------ | ----------------------------------------------------------------------------------------------------------------------- | ----- |
| **EFECTIVA** | shipped by ≥1 pack at `ERROR` — the gate blocks on it                                                                   | 10    |
| **PARCIAL**  | shipped by a pack, but only at `WARNING`/`INFO` — present in the rule set, **invisible to the `--severity ERROR` gate** | 37    |
| **CUSTOM**   | not shipped by any pack; a versioned custom rule (`.semgrep/rules/`, `severity: ERROR`) covers the same weakness class  | 3     |
| **CUSTOM-P** | not shipped by any pack; a custom rule covers the class **partially** (narrower sink set or narrower taint source)      | 4     |
| **HUECO**    | not shipped by any pack and not covered by any custom rule                                                              | 39    |

**Summary: 93/93 classified — 10 effective, 37 partial (in a pack
but filtered out by the ERROR-only gate), 3 covered by a custom rule,
4 partially covered, 39 gaps.**

The practical reading: only **10 of the 93** full-scan rules are enforced by the
gates exactly as written. The 37 "partial" ones are the reason the on-demand full
scan surfaces strictly more than the hook or the CI job — not a configuration bug, but a direct
consequence of the `ERROR`-only gate.

| #   | Regla `r/...`                                                                                                                                       | Severidad | Estado   | Cubierta por / nota                                                                                                                                                                             |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------- | --------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `javascript.browser.security.open-redirect.js-open-redirect`                                                                                        | WARNING   | PARCIAL  | p/owasp-top-ten (WARNING), p/expressjs (WARNING) — el pack la trae, pero `--severity ERROR` descarta su hallazgo: nunca bloquea                                                                 |
| 2   | `javascript.browser.security.open-redirect-from-function.js-open-redirect-from-function`                                                            | INFO      | HUECO    | el pack trae `js-open-redirect` (redirect desde literal), no esta variante                                                                                                                      |
| 3   | `javascript.express.security.audit.express-check-csurf-middleware-usage.express-check-csurf-middleware-usage`                                       | INFO      | HUECO    | sin regla equivalente en los packs                                                                                                                                                              |
| 4   | `javascript.express.security.audit.express-check-directory-listing.express-check-directory-listing`                                                 | WARNING   | PARCIAL  | p/owasp-top-ten (WARNING), p/nodejs (WARNING), p/expressjs (WARNING) — el pack la trae, pero `--severity ERROR` descarta su hallazgo: nunca bloquea                                             |
| 5   | `javascript.express.security.audit.express-open-redirect.express-open-redirect`                                                                     | WARNING   | PARCIAL  | p/owasp-top-ten (WARNING), p/nodejs (WARNING), p/expressjs (WARNING) — el pack la trae, pero `--severity ERROR` descarta su hallazgo: nunca bloquea                                             |
| 6   | `javascript.express.security.audit.express-path-join-resolve-traversal.express-path-join-resolve-traversal`                                         | WARNING   | PARCIAL  | p/owasp-top-ten (WARNING), p/nodejs (WARNING), p/expressjs (WARNING) — el pack la trae, pero `--severity ERROR` descarta su hallazgo: nunca bloquea                                             |
| 7   | `javascript.express.security.audit.possible-user-input-redirect.unknown-value-in-redirect`                                                          | WARNING   | PARCIAL  | p/security-audit (WARNING) — el pack la trae, pero `--severity ERROR` descarta su hallazgo: nunca bloquea                                                                                       |
| 8   | `javascript.express.security.audit.res-render-injection.res-render-injection`                                                                       | WARNING   | PARCIAL  | p/owasp-top-ten (WARNING), p/nodejs (WARNING), p/expressjs (WARNING) — el pack la trae, pero `--severity ERROR` descarta su hallazgo: nunca bloquea                                             |
| 9   | `javascript.lang.security.audit.detect-non-literal-fs-filename.detect-non-literal-fs-filename`                                                      | WARNING   | HUECO    | sin regla equivalente en los packs                                                                                                                                                              |
| 10  | `javascript.lang.security.audit.path-traversal.path-join-resolve-traversal.path-join-resolve-traversal`                                             | WARNING   | HUECO    | la variante `express` sí está en p/owasp-top-ten, p/nodejs y p/expressjs                                                                                                                        |
| 11  | `javascript.lang.security.audit.unsafe-formatstring.unsafe-formatstring`                                                                            | INFO      | HUECO    | sin regla equivalente en los packs                                                                                                                                                              |
| 12  | `javascript.lang.security.detect-no-csrf-before-method-override.detect-no-csrf-before-method-override`                                              | WARNING   | PARCIAL  | p/security-audit (WARNING) — el pack la trae, pero `--severity ERROR` descarta su hallazgo: nunca bloquea                                                                                       |
| 13  | `javascript.lang.security.insecure-object-assign.insecure-object-assign`                                                                            | WARNING   | CUSTOM-P | regla custom `prototype-pollution` (ERROR) cubre `Object.assign` con taint de `req`; la regla de registro usa la fuente `JSON.parse`                                                            |
| 14  | `typescript.react.security.audit.react-jwt-decoded-property.react-jwt-decoded-property`                                                             | INFO      | HUECO    | sin regla equivalente en los packs                                                                                                                                                              |
| 15  | `typescript.react.security.audit.react-jwt-in-localstorage.react-jwt-in-localstorage`                                                               | INFO      | HUECO    | sin regla equivalente en los packs                                                                                                                                                              |
| 16  | `javascript.express.security.audit.express-cookie-settings.express-cookie-session-default-name`                                                     | WARNING   | PARCIAL  | p/owasp-top-ten (WARNING), p/nodejs (WARNING), p/expressjs (WARNING) — el pack la trae, pero `--severity ERROR` descarta su hallazgo: nunca bloquea                                             |
| 17  | `javascript.express.security.audit.express-cookie-settings.express-cookie-session-no-domain`                                                        | WARNING   | PARCIAL  | p/owasp-top-ten (WARNING), p/nodejs (WARNING), p/expressjs (WARNING) — el pack la trae, pero `--severity ERROR` descarta su hallazgo: nunca bloquea                                             |
| 18  | `javascript.express.security.audit.express-cookie-settings.express-cookie-session-no-expires`                                                       | WARNING   | PARCIAL  | p/owasp-top-ten (WARNING), p/nodejs (WARNING), p/expressjs (WARNING) — el pack la trae, pero `--severity ERROR` descarta su hallazgo: nunca bloquea                                             |
| 19  | `javascript.express.security.audit.express-cookie-settings.express-cookie-session-no-httponly`                                                      | WARNING   | PARCIAL  | p/owasp-top-ten (WARNING), p/nodejs (WARNING), p/expressjs (WARNING) — el pack la trae, pero `--severity ERROR` descarta su hallazgo: nunca bloquea                                             |
| 20  | `javascript.express.security.audit.express-cookie-settings.express-cookie-session-no-path`                                                          | WARNING   | PARCIAL  | p/owasp-top-ten (WARNING), p/nodejs (WARNING), p/expressjs (WARNING) — el pack la trae, pero `--severity ERROR` descarta su hallazgo: nunca bloquea                                             |
| 21  | `javascript.express.security.audit.express-cookie-settings.express-cookie-session-no-secure`                                                        | WARNING   | PARCIAL  | p/owasp-top-ten (WARNING), p/nodejs (WARNING), p/expressjs (WARNING) — el pack la trae, pero `--severity ERROR` descarta su hallazgo: nunca bloquea                                             |
| 22  | `javascript.express.security.audit.express-jwt-not-revoked.express-jwt-not-revoked`                                                                 | WARNING   | PARCIAL  | p/owasp-top-ten (WARNING), p/nodejs (WARNING), p/expressjs (WARNING) — el pack la trae, pero `--severity ERROR` descarta su hallazgo: nunca bloquea                                             |
| 23  | `javascript.express.security.audit.remote-property-injection.remote-property-injection`                                                             | ERROR     | CUSTOM   | regla custom `prototype-pollution` (ERROR) — cubre la escritura con índice `obj[req…]` (requiere taint probado de `req`)                                                                        |
| 24  | `javascript.jsonwebtoken.security.audit.jwt-exposed-data.jwt-exposed-data`                                                                          | WARNING   | HUECO    | sin regla equivalente en los packs                                                                                                                                                              |
| 25  | `javascript.audit.detect-replaceall-sanitization.detect-replaceall-sanitization`                                                                    | INFO      | HUECO    | sin regla equivalente en los packs                                                                                                                                                              |
| 26  | `javascript.browser.decoded-xss.decoded-xss`                                                                                                        | WARNING   | HUECO    | adyacente a `xss-dom-intermediate`, pero el sink/fuente difieren                                                                                                                                |
| 27  | `javascript.browser.security.dom-based-xss.dom-based-xss`                                                                                           | ERROR     | HUECO    | las fuentes de `xss-dom-intermediate` son req/req.body/req.query/req.params: `document.location` **no** está cubierto                                                                           |
| 28  | `javascript.browser.security.insecure-document-method.insecure-document-method`                                                                     | ERROR     | CUSTOM-P | regla custom `xss-dom-intermediate` (ERROR) cubre `innerHTML` y `document.write` con taint de `req`; **no** cubre `outerHTML` ni valores no tainted                                             |
| 29  | `javascript.browser.security.insecure-innerhtml.insecure-innerhtml`                                                                                 | ERROR     | CUSTOM-P | regla custom `xss-dom-intermediate` (ERROR) cubre el sink `innerHTML`, pero solo con taint de `req` (la regla de registro matchea cualquier valor no literal)                                   |
| 30  | `javascript.browser.security.raw-html-concat.raw-html-concat`                                                                                       | WARNING   | PARCIAL  | p/owasp-top-ten (WARNING), p/expressjs (WARNING), p/xss (WARNING) — el pack la trae, pero `--severity ERROR` descarta su hallazgo: nunca bloquea                                                |
| 31  | `javascript.browser.security.raw-html-join.raw-html-join`                                                                                           | WARNING   | HUECO    | adyacente a `xss-dom-intermediate` (sin requisito de taint)                                                                                                                                     |
| 32  | `javascript.express.security.audit.xss.direct-response-write.direct-response-write`                                                                 | WARNING   | PARCIAL  | p/owasp-top-ten (WARNING), p/nodejs (WARNING), p/expressjs (WARNING), p/xss (WARNING) — el pack la trae, pero `--severity ERROR` descarta su hallazgo: nunca bloquea                            |
| 33  | `javascript.express.security.audit.xss.mustache.escape-function-overwrite.escape-function-overwrite`                                                | WARNING   | HUECO    | mustache no se usa en este repo                                                                                                                                                                 |
| 34  | `javascript.express.security.injection.raw-html-format.raw-html-format`                                                                             | WARNING   | PARCIAL  | p/owasp-top-ten (WARNING), p/nodejs (WARNING), p/expressjs (WARNING), p/xss (WARNING) — el pack la trae, pero `--severity ERROR` descarta su hallazgo: nunca bloquea                            |
| 35  | `javascript.lang.security.audit.unknown-value-with-script-tag.unknown-value-with-script-tag`                                                        | WARNING   | PARCIAL  | p/security-audit (WARNING) — el pack la trae, pero `--severity ERROR` descarta su hallazgo: nunca bloquea                                                                                       |
| 36  | `typescript.react.security.audit.react-dangerouslysetinnerhtml.react-dangerouslysetinnerhtml`                                                       | WARNING   | PARCIAL  | p/owasp-top-ten (WARNING), p/security-audit (WARNING), p/expressjs (WARNING), p/react (WARNING), p/xss (WARNING) — el pack la trae, pero `--severity ERROR` descarta su hallazgo: nunca bloquea |
| 37  | `typescript.react.security.audit.react-href-var.react-href-var`                                                                                     | WARNING   | HUECO    | sin regla equivalente en los packs                                                                                                                                                              |
| 38  | `typescript.react.security.audit.react-unsanitized-method.react-unsanitized-method`                                                                 | WARNING   | PARCIAL  | p/owasp-top-ten (WARNING), p/expressjs (WARNING), p/react (WARNING), p/xss (WARNING) — el pack la trae, pero `--severity ERROR` descarta su hallazgo: nunca bloquea                             |
| 39  | `typescript.react.security.audit.react-unsanitized-property.react-unsanitized-property`                                                             | WARNING   | PARCIAL  | p/owasp-top-ten (WARNING), p/expressjs (WARNING), p/react (WARNING), p/xss (WARNING) — el pack la trae, pero `--severity ERROR` descarta su hallazgo: nunca bloquea                             |
| 40  | `typescript.react.security.react-markdown-insecure-html.react-markdown-insecure-html`                                                               | WARNING   | PARCIAL  | p/security-audit (WARNING) — el pack la trae, pero `--severity ERROR` descarta su hallazgo: nunca bloquea                                                                                       |
| 41  | `javascript.jsonwebtoken.security.jwt-none-alg.jwt-none-alg`                                                                                        | ERROR     | EFECTIVA | p/owasp-top-ten (ERROR), p/security-audit (ERROR), p/expressjs (ERROR)                                                                                                                          |
| 42  | `javascript.lang.security.audit.md5-used-as-password.md5-used-as-password`                                                                          | WARNING   | HUECO    | sin regla equivalente en los packs                                                                                                                                                              |
| 43  | `javascript.lang.security.detect-pseudorandombytes.detect-pseudoRandomBytes`                                                                        | WARNING   | PARCIAL  | p/security-audit (WARNING) — el pack la trae, pero `--severity ERROR` descarta su hallazgo: nunca bloquea                                                                                       |
| 44  | `javascript.node-crypto.security.aead-no-final.aead-no-final`                                                                                       | ERROR     | EFECTIVA | p/owasp-top-ten (ERROR)                                                                                                                                                                         |
| 45  | `javascript.node-crypto.security.gcm-no-tag-length.gcm-no-tag-length`                                                                               | ERROR     | EFECTIVA | p/owasp-top-ten (ERROR)                                                                                                                                                                         |
| 46  | `problem-based-packs.insecure-transport.js-node.using-http-server.using-http-server`                                                                | WARNING   | HUECO    | sin regla equivalente en los packs                                                                                                                                                              |
| 47  | `typescript.react.security.react-insecure-request.react-insecure-request`                                                                           | ERROR     | EFECTIVA | p/owasp-top-ten (ERROR), p/security-audit (ERROR), p/expressjs (ERROR), p/react (ERROR)                                                                                                         |
| 48  | `javascript.express.security.audit.express-session-hardcoded-secret.express-session-hardcoded-secret`                                               | WARNING   | PARCIAL  | p/owasp-top-ten (WARNING), p/secrets (WARNING), p/nodejs (WARNING), p/expressjs (WARNING) — el pack la trae, pero `--severity ERROR` descarta su hallazgo: nunca bloquea                        |
| 49  | `javascript.express.security.cors-misconfiguration.cors-misconfiguration`                                                                           | WARNING   | PARCIAL  | p/owasp-top-ten (WARNING), p/nodejs (WARNING), p/expressjs (WARNING) — el pack la trae, pero `--severity ERROR` descarta su hallazgo: nunca bloquea                                             |
| 50  | `javascript.express.security.express-jwt-hardcoded-secret.express-jwt-hardcoded-secret`                                                             | WARNING   | PARCIAL  | p/owasp-top-ten (WARNING), p/secrets (WARNING), p/nodejs (WARNING), p/expressjs (WARNING) — el pack la trae, pero `--severity ERROR` descarta su hallazgo: nunca bloquea                        |
| 51  | `javascript.jsonwebtoken.security.jwt-hardcode.hardcoded-jwt-secret`                                                                                | WARNING   | PARCIAL  | p/owasp-top-ten (WARNING), p/security-audit (WARNING), p/secrets (WARNING), p/expressjs (WARNING) — el pack la trae, pero `--severity ERROR` descarta su hallazgo: nunca bloquea                |
| 52  | `javascript.lang.security.audit.hardcoded-hmac-key.hardcoded-hmac-key`                                                                              | WARNING   | HUECO    | sin regla equivalente en los packs                                                                                                                                                              |
| 53  | `javascript.express.security.express-insecure-template-usage.express-insecure-template-usage`                                                       | WARNING   | PARCIAL  | p/owasp-top-ten (WARNING), p/nodejs (WARNING), p/expressjs (WARNING) — el pack la trae, pero `--severity ERROR` descarta su hallazgo: nunca bloquea                                             |
| 54  | `javascript.express.security.express-sandbox-injection.express-sandbox-code-injection`                                                              | ERROR     | EFECTIVA | p/owasp-top-ten (ERROR), p/nodejs (ERROR), p/expressjs (ERROR)                                                                                                                                  |
| 55  | `javascript.express.security.injection.tainted-sql-string.tainted-sql-string`                                                                       | ERROR     | EFECTIVA | p/expressjs (ERROR)                                                                                                                                                                             |
| 56  | `javascript.lang.security.audit.code-string-concat.code-string-concat`                                                                              | ERROR     | EFECTIVA | p/owasp-top-ten (ERROR), p/nodejs (ERROR), p/expressjs (ERROR)                                                                                                                                  |
| 57  | `javascript.lang.security.audit.dangerous-spawn-shell.dangerous-spawn-shell`                                                                        | ERROR     | HUECO    | p/security-audit trae `detect-child-process` (ERROR) pero para el sink `exec`, no `spawn` con shell                                                                                             |
| 58  | `javascript.lang.security.audit.detect-non-literal-require.detect-non-literal-require`                                                              | WARNING   | HUECO    | sin regla equivalente en los packs                                                                                                                                                              |
| 59  | `javascript.lang.security.audit.incomplete-sanitization.incomplete-sanitization`                                                                    | WARNING   | HUECO    | sin regla equivalente en los packs                                                                                                                                                              |
| 60  | `javascript.lang.security.audit.spawn-shell-true.spawn-shell-true`                                                                                  | ERROR     | HUECO    | p/command-injection trae `subprocess-shell-true` solo para Python                                                                                                                               |
| 61  | `javascript.lang.security.audit.unsafe-dynamic-method.unsafe-dynamic-method`                                                                        | WARNING   | HUECO    | sin regla equivalente en los packs                                                                                                                                                              |
| 62  | `javascript.lang.security.detect-child-process.detect-child-process`                                                                                | ERROR     | EFECTIVA | p/security-audit (ERROR)                                                                                                                                                                        |
| 63  | `javascript.lang.security.detect-disable-mustache-escape.detect-disable-mustache-escape`                                                            | WARNING   | PARCIAL  | p/security-audit (WARNING) — el pack la trae, pero `--severity ERROR` descarta su hallazgo: nunca bloquea                                                                                       |
| 64  | `javascript.lang.security.detect-eval-with-expression.detect-eval-with-expression`                                                                  | WARNING   | PARCIAL  | p/owasp-top-ten (WARNING), p/security-audit (WARNING), p/expressjs (WARNING) — el pack la trae, pero `--severity ERROR` descarta su hallazgo: nunca bloquea                                     |
| 65  | `javascript.lang.security.html-in-template-string.html-in-template-string`                                                                          | WARNING   | HUECO    | sin regla equivalente en los packs                                                                                                                                                              |
| 66  | `javascript.lang.security.spawn-git-clone.spawn-git-clone`                                                                                          | ERROR     | EFECTIVA | p/security-audit (ERROR)                                                                                                                                                                        |
| 67  | `javascript.playwright.security.audit.playwright-exposed-chrome-devtools.playwright-exposed-chrome-devtools`                                        | WARNING   | HUECO    | sin regla equivalente en los packs                                                                                                                                                              |
| 68  | `javascript.express.security.audit.express-third-party-object-deserialization.express-third-party-object-deserialization`                           | WARNING   | PARCIAL  | p/owasp-top-ten (WARNING), p/nodejs (WARNING), p/expressjs (WARNING) — el pack la trae, pero `--severity ERROR` descarta su hallazgo: nunca bloquea                                             |
| 69  | `javascript.express.security.audit.express-res-sendfile.express-res-sendfile`                                                                       | WARNING   | PARCIAL  | p/owasp-top-ten (WARNING), p/nodejs (WARNING), p/expressjs (WARNING) — el pack la trae, pero `--severity ERROR` descarta su hallazgo: nunca bloquea                                             |
| 70  | `javascript.express.security.x-frame-options-misconfiguration.x-frame-options-misconfiguration`                                                     | WARNING   | PARCIAL  | p/owasp-top-ten (WARNING), p/nodejs (WARNING), p/expressjs (WARNING) — el pack la trae, pero `--severity ERROR` descarta su hallazgo: nunca bloquea                                             |
| 71  | `javascript.lang.security.audit.detect-non-literal-regexp.detect-non-literal-regexp`                                                                | WARNING   | HUECO    | sin regla equivalente en los packs                                                                                                                                                              |
| 72  | `javascript.lang.security.audit.detect-redos.detect-redos`                                                                                          | WARNING   | HUECO    | sin regla equivalente en los packs                                                                                                                                                              |
| 73  | `problem-based-packs.insecure-transport.js-node.bypass-tls-verification.bypass-tls-verification`                                                    | WARNING   | PARCIAL  | p/nodejs (WARNING), p/expressjs (WARNING) — el pack la trae, pero `--severity ERROR` descarta su hallazgo: nunca bloquea                                                                        |
| 74  | `problem-based-packs.insecure-transport.js-node.disallow-old-tls-versions1.disallow-old-tls-versions1`                                              | WARNING   | HUECO    | sin regla equivalente en los packs                                                                                                                                                              |
| 75  | `problem-based-packs.insecure-transport.js-node.disallow-old-tls-versions2.disallow-old-tls-versions2`                                              | WARNING   | HUECO    | sin regla equivalente en los packs                                                                                                                                                              |
| 76  | `problem-based-packs.insecure-transport.js-node.ftp-request.ftp-request`                                                                            | WARNING   | HUECO    | sin regla equivalente en los packs                                                                                                                                                              |
| 77  | `problem-based-packs.insecure-transport.js-node.http-request.http-request`                                                                          | WARNING   | HUECO    | sin regla equivalente en los packs                                                                                                                                                              |
| 78  | `javascript.chrome-remote-interface.security.audit.chrome-remote-interface-compilescript-injection.chrome-remote-interface-compilescript-injection` | WARNING   | PARCIAL  | p/owasp-top-ten (WARNING), p/expressjs (WARNING) — el pack la trae, pero `--severity ERROR` descarta su hallazgo: nunca bloquea                                                                 |
| 79  | `javascript.express.security.audit.express-ssrf.express-ssrf`                                                                                       | WARNING   | PARCIAL  | p/owasp-top-ten (WARNING), p/nodejs (WARNING), p/expressjs (WARNING) — el pack la trae, pero `--severity ERROR` descarta su hallazgo: nunca bloquea                                             |
| 80  | `javascript.express.security.express-phantom-injection.express-phantom-injection`                                                                   | ERROR     | EFECTIVA | p/owasp-top-ten (ERROR), p/nodejs (ERROR), p/expressjs (ERROR)                                                                                                                                  |
| 81  | `javascript.phantom.security.audit.phantom-injection.phantom-injection`                                                                             | WARNING   | HUECO    | la variante `express-phantom-injection` sí está en p/owasp-top-ten, p/nodejs y p/expressjs (ERROR)                                                                                              |
| 82  | `javascript.playwright.security.audit.playwright-addinitscript-code-injection.playwright-addinitscript-code-injection`                              | WARNING   | HUECO    | sin regla equivalente en los packs                                                                                                                                                              |
| 83  | `javascript.playwright.security.audit.playwright-evaluate-arg-injection.playwright-evaluate-arg-injection`                                          | WARNING   | HUECO    | sin regla equivalente en los packs                                                                                                                                                              |
| 84  | `javascript.playwright.security.audit.playwright-evaluate-code-injection.playwright-evaluate-code-injection`                                        | WARNING   | HUECO    | sin regla equivalente en los packs                                                                                                                                                              |
| 85  | `javascript.playwright.security.audit.playwright-goto-injection.playwright-goto-injection`                                                          | WARNING   | HUECO    | sin regla equivalente en los packs                                                                                                                                                              |
| 86  | `javascript.playwright.security.audit.playwright-setcontent-injection.playwright-setcontent-injection`                                              | WARNING   | HUECO    | sin regla equivalente en los packs                                                                                                                                                              |
| 87  | `javascript.browser.security.insufficient-postmessage-origin-validation.insufficient-postmessage-origin-validation`                                 | WARNING   | HUECO    | la regla hermana `wildcard-postmessage-configuration` sí está en p/owasp-top-ten y p/expressjs                                                                                                  |
| 88  | `javascript.browser.security.wildcard-postmessage-configuration.wildcard-postmessage-configuration`                                                 | WARNING   | PARCIAL  | p/owasp-top-ten (WARNING), p/expressjs (WARNING) — el pack la trae, pero `--severity ERROR` descarta su hallazgo: nunca bloquea                                                                 |
| 89  | `javascript.express.security.express-data-exfiltration.express-data-exfiltration`                                                                   | WARNING   | HUECO    | sin regla equivalente en los packs                                                                                                                                                              |
| 90  | `javascript.lang.security.audit.prototype-pollution.prototype-pollution-assignment.prototype-pollution-assignment`                                  | WARNING   | CUSTOM   | regla custom `prototype-pollution` (ERROR) — misma clase de defecto                                                                                                                             |
| 91  | `javascript.lang.security.audit.prototype-pollution.prototype-pollution-loop.prototype-pollution-loop`                                              | WARNING   | CUSTOM-P | regla custom `prototype-pollution` (ERROR) cubre la escritura `o[k] = v`; la variante de lectura en bucle (`o = o[k]`) no                                                                       |
| 92  | `javascript.lang.security.audit.sqli.node-postgres-sqli.node-postgres-sqli`                                                                         | WARNING   | CUSTOM   | regla custom `prisma-raw-sqli` (ERROR) — misma clase (SQLi por query cruda); el sink `pg` no se usa en este repo (Prisma)                                                                       |
| 93  | `javascript.express.security.audit.express-detect-notevil-usage.express-detect-notevil-usage`                                                       | WARNING   | HUECO    | sin regla equivalente en los packs                                                                                                                                                              |

### Gaps críticos (`ERROR`) escalados

Only rules whose **own severity is `ERROR`** and which the gates do **not** enforce _as written_ are
listed here: 5 rules (3 with no coverage at all + 2 covered only partially by a custom rule). The
remaining 11 `ERROR` rules are enforced by the gate — 10 as written (`EFECTIVA`) and 1 through a
custom rule that covers the same weakness class (`CUSTOM`).

**Sin cobertura alguna (3):**

- `javascript.browser.security.dom-based-xss.dom-based-xss` — sin ninguna cobertura en packs ni en reglas custom
- `javascript.lang.security.audit.dangerous-spawn-shell.dangerous-spawn-shell` — sin ninguna cobertura en packs ni en reglas custom
- `javascript.lang.security.audit.spawn-shell-true.spawn-shell-true` — sin ninguna cobertura en packs ni en reglas custom

**Cobertura parcial (2):**

- `javascript.browser.security.insecure-document-method.insecure-document-method` — cobertura parcial: `xss-dom-intermediate` (ERROR) cubre el sink principal, no todas sus variantes
- `javascript.browser.security.insecure-innerhtml.insecure-innerhtml` — cobertura parcial: `xss-dom-intermediate` (ERROR) cubre el sink principal, no todas sus variantes

### Disposition of the critical gaps

The 5 `ERROR`-severity gaps above are **escalated as candidates to be vendored
into `.semgrep/rules/` with fixtures** (the path the capability already provides: versioned custom
rules + per-rule fixtures) or dropped in a **follow-up change** — per PRD §7.2 and design D5 of
`sast-shift-left-hooks-parity`, which explicitly keeps vendorization out of that change's scope.
Until then, the hooks/CI gate does not enforce those rules (the on-demand full scan still runs them
directly), and this is a known, documented limitation — not a silent one.

Note the practical exposure of the three uncovered ones: `document.location` reaching
`document.write` (`dom-based-xss`), `child_process.spawn` with a shell (`dangerous-spawn-shell`,
`spawn-shell-true`). The repo currently has no `document.write`, no `child_process.spawn` with
shell and no `pg` client, so the exposure is latent rather than active — but the gate would not
catch the introduction of one.

---

## Security Strategy

The implemented policy supports a **shift-left security approach**, detecting issues as early as
possible in the development lifecycle:

1. **`pre-commit`** — staged-secret scan (Gitleaks, < 5 s, redacted output, fail-open only on tool
   failure). No SAST: a committed secret is the one class of finding that is cheapest to fix at
   commit time.
2. **`pre-push`** — diff-scoped SAST (`scripts/sast-diff.mjs`, local mode) between the
   commit-signature gate and the scoped tests: a new `ERROR` finding blocks the push before the
   test suite is paid for; broken tooling never blocks.
3. **CI (`sast` job)** — the same script in `ci` mode: the enforcement point. FASE 1 advisory
   (`continue-on-error: true` + 14-day report artifact, graduation criterion in the workflow and in
   `docs/learning/quality-gates.md` §7); FASE 2 blocking through
   `prebuild-governance-complete.needs` once the calibration window closes.
4. **On demand** — `npm run sast:semgrep:full` for the complete repository with the full `r/...`
   ruleset.

This reduces the cost of vulnerabilities by surfacing them where they are cheapest to fix: the
editor/push loop and the PR, long before deployment.
