import { render } from '@testing-library/react';
import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import { EventCalendarWidget } from './EventCalendarWidget';

vi.mock('@/modules/events/api/eventsAPI', () => ({
  useGetAllEventsQuery: vi.fn(() => ({
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
  it('renders the widget with a single frozen event', () => {
    const { container } = render(
      <EventCalendarWidget onEventClick={() => {}} />
    );
    expect(container.firstChild).toMatchInlineSnapshot(
      `
      <div
        class="rounded-xl border bg-card text-card-foreground shadow flex h-full flex-col overflow-hidden"
      >
        <div
          class="flex items-center justify-between gap-2 border-b p-3"
        >
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
        </div>
        <div
          class="flex flex-1 flex-col items-center justify-center gap-2 p-12 text-center"
        >
          <svg
            aria-hidden="true"
            class="lucide lucide-calendar size-10 text-muted-foreground/50"
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
          <p
            class="text-sm text-muted-foreground"
          >
            No hay eventos para este mes
          </p>
        </div>
      </div>
    `,
      `<div
  class="flex flex-col xl:flex-row gap-4 mb-5"
>
  <div
    class="w-full xl:w-[300px] shrink-0"
  >
    <div
      class="text-lg font-semibold sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 py-2"
    >
      Viernes 15 de enero, 2026
    </div>
    <div
      class="grid grid-cols-1 sm:grid-cols-[120px_1fr] gap-4 items-start rounded-lg border p-4 transition-colors hover:bg-muted/50"
    >
      <div
        class="flex items-center justify-between text-sm sm:block"
      >
        <div
          class="font-medium"
        >
          09:00
        </div>
        <div
          class="text-muted-foreground"
        >
          10:30
        </div>
      </div>
      <div
        class="flex flex-col justify-between gap-4 sm:flex-row"
      >
        <div
          class="space-y-1"
        >
          <div
            class="font-semibold"
          >
            Demo día frozen
          </div>
          <div
            class="text-sm text-muted-foreground"
          >
            Speaker A
          </div>
          <div
            class="text-sm"
          >
            Descripción congelada
          </div>
          <div
            class="mt-2 flex flex-wrap gap-2 items-center"
          >
            <span
              class="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-800"
            >
              Presencial
            </span>
            <span
              class="text-xs px-2 py-1 rounded-full flex items-center gap-1 bg-blue-100 text-blue-800"
            >
              <svg
                class="inline-block h-3 w-3"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path
                  d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm0 21.6C6.194 21.6 1.2 16.606 1.2 10.8S6.194 0 12 0s10.8 4.994 10.8 10.8S17.806 21.6 12 21.6z"
                />
              </svg>
              Online
            </span>
            <a
              class="text-xs px-2 py-1 rounded-full bg-green-100 text-green-800 flex items-center gap-1 hover:bg-green-200 transition-colors"
              href="https://example.com/meeting"
              rel="noopener noreferrer"
              target="_blank"
            >
              <svg
                class="inline-block h-3 w-3"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path
                  d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm0 21.6C6.194 21.6 1.2 16.606 1.2 10.8S6.194 0 12 0s10.8 4.994 10.8 10.8S17.806 21.6 12 21.6z"
                />
              </svg>
              Unirse
            </a>
          </div>
        </div>
        <div
          class="flex gap-2"
        >
          <button
            class="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 bg-transparent text-foreground shadow hover:bg-accent hover:text-accent-foreground h-9 w-9 p-1 rounded"
            type="button"
          >
            <svg
              class="inline-block h-4 w-4"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path
                d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83c.39-.39.39-1.02 0-1.41l-2.34-2.34C19.98 3.81 18.36 3 16.74 3c-1.62 0-3.24 1.53-3.24 3.18 0 .48.41.93.93 1.37l-1.5 1.5c-.09.09-.09.24 0 .33l3.75 3.75c.1.1.24.09.33 0l1.5-1.5c.44-.44.93-.93 1.37-1.37 1.65-1.65 1.65-3.9 0-5.55z"
              />
            </svg>
          </button>
          <button
            class="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 bg-transparent text-foreground shadow hover:bg-accent hover:text-accent-foreground h-9 w-9 p-1 rounded"
            type="button"
          >
            <svg
              class="inline-block h-4 w-4"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path
                d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  </div>
</div>`
    );
  });
});
