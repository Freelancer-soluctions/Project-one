import { render } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { DataTable } from './dataTable';

vi.mock('@radix-ui/react-icons', () => ({
  CaretSortIcon: vi.fn(() => null),
}));

describe('DataTable - Unit', () => {
  it('renders without crashing with empty data', () => {
    const mockHandleRow = vi.fn();
    const mockOnPaginationChange = vi.fn();
    const mockPagination = { pageIndex: 0, pageSize: 10 };

    const { container } = render(
      <DataTable
        columns={[]}
        data={[]}
        totalRows={0}
        handleRow={mockHandleRow}
        pagination={mockPagination}
        onPaginationChange={mockOnPaginationChange}
      />
    );

    expect(container).toBeTruthy();
  });

  it('renders with provided columns and data', () => {
    const mockHandleRow = vi.fn();
    const mockOnPaginationChange = vi.fn();
    const mockPagination = { pageIndex: 0, pageSize: 10 };

    const { container } = render(
      <DataTable
        columns={[{ id: 'test' }]}
        data={[{ id: 1, name: 'Test' }]}
        totalRows={1}
        handleRow={mockHandleRow}
        pagination={mockPagination}
        onPaginationChange={mockOnPaginationChange}
      />
    );

    expect(container).toBeTruthy();
  });
});
