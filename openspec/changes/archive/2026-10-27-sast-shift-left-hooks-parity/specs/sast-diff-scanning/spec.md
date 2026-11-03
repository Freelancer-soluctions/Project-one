# Spec Delta

## Purpose

Diff-scoped SAST shared by the local `pre-push` hook and the CI `sast` job through a single Node script, so both
agree on Semgrep version, rule set, diff base, severity filter and exclusions while keeping deliberately different
failure policies (fail-open locally, fail-closed in CI).

## ADDED Requirements

### Requirement: Single shared diff-scoped SAST entry point

`scripts/sast-diff.mjs` SHALL be the only implementation that runs Semgrep for the interactive local gate and for
the CI governance gate. The `pre-push` hook and the `sast` job in `.github/workflows/ci.yml` SHALL both invoke
that file and SHALL NOT embed Semgrep command lines of their own.

#### Scenario: Pre-push invokes the shared script

- **WHEN** a developer pushes commits that touch JavaScript or TypeScript files
- **THEN** `.husky/pre-push` runs `node scripts/sast-diff.mjs` in local mode
- **AND** the hook contains no `docker run` and no `semgrep` invocation of its own

#### Scenario: CI job invokes the shared script

- **WHEN** the `sast` job runs on a pull request
- **THEN** its scan step runs `SAST_MODE=ci node scripts/sast-diff.mjs`
- **AND** the job no longer carries an inline `docker run ... semgrep ...` command

### Requirement: Local and CI execution modes

The script SHALL support exactly two modes selected by the `SAST_MODE` environment variable, `local` and `ci`. Both
modes SHALL build the same Semgrep command — same pinned version, same rule set (custom rules plus packs), same
severity filter, same exclusions, and the same `--baseline-commit` flag — and SHALL differ in these respects:

1. **Failure policy:** fail-open in `local` (a broken tool warns and lets the push through) versus fail-closed in
   `ci` (a broken tool fails the job).
2. **Baseline source:** `local` SHALL pass `--baseline-commit` with the merge base of `origin/main` and `HEAD`
   (`git merge-base origin/main HEAD`); `ci` SHALL pass it with the pull-request base commit
   (`github.event.pull_request.base.sha`). The flag is passed in **both** modes; only its value differs, because the
   two sides compare genuinely different diffs.
3. **Local-only skips:** the dirty-working-tree skip and the language-scope skip apply only in `local` mode: CI
   always has a clean checkout and always has a diff worth analysing, so neither skip is applied in `ci`.
4. **Timeout constant:** `local` uses `LOCAL_TIMEOUT_MS` (a 300 s safety net, not the under-60-second objective)
   while `ci` uses `CI_TIMEOUT_MS` (13 minutes); `SAST_TIMEOUT_MS` overrides both (used by the tests).
5. **Scan report:** the machine-readable report `.tmp/sast-report.json` (the artifact input) is written only in
   `ci` mode; `local` mode writes no report.

#### Scenario: Mode defaults to local

- **WHEN** the script runs without `SAST_MODE` defined
- **THEN** it behaves as `local` mode
- **AND** it applies the fail-open failure policy

#### Scenario: CI mode selected explicitly

- **WHEN** the script runs with `SAST_MODE=ci`
- **THEN** it applies the fail-closed failure policy
- **AND** the scan configuration (version, rules, severity filter, exclusions) is unchanged
- **AND** the baseline is the pull-request base commit, not `origin/main`

#### Scenario: CI mode does not apply the local-only skips

- **WHEN** the script runs with `SAST_MODE=ci`
- **THEN** neither the dirty-working-tree skip nor the language-scope skip is applied
- **AND** a diff with no JavaScript or TypeScript file still runs the scan, so the enforcement path has no silent skip

#### Scenario: The local default is not silently applied inside CI

- **WHEN** the script runs in a GitHub Actions environment with `SAST_MODE` unset
- **THEN** it refuses to fall back to the `local` default and exits with a message requiring `SAST_MODE` to be set
- **AND** it does not exit successfully as if a scan had been performed

### Requirement: Single pinned Semgrep version

