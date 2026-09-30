#!/usr/bin/env node
/* globals process, console */
// ============================================================================
// check-root-manifest.mjs — Guard de higiene del manifest raíz
// (change `root-manifest-cleanup`, spec `root-manifest-hygiene`)
// ============================================================================
// Valida que el bloque `dependencies` del `package.json` raíz contenga solo:
//   (a) requisitos directos: claves declaradas en los manifests de los
//       workspaces o en las `devDependencies` del raíz, o
//   (b) entradas de la ALLOWLIST de abajo, cada una con `reason` obligatoria.
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
// Node >= 20, sin dependencias externas (node:fs / node:path).
// ============================================================================

import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const REPORT = process.argv.includes('--report');

// ----------------------------------------------------------------------------
// Allowlist versionada (D3 del design): entradas permitidas en `dependencies`
// del raíz sin ser requisitos directos. Cada entrada DEBE tener `reason`; una
// entrada sin reason hace fallar el guard (config inválida).
// ----------------------------------------------------------------------------
const ALLOWLIST = [
  // { name: 'ejemplo', reason: 'por qué el raíz lo necesita aunque nadie lo declare' },
];

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
// Validación de la allowlist: reason es obligatoria (auditable)
// ----------------------------------------------------------------------------
const allowNames = new Set();
const allowlistErrors = [];
for (const entry of ALLOWLIST) {
  if (!entry?.name) {
    allowlistErrors.push('entrada de allowlist sin `name`');
    continue;
  }
  if (!entry.reason || String(entry.reason).trim() === '') {
    allowlistErrors.push(
      `allowlist[${entry.name}]: falta \`reason\` (obligatoria, auditable)`
    );
    continue;
  }
  allowNames.add(entry.name);
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
  process.exit(1);
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
      'y el tooling del raíz vive en devDependencies. Para una excepción real, añádela a ALLOWLIST en\n' +
      'scripts/check-root-manifest.mjs con `reason` (se audita en el PR). Ver spec: openspec/specs/root-manifest-hygiene'
  );
  process.exit(1);
}

console.log('\n(--report: solo informa, no falla)');
process.exit(0);
