# PRD — Simplificación del PR Body Lint y la plantilla de PR

Oct 23, 2026 · @Johan

## Resumen y problema

El PR Body Lint ocupa unas 500 líneas para exigir tres secciones, una referencia a issue y una casilla; este PRD lo reduce a unas 60 líneas de lógica sin perder los controles que sí protegen.

Hoy la política mide **longitud** (mínimos de 40 y 20 caracteres), no calidad: un Summary de `aaaaaaaaaaaaaaaaaaaa` pasa. Para cubrir casos que un PR real casi nunca produce, el script normaliza en seis pasos, enmascara bloques de código y resuelve secciones duplicadas. Además, la plantilla pide marcar a mano tres casillas que DCO, PR title lint y CI ya verifican. Cada regla extra es código que hay que testear y mantener, y hay un solo mantenedor.

El PRD define qué se conserva, qué se elimina, cómo queda la plantilla y dos verificaciones pendientes del workflow: el trigger `edited` y el issue vinculado por API.

## Objetivos y no-objetivos

El éxito se mide en menos código con los mismos controles reales.

| #   | Objetivo                                    | Meta (propuesta)                                                                   |
| --- | ------------------------------------------- | ---------------------------------------------------------------------------------- |
| O1  | Reducir el script de política               | ≤ 80 líneas de lógica, sin contar comentarios ni tests                             |
| O2  | Conservar los controles con valor           | Issue referenciado, `Closes #` sin número rechazado, secciones clave con contenido |
| O3  | Quitar casillas redundantes de la plantilla | 3 casillas menos (DCO, título, tests)                                              |
| O4  | Que editar el cuerpo relance el check       | Evento `edited` verificado en el trigger                                           |
| O5  | Validar el issue por lo que GitHub vincula  | Consulta a `closingIssuesReferences` en lugar de regex                             |

**No-objetivos:** juzgar la calidad semántica del texto (eso es revisión humana); cambiar el nombre del check `Governance: PR Body Lint`, que el ruleset 21227644 referencia; tocar DCO, PR title lint o CI; cambiar el manejo de bots, el checkout desde el base ref o el no-op de `merge_group`.

## Estado actual

De unas 510 líneas, solo una parte pequeña aplica reglas de negocio; el resto es infraestructura de casos límite y reporte.

| Componente                                                         | Líneas (aprox.) | ¿Aporta valor real?                                               |
| ------------------------------------------------------------------ | --------------- | ----------------------------------------------------------------- |
| Cabecera, constantes y helpers                                     | 1–81            | Parcial: documenta, pero repite el spec                           |
| `normalize`: pipeline de 6 pasos                                   | 83–115          | Bajo: solo existe para medir longitud                             |
| `computeFenceMask`: ignora encabezados dentro de bloques de código | 117–154         | Bajo: caso casi inexistente en un PR                              |
| `splitSections`: secciones, duplicados, primera gana               | 156–221         | Medio: separar secciones sí hace falta; los duplicados no         |
| `evaluateBody`: reglas R1–R5                                       | 237–378         | Medio: valen R2b, R2c y R3; sobran R1, R2a por longitud, R4 y R5  |
| `buildReport`, `writeReport`, `renderSummary`                      | 380–447         | Bajo: `report.json` y artefacto de 14 días para un check de texto |
| `evaluate`: wrapper con `core` y `context`                         | 449–508         | Alto: separa error de herramienta de violación de política        |

El job del workflow sí es sólido: lee la política del base ref, toma el cuerpo de `context.payload` y no de `${{ }}`, excluye bots por autor y deja un no-op para `merge_group`.

## Requisitos de la política reducida

La política conserva tres controles y elimina los que miden longitud o casos límite.

| Regla actual                          | Decisión    | Cómo queda                                                                                     |
| ------------------------------------- | ----------- | ---------------------------------------------------------------------------------------------- |
| R1: total ≥ 40 caracteres             | Eliminar    | Lo cubre «las secciones clave no están vacías»                                                 |
| R2a: Summary ≥ 20 caracteres          | Simplificar | Sección presente y con texto que no sea solo comentario ni placeholder                         |
| R2b: Related Issue                    | Conservar   | Debe haber un issue vinculado (ver W3)                                                         |
| R2c: How Has This Been Tested?        | Conservar   | Texto o al menos una casilla marcada                                                           |
| R3: `Closes #` sin número             | Conservar   | Se evalúa sobre el cuerpo sin comentarios HTML, porque la guía de la plantilla trae `Closes #` |
| R4: ninguna casilla marcada (warning) | Eliminar    | La plantilla ya no tiene casillas que atestigüen otros gates                                   |
| R5: sin `#N` (warning)                | Eliminar    | Duplica R2b                                                                                    |

