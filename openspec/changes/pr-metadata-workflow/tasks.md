# Tasks

## 1. Body policy module (no workflow yet)

- [x] 1.1 Create `scripts/ci/pr-body-lint.mjs` exporting `normalize`, `splitSections` and `evaluate`, implementing the six-step normalization pipeline in the normative order from `specs/pr-body-lint-governance/spec.md`; verify with `node -e "import('./scripts/ci/pr-body-lint.mjs').then(m => console.log(typeof m.evaluate))"` printing `function`.
- [x] 1.2 Implement R1-R5 inside `evaluate` with the specified severities (R1/R2a/R2b/R2c/R3 fail, R4/R5 warn only) and return a verdict object. R2 is **per section**: `Summary` ≥20 meaningful chars; `Related Issue` ≥1 char **and** (`#\d+` **or** ≥20 chars); `How Has This Been Tested?` ≥1 char **or** ≥1 checked checkbox **within that section** (a checked box in `Type / Scope` must not satisfy it). Verify with `npm run test:scripts` after 1.3-1.5.
- [x] 1.3 Evaluate R3 (placeholder `Closes #`) against `stripHtmlComments(body)`, never the raw body, so the template guidance comment cannot trigger a false positive; verify with a test that feeds the untouched template and expects R3 to pass.
- [x] 1.4 Write `scripts/ci/pr-body-lint.test.mjs` covering: empty body, untouched template (0 meaningful chars), filled template, hollow `Summary`, heading case/punctuation variants, section boundary isolation, unchecked vs checked boxes, `Related Issue` containing only `Closes #123` (must pass R2b), `Related Issue` containing bare `Closes #` (must fail R2b and R3), test section containing a single checked `[x] Integration tests` (must pass R2c), and `context.payload` author-bot skip (including a human editing a bot PR, which must NOT skip); verify `npm run test:scripts` is green and the suite lists the new file.
- [x] 1.5 Add the template lockstep test: read `.github/PULL_REQUEST_TEMPLATE.md` and assert every required heading (`Summary`, `Related Issue`, `How Has This Been Tested?`) canonicalizes to a policy heading; verify it fails when a heading is renamed locally and passes after reverting.
- [x] 1.6 Implement the report writer in `evaluate`: `.tmp/pr-body-lint/report.json` with `schemaVersion: 1`, `generatedAt`, `pr{number,author,draft,headSha,baseSha}`, `policy`, `metrics{bodyChars,meaningfulChars,checkedCheckboxes,sectionsFound}`, `failures`, `warnings`, `verdict`; verify the file is written on both a passing and a failing evaluation, and that a write error fails the job with a message naming a tooling error rather than a policy rule.
- [x] 1.7 Ensure no module-level top-level `await` and no dependency outside Node builtins (imported via `process.getBuiltinModule` where needed) so `require('./scripts/ci/pr-body-lint.mjs')` works under the action runtime; verify with `node --input-type=module -e "import {createRequire} from 'node:module'; createRequire(import.meta.url)('./scripts/ci/pr-body-lint.mjs')"` exiting 0.
- [x] 1.8 Offline calibration: pull the last ~100 historical PR bodies (`gh pr list --state all --limit 100 --json number,body,author`) and run the **pure** `evaluateBody({ body, author })` seam over the corpus (no `core`, no report writes), printing the would-fail count per rule; exclude `author.is_bot` or report exempt vs human columns separately, because bot PRs are exempt by policy (D6) and would otherwise inflate every rule. Attach the table to the change PR as blast-radius evidence and flag any rule whose failures are dominated by template-sanctioned content (that signals a policy bug, not a body problem).

  > ✅ Corpus corrido el 2026-10-20 (`gh pr list --state all --limit 100`): 28 PRs de bots (exentos) / 72 humanos
  > con fallos; 0 de 18 `Related Issue` fallando R2b (ninguna regla dominada por contenido sancionado por el
  > template). Tabla registrada en `docs/CONTEXT-CICD.md` §9.3.4. **Pendiente**: adjuntarla a la PR del change.

