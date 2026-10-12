import { render } from '@testing-library/react';
import { Provider } from 'react-redux';
import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';
import { NotesCard } from './NotesCard';

vi.mock('../api/notesAPI', () => ({
  useToggleFavoriteMutation: () => [() => {}, { isLoading: false }],
  useGetAllHashtagsQuery: () => ({ data: { data: [] } }),
  useGetAllNotesColumnsQuery: () => ({ data: { data: [] } }),
  useGetMentionsByNoteIdQuery: () => ({
    data: { data: [] },
    isLoading: false,
    isError: false,
  }),
}));

vi.mock('../hooks', () => ({
  useGetActiveUsers: () => ({
    dataUsers: [],
    isLoadingUsers: false,
    isFetchingUsers: false,
  }),
  useGetHashtagItems: () => ({ hashtagItems: [] }),
  useGetNoteColumns: () => ({
    dataColumns: [],
    isLoadingColumns: false,
    isFetchingColumns: false,
    isErrorColumns: false,
  }),
}));

vi.mock('@/modules/users/api/usersApi', () => ({
  useGetUsersByStatusQuery: () => ({
    data: { data: [] },
    isLoading: false,
    isFetching: false,
  }),
}));

// useSocket inert without a token: no socket connection in the snapshot.
vi.mock('@/hooks/useSocket', () => ({
  useSocket: () => ({ socket: null, isConnected: false, isError: false }),
}));

vi.mock('@/config/axios', () => ({
  axiosPrivateBaseQuery: () => async () => ({ data: {} }),
}));

// Local noon: date-fns PPP prints the same day in any timezone.
const FIXTURE_NOTE = {
  id: 1,
  title: 'Nota fija',
  createdOn: new Date(2026, 0, 15, 12, 0, 0),
  updatedOn: new Date(2026, 0, 15, 12, 0, 0),
  isOwner: true,
  isMentioned: false,
  hasUnreadMentions: false,
  color: 'gray',
  mentionIds: [],
  isFavorited: false,
};

beforeAll(() => {
  vi.setSystemTime(new Date(2026, 0, 15, 12, 0, 0));
});

afterAll(() => {
  vi.useRealTimers();
});

describe('NotesCard - UI snapshot', () => {
  it('renders an owned gray note with dialogs closed', () => {
    const store = configureStore({
      reducer: {
        auth: () => ({
          user: { data: { accessToken: null, id: null } },
        }),
      },
    });
    const { container } = render(
      <Provider store={store}>
        <NotesCard
          note={FIXTURE_NOTE}
          onDragStart={() => {}}
          onDelete={() => {}}
          onEdit={() => {}}
          columnCode="C01"
        />
      </Provider>
    );
    expect(container.firstChild).toMatchInlineSnapshot(
      `
      <div
        class="rounded-xl border text-card-foreground shadow cursor-move transition-all duration-200 hover:shadow-lg group bg-gray-50 hover:bg-gray-100 border-gray-200"
        draggable="true"
      >
        <div
          class="space-y-1.5 font-semibold p-3 flex flex-row items-center justify-between text-gray-700"
        >
          <div
            class="flex items-center gap-1 min-w-0 truncate"
          >
            <button
              aria-label="mark_as_favorite"
              aria-pressed="false"
              class="justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 hover:text-accent-foreground h-9 w-9 inline-flex items-center gap-2 p-0 hover:bg-transparent"
              type="button"
            >
              <svg
                class="lucide lucide-star h-4 w-4 transition-colors duration-200 fill-transparent text-muted-foreground hover:text-muted-foreground/80"
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
                  d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z"
                />
              </svg>
            </button>
            <span
              class="truncate"
            >
              Nota fija
            </span>
          </div>
          <div
            class="flex gap-1 transition-opacity opacity-0 group-hover:opacity-100 shrink-0"
          >
            <button
              class="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 hover:bg-accent w-8 h-8 text-gray-500 hover:text-blue-600"
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
              class="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 hover:bg-accent w-8 h-8 text-gray-500 hover:text-red-600"
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
        <div
          class="p-3 pt-0"
        >
          <p
            class="text-sm text-gray-600"
          >
            Created on
            : 
            January 15th, 2026
          </p>
        </div>
      </div>
    `,
      'owned gray note card with favorite toggle and closed dialogs'
    );
  });
});
