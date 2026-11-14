#!/usr/bin/env node
// ============================================================================
// check-root-manifest.mjs — Guard de higiene del manifest raíz
// (change `root-manifest-cleanup`, spec `root-manifest-hygiene`)
// ============================================================================
// Valida que el bloque `dependencies` del `package.json` raíz contenga solo:
//   (a) requisitos directos: claves declaradas en los manifests de los
//       workspaces o en las `devDependencies` del raíz, o
//   (b) entradas de la allowlist versionada `manifest-allowlist.json` (raíz),
//       cada una con `reason`, `owner` e `issue` obligatorios.
//
// Por qué existe: el manifest raíz quedó "aplanado" (825 dependencies, 92%
// transitivas promovidas) — causa de falsos positivos de typosquatting
// (`Package/Version X not on NPM` en GuardDog), riesgo de dependency
// confusion (workspaces privados declarados como deps públicas) y ruido en
// knip/dependency-review. Este guard impide la re-aplanación.
//
// Uso:
//   node scripts/check-root-manifest.mjs             # enforcing (exit 1 si hay inválidas)
//   node scripts/check-root-manifest.mjs --report    # lista removibles, siempre exit 0
//
// Exit codes: 0 ok / 1 violaciones / 2 allowlist ausente o inválida.
//
// Node >= 20, sin dependencias externas (node:fs / node:path).
// ============================================================================

import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const REPORT = process.argv.includes('--report');

// ----------------------------------------------------------------------------
// Allowlist versionada (change `ci-quality-gates-blocking-hardening`, P2.1):
// `manifest-allowlist.json` en la raíz, bajo CODEOWNERS. Schema:
//   { "allow": ["name"], "entries": [{ "name", "reason", "owner", "issue" }] }
// `allow` es la lista efectiva y `entries` el registro auditable: cada nombre
// permitido DEBE tener una entrada con motivo, responsable y issue. Sin el
// archivo el guard sale con exit 2 (config ausente ≠ config vacía).
// ----------------------------------------------------------------------------
const ALLOWLIST_PATH = join(ROOT, 'manifest-allowlist.json');

if (!existsSync(ALLOWLIST_PATH)) {
  console.error(
    `✖ Falta ${ALLOWLIST_PATH}.\n` +
      'La allowlist del manifest raíz es un fichero versionado (manifest-allowlist.json); ' +
      'no se asume vacía. Restáurala desde git o crea { "allow": [], "entries": [] }.'
  );
  process.exit(2);
}

let allowlistConfig;
try {
  allowlistConfig = JSON.parse(readFileSync(ALLOWLIST_PATH, 'utf8'));
} catch (err) {
  console.error(
    `✖ ${ALLOWLIST_PATH} no es JSON válido: ${err instanceof Error ? err.message : err}`
  );
  process.exit(2);
}

const ALLOWLIST = Array.isArray(allowlistConfig.allow)
  ? allowlistConfig.allow
  : [];
const ALLOWLIST_ENTRIES = Array.isArray(allowlistConfig.entries)
  ? allowlistConfig.entries
  : [];

// ----------------------------------------------------------------------------
// Carga del manifest raíz
// ----------------------------------------------------------------------------
const rootManifestPath = join(ROOT, 'package.json');
const rootManifest = JSON.parse(readFileSync(rootManifestPath, 'utf8'));
const rootDeps = Object.keys(rootManifest.dependencies ?? {});
const rootDevDeps = Object.keys(rootManifest.devDependencies ?? {});

// ----------------------------------------------------------------------------
// Requisitos directos: unión de los manifests de los workspaces + devDeps raíz.
// Los workspaces se resuelven del campo `workspaces` del raíz (soporta "apps/*"
// y rutas literales).
// ----------------------------------------------------------------------------
function resolveWorkspaceDirs(workspaces) {
  const dirs = [];
  for (const pattern of workspaces ?? []) {
    if (pattern.endsWith('/*')) {
      const base = pattern.slice(0, -2);
      const baseDir = join(ROOT, base);
      if (!existsSync(baseDir)) continue;
      for (const entry of readdirSync(baseDir, { withFileTypes: true })) {
        if (
          entry.isDirectory() &&
          existsSync(join(baseDir, entry.name, 'package.json'))
        ) {
          dirs.push(join(base, entry.name));
        }
      }
    } else if (existsSync(join(ROOT, pattern, 'package.json'))) {
      dirs.push(pattern);
    }
  }
  return dirs;
}

