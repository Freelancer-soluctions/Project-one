#!/usr/bin/env node
// scripts/sast-diff.mjs
// ---------------------------------------------------------------------------
// Shared diff-scoped SAST entry point (capability: sast-diff-scanning).
// Single implementation consumed by BOTH gates, so version, packs, exclusions,
// severity filter and diff base cannot diverge (RF-PAR-01..06):
//   - local hook:  .husky/pre-push  -> `node scripts/sast-diff.mjs`
//   - CI job:      ci.yml `sast`    -> `SAST_MODE=ci node scripts/sast-diff.mjs`
//
// Modes (SAST_MODE, RF-PAR-02):
//   local (default)  fail-open on broken tool (RF-FAIL-02): the hook is
//                    feedback; a stopped Docker daemon must not block a push.
//   ci               fail-closed on broken tool (RF-FAIL-03): CI is the
//                    enforcement point; a broken tool fails the job.
//   A finding (exit code 1 from Semgrep) blocks in BOTH modes.
//
// Exit-code contract (RF-FAIL-01):
//   Semgrep 0 -> no blocking finding        -> script exit 0
//   Semgrep 1 -> blocking finding (ERROR)   -> script exit 1
//   anything else (incl. launch error/timeout) -> broken tool -> mode policy
//
// Baseline (RF-PP-01/02, design D13): `--baseline-commit` is ALWAYS passed;
// only its value differs. local = `git merge-base origin/main HEAD` (never
// origin/main itself: if main moved forward, or the `--depth=1` fetch did not
// bring the exact base commit, attributing third-party findings to this change
// would violate RF-PP-02). ci = the pull-request base commit
// (`github.event.pull_request.base.sha` passed via SAST_BASELINE_COMMIT).
// Each side prints the baseline commit it used, so the (declared, admitted)
// divergence between the two bases is inspectable instead of silent.
//
// Resolved assumption (PRD section 6, verification 1 - see design.md D7):
// whether `--baseline-commit` requires a clean working tree in the pinned
// Semgrep version does NOT condition the correctness of this gate. RF-PP-04 skips the
// scan with a visible warning whenever the working tree is dirty (local mode
// only; CI always scans a clean checkout), so the dirty-tree/baseline
// interaction can never produce a false verdict here.
//
// Local-only skips (never applied in ci - H-1, the enforcement path has no
// silent skip): dirty working tree (RF-PP-04) and diff touching none of
// .js .jsx .cjs .mjs .ts .tsx (RF-PP-03). Both print the reason and exit 0.
// Timeout (RF-PP-06, objective < 60s local) degrades to "broken tool" and
// goes through the mode's failure policy; the container is force-removed
// (design D15) so no orphan container survives between pushes.
//
// Portability (RNF-01): Node + Docker only, no PowerShell, runs unmodified on
// Windows (Git Bash / MSYS2) and ubuntu-latest.
// ---------------------------------------------------------------------------

