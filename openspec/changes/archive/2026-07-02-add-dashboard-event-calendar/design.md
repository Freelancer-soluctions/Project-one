## Context

The dashboard home page (`apps/client/src/modules/home/components/AccessCardModules.jsx`) currently renders an `<UpcomingEventsAlert />` component at the top that displays upcoming events in a simple alert/carousel format. This provides limited visibility into the event schedule.

A fully featured `EventCalendar.jsx` component (498 lines, v0.dev generated) already exists in the codebase at `apps/client/src/modules/home/components/EventCalendar.jsx`. It renders a monthly grid with event chips, tooltips, and mobile-friendly views. However, it is not yet integrated into the dashboard — it receives data purely through props and has no built-in data fetching.

Data fetching infrastructure already exists:
- `useGetAllEventsQuery` from `@/modules/events/api/eventsAPI` (RTK Query)
- `sortedEvents` utility from `@/modules/events/utils/helpers.js` for filtering/sorting

**Constraints:**
- No backend changes, no route changes, no modifications to `Home.jsx` or `SideBar.jsx`
- `EventCalendar.jsx` itself must remain unchanged (it is generated/vetted code)
- The calendar must be non-invasive — readable but not dominating the page

## Goals / Non-Goals

**Goals:**
- Replace `<UpcomingEventsAlert />` in `AccessCardModules.jsx` with an interactive monthly calendar widget
- Create a thin wrapper component (`EventCalendarWidget.jsx`) that fetches events and passes them to `EventCalendar`
- Responsive layout: sidebar calendar (~280–340px) on desktop (≥1280px), full-width stacked on tablet/mobile
- Add barrel exports to `apps/client/src/modules/home/components/index.js`
- Preserve all existing behavior for the module grid cards

**Non-Goals:**
- Any modifications to `EventCalendar.jsx` itself
- Changes to `SideBar.jsx`, `Home.jsx`, or route configuration
- Backend API changes or database schema changes
- Adding new external dependencies (all needed deps are already present)
- Removing `UpcomingEvents.jsx` file — only its usage in `AccessCardModules.jsx` is removed

## Decisions

### 1. Wrapper Pattern (Presentational + Data-Fetching)

**Decision:** Create `EventCalendarWidget.jsx` as a thin wrapper that handles data fetching via RTK Query and renders the presentational `EventCalendar` component.

**Rationale:**
- Keeps `EventCalendar.jsx` pure and testable (no side effects, no Redux dependency)
- Follows the existing pattern in the codebase where data fetching is separated from presentation
- Allows `EventCalendar` to be reused in other contexts without API coupling
- The wrapper is minimal — it only fetches, sorts, and passes data through

**Alternatives considered:**
- Adding data fetching directly to `EventCalendar.jsx` — rejected because it would couple a reusable component to a specific API shape
- Inlining the fetch in `AccessCardModules.jsx` — rejected because it would add too much responsibility to that component

### 2. Responsive Layout: Flex-Column → xl:Flex-Row

**Decision:** Use Tailwind responsive utilities: `flex flex-col xl:flex-row gap-4 mb-5`. The calendar sits in a 300px container on desktop; the module grid fills the remaining space.

**Rationale:**
- Simple, no external layout library needed
- `xl:` breakpoint (1280px) ensures the calendar sidebar only shows on sufficiently wide screens
- On smaller screens, the calendar stacks above the module grid (full width)
- Avoids CSS-in-JS or complex media queries

### 3. Calendar Width: ~300px on Desktop

**Decision:** Constrain the calendar wrapper to `w-full xl:w-[300px] shrink-0`.

**Rationale:**
- 300px is wide enough for a readable monthly calendar grid
- `shrink-0` prevents the calendar from being compressed when the module grid needs more space
- Matches the compact, non-invasive design goal
- Full width on mobile/tablet for usability

**Alternatives considered:**
- Fixed sidebar with overlay — over-engineered for this use case
- Accordion/collapsible calendar — adds unnecessary interaction complexity

### 4. Reuse Existing `useGetAllEventsQuery` Hook

**Decision:** `EventCalendarWidget` calls `useGetAllEventsQuery({ page: 1, limit: 200, search: '' })` — the same hook `UpcomingEventsAlert` uses.

**Rationale:**
- Zero additional API configuration
- RTK Query caching means the events data is shared — no duplicate network requests
- Calendar needs a broad date range to populate the monthly grid, so limit is higher than UpcomingEvents

### 5. Remove UpcomingEventsAlert Usage Only

**Decision:** Remove the `<UpcomingEventsAlert />` line and its import from `AccessCardModules.jsx`. The `UpcomingEvents.jsx` file remains untouched.

**Rationale:**
- Minimal diff — only 2 lines changed in `AccessCardModules.jsx` (import removal + JSX removal)
- `UpcomingEvents.jsx` may be used elsewhere or re-added in the future
- No dead code elimination required — the file remains available

## Risks / Trade-offs

| Risk | Mitigation |
|------|-----------|
| **Calendar performance with many events** — rendering hundreds of events in the monthly grid could cause jank | `EventCalendar` already implements virtualization-adjacent patterns (only renders visible month). Limit API fetch to 200 events. |
| **Network request duplication** — if `UpcomingEventsAlert` also fetches events before removal, there's a brief period of double-fetching | Since the replacement is atomic (remove import + add new component in one commit), there's no overlap. RTK Query's deduplication also prevents duplicate requests for the same endpoint. |
| **Responsive layout breakage** — the new flex layout might conflict with existing grid classes | The calendar wrapper is placed *outside* the existing grid divs, wrapping them. The inner module grid divs remain unchanged. |
| **Tooltip/modal positioning** — EventCalendar tooltips could get clipped inside the flex container | `EventCalendar` uses shadcn/ui `Tooltip` with portal-based rendering, so tooltips escape their parent container. |
| **Mobile usability** — a 300px calendar grid could be hard to interact with on small touchscreens | On screens below 1280px, the calendar takes full width (`w-full`). Touch targets within EventCalendar are already sized for mobile by the v0.dev implementation. |
