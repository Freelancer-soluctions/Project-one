import { describe, it, expect, vi } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Tests of the PR body governance policy — change `pr-metadata-workflow`.
 *
 * Covers the normative behaviours of
 * `openspec/changes/pr-metadata-workflow/specs/pr-body-lint-governance/spec.md`:
 * the six-step normalization order, the per-section R2 thresholds calibrated
 * against the repository template, R3's comment-stripped evaluation, the
 * fence-aware and first-occurrence-wins section split, the author-based bot
 * skip, the report schema and the tooling-vs-policy failure split. The last
 * describe is the template lockstep test (design D11).
 */

import {
  normalize,
  splitSections,
  evaluateBody,
  evaluate,
  stripHtmlComments,
  canonicalizeHeading,
  isBotAuthor,
  buildReport,
  writeReport,
  REPORT_RELATIVE_PATH,
  REQUIRED_SECTIONS,
} from './pr-body-lint.mjs';

const REPO_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../..'
);
const TEMPLATE_PATH = path.join(REPO_ROOT, '.github/PULL_REQUEST_TEMPLATE.md');
const TEMPLATE = fs.readFileSync(TEMPLATE_PATH, 'utf8');

const filledTemplate = () => `## Summary

Adds the governance policy module for the PR body check and wires it into the
metadata workflow so a title or body edit re-validates without a push.

## Type / Scope

- [ ] Client (React/Vite)
- [x] CI/CD

## Related Issue

Closes #123

## How Has This Been Tested?

- [x] Integration tests

## Screenshots (if applicable)

## Pre-merge Checklist

- [x] PR title follows Conventional Commits format
`;

const ruleIds = (list) => list.map((f) => f.rule);

describe('normalize — six-step pipeline in normative order', () => {
  it('drops heading lines (step 3) so headings never count as content', () => {
    expect(normalize('## Summary\n\n')).toBe('');
    expect(normalize('# Summary\n\n### Deep heading\n')).toBe('');
  });

  it('drops unchecked task lines and keeps checked ones without the marker', () => {
    expect(normalize('- [ ] E2E tests (Playwright)')).toBe('');
    expect(normalize('- [x] Unit tests (vitest)')).toBe('Unit tests (vitest)');
  });

  it('strips HTML comments and never counts guidance text', () => {
    expect(normalize('<!-- Write a summary -->visible')).toBe('visible');
  });

  it('removes `Closes #` without digits but keeps `Closes #123` (step 4)', () => {
    expect(normalize('Closes #')).toBe('');
    expect(normalize('Closes #123')).toBe('Closes #123');
  });

  it('does not let step 5 re-inject checkbox markers into the measurement', () => {
    expect(normalize('fix: something\n\n- [x] checked label')).toBe(
      'fix: something checked label'
    );
  });

  it('collapses whitespace (step 6)', () => {
    expect(normalize('  a \n\t b   c  ')).toBe('a b c');
  });

  it('is deterministic: same input, identical output', () => {
    const body = filledTemplate();
    expect(normalize(body)).toBe(normalize(body));
  });
});