Requisitos de implementación:

1. **RP-1.** «Vacío» significa que, tras quitar comentarios HTML, casillas sin marcar y `Closes #` sin número, no queda texto.
2. **RP-2.** Las secciones se localizan con una sola expresión regular sobre encabezados `##`: sin normalización de seis pasos, sin máscara de bloques de código y sin tratamiento de duplicados.
3. **RP-3.** Cada fallo nombra la regla y la sección, para que el autor sepa qué editar.
4. **RP-4.** Los errores de herramienta (API caída, payload ausente) se siguen reportando como `TOOLING ERROR`, distintos de una violación de política.
5. **RP-5.** El resultado se publica en el Step Summary; `report.json` y el artefacto de 14 días se retiran salvo que D2 decida lo contrario.

## Requisitos de la plantilla de PR

La plantilla deja casillas solo para lo que ninguna máquina verifica.

| Casilla actual (Pre-merge Checklist)             | Quién ya lo verifica | Acción    |
| ------------------------------------------------ | -------------------- | --------- |
| `Signed-off-by` presente en todos los commits    | Check de DCO         | Quitar    |
| Tests pasan localmente                           | CI (`ci-complete`)   | Quitar    |
| El título sigue Conventional Commits             | PR title lint        | Quitar    |
| Documentación actualizada (si aplica)            | Nadie                | Conservar |
| Sin breaking changes (o documentados en Summary) | Nadie                | Conservar |

Requisitos:

- **RT-1.** El checklist queda con las dos casillas que se conservan. Las secciones `Summary`, `Related Issue` y `How Has This Been Tested?` no cambian, porque el lockstep test las exige como encabezados `##`.
- **RT-2.** La guía `docs/learning/dco.md` y el hook `prepare-commit-msg` siguen existiendo; solo se quita la casilla del PR.
- **RT-3.** Un comentario HTML en la plantilla indica que firma, título y tests los verifican los checks del PR, para que nadie los busque en el cuerpo.

## Requisitos del workflow

El workflow debe relanzarse al editar el cuerpo y validar el issue por lo que GitHub realmente vincula.

1. **W1. Trigger `edited`.** El fragmento revisado no muestra el bloque `on:`. Debe incluir `pull_request` con `types: [opened, edited, synchronize, reopened]` y `merge_group`. Sin `edited`, corregir el cuerpo no relanza el check. «Re-run jobs» reutiliza el payload original, con el cuerpo viejo, así que la forma de arreglar un PR rojo es editar el cuerpo, no re-ejecutar.
2. **W2. Concurrencia.** Un grupo por PR con `cancel-in-progress: true`, para que ediciones seguidas no dejen corridas viejas compitiendo por el resultado.
3. **W3. Issue por API.** Consultar `closingIssuesReferences` del PR por GraphQL desde `github-script`. Es lo que GitHub usará para cerrar el issue y evita falsos positivos como `#123` dentro de un bloque de código. Usa el permiso `pull-requests: read` que el job ya tiene. Si la llamada falla, el job falla como `TOOLING ERROR`.
4. **W4. Se conserva** el checkout de la política desde el base ref (un PR no puede reescribir al juez), el cuerpo leído de `context.payload`, la exclusión de bots por autor, el no-op de `merge_group` y el nombre `Governance: PR Body Lint`.
5. **W5. Actions por SHA.** `checkout`, `github-script` y `upload-artifact` hoy van por tag (`@v5`, `@v9`, `@v7`). Se fijan por SHA, alineado con el PRD de supply chain.

## Criterios de aceptación y pruebas

El cambio se acepta cuando pasan estos casos, incluidos los negativos, y el script cumple O1.

| #   | Caso                                                                   | Resultado esperado                           |
| --- | ---------------------------------------------------------------------- | -------------------------------------------- |
| A1  | Cuerpo vacío                                                           | Falla                                        |
| A2  | Summary con solo un comentario HTML                                    | Falla                                        |
| A3  | `Closes #` sin número                                                  | Falla por R3                                 |
| A4  | Summary de una línea real, issue vinculado, pruebas descritas          | Pasa                                         |
| A5  | `#123` escrito solo dentro de un bloque de código, sin issue vinculado | Falla: la API no devuelve issue              |
| A6  | PR rojo; se edita el cuerpo y se corrige                               | El check se relanza solo y pasa              |
| A7  | PR de Dependabot                                                       | Check omitido (autor Bot)                    |
| A8  | Entrada de merge queue                                                 | No-op en verde                               |
| A9  | API de GitHub no disponible                                            | Falla con `TOOLING ERROR`, no como violación |

