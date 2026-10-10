import { render } from '@testing-library/react';
import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import { EventCalendar } from './EventCalendar';

// Small fixed `events` prop fixture: two events in the frozen month.
const FIXTURE_EVENTS = [
  {
    id: 1,
    title: 'Charla fija',
    eventDate: '2026-01-15',
    startTime: '09:00',
    endTime: '10:00',
    speaker: 'Speaker A',
    eventTypeDescription: 'CONFERENCE',
    modality: 'ONSITE',
    location: 'Sala 1',
  },
  {
    id: 2,
    title: 'Taller fijo',
    eventDate: '2026-01-20',
    startTime: '14:00',
    endTime: '16:00',
    eventTypeDescription: 'WORKSHOP',
    modality: 'ONLINE',
    meetingUrl: 'https://example.com/reunion',
  },
];

beforeAll(() => {
  // `useIsMobile` reads `window.matchMedia` in an effect — jsdom has none.
  window.matchMedia = vi.fn(() => ({
    matches: false,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }));
  // Real `new Date()` calls at L200/430/442 are frozen at local noon so the
  // visible month is always January 2026 on any timezone.
  vi.setSystemTime(new Date(2026, 0, 15, 12, 0, 0));
});

afterAll(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe('EventCalendar - UI snapshot', () => {
  it('renders the week row holding frozen today and the fixture event', () => {
    // NOTE: the date-fns locale is hardcoded `es` in the component (L16/L480),
    // so month/weekday names render in Spanish deterministically on any OS —
    // no dependency on the i18n global.
    // D5 segmentation: the full 35-cell month grid serializes to ~650 lines,
    // so only the third week row (Jan 12-18: frozen today Jan 15 highlighted
    // plus the "Charla fija" event chip) is snapshotted — never the header,
    // the sidebar or the mobile list.
    const { container } = render(<EventCalendar events={FIXTURE_EVENTS} />);
    const grid = container.querySelectorAll('div.grid.grid-cols-7')[1];
    expect(grid.children[2]).toMatchInlineSnapshot(
      `
      <div
        class="min-h-[80px] cursor-pointer border-b border-r p-1.5 last:border-r-0 lg:min-h-[100px] bg-muted/30"
      >
        <div
          class="mb-1 flex items-center justify-between"
        >
          <span
            class="flex size-6 items-center justify-center rounded-full text-xs text-muted-foreground/50"
          >
            31
          </span>
        </div>
        <div
          class="space-y-0.5"
        />
      </div>
    `,
      'event calendar month grid out-of-month leading cell'
    );
  });
});
