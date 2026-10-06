# Snapshot Testing (Vitest 4) — Fundamentos, Config, Inventario y Plan de Adopción

> **Fecha:** 2026-10-05
> **Alcance:** snapshot testing enterprise en el cliente React 18 del monorepo (`apps/client`, Vitest 4 + RTL + MSW +
> Redux Toolkit + shadcn/ui): matchers, config, política CI, anti-patrones, inventario por fichero y adopción por fases.
> **Fuentes:** Vitest v4 (`/guide/snapshot`, `/config/update`, `/config/snapshotformat`, `/api/expect`, `/guide/cli`),
> Jest 30.5 Snapshot Testing, testing-library.com (Guiding Principles + FAQ RTL), Airbnb JS Style Guide, inventario
> real de `apps/client/src` (228 `.jsx`), `apps/client/vitest.config.js`, `tests/setup/*`, y docs previas del repo
> (`unit-tests-enterprise.md`, `panorama-resumen.md`).
> **Veredicto corto:** el repo tiene **0 snapshots hoy** (0 `.snap`, 0 `__snapshots__`, 0 `toMatchSnapshot`) — gap
> **P3** ya registrado en `docs/learning/unit-tests-enterprise.md`. Adopción recomendada y **limitada**: ~29 primitivas
> shadcn/ui + ~21 Datatables + ~15 componentes puros (**~65 de 180 ficheros = 36%**), **inline snapshots** para lo
> pequeño, `.snap` externo solo para tablas, y **nunca** en páginas, dialogs con react-hook-form/zod ni estado de
> Redux. **No existe el flag `--ci` en Vitest**: el equivalente es la config `update`, que por defecto resuelve a
> `'none'` cuando `process.env.CI` es truthy y por tanto **falla** en snapshots faltantes/obsoletos en CI.

---

## 1. Resumen ejecutivo

Un snapshot test serializa la salida de un valor (HTML renderizado, objeto, mensaje de error) y lo compara con la
referencia versionada en el repo. Su valor no es "probar que algo se renderiza", sino **detectar cambios
inadvertidos de UI en code review**: el artefacto `.snap` se commitea junto al código y el reviewer ve en el diff
qué cambió exactamente. Su riesgo simétrico es la **snapshot fatigue**: si el diff es gigante o inestable, el equipo
aprueba con `-u` sin leer y el test deja de aportar confianza.

Las tres decisiones que estructuran esta doc:

1. **Alcance**: snapshot solo en UI presentacional y estable (árbol pequeño, sin fechas/uuid/red). Los containers
   (páginas, dialogs con RHF+zod, guards, redux) se validan con **assertions explícitas** (RTL `getByRole`/`getByText`)
   — es la filosofía de Testing Library, no una preferencia local.
2. **Formato**: `toMatchInlineSnapshot` para componentes pequeños (el diff vive en el propio test, imposible
   "olvidarlo" en otro fichero), `toMatchSnapshot` externo para tablas/árboles grandes donde el `.snap` ensuciaría
   el test.
3. **CI**: en Vitest **no hay `--ci`** (eso es de Jest). Vitest detecta `process.env.CI` y resuelve `update` a
   `'none'`: no escribe nada y **falla** ante snapshot faltante, con mismatch u **obsoleto**. Los scripts npm actuales
   (`test`, `test:unit`, `test:changed:ci`, `test:coverage:ci`) **no pasan `-u`** → correcto, se documenta como
   invariante que no debe romperse.

---

## 2. Qué es snapshot testing y cuándo NO usarlo

### 2.1 Mecánica

`expect(valor).toMatchSnapshot()` serializa con `@vitest/pretty-format` y guarda la referencia en
`<fichero>.test.jsx` → `__snapshots__/<fichero>.test.jsx.snap`. Primera ejecución: **crea** el snapshot y pasa.
Ejecuciones siguientes: **compara**; si difiere, falla y muestra un diff. La actualización es siempre un acto
explícito del desarrollador (tecla `u` en watch, `-u` en CLI), nunca automática.

### 2.2 Cuándo SÍ

| Caso                                                                        | Por qué                                                                              |
| --------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| Primitivas UI estables (botón, badge, alert, spinner, estados vacíos/error) | Cambian poco; un cambio es una decisión de diseño que debe revisarse                 |
| Tablas/listas con fixtures fijos                                            | Detecta regresiones de render (columnas, tooltips, paginación) sin lógica de negocio |
| Estructura de layout (header/footer/sidebar estáticos)                      | Captura cambios de jerarquía ARIA/clases                                             |
| Formateadores, parsers, mensajes de error serializables                     | `toThrowErrorMatchingSnapshot` fija el contrato del mensaje                          |
| Screenshot/ARIA de componentes (Vitest Browser Mode, experimental)          | Regresión visual o de árbol de accesibilidad sin depender de píxeles                 |

### 2.3 Cuándo NO usarlo (reglas duras)

