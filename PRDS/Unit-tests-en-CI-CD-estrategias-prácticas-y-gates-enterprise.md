# Unit tests en CI/CD — estrategias, prácticas y gates enterprise

Oct 27, 2026 · @Johan

## Resumen

En un pipeline enterprise los unit tests son la capa base y más barata: corren en cada PR, deben ser rápidos y deterministas, y se exigen con pocos gates bien elegidos (todos pasan, cobertura sobre el código nuevo, ningún test saltado o enfocado) y no con un número global de cobertura.

Lo que dicen las fuentes consultadas:

- **Rol.** AWS sitúa los unit tests en la base de la pirámide, como los más rápidos y baratos, con una regla práctica de cerca del 70% de los tests y cobertura casi completa en esta capa.
- **Diseño.** Prueban el comportamiento observable de una unidad pequeña, con dobles solo donde hay lentitud o no determinismo: servicios remotos, tiempo, disco.
- **CI.** Corren primero y en paralelo (sharding), con reporte JUnit y cobertura combinada; los umbrales se evalúan sobre el reporte combinado, no por shard.
- **Gates.** Sonar way, el gate por defecto de SonarQube, exige 80% o más de cobertura en código nuevo; se apoya en tests en verde y, de forma opcional, en mutation testing sobre lógica crítica.
- **GitHub.** Un check requerido que se salta por filtros de path queda en Pending y bloquea el merge; con merge queue los workflows deben escuchar `merge_group`.

Las secciones siguientes desarrollan cada punto y la última lo aplica a tu pipeline. Lo que no pude verificar en una fuente abierta está marcado como tal.

## Rol del unit test en la estrategia de testing

Todas las fuentes coinciden en que el unit test es la base: muchos, pequeños, rápidos y al principio del pipeline.

