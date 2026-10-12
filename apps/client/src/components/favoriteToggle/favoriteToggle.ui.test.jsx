import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { FavoriteToggle } from './favoriteToggle';

describe('FavoriteToggle - UI snapshot', () => {
  it('renders the unchecked star button', () => {
    const { container } = render(
      <FavoriteToggle checked={false} onChange={() => {}} />
    );
    expect(container.firstChild).toMatchInlineSnapshot(
      `
      <button
        aria-label="mark_as_favorite"
        aria-pressed="false"
        class="justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 hover:bg-accent hover:text-accent-foreground h-9 w-9 inline-flex items-center gap-2"
        type="button"
      >
        <svg
          class="lucide lucide-star h-5 w-5 transition-colors duration-200 fill-transparent text-muted-foreground hover:text-muted-foreground/80"
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
      'unchecked star toggle button with the favorite aria-label'
    );
  });
});
