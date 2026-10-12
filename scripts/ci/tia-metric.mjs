#!/usr/bin/env node
/**
 * TIA shadow metric — spec `ci-test-impact-analysis` (D2/D10).
 *
 * Mide QUE habria seleccionado TIA sin alterar nada (advisory por contrato).
 *
 * CLI:
 *   node scripts/ci/tia-metric.mjs <workspace> [--format=md]
 *
 * ENTRADAS (todas opcionales salvo el workspace; cada una degrada a `n/a`):
 *   N (changed)      <- `vitest list --changed --filesOnly` con cwd=<workspace>
 *   T (total)        <- `vitest list --filesOnly` con cwd=<workspace>
 *                      N/T son AMBOS ficheros de test (nunca mezclar con fuentes).
 *   scope            <- <ws>/reports/tia-scope.txt (ausente -> `full`)
 *   executed tests   <- <ws>/reports/vitest-results.json (.numTotalTests)
 *   injected         <- <ws>/reports/tia-selection.json (.injected; lo escribira
 *                      `tia-select.mjs`, aun pendiente -> hoy siempre ausente)
 *   coverage map     <- `hit` si <ws>/reports/coverage-map.json existe y parsea,
 *                      si no `miss` (ese artefacto lo construye el step posterior)
 *
 * LIMITE DE DURACION: cada `vitest list` lleva timeout (default 5000 ms,
 * configurable via `TIA_VITEST_TIMEOUT_MS`). Si se supera o el listado falla,
 * ese lado degrada a `n/a` y el script sigue (D2/Risks: el step no cuesta s).
 *
 * SALIDA: tabla markdown. Se ANEXA a `$GITHUB_STEP_SUMMARY` si existe; con
 * `--format=md` se imprime a stdout, sin el flag se imprime una linea corta.
 *
 * EXIT 0 SIEMPRE: cualquier fallo interno -> `::warning::` + tabla degradada.
 * Razon: ci.yml lo invoca con `if: always()` y SIN `|| true`; un exit 1
 * romperia el job de tests por un fallo de observabilidad.
 *
 * PORTABILIDAD (D11): solo `node` + `path` (spawnSync directo de
 * `node_modules/vitest/vitest.mjs`, sin shell, sin `$(...)`, sin ramas por
 * plataforma) para que funcione igual en Windows local y Ubuntu CI.
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(fileURLToPath(new URL('../..', import.meta.url)));
const VITEST_MJS = path.join(ROOT, 'node_modules', 'vitest', 'vitest.mjs');
const LIST_TIMEOUT_MS_DEFAULT = 5000;

/** Timeout de cada `vitest list` (ms). Env `TIA_VITEST_TIMEOUT_MS` lo ajusta. */
export function listTimeoutMs() {
  const raw = Number(process.env.TIA_VITEST_TIMEOUT_MS);
  return Number.isInteger(raw) && raw > 0 ? raw : LIST_TIMEOUT_MS_DEFAULT;
}

/**
 * Resuelve el workspace: acepta ruta tal cual (`apps/client`, `./x`, absoluta)
 * o relativa a la raiz del repo. Devuelve el directorio absoluto o null.
 */
export function resolveWorkspaceDir(raw) {
  if (!raw) return null;
  const asGiven = path.resolve(raw);
  if (fs.existsSync(asGiven)) return asGiven;
  const underRoot = path.join(ROOT, raw);
  if (fs.existsSync(underRoot)) return underRoot;
  return null;
}

