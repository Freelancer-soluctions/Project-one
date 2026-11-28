import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

// Radix Switch needs ResizeObserver, which jsdom does not provide.
globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

vi.mock('../api/vacationApi', () => ({
  useGetVacationBalanceQuery: vi.fn(),
}));

import { useGetVacationBalanceQuery } from '../api/vacationApi';
import { VacationDialog } from './VacationDialog';

const selectedRow = {
  id: 1,
  employeeId: 1,
  startDate: '2026-02-01T10:00:00',
  endDate: '2026-02-10T10:00:00',
  status: 'APPROVED',
  reason: 'Trip',
  comments: '',
  paid: true,
  createdOn: '2026-01-05T10:00:00',
  updatedOn: null,
  approvedAt: '2026-01-06T10:00:00',
  rejectedAt: null,
};

const renderDialog = (props = {}) =>
  render(
    <VacationDialog
      openDialog
      onCloseDialog={() => {}}
      selectedRow={selectedRow}
      onSubmit={() => {}}
      onDeleteById={() => {}}
      actionDialog="Edit"
      dataEmployees={[{ id: 1, name: 'Ann', lastName: 'Lee' }]}
      {...props}
    />
  );

describe('VacationDialog balance guard (task 5.4b)', () => {
  it('blocks saving an APPROVED leave longer than the remaining balance', () => {
    // 10 days requested, 2 remaining
    useGetVacationBalanceQuery.mockReturnValue({
      data: { employeeId: 1, year: 2026, accrued: 5, used: 3, remaining: 2 },
    });

    renderDialog();

    expect(
      screen.getByRole('button', { name: /update|actualizar/i })
    ).toBeDisabled();
    expect(screen.getByText(/insufficient|insuficiente/i)).toBeInTheDocument();
  });

  it('keeps saving enabled when the balance covers the leave', () => {
    useGetVacationBalanceQuery.mockReturnValue({
      data: { employeeId: 1, year: 2026, accrued: 30, used: 0, remaining: 30 },
    });

    renderDialog();

    expect(
      screen.getByRole('button', { name: /update|actualizar/i })
    ).toBeEnabled();
  });

  it('shows the reason, comments and paid toggle inputs', () => {
    useGetVacationBalanceQuery.mockReturnValue({ data: undefined });

    renderDialog();

    expect(screen.getByLabelText(/reason|razón/i)).toHaveValue('Trip');
    expect(screen.getByLabelText(/comments|comentarios/i)).toBeInTheDocument();
    expect(screen.getByRole('switch')).toBeInTheDocument();
  });
});
