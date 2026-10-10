import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

describe('AlertDialog - UI snapshot', () => {
  it('renders the closed trigger subtree (dialog stays unopened)', () => {
    const { container } = render(
      <AlertDialog>
        <AlertDialogTrigger>Open dialog</AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <button type="button">Cancel</button>
            <button type="button">Continue</button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
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
      'alert dialog trigger in the closed state'
    );
  });
});
