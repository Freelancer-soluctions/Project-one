/**
 * PR body governance policy — change `pr-metadata-workflow`
 * (capability `pr-body-lint-governance`).
 *
 * Deterministic normalization + evaluation of a pull request body against the
 * repository's `.github/PULL_REQUEST_TEMPLATE.md`. Consumed by
 * `.github/workflows/pr-metadata.yml` (job `Governance: PR Body Lint`) through a
 * thin `actions/github-script` wrapper.
 *
 * Module contract (design D14):
 *   - `normalize(text)`            six-step pipeline, normative order (spec:
 *                                  "Normalization runs before any rule…")
 *   - `splitSections(body)`        Map<canonicalHeading, rawSectionBody>; the
 *                                  split happens on the RAW body because step 3
 *                                  of the pipeline erases heading lines
 *   - `evaluateBody({body,author}) PURE seam: R1-R5, no `core`, no filesystem,
 *                                  no clock — what the tests and the offline
 *                                  calibration corpus call
 *   - `evaluate({core, context})`  impure wrapper: reads `context.payload`,
 *                                  writes the report, publishes the summary and
 *                                  calls `core.setFailed` on a policy failure
 *
 * Rules (severity split is load-bearing):
 *   R1  normalized meaningful content >= 40 chars                  -> fail
 *   R2a `Summary` >= 20 meaningful chars                           -> fail
 *   R2b `Related Issue` >= 1 char AND (`#\d+` OR >= 20 chars)      -> fail
 *   R2c `How Has This Been Tested?` >= 1 char OR a checked box in
 *       that section                                               -> fail
 *   R3  `Closes #` never without a number (evaluated on the
 *       comment-stripped body — the template's own guidance comment
 *       contains `Closes #` and would self-fail the rule)          -> fail
 *   R4  at least one checked checkbox                              -> warning
 *   R5  at least one `#\d+` issue reference                        -> warning
 *
 * No top-level `await` (design D14: the action runtime `require()`s this ESM
 * module) and no dependency outside Node builtins.
 */

import fs from 'node:fs';
import path from 'node:path';

export const POLICY_ID = 'pr-body-lint-governance';
export const POLICY_VERSION = '1.0.0';
export const REPORT_SCHEMA_VERSION = 1;
export const REPORT_RELATIVE_PATH = '.tmp/pr-body-lint/report.json';

/** Required core sections. The lockstep test asserts these exist as `##`
 *  headings in `.github/PULL_REQUEST_TEMPLATE.md`. */
export const REQUIRED_SECTIONS = [
  'Summary',
  'Related Issue',
  'How Has This Been Tested?',
];

const MIN_MEANINGFUL_TOTAL = 40;
const MIN_MEANINGFUL_SUMMARY = 20;
const RELATED_ISSUE_MIN_CHARS = 1;
const RELATED_ISSUE_MIN_CHARS_WITHOUT_REF = 20;

const UNCHECKED_TASK_LINE = /^\s*(?:[-*+]\s+)?\[\s*\]/;
const HEADING_LINE = /^\s*#{1,6}\s/;
const CHECKED_TASK_LINE = /^\s*(?:[-*+]\s+)?\[[xX]\]/;
/** Spec regex: `/Closes\s*#(?!\\s*\\d)/g` — `Closes #123` survives. */
const PLACEHOLDER_CLOSES = /Closes\s*#(?!\s*\d)/;
const ISSUE_REF = /#\d+/;

/** Canonical heading form: case/punctuation/whitespace insensitive, so
 *  `## summary`, `## SUMMARY:` and `## How Has This Been Tested?` all resolve
 *  to the same key. */
