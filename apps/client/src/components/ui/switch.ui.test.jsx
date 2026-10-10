import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Switch } from '@/components/ui/switch';

describe('Switch - UI snapshot', () => {
  it('renders unchecked', () => {
    const { container } = render(<Switch aria-label="Airplane mode" />);
    expect(container.firstChild).toMatchInlineSnapshot(
      `
      <button
        aria-checked="false"
        aria-label="Airplane mode"
        class="peer inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=unchecked]:bg-input"
        data-state="unchecked"
        role="switch"
        type="button"
        value="on"
      >
        <span
          class="pointer-events-none block h-4 w-4 rounded-full bg-background shadow-lg ring-0 transition-transform data-[state=checked]:translate-x-4 data-[state=unchecked]:translate-x-0"
          data-state="unchecked"
        />
      </button>
    `,
      'switch in the unchecked state'
    );
  });
});
