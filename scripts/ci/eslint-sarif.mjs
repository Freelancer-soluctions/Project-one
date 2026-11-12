#!/usr/bin/env node
// ============================================================================
// eslint-sarif.mjs — convierte un reporte JSON de ESLint a SARIF 2.1.0
// (change `ci-quality-gates-blocking-hardening`, P2.2)
// ============================================================================
// Por qué existe: los jobs `*-lint` suben sus hallazgos a Code Scanning para
// anotarlos en el PR, pero ESLint no trae formatter SARIF propio y el repo no
// quiere añadir una dependencia solo para esto. ESLint sí emite `--format json`
// (`[{ filePath, messages: [{ ruleId, severity, message, line, ... }] }]`), así
// que este script hace la traducción con Node puro (sin dependencias).
//
// Uso:
//   node scripts/ci/eslint-sarif.mjs <eslint-report.json> <out.sarif>
//
// Los `filePath` absolutos del reporte se relativizan contra el cwd (la raíz del
// repo en CI) para que Code Scanning resuelva los ficheros del checkout.
// ============================================================================

import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Convierte el JSON de ESLint a un documento SARIF 2.1.0.
 *
 * @param {Array<{filePath: string, messages: Array<object>}>} report
 * @param {string} [cwd] directorio contra el que relativizar las rutas
 * @returns {object} documento SARIF
 */
export function toSarif(report, cwd = process.cwd()) {
  const rules = new Map();
  const results = [];

  for (const file of report) {
    const uri = path.relative(cwd, file.filePath).split(path.sep).join('/');

    for (const message of file.messages ?? []) {
      const ruleId = message.ruleId ?? undefined;
      if (ruleId && !rules.has(ruleId)) {
        rules.set(ruleId, { id: ruleId });
      }

      const startLine = Math.max(1, message.line ?? 1);
      const startColumn = Math.max(1, message.column ?? 1);
      const region = { startLine, startColumn };
      if (message.endLine != null && message.endLine >= startLine) {
        region.endLine = message.endLine;
      }
      if (message.endColumn != null && message.endColumn >= startColumn) {
        region.endColumn = message.endColumn;
      }

      results.push({
        ...(ruleId ? { ruleId } : {}),
        level: message.severity === 2 ? 'error' : 'warning',
        message: { text: String(message.message ?? '') },
        locations: [
          {
            physicalLocation: {
              artifactLocation: { uri },
              region,
            },
          },
        ],
      });
    }
  }

  return {
    $schema:
      'https://raw.githubusercontent.com/oasis-tcs/sarif-spec/master/Schemata/sarif-schema-2.1.0.json',
    version: '2.1.0',
    runs: [
      {
        tool: {
          driver: {
            name: 'ESLint',
            informationUri: 'https://eslint.org',
            rules: [...rules.values()],
          },
        },
        results,
      },
    ],
  };
}

function main() {
  const [input, output] = process.argv.slice(2);
  if (!input || !output) {
    console.error(
      'Uso: node scripts/ci/eslint-sarif.mjs <eslint-report.json> <out.sarif>'
    );
    process.exit(2);
  }

  const report = JSON.parse(readFileSync(input, 'utf8'));
  writeFileSync(output, `${JSON.stringify(toSarif(report), null, 2)}\n`);
  const count = Array.isArray(report) ? report.length : 0;
  console.log(
    `✅ SARIF escrito en ${output} (${count} fichero(s) analizado(s))`
  );
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  main();
}
