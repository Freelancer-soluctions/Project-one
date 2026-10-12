import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, it, expect, vi } from 'vitest';
import { NotesSummary } from './NotesSummary';

// Fixed RTK Query count fixture (deterministic, no network/MSW round-trip;
// there is no server.use() precedent in src — every suite uses vi.mock).
vi.mock('@/modules/notes/api/notesAPI', () => ({
  useGetAllCountNotesQuery: () => ({
    data: { data: { backlog: 2, active: 3, completed: 1 } },
    isLoading: false,
  }),
}));

// Breaks the config/axios <-> redux/store import cycle (NotesColumn precedent).
vi.mock('@/config/axios', () => ({
  axiosPrivateBaseQuery: () => async () => ({ data: {} }),
}));

describe('NotesSummary - UI snapshot', () => {
  it('renders the status alerts with fixed counts', () => {
    const { container } = render(
      <MemoryRouter initialEntries={['/home']}>
        <NotesSummary scope="mine" />
      </MemoryRouter>
    );
    expect(container.firstChild).toMatchInlineSnapshot(
      `
      <div
        class="rounded-xl bg-card text-card-foreground border-0 shadow-none"
      >
        <div
          class="flex flex-col space-y-1.5 p-6"
        >
          <h3
            class="font-semibold leading-none tracking-tight"
          >
            Status of notes
          </h3>
        </div>
        <div
          class="p-6 pt-0 space-y-4"
        >
          <div
            class="space-y-4"
          >
            <div
              class="relative w-full rounded-lg border px-4 py-3 text-sm [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground [&>svg~*]:pl-7 text-foreground border-gray-200 bg-gray-50/50 hover:bg-gray-100/50 cursor-pointer"
              role="alert"
            >
              <div
                class="text-sm [&_p]:leading-relaxed flex items-center justify-between"
              >
                <span>
                  Backlog
                </span>
                <div
                  class="flex items-center gap-2"
                >
                  <span
                    class="font-semibold text-gray-700"
                  >
                    2
                  </span>
                  <svg
                    class="w-4 h-4 text-gray-700"
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
                      d="M5 12h14"
                    />
                    <path
                      d="m12 5 7 7-7 7"
                    />
                  </svg>
                </div>
              </div>
            </div>
            <div
              class="relative w-full rounded-lg border px-4 py-3 text-sm [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground [&>svg~*]:pl-7 text-foreground border-amber-200 bg-amber-50/50 hover:bg-amber-100/50 cursor-pointer"
              role="alert"
            >
              <div
                class="text-sm [&_p]:leading-relaxed flex items-center justify-between"
              >
                <span>
                  Active
                </span>
                <div
                  class="flex items-center gap-2"
                >
                  <span
                    class="font-semibold text-amber-700"
                  >
                    3
                  </span>
                  <svg
                    class="w-4 h-4 text-amber-700"
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
                      d="M5 12h14"
                    />
                    <path
                      d="m12 5 7 7-7 7"
                    />
                  </svg>
                </div>
              </div>
            </div>
            <div
              class="relative w-full rounded-lg border px-4 py-3 text-sm [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground [&>svg~*]:pl-7 text-foreground border-emerald-200 bg-emerald-50/50 hover:bg-emerald-100/50 cursor-pointer"
              role="alert"
            >
              <div
                class="text-sm [&_p]:leading-relaxed flex items-center justify-between"
              >
                <span>
                  Completed
                </span>
                <div
                  class="flex items-center gap-2"
                >
                  <span
                    class="font-semibold text-emerald-700"
                  >
                    1
                  </span>
                  <svg
                    class="w-4 h-4 text-emerald-700"
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
                      d="M5 12h14"
                    />
                    <path
                      d="m12 5 7 7-7 7"
                    />
                  </svg>
                </div>
              </div>
            </div>
          </div>
          <button
            class="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2 w-full mt-2"
          >
            Show all notes
          </button>
        </div>
      </div>
    `,
      'status alerts with fixed backlog, active and completed counts'
    );
  });
});
