# Design

## Context

Estado verificado en el repo (no asumido), 2026-10-30:

- **El tripwire no bloquea en el camino real de un PR.** En un PR acotado a un workspace,
  `test-unit-client` / `test-unit-server` corren en modo TIA diff-scoped (`scope=changed`), así que
  `client-coverage` / `server-coverage` invocan `scripts/ci/check-coverage.mjs --advisory`, que
  imprime los números y **sale con `exit 0`**: el piso no se evalúa. Sólo se evalúa —y bloquea—
  cuando el scope es `full` (cambio en rutas `shared`, `origin/main` no resoluble, o el fallback D7
  de cero tests).
- **La única corrida de suite completa garantizada tampoco bloquea.** `nightly-full-suite.yml`
  (cron `40 2 * * *`) corre la suite completa de ambos workspaces y evalúa el piso con
  `node scripts/ci/check-coverage.mjs … || echo "::warning::…"` (líneas 122-123 y 201-202): el
  fallo se traga y el workflow sale verde. Es un workflow **separado** de `ci.yml`, así que su
  veredicto no puede propagar al agregador de tests de un PR.
- **La granularidad es por forma de área, no por criticidad de negocio.** Los globs del server son
  `src/modules/**/schemas/**` (22 schemas Joi al 100%), `src/utils/constants/**` y
  `src/utils/pagination/**`: áreas que ya estaban al 100%. En paralelo, `auth` (6 ficheros),
  `permission` (6), `users` (7), `payroll` (6), `sales` (6), `inventoryMovement` (6), `stock` (6),
  `warehouse` (6) y `expenses` (6) suman **55 ficheros fuente con cero tests unitarios** (ningún
  `*.unit.test.ts` en los 9 módulos) y sin piso propio: su cobertura sólo cuenta en el agregado.
- **El invariante "el piso sólo sube" es una convención, no una propiedad.** `npm run coverage:ratchet`
  (`scripts/ci/coverage-ratchet.mjs`) delega la garantía en el `autoUpdate` de Vitest, que sólo
  reescribe el config **cuando la cobertura actual supera la configurada**: nada detecta una
  **bajada manual**. Ya ha pasado: el piso global del client bajó de `87.02/62.16/69.14/87.7` a
  `64.44/42.11/52.22/64.82` (excepción documentada en `client-snapshot-testing`, 2026-10-09) y el
  server está hoy en `60.8/64.48/64.81/61.49` con **tres** globs.
- **El doc canónico describe floors que ya no existen.** `docs/learning/coverage-tripwire-floor-ratchet.md`
  §3.3 sigue citando los números antiguos del client (`87.02/…`, línea 150) y del server
  (`42.28/21.75/8.98/42.76` "con cinco globs", línea 169) cuando la config real tiene otros valores
  y tres globs. Las cifras están escritas a mano: nada las verifica contra la config.
- **Mutation testing queda fuera de esta entrega.** Aunque la cobertura mide ejecución y no fuerza de
  aserción, añadir la herramienta, configuración o ejecución programada se difiere a Change B.
- **Infraestructura reutilizable ya presente:** `scripts/ci/check-coverage.mjs` es el único
  evaluador (lee `config.test.coverage.thresholds` + `coverage-summary.json`, exit 0/1/2, con
  `--advisory` = D18); `scripts/ci/coverage-check.mjs` es el espejo local de suite completa;
  `scripts/ci/coverage-ratchet.mjs` es la acción local de subida. El agregador
  `prebuild-tests-complete` (`ci.yml`) hoy consume 5 `needs` (`test-unit-client`,
  `test-unit-server`, `client-coverage`, `server-coverage`, `property-tests`), todos bloqueantes
  desde 2026-10-29.

Ver `proposal.md` para la motivación y el alcance.

## Goals / Non-Goals

**Goals:**

- Que exista **un punto de enforcement de suite completa cuyo veredicto sea bloqueante** dentro del
  pipeline de PR, de modo que el tripwire deje de ser un informe.