import { spawn, spawnSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

// -- Single source of truth for the Semgrep version (RF-PAR-03, RNF-02) -----
// Defined exactly ONCE in the repo. The full scan (scripts/security/semgrep.ps1,
// task 6.4) pins the same value. Never use a floating tag.
export const SEMGREP_VERSION = '1.176.1';
const SEMGREP_IMAGE = `semgrep/semgrep:${SEMGREP_VERSION}`;

// -- Single source of truth for the rule set (RF-PAR-04, H-1/M-3) -----------
// The 9 registry packs, used verbatim by hook AND CI job. The on-demand full
// scan (`sast:semgrep:full`) is the documented exception with its own r/...
// list (design D5, docs/security/semgrep-rules.md).
export const PACKS = [
  'p/owasp-top-ten',
  'p/security-audit',
  'p/secrets',
  'p/nodejs',
  'p/expressjs',
  'p/sql-injection',
  'p/command-injection',
  'p/react',
  'p/xss',
];

// Inline exclusions (RF-PAR-05) - no .semgrepignore dependency.
export const EXCLUSIONS = [
  'node_modules',
  'dist',
  'build',
  'coverage',
  '.env',
  '*.min.js',
  'prisma/generated',
  'e2e',
];

// Extensions that make a diff worth scanning (RF-PP-03).
export const SCANNED_EXTENSIONS = [
  '.js',
  '.jsx',
  '.cjs',
  '.mjs',
  '.ts',
  '.tsx',
];

// Deterministic report path (RF-CI-02 / design D18), repo-root relative.
export const REPORT_PATH = '.tmp/sast-report.json';

// Timeouts (RF-PP-06): local budget < 60s; CI below the job's 15-minute
// timeout-minutes. SAST_TIMEOUT_MS overrides both (used by the tests).
const LOCAL_TIMEOUT_MS = 60 * 1000;
const CI_TIMEOUT_MS = 13 * 60 * 1000;

const EXIT_OK = 0;
const EXIT_BLOCKED = 1; // same code Semgrep uses for "finding"

const SCRIPT_PATH = path.basename(fileURLToPath(import.meta.url));

// -- Manifest of the full-scan r/... rules (audit artifact — task 1.4) -------
// Kept in lockstep with `scripts/security/semgrep.ps1` (the single source of
// truth for the on-demand full scan). This array is read-only metadata for the
// coverage audit (rule -> covered-by pack/custom rule -> gap); it is NOT the
// executable rule set for the hook or the CI job (those consume the packs and
// .semgrep/rules from buildScanArgs()).
export const FULL_SCAN_RULES = [
  'r/javascript.browser.security.open-redirect.js-open-redirect',
  'r/javascript.browser.security.open-redirect-from-function.js-open-redirect-from-function',
  'r/javascript.express.security.audit.express-check-csurf-middleware-usage.express-check-csurf-middleware-usage',
  'r/javascript.express.security.audit.express-check-directory-listing.express-check-directory-listing',
  'r/javascript.express.security.audit.express-open-redirect.express-open-redirect',
  'r/javascript.express.security.audit.express-path-join-resolve-traversal.express-path-join-resolve-traversal',
  'r/javascript.express.security.audit.possible-user-input-redirect.unknown-value-in-redirect',
  'r/javascript.express.security.audit.res-render-injection.res-render-injection',
  'r/javascript.lang.security.audit.detect-non-literal-fs-filename.detect-non-literal-fs-filename',
  'r/javascript.lang.security.audit.path-traversal.path-join-resolve-traversal.path-join-resolve-traversal',
  'r/javascript.lang.security.audit.unsafe-formatstring.unsafe-formatstring',
  'r/javascript.lang.security.detect-no-csrf-before-method-override.detect-no-csrf-before-method-override',
  'r/javascript.lang.security.insecure-object-assign.insecure-object-assign',
  'r/typescript.react.security.audit.react-jwt-decoded-property.react-jwt-decoded-property',
  'r/typescript.react.security.audit.react-jwt-in-localstorage.react-jwt-in-localstorage',
  'r/javascript.express.security.audit.express-cookie-settings.express-cookie-session-default-name',
  'r/javascript.express.security.audit.express-cookie-settings.express-cookie-session-no-domain',
  'r/javascript.express.security.audit.express-cookie-settings.express-cookie-session-no-expires',
  'r/javascript.express.security.audit.express-cookie-settings.express-cookie-session-no-httponly',
  'r/javascript.express.security.audit.express-cookie-settings.express-cookie-session-no-path',
  'r/javascript.express.security.audit.express-cookie-settings.express-cookie-session-no-secure',
  'r/javascript.express.security.audit.express-jwt-not-revoked.express-jwt-not-revoked',
  'r/javascript.express.security.audit.remote-property-injection.remote-property-injection',
  'r/javascript.jsonwebtoken.security.audit.jwt-exposed-data.jwt-exposed-data',
  'r/javascript.audit.detect-replaceall-sanitization.detect-replaceall-sanitization',
  'r/javascript.browser.decoded-xss.decoded-xss',
  'r/javascript.browser.security.dom-based-xss.dom-based-xss',
  'r/javascript.browser.security.insecure-document-method.insecure-document-method',
  'r/javascript.browser.security.insecure-innerhtml.insecure-innerhtml',
  'r/javascript.browser.security.raw-html-concat.raw-html-concat',
  'r/javascript.browser.security.raw-html-join.raw-html-join',
  'r/javascript.express.security.audit.xss.direct-response-write.direct-response-write',
  'r/javascript.express.security.audit.xss.mustache.escape-function-overwrite.escape-function-overwrite',
  'r/javascript.express.security.injection.raw-html-format.raw-html-format',
  'r/javascript.lang.security.audit.unknown-value-with-script-tag.unknown-value-with-script-tag',
  'r/typescript.react.security.audit.react-dangerouslysetinnerhtml.react-dangerouslysetinnerhtml',
  'r/typescript.react.security.audit.react-href-var.react-href-var',
  'r/typescript.react.security.audit.react-unsanitized-method.react-unsanitized-method',
  'r/typescript.react.security.audit.react-unsanitized-property.react-unsanitized-property',
  'r/typescript.react.security.react-markdown-insecure-html.react-markdown-insecure-html',
  'r/javascript.jsonwebtoken.security.jwt-none-alg.jwt-none-alg',
  'r/javascript.lang.security.audit.md5-used-as-password.md5-used-as-password',
  'r/javascript.lang.security.detect-pseudorandombytes.detect-pseudoRandomBytes',
  'r/javascript.node-crypto.security.aead-no-final.aead-no-final',
  'r/javascript.node-crypto.security.gcm-no-tag-length.gcm-no-tag-length',
  'r/problem-based-packs.insecure-transport.js-node.using-http-server.using-http-server',
  'r/typescript.react.security.react-insecure-request.react-insecure-request',
  'r/javascript.express.security.audit.express-session-hardcoded-secret.express-session-hardcoded-secret',
  'r/javascript.express.security.cors-misconfiguration.cors-misconfiguration',
  'r/javascript.express.security.express-jwt-hardcoded-secret.express-jwt-hardcoded-secret',
  'r/javascript.jsonwebtoken.security.jwt-hardcode.hardcoded-jwt-secret',
  'r/javascript.lang.security.audit.hardcoded-hmac-key.hardcoded-hmac-key',
  'r/javascript.express.security.express-insecure-template-usage.express-insecure-template-usage',
  'r/javascript.express.security.express-sandbox-injection.express-sandbox-code-injection',
  'r/javascript.express.security.injection.tainted-sql-string.tainted-sql-string',
  'r/javascript.lang.security.audit.code-string-concat.code-string-concat',
  'r/javascript.lang.security.audit.dangerous-spawn-shell.dangerous-spawn-shell',
  'r/javascript.lang.security.audit.detect-non-literal-require.detect-non-literal-require',
  'r/javascript.lang.security.audit.incomplete-sanitization.incomplete-sanitization',
  'r/javascript.lang.security.audit.spawn-shell-true.spawn-shell-true',
  'r/javascript.lang.security.audit.unsafe-dynamic-method.unsafe-dynamic-method',
  'r/javascript.lang.security.detect-child-process.detect-child-process',
  'r/javascript.lang.security.detect-disable-mustache-escape.detect-disable-mustache-escape',
  'r/javascript.lang.security.detect-eval-with-expression.detect-eval-with-expression',
  'r/javascript.lang.security.html-in-template-string.html-in-template-string',
  'r/javascript.lang.security.spawn-git-clone.spawn-git-clone',
  'r/javascript.playwright.security.audit.playwright-exposed-chrome-devtools.playwright-exposed-chrome-devtools',
  'r/javascript.express.security.audit.express-third-party-object-deserialization.express-third-party-object-deserialization',
  'r/javascript.express.security.audit.express-res-sendfile.express-res-sendfile',
  'r/javascript.express.security.x-frame-options-misconfiguration.x-frame-options-misconfiguration',
  'r/javascript.lang.security.audit.detect-non-literal-regexp.detect-non-literal-regexp',
  'r/javascript.lang.security.audit.detect-redos.detect-redos',
  'r/problem-based-packs.insecure-transport.js-node.bypass-tls-verification.bypass-tls-verification',
  'r/problem-based-packs.insecure-transport.js-node.disallow-old-tls-versions1.disallow-old-tls-versions1',
  'r/problem-based-packs.insecure-transport.js-node.disallow-old-tls-versions2.disallow-old-tls-versions2',
  'r/problem-based-packs.insecure-transport.js-node.ftp-request.ftp-request',
  'r/problem-based-packs.insecure-transport.js-node.http-request.http-request',
  'r/javascript.chrome-remote-interface.security.audit.chrome-remote-interface-compilescript-injection.chrome-remote-interface-compilescript-injection',
  'r/javascript.express.security.audit.express-ssrf.express-ssrf',
  'r/javascript.express.security.express-phantom-injection.express-phantom-injection',
  'r/javascript.phantom.security.audit.phantom-injection.phantom-injection',
  'r/javascript.playwright.security.audit.playwright-addinitscript-code-injection.playwright-addinitscript-code-injection',
  'r/javascript.playwright.security.audit.playwright-evaluate-arg-injection.playwright-evaluate-arg-injection',
  'r/javascript.playwright.security.audit.playwright-evaluate-code-injection.playwright-evaluate-code-injection',
  'r/javascript.playwright.security.audit.playwright-goto-injection.playwright-goto-injection',
  'r/javascript.playwright.security.audit.playwright-setcontent-injection.playwright-setcontent-injection',
  'r/javascript.browser.security.insufficient-postmessage-origin-validation.insufficient-postmessage-origin-validation',
  'r/javascript.browser.security.wildcard-postmessage-configuration.wildcard-postmessage-configuration',
  'r/javascript.express.security.express-data-exfiltration.express-data-exfiltration',
  'r/javascript.lang.security.audit.prototype-pollution.prototype-pollution-assignment.prototype-pollution-assignment',
  'r/javascript.lang.security.audit.prototype-pollution.prototype-pollution-loop.prototype-pollution-loop',
  'r/javascript.lang.security.audit.sqli.node-postgres-sqli.node-postgres-sqli',
  'r/javascript.express.security.audit.express-detect-notevil-usage.express-detect-notevil-usage',
];

// ---------------------------------------------------------------------------
// Mode resolution (RF-PAR-02, H-1)
// ---------------------------------------------------------------------------

/**
 * Resolve SAST_MODE. Default `local`, except inside a GitHub Actions runner
 * where an unset SAST_MODE must NOT silently become `local` (H-1): the
 * enforcement path refuses to run without an explicit mode.
 * @returns {'local'|'ci'}
 */
export function resolveMode(env = process.env) {
  const raw = env.SAST_MODE;
  const inRunner = env.GITHUB_ACTIONS === 'true';

  if (raw === undefined || raw === '') {
    if (inRunner) {
      const err = new Error(
        'SAST_MODE is not defined inside a GitHub Actions runner. ' +
          "Refusing to fall back to the 'local' default: set SAST_MODE=ci (or SAST_MODE=local explicitly)."
      );
      err.userFacing = true;
      throw err;
    }
    return 'local';
  }

  if (raw !== 'local' && raw !== 'ci') {
    const err = new Error(
      `Unknown SAST_MODE "${raw}". Supported values: "local", "ci".`
    );
    err.userFacing = true;
    throw err;
  }
  return raw;
}

// ---------------------------------------------------------------------------
// Command construction (RF-PAR-05, H-1 priority: custom rules BEFORE packs)
// ---------------------------------------------------------------------------

/** Repo root as reported by git (docker mount + git commands run there). */
export function repoRoot() {
  const res = spawnSync('git', ['rev-parse', '--show-toplevel'], {
    encoding: 'utf8',
  });
  if (res.status !== 0 || !res.stdout.trim()) {
    const err = new Error(
      'Could not resolve the git worktree root (not inside a repository?).'
    );
    err.userFacing = true;
    throw err;
  }
  return res.stdout.trim();
}

/** `git merge-base origin/main HEAD` - the local baseline (design D13). */
function localBaselineCommit(root) {
  const res = spawnSync('git', ['merge-base', 'origin/main', 'HEAD'], {
    cwd: root,
    encoding: 'utf8',
  });
  if (res.status !== 0 || !res.stdout.trim()) {
    const err = new Error(
      `git merge-base origin/main HEAD failed: ${(res.stderr || '').trim() || 'no merge base'} ` +
        '(the pre-push hook fetches origin/main and guards it before invoking this script).'
    );
    err.userFacing = true;
    throw err;
  }
  return res.stdout.trim();
}

/** Resolve the baseline commit for the mode; always passed to Semgrep. */
export function resolveBaseline(mode, root, env = process.env) {
  if (mode === 'local') return localBaselineCommit(root);
  const sha = (env.SAST_BASELINE_COMMIT || '').trim();
  if (!/^[0-9a-f]{7,40}$/i.test(sha)) {
    const err = new Error(
      'SAST_BASELINE_COMMIT is missing or is not a commit SHA. In CI mode it must carry ' +
        'github.event.pull_request.base.sha (the pull-request base commit).'
    );
    err.userFacing = true;
    throw err;
  }
  return sha.toLowerCase();
}

/** `.semgrep/rules` exists and has rules? Absent/empty must not fail (spec). */
function hasCustomRules(root) {
  const dir = path.join(root, '.semgrep', 'rules');
  try {
    return fs
      .readdirSync(dir)
      .some((f) => f.endsWith('.yml') || f.endsWith('.yaml'));
  } catch {
    return false;
  }
}

/**
 * Build the `docker run ... semgrep scan ...` argument vector (no `=` form on
 * any flag). Reproducible snapshot of the effective command: printed on every
 * run and recorded in tasks.md (L-1).
 */
export function buildScanArgs({ root, baseline, containerName }) {
  const args = [
    'run',
    '--rm',
    '-v',
    `${root}:/src`,
    '-w',
    '/src',
    '--name',
    containerName,
    SEMGREP_IMAGE,
    'semgrep',
    'scan',
    '--baseline-commit',
    baseline,
  ];
  if (hasCustomRules(root)) {
    args.push('--config', '.semgrep/rules'); // BEFORE the packs: local priority
  }
  for (const pack of PACKS) args.push('--config', pack);
  for (const exclusion of EXCLUSIONS) args.push('--exclude', exclusion);
  args.push('--severity', 'ERROR', '--error', '--metrics', 'off', '--json');
  return args;
}

// ---------------------------------------------------------------------------
// Skip matchers (RF-PP-03 / RF-PP-04 - local only, never in ci: H-1)
// ---------------------------------------------------------------------------

export function isWorkingTreeDirty(root) {
  const res = spawnSync('git', ['status', '--porcelain'], {
    cwd: root,
    encoding: 'utf8',
  });
  return res.stdout.trim().length > 0;
}

/** Does the committed diff (baseline..HEAD) touch any scannable file? */
export function diffTouchesScannedFiles(root, baseline) {
  // core.quotepath=false: with the default (true) git CITES+escapes non-ASCII
  // paths ("configuraci\303\263n.js"), so path.extname() saw `.js"` and the
  // scan was silently SKIPPED on accent-only diffs (false negative, RF-PP-03).
  const res = spawnSync(
    'git',
    ['-c', 'core.quotepath=false', 'diff', '--name-only', baseline, 'HEAD'],
    {
      cwd: root,
      encoding: 'utf8',
    }
  );
  const files = (res.stdout || '')
    .split('\n')
    // Belt-and-braces: even with quotepath=false, paths containing `"` or
    // control chars are still C-quoted by git; strip the surrounding quotes so
    // the extension check sees the real tail (return contract unchanged).
    .map((f) => f.replace(/^"(.*)"$/, '$1'))
    .filter(Boolean);
  return files.some((f) =>
    SCANNED_EXTENSIONS.includes(path.extname(f).toLowerCase())
  );
}

// ---------------------------------------------------------------------------
// Exit-code contract + failure policy (RF-FAIL-01/02/03)
// ---------------------------------------------------------------------------

/** Semgrep/docker exit code -> classification. Never reports broken tool as finding. */
export function classifyExitCode(code, timedOut = false) {
  if (timedOut) return 'tool-broken';
  if (code === 0) return 'clean';
  if (code === 1) return 'finding';
  return 'tool-broken';
}

/**
 * Turn a classification into the script's exit code for the mode.
 * local: broken tool -> 0 (fail-open, warn). ci: broken tool -> 1 (fail-closed).
 * A finding blocks (1) in BOTH modes.
 */
export function policyExitCode(mode, classification) {
  if (classification === 'finding') return EXIT_BLOCKED;
  if (classification === 'tool-broken')
    return mode === 'ci' ? EXIT_BLOCKED : EXIT_OK;
  return EXIT_OK;
}

// ---------------------------------------------------------------------------
// Report (RF-CI-02, design D18): findings metadata only - NEVER secret values.
// ---------------------------------------------------------------------------

export function parseFindings(stdout) {
  const findings = [];
  try {
    const parsed = JSON.parse(stdout);
    for (const r of parsed.results || []) {
      findings.push({
        rule: r.check_id || 'unknown',
        severity: (r.extra && r.extra.severity) || 'ERROR',
        file: r.path || 'unknown',
        line: (r.start && r.start.line) || 'unknown',
      });
    }
  } catch {
    // Non-JSON output: keep an empty list. The verdict comes from the exit
    // code, never from this parse.
  }
  return findings;
}

/** Always best-effort: a write failure warns but never changes the verdict. */
export function writeReport(
  root,
  { mode, baseline, classification, findings, toolError }
) {
  const report = {
    mode,
    baselineCommit: baseline || 'unknown',
    classification,
    toolError: toolError || null,
    findings, // rule/severity/file/line only: no secret values by construction
    generatedAt: new Date().toISOString(),
  };
  const target = path.join(root, REPORT_PATH);
  try {
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, `${JSON.stringify(report, null, 2)}\n`);
    return { ok: true, path: target };
  } catch (err) {
    return { ok: false, path: target, error: err.message };
  }
}

