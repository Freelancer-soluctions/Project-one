#!/usr/bin/env node
/**
 * Wrapper de yamllint para lint-staged (pre-commit) — change `ci-shifting-left`,
 * capability `workflow-linting`.
 *
 * Política (misma que gitleaks en `.husky/pre-commit`):
 * - HAY hallazgos YAML  -> exit code de yamllint => el commit se BLOQUEA.
 * - El binario NO está instalado en la máquina del dev -> se avisa y se deja
 *   pasar el commit (problema de tooling, no de calidad del código). La red de
 *   seguridad que SÍ bloquea para todos es el job `validate-pipeline` de
 *   `ci.yml`, que instala yamllint fijado por versión.
 *
 * La configuración es SIEMPRE `-c .yamllint.yml` (fuente única, raíz del repo):
 * sin el flag, yamllint usaría su default y marcaría ~600 hallazgos cosméticos.
 *
 * Uso (lo invoca lint-staged): node scripts/ci/yamllint-staged.mjs <archivos...>
 */
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');

// El binario puede ser `yamllint` (venv/PATH) o `yamllint.exe` (pip en Windows);
// spawnSync ya resuelve PATHEXT vía CreateProcess, así que se usa el nombre base.
const BINARY = 'yamllint';
const CONFIG = join(repoRoot, '.yamllint.yml');

// lint-staged pasa los archivos staged como argumentos; sin archivos no hay nada
// que validar (p. ej. si el patrón no seleccionó ninguno).
const files = process.argv.slice(2).filter(Boolean);
if (files.length === 0) process.exit(0);

const probe = spawnSync(BINARY, ['--version'], { stdio: 'ignore' });
if (probe.error || probe.status !== 0) {
  console.warn(
    '⚠️  yamllint no está instalado — NO se validó la sintaxis YAML de los workflows.'
  );
  console.warn(
    '   Fail-open: el commit continúa (problema de tooling, no un hallazgo).'
  );
  console.warn(
    '   Remediación: `pip install yamllint==1.38.0` (CI lo ejecuta igualmente en `validate-pipeline`).'
  );
  process.exit(0);
}

if (!existsSync(CONFIG)) {
  console.error(
    '❌ falta .yamllint.yml en la raíz del repo (config obligatoria).'
  );
  process.exit(1);
}

const result = spawnSync(BINARY, ['-c', CONFIG, '-f', 'parsable', ...files], {
  cwd: repoRoot,
  stdio: 'inherit',
});

if (result.error) {
  console.warn(`⚠️  yamllint no pudo ejecutarse: ${result.error.message}`);
  console.warn('   Fail-open: el commit continúa (problema de tooling).');
  process.exit(0);
}

if (result.status !== 0) {
  console.error(
    '❌ yamllint encontró errores en los YAML staged — commit bloqueado.'
  );
  process.exit(result.status ?? 1);
}