export const canonicalizeHeading = (heading) =>
  String(heading ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

/** Step 1 of the normalization pipeline (also used standalone by R3). */
export const stripHtmlComments = (text) =>
  String(text ?? '').replace(/<!--[\s\S]*?-->/g, '');

/**
 * Six-step normalization pipeline, in the normative order:
 * 1. strip HTML comments  2. drop unchecked task lines  3. drop heading lines
 * 4. drop digit-less `Closes #`  5. unwrap `[x]`  6. collapse whitespace.
 */
export const normalize = (text) => {
  let out = stripHtmlComments(text);

  // 2. drop unchecked task-list lines (checked ones keep their label).
  out = out
    .split('\n')
    .filter((line) => !UNCHECKED_TASK_LINE.test(line))
    .join('\n');

  // 3. drop heading lines (the split on raw headings already happened).
  out = out
    .split('\n')
    .filter((line) => !HEADING_LINE.test(line))
    .join('\n');

  // 4. remove `Closes #` placeholders that carry no digits.
  out = out.replace(/Closes\s*#(?!\s*\d)/g, '');

  // 5. unwrap checked checkbox markers so `[x]` does not inflate length.
  out = out.replace(/^\s*(?:[-*+]\s+)?\[[xX]\]\s*/gm, '');

  // 6. collapse whitespace.
  return out.replace(/\s+/g, ' ').trim();
};

/**
 * Split the RAW body on its `##` headings. A section's content is the text
 * between its heading and the next heading of any level. Keyed by the
 * canonicalized heading.
 */
export const splitSections = (body) => {
  const sections = new Map();
  const lines = String(body ?? '').split(/\r?\n/);
  let current = null;
  let buffer = [];

  const close = () => {
    if (current !== null) {
      sections.set(current, buffer.join('\n'));
    }
    current = null;
    buffer = [];
  };

  for (const line of lines) {
    const level2 = /^##\s+(.*)$/.exec(line);
    if (level2) {
      close();
      current = canonicalizeHeading(level2[1]);
      continue;
    }
    if (HEADING_LINE.test(line)) {
      close();
      continue;
    }
    if (current !== null) buffer.push(line);
  }
  close();

  return sections;
};

/** Count of checked task-list markers in a piece of text (R2c / R4). */
export const countCheckedCheckboxes = (text) =>
  String(text ?? '')
    .split('\n')
    .filter((line) => CHECKED_TASK_LINE.test(line)).length;

/** Bot detection keys on the PR AUTHOR (stable), never on the trigger actor
 *  (design D6). A human editing a bot PR must not shift the exemption. */
export const isBotAuthor = (author) => {
  const login = typeof author === 'string' ? author : (author?.login ?? '');
  const type = typeof author === 'object' && author ? author.type : undefined;
  return type === 'Bot' || /\[bot\]$/i.test(login);
};

/**
 * Pure evaluation seam: R1-R5 over a body string. No `core`, no filesystem, no
 * clock — same input ⇒ same output (spec: "Evaluation is deterministic").
 */
export const evaluateBody = ({ body = '', author = null } = {}) => {
  const raw = String(body ?? '');
  const commentStripped = stripHtmlComments(raw);
  const normalized = normalize(raw);
  const sections = splitSections(raw);

  const metrics = {
    bodyChars: raw.length,
    meaningfulChars: normalized.length,
    checkedCheckboxes: countCheckedCheckboxes(raw),
    sectionsFound: [...sections.keys()],
  };
  const failures = [];
  const warnings = [];

  const bot = isBotAuthor(author);
  if (bot) {
    // Exemption is policy, not absence of evaluation: report why.
    return {
      verdict: 'skipped',
      bot: true,
      reason: 'bot-authored pull request (exempt by policy)',
      metrics,
      failures,
      warnings,
    };
  }

  // R1 — total meaningful content.
  if (metrics.meaningfulChars < MIN_MEANINGFUL_TOTAL) {
    failures.push({
      rule: 'R1',
      message: `Meaningful content is ${metrics.meaningfulChars} characters, minimum is ${MIN_MEANINGFUL_TOTAL}`,
      measured: metrics.meaningfulChars,
    });
  }

  // R2a/R2b/R2c — per section, missing and empty are distinct verdicts.
  const sectionCheck = (name) => {
    const key = canonicalizeHeading(name);
    if (!sections.has(key)) return { present: false, text: '' };
    return { present: true, text: normalize(sections.get(key)) };
  };

  const summary = sectionCheck('Summary');
  if (!summary.present) {
    failures.push({
      rule: 'R2a',
      section: 'Summary',
      message: 'Required section "Summary" is missing',
    });
  } else if (summary.text.length < MIN_MEANINGFUL_SUMMARY) {
    failures.push({
      rule: 'R2a',
      section: 'Summary',
      message: `Section "Summary" carries ${summary.text.length} meaningful characters, minimum is ${MIN_MEANINGFUL_SUMMARY}`,
      measured: summary.text.length,
    });
  }

  const related = sectionCheck('Related Issue');
  if (!related.present) {
    failures.push({
      rule: 'R2b',
      section: 'Related Issue',
      message: 'Required section "Related Issue" is missing',
    });
  } else {
    const chars = related.text.length;
    const hasRef = ISSUE_REF.test(related.text);
    const ok =
      chars >= RELATED_ISSUE_MIN_CHARS &&
      (hasRef || chars >= RELATED_ISSUE_MIN_CHARS_WITHOUT_REF);
    if (!ok) {
      failures.push({
        rule: 'R2b',
        section: 'Related Issue',
        message: `Section "Related Issue" carries ${chars} meaningful characters${hasRef ? '' : ' and no #<number> reference'}, minimum is an issue reference or ${RELATED_ISSUE_MIN_CHARS_WITHOUT_REF}`,
        measured: chars,
      });
    }
  }

  const testingKey = canonicalizeHeading('How Has This Been Tested?');
  const testingRaw = sections.get(testingKey);
  const testingPresent = testingRaw !== undefined;
  const testingText = testingPresent ? normalize(testingRaw) : '';
  const testingChecked = testingPresent
    ? countCheckedCheckboxes(testingRaw)
    : 0;
  if (!testingPresent) {
    failures.push({
      rule: 'R2c',
      section: 'How Has This Been Tested?',
      message: 'Required section "How Has This Been Tested?" is missing',
    });
  } else if (testingText.length < 1 && testingChecked < 1) {
    failures.push({
      rule: 'R2c',
      section: 'How Has This Been Tested?',
      message:
        'Section "How Has This Been Tested?" carries no content and no checked checkbox',
      measured: 0,
    });
  }

  // R3 — evaluated on the COMMENT-STRIPPED body (normative exception).
  if (PLACEHOLDER_CLOSES.test(commentStripped)) {
    failures.push({
      rule: 'R3',
      message: 'Found `Closes #` without a number (placeholder left unfilled)',
    });
  }

  // R4 / R5 — warnings only: they must never fail the job.
  if (metrics.checkedCheckboxes < 1) {
    warnings.push({
      rule: 'R4',
      message: 'No checkbox is checked in the body',
    });
  }
  if (!ISSUE_REF.test(commentStripped)) {
    warnings.push({
      rule: 'R5',
      message: 'No issue reference (#<number>) found in the body',
    });
  }

  return {
    verdict: failures.length > 0 ? 'fail' : 'pass',
    bot: false,
    metrics,
    failures,
    warnings,
  };
};

/** Machine-readable report, schema v1 (spec: "Evaluation is deterministic and
 *  machine-readable"). `pr` carries identity only — never the body text. */
export const buildReport = ({ pr = {}, result, now = new Date() }) => ({
  schemaVersion: REPORT_SCHEMA_VERSION,
  generatedAt: now.toISOString(),
  pr: {
    number: pr.number ?? null,
    author: pr.author ?? null,
    draft: pr.draft ?? null,
    headSha: pr.headSha ?? null,
    baseSha: pr.baseSha ?? null,
  },
  policy: {
    id: POLICY_ID,
    version: POLICY_VERSION,
    requiredSections: REQUIRED_SECTIONS,
    failRules: ['R1', 'R2a', 'R2b', 'R2c', 'R3'],
    warnRules: ['R4', 'R5'],
  },
  metrics: result.metrics,
  failures: result.failures,
  warnings: result.warnings,
  verdict: result.verdict,
});

/** Write the report under `<cwd>/.tmp/pr-body-lint/report.json`. Throws on
 *  failure — `evaluate` turns that into a TOOLING error, not a policy one. */
export const writeReport = (report, cwd = process.cwd()) => {
  const target = path.join(cwd, REPORT_RELATIVE_PATH);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  return target;
};

const renderSummary = (result, reportPath) => {
  const lines = [
    '## Governance: PR Body Lint',
    '',
    `**Verdict:** \`${result.verdict}\`${result.bot ? ` — ${result.reason}` : ''}`,
    '',
    `| Metric | Value |`,
    `| --- | --- |`,
    `| bodyChars | ${result.metrics.bodyChars} |`,
    `| meaningfulChars | ${result.metrics.meaningfulChars} |`,
    `| checkedCheckboxes | ${result.metrics.checkedCheckboxes} |`,
    `| sectionsFound | ${result.metrics.sectionsFound.join(', ') || '—'} |`,
    '',
  ];
  if (result.failures.length > 0) {
    lines.push('### Failures', '');
    for (const f of result.failures) {
      lines.push(
        `- **${f.rule}**${f.section ? ` (${f.section})` : ''}: ${f.message}`
      );
    }
    lines.push('');
  }
  if (result.warnings.length > 0) {
    lines.push('### Warnings (non-blocking)', '');
    for (const w of result.warnings) {
      lines.push(`- **${w.rule}**: ${w.message}`);
    }
    lines.push('');
  }
  lines.push(`Full report artifact: \`${reportPath}\` (14 days)`);
  return lines.join('\n');
};

/**
 * Impure wrapper for `actions/github-script`. Reads the pull request from
 * `context.payload` — the body is NEVER interpolated into `run:` or `script:`
 * (design D12) — then writes the report, publishes the summary and fails the
 * job on a policy failure.
 *
 * Any thrown error is reported as a TOOLING failure so an operator can tell a
 * broken gate from an invalid body (spec: "Report write failure fails closed").
 */
export const evaluate = async ({ core, context, cwd = process.cwd() } = {}) => {
  try {
    const pr = context?.payload?.pull_request;
    if (!pr) {
      core?.setFailed?.(
        '[pr-body-lint] TOOLING ERROR: no pull_request in payload'
      );
      return { verdict: 'tooling-error' };
    }

    const result = evaluateBody({
      body: pr.body ?? '',
      author: pr.user ? { type: pr.user.type, login: pr.user.login } : null,
    });

    const report = buildReport({
      pr: {
        number: pr.number,
        author: pr.user?.login ?? null,
        draft: pr.draft,
        headSha: pr.head?.sha ?? null,
        baseSha: pr.base?.sha ?? null,
      },
      result,
    });

    const reportPath = writeReport(report, cwd);

    if (core?.summary && typeof core.summary.addRaw === 'function') {
      core.summary.addRaw(renderSummary(result, REPORT_RELATIVE_PATH));
      if (typeof core.summary.write === 'function') await core.summary.write();
    }

    if (result.verdict === 'fail') {
      const detail = result.failures
        .map(
          (f) => `${f.rule}${f.section ? ` (${f.section})` : ''}: ${f.message}`
        )
        .join(' | ');
      core?.setFailed?.(`[pr-body-lint] policy violations — ${detail}`);
    }

    return { ...result, reportPath };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    core?.setFailed?.(
      `[pr-body-lint] TOOLING ERROR (not a policy violation): ${message}`
    );
    return { verdict: 'tooling-error', error: message };
  }
};

export default { evaluate, evaluateBody, normalize, splitSections };
