import { describe, expect, it } from 'vitest';
import { toSarif } from './eslint-sarif.mjs';

describe('eslint-sarif', () => {
  it('converts ESLint messages into SARIF results with relative paths', () => {
    const cwd = process.cwd();
    const filePath =
      process.platform === 'win32'
        ? `${cwd}\\apps\\client\\src\\App.jsx`
        : `${cwd}/apps/client/src/App.jsx`;

    const sarif = toSarif(
      [
        {
          filePath,
          messages: [
            {
              ruleId: 'no-unused-vars',
              severity: 2,
              message: "'x' is defined but never used.",
              line: 3,
              column: 7,
              endLine: 3,
              endColumn: 8,
            },
            {
              ruleId: null,
              severity: 1,
              message: 'Parsing warning',
              line: 0,
              column: 0,
            },
          ],
        },
      ],
      cwd
    );

    expect(sarif.version).toBe('2.1.0');
    expect(sarif.runs[0].tool.driver.name).toBe('ESLint');
    expect(sarif.runs[0].tool.driver.rules).toEqual([{ id: 'no-unused-vars' }]);
    expect(sarif.runs[0].results).toHaveLength(2);

    const [error, warning] = sarif.runs[0].results;
    expect(error.level).toBe('error');
    expect(error.ruleId).toBe('no-unused-vars');
    expect(error.locations[0].physicalLocation.artifactLocation.uri).toBe(
      'apps/client/src/App.jsx'
    );
    expect(error.locations[0].physicalLocation.region.startLine).toBe(3);

    // Sin ruleId ni línea válida: resultado genérico, región normalizada a 1.
    expect(warning.level).toBe('warning');
    expect(warning.ruleId).toBeUndefined();
    expect(warning.locations[0].physicalLocation.region.startLine).toBe(1);
  });

  it('returns an empty result set for a clean report', () => {
    const sarif = toSarif([], process.cwd());
    expect(sarif.runs[0].results).toEqual([]);
    expect(sarif.runs[0].tool.driver.rules).toEqual([]);
  });
});
