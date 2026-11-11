#!/usr/bin/env node
// ============================================================
// Métricas mensuales de seguridad
// (change `security-exceptions-policy`, tasks 2.2/2.3)
// ============================================================
// Recolecta las 7 métricas del PRD y escribe un informe markdown + JSON.
// Fuentes: `security/exceptions.yml` (fichero) y la API de GitHub Actions
// (runs/jobs del repo). Las métricas que requieren historial de fechas de
// vulnerabilidad (tiempo a corregir, SLA incumplidos) se marcan como `n/d`
// con la fuente pendiente — no se inventan valores.
//
// Uso:
//   GH_TOKEN=... node scripts/security/security-metrics.mjs \
//     --out security/metrics/2026-11.md --json security/metrics/latest.json

import fs from 'node:fs';
import path from 'node:path';
import { parse } from 'yaml';

const API = 'https://api.github.com';
const REPO =
  process.env.GITHUB_REPOSITORY ?? 'Freelancer-soluctions/Project-one';
const TOKEN = process.env.GH_TOKEN ?? process.env.GITHUB_TOKEN;
const WINDOW_DAYS = 30;
const since = new Date(Date.now() - WINDOW_DAYS * 86_400_000).toISOString();
const today = new Date().toISOString().slice(0, 10);
const reviewer = process.env.GITHUB_ACTOR ?? 'automated';

function arg(name, fallback) {
  const index = process.argv.indexOf(`--${name}`);
  return index !== -1 && process.argv[index + 1]
    ? process.argv[index + 1]
    : fallback;
}

async function api(pathname) {
  const response = await fetch(`${API}${pathname}`, {
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      Accept: 'application/vnd.github+json',
      'User-Agent': 'security-metrics',
    },
  });
  if (!response.ok) throw new Error(`${pathname} -> HTTP ${response.status}`);
  return response.json();
}

function readExceptions() {
  const file = path.join('security', 'exceptions.yml');
  const doc = parse(fs.readFileSync(file, 'utf8'));
  const list = Array.isArray(doc?.exceptions) ? doc.exceptions : [];
  const active = list.filter(
    (entry) => typeof entry.expires === 'string' && entry.expires >= today
  );
  const earliest = active
    .map((entry) => entry.expires)
    .filter(Boolean)
    .sort()[0];
  const recentlyCreated = list.filter(
    (entry) =>
      typeof entry.created === 'string' && entry.created >= since.slice(0, 10)
  ).length;
  return {
    total: list.length,
    active: active.length,
    earliest,
    recentlyCreated,
  };
}

async function securityStage() {
  const runs = await api(
    `/repos/${REPO}/actions/workflows/ci.yml/runs?created=%3E%3D${encodeURIComponent(since)}&per_page=50`
  );
  const failed = (runs.workflow_runs ?? [])
    .filter((run) => run.conclusion === 'failure')
    .slice(0, 20);
  let blocked = 0;
  const durations = [];
  for (const run of failed) {
    const jobs = await api(
      `/repos/${REPO}/actions/runs/${run.id}/jobs?per_page=100`
    );
    const stage = (jobs.jobs ?? []).find(
      (job) => job.name === 'Prebuild Security Complete'
    );
    if (!stage) continue;
    if (stage.conclusion === 'failure') blocked += 1;
    if (stage.started_at && stage.completed_at) {
      const minutes =
        (new Date(stage.completed_at) - new Date(stage.started_at)) / 60_000;
      if (Number.isFinite(minutes) && minutes > 0) durations.push(minutes);
    }
  }
  durations.sort((a, b) => a - b);
  const median = durations.length
    ? durations[Math.floor(durations.length / 2)]
    : null;
  return {
    blocked,
    medianMinutes: median === null ? null : Math.round(median * 10) / 10,
    sampled: failed.length,
  };
}

async function scheduledFailures() {
  const runs = await api(
    `/repos/${REPO}/actions/workflows/scheduled-security.yml/runs?created=%3E%3D${encodeURIComponent(since)}&per_page=50`
  );
  const list = runs.workflow_runs ?? [];
  return {
    failures: list.filter((run) =>
      ['failure', 'timed_out'].includes(run.conclusion)
    ).length,
    total: list.length,
  };
}

