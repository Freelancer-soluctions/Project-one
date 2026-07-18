# Módulo: Home (Client only)

> Documentación técnica del módulo **Home**. arc42 / C4 / IEEE 1016.
> Client: `apps/client/src/modules/home/`. No tiene backend — es layout shell + dashboard aggregator.

---

## 1. Metadatos

| Campo | Valor |
| ---------------- | ------------------------------------------------ |
| **Módulo** | `home` |
| **Estado** | Released |
| **Path Client** | `apps/client/src/modules/home/` |
| **Path Server** | N/A (client-only) |
| **Dependencias** | events, notes, stock, settings, auth (RTK Query hooks) |

---

## 2. Introducción y Objetivos

Layout principal del dashboard. Renderiza sidebar + navbar + contenido de rutas anidadas. Agrega datos de eventos, notas, stock y settings desde otros módulos.

Funcionalidades:
- Layout shell con NavBar + SideBar + Outlet para rutas hijas
- Sidebar condicional según displaySettings (news, notes, stock, events, profile, language, reports, payroll)
- Dashboard cards de acceso a 15+ módulos (AccessCardModules)
- Vista previa de próximos eventos (carousel con embla-carousel-autoplay)
- Calendario de eventos mensual (desktop grid / mobile list)
- Alertas de stock (expirado/bajo) en sidebar popover
- Resumen de notas (backlog/active/completed) en sidebar popover
- Badge de menciones no leídas

---

## 3. Contexto y Alcance

```
[Usuario autenticado]
      |
[Home Layout] ----<Outlet>----> [Rutas anidadas (events, notes, stock, etc.)]
      |
      |-- eventos: useGetAllEventsQuery (eventsAPI)
      |-- notas: useGetAllCountNotesQuery (notesAPI)
      |-- stock: useGetStockAlertsQuery (stockAPI)
      |-- settings: settingsSlice (Redux)
      |-- auth: authSlice (Redux)
```

**In-Scope**: Layout shell, dashboard, sidebar navegación, agregación cross-module.

**Out-of-Scope**: Endpoints propios, lógica de negocio, almacenamiento persistente.

---

## 4. Restricciones

| ID | Restricción |
| -- | ----------- |
| C-01 | Client-only (React) |
| C-02 | React Router v7 con `<Outlet />` para anidación |
| C-03 | Redux Toolkit para settings + auth state |
| C-04 | Datos agregados desde módulos externos (events, notes, stock) |

---

## 5. Stack Tecnológico

React 18, React Router v7, Redux Toolkit, RTK Query, date-fns, embla-carousel-autoplay, react-i18next, shadcn/ui, Tailwind CSS, prop-types.

---

## 6. Arquitectura del Módulo

```
apps/client/src/modules/home/
├── api/homeAPI.js                      # STUB — sin endpoints propios
├── components/
│   ├── Navbar.jsx                      # Top bar + hamburger + avatar
│   ├── SideBar.jsx                     # Navegación lateral + popovers
│   ├── Content.jsx                     # (dead code — duplica Home.jsx)
│   ├── AccessCardModules.jsx           # Grid de 15+ cards de acceso
│   ├── UpcomingEvents.jsx              # Carousel de eventos próximos
│   ├── EventCalendar.jsx               # Calendario mensual
│   ├── StockSummary.jsx                # Alertas stock (popover)
│   ├── NotesSummary.jsx                # Resumen notas (popover)
│   └── index.js
├── pages/
│   └── Home.jsx                        # Layout shell
```

---

## 7. Building Blocks — Server

Módulo client-only. Sin servidor.

---

## 8. Building Blocks — Client

### Page: Home.jsx

Layout structure:
```
<header>   [NavBar]
<nav>      [SideBar]
<main>     <Suspense><Outlet /></Suspense>
```

Fetches `useGetStockAlertsQuery()` y pasa `dataCountStock` a SideBar. Sidebar toggleable en mobile.

