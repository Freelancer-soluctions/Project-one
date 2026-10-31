#!/usr/bin/env node
/**
 * G5 — Snapshot orphan check (change `snapshot-gates`).
 *
 * Para cada `.snap` bajo `apps/client/src` dentro de directorios `__snapshots__/`,
 * verifica que el dueño hermano existe y usa un matcher de snapshots:
 *
 *   `__snapshots__/<name>.snap` → `<name>` en el directorio PADRE de `__snapshots__/`
 *
 * El dueño debe contener `toMatchSnapshot` o `toMatchInlineSnapshot`. Un `.snap`
 * sin dueño vivo es un artefacto huérfano: sobrevive a refactorings que borran
 * el test y ensucia el diff de los refresh.
 *
 * Exit 0 = limpio; exit 1 = lista de huérfanos (nombra cada `.snap`).
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

export function findSnapFiles({
  root = repoRoot,
  srcDir = 'apps/client/src',
} = {}) {
  const snaps = [];
  const base = join(root, srcDir);
  if (!existsSync(base)) return snaps;
  function walk(dir) {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const fp = join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === '__snapshots__') {
          for (const f of readdirSync(fp, { withFileTypes: true })) {
            if (f.isFile() && f.name.endsWith('.snap'))
              snaps.push(join(fp, f.name));
          }
        } else {
          walk(fp);
        }
      }
    }
  }
  walk(base);
  return snaps;
}

export function checkOrphans({
  root = repoRoot,
  srcDir = 'apps/client/src',
} = {}) {
  const orphans = [];
  for (const snapPath of findSnapFiles({ root, srcDir })) {
    const snapDir = dirname(snapPath);
    const parentDir = dirname(snapDir);
    const ownerName = basename(snapPath, '.snap'); // `<name>.ui.test.jsx.snap` → `<name>.ui.test.jsx`
    const ownerPath = join(parentDir, ownerName);
    if (!existsSync(ownerPath)) {
      orphans.push({ snap: snapPath, reason: 'no owner file' });
      continue;
    }
    const src = readFileSync(ownerPath, 'utf8');
    if (
      !src.includes('toMatchSnapshot') &&
      !src.includes('toMatchInlineSnapshot')
    ) {
      orphans.push({
        snap: snapPath,
        reason: `owner ${ownerName} has no snapshot matcher`,
      });
    }
  }
  return orphans;
}

export function formatOrphans(orphans) {
  if (orphans.length === 0) return null;
  const lines = [
    'snapshot-orphan-check: orphaned .snap files found (no live owner with a snapshot matcher):',
  ];
  for (const o of orphans) {
    lines.push(`  - ${o.snap} :: ${o.reason}`);
  }
  lines.push('Delete the orphaned .snap or restore its owner test file.');
  return lines.join('\n');
}

const isMain =
  process.argv[1] &&
  import.meta.url ===
    new URL(`file:///${process.argv[1].replace(/\\/g, '/')}`).href;
if (isMain) {
  const orphans = checkOrphans();
  const report = formatOrphans(orphans);
  if (report) {
    console.error(report);
    process.exit(1);
  }
  console.log(
    'snapshot-orphan-check: clean — every .snap has a live owner with a snapshot matcher.'
  );
  process.exit(0);
}