The Semgrep version SHALL be pinned and defined exactly once in the repository, inside the shared script, and
SHALL be used by the `pre-push` hook, the CI `sast` job and the full-scan script. A floating tag (`latest`) SHALL
NOT be used for any scan.

#### Scenario: One source of truth for the version

- **WHEN** the Semgrep version is searched across the repository
- **THEN** it appears once as a constant in `scripts/sast-diff.mjs`
- **AND** no hook, workflow or script references `semgrep/semgrep:latest`

#### Scenario: Local and CI scan the same version

- **WHEN** the hook and the CI job resolve the image tag
- **THEN** both resolve to the same pinned version, so the same rules produce the same findings

### Requirement: Single rule-set source for hook and CI

Hook and CI SHALL NOT maintain separate rule lists. The pack list SHALL be defined once in the shared script and
used verbatim by both modes. Custom rules versioned in `.semgrep/rules/` SHALL be loaded by the script in both
modes, before the registry packs.

#### Scenario: Same packs on both sides

- **WHEN** the effective Semgrep command of the hook and of the CI job are compared
- **THEN** the `--config` flags are identical because both are built by the same script

#### Scenario: Local custom rules loaded by the script

- **WHEN** the script runs in either mode
- **THEN** `--config .semgrep/rules` is passed before the registry packs, preserving local-rule priority
- **AND** an absent or empty `.semgrep/rules/` directory does not fail the scan

### Requirement: Deliberate exception for the on-demand full scan

`scripts/security/semgrep.ps1` (invoked through `npm run sast:semgrep:full`) SHALL be preserved as a deliberate,
documented exception to the single-rule-source rule: it keeps its individual `r/...` rule list for on-demand
full-repository scans. That file SHALL be deduplicated (no repeated `--config`) and SHALL pin its image tag to the
same version as the shared script. Hook and CI SHALL NOT use that rule list.

#### Scenario: Full scan stays available and deduplicated

- **WHEN** `npm run sast:semgrep:full` is executed
- **THEN** it scans the repository with the individual `r/...` rules and no repeated `--config` entry
- **AND** it uses the pinned Semgrep version instead of `latest`

#### Scenario: The exception is documented, not implicit

- **WHEN** a reader looks for the SAST rule policy
- **THEN** the documentation states that hook and CI use the packs defined in the shared script
- **AND** it states that the on-demand full scan is the documented exception and why

### Requirement: Semgrep invocation flags and exclusions

The script SHALL invoke Semgrep with `--severity ERROR --error --metrics off` and SHALL pass the inline
exclusions `node_modules`, `dist`, `build`, `coverage`, `.env`, `*.min.js`, `prisma/generated` and `e2e`. That
list SHALL live in the script as a single source.

#### Scenario: Effective command matches the contract

- **WHEN** the command built by the script is inspected
- **THEN** it contains `--severity ERROR --error --metrics off`
- **AND** it contains exactly the eight documented exclusions

#### Scenario: Metrics stay disabled

- **WHEN** the scan runs
- **THEN** no metrics are shipped to the Semgrep registry

### Requirement: Diff-scoped scan against a baseline commit

The script SHALL scan only what the change introduces, using `--baseline-commit`. In local mode the baseline SHALL
be `origin/main`; in CI mode it SHALL be the pull-request base commit. Findings that already exist in the baseline
SHALL NOT be reported as new findings.

#### Scenario: New ERROR finding blocks

- **WHEN** the diff introduces a finding of severity `ERROR`
- **THEN** the script exits with the blocking code and the caller blocks (the push in local mode, the job in CI mode)

#### Scenario: Pre-existing finding does not block

- **WHEN** a file touched by the change already contained an `ERROR` finding in the baseline
- **THEN** the scan does not report it as a new finding
- **AND** the caller is not blocked because of it

#### Scenario: main advanced since the branch was opened, or the fetch is shallow

- **WHEN** the local `origin/main` moved forward after the branch was created, or the shallow fetch did not bring the
  exact base commit
- **THEN** the local baseline is `git merge-base origin/main HEAD`, so findings introduced by third parties on `main`
  are not attributed to this change
- **AND** the admitted divergence from the CI baseline (the pull-request base commit) is stated rather than presented
  as an identical comparison