// ---------------------------------------------------------------------------
// Scan runner: docker + own timeout + orphan-container cleanup (design D15)
// ---------------------------------------------------------------------------

/**
 * Human-readable reason for a broken-tool verdict (RF-FAIL-01, task 2.8).
 * A scan killed by the own timeout MUST be reported as such: "exited with
 * code null" is opaque and hides the real cause from the triage.
 */
export function describeToolFailure(result, timeoutMs) {
  if (result.timedOut)
    return `scan timed out after ${Math.round(timeoutMs / 1000)}s`;
  if (result.daemonDown)
    return `Docker daemon is not reachable (\`${result.dockerBin || 'docker'} info\` failed)`;
  if (result.launchError)
    return `could not launch "${result.dockerBin || 'docker'}": ${result.launchError}`;
  return `docker run exited with code ${result.code}`;
}

function runDockerScan(args, timeoutMs, containerName) {
  const dockerBin = process.env.SAST_DOCKER_BIN || 'docker';

  // Pre-flight: a stopped/unreachable daemon must classify as broken tool on
  // EVERY platform. `docker run` exits 125-127 on daemon connection failure on
  // some platforms but 1 on others, and exit 1 MUST mean "finding" (RF-FAIL-01).
  const probe = spawnSync(dockerBin, ['info'], {
    encoding: 'utf8',
    timeout: 30 * 1000,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  if (probe.error || probe.status !== 0) {
    return Promise.resolve({
      code: null,
      stdout: '',
      stderr: `${(probe.stderr || '').trim()}\nDocker daemon not reachable (\`${dockerBin} info\` exit ${probe.status}).`,
      timedOut: false,
      daemonDown: true,
      dockerBin,
      launchError: probe.error ? probe.error.message : null,
    });
  }

  return new Promise((resolve) => {
    const proc = spawn(dockerBin, args, { stdio: ['ignore', 'pipe', 'pipe'] });
    let stdout = '';
    let stderr = '';
    // The timeout MUST be observable in the verdict: a scan killed by the
    // timeout is a broken tool, not a finding, and the reason reported to the
    // user has to say "timed out" instead of the opaque "exited with code
    // null" (task 2.8).
    let timedOut = false;

    const timer = setTimeout(() => {
      timedOut = true;
      proc.kill('SIGKILL');
      // Force-remove the named container: killing the docker CLI does NOT
      // stop the container it started. Best-effort, never throws.
      try {
        spawnSync(dockerBin, ['rm', '-f', containerName], {
          stdio: 'ignore',
          timeout: 15 * 1000,
        });
      } catch {
        /* cleanup is best-effort */
      }
    }, timeoutMs);

    proc.stdout.on('data', (d) => {
      stdout += d;
    });
    proc.stderr.on('data', (d) => {
      stderr += d;
    });
    proc.on('error', (err) => {
      clearTimeout(timer);
      resolve({
        code: null,
        stdout,
        stderr: `${stderr}\n${err.message}`,
        timedOut,
        daemonDown: false,
        dockerBin,
        launchError: err.message,
      });
    });
    proc.on('close', (code) => {
      clearTimeout(timer);
      resolve({
        code,
        stdout,
        stderr,
        timedOut,
        daemonDown: false,
        dockerBin,
        launchError: null,
      });
    });
  });
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function printSkip(reason) {
  console.log(`⚠️  SAST scan skipped: ${reason}.`);
  console.log(
    '   No scan ran in this push. The CI `sast` job still evaluates the same diff.'
  );
}

/**
 * CI-mode report emission (RF-CI-02): write + log outcome. Best-effort by
 * contract — writeReport never throws and this helper never changes the exit
 * code (the "could NOT be written" path just warns).
 */
function emitCiReport(root, payload) {
  const written = writeReport(root, payload);
  if (written.ok) {
    console.log(
      `📝 Scan report written to ${REPORT_PATH} (retained by the job as a 14-day artifact).`
    );
  } else {
    console.warn(
      `⚠️  Scan report could NOT be written to ${REPORT_PATH}: ${written.error}`
    );
    console.warn('   The exit code still reflects the scan outcome.');
  }
  return written;
}

async function main() {
  const mode = resolveMode(); // throws (user-facing) on invalid/unset-in-runner
  const timeoutMs =
    Number(process.env.SAST_TIMEOUT_MS) > 0
      ? Number(process.env.SAST_TIMEOUT_MS)
      : mode === 'local'
        ? LOCAL_TIMEOUT_MS
        : CI_TIMEOUT_MS;

  const root = repoRoot();

  console.log(
    `🔬 SAST diff-scoped scan (mode: ${mode}, Semgrep ${SEMGREP_VERSION})`
  );

  // -- Baseline (both modes; only the value differs) --------------------------
  let baseline;
  try {
    baseline = resolveBaseline(mode, root);
  } catch (err) {
    if (mode === 'local') {
      console.warn(`⚠️  SAST baseline unavailable: ${err.message}`);
      console.warn(
        '   Local policy: fail-open — push proceeds WITHOUT a SAST scan.'
      );
      return EXIT_OK;
    }
    console.error(`❌ SAST configuration error (fail-closed): ${err.message}`);
    // RF-CI-02: in ci mode the report artifact is produced on THIS path too,
    // otherwise the evidence is missing precisely in the misconfiguration
    // scenario. Best-effort: writeReport never throws, so the verdict below
    // (EXIT_BLOCKED) cannot be altered by a write failure.
    emitCiReport(root, {
      mode,
      baseline: null,
      classification: 'tool-broken',
      findings: [],
      toolError: err.message,
    });
    return EXIT_BLOCKED;
  }
  console.log(
    `   Baseline commit: ${baseline} (${mode === 'local' ? 'git merge-base origin/main HEAD' : 'pull-request base sha'})`
  );

  // -- Local-only skips (never in ci: H-1) ------------------------------------
  if (mode === 'local') {
    if (isWorkingTreeDirty(root)) {
      printSkip('dirty working tree (uncommitted changes; RF-PP-04)');
      return EXIT_OK;
    }
    if (!diffTouchesScannedFiles(root, baseline)) {
      printSkip(
        `the pushed diff touches none of ${SCANNED_EXTENSIONS.join(' ')} (RF-PP-03)`
      );
      return EXIT_OK;
    }
  }

  // -- Build + run ------------------------------------------------------------
  const containerName = `sast-diff-${process.pid}`;
  const args = buildScanArgs({ root, baseline, containerName });
  console.log(`   Command: docker ${args.join(' ')}`);

  const result = await runDockerScan(args, timeoutMs, containerName);
  const classification = classifyExitCode(result.code, result.timedOut);

  // -- Report first (ci mode, ALWAYS - the artifact needs its input) ----------
  let findings = [];
  if (classification === 'finding') findings = parseFindings(result.stdout);

  if (mode === 'ci') {
    const toolError =
      classification === 'tool-broken'
        ? result.timedOut
          ? `timeout after ${timeoutMs} ms`
          : result.launchError ||
            result.stderr.trim().split('\n').slice(-3).join(' | ')
        : null;
    emitCiReport(root, {
      mode,
      baseline,
      classification,
      findings,
      toolError,
    });
  }

  // -- Verdict ----------------------------------------------------------------
  if (classification === 'clean') {
    console.log('✅ SAST: no blocking (ERROR) findings in the diff.');
    return EXIT_OK;
  }

  if (classification === 'finding') {
    console.error(
      `❌ SAST: ${findings.length} blocking ERROR finding(s) in the diff:`
    );
    for (const f of findings)
      console.error(`   - ${f.rule} @ ${f.file}:${f.line} [${f.severity}]`);
    console.error(
      '   Remediation: fix the finding, or scope it with a `nosemgrep:` comment if it is a false positive.'
    );
    if (mode === 'local') {
      console.error(
        '   Escape (explicit and visible): `git push --no-verify` or `HUSKY=0 git push`.'
      );
    }
    return policyExitCode(mode, 'finding'); // blocks in BOTH modes
  }

  // classification === 'tool-broken' -> mode failure policy (RF-FAIL-02/03)
  const reason = describeToolFailure(result, timeoutMs);
  const detail = result.stderr.trim().split('\n').slice(-5).join('\n   ');

  if (mode === 'local') {
    console.warn(`⚠️  SAST tool failure: ${reason}. No scan ran.`);
    if (detail) console.warn(`   ${detail}`);
    console.warn(
      '   Local policy: fail-open — the push proceeds. This is a tooling problem, NOT a security verdict.'
    );
    console.warn(
      '   Remediation: start Docker (or restore network access) to restore the local gate.'
    );
    return policyExitCode(mode, 'tool-broken'); // local: 0 (fail-open)
  }

  console.error(
    `❌ SAST tool failure (fail-closed, NOT a security finding): ${reason}.`
  );
  if (detail) console.error(`   ${detail}`);
  console.error(
    '   The job fails because no scan could run; see the classification in the uploaded report.'
  );
  return policyExitCode(mode, 'tool-broken'); // ci: 1 (fail-closed)
}

// Run only when executed directly (importable by scripts/sast-diff.test.mjs).
if (
  process.argv[1] &&
  path.basename(path.resolve(process.argv[1])) === SCRIPT_PATH
) {
  main()
    .then((code) => process.exit(code))
    .catch((err) => {
      console.error(`❌ ${err.message}`);
      process.exit(EXIT_BLOCKED);
    });
}
