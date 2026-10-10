import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';

// Segmentación por subárbol (D7): el nav completo supera ~50 líneas, así
// que cada control se captura por separado con su propio hint.
const PaginationFixture = () => (
  <Pagination>
    <PaginationContent>
      <PaginationItem>
        <PaginationPrevious href="/pages/1" />
      </PaginationItem>
      <PaginationItem>
        <PaginationLink href="/pages/1" isActive>
          1
        </PaginationLink>
      </PaginationItem>
      <PaginationItem>
        <PaginationLink href="/pages/2">2</PaginationLink>
      </PaginationItem>
      <PaginationItem>
        <PaginationEllipsis />
      </PaginationItem>
      <PaginationItem>
        <PaginationNext href="/pages/2" />
      </PaginationItem>
    </PaginationContent>
  </Pagination>
);

describe('Pagination - UI snapshot', () => {
  it('renders the previous control', () => {
    const { container } = render(<PaginationFixture />);
    expect(container.querySelectorAll('li')[0]).toMatchInlineSnapshot(
      `
      <li
        class=""
      >
        <a
          aria-label="Go to previous page"
          class="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2 gap-1 pl-2.5"
          href="/pages/1"
        >
          <svg
            class="lucide lucide-chevron-left h-4 w-4"
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
          <span>
            Previous
          </span>
        </a>
      </li>
    `,
      'previous page item with chevron and label'
    );
  });

  it('renders the active page link', () => {
    const { container } = render(<PaginationFixture />);
    expect(container.querySelectorAll('li')[1]).toMatchInlineSnapshot(
      `
      <li
        class=""
      >
        <a
          aria-current="page"
          class="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-9 w-9"
          href="/pages/1"
        >
          1
        </a>
      </li>
    `,
      'page 1 link marked active with aria-current'
    );
  });

  it('renders the ellipsis marker', () => {
    const { container } = render(<PaginationFixture />);
    expect(container.querySelectorAll('li')[3]).toMatchInlineSnapshot(
      `
      <li
        class=""
      >
        <span
          aria-hidden="true"
          class="flex h-9 w-9 items-center justify-center"
        >
          <svg
            class="lucide lucide-ellipsis h-4 w-4"
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
              r="1"
            />
            <circle
              cx="19"
              cy="12"
              r="1"
            />
            <circle
              cx="5"
              cy="12"
              r="1"
            />
          </svg>
          <span
            class="sr-only"
          >
            More pages
          </span>
        </span>
      </li>
    `,
      'ellipsis item for hidden pages'
    );
  });

  it('renders the next control', () => {
    const { container } = render(<PaginationFixture />);
    expect(container.querySelectorAll('li')[4]).toMatchInlineSnapshot(
      `
      <li
        class=""
      >
        <a
          aria-label="Go to next page"
          class="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2 gap-1 pr-2.5"
          href="/pages/2"
        >
          <span>
            Next
          </span>
          <svg
            class="lucide lucide-chevron-right h-4 w-4"
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
        </a>
      </li>
    `,
      'next page item with chevron and label'
    );
  });
});
