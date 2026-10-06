# Test Impact Analysis (TIA) — Seleccionar Solo los Tests Afectados por el Diff

> **Fecha de investigación:** 2026-10-05  
> **Alcance:** Concepto, técnicas (static/dynamic/predictive, safe/unsafe), herramientas
> comparadas, patrones CI enterprise y **estado actual en este monorepo** (scripts
> `test:changed*`, guard D7, regla D18, nightly, cuarentena, pre-push) con gaps y plan de mejora.  
> **Audiencia:** Equipo de ingeniería, CI/CD maintainers, QA lead.  
> **Status:** ✅ Investigación completa — el repo YA tiene TIA funcional (diff-scoped + D7 +
> nightly), con 8 gaps documentados frente a la práctica enterprise.

---

## 1. Qué es Test Impact Analysis

**Test Impact Analysis (TIA)** es el proceso de determinar, a partir de un cambio de código,
**qué tests existentes pueden verse afectados por él** y ejecutar únicamente ese subconjunto,
en lugar de la suite completa. Es la forma automatizada de _regression test selection_ (RTS).

> El objetivo no es "saltarse tests": es **acortar el feedback loop sin perder la garantía de
> detección de regresiones** — la suite completa sigue existiendo, en otro nivel del sistema
> (tier nocturno, rutas compartidas, main).

### 1.1 Eje de origen de la información: static vs dynamic vs predictive

| Técnica                       | Cómo decide                                                                         | Ejemplos                                                                                     | Fortaleza                                                     | Debilidad                                                                                   |
| ----------------------------- | ----------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- | ------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| **Static (dependency-based)** | Grafo de imports / call graph / checksums de ficheros calculado _sin ejecutar_ nada | `vitest --changed`, `jest --findRelatedTests`, Nx `affected`, Turborepo `--affected`, STARTS | Rápido, sin run previo                                        | Sensible a imports dinámicos/reflect/DI: falsos positivos (corre de más) o negativos (miss) |
| **Dynamic (coverage-based)**  | Ejecución previa con coverage: qué ficheros ejecutó cada test                       | `pytest-testmon`, Ekstazi, Azure TIA, Datadog TIA, Vitest `coverage.changed`                 | Precisión alta a nivel de ejecución                           | Requiere un run inicial completo + persistir el mapa; coste de recolección                  |
| **Predictive (ML)**           | Modelo entrenado sobre historial de resultados (qué test falló en qué diff)         | Meta _Predictive Test Selection_, Launchable, Gradle Predictive Test Selection               | Reduce más el suite (Meta: ~2× coste, ≥95% fallos detectados) | Necesita histórico grande; opacidad; manejo explícito de flakiness                          |

> En la práctica, **los sistemas modernos combinan varias capas**: dependencias (static) +
> cobertura (dynamic) + historia fallida/predictiva, con _safe fallback_ a la suite completa
> cuando no pueden razonar sobre el cambio.

### 1.2 Eje de garantía: safe vs unsafe selection

Definición clásica (Rothermel & Harrold; recogida en el systematic review de **Engström et al.**):

- **Safe selection**: ningún test capaz de revelar la regresión queda fuera del subconjunto.
  _Re-test all_ es el extremo seguro trivial.
- **Unsafe selection**: mayor reducción, pero con riesgo de **miss** (un test que habría fallado
  no corre). Toda optimización agresiva (minimización, ML, aleatorio) vive aquí y debe
  compensarse con una red de seguridad.

Hallazgos empíricos relevantes para dimensionar el riesgo:

- **Yoo & Harman (2012)** — _Regression testing minimization, selection and prioritization:
  A survey_, STVR 22(2):67–120 (~2200 citas): las tres ramas (minimización, selección,
  priorización) existen y **casi todas son unsafe**; la selección reduce costo pero su valor
  depende de la granularidad del análisis.
- **RTSCheck (Cornell/Legunsen)**: verificó herramientas reales de RTS (Clover, Ekstazi, STARTS)
  sobre 31K programas evolutivos y encontró **24K violaciones de safety** → ninguna herramienta
  se toma "por fe": medir su selección es parte del diseño.
