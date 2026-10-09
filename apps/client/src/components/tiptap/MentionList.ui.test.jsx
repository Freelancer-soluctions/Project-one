import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { MentionList } from './MentionList';

// Prop-driven popup fixture (coexists with MentionList.test.jsx — no import
// or mock shared, snapshot file only).
const FIXTURE_ITEMS = [
  { id: '1', label: 'User One' },
  { id: '2', label: 'User Two' },
  { id: '3', label: 'User Three' },
];

describe('MentionList - UI snapshot', () => {
  it('renders the popup with three mentions', () => {
    const { container } = render(
      <MentionList items={FIXTURE_ITEMS} command={() => {}} />
    );
    expect(container.firstChild).toMatchInlineSnapshot(
      `
      <div
        class="rounded-md border border-border bg-popover shadow-md"
        tabindex="-1"
      >
        <button
          class="flex w-full items-center gap-2 px-3 py-2 text-sm text-left hover:bg-accent hover:text-accent-foreground bg-accent text-accent-foreground"
        >
          <svg
            class="lucide lucide-at-sign h-4 w-4 text-muted-foreground"
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
            <circle
              cx="12"
              cy="12"
              r="4"
            />
            <path
              d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-4 8"
            />
          </svg>
          User One
        </button>
        <button
          class="flex w-full items-center gap-2 px-3 py-2 text-sm text-left hover:bg-accent hover:text-accent-foreground"
        >
          <svg
            class="lucide lucide-at-sign h-4 w-4 text-muted-foreground"
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
            <circle
              cx="12"
              cy="12"
              r="4"
            />
            <path
              d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-4 8"
            />
          </svg>
          User Two
        </button>
        <button
          class="flex w-full items-center gap-2 px-3 py-2 text-sm text-left hover:bg-accent hover:text-accent-foreground"
        >
          <svg
            class="lucide lucide-at-sign h-4 w-4 text-muted-foreground"
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
            <circle
              cx="12"
              cy="12"
              r="4"
            />
            <path
              d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-4 8"
            />
          </svg>
          User Three
        </button>
      </div>
    `,
      'mention popup with three users and the first one selected'
    );
  });
});
