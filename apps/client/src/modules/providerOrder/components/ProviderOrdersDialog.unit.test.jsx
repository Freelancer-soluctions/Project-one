import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ProviderOrdersDialog } from './ProviderOrdersDialog';

/**
 * Conversion action visibility: only saved, unconverted, non-cancelled orders
 * expose "Convert to purchase"; the click delegates to the page handler.
 */

const baseRow = {
  id: 7,
  supplierId: 3,
  status: 'PROCESSING',
  notes: '',
  details: [{ productId: 1, quantity: 2, estimatedPrice: '5' }],
};

const renderDialog = (selectedRow, onConvertById = vi.fn()) =>
  render(
    <ProviderOrdersDialog
      openDialog
      onCloseDialog={() => {}}
      selectedRow={selectedRow}
      onSubmit={() => {}}
      onDeleteById={() => {}}
      onConvertById={onConvertById}
      actionDialog="Edit provider order"
    />
  );

describe('ProviderOrdersDialog - conversion action', () => {
  it('shows the convert button for a saved order and delegates the id', () => {
    const onConvertById = vi.fn();
    renderDialog(baseRow, onConvertById);

    const button = screen.getByRole('button', {
      name: 'Convert to purchase',
    });
    fireEvent.click(button);

    expect(onConvertById).toHaveBeenCalledWith(7);
  });

  it('hides the convert button when a purchase is already linked', () => {
    renderDialog({ ...baseRow, purchaseId: 42 });

    expect(
      screen.queryByRole('button', { name: 'Convert to purchase' })
    ).not.toBeInTheDocument();
  });

  it('hides the convert button for cancelled orders', () => {
    renderDialog({ ...baseRow, status: 'CANCELLED' });

    expect(
      screen.queryByRole('button', { name: 'Convert to purchase' })
    ).not.toBeInTheDocument();
  });
});
