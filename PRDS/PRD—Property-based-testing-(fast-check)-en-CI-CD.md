# PRD — Property-based testing (fast-check) en CI/CD

Nov 5, 2026 · @Johan

## Resumen y problema

fast-check solo aporta valor en CI si cada fallo es reproducible y cada hallazgo termina convertido en una prueba fija; sin eso, un test aleatorio es un test flaky con otro nombre.

Un test de ejemplos comprueba los casos que el autor imaginó. Un test de propiedades declara una regla (por ejemplo, «la suma de las líneas de factura es igual al total») y fast-check la prueba con cientos de entradas generadas, reduce (shrinking) la que falla al contraejemplo mínimo y entrega una semilla para repetirla. Es la técnica adecuada para lógica de dominio con reglas numéricas y de consistencia, típica de un ERP.

El problema de operarlo es doble: entradas aleatorias pueden hacer que el mismo commit pase y falle en dos corridas, y una propiedad que nunca falla no demuestra nada. Este PRD define la estrategia local y de CI, los gates que se suelen exigir y un plan por fases. Las cifras de ejecución son propuestas por calibrar, no estándares.

## Objetivos y no-objetivos

El éxito es encontrar errores de dominio que los ejemplos no ven, sin añadir tests inestables al merge.

| #   | Objetivo                                     | Meta (propuesta)                                          |
| --- | -------------------------------------------- | --------------------------------------------------------- |
| O1  | PR determinista                              | Misma semilla en PR: mismo commit, mismo resultado        |
| O2  | Exploración profunda fuera del camino del PR | Job programado con semilla aleatoria y más ejecuciones    |
| O3  | Todo fallo reproducible                      | Semilla y ruta visibles en el resumen del job             |
| O4  | Cada hallazgo se vuelve regresión            | Contraejemplo fijado como ejemplo en el test              |
| O5  | Coste acotado                                | Tiempo añadido al PR dentro del presupuesto de la Fase 2  |
| O6  | Propiedades en el dominio crítico            | Cubrir primero dinero, inventario y estados de documentos |

**No-objetivos:** sustituir los tests de ejemplos o E2E; aplicar propiedades a UI o a código sin reglas de dominio; exigir un porcentaje de cobertura por propiedades; fuzzing de seguridad.

## Cómo funciona fast-check

Una propiedad es una función que debe devolver verdadero (o no lanzar) para toda entrada que genere un arbitrary; el runner la ejecuta muchas veces y, al fallar, reduce la entrada.

| Concepto             | Qué es                                                                | Parámetro o API relevante                                                  |
| -------------------- | --------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| Propiedad            | Regla que debe cumplirse para cualquier entrada válida                | `fc.property`, `fc.asyncProperty`, `fc.assert`                             |
| Arbitrary            | Generador de entradas, componible                                     | `fc.record`, `fc.array`, `.map()`, `.chain()`                              |
| Ejecuciones          | Casos probados antes de dar la propiedad por buena (100 por defecto)  | `numRuns`                                                                  |
| Shrinking            | Reducción del fallo al contraejemplo más pequeño                      | automático; `endOnFailure` lo desactiva                                    |
| Reproducción         | El informe imprime semilla y ruta; pasarlas de vuelta repite el fallo | `seed`, `path`                                                             |
| Ejemplos fijos       | Valores que se prueban antes de los generados                         | `examples`                                                                 |
| Límites de tiempo    | Interrumpir o saltar el resto al superar un tiempo                    | `interruptAfterTimeLimit`, `skipAllAfterTimeLimit`, `timeout` (asíncronos) |
| Configuración global | Valores comunes para toda la suite                                    | `fc.configureGlobal`                                                       |
| Pruebas con estado   | Secuencias de comandos contra un modelo de referencia                 | `fc.Command`, `fc.modelRun`                                                |

El informe de un fallo incluye cuántas pruebas corrieron, la semilla, la ruta, el contraejemplo, los pasos de shrinking y el mensaje de error. Esa semilla y esa ruta son la única receta para repetir el fallo; si el CI no las muestra, el fallo puede ser irreproducible.

## Dónde aplicarlo en el ERP