- Que el nivel de granularidad exprese **criticidad de negocio** (camino crítico) y no forma del
  código, con los floors **declarados, versionados y evaluados** por el guard.
- Que "el piso sólo sube" sea una **propiedad verificada mecánicamente** contra un baseline
  versionado, con excepciones auditables, y que el doc canónico deje de citar cifras escritas a
  mano.
- Que el veredicto local y el veredicto de CI **no puedan discrepar**: un guard, una entrada, un
  veredicto.

**Non-Goals (a nivel de diseño):**

- **D18 intacto.** El umbral de una corrida diff-scoped no se evalúa porque un total parcial no es
  comparable con umbrales globales: no se toca la deferencia del guard en modo `--advisory` ni el
  lane diff-scoped. El enforcement nuevo es un punto **separado**, de suite completa.
- **No se promueve ni degrada ningún job existente.** Este change no introduce ni retira
  `continue-on-error` en ningún sitio: el bloqueo que introduce es el de un punto **nuevo**, que nace
  bloqueante por diseño. La promoción de `test-unit-*`/`*-coverage` es de `ci-testing-gate-promotion`.
- **SonarQube fuera.** `client-sonarqube`/`server-sonarqube` siguen en `if: false` (diseño
  incremental, §3.1 de `docs/CONTEXT-CICD.md`). Evaluar coverage en dos motores reintroduciría
  exactamente el defecto que este change cierra: dos evaluadores que pueden discrepar.
- **TIA, sharding y fusión de reportes sin cambios**: ni la selección affected, ni
  `coverage.changed`, ni el número de shards, ni `coverage-merge-gate`.
- **Mutation testing y ratchet programado diferidos a Change B.** Esta entrega no añade dependencias,
  configuración, ejecución nocturna de mutantes, ni un workflow programado que proponga cambios de
  floors.
- **No se reescriben las suites de los módulos críticos.** Declarar un camino crítico no implica
  escribir sus tests: este change acota la **declaración y la evaluación**, no la producción de
  cobertura (y por eso los floors se miden, no se inventan — D7).
- **El ruleset de GitHub no se toca.** El veredicto bloqueante propaga dentro del repo (agregador
  de tests → `CI Complete`); vincularlo como required status check del ruleset 21227644 es una
  decisión de gobernanza fuera de alcance.

**Alcance exacto del bloqueo (E5):** `coverage-full-gate` será bloqueante dentro del pipeline: un fallo
propaga por sus dependencias y colorea el agregador de tests/`CI Complete`. Esto **no equivale a enforcement
del ruleset**. El ruleset de GitHub no se modifica en este change y el check nuevo no se añade a sus
`required_status_checks`; la garantía de bloqueo de merge a nivel GitHub queda fuera de alcance y requeriría
una decisión de gobernanza separada.

## Decisions

### D1 — El enforcement de suite completa es un punto **nuevo** y bloqueante, en `ci.yml`, sin tocar D18

**Elegido:** un job nuevo en `.github/workflows/ci.yml` (`coverage-full-gate`) que corre la suite
**completa** de ambos workspaces con cobertura, evalúa el piso con el guard existente y **falla**,
propagando a `prebuild-tests-complete`. El lane diff-scoped (`client-coverage`/`server-coverage`) no
cambia: sigue con `--advisory` y `exit 0` bajo D18. El `nightly-full-suite.yml` deja de tragarse el
fallo (`|| echo "::warning::…"` → sin `||`), de modo que una regresión nocturna es un run rojo
visible, no una línea de warning.

**Por qué en `ci.yml` y no en el workflow nocturno:** el enforcement que bloquea un merge tiene que
vivir en el workflow que responde al PR. `nightly-full-suite.yml` es un workflow **separado** (y
deliberadamente así, D7 del `coverage-tripwire-stage-2d`, para no colisionar el `concurrency` de
`ci.yml`): su veredicto no alcanza el agregador de tests. Poner el punto bloqueante en el nocturno
sería un gate que no bloquea.

