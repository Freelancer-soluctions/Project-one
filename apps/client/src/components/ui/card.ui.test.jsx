import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card';

describe('Card - UI snapshot', () => {
  it('renders header, content and footer', () => {
    const { container } = render(
      <Card>
        <CardHeader>
          <CardTitle>Card title</CardTitle>
          <CardDescription>Card description</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Card body content</p>
        </CardContent>
        <CardFooter>
          <button type="button">Cancel</button>
        </CardFooter>
      </Card>
    );
    expect(container.firstChild).toMatchInlineSnapshot(
      `
      <div
        class="rounded-xl border bg-card text-card-foreground shadow"
      >
        <div
          class="flex flex-col space-y-1.5 p-6"
        >
          <h3
            class="font-semibold leading-none tracking-tight"
          >
            Card title
          </h3>
          <p
            class="text-sm text-muted-foreground"
          >
            Card description
          </p>
        </div>
        <div
          class="p-6 pt-0"
        >
          <p>
            Card body content
          </p>
        </div>
        <div
          class="flex items-center p-6 pt-0"
        >
          <button
            type="button"
          >
            Cancel
          </button>
        </div>
      </div>
    `,
      'card with header, content and footer slots'
    );
  });
});
