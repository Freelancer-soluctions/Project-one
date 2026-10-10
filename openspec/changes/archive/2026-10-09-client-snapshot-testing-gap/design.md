# Design

## Context

`client-snapshot-testing` (archivado 2026-10-09) cerro el gap P3 con 83 candidatos sobre 180 ficheros `.jsx` auditados. La revision de cierre del cambio detecto: (1) **1 gap real** - `components/tiptap/MenuBar.jsx` (333 lineas) se excluyo con la razon "exige mock de una libreria de terceros", pero el componente es `({editor})` prop-driven y admite un stub plano del prop; (2) **3 candidatos omitidos por juicio de tamano** - `AttendeeList` (341), `EventCalendar` (631) y `NotesFilters` (338), excluidos porque "el diff no es revisable", sin percatarse de que cada uno expone un subarbol determinista pequeno (table, rejilla del mes, bloques sueltos); (3) **2 imprecisiones en las razones de la matriz** - los 3 ficheros vacios de `providerOrder` borrados en `ed0af3bf` se repartian mal entre las filas Dialog/FiltersForm, y el motivo real de `NotesViewDialog` (sin RHF) no estaba registrado. Este change corrige la politica en la spec y anade los 4 tests de snapshot; no toca config de Vitest, scripts npm ni CI.

Restricciones heredadas que siguen moldeando el diseno: determinismo por fixture local (no serializers globales), subarbol (<~100 lineas por snapshot), inline vs `.snap` segun tamano, i18n fijo a `lng: 'en'` en `tests/setup/setupTest.js`, y `update: 'none'` en CI.

## Goals / Non-Goals

**Goals:**

- Cerrar el gap real de MenuBar sin mockear librerias de terceros (stub de props, no de tiptap).
- Promover AttendeeList, EventCalendar y NotesFilters a candidatos por subarbol determinista y revisable.
- Corregir las razones de las filas Dialog (24 auditados) y FiltersForm (22 auditados) sin alterar conteos audit-time; documentar el motivo real de `NotesViewDialog`.
- Reconciliar los totals en los 4 artefactos: 180 auditados / 87 candidatos (F1=37, F2=20, F3=26 + 4 gap) / 93 excluidos.

**Non-Goals:**

- Ampliar el stub de MenuBar para cubrir interaccion (clicks) - el stub minimo lanza `TypeError` (S1); la interaccion sigue cubierta por RTL assertions.
- Snapshot del form entero de NotesFilters, del arbol de pagina de EventCalendar o de la lista completa (sin `table`) de AttendeeList.
- Cambiar `TiptapEditor` (sigue excluido), config de Vitest, scripts npm, wiring de CI o la politica inline/.snap heredada.
- Refrescar snapshots de los 83 ficheros existentes: este change es aditivo.

## Decisions

**D1 - MenuBar: stub plano del prop `editor`, no `vi.mock` de `@tiptap/*`.** MenuBar (333 lineas) recibe el editor por prop, asi que el test construye un stub plano `{ isActive: () => false, can: () => false, chain: () => ({ focus: vi.fn().mockReturnThis(), run: vi.fn() }), getAttributes: () => ({ href: '' }) }` y renderiza el componente tal cual. El snapshot captura el markup real de los botones (con `isActive() === false` en todos). _Alternativa_: `vi.mock('@tiptap/react')` → rechazada: mockear una libreria de terceros es exactamente la razon con la que se excluyo el fichero y anade un acoplamiento a su API interna; el stub de props solo toca la frontera que el componente ya declara. _Restriccion S1_: el stub es render-only - `userEvent.click` lanza `TypeError` porque `chain().focus().run()` no simula estado; no se anade interaccion sin ampliar el stub deliberadamente. `TiptapEditor` sigue excluido: su render si instancia el editor.

**D2 - AttendeeList: subtree `table`, mock RTK por ruta relativa, fechas por normalizacion de locale.** El test vive en `src/modules/events/components/AttendeeList.ui.test.jsx` (co-localizado, B2): asi `vi.mock('../api/eventsAPI')` resuelve al mismo modulo que el `import` del componente (precedente: `NotesCard.ui.test.jsx`); el mock del endpoint RTK fija las filas del fixture. Solo se snapshottea `container.querySelector('table')`. Para L71 (`new Date(attendee.createdAt).toLocaleDateString()`) se **normaliza `Date.prototype.toLocaleDateString`** (spy/implementation fija) o se pasa locale explicito; NO `vi.setSystemTime`, porque la fecha ya viene del fixture y el riesgo real no es el reloj sino el **locale ICU** (Windows es-ES formatea `9/10/2026`, CI en-US `10/9/2026`). El scenario heredado "An unfrozen date in a snapshot is rejected" ya permite "freeze **or normalize**".