### Components

**Navbar.jsx**: Top header bar con hamburger toggle (mobile), logo/App link, user avatar button.

**SideBar.jsx**: Navigation rail con links condicionales basados en `displaySettings` (news, notes, stock, events, profile, language, reports, payroll). Muestra `NotesSummary` y `StockSummary` en popovers. Badge de menciones no leídas via `useMentionCount()`.

**AccessCardModules.jsx**: Grid de 15+ module access cards (Users, Expenses, Reports, News, Notes, Events, Products, Providers, Warehouse, Stock, Sales, Clients, Purchases, etc.). Cada card es un link con icon + label.

**UpcomingEvents.jsx**: Collapsible carousel de eventos próximos. `embla-carousel-autoplay` con 4s delay, stopOnInteraction. Eventos agrupados por fecha con badges de tipo. Skeleton loading.

**EventCalendar.jsx**: Calendario mensual completo — date-fns driven. Desktop: month grid (5 rows × 7 cols). Mobile: flat day list. Eventos agrupados por día con tooltips. Empty state y skeleton loading.

**StockSummary.jsx**: Lista de alertas de stock expirado/bajo. Click → navega a stock module con filter state via React Router.

**NotesSummary.jsx**: Conteo de notas por columna (backlog/active/completed). Colores dinámicos vía regex parse de `COLUMN_STYLES`. Click → navega a notes module con scope + filter state.

**Content.jsx**: Dead code — duplica `<Suspense><Outlet /></Suspense>` de Home.jsx, no importado.

### API: homeAPI.js

**Stub** — `homeApi` con `reducerPath: 'homeApi'` y CERO endpoints. Todos los datos vienen de otros módulos.

### Cross-module data flow

| Componente | Fuente | Mecanismo |
| ---------- | ------ | --------- |
| SideBar | settingsSlice + authSlice | Redux useSelector |
| SideBar (mentions) | `useMentionCount()` | Custom hook |
| UpcomingEvents | `useGetAllEventsQuery()` | eventsAPI |
| NotesSummary | `useGetAllCountNotesQuery({ scope })` | notesAPI |
| StockSummary | `useGetStockAlertsQuery()` (via props) | stockAPI |

---

## 9. Modelo de Datos

N/A. Sin modelo propio. Datos agregados desde events, notes, stock.

---

## 10. Contratos de API

N/A. Sin endpoints propios.

---

## 11. Validación

N/A. Sin formularios propios.

---

## 12. Seguridad

- Depende de auth module para autenticación
- Sidebar links condicionales según displaySettings del usuario
- Sin protección adicional

---

## 13. Riesgos y Deuda Técnica

| ID | Descripción | Severidad |
| -- | ----------- | --------- |
| R-01 | **homeAPI stub**: reducer registrado en store sin endpoints. Podría eliminarse. | LOW |
| R-02 | **Content.jsx dead code**: No importado, duplica funcionalidad de Home.jsx. | LOW |
| R-03 | **Cross-module coupling**: Dependencias directas a eventsAPI, notesAPI, stockAPI. Cambios en esos módulos pueden romper home. | MEDIUM |
| R-04 | **Sin tests**: 0% cobertura. | HIGH |

---

## 14. Glosario

| Término | Definición |
| ------- | ---------- |
| **Outlet** | React Router v7 nested route renderer |
| **displaySettings** | Preferencias de visibilidad de módulos por usuario (settings module) |

---

## 15. Apéndices

### Archivos

```
CLIENT: pages/Home.jsx, api/homeAPI.js (stub), 9 components (1 dead, 8 activos)
```

### Navigation State Pattern

```js
// Navegación a notes con filtro + scope
navigate('notes', { state: { filter: StatusColumn.BACKLOG, scope: 'mixed' } })
// Navegación a stock con filtro
navigate('stock', { state: { filter: { stocksExpirated: true } } })
```