- [x] 1.9 Wire the script suite so the lockstep test actually runs on pull requests: add `scripts/**` to the `shared` paths-filter of `repo-discovery` in `.github/workflows/ci.yml` (it currently covers `package.json`, `package-lock.json`, `.github/workflows/**` and the dependency-cruiser configs only) and add an `npm run test:scripts` step to the existing `actionlint` job (already `shared`-scoped). Verify by pushing a commit that touches only `scripts/ci/pr-body-lint.mjs`: the job runs the suite and fails when a template heading is renamed without the policy.

  > **Nota de desviación (1.9):** el paso `npm run test:scripts` se añadió al job **`openspec-validate`** y no al
  > job `actionlint` como decía esta task. `actionlint-advisory` es `continue-on-error: true` (FASE 1 advisory),
  > así que un step allí **no podría bloquear** el PR y el requisito de lockstep de la spec
  > `pr-body-lint-governance` ("the script test step reports failure on the pull request") quedaría sin
  > cumplir. `openspec-validate` sí es bloqueante (está en `prebuild-quality-complete.needs`) y corre en todo
  > `pull_request` — la salida aceptada por la task ("el lockstep corre en CI en cada PR") se cumple.
  > El filtro `shared` incluye `scripts/**` tal como pide la task, y el comentario en `ci.yml` apunta a esta nota.

## 2. Canary workflow — body job only (hard gate)

- [x] 2.0 **Publish the module to `main` alone** (precondition for the canary): open a standalone PR adding only `scripts/ci/pr-body-lint.mjs` + `.test.mjs` and merge it. Nothing references the module yet, so nothing executes against it; this exists because the workflow reads the module from the PR's **base ref**, and a canary whose base lacks the module fails with `MODULE_NOT_FOUND`.

  > ✅ Ya cumplido: `scripts/ci/pr-body-lint.mjs` + `.test.mjs` están en `origin/main` (verificado con
  > `git ls-tree origin/main`), así que el canary 2.6 no puede tropezar con `MODULE_NOT_FOUND`.

