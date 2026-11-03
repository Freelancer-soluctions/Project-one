# Coverage Tripwire & Floor Ratchet — Estrategia Profesional con Vitest/c8

> **Fecha:** 2026-10-05
> **Alcance:** Implementación del patrón _Coverage Tripwire (Floor Ratchet)_ usando Vitest + c8/V8 en este monorepo.
> **Fuentes consultadas:** Documentación oficial Vitest v4, artículos de la comunidad (QASkills,
> Nerd Level Tech, Gaffer.sh, Javascript-Testing.com), y la arquitectura CI/CD ya establecida en
> `docs/ci-cd-pipeline-empresarial.md` y `docs/learning/unit-tests-enterprise.md`.

---

## 1. Introducción: ¿Qué es un Coverage Tripwire?

Un **coverage tripwire** (o _coverage floor_) es un umbral mínimo de cobertura de código que, al
ser violado, **falla el build**. Su propósito es atrapar regresiones catastróficas — un módulo nuevo
con 0 tests, un refactor que elimina tests — , **no certificar calidad**. Es un _smoke detector_, no
un _fireproof_.

Un **floor ratchet** (o simplemente _ratchet_) es una variante del tripwire donde el umbral solo
puede **subir**, nunca bajar. Cada vez que la cobertura mejora, el piso se ajusta automáticamente (o
manualmente) al nuevo nivel, asegurando que nunca retroceda.

### Diferencia clave: Tripwire vs Quality Gate

| Concepto                      | Cobertura mínima          | Propósito                           | Ubicación en el pipeline |
| ----------------------------- | ------------------------- | ----------------------------------- | ------------------------ |
| **Coverage Tripwire**         | Piso absoluto (ej. 60%)   | Atrapar abandono catastrófico       | PRE-BUILD (local + CI)   |
| **Quality Gate autoritativo** | New-code ≥80% (SonarQube) | Certificar calidad del código nuevo | STAGE 4 post-deploy      |

> **Veredicto del proyecto:** El tripwire es el **único guard bloqueante** de cobertura hoy
> (`scripts/ci/check-coverage.mjs`). El quality gate autoritativo (SonarQube new-code) está inactivo
> (`if: false`, sin `SONAR_TOKEN`). Ver §5.

---

## 2. Herramientas: c8 vs V8 vs Istanbul

### 2.1 Opciones disponibles

| Tool            | Provider Vitest | Mecanismo                                                       | Ventajas                                     | Desventajas                                            |
| --------------- | --------------- | --------------------------------------------------------------- | -------------------------------------------- | ------------------------------------------------------ |
| **V8 (native)** | `v8` (default)  | Lee datos de cobertura del motor Node.js via `NODE_V8_COVERAGE` | Sin instrumentation, rápido, cero build step | Precisión de branches limitada en transpilado complejo |
| **Istanbul**    | `istanbul`      | Instrumenta source con Babel antes de ejecutar                  | Gold standard para branch coverage precisa   | Más lento, overhead de memoria                         |
| **c8**          | (implícito)     | Wrapper de `NODE_V8_COVERAGE`                                   | Simple, sin config de instrumentation        | Mismo trade-off que V8                                 |

### 2.2 Recomendación del proyecto

Este proyecto usa **`@vitest/coverage-v8`** (provider `v8`), ya que:

```js
// vitest.shared.js (config compartida)
export default defineConfig({
  test: {
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json-summary', 'html'],
    },
  },
});
```

**Ventajas para este monorepo:**

- ✅ Ya instalado (`@vitest/coverage-v8@^4.1.0` en `apps/server` y `apps/client`)
- ✅ Sin step de build — c8/V8 instrumenta en runtime, los datos son un byproducto casi gratuito del test run
- ✅ Compatible con el patrón TIA (Test Impact Analysis) — ver §4

---

## 3. Configuración del Floor Ratchet

### 3.1 Thresholds globales por workspace

Los thresholds actuales funcionan como **floor ratchet absoluto**:

