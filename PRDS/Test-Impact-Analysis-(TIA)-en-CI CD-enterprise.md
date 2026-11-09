# Test Impact Analysis (TIA) en CI/CD enterprise

Oct 29, 2026 · @Johan

## Resumen

TIA ejecuta solo los tests que un cambio puede afectar; ahorra tiempo y cómputo en PRs, pero introduce falsos negativos, así que en enterprise nunca va sola: siempre tiene un fallback y una suite completa en otro punto del flujo.

Las fuentes consultadas coinciden en el patrón: **selección en el PR, suite completa antes de integrar o de forma periódica, y métricas que prueben que la selección no deja pasar regresiones**. El riesgo central es que un test relevante quede fuera por datos de dependencia viejos, cambios indirectos que el diff no muestra o archivos de configuración que afectan a todo.

Para tu proyecto el punto de partida de menor costo es `vitest run --changed origin/main` en PRs, con fallback a suite completa cuando cambian archivos transversales, y suite completa en `main` y nocturna. TIA predictiva (ML) y por cobertura solo se justifican si la suite se vuelve lenta; una fuente advierte que en bases de código pequeñas con suites rápidas puede no compensar el costo de montarla.

## Cómo funciona

TIA cruza el diff con un mapa de dependencias y siempre tiene una salida a la suite completa cuando no puede razonar sobre el cambio.

&#91;embedded content: flujo de TIA · 1 decisión, 1 fallback\]

En el PR corre la selección o, ante un cambio transversal, la suite completa; en `main` y de noche corre siempre la completa.

## Estrategias y herramientas

Hay cuatro familias; la más simple suele bastar hasta que la suite es realmente lenta.

| Estrategia                  | Cómo decide                                                                                                        | Ventaja                                                                        | Riesgo principal                                                                               | Ejemplos                                                      |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| Estática (grafo de imports) | Qué tests importan, directa o transitivamente, los archivos cambiados                                              | Sin infraestructura, determinista                                              | No ve dependencias en runtime (archivos `.env`, mocks nuevos, imports dinámicos según el caso) | `vitest --changed`, Nx affected, Turborepo `--filter`         |
| Dinámica por cobertura      | Mapa test → código grabado al ejecutar con instrumentación                                                         | Preciso, ve lo que realmente se ejecuta                                        | Datos viejos excluyen tests relevantes; hay que guardar y refrescar el mapa                    | Azure DevOps TIA; Istanbul, JaCoCo, gcov como instrumentación |
| Por paquete (monorepo)      | Grafo de dependencias entre paquetes                                                                               | Muy barata, escala bien                                                        | Grano grueso: E2E rara vez mapea a paquetes                                                    | Nx, Turborepo                                                 |
| Predictiva (ML)             | Modelo entrenado con historial de ejecuciones, correlación archivo–fallo, similitud de nombres y tamaño del cambio | Predice incluso para áreas nunca vistas; permite fijar un objetivo de duración | Requiere historial y un servicio; depende del modelo                                           | Launchable (PTS)                                              |

Detalles de dos fuentes primarias:

- **Azure DevOps TIA** selecciona tests impactados, tests que fallaron antes y tests nuevos; cae a suite completa si el commit toca tipos de archivo que no entiende (HTML o CSS); permite una corrida completa periódica, que Microsoft recomienda como control principal; y una variable (`DisableTestImpactAnalysis`) para forzar la suite completa en un build. Su doc sugiere validar la selección corriendo dos tareas, una con tests impactados y otra con todos: si la primera pasa, la segunda también debería. Es documentación archivada (TFS 2017 y Azure DevOps 2020).
- **Launchable PTS** prioriza la suite con un modelo y luego la corta según un objetivo (confianza o porcentaje de duración); entre pruebas con igual probabilidad de fallo prioriza las más cortas. La página consultada no explica cómo trata tests nuevos ni qué red de seguridad ofrece.

## Implementación en JS/TS

En tu stack la opción directa es la selección estática de Vitest, con la base fijada a la rama destino del PR.

```bash
vitest run --changed origin/main
```

Vitest pregunta a Git qué archivos cambiaron y corre los tests que los importan, directa o transitivamente. Según su documentación, la base compartida da la misma selección en cualquier máquina y en CI, y recomienda una corrida completa antes de integrar.

