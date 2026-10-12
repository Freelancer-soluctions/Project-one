import { render } from '@testing-library/react';
import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import { StockDatatable } from './StockDatatable';

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

// Fechas sin Z = hora local (PPP idéntico en local y CI = UTC). Los precios
// usan Intl es-CO/COP, determinista para un mismo build de Node.
const FIXTURE_ROWS = [
  {
    id: 1,
    createdOn: '2026-01-05T10:00:00',
    productName: 'Widget Alpha',
    productPrice: 19.99,
    quantity: 120,
    totalCost: 2398.8,
    warehouseName: 'Main Warehouse',
    unitMeasure: 'unit',
    lot: 'LOT-A1',
    expirationDate: '2026-06-30T10:00:00',
    expirationStatus: 'Fresh',
    userStockCreatedName: 'Oliver Ops',
    userStockUpdatedName: 'Oliver Ops',
    updatedOn: '2026-01-06T10:00:00',
  },
  {
    id: 2,
    createdOn: '2026-01-06T10:00:00',
    productName: 'Widget Beta',
    productPrice: 24.5,
    quantity: 15,
    totalCost: 367.5,
    warehouseName: 'Overflow Warehouse',
    unitMeasure: 'box',
    lot: 'LOT-B2',
    expirationDate: null,
    expirationStatus: 'No expiry',
    userStockCreatedName: 'Ivy Inspector',
    userStockUpdatedName: null,
    updatedOn: null,
  },
  {
    id: 3,
    createdOn: '2026-01-07T10:00:00',
    productName: 'Gadget Gamma',
    productPrice: 42,
    quantity: 60,
    totalCost: 2520,
    warehouseName: 'Main Warehouse',
    unitMeasure: 'pallet',
    lot: null,
    expirationDate: '2026-03-15T10:00:00',
    expirationStatus: 'Expiring',
    userStockCreatedName: 'Oliver Ops',
    userStockUpdatedName: 'Ivy Inspector',
    updatedOn: '2026-01-08T10:00:00',
  },
];

const renderDatatable = () =>
  render(
    <StockDatatable
      dataStock={{
        data: { dataList: FIXTURE_ROWS, total: FIXTURE_ROWS.length },
      }}
      onEditDialog={() => {}}
      pagination={{ pageIndex: 0, pageSize: 10 }}
      onPaginationChange={() => {}}
    />
  );

describe('StockDatatable - UI snapshot', () => {
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
