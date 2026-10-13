# Smart Test Ordering — Orden Inteligente de Tests (fail-first / fast feedback [F1])

> **Fecha de investigación:** 2026-10-06  
> **Alcance:** concepto (smart ordering / fail-first vs fail-fast vs selección), teoría (APFD,
> first-fail/TTFF, sesgos del historial), implementaciones por herramienta (Vitest, Jest, pytest,
> Go, .NET, CircleCI, Buildkite, Datadog, Develocity, CloudBees, Meta), patrones CI + métricas y
> **estado actual en este monorepo** (0 `sequence.sequencer`, historial en artefactos
> `flaky-evidence-*`, gap de caché en CI) con gaps y plan alineado con `tia-hardening`.  
> **Audiencia:** Equipo de ingeniería, CI/CD maintainers, QA lead.  
> **Status:** ✅ Investigación completa e **implementada** por el change `smart-test-ordering`:
> sequencer fail-first (`vitest.sequencer.js` + `sequence.sequencer` en `vitest.shared.js`), historial
> N=3 restaurado en CI, degradación flaky/cuarentena, métrica TTFF/first-fail advisory y auditoría
> semanal de order-dependence con seed fijo (ver §4.6). La receta §4.2 nació en propiedad de
> `tia-hardening` (task 5.1); `smart-test-ordering` la materializa y la extiende.

---

## 1. Conceptos

**Smart test ordering** (orden inteligente de tests, _fail-first_) es reordenar la ejecución de la
suite para que los tests con mayor probabilidad de fallar se ejecuten **primero**, de modo que el
primer fallo aparezca antes sin cambiar _qué_ corre. Es una optimización de **orden**, no de
**selección**: la suite es idéntica, solo cambia el orden en que se emite el resultado.

> El objetivo es **acortar el time-to-first-failure (TTFF)**: si hay una regresión, se detecta en
> los primeros minutos de la corrida en vez de al final. La detección temprana es "feedback
> amplification": el mismo fallo, visto antes, ahorra todo el cómputo y la espera posteriores.

### 1.1 Tres mecanismos distintos que suelen confundirse

| Mecanismo              | Pregunta que resuelve                       | Ejemplos de este repo / industria                                                | ¿Cambia qué corre? |
| ---------------------- | ------------------------------------------- | -------------------------------------------------------------------------------- | ------------------ |
| **Selección** (TIA)    | ¿_Qué_ tests ejecutar?                      | `vitest --changed`, Nx `affected`, pytest-testmon, Azure TIA                     | Sí (subconjunto)   |
| **Orden** (fail-first) | ¿_En qué orden_ ejecutar los seleccionados? | `sequence.sequencer` (Vitest), `pytest --ff`, CloudBees rank by failure prob.    | No (solo reordena) |
| **Fail-fast**          | ¿_Cuándo_ parar la corrida?                 | Vitest/Jest `--bail[=n]`, `pytest -x/--maxfail`, GH Actions `strategy.fail-fast` | Sí (aborta)        |

Las tres son complementarias: seleccionar poco (TIA) + ordenar bien (fail-first) + abortar pronto
(bail) multiplican el efecto sobre el TTFF. Este documento cubre la **segunda**; la primera está en
[`test-impact-analysis.md`][tia].

### 1.2 Teoría: priorización por historial y sus métricas

- **Test case prioritization (TCP)** — Rothermel, Untch, Chu & Harrold (1999/2001) definieron el
  problema y la métrica **APFD** (_Average Percentage of Faults Detected_): área bajo la curva de
  fallos detectados a lo largo de la suite; a mayor APFD, más rápido detecta la suite. La familia
  de técnicas incluye priorizar por **tasa de fallo histórica de los módulos que ejercita cada
  test** — esto es exactamente "fail-first" en su formulación académica.
- **Métrica first-fail / TTFF** — ¿qué fracción de la suite se ejecuta hasta el primer fallo?
  Más práctica que APFD para pipelines: se mide en tiempo wall-clock (TTFF) o en % de suite
  ejecutada. En suites con pocos fallos por corrida (lo normal), first-fail y APFD convergen.
- **Localidad temporal** — un test que falló recién tiene probabilidad elevada de volver a fallar
  (la causa suele seguir presente: rama rota, dependencia rota, fixture tocada). El historial
  corto (últimos N runs) es el predictor barato y explicable; ML (PTS) es el siguiente nivel.
- **Duración como criterio secundario** — para minimizar TTFF en corridas sin fallos conviene
  arrancar los tests **largos** primero (así el suite completo termina antes): por eso el
  `BaseSequencer` de Vitest ordena `failed first → longer first`.

### 1.3 Dos sesgos documentados del orden por historial

