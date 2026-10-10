import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, it, expect } from 'vitest';
import { BackDashBoard } from './BackDashBoard';

describe('BackDashBoard - UI snapshot', () => {
  it('renders the back link with the module name', () => {
    const { container } = render(
      <MemoryRouter initialEntries={['/home/users']}>
        <BackDashBoard link="/home" moduleName="Dashboard" />
      </MemoryRouter>
    );
    expect(container.firstChild).toMatchInlineSnapshot(
      `
      <div
        class="px-0 py-5"
      >
        <a
          class="inline-flex items-center text-lg transition-colors text-muted-foreground hover:text-foreground"
          data-discover="true"
          href="/home"
        >
          <svg
            class="mr-2 w-7 h-7"
            fill="currentColor"
            height="1em"
            stroke="currentColor"
            stroke-width="0"
            viewBox="0 0 24 24"
            width="1em"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M15.28 5.22a.75.75 0 0 1 0 1.06L9.56 12l5.72 5.72a.749.749 0 0 1-.326 1.275.749.749 0 0 1-.734-.215l-6.25-6.25a.75.75 0 0 1 0-1.06l6.25-6.25a.75.75 0 0 1 1.06 0Z"
            />
          </svg>
          Dashboard
        </a>
      </div>
    `,
      'back link to home with the module name and chevron icon'
    );
  });
});
