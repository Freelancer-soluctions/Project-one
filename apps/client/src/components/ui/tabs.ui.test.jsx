import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

describe('Tabs - UI snapshot', () => {
  it('renders list with the first tab active', () => {
    const { container } = render(
      <Tabs defaultValue="account">
        <TabsList>
          <TabsTrigger value="account">Account</TabsTrigger>
          <TabsTrigger value="password">Password</TabsTrigger>
        </TabsList>
        <TabsContent value="account">Make changes to your account.</TabsContent>
      </Tabs>
    );
    expect(container.firstChild).toMatchInlineSnapshot(
      `
      <div
        data-orientation="horizontal"
        dir="ltr"
      >
        <div
          aria-orientation="horizontal"
          class="inline-flex h-12 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground"
          data-orientation="horizontal"
          role="tablist"
          style="outline: none;"
          tabindex="0"
        >
          <button
            aria-controls="radix-:r0:-content-account"
            aria-selected="true"
            class="inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow"
            data-orientation="horizontal"
            data-radix-collection-item=""
            data-state="active"
            id="radix-:r0:-trigger-account"
            role="tab"
            tabindex="-1"
            type="button"
          >
            Account
          </button>
          <button
            aria-controls="radix-:r0:-content-password"
            aria-selected="false"
            class="inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow"
            data-orientation="horizontal"
            data-radix-collection-item=""
            data-state="inactive"
            id="radix-:r0:-trigger-password"
            role="tab"
            tabindex="-1"
            type="button"
          >
            Password
          </button>
        </div>
        <div
          aria-labelledby="radix-:r0:-trigger-account"
          class="mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          data-orientation="horizontal"
          data-state="active"
          id="radix-:r0:-content-account"
          role="tabpanel"
          style="animation-duration: 0s;"
          tabindex="0"
        >
          Make changes to your account.
        </div>
      </div>
    `,
      'tabs with the first trigger active and its content panel'
    );
  });
});
