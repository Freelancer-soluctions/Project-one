# Coverage Tripwire & Floor Ratchet — Estrategia Profesional con Vitest/c8

> **Fecha:** 2026-10-05
> **Alcance:** Implementación del patrón _Coverage Tripwire (Floor Ratchet)_ usando Vitest + c8/V8 en este monorepo.
> **Fuentes consultadas:** Documentación oficial Vitest v4, artículos de la comunidad (QASkills, Nerd Level Tech, Gaffer.sh, Javascript-Testing.com), y la arquitectura CI/CD ya establecida en `docs/ci-cd-pipeline-empresarial.md` y `docs/learning/unit-tests-enterprise.md`.

---

## 1. Introducción: ¿Qué es un Coverage Tripwire?

Un **coverage tripwire** (o _coverage floor_) es un umbral mínimo de cobertura de código que, al ser violado, **falla el build**. Su propósito es atrapar regresiones catastróficas — un módulo nuevo con 0 tests, un refactor que elimina tests — , **no certificar calidad**. Es un _smoke detector_, no un _fireproof_.

Un **floor ratchet** (o simplemente _ratchet_) es una variante del tripwire donde el umbral solo puede **subir**, nunca bajar. Cada vez que la cobertura mejora, el piso se ajusta automáticamente (o manualmente) al nuevo nivel, asegurando que nunca retroceda.

### Diferencia clave: Tripwire vs Quality Gate

| Concepto                      | Cobertura mínima          | Propósito                           | Ubicación en el pipeline |
| ----------------------------- | ------------------------- | ----------------------------------- | ------------------------ |
| **Coverage Tripwire**         | Piso absoluto (ej. 60%)   | Atrapar abandono catastrófico       | PRE-BUILD (local + CI)   |
| **Quality Gate autoritativo** | New-code ≥80% (SonarQube) | Certificar calidad del código nuevo | STAGE 4 post-deploy      |

> **Veredicto del proyecto:** El tripwire es el **único guard bloqueante** de cobertura hoy (`scripts/ci/check-coverage.mjs`). El quality gate autoritativo (SonarQube new-code) está inactivo (`if: false`, sin `SONAR_TOKEN`). Ver §5.

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

> **Nota:** Los valores del server son bajos intencionalmente. El coverage global puede ser bajo por módulos NORMAL sin que falle CI — la métrica real se valida por módulo en code review (§16.1 de `testing-architecture.md`).

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

### 3.3 Thresholds por glob y perFile (pendiente)

Vitest 4 permite granularidad avanzada — **no implementado todavía**:

```js
// Patrón recomendado futuro
coverage: {
  include: ['src/**/*.{ts,tsx}'],
  thresholds: {
    // Floor global
    lines: 80,
    functions: 80,
    branches: 75,
    statements: 80,
    // Critical paths — barra exigente
    'src/critical/**': {
      lines: 95,
      functions: 95,
      branches: 90,
      statements: 95,
      perFile: true, // cada archivo cumple el mínimo, no solo el aggregate
    },
  },
},
```

---

## 4. Tensión con TIA (Test Impact Analysis): La Regla del Subset

### 4.1 El problema

> **Extracto del `pending.txt` (notas de investigación del proyecto):**
>
> _El coverage ratchet asume que `vitest run --coverage` corre toda la suite y mide cobertura sobre el codebase completo. Si TIA solo corre un subconjunto de tests, el reporte de cobertura mostrará un número artificialmente bajo, porque c8 solo ve las líneas tocadas por los tests que efectivamente corrieron — el resto aparece como "no cubierto" aunque tenga tests que simplemente no se ejecutaron._
>
> _Peor: si el `autoUpdate` del ratchet llegara a correr sobre ese subconjunto, bajaría el piso incorrectamente, perdiendo la garantía de "el piso nunca baja"._

### 4.2 La solución: Jobs separados

**TIA y el coverage gate viven en jobs separados, con propósitos distintos:**

| Job                                   | Propósito                        | Corre coverage?             | Tripwire evalúa?               |
| ------------------------------------- | -------------------------------- | --------------------------- | ------------------------------ |
| `test-unit-*` (TIA)                   | Feedback rápido: ¿rompiste algo? | Sí (artifact)               | **NO** — difiere el umbral     |
| `client-coverage` / `server-coverage` | Gate de merge: ¿cumple el piso?  | Sí (mergeado si hay shards) | **SÍ** — solo sobre full suite |

### 4.3 Implementación en CI (ya implementada)

