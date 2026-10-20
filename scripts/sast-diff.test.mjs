import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it } from 'vitest';

// Tests de `scripts/sast-diff.mjs` (task 2.10 del change
// sast-shift-left-hooks-parity). Cubren las 4 superficies exigidas:
// resolución de modo, mapeo de exit codes, matchers de skip y
// redacción del reporte — sin Docker: los caminos de "herramienta rota"
// se fuerzan con un binario inexistente (SAST_DOCKER_BIN), que es
// exactamente la clasificación que el contrato RF-FAIL-01 prevé.

import {
  SEMGREP_VERSION,
  PACKS,
  EXCLUSIONS,
  REPORT_PATH,
  resolveMode,
  classifyExitCode,
  policyExitCode,
  parseFindings,
  writeReport,
  buildScanArgs,
  isWorkingTreeDirty,
  diffTouchesScannedFiles,
  describeToolFailure,
} from './sast-diff.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.join(HERE, '..');
const SCRIPT = path.join(REPO, 'scripts', 'sast-diff.mjs');

const NO_DOCKER = path.join(os.tmpdir(), 'definitely-not-a-docker-binary');

function runScript(args, env = {}) {
  const cleanEnv = { ...process.env };
  delete cleanEnv.SAST_MODE;
  delete cleanEnv.GITHUB_ACTIONS;
  delete cleanEnv.SAST_BASELINE_COMMIT;
  delete cleanEnv.SAST_TIMEOUT_MS;
  return spawnSync(process.execPath, [SCRIPT, ...args], {
    encoding: 'utf8',
    env: { ...cleanEnv, ...env },
  });
}

/** Env para corridas E2E en un fixture repo: modo ci SIN baseline. */
function ciEnvWithoutBaseline() {
  const env = { ...process.env, SAST_MODE: 'ci', SAST_DOCKER_BIN: NO_DOCKER };
  delete env.SAST_BASELINE_COMMIT;
  delete env.GITHUB_ACTIONS;
  delete env.SAST_TIMEOUT_MS;
  return env;
}

/** Git fixture: repo con origin/main simulado y un único commit base. */
function makeFixtureRepo() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sast-diff-fixture-'));
  const git = (...a) => {
    const res = spawnSync('git', ['-C', dir, ...a], { encoding: 'utf8' });
    if (res.status !== 0) {
      throw new Error(`fixture git ${a.join(' ')} failed: ${res.stderr}`);
    }
    return res;
  };
  git('init', '-q', '-b', 'main');
  git('config', 'user.email', 't@example.com');
  git('config', 'user.name', 't');
  // Aislar del entorno del developer: firma de commits y hooks globales
  // (este repo exige commits firmados vía config global) romperían el fixture.
  git('config', 'commit.gpgsign', 'false');
  git('config', 'core.hooksPath', dir); // repo sin .git/hooks efectivos
  fs.writeFileSync(path.join(dir, 'base.md'), '# base\n');
  git('add', '.');
  git('commit', '-q', '-m', 'base');
  const baseSha = git('rev-parse', 'HEAD').stdout.trim();
  // Simulate the remote-tracking ref the hook fetches before invoking us.
  git('update-ref', 'refs/remotes/origin/main', baseSha);
  return { dir, baseSha };
}

const cleanups = [];
afterEach(() => {
  while (cleanups.length) {
    try {
      fs.rmSync(cleanups.pop(), { recursive: true, force: true });
    } catch {
      /* best-effort */
    }
  }
});

describe('sast-diff.mjs — resolución de modo (task 2.1)', () => {
  it('sin SAST_MODE reporta local', () => {
    expect(resolveMode({})).toBe('local');
  });

  it('SAST_MODE=ci reporta ci', () => {
    expect(resolveMode({ SAST_MODE: 'ci' })).toBe('ci');
  });

  it('SAST_MODE local explícito se respeta', () => {
    expect(resolveMode({ SAST_MODE: 'local' })).toBe('local');
  });

  it('valor desconocido falla con mensaje claro', () => {
    expect(() => resolveMode({ SAST_MODE: 'nightly' })).toThrow(
      /Unknown SAST_MODE "nightly"/
    );
  });

  it('default local rechazado dentro de un runner (H-1/task 2.12)', () => {
    expect(() => resolveMode({ GITHUB_ACTIONS: 'true' })).toThrow(/SAST_MODE/);
    // con la variable explícita sí se permite
    expect(resolveMode({ GITHUB_ACTIONS: 'true', SAST_MODE: 'ci' })).toBe('ci');
  });
});