1. **Profecía autocumplida (Google, 2016)** — el blog de testing de Google describe un entorno
   que "prefiere ejecutar primero los tests que fallaron", con el efecto colateral: si un test
   estable falla una vez, queda agrupado con otros fallidos y en corridas siguientes se ejecuta
   en un contexto más propenso a fallar de nuevo; si pasa, se pospone. **El orden por historial
   cambia la distribución de contexto y puede inflar la tasa de fallo de lo que ya falló.**
2. **El historial puede estar dominado por flakiness** — el estudio _The Impact of Flaky Tests on
   Historical Test Prioritization on Chrome_ encontró que, tras clasificar los fallos, **el
   99.58% de los fallos de su pipeline eran flaky**: priorizar por "qué falló" sin separar
   _determinista_ de _flaky_ prioriza ruido, no riesgo. Antes de ordenar hay que filtrar la
   cuarentena y degradar (no ascender) los tests intermitentes.

> **Regla enterprise**: el orden por historial es una **heurística de feedback**, nunca una
> garantía de detección. La garantía la siguen dando la suite completa (nightly) y los fallbacks
> (D7: 0 tests → full) descritos en [`test-impact-analysis.md`][tia] §3.2.

---

## 2. Implementaciones por herramienta

| Herramienta                                       | Mecanismo de orden / fail-first                                                                                                                                                                                                           | Fuente de historial                                           | Notas y límites                                                                                                                                                         |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Vitest `sequence.sequencer`**                   | Custom class (extend `BaseSequencer` de `vitest/node`, métodos `sort`/`shard`). El `BaseSequencer` por defecto ordena: `groupOrder` → proyecto → `isolate` → **failed first → longer first**; sin caché: **unknown first → larger first** | Caché local `results.json` (`{failed, duration}` por fichero) | **Solo root config** (los projects no pueden setearlo); `sequence.shuffle` + `sequence.seed` y `describe.shuffle` para detectar order-dependence; `bail` para fail-fast |
| **Jest**                                          | `--onlyFailures` (`-f`): re-ejecuta solo los tests fallidos del run anterior; `--bail[=n]` fail-fast; `--randomize` + `--seed` (Jest 30)                                                                                                  | Caché de Jest (`.jest/cache`)                                 | No hay "fail-first del suite completo": `--onlyFailures` es re-ejecución, no orden. `--randomize` detecta order-dependence, no prioriza riesgo                          |
| **pytest**                                        | `--lf/--last-failed` (solo fallos), **`--ff/--failed-first` (fallos primero, luego el resto)**, `--new-first`, `--lfnf` (comportamiento sin fallos previos)                                                                               | Caché de pytest (`.pytest_cache/lastfailed`)                  | El `--ff` canónico de fail-first; ventana de 1 run por defecto                                                                                                          |
| **pytest-testmon**                                | `--testmon-noselect`: "reorder and prioritize the tests most likely to fail first" sin deseleccionar nada                                                                                                                                 | DB `.testmondata` (deps test→líneas)                          | Combina selección dinámica + orden; la DB debe compartirse entre runs (SaaS/CI)                                                                                         |
| **Go**                                            | `go test -shuffle=off\|on\|<seed>`                                                                                                                                                                                                        | — (aleatorio, no histórico)                                   | Detecta order-dependence; NO es fail-first. Útil como auditoría periódica                                                                                               |
| **JUnit 5 / NUnit / MSTest (.NET)**               | Orden **explícito**: `@TestMethodOrder(MethodOrderer…)`, NUnit `OrderAttribute`/orderers, MSTest `[Priority]`                                                                                                                             | — (declarado en el test)                                      | Prioridad estática por anotación; sin riesgo de historial obsoleto, pero hay que mantenerla a mano                                                                      |
| **Azure Pipelines TIA (Microsoft)**               | Selección = impacted + **previously failing** + newly added (componentes de la misma decisión, no un sequencer)                                                                                                                           | Resultados del build anterior (`tiaHistory`)                  | "Carries forward previously failing test methods" — la misma idea que la inyección de `tia-hardening`; full run periódico como regulador                                |
| **Develocity / Gradle Predictive Test Selection** | Modelo ML local que puntúa cada test candidato y ejecuta el subset seleccionado **ordenado por probabilidad**                                                                                                                             | Historial de builds (Build Scans)                             | Hasta ~70% de reducción de tiempo de test (vendor); caso Jamf: **66%** de tiempo unit serial ahorrado                                                                   |
| **CircleCI**                                      | Test splitting `--split-by=timings` balancea por duración histórica; "Smarter Testing" combina TIA + splitting dinámico + auto-rerun de fallos                                                                                            | JUnit XML de runs previos, **clave por NOMBRE de job**        | **Renombrar el job resetea el historial** (splitting ingenuo silencioso); tests nuevos reciben la media; sin `store_test_results` cae a split por nombre                |
| **Buildkite Test Engine**                         | Detección de flaky: mismo commit SHA con resultados distintos; splitting inteligente + flaky tracker                                                                                                                                      | Test Analytics (historial de runs)                            | Flaky detectado antes de rankear: evita el sesgo del paper de Chrome                                                                                                    |
| **Datadog Test Optimization (ITR/TIA)**           | Selección por coverage + retries de flaky + etiquetado cross-run                                                                                                                                                                          | Servicio SaaS (coverage por test)                             | "Tracked files" (`package.json`, lockfiles) fueran full run; presetea main a full como failsafe                                                                         |
| **CloudBees Smart Tests (ex-Launchable)**         | PTS: dentro del subset ya seleccionado, **"ranks tests by failure probability so failures appear earlier"**                                                                                                                               | Historial de CI (modelo propio)                               | Launchable adquirida por CloudBees (ago-2024) — es la herramienta que cita la regla 21 de `ci-cd-pipeline-empresarial.md`                                               |
| **Meta Predictive Test Selection**                | GBDT sobre features del diff/test → probabilidad de fallo (selección + orden implícito)                                                                                                                                                   | Dataset histórico de outcomes                                 | ≥95% de fallos capturados; **entrena distinguiendo flakiness** — detalle ya cubierto en [`test-impact-analysis.md`][tia] §2 (enlazar, no duplicar)                      |

