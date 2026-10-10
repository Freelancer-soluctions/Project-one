import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Label } from '@/components/ui/label';

describe('Label - UI snapshot', () => {
  it('renders a form label', () => {
    const { container } = render(<Label htmlFor="email">Email</Label>);
    expect(container.firstChild).toMatchInlineSnapshot(
      `
      <label
        class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        for="email"
      >
        Email
      </label>
    `,
      'label bound to the email input'
    );
  });
});
