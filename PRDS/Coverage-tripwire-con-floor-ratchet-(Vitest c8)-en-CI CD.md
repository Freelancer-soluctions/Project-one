# Coverage tripwire con floor ratchet (Vitest/c8) en CI/CD

Oct 29, 2026 · @Johan

## Resumen

Un _floor ratchet_ fija un piso de cobertura que solo sube: el CI falla si la cobertura cae por debajo del piso vigente, y cada subida del piso es un PR revisado. Es la forma habitual de introducir un gate de cobertura en código existente sin exigir de golpe un número arbitrario.

En empresas el piso casi nunca va solo. Se combina con cobertura sobre el **diff** (el código nuevo no tiene tolerancia), un piso **por archivo** en rutas críticas y un límite a las exclusiones. La cobertura mide qué líneas se ejecutan, no si los tests detectarían un bug; por eso se acompaña, en módulos críticos, con mutation testing.

Supuesto: no sé qué significa la etiqueta `[FF]` de tu título; la traté como una marca tuya y no cambia el contenido.

## Cómo funciona en Vitest

Vitest ya trae el mecanismo de piso; el ratchet es la disciplina de subirlo bajo control. Opciones de `coverage.thresholds` según la documentación de Vitest:

| Opción                                         | Qué hace                                                           | Cuidado                                                         |
| ---------------------------------------------- | ------------------------------------------------------------------ | --------------------------------------------------------------- |
| `lines`, `functions`, `branches`, `statements` | Mínimo global en porcentaje                                        | Un número **negativo** significa máximo de elementos sin cubrir |
| `perFile` (default `false`)                    | Evalúa el umbral archivo por archivo                               | Un archivo flojo no se esconde en el promedio                   |
| `thresholds[glob]`                             | Umbral para los archivos de un patrón                              | Los umbrales globales **no se heredan** en ese patrón           |
| `autoUpdate` (default `false`)                 | Reescribe los umbrales en el config cuando la cobertura los supera | Modifica archivos: no usarlo en el job que bloquea el merge     |
| `100`                                          | Atajo: los cuatro umbrales en 100                                  | Solo para módulos pequeños y críticos                           |
| `provider` (default `v8`)                      | Motor de cobertura; también `istanbul`                             | Fija uno y no mezcles entre local y CI                          |

Dos conceptos que conviene separar: el **objetivo** (a dónde quieres llegar, se muestra en reportes) y el **piso** (lo que hace fallar el job). La guía de la herramienta Six lo formula igual: el objetivo da visibilidad sin bloquear, el mínimo en CI hace fallar la corrida. El _tripwire_ es el piso: una alarma que se dispara cuando la cobertura retrocede.

La página de Vitest que consulté no dice qué código de salida devuelve al incumplir un umbral; verifícalo en tu CI con una corrida de prueba.

## Estrategias de cobertura que usan las empresas

Las organizaciones separan cuatro preguntas distintas; cada una tiene su propio número.

| Estrategia                       | Qué mide                                 | Ejemplo documentado                                                                                    |
| -------------------------------- | ---------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| Global (project)                 | Todo el código base                      | Codecov: objetivo 75% con tolerancia de 1%; en código antiguo, 50–65%                                  |
| Sobre el diff (patch / new code) | Solo líneas añadidas o modificadas       | Codecov patch: 70% y 0% de tolerancia; SonarQube: falla si la cobertura de código nuevo es menor a 80% |
| Por archivo o ruta crítica       | Archivos sensibles (auth, tokens, pagos) | Piso por archivo más alto que el global                                                                |
| Por tipo de test (flags)         | Unitarios vs integración                 | Unitarios 80%, integración 60%, porque cada test de integración cubre menos líneas                     |

Google usa la cobertura a nivel de _changeset_ y de revisión de código, no como un número global: su paper dice que la clave para que sea accionable es aplicarla ahí. Su guía pública de referencia (citada por terceros) habla de 60% aceptable, 75% encomiable y 90% ejemplar, y advierte que cada equipo ajuste los valores a su caso.

