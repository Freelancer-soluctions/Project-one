import { render } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { SettingsProduct } from './SettingsProduct';

vi.mock(
  '@/modules/settingsProductCategories/page/SettingsProductCategories',
  () => ({
    SettingsProductCategories: () => (
      <div data-testid="categories-stub">Categories stub</div>
    ),
  })
);

describe('SettingsProduct - UI snapshot', () => {
  it('renders the product settings card with closed accordions', () => {
    const { container } = render(<SettingsProduct />);
    const [cardHeader, cardContent] =
      container.firstChild.firstElementChild.children;
    const [categoriesItem, inventoryItem] =
      cardContent.firstElementChild.children;

    // G4 segmentación: la tarjeta completa serializa ~210 líneas, así que se
    // captura el título y cada acordeón cerrado por subárbol.
    expect(cardHeader.querySelector('h3')).toMatchInlineSnapshot(
      `
      <h3
        class="font-semibold tracking-tight flex items-center gap-2 text-xl"
      >
        <svg
          class="w-5 h-5"
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
            d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"
          />
          <path
            d="m3.3 7 8.7 5 8.7-5"
          />
          <path
            d="M12 22V12"
          />
        </svg>
        Product Settings
      </h3>
    `,
      'product settings title with box icon'
    );
    const categoriesTrigger = categoriesItem.querySelector('button');
    expect(categoriesTrigger.querySelector('div')).toMatchInlineSnapshot(
      `
      <div
        class="flex items-center gap-2"
      >
        <svg
          class="w-5 h-5"
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
            d="m15 5 6.3 6.3a2.4 2.4 0 0 1 0 3.4L17 19"
          />
          <path
            d="M9.586 5.586A2 2 0 0 0 8.172 5H3a1 1 0 0 0-1 1v5.172a2 2 0 0 0 .586 1.414L8.29 18.29a2.426 2.426 0 0 0 3.42 0l3.58-3.58a2.426 2.426 0 0 0 0-3.42z"
          />
          <circle
            cx="6.5"
            cy="9.5"
            fill="currentColor"
            r=".5"
          />
        </svg>
        <span
          class="font-medium"
        >
          Product Categories
        </span>
      </div>
    `,
      'categories trigger icon and label'
    );
    expect(categoriesTrigger.children[1]).toMatchInlineSnapshot(
      `
      <svg
        class="lucide lucide-chevron-down h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200"
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
          d="m6 9 6 6 6-6"
        />
      </svg>
    `,
      'categories trigger chevron'
    );
    expect(
      categoriesItem.querySelector('[role="region"]')
    ).toMatchInlineSnapshot(
      `
      <div
        aria-labelledby="radix-:r0:"
        class="overflow-hidden text-sm data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down"
        data-orientation="vertical"
        data-state="closed"
        hidden=""
        id="radix-:r1:"
        role="region"
        style="--radix-accordion-content-height: var(--radix-collapsible-content-height); --radix-accordion-content-width: var(--radix-collapsible-content-width);"
      />
    `,
      'closed product categories panel'
    );
    const inventoryTrigger = inventoryItem.querySelector('button');
    expect(inventoryTrigger.querySelector('div')).toMatchInlineSnapshot(
      `
      <div
        class="flex items-center gap-2"
      >
        <svg
          class="w-5 h-5"
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
            d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"
          />
          <path
            d="m3.3 7 8.7 5 8.7-5"
          />
          <path
            d="M12 22V12"
          />
        </svg>
        <span
          class="font-medium"
        >
          Inventory Management
        </span>
      </div>
    `,
      'inventory trigger icon and label'
    );
    expect(inventoryTrigger.children[1]).toMatchInlineSnapshot(
      `
      <svg
        class="lucide lucide-chevron-down h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200"
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
          d="m6 9 6 6 6-6"
        />
      </svg>
    `,
      'inventory trigger chevron'
    );
    expect(
      inventoryItem.querySelector('[role="region"]')
    ).toMatchInlineSnapshot(
      `
      <div
        aria-labelledby="radix-:r2:"
        class="overflow-hidden text-sm data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down"
        data-orientation="vertical"
        data-state="closed"
        hidden=""
        id="radix-:r3:"
        role="region"
        style="--radix-accordion-content-height: var(--radix-collapsible-content-height); --radix-accordion-content-width: var(--radix-collapsible-content-width);"
      />
    `,
      'closed inventory management panel'
    );
  });
});
