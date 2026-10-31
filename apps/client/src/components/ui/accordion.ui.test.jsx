import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

describe('Accordion - UI snapshot', () => {
  it('renders a single collapsed item (trigger subtree only)', () => {
    const { container } = render(
      <Accordion type="single" collapsible>
        <AccordionItem value="item-1">
          <AccordionTrigger>Is it accessible?</AccordionTrigger>
          <AccordionContent>
            Yes. It adheres to the WAI-ARIA design pattern.
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    );
    // G4 segmentación: el item cerrado completo serializa ~54 líneas, así que
    // se captura el trigger y el panel cerrado por separado.
    expect(container.querySelector('button')).toMatchInlineSnapshot(
      `
      <button
        aria-expanded="false"
        class="flex flex-1 items-center justify-between py-4 text-sm font-medium transition-all hover:underline text-left [&[data-state=open]>svg]:rotate-180"
        data-orientation="vertical"
        data-radix-collection-item=""
        data-state="closed"
        id="radix-:r0:"
        type="button"
      >
        Is it accessible?
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
      </button>
    `,
      'collapsed accordion trigger with its chevron'
    );
    expect(container.querySelector('[role="region"]')).toMatchInlineSnapshot(
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
      'closed accordion content panel'
    );
  });
});
