# PRD — Test sharding en CI/CD

Nov 5, 2026 · @Johan

## Resumen y problema

El sharding reparte una suite entre varios runners para bajar el tiempo de pared; solo vale la pena cuando la suite ya es lenta y es determinista, y exige gates propios porque un shard perdido parece un verde.

En un pipeline enterprise el sharding no es solo una matriz de GitHub Actions. Cuatro piezas lo hacen confiable: una estrategia de reparto balanceada, aislamiento entre shards, un paso que **fusiona** reportes y cobertura, y un agregador que verifica que **todos** los shards corrieron. Sin la última pieza, un shard cancelado o saltado deja pasar el PR con parte de los tests sin ejecutar.

Este PRD recoge las estrategias documentadas, define requisitos y gates, y propone una adopción por fases para el ERP (cliente React/Vite, servidor Express/Prisma, E2E con Playwright). Parte de que hoy tests y build están apagados en `ci.yml` (`if: false`), así que primero se necesita una suite serial que corra y sea estable.

## Objetivos y no-objetivos

El éxito es bajar el tiempo de pared sin perder tests ni confianza en el resultado.

| #   | Objetivo                               | Meta (propuesta)                                                    |
| --- | -------------------------------------- | ------------------------------------------------------------------- |
| O1  | Reducir el tiempo de pared de la suite | Por debajo de un objetivo fijado por suite (D1)                     |
| O2  | Reparto balanceado                     | p95 de duración de shard ≤ 1,5× el objetivo                         |
| O3  | Cero tests perdidos                    | Tests ejecutados en todos los shards = tests descubiertos en serial |
| O4  | Un solo veredicto                      | Reportes y cobertura fusionados; un check requerido                 |
| O5  | Aislamiento                            | Ningún test depende de otro shard ni de un orden                    |
| O6  | Costo controlado                       | Minutos de Actions por PR dentro de un presupuesto (D5)             |

**No-objetivos:** shardear suites rápidas (una suite que ya corre en pocos minutos pierde más en preparación que lo que gana); arreglar tests flaky con reintentos; elegir un proveedor de runners; reemplazar la pirámide de tests.

## Estrategias de sharding

La industria usa cuatro formas de repartir tests; la elección es un compromiso entre balance y reproducibilidad.

| Estrategia                     | Cómo reparte                                                                  | Ventaja                                | Límite                                                         |
| ------------------------------ | ----------------------------------------------------------------------------- | -------------------------------------- | -------------------------------------------------------------- |
| Estática por archivo o paquete | Mapeo determinista, por ejemplo `hash(archivo) % N`                           | Estable y fácil de reproducir en local | No corrige desbalance si los archivos tienen tamaños distintos |
| Por duración histórica         | Divide según tiempos de corridas previas (CircleCI `--split-by=timings`)      | Equilibra por tiempo, no por cantidad  | Necesita guardar y refrescar tiempos                           |
| Cola dinámica                  | Un planificador entrega tests a workers libres (`pytest-xdist`, Knapsack Pro) | Buen balance con tests muy desiguales  | Más difícil de reproducir y de cachear                         |
| Híbrida                        | Cubos fijos por tipo (rápido, integración) con balanceo dentro de cada cubo   | Escala y mantiene reproducibilidad     | Más piezas que mantener                                        |

**Lo que traen las herramientas del stack:**

- **Playwright:** `--shard=x/y`. Por defecto reparte por archivo; con `fullyParallel: true` reparte por test individual, lo que equilibra mejor. La documentación lo recomienda para CI.
- **Vitest:** tiene `--shard`, pero la fusión de cobertura entre shards fue un problema abierto en el repositorio (cada shard borraba el directorio temporal compartido). La solución de trabajo era un `coverage.reportsDirectory` distinto por shard y fusionar con una herramienta externa. Esa discusión es antigua: hay que comprobar qué soporta hoy la versión instalada (D2).
- **Balanceo por duración en Playwright:** se propuso en un PR que nunca se fusionó; lo mantuvieron como propuesta. Si se quiere, es infraestructura propia.

Una fuente de la comunidad recomienda reconstruir la asignación periódicamente (por ejemplo, cada semana) y no en cada commit, para no perder caché ni reproducibilidad. Es una recomendación del artículo, no un estándar.

## Flujo en CI

Cada shard sube su reporte, un job los fusiona y un agregador decide; sin los N reportes, el PR no pasa.

&#91;embedded content: shards, fusión y gate · 4 shards, 1 decisión\]

Un shard rojo, cancelado o ausente deja el agregador en rojo; los otros shards terminan y suben su reporte antes.

## Requisitos de implementación

La matriz es la parte fácil; los requisitos de aislamiento y de fusión son los que evitan falsos verdes.

