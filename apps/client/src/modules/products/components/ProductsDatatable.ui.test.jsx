import { render } from '@testing-library/react';
import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import { ProductsDatatable } from './ProductsDatatable';

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

// createdOn/updatedOn llaman format(value, ...) directamente, así que deben
// ser objetos Date construidos en hora local (output idéntico en CI = UTC).
const FIXTURE_ROWS = [
  {
    id: 1,
    createdOn: new Date(2026, 0, 5, 10, 0, 0),
    sku: 'SKU-001',
    name: 'Widget Alpha',
    categoryDescription: 'Widgets',
    providerDescription: 'Acme Corp',
    price: 19.99,
    cost: 8.5,
    userProductCreatedName: 'Oliver Ops',
    userProductUpdatedName: 'Oliver Ops',
    updatedOn: new Date(2026, 0, 6, 14, 30, 0),
  },
  {
    id: 2,
    createdOn: new Date(2026, 0, 6, 9, 15, 0),
    sku: 'SKU-002',
    name: 'Widget Beta with an intentionally very long display name',
    categoryDescription: 'Widgets',
    providerDescription: 'Acme Corp',
    price: 24.5,
    cost: 11.25,
    userProductCreatedName: 'Ivy Inspector',
    userProductUpdatedName: null,
    updatedOn: null,
  },
  {
    id: 3,
    createdOn: new Date(2026, 0, 7, 16, 45, 0),
    sku: 'SKU-003',
    name: 'Gadget Gamma',
    categoryDescription: 'Gadgets',
    providerDescription: 'Globex Ltd',
    price: 42,
    cost: 19.75,
    userProductCreatedName: 'Oliver Ops',
    userProductUpdatedName: 'Ivy Inspector',
    updatedOn: new Date(2026, 0, 8, 11, 0, 0),
  },
];

const renderDatatable = () =>
  render(
    <ProductsDatatable
      dataProducts={{ dataList: FIXTURE_ROWS, total: FIXTURE_ROWS.length }}
      onOpenProductsForms={() => {}}
      pagination={{ pageIndex: 0, pageSize: 10 }}
      onPaginationChange={() => {}}
    />
  );

describe('ProductsDatatable - UI snapshot', () => {
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