Las propiedades rinden donde hay una regla que debe cumplirse para toda entrada; son candidatas, no un inventario de tu código.

Tipos de propiedad habituales: ida y vuelta (serializar y volver a leer), idempotencia, conmutatividad y asociatividad, elemento neutro e invariantes. Para sistemas con estado se usa un modelo de referencia con secuencias de comandos.

| Candidato en un ERP                                 | Propiedad                                                                       | Tipo                |
| --------------------------------------------------- | ------------------------------------------------------------------------------- | ------------------- |
| Totales de factura e impuestos                      | La suma de líneas e impuestos repartidos es igual al total, sin perder céntimos | Invariante          |
| Redondeo y conversión de moneda                     | Convertir ida y vuelta no cambia el valor más allá de una tolerancia definida   | Ida y vuelta        |
| Movimientos de inventario                           | El stock nunca queda negativo y entradas menos salidas igualan el saldo         | Invariante / modelo |
| Estados de documentos (borrador, aprobado, anulado) | Ninguna secuencia de comandos llega a un estado no permitido                    | Modelo de estados   |
| Importación y exportación (CSV, DTO, esquemas)      | Exportar y volver a importar devuelve el mismo objeto                           | Ida y vuelta        |
| Endpoints idempotentes                              | Repetir la misma petición deja el mismo estado                                  | Idempotencia        |
| Rangos de fechas y períodos contables               | Los períodos no se solapan y cubren el rango completo                           | Invariante          |

**Dónde no:** componentes de UI, plantillas, código que solo orquesta llamadas, y cualquier cosa cuya regla sea «se ve bien». Tampoco código que depende de red o base de datos reales: las propiedades corren sobre lógica pura, con las llamadas externas aisladas.

## Buenas prácticas de escritura

Propiedades simples, generadores acotados y ningún fallo sin fijar.

1. **BP-1. Una regla por propiedad.** Las propiedades complejas son difíciles de leer y de depurar; se escriben como especificación.
2. **BP-2. Generadores acotados.** Usar límites (`min`, `max`, `minLength`) y construir con `.map()` en lugar de filtrar mucho: filtrar descarta casos y ralentiza. Un generador con muchos descartes es una señal de diseño.
3. **BP-3. Generar lo que importa.** Que las propiedades pasen no prueba que los generadores cubran los casos peligrosos (cero, negativos, límites, Unicode fuera del plano básico). Se añaden ejemplos explícitos para esos casos.
4. **BP-4. Sin impureza.** Nada de `Math.random`, `Date.now`, red ni base de datos dentro de una propiedad; el único origen de aleatoriedad es la semilla de fast-check.
5. **BP-5. Combinar con ejemplos.** Las propiedades complementan a los tests de ejemplos; los casos conocidos siguen como ejemplos.
6. **BP-6. Fallo hallado = prueba fija.** El contraejemplo se añade a `examples` (o como test de ejemplo) en el mismo PR que corrige el bug.
7. **BP-7. Aislar las propiedades.** Un sufijo de archivo propio (por ejemplo `*.property.test.ts`) permite darles timeout, semilla y reportes distintos al resto de la suite.
8. **BP-8. Propiedades asíncronas con timeout.** Las que usan `asyncProperty` llevan `timeout` y menos ejecuciones, y no tocan servicios reales en el PR.

## Estrategia local y en CI

El PR corre con semilla fija y pocas ejecuciones; la exploración con semilla aleatoria vive en un job programado que no bloquea merges.

La práctica documentada por fuentes de fast-check es fijar la semilla en CI mediante `fc.configureGlobal` (una constante en CI, una basada en el tiempo en local) para que las corridas sean repetibles. El costo es que una semilla fija explora siempre el mismo espacio; por eso hace falta la segunda mitad.

| Entorno                  | Semilla                                   | Ejecuciones (propuesta)              | Bloquea merge | Si falla                                               |
| ------------------------ | ----------------------------------------- | ------------------------------------ | ------------- | ------------------------------------------------------ |
| Local (watch y pre-push) | Tiempo; se imprime                        | Por defecto (100) o menos            | No            | El autor repite con `seed` y `path`                    |
| PR (`ci-complete`)       | Fija, definida en la configuración global | Por defecto (100)                    | Sí            | Rojo determinista: se corrige el código o la propiedad |
| Nocturno / semanal       | Aleatoria, registrada en el resumen       | 1.000 a 10.000, con límite de tiempo | No            | Abre un issue con semilla, ruta y contraejemplo        |
| Antes de release         | Aleatoria                                 | Igual que el nocturno                | Opcional (D3) | Se triagea antes de publicar                           |

