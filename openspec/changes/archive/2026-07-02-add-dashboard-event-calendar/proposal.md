## Why

The dashboard home page currently shows an `UpcomingEventsAlert` carousel that only displays upcoming events in a limited, scrollable format. This provides a poor at-a-glance overview of the event calendar. Replacing it with an interactive monthly calendar widget gives users a richer, more intuitive way to browse events by date, see event density at a glance, and navigate between months — significantly improving the dashboard's utility as a central hub.

## What Changes

- **NEW** `EventCalendarWidget.jsx` — a wrapper component that fetches events via RTK Query (`useGetAllEventsQuery`), filters/sorts them using the existing `sortedEvents` utility, and renders the pre-built `<EventCalendar>` component with data as props
- **MODIFY** `AccessCardModules.jsx` — replace `<UpcomingEventsAlert />` with a responsive flex layout: desktop (≥1280px) shows calendar on the left (~280-340px) + module grid on the right; tablet/mobile stacks vertically with alternative list/collapsible view
- **MODIFY** `apps/client/src/modules/home/components/index.js` — add barrel exports for `EventCalendarWidget` (and confirm `EventCalendar` export already exists)
- **REMOVE** `UpcomingEventsAlert` import and usage from `AccessCardModules.jsx` (the `UpcomingEvents.jsx` file itself may remain unchanged — only its usage in the dashboard is removed)

## Capabilities

### New Capabilities
- `dashboard-event-calendar`: Interactive monthly calendar widget on the dashboard home page. Displays events fetched from the events API in a grid-month layout with event chips, tooltips, and month navigation. Supports responsive layouts (desktop sidebar, tablet/mobile stacked).

### Modified Capabilities

*None.* No existing specs cover dashboard home components or event display behavior. This is a purely additive UI change.

## Impact

- **Components affected:**
  - `apps/client/src/modules/home/components/AccessCardModules.jsx` — layout restructured, UpcomingEventsAlert removed
  - `apps/client/src/modules/home/components/index.js` — new export added
- **New file:**
  - `apps/client/src/modules/home/components/EventCalendarWidget.jsx` — wrapper/data-fetching component
- **No changes to:**
  - `EventCalendar.jsx` itself (already exists and works)
  - `SideBar.jsx`, `Home.jsx`, routes
  - Backend, API contracts, database
  - Existing events API or utility functions