Métricas, con metas propuestas:

- Líneas de lógica del script: ≤ 80 (hoy \~510 con comentarios y reporte).
- Casillas manuales en la plantilla de checklist: 2 (hoy 5).
- Falsos rojos por trigger que no relanza: 0.

## Plan de migración por fases

Cuatro fases pequeñas, cada una con su criterio de salida; el nombre del check no cambia, así que el ruleset no se toca.

1. **Fase 0 — Trigger.** Verificar y completar `on:` con `edited` y `merge_group`, más concurrencia (W1, W2). Salida: editar el cuerpo de un PR de prueba relanza el check (A6).
2. **Fase 1 — Plantilla.** Quitar las tres casillas redundantes y añadir el comentario de RT-3. Salida: el lockstep test sigue verde y el checklist tiene 2 casillas.
3. **Fase 2 — Script reducido.** Reescribir la política según RP-1 a RP-5 y portar solo los tests de las reglas que se conservan. Salida: A1 a A4, A7 a A9 en verde y ≤ 80 líneas de lógica.
4. **Fase 3 — Issue por API.** Sustituir la regex de R2b por `closingIssuesReferences` (W3) y fijar las actions por SHA (W5). Salida: A5 en verde.

**Reversión:** cada fase es un PR independiente; `git revert` devuelve el comportamiento anterior sin tocar el ruleset.

## Riesgos y mitigaciones

El riesgo principal es que, sin mínimos de longitud, un cuerpo trivial pase; ningún check mide calidad, así que se acepta.

| Riesgo                                                                       | Impacto                                        | Mitigación                                                                          |
| ---------------------------------------------------------------------------- | ---------------------------------------------- | ----------------------------------------------------------------------------------- |
| Cuerpos triviales («n/a») pasan sin los mínimos de caracteres                | Menos información en el PR                     | Riesgo aceptado: la calidad la juzga la revisión; el check solo detecta lo vacío    |
| La reescritura introduce regresiones sin el corpus de pruebas actual         | Falsos verdes o rojos                          | Portar los casos que corresponden a R2b, R2c y R3 antes de borrar el código viejo   |
| `closingIssuesReferences` puede tardar en reflejar un vínculo recién editado | Falso rojo justo después de editar             | Probarlo en la Fase 3; si ocurre, un reintento corto antes de fallar                |
| Las palabras clave de cierre solo funcionan hacia la rama por defecto        | PRs a ramas release no vinculan                | Hoy todos los PR van a `main`; revisar si aparecen ramas release                    |
| Fallo o límite de la API de GitHub                                           | Check rojo ajeno al autor                      | Mensaje `TOOLING ERROR` distinto de una violación; el autor puede relanzar editando |
| Cambiar el nombre del job                                                    | Merge bloqueado esperando un check inexistente | El nombre queda congelado; hay prueba de que coincide con el ruleset                |
| Autor que usa Re-run jobs y no ve cambios                                    | Confusión                                      | Documentarlo en la guía de contribución y en el mensaje del check                   |

## Decisiones abiertas

Cinco decisiones por tomar; ninguna bloquea las Fases 0 y 1.

| #   | Decisión                    | Opciones                                                              | Recomendación                                                                             |
| --- | --------------------------- | --------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| D1  | Dónde vive la política      | Script en `scripts/ci` o inline en el workflow                        | Script: el workflow del PR lo puede modificar el propio PR, el script se lee del base ref |
| D2  | Reporte de triage           | Mantener `report.json` y artefacto de 14 días, o solo Step Summary    | Solo Step Summary: el mensaje ya nombra regla y sección                                   |
| D3  | PRs sin issue (docs, chore) | Exigir siempre issue, o permitir `N/A` con una frase de justificación | Decidir según cuántos PR de ese tipo haya; hoy la plantilla dice que es obligatorio       |
| D4  | Issue vinculado             | Solo API, o API con regex como respaldo                               | Solo API, para no mantener dos caminos                                                    |
| D5  | Fijar actions por SHA       | Ahora, o junto con el PRD de supply chain                             | Ahora en este flujo, porque ya se toca el workflow                                        |
