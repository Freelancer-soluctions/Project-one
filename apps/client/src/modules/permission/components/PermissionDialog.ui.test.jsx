import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

// Radix Select/Switch usan ResizeObserver, que jsdom no trae.
globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

import { PermissionDialog } from './PermissionDialog';

const selectedRow = {
  id: 1,
  employeeId: 1,
  type: 'PERSONAL',
  startDate: '2026-02-02T10:00:00',
  endDate: '2026-02-03T10:00:00',
  status: 'APPROVED',
  reason: 'Doctor visit',
  comments: 'ok',
  paid: false,
  createdOn: '2026-01-05T10:00:00',
  updatedOn: null,
  approvedAt: '2026-01-06T10:00:00',
  rejectedAt: null,
  userPermissionApprovedName: 'Oliver Ops',
  userPermissionRejectedName: null,
};

const renderDialog = (canApprove) =>
  render(
    <PermissionDialog
      openDialog
      onCloseDialog={() => {}}
      selectedRow={selectedRow}
      onSubmit={() => {}}
      onDeleteById={() => {}}
      actionDialog="Edit"
      dataEmployees={[{ id: 1, name: 'Ann', lastName: 'Lee' }]}
      canApprove={canApprove}
    />
  );

describe('PermissionDialog approval fields (task 5.2a)', () => {
  it('shows the unpaid toggle reflecting paid=false', () => {
    renderDialog(true);
    expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'false');
  });

  it('shows the approver audit name from the row', () => {
    renderDialog(true);
    expect(screen.getByDisplayValue('Oliver Ops')).toBeInTheDocument();
  });

  it('disables the status select when the user cannot approve', () => {
    renderDialog(false);
    const disabled = screen
      .getAllByRole('combobox')
      .filter((el) => el.hasAttribute('disabled'));
    expect(disabled.length).toBeGreaterThanOrEqual(1);
  });

  it('keeps the status select enabled for an approver', () => {
    renderDialog(true);
    const disabled = screen
      .getAllByRole('combobox')
      .filter((el) => el.hasAttribute('disabled'));
    expect(disabled).toHaveLength(0);
  });
});