describe('sast-diff.mjs — contrato de exit codes (task 2.5, RF-FAIL-01)', () => {
  it('0 = sin hallazgo, 1 = hallazgo, cualquier otro = herramienta rota', () => {
    expect(classifyExitCode(0)).toBe('clean');
    expect(classifyExitCode(1)).toBe('finding');
    expect(classifyExitCode(2)).toBe('tool-broken');
    expect(classifyExitCode(127)).toBe('tool-broken');
    expect(classifyExitCode(null)).toBe('tool-broken');
  });

  it('timeout se clasifica como herramienta rota, nunca como hallazgo', () => {
    expect(classifyExitCode(0, true)).toBe('tool-broken');
    expect(classifyExitCode(1, true)).toBe('tool-broken');
  });
});

describe('sast-diff.mjs — política de fallos por modo (task 2.6, RF-FAIL-02/03)', () => {
  it('local: herramienta rota no bloquea (fail-open), hallazgo sí bloquea', () => {
    expect(policyExitCode('local', 'tool-broken')).toBe(0);
    expect(policyExitCode('local', 'finding')).toBe(1);
    expect(policyExitCode('local', 'clean')).toBe(0);
  });

  it('ci: herramienta rota falla el step (fail-closed), distinto de un aviso', () => {
    expect(policyExitCode('ci', 'tool-broken')).toBe(1);
    expect(policyExitCode('ci', 'finding')).toBe(1);
    expect(policyExitCode('ci', 'clean')).toBe(0);
  });
});

describe('sast-diff.mjs — timeout propio (task 2.8, RF-PP-06)', () => {
  it('el motivo del timeout se nombra en el veredicto (no "code null")', () => {
    const reason = describeToolFailure(
      { timedOut: true, code: null },
      60 * 1000
    );
    expect(reason).toBe('scan timed out after 60s');
    expect(reason).not.toContain('null');
  });

  it('el timeout se clasifica como herramienta rota y la politica por modo aplica', () => {
    expect(classifyExitCode(null, true)).toBe('tool-broken');
    expect(policyExitCode('local', 'tool-broken')).toBe(0); // fail-open local
    expect(policyExitCode('ci', 'tool-broken')).toBe(1); // fail-closed CI
  });

  it('otros fallos de herramienta mantienen su motivo especifico', () => {
    expect(
      describeToolFailure(
        { timedOut: false, daemonDown: true, dockerBin: 'docker' },
        60_000
      )
    ).toContain('not reachable');
    expect(
      describeToolFailure(
        { timedOut: false, launchError: 'ENOENT', dockerBin: 'x' },
        60_000
      )
    ).toContain('could not launch');
    expect(describeToolFailure({ timedOut: false, code: 125 }, 60_000)).toBe(
      'docker run exited with code 125'
    );
  });
});

describe('sast-diff.mjs — parseo de findings y redacción del reporte (task 2.10, RF-SEC-02)', () => {
  it('extrae regla, severidad, archivo y línea — y NUNCA el valor del mensaje', () => {
    const stdout = JSON.stringify({
      results: [
        {
          check_id: 'js.lang.security.detect-child-process',
          path: 'apps/server/src/x.js',
          start: { line: 42 },
          extra: {
            severity: 'ERROR',
            message: 'SECRET_VALUE_SHOULD_NOT_APPEAR abc123XYZ',
          },
        },
      ],
    });
    const findings = parseFindings(stdout);
    expect(findings).toEqual([
      {
        rule: 'js.lang.security.detect-child-process',
        severity: 'ERROR',
        file: 'apps/server/src/x.js',
        line: 42,
      },
    ]);
    expect(JSON.stringify(findings)).not.toContain('abc123XYZ');
  });

  it('salida no-JSON no rompe: devuelve lista vacía (el veredicto es el exit code)', () => {
    expect(parseFindings('not json at all')).toEqual([]);
  });

  it('el reporte escrito no contiene valores de secretos y es best-effort', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'sast-diff-report-'));
    cleanups.push(root);
    const findings = [{ rule: 'r', severity: 'ERROR', file: 'f.js', line: 1 }];
    const res = writeReport(root, {
      mode: 'ci',
      baseline: 'deadbeef',
      classification: 'finding',
      findings,
      toolError: null,
    });
    expect(res.ok).toBe(true);
    const raw = fs.readFileSync(path.join(root, REPORT_PATH), 'utf8');
    expect(raw).toContain('"baselineCommit": "deadbeef"');
    expect(raw).toContain('"classification": "finding"');
    const parsed = JSON.parse(raw);
    expect(parsed.findings).toEqual(findings);
    expect(Object.keys(parsed.findings[0]).sort()).toEqual([
      'file',
      'line',
      'rule',
      'severity',
    ]);

    // Ruta no escribible -> ok:false sin lanzar (RF-CI-02: no condiciona el veredicto)
    const blocked = writeReport(path.join(root, 'no', 'way'), {
      mode: 'ci',
      baseline: 'x',
      classification: 'clean',
      findings: [],
      toolError: null,
    });
    // mkdirSync recursive crea la ruta, así que simularmos un fallo con un archivo en medio:
    const fileInWay = path.join(root, 'file-in-the-way');
    fs.writeFileSync(fileInWay, 'x');
    const blocked2 = writeReport(fileInWay, {
      mode: 'ci',
      baseline: 'x',
      classification: 'clean',
      findings: [],
      toolError: null,
    });
    expect(blocked.ok).toBe(true); // recursive mkdir works
    expect(blocked2.ok).toBe(false); // ENOTDIR/EEXIST path: no lanza, reporta
    expect(blocked2.error).toBeTruthy();
  });
});