| Caso                                                                                                        | Motivo                                                                                  |
| ----------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| Páginas/containers con Redux + Router + hooks                                                               | Estado externo volátil; el snapshot captura ruido, no contrato                          |
| Formularios con `react-hook-form` + `zod`                                                                   | IDs de inputs, mensajes de validación y estado touched/dirty cambian en cada refactor   |
| Contenido con `Date.now()`, `new Date()`, `toLocaleString()`, `Math.random()`, `uuid`/`crypto.randomUUID()` | **No determinista**: falla en cada run (Jest y Vitest lo advierten explícitamente)      |
| Estado de Redux / store serializado                                                                         | Testing de implementación; cambia con cada refactor del store aunque la UI sea idéntica |
| Salidas de `dbg`/`console.log`/debug                                                                        | Testea el instrumento, no el producto                                                   |
| Árboles DOM completos (página entera, árbol >200 líneas)                                                    | Diff ilegible → reviewer aprueba sin leer (anti-goal)                                   |
| Lógica condicional con datos de red sin fixture                                                             | MSW/RTK Query deben fijarse; si no, orden de respuestas altera el snapshot              |
| Comportamiento/interacciones                                                                                | `toMatchSnapshot` no sustituye `userEvent` + aserciones de Rol/Texto                    |

> **Regla práctica**: _si el test cambiaría en cada refactor sin que el usuario note nada, no es snapshot — es
> testing de implementación._

---

## 3. API de Vitest 4 — matchers y opciones

| Matcher                                             | Uso                                                              | Nota clave                                                                   |
| --------------------------------------------------- | ---------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| `toMatchSnapshot(shape?, hint?)`                    | Snapshot externo en `__snapshots__/`                             | `hint` añade un nombre legible al snapshot (mejor que el `1`, `2` numérico)  |
| `toMatchInlineSnapshot(shape?, snapshot?, hint?)`   | Snapshot escrito **dentro** del fichero de test                  | Reescribe el último argumento string; sin argumentos lo genera al primer run |
| `toMatchFileSnapshot(filepath, hint?)`              | Snapshot contra un fichero con extensión libre (`.html`, `.txt`) | **`await` obligatorio**; sin `await` se comporta como `expect.soft`          |
| `toThrowErrorMatchingSnapshot(hint?)`               | Mensaje de error serializado                                     | Útil para contratos de error/validación                                      |
| `toThrowErrorMatchingInlineSnapshot()`              | Ídem inline                                                      | —                                                                            |
| `toMatchAriaSnapshot` / `toMatchAriaInlineSnapshot` | Árbol de accesibilidad (experimental **4.1.4+**, Browser Mode)   | Alternativa semántica a la regresión visual                                  |
| `toMatchScreenshot()`                               | Regresión visual (Browser Mode)                                  | Requiere navegador (Playwright/WebDriverIO)                                  |

### 3.1 Property matchers (para inestables que no se pueden fijar)

```js
expect(user).toMatchSnapshot({
  createdAt: expect.any(Date),
  id: expect.any(Number),
});
// En el .snap queda: { createdAt: Any<Date>, id: Any<Number>, name: "Johan" }
```

Para **strings** con parte aleatoria no hay property matcher: normaliza antes (o usa serializer / mockea el origen):

```js
const html = render(<Badge id={crypto.randomUUID()} />).container.innerHTML;
expect(html.replace(/uuid="[0-9a-f-]{36}"/, 'uuid="UUID"')).toMatchSnapshot();
```

### 3.2 Serializers

```js
// Opción A: en el test (escope limitado)
expect.addSnapshotSerializer({
  test: (v) => v && typeof v === 'object' && 'foo' in v,
  serialize: (v, cfg, ind, depth, refs, printer) =>
    `Foo: ${printer(v.foo, cfg, ind, depth, refs)}`,
});

// Opción B: global en config
export default defineConfig({
  test: { snapshotSerializers: ['@/tests/setup/serializers/dates.js'] },
});
```

---

## 4. Config y recetas (`apps/client/vitest.config.js`)

Vitest 4 ya aplica estos defaults de `snapshotFormat` (más legibles que los de Jest):

| Opción                | Default Vitest | Efecto                               |
| --------------------- | -------------- | ------------------------------------ |
| `printBasicPrototype` | `false`        | `[1, 2]` en vez de `Array [1, 2]`    |
| `escapeString`        | `false`        | strings más limpios                  |
| `escapeRegex`         | `true`         | escapes correctos                    |
| `printFunctionName`   | `false`        | sin `function name()` en el snapshot |

Opciones útiles adicionales: `maxOutputLength` (presupuesto de salida por profundidad), `printShadowRoot`.

**Receta mínima recomendada** (añadir al bloque `test:` existente — hoy no hay ninguna clave de snapshot):

