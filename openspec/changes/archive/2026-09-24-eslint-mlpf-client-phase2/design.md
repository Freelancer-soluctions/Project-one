# Design

## Context

La Fase 1 (`eslint-complexity-rules`) midió el baseline y eximió a client de `max-lines-per-function` mediante un bloque `files` documentado: 103 funciones >80 líneas efectivas, repartidas en ~95 ficheros de 24 directorios de módulos — sin concentración en un solo dominio. Distribución por tamaño: 12 funciones en 81–100 líneas, 30 en 101–150, 36 en 151–250, 25 de más de 250.

Los patrones dominantes que explican el tamaño (observados al refactorizar los 4 casos de client de la Fase 1) son repetitivos y prestaron bien a extracción mecánica:

1. **Formularios de módulo** (pages `*Dialog.jsx`, `*FiltersForm.jsx`, `*Form.jsx`): un único componente renderiza el form entero (20–40 campos con `Controller` de react-hook-form + zod).
2. **Páginas CRUD** (`pages/*.jsx`): un único componente página concentra estados, handlers (`handleSubmit`/`handleDelete`/`handleEdit`), props de spinner y layout.
3. **Datatables** (`*Datatable.jsx`): definición inline de columnas/celdas con renderers largos.
4. **Editor ricos** (Tiptap `MenuBar.jsx`, `TiptapEditor.jsx`) y **widgets complejos** (`EventCalendar.jsx`, `dataTable.jsx`, `calendar.jsx` de shadcn): toolbars, comandos y render branches largos.

## Goals / Non-Goals

**Goals:**

- Eliminar la exención de Fase 1 y dejar `max-lines-per-function: 80` activo en todo `apps/*/src/**`.
- Refactorizar por extracción pura: subcomponentes, handlers con nombre, builders de columnas, normalizadores — sin cambiar comportamiento observable.
- Mantener lint verde por tandas de módulos (módulo completo entre commits lógicos).

**Non-Goals:**

- Cambiar umbrales (80 se mantiene; ajustar sería un change aparte).
- Reescribir lógica de negocio, gestionar estados con librerías nuevas (react-query ya está vía RTK Query), ni introducir TypeScript.
- Añadir tests unitarios nuevos por componente extraído (los existentes + E2E cubren la regresión; cobertura nueva sería scope aparte).
- Tocar server (ya cumple) ni la config de tests.

## Decisions

### D1: Extracción mecánica, no reescritura

**Decisión:** cada función se baja de 80 líneas extrayendo bloques cohesivos ya existentes, en este orden de preferencia:

1. **Subcomponentes JSX** (bloques de render de un campo/sección → componente local o en el mismo módulo).
2. **Handlers con nombre** (callbacks de onSubmit/onDelete/onEdit fuera del componente).
3. **Builders de datos** (arrays de columnas de tabla, opciones de select, valores iniciales de form → funciones module-level).
4. **Normalizadores** (mapeos de datos API → form y viceversa → helpers con JSDoc ES).
   Sin hooks nuevos, sin librerías nuevas, sin cambios de props hacia atrás. Comentarios ES "qué + por qué" como en el resto del repo.
   **Alternativa descartada:** reescribir componentes con composición (context, reducers, compound components) — cambia diseño, no solo tamaño; riesgo desproporcionado para el objetivo.

### D2: Tandas por módulo con lint verde entre tandas

**Decisión:** se procesa módulo a módulo (24 dirs + 5 ficheros sueltos de `src/components/`), ordenado por nº de funciones y complejidad (los widgets complejos al final, con más margen de revisión). Tras cada tanda: `npm run lint --workspace=apps/client` exit 0 + `npm run test --workspace=client-react` verde. La exención se elimina en la ÚLTIMA tanda (si se elimina al principio, el lint rojo bloquea tandas intermedias).
**Alternativa descartada:** eliminar la exención primero y refactorizar "hasta que pase" — invierte la señal: cada tanda intermedia falla y el lint deja de ser útil.

### D3: Umbral intacto, exenciones no usadas

**Decisión:** NO se añade ningún `eslint-disable` nuevo para bajar funciones a 80; si una extracción no cierra una función, se sigue extrayendo. La válvula de escape del spec (bloque `files`/`eslint-disable` documentado) queda disponible para casos genuinamente generados (ninguno conocido hoy).
**Por qué:** el objetivo de la Fase 2 es justamente eliminar la excepción client; sembrar disables inline la recoloca, no la resuelve.

### D4: Verificación de no-regresión

- Lint + `--print-config` por capa (idéntico a Fase 1).
- Tests unitarios existentes (30) + suite E2E (`e2e/tests/**` ya lintada y disponible) en los flujos críticos (login, dashboard, CRUD de usuarios) tras las tandas que tocan módulos cubiertos por E2E.
- Diff review: cada extracción debe poder verificarse como "código movido", no "código cambiado".

## Risks / Trade-offs

- [103 funciones en ~95 ficheros: superficie de regresión amplia] → Extracciones puras verificables en diff + lint verde por tanda + suites existentes. El diff grande es el riesgo principal; se mitiga con commits por tanda.
- [Subcomponentes extraídos duplican props] → Se extraen bloques con props ya existentes (data callbacks); se prohíbe añadir estado nuevo al extraer.
- [Hooks con closures sobre estado del componente] → Los handlers extraídos reciben lo que necesitan por parámetro; si dependen de demasiados estados, se extrae como custom hook local del fichero (sin fichero nuevo).
- [E2E puede detectar regesiones de render que los tests unitarios no] → Se corre la suite E2E de flujos cubiertos antes de cerrar el change (ya es posible: `e2e` tiene lint y config listos; el job E2E de CI sigue disabled por CI_MINIMAL, se corre local).

## Migration Plan

1. Inventario cerrado: la lista de funciones la da `npx eslint ... --rule '{"max-lines-per-function": [...]}'` (misma técnica que midió el baseline; se regenera al empezar cada tanda).
2. Tandas por módulo (aprox. 5–6 tandas): core compartido (`src/components/**`), notes, news+events+home, CRUDs empresariales A (attendance, employees, payroll, permission, vacation), CRUDs empresariales B (clients, users, products, stock, warehouse, purchase, sales, providerOrder, clientOrder, inventoryMovement), sueltos (auth, settings, settingsProductCategories, performanceEvaluation, expenses, attendance-suelto).
3. Última tanda: eliminar el bloque de exención de `eslint.config.js` + actualizar `docs/learning/eslint-complexity-configuration.md`.
4. Verificación integral: lint de los 3 workspaces, tests client, E2E local de flujos críticos, `openspec validate --strict`.
5. Rollback: `git revert` por tandas (cada tanda es un commit independiente); la config vuelve con un solo revert.

## Open Questions

- Ninguna abierta que bloquee. (Si durante la ejecución un widget complejo —p. ej. `calendar.jsx` de shadcn, código de terceros ya forkado— no cierra a 80 con extracción pura, se documenta como caso de bloques `files` del spec con su motivo ES.)
