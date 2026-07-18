# Tasks: add-dashboard-event-calendar

## Task 1: Create EventCalendarWidget wrapper
- [ ] Create `apps/client/src/modules/home/components/EventCalendarWidget.jsx`
- [ ] Use NAMED export: `export function EventCalendarWidget(...)`
- [ ] Import `useGetAllEventsQuery` from `@/modules/events/api/eventsAPI`
- [ ] Import `sortedEvents` from `@/modules/events/utils`
- [ ] Import `EventCalendar` from `./EventCalendar`
- [ ] Fetch events: `useGetAllEventsQuery({ page: 1, limit: 200, search: '' })`
- [ ] Sort events with `sortedEvents()`, pass to EventCalendar as props
- [ ] Handle loading state via `isLoading` prop

## Task 2: Update AccessCardModules layout
- [ ] Open `apps/client/src/modules/home/components/AccessCardModules.jsx`
- [ ] Add import for `EventCalendarWidget`
- [ ] Remove `<UpcomingEventsAlert />` import and usage
- [ ] Wrap calendar + first module grid in flex container:
  - `className="flex flex-col xl:flex-row gap-4 mb-5"`
- [ ] Calendar wrapper: `className="w-full xl:w-[300px] shrink-0"`
- [ ] Module grid wrapper: `className="flex-1 min-w-0"`
- [ ] Pass `onEventClick` handler to calendar that navigates to `/home/events` with event ID via `useNavigate`

## Task 3: Update barrel exports
- [ ] Open `apps/client/src/modules/home/components/index.js`
- [ ] Add `export * from './EventCalendarWidget'` (EventCalendar export already exists)

## Task 4: Tests
- [ ] Write unit test for `EventCalendarWidget`: mock `useGetAllEventsQuery`, verify events sorted and passed to Calendar
- [ ] Write integration test: render with MSW, verify events appear in calendar grid
- [ ] Verify responsive layout renders correct view (grid vs list) at different viewports

## Task 5: Verify integration
- [ ] Run `npm run build` to verify no compilation errors
- [ ] Run `npm run lint` for linting
- [ ] Test responsive layout: mobile (<768px), tablet (768-1279px), desktop (≥1280px)
- [ ] Verify calendar loads events correctly
- [ ] Verify module grid renders correctly beside calendar