Flujo de un hallazgo nocturno: el job falla, publica semilla y contraejemplo, abre el issue, y quien lo corrige añade el caso como ejemplo fijo (BP-6). A partir de ahí el PR lo protege con semilla fija.

Una propiedad que falla con semilla fija es un fallo real y repetible; reintentar el job no sirve. Los reintentos automáticos no se configuran para este tipo de test.

## Gates

Los gates habituales protegen la reproducibilidad, el tiempo y la calidad de los generadores; ninguno mide «cuántas propiedades hay».

Esta tabla es una propuesta de diseño basada en las características de fast-check y en la práctica descrita arriba; no es un estándar publicado, y los umbrales se calibran con corridas reales.

| #   | Gate                        | Qué verifica                                                                                               | Dónde         | ¿Bloquea?       |
| --- | --------------------------- | ---------------------------------------------------------------------------------------------------------- | ------------- | --------------- |
| G1  | Ejecución obligatoria       | Las propiedades corren y no se saltan; el agregador falla si el job queda `skipped`                        | PR            | Sí              |
| G2  | Reproducibilidad            | Semilla fija en PR; en cada fallo, semilla y ruta quedan en el resumen del job                             | PR y nocturno | Sí (PR)         |
| G3  | Presupuesto de tiempo       | `timeout-minutes` del job y `timeout` por propiedad asíncrona; límite de tiempo en el nocturno             | PR y nocturno | Sí (PR)         |
| G4  | Pureza                      | Lint que prohíbe `Math.random`, `Date.now` y red en archivos de propiedades                                | PR            | Sí              |
| G5  | Calidad del generador       | Tope de descartes por ejecución (`maxSkipsPerRun`); sin `filter` pesado en revisión                        | PR            | Sí (tope)       |
| G6  | Regresión fijada            | Todo PR que corrige un hallazgo incluye el contraejemplo como ejemplo                                      | PR            | Revisión humana |
| G7  | Exploración profunda        | Corrida con semilla aleatoria y más ejecuciones                                                            | Programado    | No; abre issue  |
| G8  | Eficacia de las propiedades | Mutation testing sobre módulos críticos (por ejemplo Stryker): una propiedad que no mata mutantes es débil | Programado    | Advisory (D4)   |

G6 es el único que una máquina no comprueba bien, así que es el candidato para una casilla en la plantilla de PR; los demás ya los verifican los checks, y no deben repetirse como casillas.

Siguiendo el patrón habitual de adopción: G1 a G5 empiezan como advisory durante 2 a 4 semanas de corridas limpias y luego pasan a bloqueantes; G7 y G8 nunca bloquean el merge.

## Plan por fases

Cinco fases; los gates bloqueantes se activan solo después de corridas limpias, y la exploración nocturna nunca bloquea el merge.

&#91;embedded content: plan por fases · 5 fases, 4 gates\]

Cada rombo es el criterio de salida de la fase anterior; la Fase 2 es donde los gates empiezan a bloquear el merge.

## Criterios de aceptación y métricas

La estrategia se acepta cuando estas pruebas, incluidas las negativas, dan el resultado esperado.

| #   | Caso                                               | Resultado esperado                                               |
| --- | -------------------------------------------------- | ---------------------------------------------------------------- |
| A1  | Propiedad rota a propósito en una rama de prueba   | PR rojo con semilla, ruta y contraejemplo en el resumen          |
| A2  | Repetir el job rojo sin cambios                    | Mismo fallo con la misma semilla                                 |
| A3  | Repetir localmente con `seed` y `path` del resumen | El mismo contraejemplo                                           |
| A4  | Job de propiedades saltado por un `if`             | `ci-complete` rojo                                               |
| A5  | Propiedad que usa `Math.random` o `Date.now`       | Lint rojo                                                        |
| A6  | Generador con demasiados descartes                 | Falla por tope de descartes                                      |
| A7  | Fallo del job nocturno                             | Issue creado con semilla y contraejemplo; el merge no se bloquea |
| A8  | PR que corrige un hallazgo sin añadir el ejemplo   | La revisión lo detecta (G6)                                      |

