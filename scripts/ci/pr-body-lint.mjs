/**
 * PR body governance policy — change `simplify-pr-body-lint-template`
 * (capability `pr-body-lint-governance`).
 *
 * Text in, verdict out. Consumed by `.github/workflows/pr-metadata.yml` (job
 * `Governance: PR Body Lint`) through a thin `actions/github-script` wrapper,
 * and by `.opencode/command/push-pr.md`, which runs the pure seam offline
 * before `gh pr create`.
 *
 * Contract (design § Return-shape contract) — keys and field names are frozen:
 *   evaluateBody({ body, author }) -> { verdict, failures, warnings }
 *     failures: [{ rule, section, message }]
 *     warnings: [{ rule, message }]
 *   `warnings` is always empty: no warning-severity rule survives this policy,
 *   but the key stays because two consumers read it.
 *
 * Rules — all failure severity, none of them a length floor:
 *   EMPTY_BODY nothing left after stripping comments, headings and boxes
 *   R2a        `Summary` present and non-empty
 *   R2b        `Related Issue` present and non-empty
 *   R2c        `How Has This Been Tested?` with content OR a checked box
 *   R3         `Closes #` never without a number (comment-stripped body)
 *
 * `evaluateBody` is network-free and side-effect-free (design § Pure/impure
 * boundary): the issue lookup, if D3 ever adopts it, belongs to `evaluate`.
 * No top-level `await` (design D14: the action runtime `require()`s this ESM
 * module) and no dependency outside Node builtins.
 */

/** The three section rules: [id, section name, satisfied by a checked box]. */
const SECTION_RULES = [
  ['R2a', 'Summary'],
  ['R2b', 'Related Issue'],
  ['R2c', 'How Has This Been Tested?', true],
];

/** Required core sections. The lockstep test asserts these exist as `##`
 *  headings in `.github/PULL_REQUEST_TEMPLATE.md`. */
export const REQUIRED_SECTIONS = SECTION_RULES.map(([, name]) => name);

/** Checked task line; global so it doubles as the marker stripper. */
const CHECKED_LINE = /^\s*(?:[-*+]\s+)?\[[xX]\]\s*/gm;
/** Spec regex: `Closes\s*#(?!\s*\d)` — `Closes #123` survives. */
const PLACEHOLDER_CLOSES = /Closes\s*#(?!\s*\d)/;
const EMPTY_MSG = 'Body is empty: no authored content is left';
const CLOSES_MESSAGE = 'Closes # appears without a number';

/** Canonical heading form: case/punctuation/whitespace insensitive, so
 *  `## summary`, `## SUMMARY:` and `## How Has This Been Tested?` all resolve
 *  to the same key. */