> **Nx `affected` / Turborepo `--affected`** (citados en la regla 21) son **selección**, no
> orden: resuelven el "qué", no el "en qué orden". El "fail-first" propiamente dicho en este
> stack es el sequencer de Vitest.

---

## 3. Patrones CI y métricas

### 3.1 Dónde guardar el historial

| Opción                                              | Pros                                                             | Contras / cuidados                                                                      |
| --------------------------------------------------- | ---------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| **Artefacto de CI con retención** (patrón del repo) | Retención nombrada y versionada por run/sha; cross-run validable | Consumo best-effort: resolver `run-id` (`gh api` + `gh run download`); ausente → no-op  |
| **`actions/cache`**                                 | Simple, `restore-keys` con prefijo                               | Entradas evictables (7 días sin uso + cuota); no sirve si hace falta retención nombrada |
| **JUnit XML del run previo** (CircleCI-style)       | Formato estándar, ya se produce                                  | Clave por nombre de job/test: renombrar resetea el historial                            |
| **Caché local del runner** (`results.json`)         | Cero infra                                                       | **No cross-machine**: en CI con runner limpio no existe (ver gap §4)                    |
| **Fichero commiteado**                              | Visible en PR                                                    | Ruido de merge, datos por máquina — descartado por `tia-hardening` (D4)                 |

### 3.2 Ventana N, cold-start y determinismo

- **Ventana corta N** — Microsoft usa "el build anterior"; pytest, el último run; este repo,
  **N=3** (`tia-history.json`, ajustable con métrica). Ventana corta = frescura; ventana larga =
  memoria de fallos raros. No hay razón técnica para N grande al principio.
- **Cold start (sin historial)** — el orden debe degradar a algo **estable y documentado**
  (`BaseSequencer`: unknown first → larger first; o ruta alfabética). Nunca a aleatorio, y nunca
  a "0 tests".
- **Determinismo** — dos corridas sin historial deben producir **el mismo orden** (task 5.1 de
  `tia-hardening` lo exige como verificación). Si se usa shuffle, **fijar y registrar el seed**.
- **Orden ≠ aleatorio** — `sequence.shuffle` es la herramienta contraria: sirve como **auditoría
  de order-dependence** (§4, receta 3), no como optimización.

### 3.3 Fail-fast vs fail-shoulder en la matriz de CI

| Estrategia                                          | Cuándo                                                                                                     |
| --------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `strategy.fail-fast: true` (**default** GH Actions) | Un job rojo cancela el resto de la matriz: mínimo cómputo, **pero oculta cuántos más están rotos**         |
| `strategy.fail-fast: false` (**fail-shoulder**)     | Correr toda la matriz para obtener el panorama completo (debug, ventana de calibración, matrices pequeñas) |
| `continue-on-error: true` (patrón FASE 1 del repo)  | Reporta sin bloquear; **no** es fail-fast: el resto sigue y el agregador ve verde                          |

Aplicado a fail-first: el **orden** dentro de un job y el **aborto** de la matriz son capas
independientes. Con `bail` dentro de un job solo verás el primer fallo de ese job; para ver el
panorama, apaga `bail` y deja que la matriz corra (`fail-fast: false`).

### 3.4 Shards: el orden solo mueve el TTFF, no el wall-time

- Con `--shard=k/N` el wall-time lo decide el **balanceo por duración**, no el orden dentro del
  shard: el último test en terminar es el que fija el total. Vitest reparte ficheros por hash
  SHA-1 (no por duración; `balanceShardsByTime` está propuesto, no implementado) — balanceo por
  duración = custom sequencer user-land (ver [`unit-tests-enterprise.md`][ute] §2.4).