describe('splitSections — raw split, canonical keys', () => {
  it('maps canonicalized heading to the RAW section body', () => {
    const sections = splitSections(
      '## Summary\n\nRaw content here.\n\n## Next\n\nAfter\n'
    );
    expect(sections.get('summary')).toContain('Raw content here.');
    expect(sections.get('summary')).not.toContain('After');
  });

  it('closes a section at the next heading of ANY level', () => {
    const sections = splitSections(
      '## Summary\n\nbody\n\n### Sub\n\nsubbody\n'
    );
    expect(sections.get('summary').trim()).toBe('body');
    expect(sections.get('summary')).not.toContain('subbody');
  });

  it('treats a present-but-empty section as present with empty content', () => {
    const sections = splitSections(
      '## Related Issue\n\n## Summary\n\nlong enough\n'
    );
    expect(sections.has('related issue')).toBe(true);
    expect(sections.get('related issue').trim()).toBe('');
  });

  it('canonicalizes case and trailing punctuation', () => {
    expect(canonicalizeHeading('SUMMARY:')).toBe('summary');
    expect(canonicalizeHeading('  how has this been tested?  ')).toBe(
      'how has this been tested'
    );
  });

  it('treats `##` lines inside a fenced code block as content, never as a section boundary', () => {
    const body = [
      '## Summary',
      '',
      'Some summary text.',
      '',
      '```yaml',
      '## Not a heading',
      'key: value',
      '```',
      '',
      '## Related Issue',
      '',
      'Closes #123',
      '',
    ].join('\n');
    const sections = splitSections(body);
    // Exactly two sections — the fenced `## Not a heading` must not become a
    // phantom section between them.
    expect([...sections.keys()]).toEqual(['summary', 'related issue']);
    expect(sections.get('summary')).toContain('## Not a heading');
    expect(sections.get('summary')).toContain('key: value');
    expect(sections.has('not a heading')).toBe(false);
    expect(sections.get('related issue')).toContain('Closes #123');
  });

  it('unterminated fence is forgiving: no crash, and later `##` headings remain structure (a stray backtick never swallows the document)', () => {
    const body = [
      '## Summary',
      '',
      'A summary that is long enough to clear the twenty character floor.',
      '',
      '```yaml',
      '## Not a heading',
      '',
      '## Related Issue',
      '',
      'Closes #123',
      '',
    ].join('\n');
    const sections = splitSections(body);
    // Chosen behaviour: an opener with no closer never suppresses structure.
    // The fence state simply stops at the end of the document, so EVERY
    // heading after the stray opener — including `## Not a heading` — is
    // structure. What matters for the author: the real sections that follow
    // are still found (under fence-to-EOF semantics `related issue` would be
    // swallowed and this test would go red), so a stray backtick never
    // punishes the PR.
    expect(sections.get('summary')).toContain('```yaml');
    expect(sections.has('related issue')).toBe(true);
    expect(sections.get('related issue')).toContain('Closes #123');
    expect(sections.has('not a heading')).toBe(true);
  });
});

