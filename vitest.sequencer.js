/**
 * Fail-first sequencer — spec `ci-test-impact-analysis` (task 5.1 / design D7)
 * más la degradación flaky-aware y la paridad local de `smart-test-ordering`.
 *
 * QUÉ HACE
 * ---------
 * Reordena (nunca selecciona) los ficheros de test del run:
 *   1. más fallos recientes primero (historial N=3 de `scripts/ci/tia-history.mjs`),
 *   2. degradando — nunca ascendiendo — los ficheros con evidencia de flakiness
 *      (retries de `flaky-retries.json` o cuarentena de `.github/flaky-quarantine.yml`),
 *   3. con tie-break estable por ruta.
 *
 * Sin historial el orden es determinista (ruta ascendente) — jamás aleatorio y
 * jamás "0 tests": el sequencer solo reordena la lista que Vitest ya resolvió.
 *
 * FUENTES (todas best-effort; ausencia/corrupción degrade, nunca falle)
 * -------------------------------------------------------------------
 * - Historial: `<ws>/node_modules/.cache/tia/tia-history.json` (ruta que fija
 *   `scripts/ci/tia-history.mjs` y la task 1.1 de `smart-test-ordering`) y, como
 *   respaldo, `<ws>/reports/tia-history.json` (donde lo deja el step de CI).
 *   Formato: `{ runs: [{ files: [{ testfile, failures }] }] }`.
 * - Flaky: `flaky-retries.json` (`retryCount > 0` o `flaky: true`) del último
 *   run cuyo artefacto esté disponible localmente. En CI el step de restore lo
 *   deja descargado; en local lo escribe el propio run anterior.
 * - Cuarentena: `.github/flaky-quarantine.yml` (fuente versionada, leída por
 *   `scripts/ci/quarantine-exclude.mjs` — no se modifica).
 *
 * OPT-OUT (design D7): `TIA_SEQUENCER=stable` (nightly-full-suite.yml) ⇒ se
 * delega en el `BaseSequencer` para que el tier de seguridad corra en orden
 * natural y siga exponiendo order-dependence. La config shared NO fija
 * sequencer con ese env (ver `vitest.shared.js`), para no bloquear el
 * `--sequence.shuffle` de la auditoría.
 *
 * SHUFFLE (task 4.1/4.2): cuando el run pide `--sequence.shuffle` y un
 * `--sequence.seed` fijo, este sequencer produce una permutación determinista
 * con ese seed (Fisher–Yates sobre mulberry32). Mismo seed ⇒ mismo orden en
 * cualquier máquina; seed distinto ⇒ otra permutación.
 */
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { BaseSequencer } from 'vitest/node';
import { parseQuarantine } from './scripts/ci/quarantine-exclude.mjs';

/** Raíz del repo — este fichero vive en la raíz del monorepo. */
const REPO_ROOT = path.dirname(fileURLToPath(import.meta.url));

/** Ruta de la lista de cuarentena (fuente versionada, solo lectura). */
export const QUARANTINE_PATH = path.join(
  REPO_ROOT,
  '.github',
  'flaky-quarantine.yml'
);

/** Rutas candidatas del historial, en orden de prioridad. */
export function historyCandidates(workspaceRoot) {
  return [
    path.join(
      workspaceRoot,
      'node_modules',
      '.cache',
      'tia',
      'tia-history.json'
    ),
    path.join(workspaceRoot, 'reports', 'tia-history.json'),
  ];
}

/** Rutas candidatas de la evidencia de flakiness, en orden de prioridad. */
export function flakyCandidates(workspaceRoot) {
  return [
    path.join(
      workspaceRoot,
      'node_modules',
      '.cache',
      'tia',
      'flaky-retries.json'
    ),
    path.join(workspaceRoot, 'reports', 'flaky-retries.json'),
  ];
}

/** Lee y parsea un JSON; null si falta o es ilegible (nunca lanza). */
function readJson(file) {
  try {
    return JSON.parse(readFileSync(file, 'utf8'));
  } catch {
    return null;
  }
}