- El valor de fail-first está por tanto en los **jobs single-runner** (`maxWorkers: 1` de este
  repo) y en **pre-push**, donde el orden es el orden real de ejecución.
- Corolario: con `maxWorkers: 1` en CI, **orden de ficheros = orden de ejecución** → el TTFF
  responde 1:1 al sequencer (esto es lo que hace que la task 5.1 merezca la pena aquí).

### 3.5 Nightly y cuarentena: dónde NO imponer orden

- **Nightly sin orden impuesto** (`TIA_SEQUENCER=stable`): un orden por historial enmascara
  order-dependence — exactamente el bug que este repo ya sufrió con `isolate: false` (grupo 0 de
  `ci-testing-gate-promotion`). El nocturno es el tier que debe ejecutar en orden "natural" y
  completo para que ese síntoma siga visible.
- **Cuarentena**: los tests en `.github/flaky-quarantine.yml` se excluyen del tier PR
  (`quarantine-exclude.mjs`) pero corren en el nightly. El ranking de fail-first **no debe
  resucitarlos** en el PR (la exclusión ocurre por argv después de la selección) y **no deben
  dominar el historial**: registrar `flaky` (ya sale en `flaky-retries.json`) y degradarlos en
  el ranking, no ascenderlos.

### 3.6 Métricas a publicar

| Métrica                                               | Qué dice                                                                                         | Dónde en este repo                                |
| ----------------------------------------------------- | ------------------------------------------------------------------------------------------------ | ------------------------------------------------- |
| **TTFF** (time-to-first-failure)                      | Minutos hasta el primer rojo; la métrica madre del fail-first                                    | Aún no se mide (candidata al step summary, §5)    |
| **% de fallos detectados en el primer X% del tiempo** | APFD práctico: si el 80% de los fallos aparece en el primer 20% de la corrida, el orden funciona | Step summary / métrica semanal                    |
| **Historial hit-rate**                                | ¿% de fallos reales que estaban en el top-N del historial? (calidad del predictor)               | Junto a `injected=M` de la métrica TIA (task 4.4) |
| **Selección N/T + inyectados** (ya existe)            | % del suite que corre por PR y tests inyectados por historial                                    | Step summary TIA (`tia-metric.mjs`, D2/D10)       |
| **Flakiness rate semanal** (ya existe)                | Separa ruido de fallo determinista antes de rankear                                              | `flaky-metric.mjs` / `flaky-weekly.yml`           |
| **Fallbacks D7 / `map=hit\|miss`** (ya existe)        | Cuántas veces el orden/selección cayó a modo seguro                                              | Step summary TIA                                  |

### 3.7 Anti-patrones

| Anti-patrón                                             | Consecuencia                                                                    |
| ------------------------------------------------------- | ------------------------------------------------------------------------------- |
| Ordenar solo en local (caché local del dev)             | CI no reproduce el orden; el beneficio no existe donde importa                  |
| Historial obsoleto (renombrar jobs, renombrar ficheros) | Splitting/orden sin datos → orden ingenuo silencioso (CircleCI lo hace por job) |
| Mezclar flaky con deterministas en el mismo ranking     | Priorizar ruido; infla el TTFF "bueno" sin detectar regresiones (paper Chrome)  |
| Imponer orden en el nightly                             | Enmascara order-dependence; el nocturno pierde su rol de red de seguridad       |
| Depender del orden sin documentarlo                     | Order-dependence latente: la suite "verde" solo en cierto orden                 |
| Usar fail-first como sustituto de selección             | Ordena la suite completa de todas formas; no reduce cómputo, solo TTFF          |
| Aleatorio sin seed                                      | No reproducible; imposible diagnosticar un fallo ocasional                      |

---

## 4. Estado actual en este monorepo + recetas

### 4.1 Qué hay hoy (audit 2026-10-06)