| Fuente                                                                                                                                                                                                       | Qué establece                                                                                                                                                                                                                                                                           | Implicación en el pipeline                                                      |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| [AWS Prescriptive Guidance](https://docs.aws.amazon.com/prescriptive-guidance/latest/strategy-cicd-litmus/tests-for-cicd-pipelines.html)                                                                     | Construyen y ejecutan el código simulando las dependencias externas. Mínimo recomendado: unit tests y SAST sobre el código, más integración y aceptación en un entorno de pruebas                                                                                                       | Gate base del stage de build; los de integración van después, contra un entorno |
| [AWS Whitepaper, testing stages](https://docs.aws.amazon.com/whitepapers/latest/practicing-continuous-integration-continuous-delivery/testing-stages-in-continuous-integration-and-continuous-delivery.html) | Base de la pirámide, los más rápidos y baratos; los escriben los desarrolladores; regla práctica de \~70% de los tests; cobertura casi completa; corren en el build stage junto con análisis estático y cobertura                                                                       | La mayoría de los tests vive aquí y la cobertura se mide en esta capa           |
| [Fowler, Unit Test](https://martinfowler.com/bliki/UnitTest.html)                                                                                                                                            | El término está mal definido y cada equipo decide qué es una unidad. Solitarios (con dobles) frente a sociables (colaboradores reales). Deben ser lo bastante rápidos para correrlos tras cada cambio; regla de Beck: suite de commit de 10 minutos como máximo, sin respuesta absoluta | Presupuesto de tiempo del job y una decisión explícita sobre dobles             |
| [Fowler, Practical Test Pyramid](https://martinfowler.com/articles/practical-test-pyramid.html)                                                                                                              | Las etapas del pipeline se organizan por velocidad y alcance, no por tipo de test; los rápidos van en etapas tempranas                                                                                                                                                                  | Orden: lint y unit antes de integración y E2E                                   |

La marca \[SL\] de tu nota (shift-left) implica que el mismo test corre primero en local, como feedback, y se repite en CI, como enforcement. El hook local nunca sustituye al job de CI, porque se puede saltar con `--no-verify`.

## Buenas prácticas de diseño con Vitest y Jest

Un unit test profesional prueba comportamiento observable, es determinista y no toca recursos reales.

| Práctica                                                                                                                                   | Fuente                                                              | En Vitest / Jest                                                                                                                            |
| ------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Probar la interfaz pública y el comportamiento, no la implementación; no testear métodos privados (si hace falta, la clase hace demasiado) | Practical Test Pyramid                                              | Un archivo de test por módulo; aserciones sobre salidas, no sobre llamadas internas                                                         |
| Estructura Arrange-Act-Assert (Given-When-Then)                                                                                            | Practical Test Pyramid                                              | `describe` por unidad, un `it` por comportamiento                                                                                           |
| Dobles solo en las fronteras (servicios remotos, tiempo, disco) y colaboradores reales donde den confianza                                 | Fowler, Unit Test y Practical Test Pyramid                          | `vi.mock` y `vi.useFakeTimers` en Vitest; `jest.mock` y `jest.useFakeTimers` en Jest (APIs conocidas, no verificadas en esta investigación) |
| Sin base de datos, filesystem ni HTTP reales en esta capa, para correr miles de tests en minutos                                           | Practical Test Pyramid                                              | Esos casos pasan a la capa de integración                                                                                                   |
| Eliminar el no determinismo: falta de aislamiento, asincronía, servicios remotos, tiempo, fugas de recursos                                | Fowler, Eradicating Non-Determinism (según su resumen en el índice) | Jest `randomize` ordena los tests al azar dentro de cada archivo (por defecto desactivado) y destapa dependencias de orden                  |
| No testear código trivial; cubrir caminos no triviales y bordes                                                                            | Practical Test Pyramid                                              | Exclusiones de cobertura explícitas y versionadas, no por comentario suelto                                                                 |
| Importar los globals en vez de inyectarlos                                                                                                 | Jest, configuración                                                 | `injectGlobals: false` y `import { expect, test } from '@jest/globals'`                                                                     |

El artículo de la pirámide dice que no es importante decidir entre las escuelas clásica y mockista; lo práctico es dejar la elección escrita, para que los tests del repo sean coherentes entre sí.

## Dónde corren los unit tests

Los mismos tests corren en cuatro puntos; solo en CI bloquean.

&#91;embedded content: recorrido de los unit tests · 4 puntos, 3 gates en CI\]

El hook local da feedback rápido sobre lo cambiado; el PR y la merge queue exigen los gates, y main más el job nocturno vigilan mutation y flaky sin bloquear.

## Estrategias de ejecución en CI

La palanca principal es el sharding; las demás estrategias reducen tiempo o ruido sin perder señal.

| Estrategia       | Cómo se hace                                                                                                                                                                                                                                                                                       | Evidencia y cuidado                                                                                                                                                                                                                                                                                                                                      |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Sharding         | `vitest run --shard=i/N` en una matriz con `fail-fast: false`; blob reporter en cada shard; un job de merge con `if: always()` y `--merge-reports`                                                                                                                                                 | [Contentstack](https://developers.contentstack.com/blog/the-waiting-tax-on-every-pr-how-sharding-vitest-cut-ci-from-15-minutes-to-4-5): con 6 shards el tiempo total de unit tests bajó de \~14m47s a \~4m25s. Sube el consumo de runner-minutes; el divisor y la matriz deben coincidir; los umbrales de cobertura solo se aplican al reporte combinado |
| Solo lo afectado | Vitest `--changed [ref]` y `related <archivos> --run` ([CLI](https://next.tangled.org/vitest.dev/vitest/blob/v2/docs/guide/cli.md))                                                                                                                                                                | Útil en local y en PR; en merge queue y en main conviene la suite completa (propuesta)                                                                                                                                                                                                                                                                   |
| Falla rápida     | Jest `bail: n` detiene la corrida tras n fallos; por defecto corre todo y reporta al final ([Jest](https://jestjs.io/docs/zh-Hans/configuration))                                                                                                                                                  | Ahorra tiempo pero el autor ve un fallo a la vez                                                                                                                                                                                                                                                                                                         |
| Tests flaky      | Reintentar solo los conocidos como flaky; cuarentena (sigue corriendo sin romper el build) en vez de `skip`; detectar por fallo y éxito al reintentar sobre el mismo SHA; aplicar la cuarentena desde el CI sin esperar un merge ([RWX](https://rwx.com/blog/strategies-for-handling-flaky-tests)) | Fowler también recomienda cuarentena y luego corregir. `skip` equivale a borrar cobertura; etiquetar de flaky demasiado rápido deja pasar bugs reales                                                                                                                                                                                                    |
| Reportes         | JUnit para el historial; el reporter `github-actions` de Jest anota los archivos con el fallo                                                                                                                                                                                                      | Jest `reporters` acepta `jest-junit`; Vitest usa `--reporter=junit` junto con `--merge-reports`                                                                                                                                                                                                                                                          |

### Checks requeridos en GitHub

Tres reglas de [GitHub](https://docs.github.com/en/pull-requests/how-tos/merge-and-close-pull-requests/troubleshooting-required-status-checks) condicionan cómo se exige el job de unit tests:

- Un workflow con filtros de path, de rama o de mensaje de commit que no se ejecuta deja su check en **Pending** y bloquea el merge; no hay que requerir workflows que puedan saltarse.
- Un job saltado por una condición (`if`) reporta **success** y cumple el requisito.
- Un job que depende de otro que falló se salta y puede no bloquear; para evitarlo, el check requerido usa `always()` con `needs`.

Con [merge queue](https://docs.github.com/en/enterprise-server@3.19/repositories/configuring-branches-and-merges-in-your-repository/configuring-pull-request-merges/managing-a-merge-queue), los workflows que reportan checks requeridos deben incluir el trigger `merge_group`; sin él, el merge falla porque el check no se reporta.

## Gates típicos para unit tests

Los gates habituales son pocos; el de cobertura sobre código nuevo es el que trae por defecto Sonar way, y los demás lo complementan.

| Gate                                  | Umbral habitual                                                                                                        | Herramienta o fuente                                                                                                                                     | Fase sugerida                               |
| ------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------- |
| Tests en verde                        | 0 fallos                                                                                                               | Vitest o Jest, por código de salida                                                                                                                      | Bloqueante desde el día 1                   |
| Los tests realmente corrieron         | El job requerido no se salta y no hay 0 tests; agregador con `always()`                                                | Reglas de GitHub sobre checks saltados; Jest `passWithNoTests` (no verificado)                                                                           | Bloqueante                                  |
| Cobertura global mínima               | Ejemplo real: líneas 80, ramas 85, funciones 80, sentencias 80                                                         | Vitest [`coverage.thresholds`](https://vitest.dev/config/coverage); Jest `coverageThreshold.global`                                                      | Advisory 2 a 4 semanas, luego bloqueante    |
| Cobertura del código nuevo            | 80% o más en código nuevo (Sonar way)                                                                                  | [SonarQube](https://docs.sonarsource.com/sonarqube-server/10.8/instance-administration/analysis-functions/quality-gates/); herramientas de diff coverage | Bloqueante en PR                            |
| Umbral por archivo o módulo crítico   | Ejemplo de Jest: 100% en un módulo crítico, 90% de sentencias en los reducers                                          | Vitest `perFile` y globs; Jest umbrales por ruta                                                                                                         | Bloqueante solo en lo crítico               |
| Ratchet                               | El umbral solo sube                                                                                                    | Vitest `autoUpdate` reescribe los umbrales; aplicarlo mediante un PR revisado, no automático en CI (propuesta)                                           | Después de estabilizar                      |
| Mutation score                        | Ejemplo de OneUptime con Stryker: `break` 50, objetivo 80; incremental en PR, completo de noche                        | [Stryker](https://oneuptime.com/blog/post/2026-01-25-mutation-testing-with-stryker/view), fuente secundaria                                              | Advisory; bloqueante solo en lógica crítica |
| Sin `.only` ni `.skip` sin justificar | 0                                                                                                                      | Reglas de ESLint para Jest y Vitest (no verificado)                                                                                                      | Bloqueante                                  |
| Presupuesto de tiempo                 | Suite de commit de 10 minutos como máximo (regla de Beck citada por Fowler); `testTimeout` de 5000 ms por test en Jest | Duración del job (propuesta)                                                                                                                             | Alerta, no bloqueo                          |
| Flaky bajo control                    | Ningún test en cuarentena sin dueño ni fecha                                                                           | RWX y Fowler; el seguimiento es propuesta                                                                                                                | Revisión semanal                            |
| Quality gate agregado                 | Sonar way sobre código nuevo: 0 issues nuevos, 100% de hotspots revisados, cobertura 80% o más, duplicación 3% o menos | SonarQube                                                                                                                                                | Un solo check requerido                     |

Orden de adopción recomendado: tests en verde y tests que corrieron, luego cobertura del código nuevo, cobertura global, tests enfocados o saltados, umbrales por módulo crítico y, al final, mutation score.

## Configuración para CI enterprise

La configuración separa tres cosas: reporters distintos en shards y en el job de merge, umbrales solo en el reporte combinado, y un agregador que no se deje engañar por un shard caído. Los ejemplos son para adaptar y verificar con tu versión.

Vitest (opciones verificadas en la [documentación de coverage](https://vitest.dev/config/coverage)):

```ts
// vitest.config.ts
import { defineConfig } from 'vitest/config';

const isShard = process.env.VITEST_SHARD === 'true';

export default defineConfig({
  test: {
    reporters: isShard ? ['default', 'blob'] : ['default'],
    coverage: {
      provider: 'v8',
      include: ['src/**'],
      reporter: ['text-summary', 'lcov', 'json'],
      reportOnFailure: true,
      // Cada shard ve solo una parte del código: sin umbrales aquí.
      thresholds: isShard
        ? undefined
        : { lines: 80, branches: 85, functions: 80, statements: 80 },
    },
  },
});
```

Jest, con umbral global y uno más estricto para un módulo crítico (ejemplo de la [documentación](https://jestjs.io/docs/zh-Hans/configuration)):

```js
// jest.config.js
module.exports = {
  collectCoverageFrom: ['src/**/*.{js,ts}', '!**/node_modules/**'],
  coverageThreshold: {
    global: { branches: 80, functions: 80, lines: 80, statements: 80 },
    './src/billing/': {
      branches: 100,
      functions: 100,
      lines: 100,
      statements: 100,
    },
  },
  reporters: [
    'default',
    ['jest-junit', { outputDirectory: 'reports', outputName: 'report.xml' }],
  ],
};
```

Workflow de GitHub Actions con shards y merge (basado en el enfoque de Contentstack; los `<sha>` se sustituyen por el SHA de cada action):

```yaml
unit-tests:
  runs-on: ubuntu-latest
  strategy:
    fail-fast: false
    matrix:
      shard: [1, 2, 3, 4]
  steps:
    - uses: actions/checkout@<sha>
    - uses: actions/setup-node@<sha>
    - run: npm ci
    - run: VITEST_SHARD=true npx vitest run --coverage --shard=${{ matrix.shard }}/4
    - uses: actions/upload-artifact@<sha>
      with:
        name: vitest-blob-${{ matrix.shard }}
        path: .vitest-reports/*

unit-tests-merge:
  needs: [unit-tests]
  if: always()
  runs-on: ubuntu-latest
  steps:
    - run: test '${{ needs.unit-tests.result }}' = 'success'
    - uses: actions/checkout@<sha>
    - uses: actions/setup-node@<sha>
    - run: npm ci
    - uses: actions/download-artifact@<sha>
      with:
        pattern: vitest-blob-*
        merge-multiple: true
        path: .vitest-reports
    - run: npx vitest run --merge-reports --coverage
```

El primer paso del job de merge falla si algún shard no terminó en `success`, incluso si se canceló o se saltó; es una adición propia para que `if: always()` no convierta un shard caído en un verde.

## Anti-patrones

Los errores más caros son los que hacen que un gate en verde no signifique nada.

- **Cobertura global como único gate.** Mide qué líneas se ejecutaron, no si algo se verifica; se complementa con cobertura de código nuevo y, en lo crítico, mutation testing.
- **Umbrales evaluados por shard.** Cada shard ve una fracción del código y falla en falso; se evalúan sobre el reporte combinado.
- **Reintentar toda la suite.** Los reintentos se aplican solo a tests conocidos como flaky.
- **`skip` para esconder un flaky.** Equivale a borrar cobertura; la alternativa es la cuarentena con dueño y fecha.
- **Tests acoplados a la implementación o mocks de todo.** Se rompen al refactorizar sin detectar bugs; los dobles se reservan para las fronteras.
- **Check requerido que puede quedar en Pending o en skipped.** Un filtro de path deja el merge bloqueado; un `if` deja pasar el PR sin que los tests hayan corrido.
- **Matriz de shards y divisor desalineados.** Cambiar uno sin el otro ejecuta solo una parte de la suite sin avisar.
- **Bajar el umbral para que pase.** Si el umbral se mueve, queda registrado en el PR que lo mueve, con justificación.

## Aplicación a tu pipeline

Tu pipeline ya tiene la estructura; falta que los tests corran de verdad y que el agregador lo exija.

| Situación actual                                                                              | Acción                                                                                                                                                  | Gate                                                   |
| --------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| Tests con `if: false` en el `ci.yml`                                                          | Reactivarlos como primer paso; nada de lo demás protege mientras estén apagados                                                                         | Tests en verde y tests que corrieron, bloqueantes      |
| El agregador reporta éxito cuando un job se salta y `ci-complete` sale en verde al cancelarse | Agregador con `always()` que falle ante `failure`, `cancelled` o `skipped` inesperado                                                                   | Check único requerido: `ci-complete`                   |
| Tu workflow de PR body ya contempla `merge_group`                                             | El job de unit tests debe escuchar `merge_group` también                                                                                                | Mismo check en cola y en PR                            |
| Dos suites: client (React/Vite) y server (Express/Prisma), según tu plantilla de PR           | Umbrales de cobertura por paquete, no uno global mezclado                                                                                               | Cobertura advisory 2 a 4 semanas, luego bloqueante     |
| Cobertura de código nuevo                                                                     | Vitest `coverage.changed` limita la cobertura a archivos cambiados, no a líneas; para línea a línea hace falta Sonar o una herramienta de diff coverage | Gate de código nuevo en PR cuando se elija herramienta |
| Hooks de husky                                                                                | `pre-push` con `vitest related --run` sobre lo cambiado, como feedback                                                                                  | Espejo obligatorio en CI                               |
| Sharding                                                                                      | Decidirlo con la duración medida del job contra el presupuesto de tiempo, no antes; cada shard suma runner-minutes                                      | Alerta de duración                                     |

El orden de trabajo es: reactivar tests y reparar el agregador, activar gates de tests en verde, añadir cobertura en modo advisory y, cuando esté estable, pasarla a bloqueante.

## Fuentes

Páginas abiertas y leídas para este documento, consultadas el 2026-10-27:

- [AWS Prescriptive Guidance, Tests for CI/CD pipelines](https://docs.aws.amazon.com/prescriptive-guidance/latest/strategy-cicd-litmus/tests-for-cicd-pipelines.html): definición de unit tests y baseline mínimo.
- [AWS Whitepaper, Testing stages in CI/CD](https://docs.aws.amazon.com/whitepapers/latest/practicing-continuous-integration-continuous-delivery/testing-stages-in-continuous-integration-and-continuous-delivery.html): pirámide, regla del 70% y cobertura.
- [Fowler, Unit Test](https://martinfowler.com/bliki/UnitTest.html): definición, solitarios y sociables, velocidad.
- [Fowler, The Practical Test Pyramid](https://martinfowler.com/articles/practical-test-pyramid.html): prácticas de diseño y orden en el pipeline.
- [Fowler, Eradicating Non-Determinism in Tests](https://martinfowler.com/articles/nonDeterminism.html): solo leí su resumen en el [índice de testing](https://martinfowler.com/testing).
- [Vitest, coverage](https://vitest.dev/config/coverage): umbrales, provider, reporters.
- [Vitest, guía de CLI (copia de la v2)](https://next.tangled.org/vitest.dev/vitest/blob/v2/docs/guide/cli.md): `--shard`, `--changed`, `related`, `--merge-reports`; es documentación de la v2, hay que confirmar con tu versión.
- [Jest, Configuring Jest](https://jestjs.io/docs/zh-Hans/configuration): `coverageThreshold`, reporters, `bail`, `randomize` (página en la versión zh-Hans, contenido técnico en inglés).
- [SonarQube, Quality gates](https://docs.sonarsource.com/sonarqube-server/10.8/instance-administration/analysis-functions/quality-gates/): condiciones de Sonar way.
- [GitHub, Troubleshooting required status checks](https://docs.github.com/en/pull-requests/how-tos/merge-and-close-pull-requests/troubleshooting-required-status-checks): checks saltados y Pending.
- [GitHub, Managing a merge queue](https://docs.github.com/en/enterprise-server@3.19/repositories/configuring-branches-and-merges-in-your-repository/configuring-pull-request-merges/managing-a-merge-queue): trigger `merge_group` (documentación de Enterprise Server 3.19).
- [Contentstack, sharding de Vitest](https://developers.contentstack.com/blog/the-waiting-tax-on-every-pr-how-sharding-vitest-cut-ci-from-15-minutes-to-4-5): caso medido de 6 shards.
- [RWX, Strategies for handling flaky tests](https://rwx.com/blog/strategies-for-handling-flaky-tests): reintento, cuarentena y detección.
- [OneUptime, Mutation testing con Stryker](https://oneuptime.com/blog/post/2026-01-25-mutation-testing-with-stryker/view): fuente secundaria; usa Jest, no menciona Vitest.

### Sin verificar en fuentes abiertas

- Flags de Jest `--ci`, `--shard`, `--changedSince` y `--findRelatedTests`; `--retry` y `allowOnly` de Vitest.
- Reglas de ESLint que prohíben `.only` y `.skip`, y el comportamiento de `passWithNoTests`.
- Estadísticas de flakiness de Google: el cuerpo del artículo no estaba disponible, por eso no se citan cifras.
- Documentación oficial de Stryker: no era accesible desde esta sesión; los umbrales de Stryker salen de una fuente secundaria.