```js
test: {
  // ...existentes: environment: 'jsdom', pool: 'forks', include, setupFiles, coverage...
  // 1) Límite de tamaño: un snapshot gigante es un snapshot que nadie revisa.
  snapshotFormat: { maxOutputLength: 10000 },
  // 2) Política explícita de escritura (mismo comportamiento que el default,
  //    pero declarado para que nadie lo "optimice" sin leer esta doc):
  //    local -> 'new' (crea faltantes, no toca obsolete)
  //    CI    -> 'none' (no escribe; falla en mismatch/faltante/obsolete)
  update: process.env.CI ? 'none' : 'new',
}
```

Notas de configuración:

- **No** hace falta `resolveSnapshotPath` ni `snapshotSerializers` al empezar; añadir `snapshotSerializers` solo cuando
  un tipo (fechas, `Uint8Array`, elementos custom) aparezca repetidamente en diffs.
- `snapshotFormat.plugins` **se ignora** → usar `snapshotSerializers` o `expect.addSnapshotSerializer`.
- `--expandSnapshotDiff` (CLI/config) muestra el diff completo cuando el truncado por defecto oculta la causa.
- Los snapshots se descubren por **sufijo de fichero**: conviene que los tests de snapshot vivan en `*.ui.test.jsx`
  (ya incluido en `include`), no en un sufijo nuevo.

---

## 5. CI y política de actualización

### 5.1 NO existe `--ci` en Vitest (corrección de una idea muy extendida)

`--ci` es un flag de **Jest**. Verificado contra el CLI real instalado (`npx vitest run --help`, Vitest **4.1.11**):
la única flag de snapshot es `-u, --update [type]`. Configurarlo produce `error: unknown option`.

### 5.2 Config `update` — el equivalente real

- **Tipo**: `boolean | 'new' | 'all' | 'none'` · **Default**: `false`
- **CLI**: `-u`, `--update`, `--update=new`, `--update=none`, `--update=all`

| Valor             | Significado                                                                |
| ----------------- | -------------------------------------------------------------------------- |
| `true` / `'all'`  | Actualiza **todos** los snapshots cambiados y **borra** los obsoletos      |
| `'new'`           | Solo **crea** los que faltan; no modifica ni borra nada                    |
| `'none'`          | **No escribe nada** y **falla** por mismatch, snapshot faltante u obsoleto |
| `false` (default) | Local ⇒ `'new'` · CI (`process.env.CI` truthy) ⇒ `'none'`                  |

**Comportamiento en CI (documentado en `/guide/snapshot`)**: con `process.env.CI` truthy, Vitest no escribe
snapshots y **cualquier** mismatch, snapshot faltante u **obsoleto** hace fallar el run. Un snapshot **obsoleto** es
una entrada (o fichero) que ya no corresponde a ningún test recolectado — pasa al borrar/renombrar tests.

### 5.3 Política del repo