| Pieza                                                       | Estado                                                                                                                                                                                                                                                          |
| ----------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `sequence.sequencer` configurado                            | **SÍ** — `vitest.sequencer.js` cableado en `vitest.shared.js` (change `smart-test-ordering`); sin historial degrada a orden determinista (ruta ascendente), con `TIA_SEQUENCER=stable` delega en `BaseSequencer`.                                               |
| Orden por defecto                                           | `BaseSequencer` de Vitest 4: failed first → longer first **si hay caché**; sin caché: unknown first → larger first                                                                                                                                              |
| **GAP: caché de orden en CI**                               | `setup-monorepo` cachea `node_modules/.cache` con `exclude: node_modules/.cache/vitest` ⇒ el historial propio (`tia-history.json` restaurado en `node_modules/.cache/tia/`) **sustituye** ese hueco; sin artefacto el orden degrada al determinista documentado |
| `vitest.shared.js`                                          | Cablea `sequence.sequencer` → `vitest.sequencer.js` (fail-first) y respeta `TIA_SEQUENCER=stable`                                                                                                                                                               |
| `maxWorkers: 1` bajo `CI=true` (ambos configs)              | Orden de ficheros = orden de ejecución → efecto directo 1:1 sobre el TTFF                                                                                                                                                                                       |
| `retry: 2` + `maxWorkers: 1` (server, solo CI)              | Reintenta fallos: el estado que llega a `vitest-results.json` es el final (flaky visibles en `flaky-retries.json`)                                                                                                                                              |
| Historial de resultados                                     | `apps/*/reports/{vitest-results.json, junit.xml, flaky-retries.json, tia-scope.txt}` → artefacto `flaky-evidence-*` (30 días)                                                                                                                                   |
| Reporter de flaky                                           | `scripts/ci/vitest-flaky-reporter.mjs` → `reports/flaky-retries.json` (`retryCount`/`flaky` por test)                                                                                                                                                           |
| Métrica semanal                                             | `scripts/ci/flaky-metric.mjs` + `flaky-weekly.yml` (pass-rate 14d; nunca edita cuarentena)                                                                                                                                                                      |
| Cuarentena                                                  | `.github/flaky-quarantine.yml` + `scripts/ci/quarantine-exclude.mjs` (exclusiones por argv en los jobs unit)                                                                                                                                                    |
| Nightly                                                     | `nightly-full-suite.yml` cron `40 2 * * *` (02:40 UTC): suites **completas**, sin cuarentena, sin `--changed`                                                                                                                                                   |
| pre-push                                                    | `.husky/pre-push` → `test:changed` en ambos workspaces (mismo contrato que CI)                                                                                                                                                                                  |
| Guard D7 (TIA spec) / D18                                   | 0 tests → full suite ruidoso / thresholds solo en full — **intactos, no se tocan**                                                                                                                                                                              |
| Regla 21 (`ci-cd-pipeline-empresarial.md` §23.3, línea 859) | Documentada como **pendiente** (tabla de optimizaciones ~línea 3412: "Smart Test Ordering — NO")                                                                                                                                                                |
| Gap 6 de [`test-impact-analysis.md`][tia]                   | "Sin smart ordering / fail-first basado en histórico" — P3, acción: `BaseSequencer` + tasa de fallo histórica                                                                                                                                                   |

### 4.2 Receta 1 — `vitest.sequencer.js` (propiedad de `tia-hardening` task 5.1)

> **⚠️ Coordinación:** esta receta **no debe implementarse en paralelo**. El sequencer con
> historial es **D7 / task 5.1 del change `tia-hardening`**, que además posee la producción del
> historial (`tia-history.mjs --record`, tasks 4.1/4.2). Este doc es la referencia conceptual y de
> integración; la implementación y su verificación (task 5.2) viven en ese change. Mantener un
> solo dueño evita conflicto en `vitest.shared.js` y en `nightly-full-suite.yml`.

```js
// vitest.sequencer.js (raíz del monorepo) — propuesta alineada con tia-hardening D7 / task 5.1
import { BaseSequencer } from 'vitest/node';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

// Historial N=3 producido por `scripts/ci/tia-history.mjs --record` (task 4.1):
// [{ testfile: "src/modules/events/service.unit.test.js", failures: 2, runId: "..." }, ...]
const HISTORY = path.resolve(
  process.cwd(),
  'node_modules/.cache/tia/tia-history.json'
);

export default class HistorySequencer extends BaseSequencer {
  async sort(files) {
    // Opt-out explícito: el nightly fija TIA_SEQUENCER=stable (nightly-full-suite.yml)
    // para NO enmascarar order-dependence en el tier de seguridad.
    if (process.env.TIA_SEQUENCER === 'stable') return super.sort(files);

    const hits = new Map();
    if (existsSync(HISTORY)) {
      try {
        for (const entry of JSON.parse(readFileSync(HISTORY, 'utf8'))) {
          hits.set(entry.testfile, (hits.get(entry.testfile) ?? 0) + 1);
        }
      } catch {
        // JSON corrupto → degradar a BaseSequencer (nunca fallar la corrida por el historial)
        return super.sort(files);
      }
    }

    const rel = (f) =>
      path.relative(process.cwd(), f.moduleId).split(path.sep).join('/');
    // Sin historial: orden por ruta estable (determinismo — verificación task 5.1).
    return [...files].sort((a, b) => {
      const fa = hits.get(rel(a)) ?? 0;
      const fb = hits.get(rel(b)) ?? 0;
      if (fa !== fb) return fb - fa; // más fallidos recientemente, primero
      return rel(a).localeCompare(rel(b)); // tie-break estable por ruta
    });
  }
}
```

### 4.3 Receta 2 — cableado en `vitest.shared.js` + opt-out en el nightly

