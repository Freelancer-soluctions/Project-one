# Design

## Contexto

El change `ci-testing-pipeline-reactivation` (archivado el 2026-10-03) reactivó los jobs de testing de STAGE 2 en
FASE 1 advisory: ejecutan, publican artefactos y anotan el PR, pero con `continue-on-error: true` su fallo se absorbe
a nivel de job — el flag estaba en `test-unit-client` (`ci.yml:471`), `test-unit-server` (`:767`),
`client-coverage` (`:1056`), `server-coverage` (`:1149`) y `property-tests` (`:1220`); `test-integration` (`:2100`) y
`test-smoke` (`:2207`) no lo llevan. Su propio diseño (dibujo D1/D12) era explícito: la promoción a FASE 2 exige una
ventana de calibración previa. Sin esa ventana, el primer flake de infraestructura se convierte en un rojo sostenido
que el equipo aprende a ignorar — exactamente el fallo que `ci-shifting-left` ya intentaba evitar con el fallback de
hooks deshabilitables.

Por eso el trabajo se dividió. Una ventana de calibración no es código pendiente: es un periodo de observación con
decisiones que dependen de datos que solo GitHub produce (duración real de job, triaje de fallos reales, artifacts de
14 días para la métrica de flakiness).

## Decisiones

**D1 — La ventana de calibración es un change, no una tarea de un change.**

_Alternativa descartada:_ mantener el change abierto 2-4 semanas. Se descartó porque un change visible como
incompleto durante semanas se mezcla con el trabajo siguiente en la cabeza del equipo y en el debug: cuando un PR
rojo aparezca dos meses después, no hay forma de saber si venía de P0, de P1 o de la promoción.

_Consecuencia:_ `ci-testing-pipeline-reactivation` se archiva con P0/P1/grupo 8 verificados y este change conserva
lo que necesita tiempo y GitHub.

**D2 — La promoción es un único PR, no uno por job.**

Quitar `continue-on-error` en commits separados dejaría el repo en un estado intermedio donde algunos jobs bloquean
y otros no, sin ninguna propiedad útil. Además el `needs` del agregador es transitivo: un PR único hace imposible
que se mergee a medias.

**D3 — El triaje de fallos distingue tres causas y no permite "reintentar en silencio".**

- Test rojo → corregir el test. Un test que se desactiva a sí mismo y pasa solo no es flaky, es un test mal escrito.
- `timeout-minutes` insuficiente → ajustarlo con la duración medida (D5).
- Infraestructura → corregir la infra.

La cuarta opción —subir retries para que pase— queda explícitamente prohibida en la capa de tests: `apps/server/vitest.config.js`
ya usa `retry: 2` solo en CI y `e2e/playwright.config.js` `retries: 2` en CI, pero esos retries existen **para que
el reporte exponga el flakiness** (spec `ci-flaky-retry`), no para ocultarlo. Subirlos para silenciar un fallo
destruye la métrica semanal, que es justo lo que permite distinguir un test mal escrito de uno realmente intermitente.

**D4 — El guard de cero tests del hook usa el reporter JSON y cae a la suite completa.**

`.husky/pre-push` delega en `scripts/ci/pre-push-tests.mjs`: el runner elimina cualquier JSON residual, ejecuta
`test:changed` con el reporter JSON y comprueba `numTotalTests`. Si la selección ejecutó cero tests o falta/no se
puede parsear el reporte, cae a `test:unit` completo y muestra el motivo. Si la corrida scoped falla, el fallo se
propaga tal cual y no se oculta tras un segundo run; si falla el fallback, también bloquea el push.

_Alternativa descartada:_ un flag propio en cada script de workspace. El JSON estándar informa del número realmente
ejecutado y evita mantener otra señal en paralelo.

**D5 — Los timeouts se ajustan con datos, no con intuición.**

`timeout-minutes` de cada job se compara contra la duración observada en la ventana. Solo se sube si la duración
medida se acerca al límite; subirlo "por si acaso" convierte un fallo de infra en un job de 15 minutos que tampoco
da información.

**D6 — La evidencia de la ventana se registra en este change, no en el PR de promoción.**

`ci-testing-pipeline-reactivation` tarea 3.2 lo pedía en su propio `tasks.md`. Al dividir, la evidencia viene aquí.
Se conserva el formato: workspace, job, duración, número de corridas y desviación típica.

**D7 — Un gate bloqueante tiene que poder estar en verde antes de bloquear (pasos 1 y 3; reparación aplicada).**

