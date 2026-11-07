#!/usr/bin/env node
/**
 * Genera el resumen de fallos de las pruebas de propiedades para
 * `$GITHUB_STEP_SUMMARY` (change `pbt-hardening`, tarea 6.1 / gap G2 del PRD).
 *
 * El job `property-tests` de `ci.yml` corre `test:pbt`, cuyo reporter `json` de
 * Vitest deja `apps/{client,server}/reports/vitest-results.json`. fast-check
 * adjunta al mensaje de error el bloque reproducible:
 *
 *   Property failed after 1 tests
 *   { seed: -1234567890, path: "0:1", endOnFailure: true }
 *   Counterexample: [-1,0,null]
 *
 * Este script extrae seed, path y contraejemplo de cada test fallido y los
 * publica en una tabla Markdown, de modo que reproduces el fallo sin bucear en
 * el log completo (mitigación del riesgo de irreproducibilidad del PRD).
 *
 * Uso:
 *   node scripts/ci/pbt-failure-summary.mjs reports/vitest-results.json…
 *   npm run test:pbt || node scripts/ci/pbt-failure-summary.mjs … >> "$GITHUB_STEP_SUMMARY"
 *
 * Sale con 0 siempre: es un paso de REPORTE que corre tras un fallo, y nunca
 * debe enmascarar ni sustituir el código de salida del propio test job.
 */
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const SEED = /seed:\s*(-?\d+)/;
const PATH = /path:\s*"([^"]*)"/;
const COUNTEREXAMPLE = /Counterexample:\s*(.+)/;

/** Escapa celdas Markdown y recorta el texto para que la tabla no se rompa. */
const cell = (value, max = 200) => {
  const text = String(value ?? '')
    .replace(/\r?\n/g, ' ')
    .replace(/\|/g, '\\|')
    .trim();
  return text.length > max ? `${text.slice(0, max)}…` : text || '—';
};

/** Aplana un reporte `json` de Vitest en los tests fallidos. */
export const collectFailures = (report) => {
  const failures = [];
  for (const file of report.testResults ?? []) {
    for (const assertion of file.assertionResults ?? []) {
      if (assertion.status !== 'failed') continue;
      const messages = (assertion.failureMessages ?? []).join('\n');
      failures.push({
        suite: file.name ?? file.testFilePath ?? 'unknown',
        title: assertion.fullName ?? assertion.title ?? 'unknown',
        seed: (messages.match(SEED) ?? [])[1] ?? null,
        path: (messages.match(PATH) ?? [])[1] ?? null,
        counterexample: (messages.match(COUNTEREXAMPLE) ?? [])[1] ?? null,
      });
    }
  }
  return failures;
};

/** Renderiza la tabla Markdown del resumen. */
export const renderSummary = (failures, sources) => {
  if (failures.length === 0) {
    return [
      '### Property tests — sin fallos de propiedad detectados',
      '',
      `Reportes leídos: ${sources.length === 0 ? 'ninguno' : sources.join(', ')}.`,
      'Revisa el log del step para fallos que no provengan de `fc.assert`.',
      '',
    ].join('\n');
  }

  const rows = failures.map(
    (failure) =>
      `| ${cell(failure.title, 120)} | \`${cell(failure.seed, 20)}\` | \`${cell(failure.path, 40)}\` | \`${cell(failure.counterexample, 160)}\` |`
  );

  return [
    `### Property tests — ${failures.length} propiedad(es) fallaron`,
    '',
    '| Propiedad | Seed | Path | Contraejemplo |',
    '| --- | --- | --- | --- |',
    ...rows,
    '',
    'Reproducir: pasa `{ seed, path }` al `fc.assert` de la propiedad (o exporta',
    '`PBT_SEED=<seed>` y vuelve a correr `npm run test:pbt`).',
    '',
  ].join('\n');
};

const main = () => {
  const sources = process.argv.slice(2);
  const failures = [];
  for (const source of sources) {
    try {
      failures.push(
        ...collectFailures(JSON.parse(readFileSync(source, 'utf8')))
      );
    } catch (error) {
      console.error(`::warning::no se pudo leer ${source}: ${error.message}`);
    }
  }
  process.stdout.write(`${renderSummary(failures, sources)}\n`);
};

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  main();
}
