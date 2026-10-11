#!/usr/bin/env node
/**
 * Coverage-map builder — spec `ci-test-impact-analysis` (task 7.1/7.2, D5).
 *
 * CLI:
 *   node scripts/ci/tia-map.mjs <workspace> --build
 *
 * FUENTES (decision tomada: `vitest list --filesOnly` + coverage-summary, SIN
 * dependency-cruiser — queda para una fase posterior):
 *   testFiles <- `vitest list --filesOnly` con cwd=<workspace> (reutiliza el
 *                helper de `tia-metric.mjs`, con su timeout de ~5000 ms).
 *   sources   <- `coverage-summary.json` SI EXISTE, buscando en este orden:
 *                1. `<ws>/reports/coverage-summary.json`
 *                2. `<ws>/coverage/coverage-summary.json` (default de Vitest)
 *                3. `<ws>/tests/coverage/coverage-summary.json` (server)
 *                Se listan las claves salvo `total`, relativizadas al workspace.
 *
 * HALLAZGO EMPIRICO (2026-10-11, verificado en este repo):
 *   - `vitest.shared.js` fija provider `v8` + reporters `text,json-summary,html`,
 *     por lo que cada corrida con `--coverage` escribe `coverage-summary.json`.
 *   - `apps/client/vitest.config.js` NO declara `reportsDirectory` -> el summary
 *     cae en el default `<ws>/coverage/coverage-summary.json` (existe en disco).
 *   - `apps/server/vitest.config.js` declara `reportsDirectory: './tests/coverage'`
 *     -> el summary cae en `<ws>/tests/coverage/coverage-summary.json` (existe).
 *   - `<ws>/reports/coverage-summary.json` NO lo escribe ningun script de test
 *     actual (`test:coverage:ci` solo deja junit/json/flaky en `reports/`), asi
 *     que esa primera candidata casi nunca existira; se mantiene primera por
 *     contrato, por si un step futuro la publica ahi.
 *
 * SALIDA: SIEMPRE escribe `<ws>/reports/coverage-map.json` con JSON valido,
 * aunque los inputs falten (estado vacio aceptado):
 *   { "generatedAt": "<iso>", "workspace": "<ws>", "testFiles": [],
 *     "sources": [], "coverageSummary": null }
 * El step de ci.yml es `best-effort` y `upload-artifact` lleva
 * `if-no-files-found: warn`: el artefacto debe existir siempre.
 *
 * EXIT 0 SIEMPRE: cualquier fallo interno -> `::warning::` + mapa vacio.
 *
 * PORTABILIDAD (D11): solo `node` + `path`, sin shell, sin `$(...)`, sin
 * ramas por plataforma.
 */
import fs from 'node:fs';
import path from 'node:path';
import { listTestFiles, resolveWorkspaceDir } from './tia-metric.mjs';

/** Candidatas de coverage-summary, en orden de preferencia (ver hallazgo). */
export const COVERAGE_SUMMARY_CANDIDATES = [
  path.join('reports', 'coverage-summary.json'),
  path.join('coverage', 'coverage-summary.json'),
  path.join('tests', 'coverage', 'coverage-summary.json'),
];

export function coverageMapPath(wsDir) {
  return path.join(wsDir, 'reports', 'coverage-map.json');
}

/** Primera candidata existente o null (nunca lanza). */
export function findCoverageSummary(wsDir) {
  try {
    for (const rel of COVERAGE_SUMMARY_CANDIDATES) {
      const full = path.join(wsDir, rel);
      if (fs.existsSync(full)) return full;
    }
    return null;
  } catch {
    return null;
  }
}

/** Relativiza al workspace las rutas absolutas bajo el; resto intacto. */
export function relativize(filePath, wsDir) {
  try {
    if (wsDir && path.isAbsolute(filePath)) {
      const rel = path.relative(wsDir, filePath);
      if (rel && !rel.startsWith('..')) {
        return rel.split(path.sep).join('/');
      }
    }
  } catch {
    // Cae al valor original.
  }
  return filePath;
}

/**
 * Claves del summary salvo `total`, relativizadas. Summary ausente o
 * ilegible -> `[]` (el mapa vacio sigue siendo valido).
 */
export function readCoverageSources(summaryPath, wsDir) {
  if (!summaryPath) return [];
  try {
    const data = JSON.parse(fs.readFileSync(summaryPath, 'utf8'));
    return Object.keys(data || {})
      .filter((key) => key !== 'total')
      .map((key) => relativize(key, wsDir));
  } catch {
    return [];
  }
}

export function buildCoverageMap(report) {
  const { workspace, generatedAt, testFiles, sources, coverageSummary } =
    report;
  return { generatedAt, workspace, testFiles, sources, coverageSummary };
}

function emptyMap(workspaceLabel) {
  return buildCoverageMap({
    workspace: workspaceLabel,
    generatedAt: new Date().toISOString(),
    testFiles: [],
    sources: [],
    coverageSummary: null,
  });
}

function writeMap(wsDir, map) {
  const out = coverageMapPath(wsDir);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, `${JSON.stringify(map, null, 2)}\n`);
  return out;
}

function main() {
  const argv = process.argv.slice(2);
  const workspaceArg = argv.find((a) => !a.startsWith('--')) || null;
  const label = workspaceArg || 'unknown';
  try {
    const wsDir = resolveWorkspaceDir(workspaceArg);
    if (!wsDir) {
      console.log(`::warning::tia-map: workspace not found: ${label}`);
      process.exit(0);
    }
    const listed = listTestFiles(wsDir, []);
    if (!listed) {
      console.log(
        '::warning::tia-map: `vitest list` unavailable — writing empty testFiles.'
      );
    }
    const summary = findCoverageSummary(wsDir);
    const map = buildCoverageMap({
      workspace: workspaceArg,
      generatedAt: new Date().toISOString(),
      testFiles: listed || [],
      sources: readCoverageSources(summary, wsDir),
      coverageSummary: summary ? relativize(summary, wsDir) : null,
    });
    const out = writeMap(wsDir, map);
    console.log(
      `tia-map: wrote ${map.testFiles.length} test file(s), ` +
        `${map.sources.length} source(s) → ${out}`
    );
  } catch (error) {
    const detail = error && error.message ? error.message : String(error);
    console.log(`::warning::tia-map: ${detail}`);
    try {
      // Best-effort: el artefacto debe existir aunque todo falle.
      const wsDir = resolveWorkspaceDir(workspaceArg);
      if (wsDir) writeMap(wsDir, emptyMap(workspaceArg));
    } catch {
      // Ultimo recurso: ni siquiera el mapa vacio pudo escribirse.
    }
  }
  process.exit(0);
}

if (
  process.argv[1] &&
  import.meta.url.endsWith(path.basename(process.argv[1]))
) {
  main();
}