El patrón común: exigir mucho al código nuevo (barato de cumplir) y subir el piso global poco a poco (caro de mover).

## Implementación del ratchet en CI

Un caso real y público (repositorio molecule-core, servidor en Go) muestra la forma completa. Tres gates en un job de CI: un piso total, un piso por archivo en rutas críticas y un reporte por archivo solo informativo. El calendario sube ambos pisos cada mes, el piso total de 25% hacia 70% y el crítico de 10% hacia 70%. Su regla: _«cualquier ratchet es un PR: revisable, reversible y deja historial»_. Los archivos que no pueden alcanzar el piso entran en una lista de excepciones con ruta, motivo, issue y vencimiento de 14 días.

A partir de eso, un diseño aplicable (propuesta mía, no un estándar único):

1. **Medir primero.** El piso inicial es la cobertura actual redondeada hacia abajo, no una meta aspiracional.
2. **Piso en el repo.** Los umbrales viven en `vitest.config` versionado; cambiarlos exige revisión de CODEOWNERS.
3. **Subir por PR.** Un job programado o un script propone el PR que sube el piso al valor actual; nunca `autoUpdate` dentro del job bloqueante.
4. **Bajar es explícito.** Reducir un umbral es un PR aparte con justificación y fecha de recuperación.
5. **Informe único.** Si los tests corren en shards, se fusionan los reportes antes de evaluar el piso; evaluar cada shard por separado da falsos rojos.

SonarSource avisa de un límite del ratchet automático respecto al último análisis: un primer commit pequeño con cobertura total deja al resto del equipo ante un piso imposible. Su alternativa es subir gradualmente el umbral de código nuevo, por versión o por mes. Otra guía sugiere pasos de unos 5 puntos por trimestre con tope en 85%.

## Gates habituales para cobertura

Seis gates cubren el patrón; los dos primeros son los que casi todos exigen.

| Gate                               | Qué verifica                                                             | ¿Bloquea?                        | Fase típica                                       |
| ---------------------------------- | ------------------------------------------------------------------------ | -------------------------------- | ------------------------------------------------- |
| Piso global (tripwire)             | Cobertura total ≥ piso vigente                                           | Sí                               | Bloqueante tras 2–4 semanas advisory              |
| Cobertura del diff (patch)         | Líneas nuevas con 70–85%                                                 | Sí, sin tolerancia               | Bloqueante desde el inicio del código nuevo       |
| Piso por archivo crítico           | Auth, permisos, dinero, cripto                                           | Sí                               | Bloqueante, piso más alto                         |
| Guardia del piso                   | Un PR que baja umbrales o añade exclusiones exige CODEOWNERS             | Sí                               | Bloqueante                                        |
| Presupuesto de exclusiones         | Cantidad de `istanbul ignore` y `coverage.exclude` no crece sin revisión | Avisa, o bloquea si sube         | Advisory primero                                  |
| Integridad del reporte             | Existe, está fusionado y no vino de un test saltado                      | Sí                               | Bloqueante                                        |
| Mutation score en módulos críticos | Los tests detectan cambios en el código                                  | Nocturno; en PR solo incremental | Advisory, luego bloqueante en un conjunto pequeño |

El gate de integridad evita el fallo más silencioso: un job de tests saltado produce un reporte vacío o ausente, y un agregador permisivo lo da por bueno. La guía de HelpMeTest recomienda además vigilar los marcadores de exclusión en los PR: si crecen sin tests de integración que los acompañen, el gate se está esquivando.

## Anti-patrones y contrapesos

El riesgo central es que el número se convierta en la meta y deje de medir lo que importa.

- **Exigir 100%.** Genera falsa seguridad y tests de poco valor. Una guía de buenas prácticas sugiere priorizar el paso de cobertura baja a moderada y cubrir bien lo que cambia con frecuencia, sin obsesionarse con la última fracción.
- **Tests sin aserciones.** Ejecutan líneas y no detectan nada. Subir el piso no los ve.
- **Exclusiones que crecen.** Mover código a `exclude` o marcarlo con `istanbul ignore` sube el porcentaje sin probar nada; por eso existe el presupuesto de exclusiones.
- **Ratchet sobre un solo análisis previo.** Ver el límite que plantea SonarSource.
- **Juzgar solo por el porcentaje.** La recomendación repetida es revisar en el code review las líneas concretas sin cubrir.