```js
// apps/server/vitest.config.js
coverage: {
  reportsDirectory: './tests/coverage',
  thresholds: {
    statements: 39,
    branches: 18,
    functions: 7,
    lines: 39,
  },
},

// apps/client/vitest.config.js
coverage: {
  thresholds: {
    statements: 84,
    branches: 49,
    functions: 63,
    lines: 85,
  },
},
```

> **Nota:** Los valores del server son bajos intencionalmente. El coverage global puede ser bajo
> por módulos NORMAL sin que falle CI — la métrica real se valida por módulo en code review (§16.1
> de `testing-architecture.md`).

### 3.2 Configuración del ratchet (autoUpdate)

```js
// Vitest 4 soporta autoUpdate para ratchet asistido
coverage: {
  thresholds: {
    autoUpdate: false, // → SIEMPRE false en CI
    statements: 39,
    branches: 18,
    functions: 7,
    lines: 39,
  },
},
```

**Política del proyecto:**

- `coverage.thresholds.autoUpdate: false` **siempre en CI** (nunca dejar que CI reescriba el piso)
- El ratchet se sube **manualmente en PRs** que mejoran cobertura
- `autoUpdate: true` solo en local/vía PR, **jamás auto-aprobarse en CI**

> **Razón:** Si `autoUpdate` corre sobre una corrida TIA (subset de tests), bajaría el piso incorrectamente. Ver §4.

### 3.3 Thresholds por glob, perFile y critical path — IMPLEMENTADO

Los workspaces declaran un **piso global** más pisos por glob y rutas de negocio críticas; el guard local y los
enforcement points de CI evalúan los mismos niveles. Los valores versionados se muestran abajo y son verificados por
`npm run coverage:docs:verify` contra las configuraciones Vitest y la política crítica.

**Semántica (Vitest 4)** — a leer antes de escribir un glob nuevo:

| Regla                                                                       | Comportamiento                 |
| --------------------------------------------------------------------------- | ------------------------------ |
| Los globs se casan contra la ruta **relativa al project root**              | no contra la ruta absoluta     |
| Un glob **sin** `perFile` compara el **agregado** de los ficheros casados   | —                              |
| Un glob **con** `perFile: true` exige que **cada** fichero llegue al umbral | —                              |
| Los globs **no heredan** el `perFile` de nivel superior                     | hay que declararlo en cada uno |
| Los ficheros de un glob **también cuentan** para el global                  | (a diferencia de Jest)         |
| Un umbral **negativo** significa "como mucho N elementos sin cubrir"        | no un porcentaje               |

El bloque es deliberadamente generado de forma determinista por el verificador; los thresholds numéricos siguen
teniendo como fuente de verdad `apps/*/vitest.config.*` y las rutas exentas viven en `.coverage-critical-paths.json`.

<!-- coverage-floor-ratchet:start -->

| Workspace | Global floor (statements / branches / functions / lines) | Glob floors                                                                                                                                                                                                                                                                                                             | Critical paths         | Exclusions |
| --------- | -------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------- | ---------: |
| client    | 64.44 / 42.11 / 52.22 / 64.82                            | `src/lib/**` (statements 100, branches 100, functions 100, lines 100); `src/config/**` (statements 100, branches 100, functions 100, lines 100); `src/hooks/**` (statements 39.1, branches 44.31, functions 40.35, lines 36.07); `src/components/ui/**` (statements 86.65, branches 44.3, functions 67.96, lines 87.08) | 0 enforced / 0 exempt  |          3 |
| server    | 60.8 / 64.48 / 64.81 / 61.49                             | `src/modules/**/schemas/**` (statements 100, branches 100, functions 100, lines 100); `src/utils/constants/**` (statements 100, branches 100, functions 100, lines 100); `src/utils/pagination/**` (statements 100, branches 100, functions 100, lines 100)                                                             | 0 enforced / 57 exempt |          0 |

<!-- coverage-floor-ratchet:end -->

