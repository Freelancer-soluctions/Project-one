#!/usr/bin/env node
/* globals process, console, URL */
/**
 * Deriva el conjunto de exclusiones de los runs bloqueantes de PR a partir de
 * `.github/flaky-quarantine.yml` (spec `ci-flaky-quarantine`, D9).
 *
 * Reglas duras:
 *  - La ÚNICA fuente de la lista de exclusión es el fichero versionado. Nada de
 *    `test.skip`, markers en la fuente ni quarantine automática (tasks 5.2/5.5).
 *  - Cada entrada requiere `test` y `file`; `date`, `reason` y `owner` se validan
 *    como metadatos obligatorios para que la entrada sea triable, pero NO forman
 *    parte del glob (el glob describe DÓNDE vive el test).
 *  - Salida: un `--exclude=<glob>` por entrada (aditivo en Vitest 4: el CLI
 *    hace `resolved.exclude.push(...cliExclude)`, no pisa los defaults) y un
 *    informe en stdout + Markdown para el run report.
 *
 * Uso (desde la raíz del repo, como los jobs de test):
 *   ARGS=$(node scripts/ci/quarantine-exclude.mjs --format=argv)
 *   npm run test:coverage:unit:ci --workspace=apps/server -- $ARGS
 *
 * Flags:
 *   --format=argv   (default) solo los flags --exclude, separados por espacios,
 *                   suitable para interpolar en el comando de vitest.
 *   --format=md     Markdown para el step summary (informe de exclusión).
 *   --format=json   Estructura parseable (diagnóstico/tests excluidos).
 *   --empty-ok      Con lista vacía no falla (comportamiento por defecto).
 *
 * Exit codes: 0 sin exclusiones o con exclusiones; 1 si el fichero existe pero
 * está mal formado (entradas sin campos obligatorios) — un fichero corrupto NO
 * puede degenerar en "excluir todo" ni en "excluir nada" en silencio.
 */
import fs from 'node:fs';
import path from 'node:path';

// Raíz del REPO (no el cwd): los jobs invocan este script con cwd = workspace
// (npm --workspace), y los globs deben poder derivarse en ambos ejes.
const REPO_ROOT = path.resolve(
  path.dirname(
    new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')
  ),
  '..',
  '..'
);
const QUARANTINE_FILE = path.resolve(
  REPO_ROOT,
  process.env.QUARANTINE_FILE || '.github/flaky-quarantine.yml'
);

const REQUIRED = ['test', 'file', 'date', 'reason', 'owner'];

/** Desenvuelve comillas simples o dobles de un valor YAML plano inline. */
function unquote(value) {
  const v = value.trim();
  if (
    (v.startsWith('"') && v.endsWith('"') && v.length > 1) ||
    (v.startsWith("'") && v.endsWith("'") && v.length > 1)
  ) {
    return v.slice(1, -1);
  }
  return v;
}

/**
 * Parser de la lista YAML plana del repo (mismo esquema que
 * `.github/license-policy.yml`, que consume `node -e` inline en
 * `scancode-license-pr-diff`). Una entrada = un item `- ` bajo `quarantine:`.
 */
