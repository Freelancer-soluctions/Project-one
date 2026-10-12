import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Toaster } from '@/components/ui/toaster';

describe('Toaster - UI snapshot', () => {
  it('renders the empty viewport (no toasts queued)', () => {
    const { container } = render(<Toaster />);
    expect(container.firstChild).toMatchInlineSnapshot(
      `
      <div
        aria-label="Notifications (F8)"
        role="region"
        style="pointer-events: none;"
        tabindex="-1"
      >
        <ol
          class="fixed top-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px]"
          tabindex="-1"
        />
      </div>
    `,
      'toaster viewport with an empty toast queue'
    );
  });
});