La medición del 2026-10-28 encontró que el gate estricto de cobertura del client ya está en rojo HOY, con los jobs
todavía advisory: `node scripts/ci/check-coverage.mjs apps/client` → EXIT=1, 27 breaches per-file en `src/hooks/**`
(`useFetch.js` 0%, `useLoadingState.js` 0%, `useUserSettings.js` 7.14%, `MentionCountProvider.jsx` 6.66%,
`useInitializeI18n.js` 16.66%, `useQueryData.js` 25%, `useSocket.js` 28.57%) contra los umbrales
39.1/44.31/40.35/36.07 de `apps/client/vitest.config.js:81-87`; el agregado de `src/hooks/**` pasa por 0.01-0.04 pts
(39.11 vs 39.1). El server pasa (EXIT=0), pero sus globs `src/utils/multer/**` (`apps/server/vitest.config.ts:79-85`)
y `src/modules/security/**` (`:93-99`) exigen 100% a 0 ficheros instrumentados (warning `no files matched`,
medido 2026-10-28) — umbrales incondicionales e inverificables. Quitar `continue-on-error` en ese estado dejaría
cada PR con el agregador de la cadena en rojo por cobertura rota pre-existente, no por un test rojo: el mismo
"rojo que no significa nada" que el grupo 0 corrigió para los mocks.