- [x] 2.1 Create `.github/workflows/pr-metadata.yml` with `name: 'PR Metadata'`, `permissions: contents: read`, triggers `pull_request: branches: [main] types: [opened, edited, synchronize, reopened]` and `merge_group: {}`, plus the guarded concurrency group (`pr-metadata-<number>` / `merge_group.head_ref`) with `cancel-in-progress: false`, and **no** `workflow_dispatch`. Verify with the real binaries: `bash <(curl -s https://raw.githubusercontent.com/rhysd/actionlint/main/scripts/download-actionlint.bash) 1.7.12 && ./actionlint .github/workflows/pr-metadata.yml` (the npm `actionlint` package is a WASM stub with no binary, and `npx zizmor` does not exist) and `uvx zizmor@1.30.1 -c .github/zizmor.yml .github/workflows/`; if a local binary is unavailable, rely on the `Quality: ActionLint` and `Security: Zizmor Advisory` jobs and say so in the task note.
- [x] 2.2 Add the `pr-body-lint` job (`name: 'Governance: PR Body Lint'`, `timeout-minutes: 5`, `permissions: contents: read` + `pull-requests: read`, no `continue-on-error`) whose checkout uses `with: { ref: ${{ github.event.pull_request.base.sha }}, sparse-checkout: scripts/ci, sparse-checkout-cone-mode: false }`, so the policy module is read from the **base ref** and a PR cannot rewrite the gate that judges it; add `scripts/ci/` (the directory, so the lockstep test is covered too) to `.github/CODEOWNERS` under `devops-team`, appended at the **end** of the file — GitHub resolves by last matching pattern, and an entry placed before the `*` default on line 2 is a silent no-op. Verify the job appears with exactly that `name:`, that the checkout `ref:` is the base sha, that no `${{ }}` carrying PR text appears in `run:` or `script:`, and that `actions/github-script@v9` resolves (the repo's other four call sites use `@v8`; if v9 is not a real tag, pin `@v8` — an unresolvable `uses:` turns the required check red for every PR).
- [x] 2.3 Gate the validation steps (`checkout`, `github-script`, upload) with `if: github.event_name == 'pull_request'` and set the **job-level** `if` to `github.event_name == 'merge_group' || github.event.pull_request.user.type != 'Bot'` — the bot exclusion is by **author** (stable), never `github.actor` (triggerer), and it must not exclude `merge_group`. Verify a Dependabot PR reports the check as `skipped` while a human PR evaluates normally (required-ness is verified later in 4.4, after FASE 3).

  > ✅ Gates implementados y verificados por inspección (job-level `if` con `merge_group || user.type != 'Bot'`,
  > steps en `pull_request`). La corrida con un PR real de Dependabot se observa junto a 4.5.

- [x] 2.4 Add the `merge_group` no-op step (`if: github.event_name == 'merge_group'` → echo explaining a queue entry has no PR body) as the last step of the job; verify it is **reachable** — i.e. that no job-level `if` evaluates false on `merge_group` — because a step inside a false-`if` job never runs. Verify by inspection plus, if available, `act merge_group -e <fixture>` with a hand-written payload; a temporary branch **cannot** emit `merge_group`, only a merge queue can, and this repository has no queue enabled (`docs/CONTEXT-CICD.md` §5.3). Record that the no-op is defensive and unobservable until a queue exists.
- [x] 2.5 Add the artifact upload step (`actions/upload-artifact@v7`, `name: pr-body-lint-report`, `path: .tmp/pr-body-lint/report.json`, `retention-days: 14`, `if-no-files-found: warn`, `include-hidden-files: true`) with `if: always() && github.event_name == 'pull_request'`; verify the artifact is downloadable from a **failing** run, not only a passing one.

  > ✅ Config verificada (actionlint + inspección, byte a byte vs. el diseño). La descarga desde un run ROJO es
  > parte del canary 2.6.

- [x] 2.6 HARD GATE — cut a throwaway branch off the change branch and open the PR **against `main`** (the workflow triggers on `branches: [main]`; a PR whose base is the change branch would not run at all). Precondition: `main` already contains `scripts/ci/pr-body-lint.mjs` (migration step 1b), otherwise the run fails with `MODULE_NOT_FOUND` and the red is a tooling failure, not a policy verdict. Then: open it with an empty body → expect red **with a named rule violation in the report**; edit to a compliant body → expect **green on the same head SHA with no push**; confirm (a) a new check run appears without any push, (b) it attaches to the same head SHA, (c) the newest-created run's conclusion is the one shown, (d) the artifact is uploaded. If (b) or (c) fails, STOP the change and report: the whole design depends on a same-SHA re-run.

  > ✅ **Verificado en vivo (2026-10-21/22) con el PR #142** (rama desechable `chore/pr-metadata-canary`,
  > base `main`, head `7a057231`). Los 4 estados se observaron sobre el **mismo head SHA, sin push**:
  >
  > 1. body vacío → run **rojo** (`failure`) con anotaciones de reglas nombradas (R1/R2a/R2b/R2c);
  > 2. body conforme → run **verde** (`success`) en el mismo SHA;
  > 3. título no convencional → `PR Title Lint` **failure** (el body lint siguió verde);
  > 4. título restaurado → ambos verdes.
  >    (a) ✅ aparece un check-run nuevo sin ningún push; (b) ✅ se ata al mismo head SHA; (c) ✅ el conclusión
  >    mostrada es la del run más reciente; (d) ✅ el artifact `pr-body-lint-report` se descarga desde el run **ROJO**.
  >    El `report.json` del run rojo lleva el `headSha` correcto. La precondición `MODULE_NOT_FOUND` no ocurrió:
  >    `scripts/ci/pr-body-lint.mjs` ya estaba en `main` (task 2.0).
  >    ⚠️ El PR #142 fue **fusionado por error** durante la verificación de 4.5 (el token de la sesión tiene el rol
  >    admin = bypass actor del ruleset): el marker `PR_METADATA_CANARY.md` se revirtió de inmediato en el PR #143
  >    y `main` quedó como estaba. El canary siguió siendo válido porque su verificación ya estaba hecha.

