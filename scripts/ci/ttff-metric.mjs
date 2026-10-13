#!/usr/bin/env node
/**
 * Métrica TTFF / first-failure — change `smart-test-ordering` (task 2.1, design D4).
 * La métrica madre del fail-first: ¿en qué punto de la corrida aparece el primer rojo?
 *
 * CLI:
 *   node scripts/ci/ttff-metric.mjs <workspace> [--format=md] [--x=20]
 *
 * ENTRADAS (todas opcionales; cada ausencia degrada, nunca falla):
 *   <ws>/reports/vitest-results.json          (reporter JSON de Vitest)
 *   <ws>/node_modules/.cache/tia/tia-history.json  y su respaldo
 *   <ws>/reports/tia-history.json             (historial N=3 del sequencer)
 *
 * QUÉ PUBLICA
 *   - TTFF wall-clock: startTime del primer fichero rojo − startTime de la corrida.
 *   - % de suite ejecutado hasta el primer fallo: duración de los ficheros
 *     anteriores al primero rojo / duración total (señal robusta al ruido de
 *     cola del runner: depende solo del orden).
 *   - % de fallos dentro del primer X% (X=20 por defecto, `--x`): APFD práctico.
 *   - historial hit-rate: ficheros rojos presentes en el historial / ficheros
 *     rojos (calidad del predictor que ordena el sequencer).
 *   - Corrida verde ⇒ "no first failure (sin primer fallo)" explícito.
 *   - JSON ausente/corrupto ⇒ `metric=unavailable`.
 *
 * CONTRATO
 *   ADVISORY: exit 0 SIEMPRE. Se INVOCA desde ci.yml con `if: always()` junto
 *   al summary TIA; un fallo de la observabilidad jamás puede voltear el job.
 *   La salida markdown se ANEXA a `$GITHUB_STEP_SUMMARY`; con `--format=md`
 *   también va a stdout, sin el flag se imprime una línea corta.
 *
 * PORTABILIDAD: solo `node` + `path` (sin shell, sin `$(...)`, sin ramas por
 * plataforma), para funcionar igual en Windows local y Ubuntu CI.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadHistoryFile, selectFailingFiles } from './tia-history.mjs';

const ROOT = path.resolve(fileURLToPath(new URL('../..', import.meta.url)));
const DEFAULT_X_PCT = 20;

/** Porcentaje X de "--x" o env `TTFF_X_PCT`; default 20. */
export function firstXPct(raw) {
  const value = Number(raw);
  return Number.isFinite(value) && value > 0 && value <= 100
    ? value
    : DEFAULT_X_PCT;
}

/** Resuelve el workspace (ruta tal cual o relativa a la raíz). */
export function resolveWorkspaceDir(raw) {
  if (!raw) return null;
  const asGiven = path.resolve(raw);
  if (fs.existsSync(asGiven)) return asGiven;
  const underRoot = path.join(ROOT, raw);
  if (fs.existsSync(underRoot)) return underRoot;
  return null;
}

/** Rutas candidatas del historial (mismo orden que el sequencer). */
export function historyCandidates(wsDir) {
  return [
    path.join(wsDir, 'node_modules', '.cache', 'tia', 'tia-history.json'),
    path.join(wsDir, 'reports', 'tia-history.json'),
  ];
}

/** Ruta relativa al workspace con separadores `/`. */
function toRel(wsDir, filePath) {
  if (typeof filePath !== 'string' || !filePath) return '';
  const abs = path.isAbsolute(filePath)
    ? filePath
    : path.resolve(wsDir, filePath);
  return path.relative(wsDir, abs).split(path.sep).join('/');
}

function isFailed(entry) {
  if (!entry || typeof entry !== 'object') return false;
  if (entry.status === 'failed') return true;
  const assertions = Array.isArray(entry.assertionResults)
    ? entry.assertionResults
    : [];
  return assertions.some((a) => a && a.status === 'failed');
}

/**
 * Analiza una corrida del reporter JSON. Nunca lanza: un shape inesperado
 * devuelve `{ ok: false }` y el llamante publica `metric=unavailable`.
 */