describe('evaluateBody — R1..R5 with severities', () => {
  it('empty body fails R1 (and only R1 among the R2 rules)', () => {
    const result = evaluateBody({ body: '' });
    expect(result.verdict).toBe('fail');
    expect(ruleIds(result.failures)).toContain('R1');
    expect(result.metrics.meaningfulChars).toBe(0);
    // R4/R5 are warnings and must not appear as failures.
    expect(ruleIds(result.failures)).not.toContain('R4');
    expect(ruleIds(result.failures)).not.toContain('R5');
  });

  it('untouched template normalizes to zero meaningful chars and fails', () => {
    const result = evaluateBody({ body: TEMPLATE });
    expect(normalize(TEMPLATE)).toBe('');
    expect(result.metrics.meaningfulChars).toBe(0);
    expect(result.verdict).toBe('fail');
    expect(ruleIds(result.failures)).toContain('R1');
  });

  it('the template GUIDANCE COMMENT never triggers R3 (comment-stripped input)', () => {
    expect(stripHtmlComments(TEMPLATE)).not.toContain('Closes #<number>');
    // Only the guidance comment mentions a placeholder → R3 must not fire.
    const onlyComment = '<!-- Required. Use "Closes #<number>" to close. -->\n';
    expect(ruleIds(evaluateBody({ body: onlyComment }).failures)).not.toContain(
      'R3'
    );
  });

  it('the template VISIBLE placeholder (`Closes #`) does trigger R3', () => {
    const result = evaluateBody({ body: TEMPLATE });
    expect(ruleIds(result.failures)).toContain('R3');
  });

  it('filled template passes every failure rule', () => {
    const result = evaluateBody({ body: filledTemplate() });
    expect(result.failures).toEqual([]);
    expect(result.verdict).toBe('pass');
    // Warnings may exist, but they never fail the job.
    expect(result.warnings.every((w) => w.rule === 'R5')).toBe(true);
  });

  it('hollow Summary fails R2a with the measured value', () => {
    const body = `## Summary\n\nshort\n\n## Related Issue\n\nCloses #123\n\n## How Has This Been Tested?\n\n- [x] Unit tests (vitest)\n`;
    const result = evaluateBody({ body });
    const r2a = result.failures.find((f) => f.rule === 'R2a');
    expect(r2a).toBeDefined();
    expect(r2a.section).toBe('Summary');
    expect(r2a.measured).toBe(5);
    expect(result.verdict).toBe('fail');
  });

  it('first occurrence wins: an empty second `## Summary` is ignored — R2a passes on the first one and metrics.duplicateSections reports it', () => {
    const body = [
      '## Summary',
      '',
      'A summary that is long enough to clear the twenty character floor.',
      '',
      '## Related Issue',
      '',
      'Closes #123',
      '',
      '## How Has This Been Tested?',
      '',
      '- [x] Integration tests',
      '',
      '## Summary',
      '',
    ].join('\n');
    const result = evaluateBody({ body });
    // Under last-wins the trailing empty `## Summary` would overwrite the
    // first and R2a would fail with 0 characters.
    expect(ruleIds(result.failures)).not.toContain('R2a');
    expect(result.verdict).toBe('pass');
    expect(result.metrics.duplicateSections).toContain('Summary');
  });

  it('first occurrence wins: with a short first `## Summary` and a long duplicate, R2a measures the FIRST (duplicates are never merged)', () => {
    const body = [
      '## Summary',
      '',
      'short',
      '',
      '## Summary',
      '',
      'A much longer second summary body that would clear the twenty character floor if duplicates were merged.',
      '',
      '## Related Issue',
      '',
      'Closes #123',
      '',
      '## How Has This Been Tested?',
      '',
      '- [x] Integration tests',
      '',
    ].join('\n');
    const result = evaluateBody({ body });
    const r2a = result.failures.find((f) => f.rule === 'R2a');
    expect(r2a).toBeDefined();
    expect(r2a.measured).toBe(5);
    expect(result.metrics.duplicateSections).toContain('Summary');
  });

  it('recognizes heading case and punctuation variants as the same section', () => {
    const body = `## SUMMARY:\n\nA summary that is long enough to clear the floor.\n\n## related issue\n\nCloses #123\n\n## How Has This Been Tested?\n\n- [x] Integration tests\n`;
    expect(evaluateBody({ body }).failures).toEqual([]);
  });

  it('does not leak content between sections', () => {
    const body = `## Summary\n\nA long and complete summary of the change and its motivation.\n\n## Related Issue\n\n## How Has This Been Tested?\n\n- [x] Integration tests\n`;
    const result = evaluateBody({ body });
    const r2b = result.failures.find((f) => f.rule === 'R2b');
    expect(r2b).toBeDefined();
    expect(r2b.measured).toBe(0);
  });

  it('reports a MISSING section differently from an empty one', () => {
    const body = `## Summary\n\nA long and complete summary of the change here.\n\n## How Has This Been Tested?\n\n- [x] Integration tests\n`;
    const result = evaluateBody({ body });
    const r2b = result.failures.find((f) => f.rule === 'R2b');
    expect(r2b.message).toMatch(/missing/i);
  });

  it('Related Issue containing only `Closes #123` passes R2b (issue reference)', () => {
    const body = `## Summary\n\nA long and complete summary of the change and why it exists.\n\n## Related Issue\n\nCloses #123\n\n## How Has This Been Tested?\n\n- [x] Integration tests\n`;
    const result = evaluateBody({ body });
    expect(ruleIds(result.failures)).not.toContain('R2b');
    expect(ruleIds(result.failures)).not.toContain('R3');
    expect(result.verdict).toBe('pass');
  });

  it('Related Issue with a bare `Closes #` fails BOTH R2b and R3', () => {
    const body = `## Summary\n\nA long and complete summary of the change and why it exists.\n\n## Related Issue\n\nCloses #\n\n## How Has This Been Tested?\n\n- [x] Integration tests\n`;
    const result = evaluateBody({ body });
    const ids = ruleIds(result.failures);
    expect(ids).toContain('R2b');
    expect(ids).toContain('R3');
    expect(result.verdict).toBe('fail');
  });

  it('a single checked test box satisfies R2c, even though the label is short', () => {
    const body = `## Summary\n\nA long and complete summary of the change and why it exists.\n\n## Related Issue\n\nCloses #123\n\n## How Has This Been Tested?\n\n- [x] Integration tests\n`;
    expect(ruleIds(evaluateBody({ body }).failures)).not.toContain('R2c');
  });

  it('a checked box in ANOTHER section does not satisfy R2c', () => {
    const body = `## Summary\n\nA long and complete summary of the change and why it exists.\n\n## Type / Scope\n\n- [x] CI/CD\n\n## Related Issue\n\nCloses #123\n\n## How Has This Been Tested?\n\n`;
    const result = evaluateBody({ body });
    const r2c = result.failures.find((f) => f.rule === 'R2c');
    expect(r2c).toBeDefined();
    expect(r2c.section).toBe('How Has This Been Tested?');
  });

  it('unchecked boxes neither satisfy R2c nor satisfy R4', () => {
    const body = `## Summary\n\nA long and complete summary of the change and why it exists.\n\n## Related Issue\n\nCloses #123\n\n## How Has This Been Tested?\n\n- [ ] Unit tests (vitest)\n- [ ] Integration tests\n`;
    const result = evaluateBody({ body });
    expect(ruleIds(result.failures)).toContain('R2c');
    expect(result.warnings.map((w) => w.rule)).toContain('R4');
    expect(result.verdict).toBe('fail');
  });

  it('R4 and R5 never fail a body that satisfies the failure rules', () => {
    const body = `## Summary\n\nA long and complete summary of the change and why it exists.\n\n## Related Issue\n\nDiscussed offline, no tracker issue.\n\n## How Has This Been Tested?\n\nRan the server suite and clicked through the flow manually.\n`;
    const result = evaluateBody({ body });
    expect(result.verdict).toBe('pass');
    const warnIds = result.warnings.map((w) => w.rule);
    expect(warnIds).toContain('R4');
    expect(warnIds).toContain('R5');
  });

  it('is deterministic: the same body yields identical verdict and metrics', () => {
    const body = filledTemplate();
    const a = evaluateBody({ body });
    const b = evaluateBody({ body });
    expect({ ...a, warnings: a.warnings }).toEqual({
      ...b,
      warnings: b.warnings,
    });
  });
});