```js
// vitest.shared.js (fragmento) — la config shared es la única que puede fijar `sequencer`
import { defineConfig } from 'vitest/config';
import { BaseSequencer } from 'vitest/node';
import HistorySequencer from './vitest.sequencer.js';

export default defineConfig({
  test: {
    globals: true,
    // ...timeouts y coverage como hoy...
    sequence: {
      // TIA_SEQUENCER=stable (nightly-full-suite.yml) → orden BaseSequencer por defecto.
      // Nota: `sequence` solo es configurable en la config root; los projects de Vitest
      // no pueden setear `sequencer` (ProjectConfig lo omite).
      sequencer:
        process.env.TIA_SEQUENCER === 'stable'
          ? BaseSequencer
          : HistorySequencer,
    },
  },
});
```

```yaml
# .github/workflows/nightly-full-suite.yml (único diff permitido además del step
# `Record TIA history` de la task 4.2 — verificación 12.3 de tia-hardening)
env:
  TIA_SEQUENCER: stable
```

Verificaciones mínimas (tasks 5.1/5.2): (a) dos corridas seguidas sin historial producen el
**mismo orden** y el mismo nº de tests que hoy; (b) con un fallo sembrado en `main`, ese fichero
aparece **primero** en el log sin cambiar la selección; (c) el log del nocturno confirma que
corre con `TIA_SEQUENCER=stable`.

### 4.4 Receta 3 — auditoría de order-dependence (shuffle con seed)

```bash
# Local o job advisory separado — NUNCA como comportamiento por defecto del nightly.
# Ejecutar DENTRO de un workspace (apps/client | apps/server): la raíz del monorepo no tiene
# config de Vitest, así que ahí el comando no cargaría ni la suite ni el sequencer.
cd apps/server   # o apps/client
npx vitest run --sequence.shuffle --sequence.seed=4242
# 2ª corrida con el mismo seed ⇒ mismo orden (reproducible); cambia el seed ⇒ otra permutación.
# Un test que pasa solo en ciertas permutaciones es order-dependente: arreglarlo, no ordenarlo.
```

### 4.5 Receta 4 — quick win sin sequencer: bail local

```bash
# Loop local de TDD: parar en el primer rojo (fail-fast, no fail-first).
npx vitest run --bail=1
# En CI: no recomendarlo por defecto — oculta el resto de fallos de la corrida (§3.3).
```

### 4.6 Estado de implementación (change `smart-test-ordering`)

| Pieza                         | Artefacto                                                          | Comportamiento                                                                                                                                |
| ----------------------------- | ------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------- |
| Sequencer fail-first          | `vitest.sequencer.js` + `sequence.sequencer` en `vitest.shared.js` | Ordena por fallos recientes (historial N=3) con tie-break por ruta; sin historial, orden determinista (ruta ascendente)                       |
| Historial visible en CI       | Step de restore en los jobs unit de `ci.yml`                       | Restaura el artefacto `tia-history-<workspace>` en `node_modules/.cache/tia/tia-history.json` (best-effort: sin artefacto el job sigue verde) |
| Degradación flaky             | `vitest.sequencer.js` (cuarentena + `flaky-retries.json`)          | Degrada — nunca asciende — ficheros en cuarentena o con retries; sin datos, orden = conteo de fallos                                          |
| Métrica TTFF                  | `scripts/ci/ttff-metric.mjs`                                       | TTFF wall-clock, % de suite hasta el primer rojo, % de fallos en el primer X% (X=20) e hit-rate del historial; advisory, `if: always()`       |
| Auditoría de order-dependence | `.github/workflows/order-dependence-audit.yml`                     | Semanal, advisory, `--sequence.shuffle --sequence.seed=4242` por workspace (mismo seed ⇒ misma permutación)                                   |
| Opt-out del tier de seguridad | `TIA_SEQUENCER=stable`                                             | El nocturno corre sin orden impuesto (delega en `BaseSequencer`)                                                                              |

**Ventana N.** Hoy **N=3** (`HISTORY_N_DEFAULT`). Se ajusta solo con evidencia del **historial
hit-rate** que publica la métrica TTFF: ventana corta = frescura; ventana larga = memoria de fallos
raros. Sin historial el orden degrada a **determinista**, nunca a aleatorio.

**Protocolo de triage (order-dependence).** Un test que falla solo en ciertas permutaciones es
order-dependente ⇒ **arreglarlo, no ordenarlo**. El shuffle con seed fijo es una auditoría, jamás el
comportamiento por defecto del nocturno ni del tier PR (el nocturno corre `TIA_SEQUENCER=stable` y
el run completo en orden natural; el shuffle no se añade a `.husky/pre-push`).

**Paridad local.** El tier local hereda el mismo contrato de orden vía `vitest.shared.js`; el hook
`.husky/pre-push` no se modifica (solo cambia el orden de los tests ya seleccionados, nunca cuáles).

