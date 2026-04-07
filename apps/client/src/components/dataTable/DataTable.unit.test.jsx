import { render } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { DataTable } from './dataTable';

vi.mock('@tanstack/react-table', () => ({
  flexRender: vi.fn(() => 'Header'),
  getCoreRowModel: vi.fn(() => ({})),
  useReactTable: vi.fn(() => ({
    getHeaderGroups: vi.fn(() => []),
    getRowModel: vi.fn(() => ({ rows: [] })),
    getState: vi.fn(() => ({ pagination: { pageIndex: 0, pageSize: 10 } })),
    getPageCount: vi.fn(() => 0),
    setPageIndex: vi.fn(),
    setPageSize: vi.fn(),
    firstPage: vi.fn(),
    previousPage: vi.fn(),
    nextPage: vi.fn(),
    lastPage: vi.fn(),
    getCanPreviousPage: vi.fn(() => false),
    getCanNextPage: vi.fn(() => false),
    getRowCount: vi.fn(() => 0),
  })),
  getFilteredRowModel: vi.fn(() => ({})),
  getSortedRowModel: vi.fn(() => ({})),
}));

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
