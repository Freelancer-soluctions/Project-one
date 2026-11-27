import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { StatusPaymentPanel } from './StatusPaymentPanel';

const renderPanel = (props = {}) =>
  render(
    <StatusPaymentPanel
      kind="sale"
      status="PENDING"
      paymentMethod="CASH"
      invoiceNumber="FAC-001"
      paidAt={null}
      onTransition={() => {}}
      onSavePayment={() => {}}
      {...props}
    />
  );

describe('StatusPaymentPanel', () => {
  it('shows the current status and payment data', () => {
    renderPanel();

    expect(screen.getByText('Status and payment')).toBeInTheDocument();
    expect(screen.getByText('Pending')).toBeInTheDocument();
    expect(screen.getByLabelText('Invoice number')).toHaveValue('FAC-001');
    expect(screen.getByText('No payment recorded')).toBeInTheDocument();
  });

  it('renders one action per allowed transition of a sale', () => {
    renderPanel();

    expect(
      screen.getByRole('button', { name: 'Mark as paid' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Cancel sale' })
    ).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Refund' })).toBeNull();
  });

  it('offers no transitions from a terminal status', () => {
    renderPanel({ status: 'CANCELLED' });

    expect(screen.queryByRole('button', { name: 'Mark as paid' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Cancel sale' })).toBeNull();
  });

  it('uses the purchase transition table', () => {
    renderPanel({ kind: 'purchase', status: 'RECEIVED' });

    expect(
      screen.getByRole('button', { name: 'Mark as paid' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Cancel purchase' })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Mark as received' })
    ).toBeNull();
  });

  it('reports the clicked transition', () => {
    const onTransition = vi.fn();
    renderPanel({ onTransition });

    fireEvent.click(screen.getByRole('button', { name: 'Mark as paid' }));

    expect(onTransition).toHaveBeenCalledWith('PAID');
  });

  it('sends null for a blank invoice number', () => {
    const onSavePayment = vi.fn();
    renderPanel({ onSavePayment });

    fireEvent.change(screen.getByLabelText('Invoice number'), {
      target: { value: '   ' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save payment' }));

    expect(onSavePayment).toHaveBeenCalledWith({
      paymentMethod: 'CASH',
      invoiceNumber: null,
    });
  });

  it('reports the normalized draft so the dialog Update can save it', () => {
    const onDraftChange = vi.fn();
    renderPanel({ onDraftChange });

    fireEvent.change(screen.getByLabelText('Invoice number'), {
      target: { value: '  FAC-003  ' },
    });

    expect(onDraftChange).toHaveBeenLastCalledWith({
      paymentMethod: 'CASH',
      invoiceNumber: 'FAC-003',
    });
  });

  it('trims the invoice number before saving', () => {
    const onSavePayment = vi.fn();
    renderPanel({ onSavePayment });

    fireEvent.change(screen.getByLabelText('Invoice number'), {
      target: { value: '  FAC-002  ' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save payment' }));

    expect(onSavePayment).toHaveBeenCalledWith({
      paymentMethod: 'CASH',
      invoiceNumber: 'FAC-002',
    });
  });
});