### Requirement: Language-scoped skip in local mode

In local mode, when the pushed diff touches none of `.js .jsx .cjs .mjs .ts .tsx`, the script SHALL exit
successfully without invoking Semgrep.

#### Scenario: Markdown-only push skips the scan

- **WHEN** a push only changes `.md` files
- **THEN** no Semgrep process and no container are started
- **AND** the hook prints that the scan was skipped and why

### Requirement: Dirty working tree skips the scan with a visible warning

In local mode, when the working tree contains uncommitted changes, the script SHALL skip the scan, print a visible
warning naming the reason, and exit successfully. The CI gate remains responsible for evaluating the same diff.

#### Scenario: Uncommitted changes present

- **WHEN** the developer pushes with a dirty working tree
- **THEN** the push is not blocked by SAST
- **AND** a warning identifies the skipped scan and its reason

### Requirement: Only ERROR findings block

The blocking decision SHALL consider only findings of severity `ERROR`. Findings of severity `WARNING` or `INFO`
SHALL be reported without blocking.

#### Scenario: WARNING does not block

- **WHEN** the scan reports a finding of severity `WARNING`
- **THEN** neither the push nor the CI job is blocked

### Requirement: Scan timeout

The script SHALL apply a timeout to the Semgrep invocation. The under-60-seconds objective applies to the ubuntu CI
runner (`ubuntu-latest`, measured at 22.7 s); it is **not** reached on Windows with Docker Desktop (measured 135 s
on a clean clone, 149 s in a linked worktree, 207 s under machine load), where `LOCAL_TIMEOUT_MS = 300 s` is a
safety net, not the objective. When the timeout expires the run SHALL be treated as a broken tool and resolved by
the applicable failure policy.

#### Scenario: Hanging scan is cut

- **WHEN** Semgrep does not finish within the configured timeout
- **THEN** the process is terminated
- **AND** the outcome follows the mode's failure policy (fail-open locally, fail-closed in CI)

#### Scenario: Budget respected on a representative run on ubuntu

- **WHEN** the scan runs on a representative diff touching a few source files on `ubuntu-latest`
- **THEN** the scan completes within the documented under-60-second budget (measured: 22.7 s)

### Requirement: Exit-code contract

The script SHALL interpret Semgrep exit code `0` as "no blocking finding" and exit code `1` as "blocking finding".
Any other exit code, or a failure to launch the scan at all, SHALL be classified as a broken tool and resolved by
the mode's failure policy, never reported as a security finding.

#### Scenario: Clean scan

- **WHEN** Semgrep exits `0`
- **THEN** the script succeeds

#### Scenario: Finding detected

- **WHEN** Semgrep exits `1`
- **THEN** the script fails with the blocking exit code

#### Scenario: Unexpected exit code

- **WHEN** Semgrep exits with a code other than `0` or `1`
- **THEN** the script classifies the run as a broken tool
- **AND** it does not report the outcome as a security finding

### Requirement: Local mode fails open on tool failure

In local mode, a broken tool (Docker not running, image pull failure, timeout, no network) SHALL NOT block the
push: the script SHALL print a visible warning stating that no scan ran and why, and SHALL exit successfully.

#### Scenario: Docker is unavailable

- **WHEN** the developer pushes with Docker stopped
- **THEN** the push proceeds
- **AND** a visible warning states that the SAST scan could not run

#### Scenario: Rules cannot be fetched

- **WHEN** pack resolution fails because the network is unavailable
- **THEN** the same fail-open behaviour applies with its own reason in the warning

### Requirement: CI mode fails closed on tool failure

In CI mode, a broken tool SHALL fail the job. A tool failure SHALL NOT be reported as a passing scan and SHALL NOT
be silently downgraded to a warning.

#### Scenario: Broken tool in CI

- **WHEN** the scan cannot run in the `sast` job
- **THEN** the job step exits non-zero
- **AND** the output distinguishes the tool failure from a finding-based failure

#### Scenario: Tool failure during FASE 1 fails the job without blocking the merge

- **WHEN** the scan cannot run in the `sast` job while `continue-on-error: true` is still in force (FASE 1)
- **THEN** the step exits non-zero and the job is reported as failed
- **AND** the merge is NOT blocked, because enforcement begins only in FASE 2, when `continue-on-error` is removed

