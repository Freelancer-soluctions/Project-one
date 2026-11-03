#!/usr/bin/env node
/**
 * G2 — Snapshot update gate (PRD: Snapshot tests en un pipeline enterprise).
 *
 * Falla si algún flag de actualización de snapshots (`-u`, `--update`,
 * `updateSnapshots`) aparece en:
 *   - los scripts npm del `package.json` raíz y de `apps/<workspace>/package.json`
 *   - los steps `run:` de `.github/workflows/*.yml`
 *
 * Allowlist explícita (versionada, única vía de exención — revisada en PR):
 *   - `test:snapshot` / `test:snapshot:refresh` en `apps/client/package.json`
 *     (uso local deliberado; CI nunca los invoca — el drift probe nocturno los
 *     invoca en un checkout desechable, y lo hace por nombre exacto de script).
 *
 * Patrón anclado `-u([ =]|$)|--update|updateSnapshots` (evita falsos positivos
 * de substrings como `-url`, `--max-warnings`, URLs). Heredado de la task 5.5d
 * del change archivado 2026-10-09-client-snapshot-testing.
 *
 * Exit 0 = limpio; exit 1 = match (nombra fichero y línea).
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

/** Allowlist: scripts npm cuyo VALOR puede contener flags de update (uso local). */
const ALLOWED_SCRIPTS = new Set(['test:snapshot', 'test:snapshot:refresh']);

/**
 * Patrón anclado: `--update`, `updateSnapshots`, o `-u` corto SOLO con contexto
 * npm/vitest (`npm run x -u`, `vitest -u`, `npx vitest -u`) — evita falsos
 * positivos de flags de otros binarios (`date -u`) y de substrings (`-url`,
 * `--max-warnings`, URLs). Heredado de la task 5.5d del change archivado
 * 2026-10-09-client-snapshot-testing.
 */
const UPDATE_PATTERN =
  /--update|updateSnapshots|(?:npm|npx|pnpm|yarn|vitest|jest)[^&|;]*?\s-u([ =]|$)/;

export function scanPackageScripts(pkgJson, { fileName }) {
  const findings = [];
  const scripts = pkgJson?.scripts ?? {};
  for (const [name, cmd] of Object.entries(scripts)) {
    if (typeof cmd !== 'string') continue;
    if (ALLOWED_SCRIPTS.has(name)) continue;
    if (UPDATE_PATTERN.test(cmd)) {
      findings.push({ file: fileName, where: `scripts["${name}"]`, line: cmd });
    }
  }
  return findings;
}

/** Extrae los valores de `run:` de un YAML de workflow (líneas `run:` y `run: |`). */
export function extractRunBlocks(yamlText) {
  const lines = yamlText.split(/\r?\n/);
  const blocks = [];
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/^(\s*)(?:-\s+)?run:\s*(.*)$/);
    if (!m) continue;
    const indent = m[1].length;
    const inline = m[2].trim();
    if (
      inline &&
      inline !== '|' &&
      inline !== '>' &&
      inline !== '|-' &&
      inline !== '>-'
    ) {
      blocks.push({ line: i + 1, text: inline });
    } else {
      // Bloque multilínea: consume las líneas más indentadas que `run:`.
      let j = i + 1;
      while (j < lines.length) {
        const l = lines[j];
        if (l.trim() === '' || /^\s*#/.test(l)) {
          j++;
          continue;
        }
        const lIndent = l.match(/^\s*/)[0].length;
        if (lIndent > indent) {
          blocks.push({ line: j + 1, text: l.trim() });
          j++;
          continue;
        }
        break;
      }
    }
  }
  return blocks;
}

export function scanWorkflowYaml(yamlText, { fileName }) {
  const findings = [];
  for (const block of extractRunBlocks(yamlText)) {
    if (UPDATE_PATTERN.test(block.text)) {
      findings.push({
        file: fileName,
        where: `run: (line ${block.line})`,
        line: block.text,
      });
    }
  }
  return findings;
}

export function runGate({ root = repoRoot } = {}) {
  const findings = [];

  // 1. package.json raíz + apps/*/package.json
  const pkgCandidates = [join(root, 'package.json')];
  const appsDir = join(root, 'apps');
  if (existsSync(appsDir)) {
    for (const entry of readdirSync(appsDir, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      const pkg = join(appsDir, entry.name, 'package.json');
      if (existsSync(pkg)) pkgCandidates.push(pkg);
    }
  }
  for (const pkgPath of pkgCandidates) {
    let pkgJson;
    try {
      pkgJson = JSON.parse(readFileSync(pkgPath, 'utf8'));
    } catch (err) {
      findings.push({
        file: pkgPath,
        where: '(parse)',
        line: String(err.message),
      });
      continue;
    }
    findings.push(...scanPackageScripts(pkgJson, { fileName: pkgPath }));
  }

  // 2. .github/workflows/*.yml — solo steps `run:`
  const workflowsDir = join(root, '.github', 'workflows');
  if (existsSync(workflowsDir)) {
    for (const entry of readdirSync(workflowsDir, { withFileTypes: true })) {
      if (!entry.isFile() || !/\.ya?ml$/.test(entry.name)) continue;
      const wfPath = join(workflowsDir, entry.name);
      const text = readFileSync(wfPath, 'utf8');
      findings.push(...scanWorkflowYaml(text, { fileName: wfPath }));
    }
  }

  return findings;
}

export function formatFindings(findings) {
  if (findings.length === 0) return null;
  const lines = [
    'snapshot-update-gate: snapshot update flags are FORBIDDEN in CI-reachable surfaces.',
    'Snapshot updates must go through the reviewed allowlisted local scripts',
    '(`test:snapshot` / `test:snapshot:refresh` in apps/client) or a reviewed',
    'allowlist change in scripts/ci/snapshot-update-gate.mjs. Findings:',
  ];
  for (const f of findings) {
    lines.push(`  - ${f.file} :: ${f.where} :: ${f.line.slice(0, 200)}`);
  }
  return lines.join('\n');
}

const isMain =
  process.argv[1] &&
  import.meta.url ===
    new URL(`file:///${process.argv[1].replace(/\\/g, '/')}`).href;
if (isMain) {
  const findings = runGate();
  const report = formatFindings(findings);
  if (report) {
    console.error(report);
    process.exit(1);
  }
  console.log(
    'snapshot-update-gate: clean — no update flags in CI-reachable scripts or workflow run: steps.'
  );
  process.exit(0);
}