Los 55 archivos de los nueve módulos de negocio y los dos archivos de crypto están exentos con responsable y
vencimiento explícitos; no representan un piso de 0% ni una aprobación silenciosa. Los floors medidos se aplican
cuando una ruta se declara `enforced`.

La lista `criticalRoots` de `.coverage-critical-paths.json` delimita los directorios críticos: cada archivo fuente nuevo
bajo uno de ellos debe añadirse a `paths` como `enforced` (con sus cuatro floors numéricos en Vitest) o como `exempt`
(con motivo, responsable y vencimiento futuro). El validador falla si queda un archivo sin declarar o un floor exacto
sin entrada de política.

> **Los valores no se escriben a mano.** Los fija `npm run coverage:ratchet` a la cobertura medida (ver §5.7);
> el baseline detecta bajadas manuales.
> Si quieres endurecer un área, primero añade los tests y luego ratchetea.
>
> **El guard tiene que ver lo que Vitest ve.** `scripts/ci/check-coverage.mjs` replica estas reglas porque, si solo
> mirase el total, podría imprimir `✅` mientras Vitest falla la corrida. Además normaliza las claves de
> `coverage-summary.json` — que son rutas **absolutas** del SO, con backslashes en Windows — a rutas relativas al
> workspace con `/`. Sin esa normalización los globs no casarían en Windows y la granularidad sería verde en Linux y
> vacía en Windows: el peor fallo posible para un gate, porque parece funcionar.

---

## 4. Tensión con TIA (Test Impact Analysis): La Regla del Subset

### 4.1 El problema

> **Extracto del `pending.txt` (notas de investigación del proyecto):**
>
> _El coverage ratchet asume que `vitest run --coverage` corre toda la suite y mide cobertura sobre
> el codebase completo. Si TIA solo corre un subconjunto de tests, el reporte de cobertura mostrará
> un número artificialmente bajo, porque c8 solo ve las líneas tocadas por los tests que
> efectivamente corrieron — el resto aparece como "no cubierto" aunque tenga tests que simplemente
> no se ejecutaron._
>
> _Peor: si el `autoUpdate` del ratchet llegara a correr sobre ese subconjunto, bajaría el piso
> incorrectamente, perdiendo la garantía de "el piso nunca baja"._

### 4.2 La solución: Jobs separados

**TIA y el coverage gate viven en jobs separados, con propósitos distintos:**

| Job                                   | Propósito                                 | Corre coverage?                  | Tripwire evalúa?                            |
| ------------------------------------- | ----------------------------------------- | -------------------------------- | ------------------------------------------- |
| `test-unit-*` (TIA)                   | Feedback rápido: ¿rompiste algo?          | Sí (artifact; puede ser parcial) | **NO** — difiere el umbral en modo advisory |
| `client-coverage` / `server-coverage` | Merge de artifacts del lane TIA           | Consume coverage de los tests    | Solo si scope=full; D18 advisory si parcial |
| `coverage-full-gate`                  | Veredicto bloqueante de suite completa PR | Ejecuta ambas suites completas   | **SÍ** — aplica floors y critical paths     |
| `coverage-floor-guard`                | Integridad del ratchet versionado         | No                               | **SÍ** — rechaza bajadas sin excepción      |

### 4.3 Implementación en CI — lane TIA separado del gate full-suite

> **Estado actual (2026-10-30):** el lane TIA (`test-unit-client`/`test-unit-server` +
> `client-coverage`/`server-coverage`) mantiene D18: si el scope es diff-scoped, el guard se invoca con
> `--advisory` y difiere floors; un scope completo evalúa floors normalmente. El nuevo `coverage-full-gate`
> ejecuta la suite completa de client y server en cada PR y evalúa el guard en modo estricto, sin depender
> del scope ni de los artifacts TIA. `coverage-floor-guard` valida por separado que los thresholds versionados
> no bajen sin excepción auditable. Los dos jobs nuevos son miembros bloqueantes de
> `prebuild-tests-complete`; no se modifican los `continue-on-error` existentes.

