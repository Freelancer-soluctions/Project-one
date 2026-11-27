import { render } from '@testing-library/react';
import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import { ProviderOrdersDatatable } from './ProviderOrdersDatatable';

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

// Este componente recibe `dataProviderOrders.data` con el wrapper paginado
// {dataList,total} (mismo contrato que clientOrder). Fechas sin Z = hora local
// (PPP idéntico en local y CI). `total` llega como string porque Prisma
// serializa Decimal así.
const FIXTURE_ROWS = [
  {
    id: 1,
    supplierId: 201,
    notes: 'Quarterly restock order',
    createdOn: '2026-01-05T10:00:00',
    updatedOn: '2026-01-06T10:00:00',
    total: '1500.00',
    expectedDeliveryDate: '2026-01-20T10:00:00',
    deliveredOn: null,
  },
  {
    id: 2,
    supplierId: 202,
    notes: 'Urgent replacement parts',
    createdOn: '2026-01-06T10:00:00',
    updatedOn: null,
    total: '75.50',
    expectedDeliveryDate: null,
    deliveredOn: null,
  },
  {
    id: 3,
    supplierId: 201,
    notes: 'Scheduled monthly order',
    createdOn: '2026-01-07T10:00:00',
    updatedOn: '2026-01-08T10:00:00',
    total: '320.00',
    expectedDeliveryDate: '2026-01-15T10:00:00',
    deliveredOn: '2026-01-14T10:00:00',
  },
];

const renderDatatable = () =>
  render(
    <ProviderOrdersDatatable
      dataProviderOrders={{
        data: { dataList: FIXTURE_ROWS, total: FIXTURE_ROWS.length },
      }}
      onEditDialog={() => {}}
      pagination={{ pageIndex: 0, pageSize: 10 }}
      onPaginationChange={() => {}}
    />
  );

describe('ProviderOrdersDatatable - UI snapshot', () => {
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
