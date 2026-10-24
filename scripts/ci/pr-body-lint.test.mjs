import { describe, it, expect, vi } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Tests of the PR body governance policy — change
 * `simplify-pr-body-lint-template`.
 *
 * Covers the normative behaviours of
 * `openspec/changes/simplify-pr-body-lint-template/specs/pr-body-lint-governance/spec.md`:
 * the six-step strip (which only answers "is anything left?"), the single `##`
 * heading scan (fence-blind, first occurrence wins), the `EMPTY_BODY`
 * diagnostic, R2a/R2b/R2c/R3 as the only rules, the author-based bot skip, and
 * the tooling-vs-policy failure split. The last describe is the template
 * lockstep test (design D11).
 */

import {
  normalize,
  splitSections,
  evaluateBody,
  evaluate,
  stripHtmlComments,
  canonicalizeHeading,
  isBotAuthor,
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

- [x] Documentation updated (if applicable)
`;

const ruleIds = (list) => list.map((f) => f.rule);

describe('normalize — the strip answers "is anything left?"', () => {
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
});

describe('splitSections — a single `##` heading scan', () => {
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

  it('is fence-blind: a `##` line inside a code fence splits the document', () => {
    const body = [
      '## Summary',
      '',
      'Some summary text.',
      '',
      '```yaml',
      '## Not a heading inside a fence',
      'key: value',
      '```',
      '',
      '## Related Issue',
      '',
      'Closes #123',
      '',
    ].join('\n');
    const sections = splitSections(body);
    // The accepted regression of the reduced policy: no fence mask, so the
    // fenced line is a section boundary and the lines after it belong to it.
    expect(sections.has('not a heading inside a fence')).toBe(true);
    expect(sections.get('summary')).not.toContain('key: value');
    // A later real heading still locates its own section.
    expect(sections.get('related issue')).toContain('Closes #123');
  });
});