export function parseQuarantine(source) {
  const lines = source.split(/\r?\n/);
  const start = lines.findIndex((l) =>
    /^quarantine:\s*(\[\s*\])?\s*(#.*)?$/.test(l)
  );
  if (start === -1) {
    throw new Error(
      `clave "quarantine:" no encontrada en ${path.basename(QUARANTINE_FILE)}`
    );
  }
  // Lista vacía declarada en línea (`quarantine: []`): no hay entradas que leer.
  if (/^\s*\[\s*\]\s*$/.test(lines[start].slice('quarantine:'.length))) {
    return [];
  }

  const entries = [];
  let current = null;
  for (let i = start + 1; i < lines.length; i++) {
    const line = lines[i];
    if (/^\S/.test(line) && line.trim() !== '') break; // otra clave de nivel raíz → fin
    const itemMatch = line.match(/^\s*-\s+(\w[\w-]*):\s*(.*)$/);
    if (itemMatch) {
      current = {};
      entries.push(current);
      current[itemMatch[1]] = unquote(itemMatch[2]);
      continue;
    }
    if (!current) continue; // comentarios/saltos antes de la primera entrada
    const fieldMatch = line.match(/^\s+(\w[\w-]*):\s*(.*)$/);
    if (fieldMatch) {
      current[fieldMatch[1]] = unquote(fieldMatch[2]);
      continue;
    }
    if (/^\s*-\s+/.test(line)) {
      // Item sin clave `k:` → línea de lista huérfana: no es una entrada válida.
      throw new Error(
        `entrada de quarantine mal formada en línea ${i + 1}: "${line.trim()}"`
      );
    }
  }
  return entries;
}

function validate(entries) {
  const problems = [];
  entries.forEach((entry, index) => {
    for (const field of REQUIRED) {
      const value = entry[field];
      if (value === undefined || value === '') {
        problems.push(
          `entrada #${index + 1}: falta el campo obligatorio "${field}"`
        );
      }
    }
    if (entry.date && !/^\d{4}-\d{2}-\d{2}$/.test(entry.date)) {
      problems.push(
        `entrada #${index + 1}: "date" debe ser YYYY-MM-DD (valor: "${entry.date}")`
      );
    }
  });
  return problems;
}

/**
 * Glob(s) de exclusión para una entrada.
 *
 * Vitest resuelve `exclude` contra rutas RELATIVAS a su `root`, que en los jobs
 * de este repo es el workspace (`apps/server`, `apps/client`) porque se ejecuta
 * con `npm run … --workspace=<ws>` (cwd = workspace). Por eso se emiten DOS
 * globs: el relativo al cwd del job y el relativo a la raíz del repo. Son
 * aditivos (un glob que no casa es un no-op), lo que hace el script correcto
 * tanto si se invoca desde el workspace como desde la raíz.
 */
export function toExcludeGlobs(entry, cwd = process.cwd()) {
  const file = entry.file;
  // Si la entrada ya declara un glob utilizable (patrón), se respeta tal cual.
  if (file.includes('*')) return [file];
  const repoRelative = file.replace(/^\.?\//, '');
  const globs = new Set([`**/${repoRelative}`]);
  const relativeToCwd = path
    .relative(cwd, path.join(REPO_ROOT, repoRelative))
    .split(path.sep)
    .join('/');
  if (relativeToCwd && !relativeToCwd.startsWith('..')) {
    globs.add(`**/${relativeToCwd}`);
  }
  return [...globs];
}

export function readQuarantine(root = REPO_ROOT) {
  const filePath = path.isAbsolute(QUARANTINE_FILE)
    ? QUARANTINE_FILE
    : path.join(root, QUARANTINE_FILE);
  if (!fs.existsSync(filePath)) return { entries: [], source: filePath };
  const entries = parseQuarantine(fs.readFileSync(filePath, 'utf8'));
  const problems = validate(entries);
  if (problems.length) {
    throw new Error(
      `${path.basename(filePath)} mal formado:\n  - ${problems.join('\n  - ')}`
    );
  }
  return { entries, source: filePath };
}

function renderArgv(entries) {
  const globs = entries.flatMap((entry) => toExcludeGlobs(entry));
  return [...new Set(globs)].map((glob) => `--exclude=${glob}`).join(' ');
}

function renderMarkdown(entries, source) {
  const rel = path.relative(REPO_ROOT, source) || QUARANTINE_FILE;
  if (!entries.length) {
    return [
      '### Flaky quarantine',
      '',
      `Lista vacía (\`${rel}\`): ningún test excluido de este run.`,
      '',
      'La exclusión de tests intermitentes se deriva EXCLUSIVAMENTE de la lista',
      'versionada; `test.skip` en la fuente es una violación (§3.4.7).',
    ].join('\n');
  }
  const rows = entries.map(
    (e) =>
      `| \`${e.file}\` | ${e.test} | ${e.date} | ${e.owner} | ${e.reason} |`
  );
  return [
    '### Flaky quarantine — tests excluidos de este run',
    '',
    `${entries.length} test(s) excluido(s) por la lista versionada \`${rel}\`.`,
    'El run nocturno (`nightly-full-suite.yml`) NO aplica estas exclusiones.',
    '',
    '| Fichero | Test | Fecha | Owner | Motivo |',
    '| --- | --- | --- | --- | --- |',
    ...rows,
    '',
    'Restauración: solo un PR humano borra la entrada (métrica semanal ≥70% pass-rate en 14 días).',
  ].join('\n');
}

function main() {
  const formatArg = process.argv.find((a) => a.startsWith('--format='));
  const format = formatArg ? formatArg.split('=')[1] : 'argv';

  let result;
  try {
    result = readQuarantine();
  } catch (error) {
    // Fichero corrupto: ruido alto y fallo — nunca "excluir nada" en silencio.
    console.error(`::error::${error.message}`);
    process.exit(1);
  }

  const { entries, source } = result;
  if (format === 'argv') {
    process.stdout.write(`${renderArgv(entries)}\n`);
  } else if (format === 'md') {
    process.stdout.write(`${renderMarkdown(entries, source)}\n`);
  } else if (format === 'json') {
    process.stdout.write(
      `${JSON.stringify(
        {
          source: path.relative(REPO_ROOT, source) || QUARANTINE_FILE,
          count: entries.length,
          entries: entries.map((e) => ({ ...e, exclude: toExcludeGlobs(e) })),
        },
        null,
        2
      )}\n`
    );
  } else {
    console.error(`::error::--format no soportado: ${format}`);
    process.exit(1);
  }
}

if (
  process.argv[1] &&
  import.meta.url.endsWith(path.basename(process.argv[1]))
) {
  main();
}