- **Ekstazi vs STARTS (empírico)**: en estudios comparativos Ekstazi (dynamic, class-level)
  redujo el suite ~84% y STARTS (static) ~68%; STARTS puede perder dependencias vía reflection,
  Ekstazi necesita re-ejecutar para actualizar su mapa.

> **Regla enterprise**: TIA es _unsafe_ por naturaleza → **nunca puede ser el único gate**.
> Siempre acompaña a (a) full suite en la rama por defecto, (b) tier nocturno/pre-release
> completo y (c) fallbacks ruidosos ante cualquier duda (§3).

---

## 2. Herramientas comparativas

| Herramienta                                                               | Tipo                              | Selección                                                                                                                                        | Persistencia                             | Notas                                                                                                                                                                                                                                           |
| ------------------------------------------------------------------------- | --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Vitest `--changed[=rev]`**                                              | Static                            | `git diff` (VCSProvider extensible) → grafo de imports de Vite (incluye dynamic imports literales)                                               | Cache local `node_modules/.cache/vitest` | `vitest related <files>` para selección explícita; `coverage.changed=<rev>` (Vitest 4) limita el reporte a los ficheros cambiados; cambios en `vitest.config` o `package.json` re-ejecutan el suite completo por defecto (`forceRerunTriggers`) |
| **Vitest `list --changed --filesOnly`**                                   | Static                            | Audita _qué_ seleccionaría Vitest sin correrlo                                                                                                   | —                                        | Receta de shadow mode (§3.2)                                                                                                                                                                                                                    |
| **Jest `--onlyChanged` / `--changedSince`**                               | Static                            | Inverso del grafo de dependientes de los ficheros cambiados                                                                                      | Cache de Jest                            | Gap conocido ([jestjs/jest#8702](https://github.com/jestjs/jest/issues/8702)): cambio solo de `package.json` no dispara nada → requiere capa de "rutas shared"                                                                                  |
| **Jest `--findRelatedTests <files>`**                                     | Static                            | Tests relacionados a una lista concreta                                                                                                          | —                                        | Útil con `lint-staged`/CI con lista ya calculada                                                                                                                                                                                                |
| **Jest `--onlyFailures`**                                                 | Historial                         | Re-ejecuta solo los tests fallidos del run anterior (historial por test)                                                                         | Cache de Jest                            | Equivalente a la componente "previously failing tests" de Microsoft TIA                                                                                                                                                                         |
| **Nx `affected -t test` / `affected:graph`**                              | Static (file-level project graph) | Diff vs base + grafo de proyectos (imports reales, no solo `package.json`)                                                                       | Local + Nx Cloud                         | El más preciso en monorepos con muchos paquetes; se calcula una vez y alimenta build+test                                                                                                                                                       |
| **Turborepo `--affected` / `--filter=[HEAD^1]` / `turbo query affected`** | Static (package-level)            | Task hash (global + task) + grafo de paquetes                                                                                                    | Local `.turbo/cache` + remote cache      | 2.10 añadió `--affected` componible; ideal si el problema es "ejecución rápida", no "plataforma"                                                                                                                                                |
| **pytest-testmon**                                                        | Dynamic (coverage.py)             | DB `.testmondata` de dependencias test→líneas ejecutadas + checksums                                                                             | `.testmondata` (subible a S3/CI)         | Si falta/corrompe la DB → **corre todo** y reconstruye; exige un run inicial completo                                                                                                                                                           |
| **Ekstazi (Java)**                                                        | Dynamic (class-level)             | Clases cargadas en runtime por cada test                                                                                                         | Ficheros de dependencia                  | Selección agresiva; nuevas tests siempre se seleccionan                                                                                                                                                                                         |
| **STARTS (Java)**                                                         | Static (bytecode)                 | Grafo de dependencias compilado                                                                                                                  | Checksums                                | Pierde dependencias vía reflection                                                                                                                                                                                                              |
| **Azure Pipelines TIA (.NET)**                                            | Dynamic + reglas                  | impacted + **newly added** + **previously failing**; _safe fallback_ a full suite ante cualquier cambio que no entienda (HTML/CSS, data-driven…) | Mapa de dependencias del servidor        | Recomienda **full run periódico explícito** como regulador de la selección; `DisableTestImpactAnalysis=true` para forzar full                                                                                                                   |
| **Meta Predictive Test Selection**                                        | Predictive (GBDT)                 | Features históricas del diff/test → probabilidad de fallo                                                                                        | Dataset histórico de outcomes            | ICSE-SEIP 2019: mitad de coste de infra; ≥95% de fallos y ≥99.9% de cambios defectuosos capturados; **entrena distinguiendo flakiness**                                                                                                         |
| **Datadog Test Optimization (TIA)**                                       | Dynamic (coverage)                | Coverage por test × ficheros del diff                                                                                                            | Servicio SaaS                            | Presetea la rama por defecto a _excluirse_ de la selección (full suite como failsafe)                                                                                                                                                           |
| **Launchable**                                                            | Predictive                        | Modelo sobre historial de CI                                                                                                                     | SaaS                                     | Citado en `docs/ci-cd-pipeline-empresarial.md` como smart ordering / PTS                                                                                                                                                                        |
| **Gradle PTS / Bazel query**                                              | Predictive / build-graph          | Bazel: `bazel query` sobre el grafo hermético                                                                                                    | —                                        | Build-system-level: la selección nace del mismo grafo que el build [BL]                                                                                                                                                                         |

> No hay equivalente "GitHub-native" gestionado: en GitHub Actions la selección se compone con
> `dorny/paths-filter` / `paths` del workflow + convención de nombres de test (colocación
> `*.unit.test.js`) + un runner que hace el diff (lo que ya hace `vitest --changed`).

---

## 3. Patrones CI enterprise

### 3.1 Tiered testing (los tres niveles)

| Tier                                | Trigger                    | Alcance                                                                    | Objetivo de tiempo                       |
| ----------------------------------- | -------------------------- | -------------------------------------------------------------------------- | ---------------------------------------- |
| **Tier 1 — PR**                     | Cada push de PR            | **Diff-scoped (TIA)** + smoke                                              | < 5–10 min → time-to-first-feedback [FB] |
| **Tier 2 — merge / main**           | Merge a `main`             | Suite completa del workspace afectado (o full cuando cambian rutas shared) | < 30 min                                 |
| **Tier 3 — nocturno / pre-release** | `schedule` (ej. 02:40 UTC) | Suite COMPLETA, sin exclusiones                                            | < 60–90 min, triage advisory→blocking    |

Aditivos enterprise recurrentes:

- **Ruta por defecto completa**: la rama principal corre siempre full suite (Datadog lo preset-a;
  en este repo lo hace el nightly + los PRs `shared`).
- **Shadow mode**: antes de confiar en la selección, ejecutar en paralelo (o loguear) _qué
  habría seleccionado_ TIA vs lo que realmente corre, durante 1–2 semanas, para medir precisión
  y falsos positivos.
- **Smart ordering / fail-first**: ordenar por probabilidad histórica de fallo (Launchable, o
  `BaseSequencer` de Vitest) para que el primer fallo aparezca antes (regla 21 de
  `docs/ci-cd-pipeline-empresarial.md` §23.3).
- **Flaky handling**: TIA y cuarentena conviven — los tests en cuarentena se excluyen del tier
  PR (`quarantine-exclude.mjs`) pero **se ejecutan en el tier nocturno**, que es la evidencia
  para restaurarlos.

### 3.2 Fallbacks obligatorios (nunca un "verde vacío")

| Situación                                                                              | Riesgo                                                  | Fallback                                                                             |
| -------------------------------------------------------------------------------------- | ------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| Base (`origin/main`) no resoluble / shallow fetch                                      | Diff imposible de calcular                              | Full suite **ruidosa** (warning), jamás "0 tests" en silencio                        |
| El diff selecciona **0 tests** (`passWithNoTests`, exit 0)                             | _Vacuous green_: el agregador cuenta 0 tests como verde | Detectar `numTotalTests==0` → re-correr full suite                                   |
| Cambian rutas compartidas (root `package.json`, lockfile, workflows, configs de grafo) | Un bump de dependencias afecta tests "no tocados"       | Full suite de ambos workspaces                                                       |
| Mapa de dependencias ausente/corrupto (testmon DB, coverage artifact)                  | Selección inválida                                      | Reconstruir desde cero / suite completa                                              |
| Cobertura medida sobre subconjunto                                                     | % irreparable (demasiado bajo o inflado)                | Umbral **solo** en full suite; en diff-scoped solo verificar presencia del artefacto |

### 3.3 [BL] Build-less/test-more ↔ build caching

TIA es un **patrón [BL] (Build-less/test-more)**: valida en PRE-BUILD con código fuente, sin
artefacto compilado, y solo si pasa se paga el build. Interactúa con el build layer en tres
puntos:

1. **Mismo grafo, dos consumidores**: Nx/Turborepo calculan _affected_ una vez y lo usan para
   `build` y `test` — evitan duplicar la lógica de diff-scoping (hoy este repo la duplica:
   `dorny/paths-filter` para jobs + `vitest --changed` para tests).
2. **Invalidación de caché = hash de inputs**: si el lockfile, `turbo.json`/`nx.json`, configs o
   env no entran en el hash, hay _false hits_ (cache verde con código nuevo). Corolario: **las
   rutas shared que invalidan el test scope deben invalidar también el build cache** (mismo
   criterio, un solo dueño).
3. **Orden y pago**: tests scoped primero (segundos) → build solo sobre lo que sobrevivió →
   artefactos con `outputs` declarados para reutilizarse (local + remote cache).

### 3.4 [FB] Fast feedback: inner y outer loop

- **Inner loop (dev)**: `pre-push` con selección diff-scoped (~30 s, límite SSH de GitHub) — el
  desarrollador sabe si rompió algo _antes_ de consumir CI.
- **Outer loop (PR)**: Tier 1 diff-scoped en minutos; patrón CircleCI de gates escalonados:
  unit < 3 min → integración/selección < 10 min → full en merge (< 8 min a primer fallo).
- **Compensación**: la confianza perdida por acortar cada PR se recupera en Tier 2/3 (nightly +
  `shared`), no se _suprime_.

---

## 4. Configuración actual en este repo

Spec canónica: [`openspec/specs/ci-test-impact-analysis/spec.md`][spec] (4 requirements:
diff-scoped execution, full suite on shared path changes, scheduled full-suite safety net,
TIA no debilita gates locales ni CI).

### 4.1 Scripts por workspace (`package.json`)

```jsonc
// apps/server/package.json  (solo unit: los integration necesitan PostgreSQL)
"test:changed":     "vitest run \".unit.test.js\" --changed origin/main",
"test:changed:ci":  "vitest run \".unit.test.js\" --changed origin/main --coverage --reporter=default --reporter=junit --reporter=json --reporter=../../scripts/ci/vitest-flaky-reporter.mjs --outputFile.junit=reports/junit.xml --outputFile.json=reports/vitest-results.json",

// apps/client/package.json (unit + integración de componente jsdom)
"test:changed":     "vitest run --changed origin/main",
"test:changed:ci":  "vitest run --changed origin/main --coverage --reporter=default --reporter=junit --reporter=json --reporter=../../scripts/ci/vitest-flaky-reporter.mjs --outputFile.junit=reports/junit.xml --outputFile.json=reports/vitest-results.json",

// package.json (raíz)
"test:changed": "npm run test:changed --workspaces --if-present"
```

### 4.2 CI: step "Resolve TIA scope" (`ci.yml`, jobs `test-unit-client` / `test-unit-server`)

STAGE 2 SUBSTAGE 2D (prebuild, FASE 1 advisory con `continue-on-error: true`):

```yaml
- name: Resolve TIA scope (diff-scoped vs full suite)
  id: tia
  run: |
    if [ "${{ needs.repo-discovery.outputs.shared }}" = "true" ]; then
      echo "scope=full" >> "$GITHUB_OUTPUT"     # rutas shared: root manifest, lockfile, workflows
    elif git rev-parse --verify --quiet origin/main > /dev/null; then
      echo "scope=changed" >> "$GITHUB_OUTPUT"   # diff-scoped
    else
      echo "scope=full" >> "$GITHUB_OUTPUT"      # base NO resoluble → full ruidoso
    fi
```

- El filtro `shared` lo define `dorny/paths-filter@v4` en `repo-discovery`: `package.json`,
  `package-lock.json`, `.github/workflows/**`, `.dependency-cruiser.cjs` (raíz y por workspace).
- El checkout usa `fetch-depth: 0` para que `origin/main` exista.
- **Guard D7** (evita _vacuous green_ con `passWithNoTests`):

```bash
npm run test:changed:ci --workspace=apps/client -- ${{ steps.quarantine.outputs.args }}
RAN=$(node -p "require('./apps/client/reports/vitest-results.json').numTotalTests" 2> /dev/null || echo 0)
if [ "${RAN:-0}" -eq 0 ]; then
  echo "::warning::TIA matched 0 tests for this diff; running the FULL suite."
  echo "scope=full" > apps/client/reports/tia-scope.txt
  npm run test:coverage:ci --workspace=apps/client -- ${{ steps.quarantine.outputs.args }}
fi
```

- **Regla D18** (jobs `client-coverage` / `server-coverage`): `check-coverage.mjs` **solo evalúa
  thresholds si `tia-scope.txt == full`**; en diff-scoped solo se exige la presencia del
  artefacto de cobertura y el umbral se difiere a la próxima full-suite (nocturno o PR
  `shared`).

### 4.3 Auditoría de la selección (receta shadow mode)

```bash
# ¿Qué seleccionaría Vitest para este diff? (sin ejecutar)
npx vitest list --changed --filesOnly --config apps/client/vitest.config.js

# Diff de ficheros que Vitest usa como entrada
git diff --name-only origin/main...HEAD
```

### 4.4 Red de seguridad, cuarentena y nivel local

| Pieza                                                 | Papel en TIA                                                                                                                                                                                                                 |
| ----------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`.github/workflows/nightly-full-suite.yml`][nightly] | **Safety net**: cron `40 2 * * *` (02:40 UTC), suite COMPLETA de ambos workspaces, _nunca_ TIA, **sin** exclusiones de cuarentena (la evidencia de restauración), coverage advisory (D18)                                    |
| [`scripts/ci/quarantine-exclude.mjs`][quarantine]     | Deriva `--exclude=<glob>` **exclusivamente** de `.github/flaky-quarantine.yml`; fichero corrupto → `exit 1` (nunca "excluir todo" ni "excluir nada" en silencio); los args pasan a `test:changed:ci` y a `test:coverage*:ci` |
| [`.husky/pre-push`][prepush]                          | `git fetch origin main --depth=1` + verificación de `origin/main` + DCO + `npm run test:changed --workspace=apps/{server,client}` — **mismo contrato de selección que CI** (§10.6 de `docs/CONTEXT-CICD.md`)                 |
| Artefacto `reports/tia-scope.txt`                     | Comunica el scope decidido al job de cobertura (entrada de D18); se sube con la evidencia de flakiness (retención 30 días)                                                                                                   |
| FASE 1 advisory                                       | Los jobs `test-unit-*` corren hoy con `continue-on-error: true` → **reportan sin bloquear**; FASE 2 los promueve a blocking tras la calibración                                                                              |

### 4.5 Dónde está etiquetado TIA en la documentación

- `docs/ci-cd-pipeline-empresarial.md` (~líneas 2738–2830): leyenda de tags —
  `[BL] Build-less/test-more`, `[FB] Fast feedback`, y el nodo _"Test Impact Analysis (TIA) —
  solo tests afectados por diff `[BL][FB]`"_ dentro del diagrama del pipeline; también §23.3
  regla 21 (smart ordering) y la tabla de optimizaciones (TIA = 60–90% de reducción de tests).
- [`docs/testing-architecture.md`][testing] §7.5: estrategia de tres tiers (pre-push scoped /
  CI diff-scoped + nightly + rutas shared).
- `docs/learning/ci-cd/05-husky-git-hooks.md`: desglose del hook y ejercicios de `--changed`.
- [`docs/adr/turborepo-evaluation.md`][adr]: `vitest --changed` es local y **no persistente
  cross-machine** — gap que Turborepo/Nx cerrarían.
- [`docs/learning/unit-tests-enterprise.md`][ute]: `coverage.changed` (Vitest 4) identificado
  como candidato TIA, **no implementado**.

---

## 5. Gaps vs práctica enterprise y plan de mejora

> **Nota explícita**: el repo **parte con TIA funcional** (diff-scoped en CI + guard D7 + safety
> net nocturno + cuarentena + pre-push), es decir, ya cubre los _fallbacks obligatorios_ del
> §3.2. Los 8 gaps son de **precisión, medición y madurez**, no de seguridad básica.

| #   | Gap                                                                                                                                           | Prioridad | Acción propuesta                                                                                                                                        | Esfuerzo |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| 1   | `coverage.changed` (Vitest 4) sin usar: la cobertura de `test:changed:ci` mezcla lo ejecutado con lo importado                                | **P1**    | Añadir `--coverage.changed=origin/main` a `test:changed:ci` y validar con `check-coverage.mjs` en modo advisory                                         | Bajo     |
| 2   | Sin **shadow mode** ni métrica de precisión TIA (¿qué % del suite corre por PR? ¿cuántos falsos positivos por imports dinámicos tipo router?) | **P1**    | Loguear `vitest list --changed --filesOnly` + `numTotalTests/totalTests` en el step summary; revisar tras 2 semanas antes de promover FASE 2            | Bajo     |
| 3   | Sin **coverage-map persistente** (solo grafo de imports en memoria)                                                                           | **P2**    | Artefacto de dependencias estilo testmon/Agoda: subir mapa de coverage desde `main` a cache/artifact y consumirlo en PRs                                | Alto     |
| 4   | No se inyectan **previously failing tests** a la selección (componente 2 de Microsoft TIA)                                                    | **P2**    | Combinar con el historial de `vitest-results.json`/JUnit: re-ejecutar siempre los tests que fallaron en los últimos N runs de `main`                    | Medio    |
| 5   | TIA solo cubre unit (client + server); `test-integration`, `test-smoke` y `e2e` no se scopean                                                 | **P3**    | Extender el mismo contrato (`Resolve TIA scope` + D7) a integration/e2e cuando su duración lo justifique                                                | Medio    |
| 6   | Sin **smart ordering / fail-first** basado en histórico                                                                                       | **P3**    | `BaseSequencer` de Vitest + orden por tasa de fallo histórica (regla 21, `ci-cd-pipeline-empresarial.md` §23.3)                                         | Bajo     |
| 7   | **Remote cache build+test** no compartido: diff-scoping y cache hashing calculados por separado                                               | **P3**    | Evaluar Turborepo (`--affected` + remote cache) según [`docs/adr/turborepo-evaluation.md`][adr]; o al menos declarar `outputs`/hash inputs consistentes | Medio    |
| 8   | Jobs `test-unit-*` en **FASE 1 advisory** (`continue-on-error: true`) — TIA reporta pero no bloquea                                           | **P3**    | Promover a blocking tras la ventana de calibración (2–4 semanas, en lockstep con [`quality-gates.md`][qg])                                              | Bajo     |

**Orden recomendado**: 2 (medir) → 1 (quick win de cobertura) → 8 (convertir en gate) → 4 → 6
→ 5 → 3 → 7.

---

## 6. Referencias

### Conceptos y academia

- Yoo, S. & Harman, M. (2012). _Regression testing minimization, selection and prioritization:
  A survey_. Software Testing, Verification and Reliability 22(2):67–120.
  <https://onlinelibrary.wiley.com/doi/10.1002/stvr.430>
- Engström, E. et al. _A Systematic Review on Regression Test Selection_.
  <https://fileadmin.cs.lth.se/cs/Personal/Emelie_Engstrom/Papers/IST_syst_review_regr_test.pdf>
- Rothermel, G. & Harrold, M. J. _Analyzing Regression Test Selection Techniques_.
  <http://www.cs.toronto.edu/~chechik/courses05/csc410/readings/rothmel96analyzing.pdf>
- Zhu, Y. et al. (Cornell). _A Framework for Checking Regression Test Selection Tools_
  (RTSCheck). <https://www.cs.cornell.edu/~legunsen/pubs/ZhuETAL19RTSCheck.pdf>
- Biswas, S. et al. _Regression Test Selection Techniques: A Survey_.
  <http://www.informatica.si/index.php/informatica/article/view/355/356>

### Herramientas

- Vitest — `changed` config: <https://vitest.dev/config/changed> · CLI (`related`,
  `coverage.changed`): <https://vitest.dev/guide/cli>
