# PRD — Coverage Merge Gate (merge de shards + check-coverage)

Nov 5, 2026 · @Johan

## Resumen y problema

Cuando los tests corren en shards, ningún shard conoce la cobertura total, así que el umbral solo puede evaluarse en un job que reciba los datos de todos: el Coverage Merge Gate.

Cada shard ejecuta una fracción de la suite y por tanto cubre una fracción del código. Un artículo de ingeniería sobre Vitest lo resume así: con 6 shards, cada uno cubre aproximadamente una sexta parte de `src/**`, y exigir el umbral por shard hace fallar a todos. La solución habitual es que cada shard suba un artefacto parcial, un job posterior los descargue y los fusione, y **solo ese job aplique el umbral**.

El gate tiene dos riesgos opuestos. Si el job de merge se omite o corre con shards faltantes, la cobertura sale artificialmente baja o, peor, el check no existe y el PR pasa. Este PRD define el flujo, la integridad de los artefactos, los umbrales y cómo el gate se conecta al agregador y al ruleset.

## Objetivos y no-objetivos

El éxito es un solo veredicto de cobertura, confiable aunque cambie el número de shards.

| #   | Objetivo                                 | Meta (propuesta)                                                 |
| --- | ---------------------------------------- | ---------------------------------------------------------------- |
| O1  | Un único umbral sobre la cobertura total | Evaluado solo en el job de merge, nunca por shard                |
| O2  | Integridad del merge                     | Si falta un shard, el gate falla; nunca pasa con datos parciales |
| O3  | Exigir cobertura al código nuevo         | Cobertura de parche como gate duro; la global como piso          |
| O4  | Evitar regresión silenciosa              | La global no baja (ratchet)                                      |
| O5  | Que el gate corra aunque un shard falle  | El merge se ejecuta con `if: always()` y reporta                 |
| O6  | Un solo check requerido                  | `ci-complete` agrega el resultado del gate                       |

**No-objetivos:** perseguir 100% de cobertura; medir calidad de los tests (eso lo cubre mutation testing, fuera de alcance); reemplazar el reporte HTML de Playwright; elegir un servicio externo como Codecov (decisión D1).

## Prácticas enterprise investigadas

Las fuentes coinciden en cinco prácticas; ninguna exige un servicio de pago.

