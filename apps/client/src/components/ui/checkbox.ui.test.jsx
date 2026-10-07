import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Checkbox } from '@/components/ui/checkbox';

describe('Checkbox - UI snapshot', () => {
  it('renders unchecked', () => {
    const { container } = render(<Checkbox aria-label="Accept terms" />);
    expect(container.firstChild).toMatchInlineSnapshot(
      `
      <button
        aria-checked="false"
        aria-label="Accept terms"
        class="peer h-4 w-4 shrink-0 rounded-sm border border-primary shadow focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
        data-state="unchecked"
        role="checkbox"
        type="button"
        value="on"
      />
    `,
      'checkbox in the unchecked state'
    );
  });
});