**Por qué un job nuevo y no reutilizar `client-coverage`/`server-coverage`:** esos jobs consumen el
artifact del lane TIA, cuyo reporte puede ser parcial; forzarles a suite completa cambiaría el
contrato de D18 y el nombre de sus checks (`Quality: Client Coverage` / `Quality: Server Coverage`,
que el aggregator de tests referencia). Un punto nuevo no altera ningún binding existente.

**Por qué no es una "promoción" a FASE 2:** los jobs que se promovió en `ci-testing-gate-promotion`
ya existían con `continue-on-error`. Este nace sin él, con un alcance distinto (suite completa) y
sin tocar ningún flag existente. La ventana de calibración de aquel change no se altera.

**Consecuencia aceptada:** el pipeline corre la suite completa dos veces en el lane de PR (la
diff-scoped y la completa). El coste medido lo hace asumible: server ≈5-6 s y client ≈14 s de suite
— el sharding quedó `N/A` por lo mismo (`ci-test-sharding` §5.1). A cambio, el piso se evalúa en
**todos** los PR, no sólo en los que tocan `shared`.

### D2 — Los caminos críticos son una **política versionada** y un **nivel de umbral propio**

**Elegido:** dos piezas separadas por responsabilidad:

1. `scripts/ci/coverage-critical-paths.mjs` — la **declaración** de qué es camino crítico: qué rutas
   (`path` relativo al workspace, con `/`) forman cada camino, y para cada uno su estado
   (`enforced` | `exempt`) y, si está exento, el motivo y el responsable.
2. El **nivel de umbral** `criticalPaths` en el config de cada workspace
   (`apps/client/vitest.config.js`, `apps/server/vitest.config.ts`) — el floor por camino, en las
   mismas cuatro métricas. Los valores viven en el config porque el config sigue siendo la **fuente
   única de umbrales**; la política dice _qué_ se evalúa, el config dice _cuánto_ se exige.

El guard `check-coverage.mjs` incorpora ese cuarto nivel junto al global, `perFile` y globs.

**Por qué un fichero de política y no sólo globs:** un glob no puede expresar "el camino de negocio
payroll", sólo "los ficheros que están bajo `payroll/`" — y el aggregate de un módulo con 6 ficheros
sin tests y 1 schema al 100% se parece al de un módulo bien cubierto. La criticidad es un dato de
negocio, y un dato de negocio necesita un sitio declarativo y revisable, no una convención de
nombres de fichero.

**Por qué un nivel de umbral nuevo y no un globs más:** un globs más con floor alto produce un rojo
que señala _una línea_ del config, no _un camino de negocio_. Con un nivel propio, el rojo nombra el
camino, y el reporte puede listar los 9 módulos críticos con su cobertura — hoy invisibles.

**Consecuencia aceptada:** dos ficheros que hay que mantener sincronizados (política + config). Se
mitiga haciendo que el guard **falle si un path de la política no tiene floor declarado** y viceversa
(fail-closed), de modo que la desincronización es un rojo, no una omisión silenciosa.

### D3 — El ratchet se apoya en un **baseline versionado** con **excepción auditable**

**Elegido:** `scripts/ci/coverage-baseline.mjs` carga un baseline versionado (el valor de cada
umbral en el momento de referencia) y lo compara con el config actual. Si un umbral ha **bajado**, el
guard falla —salvo que exista una **excepción registrada** en el propio baseline: `{umbral, valor
anterior, valor nuevo, motivo, responsable, fecha}`. Sin excepción, la bajada es un rojo; con
excepción, es un rojo con nombre.

`coverage:ratchet` conserva su semántica intacta ("sube y nunca baja"): es la acción local que
**actualiza el config**; el baseline es el que **detecta** que alguien lo bajó a mano. Las dos
piezas son complementarias y no se solapan.

**Por qué no basta con el `autoUpdate` de Vitest:** `autoUpdate` garantiza que la _herramienta_ no
baje un umbral; no garantiza que nadie edite el config a mano — que es exactamente lo que pasó con
el piso del client (`87.02/…` → `64.44/…`). Un baseline convierte una convención en una propiedad
verificable.

