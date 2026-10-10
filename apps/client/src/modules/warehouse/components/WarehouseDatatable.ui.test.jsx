import { render } from '@testing-library/react';
import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import { WarehouseDatatable } from './WarehouseDatatable';

// El setup global mockea @tanstack/react-table; este snapshot necesita la
// librería REAL para renderizar cabeceras, filtros y las 3 filas fixture.
vi.mock('@tanstack/react-table', async (importOriginal) => {
  const actual = await importOriginal();
  return actual;
});

beforeAll(() => {
  vi.setSystemTime(new Date(2026, 0, 15));
});

afterAll(() => {
  vi.useRealTimers();
});

// Fechas sin Z = hora local (PPP idéntico en local y CI = UTC).
const FIXTURE_ROWS = [
  {
    id: 1,
    name: 'Main Warehouse',
    status: 'Active',
    description: 'Primary distribution center',
    createdOn: '2026-01-05T10:00:00',
    updatedOn: '2026-01-06T10:00:00',
  },
  {
    id: 2,
    name: 'Overflow Warehouse',
    status: 'Inactive',
    description: 'Overflow storage for peak season',
    createdOn: '2026-01-06T10:00:00',
    updatedOn: null,
  },
  {
    id: 3,
    name: 'Cold Storage',
    status: 'Active',
    description: 'Refrigerated goods facility',
    createdOn: '2026-01-07T10:00:00',
    updatedOn: '2026-01-08T10:00:00',
  },
];

const renderDatatable = () =>
  render(
    <WarehouseDatatable
      dataWarehouse={{
        data: { dataList: FIXTURE_ROWS, total: FIXTURE_ROWS.length },
      }}
      onEditDialog={() => {}}
      pagination={{ pageIndex: 0, pageSize: 10 }}
      onPaginationChange={() => {}}
    />
  );

describe('WarehouseDatatable - UI snapshot', () => {
  // Segmentación (D7 + tasks 3.5): una entrada por cabecera y por fila.
  it('renders each column header with its filter', () => {
    const { container } = renderDatatable();
    container.querySelectorAll('thead th').forEach((th, index) => {
      expect(th).toMatchSnapshot(
        `column header ${index + 1} with sort and filter`
      );
    });
  });

  it('renders each frozen fixture row', () => {
    const { container } = renderDatatable();
    container.querySelectorAll('tbody tr').forEach((row, index) => {
      expect(row).toMatchSnapshot(`fixture row ${index + 1} with cells`);
    });
  });

  it('renders the pagination controls', () => {
    const { container } = renderDatatable();
    expect(
      container.querySelector('.flex.flex-wrap.items-center.gap-2')
    ).toMatchSnapshot('pagination buttons and page size select');

    expect(container.firstChild.lastElementChild).toMatchSnapshot(
      'pagination showing row count'
    );
  });
});