Métricas, con metas propuestas:

- Fallos de propiedades reproducidos con la semilla impresa: 100%.
- Hallazgos nocturnos convertidos en ejemplo fijo: 100%.
- Tiempo añadido al PR: dentro del presupuesto definido en la Fase 2.
- Corridas del PR que cambian de resultado sin cambiar el código: 0.

## Riesgos y mitigaciones

El riesgo mayor es la falsa confianza: propiedades que pasan siempre porque sus generadores no llegan a los casos peligrosos.

| Riesgo                                                            | Impacto                                              | Mitigación                                                                          |
| ----------------------------------------------------------------- | ---------------------------------------------------- | ----------------------------------------------------------------------------------- |
| Generadores que no cubren casos límite                            | Propiedades verdes sin proteger nada                 | BP-3, ejemplos explícitos y G8 sobre módulos críticos                               |
| Semilla fija explora siempre el mismo espacio                     | Errores que el PR nunca ve                           | Job nocturno con semilla aleatoria (G7)                                             |
| Fallo nocturno sin semilla guardada                               | Hallazgo irreproducible                              | G2: semilla y ruta en el resumen y como artefacto                                   |
| Propiedades lentas                                                | PR más lento, tentación de desactivarlas             | Pocas ejecuciones en PR, G3 y archivos separados                                    |
| Un solo mantenedor                                                | Nadie revisa si el ejemplo de regresión se añadió    | G6 como casilla de plantilla; riesgo aceptado                                       |
| Propiedad que repite la implementación                            | Pasa aunque la regla esté mal                        | Escribir propiedades como regla de negocio, no como copia del código                |
| Cambios de versión de fast-check alteran las secuencias generadas | La semilla fijada deja de reproducir fallos antiguos | Fijar la versión y fijar los fallos importantes como ejemplos, no solo como semilla |

## Decisiones abiertas y fuentes

Cinco decisiones por tomar; D1 y D2 condicionan la Fase 1.

| #   | Decisión                    | Opciones                                                                                           | Recomendación                                    |
| --- | --------------------------- | -------------------------------------------------------------------------------------------------- | ------------------------------------------------ |
| D1  | Integración con vitest      | `fast-check` directo, o el paquete `@fast-check/vitest` (no verificado en las fuentes consultadas) | Empezar directo; evaluar el paquete después      |
| D2  | Módulos del piloto          | Dinero e impuestos, inventario, estados de documentos                                              | Dinero e impuestos: reglas claras y alto impacto |
| D3  | ¿Job de release bloqueante? | Opcional o bloqueante                                                                              | Opcional al inicio                               |
| D4  | Mutation testing (G8)       | Stryker u otra, o no usarlo                                                                        | Probar en un módulo crítico antes de decidir     |
| D5  | Frecuencia del job nocturno | Diaria o semanal                                                                                   | Semanal, según el costo en minutos de Actions    |

### Fuentes

- [Customization of the parameters used to run the properties (fast-check API)](https://fast-check.dev/api-reference/interfaces/Parameters.html): parámetros, valores por defecto y su significado.
- [Shrinking and reproducibility (Tessl, fast-check testing)](https://tessl.io/registry/testland/fast-check-testing/files/references/shrinking-and-reproducibility.md): semilla y ruta, informe de fallo y semilla fija en CI.
- [Property-based testing (OneUptime)](https://oneuptime.com/blog/post/2026-01-25-property-based-testing/view): tipos de propiedades, configuración y qué evitar.
- [fast-check: Property-Based Testing for JavaScript and TypeScript (HelpMeTest)](https://helpmetest.com/blog/fast-check-js-guide/): pruebas con estado, ejecuciones en CI y generadores.

Las páginas de documentación de fast-check sobre configuración global y tutoriales no se pudieron abrir desde esta sesión; lo que dependa de ellas está marcado como propuesta o por verificar.
