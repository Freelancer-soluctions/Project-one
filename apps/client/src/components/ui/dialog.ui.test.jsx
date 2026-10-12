import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

describe('Dialog - UI snapshot', () => {
  it('renders the closed trigger subtree (content stays in its portal)', () => {
    const { container } = render(
      <Dialog>
        <DialogTrigger>Open dialog</DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit profile</DialogTitle>
            <DialogDescription>
              Make changes to your profile here.
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    );
    expect(container.firstChild).toMatchInlineSnapshot(
      `
      <button
        aria-controls="radix-:r0:"
        aria-expanded="false"
        aria-haspopup="dialog"
        data-state="closed"
        type="button"
      >
        Open dialog
      </button>
    `,
      'dialog trigger in the closed state'
    );
  });
});