describe('evaluateBody — EMPTY_BODY, R2a, R2b, R2c and R3', () => {
  it('empty body fails with the EMPTY_BODY diagnostic', () => {
    const result = evaluateBody({ body: '' });
    expect(result.verdict).toBe('fail');
    expect(ruleIds(result.failures)).toContain('EMPTY_BODY');
    expect(result.warnings).toEqual([]);
  });

  it('untouched template strips to nothing and fails with EMPTY_BODY', () => {
    const result = evaluateBody({ body: TEMPLATE });
    expect(normalize(TEMPLATE)).toBe('');
    expect(ruleIds(result.failures)).toContain('EMPTY_BODY');
    expect(result.verdict).toBe('fail');
  });

  it('one character of authored text clears the emptiness diagnostic', () => {
    const body = `## Summary\n\nn/a\n\n## Related Issue\n\nNo linked issue: tooling work.\n\n## How Has This Been Tested?\n\nRan the scripts suite.\n`;
    const result = evaluateBody({ body });
    expect(ruleIds(result.failures)).not.toContain('EMPTY_BODY');
    // No length rule exists that could fail a short Summary.
    expect(ruleIds(result.failures)).not.toContain('R2a');
    expect(result.verdict).toBe('pass');
  });

  it('the template GUIDANCE COMMENT never triggers R3 (comment-stripped input)', () => {
    expect(stripHtmlComments(TEMPLATE)).not.toContain('Closes #<number>');
    const onlyComment = '<!-- Required. Use "Closes #<number>" to close. -->\n';
    expect(ruleIds(evaluateBody({ body: onlyComment }).failures)).not.toContain(
      'R3'
    );
  });

  it('the template VISIBLE placeholder (`Closes #`) does trigger R3', () => {
    const result = evaluateBody({ body: TEMPLATE });
    expect(ruleIds(result.failures)).toContain('R3');
  });

  it('filled template passes every failure rule with no warnings', () => {
    const result = evaluateBody({ body: filledTemplate() });
    expect(result.failures).toEqual([]);
    expect(result.verdict).toBe('pass');
    // `warnings` stays in the shape but no rule can populate it.
    expect(result.warnings).toEqual([]);
  });

  it('hollow Summary fails R2a without any character floor', () => {
    const body = `## Summary\n\n<!-- TODO: explain the change -->\n\n## Related Issue\n\nCloses #123\n\n## How Has This Been Tested?\n\n- [x] Unit tests (vitest)\n`;
    const result = evaluateBody({ body });
    const r2a = result.failures.find((f) => f.rule === 'R2a');
    expect(r2a).toBeDefined();
    expect(r2a.section).toBe('Summary');
    expect(result.verdict).toBe('fail');
  });

  it('first occurrence wins: a duplicated empty Summary is ignored', () => {
    const body = [
      '## Summary',
      '',
      'A real summary of the change.',
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
    expect(ruleIds(result.failures)).not.toContain('R2a');
    expect(result.verdict).toBe('pass');
  });

  it('first occurrence wins: an empty first `## Summary` is never rescued by a long duplicate', () => {
    const body = [
      '## Summary',
      '',
      '<!-- TODO -->',
      '',
      '## Summary',
      '',
      'A much longer second summary that would pass if duplicates were merged.',
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
    expect(ruleIds(result.failures)).toContain('R2a');
  });

  it('recognizes heading case and punctuation variants as the same section', () => {
    const body = `## SUMMARY:\n\nA summary of the change.\n\n## related issue\n\nCloses #123\n\n## How Has This Been Tested?\n\n- [x] Integration tests\n`;
    expect(evaluateBody({ body }).failures).toEqual([]);
  });

  it('does not leak content between sections', () => {
    const body = `## Summary\n\nA complete summary of the change and its motivation.\n\n## Related Issue\n\n## How Has This Been Tested?\n\n- [x] Integration tests\n`;
    const r2b = evaluateBody({ body }).failures.find((f) => f.rule === 'R2b');
    expect(r2b).toBeDefined();
    expect(r2b.section).toBe('Related Issue');
  });

  it('reports a MISSING section differently from an empty one', () => {
    const body = `## Summary\n\nA complete summary of the change here.\n\n## How Has This Been Tested?\n\n- [x] Integration tests\n`;
    const r2b = evaluateBody({ body }).failures.find((f) => f.rule === 'R2b');
    expect(r2b.message).toMatch(/missing/i);
  });

  it('Related Issue containing only `Closes #123` passes R2b', () => {
    const body = `## Summary\n\nA summary of the change and why it exists.\n\n## Related Issue\n\nCloses #123\n\n## How Has This Been Tested?\n\n- [x] Integration tests\n`;
    const result = evaluateBody({ body });
    expect(ruleIds(result.failures)).not.toContain('R2b');
    expect(ruleIds(result.failures)).not.toContain('R3');
    expect(result.verdict).toBe('pass');
  });

  it('Related Issue with a bare `Closes #` fails BOTH R2b and R3', () => {
    const body = `## Summary\n\nA summary of the change and why it exists.\n\n## Related Issue\n\nCloses #\n\n## How Has This Been Tested?\n\n- [x] Integration tests\n`;
    const result = evaluateBody({ body });
    const ids = ruleIds(result.failures);
    expect(ids).toContain('R2b');
    expect(ids).toContain('R3');
    expect(result.verdict).toBe('fail');
  });

  it('a single checked test box satisfies R2c', () => {
    const body = `## Summary\n\nA summary of the change and why it exists.\n\n## Related Issue\n\nCloses #123\n\n## How Has This Been Tested?\n\n- [x] Integration tests\n`;
    expect(ruleIds(evaluateBody({ body }).failures)).not.toContain('R2c');
  });

  it('a bare checked box with no label satisfies R2c (raw section text, not the strip)', () => {
    // Stripping erases a bare `- [x]` (no label survives), so R2c can only
    // pass if the checked box is counted on the RAW section text.
    const body = `## Summary\n\nA summary of the change and why it exists.\n\n## Related Issue\n\nCloses #123\n\n## How Has This Been Tested?\n\n- [x]\n`;
    expect(ruleIds(evaluateBody({ body }).failures)).not.toContain('R2c');
  });

  it('a checked box in ANOTHER section does not satisfy R2c', () => {
    const body = `## Summary\n\nA summary of the change and why it exists.\n\n## Type / Scope\n\n- [x] CI/CD\n\n## Related Issue\n\nCloses #123\n\n## How Has This Been Tested?\n\n`;
    const r2c = evaluateBody({ body }).failures.find((f) => f.rule === 'R2c');
    expect(r2c).toBeDefined();
    expect(r2c.section).toBe('How Has This Been Tested?');
  });

  it('unchecked boxes do not satisfy R2c', () => {
    const body = `## Summary\n\nA summary of the change and why it exists.\n\n## Related Issue\n\nCloses #123\n\n## How Has This Been Tested?\n\n- [ ] Unit tests (vitest)\n- [ ] Integration tests\n`;
    const result = evaluateBody({ body });
    expect(ruleIds(result.failures)).toContain('R2c');
    expect(result.verdict).toBe('fail');
  });

  it('is deterministic: the same body yields an identical result', () => {
    const body = filledTemplate();
    expect(evaluateBody({ body })).toEqual(evaluateBody({ body }));
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

describe('evaluate() wrapper — the Step Summary is the only surface (D2)', () => {
  const fakeCore = () => ({
    setFailed: vi.fn(),
    summary: Object.assign(Object.create(null), {
      addRaw: vi.fn().mockReturnThis(),
      write: vi.fn().mockResolvedValue(undefined),
    }),
  });

  const fakeContext = (pr) => ({ payload: { pull_request: pr } });

  it('a PASSING evaluation publishes the summary and does not fail', async () => {
    const core = fakeCore();
    const context = fakeContext({
      number: 1,
      body: filledTemplate(),
      user: { type: 'User', login: 'human' },
      draft: false,
      head: { sha: 'aaa' },
      base: { sha: 'bbb' },
    });

    const outcome = await evaluate({ core, context });

    expect(outcome.verdict).toBe('pass');
    expect(core.setFailed).not.toHaveBeenCalled();
    // The summary is the reporting surface now: the verdict travels with it.
    expect(core.summary.addRaw).toHaveBeenCalledOnce();
    expect(core.summary.addRaw.mock.calls[0][0]).toMatch(/Verdict.*pass/);
  });

  it('a FAILING evaluation calls setFailed naming the rule and shows it in the summary', async () => {
    const core = fakeCore();
    const context = fakeContext({
      number: 2,
      body: '',
      user: { type: 'User', login: 'human' },
      draft: false,
      head: { sha: 'aaa' },
      base: { sha: 'bbb' },
    });

    const outcome = await evaluate({ core, context });

    expect(outcome.verdict).toBe('fail');
    expect(core.setFailed).toHaveBeenCalledOnce();
    expect(core.setFailed.mock.calls[0][0]).toMatch(/EMPTY_BODY/);
    expect(core.setFailed.mock.calls[0][0]).not.toMatch(/TOOLING ERROR/);
    expect(core.summary.addRaw.mock.calls[0][0]).toMatch(/EMPTY_BODY/);
  });

  it('a bot author makes evaluate() succeed without failing (skip by author)', async () => {
    const core = fakeCore();
    const context = fakeContext({
      number: 3,
      body: '',
      user: { type: 'Bot', login: 'dependabot[bot]' },
      draft: false,
      head: { sha: 'aaa' },
      base: { sha: 'bbb' },
    });

    const outcome = await evaluate({ core, context });
    expect(outcome.verdict).toBe('skipped');
    expect(core.setFailed).not.toHaveBeenCalled();
  });

  it('a SUMMARY write error fails closed as a TOOLING error, not a policy violation', async () => {
    const core = fakeCore();
    core.summary.write.mockRejectedValueOnce(new Error('disk full'));
    const context = fakeContext({
      number: 4,
      body: filledTemplate(),
      user: { type: 'User', login: 'human' },
      draft: false,
      head: { sha: 'aaa' },
      base: { sha: 'bbb' },
    });

    const outcome = await evaluate({ core, context });

    expect(outcome.verdict).toBe('tooling-error');
    expect(core.setFailed).toHaveBeenCalledOnce();
    expect(core.setFailed.mock.calls[0][0]).toMatch(/TOOLING ERROR/);
    expect(core.setFailed.mock.calls[0][0]).not.toMatch(/EMPTY_BODY|R2|R3/);
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