1. **RI-1. Matriz.** `strategy.matrix` con `shardIndex` y `shardTotal`; `fail-fast: false` para que un shard rojo no oculte los demás resultados.
2. **RI-2. Reparto fino.** En Playwright, `fullyParallel: true`. Los archivos de test enormes se dividen para que el reparto tenga unidades pequeñas.
3. **RI-3. Aislamiento.** Cada shard usa su propia base de datos y puertos, derivados del índice del shard. Ningún test escribe estado global ni depende del orden o de otro shard.
4. **RI-4. Determinismo.** Imágenes y dependencias fijadas, semillas aleatorias controladas y claves de caché basadas en el lockfile.
5. **RI-5. Artefactos por shard.** Cada shard sube su reporte (`blob-report-<n>` en Playwright) con `if: ${{ !cancelled() }}`, para que se suba aunque falle, con retención corta (la guía oficial usa 1 día).
6. **RI-6. Job de fusión.** Corre con `needs` sobre la matriz y `if: ${{ !cancelled() }}`; descarga todos los reportes, los fusiona (`merge-reports` en Playwright) y publica un solo reporte.
7. **RI-7. Cobertura fusionada.** La cobertura se une **antes** de aplicar umbrales. Un umbral por shard no tiene sentido porque cada shard ve solo una parte del código.
8. **RI-8. Cantidad de shards.** Se calcula como `ceil(tiempo_total / tiempo_objetivo)` más un margen de 10 a 30 % para colas y reintentos (fórmula de la fuente comunitaria). Cada shard repite instalación y preparación, así que más shards no siempre es más rápido.
9. **RI-9. Reproducibilidad local.** Un comando documentado corre un shard concreto en local con las mismas variables (`--shard=2/4`).
10. **RI-10. Prohibir `.only` en CI** (`forbidOnly` en Playwright; confirmar el equivalente en Vitest), para que un `.only` olvidado no reduzca la suite sin que nadie lo vea.

## Gates para suites shardeadas

Los gates clásicos de testing siguen vigentes; el sharding añade los que comprueban que nada se perdió en el reparto.

| Gate                                           | Qué verifica                                                                                            | ¿Bloquea?                               |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------------------- | --------------------------------------- |
| Completitud de shards                          | Llegaron los N reportes esperados (`shardTotal`), ninguno cancelado ni saltado                          | Sí                                      |
| Conteo de tests                                | Suma de tests ejecutados = tests descubiertos en serial (por ejemplo con el modo de listado del runner) | Sí                                      |
| Agregador `tests-complete`                     | Todos los shards en `success`; cualquier otro estado falla                                              | Sí; es el único check requerido         |
| Umbral de cobertura sobre el reporte fusionado | Cobertura total y de código nuevo                                                                       | Sí, tras fase advisory                  |
| `forbidOnly` y sin tests saltados nuevos       | Nadie reduce la suite sin querer                                                                        | Sí                                      |
| Timeouts por test y por job                    | Un test colgado no detiene un shard                                                                     | Sí                                      |
| Tasa de tests flaky                            | Test que pasa solo con reintento se registra; sobre un umbral se pone en cuarentena                     | Cuarentena automática; no bloquea el PR |
| Balance de shards                              | p95 de duración > 1,5× el objetivo avisa                                                                | No: alerta                              |
| Costo                                          | Minutos de Actions por PR sobre presupuesto                                                             | No: alerta                              |

Los umbrales de flaky (5 % en 30 días) y de balance (1,5×) vienen de una fuente comunitaria como recomendación propia, no de un estándar; se toman como punto de partida (D4).

Un punto de práctica: los reintentos esconden problemas sistemáticos. Un reintento que salva un test debe quedar visible en el reporte, no pasar como verde limpio.

## Plan por fases

Se shardea al final: antes hay que tener una suite que corra y sea estable en serial.

1. **Fase 0 — Suite serial real.** Quitar `if: false` de tests y build, arreglar los flaky evidentes y medir la duración por suite. Salida: tiempos de referencia y suite estable.
2. **Fase 1 — Aislamiento.** Base de datos y puertos por shard, sin estado global, `forbidOnly` en CI. Salida: la suite pasa en orden aleatorio y en paralelo local.
3. **Fase 2 — Shardear E2E.** Empezar por Playwright, que trae `--shard`, blobs y `merge-reports`. Agregador `tests-complete` y gates de completitud y conteo. Salida: A1 a A5 en verde.
4. **Fase 3 — Shardear unitarias y de integración.** Solo si superan el objetivo de tiempo; incluye la fusión de cobertura (D2) y el umbral sobre el reporte fusionado, primero advisory. Salida: cobertura fusionada igual a la de una corrida serial.
5. **Fase 4 — Balanceo y cuarentena.** Reparto por duración si el desbalance lo justifica (D3) y cuarentena automática de flaky. Salida: p95 de shard dentro del objetivo.

**Reversión:** reducir `shardTotal` a 1 devuelve la ejecución serial sin tocar el ruleset, porque el check requerido sigue siendo `tests-complete`.

## Criterios de aceptación y métricas

El sharding se acepta cuando pasan estos casos, incluidos los negativos.

