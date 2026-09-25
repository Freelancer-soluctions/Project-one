# dashboard-event-calendar Specification

## Purpose

Muestra un widget de calendario de eventos en el dashboard: obtiene los eventos vía RTK Query, los ordena por fecha, se integra en el layout sin romper la rejilla de módulos y navega al detalle del evento al hacer clic.

## Requirements

### Requirement: Calendar Wrapper Component

The dashboard page SHALL render an `EventCalendarWidget` component that fetches all events via `useGetAllEventsQuery()`, sorts them by date and time using `sortedEvents()`, passes the `isLoading` state to `EventCalendar`, and renders an empty state gracefully when the query fails.

#### Scenario: Widget fetches and sorts events

- **GIVEN** the dashboard page, **WHEN** the page loads, **THEN** the `EventCalendarWidget` MUST fetch all events via `useGetAllEventsQuery()`
- **GIVEN** the events data, **WHEN** it is loaded, **THEN** it MUST be sorted by date and time using `sortedEvents()`
- **GIVEN** loading state, **WHEN** events are being fetched, **THEN** the `isLoading` prop MUST be passed to `EventCalendar`
- **GIVEN** error state, **WHEN** the query fails, **THEN** the calendar MUST render empty state gracefully

### Requirement: Calendar Display

The calendar SHALL render as a compact sidebar widget (~300px) on xl screens and full-width above the module grid below xl, using the built-in mobile list view under 768px.

#### Scenario: Responsive placement

- **GIVEN** the dashboard, **WHEN** the screen is ≥1280px (xl), **THEN** the EventCalendar MUST render as a sidebar widget ~300px wide next to the module grid
- **GIVEN** the dashboard, **WHEN** the screen is <1280px, **THEN** the EventCalendar MUST render full-width stacked above the module grid
- **GIVEN** the mobile view (<768px), **THEN** the EventCalendar MUST use its built-in mobile list view

### Requirement: Event Click Interaction

Clicking an event chip SHALL navigate to the events module carrying the event ID; clicking a date cell MAY trigger a create-event callback.

#### Scenario: Event chip click

- **GIVEN** an event chip in the calendar, **WHEN** clicked, **THEN** it MUST call `onEventClick(event)` and the parent navigates to `/home/events` with the event ID
- **GIVEN** a date cell in the calendar, **WHEN** clicked (empty area), **THEN** it MAY trigger a callback for creating an event on that date via `onDateClick(date)`

### Requirement: Non-invasive Layout

The calendar MUST NOT push module cards off-screen or break the existing grid; it MUST use `xl:w-[300px] shrink-0` on desktop, and the module grid MUST remain at its original column configuration (`sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-8`).

#### Scenario: Layout integrity

- **GIVEN** the dashboard layout, **WHEN** the calendar is visible, **THEN** it MUST NOT push module cards off-screen or break the existing grid
- **GIVEN** the desktop layout, **THEN** the calendar MUST use `xl:w-[300px] shrink-0` to stay compact
- **GIVEN** the module grid, **THEN** the grid MUST remain at its original column configuration (`sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-8`)

### Requirement: Component Registration

`EventCalendar` and `EventCalendarWidget` SHALL be exported from the home components barrel using named exports.

#### Scenario: Named exports from barrel

- **GIVEN** the home components barrel export, **THEN** `EventCalendar` and `EventCalendarWidget` MUST be exported from `index.js` using NAMED exports (not default)

### Requirement: UpcomingEvents Replacement

The calendar widget SHALL replace `<UpcomingEventsAlert />` in `AccessCardModules.jsx` while preserving the original `UpcomingEvents.jsx` file.

#### Scenario: Replacement preserves the legacy file

- **GIVEN** the current `AccessCardModules.jsx`, **THEN** `<UpcomingEventsAlert />` MUST be replaced by the new calendar widget layout
- **GIVEN** the replacement, **THEN** the `UpcomingEvents.jsx` file MUST be preserved (not deleted) for potential reuse
