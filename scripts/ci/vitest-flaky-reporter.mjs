/* globals process, console */
/**
 * Custom Vitest reporter — evidencia de retry/flaky por test.
 *
 * POR QUÉ EXISTE (change `coverage-tripwire-stage-2d`, D8, task 5.3)
 * ------------------------------------------------------------------------
 * La métrica semanal de flakiness necesita distinguir tres estados que el
 * pipeline trata de forma distinta:
 *
 *   1. test pasa                                  → verde
 *   2. test falla y pasa tras retry                → FLAKY (verde en CI, pero
 *                                                    señal de intervensión)
 *   3. test falla agotando los retries             → rojo, bloquea (tras FASE 2)
 *
 * Los reporters built-in de Vitest 4.1.11 NO exponen esa información:
 *
 *   - `junit` escribe UN `testcase` por test con el estado FINAL: los reintentos
 *     se colapsan y un "pasa tras retry" es indistinguible de un verde limpio.
 *   - `json` (`JsonReporter`) serializa `status`, `failureMessages`, `meta`,
 *     `tags`… pero NO `retryCount` ni `flaky` (verificado en
 *     `vitest/dist/chunks/index.UpGiHP7g.js`, clase `JsonReporter`).
 *
 * `task.result.retryCount` y `task.result.flaky` SÍ existen en el modelo de
 * tareas en memoria (`SerializableTaskResult`), pero ningún reporter built-in
 * los vuelca a disco. Este reporter los persiste para que la métrica los pueda
 * agregar, sin parsear logs ni inferir "pasó tras retry" desde el exit code.
 *
 * Contrato de salida (artifacts que la métrica semanal descarga):
 *   <root>/reports/flaky-retries.json
 *     {
 *       "version": 1,
 *       "total": 161,
 *       "flaky": 0,          // tests que pasaron tras ≥1 retry
 *       "withRetries": 0,    // tests que consumieron ≥1 retry (fallaron alguna vez)
 *       "tests": [
 *         { "name": "...", "file": "...", "state": "passed",
 *           "retryCount": 0, "flaky": false }
 *       ]
 *     }
 *
 * `file` es la ruta RELATIVA al root del workspace (misma base que `include` en
 * el vitest config), para que la métrica pueda cruzarla con las entradas de
 * `.github/flaky-quarantine.yml` (que usan rutas relativas al repo) y con el
 * `--exclude` derivado de ellas.
 *
 * Uso (los scripts `*:ci` de ambos workspaces lo encadenan):
 *   vitest run … --reporter=default --reporter=junit --reporter=json
 *               --reporter=../../scripts/ci/vitest-flaky-reporter.mjs \
 *               --outputFile.junit=… --outputFile.json=…
 *
 * El reporter NUNCA hace fallar el run: escribe su artefacto y, si algo falla,
 * avisa por consola. Perder la evidencia de flakiness no puede tumbar el pipeline.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, isAbsolute, relative, resolve } from 'node:path';

const OUTPUT_RELATIVE_PATH = 'reports/flaky-retries.json';

/** Aplana el árbol de tareas (suites anidadas) a una lista plana. */
function flattenTasks(tasks, acc = []) {
  for (const task of tasks || []) {
    acc.push(task);
    if (Array.isArray(task.tasks) && task.tasks.length > 0) {
      flattenTasks(task.tasks, acc);
    }
  }
  return acc;
}

/** Ruta relativa al root del workspace, con separadores `/` en cualquier SO. */
function toWorkspaceRelative(root, filePath) {
  if (!filePath) return '';
  const absolute = isAbsolute(filePath) ? filePath : resolve(root, filePath);
  return relative(root, absolute).split(/[\\/]/).join('/');
}

export default class VitestFlakyReporter {
  name = 'vitest-flaky-reporter';

  async onTestRunEnd(testModules) {
    const root = this.ctx?.config?.root || process.cwd();
    const tests = [];

    for (const testModule of testModules) {
      const fileTask = testModule?.task;
      const file = toWorkspaceRelative(root, fileTask?.filepath);
      for (const task of flattenTasks(fileTask?.tasks)) {
        if (task.type !== 'test' || !task.result) continue;
        tests.push({
          name: task.name,
          file,
          state: task.result.state,
          retryCount: task.result.retryCount ?? 0,
          flaky: task.result.flaky === true,
        });
      }
    }

    const payload = {
      version: 1,
      total: tests.length,
      flaky: tests.filter((t) => t.flaky).length,
      withRetries: tests.filter((t) => t.retryCount > 0).length,
      tests,
    };

    try {
      const outPath = resolve(root, OUTPUT_RELATIVE_PATH);
      mkdirSync(dirname(outPath), { recursive: true });
      writeFileSync(outPath, JSON.stringify(payload, null, 2));
      console.log(
        `Flaky-reporter: ${payload.total} tests, ${payload.withRetries} con retry, ${payload.flaky} flaky → ${OUTPUT_RELATIVE_PATH}`
      );
    } catch (error) {
      // Nunca hacer fallar el run por la evidencia de flakiness (advisory).
      console.log(
        `Flaky-reporter: no se pudo escribir el artefacto — ${error.message}`
      );
    }
  }
}
