import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { QuickAccessButton } from './QuickAccess';

describe('QuickAccess - UI snapshot', () => {
  it('renders the closed trigger button', () => {
    const { container } = render(
      <QuickAccessButton label="Quick access" className="fixed-class" />
    );
    expect(container.firstChild).toMatchInlineSnapshot(
      `
      <button
        aria-expanded="false"
        aria-haspopup="dialog"
        class="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 h-10 rounded-md px-8 fixed-class"
        data-state="closed"
        type="button"
      >
        Quick access
      </button>
    `,
      'quick access trigger button in the closed state'
    );
  });
});
