import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ClientOrderDialog } from './ClientOrderDialog';

/**
 * Conversion action visibility: only saved, unconverted, non-cancelled orders
 * expose "Convert to sale"; the click delegates to the page handler.
 */

const baseRow = {
  id: 1,
  clientId: 5,
  status: 'PENDING',
  notes: '',
  details: [{ productId: 1, quantity: 2, unitPrice: '5' }],
};

const renderDialog = (selectedRow, onConvertById = vi.fn()) =>
  render(
    <ClientOrderDialog
      openDialog
      onCloseDialog={() => {}}
      selectedRow={selectedRow}
      onSubmit={() => {}}
      onDeleteById={() => {}}
      onConvertById={onConvertById}
      actionDialog="Edit client order"
    />
  );

describe('ClientOrderDialog - conversion action', () => {
  it('shows the convert button for a saved order and delegates the id', () => {
    const onConvertById = vi.fn();
    renderDialog(baseRow, onConvertById);

    const button = screen.getByRole('button', { name: 'Convert to sale' });
    fireEvent.click(button);

    expect(onConvertById).toHaveBeenCalledWith(1);
  });

  it('hides the convert button when a sale is already linked', () => {
    renderDialog({ ...baseRow, saleId: 99 });

    expect(
      screen.queryByRole('button', { name: 'Convert to sale' })
    ).not.toBeInTheDocument();
  });

  it('hides the convert button for cancelled orders', () => {
    renderDialog({ ...baseRow, status: 'CANCELLED' });

    expect(
      screen.queryByRole('button', { name: 'Convert to sale' })
    ).not.toBeInTheDocument();
  });
});