const fmt = (value) =>
  value === null || value === undefined ? 'n/d' : String(value);

async function main() {
  const rows = [];
  let exceptions = { total: 0, active: 0, earliest: null, recentlyCreated: 0 };
  let stage = { blocked: null, medianMinutes: null, sampled: 0 };
  let scheduled = { failures: null, total: null };

  try {
    exceptions = readExceptions();
  } catch (error) {
    console.warn(
      `warn: no se pudo leer security/exceptions.yml: ${error.message}`
    );
  }
  try {
    stage = await securityStage();
  } catch (error) {
    console.warn(`warn: métricas de ci.yml no disponibles: ${error.message}`);
  }
  try {
    scheduled = await scheduledFailures();
  } catch (error) {
    console.warn(
      `warn: métricas de scheduled-security.yml no disponibles: ${error.message}`
    );
  }

  rows.push([
    'Tiempo a corregir por severidad',
    'n/d',
    'Sin fuente de fechas de vulnerabilidad todavía (SLA.md §2)',
  ]);
  rows.push([
    'Incumplimientos de SLA abiertos',
    'n/d',
    'Requiere historial de detección; ver security/SLA.md §3',
  ]);
  rows.push([
    'PRs bloqueados por seguridad',
    fmt(stage.blocked),
    `Runs de ci.yml con Prebuild Security Complete en failure (últimos ${WINDOW_DAYS} d, muestra ${stage.sampled})`,
  ]);
  rows.push([
    'Falsos positivos / mes (proxy)',
    fmt(exceptions.recentlyCreated),
    'Excepciones creadas en los últimos 30 d',
  ]);
  rows.push([
    'Excepciones activas y vencimiento más próximo',
    `${exceptions.active} activas${exceptions.earliest ? ` (próxima: ${exceptions.earliest})` : ''}`,
    `security/exceptions.yml (total ${exceptions.total})`,
  ]);
  rows.push([
    'Duración del stage de seguridad',
    stage.medianMinutes === null
      ? 'n/d'
      : `${stage.medianMinutes} min (mediana)`,
    'Jobs de Prebuild Security Complete en runs fallidos',
  ]);
  rows.push([
    'Runs con fallo de herramienta/infra',
    fmt(scheduled.failures),
    `scheduled-security.yml con failure/timed_out (${fmt(scheduled.total)} runs)`,
  ]);

  const month = today.slice(0, 7);
  const markdown = [
    `# Métricas de seguridad — ${month}`,
    '',
    `- **Fecha:** ${today}`,
    `- **Revisor:** ${reviewer}`,
    `- **Ventana:** últimos ${WINDOW_DAYS} días`,
    `- **Fuente:** \`scripts/security/security-metrics.mjs\` + \`security/exceptions.yml\``,
    '',
    '| Métrica | Valor | Fuente / nota |',
    '| ------- | ----- | ------------- |',
    ...rows.map(
      ([name, value, source]) => `| ${name} | ${value} | ${source} |`
    ),
    '',
    '## Acciones',
    '',
    '- Revisar excepciones próximas a vencer (`docs/runbooks/security/exception-expiry.md`).',
    '- Abrir follow-ups de SLA incumplido (`docs/runbooks/security/cve-triage.md`).',
    '- Registrar la decisión de la revisión en el issue `[monthly-security-metrics]`.',
    '',
  ].join('\n');

  const out = arg('out', `security/metrics/${month}.md`);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, markdown, 'utf8');

  const jsonPath = arg('json');
  if (jsonPath) {
    fs.mkdirSync(path.dirname(jsonPath), { recursive: true });
    fs.writeFileSync(
      jsonPath,
      `${JSON.stringify({ generatedAt: new Date().toISOString(), reviewer, month, metrics: rows.map(([name, value, source]) => ({ name, value, source })) }, null, 2)}\n`,
      'utf8'
    );
  }

  console.log(markdown);
}

main().catch((error) => {
  console.error(`security-metrics: ${error.message}`);
  process.exit(1);
});