```yaml
# .github/workflows/ci.yml — test-unit-server (TIA, diff-scoped) — FASE 1 advisory
- name: Run Unit Tests (Server)
  run: npm run test:changed:ci --workspaces --if-present

# .github/workflows/ci.yml — server-coverage (tripwire, full suite) — FASE 1 advisory
- name: Check Coverage (Server)
  run: node scripts/ci/check-coverage.mjs server
  if: always() # runs after test-unit-server, evaluates artifact from FULL suite
```

**Regla D18 (`docs/learning/unit-tests-enterprise.md` §2.2):**

> El tripwire de thresholds SOLO evalúa cobertura de suite completa; la corrida TIA no lo alimenta.

**Enforcement:** `coverage-full-gate` evalúa una corrida completa en cada PR. El workflow nocturno
(`nightly-full-suite.yml`) también aplica el mismo guard en modo estricto; un floor roto deja el run rojo.

---

## 5. Cómo Implementar el Coverage Tripwire (Floor Ratchet)

### 5.1 Paso 1: Instalar el provider

```bash
npm install --save-dev @vitest/coverage-v8
```

> ✅ Ya instalado en este proyecto (`apps/server/package.json`, `apps/client/package.json`).

### 5.2 Paso 2: Configurar thresholds en vitest

```js
// apps/server/vitest.config.js (ejemplo completo)
import { defineConfig, mergeConfig } from 'vitest/config';
import sharedConfig from '../../vitest.shared.js';
import seedDb from './tests/setupGlobal.js';

export default defineConfig(
  mergeConfig(sharedConfig, {
    test: {
      root: __dirname,
      environment: 'node',
      pool: 'forks',
      globalSetup: [seedDb],
      // ... otros settings ...
      coverage: {
        reportsDirectory: './tests/coverage',
        thresholds: {
          // → NEVER autoUpdate: true in CI
          // → Manual ratchet: bump these in PRs that improve coverage
          statements: 39,
          branches: 18,
          functions: 7,
          lines: 39,
        },
      },
      setupFiles: ['./tests/setupTest.js'],
      include: [
        'src/**/*.unit.test.js',
        'tests/**/*.unit.test.js',
        'tests/integration/**/*.integration.test.js',
      ],
    },
  })
);
```

### 5.3 Paso 3: Guard ejecutable (`check-coverage.mjs`)

El proyecto ya tiene `scripts/ci/check-coverage.mjs` que:

1. Lee los thresholds **del propio `vitest.config.js`** (single source of truth)
2. Lee `coverage/coverage-summary.json` (`total` block)
3. Exita 1 si baja del piso

```js
// Patrón simplificado de scripts/ci/check-coverage.mjs
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';

const workspace = process.argv[2]; // 'server' | 'client'
const configPath = resolve(
  workspace === 'server'
    ? 'apps/server/vitest.config.js'
    : 'apps/client/vitest.config.js'
);
const summaryPath = resolve(
  workspace === 'server'
    ? 'apps/server/tests/coverage/coverage-summary.json'
    : 'apps/client/coverage/coverage-summary.json'
);

// ... leer config y summary, comparar thresholds ...
// exit(1) si algún métrico baja del piso
```

### 5.4 Paso 4: Jobs de CI — baseline + suite completa bloqueantes

```yaml
# .github/workflows/ci.yml — independientes del scope TIA; ambos bloquean vía el agregador
coverage-floor-guard:
  steps:
    - run: npm run coverage:baseline:check

coverage-full-gate:
  steps:
    - run: npm run test:coverage:ci --workspace=apps/client
    - run: npm run test:coverage:unit:ci --workspace=apps/server
    - run: node scripts/ci/check-coverage.mjs apps/client apps/client/coverage
    - run: node scripts/ci/check-coverage.mjs apps/server apps/server/tests/coverage
```

Los dos jobs nuevos no dependen de los jobs TIA: corren en cada PR y están añadidos directamente a
`prebuild-tests-complete.needs`. Así un skip o un reporte parcial del lane TIA no puede convertirse en la única
fuente del veredicto completo.