**Por qué la excepción vive en el baseline y no en el comentario del config:** el motivo y el
responsable tienen que ser **consultables por máquina** (el verificador puede exigir que todo umbral
exento tenga motivo y responsable no vacíos) y auditables en el diff. Un comentario en el YAML es
texto libre que nadie comprueba.

**Consecuencia aceptada:** el repo hereda una deuda ya existente. La bajada manual del client se
convierte en la **primera excepción registrada** —con el motivo que ya está documentado en el propio
config (`change client-snapshot-testing`, 2026-10-09) y un responsable— en lugar de quedar como un
descuento silencioso en el YAML. Sin ese paso, el baseline arrancaría en rojo y el guard no sería
utilizable.

**Consecuencia aceptada (2) — el piso global no se manipula para compensar un 0% crítico:** los floors **medidos** de los 9 módulos
críticos son hoy 0% en la capa `service`/`dao`; subir el piso global para "compensar" un 0% crítico
exigiría tests que este change no escribe (Non-Goal). La compensación es por granularidad (D2), no
por manipulation del agregado.

### D4 — Las cifras del doc canónico se **verifican** contra la config (o se generan)

**Elegido:** `docs/learning/coverage-tripwire-floor-ratchet.md` deja de citar cifras escritas a mano.
Un verificador (`npm run coverage:docs:verify`, o el propio guard en modo `--check-docs`) extrae los
valores reales de los configs de workspace y de la política de critical paths y **falla** si el doc
no coincide. El doc expone las cifras en un bloque delimitado por marcadores que el verificador
compara con lo generado: la edición manual del bloque es detectable, no silenciosa.

**Por qué no basta con "corregir las cifras hoy":** la deriva no fue un error de transcripción, fue
el precio de un invariante que nadie comprobaba. El client bajó de `87.02/…` a `64.44/…` (y el §3.3
sigue citando `87.02`, línea 150) y el server pasó de `42.28/21.75/8.98/42.76` "con cinco globs"
(línea 169) a `60.8/64.48/64.81/61.49` con tres. Sin un mecanismo, el siguiente cambio de floors
reintroduce la deriva exactamente igual.

**Por qué verificar y no generar:** generar un bloque completo del doc desde un comando pide un
generador de documentos y un paso de build de docs que el repo no tiene. La verificación exige
mucho menos superficie: el doc sigue siendo escrito a mano (que es lo legible), pero las **cifras**
que ya no puede sostener se comprueban. Es el mismo patrón que el guard de baseline: una propiedad
verificada, no una sustitución de la fuente.

**Consecuencia aceptada:** el doc pasa a tener una dependencia de verificación: tocar los floors
obliga a actualizar el doc en el mismo PR, o el verificador falla. Eso es el coste pretendido —el
doc deja de ser un documento que "describe" el repo y pasa a ser un documento que "no puede
contradecir" al repo—.

### D5 — Mutation testing y ratchet programado se difieren a Change B

**Decisión:** estos mecanismos no forman parte de la implementación ni del alcance de esta entrega.
No se añade Stryker ni otra dependencia de mutation testing, configuración de mutantes, reportes,
baseline de mutation score, ejecución nocturna/semanal de mutantes, ni workflow automático de
propuesta de subidas de floors. Los contratos de esas capacidades se conservan en sus specs para
Change B; su presencia en la especificación no implica que estén implementados aquí.

**Motivo:** la entrega actual cierra el enforcement de cobertura de suite completa, la declaración de
critical paths y la verificación estática del ratchet. Mutation testing y automatización programada
requieren decisiones y validación independientes de herramienta, coste, cadencia, permisos y flujo
de PR. Se separan para evitar ampliar el blast radius del gate de cobertura.

### D6 — Un guard, una entrada, un veredicto

**Elegido:** `scripts/ci/check-coverage.mjs` sigue siendo el **único** evaluador de los floors. Le
se añaden los niveles `criticalPaths` y la comparación contra el baseline (D2, D3), pero **no** se crea
un segundo evaluador ni una segunda ruta de veredicto. El job bloqueante nuevo (D1), el job de
cobertura existente (modo `--advisory`) y el comando local `coverage:check` invocan **el mismo script
con las mismas entradas**: workspace, `coverage-summary.json` de suite completa y config del
workspace.

