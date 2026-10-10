import { render } from '@testing-library/react';
import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { Calendar } from '@/components/ui/calendar';

// Fecha congelada: el "today" del DayPicker y el mes mostrado no dependen
// del día en que corra el suite. Se construye en hora local para que el
// resultado sea idéntico en cualquier zona horaria (CI = UTC).
const FROZEN_TODAY = new Date(2026, 0, 15);
const FIXED_MONTH = new Date(2026, 0, 1);

let toLocaleDateStringSpy;

beforeAll(() => {
  vi.setSystemTime(FROZEN_TODAY);
  // data-day del botón usa toLocaleDateString() sin locale fijo → depende
  // del SO. Se normaliza a mm/dd/yyyy para que el snapshot sea idéntico en
  // local y en CI.
  toLocaleDateStringSpy = vi
    .spyOn(Date.prototype, 'toLocaleDateString')
    .mockImplementation(function normalizedDayLabel() {
      const mm = String(this.getMonth() + 1).padStart(2, '0');
      const dd = String(this.getDate()).padStart(2, '0');
      return `${mm}/${dd}/${this.getFullYear()}`;
    });
});

afterAll(() => {
  toLocaleDateStringSpy.mockRestore();
  vi.useRealTimers();
});

describe('Calendar - UI snapshot', () => {
  // Segmentación por subárbol (D7): el grid completo supera el presupuesto
  // de ~50 líneas, así que se capturan nav, cabecera de mes y la celda "today".
  it('renders the month navigation buttons', () => {
    const { container } = render(
      <Calendar mode="single" month={FIXED_MONTH} onMonthChange={() => {}} />
    );
    expect(container.querySelector('.rdp-nav')).toMatchInlineSnapshot(
      `
      <nav
        aria-label="Navigation bar"
        class="absolute inset-x-0 top-0 flex w-full items-center justify-between gap-1 rdp-nav"
      >
        <button
          aria-label="Go to the Previous Month"
          class="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 hover:bg-accent hover:text-accent-foreground h-[--cell-size] w-[--cell-size] select-none p-0 aria-disabled:opacity-50 rdp-button_previous"
          type="button"
        >
          <svg
            class="lucide lucide-chevron-left size-4 rdp-chevron"
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
              d="m15 18-6-6 6-6"
            />
          </svg>
        </button>
        <button
          aria-label="Go to the Next Month"
          class="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 hover:bg-accent hover:text-accent-foreground h-[--cell-size] w-[--cell-size] select-none p-0 aria-disabled:opacity-50 rdp-button_next"
          type="button"
        >
          <svg
            class="lucide lucide-chevron-right size-4 rdp-chevron"
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
              d="m9 18 6-6-6-6"
            />
          </svg>
        </button>
      </nav>
    `,
      'previous and next month navigation buttons'
    );
  });

  it('renders the caption for the fixed month', () => {
    const { container } = render(
      <Calendar mode="single" month={FIXED_MONTH} onMonthChange={() => {}} />
    );
    expect(container.querySelector('.rdp-month_caption')).toMatchInlineSnapshot(
      `
      <div
        class="flex h-[--cell-size] w-full items-center justify-center px-[--cell-size] rdp-month_caption"
      >
        <span
          aria-live="polite"
          class="select-none font-medium rdp-caption_label"
          role="status"
        >
          January 2026
        </span>
      </div>
    `,
      'month caption reads January 2026'
    );
  });

  it('highlights the frozen today cell', () => {
    const { container } = render(
      <Calendar mode="single" month={FIXED_MONTH} onMonthChange={() => {}} />
    );
    expect(
      container.querySelector('td[data-day="2026-01-15"]')
    ).toMatchInlineSnapshot(
      `
      <td
        class="group/day relative aspect-square h-full w-full select-none p-0 text-center [&:first-child[data-selected=true]_button]:rounded-l-md [&:last-child[data-selected=true]_button]:rounded-r-md rdp-day bg-accent text-accent-foreground rounded-md data-[selected=true]:rounded-none rdp-today"
        data-day="2026-01-15"
        data-today="true"
        role="gridcell"
      >
        <button
          aria-label="Today, Thursday, January 15th, 2026"
          class="items-center justify-center whitespace-nowrap rounded-md text-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 hover:bg-accent hover:text-accent-foreground data-[selected-single=true]:bg-primary data-[selected-single=true]:text-primary-foreground data-[range-middle=true]:bg-accent data-[range-middle=true]:text-accent-foreground data-[range-start=true]:bg-primary data-[range-start=true]:text-primary-foreground data-[range-end=true]:bg-primary data-[range-end=true]:text-primary-foreground group-data-[focused=true]/day:border-ring group-data-[focused=true]/day:ring-ring/50 flex aspect-square h-auto w-full min-w-[--cell-size] flex-col gap-1 font-normal leading-none data-[range-end=true]:rounded-md data-[range-middle=true]:rounded-none data-[range-start=true]:rounded-md group-data-[focused=true]/day:relative group-data-[focused=true]/day:z-10 group-data-[focused=true]/day:ring-[3px] [&>span]:text-xs [&>span]:opacity-70 rdp-day rdp-day_button"
          data-day="01/15/2026"
          tabindex="0"
          type="button"
        >
          15
        </button>
      </td>
    `,
      'gridcell for the frozen today (January 15th, 2026)'
    );
  });
});