### 5.5 Implementación LOCAL — el tripwire en el tier del developer

El tripwire no vive solo en CI: `.husky/pre-push` corre `test:changed` **sin** `--coverage` y `pre-commit` no
menciona coverage. Para evaluar los floors antes de subir existe el comando local explícito `coverage:check`, espejo
del nuevo gate bloqueante de suite completa en CI.

Ahora hay dos comandos en la raíz del repo:

```bash
npm run coverage:check     # suite completa + guard, en ambos workspaces
npm run coverage:check -- client   # solo uno
npm run coverage:ratchet   # sube los pisos a la cobertura medida
```

`coverage:check` corre la **suite completa** (no TIA) y después invoca el **mismo** `check-coverage.mjs` que usan los
jobs de CI, contra los mismos `reportsDirectory` por workspace. Mismo código, mismos umbrales, mismo veredicto.

Cuesta poco porque las suites son pequeñas (client ~11s, server ~6s con el stack de cache caliente), así que la
suite completa es accesible en cada push sin degradar nada.

**Por qué no se engancha a `pre-push`.** El hook corre TIA diff-scoped. Bajo D18 un reporte parcial no es comparable a
los umbrales globales, así que atar el gate ahí produciría un falso verde — justo lo que D18 existe para evitar. El
tier local es el comando explícito, no el hook.

**Requisitos del tier local.** El workspace `server` incluye tests de **integration**, que necesitan Postgres.
`globalSetup` lo detecta y hace seed desde `apps/server/.env.test`; si `DATABASE_URL` no apunta a una base migrada,
los tests de integration fallan (HTTP 500) y `coverage:check` no puede evaluar umbrales. Con la base levantada, la
suite completa pasa.

### 5.6 Paridad local ↔ CI

| Qué                               | Job de CI                                                  | Equivalente local                                 | Paridad                               |
| --------------------------------- | ---------------------------------------------------------- | ------------------------------------------------- | ------------------------------------- |
| Suite completa + coverage         | `coverage-full-gate` (client full + server unit full)      | `npm run coverage:check`                          | ✅ mismos scripts y rutas de report   |
| Veredicto de umbrales             | `coverage-full-gate` → `check-coverage.mjs` estricto       | dentro de `coverage:check`                        | ✅ mismo guard, floors y exit code    |
| Integridad del ratchet            | `coverage-floor-guard` → `coverage:baseline:check`         | `npm run coverage:baseline:check`                 | ✅ mismo script y baseline versionado |
| Umbrales (fuente única)           | `apps/*/vitest.config.*` + `.coverage-critical-paths.json` | mismos ficheros                                   | ✅ sin duplicar números               |
| Artefacto + `dorny/test-reporter` | artifacts de la corrida                                    | ✗ no hay equivalente                              | ❌ solo CI                            |
| TIA diff-scoped                   | `test-unit-*` + lane coverage con `--advisory`             | `npm run test:changed` (pre-push)                 | ⚠️ no evalúa pisos globales (D18)     |
| `autoUpdate` (ratchet)            | prohibido en CI                                            | `npm run coverage:ratchet`                        | ❌ deliberadamente distinto           |
| Reporte HTML / texto              | artifacts / logs                                           | `apps/*/coverage/`, `apps/server/tests/coverage/` | ✅ se generan localmente              |

**Lo que un developer NO puede reproducir localmente:** el artefacto de JUnit, `dorny/test-reporter`, y la ejecución
en el runner de GitHub. Todo lo demás tiene equivalente.

### 5.7 Ratchet — subir el piso (local, nunca en CI)

`npm run coverage:ratchet` corre la suite completa con `--coverage.thresholds.autoUpdate` y luego lee el diff del
config para decir qué umbral se movió y de qué valor a qué valor.

- **Solo sube.** Vitest reescribe un umbral únicamente cuando la cobertura actual lo supera, así que la garantía de
  "el piso nunca baja" viene de la herramienta, no de nuestro código.
