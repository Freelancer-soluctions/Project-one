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

// Este componente recibe `dataProviderOrders.data` como ARRAY de filas (no el
// wrapper {dataList,total} del resto) y no pasa pagination/totalRows al
// DataTable. Fechas sin Z = hora local (PPP idéntico en local y CI).
const FIXTURE_ROWS = [
  {
    id: 1,
    supplierId: 201,
    notes: 'Quarterly restock order',
    createdOn: '2026-01-05T10:00:00',
    updatedOn: '2026-01-06T10:00:00',
  },
  {
    id: 2,
    supplierId: 202,
    notes: 'Urgent replacement parts',
    createdOn: '2026-01-06T10:00:00',
    updatedOn: null,
  },
  {
    id: 3,
    supplierId: 201,
    notes: 'Scheduled monthly order',
    createdOn: '2026-01-07T10:00:00',
    updatedOn: '2026-01-08T10:00:00',
  },
];

const renderDatatable = () =>
  render(
    <ProviderOrdersDatatable
      dataProviderOrders={{ data: FIXTURE_ROWS }}
      onEditDialog={() => {}}
    />
  );

describe('ProviderOrdersDatatable - UI snapshot', () => {
  // Segmentación (D7 + tasks 3.4): una entrada por cabecera y por fila.
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
