# Proposal

## Why

El change `client-snapshot-testing` (archivado 2026-10-09) cerro el gap P3 con 83 candidatos sobre 180 ficheros auditados, pero la revision posterior de cierre detecto **1 gap real y 3 candidatos omitidos por juicio de tamano**, mas **2 imprecisiones en las razones de la matriz**:

- **Gap real**: `components/tiptap/MenuBar.jsx` (333 lineas) estaba excluido con la razon "exige mock de una libreria de terceros", pero el componente es `({editor})` prop-driven: con un **stub plano del prop `editor`** se snapshottea deterministamente sin `vi.mock` de `@tiptap/*`. El stub es render-only (S1): un `userEvent.click` sobre un boton lanza `TypeError` con el stub minimo, asi que no se usa interaccion ni se amplia el stub.
- **3 candidatos omitidos**: `AttendeeList` (341 lineas), `EventCalendar` (631 lineas) y `NotesFilters` (338 lineas) fueron excluidos por juicio de tamano/valor ("el diff no es revisable"), pero cada uno tiene un **subarbol determinista y revisable** (<~100 lineas): la `table` de AttendeeList, la rejilla del mes de EventCalendar y bloques individuales de NotesFilters (1 matcher por bloque, nunca el form entero).
- **2 imprecisiones de razon (conteos audit-time intactos)**: la fila `*Dialog.jsx` afirmaba "incluye los 2 vacios de providerOrder" - de los 3 ficheros vacios borrados en `ed0af3bf` solo 1 era Dialog (`ClientOrderDialog.jsx`); los otros 2 eran Datatable y FiltersForm. La fila `*FiltersForm.jsx` arrastraba el vacio de `ClientOrderFiltersForm.jsx`, ya borrado. Los conteos **24 auditados (Dialog)** y **22 auditados (FiltersForm)** se mantienen por convencion audit-time (precedente: fila Datatable). Ademas `NotesViewDialog` (sin RHF) queda excluido con su razon real: embebe `TiptapEditor` vivo + 2 RTK queries.

## What Changes

- **A - MenuBar (gap real)**: `src/components/tiptap/MenuBar.jsx` pasa de excluido a candidato **gap** con `toMatchInlineSnapshot`, renderizado con un stub plano del prop `editor` (`{ isActive: () => false, can: () => false, chain: () => ({ focus: vi.fn().mockReturnThis(), run: vi.fn() }), getAttributes: () => ({ href: '' }) }`); NO se hace `vi.mock` de `@tiptap/*` (carve-out: stub de props, no de libreria). Test en `src/components/tiptap/MenuBar.ui.test.jsx`. Render-only: sin `userEvent` (S1).
- **B - 3 candidatos por subarbol determinista**: `AttendeeList` (`src/modules/events/components/AttendeeList.ui.test.jsx`, subtree `container.querySelector('table')`, mock de RTK `../api/eventsAPI` siguiendo el precedente de `NotesCard.ui.test.jsx`), `EventCalendar` (`src/modules/home/components/EventCalendar.ui.test.jsx`, subtree = solo la rejilla del mes; locale date-fns hardcodeado `es` en L16/480 - meses en espanol deterministas), `NotesFilters` (`src/modules/notes/components/NotesFilters.ui.test.jsx`, sin RHF; mock de `useGetHashtagItems`/`useGetNoteColumns` desde `../hooks/index`; 1 matcher por bloque: SearchInput, status select, FavoriteToggle y hashtags con `Popover` cerrado (S2), nunca el form entero).
- **C - Correccion de razones en la matriz (razon, no conteo)**: filas Dialog (24 auditados) y FiltersForm (22 auditados) se mantienen con conteo audit-time; razones corregidas a "0 vacios hoy; de los 3 ficheros vacios borrados en `ed0af3bf` solo 1 era Dialog/FiltersForm...; conteo se mantiene por convencion audit-time, precedente fila Datatable". `NotesViewDialog` excluido con su razon correcta (embebe `TiptapEditor` vivo + 2 RTK queries).
- **D - Correcciones de rutas y determinismo**: los tests de los 3 modulos viven **dentro del directorio `components/`** (B2) - `vi.mock('../api/eventsAPI')` y `vi.mock('../hooks/index')` solo resuelven con esa co-localizacion (mismos specifiers relativos que usa el componente). En `AttendeeList` L71 (`new Date(attendee.createdAt).toLocaleDateString()`) el determinismo se logra **normalizando `Date.prototype.toLocaleDateString`** (o locale explicito), no con `vi.setSystemTime`: la fecha viene del fixture y el riesgo real es el locale ICU (Windows es-ES `9/10/2026` vs CI en-US `10/9/2026`); permitido por el scenario "freeze **or normalize**" (B3). `vi.setSystemTime` se usa SOLO en `EventCalendar` (`new Date()` reales en L200/430/442).
- **Totals (convencion audit-time)**: 180 auditados / **87 candidatos** (F1=37, F2=20, F3=26 + 4 gap candidates) / **93 excluidos**. La matriz de `spec.md` se actualiza: fila tiptap 3/2 (MenuBar candidato; `TiptapEditor` sigue excluido), fila resto 29/18 (AttendeeList, EventCalendar y NotesFilters reclasificados a gap), escenarios de totales reconciliados en las 4 artefactos.

## Capabilities

### New Capabilities

<!-- Ninguno: este change modifica una capability existente. -->

### Modified Capabilities

- `client-snapshot-testing`: (1) matriz de candidatura - totals 180 auditados / 87 candidatos / 93 excluidos, 4 gap candidates (MenuBar, AttendeeList, EventCalendar, NotesFilters), filas tiptap y resto reclasificadas, razones Dialog/FiltersForm/NotesViewDialog corregidas; (2) exclusiones - carve-out del stub de props de MenuBar (stub plano, NO mock de libreria `@tiptap/*`), superficies antes excluidas por tamano con subarbol determinista promovidas a candidatas, correccion de `NotesViewDialog` y 2 escenarios nuevos ("MenuBar is snapshotted through a flat prop stub, not a library mock" y "A size-excluded component with a deterministic subtree becomes a candidate").

## Impact

- **Spec**: `openspec/specs/client-snapshot-testing/spec.md` (tras apply/merge) - 2 requisitos modificados: matriz de candidatura y exclusiones.
- **Tests**: 4 ficheros `*.ui.test.jsx` nuevos (`MenuBar`, `AttendeeList`, `EventCalendar`, `NotesFilters`) + sus snapshots inline; 87 ficheros de test con snapshot en total.
- **Docs**: el conteo de `docs/learning/unit-tests-enterprise.md` (metrica de snapshot) sube de 83 a 87.
- **CI**: sin cambios - los tests corren en `test-unit-client` (substage 2D prebuild) con `update: 'none'`; no se tocan jobs, scripts ni config de Vitest.
- **Riesgos**: el stub de MenuBar es sensible a cambios de firma del prop `editor` (se detecta al fallar el render); si se olvida la normalizacion de `toLocaleDateString` en AttendeeList el snapshot varia entre Windows es-ES y CI en-US (mitigado por task 3 y el scenario "freeze or normalize").
