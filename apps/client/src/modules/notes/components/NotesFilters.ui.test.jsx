import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { NotesFilters } from './NotesFilters';

// Same relative specifier the component imports ('../hooks/index').
vi.mock('../hooks/index', () => ({
  useGetHashtagItems: () => ({
    hashtagItems: [
      { id: '1', name: 'frontend' },
      { id: '2', name: 'backend' },
    ],
  }),
  useGetNoteColumns: () => ({
    dataColumns: [
      { id: 1, code: 'TODO', title: 'Por hacer' },
      { id: 2, code: 'DONE', title: 'Hecho' },
    ],
    isLoadingColumns: false,
    isFetchingColumns: false,
  }),
}));

// No RHF involved: plain callback props with a fixed `filters` object.
const BASE_PROPS = {
  onSearch: () => {},
  onSearchStatus: () => {},
  onFavoriteFilter: () => {},
  filters: { searchTerm: '', statusCode: 'TODO', isFavorite: false },
  handleReset: () => {},
  setOpen: () => {},
  selectedHashtagIds: [1],
  onHashtagSelectionChange: () => {},
  onCreateHashtag: () => {},
  onEditHashtag: () => {},
  onDeleteHashtag: () => {},
  scope: 'mine',
  onScopeChange: () => {},
};

function renderFilters() {
  return render(<NotesFilters {...BASE_PROPS} />);
}

describe('NotesFilters - UI snapshot', () => {
  it('renders the search input block', () => {
    const { container } = renderFilters();
    expect(
      container.querySelector('#textSearch').closest('div')
    ).toMatchInlineSnapshot(
      `
      <div
        class="flex-1 max-w-md"
      >
        <label
          class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          for="textSearch"
        >
          Search
        </label>
        <input
          class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 py-2 pr-4"
          id="textSearch"
          maxlength="100"
          placeholder="Search notes..."
          type="text"
          value=""
        />
      </div>
    `,
      'notes filters search input block'
    );
  });

  it('renders the status select block', () => {
    renderFilters();
    expect(screen.getByRole('combobox').closest('div')).toMatchInlineSnapshot(
      `
      <div
        class="flex-1 max-w-md"
      >
        <label
          class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          for="statusNotes"
        >
          Status
        </label>
        <button
          aria-autocomplete="none"
          aria-controls="radix-:r4:"
          aria-expanded="false"
          class="flex h-9 w-full items-center justify-between whitespace-nowrap rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1"
          data-state="closed"
          dir="ltr"
          role="combobox"
          type="button"
        >
          <span
            style="pointer-events: none;"
          >
            Por hacer
          </span>
          <svg
            aria-hidden="true"
            class="h-4 w-4 opacity-50"
            fill="none"
            height="15"
            viewBox="0 0 15 15"
            width="15"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              clip-rule="evenodd"
              d="M4.93179 5.43179C4.75605 5.60753 4.75605 5.89245 4.93179 6.06819C5.10753 6.24392 5.39245 6.24392 5.56819 6.06819L7.49999 4.13638L9.43179 6.06819C9.60753 6.24392 9.89245 6.24392 10.0682 6.06819C10.2439 5.89245 10.2439 5.60753 10.0682 5.43179L7.81819 3.18179C7.73379 3.0974 7.61933 3.04999 7.49999 3.04999C7.38064 3.04999 7.26618 3.0974 7.18179 3.18179L4.93179 5.43179ZM10.0682 9.56819C10.2439 9.39245 10.2439 9.10753 10.0682 8.93179C9.89245 8.75606 9.60753 8.75606 9.43179 8.93179L7.49999 10.8636L5.56819 8.93179C5.39245 8.75606 5.10753 8.75606 4.93179 8.93179C4.75605 9.10753 4.75605 9.39245 4.93179 9.56819L7.18179 11.8182C7.35753 11.9939 7.64245 11.9939 7.81819 11.8182L10.0682 9.56819Z"
              fill="currentColor"
              fill-rule="evenodd"
            />
          </svg>
        </button>
      </div>
    `,
      'notes filters status select block'
    );
  });

  it('renders the favorite toggle block', () => {
    const { container } = renderFilters();
    expect(container.querySelector('[aria-pressed]')).toMatchInlineSnapshot(
      `
      <button
        aria-label="Show favorites only"
        aria-pressed="false"
        class="justify-center whitespace-nowrap font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 hover:bg-accent hover:text-accent-foreground h-8 rounded-md text-xs inline-flex items-center gap-2 px-3"
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
        <span
          class="text-sm font-medium text-muted-foreground"
        >
          Show favorites only
        </span>
      </button>
    `,
      'notes filters favorite toggle block'
    );
  });

  it('renders the hashtags block with the popover closed', () => {
    // S2: the Popover stays CLOSED — its open markup is animated/unstable,
    // so only the trigger button is snapshotted, never the whole form.
    renderFilters();
    expect(
      screen.getByRole('button', { name: /Hashtags/ })
    ).toMatchInlineSnapshot(
      `
      <button
        aria-expanded="false"
        aria-haspopup="dialog"
        class="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2 gap-2"
        data-state="closed"
        type="button"
      >
        <svg
          class="h-4 w-4"
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
            d="m15 5 6.3 6.3a2.4 2.4 0 0 1 0 3.4L17 19"
          />
          <path
            d="M9.586 5.586A2 2 0 0 0 8.172 5H3a1 1 0 0 0-1 1v5.172a2 2 0 0 0 .586 1.414L8.29 18.29a2.426 2.426 0 0 0 3.42 0l3.58-3.58a2.426 2.426 0 0 0 0-3.42z"
          />
          <circle
            cx="6.5"
            cy="9.5"
            fill="currentColor"
            r=".5"
          />
        </svg>
        Hashtags
        <span
          class="ml-1 rounded-full bg-primary px-1.5 text-xs text-primary-foreground"
        >
          1
        </span>
      </button>
    `,
      'notes filters hashtags trigger with popover closed'
    );
  });
});
