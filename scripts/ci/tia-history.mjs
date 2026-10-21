#!/usr/bin/env node
/**
 * Historial de tests fallidos — spec `ci-test-impact-analysis` (task 4.1, D4).
 *
 * CLI:
 *   node scripts/ci/tia-history.mjs <workspace> --record [--out <path>]
 *   node scripts/ci/tia-history.mjs <workspace> --inject [--format=argv]
 *   (tambien se acepta `--out=<path>` / `--in=<path>`)
 *
 * FUENTE DE VERDAD (D4): `<ws>/reports/vitest-results.json` (JSON reporter de
 * Vitest). De cada entrada de `testResults` se extrae `{testfile, failures}`:
 * `testfile` es el campo `name` (ruta del fichero) y `failures` el conteo de
 * `assertionResults` con `status === 'failed'`.
 *
 * `runId` <- env `GITHUB_RUN_ID`; en local (ausente) un timestamp ISO.
 *
 * Se conservan los ULTIMOS N=3 runs (constante `HISTORY_N_DEFAULT`,
 * ajustable via env `TIA_HISTORY_N`). Formato del almacen:
 *   { "workspace": "<ws>", "runs": [
 *     { "runId", "recordedAt", "workspace", "total",
 *       "files": [{ "testfile", "failures" }] } ] }
 *
 * ALMACEN: `--out` si se da; si no, `node_modules/.cache/tia/tia-history.json`
 * bajo el workspace (se crea el directorio). `--record` con un JSON ilegible
 * o ausente NO explota: avisa y sale 0 (ci.yml lo llama con `|| true`).
 *
 * `--inject` imprime UNA RUTA POR LINEA en stdout (ci.yml hace `| wc -l`):
 * ficheros con `failures > 0` en los ultimos N runs, deduplicados y
 * ordenados. Vacio -> no imprime NADA y sale 0. Entrada: `--in` si se da;
 * si no, `<ws>/reports/tia-history.json` si existe (ahi deja ci.yml el
 * artefacto descargado del nightly); si no, el almacen por defecto.
 * Con `--format=argv` las mismas rutas escapadas para shell.
 *
 * CRITICO: en modo `--inject` TODO log va a stderr, nunca a stdout —
 * cualquier texto extra corromperia el conteo `injected N` del workflow.
 *
 * EXIT 0 SIEMPRE en ambos modos.
 *
 * PORTABILIDAD (D11): solo `node` + `path`, sin shell, sin `$(...)`, sin
 * ramas por plataforma.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(fileURLToPath(new URL('../..', import.meta.url)));

/** Numero de runs que se conservan (env `TIA_HISTORY_N` lo ajusta). */
export const HISTORY_N_DEFAULT = 3;

export function historyLimit() {
  const raw = Number(process.env.TIA_HISTORY_N);
  return Number.isInteger(raw) && raw > 0 ? raw : HISTORY_N_DEFAULT;
}

export function resultsPath(wsDir) {
  return path.join(wsDir, 'reports', 'vitest-results.json');
}

export function reportsHistoryPath(wsDir) {
  return path.join(wsDir, 'reports', 'tia-history.json');
}

export function defaultStorePath(wsDir) {
  return path.join(wsDir, 'node_modules', '.cache', 'tia', 'tia-history.json');
}

/**
 * Extrae `[{testfile, failures}]` del JSON reporter de Vitest. `baseDir`
 * (opcional) relativiza los `name` absolutos para que el historial sea
 * estable entre maquinas. Nunca lanza: un shape inesperado -> `[]`.
 */
export function extractFileStats(resultsJson, baseDir = null) {
  try {
    const list =
      resultsJson && Array.isArray(resultsJson.testResults)
        ? resultsJson.testResults
        : [];
    return list
      .filter((entry) => entry && typeof entry.name === 'string')
      .map((entry) => {
        const assertions = Array.isArray(entry.assertionResults)
          ? entry.assertionResults
          : [];
        const failures = assertions.filter(
          (a) => a && a.status === 'failed'
        ).length;
        let testfile = entry.name;
        if (baseDir && path.isAbsolute(testfile)) {
          const rel = path.relative(baseDir, testfile);
          if (rel && !rel.startsWith('..')) {
            testfile = rel.split(path.sep).join('/');
          }
        }
        return { testfile, failures };
      });
  } catch {
    return [];
  }
}

/**
 * Lee el almacen. Ausente -> historial vacio; ilegible -> `{corrupt: true}`
 * con historial vacio (el llamante avisa y sigue, nunca explota).
 */
export function loadHistoryFile(filePath) {
  try {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const runs = data && Array.isArray(data.runs) ? data.runs : [];
    return { history: { runs }, corrupt: false };
  } catch (error) {
    if (error && error.code === 'ENOENT') {
      return { history: { runs: [] }, corrupt: false, missing: true };
    }
    return { history: { runs: [] }, corrupt: true };
  }
}

/** Agrega el run actual y recorta a los ultimos `limit` runs. */
export function consolidateHistory(history, entries, meta) {
  const { runId, total, workspace, limit } = meta;
  const runs = [...((history && history.runs) || [])];
  runs.push({
    runId,
    recordedAt: new Date().toISOString(),
    workspace,
    total,
    files: entries,
  });
  return { workspace, runs: runs.slice(-limit) };
}