El contrapeso es mutation testing: introduce cambios pequeños en el código y comprueba que los tests fallen. En Stryker, una configuración de ejemplo usa `high: 80`, `low: 60` y `break: 50`, y se ejecuta de forma incremental en los PR y completa por la noche. Es lento, así que se limita a la lógica de negocio crítica.

## Recomendación para tu stack

Con un solo desarrollador, el valor está en un piso mecánico y en cobertura estricta del código nuevo; el resto es disciplina de PR. Tu `ci.yml` tiene tests y build con `if: false`, así que hoy no hay cobertura que medir: eso va primero.

| Fase | Qué se hace                                                                                           | Criterio de salida                              |
| ---- | ----------------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| 0    | Reactivar tests, generar reporte con `v8` y fusionar los shards                                       | El reporte existe y se publica en cada PR       |
| 1    | Advisory: mostrar cobertura global, del diff y por archivo                                            | 2–4 semanas de datos estables                   |
| 2    | Piso global = cobertura actual redondeada hacia abajo, bloqueante, vía `ci-complete`                  | Un PR que baja la cobertura falla               |
| 3    | Cobertura del diff bloqueante (empezar en 70%) y `perFile` en rutas críticas (auth, permisos, Prisma) | Falsos rojos ≤ 1 al mes                         |
| 4    | Ratchet mensual por PR; guardia del piso con CODEOWNERS                                               | Piso sube sin tocar el job bloqueante           |
| 5    | Mutation testing nocturno en 2–3 módulos críticos                                                     | Puntaje de mutación con umbral `break` definido |

Decisiones que quedan por tomar: umbral del diff (70% o más), qué rutas cuentan como críticas, y si el ratchet lo propone un script o lo haces a mano cada mes. Si quieres, lo convierto en un PRD con requisitos y criterios de aceptación, como los anteriores.

## Fuentes consultadas

Consultadas el 2026-10-29. No pude abrir la guía original del blog de testing de Google ni la página principal de Vitest; la cifra 60/75/90 viene de una guía de terceros que la cita.

- [Vitest — configuración de coverage (v4)](https://v4.vitest.dev/config/coverage): `thresholds`, `perFile`, `autoUpdate`, `provider`.
- [COVERAGE_FLOOR.md, molecule-core](https://git.moleculesai.app/core-lead/molecule-core/src/commit/09e99a09c6c0e735debbede848a2b6291aef7de2/COVERAGE_FLOOR.md): pisos total y crítico, calendario mensual, excepciones con vencimiento.
- [Enforcing Test Coverage Thresholds with SonarQube and Codecov (HelpMeTest)](https://helpmetest.com/blog/sonar-coverage-thresholds-guide/): project vs patch, gates de Sonar, exclusiones.
- [SonarSource Community — ratcheting quality gate](https://community.sonarsource.com/t/ratcheting-quality-gate-conditions-fail-quality-gate-if-coverage-decreases-from-last-analysis/15317): límite del ratchet automático y alternativa de código nuevo.
- [Threshold vs Minimum Coverage (Six)](https://six.hexdocs.pm/threshold-vs-minimum-coverage.html): objetivo vs piso en CI.
- [Code coverage at Google (paper)](https://research.google/pubs/code-coverage-at-google/): cobertura aplicada a changesets y code review.
- [Code coverage best practices (BestHub)](https://besthub.dev/articles/code-coverage-best-practices-2ea69735880e): 60/75/90, riesgos de perseguir 100%.
- [Mutation testing con Stryker (OneUptime)](https://oneuptime.com/blog/post/2026-01-25-mutation-testing-with-stryker/view): thresholds `high/low/break` y modo incremental.