| Regla                                             | Detalle                                                                                                                                                  |
| ------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Nunca** `-u`/`--update` en scripts que corre CI | Invariante: `test:coverage:ci` y `test:changed:ci` no lo llevan. Un `-u` en CI convierte el gate en aprobador automático de cambios de UI                |
| `-u` solo local y **siempre con diff revisado**   | `git diff` obligatorio sobre `.snap`/ficheros inline antes de commitear                                                                                  |
| Artefactos **commiteados** en el mismo PR         | `.snap` es código de test; se revisa igual que el resto (Jest best practice #1)                                                                          |
| Obsoletos = rojo en CI                            | Ya lo garantiza Vitest; al renombrar/borrar un test hay que correr `-u` local y commitear el borrado                                                     |
| pre-push (`vitest --changed origin/main`)         | Si un test nuevo crea snapshot, **se commitea antes del push**; si no, el siguiente run lo recreará igual pero el PR queda incompleto                    |
| Nombres descriptivos                              | `toMatchSnapshot('header')`, `toMatchInlineSnapshot(..., 'estado vacío')` en vez de `1`, `2`                                                             |
| Límite de tamaño                                  | Preferir **inline** para < ~50 líneas; rechazar en review `.snap` > ~100 líneas por snapshot (`eslint-plugin-jest` `no-large-snapshots` como referencia) |

**Recipe de scripts sugerida** (añadir, no reemplazar):

```jsonc
{
  "test:snapshot": "vitest run --update=new", // solo local: crea faltantes, no toca obsoletos
  "test:snapshot:refresh": "vitest run -u", // local, exclusivo, para refrescar tras un cambio de UI esperado
}
```

---

## 6. Inline vs `.snap` externo

| Dimensión              | `toMatchInlineSnapshot`                                                           | `toMatchSnapshot` (externo)                   |
| ---------------------- | --------------------------------------------------------------------------------- | --------------------------------------------- |
| Ubicación              | En el propio `.test.jsx`                                                          | `__snapshots__/<test>.snap`                   |
| Review                 | Diff en el mismo fichero que el test, imposible de perder                         | Fichero aparte que el reviewer puede no abrir |
| Tamaño del test        | Crece con el snapshot                                                             | Test limpio                                   |
| Colisiones de edición  | Reescribe el fuente → conflictos más probados en merges paralelos                 | Fichero único, conflictos concentrados        |
| Formato                | String literal (resaltado de sintaxis del lenguaje)                               | Escapado de `"` y backticks                   |
| Suites múltiples       | Un snapshot por matcher                                                           | Todos los snapshots del fichero en un `.snap` |
| **Recomendación repo** | **Por defecto** para componentes pequeños/estados (spinner, badge, 404, tarjetas) | Tablas/datatables y árboles > ~50 líneas      |

Detalle práctico: en inline, el snapshot **debe ser el último argumento** (o penúltimo con property matchers) — Vitest
reescribe el último argumento string. Y con tests **concurrentes async** hay que usar `expect` del _Test Context_
(`t.expect(...)`) para que el snapshot se asocie al test correcto.

---

## 7. Anti-patrones y normalización

| #   | Anti-patrón                                                         | Falla como                                       | Solución                                                                                                              |
| --- | ------------------------------------------------------------------- | ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------- |
| 1   | Snapshot de estado de Redux / store                                 | Cambia en cada refactor de store con UI idéntica | Afirmar sobre el DOM (`getByRole`, texto); si hace falta el estado, `expect(store.getState()).toEqual(...)` explícito |
| 2   | Fechas reales (`new Date()`, `Date.now()`, `toLocaleDateString`)    | Distinto en cada run y por locale                | `vi.setSystemTime(new Date('2026-01-01T00:00:00Z'))` / `vi.useFakeTimers()`; el setup ya fija i18n a `lng: 'en'`      |
| 3   | `uuid`/`crypto.randomUUID()`/`Math.random()`                        | Distinto en cada run                             | Property matcher `expect.any(String)` en objetos; `replace()`+regex en strings; mock del generador                    |
| 4   | Snapshot del árbol de página completa                               | Diff de miles de líneas, review imposible        | Segmentar: snapshot del **subárbol** (`within(container.querySelector('table'))` o del componente hijo)               |
| 5   | Snapshot de salida `dbg`/`console`                                  | Testea el debug, no el producto                  | Borrar; usar reporters de Vitest si se quiere traza                                                                   |
| 6   | Snapshot con datos de red no fijados                                | Depende del orden de respuestas MSW              | Handlers locales por test (`server.use(...)`), fixtures estables (`tests/setup/msw/fixtures`)                         |
| 7   | `render(<App/>)` global → snapshot gigante                          | Cualquier cambio de rama lo rompe                | Render del componente concreto vía `customRender` de `tests/setup/test-utils.js`                                      |
| 8   | Regenerar con `-u` en CI o sin revisar                              | Auto-aprueba regresiones                         | Política §5.3                                                                                                         |
| 9   | Snapshot de componentes que renderizan con `{...props}` arbitrarios | Cubre solo un caso                               | Tabla de `it.each` con 2-3 fixtures representativas                                                                   |

### 7.1 Normalización determinista — ejemplo completo

```jsx
// src/components/ui/badge.ui.test.jsx
import { describe, it, expect, afterEach } from 'vitest';
import { render } from '@testing-library/react';
import { vi } from 'vitest';
import { Badge } from '@/components/ui/badge';

afterEach(() => vi.useRealTimers());

describe('Badge', () => {
  it('renderiza la variante destructive con texto', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T00:00:00Z'));

    const { container } = render(<Badge variant="destructive">Alerta</Badge>);
    expect(container.firstChild).toMatchSnapshot('destructive');
  });

  it('mantiene la estructura accesible del badge', () => {
    expect(render(<Badge>Nueva</Badge>).container.firstChild)
      .toMatchInlineSnapshot(`
        <span
          class="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-primary text-primary-foreground"
        >
          Nueva
        </span>
      `);
  });
});
```

> **Ojo con las clases de Tailwind**: son deterministas pero **ruidosas** — cualquier cambio de `tailwind.config` o
> de `tailwind-merge` rompe todos los snapshots. Alternativa si el ruido molesta: un serializer propio que sustituya
> `class="..."` por `class="<classes normalizadas>"`, o acordar que los snapshots de shadcn **sí** cubren las clases
> (es precisamente lo que queremos detectar al tocar el design system).

### 7.2 Snapshot de un subtree pequeño (segmentación)

```jsx
const { container } = render(<AttendeeList attendees={FIXTURE_ATTENDEES} />);
const soloLista = container.querySelector('ul');
expect(soloLista).toMatchSnapshot('lista de asistentes'); // no el diálogo completo
```

### 7.3 Redux + MSW sin contaminar el snapshot

```jsx
import { render } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { server } from '@/tests/setup/msw/server';
import { http, HttpResponse } from 'msw';

it('tarjeta de stock en estado cargado', async () => {
  server.use(
    http.get('/api/stock/summary', () =>
      HttpResponse.json({ total: 12, low: 2 })
    )
  );

  const store = configureStore({
    reducer: { stock: stockReducer },
    preloadedState: STOCK_FIXTURE,
  });
  const { findByRole } = render(
    <Provider store={store}>
      <StockSummary />
    </Provider>
  );

  expect(
    await findByRole('heading', { name: /stock/i }).closest('section')
  ).toMatchSnapshot('stock cargado');
});
```

Claves: **store por test** (no el global), `preloadedState` con fixture, `server.use()` para sobreescribir el handler
y `server.resetHandlers()` ya corre en `afterEach` del setup.

---

## 8. Filosofía Testing Library aplicada

- **No existe una página "Why snapshot tests?" en testing-library.com.** Verificado contra el árbol del repo
  `testing-library/testing-library-docs`: solo hay `guiding-principles.mdx`, `dom-testing-library/faq.mdx` y
  `react-testing-library/faq.mdx`. La guía de snapshots hay que derivarla de los principios.
- **Guiding Principles**: _"The more your tests resemble the way your software is used, the more confidence they can
  give you."_ → el snapshot debe capturar la **experiencia** (DOM que ve/usa la persona), no instancias de componente
  ni estado interno.
- **RTL FAQ** sobre nivel del árbol: en componentes de app conviene testear _lo bastante arriba_ para simular
  interacciones reales; **para librerías de componentes reutilizables** sí tiene sentido testear cada componente por
  separado → aplica directo a `components/ui/*` (que es nuestro "mini design system"): ahí el snapshot **por componente
  es legítimo**.
- RTL desaconseja mockear componentes; y advierte que `snapshot-diff` no funciona con DOM mutable sin clonar
  (`container.cloneNode(true)`), porque los cambios no crean objetos nuevos.
- **Traducción a política**: assertions explícitas (`getByRole`, `getByText`, `userEvent`) para **comportamiento**;
  snapshot para **forma** de subtrees pequeños y estables. Nunca snapshots de mocks ni de árboles de componentes
  internos (`vi.mock` de hijos).

**Guías de estilo**: la sección _Testing_ de la **Airbnb JavaScript Style Guide** no contiene ninguna norma sobre
snapshots (solo: escribe tests, cuidado con stubs/mocks, regression test en cada bugfix); el **Google JavaScript Style
Guide** tampoco. La autoridad operativa en snapshots es, por tanto, **Jest/Vitest docs + Testing Library principles**.

---

## 9. Regresión visual: Chromatic / Storybook vs DOM snapshot

| Enfoque                                                           | Qué compara                       | Dónde vive                      | Coste                                   |
| ----------------------------------------------------------------- | --------------------------------- | ------------------------------- | --------------------------------------- |
| **DOM snapshot (esta doc)**                                       | HTML/estructura serializada       | Vitest + jsdom, en CI rápido    | Cero dependencias nuevas                |
| **`@storybook/test-runner` + `toMatchSnapshot`**                  | Screenshot del story renderizado  | Storybook + navegador           | CI extra, stories como fuente de verdad |
| **Chromatic** (`@chromatic-com/storybook` **ya instalado**, v4.1) | Píxeles reales + UI review humano | Cloud, aprobar/rechazar en web  | Plan de pago por snapshots              |
| **Vitest Browser Mode `toMatchScreenshot()`**                     | Píxeles                           | Vitest + Playwright/WebDriverIO | Requiere `--browser`                    |
| **ARIA snapshots (4.1.4+, experimental)**                         | Árbol de accesibilidad            | Vitest Browser Mode             | Experimental                            |

**Recomendación**: DOM snapshot en Vitest como capa base (barata, en el mismo run de tests) y **Chromatic** como capa
de regresión visual si se quiere cubrir estilos/píxeles (la infra ya está instalada). No duplicar: si Chromatic cubre
un componente, el DOM snapshot solo aporta estructura/ARIA.

---

## 10. Inventario del codebase (`apps/client/src`)

**228 `.jsx` = 180 de implementación + 26 `*.test.jsx` + 22 `*.stories.jsx`.** Estado actual: **0 snapshots**.

Criterios de clasificación aplicados por fichero: `R` = usa Redux (`useSelector|useDispatch`), `F` = usa
`react-hook-form`/`zodResolver`/`handleSubmit`, `N` = Router (`useNavigate|<Link|...`), `D` = contenido inestable
(`Date.now|new Date|Math.random|uuid|toLocale`), `L` = líneas.

### 10.1 SÍ snapshot (candidatos)

| Patrón / ficheros                                                                                                                                                                                                                                                                                                                                                                                                 | Nº      | Veredicto                | Motivo                                                                                                   |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- | ------------------------ | -------------------------------------------------------------------------------------------------------- |
| `components/ui/*.jsx` (accordion, alert, alert-dialog, badge, button, calendar\*, card, checkbox, command, dialog, dropdown-menu, form, input, label, pagination, popover, radio-group, scroll-area, select, separator, skeleton, switch, table, tabs, textarea, toast, toaster, toggle, tooltip)                                                                                                                 | **29**  | **SÍ** (inline)          | Presentacional puro, `R=0 F=0 N=0`; es el design system. \* `calendar.jsx` (D=1) → fixture de fecha fija |
| `modules/**/components/*Datatable.jsx` (attendance, clientOrder, clients, employees, expenses, inventoryMovement, news, payroll, performanceEvaluation, permission, products, providerOrder×2, providers, purchase, sales, settingsProductCategories, stock, users, vacation, warehouse)                                                                                                                          | **21**  | **SÍ** (`.snap` externo) | `R=0 F=0 N=0`, 54-137 lí, render de tabla con fixtures; \* varios D=1 → fecha en fixture                 |
| `components/loader/Loader.jsx`, `Spinner.jsx`                                                                                                                                                                                                                                                                                                                                                                     | 2       | **SÍ** inline            | 5-9 lí, puramente visuales                                                                               |
| `components/layout/Header.jsx`, `Footer.jsx`, `Main.jsx`, `index.jsx`                                                                                                                                                                                                                                                                                                                                             | 4       | **SÍ** inline            | 5-15 lí, estáticos                                                                                       |
| `components/404/NotFound.jsx`, `components/500/InternalServerError.jsx`                                                                                                                                                                                                                                                                                                                                           | 2       | **SÍ** inline            | Estados de error estables (N=1 por links)                                                                |
| `modules/events/components/AttendeeStatus.jsx` (40), `EventFiltersForm.jsx` (61, F=0), `modules/home/components/EventCalendarWidget.jsx` (30), `Navbar.jsx` (46), `modules/notes/components/NotesColumn.jsx` (83), `modules/settings/components/SettingsWsStatus.jsx` (51), `SettingsProduct.jsx` (65), `SettingsLanguage.jsx` (65), `modules/auth/components/AuthWelcomeMessage.jsx` (18), `AuthFooter.jsx` (28) | **10**  | **SÍ** inline            | Pequeños, sin form ni redux                                                                              |
| `components/dataTable/DebouncedInput.jsx` (40), `Filter.jsx` (57), `cellWithTooltip.jsx` (26), `components/PaginationControls.jsx` (142), `components/quickAccess/QuickAccess.jsx` (42)                                                                                                                                                                                                                           | 5       | **SÍ condicional**       | UI simple; fijar props/estado (`value`, página) en fixture                                               |
| **Total candidatos**                                                                                                                                                                                                                                                                                                                                                                                              | **~74** |                          |                                                                                                          |

### 10.2 NO snapshot (no-candidatos)

| Patrón / ficheros                                                                                                                                                                                                                                                                                                                                                                                      | Nº       | Veredicto            | Motivo                                                                                    |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------- | -------------------- | ----------------------------------------------------------------------------------------- |
| `modules/**/pages/*.jsx` + `.../page/SettingsProductCategories.jsx`                                                                                                                                                                                                                                                                                                                                    | **28**   | **NO**               | Containers: hooks 8-12, `F=1`, `N`/`R` presentes, 111-501 lí                              |
| `App.jsx`, `main.jsx`                                                                                                                                                                                                                                                                                                                                                                                  | 2        | **NO**               | Raíz de la app: providers, router, persist                                                |
| `modules/**/components/*Dialog.jsx` con RHF (`F=1`) (attendance, clientOrder, clients, employees, events, expenses, inventoryMovement, news, notes Create/Edit, payroll, performanceEvaluation, permission, providerOrder, providers, purchase, sales, settingsProductCategories, stock, users, vacation, warehouse)                                                                                   | **22**   | **NO**               | Formularios RHF+zod, 250-787 lí, IDs/mensajes/estado dinámico                             |
| `*FiltersForm.jsx` con RHF (`F=1`) (attendance, clientOrder, clients, employees, inventoryMovement, news, payroll, performanceEvaluation, permission, products, providerOrder, providers, purchase, sales, settingsProductCategories, stock, users, vacation, warehouse)                                                                                                                               | **19**   | **NO**               | Mismo motivo; `EventFiltersForm` (F=0) sí candidato (§10.1)                               |
| `components/guards/ProtectedRoutes.jsx` (R=1), `ProtectedFormRoute.jsx`                                                                                                                                                                                                                                                                                                                                | 2        | **NO**               | Control de flujo: aserciones de presencia/ausencia de ruta, no forma                      |
| `components/tiptap/TiptapEditor.jsx` (278), `MenuBar.jsx` (333)                                                                                                                                                                                                                                                                                                                                        | 2        | **NO**               | Editor rich-text: estados de selección/toolbar muy volátiles                              |
| `hooks/MentionCountProvider.jsx`                                                                                                                                                                                                                                                                                                                                                                       | 1        | **NO**               | Provider de contexto                                                                      |
| `modules/home/components/SideBar.jsx` (R=1,N=1), `AccessCardModules.jsx`, `NotesSummary.jsx`, `StockSummary.jsx`, `EventCalendar.jsx` (D=1, 631 lí)                                                                                                                                                                                                                                                    | 5        | **NO**               | Router/Redux/dinámico                                                                     |
| `modules/auth/components/SignInForm.jsx` (R=1,F=1), `SignUpForm.jsx` (F=1)                                                                                                                                                                                                                                                                                                                             | 2        | **NO**               | Forms + auth                                                                              |
| `modules/**/components/NotesCard.jsx`, `NotesFilters.jsx`, `NotesHashtagCreator.jsx`, `NotesHashtagSelector.jsx`, `NotesViewDialog.jsx`, `AttendButton.jsx`, `AttendeeList.jsx`, `EventList.jsx`, `ProductAttributes.jsx`, `ProductBasicInfo.jsx`, `UsersBasicInfo.jsx`, `SettingsDisplay.jsx`, `SettingsProductsCategoryForm.jsx`, `alertDialog/AlertDialog.jsx`, `favoriteToggle/favoriteToggle.jsx` | **15**   | **NO / condicional** | Lógica propia, RHF (`F=1`) o contenido dinámico (`D=1`); **afirmar con RTL**, no snapshot |
| `components/dataTable/dataTable.jsx` (202), `Pagination.jsx` (D=1)                                                                                                                                                                                                                                                                                                                                     | 2        | **NO**               | Estado TanStack complejo / fecha                                                          |
| `modules/events/utils/helpers.jsx`                                                                                                                                                                                                                                                                                                                                                                     | 1        | **NO**               | No es componente (test unitario puro)                                                     |
| **Total no-candidatos**                                                                                                                                                                                                                                                                                                                                                                                | **~106** |                      |                                                                                           |

### 10.3 Casos especiales

| Fichero                                                                                                            | Nota                                                                                                           |
| ------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------- |
| `modules/providerOrder/components/ClientOrderDatatable.jsx`, `ClientOrderDialog.jsx`, `ClientOrderFiltersForm.jsx` | **Vacíos (0 líneas)**: no compilan-testables; candidatos a borrar (knip/dead code) antes de cualquier snapshot |
| `components/tiptap/MentionList.jsx`                                                                                | Ya tiene test; snapshot **opcional** solo del `MentionList` aislado con fixture de 3 menciones                 |
| `components/ui/form.jsx`, `command.jsx`, `dropdown-menu.jsx`, `select.jsx`, `calendar.jsx`                         | Sí snapshot, pero de **subárbol** (el campo/trigger), nunca del menú abierto con animaciones                   |

---

## 11. Plan de adopción por fases

| Fase                                 | Alcance                                                                                                                                                                                                                              | Esfuerzo | Criterio de salida                                                                   |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------- | ------------------------------------------------------------------------------------ |
| **F0 — Fundación**                   | Añadir `snapshotFormat.maxOutputLength` + `update` declarado en `apps/client/vitest.config.js`; scripts `test:snapshot`; reglas de review en `docs/code-review-checklist.md`; `include` sin cambios (snapshot va en `*.ui.test.jsx`) | XS       | Config versionada + política de `-u` documentada                                     |
| **F1 — Primitivas shadcn**           | 29 `components/ui/*.jsx` + loaders/layout/404/500 (≈ 40 ficheros) con **inline snapshots** de subárbol y fixtures fijas                                                                                                              | S        | 40 tests `*.ui.test.jsx` verdes en local y CI (sin `-u`), `.snap`/inline commiteados |
| **F2 — Datatables**                  | 21 `*Datatable.jsx` con `toMatchSnapshot` externo, fixture de 3 filas, fecha congelada, y `server.use()` de MSW                                                                                                                      | M        | Cada Datatable cubierto; diff de PR legible (<100 líneas/snapshot)                   |
| **F3 — Cards/estados**               | `AttendeeStatus`, `NotesColumn`, `EventCalendarWidget`, `Navbar`, Settings `WsStatus/Product/Language`, `QuickAccess`, `PaginationControls`, `cellWithTooltip` (≈ 15)                                                                | S        | Sin snapshots >100 líneas; sin `D=1` sin congelar                                    |
| **F4 — Regresión visual (opcional)** | Chromatic ya instalado: stories de F1 como fuente; o Vitest Browser Mode `toMatchScreenshot`                                                                                                                                         | M        | Aprobación visual en PR de design system                                             |
| **Fuera de alcance**                 | Páginas, `*Dialog`/`*FiltersForm` con RHF, guards, tiptap, estado Redux                                                                                                                                                              | —        | Se cubren con RTL assertions (ya existentes: 26 tests)                               |

Riesgos a vigilar: (a) conflictos de merge en **inline** snapshots amplios → mantenerlos cortos; (b) ruido de clases
Tailwind al cambiar tokens → revisar diffs como diseño, no "dar a `-u`"; (c) `pool: 'forks'` + CI `maxWorkers: 1` no
afecta a snapshots (son por fichero), pero `isolate` compartido exige fixtures **locales** al test, nunca mutables
globales.

---

## 12. Recomendación (orden de ejecución)

1. **F0** — declarar `update`/`snapshotFormat` y la política de `-u` (hoy: nada escrito, nada que migrar).
2. **F1** — shadcn/ui + loaders/layout/errores con **inline** snapshots: máximo valor por fichero de test, cero
   riesgo de `.snap` gigante.
3. **F2** — Datatables con `.snap` externo y fixtures congeladas.
4. **F3** — cards/estados pequeños restantes.
5. **F4** — solo si se quiere regresión visual de píxeles (Chromatic ya en `devDependencies`).
6. Mantener el **gap P3 cerrado**: añadir la métrica "0 snapshots → N" a la tabla de `unit-tests-enterprise.md` §Snapshot
   tests al terminar F1.

**Checklist de review de un snapshot PR**: ¿es un solo componente/subárbol? · ¿hay fechas/uuid congelados? · ¿el diff
es < ~100 líneas? · ¿se ven las clases/estructura **esperadas** (no "lo que salió")? · ¿algún fichero se generó con
`-u` en CI? · ¿quedan snapshots obsoletos?

---

## 13. Fuentes

**Repo (verificadas):**

- `apps/client/vitest.config.js` — config actual (sin claves de snapshot), `pool: 'forks'`, CI `maxWorkers: 1`,
  `include: *.unit|ui|integration.test.*`, thresholds 84/49/63/85.
- `apps/client/package.json` — scripts (`test`, `test:changed`, `test:coverage:ci`, …) — **ninguno usa `-u`**;
  deps: `vitest ^4.1.0` (instalado **4.1.11**), `@testing-library/react ^16.3.2`, `msw ^2.12`, `@reduxjs/toolkit ^2.2`,
  `@chromatic-com/storybook ^4.1.0`, `storybook ^9.1.20`.
- `apps/client/tests/setup/setupTest.js` — jest-dom matchers, `cleanup`, ciclo MSW (`listen/resetHandlers/close`),
  **i18n fijado a `lng: 'en'`** (base de determinismo para snapshots) y `vi.mock` global de `@tanstack/react-table`.
- `apps/client/tests/setup/test-utils.js` — `customRender` con `I18nextProvider`.
- `apps/client/tests/setup/msw/{server,handlers/handlers,fixtures/auth}.js`.
- `docs/learning/unit-tests-enterprise.md` — gap **P3** «Snapshot tests — 0 `.snap` / `toMatchSnapshot`» (§5.8/§5.9).
- `docs/learning/panorama-resumen.md` — «Snapshot: 0 `.snap`, 0 `__snapshots__`, 0 `toMatchSnapshot`».
- `docs/nivel-experiencia-analisis.md` — «Sin snapshot testing».
- Inventario: `find apps/client/src -name '*.jsx'` → 228 / 180 / 26 / 22; métricas por fichero (`R/F/N/D/L`).

**Externas (consultadas 2026-10-05):**

- Vitest v4 Snapshot guide (matchers, inline, file, CI behavior, obsolete, custom serializer/matchers, ARIA,
  diferencia con Jest): <https://v4.vitest.dev/guide/snapshot>
- Vitest `update` (`boolean | 'new' | 'all' | 'none'`, resolución local/CI): <https://v4.vitest.dev/config/update>
- Vitest `snapshotFormat` (defaults, `maxOutputLength`, `printShadowRoot`, `plugins` ignorado):
  <https://v4.vitest.dev/config/snapshotformat>
- Vitest `expect` API (`toMatchSnapshot`, `toMatchInlineSnapshot`, `toMatchFileSnapshot`, hints, property matchers):
  <https://v4.vitest.dev/api/expect>
- Vitest CLI (flags reales de 4.1.11; **ausencia de `--ci`**): <https://v4.vitest.dev/guide/cli>
- Jest 30.5 Snapshot Testing (best practices 1-4, property matchers, `--updateSnapshot`/`-u`, modo interactivo,
  obsolete, `no-large-snapshots`): <https://jestjs.io/docs/snapshot-testing>
- Testing Library Guiding Principles: <https://testing-library.com/docs/guiding-principles>
- Testing Library DOM FAQ: <https://testing-library.com/docs/dom-testing-library/faq>
- React Testing Library FAQ (nivel del árbol, mock de componentes, `snapshot-diff` + DOM mutable):
  <https://testing-library.com/docs/react-testing-library/faq>
- testing-library-docs repo (verificación de que **no** existe guía dedicada de snapshots):
  <https://github.com/testing-library/testing-library-docs>
- Airbnb JavaScript Style Guide (sección Testing, sin norma de snapshots):
  <https://github.com/airbnb/javascript>
- `eslint-plugin-jest` `no-large-snapshots`:
  <https://github.com/jest-community/eslint-plugin-jest/blob/main/docs/rules/no-large-snapshots.md>
- Chromatic / Storybook test-runner: <https://www.chromatic.com/docs/> ·
  <https://storybook.js.org/docs/writing-tests/test-runner>