- Vitest — cobertura con `--changed`:
  <https://github.com/vitest-dev/vitest/discussions/4868> · falso positivo por dynamic imports:
  <https://github.com/vitest-dev/vitest/discussions/10026>
- Jest CLI (`--onlyChanged`, `--changedSince`, `--findRelatedTests`, `--onlyFailures`):
  <https://jestjs.io/docs/cli> · gap `package.json`:
  <https://github.com/jestjs/jest/issues/8702>
- Turborepo caching / task inputs / `--affected`:
  <https://turborepo.dev/docs/crafting-your-repository/caching>
- pytest-testmon: <https://www.testmon.org> · <https://github.com/tarpas/pytest-testmon> ·
  determinación de tests afectados: <https://www.testmon.org/blog/determining-affected-tests>
- Ekstazi (lightweight test selection):
  <https://users.ece.utexas.edu/~gligoric/papers/GligoricETAL15EkstaziTool.pdf> ·
  comparación empírica de 4 RTS Java:
  <https://www.sciencedirect.com/science/article/abs/pii/S0164121221002582>
- Azure Pipelines TIA:
  <https://learn.microsoft.com/en-us/azure/devops/pipelines/test/test-impact-analysis> ·
  blog parte 1:
  <https://devblogs.microsoft.com/devops/accelerated-continuous-testing-with-test-impact-analysis-part-1>
