#!/usr/bin/env node
// Change ci-mise-toolchain-parity (task 2.7): auditoría grep-based de workflows.
// Falla si una herramienta de lint/seguridad gestionada por Mise se invoca
// fuera de Mise (docker://, docker run de imagen de herramienta, uvx o action
// de herramienta). Lo correcto es `mise exec -- <tool>` con el pin de mise.lock.
//
// Uso: node scripts/ci/toolchain-audit.mjs   (exit 1 si hay violaciones)

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Herramientas declaradas en mise.toml (pin único). Mantener en sync con mise.toml.
const MANAGED_TOOLS = [
  'gitleaks',
  'checkov',
  'hadolint',
  'actionlint',
  'zizmor',
  'semgrep',
  'guarddog',
];

const TOOL_ALT = MANAGED_TOOLS.join('|');

// Excepciones documentadas (no son binarios de Mise): gitleaks-action es la
// capa licenciada opcional del job secrets en ci.yml.
const ALLOWED_ACTIONS = [/^gitleaks\/gitleaks-action@/];

const RULES = [
  {
    rule: 'docker-uses',
    re: /^\s*uses:\s*docker:\/\/\S*(?:gitleaks|checkov|hadolint|actionlint|zizmor|semgrep|guarddog)/i,
  },
  {
    rule: 'uvx',
    re: /\buvx\s+(?:zizmor|checkov|semgrep|guarddog|gitleaks|hadolint|actionlint)\b/,
  },
  {
    rule: 'docker-run-tool',
    re: new RegExp(`\\bdocker\\s+run\\b.*\\b(?:${TOOL_ALT})\\b`, 'i'),
  },
  {
    rule: 'tool-action',
    re: new RegExp(`^\\s*(?:-\\s*)?uses:\\s*\\S*(?:${TOOL_ALT})\\S*@`, 'i'),
  },
];

/**
 * Audita el texto de un workflow.
 * @returns {Array<{file:string,line:number,rule:string,text:string}>}
 */
export function auditWorkflowText(file, text) {
  const violations = [];
  const lines = text.split(/\r?\n/);
  lines.forEach((raw, idx) => {
    const line = raw.trim();
    if (line.startsWith('#')) return; // comentarios: documentan la migración
    if (/^\s*(?:-\s*)?uses:/.test(raw)) {
      const ref = raw.replace(/^\s*(?:-\s*)?uses:\s*/, '');
      if (ALLOWED_ACTIONS.some((re) => re.test(ref))) return;
    }
    for (const { rule, re } of RULES) {
      if (re.test(raw)) {
        violations.push({ file, line: idx + 1, rule, text: line });
        break; // una regla por línea
      }
    }
  });
  return violations;
}

function main() {
  const root = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    '..',
    '..'
  );
  const dir = path.join(root, '.github', 'workflows');
  const files = fs.readdirSync(dir).filter((f) => /\.ya?ml$/.test(f));
  const all = files.flatMap((f) =>
    auditWorkflowText(f, fs.readFileSync(path.join(dir, f), 'utf8'))
  );
  if (all.length === 0) {
    console.log(
      `✅ toolchain-audit: ${files.length} workflows, 0 invocaciones fuera de Mise.`
    );
    return 0;
  }
  console.error(
    `❌ toolchain-audit: ${all.length} invocación(es) fuera de Mise:`
  );
  for (const v of all)
    console.error(`  ${v.file}:${v.line} [${v.rule}] ${v.text}`);
  console.error('Usa `mise exec -- <tool>` con el pin de mise.toml/mise.lock.');
  return 1;
}

if (
  process.argv[1] &&
  fileURLToPath(import.meta.url) === path.resolve(process.argv[1])
) {
  process.exitCode = main();
}
