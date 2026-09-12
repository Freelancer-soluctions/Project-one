## 1. CI Workflow -- SAST Job (F1: non-blocking)

- [ ] 1.1 Add `sast` job to `.github/workflows/ci.yml` after the `dependency-review` job (after L755, before the `ci-complete` section at L757). Exact `name: "SAST (Semgrep)"`. Config: `runs-on: ubuntu-latest`, `timeout-minutes: 15`, `if: github.event_name == 'pull_request'` (NOT merge_group), `permissions: contents: read` (NO security-events). **`continue-on-error: true`** (F1). NO `CI_MINIMAL` gate in `if:`. NO addition to `ci-complete.needs`.
- [ ] 1.2 Job steps: (a) `actions/checkout@v5` with `fetch-depth: 0`, (b) `docker run --rm -v ${{ github.workspace }}:/src semgrep/semgrep:1.176.1 semgrep ci --baseline-commit ${{ github.event.pull_request.base.sha }} --config .semgrep/rules --config p/owasp-top-ten --config p/security-audit --config p/secrets --config p/nodejs --config p/expressjs --config p/sql-injection --config p/command-injection --config p/react --config p/xss --exclude node_modules --exclude dist --exclude build --exclude coverage --exclude .env --exclude '*.min.js' --exclude prisma/generated --exclude e2e --severity ERROR --fail-on error`.
  - NOTA tecnica (FIX-1, @planner): `--exclude prisma/generated` usa forma simple (sin glob `**`). Semgrep `--exclude` soporta paths de directorios directamente; el glob `prisma/generated/**` de `.semgrepignore` se traduce a `--exclude prisma/generated` para evitar problemas de formato. Los 8 excludes en linea paridad exacta con `.semgrepignore` excluyendo `*.test.*`/`*.spec.*` (patrones glob que no son pasables via `--exclude`; gestionados por Semgrep internamente en diff-mode).
  - NOTA custom rules (AMENDMENT): `--config .semgrep/rules` se resuelve DESPUES del checkout, relativo al workspace. El directorio `.semgrep/rules/` esta versionado en el repo y contiene reglas custom YAML. Semgrep carga estas reglas ANTES de los packs `p/...` -- si una regla custom cubre el mismo CWE que un pack, la regla custom tiene prioridad por resolucion de Semgrep (regla local > pack remoto).
- [ ] 1.3 Run `actionlint` on the modified `ci.yml` to validate YAML syntax and GitHub Actions expression syntax.

### 1.4 Custom Rules -- Create `.semgrep/rules/` directory

