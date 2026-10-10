import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Badge } from '@/components/ui/badge';

describe('Badge - UI snapshot', () => {
  it('renders the destructive variant', () => {
    const { container } = render(<Badge variant="destructive">Alerta</Badge>);
    expect(container.firstChild).toMatchInlineSnapshot(
      `
      <div
        class="inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-destructive text-destructive-foreground shadow hover:bg-destructive/80"
      >
        Alerta
      </div>
    `,
      'destructive variant badge'
    );
  });
});
