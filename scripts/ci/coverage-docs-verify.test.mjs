import { describe, expect, it } from 'vitest';
import { verifyCoverageDoc } from './coverage-docs-verify.mjs';

describe('coverage documentation verifier', () => {
  it('accepts a block matching the current figures', () => {
    expect(
      verifyCoverageDoc(
        'before\n<!-- coverage-floor-ratchet:start -->\nfigures\n<!-- coverage-floor-ratchet:end -->\nafter',
        'figures'
      )
    ).toEqual([]);
  });

  it('compares Markdown table cells rather than alignment padding', () => {
    const padded = [
      '<!-- coverage-floor-ratchet:start -->',
      '| Workspace | Global floor |',
      '| --------- | ------------ |',
      '| server    | 60 / 64      |',
      '<!-- coverage-floor-ratchet:end -->',
    ].join('\n');

    expect(
      verifyCoverageDoc(
        padded,
        '| Workspace | Global floor |\n| --- | --- |\n| server | 60 / 64 |'
      )
    ).toEqual([]);
  });

  it('rejects a changed numeric figure in the managed table', () => {
    const document = [
      '<!-- coverage-floor-ratchet:start -->',
      '| Workspace | Global floor |',
      '| --------- | ------------ |',
      '| server    | 59 / 64      |',
      '<!-- coverage-floor-ratchet:end -->',
    ].join('\n');

    expect(
      verifyCoverageDoc(
        document,
        '| Workspace | Global floor |\n| --- | --- |\n| server | 60 / 64 |'
      )
    ).toContain(
      'managed coverage figures do not match the current configuration'
    );
  });

  it('rejects stale or missing managed figures', () => {
    expect(
      verifyCoverageDoc(
        'before\n<!-- coverage-floor-ratchet:start -->\n| server | 59 |\n<!-- coverage-floor-ratchet:end -->',
        '| server | 60 |'
      )
    ).toContain(
      'managed coverage figures do not match the current configuration'
    );
    expect(verifyCoverageDoc('no markers', 'current')).toContain(
      'managed coverage figure markers are missing or invalid'
    );
  });
});