describe('bot skip — by author, never by actor', () => {
  it('skips a bot-authored pull request (type Bot)', () => {
    const result = evaluateBody({
      body: '',
      author: { type: 'Bot', login: 'dependabot[bot]' },
    });
    expect(result.verdict).toBe('skipped');
    expect(result.bot).toBe(true);
  });

  it('skips when only the login marks the bot', () => {
    expect(
      evaluateBody({ body: 'x', author: { login: 'github-actions[bot]' } })
        .verdict
    ).toBe('skipped');
  });

  it('a human editing a bot PR does not shift the exemption (keyed on author)', () => {
    // `evaluateBody` only ever sees the AUTHOR. The same PR, edited by a human,
    // still carries a bot author — so the verdict must not change.
    const editedByHuman = evaluateBody({
      body: '',
      author: {
        type: 'Bot',
        login: 'dependabot[bot]',
        editedBy: 'human-maintainer',
      },
    });
    expect(editedByHuman.verdict).toBe('skipped');
  });

  it('a human login containing "bot" as a substring is NOT exempt', () => {
    expect(isBotAuthor({ type: 'User', login: 'robotics-jane' })).toBe(false);
    const result = evaluateBody({
      body: filledTemplate(),
      author: { type: 'User', login: 'robotics-jane' },
    });
    expect(result.verdict).toBe('pass');
    expect(result.bot).toBe(false);
  });

  it('a human-authored PR with an empty body fails (no exemption)', () => {
    const result = evaluateBody({
      body: '',
      author: { type: 'User', login: 'human' },
    });
    expect(result.verdict).toBe('fail');
  });
});