const direct = new Set(rootDevDeps);
for (const ws of resolveWorkspaceDirs(rootManifest.workspaces)) {
  const manifest = JSON.parse(
    readFileSync(join(ROOT, ws, 'package.json'), 'utf8')
  );
  for (const section of [
    'dependencies',
    'devDependencies',
    'peerDependencies',
    'optionalDependencies',
  ]) {
    for (const name of Object.keys(manifest[section] ?? {})) {
      direct.add(name);
    }
  }
}

// ----------------------------------------------------------------------------
// Validación de la allowlist: cada `allow` exige una entrada con
// `reason`, `owner` e `issue` (auditable en el PR que la introduce).
// ----------------------------------------------------------------------------
const allowNames = new Set();
const allowlistErrors = [];

if (!Array.isArray(allowlistConfig.allow)) {
  allowlistErrors.push('`allow` debe ser un array de nombres');
}
if (!Array.isArray(allowlistConfig.entries)) {
  allowlistErrors.push('`entries` debe ser un array de objetos');
}

for (const name of ALLOWLIST) {
  if (typeof name !== 'string' || name.trim() === '') {
    allowlistErrors.push('`allow` contiene una entrada vacía o no-string');
    continue;
  }
  allowNames.add(name);
}

const entryNames = new Set();
for (const entry of ALLOWLIST_ENTRIES) {
  if (!entry?.name) {
    allowlistErrors.push('entrada de `entries` sin `name`');
    continue;
  }
  entryNames.add(entry.name);
  for (const field of ['reason', 'owner', 'issue']) {
    if (!entry[field] || String(entry[field]).trim() === '') {
      allowlistErrors.push(
        `entries[${entry.name}]: falta \`${field}\` (obligatorio, auditable)`
      );
    }
  }
}

for (const name of allowNames) {
  if (!entryNames.has(name)) {
    allowlistErrors.push(
      `allow[${name}]: sin entrada en \`entries\` (motivo/responsable/issue)`
    );
  }
}

// ----------------------------------------------------------------------------
// Cálculo de inválidas
// ----------------------------------------------------------------------------
const invalid = rootDeps.filter(
  (name) => !direct.has(name) && !allowNames.has(name)
);

// ----------------------------------------------------------------------------
// Salida
// ----------------------------------------------------------------------------
const banner = REPORT
  ? '── REPORTE (no bloquea) ──'
  : '── GUARD (enforcing) ──';
console.log(banner);
console.log(`dependencies raíz      : ${rootDeps.length}`);
console.log(
  `requisitos directos    : ${direct.size} (workspaces + devDeps raíz)`
);
console.log(`allowlist              : ${allowNames.size}`);

if (allowlistErrors.length > 0) {
  console.error('\n✖ Allowlist inválida:');
  for (const err of allowlistErrors) console.error(`  - ${err}`);
  process.exit(2);
}

if (invalid.length === 0) {
  console.log(
    '\n✅ Sin entradas inválidas: dependencies ⊆ directos ∪ allowlist'
  );
  process.exit(0);
}

console.log(
  `\n✖ Entradas inválidas (no directas, no allowlist): ${invalid.length}`
);
for (const name of invalid) {
  const version = rootManifest.dependencies[name];
  console.log(`  - ${name}@${version}`);
}

if (!REPORT) {
  console.error(
    `\nFallo: el manifest raíz tiene ${invalid.length} dependencies no justificadas.\n` +
      'El raíz es un manifiesto de orquestación: las dependencias de los workspaces se declaran en cada workspace,\n' +
      'y el tooling del raíz vive en devDependencies. Para una excepción real, añádela a\n' +
      'manifest-allowlist.json (`allow` + `entries` con reason/owner/issue, se audita en el PR).\n' +
      'Ver spec: openspec/specs/root-manifest-hygiene'
  );
  process.exit(1);
}

console.log('\n(--report: solo informa, no falla)');
process.exit(0);
