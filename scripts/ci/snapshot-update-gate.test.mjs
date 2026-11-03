import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  runGate,
  scanPackageScripts,
  scanWorkflowYaml,
  extractRunBlocks,
} from './snapshot-update-gate.mjs';

describe('snapshot-update-gate', () => {
  let tmp;

  beforeEach(() => {
    tmp = mkdtempSync(join(tmpdir(), 'snapshot-gate-'));
  });

  afterEach(() => {
    rmSync(tmp, { recursive: true, force: true });
  });

  describe('scanPackageScripts', () => {
    it('negative: --max-warnings and -url do not match', () => {
      const findings = scanPackageScripts(
        {
          scripts: {
            lint: 'eslint . --max-warnings 0',
            fetch: 'curl -url http://x',
          },
        },
        { fileName: 'package.json' }
      );
      expect(findings).toEqual([]);
    });

    it('positive: -u in an npm script matches', () => {
      const findings = scanPackageScripts(
        { scripts: { test: 'vitest run -u' } },
        { fileName: 'package.json' }
      );
      expect(findings).toHaveLength(1);
      expect(findings[0].where).toContain('scripts["test"]');
    });

    it('positive: --update and updateSnapshots match', () => {
      const findings = scanPackageScripts(
        { scripts: { a: 'vitest --update', b: 'node --updateSnapshots x' } },
        { fileName: 'package.json' }
      );
      expect(findings).toHaveLength(2);
    });

    it('positive: bare -u after npm run matches', () => {
      const findings = scanPackageScripts(
        { scripts: { t: 'npm run test -- -u' } },
        { fileName: 'package.json' }
      );
      expect(findings).toHaveLength(1);
    });

    it('allowlist: test:snapshot and test:snapshot:refresh are exempt', () => {
      const findings = scanPackageScripts(
        {
          scripts: {
            'test:snapshot': 'vitest run -u --config vitest.config.js',
            'test:snapshot:refresh': 'vitest run -u --update',
          },
        },
        { fileName: 'apps/client/package.json' }
      );
      expect(findings).toEqual([]);
    });

    it('allowlist is exact: a renamed script is NOT exempt', () => {
      const findings = scanPackageScripts(
        { scripts: { 'test:snapshot:ci': 'vitest run -u' } },
        { fileName: 'package.json' }
      );
      expect(findings).toHaveLength(1);
    });
  });

  describe('extractRunBlocks', () => {
    it('extracts inline run: values', () => {
      const blocks = extractRunBlocks(
        'jobs:\n  a:\n    steps:\n      - run: npm test\n      - run: npm run lint\n'
      );
      expect(blocks).toHaveLength(2);
      expect(blocks[0].text).toBe('npm test');
    });

    it('extracts multiline run: blocks (| and >-)', () => {
      const yaml = [
        '  steps:',
        '    - run: |',
        '        npm test',
        '        npx vitest -u',
        '    - run: >-',
        '        npm run build',
      ].join('\n');
      const blocks = extractRunBlocks(yaml);
      expect(blocks.map((b) => b.text)).toEqual([
        'npm test',
        'npx vitest -u',
        'npm run build',
      ]);
    });

    it('ignores non-run lines and YAML comments inside blocks', () => {
      const yaml = [
        '  steps:',
        '    - name: x',
        '      # run: vitest -u (comment — not a step)',
        '      run: npm test',
      ].join('\n');
      const blocks = extractRunBlocks(yaml);
      expect(blocks.map((b) => b.text)).toEqual(['npm test']);
    });
  });

  describe('scanWorkflowYaml', () => {
    it('negative: -url and date -u in run: steps do not match', () => {
      const yaml = [
        'steps:',
        '  - run: curl -url http://example.com',
        '  - run: SINCE=$(date -u -d "3 days ago" +%Y-%m-%dT%H:%M:%SZ)',
      ].join('\n');
      expect(scanWorkflowYaml(yaml, { fileName: 'wf.yml' })).toEqual([]);
    });

    it('positive: -u inside a multiline run: block matches', () => {
      const yaml = ['  - run: |', '      npm ci', '      vitest run -u'].join(
        '\n'
      );
      const findings = scanWorkflowYaml(yaml, { fileName: 'wf.yml' });
      expect(findings).toHaveLength(1);
      expect(findings[0].where).toContain('run:');
    });

    it('negative: -u in a YAML comment outside run: is ignored', () => {
      const yaml = ['# vitest -u here', '  - run: npm test'].join('\n');
      expect(scanWorkflowYaml(yaml, { fileName: 'wf.yml' })).toEqual([]);
    });
  });

  describe('runGate (filesystem fixtures)', () => {
    it('clean repo: exit 0 findings empty', () => {
      writeFileSync(
        join(tmp, 'package.json'),
        JSON.stringify({ scripts: { test: 'vitest run' } })
      );
      mkdirSync(join(tmp, 'apps', 'client'), { recursive: true });
      writeFileSync(
        join(tmp, 'apps', 'client', 'package.json'),
        JSON.stringify({ scripts: { 'test:snapshot': 'vitest -u' } })
      );
      mkdirSync(join(tmp, '.github', 'workflows'), { recursive: true });
      writeFileSync(
        join(tmp, '.github', 'workflows', 'ci.yml'),
        'jobs:\n  a:\n    steps:\n      - run: npm test\n'
      );
      expect(runGate({ root: tmp })).toEqual([]);
    });

    it('positive in workflow run: step is found and named', () => {
      writeFileSync(join(tmp, 'package.json'), '{}');
      mkdirSync(join(tmp, '.github', 'workflows'), { recursive: true });
      writeFileSync(
        join(tmp, '.github', 'workflows', 'bad.yml'),
        'steps:\n  - run: npm run test:snapshot:refresh --workspace=apps/client\n  - run: vitest -u\n'
      );
      const findings = runGate({ root: tmp });
      expect(findings).toHaveLength(1);
      expect(findings[0].file).toContain('bad.yml');
      expect(findings[0].line).toContain('vitest -u');
    });

    it('positive in a workspace package.json script is found', () => {
      writeFileSync(join(tmp, 'package.json'), '{}');
      mkdirSync(join(tmp, 'apps', 'server'), { recursive: true });
      writeFileSync(
        join(tmp, 'apps', 'server', 'package.json'),
        JSON.stringify({ scripts: { test: 'vitest run --update' } })
      );
      const findings = runGate({ root: tmp });
      expect(findings).toHaveLength(1);
      expect(findings[0].file).toContain('apps');
      expect(findings[0].where).toContain('scripts["test"]');
    });

    it('unparseable package.json is reported as a finding (fail closed)', () => {
      writeFileSync(join(tmp, 'package.json'), '{ not json');
      const findings = runGate({ root: tmp });
      expect(findings).toHaveLength(1);
      expect(findings[0].where).toBe('(parse)');
    });
  });
});
