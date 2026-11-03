import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { Provider } from 'react-redux';
import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import React from 'react';
import { configureStore } from '@reduxjs/toolkit';
import { NotesColumn } from './NotesColumn';

vi.mock('react-redux', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
  };
});

vi.mock('../api/notesAPI', () => ({
  useToggleFavoriteMutation: () => [() => {}, { isLoading: false }],
  useGetAllHashtagsQuery: () => ({ data: { data: [] } }),
  useGetAllNotesColumnsQuery: () => ({ data: { data: [] } }),
  useGetMentionsByNoteIdQuery: () => ({ data: { data: [] }, isLoading: false }),
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
  }),
}));

vi.mock('@/modules/users/api/usersApi', () => ({
  useGetUsersByStatusQuery: () => ({
    data: { data: [] },
    isLoading: false,
    isFetching: false,
  }),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key, fallback) =>
      key === 'notes'
        ? 'nota'
        : key === 'no_notes'
          ? 'Sin notas'
          : key === 'note'
            ? 'nota'
            : (fallback ?? key),
  }),
}));

vi.mock('@/config/axios', () => ({
  axiosPrivateBaseQuery: () => async () => ({ data: {} }),
}));

beforeAll(() => {
  vi.setSystemTime(new Date(2026, 0, 15, 10, 0, 0));
});

afterAll(() => {
  vi.useRealTimers();
});

const FIXTURE_DATA = [
  {
    code: 'C01',
    title: 'backlog',
    notes: [
      {
        id: 1,
        title: 'Nota 1',
        createdOn: new Date(2026, 0, 15, 10, 0, 0),
        updatedOn: null,
        isOwner: true,
        isMentioned: false,
        hasUnreadMentions: false,
        color: 'gray',
        mentionIds: [],
        isFavorited: false,
      },
    ],
  },
];

describe('NotesColumn - UI snapshot', () => {
  it('renders a column with one note', () => {
    const store = configureStore({
      reducer: {
        auth: () => ({
          user: { data: { accessToken: null, id: null } },
        }),
      },
    });
    const { container } = render(
      <Provider store={store}>
        <MemoryRouter initialEntries={['/']}>
          <NotesColumn
            data={FIXTURE_DATA}
            onDragStart={() => {}}
            onDragOver={() => {}}
            onDrop={() => {}}
            onDeleteNote={() => {}}
            onEditNote={() => {}}
          />
        </MemoryRouter>
      </Provider>
    );
    const [columnHeader] = container.firstChild.children;
    const card = container.querySelector('[draggable="true"]');
    const [cardHeader, cardContent] = card.children;
    const [titleGroup, actions] = cardHeader.children;

    // G4 segmentación: la columna completa serializa ~163 líneas, así que se
    // captura la cabecera y la tarjeta de la nota por subárbol.
    expect(columnHeader).toMatchInlineSnapshot(
      `
      <div
        class="flex-col space-y-1.5 p-6 text-lg font-bold text-center border-b py-4 flex items-center justify-between bg-gray-50 text-gray-700"
      >
        <span>
          backlog
        </span>
        <span
          class="text-sm font-normal"
        >
          1
           
          nota
        </span>
      </div>
    `,
      'column header with title and note count'
    );
    expect(titleGroup.children[0]).toMatchInlineSnapshot(
      `
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
    `,
      'favorite toggle for the note'
    );
    expect(titleGroup.children[1]).toMatchInlineSnapshot(
      `
      <span
        class="truncate"
      >
        Nota 1
      </span>
    `,
      'note title'
    );
    expect(actions.children[0]).toMatchInlineSnapshot(
      `
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
    `,
      'edit note button'
    );
    expect(actions.children[1]).toMatchInlineSnapshot(
      `
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
    `,
      'delete note button'
    );
    expect(cardContent.querySelector('p')).toMatchInlineSnapshot(
      `
      <p
        class="text-sm text-gray-600"
      >
        created_on
        : 
        January 15th, 2026
      </p>
    `,
      'created on date'
    );
  });
});