describe('report schema and evaluate() wrapper', () => {
  const fakeCore = () => ({
    setFailed: vi.fn(),
    summary: Object.assign(Object.create(null), {
      addRaw: vi.fn().mockReturnThis(),
      write: vi.fn().mockResolvedValue(undefined),
    }),
  });

  const fakeContext = (pr) => ({ payload: { pull_request: pr } });

  const tmpCwd = () => fs.mkdtempSync(path.join(os.tmpdir(), 'pr-body-lint-'));

  it('buildReport carries schemaVersion 1, identity, policy, metrics and verdict', () => {
    const result = evaluateBody({ body: filledTemplate() });
    const report = buildReport({
      pr: {
        number: 7,
        author: 'human',
        draft: false,
        headSha: 'aaa',
        baseSha: 'bbb',
      },
      result,
      now: new Date('2026-10-20T00:00:00.000Z'),
    });
    expect(report).toMatchObject({
      schemaVersion: 1,
      generatedAt: '2026-10-20T00:00:00.000Z',
      pr: {
        number: 7,
        author: 'human',
        draft: false,
        headSha: 'aaa',
        baseSha: 'bbb',
      },
      verdict: 'pass',
      metrics: {
        bodyChars: expect.any(Number),
        meaningfulChars: expect.any(Number),
        checkedCheckboxes: expect.any(Number),
        sectionsFound: expect.any(Array),
        duplicateSections: expect.any(Array),
      },
      policy: {
        id: 'pr-body-lint-governance',
        requiredSections: REQUIRED_SECTIONS,
      },
    });
    // The report must never echo the body itself.
    expect(JSON.stringify(report)).not.toContain('governance policy module');
  });

  it('writeReport creates .tmp/pr-body-lint/report.json under the given cwd', () => {
    const cwd = tmpCwd();
    const target = writeReport(
      buildReport({ pr: {}, result: evaluateBody({ body: '' }) }),
      cwd
    );
    expect(target).toBe(path.join(cwd, REPORT_RELATIVE_PATH));
    const parsed = JSON.parse(fs.readFileSync(target, 'utf8'));
    expect(parsed.schemaVersion).toBe(1);
    fs.rmSync(cwd, { recursive: true, force: true });
  });

  it('evaluate writes the report on a PASSING evaluation and does not fail', async () => {
    const cwd = tmpCwd();
    const core = fakeCore();
    const context = fakeContext({
      number: 1,
      body: filledTemplate(),
      user: { type: 'User', login: 'human' },
      draft: false,
      head: { sha: 'aaa' },
      base: { sha: 'bbb' },
    });

    const outcome = await evaluate({ core, context, cwd });

    expect(outcome.verdict).toBe('pass');
    expect(core.setFailed).not.toHaveBeenCalled();
    const parsed = JSON.parse(
      fs.readFileSync(path.join(cwd, REPORT_RELATIVE_PATH), 'utf8')
    );
    expect(parsed.verdict).toBe('pass');
    expect(core.summary.addRaw).toHaveBeenCalled();
    fs.rmSync(cwd, { recursive: true, force: true });
  });

  it('evaluate writes the report on a FAILING evaluation and calls setFailed with the rules', async () => {
    const cwd = tmpCwd();
    const core = fakeCore();
    const context = fakeContext({
      number: 2,
      body: '',
      user: { type: 'User', login: 'human' },
      draft: false,
      head: { sha: 'aaa' },
      base: { sha: 'bbb' },
    });

    const outcome = await evaluate({ core, context, cwd });

    expect(outcome.verdict).toBe('fail');
    expect(core.setFailed).toHaveBeenCalledOnce();
    expect(core.setFailed.mock.calls[0][0]).toMatch(/R1/);
    expect(core.setFailed.mock.calls[0][0]).not.toMatch(/TOOLING ERROR/);
    const parsed = JSON.parse(
      fs.readFileSync(path.join(cwd, REPORT_RELATIVE_PATH), 'utf8')
    );
    expect(parsed.verdict).toBe('fail');
    expect(parsed.failures.map((f) => f.rule)).toContain('R1');
    fs.rmSync(cwd, { recursive: true, force: true });
  });

  it('a bot author makes evaluate() succeed without failing (skip by author)', async () => {
    const cwd = tmpCwd();
    const core = fakeCore();
    const context = fakeContext({
      number: 3,
      body: '',
      user: { type: 'Bot', login: 'dependabot[bot]' },
      draft: false,
      head: { sha: 'aaa' },
      base: { sha: 'bbb' },
    });

    const outcome = await evaluate({ core, context, cwd });
    expect(outcome.verdict).toBe('skipped');
    expect(core.setFailed).not.toHaveBeenCalled();
    fs.rmSync(cwd, { recursive: true, force: true });
  });

  it('a report WRITE error fails closed as a TOOLING error, not a policy violation', async () => {
    // Point cwd at a path that cannot become a directory: mkdirSync throws.
    const blocker = tmpCwd();
    const asFile = path.join(blocker, 'not-a-dir');
    fs.writeFileSync(asFile, 'x', 'utf8');

    const core = fakeCore();
    const context = fakeContext({
      number: 4,
      body: filledTemplate(),
      user: { type: 'User', login: 'human' },
      draft: false,
      head: { sha: 'aaa' },
      base: { sha: 'bbb' },
    });

    const outcome = await evaluate({ core, context, cwd: asFile });

    expect(outcome.verdict).toBe('tooling-error');
    expect(core.setFailed).toHaveBeenCalledOnce();
    expect(core.setFailed.mock.calls[0][0]).toMatch(/TOOLING ERROR/);
    expect(core.setFailed.mock.calls[0][0]).not.toMatch(/R1|R2|R3/);
    fs.rmSync(blocker, { recursive: true, force: true });
  });

  it('a missing pull_request payload fails as a TOOLING error', async () => {
    const core = fakeCore();
    const outcome = await evaluate({ core, context: { payload: {} } });
    expect(outcome.verdict).toBe('tooling-error');
    expect(core.setFailed.mock.calls[0][0]).toMatch(/TOOLING ERROR/);
  });
});