/** Parsea la salida de `vitest list --filesOnly`: una ruta por linea. */
export function parseFileList(stdout) {
  return String(stdout || '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

/**
 * Ejecuta `vitest list` con cwd=<workspace> y timeout. Devuelve el array de
 * ficheros o null si el listado fallo/supero el timeout (el llamante degrada
 * ese lado a `n/a`). Nunca lanza.
 */
export function listTestFiles(
  wsDir,
  extraArgs = [],
  timeoutMs = listTimeoutMs()
) {
  try {
    const run = spawnSync(
      process.execPath,
      [VITEST_MJS, 'list', ...extraArgs, '--filesOnly'],
      { cwd: wsDir, timeout: timeoutMs, encoding: 'utf8' }
    );
    if (run.error || run.status !== 0) return null;
    return parseFileList(run.stdout);
  } catch {
    return null;
  }
}

/** Lee un JSON y devuelve null si falta o no parsea (nunca lanza). */
export function readJsonFile(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return null;
  }
}

/** Scope del run: `scope=<valor>` en tia-scope.txt; ausente -> `full`. */
export function readScope(wsDir) {
  try {
    const raw = fs.readFileSync(
      path.join(wsDir, 'reports', 'tia-scope.txt'),
      'utf8'
    );
    const match = raw.match(/scope\s*=\s*(\S+)/);
    if (match) return match[1].trim();
    return raw.trim() || 'full';
  } catch {
    return 'full';
  }
}

/** Numero total de tests ejecutados (JSON reporter de Vitest) o null. */
export function readNumTotalTests(wsDir) {
  const data = readJsonFile(path.join(wsDir, 'reports', 'vitest-results.json'));
  const n = data ? data.numTotalTests : undefined;
  return typeof n === 'number' ? n : null;
}

/** Ficheros inyectados por el historial (tia-selection.json) o null. */
export function readInjectedCount(wsDir) {
  const data = readJsonFile(path.join(wsDir, 'reports', 'tia-selection.json'));
  const n = data ? data.injected : undefined;
  return typeof n === 'number' ? n : null;
}

/** `hit` si coverage-map.json existe y parsea; si no `miss`. */
export function readMapStatus(wsDir) {
  const data = readJsonFile(path.join(wsDir, 'reports', 'coverage-map.json'));
  return data === null ? 'miss' : 'hit';
}

export function fmt(value) {
  return value === null || value === undefined ? 'n/a' : String(value);
}

export function buildMarkdown(report) {
  const { workspace, scope, changed, total, numTotalTests, injected, map } =
    report;
  return [
    '## TIA shadow metric — advisory (never gates)',
    '',
    `Workspace: \`${workspace}\` · scope \`${scope}\``,
    '',
    '| metric | value |',
    '| --- | --- |',
    `| scope | ${scope} |`,
    `| changed test files (N) | ${fmt(changed)} |`,
    `| total test files (T) | ${fmt(total)} |`,
    `| executed tests | ${fmt(numTotalTests)} |`,
    `| injected files | ${fmt(injected)} |`,
    `| coverage map | ${map} |`,
    '',
    '> Selection measurement only: it never alters what runs.',
  ].join('\n');
}

export function buildShort(report) {
  const { workspace, scope, changed, total, numTotalTests, injected, map } =
    report;
  return (
    `TIA ${workspace}: scope=${scope} N=${fmt(changed)} ` +
    `T=${fmt(total)} tests=${fmt(numTotalTests)} ` +
    `injected=${fmt(injected)} map=${map}`
  );
}

function degradedReport(label) {
  return {
    workspace: label,
    scope: 'n/a',
    changed: null,
    total: null,
    numTotalTests: null,
    injected: null,
    map: 'miss',
  };
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

function main() {
  const argv = process.argv.slice(2);
  const workspaceArg = argv.find((a) => !a.startsWith('--')) || null;
  const formatMd = argv.includes('--format=md');
  const label = workspaceArg || 'unknown';
  let report;
  try {
    const wsDir = resolveWorkspaceDir(workspaceArg);
    if (!wsDir) {
      console.log(`::warning::tia-metric: workspace not found: ${label}`);
      report = degradedReport(label);
    } else {
      const changedFiles = listTestFiles(wsDir, ['--changed']);
      const totalFiles = listTestFiles(wsDir, []);
      report = {
        workspace: workspaceArg,
        scope: readScope(wsDir),
        changed: changedFiles ? changedFiles.length : null,
        total: totalFiles ? totalFiles.length : null,
        numTotalTests: readNumTotalTests(wsDir),
        injected: readInjectedCount(wsDir),
        map: readMapStatus(wsDir),
      };
    }
  } catch (error) {
    const detail = error && error.message ? error.message : String(error);
    console.log(`::warning::tia-metric: ${detail}`);
    report = degradedReport(label);
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