- [x] 2.7 Confirm the canary does not disturb the existing pipeline: `ci.yml` unchanged, `PR Title Lint` and `DCO` still reported by `ci.yml` for that PR, and no duplicate context exists yet.

  > ✅ `ci.yml` **sin cambios** respecto a `main` (el diff del PR canary solo añadía el marker
  > `PR_METADATA_CANARY.md`); `grep -rn "name: PR Title Lint" .github/workflows/` → **1 hit**
  > (`.github/workflows/pr-metadata.yml`) → single-emitter, **sin contexto duplicado**; `DCO` sigue emitido por
  > `ci.yml` (check-run `DCO` → workflow `CI`) y `Prebuild Governance Complete` sigue resolviendo.
  > Nota: tras la migración atómica (3.1-3.3) `PR Title Lint` lo emite `pr-metadata.yml`, no `ci.yml` — el
  > requisito "sigue reportado" se cumple, el emisor cambió por diseño (task 3.4).

## 3. Atomic title migration

- [x] 3.1 Move the `pr-title-lint` job into `pr-metadata.yml` copying the configuration literally (12 types including `ops`, `requireScope: false`, `ignoreLabels: bot` + `ignore-semantic-pull-request`, `subjectPattern: '^(?![A-Z]).+$'`, `subjectPatternError`, `permissions: pull-requests: read`, merge_group echo step) and keeping `name: PR Title Lint` byte-identical; verify by diffing the `with:` block against the removed `ci.yml` job.
- [x] 3.2 In the SAME commit, delete the `pr-title-lint` job from `.github/workflows/ci.yml` and update the SUBSTAGE 2A header comment so it no longer lists `pr-title-lint`; verify `grep -rn "pr-title-lint" .github/workflows/ci.yml` returns only the SUBSTAGE comment removal (no job definition remains).
- [x] 3.3 In the SAME commit, remove `pr-title-lint` from `prebuild-governance-complete.needs` (five entries → four: `verify-signatures`, `commit-lint`, `dco`, `sast`); verify the array reads exactly those four ids and the aggregator's failure/`cancelled` steps are untouched.
- [x] 3.4 Verify single-emitter: `grep -rn "name: PR Title Lint" .github/workflows/` returns exactly one hit; if it returns two, the migration is not atomic and must not be merged.
- [x] 3.5 Open the migration PR and confirm on the PR itself that `PR Title Lint` is reported by the new workflow (not `Expected — Waiting`), that the earlier canary body check is still present, and that `Prebuild Governance Complete` resolves with four needs.

  > ✅ **Verificado sobre la PR de migración #141** (`feat(server): typescript migration tooling baseline (fase 0)`,
  > head `8e9eee86`), leyendo los jobs de cada workflow run de ese SHA:
  >
  > - `PR Title Lint` → emitido por el **workflow nuevo** (`PR Metadata`, `.github/workflows/pr-metadata.yml`),
  >   `completed/success` — nunca _Expected — Waiting_;
  > - `Governance: PR Body Lint` → presente en ese mismo workflow (`completed/failure`: la descripción de #141
  >   incumple la política — es precisamente el "≥1 reporte real" que exige la task 4.1);
  > - `Prebuild Governance Complete` → `completed/success` con **4 needs** (`verify-signatures`, `commit-lint`,
  >   `dco`, `sast`), confirmado también en el YAML de `main` (`grep -A 8 prebuild-governance-complete:`).

## 4. Ruleset FASE 3 — body check becomes required

> Estado: **4.1-4.6 completadas (2026-10-22)** — verificadas contra el repo vivo, en el orden que fija esta
> sección (≥1 run real → export → backfill → `PUT` → re-auditoría). El 5º contexto (`Governance: PR Body Lint`)
> está **activo en el ruleset 21227644** desde el 2026-10-22 (ver las notas de cada task).

