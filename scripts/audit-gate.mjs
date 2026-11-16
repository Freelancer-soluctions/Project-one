#!/usr/bin/env node
// scripts/audit-gate.mjs
// Lee el reporte JSON de `npm audit` y aplica la política de gate:
//   - critical: siempre bloquea (con o sin fix)
//   - high: bloquea si hay fix disponible (fixAvailable)
//   - moderate/low: advisory (warning, no bloquea)
//   - Registro caído o reporte ilegible: fail-closed (exit 2)
// Exit codes: 0 = pasa, 1 = hallazgos bloqueantes, 2 = auditoría inválida
import { readFileSync, existsSync } from 'node:fs';

const [reportPath, excPath] = process.argv.slice(2);
const rank = { info: 0, low: 1, moderate: 2, high: 3, critical: 4 };
const today = new Date().toISOString().slice(0, 10);

let report;
try {
  report = JSON.parse(readFileSync(reportPath, 'utf8'));
} catch (e) {
  console.error('::error::reporte ilegible:', e.message);
  process.exit(2);
}

if (report.error || !report.vulnerabilities) {
  console.error(
    '::error::auditoría no válida:',
    JSON.stringify(report.error ?? 'sin vulnerabilities')
  );
  process.exit(2);
}

const exc = existsSync(excPath ?? '')
  ? JSON.parse(readFileSync(excPath, 'utf8'))
  : [];
const active = new Map(
  exc.filter((e) => e.expires >= today).map((e) => [e.ghsa, e])
);
const expired = exc.filter((e) => e.expires < today);

const block = [];
const advisory = [];

for (const [name, v] of Object.entries(report.vulnerabilities)) {
  const ids = (v.via || [])
    .filter((x) => typeof x === 'object')
    .map((x) => (x.url ?? '').split('/').pop());
  if (ids.length && ids.every((id) => active.has(id))) continue;
  const fix =
    v.fixAvailable === true ||
    (typeof v.fixAvailable === 'object' && v.fixAvailable !== null);
  const r = rank[v.severity] ?? 0;
  const entry = `${name} ${v.severity} fix=${fix} ${ids.join(',')}`;
  if (r >= rank.critical || (r >= rank.high && fix)) {
    block.push(entry);
  } else if (r >= rank.moderate) {
    advisory.push(entry);
  }
}

expired.forEach((e) =>
  console.log(`::warning::excepción vencida: ${e.ghsa} (${e.expires})`)
);
advisory.forEach((a) => console.log(`::warning::advisory (no bloquea): ${a}`));
block.forEach((b) => console.log(`::error::bloqueante: ${b}`));

if (block.length > 0) {
  console.log(`::error::Hallazgos bloqueantes: ${block.length}`);
  process.exit(1);
}
console.log('Sin hallazgos bloqueantes (critical, o high con fix disponible).');
process.exit(0);