export const canonicalizeHeading = (heading) =>
  String(heading ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

/** Step 1 of the strip (also used standalone by R3, whose input must survive
 *  step 4 untouched). */
export const stripHtmlComments = (text) =>
  String(text ?? '').replace(/<!--[\s\S]*?-->/g, '');

/**
 * Six-step strip, in the normative order (spec: "Normalization runs before any
 * rule is evaluated"): 1. HTML comments, 2. unchecked task lines, 3. heading
 * lines, 4. digit-less `Closes #`, 5. `[x]` markers, 6. whitespace.
 *
 * It answers one question — "is anything left?" — and is never used to measure
 * how much was written: the policy has no minimum length anywhere.
 */
export const normalize = (text) =>
  stripHtmlComments(text)
    .replace(/^\s*(?:[-*+]\s+)?\[\s*\].*$/gm, '')
    .replace(/^#{1,6}\s.*$/gm, '')
    .replace(/Closes\s*#(?!\s*\d)/g, '')
    .replace(CHECKED_LINE, '')
    .replace(/\s+/g, ' ')
    .trim();

/**
 * Split the RAW body on its `##` headings — one regex scan, nothing else. The
 * split happens on the raw body because the strip deletes heading lines.
 *
 * - A section's content runs to the next heading of any level.
 * - First occurrence wins: a repeated canonical heading is ignored and its
 *   content is never merged into the first occurrence.
 * - Fence-blind by design: a `##` line inside a code fence still splits the
 *   document. That is the accepted regression of the reduced policy (spec:
 *   "Core sections are located by a single `##` heading scan"); do not
 *   reintroduce a fence mask.
 *
 * @param {string} body raw pull request body
 * @returns {Map<string, string>} canonical heading → raw section body
 */
export const splitSections = (body) => {
  const sections = new Map();
  const text = String(body ?? '');
  const headings = [...text.matchAll(/^(#{1,6})\s+(.*)$/gm)];
  for (const [index, [, level, title]] of headings.entries()) {
    const key = canonicalizeHeading(title);
    if (level !== '##' || sections.has(key)) continue;
    const start = headings[index].index + headings[index][0].length;
    const end = headings[index + 1]?.index ?? text.length;
    sections.set(key, text.slice(start, end));
  }
  return sections;
};

/** Count of checked task-list markers in a piece of text (R2c). */
export const countCheckedCheckboxes = (text) =>
  (String(text ?? '').match(CHECKED_LINE) ?? []).length;

/** Bot detection keys on the PR AUTHOR (stable), never on the trigger actor
 *  (design D6). A human editing a bot PR must not shift the exemption. */
export const isBotAuthor = (author) =>
  (typeof author === 'object' && author?.type === 'Bot') ||
  /\[bot\]$/i.test(String(author?.login ?? author ?? ''));

/**
 * Pure evaluation seam: text in, `{ verdict, failures, warnings }` out. No
 * `core`, no filesystem, no clock, no network.
 *
 * `EMPTY_BODY` is a diagnostic, not a gate of its own: R2a, R2b and R2c
 * already fail an empty body, so it never fires alone. It names the real cause
 * next to them, so the author sees why all three sections are missing instead
 * of reading three lines about one problem.
 */
export const evaluateBody = ({ body = '', author = null } = {}) => {
  const raw = String(body ?? '');
  const failures = [];
  const warnings = [];

  if (isBotAuthor(author)) {
    const reason = 'bot-authored pull request (exempt by policy)';
    return { verdict: 'skipped', bot: true, reason, failures, warnings };
  }

  const sections = splitSections(raw);
  for (const [rule, name, needsBox] of SECTION_RULES) {
    const key = canonicalizeHeading(name);
    if (!sections.has(key)) {
      failures.push({ rule, section: name, message: 'Section is missing' });
      continue;
    }
    const rawSection = sections.get(key);
    const filled = normalize(rawSection).length > 0;
    const boxed = needsBox && countCheckedCheckboxes(rawSection) > 0;
    if (!filled && !boxed) {
      failures.push({ rule, section: name, message: 'Section is empty' });
    }
  }

  if (normalize(raw).length === 0) {
    failures.push({ rule: 'EMPTY_BODY', section: 'body', message: EMPTY_MSG });
  }

  // R3 reads the COMMENT-STRIPPED body, never the stripped one: step 4 deletes
  // exactly the placeholder R3 exists to detect.
  if (PLACEHOLDER_CLOSES.test(stripHtmlComments(raw))) {
    failures.push({ rule: 'R3', section: 'body', message: CLOSES_MESSAGE });
  }

  return {
    verdict: failures.length > 0 ? 'fail' : 'pass',
    bot: false,
    failures,
    warnings,
  };
};

/**
 * Impure wrapper for `actions/github-script`. Reads the pull request from
 * `context.payload` — the body is NEVER interpolated into `run:` or `script:`
 * (design D12) — then publishes the Step Summary and fails the job on a policy
 * failure.
 *
 * D2 chose the summary as the only surface: there is no `report.json` and no
 * artifact. Any thrown error is still reported as a TOOLING failure so an
 * operator can tell a broken gate from an invalid body.
 */
export const evaluate = async ({ core, context } = {}) => {
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

    if (core?.summary && typeof core.summary.addRaw === 'function') {
      core.summary.addRaw(renderSummary(result));
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

    return result;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    core?.setFailed?.(
      `[pr-body-lint] TOOLING ERROR (not a policy violation): ${message}`
    );
    return { verdict: 'tooling-error', error: message };
  }
};

/**
 * The Step Summary is the only reporting surface (D2). Declared below the
 * `evaluate` seam on purpose: the policy-size metric slices at
 * `export const evaluate `, so the summary renderer must not count as policy
 * logic. Hoisting makes the order safe.
 */
function renderSummary(result) {
  const lines = [
    '## Governance: PR Body Lint',
    '',
    `**Verdict:** \`${result.verdict}\`${result.bot ? ` — ${result.reason}` : ''}`,
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
  lines.push(
    'Fix the body by **editing the pull request description**: "Re-run jobs" reuses the original payload and does not re-judge an edited body.'
  );
  return lines.join('\n');
}

export default { evaluate, evaluateBody, normalize, splitSections };