/** Ficheros con `failures > 0` en los runs dados: deduplicados y ordenados. */
export function selectFailingFiles(history) {
  const set = new Set();
  const runs = (history && history.runs) || [];
  for (const run of runs) {
    const files = (run && run.files) || [];
    for (const file of files) {
      if (
        file &&
        typeof file.testfile === 'string' &&
        (file.failures || 0) > 0
      ) {
        set.add(file.testfile);
      }
    }
  }
  return [...set].sort();
}

/** Escapa una ruta para interpolarla como argv de shell (comillas simples). */
export function shellEscape(value) {
  return `'${String(value).replace(/'/g, `'\\''`)}'`;
}

function resolveWorkspaceDir(raw) {
  if (!raw) return null;
  const asGiven = path.resolve(raw);
  if (fs.existsSync(asGiven)) return asGiven;
  const underRoot = path.join(ROOT, raw);
  if (fs.existsSync(underRoot)) return underRoot;
  return null;
}

function runRecord(wsDir, workspaceLabel, outPath) {
  const source = resultsPath(wsDir);
  let results = null;
  try {
    results = JSON.parse(fs.readFileSync(source, 'utf8'));
  } catch {
    // ci.yml lleva `|| true`, pero el contrato exige exit 0 con aviso.
    console.log(
      `::warning::tia-history: cannot read ${source} — history not updated.`
    );
    return;
  }
  const entries = extractFileStats(results, wsDir);
  const total =
    typeof results.numTotalTests === 'number'
      ? results.numTotalTests
      : entries.length;
  const runId = process.env.GITHUB_RUN_ID || new Date().toISOString();
  const target = outPath ? path.resolve(outPath) : defaultStorePath(wsDir);
  const { history, corrupt } = loadHistoryFile(target);
  if (corrupt) {
    console.log(
      `::warning::tia-history: existing history at ${target} is ` +
        `unreadable — starting fresh.`
    );
  }
  const next = consolidateHistory(history, entries, {
    runId,
    total,
    workspace: workspaceLabel,
    limit: historyLimit(),
  });
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, `${JSON.stringify(next, null, 2)}\n`);
  console.log(
    `tia-history: recorded run ${runId} (${entries.length} file(s), ` +
      `${total} test(s)) → ${target}`
  );
}

function resolveInjectInput(wsDir, inPath) {
  if (inPath) return path.resolve(inPath);
  const reports = reportsHistoryPath(wsDir);
  if (fs.existsSync(reports)) return reports;
  return defaultStorePath(wsDir);
}

function runInject(wsDir, inPath, argvFormat) {
  const input = resolveInjectInput(wsDir, inPath);
  const { history, corrupt } = loadHistoryFile(input);
  if (corrupt) {
    // OJO: stderr, nunca stdout (el workflow cuenta lineas de stdout).
    console.error(
      `::warning::tia-history: history at ${input} is unreadable — ` +
        `injecting nothing (diff-derived selection only, never an empty run). ` +
        `Delete the file or run the full suite: \`npm run test\` / \`npm run test:coverage\`.`
    );
  }
  const files = selectFailingFiles(history);
  if (!files.length) return;
  const lines = argvFormat ? files.map(shellEscape) : files;
  process.stdout.write(`${lines.join('\n')}\n`);
}

function main() {
  const argv = process.argv.slice(2);
  let workspaceArg = null;
  let mode = null;
  let outPath = null;
  let inPath = null;
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--record') mode = 'record';
    else if (arg === '--inject') mode = 'inject';
    else if (arg === '--out' && argv[i + 1]) {
      outPath = argv[i + 1];
      i += 1;
    } else if (arg.startsWith('--out=')) outPath = arg.slice('--out='.length);
    else if (arg === '--in' && argv[i + 1]) {
      inPath = argv[i + 1];
      i += 1;
    } else if (arg.startsWith('--in=')) inPath = arg.slice('--in='.length);
    else if (!arg.startsWith('--') && !workspaceArg) workspaceArg = arg;
    // `--format=argv` y cualquier otro flag se aceptan sin efecto salvo abajo.
  }
  const argvFormat = argv.includes('--format=argv');
  const label = workspaceArg || 'unknown';
  try {
    const wsDir = resolveWorkspaceDir(workspaceArg);
    if (!wsDir) {
      // En --inject el aviso va a stderr para no contaminar `| wc -l`.
      console.error(`::warning::tia-history: workspace not found: ${label}`);
      return;
    }
    if (mode === 'record') runRecord(wsDir, workspaceArg, outPath);
    else if (mode === 'inject') runInject(wsDir, inPath, argvFormat);
    else {
      console.error(
        '::warning::tia-history: missing mode (expected --record or --inject).'
      );
    }
  } catch (error) {
    const detail = error && error.message ? error.message : String(error);
    console.error(`::warning::tia-history: ${detail}`);
  }
}

if (
  process.argv[1] &&
  import.meta.url.endsWith(path.basename(process.argv[1]))
) {
  main();
  process.exit(0);
}
