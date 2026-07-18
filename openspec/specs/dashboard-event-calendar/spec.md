# Spec: dashboard-event-calendar

## ADDED Requirements

### RC-01: Calendar Wrapper Component
- GIVEN the dashboard page, WHEN the page loads, THEN a new `EventCalendarWidget` component MUST fetch all events via `useGetAllEventsQuery()`.
- GIVEN the events data, WHEN it is loaded, THEN it MUST be sorted by date and time using `sortedEvents()`.
- GIVEN loading state, WHEN events are being fetched, THEN the `isLoading` prop MUST be passed to `EventCalendar`.
- GIVEN error state, WHEN the query fails, THEN the calendar MUST render empty state gracefully.

### RC-02: Calendar Display
- GIVEN the dashboard, WHEN the screen is ≥1280px (xl), THEN the EventCalendar MUST render as a sidebar widget ~300px wide next to the module grid.
- GIVEN the dashboard, WHEN the screen is <1280px, THEN the EventCalendar MUST render full-width stacked above the module grid.
- GIVEN the mobile view (<768px), THEN the EventCalendar MUST use its built-in mobile list view.

### RC-03: Event Click Interaction
- GIVEN an event chip in the calendar, WHEN clicked, THEN it MUST call `onEventClick(event)` callback. The parent navigates to `/home/events` with the event ID.
- GIVEN a date cell in the calendar, WHEN clicked (empty area), THEN it MAY trigger a callback for creating an event on that date via `onDateClick(date)`.

### RC-04: Non-invasive Layout
- GIVEN the dashboard layout, WHEN the calendar is visible, THEN it MUST NOT push module cards off-screen or break the existing grid.
- GIVEN the desktop layout, THEN the calendar MUST use `xl:w-[300px] shrink-0` to stay compact.
- GIVEN the module grid, THEN the grid MUST remain at its original column configuration (`sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-8`).

### RC-05: Component Registration
- GIVEN the home components barrel export, THEN `EventCalendar` and `EventCalendarWidget` MUST be exported from `index.js` using NAMED exports (not default).

### RC-06: UpcomingEvents Replacement
- GIVEN the current `AccessCardModules.jsx`, THEN `<UpcomingEventsAlert />` MUST be replaced by the new calendar widget layout.
- GIVEN the replacement, THEN the `UpcomingEvents.jsx` file MUST be preserved (not deleted) for potential reuse.
