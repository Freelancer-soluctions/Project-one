import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import AlertDialogComponent from './AlertDialog';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k) => k }),
}));

describe('AlertDialog - Unit', () => {
  it('renders title and message and OK button', () => {
    render(
      <AlertDialogComponent
        openAlertDialog={true}
        setOpenAlertDialog={() => {}}
        alertProps={{
          alertTitle: 'Test Title',
          alertMessage: 'Test message',
          cancel: true,
          success: true,
          onSuccess: () => {},
          variant: 'default',
          variantSuccess: 'default',
        }}
      />
    );
    expect(screen.getByText('Test Title')).toBeInTheDocument();
    expect(screen.getByText('Test message')).toBeInTheDocument();
  });
});
