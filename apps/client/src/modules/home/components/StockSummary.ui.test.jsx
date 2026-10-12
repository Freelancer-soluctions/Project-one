import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, it, expect } from 'vitest';
import { StockSummary } from './StockSummary';

// Prop-driven fixture (no query/MSW involved): both alerts visible.
const FIXTURE_DATA_COUNT_STOCK = { data: { expired: 2, lowStock: 5 } };

describe('StockSummary - UI snapshot', () => {
  it('renders the expired and low-stock alerts with fixed counts', () => {
    const { container } = render(
      <MemoryRouter initialEntries={['/home']}>
        <StockSummary dataCountStock={FIXTURE_DATA_COUNT_STOCK} />
      </MemoryRouter>
    );
    expect(container.firstChild).toMatchInlineSnapshot(
      `
      <div
        class="rounded-xl bg-card text-card-foreground border-0 shadow-none"
      >
        <div
          class="flex flex-col space-y-1.5 p-6"
        >
          <h3
            class="font-semibold leading-none tracking-tight"
          >
            Stock Alerts
          </h3>
        </div>
        <div
          class="p-6 pt-0 space-y-4"
        >
          <div
            class="space-y-4"
          >
            <div
              class="relative w-full rounded-lg border px-4 py-3 text-sm [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground [&>svg~*]:pl-7 text-foreground border-red-200 bg-red-50/50 transition-colors hover:bg-red-100/50 cursor-pointer"
              role="alert"
            >
              <div
                class="text-sm [&_p]:leading-relaxed flex items-center justify-between"
              >
                <span>
                  Expired Products
                </span>
                <div
                  class="flex items-center gap-2"
                >
                  <span
                    class="font-semibold text-red-700"
                  >
                    2
                  </span>
                  <svg
                    class="w-4 h-4 text-red-700"
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
                </div>
              </div>
            </div>
            <div
              class="relative w-full rounded-lg border px-4 py-3 text-sm [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground [&>svg~*]:pl-7 text-foreground border-yellow-200 bg-yellow-50/50 transition-colors hover:bg-yellow-100/50 cursor-pointer"
              role="alert"
            >
              <div
                class="text-sm [&_p]:leading-relaxed flex items-center justify-between"
              >
                <span>
                  Low Stock Products
                </span>
                <div
                  class="flex items-center gap-2"
                >
                  <span
                    class="font-semibold text-yellow-700"
                  >
                    5
                  </span>
                  <svg
                    class="w-4 h-4 text-yellow-700"
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
                </div>
              </div>
            </div>
          </div>
          <button
            class="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2 w-full mt-2"
          >
            View All Stock
          </button>
        </div>
      </div>
    `,
      'expired and low-stock alerts with fixed counts'
    );
  });
});