---

## 5. Gaps vs práctica enterprise y plan

| #   | Gap                                                                                                                                                      | Prioridad | Acción                                                                                                                                                                                                    | Esfuerzo | Dueño                               |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | ----------------------------------- |
| 1   | **Sin historial consolidado** `tia-history.json` (prerequisito de todo lo demás)                                                                         | **P2**    | Tasks 4.1/4.2 de `tia-hardening`: `tia-history.mjs --record` + artefacto `tia-history-<workspace>` (N=3, retención 30d)                                                                                   | Medio    | `tia-hardening`                     |
| 2   | **Sin `sequence.sequencer`** fail-first (regla 21 / gap 6)                                                                                               | **P3**    | Task 5.1: receta §4.2/§4.3 + opt-out `TIA_SEQUENCER=stable` en el nightly                                                                                                                                 | Bajo     | `tia-hardening`                     |
| 3   | **Verificación de orden** (¿el rojo histórico aparece primero? ¿selección intacta?)                                                                      | **P3**    | Task 5.2: fallo sembrado + comparación de lista con y sin sequencer                                                                                                                                       | Bajo     | `tia-hardening`                     |
| 4   | **Caché de orden no persiste en CI** (`setup-monorepo` excluye `node_modules/.cache/vitest`)                                                             | **P2**    | El sequencer con historial **sustituye** ese hueco (historial propio, no la caché de Vitest); si no, valorar incluir `node_modules/.cache/vitest` en el cache (medir antes: puede invalidar por lockfile) | Bajo     | Coordinar con `tia-hardening`       |
| 5   | **Sin métrica TTFF / %fallos en primer X%**                                                                                                              | **P3**    | Añadir TTFF e hit-rate del historial al step summary (junto a `injected=M`, task 4.4) — advisory con `\|\| true`                                                                                          | Bajo     | `tia-hardening`                     |
| 6   | **Flaky no degradado en el ranking** (riesgo paper Chrome: historial dominado por ruido)                                                                 | **P3**    | Usar `flaky-retries.json` para marcar intermitentes y no ascenderlos; la cuarentena ya los excluye del PR                                                                                                 | Medio    | Coordinar con `ci-flaky-quarantine` |
| 7   | **Sin auditoría periódica de order-dependence** (shuffle con seed)                                                                                       | **P3**    | Job advisory semanal o local documentado (receta §4.4); jamás comportamiento por defecto del nocturno                                                                                                     | Bajo     | CI maintainers                      |
| 8   | **Docs desactualizadas al implementar**: celda "Smart Test Ordering — NO" (`ci-cd-pipeline-empresarial.md` ~3412) y gap 6 (`test-impact-analysis.md` §5) | **P3**    | Actualizar ambas para apuntar a este doc y al estado implementado — **en PRs separados** para no chocar con los PRs de `tia-hardening`                                                                    | Bajo     | Docs maintainers                    |

**Orden recomendado**: 1 → 2 → 3 (cadena crítica de `tia-hardening`) → 5 → 4 → 6 → 7 → 8.
Ninguna acción toca los safety nets: guard D7, D18, la cuarentena, `.husky/pre-push` ni los
`continue-on-error` (propiedad de `ci-testing-gate-promotion`) — ver [`quality-gates.md`][qg].

---

## 6. Referencias

### Conceptos y academia

- Rothermel, G., Untch, R., Chu, C. & Harrold, M. J. _Prioritizing Test Cases for Regression
  Testing_ (TSE 2001) — métrica APFD y familia de técnicas TCP; retrospectiva:
  <https://www.computer.org/csdl/journal/ts/2025/03/10872897/24488ep1vEc>
- Rothermel et al. _Test Case Prioritization: A Family of Empirical Studies_ (fórmula APFD):
  <https://digitalcommons.unl.edu/cgi/viewcontent.cgi?article=1018&context=csearticles>
- _Test Case Prioritization: An Empirical Study_ (priorizar por tasas de fallo históricas de los
  módulos): <https://courses.cs.umbc.edu/undergraduate/345/spring12/mitchell/readings/testCasePrioritization-AnEmpiricalStudy.pdf>
- Fallahzadeh et al. _The Impact of Flaky Tests on Historical Test Prioritization on Chrome_
  (99.58% de fallos flaky): <https://www.semanticscholar.org/paper/The-Impact-of-Flaky-Tests-on-Historical-Test-on-Fallahzadeh-Rigby/095b84292ca2c4180386104b0efe870da9068b99>
- Yoo, S. & Harman, M. (2012) _Regression testing minimization, selection and prioritization: a
  survey_: <https://onlinelibrary.wiley.com/doi/10.1002/stvr.430>

### Herramientas

