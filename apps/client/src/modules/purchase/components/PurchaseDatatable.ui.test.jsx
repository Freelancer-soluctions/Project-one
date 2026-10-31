import { render } from '@testing-library/react';
import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import { PurchaseDatatable } from './PurchaseDatatable';

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

// Fechas sin Z = hora local (PPP idéntico en local y CI = UTC). El total se
// formatea con es-CO/COP (determinista para un mismo build de Node).
const FIXTURE_ROWS = [
  {
    id: 1,
    provider: { name: 'Acme Corp' },
    total: 150000,
    purchaseDetail: [
      { sku: 'SKU-001' },
      { sku: 'SKU-002' },
      { sku: 'SKU-003' },
    ],
    createdOn: '2026-01-05T10:00:00',
    userPurchaseCreated: { name: 'Oliver Ops' },
    updatedOn: '2026-01-06T10:00:00',
    userPurchaseUpdated: { name: 'Oliver Ops' },
  },
  {
    id: 2,
    provider: { name: 'Globex Ltd' },
    total: 89990,
    purchaseDetail: [{ sku: 'SKU-010' }],
    createdOn: '2026-01-06T10:00:00',
    userPurchaseCreated: { name: 'Ivy Inspector' },
    updatedOn: null,
    userPurchaseUpdated: null,
  },
  {
    id: 3,
    provider: { name: 'Initech Inc' },
    total: 275500,
    purchaseDetail: [],
    createdOn: '2026-01-07T10:00:00',
    userPurchaseCreated: { name: 'Oliver Ops' },
    updatedOn: '2026-01-08T10:00:00',
    userPurchaseUpdated: { name: 'Ivy Inspector' },
  },
];

const renderDatatable = () =>
  render(
    <PurchaseDatatable
      dataPurchases={{
        data: { dataList: FIXTURE_ROWS, total: FIXTURE_ROWS.length },
      }}
      onEditDialog={() => {}}
      pagination={{ pageIndex: 0, pageSize: 10 }}
      onPaginationChange={() => {}}
    />
  );

describe('PurchaseDatatable - UI snapshot', () => {
  // Segmentación (D7 + tasks 3.4): una entrada por cabecera, por celda de fila y por control de paginación.
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
    container.querySelectorAll('tbody tr').forEach((row, rowIndex) => {
      Array.from(row.children).forEach((cell, cellIndex) => {
        expect(cell).toMatchSnapshot(
          `fixture row ${rowIndex + 1} cell ${cellIndex + 1}`
        );
      });
    });
  });

  it('renders the pagination controls', () => {
    const { container } = renderDatatable();
    const pager = container.querySelector('.flex.flex-wrap.items-center.gap-2');
    Array.from(pager.children).forEach((control, index) => {
      expect(control).toMatchSnapshot(`pagination control ${index + 1}`);
    });

    expect(container.firstChild.lastElementChild).toMatchSnapshot(
      'pagination showing row count'
    );
  });
});
