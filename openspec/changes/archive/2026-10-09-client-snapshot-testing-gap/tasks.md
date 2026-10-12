# Tasks

## 1. Correcciones de la matriz y la spec (razones, no conteos)

- [x] 1.1 Update the candidacy matrix rows in `specs/client-snapshot-testing/spec.md`: totals to 180 audited / 87 candidates / 93 excluded; `src/components/tiptap/` to 3 audited / 2 candidates (MenuBar as gap via flat `editor` prop stub, `TiptapEditor` stays excluded); `src/modules/*/components/` (resto) to 29 audited / 18 candidates (AttendeeList, EventCalendar, NotesFilters promoted to gap)
- [x] 1.2 Correct the audit-time reasons of the `*Dialog.jsx` (24 audited) and `*FiltersForm.jsx` (22 audited) rows without changing their counts: "0 vacios hoy; de los 3 ficheros vacios borrados en `ed0af3bf` solo 1 era Dialog (`ClientOrderDialog.jsx`) / 1 era FiltersForm (`ClientOrderFiltersForm.jsx`); conteo se mantiene por convencion audit-time, precedente fila Datatable"; record `NotesViewDialog`'s real exclusion reason (no RHF, but embeds a live `TiptapEditor` + 2 RTK queries)
- [x] 1.3 Update the reconciled-totals scenario (F1 = 37, F2 = 20, F3 = 26, 4 gap candidates, total = 87, 180 audited / 93 excluded) and the exclusions requirement text (MenuBar carve-out: flat prop stub, never a `vi.mock` of `@tiptap/*`; size-excluded components with a deterministic subtree become candidates; render-only stubs are not widened with `userEvent`); verify the 4 artifacts agree on every number (`grep -nE "87|93|180" proposal.md design.md specs/client-snapshot-testing/spec.md tasks.md`)

## 2. MenuBar - gap real (stub de props, render-only)