| #   | Caso                                               | Resultado esperado                                |
| --- | -------------------------------------------------- | ------------------------------------------------- |
| A1  | Un shard falla un test                             | Los otros terminan; `tests-complete` rojo         |
| A2  | Un shard se cancela o se salta                     | `tests-complete` rojo, no verde                   |
| A3  | Falta el reporte de un shard                       | Gate de completitud falla y nombra el shard       |
| A4  | Se añade `.only`                                   | La corrida de CI falla                            |
| A5  | Misma suite en serial y shardeada                  | Mismo número de tests ejecutados                  |
| A6  | Cobertura de la suite shardeada frente a la serial | Diferencia de 0,1 puntos o menos (propuesta)      |
| A7  | Un test pasa solo con reintento                    | Visible como flaky en el reporte; no verde limpio |
| A8  | Reproducir el shard 2 de 4 en local                | Mismo conjunto de tests que en CI                 |

Métricas, con metas propuestas: tiempo de pared de la suite frente al objetivo (D1); p95 de duración de shard ≤ 1,5× el objetivo; tasa de tests flaky en 30 días; minutos de Actions por PR.

## Riesgos y mitigaciones

El riesgo mayor es un verde falso por un shard perdido; el gate de completitud existe para eso.

| Riesgo                                                | Impacto                                                  | Mitigación                                                                     |
| ----------------------------------------------------- | -------------------------------------------------------- | ------------------------------------------------------------------------------ |
| Shard cancelado o saltado cuenta como éxito           | Parte de la suite sin ejecutar                           | `tests-complete` estricto y gate de completitud                                |
| Desbalance entre shards                               | El shard más lento marca el tiempo total                 | `fullyParallel`, dividir archivos grandes, balanceo por duración si hace falta |
| Estado compartido (base de datos, puertos, archivos)  | Fallos intermitentes que dependen de qué shard corre qué | Recursos por shard (RI-3) y prueba en orden aleatorio                          |
| Cobertura por shard sin fusionar                      | Umbral erróneo                                           | Fusionar antes del umbral (RI-7); verificar soporte de Vitest (D2)             |
| Costo de Actions crece con cada shard                 | Presupuesto superado                                     | Shardear solo suites lentas; alerta de minutos por PR                          |
| Repetir instalación y preparación en cada shard       | Menos ganancia de lo esperado                            | Caché por lockfile; medir antes de subir `shardTotal`                          |
| Reintentos esconden tests flaky                       | La suite se degrada sin que se note                      | Reintentos visibles y cuarentena                                               |
| Reporte fusionado distinto por versión de herramienta | Fusión rota tras actualizar                              | Fijar versión y probar cada upgrade                                            |
| Un solo mantenedor                                    | Nadie más revisa los umbrales                            | Riesgo aceptado y documentado                                                  |

## Decisiones abiertas

Cinco decisiones por tomar; D1 y D2 bloquean las Fases 2 y 3.

| #   | Decisión                          | Opciones                                                | Recomendación                                                        |
| --- | --------------------------------- | ------------------------------------------------------- | -------------------------------------------------------------------- |
| D1  | Tiempo objetivo por suite         | Por ejemplo 5 o 10 minutos                              | Fijarlo tras medir en la Fase 0                                      |
| D2  | Fusión de cobertura en Vitest     | Soporte nativo de tu versión, o herramienta externa     | Comprobar la versión instalada antes de la Fase 3                    |
| D3  | Reparto                           | Por archivo y `fullyParallel`, o por duración histórica | `fullyParallel` primero; duración solo si el desbalance lo justifica |
| D4  | Umbrales de flaky y balance       | Los de la fuente (5 % en 30 días, 1,5×) u otros         | Empezar con esos y ajustar con datos propios                         |
| D5  | Presupuesto de minutos de Actions | Plan actual, runners de pago o propios                  | Estimar minutos por PR antes de la Fase 3                            |

## Fuentes consultadas

- [Playwright: Sharding](https://playwright.dev/docs/test-sharding): `--shard`, `fullyParallel`, blob reports, `merge-reports` y el ejemplo de GitHub Actions.
- [Test sharding strategies for large monorepos (DEV Community)](https://dev.to/beefedai/test-sharding-strategies-for-large-monorepos-13fe): estrategias, fórmula de cantidad de shards y umbrales; son recomendaciones del artículo, y su código de ejemplo tiene errores.
- [Vitest issue 5125: coverage y reportes con `--shard`](https://github.com/vitest-dev/vitest/issues/5125): conflicto de directorios y solución de trabajo; discusión antigua, puede haber cambiado.
- [Vitest PR 5663: blob reporter](https://github.com/vitest-dev/vitest/pull/5663): origen de `--merge-reports`.
- [Playwright PR 30388: balanceo por duración](https://github.com/microsoft/playwright/pull/30388): propuesta archivada, no fusionada.

La página de Vitest sobre rendimiento no estaba accesible desde aquí, así que el soporte actual de Vitest para fusionar cobertura entre shards queda sin confirmar. Consultado el 2026-11-05.