**Por qué:** dos aplicaciones del mismo gate con veredictos distintos es peor que no tener guard,
porque el log miente sobre lo que pasó. Es el mismo argumento que sustentó D2 del change
`coverage-tripwire-floor-ratchet` (que el guard replicase la granularidad de Vitest en vez de
delegarla) y el que justify el Non-Goal de SonarQube.

**Consecuencia aceptada:** el guard crece (cuatro niveles de umbral + baseline). Se mitiga
manteniéndolo como **un** fichero con una función de evaluación por nivel y una única salida
accionable: workspace, métrica, valor medido, umbral, fichero infractor (o camino infractor) y el
motivo por el que falla. Un rojo que nombra el camino y el fichero es accionable; un "coverage below
thresholds" no lo es.

**Paridad local↔CI:** `coverage:check` deja de ser el espejo del job _advisory_ y pasa a ser el
espejo del **veredicto bloqueante** de suite completa (misma entrada, mismo guard, mismos exit
codes). Es el requisito de `local-coverage-tripwire`, que hoy documenta una divergencia explícita
("el comando local es de suite completa; el job de PR puede ser advisory") que este change reduce:
la divergencia restante es **de cadencia**, no de veredicto.

**Alternativa considerada:** un script nuevo `coverage-full-gate.mjs` que sólo cubre el caso de suite
completa. Descartada: dos evaluadores del mismo contrato pueden divergir (justo el defecto que este
change cierra), y el nivel critical-path y el baseline tendrían que duplicarse.

### D7 — Los floors se **miden**, nunca se inventan

**Elegido:** cada floor de critical path se fija al **valor medido hoy** para ese camino, leído del
`coverage-summary.json` de la corrida de suite completa. No hay números aspiracionales: un camino
crítico sin cobertura medida se declara `exempt` con motivo y responsable (mecanismo explícito, en
la política de D2), y el reporte lo nombra. Un camino crítico que **pierde** la exención, o que queda
por debajo de su floor declarado, es un **rojo explícito** — no un hueco silencioso dentro de un
agregado.

**Por qué la exención es explícita y no un floor 0:** un floor 0 sobre una ruta sin tests es
indistinguible de "no hay requisito" y por tanto de un hueco silencioso, que es exactamente el
defecto que este change cierra. Con la exención registrada, el camino aparece en el reporte con su
motivo y su responsable: visible, con dueño, y sin bloquear un repo cuyos 9 módulos críticos suman
55 ficheros sin tests (Non-Goal: escribir esas suites es otro change).

**Por qué "medido" y no "redondeado a la baja":** un floor medido y exacto es el único valor que el
guard puede evaluar sin producir un rojo falso por redondeo; y el ratchet (D3) exige que el valor
sólo suba, de modo que partir de la medición real es el único punto de partida compatible con el
baseline.

**Consecuencia aceptada:** el primer día, los floors de la capa `service`/`dao` de los 9 módulos
críticos son 0 y están exentos. La granularidad no produce cobertura donde no la hay —ese es el
Non-Goal declarado—; produce **visibilidad** sobre dónde no la hay, que es el primer paso para que
otro change la escriba. Lo que este change garantiza es que la visibilidad no se pierde: si mañana
alguien declara un camino nuevo sin floor, o baja el floor de uno exento, el guard falla.

**Comprobación de no-invención:** el verificador de floors exige que cada valor declarado en el config
sea **≤** el valor medido en la última corrida completa (un floor por encima de lo medido es un rojo
inmediato, no una aspiración), y que los valores del baseline coincidan con los del config salvo
excepción registrada.

## Risks / Trade-offs

- **Bloquear un PR por cobertura puede frenar merges legítimos** (p. ej. un PR que toca `shared` y
  baja la cobertura de un módulo) → Mitigación: el nuevo job evalúa **suite completa**, así que un
  PR acotado no produce un rojo por cobertura parcial; y el baseline convierte una caída real en un
  fallo de baseline, con excepción auditable como salida explícita.
