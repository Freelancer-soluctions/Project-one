import { render } from '@testing-library/react';
import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import { ClientOrderDatatable } from './ClientOrderDatatable';

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

// Este es el Datatable REAL de modules/clientOrder (el de providerOrder era
// dead code y se borró en la tarea 3.1). Fechas sin Z = hora local, por lo
// que `PPP` es idéntico en local y CI (UTC).
const FIXTURE_ROWS = [
  {
    id: 1,
    clientId: 101,
    status: 'pending',
    notes: 'First order notes',
    createdOn: '2026-01-05T10:00:00',
    updatedOn: '2026-01-06T10:00:00',
    saleId: 1001,
  },
  {
    id: 2,
    clientId: 102,
    status: 'shipped',
    notes: 'Second order notes',
    createdOn: '2026-01-06T10:00:00',
    updatedOn: null,
    saleId: 1002,
  },
  {
    id: 3,
    clientId: 103,
    status: 'delivered',
    notes: 'Third order notes',
    createdOn: '2026-01-07T10:00:00',
    updatedOn: '2026-01-08T10:00:00',
    saleId: 1003,
  },
];

const renderDatatable = () =>
  render(
    <ClientOrderDatatable
      dataClientOrder={{
        data: { dataList: FIXTURE_ROWS, total: FIXTURE_ROWS.length },
      }}
      onEditDialog={() => {}}
      pagination={{ pageIndex: 0, pageSize: 10 }}
      onPaginationChange={() => {}}
    />
  );

describe('ClientOrderDatatable - UI snapshot', () => {
  // Segmentación (D7 + tasks 3.2): una entrada por cabecera y por fila,
  // cada una muy por debajo de ~100 líneas.
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
