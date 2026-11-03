import { render } from '@testing-library/react';
import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import { EventCalendarWidget } from './EventCalendarWidget';

// Query shape of `useGetAllEventsQuery` (RTK Query + axios base query): the
// hook's `data` is the server envelope, whose `data` is the paginated payload
// and whose own `data` holds the event rows — the component reads
// `data?.data?.data`, so the fixture must nest one level deeper than a bare
// row array (before this test could only ever assert the empty state).
vi.mock('@/modules/events/api/eventsAPI', () => ({
  useGetAllEventsQuery: vi.fn(() => ({
    data: {
      data: {
        data: [
          {
            id: 1,
            eventDate: '2026-01-15',
            startTime: '09:00',
            endTime: '10:30',
            title: 'Demo día frozen',
            speaker: 'Speaker A',
            description: 'Descripción congelada',
            eventType: { code: 'PRESEN', description: 'Presencial' },
            eventType2: null,
            eventTypes: { code: 'PRESEN', description: 'Presencial' },
            modality: 'ONLINE',
            meetingUrl: 'https://example.com/meeting',
          },
        ],
        total: 1,
        page: 1,
        limit: 200,
        totalPages: 1,
      },
    },
    isLoading: false,
  })),
}));

// EventCalendar usa window.matchMedia en un efecto → mock obligatorio en test unit.
beforeAll(() => {
  window.matchMedia = vi.fn(() => ({
    matches: false,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }));
  vi.setSystemTime(new Date(2026, 0, 15, 9, 0, 0));
});

afterAll(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe('EventCalendarWidget - UI snapshot', () => {
  it('renders the January 2026 grid with a single frozen event', () => {
    const { container } = render(
      <EventCalendarWidget onEventClick={() => {}} />
    );
    const root = container.firstChild;
    const [monthLabel, navigation] = root.firstElementChild.children;
    const body = root.lastElementChild;
    const weekdayRow = body.firstElementChild;
    const dayGrid = body.lastElementChild.querySelector(
      '[class*="grid-cols-7"]'
    );
    const dayCells = Array.from(dayGrid.children);
    // Semana inicial (lunes): 29-30-31 de diciembre + 1 de enero en el índice 3.
    const firstOutOfMonthCell = dayCells[0];
    const firstInMonthCell = dayCells[3];
    const eventCell = dayCells.find((cell) =>
      cell.textContent.includes('Demo día frozen')
    );

    // G4 segmentación: el grid completo serializa ~700 líneas, así que se
    // captura por subárbol (cabecera, días de la semana, celdas
    // representativas y el chip del evento congelado).
    expect(monthLabel).toMatchInlineSnapshot(
      `
      <div
        class="flex items-center gap-2"
      >
        <svg
          aria-hidden="true"
          class="lucide lucide-calendar size-5 text-muted-foreground"
          fill="none"
          height="24"
          stroke="currentColor"
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          viewBox="0 0 24 24"
          width="24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M8 2v4"
          />
          <path
            d="M16 2v4"
          />
          <rect
            height="18"
            rx="2"
            width="18"
            x="3"
            y="4"
          />
          <path
            d="M3 10h18"
          />
        </svg>
        <h2
          class="text-base font-semibold capitalize"
        >
          Enero 2026
        </h2>
      </div>
    `,
      'month title with calendar icon'
    );
    expect(navigation).toMatchInlineSnapshot(
      `
      <div
        class="flex items-center gap-1"
      >
        <button
          aria-label="Mes anterior"
          class="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 hover:bg-accent hover:text-accent-foreground h-9 w-9"
        >
          <svg
            class="lucide lucide-chevron-left size-4"
            fill="none"
            height="24"
            stroke="currentColor"
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            viewBox="0 0 24 24"
            width="24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="m15 18-6-6 6-6"
            />
          </svg>
        </button>
        <button
          aria-label="Mes siguiente"
          class="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 hover:bg-accent hover:text-accent-foreground h-9 w-9"
        >
          <svg
            class="lucide lucide-chevron-right size-4"
            fill="none"
            height="24"
            stroke="currentColor"
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            viewBox="0 0 24 24"
            width="24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="m9 18 6-6-6-6"
            />
          </svg>
        </button>
      </div>
    `,
      'previous and next month buttons'
    );
    expect(weekdayRow).toMatchInlineSnapshot(
      `
      <div
        class="grid grid-cols-7 border-b"
      >
        <div
          class="p-2 text-center text-xs font-semibold text-muted-foreground"
        >
          Lun
        </div>
        <div
          class="p-2 text-center text-xs font-semibold text-muted-foreground"
        >
          Mar
        </div>
        <div
          class="p-2 text-center text-xs font-semibold text-muted-foreground"
        >
          Mié
        </div>
        <div
          class="p-2 text-center text-xs font-semibold text-muted-foreground"
        >
          Jue
        </div>
        <div
          class="p-2 text-center text-xs font-semibold text-muted-foreground"
        >
          Vie
        </div>
        <div
          class="p-2 text-center text-xs font-semibold text-muted-foreground"
        >
          Sáb
        </div>
        <div
          class="p-2 text-center text-xs font-semibold text-muted-foreground"
        >
          Dom
        </div>
      </div>
    `,
      'weekday header row'
    );
    expect(firstOutOfMonthCell).toMatchInlineSnapshot(
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
            29
          </span>
        </div>
        <div
          class="space-y-0.5"
        />
      </div>
    `,
      'last day of the previous month, muted'
    );
    expect(firstInMonthCell).toMatchInlineSnapshot(
      `
      <div
        class="min-h-[80px] cursor-pointer border-b border-r p-1.5 last:border-r-0 lg:min-h-[100px]"
      >
        <div
          class="mb-1 flex items-center justify-between"
        >
          <span
            class="flex size-6 items-center justify-center rounded-full text-xs"
          >
            1
          </span>
        </div>
        <div
          class="space-y-0.5"
        />
      </div>
    `,
      'first in-month day without events'
    );
    expect(eventCell).toBeDefined();
    expect(eventCell.firstElementChild).toMatchInlineSnapshot(
      `
      <div
        class="mb-1 flex items-center justify-between"
      >
        <span
          class="flex size-6 items-center justify-center rounded-full text-xs bg-primary font-semibold text-primary-foreground"
        >
          15
        </span>
      </div>
    `,
      'day number badge highlighted as today'
    );
    expect(eventCell.querySelector('button')).toMatchInlineSnapshot(
      `
      <button
        class="flex w-full items-center gap-1.5 rounded-sm px-1 py-0.5 text-left text-xs transition-colors hover:bg-muted/50"
        data-state="closed"
        type="button"
      >
        <span
          aria-hidden="true"
          class="size-2 shrink-0 rounded-full bg-gray-500"
        />
        <span
          class="shrink-0 tabular-nums text-muted-foreground"
        >
          09:00
        </span>
        <span
          class="line-clamp-1 flex-1 font-medium"
        >
          Demo día frozen
        </span>
        <svg
          aria-hidden="true"
          class="lucide lucide-video size-3 shrink-0 text-muted-foreground"
          fill="none"
          height="24"
          stroke="currentColor"
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          viewBox="0 0 24 24"
          width="24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="m16 13 5.223 3.482a.5.5 0 0 0 .777-.416V7.87a.5.5 0 0 0-.752-.432L16 10.5"
          />
          <rect
            height="12"
            rx="2"
            width="14"
            x="2"
            y="6"
          />
        </svg>
      </button>
    `,
      'frozen event chip with time, title and modality icon'
    );
  });
});