- **El lane de PR corre la suite completa dos veces** (diff-scoped + completa) → Mitigación: coste
  medido de suite (server ≈5-6 s, client ≈14 s) muy por debajo del umbral que justificó sharding;
  y el job completo es **independiente** del artifact TIA, así que no introduce acoplamiento.
- **Una política de critical paths que nadie actualiza al añadir módulos** → Mitigación: la política
  es _fail-closed_: un path declarado sin floor, o un floor sin path declarado, es un rojo; y el
  guard exige que todo módulo del camino crítico aparezca en la política.
- **El nivel critical-path empieza casi todo exento (55 ficheros, 9 módulos, 0 tests)** → El riesgo
  real no es "bloquear de más" sino "no bloquear nada": la mitigación es que el nivel bloquea
  desde el primer día contra (a) la pérdida de una exención, (b) la caída de un floor declarado y
  (c) la declaración incompleta — y que la capa de granularidad que sí tiene cobertura (los 22
  schemas Joi al 100%) entra con floor medido, no exenta.
- **El guard crece hasta cubrir cuatro niveles + baseline** → Mitigación: una función de evaluación
  por nivel y una única salida accionable; tests de contrato (`check-coverage.test.mjs`) para cada
  nivel y para cada modo de fallo.
- **Dos superficies de enforcement (PR y nocturno) que podrían divergir** → Mitigación: D6 — mismo
  guard y entrada; ambos evalúan reportes de suite completa con la misma política.
- **Mutation testing y ratchet programado permanecen pendientes** → Mitigación: se difieren de forma
  explícita a Change B; no se presentan como entregables ni gates de esta entrega.
- **Verificar las cifras del doc ata el doc a la config** → Mitigación: sólo se verifican las
  **cifras**; el resto del doc sigue siendo texto libre. Si un día el doc se genera entero, el
  verificador se sustituye, no se acumula.
- **Solape con `ci-testing-gate-promotion` y `tia-hardening` en vuelo** → Mitigación: este change
  no toca la promoción, ni `continue-on-error` existentes, ni la selección affected, ni
  `coverage.changed`; su punto de enforcement es nuevo y con alcance propio (suite completa).
- **Coste de una dependencia nueva (Stryker) en el repo** → Mitigación: dependencia de `devDependencies`
  únicamente, sin impacto en runtime ni en el bundle del cliente; el árbol de módulos ya tiene
  `typescript` como peer de Vitest.

## Migration Plan

### Entrega en PRs atómicos (E1)

- **PR 1:** Phase 0–2 (baseline, critical-path floors y ratchet estático). El ratchet programado se
  difiere a Change B.
- **PR 2:** Phase 3 (enforcement bloqueante dentro del pipeline; sin mutation testing).
- **PR 3:** Phase 5–6 (paridad local, documentación, validación, sincronización de specs y archive).

Cada PR debe ser revisable y atómico, sin adelantar tareas de la siguiente entrega.

Orden pensado para que cada paso sea reversible por separado y para que el guard exista **antes** de
que haya floors nuevos que evaluate — el mismo criterio que aplicó `coverage-tripwire-ratchet` al
extender el guard.

1. **Baseline + excepción grandfathered.** Crear `scripts/ci/coverage-baseline.mjs` con el baseline
   versionado de los umbrales actuales de cada workspace, y registrar la **excepción grandfathered**
   de la bajada manual del client (`87.02/62.16/69.14/87.7` → `64.44/42.11/52.22/64.82`,
   `client-snapshot-testing` 2026-10-09) con motivo y responsable. Es el paso que desbloquea el
   resto: sin él, el baseline arrancaría en rojo y ningún paso posterior sería distinguible de un
   fallo real.
2. **Política de critical paths + floors medidos.** Añadir `scripts/ci/coverage-critical-paths.mjs`
   y el nivel `criticalPaths` en los configs de workspace, con cada floor **medido** en la última
   corrida de suite completa (D7) y los 9 módulos sin tests declarados `exempt`. El guard es
   _fail-closed_: falla si hay un path sin floor o un floor sin path declarado.
