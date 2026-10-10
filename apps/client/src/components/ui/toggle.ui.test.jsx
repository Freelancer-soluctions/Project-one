import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Toggle } from '@/components/ui/toggle';

describe('Toggle - UI snapshot', () => {
  it('renders in the off state', () => {
    const { container } = render(<Toggle aria-label="Bold">B</Toggle>);
    expect(container.firstChild).toMatchInlineSnapshot(
      `
      <button
        aria-label="Bold"
        aria-pressed="false"
        class="inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium transition-colors hover:bg-muted hover:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 data-[state=on]:bg-accent data-[state=on]:text-accent-foreground [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 bg-transparent h-9 px-2 min-w-9"
        data-state="off"
        type="button"
      >
        B
      </button>
    `,
      'toggle in the off state'
    );
  });
});
