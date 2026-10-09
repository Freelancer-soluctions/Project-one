import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import AlertDialogComponent from './AlertDialog';

describe('AlertDialog - UI snapshot', () => {
  it('renders nothing when the dialog stays closed', () => {
    const { container } = render(
      <AlertDialogComponent
        openAlertDialog={false}
        setOpenAlertDialog={() => {}}
        alertProps={{
          alertTitle: 'Delete note',
          alertMessage: 'This action cannot be undone.',
          cancel: true,
          success: true,
          destructive: true,
          variantSuccess: 'default',
          variantDestructive: 'destructive',
          onSuccess: () => {},
          onDelete: () => {},
        }}
      />
    );
    expect(container.firstChild).toMatchInlineSnapshot(
      `null`,
      'closed dialog renders nothing, content stays out of the container'
    );
  });
});