- **Nunca en CI.** Ningún workflow pasa ese flag; la spec `ci-test-jobs-activation` ya lo prohíbe.
- **Flujo correcto:** escribes tests → `coverage:check` verde → `coverage:ratchet` → revisas el diff del config →
  commit de tests + config juntos.
- **Flujo incorrecto:** bajar un umbral a mano para dejar el CI en verde. Eso deshace el ratchet.

> **Trampa de configuración (costó una implementación):** el `autoUpdate` de Vitest reescribe el config con
> `magicast` y **solo reconoce tres formas**: `export default {test:{}}`, `defineConfig({...})` y
> `mergeConfig(..., defineConfig({...}))`. Este repo tenía `defineConfig(mergeConfig(shared, {...}))`, que lanza
> `Failed to update coverage thresholds. Configuration file is too complex.` Invertir el orden a
> `mergeConfig(shared, defineConfig({...}))` lo arregla. `vitest.smoke.config.js` ya usaba la forma correcta.

---

## 6. Mejores Prácticas del Floor Ratchet

### 6.1 Floor bajo, granularidad alta

| Estrategia                            | Implementación                                                      |
| ------------------------------------- | ------------------------------------------------------------------- |
| ✅ **Floor bajo global**              | Atrapa abandono catastrófico sin ser ruidoso                        |
| ✅ **Granularidad por área**          | Glob thresholds + `perFile` en lo crítico (§3.3)                    |
| ✅ **Ratchet explícito en local**     | `npm run coverage:ratchet` (§5.7)                                   |
| ✅ **Un solo guard para CI y local**  | El veredicto no depende de quién pregunta                           |
| ❌ **Floor alto global** (ej. 90%)    | Ruidoso; genera tests triviales para subir el %                     |
| ❌ **`autoUpdate` en CI**             | Podría bajar el piso sobre un subset TIA (D18)                      |
| ❌ **Gate de coverage en `pre-push`** | El hook corre TIA; un umbral global sobre un parcial da falso verde |
| ❌ **Bajar un umbral a mano**         | Deshace el ratchet; a un rojo se responde con tests                 |

### 6.2 No confundir coverage con calidad

| Práctica                                     | Justificación                                                  |
| -------------------------------------------- | -------------------------------------------------------------- |
| ✅ **Usar AAA ratio como métrica de salud**  | ~1:1:1 es sano; >80% Arrange indica over-mocking               |
| ✅ **Property-based testing** (`fast-check`) | Para invariantes en parsers, sanitizers, state machines        |
| ✅ **Mutation testing** en módulos críticos  | Detecta tests superficiales que suben coverage de mentira      |
| ❌ **Coverage como target único**            | Tests triviales (`assert(result)`) suben el % sin validar nada |

### 6.3 Integración con Test Impact Analysis (TIA)

| Regla                                                    | Acción                                                                         |
| -------------------------------------------------------- | ------------------------------------------------------------------------------ |
| ✅ **TIA y coverage en jobs separados**                  | `test-unit-*` (diff-scoped) + `client-coverage`/`server-coverage` (full suite) |
| ✅ **Diffiere el tripwire en corridas diff-scoped**      | D18: `check-coverage.mjs` solo evalúa artifacts de full suite                  |
| ✅ **Upload coverage artifact siempre** (`if: always()`) | Los runs que más necesitan coverage son los que fallan                         |
| ✅ **Nightly full suite como red de seguridad**          | `nightly-full-suite.yml` detecta drift del diff-scoped                         |

### 6.4 Sharding + Coverage Merge Gate

Cuando se use sharding (`--shard=N/M`), **requiere**:

1. **`--reporter=blob`** en cada shard
2. **Job `merge-reports`** que descargue todos los artifacts
3. **`coverage-merge-gate`** obligatorio antes de evaluar thresholds
4. **Verificar artifact de cada shard presente** — exit 1 si falta alguno (nunca evaluar un merge parcial)

