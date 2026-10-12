import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Skeleton } from '@/components/ui/skeleton';

describe('Skeleton - UI snapshot', () => {
  it('renders the pulse placeholder', () => {
    const { container } = render(<Skeleton className="h-4 w-64" />);
    expect(container.firstChild).toMatchInlineSnapshot(
      `
      <div
        class="animate-pulse rounded-md bg-primary/10 h-4 w-64"
      />
    `,
      'skeleton pulse placeholder with sizing classes'
    );
  });
});