**D3 - EventCalendar: subtree = solo la rejilla del mes; locale `es` hardcodeado.** El test vive en `src/modules/home/components/EventCalendar.ui.test.jsx`. El componente recibe `events` por prop (fixture fija) y formatea con date-fns usando locale **`es` hardcodeado en L16/480** (no depende del i18n global de la app) → nombres de mes en espanol deterministas en cualquier SO; se anota en el propio test. A diferencia de AttendeeList, aqui si hay `new Date()` reales (L200/430/442) → `vi.setSystemTime` congelados. Subtree = SOLO la rejilla del mes (nunca cabeceras/sidebar del modulo home) para mantener el diff <~100 lineas.

**D4 - NotesFilters: un matcher por bloque, `Popover` de hashtags cerrado.** El test vive en `src/modules/notes/components/NotesFilters.ui.test.jsx`; el componente NO usa RHF. Se mockean `useGetHashtagItems` y `useGetNoteColumns` desde `../hooks/index` (mismo specifier relativo que el componente) → datos fijos de hashtags y columnas. Cuatro matchers inline, uno por bloque: SearchInput, status select, FavoriteToggle y el bloque de hashtags **con el `Popover` cerrado** (S2; nunca abierto: su markup es animado/instable). Nunca se snapshottea el form entero (anti-goal heredado). Cada matcher lleva hint descriptivo (arg2).

**D5 - Inline vs `.snap`: la regla de >100 lineas sigue viva.** Los 4 tests nuevos usan `toMatchInlineSnapshot`: sus subarboles quedan por debajo del umbral de revision (~100 lineas) - si algun snapshot inline supera ~100 lineas al implementarse, se segmenta en bloques mas pequenos (o se pasa a `.snap` externo si la segmentacion no es posible), nunca se acepta un diff irrevisable. La regla heredada (inline <~50-100 lineas, `.snap` externo para tablas grandes F2) no cambia.

**D6 - Invariantes heredados intactos.** Nada de lo aqui anadido toca: la config `update: process.env.CI ? 'none' : 'new'`, los scripts `test:snapshot`/`test:snapshot:refresh`, la ausencia de `-u`/`--update` en CI, el sufijo `*.ui.test.jsx`, la coleccion por los glob existentes de `test-unit-client`, la convencion de hints descriptivos en arg2 de cada matcher, ni la regla de commitear artefactos antes de push. Los 4 tests corren en el mismo job que los 83 existentes.

**D7 - Totals de auditoria: 180 / 87 / 93 (convencion audit-time).** Los conteos de la matriz se leen como en el momento de la auditoria: las filas conservan los ficheros evaluados aunque despues se borren dead files (precedente: fila Datatable, que contaba el `ClientOrderDatatable.jsx` vacio). Por eso Dialog se queda en 24 y FiltersForm en 22 pese a que hoy hay 0 vacios en esas familias (de los 3 borrados en `ed0af3bf`: 1 Datatable, 1 Dialog, 1 FiltersForm). Candidatos: 37 + 20 + 26 + 4 gap = 87; excluidos: 180 - 87 = 93. Los 4 artefactos reconcilian estos numeros (scenario del spec). _Alternativa_: recountar el inventario post-borrado → rechazada: romperia la trazabilidad con el change archivado y con la auditoria original sin aportar senal (los ficheros borrados eran dead code ya tratado).

## Risks / Trade-offs

- [Stub de MenuBar acoplado a la firma del prop `editor`] → el fallo es ruidoso y temprano (TypeError en render); se documenta la frontera en el propio scenario del spec.
- [Olvidar la normalizacion de `toLocaleDateString` en AttendeeList] → snapshot distinto entre Windows es-ES y CI en-US; mitigado por task 3 (normalizacion obligatoria) y por el gate final de determinismo (correr la suite y ver `git status --porcelain` limpio).
- [Subarbol mal delineado (ej. rejilla de EventCalendar arrastrando el resto del modulo home)] → el diff crece y D5 obliga a re-segmentar antes de commitear; el checklist de review (<~100 lineas) es el guard.