describe('template lockstep (design D11)', () => {
  const templateHeadings = TEMPLATE.split(/\r?\n/)
    .filter((line) => /^##\s+/.test(line))
    .map((line) => canonicalizeHeading(line.replace(/^##\s+/, '')));

  // A lockstep failure must name the FIX, not only the mismatch: the template
  // and the policy are updated in the SAME COMMIT, and adding a section
  // touches both files plus the expected list asserted below.
  const LOCKSTEP_FIX =
    'Fix: `.github/PULL_REQUEST_TEMPLATE.md` and the policy ' +
    '(`REQUIRED_SECTIONS` in scripts/ci/pr-body-lint.mjs) must be updated in ' +
    'the SAME COMMIT. Adding a section requires touching both files plus the ' +
    'expected list asserted by the test ' +
    '"the policy has exactly the three required sections (no silent additions)".';

  it.each(REQUIRED_SECTIONS)(
    'required policy section "%s" exists as a template heading',
    (section) => {
      const canonical = canonicalizeHeading(section);
      if (!templateHeadings.includes(canonical)) {
        throw new Error(
          `Lockstep drift: the policy requires section "${section}" ` +
            `(canonical "${canonical}") but the pull request template ` +
            `(.github/PULL_REQUEST_TEMPLATE.md) has no heading that ` +
            `canonicalizes to it. Template headings: ` +
            `[${templateHeadings.join(', ')}]. ${LOCKSTEP_FIX}`
        );
      }
    }
  );

  it('the policy has exactly the three required sections (no silent additions)', () => {
    const expected = ['Summary', 'Related Issue', 'How Has This Been Tested?'];
    const added = REQUIRED_SECTIONS.filter((s) => !expected.includes(s));
    const removed = expected.filter((s) => !REQUIRED_SECTIONS.includes(s));
    if (added.length > 0 || removed.length > 0) {
      throw new Error(
        `Lockstep drift: the policy section list changed — ` +
          `added: [${added.join(', ')}], removed: [${removed.join(', ')}]. ` +
          LOCKSTEP_FIX
      );
    }
  });
});