- Meta — Predictive Test Selection (blog):
  <https://engineering.fb.com/2018/11/21/developer-tools/predictive-test-selection> · paper:
  <https://arxiv.org/pdf/1810.05286> ·
  <https://research.facebook.com/publications/predictive-test-selection>
- Datadog Test Impact Analysis:
  <https://www.datadoghq.com/blog/streamline-ci-testing-with-datadog-intelligent-test-runner>
- TIA vs predictive (CloudBees):
  <https://www.cloudbees.com/blog/predictive-test-selection-vs-test-impact-analysis>
- Instawork — TIA con testmon en CI (coverage-map persistente):
  <https://engineering.instawork.com/test-impact-analysis-the-secret-to-faster-pytest-runs-e44021306603>
- Agoda — selective testing (coverage de main en cloud, solo tests exitosos suben coverage):
  <https://agoda-engineering..medium.com/optimizing-ci-cd-processes-with-selective-testing-f537f9abc9d3>
- trivago — retries selectivos en E2E:
  <https://tech.trivago.com/post/2023-09-27-end-to-end-tests-retry-strategies>

### Patrones CI

- CircleCI — gates escalonados (unit <3 min / PR <10 min / full en merge):
  <https://circleci.com/blog/regression-testing-and-how-to-automate-it-with-ci>
