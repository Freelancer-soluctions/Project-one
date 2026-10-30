# Snapshot tests (Testing Library) en un pipeline enterprise

Oct 28, 2026 · @Johan

## Resumen

Un snapshot test es útil solo cuando es pequeño, determinista y revisado; en un pipeline enterprise se vuelve un riesgo cuando se actualiza sin leer el diff.

Las fuentes coinciden en cuatro ideas. Primero, el snapshot se trata como código: se commitea y se revisa en el PR ([Vitest](https://vitest.dev/guide/snapshot.html), [Jest](https://jestjs.io/docs/snapshot-testing)). Segundo, en CI nunca se escribe ni se actualiza: Vitest y Jest tratan los snapshots como inmutables cuando detectan CI. Tercero, la causa principal de que fallen como control es el [snapshot grande que nadie lee](https://helpmetest.com/blog/snapshot-testing-pitfalls-best-practices/). Cuarto, para regresión visual real se usan screenshots (Playwright, Chromatic), no snapshots de DOM.

El documento cubre qué es, cuándo usarlo, buenas prácticas, la estrategia en CI/CD, los gates habituales, alternativas y una recomendación para tu stack (React/Vite con vitest y Playwright).

## Qué es un snapshot test con Testing Library

Es una aserción que serializa el DOM renderizado y lo compara con una referencia guardada; si difiere, el test falla y hay que decidir si es un bug o un cambio intencional ([Jest](https://jestjs.io/docs/snapshot-testing)).

Con React Testing Library, `render` devuelve `container` (un `div` que contiene el componente) y `asFragment()`, que entrega un `DocumentFragment` del DOM actual. La [documentación de RTL](https://testing-library.com/docs/react-testing-library/api) usa `asFragment()` con `toMatchInlineSnapshot`, y advierte que `container` no debe usarse para consultar elementos, porque las otras queries resisten mejor los cambios del componente. Un snapshot de DOM **no es** una comparación visual: guarda texto y estructura, no píxeles.

| Matcher                                            | Dónde se guarda                            | Uso típico                                                                                                       |
| -------------------------------------------------- | ------------------------------------------ | ---------------------------------------------------------------------------------------------------------------- |
| `toMatchSnapshot()`                                | Archivo `.snap` junto al test              | Salidas medianas y estables                                                                                      |
| `toMatchInlineSnapshot()`                          | Dentro del propio test                     | Salidas pequeñas; el diff aparece en el mismo archivo ([Vitest](https://vitest.dev/guide/snapshot.html))         |
| `toMatchFileSnapshot()` (Vitest)                   | Un archivo propio, con cualquier extensión | Salidas largas con mejor legibilidad; no apuntar a rutas `.snap` administradas por Vitest                        |
| `toMatchDiffSnapshot()` (librería `snapshot-diff`) | Solo la diferencia entre dos renders       | Comparar el DOM antes y después de un evento ([RTL](https://testing-library.com/docs/react-testing-library/api)) |

## Cuándo usarlos y cuándo no

Un snapshot vale la pena cuando su diff se puede leer de un vistazo; si un cambio real quedaría enterrado en 40 líneas, no protege nada.

| Buen candidato                                        | Mal candidato                                                               |
| ----------------------------------------------------- | --------------------------------------------------------------------------- |
| Componentes pequeños y estables, de salida corta      | Árboles de página completa                                                  |
| Estructuras complejas difíciles de consultar          | Salida con datos dinámicos (fechas, IDs generados, «hace 3 minutos»)        |
| Configuración serializada donde la estructura importa | Valores con significado de negocio, donde `toBe(42)` documenta la intención |
| HTML renderizado en servidor cuando es el contrato    | Mocks y estados duplicados                                                  |
|                                                       | Camino feliz usado en lugar de pruebas de error, vacío e interacción        |

Fuentes: [HelpMeTest](https://helpmetest.com/blog/snapshot-testing-pitfalls-best-practices/) y [QASkills](https://qaskills.sh/blog/jest-snapshot-testing-guide-2026). Jest aclara además que los snapshots **no reemplazan** a los unit tests.

Dos anti-patrones documentados explican casi todos los fracasos:

- **Snapshot grande.** Un snapshot de página de unas 400 líneas produce diffs que nadie revisa, y el desarrollador actualiza al ver que la app «se ve bien». Otro caso citado: un snapshot de 640 líneas con RTL que nadie revisó ([DEV](https://dev.to/srshifu/snapshot-testing-in-react-testing-library-4gkc)).
- **Actualización por reflejo con `-u`.** Convierte el snapshot en un sello de goma, y la única defensa es leer el diff antes de actualizar.

## Buenas prácticas de escritura

El snapshot es código: pequeño, determinista, con nombre que dice el estado y con un límite de tamaño aplicado por herramienta.

1. **Pequeño y enfocado.** Snapshot de componentes, no de páginas. La guía de Jest pide mantenerlos cortos; el artículo de DEV cita a Kent C. Dodds: evitar snapshots enormes y tomar otros más pequeños y enfocados. Si se puede, sustituirlos por aserciones explícitas.
2. **Inline para lo pequeño, archivo para lo grande.** El inline deja el diff junto al test; los árboles largos se leen mejor en un archivo externo ([QASkills](https://qaskills.sh/blog/jest-snapshot-testing-guide-2026)).
3. **Determinista.** Sin datos de plataforma ni valores aleatorios. Fijar fuentes de variación (`Date.now`, IDs con semilla), usar property matchers para campos generados (`expect.any(Date)`) o un serializador ([Jest](https://jestjs.io/docs/snapshot-testing)).
4. **Sin detalles de implementación.** El DOM puede incluir clases con hash de CSS en ámbito; actualizar una librería de UI cambia los snapshots sin que cambie el comportamiento ([DEV](https://dev.to/srshifu/snapshot-testing-in-react-testing-library-4gkc)). Preferir serializar el elemento relevante y no el contenedor completo.
5. **Nombre del estado.** `renders empty cart state with prompt to add items`, no `renders correctly`. Los nombres descriptivos permiten que el revisor detecte un snapshot equivocado.
6. **Límite de tamaño por lint.** La regla `jest/no-large-snapshots` de `eslint-plugin-jest` falla a partir de 50 líneas por defecto, con `maxSize`, `inlineMaxSize` y `allowedSnapshots` como opciones ([regla](https://github.com/jest-community/eslint-plugin-jest/blob/main/docs/rules/no-large-snapshots.md)). Si usas Vitest, confirma si tu plugin ofrece una regla equivalente; no lo verifiqué.
7. **Aserciones explícitas para la lógica.** Si el valor tiene significado, no se esconde en un snapshot.
8. **Auditoría periódica.** Para cada snapshot, preguntar qué regresión detecta que ninguna otra aserción cubre; si no hay respuesta, reemplazarlo por una aserción dirigida (HelpMeTest propone hacerlo cada trimestre).

## Estrategia en CI/CD

En CI el snapshot solo se compara; crearlo o actualizarlo es una acción local, revisada y commiteada por una persona.

1. **Modo inmutable en CI.** Vitest, por defecto, no escribe snapshots cuando `process.env.CI` es verdadero: se comporta como `update: 'none'`, y un snapshot que no coincide, falta o está obsoleto hace fallar la corrida ([config `update`](https://cn.vitest.dev/config/update)). Jest no escribe snapshots nuevos en CI sin `--updateSnapshot`, y `--ci` lo fuerza ([Jest](https://jestjs.io/docs/snapshot-testing), [QASkills](https://qaskills.sh/blog/jest-snapshot-testing-guide-2026)). Escribir en CI exige configurarlo de forma explícita, y no debe hacerse.
2. **`-u` fuera del gate.** Ni el script `test` ni el job del PR usan `-u` o `--update`; actualizar es un comando local deliberado ([QASkills](https://qaskills.sh/blog/jest-snapshot-obsolete-cleanup-ci)).
3. **Commit junto al código.** El snapshot nuevo o cambiado va en el mismo PR y se revisa como parte del code review ([Vitest](https://vitest.dev/guide/snapshot.html)).
4. **Revisión explícita del diff.** Reglas de equipo que propone [HelpMeTest](https://helpmetest.com/blog/snapshot-testing-pitfalls-best-practices/): no aprobar actualizaciones sin leer el diff; pedir al autor que explique cada cambio; rechazar PRs solo de snapshots sin explicación (cita 15 snapshots no relacionados como señal de alarma); investigar fallos en tests ajenos al cambio antes de actualizar; añadir «snapshots revisados y explicados» al checklist del PR.
5. **Entorno determinista.** El snapshot no debe contener datos de plataforma ni no deterministas ([Jest](https://jestjs.io/docs/snapshot-testing)). En CI implica fijar la versión de Node y la zona horaria y el locale; esto último es una recomendación mía, no la encontré en las fuentes.
6. **Limpieza de obsoletos.** Renombrar un test deja huérfano su snapshot. Jest solo poda en corridas de la suite completa, porque una corrida filtrada no sabe si los tests omitidos siguen siendo dueños de sus snapshots. Tampoco conviene escribir snapshots desde shards paralelos ([QASkills](https://qaskills.sh/blog/jest-snapshot-obsolete-cleanup-ci)).
7. **Detección de deriva.** QASkills describe un _drift probe_: ejecutar la actualización en un checkout desechable y fallar si `git diff --exit-code` o archivos sin seguimiento muestran cambios; puede correr programado si la suite es cara.
8. **Propiedad del código (propuesta).** `CODEOWNERS` sobre los archivos de snapshots pide la revisión de quien responde del componente. No encontré una fuente que lo documente, y con un solo mantenedor no añade separación de funciones.

## Gates habituales para snapshots

Siete gates cubren el ciclo; los dos primeros no tienen falsos positivos y pueden ser bloqueantes desde el día uno.

| #   | Gate                          | Qué verifica                                                                                      | Bloquea                                     | Origen                                                                                                                |
| --- | ----------------------------- | ------------------------------------------------------------------------------------------------- | ------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| G1  | Snapshots en modo CI          | Sin escritura; falla si no coincide, falta o está obsoleto (Vitest)                               | Sí                                          | [Vitest `update`](https://cn.vitest.dev/config/update)                                                                |
| G2  | Sin `-u` en el PR             | Ningún script ni job del PR actualiza snapshots (búsqueda de texto en `package.json` y workflows) | Sí                                          | Práctica de [QASkills](https://qaskills.sh/blog/jest-snapshot-obsolete-cleanup-ci); la búsqueda es propuesta mía      |
| G3  | Revisión del diff y checklist | Aprobación humana que lee y explica el cambio                                                     | Sí (aprobación)                             | [HelpMeTest](https://helpmetest.com/blog/snapshot-testing-pitfalls-best-practices/)                                   |
| G4  | Tamaño máximo                 | `no-large-snapshots`: 50 líneas por defecto en Jest                                               | Sí, tras fase advisory                      | [eslint-plugin-jest](https://github.com/jest-community/eslint-plugin-jest/blob/main/docs/rules/no-large-snapshots.md) |
| G5  | Huérfanos                     | Un script sale con error si un `.snap` no tiene test dueño                                        | Sí, tras fase advisory                      | [QASkills](https://qaskills.sh/blog/jest-snapshot-obsolete-cleanup-ci)                                                |
| G6  | Deriva                        | Actualizar en checkout desechable y `git diff --exit-code`                                        | Requerido, o programado si la suite es cara | [QASkills](https://qaskills.sh/blog/jest-snapshot-obsolete-cleanup-ci)                                                |
| G7  | Regresión visual              | Check requerido de Chromatic (`UI Tests`) o reporte de Playwright                                 | Sí, si se usa                               | [Chromatic](https://docs.chromatic.com/docs/storybook)                                                                |

Por tipo: G1, G2, G5 y G6 son implicit gates (código de salida), G4 es un gate de umbral y G3 es humano. Para G4 y G5 conviene tu patrón habitual: advisory de 2 a 4 semanas y luego bloqueante. Ninguna fuente describe un nivel solo-advertencia para snapshots; esa fase la diseñas tú.

## Alternativas y complementos

Para comportamiento se usan aserciones por rol; para apariencia, screenshots, no snapshots de DOM.

| Enfoque                       | Qué compara                         | Cuándo                       | Cuidado                                                                                                                                                                                                 |
| ----------------------------- | ----------------------------------- | ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Aserciones por rol            | Comportamiento visible              | Por defecto                  | Queries en orden: `getByRole`, `getByLabelText`, `getByText`; `getByTestId` solo como último recurso ([Reintech](https://reintech.io/blog/javascript-testing-library-dom-testing-best-practices))       |
| Snapshot de DOM               | Texto y estructura serializados     | Salidas pequeñas y estables  | Secciones 3 y 4                                                                                                                                                                                         |
| Playwright `toHaveScreenshot` | Imagen contra baseline por proyecto | Pantallas críticas en E2E    | Fuentes y antialiasing cambian entre SO; usar Docker; máscaras para datos dinámicos; `animations: 'disabled'` ([Playwright](https://www.mintlify.com/microsoft/playwright/advanced/visual-comparisons)) |
| Chromatic o Argos (hospedado) | Imágenes con baselines en la nube   | Muchas pantallas o Storybook | Check requerido en el PR, aceptar o denegar cada cambio; Chromatic necesita el historial completo de git ([Chromatic](https://docs.chromatic.com/docs/storybook))                                       |

Tres reglas de la regresión visual con Playwright, según [Argos](https://argos-ci.com/blog/playwright-visual-regression-testing-ci): generar y comparar baselines en un solo entorno (imagen Docker fijada); empezar con cero píxeles de diferencia y preferir máscaras antes que subir la tolerancia; revisar los PNG en un diff de git es débil, porque no hay deslizador ni superposición, y la aprobación se vuelve rutina. Además, los PNG se reescriben con cada cambio de UI y engordan el repositorio.

## Recomendación para tu stack

Para React/Vite con Vitest y Playwright, usa pocos snapshots pequeños, bloquea en CI desde el día uno y trata el resto como gates por fases.

1. **Por defecto, aserciones por rol.** Snapshot solo para componentes pequeños de salida estable y configuración serializada, con un tope orientativo de 50 líneas.
2. **Vitest con inline para lo corto.** En CI, `vitest run` con `CI` verdadero entra en modo `none`; GitHub Actions define `CI=true` por defecto (dato general, no sacado de las fuentes).
3. **Prerrequisito: reactivar los tests.** En tu `ci.yml` actual los tests tienen `if: false`, así que ningún gate de esta lista corre hasta reactivarlos (es la Fase 0 del PRD del early-abort).
4. **Orden de adopción.** Día uno: G1 y G2. Advisory de 2 a 4 semanas: G4 y G5, luego bloqueantes. G6 semanal si la suite lo permite.
5. **Checklist del PR.** Una casilla «snapshots revisados y explicados» sí tiene sentido, porque ninguna máquina la verifica, a diferencia de DCO o del título del PR.
6. **Regresión visual con medida.** `toHaveScreenshot` en pocas pantallas críticas del E2E y con imagen Docker fijada. Chromatic solo si adoptas Storybook.
7. **Con un solo mantenedor,** `CODEOWNERS` no separa funciones: la defensa son los gates automáticos y el checklist.

¿El runner es Vitest en todo el repo? La plantilla de PR menciona vitest; si hubiera Jest en algún paquete, el equivalente de G1 es `--ci`.

## Fuentes

Oficiales o de los proyectos:

- [Vitest: Snapshot](https://vitest.dev/guide/snapshot.html) y [Vitest: opción `update`](https://cn.vitest.dev/config/update) (copia en el sitio chino de Vitest)
- [Jest: Snapshot Testing](https://jestjs.io/docs/snapshot-testing)
- [React Testing Library: API](https://testing-library.com/docs/react-testing-library/api)
- [eslint-plugin-jest: no-large-snapshots](https://github.com/jest-community/eslint-plugin-jest/blob/main/docs/rules/no-large-snapshots.md)
- [Chromatic para Storybook](https://docs.chromatic.com/docs/storybook)
- [Playwright: comparaciones visuales](https://www.mintlify.com/microsoft/playwright/advanced/visual-comparisons) (copia en Mintlify)

Artículos de terceros (menos autoridad):

- [HelpMeTest: pitfalls y buenas prácticas](https://helpmetest.com/blog/snapshot-testing-pitfalls-best-practices/)
- [QASkills: guía de Jest](https://qaskills.sh/blog/jest-snapshot-testing-guide-2026) y [limpieza de obsoletos en CI](https://qaskills.sh/blog/jest-snapshot-obsolete-cleanup-ci)
- [DEV: snapshot testing en RTL](https://dev.to/srshifu/snapshot-testing-in-react-testing-library-4gkc)
- [Reintech: buenas prácticas de Testing Library](https://reintech.io/blog/javascript-testing-library-dom-testing-best-practices)
- [Argos: regresión visual con Playwright en CI](https://argos-ci.com/blog/playwright-visual-regression-testing-ci)

### Sin verificar

- Si Jest hace **fallar** la corrida por snapshots obsoletos con `--ci`: la fuente consultada no lo aclara; compruébalo en tu versión.
- Una regla equivalente a `no-large-snapshots` para Vitest.
- La página de Jest no documenta el flag `--ci` ni los obsoletos; esos puntos vienen de QASkills.
- La cita de Kent C. Dodds viene del artículo de DEV; no pude abrir su blog.