| Herramienta                                   | Qué resuelve                                             | Nota                                                                                                       |
| --------------------------------------------- | -------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `vitest run --changed <ref>`                  | Tests cuyo grafo de imports contiene un archivo cambiado | Requiere historial de Git suficiente en el checkout (`fetch-depth`) para que exista `origin/main`          |
| `vitest run --since-last-run`                 | Re-ejecuta lo modificado desde la última corrida local   | Depende de caché local; la propia doc la presenta como local, no la uses como único control en CI          |
| Nx `nx affected --target=test`                | Paquetes afectados en un monorepo                        | `nrwl/nx-set-shas` calcula bien base y head en GitHub Actions                                              |
| Turborepo `turbo test --filter=[origin/main]` | Igual, por paquete                                       | Aplica si `client` y `server` son paquetes de un workspace                                                 |
| Jest `--changedSince`                         | Equivalente en Jest                                      | No está en las fuentes abiertas; verifica en su documentación                                              |
| Playwright (E2E)                              | Selección por diff y sharding (`--shard=N/M`)            | El sharding está confirmado en la fuente de monorepos; la selección por diff de Playwright no la verifiqué |

La fuente sobre monorepos aclara que los E2E rara vez mapean a paquetes, por eso suele ejecutarse la suite E2E completa al apuntar a `main`, y reservar TIA para unit e integración.

## Estrategia en CI/CD

La selección acelera el PR; la suite completa es la red de seguridad y se ubica en dos puntos posteriores.

| Momento                     | Qué corre                                                           | Por qué                                              |
| --------------------------- | ------------------------------------------------------------------- | ---------------------------------------------------- |
| Local (pre-push)            | `vitest --changed` contra la rama base                              | Feedback rápido; no sustituye a CI                   |
| PR                          | Unit e integración **seleccionados**; E2E según alcance             | Velocidad y menos ruido de tests no relacionados     |
| Cambio transversal en el PR | **Suite completa** (fallback)                                       | El grafo no puede razonar sobre configuración global |
| Merge queue o push a `main` | **Suite completa**                                                  | Es el punto donde el código se integra               |
| Programado (nocturno)       | Suite completa + comparación con lo que la selección habría omitido | Mide los falsos negativos                            |

**Fallback a suite completa.** La fuente de monorepos lista los archivos que afectan a todo: `tsconfig.json` raíz o configuración de Babel, dependencias del `package.json` raíz, paquetes de configuración compartida y los workflows de CI. Azure TIA añade el caso de tipos de archivo que no entiende. En tu repo equivale a: `package-lock.json`, `vite.config`, `vitest.config`, archivos de setup, `prisma/schema.prisma` y migraciones, `.github/workflows/**`.

**Siempre ejecutar, además de la selección:** los tests que fallaron en la corrida anterior y los tests nuevos (así lo hace Azure TIA).

**Override.** Una etiqueta de PR o un input de `workflow_dispatch` que fuerce la suite completa; la fuente minware lo menciona porque sin él los desarrolladores dejan de confiar en la selección.

**Evidencia.** El job publica en el resumen qué tests se seleccionaron, cuántos de total y por qué (diff o fallback), para que la selección sea verificable.

## Gates habituales para TIA

Los gates de TIA no validan el código, validan que la selección sea confiable; los útiles se apoyan en las salvaguardas que citan las fuentes.

| Gate                                             | Qué verifica                                                                | ¿Bloquea?                            | Origen                                        |
| ------------------------------------------------ | --------------------------------------------------------------------------- | ------------------------------------ | --------------------------------------------- |
| Fallback por archivos transversales              | Si el diff toca configuración global, la selección se descarta y corre todo | Sí: cambia lo que se ejecuta         | Monorepo CI; Azure TIA                        |
| Suite completa en `main` o merge queue           | Que lo integrado pase la suite entera                                       | Sí                                   | Monorepo CI; Azure TIA (corrida periódica)    |
| Siempre ejecutar fallidos previos y tests nuevos | Que lo roto o recién escrito no se omita                                    | Sí                                   | Azure TIA                                     |
| Datos de selección frescos                       | Si el mapa de cobertura falta o está viejo, fallback a suite completa       | Sí (solo estrategias dinámicas)      | minware                                       |
| Tasa de escape                                   | Fallos hallados por la suite completa que la selección omitió               | No por PR: alerta o revisión semanal | minware (change failure rate, detection rate) |
| Ratio de selección y de fallbacks                | Vigilar que no se seleccione demasiado poco, ni caiga siempre a completa    | No: métrica                          | minware                                       |
| Validación selección vs completa                 | Si la corrida seleccionada pasa, la completa debe pasar                     | No: auditoría periódica              | Azure TIA                                     |
| Agregador `ci-complete` requerido                | Un solo check requerido que trata el salto no autorizado como fallo         | Sí                                   | Propuesta tuya del PRD de early-abort         |