- [ ] 1.4.1 Create `.semgrep/rules/` directory at the repo root (sibling to `.semgrep/`). This directory holds custom Semgrep YAML rules versioned in the repo. The CI job loads them via `--config .semgrep/rules` (task 1.2). Format: standard Semgrep rule YAML files.
- [ ] 1.4.2 Create rule file `.semgrep/rules/prototype-pollution.yml` targeting CWE-1321 (Prototype Pollution). Pattern: detect `Object.assign(userInput, ...)` or `obj[userInput] = value` where `userInput` is not validated. Severity: `ERROR`. Metadata: `cwe: ["CWE-1321"]`, `technology: ["javascript", "nodejs"]`, `confidence: MEDIUM`. NOTE: Semgrep CE taint analysis for inter-procedural Object.assign is limited — the first argument must originate from user input (req.body/req.query). Object.assign with a non-user-controlled first arg (e.g., hardcoded default, config object) will NOT match taint and may produce FPs if the pattern is too broad. Keep pattern narrow to first-arg taint only.
- [ ] 1.4.3 Create rule file `.semgrep/rules/ssrf.yml` targeting CWE-918 (Server-Side Request Forgery). Pattern: detect dynamic URL construction from user input passed to `fetch()`, `axios.get()`, `http.request()`. Severity: `ERROR`. Metadata: `cwe: ["CWE-918"]`, `technology: ["javascript", "nodejs", "express"]`, `confidence: HIGH`.
- [ ] 1.4.4 Create rule file `.semgrep/rules/unsafe-deserialization.yml` targeting CWE-502 (Deserialization of Untrusted Data). Pattern: detect `JSON.parse(userInput)` passed directly to dangerous sinks, or `eval()` on deserialized data. Severity: `ERROR`. Metadata: `cwe: ["CWE-502"]`, `technology: ["javascript", "nodejs"]`, `confidence: HIGH`.
- [ ] 1.4.5 Create rule file `.semgrep/rules/prisma-raw-sqli.yml` targeting CWE-89 (SQL Injection via Prisma raw). Pattern: detect `$queryRaw` / `$queryRawUnsafe` / `$executeRaw` / `$executeRawUnsafe` with interpolated user input (taint tracking from `req.body`, `req.query`, `req.params`). Severity: `ERROR`. Metadata: `cwe: ["CWE-89"]`, `technology: ["javascript", "nodejs", "prisma"]`, `confidence: HIGH`. MUST include >=1 true-negative fixture with safe Prisma.sql tagged template (parameterized query with validated input, NO string interpolation) — e.g., Prisma.sql`SELECT * FROM users WHERE id = ${validatedId}` — to distinguish parameterized (safe) from interpolated (unsafe).
- [ ] 1.4.6 Create rule file `.semgrep/rules/xss-dom-intermediate.yml` targeting CWE-79 (XSS via DOM manipulation). Pattern: detect `innerHTML`, `document.write`, `dangerouslySetInnerHTML` fed by user-controlled intermediate variables (e.g., value from `req.query` -> variable -> DOM sink). Severity: `ERROR`. Metadata: `cwe: ["CWE-79"]`, `technology: ["javascript", "react", "nodejs"]`, `confidence: MEDIUM`. NOTE: if taint precision is insufficient for intermediate variable tracking, mark as `confidence: LOW` and document limitation -- this rule may evolve. MUST include >=1 true-negative fixture demonstrating safe dangerouslySetInnerHTML={{ __html: constant }} (constant or DOMPurify-sanitized value, NO user-controlled intermediate) to validate taint precision and avoid FPs on safe React patterns.

### 1.5 Custom Rules -- Test fixtures

- [ ] 1.5.1 For each rule file in 1.4.2-1.4.6, create a test fixture pair: `<rule-name>.test.js` (vulnerable code) and `<rule-name>.test.fixed.js` (safe remediation). Place in `.semgrep/rules/tests/` directory. Format follows Semgrep official docs: "Testing rules" -- each fixture is a standalone JS file that triggers (or avoids) the rule pattern.
- [ ] 1.5.2 Fixture coverage minimum: each rule MUST have >=1 true-positive fixture (should trigger the rule) and >=1 true-negative fixture (should NOT trigger). If a rule has multiple patterns (e.g., prototype pollution via `Object.assign` vs bracket notation), create separate fixtures per pattern.
- [ ] 1.5.3 All fixtures MUST use non-sensitive, synthetic data (no real API keys, no real DB URLs, no real passwords). Use `FAKE_` prefix or clearly dummy values.

### 1.6 Custom Rules -- Validation

- [ ] 1.6.1 Validate all custom rules: `docker run --rm -v $PWD:/src semgrep/semgrep:1.176.1 semgrep --validate --config .semgrep/rules/` -- must exit 0 (all rules parse correctly).
- [ ] 1.6.2 Run test fixtures: `docker run --rm -v $PWD:/src semgrep/semgrep:1.176.1 semgrep --test .semgrep/rules/` -- all fixtures must pass (0 failures). If any fixture fails, fix the rule or fixture and re-run until 0 failures.
- [ ] 1.6.3 Document known limitations: any rule with `confidence: MEDIUM` or `confidence: LOW` (e.g., xss-dom-intermediate due to intermediate variable tracking limits) MUST have a comment in the rule file explaining the limitation and why it is accepted. No rule with false positives known to be unresolved may be merged -- document suppressions as `nosemgrep` comments in the fixture test files.