- Vitest — `sequence` config (`sequencer`, `shuffle`, `seed`, `groupOrder`):
  <https://vitest.dev/config/sequence> · `BaseSequencer` (sort: failed → duration; unknown →
  larger): <https://github.com/vitest-dev/vitest/blob/main/packages/vitest/src/node/sequencers/BaseSequencer.ts>
- Jest CLI (`--onlyFailures`, `--bail`, `--randomize`, `--seed`): <https://jestjs.io/docs/cli>
- pytest — re-run con cache (`--lf`, `--ff`, `--new-first`, `--lfnf`):
  <https://docs.pytest.org/en/stable/how-to/cache.html> · pytest-testmon (`--testmon-noselect`):
  <https://www.testmon.org> · <https://github.com/tarpas/pytest-testmon>
- Go — `go test -shuffle`: <https://pkg.go.dev/cmd/go>
- Microsoft / Azure TIA (previously failing + full run periódico + `DisableTestImpactAnalysis`):
  <https://learn.microsoft.com/en-us/azure/devops/pipelines/test/test-impact-analysis> · blog
  parte 1: <https://devblogs.microsoft.com/devops/accelerated-continuous-testing-with-test-impact-analysis-part-1>
- Develocity Predictive Test Selection: <https://develocity.ai/product/predictive-test-selection> ·
  caso Jamf (66% unit serial): <https://medium.com/jamf-engineering/build-and-test-acceleration-with-gradle-enterprise-37ac7a4599d9>
- CircleCI — Smarter Testing (4× feedback): <https://circleci.com/blog/smarter-testing> · test
  splitting por timings: <https://circleci.com/blog/intelligent-ci-cd-with-circleci-test-splitting> ·
  <https://circleci.com/docs/guides/optimize/parallelism-faster-jobs>
- Buildkite Test Engine (flaky = mismo SHA, resultados distintos):
  <https://buildkite.com/platform/test-engine> · Understanding flaky tests (order-dependence):
  <https://buildkite.com/resources/blog/understanding-flaky-tests>
- Datadog Test Impact Analysis / ITR: <https://docs.datadoghq.com/tests/test_impact_analysis>
- CloudBees Smart Tests (ex-Launchable, adquirida ago-2024):
  <https://www.cloudbees.com/newsroom/cloudbees-acquires-launchable-to-boost-genai-efforts-across-devsecops> ·
  <https://www.cloudbees.com/blog/how-cloudbees-smart-tests-works>
- Meta — Predictive Test Selection (blog):
  <https://engineering.fb.com/2018/11/21/developer-tools/predictive-test-selection> · paper:
  <https://arxiv.org/pdf/1810.05286>
- Google Testing Blog — _Flaky Tests at Google and How We Mitigate Them_ (sesgo de "failing
  tests first"): <https://testing.googleblog.com/2016/05/flaky-tests-at-google-and-how-we.html>
- GitHub Actions — `strategy.fail-fast` y `continue-on-error`:
  <https://docs.github.com/actions/writing-workflows/choosing-what-your-workflow-does/running-variations-of-jobs-in-a-workflow>

### Documentación interna del proyecto

- [`docs/learning/test-impact-analysis.md`][tia] (selección TIA; gap 6 = este documento)
- [`docs/ci-cd-pipeline-empresarial.md`][emp] (§23.3 **regla 21** — smart test ordering, línea
  859; tabla de optimizaciones ~línea 3412 "Smart Test Ordering — NO")
- [`docs/learning/quality-gates.md`][qg] (FASE 1 → FASE 2; ventana de calibración)
- [`docs/learning/unit-tests-enterprise.md`][ute] (§2.4 sharding, §2.5 smart test ordering)
- Change en vuelo: [`openspec/changes/tia-hardening/design.md`][tiah-design] (D7 fail-first) y
  [`tasks.md`][tiah-tasks] (4.1/4.2 historial → 5.1 sequencer → 5.2 verificación)
- [`docs/testing-architecture.md`][testing] (§7.5 — estrategia de tres tiers)
- Specs: [`openspec/specs/ci-test-impact-analysis/spec.md`][spec] (guard D7, D18)
- Flujos de trabajo: [`.github/workflows/nightly-full-suite.yml`][nightly] ·
  [`scripts/ci/quarantine-exclude.mjs`][quarantine] · [`.husky/pre-push`][prepush]

[tia]: test-impact-analysis.md
[emp]: ../ci-cd-pipeline-empresarial.md
[qg]: quality-gates.md
[ute]: unit-tests-enterprise.md
[testing]: ../testing-architecture.md
[spec]: ../../openspec/specs/ci-test-impact-analysis/spec.md
[tiah-design]: ../../openspec/changes/tia-hardening/design.md
[tiah-tasks]: ../../openspec/changes/tia-hardening/tasks.md
[nightly]: ../../.github/workflows/nightly-full-suite.yml
[quarantine]: ../../scripts/ci/quarantine-exclude.mjs
[prepush]: ../../.husky/pre-push
