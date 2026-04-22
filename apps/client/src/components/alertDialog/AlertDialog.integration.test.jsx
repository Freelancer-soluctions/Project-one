import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import AlertDialogComponent from './AlertDialog';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k) => k }),
}));

describe('AlertDialog - Integration', () => {
  it('renders with given props', () => {
    const onSuccess = vi.fn();
    render(
      <AlertDialogComponent
        openAlertDialog={true}
        setOpenAlertDialog={() => {}}
        alertProps={{
          alertTitle: 'Integration Title',
          alertMessage: 'Integration message',
          cancel: true,
          success: true,
          onSuccess,
          variant: 'default',
          variantSuccess: 'default',
        }}
      />
    );
    expect(screen.getByText('Integration Title')).toBeInTheDocument();
    expect(screen.getByText('Integration message')).toBeInTheDocument();
  });
});