- Harness — change-based selection + nightly:
  <https://www.harness.io/blog/regression-testing-in-ci-cd-deliver-faster-without-the-fear>
- WarpBuild — selección en GitHub Actions con gate fijo sobre matriz afectada:
  <https://www.warpbuild.com/guides/test-impact-analysis-github-actions>

### Documentación interna del proyecto

- Spec: [`openspec/specs/ci-test-impact-analysis/spec.md`][spec]
- [`docs/testing-architecture.md`][testing] (§7.5 — estrategia de tres tiers)
- [`docs/learning/quality-gates.md`][qg] (FASE 1 → FASE 2)
- [`docs/adr/turborepo-evaluation.md`][adr]
- [`docs/learning/unit-tests-enterprise.md`][ute]
- [`docs/learning/snapshot-testing.md`][snap]
- [`docs/ci-cd-pipeline-empresarial.md`][emp] (tags `[BL][FB]`, §23.3 regla 21)
- [`docs/learning/ci-cd/05-husky-git-hooks.md`](ci-cd/05-husky-git-hooks.md)

[spec]: ../../openspec/specs/ci-test-impact-analysis/spec.md
[nightly]: ../../.github/workflows/nightly-full-suite.yml
[quarantine]: ../../scripts/ci/quarantine-exclude.mjs
[prepush]: ../../.husky/pre-push
[testing]: ../testing-architecture.md
[adr]: ../adr/turborepo-evaluation.md
[ute]: unit-tests-enterprise.md
[qg]: quality-gates.md
[snap]: snapshot-testing.md
[emp]: ../ci-cd-pipeline-empresarial.md