/** Primer candidato existente (o null). */
function firstExisting(files) {
  for (const file of files) {
    if (existsSync(file)) return file;
  }
  return null;
}

/** Normaliza a ruta con separadores `/` y sin prefijo `./` o `/`. */
function normalize(p) {
  return p.split(path.sep).join('/').replace(/^\.\//, '').replace(/^\//, '');
}

/**
 * Fallos recientes por fichero sobre TODOS los runs del historial (N=3).
 * Suma los `failures` de cada run para que un fichero rojo dos veces
 * consecutivas pese más que uno rojo una sola vez. `testfile` es la ruta
 * relativa al workspace (base del historial).
 */
export function failureCounts(history) {
  const counts = new Map();
  const runs = history && Array.isArray(history.runs) ? history.runs : [];
  for (const run of runs) {
    const files = run && Array.isArray(run.files) ? run.files : [];
    for (const entry of files) {
      if (!entry || typeof entry.testfile !== 'string') continue;
      const failures = Number(entry.failures) || 0;
      if (failures <= 0) continue;
      counts.set(entry.testfile, (counts.get(entry.testfile) || 0) + failures);
    }
  }
  return counts;
}

/**
 * Comprueba un glob de cuarentena (`**`, `*`, `?`) contra una ruta
 * repo-relativa normalizada. Un patrón sin wildcards es una comparación exacta.
 */
export function matchesGlob(pattern, relPath) {
  const clean = normalize(pattern);
  const target = normalize(relPath);
  if (!/[*?]/.test(clean)) return clean === target;
  const regex = clean
    .replace(/[.+^${}()|[\]\\]/g, '\\$&')
    .replace(/\*\*\/|\*\*|\*|\?/g, (token) => {
      if (token === '**/') return '(?:.*/)?';
      if (token === '**') return '.*';
      if (token === '*') return '[^/]*';
      return '[^/]';
    });
  return new RegExp(`^${regex}$`).test(target);
}

/** Ficheros listados en la cuarentena versionada (repo-relativos). */
export function quarantinedFiles(quarantineFile = QUARANTINE_PATH) {
  if (!existsSync(quarantineFile)) return [];
  try {
    const entries = parseQuarantine(readFileSync(quarantineFile, 'utf8'));
    return entries
      .map((entry) => entry && entry.file)
      .filter((file) => typeof file === 'string' && file.length > 0);
  } catch {
    // Cuarentena mal formada → sin degradación (nunca romper el run). El
    // parser estricto de `quarantine-exclude.mjs` sigue siendo el gate en CI.
    return [];
  }
}

/** Ficheros con retries/flaky en una evidencia `flaky-retries.json`. */
export function flakyFilesFromEvidence(evidence) {
  const set = new Set();
  const tests = evidence && Array.isArray(evidence.tests) ? evidence.tests : [];
  for (const test of tests) {
    if (!test || typeof test.file !== 'string') continue;
    if (test.flaky === true || (Number(test.retryCount) || 0) > 0) {
      set.add(normalize(test.file));
    }
  }
  return set;
}

/**
 * Ficheros degradables del workspace (workspace-relativos): unión de la
 * cuarentena versionada (repo-relativa, acepta globs) y de la última evidencia
 * de flakiness disponible. `files` es la lista de specs del run (con `.moduleId`
 * absoluto) — así los globs de cuarentena se resuelven una sola vez.
 */
export function degradedFiles(files, options) {
  const {
    workspaceRoot,
    repoRoot = REPO_ROOT,
    quarantine = quarantinedFiles(QUARANTINE_PATH),
    flaky = new Set(),
    candidates,
  } = options;

  let flakySet = flaky;
  if (candidates) {
    const evidenceFile = firstExisting(candidates);
    flakySet = evidenceFile
      ? flakyFilesFromEvidence(readJson(evidenceFile))
      : new Set();
  }

  const degraded = new Set();
  for (const spec of files) {
    const rel = normalize(path.relative(workspaceRoot, spec.moduleId));
    if (flakySet.has(rel)) {
      degraded.add(rel);
      continue;
    }
    const repoRel = normalize(path.relative(repoRoot, spec.moduleId));
    if (quarantine.some((pattern) => matchesGlob(pattern, repoRel))) {
      degraded.add(rel);
    }
  }
  return degraded;
}

/**
 * ¿El run pide shuffle de ficheros? Acepta `true` (CLI `--sequence.shuffle`) y
 * la forma objeto `{ files: boolean }` (`--sequence.shuffle.files`).
 */
export function shouldShuffleFiles(sequence) {
  const shuffle = sequence && sequence.shuffle;
  if (shuffle === true) return true;
  if (shuffle && typeof shuffle === 'object') return shuffle.files === true;
  return false;
}

/** PRNG determinista (mulberry32) — mismo seed ⇒ misma secuencia. */
function mulberry32(seed) {
  let a = seed >>> 0;
  return function next() {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Permutación determinista de `items` con `seed` (Fisher–Yates). */
export function seededShuffle(items, seed) {
  const next = mulberry32(Number(seed) || 0);
  const out = [...items];
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(next() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/**
 * Orden fail-first puro y determinista sobre las specs. Exportado para poder
 * verificarlo sin arrancar Vitest (tasks 3.1/3.2/5.1).
 */
export function orderSpecs(files, { workspaceRoot, counts, degraded }) {
  const relative = (spec) =>
    normalize(path.relative(workspaceRoot, spec.moduleId));
  return [...files].sort((a, b) => {
    const ra = relative(a);
    const rb = relative(b);
    // 1) degradación flaky/cuarentena: nunca asciende (no-flaky primero).
    const da = degraded.has(ra) ? 1 : 0;
    const db = degraded.has(rb) ? 1 : 0;
    if (da !== db) return da - db;
    // 2) más fallos recientes primero.
    const ca = counts.get(ra) || 0;
    const cb = counts.get(rb) || 0;
    if (ca !== cb) return cb - ca;
    // 3) tie-break estable y determinista.
    return ra.localeCompare(rb);
  });
}

export default class HistorySequencer extends BaseSequencer {
  async sort(files) {
    try {
      // Opt-out explícito (design D7): el nightly corre en orden natural.
      if (process.env.TIA_SEQUENCER === 'stable')
        return await super.sort(files);

      const { sequence } = this.ctx?.config || {};
      const workspaceRoot = this.ctx?.config?.root || process.cwd();

      // Auditoría de order-dependence (task 4.1): el shuffle con seed fijo
      // manda sobre el orden por historial — es su razón de ser. El orden de
      // entrada de Vitest no es determinista, así que se canonicaliza por ruta
      // ANTES de permutar: mismo seed ⇒ misma permutación en cualquier máquina.
      if (shouldShuffleFiles(sequence)) {
        const canonical = [...files].sort((a, b) =>
          normalize(path.relative(workspaceRoot, a.moduleId)).localeCompare(
            normalize(path.relative(workspaceRoot, b.moduleId))
          )
        );
        return seededShuffle(canonical, sequence && sequence.seed);
      }

      const historyFile = firstExisting(historyCandidates(workspaceRoot));
      if (!historyFile) {
        console.log(
          '[tia-sequencer] no ordering history found — deterministic order ' +
            '(path ascending). Expected at ' +
            historyCandidates(workspaceRoot).join(' or ')
        );
      }
      const counts = failureCounts(historyFile ? readJson(historyFile) : null);
      const degraded = degradedFiles(files, {
        workspaceRoot,
        candidates: flakyCandidates(workspaceRoot),
      });

      return orderSpecs(files, { workspaceRoot, counts, degraded });
    } catch (error) {
      // El orden jamás puede tumbar el run: se degrada al BaseSequencer.
      console.log(
        `[tia-sequencer] ordering degraded to BaseSequencer — ${
          error && error.message ? error.message : String(error)
        }`
      );
      return super.sort(files);
    }
  }
}
