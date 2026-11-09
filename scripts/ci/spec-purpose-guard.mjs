#!/usr/bin/env node
/**
 * Guard de `## Purpose` en las specs principales de OpenSpec.
 *
 * POR QUÉ EXISTE: al archivar un change, `openspec archive` crea la capability
 * con un Purpose autogenerado —
 *
 *   TBD - created by archiving change <change>. Update Purpose after archive.
 *
 * Ese texto es válido para `openspec validate` en el momento del archive, pero
 * `openspec validate --specs --strict` lo marca después como WARNING, y el job
 * `openspec-validate` corre justo con `--strict`... así que un spec archivado
 * con el placeholder deja el gate en rojo sin que nadie haya tocado nada. Pasó
 * con `coverage-merge-gate-hardening` y `test-sharding-safety-gates`: el
 * placeholder quedó vivo durante semanas porque ningún change posterior edita
 * el Purpose de una capability ya existente.
 *
 * QUÉ COMPRUEBA (error → exit 1):
 *   1. Que exista la sección `## Purpose`.
 *   2. Que no sea un placeholder (`TBD`/`TODO`/`FIXME`/`N/A`, o el texto que
 *      escribe el archive).
 *   3. Que no sea un stub: menos de `MIN_WORDS` palabras o `MIN_CHARS`
 *      caracteres.
 *
 * QUÉ AVISA SIN FALLAR (warning → exit 0):
 *   a) Un Purpose de menos de `THIN_WORDS` palabras. Se avisa, no se bloquea:
 *      `Enruta mensajes a salas personales por usuario, con auto-limpieza al
 *      desconectar.` son 11 palabras y describe la capability perfectamente. El
 *      guard no debe castigar la brevedad, sólo el relleno automático.
 *   b) Una ruta del repo citada en el Purpose que ya no existe (p. ej. el
 *      `knip.json` viejo cuando el fichero pasó a `knip.jsonc`). Es el otro
 *      modo de putrefacción: el texto se lee bien pero apunta a un artefacto
 *      borrado. Se avisa en vez de fallar porque una mención puede ser
 *      histórica a propósito (`ci-enterprise.yml` retirado), y el guard no
 *      puede distinguir intención de olvido: por eso las frases con marcadores
 *      de retirada/borrado quedan exentas.
 *
 * Uso:
 *   node scripts/ci/spec-purpose-guard.mjs            # repo actual
 *   node scripts/ci/spec-purpose-guard.mjs --root dir # raíz alternativa (tests)
 */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { pathToFileURL } from 'node:url';

/** Mínimos para que un Purpose cuente como escrito y no como stub. */
export const MIN_WORDS = 5;
export const MIN_CHARS = 30;
/** Por debajo de esto se avisa (no se falla). */
export const THIN_WORDS = 12;

const PLACEHOLDER_PATTERNS = [
  /^\s*(TBD|TODO|FIXME|N\/A)\b/i,
  /created by archiving change/i,
  /update purpose after archive/i,
];

const countWords = (text) => text.split(/\s+/).filter(Boolean).length;

/** Prefijos que identifican una ruta del repo (evita `origin/main`, URLs, etc.). */
const REPO_ROOTS = [
  'apps/',
  'docs/',
  'scripts/',
  'openspec/',
  '.github/',
  'e2e/',
  'prisma/',
];
const ROOT_FILE = /^[\w.-]+\.(m?[jt]sx?|cjs|jsonc?|ya?ml|md|sh|sql|snap)$/;

/** Marcadores de que la mención es histórica a propósito (borrado/retirada). */
const RETIREMENT_MARKERS =
  /retir|delet|remov|elimin|borrad|ya no existe|no longer exist|historic|archiv|deprecat/i;

/**
 * Nombres convencionales: `types.ts` o `index.js` describen un patrón de
 * proyecto, no un fichero concreto, así que no son referencias verificables.
 */
const GENERIC_FILENAMES =
  /^(types|index|schema|main|app|server|utils)\.[a-z]+$/i;

/** Artefactos generados en runtime: no viven en el repo y no son rutas rotas. */
const GENERATED_ARTIFACT =
  /\.(sarif|xml)$|(report|results|coverage|sbom)[\w.-]*\.json$/i;
const looksLikeRepoPath = (token) =>
  !/\s/.test(token) &&
  !GENERIC_FILENAMES.test(token) &&
  !GENERATED_ARTIFACT.test(token) &&
  (REPO_ROOTS.some((root) => token.startsWith(root)) || ROOT_FILE.test(token));

const RESOLVE_DIRS = [
  '.',
  join('.github', 'workflows'),
  '.github',
  'docs',
  join('docs', 'learning'),
];