### Requirement: CI mode writes the scan report

In `ci` mode the script SHALL write a machine-readable report of the scan — findings with rule, severity, file and
line, plus the resolved mode and the baseline commit actually used — to the deterministic path
`.tmp/sast-report.json`, so the job can retain it as an artifact (RF-CI-02). The report SHALL be written for clean
runs too, so the artifact upload never lacks an input. The verdict SHALL NOT depend on the report: if the report
cannot be written, the exit code still reflects the scan outcome and the problem is reported in the output. The
report SHALL NOT contain secret values.

#### Scenario: Report file produced in CI mode

- **WHEN** the scan runs with `SAST_MODE=ci`
- **THEN** `.tmp/sast-report.json` exists and lists the findings with rule, file and line
- **AND** it records the resolved mode and the baseline commit used

#### Scenario: Report is produced for a clean run too

- **WHEN** the scan reports no blocking finding
- **THEN** the report file is still written, with an empty findings list, so the artifact step always has an input

#### Scenario: A missing report does not change the verdict

- **WHEN** the report cannot be written
- **THEN** the exit code still reflects the scan outcome
- **AND** the output states that the report could not be written

### Requirement: Pre-push stage order

`.husky/pre-push` SHALL keep its existing stages and insert SAST between the commit-signature gate and the scoped
tests, in this order: (1) `git fetch origin main --depth=1`, (2) guard for `origin/main` availability, (3) commit
signature gate, (4) diff-scoped SAST, (5) scoped tests. When SAST blocks, the scoped tests SHALL NOT be executed.
The hook SHALL NOT reintroduce a DCO re-check.

#### Scenario: SAST blocks before tests run

- **WHEN** the SAST stage fails
- **THEN** the hook exits non-zero
- **AND** the scoped tests are not started

#### Scenario: Documented order when every stage passes

- **WHEN** the guard, the signature gate, SAST and the scoped tests all pass
- **THEN** the stages run in the documented order and the push proceeds

#### Scenario: DCO is not re-validated in pre-push

- **WHEN** the `pre-push` hook runs
- **THEN** it does not check for a `Signed-off-by:` trailer (`commit-msg` remains the only local DCO gate)

### Requirement: Portability across Windows and ubuntu

The script SHALL run unmodified on Windows (Git Bash / MSYS2) and on the ubuntu CI runner, relying only on Node
and Docker invocations valid on both platforms. It SHALL NOT depend on PowerShell.

#### Scenario: Node script on the CI runner

- **WHEN** the `sast` job runs on `ubuntu-latest`
- **THEN** `node scripts/sast-diff.mjs` executes without a shell-specific shim

#### Scenario: Same script on Windows

- **WHEN** the pre-push hook runs on Windows
- **THEN** the same file executes and produces the same verdict for the same diff

### Requirement: Same diff yields the same verdict

For the same diff, the hook and the CI job SHALL produce the same verdict: the same reported findings and the same
blocking decision for findings. A divergence is acceptable only when one side ends in a broken-tool outcome.

#### Scenario: Parity on a reference diff

- **WHEN** the same diff is evaluated locally and in CI
- **THEN** both report the same findings and the same blocking verdict
- **AND** any difference is explained by a broken-tool classification on one side

#### Scenario: Different baselines are disclosed, not hidden

- **WHEN** local and CI evaluate the same change from different baselines (merge base versus pull-request base commit)
- **THEN** the difference is limited to findings already present in one baseline and absent from the other
- **AND** each side reports the baseline commit it used, so the divergence is inspectable instead of silent

### Requirement: Observable skips and escalations

Every skipped scan (dirty working tree, language scope, broken tool) SHALL produce a visible notice stating that no
scan ran and why. No path SHALL silently report success as if a scan had been performed.

#### Scenario: No silent success

- **WHEN** a scan is skipped for any documented reason
- **THEN** the output states that no scan ran and which reason applied

#### Scenario: Broken-tool warning includes remediation

- **WHEN** the skip is caused by a broken tool
- **THEN** the warning names the missing capability (for example Docker) so the developer can restore the local gate
