import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ScrollArea } from '@/components/ui/scroll-area';

describe('ScrollArea - UI snapshot', () => {
  it('renders viewport with fixed content', () => {
    const { container } = render(
      <ScrollArea className="h-40 w-64">
        <ul>
          <li>First entry</li>
          <li>Second entry</li>
          <li>Third entry</li>
        </ul>
      </ScrollArea>
    );
    expect(container.firstChild).toMatchInlineSnapshot(
      `
      <div
        class="relative overflow-hidden h-40 w-64"
        dir="ltr"
        style="position: relative; --radix-scroll-area-corner-width: 0px; --radix-scroll-area-corner-height: 0px;"
      >
        <style>
          [data-radix-scroll-area-viewport]{scrollbar-width:none;-ms-overflow-style:none;-webkit-overflow-scrolling:touch;}[data-radix-scroll-area-viewport]::-webkit-scrollbar{display:none}
        </style>
        <div
          class="h-full w-full rounded-[inherit]"
          data-radix-scroll-area-viewport=""
          style="overflow-x: hidden; overflow-y: scroll;"
        >
          <div
            style="min-width: 100%; display: table;"
          >
            <ul>
              <li>
                First entry
              </li>
              <li>
                Second entry
              </li>
              <li>
                Third entry
              </li>
            </ul>
          </div>
        </div>
      </div>
    `,
      'scroll area viewport with a fixed list'
    );
  });
});