describe('sast-diff.mjs — comando efectivo (task 2.3/2.4, RF-PAR-05)', () => {
  it('9 packs + .semgrep/rules primero + 8 exclusiones sin `=` + flags del gate', () => {
    const args = buildScanArgs({
      root: REPO,
      baseline: 'abc1234',
      containerName: 'sast-test',
    });
    expect(args).toContain('--baseline-commit');
    expect(args[args.indexOf('--baseline-commit') + 1]).toBe('abc1234');

    const configFlags = args.reduce(
      (acc, a, i) => (a === '--config' ? acc.concat(args[i + 1]) : acc),
      []
    );
    expect(configFlags[0]).toBe('.semgrep/rules'); // prioridad de reglas custom (H-1)
    expect(configFlags.slice(1)).toEqual(PACKS);
    expect(configFlags.filter((c) => c.startsWith('p/'))).toHaveLength(9);

    const excludeFlags = args.reduce(
      (acc, a, i) => (a === '--exclude' ? acc.concat(args[i + 1]) : acc),
      []
    );
    expect(excludeFlags).toEqual(EXCLUSIONS);
    expect(excludeFlags).toHaveLength(8);

    // forma sin `=` (H-1/M-3): jamás --config=... ni --exclude=...
    expect(args.some((a) => a.includes('='))).toBe(false);
    expect(args.join(' ')).toContain('--severity ERROR --error --metrics off');
    expect(args.join(' ')).toContain(`semgrep/semgrep:${SEMGREP_VERSION}`);
    expect(args.join(' ')).toContain('--json');
    // lista única: sin packs duplicados
    expect(new Set(PACKS).size).toBe(PACKS.length);
    expect(new Set(EXCLUSIONS).size).toBe(EXCLUSIONS.length);
  });
});

describe('sast-diff.mjs — matchers de skip sobre fixture git (task 2.7, RF-PP-03/04)', () => {
  it('working tree limpio -> no dirty; con archivo sin commitear -> dirty', () => {
    const { dir } = makeFixtureRepo();
    cleanups.push(dir);
    expect(isWorkingTreeDirty(dir)).toBe(false);
    fs.writeFileSync(path.join(dir, 'uncommitted.ts'), 'x');
    expect(isWorkingTreeDirty(dir)).toBe(true);
  });

  it('diff solo .md -> sin archivos escaneables; diff con .ts -> sí', () => {
    const { dir, baseSha } = makeFixtureRepo();
    cleanups.push(dir);
    const git = (...a) =>
      spawnSync('git', ['-C', dir, ...a], { encoding: 'utf8' });

    fs.writeFileSync(path.join(dir, 'doc.md'), '# doc\n');
    git('add', '.');
    git('commit', '-q', '-m', 'doc only');
    expect(diffTouchesScannedFiles(dir, baseSha)).toBe(false);

    fs.writeFileSync(path.join(dir, 'src.ts'), 'export const x = 1;\n');
    git('add', '.');
    git('commit', '-q', '-m', 'ts change');
    expect(diffTouchesScannedFiles(dir, baseSha)).toBe(true);
  });

  it('diff con ruta no-ASCII (git la cita por core.quotepath) -> sí escaneable (false negative corregido)', () => {
    const { dir, baseSha } = makeFixtureRepo();
    cleanups.push(dir);
    const git = (...a) =>
      spawnSync('git', ['-C', dir, ...a], { encoding: 'utf8' });

    fs.writeFileSync(
      path.join(dir, 'configuración.js'),
      'export const x = 1;\n'
    );
    git('add', '.');
    git('commit', '-q', '-m', 'acento');
    // Demostración del bug original: con core.quotepath (default true) el
    // nombre sale citado y escapado — `"configuraci\303\263n.js"` — y
    // path.extname ve `.js"`, que no matchea (el hook saltaba el escaneo).
    const quoted = git(
      '-c',
      'core.quotepath=true',
      'diff',
      '--name-only',
      baseSha,
      'HEAD'
    );
    expect(quoted.stdout).toContain('"configuraci\\303\\263n.js"');
    // Con la corrección (core.quotepath=false en el propio git del matcher)
    // el diff SÍ se considera escaneable.
    expect(diffTouchesScannedFiles(dir, baseSha)).toBe(true);
  });
});