_Reparación del umbral `src/hooks/**` — dos caminos:_ **(A)** re-baseline con tests hasta los umbrales (preferido; es el
orden de adopción del PRD `PRDS/Unit-tests-en-CI-CD-estrategias-prácticas-y-gates-enterprise.md` línea 96: "tests en
verde y tests que corrieron, luego ... umbrales por módulo crítico"); **(B)** bajar el umbral con justificación
registrada en el PR que lo mueve — el PRD lo lista como anti-patrón ("Bajar el umbral para que pase. Si el umbral
se mueve, queda registrado en el PR que lo mueve, con justificación", línea 190), permitido solo si queda documentado.
Camino de los globs muertos del server: añadir tests que los importen (los hace verificables) o retirar los umbrales
(dejan de prometer nada). Elegir umbral bajo sin tests y sin registro sería peor que el problema: el gate diría
"100%" sobre algo que nadie mide.

**D8 — El enforcer per-file es uno, y la documentación dice lo que el motor hace (paso 2; decisión aplicada).**

Vitest 4.1.11 **no implementa** `perFile` declarado dentro de un glob: `checkThresholds`
(`node_modules/vitest/dist/chunks/coverage.DM_a_rWm.js:857-866`) decide per-file leyendo SOLO
`this.options.thresholds?.perFile` (top-level), y `resolveGlobThresholds` (`:1023-1036`) descarta `perFile` del glob
al reducirlo a `{lines, branches, functions, statements}`. Consecuencia medida: Vitest evalúa los globs en AGREGADO
(y el agregado de `src/hooks/**` pasa) mientras `scripts/ci/check-coverage.mjs:344` evalúa por fichero (27 breaches,
EXIT=1) → **dos evaluadores con veredictos distintos sobre la misma config**. Además, el comentario
`apps/client/vitest.config.js:59-61` afirma que "los globs NO heredan el perFile de nivel superior: hay que
declararlo en cada uno" — el motor no lo hace —, y el docstring `scripts/ci/check-coverage.mjs:9-12` promete
"mirrors Vitest 4's own threshold semantics so the two can never disagree" — falsa en el eje per-file.

_Dos caminos:_ **(a)** declarar `perFile: true` top-level en `thresholds` — Vitest pasa a evaluar per-file, PERO el
eje se aplica a TODA entrada de thresholds, incluida la global (`checkThresholds` se itera sobre todas las entradas
de `allThresholds` con el mismo flag), así que los umbrales globales (64.44/42.11/52.22/64.82 del client) pasarían a
exigirse fichero a fichero — un cambio de comportamiento mucho más agresivo que el objetivo; **(b)** declarar
`check-coverage.mjs` como ÚNICO enforcer per-file y quitar la promesa de simetría del docstring, corrigiendo a la vez
el comentario del config para que describa lo que el motor realmente hace. La corrección documental es común a los
dos caminos y es requirement del delta: un comentario que miente sobre el motor se repite en el próximo cambio.

**D9 — Reparar antes de promover; la ventana observa el estado objetivo, sujeto a prerrequisitos de CI.**

La secuencia local es reparación (pasos 1-3, grupo 0ter, cerrado) → confirmar en CI el prerrequisito 0bis.6
(integration/smoke verdes, runs 40263036010 y 40263939374 del 2026-10-26) → quitar `continue-on-error` de los 5
jobs y comprobar topología/veredicto del agregador (grupo 3, implementado 2026-10-29) → ventana de calibración
(grupo 1) sobre el estado promovido → cierre. La reparación y los guards locales están implementados, y los cambios
de workflow que activan la promoción se aplicaron el 2026-10-29 con la evidencia requerida en CI; quedan abiertos
la ventana de calibración (grupo 1) y las verificaciones 3.V/4.V/5.V. El triaje D3 y el registro de duraciones D5/D6
aplican a los jobs ya promovidos.

_Tensión explícita con el PRD (decisión del usuario: se mantiene la inversión)._ El PRD
`PRDS/Unit-tests-en-CI-CD-estrategias-prácticas-y-gates-enterprise.md` prescribe "Cobertura advisory 2 a 4 semanas,
luego bloqueante" en L86, repite el mismo patrón en L201 ("Cobertura advisory 2 a 4 semanas, luego bloqueante") y
cierra el orden de trabajo en L206 con "... añadir cobertura en modo advisory y, cuando esté estable, pasarla a
bloqueante". Este change invierte esa secuencia para la cobertura: promueve sin haber calibrado el estado advisory.
Se descarta la alternativa (esperar la ventana advisory del PRD) por dos motivos: (1) calibrar un estado advisory
que muere con el propio PR de promoción produce datos inútiles — la ventana mediría un estado que ya no existe;
(2) el grupo 0ter solo repara la capa de cobertura (globs muertos, per-file, breaches), no el flakiness, que es lo
que la ventana advisory del PRD pretende estabilizar; esperar esa ventana antes de reparar dejaría el rojo de
cobertura intacto 2-4 semanas. Lo que se conserva del PRD es el espíritu: nada promueve sin haber estado en verde
primero (D7).

_Rollback del PR (decisión del usuario: registrado, no pendiente)._ Si la tasa de flakes de la ventana lo exige, la
promoción se revierte **por job**: reponer `continue-on-error: true` en el job que lo necesite, con causa registrada
en la evidencia de 1.3 — análogo al rollback documentado del FASE 2 de SAST (`ci.yml:415-416`: "reponer
`continue-on-error: true` y quitar `sast` de `prebuild-governance-complete.needs`"). El rollback es una decisión
explícita de la ventana (grupo 1), nunca un fallback silencioso; la task 3.5 lo deja registrado.

_Consecuencia (decisión del usuario: rojo visible, no merge bloqueado)._ Durante la ventana, un fallo real deja en
ROJO el check del job y el agregador de su cadena (`prebuild-tests-complete` o `postbuild-tests-complete` →
`ci-complete`) — rojo visible en el PR. **No** bloquea el merge: el ruleset 21227644 exige 2 contextos, ninguno de
tests (API 2026-10-28), y bindear `CI Complete` (o los agregados de testing) es un change futuro de gobernanza
(`tasks.md` 3.4; precedente body-lint FASE 3, `docs/CONTEXT-CICD.md` §3.2/§5.1, Regla 8: renombrar rompe el
binding). Mientras ese binding no exista, el grupo 0ter asegura que la capa de cobertura al menos nace verde.

## Riesgos

| Riesgo                                                                                                                    | Mitigación                                                                                                                                                          |
| ------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Un flake de infraestructura en la ventana deja el agregador de la cadena en rojo                                          | `timeout-minutes` con holgura sobre la duración medida (D5); el triaje separa infra de test; rollback por job (D9)                                                  |
| El rojo visible se normaliza y se ignora (el merge no está bloqueado)                                                     | Por eso la ventana es obligatoria, el triaje D3 es por corrida y la evidencia 1.3 es obligatoria; el binding futuro (tasks 3.4) decidirá si el rojo pasa a bloquear |
| Regresión silenciosa: el job deja de correr y sigue verde                                                                 | El guard de cero tests (D4) + verificación 3.V con un test rojo deliberado                                                                                          |
| La promoción se mergea sin evidencia                                                                                      | `docs/learning/quality-gates.md` en lockstep es requirement del delta, no una nota                                                                                  |
| El client está en rojo de cobertura al quitar `continue-on-error` → el agregador nace en rojo por una deuda pre-existente | El grupo 0ter cierra ANTES del grupo 3 (D7); 0ter.V exige EXIT=0 en strict para ambos workspaces                                                                    |
| Un comentario/docstring de per-file miente sobre el motor → el próximo cambio repite el error                             | Corrección documental en lockstep con la decisión D8, scenario del delta                                                                                            |

## Open Questions

1. **Camino del umbral `src/hooks/**`del client (D7):** re-baseline con tests (A) o baja documentada (B). El
diseño prefiere A; la elección final es del usuario al implementar y queda registrada en`tasks.md` 0ter.2.
2. **Enforcer per-file (D8):** `perFile` top-level de Vitest (a) — con la consecuencia de aplicar el eje per-file a
   los umbrales globales — o `check-coverage.mjs` como único enforcer (b). El diseño documenta las consecuencias de
   ambas; la corrección del comentario `apps/client/vitest.config.js:59-61` y del docstring
   `scripts/ci/check-coverage.mjs:9-12` es común a las dos. Recomendación: (b), por menor blast radius.
3. **Secuencia (D9):** la ampliación pone la ventana de calibración DESPUÉS de quitar `continue-on-error`
   (calibrar el estado objetivo). Si se prefiere el orden histórico (calibrar en advisory y promover al cerrar la
   ventana), basta ejecutar el grupo 1 antes del grupo 3 — los grupos no cambian de número, solo de orden.
