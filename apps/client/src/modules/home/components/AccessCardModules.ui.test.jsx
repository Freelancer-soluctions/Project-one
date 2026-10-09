import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, it, expect, vi } from 'vitest';
import CardModule from './AccessCardModules';

vi.mock('./EventCalendarWidget', () => ({
  EventCalendarWidget: () => <div data-testid="event-calendar-stub" />,
}));

describe('AccessCardModules - UI snapshot', () => {
  it('renders the first module access card with fixed content', () => {
    const { container } = render(
      <MemoryRouter initialEntries={['/home']}>
        <CardModule />
      </MemoryRouter>
    );
    expect(
      container.querySelector('.grid').firstElementChild
    ).toMatchInlineSnapshot(
      `
      <div
        class="rounded-xl border bg-card text-card-foreground shadow relative overflow-hidden transition-all group hover:shadow-lg hover:-translate-y-1"
      >
        <div
          class="flex flex-col space-y-1.5 p-6"
        >
          <div
            class="flex items-center gap-4"
          >
            <svg
              class="w-8 h-8 text-zinc-800"
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
              <circle
                cx="10"
                cy="7"
                r="4"
              />
              <path
                d="M10.3 15H7a4 4 0 0 0-4 4v2"
              />
              <circle
                cx="17"
                cy="17"
                r="3"
              />
              <path
                d="m21 21-1.9-1.9"
              />
            </svg>
            <div>
              <h3
                class="font-semibold tracking-tight text-xl"
              >
                Users
              </h3>
              <p
                class="text-sm text-muted-foreground"
              >
                System users
              </p>
            </div>
          </div>
        </div>
        <div
          class="p-6 pt-0 px-6 pb-6"
        >
          <a
            class="flex items-center gap-2 px-3 py-2 text-sm font-medium transition-colors rounded-md hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
            data-discover="true"
            href="/users"
          >
            Access
             
            <svg
              class="w-4 h-4 ml-2"
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
          </a>
        </div>
      </div>
    `,
      'first module access card with icon, title and access link'
    );
  });
});
