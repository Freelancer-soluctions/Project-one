import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Separator } from '@/components/ui/separator';

describe('Separator - UI snapshot', () => {
  it('renders a horizontal decorative separator', () => {
    const { container } = render(<Separator />);
    expect(container.firstChild).toMatchInlineSnapshot(
      `
      <div
        class="shrink-0 bg-border h-[1px] w-full"
        data-orientation="horizontal"
        role="none"
      />
    `,
      'horizontal decorative separator'
    );
  });
});