export function analyzeRun(results, wsDir, xPct = DEFAULT_X_PCT) {
  if (!results || typeof results !== 'object') return { ok: false };
  const raw = Array.isArray(results.testResults) ? results.testResults : [];
  const files = raw
    .filter((entry) => entry && typeof entry === 'object')
    .map((entry) => {
      const startTime = Number(entry.startTime) || 0;
      const endTime = Number(entry.endTime) || startTime;
      return {
        rel: toRel(wsDir, entry.name),
        failed: isFailed(entry),
        startTime,
        duration: Math.max(0, endTime - startTime),
      };
    });

  const inOrder = [...files].sort((a, b) => a.startTime - b.startTime);
  const totalDuration = files.reduce((sum, f) => sum + f.duration, 0);
  const failedFiles = files.filter((f) => f.failed);
  const runStart =
    Number(results.startTime) || (inOrder[0] || {}).startTime || 0;

  if (failedFiles.length === 0) {
    return {
      ok: true,
      workspace: toRel(ROOT, wsDir) || wsDir,
      noFirstFailure: true,
      totalFiles: files.length,
      totalDuration,
      failedCount: 0,
      xPct,
    };
  }

  const first = [...failedFiles].sort((a, b) => a.startTime - b.startTime)[0];
  const preceding = inOrder
    .filter((f) => f.startTime < first.startTime)
    .reduce((sum, f) => sum + f.duration, 0);

  // APFD práctico: ¿qué fracción de fallos cae dentro del primer X% (por duración)?
  let cumulative = 0;
  let failuresInFirstX = 0;
  for (const file of inOrder) {
    const position = totalDuration > 0 ? cumulative / totalDuration : 0;
    if (file.failed && position <= xPct / 100) failuresInFirstX += 1;
    cumulative += file.duration;
  }

  return {
    ok: true,
    workspace: toRel(ROOT, wsDir) || wsDir,
    noFirstFailure: false,
    firstFailure: first.rel,
    ttffMs: Math.max(0, first.startTime - runStart),
    suitePctBeforeFirstFailure:
      totalDuration > 0
        ? Math.min(100, (preceding / totalDuration) * 100)
        : null,
    failuresInFirstX,
    failedCount: failedFiles.length,
    failuresInFirstXPct:
      failedFiles.length > 0
        ? (failuresInFirstX / failedFiles.length) * 100
        : null,
    totalFiles: files.length,
    totalDuration,
    xPct,
  };
}

/** Hit-rate del historial: rojos predichos por el historial / rojos. */
export function computeHitRate(redFiles, history) {
  if (!redFiles || redFiles.length === 0) return null;
  const predicted = new Set(selectFailingFiles(history));
  const hits = redFiles.filter((file) => predicted.has(file)).length;
  return { hits, total: redFiles.length, pct: (hits / redFiles.length) * 100 };
}

/** Ficheros rojos (workspace-relativos) del reporter JSON. */
export function redFilesOf(results, wsDir) {
  const raw = Array.isArray(results && results.testResults)
    ? results.testResults
    : [];
  return raw
    .filter((entry) => isFailed(entry))
    .map((entry) => toRel(wsDir, entry.name));
}

export function fmtPct(value) {
  return value === null || value === undefined ? 'n/a' : `${value.toFixed(1)}%`;
}

export function fmtSeconds(ms) {
  return ms === null || ms === undefined ? 'n/a' : `${(ms / 1000).toFixed(2)}s`;
}

export function buildMarkdown(report) {
  const { workspace } = report;
  const header = [
    '## First-failure (TTFF) metric — advisory (never gates)',
    '',
    `Workspace: \`${workspace}\``,
    '',
  ];
  if (!report.ok) {
    return [
      ...header,
      '| metric | value |',
      '| --- | --- |',
      '| metric | unavailable (vitest-results.json ausente o inválido) |',
      '',
      '> Observabilidad: la métrica no pudo calcularse. Nunca altera el run.',
    ].join('\n');
  }
  if (report.noFirstFailure) {
    return [
      ...header,
      '| metric | value |',
      '| --- | --- |',
      '| first failure | none — no first failure (sin primer fallo) |',
      `| files executed | ${report.totalFiles} |`,
      `| ordering history | ${report.historyAvailable ? 'hit' : 'miss'} |`,
      '',
      '> Run verde: no hay primer fallo que medir.',
    ].join('\n');
  }
  const hit = report.hitRate;
  return [
    ...header,
    '| metric | value |',
    '| --- | --- |',
    `| first failure | \`${report.firstFailure}\` |`,
    `| TTFF (wall-clock) | ${fmtSeconds(report.ttffMs)} |`,
    `| suite executed before first failure | ${fmtPct(report.suitePctBeforeFirstFailure)} |`,
    `| failures in first ${report.xPct}% | ${fmtPct(report.failuresInFirstXPct)} (${report.failuresInFirstX}/${report.failedCount}) |`,
    `| history hit-rate | ${hit ? fmtPct(hit.pct) : 'n/a'} (${hit ? `${hit.hits}/${hit.total}` : 'no red files'}) |`,
    `| ordering history | ${report.historyAvailable ? 'hit' : 'miss'} |`,
    '',
    '> Advisory: mide el orden, no lo impone.',
  ].join('\n');
}