const pathExists = (token) =>
  RESOLVE_DIRS.some((dir) =>
    existsSync(dir === '.' ? token : join(dir, token))
  );

/**
 * Rutas citadas en el Purpose que no resuelven contra el repo.
 * Una ruta se exime si su frase la presenta como retirada/borrada.
 */
export const findMissingReferences = (body, exists = pathExists) => {
  const missing = new Set();
  for (const sentence of body.split(/(?<=[.;:])\s+/)) {
    if (RETIREMENT_MARKERS.test(sentence)) continue;
    for (const [, token] of sentence.matchAll(/`([^`]+)`/g)) {
      if (!looksLikeRepoPath(token) || exists(token)) continue;
      missing.add(token);
    }
  }
  return [...missing];
};

/**
 * Devuelve el cuerpo de `## Purpose` (sin el heading) o `null` si no existe.
 * El cuerpo termina en el siguiente heading de nivel 2.
 */
export const extractPurpose = (markdown) => {
  const match = markdown.match(
    /^##[ \t]+Purpose[ \t]*\r?\n([\s\S]*?)(?=^##[ \t]|(?![\s\S]))/m
  );
  if (!match) return null;
  return match[1].replace(/\s+/g, ' ').trim();
};

/** Evalúa una spec y devuelve sus errores y avisos (sin lanzar). */
export const evaluateSpec = ({ id, markdown }) => {
  const errors = [];
  const warnings = [];
  const body = extractPurpose(markdown);

  if (body === null) {
    return { id, errors: ['falta la sección `## Purpose`'], warnings };
  }

  const placeholder = PLACEHOLDER_PATTERNS.find((pattern) =>
    pattern.test(body)
  );
  if (placeholder) {
    errors.push(`Purpose es un placeholder sin escribir: "${body}"`);
    return { id, errors, warnings };
  }

  const words = countWords(body);
  if (body.length < MIN_CHARS || words < MIN_WORDS) {
    errors.push(
      `Purpose es un stub (${words} palabras, ${body.length} caracteres); mínimo ${MIN_WORDS} palabras / ${MIN_CHARS} caracteres`
    );
    return { id, errors, warnings };
  }

  if (words < THIN_WORDS) {
    warnings.push(
      `Purpose breve (${words} palabras): correcto si describe la capability, pero valora explicar para qué sirve`
    );
  }

  const missing = findMissingReferences(body);
  if (missing.length > 0) {
    warnings.push(
      `Purpose cita rutas que ya no existen: ${missing.map((p) => `\`${p}\``).join(', ')} — actualiza el texto o márcalas como retiradas`
    );
  }

  return { id, errors, warnings };
};

/** Localiza todas las `spec.md` bajo una raíz de specs. */
export const findSpecFiles = (root) =>
  readdirSync(root, { recursive: true })
    .filter((entry) => entry.endsWith('spec.md'))
    .map((entry) => join(root, entry))
    .filter((file) => statSync(file).isFile())
    .sort();

/** Ejecuta el guard sobre una raíz de specs. Devuelve el reporte completo. */
export const checkSpecsRoot = (root) =>
  findSpecFiles(root).map((file) =>
    evaluateSpec({
      id: relative(root, file).replace(/[\\/]spec\.md$/, ''),
      markdown: readFileSync(file, 'utf8'),
    })
  );

const cli = () => {
  const rootFlag = process.argv.indexOf('--root');
  const root =
    rootFlag !== -1 && process.argv[rootFlag + 1]
      ? process.argv[rootFlag + 1]
      : join(process.cwd(), 'openspec', 'specs');

  const report = checkSpecsRoot(root);
  const failed = report.filter((spec) => spec.errors.length > 0);

  for (const spec of report) {
    for (const warning of spec.warnings) {
      console.warn(
        `::warning file=openspec/specs/${spec.id}/spec.md::${warning}`
      );
    }
    for (const error of spec.errors) {
      console.error(`::error file=openspec/specs/${spec.id}/spec.md::${error}`);
    }
  }

  if (failed.length > 0) {
    console.error(
      `\n✗ spec-purpose-guard: ${failed.length}/${report.length} specs con Purpose inválido.`
    );
    console.error(
      'El Purpose se edita en `openspec/specs/<capability>/spec.md` directamente: el `## Purpose` de un delta sólo se lee al crear la capability.'
    );
    return 1;
  }

  const warned = report.filter((spec) => spec.warnings.length > 0).length;
  console.log(
    `✅ spec-purpose-guard: ${report.length} specs con Purpose escrito${warned > 0 ? ` (${warned} aviso(s) de brevedad)` : ''}.`
  );
  return 0;
};

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  process.exit(cli());
}