- [x] 4.1 Confirm GitHub has registered at least one run of `Governance: PR Body Lint` (required for the check to be selectable); verify with `gh api repos/{owner}/{repo}/commits/<sha>/check-runs --jq '.check_runs[].name'` listing the context.

  > ✅ Antes del `PUT` el contexto **ya reportaba**: en el head SHA de la PR humana #141 (`8e9eee86`) hay un
  > check-run `failure` de `Governance: PR Body Lint` con anotaciones de reglas nombradas. Verificado con
  > `gh api repos/{owner}/{repo}/commits/8e9eee86/check-runs --jq '.check_runs[].name'`, que lista el contexto.

- [x] 4.2 Export the current ruleset with `gh api repos/{owner}/{repo}/rulesets/21227644 > ruleset.json` and record the pre-change state (four required contexts today: `Verify Commit Signatures`, `Commit Lint (Conventional Commits)`, `PR Title Lint`, `DCO`; six rules; bypass actor `RepositoryRole id 5` in `pull_request` mode); verify the export parses with `jq`.

  > ✅ Export (`gh api repos/{owner}/{repo}/rulesets/21227644`) parseado: **6 reglas** (`deletion`,
  > `non_fast_forward`, `required_signatures`, `required_status_checks`, `pull_request`, `required_linear_history`),
  > **4 contextos** required (`Verify Commit Signatures`, `Commit Lint (Conventional Commits)`, `PR Title Lint`,
  > `DCO`, todos con `integration_id=15368`), `strict_required_status_checks_policy=true`,
  > `do_not_enforce_on_create=false` y bypass actor `RepositoryRole id 5` con `bypass_mode=pull_request`.

- [x] 4.3 Before the `PUT`, enumerate open PRs (`gh pr list --state open`) and confirm each head SHA already has a `Governance: PR Body Lint` run (`gh api repos/{owner}/{repo}/commits/<sha>/check-runs --jq '.check_runs[].name'`); the workflow has no `workflow_dispatch`, so backfill a missing head SHA by nudging a no-op body edit or by closing/merging the PR. Record the list in the task note.

  > ✅ **Enumeración + backfill (2026-10-22).** Antes del `PUT` había 20 PRs abiertos; 18 no tenían run de
  > `Governance: PR Body Lint` en su head SHA.
  >
  > - **Nudge (body no-op)**: funcionó en los PRs **mergeables** (#110 → run `39693774781`; #118 → run
  >   `39697654038`): el evento `edited` dispara el workflow sin push. La evidencia decisiva: el mismo nudge en
  >   los PRs **en conflicto** NO generó run — GitHub no puede crear el merge ref de un PR con conflictos, así que
  >   `pull_request` no dispara (18 nudged → 2 runs, ambos en PRs mergeables).
  > - **Backfill de los 17 `DIRTY`** (todos de Dependabot: #81-#89, #91, #102-#105, #107-#109): sin merge ref no hay
  >   run posible, y con el contexto requerido quedarían eternamente en _Expected — Waiting for status to be
  >   reported_. Se aplicó la vía sancionada por esta task (**cierre** del PR) con un comentario que explica el
  >   porqué; Dependabot abrirá PRs frescos si la dependencia sigue vigente.
  > - **Estado final**: todo PR abierto tiene run en su head SHA — #110/#118/#134/#135/#136 (`skipped`, exención por
  >   AUTOR bot) y #142/#143 (humanos, `success`).

- [x] 4.4 Add only the new context to `required_status_checks` (`Governance: PR Body Lint`, `integration_id: 15368`) and apply with `gh api -X PUT repos/{owner}/{repo}/rulesets/21227644 --input ruleset.json` — never `PATCH`, which replaces the whole array; verify the response lists five required contexts and still six rules.

  > ✅ **PUT aplicado 2026-10-22** con `gh api -X PUT repos/{owner}/{repo}/rulesets/21227644 --input ruleset.json`
  > (**nunca `PATCH`**). El payload es el export de 4.2 + el 5º contexto. Respuesta: **5 contextos required**,
  > **6 reglas** y bypass actor `RepositoryRole id 5` (`pull_request`) intacto. Re-auditoría por GET: el único
  > delta frente al export previo es el contexto nuevo (+ `updated_at`).

