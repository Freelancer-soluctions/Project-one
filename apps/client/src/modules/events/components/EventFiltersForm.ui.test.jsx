import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { EventFiltersForm } from './EventFiltersForm';

describe('EventFiltersForm - UI snapshot', () => {
  it('renders the search field with add and clear actions', () => {
    const { container } = render(
      <EventFiltersForm
        searchQuery="frozen query"
        setSearchQuery={() => {}}
        setIsDialogOpen={() => {}}
        setEvent={() => {}}
      />
    );
    expect(container.firstChild).toMatchInlineSnapshot(
      `
      <div
        class="flex flex-col gap-4 p-4 sm:p-6 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
      >
        <div
          class="flex flex-col items-start gap-5 sm:flex-row sm:items-center"
        >
          <div
            class="w-full sm:max-w-sm"
          >
            <label
              class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              for="textSearch"
            >
              Search
            </label>
            <input
              class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              id="textSearch"
              maxlength="100"
              placeholder="Buscar eventos..."
              type="text"
              value="frozen query"
            />
          </div>
          <div
            class="flex flex-wrap items-center justify-between gap-3 mt-5"
          >
            <button
              class="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 h-9 px-4 py-2 flex-1 md:flex-initial md:w-24"
              type="button"
            >
              Add
               
              <svg
                class="w-4 h-4 ml-auto opacity-50"
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
                  d="M12 5v14"
                />
              </svg>
            </button>
            <button
              class="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2 flex-1 md:flex-initial md:w-24"
              type="button"
            >
              Clear
               
              <svg
                class="w-4 h-4 ml-auto opacity-50"
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
                  d="m7 21-4.3-4.3c-1-1-1-2.5 0-3.4l9.6-9.6c1-1 2.5-1 3.4 0l5.6 5.6c1 1 1 2.5 0 3.4L13 21"
                />
                <path
                  d="M22 21H7"
                />
                <path
                  d="m5 11 9 9"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    `,
      'event search field with add and clear buttons'
    );
  });
});
