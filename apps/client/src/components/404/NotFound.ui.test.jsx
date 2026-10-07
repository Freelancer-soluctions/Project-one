import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { MemoryRouter } from 'react-router';
import NotFound from './NotFound';

describe('NotFound - UI snapshot', () => {
  it('renders the 404 state with its go-back action', () => {
    const { container } = render(
      <MemoryRouter initialEntries={['/random-route']}>
        <NotFound link="/home" />
      </MemoryRouter>
    );
    expect(container.firstChild).toMatchInlineSnapshot(
      `
      <main
        class="flex min-h-[100dvh] flex-col items-center justify-center bg-gray-100 px-4 py-12 dark:bg-gray-950"
      >
        <div
          class="flex flex-col items-center justify-center h-[100dvh] bg-gray-100 dark:bg-gray-900 px-4 md:px-6"
        >
          <div
            class="max-w-md space-y-4 text-center"
          >
            <h1
              class="font-bold tracking-tighter text-gray-900 text-8xl dark:text-gray-50"
            >
              404
            </h1>
            <h2
              class="text-4xl font-bold text-gray-900 dark:text-gray-50"
            >
              Oops! Page not found.
            </h2>
            <p
              class="text-gray-500 dark:text-gray-400"
            >
              The page you are looking for does not exist or has been moved.
            </p>
            <button
              class="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 px-4 py-2"
            >
              Go back
            </button>
          </div>
        </div>
      </main>
    `,
      '404 page with heading, message and go back button'
    );
  });
});