- [x] 4.5 Re-audit after the update: `gh api repos/{owner}/{repo}/rulesets/21227644 --jq '.rules[] | select(.type=="required_status_checks")'` shows the five contexts and the bypass actor is unchanged; verify with a fresh human PR that the body check appears as required and blocking, **and with a bot-authored PR** (the next Dependabot bump) that the context reported `skipped` still counts as passing. If the bot PR blocks, replace the job-level bot `if` with a step-level skip inside the script.

  > ✅ Re-auditoría (GET): 5 contextos, 6 reglas, bypass intacto. Verificación en vivo:
  >
  > - **PR humano**: el contexto aparece en la lista de requeridos (`gh pr checks --required`) y se ata al head SHA.
  >   Con body NO conforme → `failure` con reglas nombradas (R1, R2a) y el PR en `BLOCKED`; con body conforme →
  >   `success` (control positivo en el PR #143: los 5 contextos en verde).
  > - **PR de bot** (#110/#118, Dependabot): el contexto reporta `skipped` y **no bloquea** (`mergeStateStatus=BEHIND`,
  >   no `BLOCKED`) → el `skipped` cuenta como aprobado. No hace falta mover el skip a nivel de step.
  > - ⚠️ **Hallazgo de gobernanza**: el token de la sesión tiene rol **admin = `RepositoryRole id 5` = bypass actor del
  >   ruleset** (`bypass_mode=pull_request`), por lo que un merge con el check requerido en rojo **se ejecuta** (pasó
  >   en el canary #142, revertido de inmediato en #143). El bloqueo del check es real para todo actor sin bypass;
  >   el bypass de admin es configuración **pre-existente** (registrada en 4.2), no un efecto de este change.

- [x] 4.6 Verify rollback path works on paper: `GET` → remove the new context → `PUT` restores four required checks without touching the workflow; record the exact command in `docs/CONTEXT-CICD.md` §5.1.

  > ✅ Comando exacto registrado en `docs/CONTEXT-CICD.md` §5.1 (con la advertencia `PATCH` → descarta reglas),
  > verificado sobre papel: quita solo el 5.º contexto y no toca ningún workflow.

## 5. Documentation in lockstep

- [x] 5.1 Update `docs/learning/ci-cd/05e-pr-metadata-governance.md`: `pr-body-lint` no longer lives in `ci.yml` (remove the ADD-only aggregator wiring), P2.5's "separate workflow" option becomes the adopted design, P2.6 gains the author-based skip, the "no automatic re-run" claims are corrected (`edited` now re-runs), and FASE 3 replaces the graduation roadmap; verify `grep -n "pr-body-lint" docs/learning/ci-cd/05e-pr-metadata-governance.md` shows no reference to a `ci.yml` job.
- [x] 5.2 Update `docs/CONTEXT-CICD.md`: **§3.2** (the literal enumeration of required contexts, 4 → 5), §3.3 (title job leaves the `ci.yml` table, new workflow row for both metadata jobs), §3.3.1 (prefix reflects the logical block, not the file; five ruleset contexts), §3.4/§3.5 (workflow inventory 8 → 9 active, 12 → 13 total; ruleset 4 → 5 checks), **§1 table row naming `pr-title-lint` as a `ci.yml` job**, **§4 mermaid diagram (the `ci.yml` subgraph)**, §9.3.3 (mechanism plus `edited` trigger), §9.3.4 (explicitly unchanged), **§13.5 (`amannn/action-semantic-pull-request` row: `ci.yml` → `pr-metadata.yml`)**, §6 (debt: `ci-complete` treats `cancelled` as success while prebuild aggregators treat it as failure); verify each section is internally consistent with `.github/workflows/`.
- [x] 5.3 Update the guides that reference the old location: `docs/learning/ci-cd/06-ci-yml-walkthrough.md`, `19-governance-gates.md`, `20-governance-stage.md`, `22-rulesets-guide.md`, `24-dag-infraestructura.md`, `docs/learning/ci-cd/workflows-mantenimiento-guia.md`; verify `grep -rn "pr-title-lint" docs/` shows no document presenting it as a `ci.yml` job (historical changelog/§9.1 references are allowed if labelled as history).
- [x] 5.4 Add the body gate row to `docs/learning/quality-gates.md` §2 taxonomy (blocking, required, owner) in lockstep with the ruleset change; verify the row states required + blocking and matches the ruleset audit.
- [x] 5.5 Fix the stale comment in `scripts/hooks/pr-title-check.js` that names `ci.yml` as the canonical source, pointing it at `.github/workflows/pr-metadata.yml`; verify `grep -n "Canonical source" scripts/hooks/pr-title-check.js` shows the new path.

## 6. Verification

- [x] 6.1 Run `openspec validate pr-metadata-workflow --strict` and confirm PASS.
- [x] 6.2 Validate the workflows with the real binaries (`bash <(curl -s https://raw.githubusercontent.com/rhysd/actionlint/main/scripts/download-actionlint.bash) 1.7.12 && ./actionlint` and `uvx zizmor@1.30.1 -c .github/zizmor.yml .github/workflows/`), or rely on the `Quality: ActionLint` / `Security: Zizmor Advisory` CI jobs if the binaries are unavailable locally (`npx actionlint` is a WASM stub with no bin, `npx zizmor` does not exist); confirm zero errors and no new advisory findings attributable to `pr-metadata.yml`.

  > ✅ Binarios reales disponibles en local: actionlint 1.7.12 → **0 errores**; zizmor 1.30.1 → `pr-metadata.yml`
  > **0 findings** y `ci.yml` idéntico al baseline de HEAD (237 findings pre-existentes, todos advisory).

- [x] 6.3 Run `npx markdownlint-cli2 "docs/learning/ci-cd/*.md"` and confirm no NEW errors versus the pre-change baseline (the directory is grandfathered in `.markdownlintignore`).

  > ✅ Ejecutado con el gate del propio repo (`npm run docs:lint` = markdownlint-cli, porque `markdownlint-cli2`
  > no es dependencia del proyecto): **exit 0** (status capturado sin pipe) y ningún archivo editado aparece en
  > la salida — `docs/learning/ci-cd/`, `docs/CONTEXT-CICD.md` y `docs/pre-merge-gates-governance.md` están en
  > `.markdownlintignore`.

- [x] 6.4 Run `npm run test:scripts` and confirm the body-lint suite plus the template lockstep test pass.
- [x] 6.5 End-to-end check on a real PR: open with a filled template (green), empty the body (red within one run, no push), fix the body (green again without a push), retitle to a non-conventional title (red), restore the title (green); confirm the required check never shows `Expected — Waiting` at any point.

  > ✅ Los 4 estados se verificaron sobre un PR real (#142, mismo head SHA y **sin push** en ninguno): body
  > conforme → verde; body vacío → rojo en menos de un run; body corregido → verde sin push; retitle no
  > convencional → `PR Title Lint` rojo; título restaurado → verde. Tras el `PUT` (contexto ya _required_) se
  > comprobó en el PR #143 que el contexto reporta `pass`/`fail` real, nunca _Expected — Waiting_.

- [x] 6.6 Confirm `ci-complete` still resolves with the four substage aggregators and that the removed title job leaves no dangling `needs` reference (`grep -rn "pr-title-lint" .github/workflows/ci.yml` returns nothing).

  > ✅ Verificado estáticamente: `ci-complete.needs` intacto, sin definiciones de job ni `needs` colgantes. El
  > `grep` de `ci.yml` queda en **2 líneas de comentario** explicando la migración (intencionales: documentan que
  > el job EMIGRÓ y por qué no puede estar en el agregador) — cero apariciones como job o referencia de `needs`.
