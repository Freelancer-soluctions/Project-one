import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

describe('Alert - UI snapshot', () => {
  it('renders title and description', () => {
    const { container } = render(
      <Alert variant="destructive">
        <AlertTitle>Be careful</AlertTitle>
        <AlertDescription>This action cannot be undone.</AlertDescription>
      </Alert>
    );
    expect(container.firstChild).toMatchInlineSnapshot(
      `
      <div
        class="relative w-full rounded-lg border px-4 py-3 text-sm [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg~*]:pl-7 border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive"
        role="alert"
      >
        <h5
          class="mb-1 font-medium leading-none tracking-tight"
        >
          Be careful
        </h5>
        <div
          class="text-sm [&_p]:leading-relaxed"
        >
          This action cannot be undone.
        </div>
      </div>
    `,
      'destructive alert with title and description'
    );
  });
});
