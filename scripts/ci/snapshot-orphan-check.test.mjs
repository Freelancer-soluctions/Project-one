import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  checkOrphans,
  findSnapFiles,
  formatOrphans,
} from './snapshot-orphan-check.mjs';

describe('snapshot-orphan-check', () => {
  let tmp;

  beforeEach(() => {
    tmp = mkdtempSync(join(tmpdir(), 'snapshot-orphan-'));
  });

  afterEach(() => {
    rmSync(tmp, { recursive: true, force: true });
  });

  function seedModule(
    name,
    { snap = true, owner = true, matcher = true } = {}
  ) {
    const dir = join(
      tmp,
      'src',
      'modules',
      name,
      'components',
      '__snapshots__'
    );
    mkdirSync(dir, { recursive: true });
    if (snap) {
      writeFileSync(
        join(dir, `${name}.ui.test.jsx.snap`),
        '//JEST snapshot\nexports[`x`] = `y`;\n'
      );
    }
    if (owner) {
      const body = matcher
        ? `import { expect } from 'vitest';\nexpect(x).toMatchSnapshot();\n`
        : `import { expect } from 'vitest';\nexpect(x).toBe(1);\n`;
      writeFileSync(
        join(tmp, 'src', 'modules', name, 'components', `${name}.ui.test.jsx`),
        body
      );
    }
  }

  it('snapshot with live owner and matcher passes', () => {
    seedModule('alpha');
    expect(checkOrphans({ root: tmp, srcDir: 'src' })).toEqual([]);
  });

  it('snapshot without owner file fails, naming the .snap', () => {
    seedModule('beta', { owner: false });
    const orphans = checkOrphans({ root: tmp, srcDir: 'src' });
    expect(orphans).toHaveLength(1);
    expect(orphans[0].snap).toContain('beta.ui.test.jsx.snap');
    expect(orphans[0].reason).toBe('no owner file');
    const report = formatOrphans(orphans);
    expect(report).toContain('beta.ui.test.jsx.snap');
  });

  it('owner without snapshot matcher fails', () => {
    seedModule('gamma', { matcher: false });
    const orphans = checkOrphans({ root: tmp, srcDir: 'src' });
    expect(orphans).toHaveLength(1);
    expect(orphans[0].reason).toContain('no snapshot matcher');
  });

  it('owner with toMatchInlineSnapshot counts as a matcher', () => {
    const dir = join(
      tmp,
      'src',
      'modules',
      'delta',
      'components',
      '__snapshots__'
    );
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, 'delta.ui.test.jsx.snap'), 'exports[`x`] = `y`;\n');
    writeFileSync(
      join(tmp, 'src', 'modules', 'delta', 'components', 'delta.ui.test.jsx'),
      'expect(x).toMatchInlineSnapshot(`y`);\n'
    );
    expect(checkOrphans({ root: tmp, srcDir: 'src' })).toEqual([]);
  });

  it('findSnapFiles only collects .snap inside __snapshots__ dirs', () => {
    seedModule('eps');
    // Un .snap fuera de __snapshots__ NO se recoge.
    writeFileSync(
      join(tmp, 'src', 'modules', 'eps', 'components', 'loose.snap'),
      'x'
    );
    const snaps = findSnapFiles({ root: tmp, srcDir: 'src' });
    expect(snaps).toHaveLength(1);
    expect(snaps[0]).toContain('__snapshots__');
  });

  it('formatOrphans returns null when clean', () => {
    expect(formatOrphans([])).toBeNull();
  });
});