```yaml
# .github/workflows/ci.yml — test-unit-server (TIA, diff-scoped)
- name: Run Unit Tests (Server)
  run: npm run test:changed:ci --workspaces --if-present

# .github/workflows/ci.yml — server-coverage (tripwire, full suite)
- name: Check Coverage (Server)
  run: node scripts/ci/check-coverage.mjs server
  if: always() # runs after test-unit-server, evaluates artifact from FULL suite
```

**Regla D18 (`docs/learning/unit-tests-enterprise.md` §2.2):**

> El tripwire de thresholds SOLO evalúa cobertura de suite completa; la corrida TIA no lo alimenta.

**Red de seguridad:** Si TIA corre sobre un subset y el coverage job difiere, los PRs `shared` y el nocturno (`nightly-full-suite.yml`) cubren la suite completa y actualizan el tripwire real.

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

### 5.4 Paso 4: Job de CI

```yaml
# .github/workflows/ci.yml
client-coverage:
  needs: test-unit-client
  runs-on: ubuntu-latest
  # ...
  steps:
    - uses: actions/checkout@v4
      with: { fetch-depth: 0 }
    - uses: actions/setup-node@v4
      with: { node-version: 20, cache: npm }
    - run: npm ci
    - run: npm run test:coverage --workspace=apps/client
    - name: Check Coverage Floor
      run: node scripts/ci/check-coverage.mjs client
```

---

## 6. Mejores Prácticas del Floor Ratchet

### 6.1 Floor bajo, granularidad alta

| Estrategia                                   | Implementación                                       |
| -------------------------------------------- | ---------------------------------------------------- |
| ✅ **Floor bajo global** (ej. 50%)           | Atrapa abandono catastrófico sin ser ruidoso         |
| ✅ **Per-file thresholds** en código crítico | `perFile: true` + glob thresholds (§16.1)            |
| ✅ **Ratchet manual en PRs**                 | Subir el piso cuando la cobertura mejore             |
| ❌ **Floor alto global** (ej. 90%)           | Ruidoso, genera tests triviales solo para subir el % |
| ❌ **`autoUpdate` en CI**                    | El ratchet puede bajar el piso sobre un subset TIA   |

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

- ✅ **Tripwire local:** Vitest `coverage.thresholds` + `check-coverage.mjs` (ya implementado)
- ⏳ **Quality gate autoritativo:** SonarQube new-code ≥80% en STAGE 4 (inactivo, pendiente token)
- 🆓 **Reportes visuales:** Codecov gratis para OSS, o `coverage/index.html` local + upload como artifact

---

## 8. Checklist de Implementación

| #   | Task                                       | Estado | Archivo                                              |
| --- | ------------------------------------------ | ------ | ---------------------------------------------------- |
| 1   | Instalar `@vitest/coverage-v8`             | ✅     | `package.json`                                       |
| 2   | Configurar `coverage.provider: 'v8'`       | ✅     | `vitest.shared.js`                                   |
| 3   | Configurar `coverage.thresholds` (floor)   | ✅     | `apps/*/vitest.config.js`                            |
| 4   | Configurar `coverage.include` explícito    | ✅     | `vitest.config.js` (Vitest 4 eliminó `coverage.all`) |
| 5   | `autoUpdate: false` en CI                  | ✅     | thresholds config                                    |
| 6   | Guard ejecutable `check-coverage.mjs`      | ✅     | `scripts/ci/check-coverage.mjs`                      |
| 7   | Job CI `client-coverage`/`server-coverage` | ✅     | `.github/workflows/ci.yml`                           |
| 8   | TIA y coverage en jobs separados           | ✅     | `ci.yml`                                             |
| 9   | Upload coverage artifact (`if: always()`)  | ✅     | `ci.yml`                                             |
| 10  | Nightly full suite (red de seguridad)      | ✅     | `nightly-full-suite.yml`                             |
| 11  | `perFile` + glob thresholds                | ❌     | N/A                                                  |
| 12  | SonarQube quality gate (new-code ≥80%)     | ❌     | `if: false`, sin `SONAR_TOKEN`                       |
| 13  | Coverage merge gate (sharding)             | ❌     | N/A (sin sharding)                                   |
| 14  | Codecov/coveralls integration              | ❌     | N/A                                                  |

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
- `docs/testing-architecture.md` — §4 (seeding), §6 (principios), §9 (mocks/anti-patrones), §16 (coverage targets), §18 (cross-platform)
- `docs/learning/unit-tests-enterprise.md` — §2.2 (coverage tripwire), §2.3 (TIA), §2.6 (coverage merge gate), §2.7 (CI jobs)
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