3. **Verificación del doc canónico.** `npm run coverage:docs:verify` compara las cifras de
   `docs/learning/coverage-tripwire-floor-ratchet.md` contra la config y la política, y falla si no
   coinciden; corregir de paso las obsoletas (§3.3: `87.02/…` del client y
   `42.28/21.75/8.98/42.76` "con cinco globs" del server). Va después de 1 y 2 porque las cifras del
   doc **son** floors y política: verificarlas antes de fijarlos daría por bueno un doc que después
   se va a mover.
4. **Job de enforcement bloqueante.** `coverage-full-gate` en `ci.yml`: suite completa de ambos
   workspaces, `check-coverage.mjs` sin `--advisory`, y entrada en `prebuild-tests-complete.needs`.
   En el mismo commit, `nightly-full-suite.yml` deja de tragar el fallo (`|| echo "::warning::…"`).
   Es el único paso que **cambia un veredicto**, y por eso va después de que floors y baseline ya
   estén verdes: un job bloqueante con floors sin medir bloquearía PRs legítimos.
5. **Paridad local de `coverage:check`.** `coverage:check` pasa a ser el espejo del veredicto
   bloqueante de suite completa (misma entrada, mismo guard, mismos exit codes) y
   `local-coverage-tripwire` deja de documentar la divergencia "local = suite completa / PR puede ser
   advisory". Cierra el último punto de divergencia: la restante es de **cadencia**, no de veredicto.
6. **Change B (fuera de este plan):** decidir e implementar por separado mutation testing y ratchet
   programado, incluyendo la herramienta, coste, cadencia y permisos necesarios.

**Rollback:**

- Pasos 1-3: reversibles por fichero. Retirar el baseline, la política y el verificador de docs
  devuelve el repo al estado actual; el guard extendido sin `criticalPaths` ni baseline evalúa
  exactamente lo que evaluaba antes (mismos exit codes en verde y en rojo).
- Paso 4: es el único que altera un veredicto. Se revierte por commit — quitar el job
  `coverage-full-gate` y su entrada en `needs` del agregador, y reponer el `|| echo "::warning::…"`
  del nocturno. No toca ningún `continue-on-error` existente (Non-Goal), así que la reversión no deja
  flags colgando.
- Paso 5: no tiene efecto sobre el merge (script local); se revierte restaurando el comando previo.

## Open Questions

- **Granularidad exacta de los critical paths y valores medidos congelados.** ¿El camino crítico es
  el módulo entero (`src/modules/payroll/**`), la capa dentro del módulo (`**/service/**`,
  `**/dao/**`) o una lista de ficheros? ¿Y qué valor exacto se congela: el de la última corrida de
  suite completa, redondeado, o el mínimo histórico observado? Se resuelve leyendo
  `coverage-summary.json` en la implementación, con el criterio de D7 (medido, nunca inventado); no
  cambia la spec, que fija la propiedad —un floor declarado por camino de negocio, evaluado y
  fail-closed—.
- **Quién firma una excepción.** La excepción del baseline exige motivo y responsable no vacíos
  (D3), pero el change no fija **quién** tiene autoridad para firmarla: quién aprueba una bajada de
  floor y con qué umbral de revisión (CODEOWNERS del path, maintainer del workspace, revisor del doc
  canónico). Hoy el mecanismo garantiza que el campo no esté vacío, no que la persona sea la
  adecuada.
- **Diseño de Change B.** La herramienta de mutation testing y el diseño del ratchet programado
  (cadencia, permisos y flujo de propuesta) quedan abiertos para un change independiente; no bloquean
  el cierre de esta entrega.
- **Si el veredicto nuevo pasa a ser required status check del ruleset.** Fuera de alcance por
  Non-Goal: el veredicto bloqueante propaga dentro del repo (agregador de tests → `CI Complete`).
  Vincularlo al ruleset 21227644 es una decisión de gobernanza, con su propio change y su propia
  ventana de calibración, porque el nombre del check debe ser exacto y el binding es irreversible
  en la práctica.