describe('sast-diff.mjs — ejecución end-to-end sin Docker (tasks 2.6/2.7/2.12)', () => {
  it('modo inválido: exit != 0 y el mensaje nombra SAST_MODE', () => {
    const res = runScript([], { SAST_MODE: 'nightly' });
    expect(res.status).not.toBe(0);
    expect(res.stderr).toContain('Unknown SAST_MODE');
  });

  it('GITHUB_ACTIONS=true sin SAST_MODE: exit != 0 pidiendo la variable (task 2.12)', () => {
    const res = runScript([], { GITHUB_ACTIONS: 'true' });
    expect(res.status).not.toBe(0);
    expect(res.stderr).toContain('SAST_MODE');
  });

  it('local + working tree sucio: exit 0 con aviso visible y sin docker (RF-PP-04)', () => {
    const { dir } = makeFixtureRepo();
    cleanups.push(dir);
    fs.writeFileSync(path.join(dir, 'src.ts'), 'export const x = 1;\n'); // dirty, untracked
    const res = spawnSync(process.execPath, [SCRIPT], {
      cwd: dir,
      encoding: 'utf8',
      env: { ...process.env, SAST_MODE: 'local', SAST_DOCKER_BIN: NO_DOCKER },
    });
    expect(res.status).toBe(0);
    expect(res.stdout).toContain('skipped');
    expect(res.stdout).toContain('dirty working tree');
  });

  it('local + diff solo .md: exit 0 con aviso y sin invocar docker (RF-PP-03)', () => {
    const { dir, baseSha } = makeFixtureRepo();
    cleanups.push(dir);
    const git = (...a) =>
      spawnSync('git', ['-C', dir, ...a], { encoding: 'utf8' });
    fs.writeFileSync(path.join(dir, 'doc.md'), '# doc\n');
    git('add', '.');
    git('commit', '-q', '-m', 'doc only');
    const res = spawnSync(process.execPath, [SCRIPT], {
      cwd: dir,
      encoding: 'utf8',
      env: { ...process.env, SAST_MODE: 'local', SAST_DOCKER_BIN: NO_DOCKER },
    });
    expect(res.status).toBe(0);
    expect(res.stdout).toContain('skipped');
    expect(baseSha).toBeTruthy();
  });

  it('local + docker inaccesible: fail-open, exit 0 con aviso (RF-FAIL-02)', () => {
    const { dir, baseSha } = makeFixtureRepo();
    cleanups.push(dir);
    const git = (...a) =>
      spawnSync('git', ['-C', dir, ...a], { encoding: 'utf8' });
    fs.writeFileSync(path.join(dir, 'src.ts'), 'export const x = 1;\n');
    git('add', '.');
    git('commit', '-q', '-m', 'ts change');
    const res = spawnSync(process.execPath, [SCRIPT], {
      cwd: dir,
      encoding: 'utf8',
      env: { ...process.env, SAST_MODE: 'local', SAST_DOCKER_BIN: NO_DOCKER },
    });
    expect(res.status).toBe(0);
    expect(res.stderr).toContain('fail-open');
    expect(res.stderr).toContain('tool failure');
    expect(baseSha).toBeTruthy();
  });

  it('ci + docker inaccesible: fail-closed, exit 1 distinguible de un hallazgo + reporte (RF-FAIL-03, RF-CI-02)', () => {
    const { dir, baseSha } = makeFixtureRepo();
    cleanups.push(dir);
    const git = (...a) =>
      spawnSync('git', ['-C', dir, ...a], { encoding: 'utf8' });
    fs.writeFileSync(path.join(dir, 'src.ts'), 'export const x = 1;\n');
    git('add', '.');
    git('commit', '-q', '-m', 'ts change');
    const res = spawnSync(process.execPath, [SCRIPT], {
      cwd: dir,
      encoding: 'utf8',
      env: {
        ...process.env,
        SAST_MODE: 'ci',
        SAST_BASELINE_COMMIT: baseSha,
        SAST_DOCKER_BIN: NO_DOCKER,
      },
    });
    expect(res.status).toBe(1);
    expect(res.stderr).toContain('NOT a security finding'); // distinguible del bloqueo por hallazgo
    // El reporte existe SIEMPRE en ci (también en corrida con fallo de herramienta)
    const report = JSON.parse(
      fs.readFileSync(path.join(dir, REPORT_PATH), 'utf8')
    );
    expect(report.mode).toBe('ci');
    expect(report.baselineCommit).toBe(baseSha);
    expect(report.classification).toBe('tool-broken');
    expect(report.findings).toEqual([]);
  });

  it('ci + SAST_BASELINE_COMMIT ausente: falla cerrado con mensaje que lo nombra', () => {
    // Fixture repo: desde el fix del reporte en el path de baseline roto,
    // esta corrida ESCRIBE `.tmp/sast-report.json` en la raíz que resuelve —
    // ejecutarla contra el repo real dejaría un side effect innecesario.
    const { dir } = makeFixtureRepo();
    cleanups.push(dir);
    const res = spawnSync(process.execPath, [SCRIPT], {
      cwd: dir,
      encoding: 'utf8',
      env: ciEnvWithoutBaseline(),
    });
    expect(res.status).toBe(1);
    expect(res.stderr).toContain('SAST_BASELINE_COMMIT');
  });

  it('ci + baseline ausente: exit 1 Y reporte con classification tool-broken (RF-CI-02, evidencia en misconfiguration)', () => {
    const { dir } = makeFixtureRepo();
    cleanups.push(dir);
    const res = spawnSync(process.execPath, [SCRIPT], {
      cwd: dir,
      encoding: 'utf8',
      env: ciEnvWithoutBaseline(),
    });
    expect(res.status).toBe(1);
    expect(res.stderr).toContain('SAST_BASELINE_COMMIT');
    // El artefacto SIEMPRE existe en ci, también cuando resolveBaseline lanza
    // (antes: el upload se quedaba sin input justo en el escenario roto).
    const report = JSON.parse(
      fs.readFileSync(path.join(dir, REPORT_PATH), 'utf8')
    );
    expect(report.mode).toBe('ci');
    expect(report.classification).toBe('tool-broken');
    expect(report.baselineCommit).toBe('unknown');
    expect(report.findings).toEqual([]);
    expect(report.toolError).toContain('SAST_BASELINE_COMMIT');
  });

  it('ci + baseline ausente + reporte NO escribible: sigue exit 1 (writeReport no cambia el veredicto)', () => {
    const { dir } = makeFixtureRepo();
    cleanups.push(dir);
    // `.tmp` como ARCHIVO (no directorio): mkdirSync falla -> writeReport
    // devuelve ok:false sin lanzar (best-effort, RF-CI-02).
    fs.writeFileSync(path.join(dir, '.tmp'), 'not a directory');
    const res = spawnSync(process.execPath, [SCRIPT], {
      cwd: dir,
      encoding: 'utf8',
      env: ciEnvWithoutBaseline(),
    });
    expect(res.status).toBe(1); // el veredicto es idéntico al de la corrida con reporte ok
    expect(res.stderr).toContain('SAST_BASELINE_COMMIT'); // el error original se conserva
    expect(res.stderr).toContain('could NOT be written'); // aviso best-effort, no crash
  });
});

describe('sast-diff.mjs — imagen pineada (task 2.2, RNF-02)', () => {
  it('la versión aparece una sola vez como constante y no hay latest', () => {
    const src = fs.readFileSync(SCRIPT, 'utf8');
    expect(src).toContain(`const SEMGREP_VERSION = '${SEMGREP_VERSION}'`);
    // tag flotante prohibido (RNF-02); el literal se construye para que el
    // propio test no deje la cadena `latest` en el repo (verificación 6.5).
    expect(src).not.toContain(['semgrep/semgrep', 'latest'].join(':'));
    const occurrences =
      src.match(new RegExp(SEMGREP_VERSION.replace(/\./g, '\\.'), 'g')) || [];
    expect(occurrences.length).toBe(1); // única fuente en el repo (pin del full scan la relee)
  });
});
