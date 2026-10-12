import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { EventList } from './EventList';

// Local noon: the "EEEE d 'de' MMMM" heading prints the same day in any
// timezone (a bare YYYY-MM-DD date parses as UTC midnight and shifts days
// west of Greenwich).
const FIXTURE_EVENTS = [
  {
    id: 1,
    eventDate: '2026-01-15T12:00:00',
    startTime: '09:00',
    endTime: '10:30',
    title: 'Evento fijo',
    speaker: 'Speaker A',
    description: 'Descripcion congelada',
    eventTypes: { code: 'PRESEN', description: 'Presencial' },
    modality: 'ONLINE',
    meetingUrl: 'https://example.com/meeting',
  },
];

describe('EventList - UI snapshot', () => {
  it('renders one frozen event group with fixed pagination', () => {
    const { container } = render(
      <EventList
        events={FIXTURE_EVENTS}
        pageIndex={0}
        pageSize={10}
        total={1}
        onPageChange={() => {}}
        onEdit={() => {}}
        onDelete={() => {}}
      />
    );
    expect(container.firstChild).toMatchInlineSnapshot(
      `
      <div
        class="space-y-8"
      >
        <div
          class="space-y-4"
        >
          <h2
            class="text-lg font-semibold sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 py-2"
          >
            jueves 15 de enero, 2026
          </h2>
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
                  Evento fijo
                </div>
                <div
                  class="text-sm text-muted-foreground"
                >
                  Speaker A
                </div>
                <div
                  class="text-sm"
                >
                  Descripcion congelada
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
                      class="lucide lucide-video h-4 w-4"
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
                    Online
                  </span>
                  <a
                    class="text-xs px-2 py-1 rounded-full bg-green-100 text-green-800 flex items-center gap-1 hover:bg-green-200 transition-colors"
                    href="https://example.com/meeting"
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    <svg
                      class="h-3 w-3"
                      fill="none"
                      height="1em"
                      stroke="currentColor"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      viewBox="0 0 24 24"
                      width="1em"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M15 3h6v6"
                      />
                      <path
                        d="M10 14 21 3"
                      />
                      <path
                        d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"
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
                  class="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 hover:bg-accent hover:text-accent-foreground h-9 w-9"
                >
                  <svg
                    class="w-4 h-4"
                    fill="none"
                    height="1em"
                    stroke="currentColor"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    viewBox="0 0 24 24"
                    width="1em"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"
                    />
                    <path
                      d="m15 5 4 4"
                    />
                  </svg>
                </button>
                <button
                  class="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 hover:bg-accent hover:text-accent-foreground h-9 w-9"
                >
                  <svg
                    class="w-4 h-4"
                    fill="none"
                    height="1em"
                    stroke="currentColor"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    viewBox="0 0 24 24"
                    width="1em"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M3 6h18"
                    />
                    <path
                      d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"
                    />
                    <path
                      d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"
                    />
                    <line
                      x1="10"
                      x2="10"
                      y1="11"
                      y2="17"
                    />
                    <line
                      x1="14"
                      x2="14"
                      y1="11"
                      y2="17"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `,
      'single frozen event group with type, modality and meeting link'
    );
  });
});