## 2. Documentation Updates

- [ ] 2.1 Update `docs/CONTEXT-CICD.md` SS3.3 table: add `sast` row with `name: SAST (Semgrep)`, `Required?`: `F2 ruleset`, `continue-on-error?`: `F1`. Anadir columna `continue-on-error?` a la tabla completa (celdas vacias/- para jobs existentes, y N/A para los que no aplican).
- [ ] 2.2 Add SS9.3.9 sub-section "SAST (Semgrep)" in `docs/CONTEXT-CICD.md` documenting: job behavior, inline packs (no local config), custom rules layer (`.semgrep/rules/` loaded via `--config .semgrep/rules` BEFORE packs, 5 initial rules targeting CWE-1321/918/502/89/79, with test fixtures), diff-scoping, severity filter, phased rollout, Docker pinning, no SARIF, no CI_MINIMAL gate. CAVEAT (Regla 8): el nombre del job (`SAST (Semgrep)`) DEBE coincidir EXACTO con el nombre del status check en el ruleset para que el binding F2 funcione -- renombrar rompe silenciosamente el binding.
- [ ] 2.3 Update `docs/CONTEXT-CICD.md` SS3.1 note: mention SAST runs regardless of `CI_MINIMAL` (not gated by it -- standalone governance gate).
- [ ] 2.4 Update `docs/ci-cd-pipeline-empresarial.md` SS23.3/SS23.4: change status from "pendiente" to "implementado (F1 non-blocking)" with reference to change `ci-sast-governance`.

## 3. Ruleset Binding -- F2 (manual admin step, documented NOT executed)

- [ ] 3.1 Document manual step: after 1+ successful F1 run (job exits 0 on a real PR), apply ruleset PATCH to add "SAST (Semgrep)" as required status check in ruleset 21227644. Name MUST match exactly: `SAST (Semgrep)`. (Regla 7: 1+ successful run before binding. Regla 8: name must be EXACTO.)
- [ ] 3.2 Document manual step: remove `continue-on-error: true` from the `sast` job in `ci.yml` to make it blocking.

## 4. Verification

- [ ] 4.1 Verify `sast` job appears in `ci.yml` at the correct position (after `dependency-review`, before `ci-complete`).
- [ ] 4.2 Verify job has correct `name: "SAST (Semgrep)"`, `permissions: contents: read`, `if: github.event_name == 'pull_request'`, `continue-on-error: true`, `timeout-minutes: 15`.
- [ ] 4.3 Verify `sast` is NOT in `ci-complete.needs` array.
- [ ] 4.4 Verify inline packs match the design spec (9 packs: owasp-top-ten, security-audit, secrets, nodejs, expressjs, sql-injection, command-injection, react, xss).
- [ ] 4.5 Verify `--config .semgrep/rules` appears BEFORE the inline packs in the docker run command (task 1.2).
- [ ] 4.6 Verify excludes match .semgrepignore parity (FIX-1): node_modules, dist, build, coverage, env, min.js, prisma/generated, e2e.
- [ ] 4.7 Verify Docker tag is `1.176.1` (latest stable, verified via Docker Hub API 2026-09-04).
- [ ] 4.8 Verify `.semgrep/rules/` directory contains 5 rule files (prototype-pollution, ssrf, unsafe-deserialization, prisma-raw-sqli, xss-dom-intermediate).
- [ ] 4.9 Verify `.semgrep/rules/tests/` directory contains fixture pairs for all 5 rules.
- [ ] 4.10 Verify `semgrep --validate --config .semgrep/rules/` exits 0.
- [ ] 4.11 Verify `semgrep --test .semgrep/rules/` exits 0 (all fixtures pass).
