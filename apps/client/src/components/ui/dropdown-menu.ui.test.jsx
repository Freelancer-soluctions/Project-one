import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

describe('DropdownMenu - UI snapshot', () => {
  it('renders the closed trigger subtree (menu never opens)', () => {
    const { container } = render(
      <DropdownMenu>
        <DropdownMenuTrigger>Open menu</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuLabel>My Account</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem>Profile</DropdownMenuItem>
          <DropdownMenuItem>Billing</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
    expect(container.firstChild).toMatchInlineSnapshot(
      `
      <button
        aria-expanded="false"
        aria-haspopup="menu"
        data-state="closed"
        id="radix-:r0:"
        type="button"
      >
        Open menu
      </button>
    `,
      'dropdown menu trigger in the closed state'
    );
  });
});