```yaml
# §23.6 del ci-cd-pipeline-empresarial.md
coverage-merge-gate:
  needs: [test-shard-1, test-shard-2, test-shard-3]
  runs-on: ubuntu-latest
  steps:
    - uses: actions/download-artifact@v4
      with: { name: coverage-shard, path: coverage-shards/ }
    # ... merge + check-coverage ...
```

> **Sin sharding, no aplica.** El `--shard` parte archivos (no casos), determinista por hash SHA-1 del path.

---

## 7. Herramientas Alternativas

| Herramienta                         | Tipo         | Ventajas                                            | Cuándo usarla                       |
| ----------------------------------- | ------------ | --------------------------------------------------- | ----------------------------------- |
| **Codecov**                         | SaaS         | Comentarios en PR, trend graphs, integración GitHub | Equipo con presupuesto para SaaS    |
| **Coveralls**                       | SaaS         | Similar a Codecov, más antiguo                      | Legacy projects                     |
| **SonarQube**                       | On-prem/SaaS | New-code coverage, quality gates, análisis estático | Gate autoritativo post-deploy (§5)  |
| **Coveralls + GitHub Actions**      | Hybrid       | Gratuito para OSS, reporte visual                   | Proyectos open-source               |
| **c8 directamente** (no via Vitest) | CLI tool     | Simple, standalone                                  | Scripts de build que no usan Vitest |

### 7.1 Recomendación del proyecto

- ✅ **Tripwire en CI:** `coverage-full-gate` aplica floors en suite completa; el lane TIA conserva D18
- ✅ **Tripwire local:** `npm run coverage:check`, mismo guard y mismos umbrales (§5.5)
- ✅ **Ratchet local:** `npm run coverage:ratchet`, solo sube (§5.7)
- ⏳ **Quality gate autoritativo:** SonarQube new-code ≥80% en STAGE 4 (inactivo, pendiente token)
- 🆓 **Reportes visuales:** Codecov gratis para OSS, o `coverage/index.html` local + upload como artifact

---

## 8. Checklist de Implementación

| #   | Task                                      | Estado | Archivo                                                 |
| --- | ----------------------------------------- | ------ | ------------------------------------------------------- |
| 1   | Instalar `@vitest/coverage-v8`            | ✅     | `package.json`                                          |
| 2   | Configurar `coverage.provider: 'v8'`      | ✅     | `vitest.shared.js`                                      |
| 3   | Configurar `coverage.thresholds` (floor)  | ✅     | `apps/*/vitest.config.js`                               |
| 4   | Configurar `coverage.include` explícito   | ✅     | `vitest.config.js` (Vitest 4 eliminó `coverage.all`)    |
| 5   | `autoUpdate: false` en CI                 | ✅     | thresholds config                                       |
| 6   | Guard ejecutable `check-coverage.mjs`     | ✅     | `scripts/ci/check-coverage.mjs`                         |
| 7   | Gate CI de suite completa + baseline      | ✅     | `ci.yml` (`coverage-full-gate`, `coverage-floor-guard`) |
| 8   | TIA y coverage en jobs separados          | ✅     | `ci.yml`                                                |
| 9   | Upload coverage artifact (`if: always()`) | ✅     | `ci.yml`                                                |
| 10  | Nightly full suite (red de seguridad)     | ✅     | `nightly-full-suite.yml`                                |
| 11  | `perFile` + glob thresholds               | ✅     | `apps/*/vitest.config.js` + guard (§3.3)                |
| 12  | Tier local `coverage:check` (paridad CI)  | ✅     | `scripts/ci/coverage-check.mjs`                         |
| 13  | Ratchet local `coverage:ratchet`          | ✅     | `scripts/ci/coverage-ratchet.mjs`                       |
| 14  | Config en forma reescribible por magicast | ✅     | `mergeConfig(shared, defineConfig({...}))` (§5.7)       |
| 15  | SonarQube quality gate (new-code ≥80%)    | ❌     | `if: false`, sin `SONAR_TOKEN`                          |
| 16  | Coverage merge gate (sharding)            | ❌     | N/A (sin sharding; suites de 6-14s)                     |
| 17  | Codecov/coveralls integration             | ❌     | N/A                                                     |

