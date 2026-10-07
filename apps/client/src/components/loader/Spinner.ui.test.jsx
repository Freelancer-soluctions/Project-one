import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Spinner } from './Spinner';

describe('Spinner - UI snapshot', () => {
  it('renders the ring overlay', () => {
    const { container } = render(<Spinner />);
    expect(container.firstChild).toMatchInlineSnapshot(
      `
      <div
        class="absolute inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
      >
        <svg
          class="w-8 h-8 animate-spin text-primary"
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
            d="M12 3a9 9 0 1 0 9 9"
          />
        </svg>
      </div>
    `,
      'fullscreen spinner overlay with spinning icon'
    );
  });
});
