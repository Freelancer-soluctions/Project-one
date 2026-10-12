import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

describe('RadioGroup - UI snapshot', () => {
  it('renders a group with one item', () => {
    const { container } = render(
      <RadioGroup defaultValue="one">
        <RadioGroupItem value="one" aria-label="Option one" />
      </RadioGroup>
    );
    expect(container.firstChild).toMatchInlineSnapshot(
      `
      <div
        aria-required="false"
        class="grid gap-2"
        dir="ltr"
        role="radiogroup"
        style="outline: none;"
        tabindex="0"
      >
        <button
          aria-checked="true"
          aria-label="Option one"
          class="aspect-square h-4 w-4 rounded-full border border-primary text-primary shadow focus:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
          data-radix-collection-item=""
          data-state="checked"
          role="radio"
          tabindex="-1"
          type="button"
          value="one"
        >
          <span
            class="flex items-center justify-center"
            data-state="checked"
          >
            <svg
              class="h-3.5 w-3.5 fill-primary"
              fill="none"
              height="15"
              viewBox="0 0 15 15"
              width="15"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M9.875 7.5C9.875 8.81168 8.81168 9.875 7.5 9.875C6.18832 9.875 5.125 8.81168 5.125 7.5C5.125 6.18832 6.18832 5.125 7.5 5.125C8.81168 5.125 9.875 6.18832 9.875 7.5Z"
                fill="currentColor"
              />
            </svg>
          </span>
        </button>
      </div>
    `,
      'radio group with a single unchecked item'
    );
  });
});