Dos aclaraciones de criterio propio, no de las fuentes: el gate de cobertura mínima debe medirse sobre la suite completa (en `main` o nocturna), porque una corrida parcial subestima la cobertura; y los umbrales numéricos de tasa de escape o de ratio los fijaría tras medir un par de semanas, en lugar de adoptar uno inventado.

## Riesgos y anti-patrones

Todos los riesgos se reducen a uno: omitir un test que sí debía correr y no enterarse.

| Riesgo                                              | Causa                                                                                                               | Mitigación                                                                   |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| Falso negativo                                      | Cambio indirecto que el diff no muestra, o datos de dependencia viejos                                              | Suite completa en `main` y nocturna; medir la tasa de escape                 |
| Dependencias invisibles al grafo                    | Archivos `.env`, mocks nuevos o setup que ningún test importó (limitación que Vitest declara en `--since-last-run`) | Lista de rutas que fuerzan suite completa                                    |
| Base de comparación incorrecta                      | `origin/main` ausente por checkout superficial                                                                      | `fetch-depth: 0` o traer la rama base; usar `--changed` con un ref explícito |
| Una vez integrado, el cambio deja de ser «cambiado» | `--changed` depende del estado de Git (aviso de la doc de Vitest)                                                   | La suite completa posterior a la integración                                 |
| Pérdida de confianza                                | Los desarrolladores no pueden ver ni forzar la selección                                                            | Resumen visible y etiqueta de override                                       |
| Tests flaky o con estado compartido                 | Distorsionan los datos y los resultados                                                                             | Aislamiento de tests; cuarentena de flaky                                    |
| Costo mayor que beneficio                           | Suite ya rápida, código pequeño                                                                                     | Medir duración del CI antes de adoptar TIA                                   |
| TIA como sustituto de calidad                       | Dejar de revisar la suite                                                                                           | La fuente lo descarta: no reemplaza otras prácticas de calidad               |

## Recomendación por fases para tu stack

Empieza por lo estático y barato, y añade complejidad solo si las métricas lo piden. Es una propuesta basada en tu plantilla de PR (Client React/Vite, Server Express/Prisma, E2E Playwright); no conozco la duración actual de tu CI.

1. **Fase 0 — Prerrequisito.** Activar de verdad tests y build (hoy con `if: false`) y medir la duración por job. Sin esa línea base no se puede saber si TIA ayuda.
2. **Fase 1 — Suite completa con sharding.** Si ya es lento, repartir con `--shard=N/M` antes de seleccionar; es seguro y no introduce falsos negativos.
3. **Fase 2 — Selección estática en PR.** `vitest run --changed origin/main` para unit e integración, con la lista de archivos que fuerzan suite completa, y resumen de selección. E2E completo al apuntar a `main`.
4. **Fase 3 — Red de seguridad.** Suite completa en `main` o merge queue y nocturna; registrar la tasa de escape durante 2 a 4 semanas (ventana consistente con tu patrón advisory → bloqueante).
5. **Fase 4 — Evaluar sofisticación.** Cobertura por test o predicción con ML solo si la suite sigue siendo el cuello de botella y hay historial suficiente.

El gate de TIA se hace bloqueante cuando la selección lleva un periodo sin escapes; antes, el PR parcial puede correr en paralelo a la suite completa en modo informativo para comparar.

## Fuentes consultadas

Páginas abiertas el 2026-10-29; las afirmaciones de cada sección salen de ellas salvo donde se indica criterio propio.

- [Vitest: affected tests](https://main.vitest.dev/guide/recipes/affected-tests.md): `--changed`, `--since-last-run`, limitaciones y recomendación de CI.
- [minware: Test Impact Analysis](https://www.minware.com/guide/best-practices/test-impact-analysis): estática vs dinámica, riesgos, salvaguardas y métricas.
- [Launchable: cómo selecciona tests](https://help.launchableinc.com/features/predictive-test-selection/how-launchable-selects-tests/): selección predictiva y objetivos.
- [Microsoft: Test Impact Analysis (Azure DevOps, archivada)](https://learn.microsoft.com/en-ie/previous-versions/azure/devops/pipelines/test/test-impact-analysis?view=tfs-2017): fallback, tests siempre ejecutados, corrida periódica y validación.
- [HelpMeTest: estrategia de testing en monorepos](https://helpmetest.com/blog/monorepo-ci-cd-testing-strategy/): Nx, Turborepo, sharding y archivos que fuerzan suite completa.

No abrí: la documentación de Jest `--changedSince`, ni de Nx, Turborepo y Playwright directamente; lo que se dice de ellos viene de la fuente de monorepos o queda marcado como por verificar.