> **Nota de estado:** el lane TIA mantiene su veredicto advisory para reportes parciales; el gate independiente de suite
> completa y el baseline ratchet son bloqueantes mediante `prebuild-tests-complete`. No se alteró ningún
> `continue-on-error` preexistente.

---

## 9. Referencias

**Documentación oficial (verificada):**

- [Vitest Coverage Guide](https://vitest.dev/guide/coverage.html) — providers v8 vs istanbul, reporters, ignore hints
- [Vitest Coverage Config](https://vitest.dev/config/coverage) — `thresholds`, `autoUpdate`, `perFile`, globs, `include`/`exclude`
- [Vitest CLI](https://vitest.dev/guide/cli) — `--coverage`, `--changed`, `--shard`, `--merge-reports`
- [Vitest Improving Performance](https://vitest.dev/guide/improving-performance) — sharding, blob reporter, merge-reports
- [AST v8 to istanbul limitations](https://github.com/vitest-dev/vitest/blob/main/vitest/node/src/node/sequencers/BaseSequencer.ts)

**Artículos de la comunidad (consultados 2026-10-05):**

- [QASkills — Vitest Coverage 2026: v8 vs Istanbul, Thresholds & Reporters](https://qaskills.sh/blog/vitest-coverage-v8-istanbul-guide-2026)
- [Nerd Level Tech — Vitest Coverage Thresholds: Fail CI on Low Coverage](https://nerdleveltech.com/vitest-coverage-thresholds-fail-ci-tutorial)
- [Gaffer.sh — Vitest Coverage Reports: CI Setup and Team Visibility](https://gaffer.sh/blog/vitest-coverage-reports/)
- [JavaScript Testing — Defining Coverage Thresholds in Vitest & Jest](https://www.javascript-testing.com/modern-javascript-test-strategy-pyramid-design/defining-coverage-thresholds/)

**Proyecto (verificado en el repo):**

- `docs/ci-cd-pipeline-empresarial.md` — §23.3 (diagrama STAGE 2), §23.6 (Coverage Merge Gate), §L520 (tripwire)
- `docs/testing-architecture.md` — §4 (seeding), §6 (principios), §9 (mocks/anti-patrones),
  §16 (coverage targets), §18 (cross-platform)
- `docs/learning/unit-tests-enterprise.md` — §2.2 (coverage tripwire), §2.3 (TIA),
  §2.6 (coverage merge gate), §2.7 (CI jobs)
- `pending.txt` — tensión entre TIA y floor ratchet (notas de investigación)
- `vitest.shared.js`, `apps/{server,client}/vitest.config.js`, `scripts/ci/check-coverage.mjs`, `.github/workflows/ci.yml`

---

## 10. Glosario

| Término                        | Definición                                                                                      |
| ------------------------------ | ----------------------------------------------------------------------------------------------- |
| **Coverage Tripwire**          | Umbral mínimo de cobertura que falla el build al ser violado; atrapar regresiones catastróficas |
| **Floor Ratchet**              | Patrón donde el umbral solo puede subir, nunca bajar                                            |
| **autoUpdate**                 | Feature de Vitest que reescribe thresholds al subir la cobertura; **nunca en CI**               |
| **TIA (Test Impact Analysis)** | Técnica de ejecutar solo tests afectados por un diff; usa `--changed origin/main`               |
| **Per-file thresholds**        | `perFile: true` — cada archivo debe cumplir el mínimo, no solo el aggregate                     |
| **Coverage Merge Gate**        | Job que fusiona artifacts de shards antes de evaluar el tripwire; **obligatorio con sharding**  |
| **New-code coverage**          | Métrica de SonarQube sobre código nuevo/modificado; el quality gate autoritativo                |
| **Blob reporter**              | Formato de reporte que guarda resultados por shard para merge posterior                         |
| **passWithNoTests**            | Default de Vitest 4: exit 0 aunque no haya tests; **requiere guard** para diferir a full suite  |