1. **Partial por shard, umbral solo en el merge.** Cada shard sube un blob; un job con `needs` y `if: always()` los descarga con `pattern` y `merge-multiple: true`, y ejecuta `vitest run --merge-reports --coverage`. Los umbrales se desactivan en los shards y se activan en el merge ([Contentstack](https://developers.contentstack.com/blog/the-waiting-tax-on-every-pr-how-sharding-vitest-cut-ci-from-15-minutes-to-4-5)).
2. **`fail-fast: false` y `!cancelled()`.** Un shard rojo no debe cancelar a los demás: hacen falta todos los blobs para un reporte completo. Los blobs son intermedios y se retienen 1 día; el reporte final, 14 ([Playwright](https://playwright.dev/docs/test-sharding)).
3. **Cobertura del código nuevo primero.** En bases heredadas, exigir la global bloquea todo; se recomienda un gate duro sobre el parche (por ejemplo, 70 a 85%) y la global como piso con caída permitida pequeña ([HelpMeTest](https://helpmetest.com/blog/sonar-coverage-thresholds-guide/)).
4. **Ratchet.** El umbral global se fija en la cobertura actual más un margen y sube de forma gradual (el ejemplo citado: unos 5 puntos por trimestre, con un tope), nunca baja ([HelpMeTest](https://helpmetest.com/blog/sonar-coverage-thresholds-guide/), [Kinda Technical](https://kindatechnical.com/continuous-integration-continuous-deployment/code-coverage-thresholds-reports-and-enforcement.html)).
5. **Umbrales por carpeta y ramas.** Se exigen más en código crítico (por ejemplo, pagos) y menos en código heredado. La cobertura de líneas engaña: una función puede tener 100% de líneas con la rama de error sin probar, así que se mide también ramas.

Anti-patrones documentados: bajar el umbral para que pase el build, acumular marcas de ignorar cobertura (`istanbul ignore`) y excluir en exceso (tests, migraciones, código generado), que infla el número sin mejorar nada.

## Flujo del gate

Los shards producen parciales sin umbral; el veredicto nace en el merge, después de comprobar que están todos.

&#91;embedded content: flujo del coverage merge gate · M shards, 2 decisiones\]

Si falta cualquier parcial o la cobertura queda bajo el umbral, el merge sale en rojo y `ci-complete` lo propaga al ruleset.

## Requisitos de shards y artifacts

El merge solo es confiable si cada shard entrega un artefacto completo, identificable y sin colisiones.

1. **RS-1. `fail-fast: false`** en la matriz, para que un shard rojo no cancele a los demás y todos produzcan su parcial.
2. **RS-2. Un parcial por shard.** Cada shard escribe un blob de Vitest (por ejemplo `blob-N.json`) y lo sube con nombre único por índice (`vitest-blob-N`). El reporter de blob se añade en la configuración y solo cuando corre un shard; pasar `--reporter=blob` por CLI reemplaza al reporter de consola.
3. **RS-3. Subida aunque falle.** La subida usa `if: ${{ !cancelled() }}`; un shard con tests rojos igual aporta su parcial.
4. **RS-4. Umbrales desactivados en el shard.** Un shard cubre una fracción de `src/**`; el umbral por shard lo haría fallar siempre.
5. **RS-5. Un solo origen del número de shards.** El divisor de `--shard=N/M` y la lista de la matriz salen de la misma variable. Si difieren, parte de la suite no corre y nadie lo ve.
6. **RS-6. Retención corta.** Los parciales se guardan 1 día; el reporte fusionado, 14 días.
7. **RS-7. Artefactos locales ignorados.** El directorio de blobs va en `.gitignore`.

## Requisitos del job de merge y check-coverage

El job de merge es el único lugar donde existe un veredicto de cobertura, así que debe ser estricto con sus entradas y con su salida.

1. **RM-1. Dependencia y ejecución.** `needs: [tests]` con `if: ${{ !cancelled() }}`, para correr aunque haya shards rojos y aún producir el reporte.
2. **RM-2. Integridad antes del merge.** Un paso verifica que existan exactamente M parciales (M = número de shards) antes de fusionar. Si faltan, el job falla con un mensaje que lista los índices ausentes.
3. **RM-3. Merge y evaluación.** Descarga con `pattern` y `merge-multiple: true`, y ejecuta la fusión con cobertura. Los umbrales se aplican aquí porque el merge no se ejecuta como shard.
4. **RM-4. Qué se exige.** Cobertura global de líneas y ramas contra un piso con ratchet (RM-5), y cobertura de parche sobre líneas nuevas del PR (decisión D3 sobre cómo medirla).
5. **RM-5. Ratchet.** El piso vive en el repo, no en el workflow. Subir el piso requiere un PR; bajarlo requiere justificación y revisión de CODEOWNERS.
6. **RM-6. Distinguir causas.** El job falla con mensajes distintos para tests rojos, parciales faltantes, cobertura bajo el umbral y error de herramienta.
7. **RM-7. Salida visible.** Tabla en el Step Summary con global, parche, delta contra la rama base y los archivos peor cubiertos; el reporte fusionado (lcov/HTML) se sube como artefacto de 14 días.
8. **RM-8. Exclusiones controladas.** Qué se excluye de la cobertura (tests, código generado, migraciones) se declara en un archivo versionado; las marcas `ignore` en el código se cuentan y se muestran en el resumen.

## Tipos de gates habituales para cobertura

Los equipos combinan varios gates; los de parche y los de integridad son los que más protegen por costo.

| Gate                  | Qué verifica                                          | Bloquea    | Cuándo usarlo                                 |
| --------------------- | ----------------------------------------------------- | ---------- | --------------------------------------------- |
| Integridad del merge  | Llegaron los M parciales y el merge terminó           | Sí         | Siempre con shards                            |
| Piso global           | Cobertura total ≥ piso                                | Sí         | Con ratchet, no con un número aspiracional    |
| Parche (código nuevo) | Cobertura de líneas añadidas o modificadas ≥ objetivo | Sí         | Primero en bases heredadas                    |
| Delta (no regresión)  | La global no baja más de un margen permitido          | Sí         | Complementa al piso                           |
| Ramas                 | Cobertura de ramas ≥ objetivo, además de líneas       | Sí o aviso | Evita líneas cubiertas con errores sin probar |
| Por carpeta           | Umbral mayor en código crítico, menor en heredado     | Sí         | Módulos con riesgo alto                       |
| Por suite o flag      | Objetivo distinto para unitarios e integración        | Sí         | Si hay suites con alcance distinto            |
| Exclusiones e ignores | Conteo de exclusiones y marcas `ignore`               | Aviso      | Detecta el gaming del gate                    |
| Reporte presente      | Existe el reporte fusionado como artefacto            | Aviso      | Evidencia para auditoría                      |

Los tres primeros son el núcleo; el resto se añade cuando haya datos para fijarlos.

## Integración con el ruleset, el agregador y lo local

El gate solo protege si un job rojo termina en un merge bloqueado.

1. **RI-1. Un solo check requerido.** El ruleset exige únicamente `ci-complete`; el job de merge entra en sus `needs:`. Los nombres de jobs y shards pueden cambiar sin bloquear merges.
2. **RI-2. Agregador estricto.** `ci-complete` falla si el job de merge terminó en `failure`, `cancelled` o `skipped` sin autorización. El `ci.yml` actual reporta éxito cuando un job se salta, y tests y build están con `if: false`: con eso el gate de cobertura jamás existiría. Es prerrequisito (Fase 0).
3. **RI-3. PRs solo de docs.** Los saltos se autorizan con una salida de detección de cambios, no con `paths-ignore`, que deja el check requerido en Pending.
4. **RI-4. Estrategia local.** El desarrollador corre en local los tests con cobertura en un solo proceso (sin shards) para ver el mismo piso antes de empujar. Es feedback; el veredicto es el del merge en CI.
5. **RI-5. Protección del piso.** El archivo con el piso y las exclusiones queda bajo CODEOWNERS, igual que `.github/workflows/`.

## Plan por fases

Cinco fases; la 0 es prerrequisito porque sin tests reales ni agregador estricto no hay nada que medir ni bloquear.

1. **Fase 0 — Base.** Activar tests (quitar `if: false`) y aplicar RI-2. Salida: un job obligatorio saltado deja `ci-complete` en rojo.
2. **Fase 1 — Shards y parciales.** Matriz con `fail-fast: false`, blobs por shard y variable única de shards (RS-1 a RS-7). Salida: todos los shards suben su parcial aunque uno falle.
3. **Fase 2 — Merge advisory.** Job de merge con integridad (RM-2) y reporte (RM-7), sin bloquear, de 2 a 4 semanas. Salida: línea base de cobertura medida y exclusiones revisadas.
4. **Fase 3 — Bloqueante.** Piso global igual a la línea base de la Fase 2 menos un margen pequeño, más cobertura de parche (RM-4). El merge entra a `ci-complete`. Salida: criterios A1 a A8 en verde.
5. **Fase 4 — Ratchet y ajuste.** Subir el piso de forma gradual, añadir ramas y umbrales por carpeta donde haya datos (D4). Salida: política de subida registrada.

**Reversión:** pasar de la Fase 3 a la 2 es un PR que vuelve el job a advisory; el ruleset exige `ci-complete` en ambas, así que no se toca.

## Criterios de aceptación y métricas

El gate se acepta cuando pasan estos casos, incluidos los negativos.

| #   | Caso                                                     | Resultado esperado                                         |
| --- | -------------------------------------------------------- | ---------------------------------------------------------- |
| A1  | Un shard no sube su parcial                              | Merge falla por integridad y lista el índice ausente       |
| A2  | Un shard tiene tests rojos                               | Los demás terminan; el merge corre y reporta               |
| A3  | Cobertura global bajo el piso                            | Merge rojo, `ci-complete` rojo                             |
| A4  | Global sobre el piso, parche bajo el objetivo            | Merge rojo por parche                                      |
| A5  | Se cambia la matriz de 6 a 8 shards sin tocar el divisor | La variable única lo evita; sin ella, la prueba lo detecta |
| A6  | Job de merge omitido o cancelado                         | `ci-complete` rojo                                         |
| A7  | PR que baja el piso en el archivo versionado             | Requiere revisión de CODEOWNERS                            |
| A8  | PR solo de docs, saltos autorizados                      | `ci-complete` verde                                        |

Métricas, con metas propuestas:

- Merges de cobertura con los M parciales completos: 100%.
- Tiempo añadido por el job de merge: menos de 2 minutos.
- Falsos rojos por parciales faltantes o corruptos al mes: 1 o menos.
- Número de marcas `ignore` de cobertura: no crece sin revisión.

## Riesgos y mitigaciones

El mayor riesgo es un merge con datos incompletos que da un número falso, para bien o para mal.

| Riesgo                                                | Impacto                                                  | Mitigación                                                 |
| ----------------------------------------------------- | -------------------------------------------------------- | ---------------------------------------------------------- |
| Merge con parciales faltantes                         | Cobertura falsamente baja, o gate inexistente            | RM-2: contar parciales antes de fusionar                   |
| Divisor y matriz desalineados                         | Parte de la suite no corre                               | RS-5: variable única y prueba A5                           |
| Piso global demasiado alto al inicio                  | Todos los PRs bloqueados                                 | Fase 2 advisory y piso = línea base menos margen           |
| Gaming con `ignore` y exclusiones                     | El número sube sin mejorar tests                         | RM-8 y revisión de CODEOWNERS                              |
| Cobertura de líneas engañosa                          | Ramas de error sin probar                                | Añadir ramas en la Fase 4                                  |
| Cambios de formato del blob entre versiones de Vitest | El merge falla tras actualizar                           | Fijar versión y probar cada upgrade en un PR               |
| Merge sin datos de E2E                                | La cobertura omite lo que cubren los tests de Playwright | Decidir en D2 si E2E cuenta; no asumirlo                   |
| Costo de runners por shards                           | Más minutos por PR                                       | Elegir M por tiempo total; el merge es un job extra por PR |
| Un solo mantenedor                                    | Nadie más revisa bajadas del piso                        | Riesgo aceptado y documentado                              |

## Decisiones abiertas

Cinco decisiones por tomar; D2 y D3 condicionan la Fase 3.

| #   | Decisión                                  | Opciones                                                           | Recomendación                                                                                                      |
| --- | ----------------------------------------- | ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------ |
| D1  | Dónde se evalúa el gate                   | Solo en el job de merge, o además un servicio (Codecov, SonarQube) | Solo job de merge al inicio; un servicio añade parche y tendencias, pero otro proveedor y otro token               |
| D2  | ¿La cobertura de E2E (Playwright) cuenta? | Sólo unitarios e integración, o también E2E con un flag aparte     | Solo unitarios e integración al inicio; las fuentes consultadas no cubren fusionar cobertura de E2E, por confirmar |
| D3  | Cómo medir el parche                      | Herramienta de diff coverage, o servicio externo, o script propio  | Pendiente de evaluar; no hay una solución probada en las fuentes revisadas                                         |
| D4  | Valores de los umbrales                   | Piso global, objetivo de parche, ramas                             | Definirlos con la línea base de la Fase 2; rangos citados: parche de 70 a 85%, global según el punto de partida    |
| D5  | Cantidad de shards                        | Por tiempo total de la suite                                       | Elegir M con datos de duración real; un solo origen de M (RS-5)                                                    |

### Fuentes

- [Contentstack: sharding de Vitest, de 15 a 4,5 minutos](https://developers.contentstack.com/blog/the-waiting-tax-on-every-pr-how-sharding-vitest-cut-ci-from-15-minutes-to-4-5): blobs, `merge-multiple`, umbrales solo en el merge.
- [Playwright: test sharding](https://playwright.dev/docs/test-sharding): `fail-fast: false`, `!cancelled()`, retención de blobs.
- [HelpMeTest: umbrales de cobertura con SonarQube y Codecov](https://helpmetest.com/blog/sonar-coverage-thresholds-guide/): parche, global, ratchet, exclusiones.
- [Kinda Technical: umbrales y enforcement](https://kindatechnical.com/continuous-integration-continuous-deployment/code-coverage-thresholds-reports-and-enforcement.html): umbrales por carpeta, delta, ratchet, delta contra la rama base.