export function buildShort(report) {
  if (!report.ok) return `TTFF ${report.workspace}: metric=unavailable`;
  if (report.noFirstFailure) {
    return `TTFF ${report.workspace}: no first failure (sin primer fallo)`;
  }
  const hit = report.hitRate;
  return (
    `TTFF ${report.workspace}: ttff=${fmtSeconds(report.ttffMs)} ` +
    `suite=${fmtPct(report.suitePctBeforeFirstFailure)} ` +
    `first${report.xPct}=${fmtPct(report.failuresInFirstXPct)} ` +
    `hit-rate=${hit ? fmtPct(hit.pct) : 'n/a'} ` +
    `history=${report.historyAvailable ? 'hit' : 'miss'}`
  );
}

function emitMarkdown(markdown) {
  const summary = process.env.GITHUB_STEP_SUMMARY;
  if (!summary) return;
  try {
    fs.appendFileSync(summary, `${markdown}\n`);
  } catch {
    // Best-effort: el summary nunca puede romper el step.
  }
}

function loadResults(wsDir) {
  try {
    return JSON.parse(
      fs.readFileSync(
        path.join(wsDir, 'reports', 'vitest-results.json'),
        'utf8'
      )
    );
  } catch {
    return null;
  }
}

function loadHistory(wsDir) {
  for (const candidate of historyCandidates(wsDir)) {
    if (!fs.existsSync(candidate)) continue;
    const { history, corrupt } = loadHistoryFile(candidate);
    return { history, corrupt, available: !corrupt };
  }
  return { history: { runs: [] }, corrupt: false, available: false };
}

export function collectReport(workspaceArg, xPct = DEFAULT_X_PCT) {
  const label = workspaceArg || 'unknown';
  const wsDir = resolveWorkspaceDir(workspaceArg);
  if (!wsDir) {
    console.log(`::warning::ttff-metric: workspace not found: ${label}`);
    return { ok: false, workspace: label };
  }
  const results = loadResults(wsDir);
  if (!results) {
    console.log(
      `::warning::ttff-metric: reports/vitest-results.json missing or invalid for ${label} — metric unavailable.`
    );
    return { ok: false, workspace: toRel(ROOT, wsDir) || label };
  }
  const analysis = analyzeRun(results, wsDir, xPct);
  const { history, available } = loadHistory(wsDir);
  const hit = computeHitRate(redFilesOf(results, wsDir), history);
  return { ...analysis, hitRate: hit, historyAvailable: available };
}

function main() {
  const argv = process.argv.slice(2);
  const workspaceArg = argv.find((a) => !a.startsWith('--')) || null;
  const formatMd = argv.includes('--format=md');
  const xArg = argv.find((a) => a.startsWith('--x='));
  const xPct = firstXPct(
    xArg ? xArg.slice('--x='.length) : process.env.TTFF_X_PCT
  );

  let report;
  try {
    report = collectReport(workspaceArg, xPct);
    if (report.ok && !report.historyAvailable) {
      // Aviso advisory (no gating): el orden corrió sin historial.
      console.log(
        `::notice::ttff-metric: no ordering history available for ${report.workspace} — fail-first ran in deterministic order.`
      );
    }
  } catch (error) {
    const detail = error && error.message ? error.message : String(error);
    console.log(`::warning::ttff-metric: ${detail}`);
    report = { ok: false, workspace: workspaceArg || 'unknown' };
  }

  const markdown = buildMarkdown(report);
  emitMarkdown(markdown);
  console.log(formatMd ? markdown : buildShort(report));
  process.exit(0);
}

if (
  process.argv[1] &&
  import.meta.url.endsWith(path.basename(process.argv[1]))
) {
  main();
}