- [x] 2.1 Create `apps/client/src/components/tiptap/MenuBar.ui.test.jsx` (co-located, relative mocks resolve as the component's) rendering `MenuBar` with `editor={{ isActive: () => false, can: () => false, chain: () => ({ focus: vi.fn().mockReturnThis(), run: vi.fn() }), getAttributes: () => ({ href: '' }) }}`; NO `vi.mock` of `@tiptap/*` (D1); verify `npx vitest run src/components/tiptap/MenuBar.ui.test.jsx` passes and coexists with the existing `MentionList.test.jsx`
- [x] 2.2 (S1) Keep the test render-only: assert the toolbar markup via the inline snapshot only - do NOT add `userEvent`/`fireEvent` clicks (the minimal stub throws `TypeError` on `chain().focus().run()`); widen the stub ONLY in a future change that explicitly declares interaction coverage
- [x] 2.3 Verify the snapshot stays under ~100 lines with a descriptive hint as arg2 of `toMatchInlineSnapshot`, and that `npm run test:snapshot` reports nothing new after commit

## 3. AttendeeList - subtabla con RTK mock y locale normalizado

- [x] 3.1 Create `apps/client/src/modules/events/components/AttendeeList.ui.test.jsx` (path correction B2: inside `components/` so `vi.mock('../api/eventsAPI')` resolves exactly as the component's import; precedent `NotesCard.ui.test.jsx`) mocking the RTK Query endpoint with a fixed 3-attendee fixture and snapshotting ONLY `container.querySelector('table')` (never the page tree); verify `npx vitest run src/modules/events/components/AttendeeList.ui.test.jsx`
- [x] 3.2 (B3) Determinize L71 `new Date(attendee.createdAt).toLocaleDateString()` by NORMALIZING `Date.prototype.toLocaleDateString` (fixed implementation/spy output, or an explicit locale) - NOT `vi.setSystemTime`: the date comes from the fixture and the real risk is the locale ICU mismatch (Windows es-ES `9/10/2026` vs CI en-US `10/9/2026`); the scenario "An unfrozen date in a snapshot is rejected" allows freeze **or normalize**; record the normalization decision in a test comment
- [x] 3.3 Verify byte-stability across locales: run the test twice locally and after `git status --porcelain` check no `.snap`/inline diff; snapshot under ~100 lines with a descriptive hint

## 4. EventCalendar - rejilla del mes con `setSystemTime`

- [x] 4.1 Create `apps/client/src/modules/home/components/EventCalendar.ui.test.jsx` (B2: inside `modules/home/components/`) rendering the component with a fixed `events` prop fixture and snapshotting ONLY the month grid subtree; `vi.setSystemTime` is used here because the component has REAL `new Date()` calls at L200/430/442 (freeze them, unlike AttendeeList); verify `npx vitest run src/modules/home/components/EventCalendar.ui.test.jsx`
- [x] 4.2 Annotate in the test that the date-fns locale is hardcoded `es` at L16/L480 of the component, so month/weekday names are Spanish and deterministic on any OS (no i18n global dependency); verify the snapshot contains no unfrozen date and stays under ~100 lines

## 5. NotesFilters - bloques sueltos con Popover cerrado

- [x] 5.1 Create `apps/client/src/modules/notes/components/NotesFilters.ui.test.jsx` (B2: inside `components/`) mocking `useGetHashtagItems` and `useGetNoteColumns` from `'../hooks/index'` (same relative specifier the component imports; no RHF involved) with fixed returns; verify `npx vitest run src/modules/notes/components/NotesFilters.ui.test.jsx`
- [x] 5.2 (S2) Add ONE inline matcher per block - SearchInput, status select, FavoriteToggle and the hashtags block with the `Popover` CLOSED (never open: its markup is animated/unstable) - and NEVER snapshot the whole form; each matcher gets a descriptive hint as arg2; verify all 4 snapshots are byte-stable

## 6. Gate final - determinismo, invariantes y validacion

- [x] 6.1 Run the full client suite with NO update flags from `apps/client`: `npm run test` green locally (the 4 new `*.ui.test.jsx` files included, no update flags anywhere)
- [x] 6.2 Run `npm run test:snapshot` and confirm it reports NOTHING to update ("no novedad" - all snapshots committed); then re-run `npm run test` and check `git status --porcelain` is clean for `apps/client` (no snapshot file rewritten - determinism across runs)
- [x] 6.3 Grep the descriptive hints: every `toMatchInlineSnapshot(` call in the 4 new files MUST pass a hint as arg2 (`grep -n "toMatchInlineSnapshot(" src/components/tiptap/MenuBar.ui.test.jsx src/modules/events/components/AttendeeList.ui.test.jsx src/modules/home/components/EventCalendar.ui.test.jsx src/modules/notes/components/NotesFilters.ui.test.jsx` - each line must show a quoted hint, no positional/naked matchers); also verify no snapshot exceeds ~100 lines
- [x] 6.4 Validate the change strictly: `openspec validate client-snapshot-testing-gap --strict` must pass GREEN; fix any reported structure error before commit
- [x] 6.5 Invariant audit (inherited, D6): no `-u`/`--update` in any CI-consumed script, no `vi.mock` of `@tiptap/*` in `MenuBar.ui.test.jsx`, no `toMatchSnapshot` outside `*.ui.test.jsx`, and the 4 artifacts (proposal, design, specs delta, tasks) reconcile on F1 = 37, F2 = 20, F3 = 26, 4 gap candidates, 87 candidates / 93 excluded / 180 audited

## Referencias

- Change archivado: `openspec/changes/archive/2026-10-09-client-snapshot-testing/{proposal,design,tasks}.md` (politica original, config F0, fases F1-F3)
- Spec principal: `openspec/specs/client-snapshot-testing/spec.md`
- Politica y precedentes: `docs/learning/snapshot-testing.md`
